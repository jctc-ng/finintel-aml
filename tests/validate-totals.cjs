'use strict';
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const XLSX=require('../docs/vendor/xlsx.full.min.js');
const fixtures=require('./fixtures/statement-totals.json'),root=path.resolve(__dirname,'../docs');
const reports=[];
const server=http.createServer((req,res)=>{let file=path.join(root,new URL(req.url,'http://localhost').pathname);if(file.endsWith('/'))file+='index.html';try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.jpg')?'image/jpeg':file.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
(async()=>{
 await new Promise(r=>server.listen(8767,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
 try{
 const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',d=>d.accept());
 await page.goto('http://127.0.0.1:8767/');await page.waitForFunction(()=>document.getElementById('offlineStatus').dataset.ready==='true');await context.setOffline(true);await page.reload();
 for(const fixture of fixtures.cases){
  await page.locator('#clearAllBtn').click();let buffer;
  if(fixture.type==='csv'){const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';buffer=Buffer.from(fixture.sheets[0].rows.map(row=>row.map(quote).join(',')).join('\n'));}
  else {const workbook=XLSX.utils.book_new();for(const sheet of fixture.sheets)XLSX.utils.book_append_sheet(workbook,XLSX.utils.aoa_to_sheet(sheet.rows),sheet.name);buffer=XLSX.write(workbook,{type:'buffer',bookType:'xlsx'});}
  await page.locator('#fileInput').setInputFiles({name:fixture.id+'.'+fixture.type,mimeType:fixture.type==='csv'?'text/csv':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from(buffer)});
  await page.waitForSelector('#step2:not([hidden])');await page.locator('#confirmMappingBtn').click();await page.locator('#subjectName').fill('Subject');await page.locator('#runAnalysisBtn').click();await page.waitForSelector('#step5:not([hidden])');
  const observed=await page.evaluate(()=>{const a=state.analysis;return {inKobo:Math.round(a.totalIn*100),outKobo:Math.round(a.totalOut*100),netKobo:Math.round(a.net*100),records:a.records.length,inCount:a.ins.length,outCount:a.outs.length,unknownCount:a.unknown.length,originKobo:Math.round(a.origins.reduce((n,x)=>n+x.total,0)*100),beneficiaryKobo:Math.round(a.benefits.reduce((n,x)=>n+x.total,0)*100),accounts:a.records.map(r=>r.account),unknownPartyInKobo:Math.round(a.origins.filter(x=>x.name.toLowerCase()==='unknown counterparty').reduce((n,x)=>n+x.total,0)*100),issues:a.dataQuality.issues.filter(x=>x.rows.length).map(x=>x.title)};});
  for(const key of ['inKobo','outKobo','netKobo','records','inCount','outCount','unknownCount'])assert.equal(observed[key],fixture.expected[key],fixture.id+': '+key);
  assert.equal(observed.originKobo,observed.inKobo,fixture.id+': originators reconcile');assert.equal(observed.beneficiaryKobo,observed.outKobo,fixture.id+': beneficiaries reconcile');assert(observed.accounts.every(a=>a.startsWith('0')),fixture.id+': leading zeros');
  if(fixture.expected.unknownPartyInKobo!==undefined)assert.equal(observed.unknownPartyInKobo,fixture.expected.unknownPartyInKobo);
  if(fixture.expected.requiresDuplicatesFlag)assert(observed.issues.some(x=>/duplicate/i.test(x)));
  if(fixture.expected.requiresConflictFlag)assert(observed.issues.some(x=>/debit.*credit/i.test(x)));
  const attachmentCheck=await page.evaluate(()=>{
   $('irAttachments').value='Appendix II – Significant transaction analysis generated from FinIntel.\nSupporting evidence schedule';
   const verify=()=>{const doc=new DOMParser().parseFromString(intelligenceReportBodyHtml(),'text/html');const headings=Array.from(doc.querySelectorAll('h2'));const appendix=headings.filter(h=>/^APPENDIX\s/.test(h.textContent)).map(h=>h.textContent);const attachment=headings.find(h=>h.textContent==='ATTACHMENT');return {appendix,listed:Array.from(attachment.nextElementSibling.children).map(li=>li.textContent)};};
   const first=verify();accountRows=Array.from({length:11},(_,i)=>({number:'00000000'+i,include:true}));$('accountsPlacement').value='auto';const second=verify();accountRows=[];verify();return {first,second};
  });
  for(const state of [attachmentCheck.first,attachmentCheck.second]){for(const heading of state.appendix)assert(state.listed.includes(heading),'Attachment missing '+heading);assert(state.listed.includes('Supporting evidence schedule'));assert(!state.listed.some(x=>x.includes('generated from FinIntel.')));}
  assert.equal(attachmentCheck.first.appendix.length,3);assert.equal(attachmentCheck.second.appendix.length,4);
  const appendix=await page.evaluate(()=>{const a=state.analysis,ins=irTopPartyTransactions(a,'originator'),outs=irTopPartyTransactions(a,'beneficiary');return {inRows:ins.length,outRows:outs.length,inAmount:Math.round(ins.reduce((n,r)=>n+r.amount,0)*100),outAmount:Math.round(outs.reduce((n,r)=>n+r.amount,0)*100),html:irAppendicesHtml(a)};});
  assert.equal(appendix.inRows,fixture.expected.inCount-(fixture.expected.unknownPartyInKobo?1:0));assert.equal(appendix.outRows,fixture.expected.outCount);
  assert.equal(appendix.inAmount,fixture.expected.inKobo-(fixture.expected.unknownPartyInKobo||0));assert.equal(appendix.outAmount,fixture.expected.outKobo);
  assert(appendix.html.includes('APPENDIX III')&&appendix.html.includes('APPENDIX IV'));
  for(const [button,count] of [['saveIrOriginatorCsvBtn',appendix.inRows],['saveIrBeneficiaryCsvBtn',appendix.outRows]]){const pending=page.waitForEvent('download');await page.locator('#'+button).click();const file=await pending;const text=fs.readFileSync(await file.path(),'utf8').replace(/^\ufeff/,'');const rows=await page.evaluate(text=>parseCSV(text),text);assert.equal(rows.length,count);}
  const restored=await page.evaluate(()=>{const snapshot=parseCaseFile(JSON.stringify(makeCaseSnapshot()));applyCaseSnapshot(snapshot);return {inKobo:Math.round(state.analysis.totalIn*100),outKobo:Math.round(state.analysis.totalOut*100),netKobo:Math.round(state.analysis.net*100)};});
  for(const key of ['inKobo','outKobo','netKobo'])assert.equal(restored[key],fixture.expected[key],fixture.id+': restored '+key);
  reports.push({statement:fixture.id,result:'PASS',expected:fixture.expected,observed});console.log(fixture.id+': PASS '+JSON.stringify({in:observed.inKobo/100,out:observed.outKobo/100,net:observed.netKobo/100}));
 }
 assert.equal(errors.length,0,errors.join('\n'));console.log(JSON.stringify({status:'PASS',statements:reports.length,network:'disabled',reports},null,2));
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exit(1);});
