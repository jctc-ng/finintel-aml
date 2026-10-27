'use strict';
/* Exchange workbook adapter. Source data stays in the local case, never in storage APIs. */
function exchangeText(v){const s=String(v??'').trim();return s==='-'?'':s;}
function exchangeOrder(v){return exchangeText(v).replace(/^'/,'');}
function exchangeSameQuantity(a,b){const x=cryptoDecimal(a),y=cryptoDecimal(b);return !!x&&!!y&&x.units*10n**BigInt(y.scale)===y.units*10n**BigInt(x.scale);}
function parseExchangeWorkbook(wb){
 const tables=wb.SheetNames.map(name=>{const grid=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,raw:false,defval:''});const header=grid.findIndex(r=>r.includes('Order no.')&&r.includes('Quantity'));return {name,grid,header};});
 const history=tables.find(t=>t.header>=0&&t.grid[t.header].includes('Transaction hash(txid)'));
 if(!history)return null;
 const objects=t=>t.grid.slice(t.header+1).map((row,i)=>({sourceRow:t.header+i+2,data:Object.fromEntries(t.grid[t.header].map((h,j)=>[h,exchangeText(row[j])]))})).filter(r=>Object.values(r.data).some(Boolean));
 const p2pTable=tables.find(t=>t.header>=0&&t.grid[t.header].includes('Buyer UID'));
 const p2p=p2pTable?objects(p2pTable).map(r=>({...r,sheet:p2pTable.name})):[];
 const bio={},logins=[];
 for(const t of tables.filter(t=>t.header<0)){
  const first=t.grid[0]||[];
  if(!t.grid.some(r=>exchangeText(r[0]).toLowerCase()==='full name'))continue;
  t.grid.forEach((r,i)=>{const key=exchangeText(r[0]).toLowerCase();if(key&&exchangeText(r[1]))bio[key]=exchangeText(r[1]);if(i&&r.slice(2).some(Boolean))logins.push({sheet:t.name,row:i+1,...Object.fromEntries(first.slice(2).map((h,j)=>[h,exchangeText(r[j+2])]))});});
 }
 const raw=objects(history),uid=bio.uid||raw[0]?.data.UID||'';
 const byOrder=new Map();for(const p of p2p){const k=exchangeOrder(p.data['Order no.']);if(!byOrder.has(k))byOrder.set(k,[]);byOrder.get(k).push(p);}
 const rows=raw.map(({sourceRow,data:d})=>{
  const type=d.Type.toLowerCase(),isP2P=d['Sub category'].toLowerCase()==='p2p',order=exchangeOrder(d['Order no.']);
  const candidates=byOrder.get(order)||[],linked=candidates.length===1&&candidates[0].data.Coin===d.Coin&&exchangeSameQuantity(candidates[0].data.Quantity,d.Quantity)&&[candidates[0].data['Buyer UID'],candidates[0].data['Seller UID']].includes(uid)?candidates[0]:null;
  const from=exchangeText(d['From address']),to=exchangeText(d['To address']);
  const otherUid=linked?(exchangeText(linked.data['Buyer UID'])===uid?linked.data['Seller UID']:exchangeText(linked.data['Seller UID'])===uid?linked.data['Buyer UID']:''):'';
  return {date:d['Timestamp UTC+8 (Completion)']||d['Timestamp UTC+8 (Submission)'],quantity:d.Quantity,asset:d.Coin,blockchain:isP2P?'Not applicable (P2P)':d.Network||'Not supplied',transaction_type:isP2P?'p2p':d.Type,transaction_status:d.Status,vasp_uid:d.UID,wallet:isP2P?'':type==='deposit'?to:from,counterparty_wallet:isP2P?'':type==='deposit'?from:to,txid:isP2P?'':d['Transaction hash(txid)'],narration:'Order '+order+'; '+d['Sub category'],__finintel_sheet:history.name,__finintel_sheet_direction:'',__finintel_exchange:{sourceRow,order,from,to,otherUid,linkedP2P:linked,p2pMatch:candidates.length?(linked?'Matched':'Review required'):'No P2P match',source:d}};
 });
 if(!rows.length)throw Error('The exchange history contains no transactions.');
 const matched=new Set(rows.filter(r=>r.__finintel_exchange.linkedP2P).map(r=>r.__finintel_exchange.linkedP2P.sourceRow));
 rows[0].__finintel_exchangeBundle={bio,logins,p2p,p2pUnmatched:p2p.filter(p=>!matched.has(p.sourceRow)),uid,timezone:'UTC+8 (transaction history); P2P timezone not specified'};
 return {rows,type:'Exchange workbook',sheets:[{name:history.name,rows:rows.length,directionHint:''}]};
}
const exchangeOriginalImport=importFile;
importFile=async function(file){
 if(/\.xlsx?$/i.test(file.name)&&window.XLSX){const wb=XLSX.read(await file.arrayBuffer(),{type:'array'}),parsed=parseExchangeWorkbook(wb);if(parsed)return parsed;}
 return exchangeOriginalImport(file);
};
const exchangeOriginalLoad=loadRows;
loadRows=function(rows,...args){
 if(rows[0]?.__finintel_exchangeBundle)$('datasetType').value='crypto';
 const result=exchangeOriginalLoad(rows,...args);
 if(rows[0]?.__finintel_exchangeBundle){
  state.sourceMapping=Object.fromEntries(state.columns.map(k=>[k,CORE_FIELDS.some(f=>f.id===k)?k:'']));refreshMappingUI();
  const b=rows[0].__finintel_exchangeBundle.bio;
  const fields={'irFullName':'full name','irNationality':'nationality','irMobile':'mobile number','irEmail':'email address'};
  for(const [id,key] of Object.entries(fields))if(b[key])$(id).value=b[key];
  if(b['full name']){$('subjectName').value=b['full name'];$('irSubject').value=b['full name'];}
  status('importStatus','Exchange workbook loaded. Review the crypto mapping. Bio and login data retained; P2P orders linked by order, asset and quantity.');
 }
 return result;
};
const exchangeOriginalAnalysis=cryptoAnalysis;
cryptoAnalysis=function(records,base){const a=exchangeOriginalAnalysis(records,base);a.exchangeBundle=state.rawRows[0]?.__finintel_exchangeBundle||null;return a;};
function exchangeRecord(r){return r.raw?.__finintel_exchange;}
function exchangeTable(headers,rows){return '<div class="table-wrap"><table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(v=>'<td style="overflow-wrap:anywhere;white-space:normal">'+esc(v??'')+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';}
function exchangeDetailRows(rows){return rows.map(r=>{const x=exchangeRecord(r);return [r.dateRaw,'UTC+8',r.cryptoType,r.values.transaction_status,r.asset,r.network,r.quantity,x?.from||'',x?.to||'',r.values.counterparty_wallet||'',x?.otherUid||'',r.values.txid||'',x?.order||'',x?.source['Withdrawal fee']||'',x?.source['Amount in USDT']||'',r.sheet,x?.sourceRow||r.row];});}
const exchangeHeaders=['Date as supplied','Time zone','Type','Status','Asset','Network','Quantity','From (source field)','To (source field)','Counterparty address','Counterparty UID','Transaction hash','Order reference','Fee (source units)','USDT valuation supplied','Source sheet','Source row'];
function exchangeCounterparties(a,type){
 const groups=new Map();for(const r of a.records.filter(r=>r.cryptoType===type)){const address=r.values.counterparty_wallet||'Not supplied',key=JSON.stringify([r.asset,r.network,address]);if(!groups.has(key))groups.set(key,{address,asset:r.asset,network:r.network,rows:[]});groups.get(key).rows.push(r);}
 return [...groups.values()].map(g=>[g.address,g.asset,g.network,g.rows.length,cryptoQuantitySum(g.rows)]);
}
function exchangeP2PRows(a){return a.exchangeBundle.p2p.map(p=>{const d=p.data;return [exchangeOrder(d['Order no.']),d['Order type'],d.Coin,d.Currency,d['Buyer UID'],d['Seller UID'],d.Quantity,d.Price,d.Fee,d['Timestamp (Payment)'],d['Timestamp (Disbursement)'],a.exchangeBundle.p2pUnmatched.some(x=>x.sourceRow===p.sourceRow)?'Review required':'Linked to history',p.sheet,p.sourceRow];});}
const exchangeP2PHeaders=['Order','Order type','Asset','Fiat currency','Buyer UID','Seller UID','Quantity','Price supplied','Fee supplied','Payment time (zone unspecified)','Disbursement time (zone unspecified)','Link status','Source sheet','Source row'];
function exchangeEvidenceHtml(a){
 if(!a.exchangeBundle)return '';
 const b=a.exchangeBundle;
 return '<h2>EXCHANGE ACCOUNT AND SOURCE CONTEXT</h2>'+exchangeTable(['Field','Value'],Object.entries(b.bio))+'<p>History timestamps are UTC+8. P2P timestamps have no explicit timezone. Source USDT valuations are retained as supplied, not converted to USD. ID Number remains an unspecified ID type. IP regions are not residential addresses. Address roles reflect exchange records and do not establish external wallet ownership.</p><h2>SENDING COUNTERPARTIES</h2>'+exchangeTable(['Sending address','Asset','Network','Transactions','Total quantity'],exchangeCounterparties(a,'deposit'))+'<h2>RECEIVING COUNTERPARTIES</h2>'+exchangeTable(['Receiving address','Asset','Network','Transactions','Total quantity'],exchangeCounterparties(a,'withdrawal'));
}
const exchangeOriginalRows=cryptoRowsHtml;
cryptoRowsHtml=function(rows){return rows.some(exchangeRecord)?exchangeTable(exchangeHeaders,exchangeDetailRows(rows)):exchangeOriginalRows(rows);};
const exchangeOriginalAppendices=cryptoAppendicesHtml;
cryptoAppendicesHtml=function(a){let html=exchangeOriginalAppendices(a);if(!a.exchangeBundle)return html;html+='<div class="ir-page-break"><h2>APPENDIX V – P2P ORDER HISTORY</h2>'+exchangeTable(exchangeP2PHeaders,exchangeP2PRows(a))+'</div><div class="ir-page-break"><h2>APPENDIX VI – LOGIN AND DEVICE RECORDS</h2>'+exchangeTable(['Source sheet','Source row','IP','Region','Device','Last login (+8 UTC)','Device ID'],a.exchangeBundle.logins.map(r=>[r.sheet,r.row,r.ip_address,r.region,r.Device,r['last_login_date(+8 UTC)'],r.device_id]))+'</div>';return html;};
const exchangeOriginalReport=cryptoReportBody;
cryptoReportBody=function(a,logo){return exchangeOriginalReport(a,logo).replace('<h2>CRYPTOCURRENCY / VASP RECORD ANALYSIS</h2>',exchangeEvidenceHtml(a)+'<h2>CRYPTOCURRENCY / VASP RECORD ANALYSIS</h2>');};
const exchangeOriginalFindings=cryptoFindings;
cryptoFindings=function(a){const lines=exchangeOriginalFindings(a);if(a.exchangeBundle){lines.push('Exchange UID '+a.exchangeBundle.uid+'. '+a.exchangeBundle.p2p.length+' P2P order(s) retained separately; '+(a.exchangeBundle.p2p.length-a.exchangeBundle.p2pUnmatched.length)+' linked to history by order, asset and quantity and not added again to blockchain totals.');lines.push('Successful blockchain sender/recipient summaries retain full addresses and networks. Non-final records remain in the detailed history. Transaction hashes and order references are separate identifiers.');}return lines;};
function exchangeDownload(name,headers,rows){download('FinIntel_'+name+'.csv','\ufeff'+[headers,...rows].map(r=>r.map(csvEscape).join(',')).join('\n'),'text/csv;charset=utf-8');}
const exchangeOriginalExport=exportCryptoCsv;
exportCryptoCsv=function(a,type){if(!a.exchangeBundle)return exchangeOriginalExport(a,type);exchangeDownload('Crypto_'+(type||'All_records'),exchangeHeaders,exchangeDetailRows(type?a.records.filter(r=>r.cryptoType===type):a.records));};
const exchangeOriginalRender=renderAnalysis;
renderAnalysis=function(a){exchangeOriginalRender(a);let panel=$('exchangeWorkbookReview');if(!panel){panel=document.createElement('section');panel.id='exchangeWorkbookReview';panel.className='card pad results-grid';$('intelligenceReportBuilder').before(panel);}panel.hidden=!a.exchangeBundle;if(!a.exchangeBundle)return;
 panel.innerHTML='<h3>Exchange workbook review</h3><p>Review address roles, transaction hashes and linked P2P orders. Blockchain totals exclude P2P and non-final records. Save Case retains the workbook data locally in your downloaded case file.</p><div class="button-row" id="exchangeDownloads"></div>'+exchangeEvidenceHtml(a)+'<details><summary>Individual transactions and hashes</summary>'+cryptoRowsHtml(a.records)+'</details><details><summary>P2P orders</summary>'+exchangeTable(exchangeP2PHeaders,exchangeP2PRows(a))+'</details>';
 for(const [label,type] of [['Sender transactions','deposit'],['Recipient transactions','withdrawal'],['All transactions',''],['P2P orders','p2p'],['Login records','logins']]){const btn=document.createElement('button');btn.type='button';btn.className='btn secondary';btn.textContent='Download '+label+' CSV';btn.onclick=()=>{if(type==='p2p')exchangeDownload('P2P',exchangeP2PHeaders,exchangeP2PRows(a));else if(type==='logins'){const rows=a.exchangeBundle.logins,keys=[...new Set(rows.flatMap(Object.keys))];exchangeDownload('Logins',keys,rows.map(r=>keys.map(k=>r[k])));}else exportCryptoCsv(a,type);};$('exchangeDownloads').append(btn);}
};
