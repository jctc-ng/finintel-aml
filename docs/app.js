'use strict';

const $=id=>document.getElementById(id);
const $$=s=>Array.from(document.querySelectorAll(s));

const STORE={
  custom:'finintel.v2.customFields',
  templates:'finintel.v2.importTemplates'
};

const CORE_FIELDS=[
  {id:'date',label:'Transaction / Record Date',type:'date',category:'transaction'},
  {id:'amount',label:'Amount',type:'currency',category:'transaction'},
  {id:'direction',label:'Direction',type:'text',category:'transaction'},
  {id:'debit',label:'Debit Amount',type:'currency',category:'transaction'},
  {id:'credit',label:'Credit Amount',type:'currency',category:'transaction'},
  {id:'originator',label:'Originator / Sender',type:'entity',category:'transaction'},
  {id:'beneficiary',label:'Beneficiary / Receiver',type:'entity',category:'transaction'},
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
  direction:[/^direction$/i,/dr.?cr/i,/debit.?credit/i,/transaction.*direction/i,/flow.*type/i],
  debit:[/^debit$/i,/debit.*amount/i,/^outflow$/i,/outflow.*amount/i,/withdrawal.*amount/i,/money.*out/i],
  credit:[/^credit$/i,/credit.*amount/i,/^inflow$/i,/inflow.*amount/i,/deposit.*amount/i,/money.*in/i],
  originator:[/originator/i,/sender/i,/source.*name/i,/payer/i,/from.*name/i],
  beneficiary:[/beneficiary/i,/receiver/i,/recipient/i,/payee/i,/to.*name/i],
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

const state={
  rawRows:[],columns:[],sourceName:'',sourceType:'',sheets:[],
  datasetType:'transaction',
  sourceMapping:{},
  standardized:[],
  analysis:null,
  customFields:loadJSON(STORE.custom,[]),
  templates:loadJSON(STORE.templates,[])
};

function loadJSON(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return Array.isArray(v)?v:fallback;}catch{return fallback;}}
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
  const c=CORE_FIELDS.find(f=>(autoPatterns[f.id]||[]).some(p=>p.test(source)));
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
  const item={id:existing?.id||('tpl_'+Date.now().toString(36)),name,datasetType:state.datasetType,signature:signature(),columns:[...state.columns],mapping:{...state.sourceMapping},updatedAt:new Date().toISOString()};
  if(existing)state.templates=state.templates.map(t=>t.id===existing.id?item:t);else state.templates.push(item);
  saveJSON(STORE.templates,state.templates);renderTemplateSelect();$('templateSelect').value=item.id;status('templateStatus','Template saved in this browser: '+name+'.');
}

function applyTemplate(){
  const t=state.templates.find(x=>x.id===$('templateSelect').value);
  if(!t){status('templateStatus','Select a saved template first.',true);return;}
  const next={};
  state.columns.forEach(c=>next[c]=(t.mapping[c]&&fieldById(t.mapping[c]))?t.mapping[c]:'');
  state.sourceMapping=next;
  if(t.datasetType!==state.datasetType)status('templateStatus','Template mapping applied. Note: it was saved for '+(DATASET_LABELS[t.datasetType]||t.datasetType)+'.');
  else status('templateStatus','Template applied: '+t.name+'.');
  refreshMappingUI();$('templateSelect').value=t.id;
}

