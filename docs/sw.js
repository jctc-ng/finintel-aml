'use strict';
const CACHE='finintel-aml-v3.2.1';
const CORE=['./','./index.html','./styles.css?v=3.2.1','./app.js?v=3.2.1','./docx-export.js?v=3.2.1','./case-workspace.js?v=3.2.1','./offline.js?v=3.2.1','./vendor/xlsx.full.min.js?v=0.18.5','./manifest.webmanifest?v=3.2.1','./assets/nfiu-logo.jpg?v=20261025b','./assets/icon-192.png','./assets/icon-512.png','./sample-data/sample_transactions.csv','./sample-data/sample_description_transactions.csv'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 try{await cache.addAll(CORE);}catch(error){await caches.delete(CACHE);throw error;}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith('finintel-aml-')&&key!==CACHE).map(key=>caches.delete(key)));
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(event.request.mode==='navigate'){
   // Serve one complete app version. Updates install in the background.
   const shell=await cache.match('./index.html');if(shell)return shell;
  }
  const cached=await cache.match(event.request);if(cached)return cached;
  try{return await fetch(event.request);}catch(error){
   // Never substitute HTML for a missing script, image or CSV.
   return new Response('This resource is unavailable offline.',{status:503,headers:{'Content-Type':'text/plain'}});
  }
 })());
});
