'use strict';

const $=id=>document.getElementById(id);
const $$=s=>Array.from(document.querySelectorAll(s));

const STORE={
  custom:'finintel.v2.customFields',
  templates:'finintel.v2.importTemplates',
  aliases:'finintel.v2.entityAliases',
  resolutions:'finintel.v3.counterpartyResolutions'
};

const CORE_FIELDS=[
  {id:'date',label:'Transaction / Record Date',type:'date',category:'transaction'},
  {id:'amount',label:'Amount',type:'currency',category:'transaction'},
  {id:'direction',label:'Direction',type:'text',category:'transaction'},
  {id:'debit',label:'Debit Amount',type:'currency',category:'transaction'},
  {id:'credit',label:'Credit Amount',type:'currency',category:'transaction'},
  {id:'originator',label:'Originator / Sender',type:'entity',category:'transaction'},
  {id:'beneficiary',label:'Beneficiary / Receiver',type:'entity',category:'transaction'},
  {id:'counterparty',label:'Counterparty / Other Party',type:'entity',category:'transaction'},
  {id:'narration',label:'Narration / Description',type:'text',category:'transaction'},
  {id:'account',label:'Account / Wallet Identifier',type:'account',category:'account'},
  {id:'txid',label:'Transaction ID / Hash',type:'identifier',category:'transaction'},
  {id:'currency',label:'Currency',type:'text',category:'transaction'},
  {id:'name',label:'Customer / Person Name',type:'entity',category:'identity'},
  {id:'dob',label:'Date of Birth',type:'date',category:'identity'},
  {id:'bvn',label:'BVN',type:'identifier',category:'identity',sensitivity:'highly-sensitive'},
  {id:'nin',label:'NIN',type:'identifier',category:'identity',sensitivity:'highly-sensitive'},
  {id:'phone',label:'Phone Number',type:'phone',category:'contact',sensitivity:'confidential'},
  {id:'email',label:'Email Address',type:'email',category:'contact',sensitivity:'confidential'},
  {id:'address',label:'Address',type:'text',category:'contact',sensitivity:'confidential'},
  {id:'occupation',label:'Occupation',type:'text',category:'identity'},
  {id:'source_of_funds',label:'Source of Funds',type:'text',category:'identity'},
  {id:'source_of_wealth',label:'Source of Wealth',type:'text',category:'identity'},
  {id:'risk_rating',label:'Customer Risk Rating',type:'text',category:'identity'},
  {id:'entity_name',label:'Entity / Company Name',type:'entity',category:'entity'},
  {id:'registration_no',label:'Registration Number',type:'identifier',category:'entity'},
  {id:'entity_type',label:'Entity Type',type:'text',category:'entity'},
  {id:'director',label:'Director',type:'entity',category:'entity'},
  {id:'shareholder',label:'Shareholder',type:'entity',category:'entity'},
  {id:'ubo',label:'Ultimate Beneficial Owner',type:'entity',category:'entity'},
  {id:'ownership_pct',label:'Ownership Percentage',type:'number',category:'entity'},
  {id:'country',label:'Country / Jurisdiction',type:'geography',category:'geography'},
  {id:'asset',label:'Virtual Asset',type:'text',category:'crypto'},
  {id:'quantity',label:'Asset Quantity',type:'number',category:'crypto'},
  {id:'wallet',label:'Wallet Address',type:'wallet',category:'crypto'},
  {id:'counterparty_wallet',label:'Counterparty Wallet',type:'wallet',category:'crypto'},
  {id:'blockchain',label:'Blockchain',type:'text',category:'crypto'},
  {id:'network',label:'Network',type:'text',category:'crypto'},
  {id:'vasp_uid',label:'VASP / Exchange UID',type:'identifier',category:'crypto'},
  {id:'transaction_type',label:'Transaction Type',type:'text',category:'crypto'},
  {id:'ip',label:'IP Address',type:'ip',category:'technical',sensitivity:'confidential'},
  {id:'device',label:'Device ID',type:'device',category:'technical',sensitivity:'confidential'},
  {id:'channel',label:'Transaction / Access Channel',type:'text',category:'technical'},
  {id:'branch',label:'Branch / Location',type:'geography',category:'institution'}
];

const TYPE_LABELS={
  text:'Text',number:'Number',date:'Date / Time',currency:'Currency Amount',
  entity:'Person / Entity',identifier:'Identifier',account:'Account',phone:'Phone',
  email:'Email',wallet:'Crypto Wallet',blockchain_tx:'Blockchain Transaction',
  ip:'IP Address',device:'Device ID',geography:'Geography',boolean:'Yes / No'
};

const DATASET_LABELS={
  transaction:'Transaction Data',
  kyc:'Customer / KYC Data',
  entity:'Entity / Company Data',
  crypto:'Crypto / VASP Data',
  custom:'Other / Custom Dataset'
};

const autoPatterns={
  date:[/^date$/i,/transaction.*date/i,/value.*date/i,/posting.*date/i,/timestamp/i,/created.*at/i,/time$/i],
  amount:[/^amount$/i,/transaction.*amount/i,/value$/i,/amt$/i],
  direction:[/^direction$/i,/dr.?cr/i,/debit.?credit/i,/inflow.*outflow/i,/outflow.*inflow/i,/credit.*debit/i,/transaction.*direction/i,/flow.*type/i],
  debit:[/^debit$/i,/debit.*amount/i,/^outflow$/i,/outflow.*amount/i,/withdrawal.*amount/i,/money.*out/i],
  credit:[/^credit$/i,/credit.*amount/i,/^inflow$/i,/inflow.*amount/i,/deposit.*amount/i,/money.*in/i],
  originator:[/originator/i,/sender/i,/source.*name/i,/payer/i,/from.*name/i],
  beneficiary:[/beneficiary/i,/receiver/i,/recipient/i,/payee/i,/to.*name/i],
  counterparty:[/counterparty/i,/other.*party/i,/party.*name/i,/counter.*name/i,/originator.*beneficiary/i,/beneficiary.*originator/i,/sender.*receiver/i,/receiver.*sender/i],
  narration:[/narration/i,/description/i,/remarks/i,/memo/i,/details/i],
  account:[/account.*number/i,/account$/i,/wallet.*id/i],
  txid:[/transaction.*id/i,/transaction.*ref/i,/reference/i,/tx.*hash/i,/hash/i,/txn/i],
  currency:[/^currency$/i,/ccy/i],
  name:[/^name$/i,/customer.*name/i,/full.*name/i,/client.*name/i],
  dob:[/date.*birth/i,/dob/i],
  bvn:[/^bvn$/i,/bank.*verification/i],
  nin:[/^nin$/i,/national.*ident/i],
  phone:[/phone/i,/mobile/i,/msisdn/i],
  email:[/email/i,/e-mail/i],
  address:[/^address$/i,/residential.*address/i],
  occupation:[/occupation/i,/profession/i],
  source_of_funds:[/source.*fund/i],
  source_of_wealth:[/source.*wealth/i],
  risk_rating:[/risk.*rating/i,/risk.*level/i],
  entity_name:[/company.*name/i,/entity.*name/i,/legal.*name/i],
  registration_no:[/registration/i,/rc.*number/i,/company.*number/i],
  entity_type:[/entity.*type/i,/company.*type/i],
  director:[/director/i],
  shareholder:[/shareholder/i],
  ubo:[/\bubo\b/i,/beneficial.*owner/i],
  ownership_pct:[/ownership/i,/share.*percent/i,/percentage/i],
  country:[/^country$/i,/jurisdiction/i],
  asset:[/^asset$/i,/coin/i,/token/i],
  quantity:[/quantity/i,/crypto.*amount/i,/asset.*amount/i],
  wallet:[/^wallet$/i,/wallet.*address/i,/deposit.*address/i],
  counterparty_wallet:[/counterparty.*wallet/i,/withdrawal.*address/i,/destination.*address/i],
  blockchain:[/blockchain/i,/chain$/i],
  network:[/^network$/i],
  vasp_uid:[/\buid\b/i,/exchange.*id/i,/vasp.*id/i],
  transaction_type:[/transaction.*type/i,/tx.*type/i],
  ip:[/^ip$/i,/ip.*address/i],
  device:[/device.*id/i,/device$/i,/imei/i],
  channel:[/channel/i],
  branch:[/branch/i,/location/i]
};

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

const NETWORK_DEFAULT_ZOOM=.65;
let networkZoom=NETWORK_DEFAULT_ZOOM;
let networkFocus='center';
let networkSelectedNode=null;
let profilePartyName='';
let profilePage=1;
const counterpartyPage={originator:1,beneficiary:1};
const counterpartySelection=new Map();
const unknownSelection=new Map();
let unknownPage=1;
let dataQualityActiveIssue='';
const COUNTERPARTY_PAGE_SIZE=10;
const PROFILE_PAGE_SIZE=10;
const UNKNOWN_PAGE_SIZE=10;

const state={
  rawRows:[],columns:[],sourceName:'',sourceType:'',sheets:[],
  datasetType:'transaction',
  sourceMapping:{},
  amountLayout:'auto',
  partyLayout:'auto',
  sheetDirections:{},
  standardized:[],
  analysis:null,
  customFields:loadJSON(STORE.custom,[]),
  templates:loadJSON(STORE.templates,[]),
  aliasMap:loadObject(STORE.aliases,{}),
  counterpartyResolutions:loadObject(STORE.resolutions,{})
};

function loadJSON(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return Array.isArray(v)?v:fallback;}catch{return fallback;}}
function loadObject(key,fallback={}){try{const v=JSON.parse(localStorage.getItem(key));return v&&typeof v==='object'&&!Array.isArray(v)?v:fallback;}catch{return fallback;}}
function saveJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
function esc(v){return String(v==null?'':v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function norm(v){return String(v==null?'':v).trim().toLowerCase().replace(/\s+/g,' ');}
function slug(v){return norm(v).replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,40)||'field';}
function status(id,text,err=false){const e=$(id);if(!e)return;e.textContent=text||'';e.classList.toggle('error',!!err);}
function setStep(n){$$('.stage').forEach(s=>{s.hidden=true;s.classList.remove('active');});const t=$('step'+n);t.hidden=false;t.classList.add('active');$$('.step').forEach(b=>b.classList.toggle('active',Number(b.dataset.step)===n));window.scrollTo({top:Math.max(0,t.offsetTop-110),behavior:'smooth'});}
function allFields(){return [...CORE_FIELDS,...state.customFields];}
function fieldById(id){return allFields().find(f=>f.id===id)||null;}
function sourceForField(id){return Object.keys(state.sourceMapping).find(c=>state.sourceMapping[c]===id)||'';}
function mappingCount(){return Object.values(state.sourceMapping).filter(Boolean).length;}
function mappedFields(){return state.columns.map(source=>({source,field:fieldById(state.sourceMapping[source])})).filter(x=>x.field);}
function signature(cols=state.columns){return [...cols].map(norm).sort().join('|');}
function datasetLabel(){return DATASET_LABELS[state.datasetType]||state.datasetType;}

function persistCounterpartyResolutions(){
  saveJSON(STORE.resolutions,state.counterpartyResolutions);
}
function resolutionKeyParts(sourceName,sheet,row,dateRaw,amount,direction,narration){
  return [sourceName||'',sheet||'',row||'',dateRaw||'',Number(amount)||0,direction||'',String(narration||'').slice(0,180)].join('|');
}
function resolutionKeyForRecord(r){
  return resolutionKeyParts(state.sourceName,r.sheet,r.row,r.dateRaw,r.amount,r.direction,r.narration);
}
function getCounterpartyResolutionByKey(key){
  const raw=state.counterpartyResolutions[key];
  return raw&&typeof raw==='object'?raw:null;
}
function setCounterpartyResolution(key,payload){
  if(!key)return;
  state.counterpartyResolutions[key]={...payload,updatedAt:new Date().toISOString()};
  persistCounterpartyResolutions();
}

function aliasEntry(name){
  const raw=state.aliasMap[norm(name)];
  if(!raw)return null;
  return typeof raw==='string'?{canonical:raw,updatedAt:''}:raw;
}
function resolveAlias(name){
  let current=String(name||'').trim();
  const seen=new Set();
  for(let i=0;i<12;i++){
    const key=norm(current);
    if(!key||seen.has(key))break;
    seen.add(key);
    const entry=aliasEntry(current);
    if(!entry?.canonical||norm(entry.canonical)===key)break;
    current=String(entry.canonical).trim();
  }
  return current;
}
function persistAliases(){
  saveJSON(STORE.aliases,state.aliasMap);
  renderAliasLibrary();
}
function selectedCounterpartyNames(){
  return Array.from(counterpartySelection.values());
}
function setCounterpartySelected(name,selected){
  const value=String(name||'').trim(),key=norm(value);
  if(!key)return;
  if(selected)counterpartySelection.set(key,value);
  else counterpartySelection.delete(key);
}
function isCounterpartySelected(name){
  return counterpartySelection.has(norm(name));
}
function clearAliasSelection(){
  counterpartySelection.clear();
  document.querySelectorAll('.counterparty-select,.counterparty-select-all').forEach(x=>{
    x.checked=false;
    x.indeterminate=false;
  });
  if($('aliasCanonicalName'))$('aliasCanonicalName').value='';
  if(state.analysis?.kind==='transaction')rerenderCounterpartyTables();
}

function renderAliasLibrary(){
  const table=$('aliasLibraryTable'),pill=$('aliasLibraryCount');
  if(!table||!pill)return;
  const entries=Object.entries(state.aliasMap)
    .map(([alias,raw])=>({alias,entry:typeof raw==='string'?{canonical:raw,updatedAt:''}:raw}))
    .filter(x=>x.entry?.canonical)
    .sort((a,b)=>a.entry.canonical.localeCompare(b.entry.canonical)||a.alias.localeCompare(b.alias));
  pill.textContent=entries.length+' saved mapping'+(entries.length===1?'':'s');
  if(!entries.length){
    table.innerHTML='<div class="alias-library-empty">No persistent alias mappings have been saved in this browser.</div>';
    return;
  }
  table.innerHTML='<table><thead><tr><th>Alias / Variant</th><th>Canonical Entity</th><th>Updated</th><th></th></tr></thead><tbody>'
    +entries.map(x=>'<tr><td>'+esc(x.alias)+'</td><td><strong>'+esc(x.entry.canonical)+'</strong></td><td>'+esc(x.entry.updatedAt?new Date(x.entry.updatedAt).toLocaleString():'—')+'</td><td><button class="btn ghost alias-delete-btn" type="button" data-alias="'+encodeURIComponent(x.alias)+'">Delete</button></td></tr>').join('')
    +'</tbody></table>';
  $$('.alias-delete-btn').forEach(btn=>btn.onclick=()=>{
    delete state.aliasMap[decodeURIComponent(btn.dataset.alias)];
    persistAliases();
    status('aliasStatus','Saved alias mapping deleted.');
  });
}
function saveSelectedAliases(){
  const selected=selectedCounterpartyNames();
  const canonical=$('aliasCanonicalName')?.value.trim()||'';
  if(!selected.length){status('aliasStatus','Select one or more names in Top Originators or Top Beneficiaries.',true);return;}
  if(!canonical){status('aliasStatus','Enter the canonical person/entity name.',true);return;}
  let saved=0;
  selected.forEach(name=>{
    const key=norm(name);
    if(!key||key===norm(canonical))return;
    state.aliasMap[key]={canonical,updatedAt:new Date().toISOString()};
    saved++;
  });
  persistAliases();
  status('aliasStatus',saved+' alias'+(saved===1?'':'es')+' saved to '+canonical+'. You can select more variants or rerun the analysis.');
  clearAliasSelection();
}
function rerunWithAliases(){
  if(!state.rawRows.length){status('aliasStatus','Load a dataset before rerunning.',true);return;}
  try{
    state.standardized=standardize();
    const a=state.datasetType==='transaction'?transactionAnalysis(state.standardized):universalAnalysis(state.standardized);
    renderAnalysis(a);
    status('aliasStatus','Analysis rerun with '+Object.keys(state.aliasMap).length+' saved alias mapping(s).');
  }catch(e){status('aliasStatus',e.message||'Unable to rerun analysis.',true);}
}
function exportAliasLibrary(){
  download('finintel_entity_alias_library.json',JSON.stringify({
    product:'FinIntel AML',
    exportedAt:new Date().toISOString(),
    aliases:state.aliasMap
  },null,2),'application/json');
  status('aliasStatus','Persistent alias library exported.');
}

function suggestedAmountLayout(){
  const mapped=Object.values(state.sourceMapping).filter(Boolean);
  if(mapped.includes('credit')||mapped.includes('debit'))return'split';
  if(state.sheets.length>1&&state.sheets.some(s=>s.directionHint))return'sheets';
  return'single';
}
function suggestedPartyLayout(){
  const mapped=Object.values(state.sourceMapping).filter(Boolean);
  if(mapped.includes('counterparty'))return'shared';
  if(mapped.includes('originator')||mapped.includes('beneficiary'))return'separate';
  return'auto';
}
function effectiveAmountLayout(){
  return state.amountLayout==='auto'?suggestedAmountLayout():state.amountLayout;
}
function effectivePartyLayout(){
  return state.partyLayout==='auto'?suggestedPartyLayout():state.partyLayout;
}
function renderTransactionStructure(){
  const panel=$('transactionStructurePanel');
  if(!panel)return;
  panel.hidden=state.datasetType!=='transaction';
  if(panel.hidden)return;
  $('amountLayout').value=state.amountLayout;
  $('partyLayout').value=state.partyLayout;

  const amount=effectiveAmountLayout(),party=effectivePartyLayout();
  const amountText=amount==='single'
    ?'<strong>One Amount column:</strong> map the source money column to <b>Amount</b>. Direction may come from +/− signs, text such as “Inflow 5000 / Outflow 2000”, a Direction column, Description, or sheet assignment.'
    :amount==='split'
      ?'<strong>Separate money columns:</strong> map the inflow/credit column to <b>Credit Amount</b> and the outflow/debit column to <b>Debit Amount</b>. Blank or zero on the opposite side is valid.'
      :'<strong>Separate sheets:</strong> map the common money column to <b>Amount</b> (or map different sheet-specific amount columns to Amount), then assign each worksheet as Inflow, Outflow, Auto, or Ignore below.';
  const partyText=party==='shared'
    ?'<strong>One counterparty column:</strong> map it to <b>Counterparty / Other Party</b>. On inflows it becomes the Originator; on outflows it becomes the Beneficiary.'
    :party==='separate'
      ?'<strong>Separate party columns:</strong> map sender to <b>Originator / Sender</b> and receiver to <b>Beneficiary / Receiver</b>.'
      :'<strong>Counterparty:</strong> FinIntel will use whichever party fields you map and Description Intelligence as fallback.';
  $('structureGuide').innerHTML=amountText+'<br><br>'+partyText;
  $('structureStatusPill').textContent=(amount==='single'?'One Amount':amount==='split'?'Two Amount Columns':'Separate Sheets')+' • '+(party==='shared'?'Shared Counterparty':party==='separate'?'Separate Parties':'Auto Parties');

  const sheetPanel=$('sheetDirectionPanel');
  sheetPanel.hidden=amount!=='sheets';
  if(amount==='sheets'){
    $('sheetDirectionRows').innerHTML=state.sheets.map(s=>{
      const selected=state.sheetDirections[s.name]||'auto';
      return '<div class="sheet-direction-row"><div class="sheet-direction-name">'+esc(s.name)+'<small>'+s.rows.toLocaleString()+' rows'+(s.directionHint?' • detected '+s.directionHint:' • direction not detected')+'</small></div>'
        +'<select class="sheet-direction-select" data-sheet="'+esc(s.name)+'">'
        +'<option value="auto" '+(selected==='auto'?'selected':'')+'>Auto-detect</option>'
        +'<option value="inflow" '+(selected==='inflow'?'selected':'')+'>Inflow / Credit sheet</option>'
        +'<option value="outflow" '+(selected==='outflow'?'selected':'')+'>Outflow / Debit sheet</option>'
        +'<option value="ignore" '+(selected==='ignore'?'selected':'')+'>Ignore this sheet</option></select></div>';
    }).join('');
    $$('.sheet-direction-select').forEach(sel=>sel.addEventListener('change',()=>{
      state.sheetDirections[sel.dataset.sheet]=sel.value;
      renderTransactionStructure();
    }));
  }
}
function detectTextDirectionInAmount(v){
  const s=String(v??'').toLowerCase();
  if(/\b(inflow|credit|credited|cr|incoming|received|deposit)\b/.test(s))return'inflow';
  if(/\b(outflow|debit|debited|dr|outgoing|sent|withdrawal|payment)\b/.test(s))return'outflow';
  return'';
}
function mappedAmountSources(fieldId){
  return Object.entries(state.sourceMapping).filter(([,fid])=>fid===fieldId).map(([source])=>source);
}
function hasSingleAmountDirectionEvidence(){
  const directionMapped=Object.values(state.sourceMapping).includes('direction');
  const narrationMapped=Object.values(state.sourceMapping).includes('narration');
  if(directionMapped||narrationMapped)return true;
  if(state.sheets.some(s=>(state.sheetDirections[s.name]&&state.sheetDirections[s.name]!=='auto')||s.directionHint))return true;
  const sources=mappedAmountSources('amount');
  return state.rawRows.slice(0,100).some(r=>sources.some(src=>{
    const v=String(r[src]??'');
    return /^\s*[+-]/.test(v)||/^\s*\(.*\)\s*$/.test(v)||!!detectTextDirectionInAmount(v);
  }));
}

function setLoaderProgress(percent,phase,detail=''){
  const box=$('loaderProgress');if(!box)return;
  box.hidden=false;
  const p=Math.max(0,Math.min(100,Math.round(Number(percent)||0)));
  $('loaderPercent').textContent=p+'%';
  $('loaderBar').style.width=p+'%';
  $('loaderPhase').textContent=phase||'Loading dataset…';
  $('loaderDetail').textContent=detail||'';
}
function resetLoaderProgress(){
  if($('loaderProgress'))$('loaderProgress').hidden=true;
  if($('loaderBar'))$('loaderBar').style.width='0%';
}
function readLocalFile(file,mode,onProgress){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(reader.error||new Error('Unable to read the selected file.'));
    reader.onprogress=e=>{
      if(e.lengthComputable&&onProgress)onProgress(e.loaded/e.total);
    };
    reader.onload=()=>resolve(reader.result);
    if(mode==='arrayBuffer')reader.readAsArrayBuffer(file);else reader.readAsText(file);
  });
}
function sheetDirectionHint(name){
  const n=norm(name);
  if(/\b(inflow|credit|credits|deposit|deposits|incoming|receipts?)\b/.test(n))return'inflow';
  if(/\b(outflow|debit|debits|withdrawal|withdrawals|outgoing|payments?)\b/.test(n))return'outflow';
  return'';
}
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
  setLoaderProgress(2,'Opening dataset',file.name);
  if(ext==='csv'){
    const text=await readLocalFile(file,'text',p=>setLoaderProgress(5+p*45,'Reading CSV',Math.round(p*100)+'% of file read'));
    setLoaderProgress(58,'Parsing rows','Converting CSV text into transaction records…');
    const rows=parseCSV(text).map(r=>({...r,__finintel_sheet:'CSV',__finintel_sheet_direction:''}));
    setLoaderProgress(82,'Discovering schema',rows.length.toLocaleString()+' rows detected');
    return{rows,type:'CSV',sheets:[{name:'CSV',rows:rows.length,directionHint:''}]};
  }
  if(ext==='xlsx'||ext==='xls'){
    if(!window.XLSX)throw new Error('Excel parser unavailable. Check internet access or convert the file to CSV.');
    const buffer=await readLocalFile(file,'arrayBuffer',p=>setLoaderProgress(5+p*38,'Reading Excel workbook',Math.round(p*100)+'% of file read'));
    setLoaderProgress(46,'Opening workbook','Detecting worksheets…');
    await new Promise(resolve=>setTimeout(resolve,0));
    const wb=XLSX.read(buffer,{type:'array'});
    const sheets=[],rows=[];
    const names=wb.SheetNames||[];
    for(let i=0;i<names.length;i++){
      const name=names[i],hint=sheetDirectionHint(name);
      setLoaderProgress(48+((i+1)/Math.max(1,names.length))*35,'Reading worksheet',name+' ('+(i+1)+' of '+names.length+')');
      await new Promise(resolve=>setTimeout(resolve,0));
      const parsed=XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:'',raw:false});
      if(!parsed.length)continue;
      parsed.forEach(r=>rows.push({...r,__finintel_sheet:name,__finintel_sheet_direction:hint}));
      sheets.push({name,rows:parsed.length,directionHint:hint});
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    setLoaderProgress(88,'Discovering schema',rows.length.toLocaleString()+' rows across '+sheets.length+' non-empty sheet(s)');
    return{rows,type:'Excel',sheets};
  }
  throw new Error('Unsupported file type. Use CSV, XLSX or XLS.');
}

