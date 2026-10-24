'use strict';

const $=id=>document.getElementById(id);
const $$=s=>Array.from(document.querySelectorAll(s));
const state={rawRows:[],columns:[],sourceName:'',sourceType:'',mapping:{},standardized:[],analysis:null};

const SAMPLE_CSV='Date,Amount,Direction,Originator,Beneficiary,Narration,Account\n'
+'2026-01-02 09:10,9800000,Credit,John Musa,Subject Account,Transfer,0011223344\n'
+'2026-01-02 10:20,9700000,Credit,Amina Bello,Subject Account,Transfer,0011223344\n'
+'2026-01-02 11:15,9900000,Credit,ABC Trading Ltd,Subject Account,Transfer,0011223344\n'
+'2026-01-02 13:30,28500000,Debit,Subject Account,Prime Logistics Ltd,Vendor payment,0011223344\n'
+'2026-01-05 08:40,15000000,Credit,Northline Ventures,Subject Account,Transfer,0011223344\n'
+'2026-01-05 09:05,14800000,Debit,Subject Account,Crypto Exchange NG,VASP funding,0011223344\n'
+'2026-01-07 14:00,2500000,Credit,Chidi Okafor,Subject Account,Transfer,0011223344\n'
+'2026-01-07 14:15,2450000,Debit,Subject Account,Beneficiary Z,Transfer,0011223344\n'
+'2026-01-09 09:00,9950000,Credit,Delta Services,Subject Account,Transfer,0011223344\n'
+'2026-01-09 12:05,9850000,Credit,Omega Global,Subject Account,Transfer,0011223344\n'
+'2026-01-09 15:10,19000000,Debit,Subject Account,Prime Logistics Ltd,Transfer,0011223344\n'
+'2026-01-12 10:00,500000,Credit,Musa Ibrahim,Subject Account,Personal transfer,0011223344\n'
+'2026-01-13 10:00,700000,Credit,Hauwa Aliyu,Subject Account,Personal transfer,0011223344\n'
+'2026-01-14 11:00,1000000,Debit,Subject Account,John Musa,Refund,0011223344\n'
+'2026-01-18 08:00,40000000,Credit,Emerald Projects Ltd,Subject Account,Contract payment,0011223344\n'
+'2026-01-18 08:35,39500000,Debit,Subject Account,Prime Logistics Ltd,Transfer,0011223344\n'
+'2026-01-21 09:20,3000000,Credit,Blue Rock Ltd,Subject Account,Transfer,0011223344\n'
+'2026-01-21 10:10,2900000,Debit,Subject Account,Crypto Exchange NG,VASP funding,0011223344\n'
+'2026-01-25 12:00,9750000,Credit,Sunrise Retail,Subject Account,Transfer,0011223344\n'
+'2026-01-25 13:00,9700000,Credit,Greenway Stores,Subject Account,Transfer,0011223344\n'
+'2026-01-25 15:30,19000000,Debit,Subject Account,Prime Logistics Ltd,Transfer,0011223344';

const MAP_FIELDS=[
['date','Transaction date/time',true,'Date, timestamp, value date'],
['amount','Amount',false,'Use when the file has one amount column'],
['direction','Direction',false,'Credit/debit, inflow/outflow, CR/DR'],
['debit','Debit amount',false,'Use when debit and credit are separate columns'],
['credit','Credit amount',false,'Use when debit and credit are separate columns'],
['originator','Originator / Sender',false,'Source, payer, sender, originator'],
['beneficiary','Beneficiary / Receiver',false,'Recipient, payee, beneficiary'],
['narration','Narration / Description',false,'Description, memo, remarks'],
['account','Account / Wallet identifier',false,'Account number, wallet, UID'],
['txid','Transaction ID / Hash',false,'Transaction reference, hash, ID']
];

