// Experimental geometry only: never identifies a song or merges artists.
export function cropInkLine(source, keyCenterY, field, {invert=false}={}) {
 const width=source.width;
 const x=Math.round(width*.172),right=Math.round(width*.66);
 const top=Math.max(0,Math.floor(keyCenterY-width*.065));
 const bottom=Math.min(source.height,Math.ceil(keyCenterY+width*.035));
 const canvas=document.createElement('canvas');canvas.width=right-x;canvas.height=bottom-top;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,x,top,canvas.width,canvas.height,0,0,canvas.width,canvas.height);
 const data=ctx.getImageData(0,0,canvas.width,canvas.height),counts=[];
 const ink=(i)=>{const r=data.data[i],g=data.data[i+1],b=data.data[i+2];return r*.299+g*.587+b*.114>92&&Math.max(r,g,b)-Math.min(r,g,b)<80;};
 for(let y=0;y<canvas.height;y++){let n=0;for(let xx=0;xx<canvas.width;xx++)if(ink((y*canvas.width+xx)*4))n++;counts.push(n);}
 const bands=[];let first=-1,last=-1;
 for(let y=0;y<=counts.length+2;y++){
  if(counts[y]>=3){if(first<0)first=y;last=y;}
  else if(first>=0&&y-last>2){if(last-first>=6)bands.push({top:first,bottom:last});first=-1;}
 }
 // Need two separate complete text lines within the same anchored row.
 if(bands.length!==2){canvas.width=canvas.height=1;throw new Error('Ambiguous row text bands: '+bands.length);}
 const band=bands[field==='title'?0:1];let left=canvas.width,end=-1;
 for(let y=band.top;y<=band.bottom;y++)for(let xx=0;xx<canvas.width;xx++)if(ink((y*canvas.width+xx)*4)){left=Math.min(left,xx);end=Math.max(end,xx);}
 if(left<1||end>=canvas.width-1||band.top<1||band.bottom>=canvas.height-1){canvas.width=canvas.height=1;throw new Error('Clipped row text');}
 const pad=2,box={x:x+left-pad,y:top+band.top-pad,width:end-left+1+pad*2,height:band.bottom-band.top+1+pad*2};
 const output=document.createElement('canvas');output.width=box.width;output.height=box.height;const o=output.getContext('2d');o.drawImage(source,box.x,box.y,box.width,box.height,0,0,box.width,box.height);
 if(invert){const p=o.getImageData(0,0,output.width,output.height);for(let i=0;i<p.data.length;i+=4){const lum=p.data[i]*.299+p.data[i+1]*.587+p.data[i+2]*.114;const v=Math.max(0,Math.min(255,(255-lum-8)*1.18));p.data[i]=p.data[i+1]=p.data[i+2]=v;}o.putImageData(p,0,0);}
 canvas.width=canvas.height=1;return{canvas:output,box,bands};
}
