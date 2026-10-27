'use strict';
function cryptoPageCompare(a,b,numeric,date=false){
 if(date){const x=parseDate(a),y=parseDate(b);if(x&&y&&!isNaN(x.getTime())&&!isNaN(y.getTime()))return x.getTime()-y.getTime();}
 if(numeric){const x=cryptoDecimal(a),y=cryptoDecimal(b);if(x&&y){const sign=v=>/^\s*-/.test(String(v))?-1n:1n,v=x.units*10n**BigInt(y.scale)*sign(a),w=y.units*10n**BigInt(x.scale)*sign(b);return v<w?-1:v>w?1:0;}}
 return String(a??'').localeCompare(String(b??''),undefined,{numeric:true,sensitivity:'base'});
}
function mountCryptoPagination(target,{id,title,headers,rows,size,numeric=[],dates=[]}){
 const box=document.createElement('section');box.className='crypto-paged';box.id=id;
 let page=0,limit=size,query='',sort=-1,descending=false,matching=[];
 box.innerHTML='<div class="crypto-page-tools"><label>Search '+esc(title.toLowerCase())+'<input type="search" placeholder="Search all records in this section…"></label><label>Rows per page<select>'+[10,25,50,100].map(n=>'<option value="'+n+'">'+n+'</option>').join('')+'</select></label><button type="button" class="btn secondary crypto-page-export">Download matching CSV</button></div><div class="crypto-page-table"></div><nav class="crypto-page-nav" aria-label="'+esc(title)+' pagination"><span class="crypto-page-count" role="status" aria-live="polite"></span><div><button type="button" data-move="first" aria-label="First page">First</button><button type="button" data-move="prev" aria-label="Previous page">Previous</button><span class="crypto-page-number"></span><button type="button" data-move="next" aria-label="Next page">Next</button><button type="button" data-move="last" aria-label="Last page">Last</button></div></nav>';
 target.replaceWith(box);
 const input=box.querySelector('input'),select=box.querySelector('select');select.value=String(limit);
 function render(){
  const terms=query.toLocaleLowerCase().trim();matching=rows.map((row,index)=>({row,index})).filter(x=>!terms||x.row.some(v=>String(v??'').toLocaleLowerCase().includes(terms)));
  if(sort>=0)matching.sort((a,b)=>(descending?-1:1)*cryptoPageCompare(a.row[sort],b.row[sort],numeric.includes(sort),dates.includes(sort))||a.index-b.index);
  const pages=Math.max(1,Math.ceil(matching.length/limit));page=Math.min(Math.max(0,page),pages-1);const start=page*limit,slice=matching.slice(start,start+limit).map(x=>x.row);
  box.querySelector('.crypto-page-table').innerHTML=exchangeTable(headers,slice);
  box.querySelectorAll('th').forEach((th,i)=>{th.setAttribute('scope','col');th.setAttribute('aria-sort',sort===i?(descending?'descending':'ascending'):'none');const btn=document.createElement('button');btn.type='button';btn.className='crypto-sort';btn.textContent=headers[i]+(sort===i?(descending?' ↓':' ↑'):' ↕');btn.setAttribute('aria-label','Sort by '+headers[i]);btn.onclick=()=>{if(sort===i)descending=!descending;else{sort=i;descending=false;}page=0;render();box.querySelectorAll('.crypto-sort')[i]?.focus();};th.replaceChildren(btn);});
  box.querySelector('.crypto-page-count').textContent='Showing '+(matching.length?start+1:0)+'–'+Math.min(start+limit,matching.length)+' of '+matching.length+(terms?' matching records ('+rows.length+' total)':' records');
  box.querySelector('.crypto-page-number').textContent='Page '+(page+1)+' of '+pages;
  box.querySelectorAll('[data-move]').forEach(btn=>{const m=btn.dataset.move;btn.disabled=(m==='first'||m==='prev')?page===0:page===pages-1;btn.onclick=()=>{page=m==='first'?0:m==='last'?pages-1:m==='prev'?page-1:page+1;render();box.querySelector('[data-move="'+m+'"]')?.focus();};});
  box.querySelector('.crypto-page-export').disabled=!matching.length;
 }
 input.oninput=()=>{query=input.value;page=0;render();};select.onchange=()=>{limit=Number(select.value);page=0;render();};
 box.querySelector('.crypto-page-export').onclick=()=>exchangeDownload(title.replace(/\W+/g,'_')+'_Matching',headers,matching.map(x=>x.row));render();
}
const cryptoPaginationOriginalRender=renderAnalysis;
renderAnalysis=function(a){
 cryptoPaginationOriginalRender(a);if(a.kind!=='crypto')return;
 let panel=$('exchangeWorkbookReview');
 if(!a.exchangeBundle){
  if(!panel)return;panel.hidden=false;panel.innerHTML='<h3>Crypto record review</h3><p>Search and sort each section independently. Matching CSV downloads include every matching record, across all pages. Report appendices retain the full dataset.</p><h2>SENDING COUNTERPARTIES</h2><div data-page="send"></div><h2>RECEIVING COUNTERPARTIES</h2><div data-page="receive"></div><details><summary>Individual transactions and hashes</summary><div data-page="transactions"></div></details>';
 }
 const partyHeaders=['Counterparty address','Asset','Network','Transactions','Total quantity'];
 for(const [heading,type,id] of [['SENDING COUNTERPARTIES','deposit','cryptoSendingPage'],['RECEIVING COUNTERPARTIES','withdrawal','cryptoReceivingPage']]){const h=[...panel.querySelectorAll('h2')].find(h=>h.textContent.trim()===heading);if(h?.nextElementSibling)mountCryptoPagination(h.nextElementSibling,{id,title:heading,headers:partyHeaders,rows:exchangeCounterparties(a,type),size:10,numeric:[3,4]});}
 for(const detail of panel.querySelectorAll('details')){const title=detail.querySelector('summary')?.textContent.trim(),target=detail.querySelector('.table-wrap,[data-page]');if(!target)continue;
  if(title==='Individual transactions and hashes')mountCryptoPagination(target,{id:'cryptoTransactionsPage',title,headers:exchangeHeaders,rows:exchangeDetailRows(a.records),size:25,numeric:[6,13,14,16],dates:[0]});
  if(title==='P2P orders'&&a.exchangeBundle)mountCryptoPagination(target,{id:'cryptoP2PPage',title,headers:exchangeP2PHeaders,rows:exchangeP2PRows(a),size:25,numeric:[6,7,8,13],dates:[9,10]});
 }
};