const autoPatterns={
date:[/^date$/i,/transaction.*date/i,/value.*date/i,/timestamp/i,/time/i],
amount:[/^amount$/i,/transaction.*amount/i,/value/i,/amt/i],
direction:[/direction/i,/dr.?cr/i,/debit.?credit/i,/type/i],
debit:[/^debit$/i,/debit.*amount/i,/withdrawal/i,/money.*out/i],
credit:[/^credit$/i,/credit.*amount/i,/deposit/i,/money.*in/i],
originator:[/originator/i,/sender/i,/source/i,/payer/i,/from.*name/i],
beneficiary:[/beneficiary/i,/receiver/i,/recipient/i,/payee/i,/to.*name/i],
narration:[/narration/i,/description/i,/remarks/i,/memo/i,/details/i],
account:[/account/i,/wallet/i,/uid/i,/customer.*id/i],
txid:[/transaction.*id/i,/reference/i,/tx.*hash/i,/hash/i,/txn/i]
};

function esc(v){return String(v==null?'':v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function norm(v){return String(v==null?'':v).trim().toLowerCase().replace(/\s+/g,' ');}
function status(id,text,err){const e=$(id);if(!e)return;e.textContent=text||'';e.classList.toggle('error',!!err);}
function setStep(n){$$('.stage').forEach(s=>{s.hidden=true;s.classList.remove('active');});const t=$('step'+n);t.hidden=false;t.classList.add('active');$$('.step').forEach(b=>b.classList.toggle('active',Number(b.dataset.step)===n));window.scrollTo({top:Math.max(0,t.offsetTop-110),behavior:'smooth'});}

function parseCSV(text){
  const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i],next=text[i+1];
    if(ch==='"'&&quoted&&next==='"'){field+='"';i++;continue;}
    if(ch==='"'){quoted=!quoted;continue;}
    if(ch===','&&!quoted){row.push(field);field='';continue;}
    if((ch==='\n'||ch==='\r')&&!quoted){
      if(ch==='\r'&&next==='\n')i++;
      row.push(field);field='';
      if(row.some(v=>String(v).trim()!==''))rows.push(row);
      row=[];continue;
    }
    field+=ch;
  }
  row.push(field);if(row.some(v=>String(v).trim()!==''))rows.push(row);
  if(!rows.length)return[];
  const h=rows[0].map((x,i)=>String(x||'').trim()||('Column '+(i+1)));
  return rows.slice(1).map(r=>Object.fromEntries(h.map((x,i)=>[x,r[i]||''])));
}

async function importFile(file){
  const ext=(file.name.split('.').pop()||'').toLowerCase();
  if(ext==='csv')return{rows:parseCSV(await file.text()),type:'CSV'};
  if(ext==='xlsx'||ext==='xls'){
    if(!window.XLSX)throw new Error('Excel parser unavailable. Check internet access or convert the file to CSV.');
    const wb=XLSX.read(await file.arrayBuffer(),{type:'array'}),name=wb.SheetNames[0];
    return{rows:XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:'',raw:false}),type:'Excel ('+name+')'};
  }
  throw new Error('Unsupported file type. Use CSV, XLSX or XLS.');
}

function loadRows(rows,name,type){
  if(!rows.length)throw new Error('No transaction rows were found.');
  state.rawRows=rows;state.columns=Array.from(new Set(rows.flatMap(r=>Object.keys(r))));state.sourceName=name;state.sourceType=type;
  $('datasetEmpty').hidden=true;$('datasetInfo').hidden=false;
  $('rowCount').textContent=rows.length.toLocaleString();$('columnCount').textContent=state.columns.length.toLocaleString();$('fileType').textContent=type;
  $('columnTags').innerHTML=state.columns.map(c=>'<span>'+esc(c)+'</span>').join('');
  status('importStatus',name+': '+rows.length.toLocaleString()+' rows loaded locally.');
  buildMapping();setStep(2);
}

