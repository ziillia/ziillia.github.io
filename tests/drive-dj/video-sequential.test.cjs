const test=require('node:test');
const assert=require('node:assert/strict');
const {context,plain,html}=require('./source.cjs');

test('engine cleanup waits for Tesseract before disposing Paddle and clears references',async()=>{
  const events=[];
  const ctx=context(['releaseVideoOcrEngines'],{
    videoOcrWorker:{terminate:async()=>{await Promise.resolve();events.push('tesseract');}},
    videoPaddleOcr:{dispose:async()=>events.push('paddle')}
  });
  await ctx.releaseVideoOcrEngines();await ctx.releaseVideoOcrEngines();
  assert.deepEqual(events,['tesseract','paddle']);assert.equal(ctx.videoOcrWorker,null);assert.equal(ctx.videoPaddleOcr,null);
});

for(const scenario of ['adopt','keep-tesseract','paddle-error','paddle-off'])test('two-pass matches previous row result: '+scenario,async()=>{
  let paddleCalls=0,closed=0;
  const source={width:100,height:300,close:()=>closed++};
  const anchor={top:20,bottom:30,bpm:120,confidence:90,keyColor:{accepted:true,key:'3A',confidence:90}};
  const original={title:{text:'Original',raw:'Original',confidence:90},artist:{text:'Artist',raw:'Artist',confidence:90}};
  const worker={setParameters:async()=>{}};
  const ctx=context(['recognizeSpotifyPanorama','finalizeSpotifyVideoRow','recognizeQueuedVideoRows'],{
    imageSourceFromBlob:async()=>source,cropForOcr:()=>({}),recognizeOwnedCanvas:async()=>({data:{}}),
    spotifyBpmAnchors:()=>[structuredClone(anchor)],spotifyKeyGate:()=>anchor.keyColor,
    videoDebugReport:null,videoImportAbort:false,prepareVideoRowSource:async(w,s,a)=>({source:s,anchor:a,plan:{}}),
    spotifyTitleVisualHash:()=> 'titlehash',spotifyArtistVisualHash:()=> 'artisthash',cachedTesseractRow:()=>original,
    exactKnownSpotifyArtist:x=>x,looksMultiArtistCredit:()=>false,canonicalizeSpotifyOcrRow:x=>({...x}),needsPaddleReview:()=>true,
    $:()=>({checked:scenario!=='paddle-off'}),shouldAdoptPaddle:()=>scenario==='adopt',
    recognizeSpotifyPaddleFields:async()=>{paddleCalls++;return{attempted:true,error:scenario==='paddle-error'?'test':'',title:{text:'Paddle',raw:'Paddle'},artist:{text:'Artist',raw:'Artist'},score:95};},
    renderVideoDebug:()=>{}
  });
  const old=await ctx.recognizeSpotifyPanorama(worker,'blob');const previousCalls=paddleCalls;
  const queue=[];const initial=await ctx.recognizeSpotifyPanorama(worker,'blob',0,null,queue);
  assert.equal(initial.length,0);assert.equal(queue.length,1);assert.equal(paddleCalls,previousCalls,'first pass must never invoke Paddle');
  assert.equal(queue[0].recovery.source,undefined,'queue retains metadata, not decoded images');
  const next=await ctx.recognizeQueuedVideoRows(['blob'],queue);
  assert.deepEqual(plain(next),plain(old));assert.equal(closed,3);
});

test('second pass releases reconstructed frame on failure and stops on cancel',async()=>{
  let closed=0;const ctx=context(['recognizeQueuedVideoRows'],{
    videoImportAbort:false,readVideoSourceFrame:async()=>({close:()=>closed++}),finalizeSpotifyVideoRow:async()=>{throw Error('failure');}
  });
  const queue=[{recovery:{owned:true,frameId:0},panoramaIndex:0}];
  await assert.rejects(ctx.recognizeQueuedVideoRows([],queue),/failure/);assert.equal(closed,1);
  ctx.videoImportAbort=true;await assert.rejects(ctx.recognizeQueuedVideoRows([],queue),/中止/);assert.equal(closed,1);
});

test('analysis terminates first-stage engines before executing high-precision pass',()=>{
  const start=html.indexOf('async function analyzeVideoImport()');const body=html.slice(start,html.indexOf('async function readFile(',start));
  assert.ok(!body.includes('await getVideoPaddleOcr()'));
  assert.match(body,/await releaseVideoOcrEngines\(\);closeVideoSeamDecoder\(\);setVideoProgress\(72/);
  assert.ok(body.indexOf('recognizeSpotifyPanorama(')<body.indexOf('recognizeQueuedVideoRows('));
});
