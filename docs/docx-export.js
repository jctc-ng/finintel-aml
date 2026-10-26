'use strict';
// Native DOCX objects and packaging are supplied by the bundled docx library.
window.FinIntelDocx=(()=>{
 const clean=value=>String(value??'').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'');
 async function loadImage(source){
  const url=new URL(source,location.href);
  if(url.protocol!=='data:'&&url.origin!==location.origin)throw Error('An image points outside this application. Upload it locally before exporting.');
  if(url.protocol==='data:'&&!/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(source))throw Error('Unsupported embedded image format.');
  const response=await fetch(url.href);if(!response.ok)throw Error('An image could not be loaded for embedding.');
  const bitmap=await createImageBitmap(await response.blob());
  try{const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('Image rendering unavailable.');ctx.drawImage(bitmap,0,0);
   const png=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!png)throw Error('Image conversion failed.');
   return {bytes:new Uint8Array(await png.arrayBuffer()),width:bitmap.width,height:bitmap.height};
  }finally{bitmap.close();}
 }
 async function build(html,options={}){
  const d=window.docx;if(!d?.Document||!d?.Packer)throw Error('The DOCX component is not loaded. Update the app online once, then try again.');
  const parsed=new DOMParser().parseFromString(html,'text/html'),root=parsed.querySelector('.ir-doc')||parsed.body;
  // Move a portrait out of its HTML rowspan so the editable table has a simple grid.
  for(const cell of Array.from(root.querySelectorAll('td.ir-subject-photo'))){const image=cell.querySelector('img');if(image){const p=parsed.createElement('p');p.className='ir-subject-photo';p.style.textAlign='center';p.append(image);cell.closest('table').before(p);}cell.remove();}
  const landscape=!!options.landscape,width=landscape?16838:11906,height=landscape?11906:16838,margin=850,maxImageWidth=(width-margin*2)/15;
  const imageCache=new Map();
  const text=(value,style={})=>new d.TextRun({text:clean(value),...style});
  const centered=node=>!!node.closest('.ir-header')||node.style?.textAlign==='center'||node.parentElement?.style?.textAlign==='center';
  const para=(children,props={})=>new d.Paragraph({children,spacing:{after:110},...props});
  async function imageRun(node){
   const src=node.getAttribute('src');if(!src)return null;
   let image=imageCache.get(src);if(!image){image=await (options.imageLoader||loadImage)(src);imageCache.set(src,image);}
   const logo=!!node.closest('.ir-header'),portrait=!!node.closest('.ir-subject-photo');
   const maxWidth=logo?78:portrait?110:maxImageWidth,maxHeight=logo?78:portrait?150:(height-2500)/15;
   const scale=Math.min(maxWidth/image.width,maxHeight/image.height);
   return new d.ImageRun({type:'png',data:image.bytes,transformation:{width:Math.max(1,Math.round(image.width*scale)),height:Math.max(1,Math.round(image.height*scale))},altText:{title:clean(node.alt||'Report image'),description:clean(node.alt||'Report image'),name:'Embedded report image'}});
  }
  async function inline(node,style={}){
   if(node.nodeType===3)return [text(node.textContent,style)];if(node.nodeType!==1)return [];
   const tag=node.tagName.toLowerCase();if(tag==='br')return [new d.TextRun({break:1})];
   if(tag==='img'){const image=await imageRun(node);return image?[image]:[];}
   const next={...style};if(['b','strong','th'].includes(tag))next.bold=true;if(['i','em'].includes(tag))next.italics=true;if(tag==='u')next.underline={};
   const out=[];for(const child of node.childNodes)out.push(...await inline(child,next));return out;
  }
  async function blocks(node){
   if(node.nodeType===3)return node.textContent.trim()?[para([text(node.textContent)])]:[];
   if(node.nodeType!==1)return [];
   const tag=node.tagName.toLowerCase();if(['style','script','head'].includes(tag))return [];
   if(tag==='table'){
    const rows=[];for(const row of Array.from(node.rows)){
     const cells=[];for(const cell of Array.from(row.cells)){
      const nested=Array.from(cell.children).some(el=>['P','DIV','UL','OL','TABLE'].includes(el.tagName));
      const children=nested?await childBlocks(cell):[para(await inline(cell,{bold:cell.tagName==='TH'}))];
      cells.push(new d.TableCell({children:children.length?children:[para([])],columnSpan:Math.max(1,Number(cell.getAttribute('colspan'))||1),shading:cell.tagName==='TH'?{fill:'EDF2F6'}:undefined,margins:{top:75,bottom:75,left:85,right:85},verticalAlign:d.VerticalAlign.CENTER}));
     }
     rows.push(new d.TableRow({children:cells,tableHeader:row.parentElement.tagName==='THEAD'}));
    }
    if(!rows.length)return [];
    const border={style:d.BorderStyle.SINGLE,size:4,color:'B8C4CE'};
    return [new d.Table({rows,width:{size:100,type:d.WidthType.PERCENTAGE},borders:{top:border,bottom:border,left:border,right:border,insideHorizontal:border,insideVertical:border}}),para([])];
   }
   if(['h1','h2','h3','h4','p','li','img'].includes(tag)){
    const heading=/^h[1-4]$/.test(tag),runs=await inline(node,heading?{bold:true,size:tag==='h1'||tag==='h2'?28:26,underline:tag==='h2'?{}:undefined}:{});
    if(tag==='li')runs.unshift(text('• '));
    return [para(runs,{alignment:centered(node)?d.AlignmentType.CENTER:undefined,keepNext:heading,spacing:{before:heading?160:0,after:110}})];
   }
   if(node.classList.contains('ir-draft-banner')||node.classList.contains('ir-warning'))return [para(await inline(node,{bold:true,size:19}),{alignment:d.AlignmentType.CENTER})];
   if(node.classList.contains('ir-pre'))return node.textContent.split('\n').map(line=>para([text(line)]));
   if(node.classList.contains('ir-signature'))return [para([text(Array.from(node.children).map(el=>el.textContent).join('    '),{bold:true})])];
   const children=await childBlocks(node);if(node.classList.contains('ir-page-break'))children.unshift(new d.Paragraph({children:[new d.PageBreak()]}));return children;
  }
  async function childBlocks(node){const out=[];for(const child of node.childNodes)out.push(...await blocks(child));return out;}
  const children=await childBlocks(root),footer=clean(parsed.querySelector('.ir-print-footer')?.textContent||'');
  const document=new d.Document({creator:'FinIntel',title:clean(parsed.title||'Intelligence report'),styles:{default:{document:{run:{font:'Courier New',size:21},paragraph:{spacing:{after:110}}}}},sections:[{properties:{page:{size:{width,height,orientation:landscape?d.PageOrientation.LANDSCAPE:d.PageOrientation.PORTRAIT},margin:{top:margin,left:margin,right:margin,bottom:1100,footer:400}}},footers:{default:new d.Footer({children:[para([text(footer,{size:15})],{alignment:d.AlignmentType.CENTER}),para([new d.TextRun({children:['Page ',d.PageNumber.CURRENT],size:16})],{alignment:d.AlignmentType.CENTER})]})},children:children.length?children:[para([])]}]});
  return d.Packer.toBlob(document);
 }
 function save(filename,blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
 return {build,save};
})();
