import {readColorKey} from './key-color.mjs';
import {findRowCandidates,createTracker} from './sampler.mjs';
import {cropInkLine} from '../tools/ocr-lab/adaptive-crop.mjs';
import {createWorkerReader} from './worker-client.mjs';

const $=id=>document.getElementById(id),video=$('video');
let controller=null;
let busy=false,cancelled=false,reader=null,sourceURL='',page=0,rows=[],report=null;
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c;};
const release=c=>{if(c)c.width=c.height=1;};
const check=()=>{if(cancelled)throw new Error('読み取りを中止しました。');};
function progress(value,text){$('progress').value=value;$('status').textContent=text;}
function updateControls(){for(const id of ['file','device','limit'])$(id).disabled=busy;$('start').disabled=busy||!$('file').files?.length||$('device').value!=='ipad';$('cancel').hidden=!busy;$('download').disabled=!report;}
function stop(){cancelled=true;controller?.abort();reader?.close();reader=null;}
function waitMedia(event,timeout=15000){return new Promise((resolve,reject)=>{
 let timer;const signal=controller?.signal;
 const clear=()=>{clearTimeout(timer);video.removeEventListener(event,ok);video.removeEventListener('error',bad);signal?.removeEventListener('abort',abort);};
 const ok=()=>{clear();resolve();};const bad=()=>{clear();reject(new Error('動画を開けませんでした。この端末で再生できるMP4を選んでください。'));};const abort=()=>{clear();reject(new Error('読み取りを中止しました。'));};
 if(signal?.aborted){abort();return;}video.addEventListener(event,ok,{once:true});video.addEventListener('error',bad,{once:true});signal?.addEventListener('abort',abort,{once:true});timer=setTimeout(()=>{clear();reject(new Error('動画の準備がタイムアウトしました。ページを開き直してお試しください。'));},timeout);
 });}
async function seek(time){check();const target=Math.max(0,Math.min(video.duration-.03,time));if(Math.abs(video.currentTime-target)>.005||video.readyState<2){const waiting=waitMedia('seeked');video.currentTime=target;await waiting;}await new Promise(requestAnimationFrame);check();}
function cleanup(){reader?.close();reader=null;video.pause();video.removeAttribute('src');video.load();if(sourceURL)URL.revokeObjectURL(sourceURL);sourceURL='';}
function render(){
 const pages=Math.max(1,Math.ceil(rows.length/20));page=Math.min(page,pages-1);$('page').textContent=rows.length?`${page+1} / ${pages}`:'0 / 0';$('prev').disabled=page===0;$('next').disabled=page>=pages-1;$('results').replaceChildren();
 for(const row of rows.slice(page*20,page*20+20)){
  const article=document.createElement('article'),title=document.createElement('h3'),artist=document.createElement('p'),meta=document.createElement('p');title.textContent=`#${row.number} ${row.title||'曲名を読み取れませんでした'}`;artist.className='artist';artist.textContent=row.artist||'artist未取得';meta.className='meta';meta.textContent=`元動画 ${row.time.toFixed(2)}秒 · ${row.bpm?row.bpm+' BPM':'BPM未取得'} · ${row.key||'KEY未取得'}${row.duplicateOf?' · #'+row.duplicateOf+'と同じ読取文字':''}`;article.append(title,artist,meta);
  if(row.error){const p=document.createElement('p');p.className='warn';p.textContent='要確認: '+row.error;article.append(p);}
  if(row.imageURL){const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='切り取り画像';details.append(summary);details.addEventListener('toggle',()=>{if(details.open&&!details.querySelector('img')){const im=document.createElement('img');im.alt='OCRへ渡した上段の曲名と下段のartist';im.src=row.imageURL;details.append(im);}else if(!details.open)details.querySelector('img')?.remove();});article.append(details);}
  $('results').append(article);
 }
 $('summary').textContent=`読み取り候補 ${rows.length}件`;
}
function compact(text){return String(text||'').replace(/([ぁ-んァ-ヶ一-龠々ー])\s+(?=[ぁ-んァ-ヶ一-龠々ー])/g,'$1').replace(/\s+/g,' ').trim();}
function artistText(text){return compact(text).replace(/^.{0,5}?ビデオ\s*[・·.：:]?\s*/,'').replace(/^[□▣▢▶▷\s]+/,'').trim();}
function smallField(source,center,field){
 const w=source.width,box=field==='bpm'?{x:w*.778,y:center-w*.044,width:w*.09,height:w*.032}:{x:w*.772,y:center-w*.016,width:w*.06,height:w*.032};
 if(box.y<0||box.y+box.height>source.height)throw new Error('BPM/KEYが見切れています。');
 const c=canvas(box.width,box.height),ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,Math.round(box.x),Math.round(box.y),c.width,c.height,0,0,c.width,c.height);
 const p=ctx.getImageData(0,0,c.width,c.height);let x0=c.width,y0=c.height,x1=-1,y1=-1;
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4,r=p.data[i],g=p.data[i+1],b=p.data[i+2],ink=field==='bpm'?r*.299+g*.587+b*.114>120:Math.max(r,g,b)>100&&Math.max(r,g,b)-Math.min(r,g,b)>48;if(ink){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
 if(x1<0){release(c);throw new Error(field==='bpm'?'BPM文字が見つかりません。':'色付きKEYが見つかりません。');}
 const tight=canvas(x1-x0+5,y1-y0+5),tc=tight.getContext('2d');tc.fillStyle=field==='bpm'?'#101010':'white';tc.fillRect(0,0,tight.width,tight.height);tc.drawImage(c,x0,y0,x1-x0+1,y1-y0+1,2,2,x1-x0+1,y1-y0+1);release(c);
 const d=tc.getImageData(0,0,tight.width,tight.height);for(let y=0;y<tight.height;y++)for(let x=0;x<tight.width;x++){const i=(y*tight.width+x)*4,lum=d.data[i]*.299+d.data[i+1]*.587+d.data[i+2]*.114;const v=field==='bpm'?255-lum:(x>=2&&x<tight.width-2&&y>=2&&y<tight.height-2&&lum<105?0:255);d.data[i]=d.data[i+1]=d.data[i+2]=v;}tc.putImageData(d,0,0);return tight;
}
async function evidence(a,b){const c=canvas(Math.max(a.width,b.width)+12,a.height+b.height+18),ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(a,6,6);ctx.drawImage(b,6,a.height+12);try{const blob=await new Promise(resolve=>c.toBlob(resolve,'image/jpeg',.9));return blob?URL.createObjectURL(blob):'';}finally{release(c);}}

