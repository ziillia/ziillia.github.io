const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {context,html,plain}=require('./source.cjs');
function canvas(width,height){
  const c={width,height,rows:Array(height).fill(null)};
  c.getContext=()=>({clearRect(){c.rows.fill(null);},drawImage(source,sx,sy,sw,sh,dx,dy,dw,dh){
    for(let y=0;y<dh;y++)c.rows[dy+y]=source.rows[sy+Math.floor(y*sh/dh)];
  }});
  return c;
}
test('panorama writer reuses backing canvas and preserves overlap pixels and origins',async()=>{
  const allocated=[],pages=[];
  const ctx=context(['releaseOcrCanvas','clipVideoOriginSegments','appendVideoOriginSegment','createPanoramaWriter'],{
    makeCanvas:(w,h)=>{const c=canvas(w,h);allocated.push(c);return c;},
    canvasBlob:async c=>{pages.push([...c.rows]);return 'blob';},videoImportAbort:false
  });
  const source=canvas(10,300);source.rows=Array.from({length:300},(_,i)=>i);
  const writer=await ctx.createPanoramaWriter(10,200,20),backing=writer.canvas;
  await writer.append(source,0,300,{frameId:7});await writer.flush(false);
  assert.equal(writer.canvas,backing);assert.deepEqual(pages,[source.rows.slice(0,200),source.rows.slice(180)]);
  assert.equal(writer.origins[1].segments[0].frameId,7);
  for(const temporary of allocated.slice(1)){assert.equal(temporary.width,1);assert.equal(temporary.height,1);}
  writer.dispose();assert.equal(backing.width,1);assert.equal(backing.height,1);
});
test('panorama encode failure releases temporary output without claiming a blob',async()=>{
  const allocated=[];const ctx=context(['releaseOcrCanvas','clipVideoOriginSegments','appendVideoOriginSegment','createPanoramaWriter'],{
    makeCanvas:(w,h)=>{const c=canvas(w,h);allocated.push(c);return c;},canvasBlob:async()=>{throw Error('encode');},videoImportAbort:false
  });
  const writer=await ctx.createPanoramaWriter(10,200,20);await writer.append(canvas(10,100));
  await assert.rejects(writer.flush(false),/encode/);assert.equal(allocated[1].width,1);assert.equal(writer.blobs.length,0);writer.dispose();
});
test('OCR canvas retained until recognition settles then released on success and failure',async()=>{
  const ctx=context(['releaseOcrCanvas','recognizeOwnedCanvas']);
  for(const fail of [false,true]){
    const c=canvas(100,200);const worker={recognize:async(actual,...args)=>{
      assert.equal(actual,c);assert.equal(c.width,100);assert.deepEqual(args,[{}, {tsv:true}]);
      if(fail)throw Error('ocr');return{data:{text:'unchanged'}};
    }};
    if(fail)await assert.rejects(ctx.recognizeOwnedCanvas(worker,c,{}, {tsv:true}),/ocr/);
    else assert.equal((await ctx.recognizeOwnedCanvas(worker,c,{}, {tsv:true})).data.text,'unchanged');
    assert.equal(c.width,1);assert.equal(c.height,1);
  }
});
test('cancel rejects panorama append and explicit dispose releases backing',async()=>{
  const ctx=context(['releaseOcrCanvas','createPanoramaWriter'],{makeCanvas:canvas,videoImportAbort:true});
  const writer=await ctx.createPanoramaWriter(10);await assert.rejects(writer.append(canvas(10,100)),/中止/);writer.dispose();assert.equal(writer.canvas.width,1);
});
test('inline application script remains syntactically valid',()=>{
  const blocks=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('src=')&&!m[1].includes('application/ld+json'));
  assert.ok(blocks.length);for(const m of blocks)new vm.Script(m[2]);
});