function guessField(source){
  const s=String(source||'');
  if(/originator.*beneficiary|beneficiary.*originator|sender.*receiver|receiver.*sender|counterparty|other.*party/i.test(s))return'counterparty';
  if(/inflow.*outflow|outflow.*inflow|credit.*debit|debit.*credit/i.test(s))return'direction';
  const c=CORE_FIELDS.find(f=>(autoPatterns[f.id]||[]).some(p=>p.test(s)));
  return c?.id||'';
}

function defaultMapping(){
  const used=new Set(),m={};
  state.columns.forEach(c=>{
    const g=guessField(c);
    if(g&&!used.has(g)){m[c]=g;used.add(g);}else m[c]='';
  });
  return m;
}

function findMatchingTemplate(){
  const sig=signature();
  return state.templates.find(t=>t.signature===sig&&t.datasetType===state.datasetType)||null;
}

function loadRows(rows,name,type,sheets=[]){
  if(!rows.length)throw new Error('No data rows were found.');
  setLoaderProgress(92,'Preparing mapping','Standardising headers and detecting likely fields…');
  state.rawRows=rows;
  state.columns=Array.from(new Set(rows.flatMap(r=>Object.keys(r)))).filter(c=>!c.startsWith('__finintel_'));
  state.sheets=sheets.length?sheets:[{name:type||'Dataset',rows:rows.length,directionHint:''}];
  state.sourceName=name;state.sourceType=type;state.datasetType=$('datasetType').value;
  state.sourceMapping=defaultMapping();
  state.sheetDirections=Object.fromEntries(state.sheets.map(s=>[s.name,s.directionHint||'auto']));
  state.amountLayout=suggestedAmountLayout();
  state.partyLayout=suggestedPartyLayout();
  $('datasetEmpty').hidden=true;$('datasetInfo').hidden=false;
  $('rowCount').textContent=rows.length.toLocaleString();
  $('columnCount').textContent=state.columns.length.toLocaleString();
  $('sheetCount').textContent=state.sheets.length.toLocaleString();
  $('fileType').textContent=type;
  $('sheetSummary').innerHTML=state.sheets.map(s=>'<span class="sheet-chip '+esc(s.directionHint||'')+'">'+esc(s.name)+' • '+s.rows.toLocaleString()+' rows'+(s.directionHint?' • '+s.directionHint:'')+'</span>').join('');
  $('columnTags').innerHTML=state.columns.map(c=>'<span>'+esc(c)+'</span>').join('');
  setLoaderProgress(100,'Dataset ready',rows.length.toLocaleString()+' rows • '+state.columns.length+' columns • '+state.sheets.length+' sheet(s)');
  status('importStatus',name+': '+rows.length.toLocaleString()+' rows loaded locally.');
  refreshMappingUI();
  const t=findMatchingTemplate();
  if(t){
    $('templateSelect').value=t.id;
    status('templateStatus','Matching saved template found: '+t.name+'. Click Apply to use it.');
  }else status('templateStatus','');
  setTimeout(()=>setStep(2),180);
}

function optionHtml(selected){
  const coreGroups={};
  CORE_FIELDS.forEach(f=>{(coreGroups[f.category]??=[]).push(f);});
  let h='<option value="">— Ignore / Unmapped —</option>';
  Object.keys(coreGroups).sort().forEach(cat=>{
    h+='<optgroup label="Core • '+esc(cat)+'">';
    coreGroups[cat].forEach(f=>h+='<option value="'+esc(f.id)+'" '+(selected===f.id?'selected':'')+'>'+esc(f.label)+'</option>');
    h+='</optgroup>';
  });
  if(state.customFields.length){
    h+='<optgroup label="Custom FinIntel Fields">';
    state.customFields.forEach(f=>h+='<option value="'+esc(f.id)+'" '+(selected===f.id?'selected':'')+'>'+esc(f.label)+' ['+esc(f.category)+']</option>');
    h+='</optgroup>';
  }
  return h;
}

function firstSample(col){
  for(const r of state.rawRows.slice(0,12)){const v=r[col];if(v!==undefined&&String(v).trim()!=='')return String(v).slice(0,100);}
  return '';
}

function refreshMappingUI(){
  $('mappingDatasetType').textContent=datasetLabel();
  const body=$('mappingRows');body.innerHTML='';
  state.columns.forEach((col,i)=>{
    const fid=state.sourceMapping[col]||'',f=fieldById(fid);
    const tr=document.createElement('tr');
    tr.innerHTML='<td><div class="mapping-source">'+esc(col)+'</div></td>'
      +'<td><div class="mapping-sample">'+esc(firstSample(col)||'—')+'</div></td>'
      +'<td><select class="map-select" data-source="'+esc(col)+'">'+optionHtml(fid)+'</select></td>'
      +'<td class="mapping-type" id="map-type-'+i+'">'+esc(f?TYPE_LABELS[f.type]||f.type:'Unmapped')+'</td>';
    body.appendChild(tr);
  });
  $$('.map-select').forEach((sel,i)=>sel.addEventListener('change',()=>{
    state.sourceMapping[sel.dataset.source]=sel.value;
    const f=fieldById(sel.value);
    $('map-type-'+i).textContent=f?(TYPE_LABELS[f.type]||f.type):'Unmapped';
  }));
  renderCustomFieldList();
  renderTemplateSelect();
  renderTransactionStructure();
}

function renderCustomFieldList(){
  const el=$('customFieldList');
  if(!state.customFields.length){el.innerHTML='<div class="emptybox">No custom fields yet.</div>';return;}
  el.innerHTML=state.customFields.map(f=>'<div class="schema-item"><div><strong>'+esc(f.label)+'</strong><small>'+esc(TYPE_LABELS[f.type]||f.type)+' • '+esc(f.category)+' • '+esc(f.sensitivity||'internal')+'</small></div><button class="icon-btn delete-custom" data-id="'+esc(f.id)+'" type="button">Delete</button></div>').join('');
  $$('.delete-custom').forEach(b=>b.onclick=()=>deleteCustomField(b.dataset.id));
}

function addCustomField(){
  const label=$('customFieldName').value.trim();
  if(!label){status('schemaStatus','Enter a field name.',true);return;}
  if(allFields().some(f=>norm(f.label)===norm(label))){status('schemaStatus','A field with this name already exists.',true);return;}
  const id='custom_'+slug(label)+'_'+Date.now().toString(36);
  const field={id,label,type:$('customFieldType').value,category:$('customFieldCategory').value,sensitivity:$('customFieldSensitivity').value,description:$('customFieldDescription').value.trim(),custom:true};
  state.customFields.push(field);saveJSON(STORE.custom,state.customFields);
  $('customFieldName').value='';$('customFieldDescription').value='';
  refreshMappingUI();status('schemaStatus','Custom field added: '+label+'.');
}

function deleteCustomField(id){
  const f=fieldById(id);if(!f||!f.custom)return;
  state.customFields=state.customFields.filter(x=>x.id!==id);
  Object.keys(state.sourceMapping).forEach(k=>{if(state.sourceMapping[k]===id)state.sourceMapping[k]='';});
  saveJSON(STORE.custom,state.customFields);refreshMappingUI();status('schemaStatus','Custom field deleted.');
}

function renderTemplateSelect(){
  const current=$('templateSelect').value;
  $('templateSelect').innerHTML='<option value="">— Saved import templates —</option>'+state.templates.map(t=>'<option value="'+esc(t.id)+'">'+esc(t.name)+' • '+esc(DATASET_LABELS[t.datasetType]||t.datasetType)+'</option>').join('');
  if(state.templates.some(t=>t.id===current))$('templateSelect').value=current;
}

function saveTemplate(){
  const name=$('templateName').value.trim();
  if(!name){status('templateStatus','Enter a template name.',true);return;}
  if(!mappingCount()){status('templateStatus','Map at least one field before saving a template.',true);return;}
  const existing=state.templates.find(t=>norm(t.name)===norm(name));
  const item={id:existing?.id||('tpl_'+Date.now().toString(36)),name,datasetType:state.datasetType,signature:signature(),columns:[...state.columns],mapping:{...state.sourceMapping},amountLayout:state.amountLayout,partyLayout:state.partyLayout,sheetDirections:{...state.sheetDirections},updatedAt:new Date().toISOString()};
  if(existing)state.templates=state.templates.map(t=>t.id===existing.id?item:t);else state.templates.push(item);
  saveJSON(STORE.templates,state.templates);renderTemplateSelect();$('templateSelect').value=item.id;status('templateStatus','Template saved in this browser: '+name+'.');
}

function applyTemplate(){
  const t=state.templates.find(x=>x.id===$('templateSelect').value);
  if(!t){status('templateStatus','Select a saved template first.',true);return;}
  const next={};
  state.columns.forEach(c=>next[c]=(t.mapping[c]&&fieldById(t.mapping[c]))?t.mapping[c]:'');
  state.sourceMapping=next;
  state.amountLayout=t.amountLayout||state.amountLayout||'auto';
  state.partyLayout=t.partyLayout||state.partyLayout||'auto';
  if(t.sheetDirections)state.sheetDirections={...state.sheetDirections,...t.sheetDirections};
  if(t.datasetType!==state.datasetType)status('templateStatus','Template mapping applied. Note: it was saved for '+(DATASET_LABELS[t.datasetType]||t.datasetType)+'.');
  else status('templateStatus','Template applied: '+t.name+'.');
  refreshMappingUI();$('templateSelect').value=t.id;
}

function validateMapping(){
  const mapped=Object.values(state.sourceMapping).filter(Boolean);
  if(!mapped.length)return'Map at least one source column to a FinIntel field.';
  if(state.datasetType==='transaction'){
    if(!mapped.includes('date'))return'Transaction analysis requires Transaction Date.';
    const amountLayout=effectiveAmountLayout(),partyLayout=effectivePartyLayout();

    if(amountLayout==='single'){
      if(!mapped.includes('amount'))return'For “One Amount column”, map the money column to Amount.';
      if(!hasSingleAmountDirectionEvidence())return'The Amount column is mapped, but FinIntel has no reliable way to distinguish inflow from outflow. Map a Direction or Description column, use +/− or Inflow/Outflow text in Amount, or choose separate sheets.';
    }
    if(amountLayout==='split'){
      if(!mapped.includes('credit')||!mapped.includes('debit'))return'For separate Inflow/Outflow columns, map the inflow column to Credit Amount and the outflow column to Debit Amount.';
    }
    if(amountLayout==='sheets'){
      if(state.sheets.length<2)return'“Separate sheets” requires an Excel workbook with two or more non-empty sheets.';
      if(!mapped.includes('amount'))return'For separate Inflow/Outflow sheets, map the sheet amount column(s) to Amount.';
      const unresolved=state.sheets.filter(s=>{
        const chosen=state.sheetDirections[s.name]||'auto';
        return chosen==='auto'&&!s.directionHint;
      });
      if(unresolved.length)return'Assign the direction for these worksheet(s): '+unresolved.map(s=>s.name).join(', ')+'.';
    }

    if(partyLayout==='shared'&&!mapped.includes('counterparty'))return'For one shared Originator/Beneficiary column, map that source column to Counterparty / Other Party.';
    if(partyLayout==='separate'&&!mapped.includes('originator')&&!mapped.includes('beneficiary')&&!mapped.includes('narration'))return'For separate party columns, map Originator and/or Beneficiary. Description may also be used as fallback.';
  }
  return'';
}

