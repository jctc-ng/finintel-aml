'use strict';
// Native OOXML export. ZIP uses stored entries so it needs no CDN or server.
window.FinIntelDocx=(()=>{
 const encoder=new TextEncoder();
 const xml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'');
 const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 const relns='http://schemas.openxmlformats.org/package/2006/relationships';
 const office='http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
 function crc32(bytes){let crc=-1;for(const b of bytes){crc^=b;for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^-1)>>>0;}
 function zip(files){
  const chunks=[],directory=[];let offset=0;
  const header=(length,write)=>{const data=new Uint8Array(length);write(new DataView(data.buffer));return data;};
  for(const [path,content] of files){const name=encoder.encode(path),data=typeof content==='string'?encoder.encode(content):content,crc=crc32(data);
   const local=header(30,v=>{v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);});
   const central=header(46,v=>{v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint16(8,0x800,true);v.setUint16(14,33,true);v.setUint32(16,crc,true);v.setUint32(20,data.length,true);v.setUint32(24,data.length,true);v.setUint16(28,name.length,true);v.setUint32(42,offset,true);});
   chunks.push(local,name,data);directory.push(central,name);offset+=local.length+name.length+data.length;
  }
  const size=directory.reduce((n,b)=>n+b.length,0),end=header(22,v=>{v.setUint32(0,0x06054b50,true);v.setUint16(8,files.length,true);v.setUint16(10,files.length,true);v.setUint32(12,size,true);v.setUint32(16,offset,true);});
  return new Blob([...chunks,...directory,end],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
 }
 async function loadImage(source){
  const url=new URL(source,window.location.href);
  if(url.protocol!=='data:'&&url.origin!==window.location.origin)throw Error('An image points outside this application. Upload it locally before exporting.');
  if(url.protocol==='data:'&&!/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(source))throw Error('Unsupported embedded image format.');
  const response=await fetch(url.href);if(!response.ok)throw Error('Unable to read an image for embedding.');
  const blob=await response.blob(),bitmap=await createImageBitmap(blob);
  try{
   const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
   const context=canvas.getContext('2d');if(!context)throw Error('Image renderer unavailable.');
   context.drawImage(bitmap,0,0);
   const png=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!png)throw Error('Image conversion failed.');
   return {bytes:new Uint8Array(await png.arrayBuffer()),width:bitmap.width,height:bitmap.height};
  }finally{bitmap.close();}
 }
 async function build(html,options={}){
  const parsed=new DOMParser().parseFromString(html,'text/html');
  const root=parsed.querySelector('.ir-doc')||parsed.body;
  // Keep the portrait above the profile table, avoiding fragile merged-cell layout.
  for(const cell of Array.from(root.querySelectorAll('.ir-subject-photo'))){const img=cell.querySelector('img');if(img){const p=parsed.createElement('p');p.className='ir-subject-photo';p.style.textAlign='center';p.append(img);cell.closest('table').before(p);}cell.remove();}
  const media=[],relationships=[],imageCache=new Map();let drawingId=0;
  const landscape=!!options.landscape,pageWidth=landscape?16838:11906,pageHeight=landscape?11906:16838,margin=850,contentWidth=pageWidth-margin*2;
  const run=(text,style={})=>'<w:r><w:rPr>'+(style.bold?'<w:b/>':'')+(style.italic?'<w:i/>':'')+(style.underline?'<w:u w:val="single"/>':'')+(style.size?'<w:sz w:val="'+style.size+'"/>':'')+'</w:rPr><w:t xml:space="preserve">'+xml(text)+'</w:t></w:r>';
  const paragraph=(content,props='')=>'<w:p><w:pPr><w:spacing w:after="110"/>'+props+'</w:pPr>'+content+'</w:p>';
  async function image(node){
   const source=node.getAttribute('src');if(!source)return '';
   let asset=imageCache.get(source);
   if(!asset){const data=await (options.imageLoader||loadImage)(source);asset={...data,index:media.length+1};media.push(['word/media/image'+asset.index+'.png',asset.bytes]);relationships.push('<Relationship Id="img'+asset.index+'" Type="'+office+'image" Target="media/image'+asset.index+'.png"/>');imageCache.set(source,asset);}
   const isLogo=!!node.closest('.ir-header'),isPhoto=!!node.closest('.ir-subject-photo');
   const maxWidth=isLogo?780:isPhoto?1100:contentWidth,maxHeight=isLogo?780:isPhoto?1700:pageHeight-margin*2-1200;
   const scale=Math.min(maxWidth/asset.width,maxHeight/asset.height),cx=Math.round(asset.width*scale*635),cy=Math.round(asset.height*scale*635),id=++drawingId;
   return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="'+cx+'" cy="'+cy+'"/><wp:docPr id="'+id+'" name="Image '+id+'" descr="'+xml(node.getAttribute('alt')||'Report image')+'"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="'+id+'" name="image'+asset.index+'.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="img'+asset.index+'"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
  }
  async function inline(node,style={}){
   if(node.nodeType===3)return run(node.textContent,style);if(node.nodeType!==1)return '';
   const tag=node.tagName.toLowerCase();if(tag==='br')return '<w:r><w:br/></w:r>';if(tag==='img')return image(node);
   const next={...style,bold:style.bold||['strong','b','th'].includes(tag),italic:style.italic||['em','i'].includes(tag),underline:style.underline||tag==='u'};
   let output='';for(const child of node.childNodes)output+=await inline(child,next);return output;
  }
  const centered=node=>!!node.closest('.ir-header, .ir-signature')||node.style?.textAlign==='center'||node.parentElement?.style?.textAlign==='center';
  async function blocks(node){
   if(node.nodeType===3)return node.textContent.trim()?paragraph(run(node.textContent)):'';
   if(node.nodeType!==1)return '';
   const tag=node.tagName.toLowerCase();if(['script','style','head'].includes(tag))return '';
   if(tag==='table'){
    let rows='';const tableRows=Array.from(node.rows);
    for(const row of tableRows){let cells='';for(const cell of row.cells){const colspan=Number(cell.getAttribute('colspan'))||1;
     // A repeated picture is preferable to an invalid vertical merge in an editable table.
     const hasBlocks=Array.from(cell.children).some(el=>['P','DIV','TABLE','UL','OL'].includes(el.tagName));
     const body=hasBlocks?await children(cell):paragraph(await inline(cell,{bold:cell.tagName==='TH'}));cells+='<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/>'+(colspan>1?'<w:gridSpan w:val="'+colspan+'"/>':'')+(cell.tagName==='TH'?'<w:shd w:fill="EDF2F6"/>':'')+'</w:tcPr>'+(body||paragraph(''))+'</w:tc>';}
     rows+='<w:tr><w:trPr>'+(row.parentElement.tagName==='THEAD'?'<w:tblHeader/>':'')+'</w:trPr>'+cells+'</w:tr>';
    }
    const border=['top','left','bottom','right','insideH','insideV'].map(side=>'<w:'+side+' w:val="single" w:sz="4" w:color="B8C4CE"/>').join('');
    return '<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>'+border+'</w:tblBorders><w:tblCellMar><w:top w:w="75" w:type="dxa"/><w:left w:w="85" w:type="dxa"/><w:bottom w:w="75" w:type="dxa"/><w:right w:w="85" w:type="dxa"/></w:tblCellMar></w:tblPr>'+rows+'</w:tbl>'+paragraph('');
   }
   if(['h1','h2','h3','h4','p','li','img'].includes(tag)){
    const heading=/^h[1-4]$/.test(tag),style=heading?{bold:true,size:tag==='h1'?28:tag==='h2'?28:26,underline:tag==='h2'}:{};
    const props=(centered(node)?'<w:jc w:val="center"/>':'')+(heading?'<w:keepNext/><w:spacing w:before="160" w:after="100"/>':'');
    return paragraph((tag==='li'?run('• '):'')+await inline(node,style),props);
   }
   const breakBefore=node.classList.contains('ir-page-break')?paragraph('<w:r><w:br w:type="page"/></w:r>'):'';
   if(node.classList.contains('ir-draft-banner')||node.classList.contains('ir-warning'))return paragraph(await inline(node,{bold:true,size:19}),'<w:jc w:val="center"/>');
   if(node.classList.contains('ir-pre'))return node.textContent.split('\n').map(line=>paragraph(run(line))).join('');
   if(node.classList.contains('ir-signature'))return paragraph(run(node.textContent,{bold:true}));
   return breakBefore+await children(node);
  }
  async function children(node){let output='';for(const child of node.childNodes)output+=await blocks(child);return output;}
  const body=await children(root),footer=parsed.querySelector('.ir-print-footer')?.textContent||'';
  const footerXml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="'+ns+'">'+paragraph(run(footer,{size:15}),'<w:jc w:val="center"/>')+paragraph(run('Page ',{size:16})+'<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>','<w:jc w:val="center"/>')+'</w:ftr>';
  relationships.push('<Relationship Id="footer" Type="'+office+'footer" Target="footer1.xml"/>','<Relationship Id="styles" Type="'+office+'styles" Target="styles.xml"/>');
  const document='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="'+ns+'" xmlns:r="'+office+'" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>'+body+'<w:sectPr><w:footerReference w:type="default" r:id="footer"/><w:pgSz w:w="'+pageWidth+'" w:h="'+pageHeight+'"'+(landscape?' w:orient="landscape"':'')+'/><w:pgMar w:top="'+margin+'" w:right="'+margin+'" w:bottom="1100" w:left="'+margin+'" w:footer="400"/></w:sectPr></w:body></w:document>';
  return zip([
   ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>'],
   ['_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="'+relns+'"><Relationship Id="document" Type="'+office+'officeDocument" Target="word/document.xml"/></Relationships>'],
   ['word/document.xml',document],['word/_rels/document.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="'+relns+'">'+relationships.join('')+'</Relationships>'],
   ['word/styles.xml','<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="'+ns+'"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="21"/></w:rPr></w:rPrDefault></w:docDefaults></w:styles>'],['word/footer1.xml',footerXml],...media
  ]);
 }
 function save(filename,blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
 return {build,save};
})();