function validateMapping(){
  const mapped=Object.values(state.sourceMapping).filter(Boolean);
  if(!mapped.length)return'Map at least one source column to a FinIntel field.';
  if(state.datasetType==='transaction'){
    if(!mapped.includes('date'))return'Transaction analysis requires Transaction Date.';
    const hasValue=mapped.includes('amount')||mapped.includes('debit')||mapped.includes('credit');
    if(!hasValue)return'Map Amount, Inflow/Credit, Outflow/Debit, or a combination of those amount fields.';
    const hasDirectionSource=mapped.includes('direction')||mapped.includes('debit')||mapped.includes('credit')||mapped.includes('narration')||state.sheets.some(s=>s.directionHint);
    if(mapped.includes('amount')&&!hasDirectionSource)return'With a single Amount column, also map Description/Direction or use signed amounts / direction-specific sheets so FinIntel can determine inflow and outflow.';
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
  const paren=/^\(.*\)$/.test(original);
  const explicitPlus=/^\s*\+/.test(original);
  const explicitMinus=/^\s*-/.test(original)||paren;
  let cleaned=original.replace(/[(),]/g,'').replace(/[^0-9.+\-]/g,'');
  const n=Number(cleaned);
  if(!Number.isFinite(n))return{amount:0,signed:0,signHint:'',explicitSign:false};
  const signed=paren?-Math.abs(n):n;
  return{amount:Math.abs(signed),signed,signHint:explicitMinus||signed<0?'outflow':explicitPlus?'inflow':'',explicitSign:explicitMinus||explicitPlus};
}
function parseAmount(v){return parseAmountInfo(v).amount;}
function parseDate(v){
  if(v instanceof Date&&!isNaN(v))return v;
  const s=String(v==null?'':v).trim();if(!s)return null;
  const dm=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if(dm){let y=Number(dm[3]);if(y<100)y+=2000;const d=new Date(y,Number(dm[2])-1,Number(dm[1]),Number(dm[4]||0),Number(dm[5]||0),Number(dm[6]||0));return isNaN(d)?null:d;}
  const d=new Date(s);return isNaN(d)?null:d;
}

const DESC_GENERIC=/\b(nip|neft|rtgs|transfer|trf|payment|pay|credit|debit|mobile|internet|online|web|banking|session|reference|ref|txn|transaction|narration|remark|pos|atm|ussd|cash|deposit|withdrawal|fee|charge|vat|stamp|duty|beneficiary|originator|sender|receiver|recipient|from|to|via)\b/ig;
function cleanDescription(v){
  return String(v==null?'':v)
    .replace(/[\u0000-\u001F\u007F]/g,' ')
    .replace(/[_*#~]+/g,' ')
    .replace(/\s*[|;]+\s*/g,' | ')
    .replace(/\s+/g,' ')
    .trim();
}
function probableNameCandidate(text){
  const explicit=[
    /(?:from|sender|originator|payer)\s*[:\-\/]?\s*([A-Za-z][A-Za-z.'’ \-]{2,55})/i,
    /(?:to|beneficiary|recipient|receiver|payee)\s*[:\-\/]?\s*([A-Za-z][A-Za-z.'’ \-]{2,55})/i
  ];
  for(const rx of explicit){
    const m=text.match(rx);
    if(m){
      const x=m[1].split(/\s(?:ref|reference|acct|account|bank|via|on)\b/i)[0].trim().replace(/[\-\/|]+$/,'');
      if(x.split(/\s+/).length<=7&&x.replace(DESC_GENERIC,'').trim().length>=3)return x;
    }
  }
  const parts=text.split(/[\/|;:]+|\s+-\s+/).map(x=>x.trim()).filter(Boolean);
  const scored=parts.map(p=>{
    const noIds=p.replace(/\b\d{5,}\b/g,' ').replace(/\b[A-F0-9]{12,}\b/ig,' ').replace(DESC_GENERIC,' ').replace(/\s+/g,' ').trim();
    const words=noIds.split(/\s+/).filter(Boolean);
    const letters=(noIds.match(/[A-Za-z]/g)||[]).length;
    const bad=/\b(ngn|usd|eur|gbp|bank|limited|ltd|plc)\b/i.test(noIds)&&words.length===1;
    const score=(words.length>=2&&words.length<=6?3:0)+(letters>=6?2:0)+(noIds===noIds.toUpperCase()?1:0)-(bad?3:0);
    return{value:noIds,score};
  }).filter(x=>x.value.length>=4&&!/^\d/.test(x.value));
  scored.sort((a,b)=>b.score-a.score);
  return scored[0]?.score>=4?scored[0].value:'';
}
function extractDescriptionMeaning(value){
  const original=String(value==null?'':value),clean=cleanDescription(original),lower=clean.toLowerCase();
  if(!clean)return{clean:'',category:'Unclassified',channel:'',counterparty:'',account:'',phone:'',email:'',wallet:'',directionHint:'',meaning:'No description',confidence:'low'};
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
  if(/\b(from|received|receipt|credit|credited|deposit|inflow|salary)\b/i.test(clean))inScore+=2;
  if(/\b(to|sent|debit|debited|payment|purchase|withdrawal|outflow|fee|charge)\b/i.test(clean))outScore+=2;
  if(/\brefund received\b/i.test(clean))inScore+=2;
  const directionHint=inScore>outScore?'inflow':outScore>inScore?'outflow':'';
  const counterparty=probableNameCandidate(clean);
  const pieces=[category];
  if(channel)pieces.push(channel);
  if(counterparty)pieces.push('Counterparty: '+counterparty);
  if(account)pieces.push('Account-like ID: '+account);
  if(wallet)pieces.push('Wallet detected');
  if(email)pieces.push('Email detected');
  if(phone)pieces.push('Phone detected');
  const confidence=(counterparty||wallet||email||phone||account)&&category!=='Other / Unclassified'?'high':counterparty||channel||category!=='Other / Unclassified'?'medium':'low';
  return{clean,category,channel,counterparty,account,phone,email,wallet,directionHint,meaning:pieces.join(' • '),confidence};
}
function direction(raw,o,b,subject,debit,credit,amountInfo,sheetHint,desc){
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
  return state.rawRows.map((raw,i)=>{
    const values={};
    Object.entries(state.sourceMapping).forEach(([source,fid])=>{
      if(!fid)return;
      const incoming=raw[source]??'';
      const current=values[fid];
      if(current===undefined||String(current).trim()===''||String(incoming).trim()!=='')values[fid]=incoming;
    });
    const debit=parseAmount(values.debit),credit=parseAmount(values.credit),amountInfo=parseAmountInfo(values.amount);
    const amount=values.amount!==undefined&&String(values.amount).trim()!==''?amountInfo.amount:Math.max(debit,credit);
    const explicitOriginator=String(values.originator??'').trim(),explicitBeneficiary=String(values.beneficiary??'').trim();
    const narration=String(values.narration??'').trim();
    const extracted=extractDescriptionMeaning(narration);
    const sheet=String(raw.__finintel_sheet??'');
    const sheetHint=String(raw.__finintel_sheet_direction??'');
    const flow=state.datasetType==='transaction'?direction(values.direction,explicitOriginator,explicitBeneficiary,subject,debit,credit,amountInfo,sheetHint,extracted):'n/a';
    let originator=explicitOriginator,beneficiary=explicitBeneficiary;
    let counterpartyFromDescription=false;
    if(extracted.counterparty){
      if(flow==='inflow'&&!originator){originator=extracted.counterparty;counterpartyFromDescription=true;}
      if(flow==='outflow'&&!beneficiary){beneficiary=extracted.counterparty;counterpartyFromDescription=true;}
    }
    return{
      row:i+2,values,raw,date:parseDate(values.date),dateRaw:String(values.date??''),amount,direction:flow,
      originator,beneficiary,narration,account:String(values.account??values.wallet??'').trim(),
      txid:String(values.txid??'').trim(),sheet,sheetHint,extracted,counterpartyFromDescription
    };
  });
}

const sum=(a,f=x=>x)=>a.reduce((n,x)=>n+(Number(f(x))||0),0);
function group(txs,dir){
  const m=new Map();
  txs.filter(t=>t.direction===dir).forEach(t=>{
    const name=(dir==='inflow'?t.originator:t.beneficiary)||'Unknown counterparty',k=norm(name)||'unknown';
    if(!m.has(k))m.set(k,{name,count:0,total:0});
    const x=m.get(k);x.count++;x.total+=t.amount;
  });
  return Array.from(m.values()).sort((a,b)=>b.total-a.total);
}
function rapidMoves(txs,hours,ratio){
  const ins=txs.filter(t=>t.direction==='inflow'&&t.date),outs=txs.filter(t=>t.direction==='outflow'&&t.date),hits=[],ms=hours*3600000;
  outs.forEach(out=>{
    const recent=ins.filter(i=>{const d=out.date-i.date;return d>=0&&d<=ms;});
    const incoming=sum(recent,x=>x.amount);
    if(incoming&&out.amount/incoming*100>=ratio)hits.push({out,recent,incoming,ratio:out.amount/incoming*100,minutes:(out.date-(recent[0]?.date||out.date))/60000});
  });
  return hits;
}
function structuring(txs,ref,band,min){
  if(!ref)return[];
  const low=ref*(1-band/100),c=txs.filter(t=>t.amount>=low&&t.amount<=ref&&t.date).sort((a,b)=>a.date-b.date),groups=[];
  for(let i=0;i<c.length;i++){
    const g=[c[i]];
    for(let j=i+1;j<c.length;j++){if((c[j].date-c[i].date)/86400000>7)break;g.push(c[j]);}
    if(g.length>=min){groups.push(g);i+=g.length-1;}
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
function buildDescriptionIntelligence(records){
  const parsed=records.filter(r=>r.narration);
  const withCounterparty=records.filter(r=>r.extracted?.counterparty);
  const fallbackUsed=records.filter(r=>r.counterpartyFromDescription);
  const identifiers=records.filter(r=>r.extracted&&(r.extracted.account||r.extracted.phone||r.extracted.email||r.extracted.wallet));
  return{
    parsed:parsed.length,
    withCounterparty:withCounterparty.length,
    fallbackUsed:fallbackUsed.length,
    identifiers:identifiers.length,
    categories:aggregateDescriptionField(parsed,r=>r.extracted?.category&&r.extracted.category!=='Other / Unclassified'?r.extracted.category:''),
    channels:aggregateDescriptionField(parsed,r=>r.extracted?.channel),
    counterparties:aggregateDescriptionField(withCounterparty,r=>r.extracted?.counterparty)
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
  const riskScore=Math.min(100,sum(alerts,x=>x.score)),risk=riskScore>=60?'critical':riskScore>=40?'high':riskScore>=18?'medium':'low';
  return{kind:'transaction',currency,records,txs:records,ins,outs,unknown,totalIn,totalOut,net:totalIn-totalOut,origins,benefits,rapid,structured,passRatio,concentration,both,cryptoTx,cryptoExposure,descriptionIntel,alerts,riskScore,risk,first:dated[0]?.date||null,last:dated[dated.length-1]?.date||null,profiles:buildFieldProfiles(records)};
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
  $('metricCards').innerHTML=m.map(x=>'<article class="card metric"><div class="value">'+esc(x[1])+'</div><div class="label">'+esc(x[0])+'</div></article>').join('');
}

function renderDescriptionIntelligence(a){
  const d=a.descriptionIntel||{parsed:0,withCounterparty:0,fallbackUsed:0,identifiers:0,categories:[],channels:[],counterparties:[]};
  $('descriptionCoverage').textContent=d.parsed.toLocaleString()+' descriptions parsed';
  const metrics=[
    ['Descriptions Parsed',d.parsed.toLocaleString()],
    ['Counterparties Extracted',d.withCounterparty.toLocaleString()],
    ['Used as Fallback Party',d.fallbackUsed.toLocaleString()],
    ['Identifiers Detected',d.identifiers.toLocaleString()]
  ];
  $('descriptionMetrics').innerHTML=metrics.map(x=>'<article class="card metric"><div class="value">'+esc(x[1])+'</div><div class="label">'+esc(x[0])+'</div></article>').join('');
  const rows=[
    ...d.counterparties.slice(0,8).map(x=>({kind:'Counterparty',name:x.name,count:x.count,total:x.total})),
    ...d.categories.slice(0,6).map(x=>({kind:'Meaning',name:x.name,count:x.count,total:x.total})),
    ...d.channels.slice(0,6).map(x=>({kind:'Channel',name:x.name,count:x.count,total:x.total}))
  ];
  $('descriptionIntelligenceTable').innerHTML='<table><thead><tr><th>Type</th><th>Extracted value</th><th class="num">Records</th><th class="num">Observed value</th></tr></thead><tbody>'
    +(rows.map(x=>'<tr><td>'+esc(x.kind)+'</td><td class="description-derived">'+esc(x.name)+'</td><td class="num">'+x.count+'</td><td class="num">'+esc(fmt(x.total,a.currency))+'</td></tr>').join('')||'<tr><td colspan="4">No meaningful description-derived patterns were extracted.</td></tr>')
    +'</tbody></table>';
}

function renderCounterparty(id,rows,total,currency){
  const max=rows[0]?.total||1;
  $(id).innerHTML='<table><thead><tr><th>#</th><th>Counterparty</th><th class="num">Count</th><th class="num">Total</th><th class="num">Share</th></tr></thead><tbody>'
    +(rows.slice(0,15).map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.name)+'<div class="bar"><span style="width:'+Math.min(100,r.total/max*100)+'%"></span></div></td><td class="num">'+r.count+'</td><td class="num">'+esc(fmt(r.total,currency))+'</td><td class="num">'+(total?(r.total/total*100).toFixed(1):'0.0')+'%</td></tr>').join('')||'<tr><td colspan="5">No classified counterparties.</td></tr>')
    +'</tbody></table>';
}

function renderAlerts(a){
  $('alertsList').innerHTML=a.alerts.length?a.alerts.map(x=>'<div class="alert '+esc(x.severity)+'"><div class="alert-head"><strong>'+esc(x.title)+'</strong><small>'+esc(x.severity.toUpperCase())+'</small></div><p>'+esc(x.detail)+'</p><small>'+esc(x.evidence||'')+'</small></div>').join('')
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
    +(rows.map(r=>'<tr><td>'+r.row+'</td>'
      +(a.kind==='transaction'?'<td>'+esc(r.direction)+'</td><td>'+esc(r.sheet||'')+'</td><td><span class="description-meaning">'+esc(r.extracted?.category||'')+'</span><br><small>'+esc(r.extracted?.meaning||'')+'</small></td><td>'+esc(r.extracted?.counterparty||'')+(r.counterpartyFromDescription?' <span class="source-badge">USED</span>':'')+'</td>':'')
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
  if(a.descriptionIntel?.parsed)lines.push('• FinIntel parsed '+a.descriptionIntel.parsed+' transaction description(s), extracted probable counterparties from '+a.descriptionIntel.withCounterparty+' record(s), and used description-derived counterparties as fallback data in '+a.descriptionIntel.fallbackUsed+' record(s).');
  if(a.descriptionIntel?.categories?.[0])lines.push('• The most frequently inferred description category was '+a.descriptionIntel.categories[0].name+' ('+a.descriptionIntel.categories[0].count+' record(s)).');
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
    renderAlerts(a);renderNetwork(a);
  }
  renderProfiles(a);renderRecords();
  $('draftSummary').value=makeDraft(a);
}

function download(filename,text,type){
  const blob=new Blob([text],{type:type||'text/plain'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
}
function csvEscape(v){const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function exportCSV(){
  const a=state.analysis;if(!a)return;const cols=mappedColumnsForExport();
  const derived=a.kind==='transaction'?['Direction','Source Sheet','Extracted Meaning','Extracted Counterparty','Extracted Channel','Extracted Account/ID','Extracted Phone','Extracted Email','Extracted Wallet']:[];
  const h=['Source Row',...derived,...cols.map(c=>c.label)];
  const rows=a.records.map(r=>[
    r.row,
    ...(a.kind==='transaction'?[r.direction,r.sheet||'',r.extracted?.meaning||'',r.extracted?.counterparty||'',r.extracted?.channel||'',r.extracted?.account||'',r.extracted?.phone||'',r.extracted?.email||'',r.extracted?.wallet||'']:[]),
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
      +'<h2>Top Originators</h2><table><tr><th>#</th><th>Name</th><th>Count</th><th>Total</th><th>Share</th></tr>'+cp(a.origins,a.totalIn)+'</table><h2>Top Beneficiaries</h2><table><tr><th>#</th><th>Name</th><th>Count</th><th>Total</th><th>Share</th></tr>'+cp(a.benefits,a.totalOut)+'</table><h2>Indicators</h2>'+(a.alerts.map(x=>'<p><b>'+esc(x.title)+'</b><br>'+esc(x.detail)+'<br><small>'+esc(x.evidence||'')+'</small></p>').join('')||'<p>No material rule-based indicator triggered.</p>');
  }
  return '<!doctype html><html><head><meta charset="utf-8"><title>'+esc($('caseName').value)+'</title><style>body{font:14px Arial;max-width:1000px;margin:35px auto;color:#17202a}h1,h2{color:#123b4c}.meta{color:#64727b}table{width:100%;border-collapse:collapse;margin:12px 0 25px}th,td{border:1px solid #ccd5da;padding:7px;text-align:left}pre{white-space:pre-wrap;font:14px/1.6 Arial}.warn{border-left:4px solid #b98520;padding:10px;background:#fff8e7}</style></head><body><h1>FinIntel AML v2.1 — '+esc($('caseName').value||'Analysis Report')+'</h1><p class="meta">Dataset: '+esc(datasetLabel())+' | Source: '+esc(state.sourceName)+' | Generated: '+esc(new Date().toLocaleString())+'</p><div class="warn"><b>Analyst review required.</b> This report contains analytical screening/profile outputs, not a finding of criminality.</div><h2>Mapped Field Profile</h2><table><tr><th>Field</th><th>Source</th><th>Type</th><th>Completeness</th><th>Unique</th><th>Repeated</th></tr>'+profileRows+'</table>'+tx+'<h2>Analytical Summary</h2><pre>'+esc(summary)+'</pre></body></html>';
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
  if(state.rawRows.length){state.sourceMapping=defaultMapping();refreshMappingUI();}
});
$('loadSampleBtn').onclick=()=>{
  $('datasetType').value='transaction';state.datasetType='transaction';
  try{
    setLoaderProgress(25,'Loading sample','Reading synthetic transaction dataset…');
    const rows=parseCSV(SAMPLE_CSV).map(r=>({...r,__finintel_sheet:'Sample',__finintel_sheet_direction:''}));
    loadRows(rows,'sample_transactions.csv','Sample CSV',[{name:'Sample',rows:rows.length,directionHint:''}]);
  }catch(err){status('importStatus',err.message,true);}
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
  const err=validateMapping();if(err){status('configStatus',err,true);setStep(2);return;}
  status('configStatus');setStep(4);$('analysisProgress').textContent='Standardising mapped core and custom fields…';
  setTimeout(()=>{
    try{
      state.standardized=standardize();
      if(!state.standardized.length)throw new Error('No records remained after standardisation.');
      $('analysisProgress').textContent=state.datasetType==='transaction'?'Running transaction summaries and AML/CFT scenarios…':'Profiling mapped fields and repeated identifiers…';
      setTimeout(()=>{
        const a=state.datasetType==='transaction'?transactionAnalysis(state.standardized):universalAnalysis(state.standardized);
        renderAnalysis(a);setStep(5);
      },180);
    }catch(e){status('configStatus',e.message,true);setStep(3);}
  },180);
};
$('txSearch').addEventListener('input',renderRecords);
$('directionFilter').addEventListener('change',renderRecords);
$('exportCsvBtn').onclick=exportCSV;
$('copySummaryBtn').onclick=async()=>{
  try{await navigator.clipboard.writeText($('draftSummary').value);status('reportStatus','Analytical summary copied.');}
  catch{status('reportStatus','Copy failed. Select the text manually.',true);}
};
$('downloadReportBtn').onclick=()=>{download('finintel_aml_v2_1_report.html',reportHtml(),'text/html');status('reportStatus','HTML report downloaded.');};
$('newAnalysisBtn').onclick=()=>{state.analysis=null;state.standardized=[];setStep(1);};
$('clearAllBtn').onclick=()=>{
  state.rawRows=[];state.columns=[];state.sheets=[];state.sourceMapping={};state.standardized=[];state.analysis=null;
  $('fileInput').value='';$('datasetInfo').hidden=true;$('datasetEmpty').hidden=false;status('importStatus');resetLoaderProgress();setStep(1);
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
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js?v=2.1').then(r=>r.update()).catch(()=>{}));