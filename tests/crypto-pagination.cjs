const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert');const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const XLSX=require('../docs/vendor/xlsx.full.min.js');
const root=path.resolve(__dirname,'../docs');const work=fs.mkdtempSync(path.join(require('os').tmpdir(),'finintel-offline-'));
const server=http.createServer((req,res)=>{const p=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));let f=p.endsWith('/')?p+'index.html':p;try{res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.png')?'image/png':f.endsWith('.jpg')?'image/jpeg':f.endsWith('.webmanifest')?'application/manifest+json':'text/html');res.end(fs.readFileSync(f));}catch{res.statusCode=404;res.end('missing');}});
(async()=>{await new Promise(r=>server.listen(8766,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});const context=await browser.newContext({acceptDownloads:true,viewport:{width:1440,height:1000}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>document.querySelector('#offlineStatus').dataset.ready==='true',{timeout:20000});console.log('Online initialization and complete precache passed');
await context.setOffline(true);await page.reload();await page.waitForFunction(()=>typeof XLSX!=='undefined'&&document.querySelector('#offlineStatus').dataset.ready==='true');assert((await page.locator('#offlineStatus').innerText()).includes('Offline'));console.log('Network-disabled restart and local Excel reader passed');

const wb=XLSX.utils.book_new();
const head=['Order no.','UID','Transaction hash(txid)','Coin','Network','Quantity','Amount in USDT','Withdrawal fee','Withdrawal fee in USDT','Type','Sub category','From address','To address','IP address','Status','Timestamp UTC+8 (Submission)','Timestamp UTC+8 (Completion)'];
const data=[['a','123','hash-a','USDT','SOL','1.12345678','','0','','Deposit','chain','sender','subject','','Successful','2025-01-01 01:00:00','2025-01-01 01:01:00'],['b','123','hash-b','USDT','SOL','0.1','','0','','withdrawal','chain','subject','recipient','','Successful','2025-01-02 01:00:00','2025-01-02 01:01:00'],['c','123','-','USDT','-','0.2','','0','','withdrawal','p2p','456','-','','Successful','2025-01-03 01:00:00','2025-01-03 01:01:00'],['d','123','hash-d','USDT','SOL','9','','0','','Deposit','chain','sender','subject','','Risk_failed','2025-01-04 01:00:00','2025-01-04 01:01:00']];
XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['History'],head,...data]),'History');
XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['P2P'],['Order no.','Buyer UID','Seller UID','Quantity','Coin','Currency','Order type','Price'],['c','456','123','0.2','USDT','NGN','sell','1500']]),'P2P');
XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['UID','123','ip_address','Device'],['Full Name','Synthetic Subject','192.0.2.1','Test device'],['Nationality','Nigeria']]),'Bio');
await page.locator('#fileInput').setInputFiles({name:'synthetic-exchange.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from(XLSX.write(wb,{type:'buffer',bookType:'xlsx'}))});
await page.waitForSelector('.crypto-import-dialog');
await page.locator('[data-field="asset"]').selectOption('-1');await page.locator('#ciContinue').click();assert((await page.locator('#ciStatus').innerText()).includes('Asset / coin'));
await page.locator('[data-field="asset"]').selectOption('3');
await page.locator('#ciName').fill('Synthetic exchange mapping');await page.locator('#ciSave').click();
assert(!(await page.evaluate(()=>localStorage.getItem('finintel.cryptoImportTemplates'))).includes('Synthetic Subject'));
await page.locator('#ciContinue').click();await page.waitForSelector('#step2:not([hidden])');
assert.equal(await page.locator('#datasetType').inputValue(),'crypto');
assert.equal(await page.evaluate(()=>state.rawRows.length),4);
await page.locator('#confirmMappingBtn').click();await page.locator('#runAnalysisBtn').click();await page.waitForSelector('#step5:not([hidden])');
const counts=await page.evaluate(()=>Object.fromEntries(['deposit','withdrawal','p2p','non-final'].map(t=>[t,state.analysis.records.filter(r=>r.cryptoType===t).length])));
assert.deepEqual(counts,{deposit:1,withdrawal:1,p2p:1,'non-final':1});
assert.equal(await page.evaluate(()=>state.analysis.exchangeBundle.p2pUnmatched.length),0);
assert(await page.locator('#irFullName').inputValue());
assert(await page.locator('#exchangeWorkbookReview').isVisible());
assert(await page.locator('#cryptoRelationshipPanel').isVisible());
const generic=await page.evaluate(()=>{
 const c=cryptoSheetConfig('Custom', [['When','Token','Units','Sender','Recipient','Hash'],['2026-01-01','ETH','0.123456789012345678','source','target','hash-full']]);c.role='deposit';c.header=0;c.mapping={date:0,asset:1,quantity:2,from:3,to:4,txid:5};c.timezone='UTC';const r=cryptoImportBuild([c],'');
 const p=cryptoSheetConfig('P2P',[['Ref','Token','Units','Buyer','Seller','Fiat'],['ref','USDT','2','subject','other','NGN']]);p.role='p2p';p.header=0;p.mapping={order:0,asset:1,quantity:2,buyer:3,seller:4,fiat:5};const standalone=cryptoImportBuild([p],'subject');return {quantity:r.rows[0].quantity,wallet:r.rows[0].wallet,counterparty:r.rows[0].counterparty_wallet,hash:r.rows[0].txid,zone:r.rows[0].__finintel_exchange.timezone,p2p:standalone.rows[0].__finintel_exchange.otherUid};
});assert.deepEqual(generic,{quantity:'0.123456789012345678',wallet:'target',counterparty:'source',hash:'hash-full',zone:'UTC',p2p:'other'});

const paging=await page.evaluate(()=>{const a=state.analysis,r=a.records.find(r=>r.cryptoType==='deposit'),copy={...a,records:Array.from({length:9},(_,i)=>({...r,values:{...r.values,counterparty_wallet:'address-'+i}}))};const g=cryptoLinkGroups(copy,'chain')[0];return [cryptoLinkModel(copy,'chain',g.key,0).pages,cryptoLinkModel(copy,'chain',g.key,1).left.length];});assert.deepEqual(paging,[2,1]);

assert.equal(await page.locator('#cryptoLinkNodes button').count(),2);
await page.locator('#cryptoLinkNodes button').first().click();assert((await page.locator('#cryptoLinkDetails').innerText()).includes('hash-a'));
await page.locator('#cryptoLinkMode').selectOption('p2p');assert((await page.locator('#cryptoLinkNodes').innerText()).includes('456'));
await page.locator('#cryptoLinkMode').selectOption('chain');
const pngDownload=page.waitForEvent('download');await page.locator('#cryptoLinkPng').click();assert((await pngDownload).suggestedFilename().endsWith('.png'));
await page.locator('#generateIrDraftBtn').click();
const html=await page.locator('#irReportPreview').innerHTML();assert(html.includes('COUNTERPARTY RELATIONSHIP VIEW'));assert(html.includes('data:image/png'));assert(html.includes('APPENDIX VI'));assert(html.includes('Transaction hash'));assert(html.includes('SENDING COUNTERPARTIES'));assert(html.includes('RECEIVING COUNTERPARTIES'));

await page.evaluate(()=>{const a=state.analysis,dep=a.records.find(r=>r.cryptoType==='deposit'),out=a.records.find(r=>r.cryptoType==='withdrawal');const records=Array.from({length:65},(_,i)=>{const r=i<36?dep:out;return {...r,row:i+3,quantity:String(i+1),values:{...r.values,txid:'hash-'+i,counterparty_wallet:'address-'+i},raw:{...r.raw,__finintel_exchange:{...r.raw.__finintel_exchange,sourceRow:i+3}}};});const p=a.exchangeBundle.p2p[0];renderAnalysis({...a,records,exchangeBundle:{...a.exchangeBundle,p2p:Array.from({length:31},(_,i)=>({...p,sourceRow:i+3,data:{...p.data,'Order no.':'order-'+i}}))}});});
await page.locator('#exchangeWorkbookReview details').filter({has:page.locator('summary', {hasText:'Individual transactions and hashes'})}).locator('summary').click();
await page.locator('#exchangeWorkbookReview details').filter({has:page.locator('summary', {hasText:'P2P orders'})}).locator('summary').click();
assert.equal(await page.locator('#cryptoTransactionsPage tbody tr').count(),25);
assert.equal(await page.locator('#cryptoSendingPage tbody tr').count(),10);
assert.equal(await page.locator('#cryptoReceivingPage tbody tr').count(),10);
assert.equal(await page.locator('#cryptoP2PPage tbody tr').count(),25);
await page.locator('#cryptoTransactionsPage [data-move="next"]').click();assert((await page.locator('#cryptoTransactionsPage .crypto-page-count').innerText()).includes('26–50 of 65'));
await page.locator('#cryptoSendingPage [data-move="next"]').click();assert((await page.locator('#cryptoTransactionsPage .crypto-page-number').innerText()).includes('Page 2'));
await page.locator('#cryptoP2PPage [data-move="next"]').click();assert.equal(await page.locator('#cryptoP2PPage tbody tr').count(),6);
await page.locator('#cryptoTransactionsPage input').fill('hash-6');assert.equal(await page.locator('#cryptoTransactionsPage tbody tr').count(),6);
const matchingDownload=page.waitForEvent('download');await page.locator('#cryptoTransactionsPage .crypto-page-export').click();const matchingFile=await matchingDownload;const matchingCsv=fs.readFileSync(await matchingFile.path(),'utf8');assert.equal(matchingCsv.trim().split('\n').length,7);assert(matchingCsv.includes('hash-64'));
await page.locator('#cryptoTransactionsPage input').fill('not-present');assert((await page.locator('#cryptoTransactionsPage .crypto-page-count').innerText()).includes('0–0 of 0'));assert(await page.locator('#cryptoTransactionsPage .crypto-page-export').isDisabled());
await page.locator('#cryptoTransactionsPage input').fill('');await page.locator('#cryptoTransactionsPage select').selectOption('50');assert.equal(await page.locator('#cryptoTransactionsPage tbody tr').count(),50);
await page.locator('#cryptoTransactionsPage th').nth(6).locator('button').click();await page.locator('#cryptoTransactionsPage th').nth(6).locator('button').click();assert.equal(await page.locator('#cryptoTransactionsPage tbody tr').first().locator('td').nth(6).innerText(),'65');
assert(await page.evaluate(()=>cryptoReportBody(state.analysis).includes('hash-64')));assert.equal(await page.evaluate(()=>state.analysis.records.length),65);
console.log('PASS four independent pagers: search, exact numeric sort, sizes, boundaries, matching export and full report');
const before=await page.evaluate(()=>JSON.stringify(state.analysis.exchangeBundle));
await page.evaluate(()=>applyCaseSnapshot(parseCaseFile(JSON.stringify(makeCaseSnapshot()))));

let pending=page.waitForEvent('download');await page.locator('#saveIrWordBtn').click();await (await pending).saveAs(path.join(work,'exchange.docx'));
assert.equal(errors.length,0,errors.join('\n'));console.log('PASS synthetic exchange workbook: linked P2P, status separation; profile, hashes, appendices, case restore, DOCX',work);
await browser.close();server.close();})().catch(error=>{console.error(error);server.close();process.exit(1);});