function guess(field){for(const p of (autoPatterns[field]||[])){const f=state.columns.find(c=>p.test(c));if(f)return f;}return'';}
function buildMapping(){
  const g=$('mappingGrid');g.innerHTML='';
  MAP_FIELDS.forEach(([key,label,req,hint])=>{
    const d=document.createElement('div');d.className='map-item';const x=guess(key);
    d.innerHTML='<label for="map-'+key+'">'+esc(label)+(req?' *':'')+'</label><select id="map-'+key+'"><option value="">— Not mapped —</option>'
      +state.columns.map(c=>'<option value="'+esc(c)+'" '+(c===x?'selected':'')+'>'+esc(c)+'</option>').join('')
      +'</select><small>'+esc(hint)+'</small>';g.appendChild(d);
  });
}
function readMapping(){const m={};MAP_FIELDS.forEach(([k])=>m[k]=$('map-'+k)?.value||'');return m;}
function validateMapping(m){
  if(!m.date)return'Map the transaction date/time column.';
  if((m.amount&&m.direction)||m.debit||m.credit||(m.amount&&m.originator&&m.beneficiary))return'';
  return'Map either Amount + Direction, Debit/Credit, or Amount + Originator + Beneficiary.';
}
function parseAmount(v){
  if(typeof v==='number')return Number.isFinite(v)?Math.abs(v):0;
  let s=String(v==null?'':v).trim();if(!s)return 0;const neg=/^\(.*\)$/.test(s)||/^-/.test(s);
  s=s.replace(/[(),]/g,'').replace(/[^0-9.\-]/g,'');const n=Number(s);return Number.isFinite(n)?Math.abs(neg?-n:n):0;
}
function parseDate(v){
  if(v instanceof Date&&!isNaN(v))return v;const s=String(v==null?'':v).trim();if(!s)return null;
  const dm=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if(dm){let y=Number(dm[3]);if(y<100)y+=2000;const d=new Date(y,Number(dm[2])-1,Number(dm[1]),Number(dm[4]||0),Number(dm[5]||0),Number(dm[6]||0));return isNaN(d)?null:d;}
  const d=new Date(s);return isNaN(d)?null:d;
}
function direction(raw,o,b,subject,debit,credit){
  if(credit>0&&debit<=0)return'inflow';if(debit>0&&credit<=0)return'outflow';
  const d=norm(raw).replace(/[^a-z]/g,'');if(/^(credit|cr|inflow|deposit|incoming)$/.test(d))return'inflow';if(/^(debit|dr|outflow|withdrawal|outgoing)$/.test(d))return'outflow';
  const s=norm(subject);if(s){if(norm(b).includes(s)&&!norm(o).includes(s))return'inflow';if(norm(o).includes(s)&&!norm(b).includes(s))return'outflow';}
  return'unknown';
}
function standardize(){
  const m=state.mapping,subject=$('subjectName').value.trim();
  return state.rawRows.map((r,i)=>{
    const debit=m.debit?parseAmount(r[m.debit]):0,credit=m.credit?parseAmount(r[m.credit]):0;
    const amount=m.amount?parseAmount(r[m.amount]):Math.max(debit,credit);
    const o=m.originator?String(r[m.originator]??'').trim():'',b=m.beneficiary?String(r[m.beneficiary]??'').trim():'';
    return{row:i+2,date:parseDate(r[m.date]),dateRaw:String(r[m.date]??''),amount,direction:direction(m.direction?r[m.direction]:'',o,b,subject,debit,credit),originator:o,beneficiary:b,narration:m.narration?String(r[m.narration]??'').trim():'',account:m.account?String(r[m.account]??'').trim():'',txid:m.txid?String(r[m.txid]??'').trim():''};
  }).filter(t=>t.amount>0||t.originator||t.beneficiary||t.narration);
}
const sum=(a,f=x=>x)=>a.reduce((n,x)=>n+(Number(f(x))||0),0);
function group(txs,dir){
  const m=new Map();
  txs.filter(t=>t.direction===dir).forEach(t=>{const name=(dir==='inflow'?t.originator:t.beneficiary)||'Unknown counterparty',k=norm(name)||'unknown';if(!m.has(k))m.set(k,{name,count:0,total:0});const x=m.get(k);x.count++;x.total+=t.amount;});
  return Array.from(m.values()).sort((a,b)=>b.total-a.total);
}
function rapidMoves(txs,hours,ratio){
  const ins=txs.filter(t=>t.direction==='inflow'&&t.date),outs=txs.filter(t=>t.direction==='outflow'&&t.date),hits=[],ms=hours*3600000;
  outs.forEach(out=>{const recent=ins.filter(i=>{const d=out.date-i.date;return d>=0&&d<=ms;});const incoming=sum(recent,x=>x.amount);if(incoming&&out.amount/incoming*100>=ratio)hits.push({out,recent,incoming,ratio:out.amount/incoming*100,minutes:(out.date-(recent[0]?.date||out.date))/60000});});
  return hits;
}
function structuring(txs,ref,band,min){
  if(!ref)return[];const low=ref*(1-band/100),c=txs.filter(t=>t.amount>=low&&t.amount<=ref&&t.date).sort((a,b)=>a.date-b.date),groups=[];
  for(let i=0;i<c.length;i++){const g=[c[i]];for(let j=i+1;j<c.length;j++){if((c[j].date-c[i].date)/86400000>7)break;g.push(c[j]);}if(g.length>=min){groups.push(g);i+=g.length-1;}}
  return groups;
}
function fmt(n,c){
  try{return new Intl.NumberFormat('en-NG',{style:'currency',currency:c||'NGN',maximumFractionDigits:2}).format(Number(n)||0);}
  catch{return(c||'')+' '+(Number(n)||0).toLocaleString();}
}
function fmtDate(d){return d?new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(d):'Unknown';}