async function run(){
 if(busy||!$('file').files?.length||$('device').value!=='ipad')return;
 for(const row of rows)if(row.imageURL)URL.revokeObjectURL(row.imageURL);rows=[];page=0;render();busy=true;cancelled=false;controller=new AbortController();report={build:'frame-ocr-preview-2026-09-30',device:'ipad',file:$('file').files[0].name,startedAt:new Date().toISOString(),status:'running',rows:[],notes:['Raw OCR candidates only. No canonicalization, confirmation, app storage or DB writes.','Candidate tracks and duplicate text do not establish song identity.']};$('error').hidden=true;updateControls();const started=performance.now();let low,source;
 try{
  const file=$('file').files[0];sourceURL=URL.createObjectURL(file);const metadata=waitMedia('loadedmetadata');video.src=sourceURL;video.load();await metadata;
  if(!Number.isFinite(video.duration)||video.duration<=0||video.duration>600)throw new Error('10分以内の動画を選んでください。');if(video.videoWidth>=video.videoHeight)throw new Error('この検証ページはiPadの縦画面録画用です。');
  report.video={width:video.videoWidth,height:video.videoHeight,duration:video.duration};
  const lowWidth=320,lowHeight=Math.round(lowWidth*video.videoHeight/video.videoWidth);low=canvas(lowWidth,lowHeight);const lc=low.getContext('2d',{willReadFrequently:true}),interval=Math.max(.25,video.duration/500),tracker=createTracker({height:lowHeight,maxGap:Math.max(.65,interval*2.1)});let samples=0,rejectedFrames=0;
  for(let t=.04;t<video.duration-.03;t+=interval){await seek(t);lc.drawImage(video,0,0,low.width,low.height);const candidates=findRowCandidates(lc.getImageData(0,0,low.width,low.height));if(!candidates.length)rejectedFrames++;tracker.update(candidates,t);samples++;progress(30*t/video.duration,`完全な行を探しています · ${Math.round(t)} / ${Math.round(video.duration)}秒`);}
  const candidates=tracker.finish();release(low);low=null;report.sampling={samples,rejectedFrames,candidates:candidates.length,ms:Math.round(performance.now()-started)};
  const limit=Number($('limit').value),ordered=[...candidates].sort((a,b)=>a.best_time-b.best_time||a.best_y-b.best_y),chosen=ordered.length<=limit?ordered:Array.from({length:limit},(_,i)=>ordered[Math.round(i*(ordered.length-1)/(limit-1))]);report.sampling.selected=chosen.length;report.sampling.limit=limit;
  if(!chosen.length)throw new Error('読み取れる行が見つかりませんでした。Spotifyのミックスで色付きKEYが見える動画を選んでください。');
  check();progress(31,`候補 ${candidates.length}件 · 高精度OCRを準備しています…\n初回はモデルの取得に時間がかかります。`);reader=await createWorkerReader(message=>{if(!cancelled)progress(32,typeof message==='string'?message:message.message||'高精度OCRを準備しています…');},{signal:controller.signal});check();
  const width=Math.min(1280,video.videoWidth),height=Math.round(width*video.videoHeight/video.videoWidth),roi={x:Math.round(width*.015),y:Math.round(height*.15),width:Math.round(width*.97),height:Math.round(height*.74)},ratio=video.videoWidth/width;
  source=canvas(roi.width,roi.height);const sc=source.getContext('2d',{willReadFrequently:true});
  for(let i=0;i<chosen.length;i++){
   check();const candidate=chosen[i];progress(35+64*i/chosen.length,`高精度OCR · ${i+1} / ${chosen.length}候補\n元動画 ${candidate.best_time.toFixed(2)}秒`);await seek(candidate.best_time);sc.drawImage(video,roi.x*ratio,roi.y*ratio,roi.width*ratio,roi.height*ratio,0,0,source.width,source.height);const center=candidate.best_y*width/lowWidth-roi.y,row={number:i+1,time:video.currentTime,candidateId:candidate.id,stable:candidate.best_stable,title:'',artist:'',bpm:null,key:'',error:''};let title,artist,bpm,key;
   try{
    title=cropInkLine(source,center,'title',{invert:true});artist=cropInkLine(source,center,'artist',{invert:true});row.boxes={title:title.box,artist:artist.box};row.imageURL=await evidence(title.canvas,artist.canvas);
    const a=await reader.read(title.canvas),b=await reader.read(artist.canvas);row.rawTitle=a.text;row.rawArtist=b.text;row.title=compact(a.text);row.artist=artistText(b.text);row.scores={title:a.score,artist:b.score};
    try{bpm=smallField(source,center,'bpm');const bp=await reader.read(bpm),color=readColorKey(source,center);row.rawBpm=bp.text;row.keyColor=color;const bm=String(bp.text).replace(/\s/g,'').match(/^(\d{2,3})BPM$/i);if(bm&&Number(bm[1])>=40&&Number(bm[1])<=300)row.bpm=Number(bm[1]);if(color.accepted){row.key=color.key;row.keySource='color';}}catch(e){check();row.error=String(e.message);}
    if(!row.title||!row.artist||!row.bpm||!row.key)row.error=row.error||'文字またはBPM/KEYの取得が不完全です。';
    const duplicate=rows.find(r=>r.title===row.title&&r.artist===row.artist&&r.bpm===row.bpm&&r.key===row.key&&row.title&&row.artist);if(duplicate)row.duplicateOf=duplicate.number;
   }catch(e){check();row.error=String(e.message);}finally{release(title?.canvas);release(artist?.canvas);release(bpm);release(key);}
   rows.push(row);const {imageURL,...saved}=row;report.rows.push(saved);render();await new Promise(requestAnimationFrame);
  }
  report.status='complete';progress(100,`読み取り完了 · ${rows.length}候補 · ${((performance.now()-started)/1000).toFixed(1)}秒\n${candidates.length>chosen.length?'残りは候補数の上限により未処理です。\n':''}切り取り画像と曲名・artistをご確認ください。`);
 }catch(e){report.status=cancelled?'cancelled':'error';report.error=String(e.message);$('error').textContent=report.error;$('error').hidden=false;progress($('progress').value,cancelled?'中止しました。読み取り済みの結果は確認できます。':'読み取りを停止しました。診断JSONを保存できます。');}
 finally{report.elapsedMs=Math.round(performance.now()-started);release(low);release(source);cleanup();busy=false;updateControls();}
}
$('file').addEventListener('change',updateControls);$('device').addEventListener('change',updateControls);$('start').addEventListener('click',run);$('cancel').addEventListener('click',stop);$('prev').addEventListener('click',()=>{page--;render();});$('next').addEventListener('click',()=>{page++;render();});
$('download').addEventListener('click',()=>{if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='drive-dj-ocr-preview.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
window.addEventListener('pagehide',()=>{stop();cleanup();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&busy){stop();}});updateControls();
