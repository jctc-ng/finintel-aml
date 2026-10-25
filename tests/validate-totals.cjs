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
  const restored=await page.evaluate(()=>{const snapshot=parseCaseFile(JSON.stringify(makeCaseSnapshot()));applyCaseSnapshot(snapshot);return {inKobo:Math.round(state.analysis.totalIn*100),outKobo:Math.round(state.analysis.totalOut*100),netKobo:Math.round(state.analysis.net*100)};});
  for(const key of ['inKobo','outKobo','netKobo'])assert.equal(restored[key],fixture.expected[key],fixture.id+': restored '+key);
  reports.push({statement:fixture.id,result:'PASS',expected:fixture.expected,observed});console.log(fixture.id+': PASS '+JSON.stringify({in:observed.inKobo/100,out:observed.outKobo/100,net:observed.netKobo/100}));
 }
 assert.equal(errors.length,0,errors.join('\n'));console.log(JSON.stringify({status:'PASS',statements:reports.length,network:'disabled',reports},null,2));
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exit(1);});