function renderMappedSummary(){
  const rows=mappedFields();
  $('mappedFieldSummary').innerHTML=rows.length?rows.map(x=>'<div class="schema-summary-row"><span><strong>'+esc(x.field.label)+'</strong><small>'+esc(x.source)+'</small></span><small>'+esc(x.field.category)+'</small><small>'+esc(TYPE_LABELS[x.field.type]||x.field.type)+'</small></div>').join(''):'<div class="emptybox">No fields mapped.</div>';
  $('transactionConfigNotice').hidden=state.datasetType!=='transaction';
  $('rapidHours').closest('label').hidden=state.datasetType!=='transaction';
  $('rapidRatio').closest('label').hidden=state.datasetType!=='transaction';
  $('structuringReference').closest('label').hidden=state.datasetType!=='transaction';
  $('structuringBand').closest('label').hidden=state.datasetType!=='transaction';
  $('structuringCount').closest('label').hidden=state.datasetType!=='transaction';
}

function parseAmountInfo(v){
  if(v===null||v===undefined||String(v).trim()==='')return{amount:0,signed:0,signHint:'',explicitSign:false};
  if(typeof v==='number'){
    if(!Number.isFinite(v))return{amount:0,signed:0,signHint:'',explicitSign:false};
    return{amount:Math.abs(v),signed:v,signHint:v<0?'outflow':'',explicitSign:v<0};
  }
  const original=String(v).trim();
  const textDirection=detectTextDirectionInAmount(original);
  const paren=/^\(.*\)$/.test(original);
  const explicitPlus=/^\s*\+/.test(original);
  const explicitMinus=/^\s*-/.test(original)||paren;
  let cleaned=original.replace(/[(),]/g,'').replace(/[^0-9.+\-]/g,'');
  const n=Number(cleaned);
  if(!Number.isFinite(n))return{amount:0,signed:0,signHint:'',explicitSign:false};
  const signed=paren?-Math.abs(n):n;
  return{amount:Math.abs(signed),signed,signHint:textDirection||(explicitMinus||signed<0?'outflow':explicitPlus?'inflow':''),explicitSign:explicitMinus||explicitPlus||!!textDirection};
}
function parseAmount(v){return parseAmountInfo(v).amount;}
function parseDate(v){
  if(v instanceof Date&&!isNaN(v))return v;
  const s=String(v==null?'':v).trim();if(!s)return null;
  const dm=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if(dm){let y=Number(dm[3]);if(y<100)y+=2000;const d=new Date(y,Number(dm[2])-1,Number(dm[1]),Number(dm[4]||0),Number(dm[5]||0),Number(dm[6]||0));return isNaN(d)?null:d;}
  const d=new Date(s);return isNaN(d)?null:d;
}

const DESC_GENERIC=/\b(nip|neft|rtgs|transfer|trf|payment|pay|credit|debit|mobile|internet|online|web|banking|session|reference|ref|txn|transaction|narration|remark|remarks|pos|atm|ussd|cash|deposit|withdrawal|fee|charge|vat|stamp|duty|beneficiary|originator|sender|receiver|recipient|payer|payee|from|to|via|cr|dr)\b/ig;
const BANK_WORDS=new Set([
  'GTB','GTBANK','UBA','FBN','FIRSTBANK','ACCESS','ZENITH','FCMB','FIDELITY','POLARIS','WEMA','KEYSTONE','UNION','ECOBANK','STERLING','STANBIC','IBTC','JAIZ','TAJ','LOTUS','PROVIDUS','OPTIMUS','GLOBUS','PREMIUMTRUST',
  'BANK','MFB','MICROFINANCE','PSB','PAYSTACK','FLUTTERWAVE','MONIEPOINT','OPAY','PALMPAY','KUDA'
]);
const LEGAL_ENTITY_RX=/\b(ltd|limited|plc|llc|inc|incorporated|enterprises?|enterprise|ventures?|venture|services?|service|solutions?|solution|logistics?|global|trading|projects?|project|resources?|resource|holdings?|holding|foundation|association|cooperative|co-op|company|companies|group|industries|industry|international|investment|investments|consulting|consultancy|technologies|technology|systems?|system|stores?|store|mart|supermarket|pharmacy|hospital|clinic|school|academy|university|college|ministry|department|agency|commission|authority|secretariat|hotel|restaurant|foods?|farm|farms|energy|oil|gas|construction|properties|property|estate|estates)\b/i;
const MERCHANT_RX=/\b(shoprite|merchant|store|mart|supermarket|pharmacy|hotel|restaurant|foods?|airline|transport|fuel|petrol|station|market)\b/i;
const COMPACT_ENTITY_SUFFIX_RX=/(LIMITED|LTD|PLC|LLC|INC|ENTERPRISES?|VENTURES?|SERVICES?|SOLUTIONS?|LOGISTICS?|TRADING|PROJECTS?|RESOURCES?|HOLDINGS?|FOUNDATION|COMPANY|GROUP|INDUSTRIES|INVESTMENTS?|TECHNOLOGIES|SYSTEMS?|STORES?|SUPERMARKET|PHARMACY|HOTEL|RESTAURANT|FOODS?|FARMS?|ENERGY|CONSTRUCTION|PROPERTIES|ESTATES)$/i;
const PERSON_TITLE_RX=/^(mr|mrs|miss|ms|dr|prof|alhaji|hajiya|mallam|engr|chief|barr|pastor|imam)\.?\s+/i;

