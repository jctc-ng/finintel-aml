'use strict';
window.finintelCaseDirty=false;
function caseFormValues(){
 const values={};
 document.querySelectorAll('input[id],select[id],textarea[id]').forEach(el=>{
  if(['file','button','submit'].includes(el.type)||el.id.startsWith('subjectImport')||el.id.startsWith('accountEditor'))return;
  values[el.id]={value:el.value,checked:el.type==='checkbox'?el.checked:undefined};
 });return values;
}
function restoreCaseForms(values){
 for(const [id,saved] of Object.entries(values||{})){
  const el=document.getElementById(id);if(!el||el.type==='file'||!saved||typeof saved!=='object')continue;
  if(typeof saved.value==='string')el.value=saved.value;if(el.type==='checkbox'&&typeof saved.checked==='boolean')el.checked=saved.checked;
 }
}
function makeCaseSnapshot(){
 return {format:'finintel-case',schemaVersion:1,appVersion:'3.5.0',savedAt:new Date().toISOString(),
  dataset:{rawRows:state.rawRows,columns:state.columns,sourceName:state.sourceName,sourceType:state.sourceType,sheets:state.sheets,datasetType:state.datasetType,sourceMapping:state.sourceMapping,amountLayout:state.amountLayout,partyLayout:state.partyLayout,sheetDirections:state.sheetDirections,preferredCurrency:state.preferredCurrency,currencyReferences:state.currencyReferences,cleaning:state.cleaning},
  library:{customFields:state.customFields,templates:state.templates,aliasMap:state.aliasMap,counterpartyResolutions:state.counterpartyResolutions},
  forms:caseFormValues(),analysed:!!state.analysis,photo:irSubjectPhotoData,accounts:accountRows,accountFields,
  view:{networkZoom,networkFocus}
 };
}
function validateCaseSnapshot(data){
 if(!data||data.format!=='finintel-case'||data.schemaVersion!==1)throw Error('This is not a supported FinIntel case file.');
 const plain=value=>value&&typeof value==='object'&&!Array.isArray(value);
 const d=data.dataset,l=data.library;
 if(!plain(d)||!Array.isArray(d.rawRows)||!d.rawRows.length||!Array.isArray(d.sheets)||!plain(d.sourceMapping)||!plain(d.sheetDirections))throw Error('Case dataset or mapping is missing.');
 if(!['transaction','kyc','entity','crypto','custom'].includes(d.datasetType))throw Error('Unsupported case dataset type.');
 if(!plain(l)||!Array.isArray(l.customFields)||!Array.isArray(l.templates)||!plain(l.aliasMap)||!plain(l.counterpartyResolutions)||!plain(data.forms)||!Array.isArray(data.accounts)||!Array.isArray(data.accountFields))throw Error('Case profile or configuration is incomplete.');
 if(d.rawRows.some(row=>!plain(row)))throw Error('Invalid transaction rows.');
 if(d.cleaning&&(!plain(d.cleaning)||!Array.isArray(d.cleaning.events)))throw Error('Invalid cleaning configuration.');
 if(data.accounts.some(row=>!plain(row)))throw Error('Invalid account register.');
 if(data.accountFields.some(f=>!plain(f)||typeof f.id!=='string'||typeof f.label!=='string'))throw Error('Invalid account field definitions.');
 if(data.photo&&(!/^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.test(data.photo)||typeof data.photo!=='string'))throw Error('Unsupported case photograph.');
 return data;
}
function parseCaseFile(text){
 return validateCaseSnapshot(JSON.parse(text,(key,value)=>{
  if(['__proto__','prototype','constructor'].includes(key))throw Error('Unsupported property in case file.');return value;
 }));
}
function applyCaseSnapshot(data){
 // Preserve templates and aliases within this case; do not overwrite browser libraries.
 state.customFields=data.library.customFields;state.templates=data.library.templates;state.aliasMap=data.library.aliasMap;state.counterpartyResolutions=data.library.counterpartyResolutions;
 $('datasetType').value=data.dataset.datasetType;
 loadRows(data.dataset.rawRows,data.dataset.sourceName,data.dataset.sourceType,data.dataset.sheets,false);
 Object.assign(state,{sourceMapping:data.dataset.sourceMapping,sheetDirections:data.dataset.sheetDirections,amountLayout:data.dataset.amountLayout,partyLayout:data.dataset.partyLayout,datasetType:data.dataset.datasetType,preferredCurrency:data.dataset.preferredCurrency||'',currencyReferences:data.dataset.currencyReferences||{},cleaning:data.dataset.cleaning||{enabled:false,uppercase:false,requireReview:true,events:[]},analysis:null,standardized:[]});
 renderCustomFieldList();renderTemplateSelect();refreshMappingUI();restoreCaseForms(data.forms);
 accountRows=JSON.parse(JSON.stringify(data.accounts));accountFields.splice(0,accountFields.length,...data.accountFields);accountPage=1;renderAccountsRegister();
 irSubjectPhotoData=data.photo||'';
 if(irSubjectPhotoData){$('irSubjectPhotoPreview').src=irSubjectPhotoData;$('irSubjectPhotoPreview').hidden=false;$('irPhotoPlaceholder').hidden=true;}
 counterpartySelection.clear();unknownSelection.clear();
 if(data.analysed){
  const error=validateMapping();if(error)throw Error(error);
  state.standardized=standardize();const a=state.datasetType==='transaction'?transactionAnalysis(state.standardized):universalAnalysis(state.standardized);
  renderAnalysis(a);
  // Rendering supplies defaults. Restore the saved edits and drafts afterward.
  restoreCaseForms(data.forms);renderAccountsRegister();if(a.kind==='transaction')renderCleaningTable();
  if(a.kind==='crypto')renderIntelligenceReportPreview();
  if(a.kind==='transaction'){renderIntelligenceReportPreview();networkZoom=Number(data.view?.networkZoom)||NETWORK_DEFAULT_ZOOM;renderNetwork(a);}
  setStep(5);
 }else setStep(2);
}
function markCaseDirty(){if(!state.rawRows.length)return;window.finintelCaseDirty=true;$('caseSaveStatus').textContent='Unsaved changes · Save Case to keep a portable copy.';}
$('saveCaseBtn').onclick=()=>{
 if(!state.rawRows.length){status('caseSaveStatus','Load a dataset before saving a case.',true);return;}
 try{const snapshot=makeCaseSnapshot(),name=($('caseName').value.trim()||'finintel_case').replace(/[^a-z0-9._-]+/gi,'_');
  download(name+'.finintel.json',JSON.stringify(snapshot), 'application/json');window.finintelCaseDirty=false;
  status('caseSaveStatus','Case file downloaded. Keep this file to reopen your work.');
 }catch(error){status('caseSaveStatus','Could not save case: '+error.message,true);}
};
$('openCaseBtn').onclick=()=>$('openCaseFile').click();
$('openCaseFile').onchange=async event=>{
 const file=event.target.files[0];if(!file)return;
 try{
  const data=parseCaseFile(await file.text());
  if(state.rawRows.length&&!window.confirm('Open this case and replace the current workspace? Save your current case first if needed.'))return;
  const old=state.rawRows.length?makeCaseSnapshot():null;
  try{applyCaseSnapshot(data);}catch(error){if(old)applyCaseSnapshot(old);else{$('clearAllBtn').click();}throw error;}
  window.finintelCaseDirty=false;status('caseSaveStatus','Case restored locally: '+file.name+'. Review the restored report before export.');
 }catch(error){status('caseSaveStatus','Could not open case: '+error.message,true);}
 finally{event.target.value='';}
};
document.addEventListener('input',event=>{if(event.target.closest('main, #accountsRegister, #accountEditor'))markCaseDirty();});
document.addEventListener('change',event=>{if(event.target.id!=='openCaseFile')markCaseDirty();});
document.addEventListener('click',event=>{if(event.target.closest('#runAnalysisBtn,#generateIrDraftBtn,#accountAdd,#accountEditorSave,#accountsRows,#accountsColumns,#saveAliasBtn,#applyResolutionBtn,#acknowledgeUnknownBtn,#accountConfirm,#subjectImportApply'))markCaseDirty();});
window.addEventListener('beforeunload',event=>{if(window.finintelCaseDirty){event.preventDefault();event.returnValue='';}});