function analyze(txs){
  const currency=($('currencyCode').value.trim()||'NGN').toUpperCase(),ins=txs.filter(t=>t.direction==='inflow'),outs=txs.filter(t=>t.direction==='outflow'),unknown=txs.filter(t=>t.direction==='unknown');
  const totalIn=sum(ins,x=>x.amount),totalOut=sum(outs,x=>x.amount),origins=group(txs,'inflow'),benefits=group(txs,'outflow'),dated=txs.filter(t=>t.date).sort((a,b)=>a.date-b.date);
  const rapid=rapidMoves(dated,Number($('rapidHours').value)||24,Number($('rapidRatio').value)||80);
  const structured=structuring(txs,Number($('structuringReference').value)||0,Number($('structuringBand').value)||10,Number($('structuringCount').value)||3);
  const passRatio=totalIn?totalOut/totalIn*100:0,top5=sum(benefits.slice(0,5),x=>x.total),concentration=totalOut?top5/totalOut*100:0;
  const originMap=new Map(origins.map(x=>[norm(x.name),x]));const both=benefits.filter(x=>originMap.has(norm(x.name))&&norm(x.name)!=='unknown counterparty').map(x=>({name:x.name,out:x.total,in:originMap.get(norm(x.name)).total}));
  const cryptoRx=/\b(crypto|bitcoin|btc|ethereum|eth|usdt|usdc|binance|bybit|kucoin|okx|coinbase|wallet|vasp|virtual asset)\b/i;
  const cryptoTx=txs.filter(t=>cryptoRx.test(t.originator+' '+t.beneficiary+' '+t.narration)),cryptoExposure=sum(cryptoTx,x=>x.amount),alerts=[];
  const add=(title,severity,score,detail,evidence)=>alerts.push({title,severity,score,detail,evidence});
  if(passRatio>=90&&totalIn)add('High pass-through activity','high',18,passRatio.toFixed(1)+'% of inflow was matched by total outflow.','Inflow '+fmt(totalIn,currency)+'; outflow '+fmt(totalOut,currency)+'.');
  else if(passRatio>=75&&totalIn)add('Elevated pass-through activity','medium',10,passRatio.toFixed(1)+'% of inflow was matched by outflow.','Review transaction purpose and retention pattern.');
  if(rapid.length>=3)add('Repeated rapid movement of funds','high',22,rapid.length+' qualifying onward-movement episodes were detected.','Largest qualifying outflow '+fmt(Math.max(...rapid.map(x=>x.out.amount)),currency)+'.');
  else if(rapid.length)add('Rapid movement of funds','medium',12,rapid.length+' qualifying onward-movement episode(s) were detected.','Fastest observed interval '+Math.round(Math.min(...rapid.map(x=>x.minutes)))+' minutes.');
  const structuredCount=sum(structured,g=>g.length);
  if(structuredCount>=Number($('structuringCount').value||3))add('Repeated transactions near analyst-set reference amount','medium',14,structuredCount+' transaction(s) fell within the configured band in repeated 7-day windows.','Analytical parameter only; not a legal threshold.');
  if(concentration>=70&&benefits.length>1)add('High beneficiary concentration','high',16,'Top five beneficiaries received '+concentration.toFixed(1)+'% of total outflow.','Top beneficiary: '+(benefits[0]?.name||'N/A')+'.');
  else if(concentration>=50&&benefits.length>1)add('Beneficiary concentration','medium',9,'Top five beneficiaries received '+concentration.toFixed(1)+'% of total outflow.','Review concentration rationale.');
  if(origins.length>=10)add('Multiple third-party originators','medium',10,origins.length+' distinct originators funded the subject.','Top five originators account for '+(totalIn?(sum(origins.slice(0,5),x=>x.total)/totalIn*100).toFixed(1):'0')+'% of inflow.');
  if(both.length)add('Counterparties on both sides of flow','medium',8,both.length+' counterparty name(s) appeared as both originator and beneficiary.','Examples: '+both.slice(0,3).map(x=>x.name).join(', ')+'.');
  if(cryptoExposure)add('Crypto / VASP-related exposure detected','medium',10,cryptoTx.length+' transaction(s) contained crypto/VASP textual indicators.','Observed value '+fmt(cryptoExposure,currency)+'. Text-based screening only.');
  if(unknown.length)add('Unresolved transaction direction','low',3,unknown.length+' transaction(s) could not be classified as inflow or outflow.','Review column mapping and subject identifier.');
  const riskScore=Math.min(100,sum(alerts,x=>x.score)),risk=riskScore>=60?'critical':riskScore>=40?'high':riskScore>=18?'medium':'low';
  return{currency,txs,ins,outs,unknown,totalIn,totalOut,net:totalIn-totalOut,origins,benefits,rapid,structured,passRatio,concentration,both,cryptoTx,cryptoExposure,alerts,riskScore,risk,first:dated[0]?.date||null,last:dated[dated.length-1]?.date||null};
}

