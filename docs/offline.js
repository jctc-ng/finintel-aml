'use strict';
let offlineRegistration=null,installPrompt=null;
async function refreshOfflineStatus(){
 const el=document.getElementById('offlineStatus');if(!el)return;
 const cache=await caches.open('finintel-aml-v3.4.1-flexiblebank1');
 const ready=await Promise.all(['./index.html','./vendor/xlsx.full.min.js?v=0.18.5','./case-workspace.js?v=3.4.1','./docx-export.js?v=3.4.1'].map(path=>cache.match(path)));
 const prepared=ready.every(Boolean)&&!!navigator.serviceWorker.controller;
 el.textContent=prepared?(navigator.onLine?'Online · Ready for offline use':'Offline · Ready to work'):(navigator.onLine?'Online · Preparing offline files…':'Offline · Setup incomplete');
 el.dataset.ready=String(prepared);
}
window.addEventListener('online',()=>refreshOfflineStatus().catch(()=>{}));
window.addEventListener('offline',()=>refreshOfflineStatus().catch(()=>{}));
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;document.getElementById('installAppBtn').hidden=false;});
document.getElementById('installAppBtn').onclick=async()=>{if(!installPrompt)return;await installPrompt.prompt();installPrompt=null;document.getElementById('installAppBtn').hidden=true;};
document.getElementById('updateAppBtn').onclick=async()=>{
 const info=document.getElementById('offlineActionStatus');
 if(!navigator.onLine){info.textContent='Connect to the internet to check for updates. Your installed app remains usable offline.';return;}
 try{
  if(!offlineRegistration)throw Error('Offline setup is not ready yet.');
  await offlineRegistration.update();
  if(offlineRegistration.installing){info.textContent='Downloading the update. Wait for the update-ready message.';return;}
  if(offlineRegistration.waiting){
   if(window.finintelCaseDirty&&!window.confirm('Save your case before updating. Reload and discard unsaved changes?'))return;
   info.textContent='Applying update…';
   navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});
   offlineRegistration.waiting.postMessage({type:'ACTIVATE_UPDATE'});
  }else info.textContent='No update is waiting. Offline files are ready.';
 }catch(error){info.textContent='Update check failed: '+error.message;}
};
if('serviceWorker' in navigator&&'caches' in window){
 window.addEventListener('load',async()=>{
  const info=document.getElementById('offlineActionStatus');
  try{
   offlineRegistration=await navigator.serviceWorker.register('sw.js',{updateViaCache:'none'});
   const observe=worker=>worker?.addEventListener('statechange',()=>{
    if(worker.state==='installed'){
     if(offlineRegistration.waiting)info.textContent='An update is ready. Save your case, then click Check / Apply Update.';
     refreshOfflineStatus().catch(()=>{});
    }
   });
   observe(offlineRegistration.installing);offlineRegistration.addEventListener('updatefound',()=>observe(offlineRegistration.installing));
   await navigator.serviceWorker.ready;await refreshOfflineStatus();
   if(offlineRegistration.waiting)info.textContent='An update is ready. Save your case, then click Check / Apply Update.';
   navigator.serviceWorker.addEventListener('controllerchange',()=>refreshOfflineStatus().catch(()=>{}));
  }catch(error){info.textContent='Offline setup failed. Reconnect and reload to try again.';}
 });
}else{document.getElementById('offlineStatus').textContent='Offline installation unavailable in this browser';}






