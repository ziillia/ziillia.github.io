// Same palette and Lab classifier as the production application. No track writes.
const SPOTIFY_KEY_RGB={
  '1A':[85,242,216],'1B':[5,236,203],'2A':[127,242,169],'2B':[61,237,130],
  '3A':[175,246,142],'3B':[134,242,78],'4A':[231,217,163],'4B':[222,202,115],
  '5A':[254,192,163],'5B':[254,161,129],'6A':[255,173,185],'6B':[255,136,147],
  '7A':[255,173,207],'7B':[255,128,180],'8A':[241,172,231],'8B':[238,130,217],
  '9A':[221,180,251],'9B':[203,144,255],'10A':[190,206,255],'10B':[160,182,255],
  '11A':[137,227,249],'11B':[86,217,248],'12A':[86,239,242],'12B':[4,235,235]
};
function clamp(value,min,max){return Math.min(max,Math.max(min,value));}
function makeCanvas(width,height){const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(width));canvas.height=Math.max(1,Math.round(height));return canvas;}
function srgbLinear(value){const n=value/255;return n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4);}
function rgbLab(r,g,b){const rl=srgbLinear(r),gl=srgbLinear(g),bl=srgbLinear(b),x=(rl*.4124+gl*.3576+bl*.1805)/.95047,y=rl*.2126+gl*.7152+bl*.0722,z=(rl*.0193+gl*.1192+bl*.9505)/1.08883,f=value=>value>.008856?Math.cbrt(value):7.787*value+16/116,fx=f(x),fy=f(y),fz=f(z);return[116*fy-16,500*(fx-fy),200*(fy-fz)];}
function spotifyLabDistance(a,b){const dl=(a[0]-b[0])*.35,da=a[1]-b[1],db=a[2]-b[2];return Math.sqrt(dl*dl+da*da+db*db);}
const SPOTIFY_KEY_LAB=Object.fromEntries(Object.entries(SPOTIFY_KEY_RGB).map(([key,rgb])=>[key,rgbLab(...rgb)]));
function detectSpotifyKeyColor(source,anchor){
  const x=Math.round(source.width*.675),y=Math.max(0,Math.round(anchor.top+source.width*.008)),width=Math.min(source.width-x,Math.round(source.width*.18)),height=Math.min(source.height-y,Math.round(source.width*.105));if(width<10||height<10)return{key:'',confidence:0,centerY:null};
  const canvas=makeCanvas(width,height),context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(source,x,y,width,height,0,0,width,height);const pixels=context.getImageData(0,0,width,height).data,votes={},ys={};canvas.width=canvas.height=1;
  for(let py=0;py<height;py+=2)for(let px=0;px<width;px+=2){const index=(py*width+px)*4,r=pixels[index],g=pixels[index+1],b=pixels[index+2],max=Math.max(r,g,b),min=Math.min(r,g,b);if(max<70||max-min<28)continue;const lab=rgbLab(r,g,b);let bestKey='',bestDistance=Infinity;for(const[key,reference]of Object.entries(SPOTIFY_KEY_LAB)){const distance=spotifyLabDistance(lab,reference);if(distance<bestDistance){bestDistance=distance;bestKey=key;}}if(bestDistance>28)continue;const weight=Math.max(1,29-bestDistance);votes[bestKey]=(votes[bestKey]||0)+weight;(ys[bestKey]??=[]).push(py);}
  const ranked=Object.entries(votes).sort((a,b)=>b[1]-a[1]),best=ranked[0],second=ranked[1];if(!best||best[1]<95)return{key:'',confidence:0,centerY:null};const dominance=best[1]/Math.max(1,second?.[1]||0),positions=ys[best[0]].sort((a,b)=>a-b),confidence=Math.round(clamp(55+Math.min(30,(dominance-1)*28)+Math.min(15,positions.length/10),0,99));return{key:dominance>=1.12?best[0]:'',candidate:best[0],confidence,centerY:y+positions[Math.floor(positions.length/2)],dominance};
}
export function readColorKey(source,center){const color=detectSpotifyKeyColor(source,{top:center-source.width*.03,bottom:center});return {...color,accepted:Boolean(color.key&&color.confidence>=60&&Number.isFinite(color.centerY)&&Math.abs(color.centerY-center)<source.width*.015)};}