function renderMetrics(a){
  const m=[['Transactions',a.txs.length.toLocaleString()],['Total Inflow',fmt(a.totalIn,a.currency)],['Total Outflow',fmt(a.totalOut,a.currency)],['Net Flow',fmt(a.net,a.currency)],['Originators',a.origins.length.toLocaleString()],['Beneficiaries',a.benefits.length.toLocaleString()],['Rapid-Movement Matches',a.rapid.length.toLocaleString()],['Crypto/VASP Exposure',fmt(a.cryptoExposure,a.currency)]];
  $('metricCards').innerHTML=m.map(x=>'<article class="card metric"><div class="value">'+esc(x[1])+'</div><div class="label">'+esc(x[0])+'</div></article>').join('');
}
function renderCounterparty(id,rows,total,currency){
  const max=rows[0]?.total||1;
  $(''+id).innerHTML='<table><thead><tr><th>#</th><th>Counterparty</th><th class="num">Count</th><th class="num">Total</th><th class="num">Share</th></tr></thead><tbody>'
    +(rows.slice(0,15).map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.name)+'<div class="bar"><span style="width:'+Math.min(100,r.total/max*100)+'%"></span></div></td><td class="num">'+r.count+'</td><td class="num">'+esc(fmt(r.total,currency))+'</td><td class="num">'+(total?(r.total/total*100).toFixed(1):'0.0')+'%</td></tr>').join('')||'<tr><td colspan="5">No classified counterparties.</td></tr>')
    +'</tbody></table>';
}
function renderAlerts(a){
  $('alertsList').innerHTML=a.alerts.length?a.alerts.map(x=>'<div class="alert '+esc(x.severity)+'"><div class="alert-head"><strong>'+esc(x.title)+'</strong><small>'+esc(x.severity.toUpperCase())+'</small></div><p>'+esc(x.detail)+'</p><small>'+esc(x.evidence)+'</small></div>').join('')
    :'<div class="alert low"><div class="alert-head"><strong>No material rule-based indicators detected</strong><small>LOW</small></div><p>Continue case-specific review and verification.</p></div>';
}
function shortName(s,n){s=String(s||'Unknown');return s.length>n?s.slice(0,n-1)+'…':s;}
function shortMoney(n,c){const v=Number(n)||0;if(v>=1e9)return c+' '+(v/1e9).toFixed(2)+'bn';if(v>=1e6)return c+' '+(v/1e6).toFixed(2)+'m';if(v>=1e3)return c+' '+(v/1e3).toFixed(1)+'k';return c+' '+v.toFixed(0);}
function renderNetwork(a){
  const o=a.origins.slice(0,4),b=a.benefits.slice(0,4),subject=$('subjectName').value.trim()||'Subject',ys=[70,145,245,320];
  let s='<svg class="network-svg" viewBox="0 0 680 390" role="img" aria-label="Top originator and beneficiary relationship view">';
  o.forEach((x,i)=>{s+='<line x1="170" y1="'+ys[i]+'" x2="300" y2="195"/><circle class="origin" cx="145" cy="'+ys[i]+'" r="26"/><text x="18" y="'+(ys[i]-5)+'">'+esc(shortName(x.name,18))+'</text><text x="18" y="'+(ys[i]+12)+'">'+esc(shortMoney(x.total,a.currency))+'</text>';});
  b.forEach((x,i)=>{s+='<line x1="380" y1="195" x2="510" y2="'+ys[i]+'"/><circle class="benefit" cx="535" cy="'+ys[i]+'" r="26"/><text x="565" y="'+(ys[i]-5)+'">'+esc(shortName(x.name,16))+'</text><text x="565" y="'+(ys[i]+12)+'">'+esc(shortMoney(x.total,a.currency))+'</text>';});
  s+='<circle class="subject" cx="340" cy="195" r="44"/><text x="340" y="192" text-anchor="middle" font-weight="800">'+esc(shortName(subject,16))+'</text><text x="340" y="209" text-anchor="middle">SUBJECT</text></svg>';
  $('networkView').innerHTML=s;
}
function renderTransactions(){
  const a=state.analysis;if(!a)return;const q=norm($('txSearch').value),f=$('directionFilter').value;
  const rows=a.txs.filter(t=>(f==='all'||t.direction===f)&&(!q||norm(t.originator+' '+t.beneficiary+' '+t.narration+' '+t.txid+' '+t.account).includes(q))).slice(0,300);
  $('transactionTable').innerHTML='<table><thead><tr><th>Date</th><th>Direction</th><th class="num">Amount</th><th>Originator</th><th>Beneficiary</th><th>Narration</th><th>Account/Wallet</th></tr></thead><tbody>'
    +(rows.map(t=>'<tr><td>'+esc(t.date?t.date.toLocaleString('en-GB'):t.dateRaw)+'</td><td>'+esc(t.direction)+'</td><td class="num">'+esc(fmt(t.amount,a.currency))+'</td><td>'+esc(t.originator)+'</td><td>'+esc(t.beneficiary)+'</td><td>'+esc(t.narration)+'</td><td>'+esc(t.account)+'</td></tr>').join('')||'<tr><td colspan="7">No matching transactions.</td></tr>')+'</tbody></table>';
}
function makeDraft(a){
  const name=$('caseName').value.trim()||'Financial Intelligence Analysis',subject=$('subjectName').value.trim()||'the subject',lines=['ABSTRACT'];
  lines.push(name+' reviewed '+a.txs.length.toLocaleString()+' transaction records associated with '+subject+(a.first&&a.last?' for the period '+fmtDate(a.first)+' to '+fmtDate(a.last):'')+'. Total classified inflow was '+fmt(a.totalIn,a.currency)+', while total classified outflow was '+fmt(a.totalOut,a.currency)+', resulting in a net flow of '+fmt(a.net,a.currency)+'.');
  lines.push('','FINDINGS','• '+a.origins.length.toLocaleString()+' distinct originator(s) and '+a.benefits.length.toLocaleString()+' distinct beneficiary/beneficiaries were identified.');
  if(a.benefits[0])lines.push('• The largest beneficiary by value was '+a.benefits[0].name+', receiving '+fmt(a.benefits[0].total,a.currency)+' across '+a.benefits[0].count+' transaction(s).');
  if(a.origins[0])lines.push('• The largest originator by value was '+a.origins[0].name+', contributing '+fmt(a.origins[0].total,a.currency)+' across '+a.origins[0].count+' transaction(s).');
  lines.push('• The pass-through ratio was '+a.passRatio.toFixed(1)+'%.');
  if(a.rapid.length)lines.push('• '+a.rapid.length+' rapid-movement match(es) met the analyst-configured parameters.');
  if(a.cryptoExposure)lines.push('• '+a.cryptoTx.length+' transaction(s), with observed value of '+fmt(a.cryptoExposure,a.currency)+', contained crypto/VASP textual indicators.');
  if(a.unknown.length)lines.push('• '+a.unknown.length+' transaction(s) had unresolved direction and require data review.');
  lines.push('','AML/CFT INDICATORS FOR REVIEW');
  if(a.alerts.length)a.alerts.forEach((x,i)=>lines.push((i+1)+'. '+x.title+': '+x.detail));else lines.push('No material rule-based indicator triggered under the current settings.');
  lines.push('','INFERENCE','The foregoing indicators are screening outputs and should be assessed alongside KYC/CDD information, source of funds/wealth, transaction purpose, counterparty information, intelligence holdings and corroborative material. The system does not determine that money laundering, terrorist financing or another predicate offence occurred.');
  return lines.join('\n');
}
function renderAnalysis(a){
  state.analysis=a;$('resultCaseName').textContent=$('caseName').value.trim()||'Financial Intelligence Analysis';
  $('resultMeta').textContent=state.sourceName+' • '+a.txs.length.toLocaleString()+' standardised records • '+(a.first&&a.last?fmtDate(a.first)+' – '+fmtDate(a.last):'Date range incomplete');
  const badge=$('overallRisk');badge.className='risk-badge '+a.risk;badge.textContent=a.risk.toUpperCase()+' • '+a.riskScore+'/100';
  renderMetrics(a);renderCounterparty('originatorTable',a.origins,a.totalIn,a.currency);renderCounterparty('beneficiaryTable',a.benefits,a.totalOut,a.currency);renderAlerts(a);renderNetwork(a);renderTransactions();$('draftSummary').value=makeDraft(a);
}
function download(filename,text,type){
  const blob=new Blob([text],{type:type||'text/plain'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
}
function csvEscape(v){const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function exportCSV(){
  const a=state.analysis;if(!a)return;const h=['Date','Amount','Direction','Originator','Beneficiary','Narration','Account','Transaction ID'];
  const rows=a.txs.map(t=>[t.date?t.date.toISOString():t.dateRaw,t.amount,t.direction,t.originator,t.beneficiary,t.narration,t.account,t.txid].map(csvEscape).join(','));
  download('finintel_standardised_transactions.csv',[h.join(','),...rows].join('\n'),'text/csv');
}
function reportHtml(){
  const a=state.analysis,summary=$('draftSummary').value,cp=(rows,total)=>rows.slice(0,15).map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.name)+'</td><td>'+r.count+'</td><td>'+esc(fmt(r.total,a.currency))+'</td><td>'+(total?(r.total/total*100).toFixed(1):'0')+'%</td></tr>').join('');
  return '<!doctype html><html><head><meta charset="utf-8"><title>'+esc($('caseName').value)+'</title><style>body{font:14px Arial;max-width:1000px;margin:35px auto;color:#17202a}h1,h2{color:#123b4c}.meta{color:#64727b}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.c{border:1px solid #ccd5da;padding:12px}.v{font-size:20px;font-weight:bold}table{width:100%;border-collapse:collapse;margin:12px 0 25px}th,td{border:1px solid #ccd5da;padding:7px;text-align:left}pre{white-space:pre-wrap;font:14px/1.6 Arial}.warn{border-left:4px solid #b98520;padding:10px;background:#fff8e7}</style></head><body><h1>FinIntel AML — '+esc($('caseName').value||'Analysis Report')+'</h1><p class="meta">Subject: '+esc($('subjectName').value||'Not specified')+' | Source: '+esc(state.sourceName)+' | Generated: '+esc(new Date().toLocaleString())+'</p><div class="warn"><b>Analyst review required.</b> This report contains rule-based screening indicators, not a finding of criminality.</div><h2>Key Metrics</h2><div class="cards"><div class="c"><div class="v">'+a.txs.length+'</div>Transactions</div><div class="c"><div class="v">'+esc(fmt(a.totalIn,a.currency))+'</div>Inflow</div><div class="c"><div class="v">'+esc(fmt(a.totalOut,a.currency))+'</div>Outflow</div><div class="c"><div class="v">'+a.risk.toUpperCase()+' '+a.riskScore+'/100</div>Screening Risk</div></div><h2>Top Originators</h2><table><tr><th>#</th><th>Name</th><th>Count</th><th>Total</th><th>Share</th></tr>'+cp(a.origins,a.totalIn)+'</table><h2>Top Beneficiaries</h2><table><tr><th>#</th><th>Name</th><th>Count</th><th>Total</th><th>Share</th></tr>'+cp(a.benefits,a.totalOut)+'</table><h2>Indicators</h2>'+(a.alerts.map(x=>'<p><b>'+esc(x.title)+'</b><br>'+esc(x.detail)+'<br><small>'+esc(x.evidence)+'</small></p>').join('')||'<p>No material rule-based indicator triggered.</p>')+'<h2>Analytical Summary</h2><pre>'+esc(summary)+'</pre></body></html>';
}

$('fileInput').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;status('importStatus','Reading file locally…');try{const x=await importFile(f);loadRows(x.rows,f.name,x.type);}catch(err){status('importStatus',err.message,true);}});
$('loadSampleBtn').onclick=()=>{try{loadRows(parseCSV(SAMPLE_CSV),'sample_transactions.csv','Sample CSV');}catch(err){status('importStatus',err.message,true);}};
$('confirmMappingBtn').onclick=()=>{const m=readMapping(),err=validateMapping(m);if(err){status('mappingStatus',err,true);return;}state.mapping=m;status('mappingStatus');setStep(3);};
$('backToImport').onclick=()=>setStep(1);$('backToMapping').onclick=()=>setStep(2);
$('runAnalysisBtn').onclick=()=>{state.mapping=readMapping();const err=validateMapping(state.mapping);if(err){status('configStatus',err,true);setStep(2);return;}status('configStatus');setStep(4);$('analysisProgress').textContent='Standardising dates, amounts, directions and counterparties…';setTimeout(()=>{try{state.standardized=standardize();if(!state.standardized.length)throw new Error('No usable transactions remained after standardisation.');$('analysisProgress').textContent='Running transaction summaries and AML/CFT scenarios…';setTimeout(()=>{const a=analyze(state.standardized);renderAnalysis(a);setStep(5);},200);}catch(e){status('configStatus',e.message,true);setStep(3);}},200);};
$('txSearch').addEventListener('input',renderTransactions);$('directionFilter').addEventListener('change',renderTransactions);$('exportCsvBtn').onclick=exportCSV;
$('copySummaryBtn').onclick=async()=>{try{await navigator.clipboard.writeText($('draftSummary').value);status('reportStatus','Analytical summary copied.');}catch{status('reportStatus','Copy failed. Select the text manually.',true);}};
$('downloadReportBtn').onclick=()=>{download('finintel_aml_analysis_report.html',reportHtml(),'text/html');status('reportStatus','HTML report downloaded.');};
$('newAnalysisBtn').onclick=()=>{state.analysis=null;state.standardized=[];setStep(1);};
$('clearAllBtn').onclick=()=>{state.rawRows=[];state.columns=[];state.mapping={};state.standardized=[];state.analysis=null;$('fileInput').value='';$('datasetInfo').hidden=true;$('datasetEmpty').hidden=false;status('importStatus');setStep(1);};
$$('.step').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.step);if(n===1)setStep(1);else if(n===2&&state.rawRows.length)setStep(2);else if(n===3&&state.rawRows.length)setStep(3);else if(n===5&&state.analysis)setStep(5);});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js?v=1').catch(()=>{}));