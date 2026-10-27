'use strict';
let cryptoLinkMode='chain',cryptoLinkKey='',cryptoLinkPage=0;
function cryptoLinkGroups(a,mode){
 const map=new Map();
 for(const r of a.records){
  const x=typeof exchangeRecord==='function'?exchangeRecord(r):null,p=x?.linkedP2P?.data;
  if(mode==='chain'&&!['deposit','withdrawal'].includes(r.cryptoType))continue;
  if(mode==='p2p'&&(!p||r.cryptoType!=='p2p'))continue;
  const asset=r.asset,network=mode==='p2p'?(p.Currency||'Fiat not supplied'):r.network,key=JSON.stringify([asset,network]);
  if(!map.has(key))map.set(key,{key,asset,network,left:[],right:[]});
  const g=map.get(key),side=mode==='chain'?(r.cryptoType==='deposit'?'left':'right'):(String(p['Buyer UID'])===String(a.exchangeBundle?.uid)?'left':'right');
  const address=mode==='chain'?(r.values.counterparty_wallet||'Address not supplied'):(x.otherUid||'UID not supplied');
  let node=g[side].find(n=>n.address===address);if(!node){node={address,rows:[],side};g[side].push(node);}node.rows.push(r);
 }
 for(const g of map.values())for(const side of ['left','right'])g[side].sort((a,b)=>b.rows.length-a.rows.length||a.address.localeCompare(b.address));
 return [...map.values()];
}
function cryptoLinkModel(a,mode,key,page=0){const groups=cryptoLinkGroups(a,mode),g=groups.find(g=>g.key===key)||groups[0];if(!g)return null;const pages=Math.max(1,Math.ceil(Math.max(g.left.length,g.right.length)/8)),p=Math.min(Math.max(0,page),pages-1);return {...g,page:p,pages,left:g.left.slice(p*8,p*8+8),right:g.right.slice(p*8,p*8+8),mode};}
function cryptoLinkCanvas(a,m){
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1000;const c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,1600,1000);
 const text=(s,x,y,size=22,color='#173b51')=>{c.fillStyle=color;c.font=size+'px Arial';c.fillText(s,x,y);};
 text((m.mode==='chain'?'Blockchain relationships':'P2P relationships')+' — '+m.asset+' / '+m.network,35,45,28);text('Page '+(m.page+1)+' of '+m.pages+' · Links reflect uploaded records, not verified ownership',35,82,18);
 const centerY=500;c.fillStyle='#e6f1fa';c.fillRect(610,425,380,150);text('SUBJECT EXCHANGE ACCOUNT',635,463,20);text(String(a.exchangeBundle?.uid||irField('subjectName')||'Subject').slice(0,25),635,510,25);
 for(const side of ['left','right']){text(m.mode==='chain'?(side==='left'?'Sending addresses':'Receiving addresses'):(side==='left'?'Sellers to subject':'Buyers from subject'),side==='left'?30:1080,125,23);
  m[side].forEach((n,i)=>{const y=165+i*96,x=side==='left'?25:1090;c.strokeStyle='#7597ad';c.lineWidth=2;c.beginPath();c.moveTo(side==='left'?505:990,side==='left'?y+30:centerY);c.lineTo(side==='left'?610:1090,side==='left'?centerY:y+30);c.stroke();
   const tipX=side==='left'?610:1090,tipY=side==='left'?centerY:y+30;c.fillStyle='#4f7992';c.beginPath();c.moveTo(tipX,tipY);c.lineTo(tipX-12,tipY-7);c.lineTo(tipX-12,tipY+7);c.fill();c.fillStyle=side==='left'?'#eaf5fc':'#edf7f0';c.fillRect(x,y,480,72);
   const addr=n.address.length>36?n.address.slice(0,19)+'…'+n.address.slice(-13):n.address;text(addr,x+12,y+26,20);text(n.rows.length+' transactions · '+cryptoQuantitySum(n.rows)+' '+m.asset,x+12,y+55,18);
  });
 }
 text('Amounts are asset quantities. P2P orders are linked to history and are not additional blockchain transfers.',30,965,18);return canvas;
}
function cryptoLinkImages(a){let html='';for(const mode of ['chain','p2p'])for(const g of cryptoLinkGroups(a,mode)){const first=cryptoLinkModel(a,mode,g.key);for(let page=0;page<first.pages;page++){const m=cryptoLinkModel(a,mode,g.key,page);html+='<div style="text-align:center;page-break-inside:avoid"><h3>'+esc((mode==='chain'?'Blockchain':'P2P')+' relationships — '+g.asset+' / '+g.network+' — '+(page+1)+'/'+m.pages)+'</h3><img alt="Crypto relationship graph" src="'+cryptoLinkCanvas(a,m).toDataURL('image/png')+'" style="width:100%;height:auto"></div>';}}return html;}
function renderCryptoLinks(a){
 let panel=$('cryptoRelationshipPanel');if(!panel){panel=document.createElement('section');panel.id='cryptoRelationshipPanel';panel.className='card pad results-grid';$('intelligenceReportBuilder').before(panel);}panel.hidden=a.kind!=='crypto';if(panel.hidden)return;
 const m=cryptoLinkModel(a,cryptoLinkMode,cryptoLinkKey,cryptoLinkPage),groups=cryptoLinkGroups(a,cryptoLinkMode);if(m){cryptoLinkKey=m.key;cryptoLinkPage=m.page;}
 panel.innerHTML='<h3>Crypto relationship view</h3><p>Choose an asset and network, then select a counterparty to inspect its transactions and full hashes. Only classified deposits/withdrawals appear in the blockchain view. Non-final records remain in the transaction history.</p><div class="button-row"><label>Relationship type <select id="cryptoLinkMode"><option value="chain">Blockchain addresses</option><option value="p2p">P2P counterparties</option></select></label><label>Asset / network or fiat currency <select id="cryptoLinkGroup"></select></label><label>Page <select id="cryptoLinkPage"></select></label><button type="button" class="btn secondary" id="cryptoLinkPng">Download graph PNG</button><button type="button" class="btn secondary" id="cryptoLinkWord">Download all graphs Word</button></div><p id="cryptoLinkStatus" role="status"></p><div id="cryptoLinkGraphic"></div><div id="cryptoLinkNodes" class="button-row"></div><div id="cryptoLinkDetails"></div>';
 $('cryptoLinkMode').value=cryptoLinkMode;$('cryptoLinkGroup').innerHTML=groups.map(g=>'<option value="'+esc(g.key)+'">'+esc(g.asset+' / '+g.network)+'</option>').join('');if(m)$('cryptoLinkGroup').value=m.key;
 $('cryptoLinkPage').innerHTML=m?Array.from({length:m.pages},(_,i)=>'<option value="'+i+'">'+(i+1)+' / '+m.pages+'</option>').join(''):'';if(m)$('cryptoLinkPage').value=m.page;
 $('cryptoLinkMode').onchange=e=>{cryptoLinkMode=e.target.value;cryptoLinkKey='';cryptoLinkPage=0;renderCryptoLinks(a);};$('cryptoLinkGroup').onchange=e=>{cryptoLinkKey=e.target.value;cryptoLinkPage=0;renderCryptoLinks(a);};$('cryptoLinkPage').onchange=e=>{cryptoLinkPage=Number(e.target.value);renderCryptoLinks(a);};
 for(const id of ['cryptoLinkPng','cryptoLinkWord'])$(id).disabled=!m;
 if(!m){$('cryptoLinkStatus').textContent='No eligible relationships. P2P graphs require linked buyer/seller UIDs; review mappings and order matches.';return;}
 const canvas=cryptoLinkCanvas(a,m);canvas.style.width='100%';canvas.style.height='auto';canvas.setAttribute('aria-label','Relationship graph. Use counterparty buttons below for full details.');$('cryptoLinkGraphic').append(canvas);
 for(const n of [...m.left,...m.right]){const btn=document.createElement('button');btn.type='button';btn.className='btn secondary';btn.style.overflowWrap='anywhere';btn.textContent=(n.side==='left'?'From: ':'To: ')+n.address+' ('+n.rows.length+')';btn.onclick=()=>{
  $('cryptoLinkDetails').innerHTML='<h4>'+esc(n.address)+'</h4>'+cryptoRowsHtml(n.rows);const save=document.createElement('button');save.type='button';save.className='btn secondary';save.textContent='Download these transactions CSV';save.onclick=()=>{if(a.exchangeBundle)exchangeDownload('Selected_crypto_counterparty',exchangeHeaders,exchangeDetailRows(n.rows));else exchangeOriginalExport({...a,records:n.rows},'');};$('cryptoLinkDetails').prepend(save);};$('cryptoLinkNodes').append(btn);}
 canvas.onclick=e=>{const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*1600/rect.width,y=(e.clientY-rect.top)*1000/rect.height,side=x<505?'left':x>1090?'right':null,i=Math.floor((y-165)/96);if(side&&i>=0&&i<m[side].length&&((y-165)%96)<72){const offset=side==='right'?m.left.length:0;$('cryptoLinkNodes').children[offset+i].click();$('cryptoLinkDetails').scrollIntoView({block:'nearest',behavior:'smooth'});}};
 $('cryptoLinkPng').onclick=()=>{const link=document.createElement('a');link.download='FinIntel_Crypto_'+m.asset+'_relationships_'+(m.page+1)+'.png';link.href=canvas.toDataURL('image/png');link.click();};
 $('cryptoLinkWord').onclick=async()=>{try{status('cryptoLinkStatus','Preparing graphs…');const blob=await FinIntelDocx.build('<h1>Crypto relationship views</h1>'+cryptoLinkImages(a),{landscape:true});FinIntelDocx.save('FinIntel_Crypto_Relationships.docx',blob);status('cryptoLinkStatus','Graphs saved.');}catch(e){status('cryptoLinkStatus',e.message,true);}};
}
const cryptoLinksOriginalRender=renderAnalysis;
renderAnalysis=function(a){cryptoLinksOriginalRender(a);renderCryptoLinks(a);};
const cryptoLinksOriginalReport=cryptoReportBody;
cryptoReportBody=function(a,logo){return cryptoLinksOriginalReport(a,logo).replace('<h2>CRYPTOCURRENCY / VASP RECORD ANALYSIS</h2>','<h2 style="text-align:center">COUNTERPARTY RELATIONSHIP VIEW</h2>'+cryptoLinkImages(a)+'<h2>CRYPTOCURRENCY / VASP RECORD ANALYSIS</h2>');};