function cleanDescription(v){
  return String(v==null?'':v)
    .replace(/[\u0000-\u001F\u007F]/g,' ')
    .replace(/[_*#~]+/g,' ')
    .replace(/[\\]+/g,'/')
    .replace(/\s+/g,' ')
    .trim();
}
function titleCaseEntity(v){
  const s=String(v||'').trim();
  if(!s)return'';
  if(/[a-z]/.test(s))return s.replace(/\b([a-z])/g,m=>m.toUpperCase());
  return s.toLowerCase().replace(/\b[a-z]/g,m=>m.toUpperCase()).replace(/\b(Ltd|Plc|Llc|Inc)\b/g,m=>m.toUpperCase());
}
function stripNoiseTokens(v){
  let s=String(v||'')
    .replace(/\b(?:ref(?:erence)?|session|txn|transaction|trace|rrn|stan|tid|terminal|batch|seq|sequence|id)\s*[:#\-]?\s*[A-Z0-9\-]{3,}\b/ig,' ')
    .replace(/\b(?:acct?|account|a\/c)\s*[:#\-]?\s*\d{6,18}\b/ig,' ')
    .replace(/\b\d{6,18}\b/g,' ')
    .replace(/\b[A-F0-9]{18,}\b/ig,' ')
    .replace(DESC_GENERIC,' ')
    .replace(/[()[\]{}]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
  const parts=s.split(/\s+/).filter(Boolean).filter(t=>!BANK_WORDS.has(t.toUpperCase()));
  return parts.join(' ').replace(/^[\-\/|:,.]+|[\-\/|:,.]+$/g,'').trim();
}
function classifyEntityName(name,context=''){
  const n=String(name||'').trim(),ctx=String(context||'');
  if(!n)return'unknown';
  if(LEGAL_ENTITY_RX.test(n)||COMPACT_ENTITY_SUFFIX_RX.test(n.replace(/\s+/g,'')))return MERCHANT_RX.test(n+' '+ctx)?'merchant':'company / organisation';
  if(MERCHANT_RX.test(n+' '+ctx))return'merchant';
  if(/\b(bank|mfb|microfinance|psb)\b/i.test(n+' '+ctx))return'financial institution';
  const words=n.replace(PERSON_TITLE_RX,'').split(/\s+/).filter(Boolean);
  if(words.length>=2&&words.length<=6&&!/\d/.test(n))return'person / name';
  if(words.length===1&&n.length>=7&&!/\d/.test(n))return'possible compressed name / entity';
  return'other entity';
}
function entityConfidence(name,source,context=''){
  let score=0;
  const n=String(name||'').trim();
  if(source==='explicit')score+=45;
  if(source==='segment')score+=25;
  if(LEGAL_ENTITY_RX.test(n)||COMPACT_ENTITY_SUFFIX_RX.test(n.replace(/\s+/g,'')))score+=25;
  const words=n.replace(PERSON_TITLE_RX,'').split(/\s+/).filter(Boolean);
  if(words.length>=2&&words.length<=6)score+=20;
  if(n.length>=6)score+=10;
  if(/\d/.test(n))score-=25;
  if(BANK_WORDS.has(n.toUpperCase()))score-=40;
  if(/^(transfer|payment|credit|debit|unknown|cash|nip|neft|rtgs|pos|atm|ussd)$/i.test(n))score-=40;
  if(/\b(from|to|sender|recipient|beneficiary|originator)\b/i.test(context))score+=5;
  return Math.max(0,Math.min(100,score));
}
function addEntityCandidate(list,value,role,source,context){
  const cleaned=stripNoiseTokens(value);
  if(!cleaned||cleaned.length<3)return;
  if(/^[A-Z]{2,6}$/i.test(cleaned)&&BANK_WORDS.has(cleaned.toUpperCase()))return;
  if(/^\d+$/.test(cleaned))return;
  const name=titleCaseEntity(cleaned);
  const confidence=entityConfidence(name,source,context);
  if(confidence<35)return;
  const type=classifyEntityName(name,context);
  const key=norm(name)+'|'+role;
  const existing=list.find(x=>norm(x.name)+'|'+x.role===key);
  if(existing){existing.confidence=Math.max(existing.confidence,confidence);return;}
  list.push({name,type,role,confidence,source});
}
function extractEntitiesFromDescription(text){
  const clean=cleanDescription(text),entities=[];
  if(!clean)return entities;

  const explicitPatterns=[
    {role:'originator',rx:/(?:^|[\s\/|;:,-])(?:from|sender|originator|payer)\s*[:\-\/]?\s*([^\/|;:]{3,80})/ig},
    {role:'beneficiary',rx:/(?:^|[\s\/|;:,-])(?:to|beneficiary|recipient|receiver|payee)\s*[:\-\/]?\s*([^\/|;:]{3,80})/ig}
  ];
  explicitPatterns.forEach(p=>{
    let m;
    while((m=p.rx.exec(clean))){
      let value=m[1].split(/\s+(?:ref|reference|acct|account|bank|via|on|session|txn|rrn)\b/i)[0];
      addEntityCandidate(entities,value,p.role,'explicit',m[0]);
    }
  });

  const segments=clean.split(/[\/|;:]+|\s+-\s+/).map(s=>s.trim()).filter(Boolean);
  segments.forEach((seg,idx)=>{
    const upper=seg.toUpperCase();
    if(BANK_WORDS.has(upper))return;
    if(/^(CR|DR|NIP|NEFT|RTGS|POS|ATM|USSD|WEB|MOBILE|TRANSFER|TRF|PAYMENT|CREDIT|DEBIT)$/i.test(seg))return;
    if(/^(?:REF|RRN|STAN|SESSION|TXN|TID)[A-Z0-9\-]*$/i.test(seg))return;
    if(/^\+?\d{6,18}$/.test(seg))return;
    const cleaned=stripNoiseTokens(seg);
    if(!cleaned)return;
    const role=/\b(from|sender|originator|payer)\b/i.test(segments[Math.max(0,idx-1)]||'')?'originator':
      /\b(to|beneficiary|recipient|receiver|payee)\b/i.test(segments[Math.max(0,idx-1)]||'')?'beneficiary':'unknown';
    addEntityCandidate(entities,cleaned,role,'segment',seg);
  });

  entities.sort((a,b)=>b.confidence-a.confidence);
  return entities;
}
function chooseCounterpartyEntity(entities,directionHint){
  if(!entities.length)return null;
  const preferredRole=directionHint==='inflow'?'originator':directionHint==='outflow'?'beneficiary':'';
  return entities.find(e=>e.role===preferredRole)||entities.find(e=>e.role!=='unknown')||entities[0];
}
function probableNameCandidate(text,directionHint=''){
  return chooseCounterpartyEntity(extractEntitiesFromDescription(text),directionHint)?.name||'';
}
function extractDescriptionMeaning(value){
  const original=String(value==null?'':value),clean=cleanDescription(original);
  if(!clean)return{clean:'',category:'Unclassified',channel:'',counterparty:'',counterpartyType:'',entities:[],account:'',phone:'',email:'',wallet:'',directionHint:'',meaning:'No description',confidence:'low'};
  const email=(clean.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)||[])[0]||'';
  const phone=(clean.match(/(?:\+?234|0)(?:70|80|81|90|91)\d{8}\b/)||[])[0]||'';
  const eth=(clean.match(/\b0x[a-fA-F0-9]{40}\b/)||[])[0]||'';
  const btc=(clean.match(/\b(?:bc1[a-zA-HJ-NP-Z0-9]{20,}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/)||[])[0]||'';
  const wallet=eth||btc;
  const account=(clean.match(/\b\d{10,16}\b/g)||[]).find(x=>x!==phone.replace(/\D/g,''))||'';
  const channels=[
    ['NIP',/\bnip\b/i],['NEFT',/\bneft\b/i],['RTGS',/\brtgs\b/i],['POS',/\bpos\b|point of sale/i],
    ['ATM',/\batm\b/i],['USSD',/\bussd\b/i],['Mobile Banking',/mobile (?:app|banking)|\bmob\b/i],
    ['Internet Banking',/internet banking|web banking|\bweb\b/i],['Cash',/\bcash\b/i],['Card',/\bcard\b/i]
  ];
  const channel=(channels.find(x=>x[1].test(clean))||[])[0]||'';
  const categories=[
    ['Salary / Payroll',/\bsalary\b|\bpayroll\b|\bwages?\b/i],
    ['Loan / Credit',/\bloan\b|\bcredit facility\b|\brepayment\b/i],
    ['Crypto / VASP',/\bcrypto\b|\bbitcoin\b|\bbtc\b|\bethereum\b|\beth\b|\busdt\b|\busdc\b|\bbinance\b|\bbybit\b|\bkucoin\b|\bokx\b|\bcoinbase\b|\bvasp\b/i],
    ['Cash Withdrawal',/\bcash withdrawal\b|\bwithdrawal\b/i],
    ['Cash Deposit',/\bcash deposit\b|\bdeposit\b/i],
    ['POS / Merchant Purchase',/\bpos\b|\bmerchant\b|\bpurchase\b|\bcard payment\b/i],
    ['ATM',/\batm\b/i],
    ['Bill / Utility Payment',/\bbill\b|\butility\b|\belectricity\b|\bwater\b|\bdstv\b|\bgotv\b/i],
    ['Airtime / Data',/\bairtime\b|\bdata bundle\b|\bdata purchase\b/i],
    ['Bank Fee / Charge',/\bfee\b|\bcharge\b|\bvat\b|\bstamp duty\b|\bcommission\b/i],
    ['Tax / Government Payment',/\btax\b|\bfirs\b|\bremita\b|\bgovernment\b/i],
    ['Refund / Reversal',/\brefund\b|\breversal\b|\breversed\b/i],
    ['Transfer',/\btransfer\b|\btrf\b|\bnip\b|\bneft\b|\brtgs\b/i]
  ];
  const category=(categories.find(x=>x[1].test(clean))||[])[0]||'Other / Unclassified';

  let inScore=0,outScore=0;
  if(/\b(from|received|receipt|credit|credited|deposit|inflow|salary|\bcr\b)\b/i.test(clean))inScore+=2;
  if(/\b(to|sent|debit|debited|payment|purchase|withdrawal|outflow|fee|charge|\bdr\b)\b/i.test(clean))outScore+=2;
  if(/\brefund received\b/i.test(clean))inScore+=2;
  const directionHint=inScore>outScore?'inflow':outScore>inScore?'outflow':'';

  const entities=extractEntitiesFromDescription(clean);
  const selected=chooseCounterpartyEntity(entities,directionHint);
  const counterparty=selected?.name||'';
  const counterpartyType=selected?.type||'';

  const pieces=[category];
  if(channel)pieces.push(channel);
  if(counterparty)pieces.push((counterpartyType||'Entity')+': '+counterparty);
  if(entities.length>1)pieces.push(entities.length+' entity candidates');
  if(account)pieces.push('Account-like ID: '+account);
  if(wallet)pieces.push('Wallet detected');
  if(email)pieces.push('Email detected');
  if(phone)pieces.push('Phone detected');

  const topConfidence=selected?.confidence||0;
  const confidence=topConfidence>=75?'high':topConfidence>=50||channel||category!=='Other / Unclassified'?'medium':'low';
  return{clean,category,channel,counterparty,counterpartyType,counterpartyConfidence:selected?.confidence||0,entities,account,phone,email,wallet,directionHint,meaning:pieces.join(' • '),confidence};
}
function direction(raw,o,b,subject,debit,credit,amountInfo,sheetHint,desc){
  if(credit>0&&debit>0)return'unknown';
  if(credit>0&&debit<=0)return'inflow';
  if(debit>0&&credit<=0)return'outflow';
  const d=norm(raw).replace(/[^a-z]/g,'');
  if(/^(credit|cr|inflow|deposit|incoming)$/.test(d))return'inflow';
  if(/^(debit|dr|outflow|withdrawal|outgoing)$/.test(d))return'outflow';
  if(sheetHint==='inflow'||sheetHint==='outflow')return sheetHint;
  if(amountInfo?.signHint)return amountInfo.signHint;
  if(desc?.directionHint)return desc.directionHint;
  const s=norm(subject);
  if(s){if(norm(b).includes(s)&&!norm(o).includes(s))return'inflow';if(norm(o).includes(s)&&!norm(b).includes(s))return'outflow';}
  return'unknown';
}

function standardize(){
  const subject=$('subjectName').value.trim();
  const mappingEntries=Object.entries(state.sourceMapping).filter(([,fid])=>!!fid);
  const descriptionCache=new Map();
  return state.rawRows.map((raw,i)=>{
    const values={};
    for(const [source,fid] of mappingEntries){
      const incoming=raw[source]??'';
      const current=values[fid];
      if(current===undefined||String(current).trim()===''||String(incoming).trim()!=='')values[fid]=incoming;
    }
    const debit=parseAmount(values.debit),credit=parseAmount(values.credit),amountInfo=parseAmountInfo(values.amount);
    const amount=values.amount!==undefined&&String(values.amount).trim()!==''?amountInfo.amount:Math.max(debit,credit);
    const explicitOriginator=String(values.originator??'').trim(),explicitBeneficiary=String(values.beneficiary??'').trim();
    const sharedCounterparty=String(values.counterparty??'').trim();
    const narration=String(values.narration??'').trim();
    let extracted=descriptionCache.get(narration);
    if(!extracted){
      extracted=extractDescriptionMeaning(narration);
      if(descriptionCache.size<10000)descriptionCache.set(narration,extracted);
    }
    const sheet=String(raw.__finintel_sheet??'');
    const sheetChoice=state.sheetDirections[sheet]||'auto';
    if(sheetChoice==='ignore')return null;
    const sheetHint=sheetChoice==='auto'?String(raw.__finintel_sheet_direction??''):sheetChoice;
    const flow=state.datasetType==='transaction'?direction(values.direction,explicitOriginator,explicitBeneficiary,subject,debit,credit,amountInfo,sheetHint,extracted):'n/a';
    let originator=explicitOriginator,beneficiary=explicitBeneficiary;
    let counterpartyFromDescription=false;
    if(sharedCounterparty){
      if(flow==='inflow'&&!originator)originator=sharedCounterparty;
      if(flow==='outflow'&&!beneficiary)beneficiary=sharedCounterparty;
    }
    if(extracted.counterparty){
      if(flow==='inflow'&&!originator){originator=extracted.counterparty;counterpartyFromDescription=true;}
      if(flow==='outflow'&&!beneficiary){beneficiary=extracted.counterparty;counterpartyFromDescription=true;}
    }

    const dateRaw=String(values.date??'');
    const resolutionKey=resolutionKeyParts(state.sourceName,sheet,i+2,dateRaw,amount,flow,narration);
    const resolution=getCounterpartyResolutionByKey(resolutionKey);
    const preResolutionOriginator=originator,preResolutionBeneficiary=beneficiary;
    let counterpartyResolutionApplied=false,counterpartyResolutionIgnored=false;
    if(resolution){
      if(resolution.ignored){
        counterpartyResolutionIgnored=true;
      }else if(resolution.name){
        if(flow==='inflow'&&!originator){originator=String(resolution.name).trim();counterpartyResolutionApplied=true;}
        if(flow==='outflow'&&!beneficiary){beneficiary=String(resolution.name).trim();counterpartyResolutionApplied=true;}
      }
    }

    const originalOriginator=originator,originalBeneficiary=beneficiary;
    originator=resolveAlias(originator);
    beneficiary=resolveAlias(beneficiary);
    return{
      row:i+2,values,raw,date:parseDate(values.date),dateRaw,amount,direction:flow,
      originator,beneficiary,narration,account:String(values.account??values.wallet??'').trim(),
      txid:String(values.txid??'').trim(),sheet,sheetHint,extracted,counterpartyFromDescription,
      resolutionKey,counterpartyResolutionApplied,counterpartyResolutionIgnored,
      resolutionName:resolution?.name||'',resolutionUpdatedAt:resolution?.updatedAt||'',
      preResolutionOriginator,preResolutionBeneficiary,
      originalOriginator,originalBeneficiary,
      aliasAppliedOriginator:!!originalOriginator&&norm(originalOriginator)!==norm(originator),
      aliasAppliedBeneficiary:!!originalBeneficiary&&norm(originalBeneficiary)!==norm(beneficiary)
    };
  }).filter(Boolean);
}

const sum=(a,f=x=>x)=>a.reduce((n,x)=>n+(Number(f(x))||0),0);
function group(txs,dir){
  const m=new Map();
  txs.filter(t=>t.direction===dir).forEach(t=>{
    const name=(dir==='inflow'?t.originator:t.beneficiary)||'Unknown counterparty',k=norm(name)||'unknown';
    if(!m.has(k))m.set(k,{name,count:0,total:0,first:null,last:null});
    const x=m.get(k);x.count++;x.total+=t.amount;
    if(t.date){
      if(!x.first||t.date<x.first)x.first=t.date;
      if(!x.last||t.date>x.last)x.last=t.date;
    }
  });
  return Array.from(m.values()).sort((a,b)=>b.total-a.total);
}
function rapidMoves(txs,hours,ratio){
  const ins=txs.filter(t=>t.direction==='inflow'&&t.date);
  const outs=txs.filter(t=>t.direction==='outflow'&&t.date);
  const hits=[],ms=hours*3600000;
  let left=0,right=0,running=0;
  for(const out of outs){
    while(right<ins.length&&ins[right].date<=out.date){
      running+=ins[right].amount;
      right++;
    }
    const cutoff=out.date-ms;
    while(left<right&&ins[left].date<cutoff){
      running-=ins[left].amount;
      left++;
    }
    if(running<=0)continue;
    const movedRatio=out.amount/running*100;
    if(movedRatio>=ratio){
      hits.push({
        out,
        recentCount:right-left,
        incoming:running,
        ratio:movedRatio,
        minutes:(out.date-(ins[left]?.date||out.date))/60000
      });
    }
  }
  return hits;
}
function structuring(txs,ref,band,min){
  if(!ref)return[];
  const low=ref*(1-band/100);
  const c=txs.filter(t=>t.amount>=low&&t.amount<=ref&&t.date).sort((a,b)=>a.date-b.date);
  const groups=[];
  let right=0;
  for(let i=0;i<c.length;i++){
    if(right<i+1)right=i+1;
    const cutoff=c[i].date.getTime()+7*86400000;
    while(right<c.length&&c[right].date.getTime()<=cutoff)right++;
    if(right-i>=min){
      groups.push(c.slice(i,right));
      i=right-1;
    }
  }
  return groups;
}
function fmt(n,c){
  try{return new Intl.NumberFormat('en-NG',{style:'currency',currency:c||'NGN',maximumFractionDigits:2}).format(Number(n)||0);}
  catch{return(c||'')+' '+(Number(n)||0).toLocaleString();}
}
function fmtDate(d){return d?new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(d):'Unknown';}

function buildFieldProfiles(records){
  return mappedFields().map(({source,field})=>{
    const vals=records.map(r=>String(r.values[field.id]??'').trim()).filter(Boolean);
    const counts=new Map();
    vals.forEach(v=>{const k=norm(v);if(k)counts.set(k,{value:v,count:(counts.get(k)?.count||0)+1});});
    const sorted=[...counts.values()].sort((a,b)=>b.count-a.count);
    const repeated=sorted.filter(x=>x.count>1);
    return{
      source,field,
      nonEmpty:vals.length,
      completeness:records.length?vals.length/records.length*100:0,
      unique:counts.size,
      repeatedValues:repeated.length,
      topRepeated:repeated[0]||null
    };
  });
}

function aggregateDescriptionField(records,selector){
  const m=new Map();
  records.forEach(r=>{
    const value=selector(r);if(!value)return;
    const k=norm(value);if(!k)return;
    if(!m.has(k))m.set(k,{name:value,count:0,total:0});
    const x=m.get(k);x.count++;x.total+=r.amount||0;
  });
  return [...m.values()].sort((a,b)=>b.count-a.count||b.total-a.total);
}
function aggregateExtractedEntities(records){
  const m=new Map();
  records.forEach(r=>(r.extracted?.entities||[]).forEach(e=>{
    const key=norm(e.name)+'|'+e.type;
    if(!m.has(key))m.set(key,{name:e.name,type:e.type,count:0,total:0,maxConfidence:0,roles:new Set()});
    const x=m.get(key);x.count++;x.total+=r.amount||0;x.maxConfidence=Math.max(x.maxConfidence,e.confidence||0);x.roles.add(e.role||'unknown');
  }));
  return [...m.values()].map(x=>({...x,roles:[...x.roles]})).sort((a,b)=>b.count-a.count||b.total-a.total);
}
function buildDescriptionIntelligence(records){
  const parsed=records.filter(r=>r.narration);
  const withCounterparty=records.filter(r=>r.extracted?.counterparty);
  const fallbackUsed=records.filter(r=>r.counterpartyFromDescription);
  const identifiers=records.filter(r=>r.extracted&&(r.extracted.account||r.extracted.phone||r.extracted.email||r.extracted.wallet));
  const entities=aggregateExtractedEntities(records);
  return{
    parsed:parsed.length,
    withCounterparty:withCounterparty.length,
    fallbackUsed:fallbackUsed.length,
    identifiers:identifiers.length,
    entityCandidates:entities.length,
    categories:aggregateDescriptionField(parsed,r=>r.extracted?.category&&r.extracted.category!=='Other / Unclassified'?r.extracted.category:''),
    channels:aggregateDescriptionField(parsed,r=>r.extracted?.channel),
    counterparties:aggregateDescriptionField(withCounterparty,r=>r.extracted?.counterparty),
    entities
  };
}

function isUnknownCounterpartyRecord(r,includeAcknowledged=false){
  if(!r||!(r.direction==='inflow'||r.direction==='outflow'))return false;
  if(!includeAcknowledged&&r.counterpartyResolutionIgnored)return false;
  return r.direction==='inflow'?!String(r.originator||'').trim():!String(r.beneficiary||'').trim();
}
function resolutionCandidates(r){
  const out=[],seen=new Set();
  const add=(name,type='',confidence=0)=>{
    const value=String(name||'').trim(),key=norm(value);
    if(!key||seen.has(key))return;
    seen.add(key);out.push({name:value,type:type||'entity',confidence:Number(confidence)||0});
  };
  (r.extracted?.entities||[]).forEach(e=>add(e.name,e.type,e.confidence));
  if(r.extracted?.counterparty)add(r.extracted.counterparty,r.extracted.counterpartyType,r.extracted.counterpartyConfidence);
  return out.sort((a,b)=>b.confidence-a.confidence||a.name.localeCompare(b.name));
}
function buildDataQuality(records){
  const issues=[];
  const add=(id,title,severity,description,rows)=>issues.push({id,title,severity,description,rows});

  const missingDate=records.filter(r=>!String(r.dateRaw||'').trim());
  const invalidDate=records.filter(r=>String(r.dateRaw||'').trim()&&!r.date);
  const missingAmount=records.filter(r=>
    !String(r.values?.amount??'').trim()&&!String(r.values?.debit??'').trim()&&!String(r.values?.credit??'').trim()
  );
  const zeroAmount=records.filter(r=>!missingAmount.includes(r)&&!(Number(r.amount)>0));
  const bothDebitCredit=records.filter(r=>parseAmount(r.values?.debit)>0&&parseAmount(r.values?.credit)>0);
  const unknownDirection=records.filter(r=>r.direction==='unknown');
  const missingParty=records.filter(r=>isUnknownCounterpartyRecord(r,false));
  const acknowledgedUnknown=records.filter(r=>isUnknownCounterpartyRecord(r,true)&&r.counterpartyResolutionIgnored);
  const missingNarration=sourceForField('narration')?records.filter(r=>!String(r.narration||'').trim()):[];

  const explicitDirection=r=>{
    const d=norm(r.values?.direction).replace(/[^a-z]/g,'');
    if(/^(credit|cr|inflow|deposit|incoming)$/.test(d))return'inflow';
    if(/^(debit|dr|outflow|withdrawal|outgoing)$/.test(d))return'outflow';
    return'';
  };
  const directionConflict=records.filter(r=>{
    const e=explicitDirection(r);
    return e&&r.sheetHint&&(r.sheetHint==='inflow'||r.sheetHint==='outflow')&&e!==r.sheetHint;
  });

  const duplicateMap=new Map();
  records.forEach(r=>{
    const key=[
      norm(r.dateRaw),Number(r.amount)||0,r.direction,norm(r.originator),norm(r.beneficiary),
      norm(r.narration),norm(r.account),norm(r.txid)
    ].join('|');
    if(!duplicateMap.has(key))duplicateMap.set(key,[]);
    duplicateMap.get(key).push(r);
  });
  const duplicates=[...duplicateMap.values()].filter(g=>g.length>1).flat();

  add('missing-counterparty','Missing counterparties','high','Classified inflow/outflow records where the other party remains unresolved.',missingParty);
  add('unresolved-direction','Unresolved direction','high','Transactions that could not be reliably classified as inflow or outflow.',unknownDirection);
  add('duplicate-transactions','Potential duplicate transactions','medium','Records sharing the same core transaction attributes. Review before removing or consolidating.',duplicates);
  add('both-debit-credit','Debit and credit both populated','high','Rows where both debit and credit amounts are greater than zero.',bothDebitCredit);
  add('invalid-date','Invalid dates','medium','Date values were present but could not be parsed into valid dates.',invalidDate);
  add('missing-date','Missing dates','medium','No transaction date was supplied in the mapped date field.',missingDate);
  add('missing-amount','Missing amounts','high','No mapped Amount, Debit or Credit value was supplied.',missingAmount);
  add('zero-amount','Zero / unusable amounts','medium','A monetary field was present but produced no positive transaction amount.',zeroAmount);
  add('direction-conflict','Direction evidence conflict','medium','Explicit direction conflicts with the assigned worksheet direction.',directionConflict);
  if(sourceForField('narration'))add('missing-narration','Missing narrations','low','The narration/description field is mapped but blank for these records.',missingNarration);
  add('acknowledged-unknown','Acknowledged unknown counterparties','info','Analyst reviewed these records and intentionally retained the counterparty as unknown.',acknowledgedUnknown);

  const materialIssues=issues.filter(x=>x.severity!=='info');
  const affected=new Set();
  materialIssues.forEach(issue=>issue.rows.forEach(r=>affected.add(r.row+'|'+r.sheet)));
  const clean=Math.max(0,records.length-affected.size);
  const cleanRate=records.length?clean/records.length*100:100;
  return{
    issues,
    affectedRecords:affected.size,
    cleanRecords:clean,
    cleanRate,
    duplicateGroups:[...duplicateMap.values()].filter(g=>g.length>1).length,
    resolutionsApplied:records.filter(r=>r.counterpartyResolutionApplied).length,
    acknowledgedUnknown:acknowledgedUnknown.length
  };
}

function buildSupplementalPatterns(records,currency,origins,benefits){
  const dated=records.filter(r=>r.date).sort((a,b)=>a.date-b.date);
  const turnover=sum(records,r=>r.amount);
  const largest=records.reduce((m,r)=>!m||r.amount>m.amount?r:m,null);
  const largestShare=turnover&&largest?largest.amount/turnover*100:0;
  const round=records.filter(r=>r.amount>=10000&&Math.abs(r.amount%10000)<0.001);
  const roundRatio=records.length?round.length/records.length*100:0;
  const weekend=dated.filter(r=>r.date.getDay()===0||r.date.getDay()===6);
  const weekendValue=sum(weekend,r=>r.amount);
  const dayMap=new Map();
  for(const r of dated){
    const key=r.date.getFullYear()+'-'+String(r.date.getMonth()+1).padStart(2,'0')+'-'+String(r.date.getDate()).padStart(2,'0');
    if(!dayMap.has(key))dayMap.set(key,{date:new Date(r.date.getFullYear(),r.date.getMonth(),r.date.getDate()),count:0,total:0,in:0,out:0});
    const d=dayMap.get(key);d.count++;d.total+=r.amount;
    if(r.direction==='inflow')d.in+=r.amount;
    if(r.direction==='outflow')d.out+=r.amount;
  }
  const days=[...dayMap.values()];
  const peak=days.reduce((m,d)=>!m||d.count>m.count||(d.count===m.count&&d.total>m.total)?d:m,null);
  const sameDay=days.filter(d=>d.in>0&&d.out>0);
  let maxGapDays=0,gapStart=null,gapEnd=null;
  for(let i=1;i<dated.length;i++){
    const gap=(dated[i].date-dated[i-1].date)/86400000;
    if(gap>maxGapDays){maxGapDays=gap;gapStart=dated[i-1].date;gapEnd=dated[i].date;}
  }
  const topOrigin=origins[0]||null,topBenefit=benefits[0]||null;
  const originShare=topOrigin&&sum(origins,x=>x.total)?topOrigin.total/sum(origins,x=>x.total)*100:0;
  const benefitShare=topBenefit&&sum(benefits,x=>x.total)?topBenefit.total/sum(benefits,x=>x.total)*100:0;
  const topSide=originShare>=benefitShare
    ?{name:topOrigin?.name||'—',share:originShare,role:'originator'}
    :{name:topBenefit?.name||'—',share:benefitShare,role:'beneficiary'};
  const items=[
    {title:'Largest single transaction',value:largest?fmt(largest.amount,currency):'—',detail:largest?((largest.direction||'unknown')+' • '+fmtDate(largest.date)):'No transaction value available',tone:largestShare>=30?'high':'neutral'},
    {title:'Peak activity day',value:peak?peak.count+' tx':'—',detail:peak?(fmtDate(peak.date)+' • '+fmt(peak.total,currency)+' observed value'):'Date data unavailable',tone:peak&&peak.count>=15?'medium':'neutral'},
    {title:'Same-day inflow / outflow',value:sameDay.length+' day'+(sameDay.length===1?'':'s'),detail:sameDay.length?'Days containing both incoming and outgoing transactions':'No day contained both classified directions',tone:sameDay.length>=3?'medium':'neutral'},
    {title:'Round-number concentration',value:roundRatio.toFixed(1)+'%',detail:round.length+' of '+records.length+' transaction(s) were exact multiples of 10,000 currency units',tone:roundRatio>=50&&round.length>=5?'medium':'neutral'},
    {title:'Weekend activity',value:weekend.length+' tx',detail:weekend.length?fmt(weekendValue,currency)+' observed on Saturdays/Sundays':'No dated weekend transactions observed',tone:weekend.length?'info':'neutral'},
    {title:'Longest inactivity gap',value:maxGapDays?maxGapDays.toFixed(1)+' days':'—',detail:maxGapDays?(fmtDate(gapStart)+' → '+fmtDate(gapEnd)):'Insufficient dated transactions',tone:maxGapDays>=30?'info':'neutral'},
    {title:'Largest counterparty share',value:topSide.share.toFixed(1)+'%',detail:topSide.name+' • '+topSide.role,tone:topSide.share>=50?'medium':'neutral'}
  ];
  return{
    items,largest,largestShare,roundCount:round.length,roundRatio,weekendCount:weekend.length,
    sameDayFlowDays:sameDay.length,peakDayCount:peak?.count||0,maxGapDays,topCounterpartyShare:topSide.share
  };
}

function transactionAnalysis(records){
  const currency=($('currencyCode').value.trim()||'NGN').toUpperCase();
  const ins=records.filter(t=>t.direction==='inflow'),outs=records.filter(t=>t.direction==='outflow'),unknown=records.filter(t=>t.direction==='unknown');
  const totalIn=sum(ins,x=>x.amount),totalOut=sum(outs,x=>x.amount),origins=group(records,'inflow'),benefits=group(records,'outflow'),dated=records.filter(t=>t.date).sort((a,b)=>a.date-b.date);
  const rapid=rapidMoves(dated,Number($('rapidHours').value)||24,Number($('rapidRatio').value)||80);
  const structured=structuring(records,Number($('structuringReference').value)||0,Number($('structuringBand').value)||10,Number($('structuringCount').value)||3);
  const passRatio=totalIn?totalOut/totalIn*100:0,top5=sum(benefits.slice(0,5),x=>x.total),concentration=totalOut?top5/totalOut*100:0;
  const originMap=new Map(origins.map(x=>[norm(x.name),x]));
  const both=benefits.filter(x=>originMap.has(norm(x.name))&&norm(x.name)!=='unknown counterparty').map(x=>({name:x.name,out:x.total,in:originMap.get(norm(x.name)).total}));
  const cryptoRx=/\b(crypto|bitcoin|btc|ethereum|eth|usdt|usdc|binance|bybit|kucoin|okx|coinbase|wallet|vasp|virtual asset)\b/i;
  const cryptoTx=records.filter(t=>cryptoRx.test(Object.values(t.values).join(' ')+' '+(t.extracted?.clean||''))),cryptoExposure=sum(cryptoTx,x=>x.amount),alerts=[];
  const descriptionIntel=buildDescriptionIntelligence(records);
  const supplemental=buildSupplementalPatterns(records,currency,origins,benefits);
  const dataQuality=buildDataQuality(records);
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
  if(unknown.length)add('Unresolved transaction direction','low',3,unknown.length+' transaction(s) could not be classified as inflow or outflow.','Review mapping and subject identifier.');
  if(supplemental.sameDayFlowDays>=3)add('Repeated same-day inflow/outflow activity','medium',8,supplemental.sameDayFlowDays+' separate day(s) contained both classified inflow and outflow.','Review whether same-day onward movement is consistent with the account purpose.');
  if(supplemental.roundRatio>=50&&supplemental.roundCount>=5)add('High round-number transaction concentration','low',4,supplemental.roundRatio.toFixed(1)+'% of transactions were exact multiples of 10,000 currency units.','Round-number activity is contextual and should be compared with expected transaction behaviour.');
  if(supplemental.largestShare>=30&&records.length>=5)add('Single-transaction value concentration','medium',6,'The largest transaction represented '+supplemental.largestShare.toFixed(1)+'% of observed transaction value.','Largest transaction: '+fmt(supplemental.largest?.amount||0,currency)+'.');
  if(supplemental.peakDayCount>=15)add('High single-day transaction frequency','medium',6,'At least one day contained '+supplemental.peakDayCount+' transaction(s).','Review transaction velocity and business rationale for the peak day.');
  const riskScore=Math.min(100,sum(alerts,x=>x.score)),risk=riskScore>=60?'critical':riskScore>=40?'high':riskScore>=18?'medium':'low';
  return{kind:'transaction',currency,records,txs:records,ins,outs,unknown,totalIn,totalOut,net:totalIn-totalOut,origins,benefits,rapid,structured,passRatio,concentration,both,cryptoTx,cryptoExposure,descriptionIntel,supplemental,dataQuality,alerts,riskScore,risk,first:dated[0]?.date||null,last:dated[dated.length-1]?.date||null,profiles:buildFieldProfiles(records)};
}

function universalAnalysis(records){
  const profiles=buildFieldProfiles(records);
  const identifierTypes=new Set(['identifier','account','phone','email','wallet','ip','device','entity']);
  const repeatedSignals=profiles.filter(p=>identifierTypes.has(p.field.type)&&p.repeatedValues>0);
  const totalCells=records.length*profiles.length;
  const filled=sum(profiles,p=>p.nonEmpty);
  const completeness=totalCells?filled/totalCells*100:0;
  return{
    kind:'universal',records,profiles,
    mappedCount:profiles.length,
    completeness,
    repeatedSignals,
    risk:'low',riskScore:0,
    alerts:repeatedSignals.map(p=>({
      title:'Repeated '+p.field.label,
      severity:'low',
      detail:p.repeatedValues+' repeated value(s) were observed across records.',
      evidence:p.field.sensitivity==='highly-sensitive'?'Sensitive value hidden in profile view.':(p.topRepeated?'Most repeated value appeared '+p.topRepeated.count+' times.':'')
    }))
  };
}

function renderMetrics(a){
  let m;
  if(a.kind==='transaction'){
    m=[['Transactions',a.records.length.toLocaleString()],['Total Inflow',fmt(a.totalIn,a.currency)],['Total Outflow',fmt(a.totalOut,a.currency)],['Net Flow',fmt(a.net,a.currency)],['Originators',a.origins.length.toLocaleString()],['Beneficiaries',a.benefits.length.toLocaleString()],['Rapid-Movement Matches',a.rapid.length.toLocaleString()],['Crypto/VASP Exposure',fmt(a.cryptoExposure,a.currency)]];
  }else{
    m=[['Records',a.records.length.toLocaleString()],['Mapped Fields',a.mappedCount.toLocaleString()],['Completeness',a.completeness.toFixed(1)+'%'],['Repeated Identifier Signals',a.repeatedSignals.length.toLocaleString()]];
  }
  const metricClass=(label,value)=>{
    if(label==='Total Inflow'||label==='Originators')return'metric-inflow';
    if(label==='Total Outflow'||label==='Beneficiaries')return'metric-outflow';
    if(label==='Net Flow')return String(value).includes('-')?'metric-net-negative':'metric-net-positive';
    if(label==='Rapid-Movement Matches'||label==='Repeated Identifier Signals')return'metric-alert';
    if(label==='Crypto/VASP Exposure'||label==='Mapped Fields')return'metric-gold';
    if(label==='Completeness')return'metric-purple';
    return'metric-gold';
  };
  $('metricCards').innerHTML=m.map(x=>'<article class="card metric '+metricClass(x[0],x[1])+'"><div class="value">'+esc(x[1])+'</div><div class="label">'+esc(x[0])+'</div></article>').join('');
}

function profilePartyRecords(name){
  const a=state.analysis;
  if(!a||a.kind!=='transaction')return[];
  const key=norm(name);
  return a.records.filter(r=>
    (r.direction==='inflow'&&norm(r.originator)===key)||
    (r.direction==='outflow'&&norm(r.beneficiary)===key)
  );
}
function countedValues(values){
  const m=new Map();
  values.flat().filter(v=>String(v??'').trim()).forEach(v=>{
    const value=String(v).trim(),k=norm(value);
    if(!m.has(k))m.set(k,{value,count:0});
    m.get(k).count++;
  });
  return [...m.values()].sort((a,b)=>b.count-a.count||a.value.localeCompare(b.value));
}
function profileIdentifiers(records){
  return{
    aliases:countedValues(records.map(r=>{
      const arr=[];
      if(r.direction==='inflow'&&norm(r.originator)===norm(profilePartyName))arr.push(r.originalOriginator||r.originator);
      if(r.direction==='outflow'&&norm(r.beneficiary)===norm(profilePartyName))arr.push(r.originalBeneficiary||r.beneficiary);
      return arr;
    })),
    accounts:countedValues(records.map(r=>[r.extracted?.account||'',r.values?.account||''])),
    contacts:countedValues(records.map(r=>[r.extracted?.phone||'',r.extracted?.email||'',r.values?.phone||'',r.values?.email||''])),
    wallets:countedValues(records.map(r=>[r.extracted?.wallet||'',r.values?.wallet||'',r.txid||'']))
  };
}
function profileLinkedEntities(records,name){
  const m=new Map(),keyName=norm(name);
  records.forEach(r=>(r.extracted?.entities||[]).forEach(e=>{
    if(!e?.name||norm(e.name)===keyName)return;
    const k=norm(e.name);
    if(!m.has(k))m.set(k,{name:e.name,type:e.type||'entity',count:0,maxConfidence:0});
    const x=m.get(k);x.count++;x.maxConfidence=Math.max(x.maxConfidence,Number(e.confidence)||0);
  }));
  return [...m.values()].sort((a,b)=>b.count-a.count||b.maxConfidence-a.maxConfidence);
}
function meaningfulCategory(value){
  const v=String(value||'').trim();
  return v&&!/^(?:other\s*\/\s*)?unclassified$/i.test(v)&&!/^no description$/i.test(v)?v:'';
}
function profileNarrationMeaning(r){
  const raw=String(r.narration||'').trim();
  const clean=String(r.extracted?.clean||'').trim();
  const category=meaningfulCategory(r.extracted?.category);
  const channel=String(r.extracted?.channel||'').trim();
  const counterparty=String(r.extracted?.counterparty||'').trim();
  const pieces=[];
  if(category)pieces.push(category);
  if(channel&&!pieces.some(x=>norm(x)===norm(channel)))pieces.push(channel);
  if(counterparty&&norm(counterparty)!==norm(profilePartyName))pieces.push('Related entity: '+counterparty);
  if(!pieces.length&&r.extracted?.account)pieces.push('Account / ID: '+r.extracted.account);
  if(!pieces.length&&r.extracted?.wallet)pieces.push('Wallet / blockchain identifier detected');
  if(!pieces.length&&r.extracted?.email)pieces.push('Email identifier detected');
  if(!pieces.length&&r.extracted?.phone)pieces.push('Phone identifier detected');
  return{
    narration:raw||clean||'No narration mapped',
    meaning:pieces.join(' • ')
  };
}

function profileBehaviour(records){
  const m=new Map();
  const add=(kind,value,amount)=>{
    if(!value)return;
    const k=kind+'|'+norm(value);
    if(!m.has(k))m.set(k,{kind,value,count:0,total:0});
    const x=m.get(k);x.count++;x.total+=Number(amount)||0;
  };
  records.forEach(r=>{
    const category=meaningfulCategory(r.extracted?.category);
    if(category)add('Meaning',category,r.amount);
    add('Channel',r.extracted?.channel,r.amount);
  });
  return [...m.values()].sort((a,b)=>b.count-a.count||b.total-a.total);
}
function profileChipHtml(items,empty='None observed'){
  if(!items.length)return'<span class="profile-empty">'+esc(empty)+'</span>';
  return items.slice(0,30).map(x=>'<span class="profile-chip">'+esc(x.value)+(x.count>1?' <small>×'+x.count+'</small>':'')+'</span>').join('');
}
function profileFilteredRecords(){
  const records=profilePartyRecords(profilePartyName);
  const q=norm($('profileTransactionSearch')?.value||'');
  const dir=$('profileDirectionFilter')?.value||'all';
  return records.filter(r=>{
    if(dir!=='all'&&r.direction!==dir)return false;
    if(!q)return true;
    const hay=[
      r.dateRaw,fmtDate(r.date),r.amount,r.direction,r.originator,r.beneficiary,r.narration,r.sheet,
      r.extracted?.category,r.extracted?.channel,r.extracted?.account,r.extracted?.phone,
      r.extracted?.email,r.extracted?.wallet,r.txid,Object.values(r.values||{}).join(' ')
    ].join(' ');
    return norm(hay).includes(q);
  }).sort((a,b)=>(b.date?.getTime?.()||0)-(a.date?.getTime?.()||0)||b.row-a.row);
}
function renderProfilePagination(total){
  const el=$('profilePagination');if(!el)return;
  const pages=Math.max(1,Math.ceil(total/PROFILE_PAGE_SIZE));
  profilePage=Math.max(1,Math.min(profilePage,pages));
  const start=Math.max(1,profilePage-2),end=Math.min(pages,profilePage+2),buttons=[];
  buttons.push('<button class="btn ghost profile-page-btn" type="button" data-page="'+Math.max(1,profilePage-1)+'" '+(profilePage===1?'disabled':'')+'>Previous</button>');
  for(let p=start;p<=end;p++)buttons.push('<button class="btn '+(p===profilePage?'primary':'ghost')+' profile-page-btn" type="button" data-page="'+p+'">'+p+'</button>');
  buttons.push('<button class="btn ghost profile-page-btn" type="button" data-page="'+Math.min(pages,profilePage+1)+'" '+(profilePage===pages?'disabled':'')+'>Next</button>');
  el.innerHTML='<span class="page-summary">Page '+profilePage+' of '+pages+' • '+total.toLocaleString()+' record'+(total===1?'':'s')+'</span><div class="page-buttons">'+buttons.join('')+'</div>';
  $$('.profile-page-btn').forEach(btn=>btn.onclick=()=>{profilePage=Number(btn.dataset.page)||1;renderProfileTransactions();});
}
function renderProfileTransactions(){
  const a=state.analysis;if(!a||a.kind!=='transaction')return;
  const rows=profileFilteredRecords(),start=(profilePage-1)*PROFILE_PAGE_SIZE,page=rows.slice(start,start+PROFILE_PAGE_SIZE);
  $('profileTransactionCount').textContent=rows.length.toLocaleString()+' record'+(rows.length===1?'':'s');
  $('profileTransactionTable').innerHTML='<table><thead><tr><th>Date</th><th>Role</th><th class="num">Amount</th><th>Narration / Meaning</th><th>Identifiers</th><th>Source</th></tr></thead><tbody>'
    +(page.map(r=>{
      const role=r.direction==='inflow'?'Originator / Inflow':'Beneficiary / Outflow';
      const ids=[r.extracted?.account,r.extracted?.phone,r.extracted?.email,r.extracted?.wallet,r.txid].filter(Boolean);
      const nm=profileNarrationMeaning(r);
      return'<tr><td>'+esc(fmtDate(r.date)||r.dateRaw||'—')+'</td><td><span class="direction-badge '+esc(r.direction)+'">'+esc(role)+'</span></td><td class="num"><strong>'+esc(fmt(r.amount,a.currency))+'</strong></td><td><div class="profile-raw-narration">'+esc(nm.narration)+'</div>'+(nm.meaning?'<div class="profile-derived-meaning">'+esc(nm.meaning)+'</div>':'')+'</td><td>'+esc(ids.join(' • ')||'—')+'</td><td>'+esc(r.sheet||'—')+'<br><small>Row '+r.row+'</small></td></tr>';
    }).join('')||'<tr><td colspan="6">No transactions match the current profile filter.</td></tr>')
    +'</tbody></table>';
  renderProfilePagination(rows.length);
}
function renderCounterpartyProfile(){
  const a=state.analysis;if(!a||a.kind!=='transaction'||!profilePartyName)return;
  const records=profilePartyRecords(profilePartyName);
  if(!records.length)return;
  const ins=records.filter(r=>r.direction==='inflow'),outs=records.filter(r=>r.direction==='outflow');
  const inTotal=sum(ins,r=>r.amount),outTotal=sum(outs,r=>r.amount),total=inTotal+outTotal;
  const largest=records.reduce((m,r)=>!m||r.amount>m.amount?r:m,null);
  const dated=records.filter(r=>r.date).sort((x,y)=>x.date-y.date);
  const role=ins.length&&outs.length?'Both sides':ins.length?'Originator / Inflow':'Beneficiary / Outflow';
  $('profileCounterpartyName').textContent=profilePartyName;
  $('profileRoleBadge').textContent=role;
  $('profileRoleBadge').className='profile-role-badge '+(ins.length&&outs.length?'both':ins.length?'inflow':'outflow');
  $('profileSubtitle').textContent=records.length.toLocaleString()+' related transaction'+(records.length===1?'':'s')+' • '+(dated.length?(fmtDate(dated[0].date)+' to '+fmtDate(dated[dated.length-1].date)):'dates unavailable');

  const metrics=[
    ['Related transactions',records.length.toLocaleString(),'neutral'],
    ['Inflow from party',fmt(inTotal,a.currency),'inflow'],
    ['Outflow to party',fmt(outTotal,a.currency),'outflow'],
    ['Total observed value',fmt(total,a.currency),'gold'],
    ['Average transaction',fmt(records.length?total/records.length:0,a.currency),'neutral'],
    ['Largest transaction',largest?fmt(largest.amount,a.currency):'—','alert'],
    ['First activity',dated[0]?fmtDate(dated[0].date):'—','neutral'],
    ['Last activity',dated.length?fmtDate(dated[dated.length-1].date):'—','neutral']
  ];
  $('profileMetricGrid').innerHTML=metrics.map(x=>'<div class="profile-metric '+x[2]+'"><small>'+esc(x[0])+'</small><strong>'+esc(x[1])+'</strong></div>').join('');

  const ids=profileIdentifiers(records);
  $('profileAliasVariants').innerHTML=profileChipHtml(ids.aliases,'No alternate names observed');
  $('profileAccounts').innerHTML=profileChipHtml(ids.accounts,'No account/ID extracted');
  $('profileContacts').innerHTML=profileChipHtml(ids.contacts,'No phone/email extracted');
  $('profileWallets').innerHTML=profileChipHtml(ids.wallets,'No wallet/blockchain identifier extracted');

  const behaviour=profileBehaviour(records);
  $('profileBehaviourTable').innerHTML='<table><thead><tr><th>Type</th><th>Observed value</th><th class="num">Records</th><th class="num">Value</th></tr></thead><tbody>'
    +(behaviour.slice(0,20).map(x=>'<tr><td>'+esc(x.kind)+'</td><td>'+esc(x.value)+'</td><td class="num">'+x.count+'</td><td class="num">'+esc(fmt(x.total,a.currency))+'</td></tr>').join('')||'<tr><td colspan="4">No behaviour classifications available.</td></tr>')+'</tbody></table>';

  const linked=profileLinkedEntities(records,profilePartyName);
  $('profileLinkedEntities').innerHTML='<table><thead><tr><th>Entity</th><th>Classification</th><th class="num">Records</th><th class="num">Max confidence</th></tr></thead><tbody>'
    +(linked.slice(0,20).map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.type)+'</td><td class="num">'+x.count+'</td><td class="num">'+x.maxConfidence+'%</td></tr>').join('')||'<tr><td colspan="4">No additional extracted entities observed.</td></tr>')+'</tbody></table>';

  renderProfileTransactions();
}
function openCounterpartyProfile(name){
  if(!name||!state.analysis||state.analysis.kind!=='transaction')return;
  profilePartyName=name;profilePage=1;
  if($('profileTransactionSearch'))$('profileTransactionSearch').value='';
  if($('profileDirectionFilter'))$('profileDirectionFilter').value='all';
  renderCounterpartyProfile();
  const d=$('counterpartyProfileDialog');
  if(d&&!d.open)d.showModal();
}
function exportCounterpartyProfileCsv(){
  const a=state.analysis;if(!a||a.kind!=='transaction'||!profilePartyName)return;
  const rows=profilePartyRecords(profilePartyName);
  const head=['Date','Direction','Role','Amount','Originator','Beneficiary','Narration','Meaning','Channel','Account/ID','Phone','Email','Wallet','TXID','Sheet','Source Row'];
  const body=rows.map(r=>[
    fmtDate(r.date)||r.dateRaw,r.direction,r.direction==='inflow'?'Originator':'Beneficiary',r.amount,r.originator,r.beneficiary,r.narration,
    meaningfulCategory(r.extracted?.category)||'',r.extracted?.channel||'',r.extracted?.account||'',r.extracted?.phone||'',r.extracted?.email||'',r.extracted?.wallet||'',r.txid||'',r.sheet||'',r.row
  ].map(csvEscape).join(','));
  download('finintel_counterparty_'+slug(profilePartyName)+'.csv',[head.map(csvEscape).join(','),...body].join('\n'),'text/csv');
}

function renderDescriptionIntelligence(a){
  const d=a.descriptionIntel||{parsed:0,withCounterparty:0,fallbackUsed:0,identifiers:0,entityCandidates:0,categories:[],channels:[],counterparties:[],entities:[]};
  $('descriptionCoverage').textContent=d.parsed.toLocaleString()+' descriptions parsed';
  const metrics=[
    ['Descriptions Parsed',d.parsed.toLocaleString()],
    ['Entities Identified',(d.entityCandidates||0).toLocaleString()],
    ['Counterparties Extracted',d.withCounterparty.toLocaleString()],
    ['Used as Fallback Party',d.fallbackUsed.toLocaleString()]
  ];
  const descClasses=['metric-purple','metric-gold','metric-inflow','metric-outflow'];
  $('descriptionMetrics').innerHTML=metrics.map((x,i)=>'<article class="card metric '+descClasses[i%descClasses.length]+'"><div class="value">'+esc(x[1])+'</div><div class="label">'+esc(x[0])+'</div></article>').join('');
  const rows=[
    ...(d.entities||[]).slice(0,12).map(x=>({kind:'Entity',name:x.name,entityType:x.type,confidence:x.maxConfidence,count:x.count,total:x.total})),
    ...d.categories.slice(0,5).map(x=>({kind:'Meaning',name:x.name,entityType:'transaction meaning',confidence:'',count:x.count,total:x.total})),
    ...d.channels.slice(0,5).map(x=>({kind:'Channel',name:x.name,entityType:'payment channel',confidence:'',count:x.count,total:x.total}))
  ];
  $('descriptionIntelligenceTable').innerHTML='<table><thead><tr><th>Type</th><th>Extracted value</th><th>Classification</th><th>Confidence</th><th class="num">Records</th><th class="num">Observed value</th></tr></thead><tbody>'
    +(rows.map(x=>'<tr><td>'+esc(x.kind)+'</td><td class="description-derived">'+esc(x.name)+'</td><td>'+esc(x.entityType||'')+'</td><td>'+(x.confidence!==''?'<span class="confidence">'+esc(x.confidence+'%')+'</span>':'—')+'</td><td class="num">'+x.count+'</td><td class="num">'+esc(fmt(x.total,a.currency))+'</td></tr>').join('')||'<tr><td colspan="6">No meaningful description-derived patterns were extracted.</td></tr>')
    +'</tbody></table>';
}

function counterpartyControlPrefix(id){return id==='originatorTable'?'originator':'beneficiary';}
function filteredCounterpartyRows(id,rows,total){
  const p=counterpartyControlPrefix(id);
  const q=norm($(p+'Search')?.value||'');
  const minCount=Math.max(1,Number($(p+'MinCount')?.value)||1);
  const sort=$(p+'Sort')?.value||'total-desc';
  const filtered=rows.filter(r=>(!q||norm(r.name).includes(q))&&r.count>=minCount).map(r=>({...r,share:total?r.total/total*100:0}));
  const [field,order]=sort.split('-');
  filtered.sort((a,b)=>{
    let cmp=0;
    if(field==='name')cmp=String(a.name).localeCompare(String(b.name),undefined,{sensitivity:'base'});
    else cmp=(Number(a[field])||0)-(Number(b[field])||0);
    return order==='asc'?cmp:-cmp;
  });
  return filtered;
}
function renderCounterpartyPagination(prefix,totalRows){
  const el=$(prefix+'Pagination');if(!el)return;
  const totalPages=Math.max(1,Math.ceil(totalRows/COUNTERPARTY_PAGE_SIZE));
  counterpartyPage[prefix]=Math.max(1,Math.min(counterpartyPage[prefix]||1,totalPages));
  const current=counterpartyPage[prefix],buttons=[];
  const start=Math.max(1,current-2),end=Math.min(totalPages,current+2);
  buttons.push('<button class="btn ghost cp-page-btn" type="button" data-prefix="'+prefix+'" data-page="'+Math.max(1,current-1)+'" '+(current===1?'disabled':'')+'>Previous</button>');
  if(start>1){buttons.push('<button class="btn ghost cp-page-btn" type="button" data-prefix="'+prefix+'" data-page="1">1</button>');if(start>2)buttons.push('<span class="page-ellipsis">…</span>');}
  for(let p=start;p<=end;p++)buttons.push('<button class="btn '+(p===current?'primary':'ghost')+' cp-page-btn" type="button" data-prefix="'+prefix+'" data-page="'+p+'">'+p+'</button>');
  if(end<totalPages){if(end<totalPages-1)buttons.push('<span class="page-ellipsis">…</span>');buttons.push('<button class="btn ghost cp-page-btn" type="button" data-prefix="'+prefix+'" data-page="'+totalPages+'">'+totalPages+'</button>');}
  buttons.push('<button class="btn ghost cp-page-btn" type="button" data-prefix="'+prefix+'" data-page="'+Math.min(totalPages,current+1)+'" '+(current===totalPages?'disabled':'')+'>Next</button>');
  el.innerHTML='<span class="page-summary">Page '+current+' of '+totalPages+' • '+totalRows.toLocaleString()+' result'+(totalRows===1?'':'s')+'</span><div class="page-buttons">'+buttons.join('')+'</div>';
  $$('.cp-page-btn').forEach(btn=>btn.onclick=()=>{
    const p=btn.dataset.prefix;counterpartyPage[p]=Number(btn.dataset.page)||1;
    rerenderCounterpartyTables();
    const table=$(p+'Table');if(table)table.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
}
function renderCounterparty(id,rows,total,currency){
  const filtered=filteredCounterpartyRows(id,rows,total);
  const p=counterpartyControlPrefix(id);
  const max=Math.max(1,...filtered.map(r=>r.total));
  const totalPages=Math.max(1,Math.ceil(filtered.length/COUNTERPARTY_PAGE_SIZE));
  counterpartyPage[p]=Math.max(1,Math.min(counterpartyPage[p]||1,totalPages));
  const start=(counterpartyPage[p]-1)*COUNTERPARTY_PAGE_SIZE;
  const pageRows=filtered.slice(start,start+COUNTERPARTY_PAGE_SIZE);
  const filteredNames=filtered.map(r=>r.name);
  const selectedFiltered=filteredNames.filter(isCounterpartySelected).length;

  if($(p+'TableCount')){
    $(p+'TableCount').textContent=filtered.length.toLocaleString()+' match'+(filtered.length===1?'':'es')
      +' / '+rows.length.toLocaleString()
      +(selectedFiltered?' • '+selectedFiltered.toLocaleString()+' selected':'');
  }

  const allFilteredSelected=filtered.length>0&&selectedFiltered===filtered.length;
  const someFilteredSelected=selectedFiltered>0&&selectedFiltered<filtered.length;

  $(id).innerHTML='<table><thead><tr>'
    +'<th class="select-all-cell"><input class="counterparty-select-all" type="checkbox" data-prefix="'+p+'" aria-label="Select all '+p+' matches" title="Select all filtered/search matches" '+(allFilteredSelected?'checked':'')+'></th>'
    +'<th>#</th><th>Counterparty</th><th class="num">Count</th><th class="num">Total</th><th class="num">Share</th></tr></thead><tbody>'
    +(pageRows.map((r,i)=>{
      const saved=aliasEntry(r.name);
      const hit=(norm($(p+'Search')?.value||'')&&norm(r.name).includes(norm($(p+'Search')?.value||'')))?' counterparty-highlight':'';
      return '<tr class="'+hit.trim()+'"><td><input class="counterparty-select" type="checkbox" data-name="'+esc(r.name)+'" '+(isCounterpartySelected(r.name)?'checked':'')+' aria-label="Select '+esc(r.name)+' for alias mapping"></td><td>'+(start+i+1)+'</td><td class="counterparty-name-cell"><label><span><button class="counterparty-profile-link" type="button" data-counterparty="'+esc(r.name)+'">'+esc(r.name)+'</button>'+(saved?'<span class="alias-mapped-note">Saved mapping → '+esc(saved.canonical)+'</span>':'')+'<div class="bar"><span style="width:'+Math.min(100,r.total/max*100)+'%"></span></div></span></label></td><td class="num">'+r.count+'</td><td class="num">'+esc(fmt(r.total,currency))+'</td><td class="num">'+r.share.toFixed(1)+'%</td></tr>';
    }).join('')||'<tr><td colspan="6">No counterparties match the current filter.</td></tr>')
    +'</tbody></table>';

  const master=document.querySelector('#'+id+' .counterparty-select-all');
  if(master){
    master.indeterminate=someFilteredSelected;
    master.onchange=()=>{
      filteredNames.forEach(name=>setCounterpartySelected(name,master.checked));
      rerenderCounterpartyTables();
    };
  }

  document.querySelectorAll('#'+id+' .counterparty-select').forEach(box=>{
    box.onchange=()=>{
      setCounterpartySelected(box.dataset.name,box.checked);
      rerenderCounterpartyTables();
    };
  });

  renderCounterpartyPagination(p,filtered.length);
  document.querySelectorAll('#'+id+' .counterparty-profile-link').forEach(btn=>{
    btn.onclick=e=>{
      e.preventDefault();
      e.stopPropagation();
      openCounterpartyProfile(btn.dataset.counterparty);
    };
  });
}
function rerenderCounterpartyTables(){
  const a=state.analysis;
  if(!a||a.kind!=='transaction')return;
  renderCounterparty('originatorTable',a.origins,a.totalIn,a.currency);
  renderCounterparty('beneficiaryTable',a.benefits,a.totalOut,a.currency);
}

function renderSupplementalIndicators(a){
  const el=$('supplementalIndicators');if(!el)return;
  const items=a.supplemental?.items||[];
  el.innerHTML=items.length?items.map(x=>'<div class="pattern-indicator '+esc(x.tone||'neutral')+'"><div class="pattern-title">'+esc(x.title)+'</div><div class="pattern-value">'+esc(x.value)+'</div><div class="pattern-detail">'+esc(x.detail)+'</div></div>').join('')
    :'<div class="pattern-indicator neutral"><div class="pattern-title">No supplementary pattern data</div><div class="pattern-detail">The dataset did not contain enough classified transaction information.</div></div>';
}

function renderAlerts(a){
  $('alertsList').innerHTML=a.alerts.length?a.alerts.map(x=>'<div class="alert '+esc(x.severity)+'"><div class="alert-head"><strong>'+esc(x.title)+'</strong><small>'+esc(x.severity.toUpperCase())+'</small></div><p>'+esc(x.detail)+'</p><small>'+esc(x.evidence||'')+'</small></div>').join('')
    :'<div class="alert low"><div class="alert-head"><strong>No material rule-based indicators detected</strong><small>LOW</small></div><p>Continue case-specific review and verification.</p></div>';
}

function shortName(s,n){s=String(s||'Unknown');return s.length>n?s.slice(0,n-1)+'…':s;}
function shortMoney(n,c){const v=Number(n)||0;if(v>=1e9)return c+' '+(v/1e9).toFixed(2)+'bn';if(v>=1e6)return c+' '+(v/1e6).toFixed(2)+'m';if(v>=1e3)return c+' '+(v/1e3).toFixed(1)+'k';return c+' '+v.toFixed(0);}
function nodeDateRange(x){
  if(x.first&&x.last){
    if(x.first.toDateString()===x.last.toDateString())return fmtDate(x.first);
    return fmtDate(x.first)+' – '+fmtDate(x.last);
  }
  return 'Date unavailable';
}
function networkItem(role,name){
  const a=state.analysis;if(!a||a.kind!=='transaction')return null;
  const rows=role==='originator'?a.origins:a.benefits;
  return rows.find(x=>norm(x.name)===norm(name))||null;
}
function renderNodeFocusPanel(role,item){
  const panel=$('nodeFocusPanel');if(!panel)return;
  if(!item){panel.hidden=true;return;}
  const a=state.analysis;
  const total=role==='originator'?a.totalIn:a.totalOut;
  panel.hidden=false;
  $('nodeFocusRole').textContent=role==='originator'?'ORIGINATOR / INFLOW':'BENEFICIARY / OUTFLOW';
  $('nodeFocusName').textContent=item.name;
  $('nodeFocusAmount').textContent=fmt(item.total,a.currency);
  $('nodeFocusCount').textContent=item.count.toLocaleString();
  $('nodeFocusShare').textContent=(total?item.total/total*100:0).toFixed(1)+'%';
  $('nodeFocusDates').textContent=nodeDateRange(item);
}
function focusNetworkChild(role,name){
  const item=networkItem(role,name);if(!item)return;
  networkSelectedNode={role,name:item.name};
  renderNodeFocusPanel(role,item);
  $$('#networkView .network-child-node').forEach(el=>{
    const match=el.dataset.nodeRole===role&&norm(el.dataset.nodeName)===norm(item.name);
    el.classList.toggle('selected-node',match);
  });
}
function clearNetworkNodeFocus(){
  networkSelectedNode=null;
  if($('nodeFocusPanel'))$('nodeFocusPanel').hidden=true;
  $$('#networkView .network-child-node').forEach(el=>el.classList.remove('selected-node'));
}

function scrollNetworkTo(position){
  const view=$('networkView');if(!view)return;
  networkFocus=position==='left'?'left':position==='right'?'right':position==='selected'?'selected':'center';
  requestAnimationFrame(()=>{
    const canvas=view.querySelector('.network-canvas');
    const maxX=Math.max(0,view.scrollWidth-view.clientWidth);
    const key=networkFocus==='left'?'focusLeft':networkFocus==='right'?'focusRight':networkFocus==='selected'?'focusSelected':'focusCenter';
    const target=canvas?Number(canvas.dataset[key]||0):0;
    view.scrollLeft=Math.max(0,Math.min(maxX,target-(view.clientWidth/2)));
    if(networkFocus==='selected'&&canvas){
      const y=Number(canvas.dataset.focusSelectedY||0);
      view.scrollTop=Math.max(0,Math.min(Math.max(0,view.scrollHeight-view.clientHeight),y-(view.clientHeight/2)));
    }else{
      view.scrollTop=Math.max(0,(view.scrollHeight-view.clientHeight)/2);
    }
  });
}
function centerNetworkView(){scrollNetworkTo('center');}
function initNetworkPan(){
  const view=$('networkView');if(!view)return;
  let dragging=false,startX=0,startY=0,startLeft=0,startTop=0;
  view.onpointerdown=e=>{
    if(e.button!==0)return;
    dragging=true;startX=e.clientX;startY=e.clientY;startLeft=view.scrollLeft;startTop=view.scrollTop;
    view.classList.add('dragging');
    try{view.setPointerCapture(e.pointerId);}catch{}
    e.preventDefault();
  };
  view.onpointermove=e=>{
    if(!dragging)return;
    view.scrollLeft=startLeft-(e.clientX-startX);
    view.scrollTop=startTop-(e.clientY-startY);
  };
  const stop=e=>{
    if(!dragging)return;
    dragging=false;view.classList.remove('dragging');
    try{view.releasePointerCapture(e.pointerId);}catch{}
  };
  view.onpointerup=stop;view.onpointercancel=stop;view.onpointerleave=e=>{if(dragging&&e.buttons===0)stop(e);};
}
function captureNetworkViewport(){
  const view=$('networkView');
  if(!view||!view.scrollWidth||!view.scrollHeight)return{x:.5,y:.5};
  return{
    x:(view.scrollLeft+(view.clientWidth/2))/view.scrollWidth,
    y:(view.scrollTop+(view.clientHeight/2))/view.scrollHeight
  };
}
function restoreNetworkViewport(pos){
  const view=$('networkView');if(!view)return;
  requestAnimationFrame(()=>{
    view.scrollLeft=Math.max(0,Math.min(Math.max(0,view.scrollWidth-view.clientWidth),(pos.x*view.scrollWidth)-(view.clientWidth/2)));
    view.scrollTop=Math.max(0,Math.min(Math.max(0,view.scrollHeight-view.clientHeight),(pos.y*view.scrollHeight)-(view.clientHeight/2)));
  });
}
function setNetworkZoom(value){
  const viewport=captureNetworkViewport();
  networkZoom=Math.max(NETWORK_DEFAULT_ZOOM,Math.min(2.25,value));
  if($('networkZoomReset'))$('networkZoomReset').textContent=Math.round(networkZoom*100)+'%';
  if(state.analysis?.kind==='transaction'){
    renderNetwork(state.analysis,'preserve');
    restoreNetworkViewport(viewport);
  }
}
function networkYPositions(count,height){
  if(count<=1)return[height/2];
  const top=62,bottom=height-62,step=(bottom-top)/(count-1);
  return Array.from({length:count},(_,i)=>top+i*step);
}
function renderNetwork(a,focus='center'){
  const txs=a.records;
  const count=Math.max(4,Math.min(20,Number($('networkPartyCount')?.value)||4));
  if($('networkPartyCount'))$('networkPartyCount').value=count;

  const origins=group(txs,'inflow'),benefits=group(txs,'outflow');
  const o=origins.slice(0,count),b=benefits.slice(0,count);
  const n=Math.max(4,o.length,b.length);

  const width=1400;
  const height=Math.max(520,140+n*100);
  const subjectX=700,subjectY=height/2;

  const originTextX=438,originNodeX=470;
  const benefitNodeX=930,benefitTextX=962;

  const originLineStart=originNodeX+34,originLineEnd=subjectX-78;
  const benefitLineStart=subjectX+78,benefitLineEnd=benefitNodeX-34;

  const subject=$('subjectName').value.trim()||'Subject';
  const oy=networkYPositions(Math.max(1,o.length),height);
  const by=networkYPositions(Math.max(1,b.length),height);

  if($('networkRangeStatus')){
    $('networkRangeStatus').textContent=txs.length.toLocaleString()+' transaction(s) • '+o.length+' originator(s) shown • '+b.length+' beneficiary/beneficiaries shown • click any child node or label to focus it';
  }

  if(!txs.length||(!o.length&&!b.length)){
    $('networkView').innerHTML='<div class="network-empty">No classified inflow/outflow relationships are available.</div>';
    return;
  }

  const scale=networkZoom;
  const scaledWidth=Math.round(width*scale);
  const scaledHeight=Math.round(height*scale);
  const sideBuffer=Math.max(30,Math.round(40*scale));
  const canvasWidth=scaledWidth+(sideBuffer*2);

  const focusLeft=sideBuffer+Math.round(((originTextX+originNodeX)/2)*scale);
  const focusCenter=sideBuffer+Math.round(subjectX*scale);
  const focusRight=sideBuffer+Math.round(((benefitNodeX+benefitTextX+220)/2)*scale);

  let selectedX=subjectX,selectedY=subjectY;
  if(networkSelectedNode?.role==='originator'){
    const ix=o.findIndex(x=>norm(x.name)===norm(networkSelectedNode.name));
    if(ix>=0){selectedX=(originTextX+originNodeX)/2;selectedY=oy[ix];}
  }else if(networkSelectedNode?.role==='beneficiary'){
    const ix=b.findIndex(x=>norm(x.name)===norm(networkSelectedNode.name));
    if(ix>=0){selectedX=(benefitNodeX+benefitTextX+220)/2;selectedY=by[ix];}
  }

  const focusSelected=sideBuffer+Math.round(selectedX*scale);
  const focusSelectedY=Math.round(selectedY*scale);

  let s='<div class="network-canvas" data-focus-left="'+focusLeft+'" data-focus-center="'+focusCenter+'" data-focus-right="'+focusRight+'" data-focus-selected="'+focusSelected+'" data-focus-selected-y="'+focusSelectedY+'" style="width:'+canvasWidth+'px;min-width:'+canvasWidth+'px;height:'+scaledHeight+'px;min-height:'+scaledHeight+'px;padding-left:'+sideBuffer+'px;padding-right:'+sideBuffer+'px">'
    +'<svg class="network-svg" width="'+scaledWidth+'" height="'+scaledHeight+'" viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Originator and beneficiary relationship view">';

  o.forEach((x,i)=>{
    const y=oy[i],selected=networkSelectedNode?.role==='originator'&&norm(networkSelectedNode.name)===norm(x.name);
    s+='<line class="origin-link'+(selected?' selected-link':'')+'" x1="'+originLineStart+'" y1="'+y+'" x2="'+originLineEnd+'" y2="'+subjectY+'"/>'
      +'<g class="network-child-node network-child-target originator-node'+(selected?' selected-node':'')+'" data-node-role="originator" data-node-name="'+esc(x.name)+'">'
      +'<circle class="origin" cx="'+originNodeX+'" cy="'+y+'" r="'+(selected?38:30)+'"><title>'+esc(x.name)+' • '+esc(fmt(x.total,a.currency))+' • '+esc(nodeDateRange(x))+'</title></circle>'
      +'<text class="node-name origin-label" text-anchor="end" x="'+originTextX+'" y="'+(y-18)+'">'+esc(shortName(x.name,40))+'</text>'
      +'<text class="money origin-label" text-anchor="end" x="'+originTextX+'" y="'+(y+7)+'">'+esc(shortMoney(x.total,a.currency))+' • '+x.count+' tx</text>'
      +'<text class="node-date origin-label" text-anchor="end" x="'+originTextX+'" y="'+(y+31)+'">'+esc(nodeDateRange(x))+'</text>'
      +'</g>';
  });

  b.forEach((x,i)=>{
    const y=by[i],selected=networkSelectedNode?.role==='beneficiary'&&norm(networkSelectedNode.name)===norm(x.name);
    s+='<line class="benefit-link'+(selected?' selected-link':'')+'" x1="'+benefitLineStart+'" y1="'+subjectY+'" x2="'+benefitLineEnd+'" y2="'+y+'"/>'
      +'<g class="network-child-node network-child-target beneficiary-node'+(selected?' selected-node':'')+'" data-node-role="beneficiary" data-node-name="'+esc(x.name)+'">'
      +'<circle class="benefit" cx="'+benefitNodeX+'" cy="'+y+'" r="'+(selected?38:30)+'"><title>'+esc(x.name)+' • '+esc(fmt(x.total,a.currency))+' • '+esc(nodeDateRange(x))+'</title></circle>'
      +'<text class="node-name benefit-label" x="'+benefitTextX+'" y="'+(y-18)+'">'+esc(shortName(x.name,40))+'</text>'
      +'<text class="money benefit-label" x="'+benefitTextX+'" y="'+(y+7)+'">'+esc(shortMoney(x.total,a.currency))+' • '+x.count+' tx</text>'
      +'<text class="node-date benefit-label" x="'+benefitTextX+'" y="'+(y+31)+'">'+esc(nodeDateRange(x))+'</text>'
      +'</g>';
  });

  s+='<circle class="subject" cx="'+subjectX+'" cy="'+subjectY+'" r="60"/>'
    +'<text class="subject-label" x="'+subjectX+'" y="'+(subjectY-5)+'" text-anchor="middle">'+esc(shortName(subject,24))+'</text>'
    +'<text class="subject-sub" x="'+subjectX+'" y="'+(subjectY+21)+'" text-anchor="middle">SUBJECT</text>'
    +'</svg></div>';

  $('networkView').innerHTML=s;
  initNetworkPan();

  $$('#networkView .network-child-target').forEach(el=>{
    el.onpointerdown=e=>e.stopPropagation();
    el.onclick=e=>{e.stopPropagation();focusNetworkChild(el.dataset.nodeRole,el.dataset.nodeName);};
    el.ondblclick=e=>{e.stopPropagation();openCounterpartyProfile(el.dataset.nodeName);};
  });

  if(focus!=='preserve')scrollNetworkTo(focus);
}

function graphFileBase(){
  return (($('caseName').value.trim()||'finintel_relationship_graph').replace(/[^a-z0-9._-]+/gi,'_').replace(/^_+|_+$/g,'')||'finintel_relationship_graph');
}
function exportGraphSvgMarkup(){
  const a=state.analysis;if(!a||a.kind!=='transaction')throw new Error('No relationship graph is available to export.');
  const count=Math.max(4,Math.min(20,Number($('networkPartyCount')?.value)||4));
  const o=a.origins.slice(0,count),b=a.benefits.slice(0,count);
  const n=Math.max(4,o.length,b.length),height=Math.max(520,140+n*100),width=1400;
  const subjectX=700,originNodeX=470,benefitNodeX=930,subjectY=height/2;
  const oy=networkYPositions(Math.max(1,o.length),height),by=networkYPositions(Math.max(1,b.length),height);
  const originLineStart=originNodeX+34,originLineEnd=subjectX-78,benefitLineStart=subjectX+78,benefitLineEnd=benefitNodeX-34;
  const wrap=(name,max=34)=>{
    const words=String(name||'Unknown').split(/\s+/),lines=[];let line='';
    words.forEach(w=>{const test=(line+' '+w).trim();if(test.length>max&&line){lines.push(line);line=w;}else line=test;});if(line)lines.push(line);return lines.slice(0,3);
  };
  let s='<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'"><rect width="100%" height="100%" fill="#ffffff"/><style>text{font-family:Arial,sans-serif;fill:#102f42}.nm{font-size:20px;font-weight:700}.dt{font-size:15px;font-weight:700;fill:#5a4b17}.am{font-size:17px;font-weight:700;fill:#27465a}.origin{fill:#e9f6ef;stroke:#0b6b45;stroke-width:4}.benefit{fill:#eaf4fb;stroke:#176aa5;stroke-width:4}.subject{fill:#fbf6e8;stroke:#b8952f;stroke-width:5}.ol{stroke:#4c9b76;stroke-width:3}.bl{stroke:#5d97be;stroke-width:3}</style>';
  o.forEach((x,i)=>{
    const y=oy[i],lines=wrap(x.name);
    s+='<line class="ol" x1="'+originLineStart+'" y1="'+y+'" x2="'+originLineEnd+'" y2="'+subjectY+'"/><circle class="origin" cx="'+originNodeX+'" cy="'+y+'" r="29"/>';
    lines.forEach((line,j)=>s+='<text class="nm" text-anchor="end" x="438" y="'+(y-24+(j*22))+'">'+esc(line)+'</text>');
    const base=y-24+(lines.length*22);
    s+='<text class="am" text-anchor="end" x="438" y="'+(base+4)+'">'+esc(fmt(x.total,a.currency))+' • '+x.count+' tx</text><text class="dt" text-anchor="end" x="438" y="'+(base+25)+'">'+esc(nodeDateRange(x))+'</text>';
  });
  b.forEach((x,i)=>{
    const y=by[i],lines=wrap(x.name);
    s+='<line class="bl" x1="'+benefitLineStart+'" y1="'+subjectY+'" x2="'+benefitLineEnd+'" y2="'+y+'"/><circle class="benefit" cx="'+benefitNodeX+'" cy="'+y+'" r="29"/>';
    lines.forEach((line,j)=>s+='<text class="nm" x="962" y="'+(y-24+(j*22))+'">'+esc(line)+'</text>');
    const base=y-24+(lines.length*22);
    s+='<text class="am" x="962" y="'+(base+4)+'">'+esc(fmt(x.total,a.currency))+' • '+x.count+' tx</text><text class="dt" x="962" y="'+(base+25)+'">'+esc(nodeDateRange(x))+'</text>';
  });
  s+='<circle class="subject" cx="'+subjectX+'" cy="'+subjectY+'" r="56"/><text x="'+subjectX+'" y="'+(subjectY-3)+'" text-anchor="middle" style="font-size:18px;font-weight:800">'+esc($('subjectName').value.trim()||'Subject')+'</text><text x="'+subjectX+'" y="'+(subjectY+20)+'" text-anchor="middle" style="font-size:13px;font-weight:800;fill:#67571d">SUBJECT</text></svg>';
  return s;
}
async function exportGraphPngData(){
  const svg=exportGraphSvgMarkup();
  const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  try{
    const img=await new Promise((resolve,reject)=>{
      const i=new Image();
      i.onload=()=>resolve(i);
      i.onerror=()=>reject(new Error('Could not render the graph image for export.'));
      i.src=url;
    });
    const canvas=document.createElement('canvas');
    canvas.width=2400;
    canvas.height=Math.max(700,Math.round(2400*(img.naturalHeight/img.naturalWidth)));
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/png',1);
  }finally{URL.revokeObjectURL(url);}
}

function graphExportHtml(){
  const svg=exportGraphSvgMarkup();
  const title=esc(($('caseName').value.trim()||'FinIntel AML')+' — Counterparty Relationship View');
  const focused=networkSelectedNode?'<p><b>Focused node:</b> '+esc(networkSelectedNode.name)+' ('+esc(networkSelectedNode.role)+')</p>':'';
  return '<!doctype html><html><head><meta charset="utf-8"><title>'+title+'</title><style>@page{size:A3 landscape;margin:10mm}body{font-family:Arial;color:#173447;margin:20px}h1{font-size:20px;color:#123b4c}p{font-size:11px}.graph{width:100%;height:auto;border:1px solid #ccd5da}</style></head><body><h1>'+title+'</h1>'+focused+'<p>Generated '+esc(new Date().toLocaleString())+'</p><div class="graph">'+svg+'</div></body></html>';
}
function saveGraphPdf(){
  status('graphExportStatus','Preparing print-ready PDF view…');
  try{
    const old=$('graphPrintFrame');if(old)old.remove();
    const frame=document.createElement('iframe');
    frame.id='graphPrintFrame';
    frame.setAttribute('aria-hidden','true');
    frame.style.position='fixed';
    frame.style.right='0';
    frame.style.bottom='0';
    frame.style.width='1px';
    frame.style.height='1px';
    frame.style.border='0';
    frame.style.opacity='0';
    document.body.appendChild(frame);
    const doc=frame.contentDocument||frame.contentWindow.document;
    doc.open();doc.write(graphExportHtml());doc.close();
    setTimeout(()=>{
      try{
        frame.contentWindow.focus();
        frame.contentWindow.print();
        status('graphExportStatus','Print dialog opened. Choose “Save as PDF”.');
      }catch(e){
        status('graphExportStatus','Could not open the print dialog. Use the browser Print command and choose “Save as PDF”.',true);
      }
      setTimeout(()=>frame.remove(),3000);
    },400);
  }catch(e){status('graphExportStatus',e.message,true);}
}
async function saveGraphWord(){
  status('graphExportStatus','Preparing Word document…');
  try{
    const png=await exportGraphPngData();
    const title=esc(($('caseName').value.trim()||'FinIntel AML')+' — Counterparty Relationship View');
    const focused=networkSelectedNode?'<p><b>Focused node:</b> '+esc(networkSelectedNode.name)+' ('+esc(networkSelectedNode.role)+')</p>':'';
    const html='<!doctype html><html><head><meta charset="utf-8"><style>@page{size:landscape;margin:18mm}body{font-family:Arial;color:#173447}h1{font-size:18pt;color:#123b4c}p{font-size:10pt}img{width:100%;height:auto;border:1px solid #ccd5da}</style></head><body><h1>'+title+'</h1>'+focused+'<p>Generated '+esc(new Date().toLocaleString())+'</p><img src="'+png+'"></body></html>';
    download(graphFileBase()+'.doc',html,'application/msword');
    status('graphExportStatus','Word document saved.');
  }catch(e){status('graphExportStatus',e.message,true);}
}

function maskedTop(profile){
  if(!profile.topRepeated)return'—';
  if(profile.field.sensitivity==='highly-sensitive'||profile.field.sensitivity==='confidential')return'Masked ('+profile.topRepeated.count+' occurrences)';
  return shortName(profile.topRepeated.value,28)+' ('+profile.topRepeated.count+')';
}

function renderProfiles(a){
  $('fieldProfileTable').innerHTML='<table><thead><tr><th>FinIntel Field</th><th>Source Column</th><th>Type</th><th class="num">Complete</th><th class="num">Unique</th><th class="num">Repeated Values</th><th>Top Repeated</th></tr></thead><tbody>'
  +a.profiles.map(p=>'<tr><td>'+esc(p.field.label)+(p.field.custom?' <span class="source-badge custom">CUSTOM</span>':'')+'</td><td>'+esc(p.source)+'</td><td>'+esc(TYPE_LABELS[p.field.type]||p.field.type)+'</td><td class="num">'+p.completeness.toFixed(1)+'%</td><td class="num">'+p.unique+'</td><td class="num">'+p.repeatedValues+'</td><td>'+esc(maskedTop(p))+'</td></tr>').join('')
  +'</tbody></table>';
}

function mappedColumnsForExport(){
  return mappedFields().map(x=>({source:x.source,id:x.field.id,label:x.field.label,field:x.field}));
}

function renderRecords(){
  const a=state.analysis;if(!a)return;
  const q=norm($('txSearch').value),f=$('directionFilter').value;
  const cols=mappedColumnsForExport();
  let rows=a.records.filter(r=>{
    if(a.kind==='transaction'&&f!=='all'&&r.direction!==f)return false;
    if(!q)return true;
    return norm(Object.values(r.values).join(' ')+' '+(r.extracted?.meaning||'')+' '+(r.sheet||'')).includes(q);
  }).slice(0,300);
  const derivedHead=a.kind==='transaction'?'<th>Direction</th><th>Source Sheet</th><th>Extracted Meaning</th><th>Derived Counterparty</th>':'';
  $('transactionTable').innerHTML='<table><thead><tr><th>#</th>'+derivedHead+cols.map(c=>'<th>'+esc(c.label)+'</th>').join('')+'</tr></thead><tbody>'
    +(rows.map(r=>'<tr'+(a.kind==='transaction'?' data-direction="'+esc(r.direction)+'"':'')+'><td>'+r.row+'</td>'
      +(a.kind==='transaction'?'<td><span class="direction-badge '+esc(r.direction)+'">'+esc(r.direction)+'</span></td><td>'+esc(r.sheet||'')+'</td><td><span class="description-meaning">'+esc(r.extracted?.category||'')+'</span><br><small>'+esc(r.extracted?.meaning||'')+'</small></td><td>'+esc(r.extracted?.counterparty||'')+(r.extracted?.counterpartyType?'<br><small>'+esc(r.extracted.counterpartyType)+' • '+esc((r.extracted.counterpartyConfidence||0)+'% confidence')+'</small>':'')+(r.counterpartyFromDescription?' <span class="source-badge">USED</span>':'')+'</td>':'')
      +cols.map(c=>'<td>'+esc(r.values[c.id]??'')+'</td>').join('')+'</tr>').join('')
      ||'<tr><td colspan="'+(cols.length+(a.kind==='transaction'?5:1))+'">No matching records.</td></tr>')
    +'</tbody></table>';
}

function makeDraft(a){
  const name=$('caseName').value.trim()||'Financial Intelligence Analysis',subject=$('subjectName').value.trim()||'the subject';
  if(a.kind!=='transaction'){
    const lines=['DATASET PROFILE',name+' reviewed '+a.records.length.toLocaleString()+' record(s) from '+state.sourceName+' classified as '+datasetLabel()+'. '+a.mappedCount+' FinIntel field(s) were mapped. Overall mapped-field completeness was '+a.completeness.toFixed(1)+'%.','','MAPPED FIELD FINDINGS'];
    a.profiles.forEach(p=>lines.push('• '+p.field.label+' ('+p.source+'): '+p.completeness.toFixed(1)+'% complete, '+p.unique+' unique value(s), '+p.repeatedValues+' repeated value group(s).'));
    if(a.repeatedSignals.length){lines.push('','ENTITY / IDENTIFIER REVIEW');a.repeatedSignals.forEach(p=>lines.push('• Repeated '+p.field.label+' values were identified across records and may warrant entity-resolution review.'));}
    lines.push('','INFERENCE','This is a structural data profile, not a determination of suspicious activity. Any repeated identifiers or relationships should be validated against the source data and case context before investigative or compliance conclusions are drawn.');
    return lines.join('\n');
  }
  const lines=['ABSTRACT'];
  lines.push(name+' reviewed '+a.records.length.toLocaleString()+' transaction records associated with '+subject+(a.first&&a.last?' for the period '+fmtDate(a.first)+' to '+fmtDate(a.last):'')+'. Total classified inflow was '+fmt(a.totalIn,a.currency)+', while total classified outflow was '+fmt(a.totalOut,a.currency)+', resulting in a net flow of '+fmt(a.net,a.currency)+'.');
  lines.push('','FINDINGS','• '+a.origins.length.toLocaleString()+' distinct originator(s) and '+a.benefits.length.toLocaleString()+' distinct beneficiary/beneficiaries were identified.');
  if(a.benefits[0])lines.push('• The largest beneficiary by value was '+a.benefits[0].name+', receiving '+fmt(a.benefits[0].total,a.currency)+' across '+a.benefits[0].count+' transaction(s).');
  if(a.origins[0])lines.push('• The largest originator by value was '+a.origins[0].name+', contributing '+fmt(a.origins[0].total,a.currency)+' across '+a.origins[0].count+' transaction(s).');
  lines.push('• The pass-through ratio was '+a.passRatio.toFixed(1)+'%.');
  if(a.rapid.length)lines.push('• '+a.rapid.length+' rapid-movement match(es) met the analyst-configured parameters.');
  if(a.cryptoExposure)lines.push('• '+a.cryptoTx.length+' transaction(s), with observed value of '+fmt(a.cryptoExposure,a.currency)+', contained crypto/VASP textual indicators.');
  if(a.unknown.length)lines.push('• '+a.unknown.length+' transaction(s) had unresolved direction and require data review.');
  if(a.descriptionIntel?.parsed)lines.push('• FinIntel parsed '+a.descriptionIntel.parsed+' transaction description(s), identified '+(a.descriptionIntel.entityCandidates||0)+' distinct entity candidate(s), extracted probable counterparties from '+a.descriptionIntel.withCounterparty+' record(s), and used description-derived counterparties as fallback data in '+a.descriptionIntel.fallbackUsed+' record(s).');
  if(a.descriptionIntel?.categories?.[0])lines.push('• The most frequently inferred description category was '+a.descriptionIntel.categories[0].name+' ('+a.descriptionIntel.categories[0].count+' record(s)).');
  if(Object.keys(state.aliasMap).length)lines.push('• '+Object.keys(state.aliasMap).length+' persistent analyst alias mapping(s) were applied before counterparty aggregation.');
  lines.push('','AML/CFT INDICATORS FOR REVIEW');
  if(a.alerts.length)a.alerts.forEach((x,i)=>lines.push((i+1)+'. '+x.title+': '+x.detail));else lines.push('No material rule-based indicator triggered under the current settings.');
  lines.push('','INFERENCE','The foregoing indicators are screening outputs and should be assessed alongside KYC/CDD information, source of funds/wealth, transaction purpose, counterparty information, intelligence holdings and corroborative material. The system does not determine that money laundering, terrorist financing or another predicate offence occurred.');
  return lines.join('\n');
}

function renderAnalysis(a){
  state.analysis=a;
  $('resultCaseName').textContent=$('caseName').value.trim()||'Financial Intelligence Analysis';
  $('resultMeta').textContent=state.sourceName+' • '+datasetLabel()+' • '+a.records.length.toLocaleString()+' record(s)';
  const badge=$('overallRisk');
  if(a.kind==='transaction'){badge.className='risk-badge '+a.risk;badge.textContent=a.risk.toUpperCase()+' • '+a.riskScore+'/100';}
  else{badge.className='risk-badge low';badge.textContent='DATA PROFILE';}
  renderMetrics(a);
  $('transactionResults').hidden=a.kind!=='transaction';
  $('directionFilter').hidden=a.kind!=='transaction';
  if(a.kind==='transaction'){
    renderCounterparty('originatorTable',a.origins,a.totalIn,a.currency);
    renderCounterparty('beneficiaryTable',a.benefits,a.totalOut,a.currency);
    renderDescriptionIntelligence(a);
    renderAlerts(a);renderSupplementalIndicators(a);renderNetwork(a);
  }
  renderProfiles(a);renderRecords();renderAliasLibrary();
  $('draftSummary').value=makeDraft(a);
}

function download(filename,text,type){
  const blob=new Blob([text],{type:type||'text/plain'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
}
function csvEscape(v){const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function exportCSV(){
  const a=state.analysis;if(!a)return;const cols=mappedColumnsForExport();
  const derived=a.kind==='transaction'?['Direction','Source Sheet','Extracted Meaning','Extracted Counterparty','Extracted Entity Type','Entity Confidence','All Extracted Entities','Extracted Channel','Extracted Account/ID','Extracted Phone','Extracted Email','Extracted Wallet']:[];
  const h=['Source Row',...derived,...cols.map(c=>c.label)];
  const rows=a.records.map(r=>[
    r.row,
    ...(a.kind==='transaction'?[r.direction,r.sheet||'',r.extracted?.meaning||'',r.extracted?.counterparty||'',r.extracted?.counterpartyType||'',r.extracted?.counterpartyConfidence||'',(r.extracted?.entities||[]).map(e=>e.name+' ['+e.type+', '+e.confidence+'%]').join(' | '),r.extracted?.channel||'',r.extracted?.account||'',r.extracted?.phone||'',r.extracted?.email||'',r.extracted?.wallet||'']:[]),
    ...cols.map(c=>r.values[c.id]??'')
  ].map(csvEscape).join(','));
  download('finintel_standardised_'+state.datasetType+'.csv',[h.map(csvEscape).join(','),...rows].join('\n'),'text/csv');
}
function reportHtml(){
  const a=state.analysis,summary=$('draftSummary').value;
  const profileRows=a.profiles.map(p=>'<tr><td>'+esc(p.field.label)+'</td><td>'+esc(p.source)+'</td><td>'+esc(TYPE_LABELS[p.field.type]||p.field.type)+'</td><td>'+p.completeness.toFixed(1)+'%</td><td>'+p.unique+'</td><td>'+p.repeatedValues+'</td></tr>').join('');
  let tx='';
  if(a.kind==='transaction'){
    const cp=(rows,total)=>rows.slice(0,15).map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.name)+'</td><td>'+r.count+'</td><td>'+esc(fmt(r.total,a.currency))+'</td><td>'+(total?(r.total/total*100).toFixed(1):'0')+'%</td></tr>').join('');
    const d=a.descriptionIntel||{parsed:0,withCounterparty:0,fallbackUsed:0,categories:[]};
    tx='<h2>Description Intelligence</h2><p>'+d.parsed+' description(s) parsed; '+d.withCounterparty+' probable counterparty extraction(s); '+d.fallbackUsed+' used as fallback counterparty data.</p>'
      +(d.categories.length?'<p>Leading inferred meanings: '+esc(d.categories.slice(0,5).map(x=>x.name+' ('+x.count+')').join(', '))+'.</p>':'')
      +(Object.keys(state.aliasMap).length?'<p><b>Entity resolution:</b> '+Object.keys(state.aliasMap).length+' persistent analyst alias mapping(s) were applied.</p>':'')
      +'<h2>Top Originators</h2><table><tr><th>#</th><th>Name</th><th>Count</th><th>Total</th><th>Share</th></tr>'+cp(a.origins,a.totalIn)+'</table><h2>Top Beneficiaries</h2><table><tr><th>#</th><th>Name</th><th>Count</th><th>Total</th><th>Share</th></tr>'+cp(a.benefits,a.totalOut)+'</table><h2>Indicators</h2>'+(a.alerts.map(x=>'<p><b>'+esc(x.title)+'</b><br>'+esc(x.detail)+'<br><small>'+esc(x.evidence||'')+'</small></p>').join('')||'<p>No material rule-based indicator triggered.</p>');
  }
  return '<!doctype html><html><head><meta charset="utf-8"><title>'+esc($('caseName').value)+'</title><style>body{font:14px Arial;max-width:1000px;margin:35px auto;color:#17202a}h1,h2{color:#123b4c}.meta{color:#64727b}table{width:100%;border-collapse:collapse;margin:12px 0 25px}th,td{border:1px solid #ccd5da;padding:7px;text-align:left}pre{white-space:pre-wrap;font:14px/1.6 Arial}.warn{border-left:4px solid #b98520;padding:10px;background:#fff8e7}</style></head><body><h1>FinIntel AML v2.9.3 — '+esc($('caseName').value||'Analysis Report')+'</h1><p class="meta">Dataset: '+esc(datasetLabel())+' | Source: '+esc(state.sourceName)+' | Generated: '+esc(new Date().toLocaleString())+'</p><div class="warn"><b>Analyst review required.</b> This report contains analytical screening/profile outputs, not a finding of criminality.</div><h2>Mapped Field Profile</h2><table><tr><th>Field</th><th>Source</th><th>Type</th><th>Completeness</th><th>Unique</th><th>Repeated</th></tr>'+profileRows+'</table>'+tx+'<h2>Analytical Summary</h2><pre>'+esc(summary)+'</pre></body></html>';
}

function renderSchemaDialog(){
  const content=$('schemaDialogContent');
  const cards=(title,items,custom)=>'<h4>'+esc(title)+'</h4><div class="schema-dialog-grid">'+items.map(f=>'<div class="schema-card"><strong>'+esc(f.label)+'</strong><small>'+esc(TYPE_LABELS[f.type]||f.type)+' • '+esc(f.category)+' • '+esc(f.sensitivity||'internal')+'</small>'+(f.description?'<small>'+esc(f.description)+'</small>':'')+'<span class="source-badge '+(custom?'custom':'')+'">'+(custom?'CUSTOM':'CORE')+'</span></div>').join('')+'</div>';
  content.innerHTML=cards('Core fields',CORE_FIELDS,false)+cards('Custom fields',state.customFields,true);
}

$('fileInput').addEventListener('change',async e=>{
  const f=e.target.files?.[0];if(!f)return;
  status('importStatus','Reading file locally…');
  try{
    const x=await importFile(f);
    loadRows(x.rows,f.name,x.type,x.sheets||[]);
  }catch(err){
    setLoaderProgress(100,'Import failed',err.message||'Unable to load dataset.');
    status('importStatus',err.message,true);
  }
});
$('datasetType').addEventListener('change',()=>{
  state.datasetType=$('datasetType').value;
  if(state.rawRows.length){state.sourceMapping=defaultMapping();state.amountLayout=suggestedAmountLayout();state.partyLayout=suggestedPartyLayout();refreshMappingUI();}
  else renderTransactionStructure();
});
$('amountLayout').addEventListener('change',()=>{state.amountLayout=$('amountLayout').value;renderTransactionStructure();});
$('partyLayout').addEventListener('change',()=>{state.partyLayout=$('partyLayout').value;renderTransactionStructure();});
$('loadSampleBtn').onclick=()=>{
  $('datasetType').value='transaction';state.datasetType='transaction';
  try{
    setLoaderProgress(25,'Loading sample','Reading synthetic transaction dataset…');
    const rows=parseCSV(SAMPLE_CSV).map(r=>({...r,__finintel_sheet:'Sample',__finintel_sheet_direction:''}));
    loadRows(rows,'sample_transactions.csv','Sample CSV',[{name:'Sample',rows:rows.length,directionHint:''}]);
  }catch(err){status('importStatus',err.message,true);}
};
$('loadDescriptionSampleBtn').onclick=async()=>{
  $('datasetType').value='transaction';state.datasetType='transaction';
  try{
    setLoaderProgress(10,'Loading description sample','Reading minimal Transaction Date + Description + Amount dataset…');
    const response=await fetch('sample-data/sample_description_transactions.csv',{cache:'no-store'});
    if(!response.ok)throw new Error('Could not load the description sample.');
    const text=await response.text();
    setLoaderProgress(55,'Parsing descriptions','Preparing synthetic messy narration records…');
    const rows=parseCSV(text).map(r=>({...r,__finintel_sheet:'Description Sample',__finintel_sheet_direction:''}));
    loadRows(rows,'sample_description_transactions.csv','Sample CSV',[{name:'Description Sample',rows:rows.length,directionHint:''}]);
  }catch(err){
    setLoaderProgress(100,'Sample load failed',err.message||'Unable to load sample.');
    status('importStatus',err.message,true);
  }
};
$('addCustomFieldBtn').onclick=addCustomField;
$('saveTemplateBtn').onclick=saveTemplate;
$('applyTemplateBtn').onclick=applyTemplate;
$('confirmMappingBtn').onclick=()=>{
  const err=validateMapping();if(err){status('mappingStatus',err,true);return;}
  status('mappingStatus');renderMappedSummary();setStep(3);
};
$('backToImport').onclick=()=>setStep(1);
$('backToMapping').onclick=()=>setStep(2);
$('runAnalysisBtn').onclick=()=>{
  counterpartySelection.clear();
  const err=validateMapping();if(err){status('configStatus',err,true);setStep(2);return;}
  status('configStatus');setStep(4);$('analysisProgress').textContent='Standardising mapped core and custom fields…';
  setTimeout(()=>{
    try{
      state.standardized=standardize();
      if(!state.standardized.length)throw new Error('No records remained after standardisation.');
      $('analysisProgress').textContent=state.datasetType==='transaction'?'Running transaction summaries and AML/CFT scenarios…':'Profiling mapped fields and repeated identifiers…';
      const a=state.datasetType==='transaction'?transactionAnalysis(state.standardized):universalAnalysis(state.standardized);
      renderAnalysis(a);setStep(5);
    }catch(e){status('configStatus',e.message,true);setStep(3);}
  },24);
};
$('txSearch').addEventListener('input',renderRecords);
$('directionFilter').addEventListener('change',renderRecords);
['originatorSearch','originatorSort','originatorMinCount','beneficiarySearch','beneficiarySort','beneficiaryMinCount'].forEach(id=>{
  const el=$(id);if(el)el.addEventListener(id.includes('Search')?'input':'change',()=>{
    const prefix=id.startsWith('originator')?'originator':'beneficiary';
    counterpartyPage[prefix]=1;
    rerenderCounterpartyTables();
  });
});
$('networkPartyCount').addEventListener('change',()=>{if(state.analysis?.kind==='transaction')renderNetwork(state.analysis);});
$('networkZoomOut').onclick=()=>setNetworkZoom(networkZoom-.15);
$('networkZoomIn').onclick=()=>setNetworkZoom(networkZoom+.15);
$('networkZoomReset').onclick=()=>setNetworkZoom(NETWORK_DEFAULT_ZOOM);
$('networkLeft').onclick=()=>{networkSelectedNode=null;if($('nodeFocusPanel'))$('nodeFocusPanel').hidden=true;scrollNetworkTo('left');};
$('networkCenter').onclick=()=>{networkSelectedNode=null;if($('nodeFocusPanel'))$('nodeFocusPanel').hidden=true;centerNetworkView();};
$('networkRight').onclick=()=>{networkSelectedNode=null;if($('nodeFocusPanel'))$('nodeFocusPanel').hidden=true;scrollNetworkTo('right');};
$('clearNodeFocus').onclick=clearNetworkNodeFocus;
$('openNodeProfile').onclick=()=>{if(networkSelectedNode)openCounterpartyProfile(networkSelectedNode.name);};
$('closeCounterpartyProfile').onclick=()=>$('counterpartyProfileDialog').close();
$('profileTransactionSearch').addEventListener('input',()=>{profilePage=1;renderProfileTransactions();});
$('profileDirectionFilter').addEventListener('change',()=>{profilePage=1;renderProfileTransactions();});
$('exportProfileCsv').onclick=exportCounterpartyProfileCsv;
$('saveGraphPdf').onclick=saveGraphPdf;
$('saveGraphWord').onclick=saveGraphWord;
$('exportCsvBtn').onclick=exportCSV;
$('copySummaryBtn').onclick=async()=>{
  try{await navigator.clipboard.writeText($('draftSummary').value);status('reportStatus','Analytical summary copied.');}
  catch{status('reportStatus','Copy failed. Select the text manually.',true);}
};
$('downloadReportBtn').onclick=()=>{download('finintel_aml_v2_9_3_report.html',reportHtml(),'text/html');status('reportStatus','HTML report downloaded.');};
$('saveAliasBtn').onclick=saveSelectedAliases;
$('rerunAliasBtn').onclick=rerunWithAliases;
$('clearAliasSelectionBtn').onclick=clearAliasSelection;
$('exportAliasBtn').onclick=exportAliasLibrary;
$('clearAliasLibraryBtn').onclick=()=>{
  if(!Object.keys(state.aliasMap).length){status('aliasStatus','Alias library is already empty.');return;}
  if(!window.confirm('Clear all saved entity alias mappings from this browser?'))return;
  state.aliasMap={};persistAliases();status('aliasStatus','Persistent alias library cleared. Rerun analysis to restore the unmerged names.');
};
$('newAnalysisBtn').onclick=()=>{state.analysis=null;state.standardized=[];counterpartySelection.clear();setStep(1);};
$('clearAllBtn').onclick=()=>{
  state.rawRows=[];state.columns=[];state.sheets=[];state.sourceMapping={};state.standardized=[];state.analysis=null;networkZoom=NETWORK_DEFAULT_ZOOM;networkFocus='center';networkSelectedNode=null;counterpartySelection.clear();
  counterpartyPage.originator=1;counterpartyPage.beneficiary=1;
  $('fileInput').value='';$('datasetInfo').hidden=true;$('datasetEmpty').hidden=false;status('importStatus');resetLoaderProgress();
  if($('networkPartyCount'))$('networkPartyCount').value='4';if($('networkZoomReset'))$('networkZoomReset').textContent='65%';
  setStep(1);
};
$('schemaLibraryBtn').onclick=()=>{renderSchemaDialog();$('schemaDialog').showModal();};
$('closeSchemaDialog').onclick=()=>$('schemaDialog').close();
$$('.step').forEach(b=>b.onclick=()=>{
  const n=Number(b.dataset.step);
  if(n===1)setStep(1);
  else if(n===2&&state.rawRows.length)setStep(2);
  else if(n===3&&state.rawRows.length){renderMappedSummary();setStep(3);}
  else if(n===5&&state.analysis)setStep(5);
});

renderCustomFieldList();
renderTemplateSelect();
renderAliasLibrary();
renderTransactionStructure();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js?v=2.9.3').then(r=>r.update()).catch(()=>{}));