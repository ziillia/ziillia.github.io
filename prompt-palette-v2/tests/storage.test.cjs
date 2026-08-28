/* Storage and app-event regression tests, with a deliberately minimal DOM fixture. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),KEY='promptPaletteV2',BACKUP='promptPaletteV2BackupBeforeV17';
function boot(raw,options={}){
  const data=new Map(raw===undefined?[]:[[KEY,raw]]),handlers={},nodes=new Map();
  if(options.legacy)data.set('promptPaletteV1',options.legacy);
  if(options.fold)data.set('promptPaletteV2Collapsed',options.fold);
  const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',hidden:false,open:false,dataset:{},classList:{add(){},remove(){}},setAttribute(){},addEventListener(){},showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(id);};
  const document={documentElement:{lang:''},getElementById:node,querySelector:node,querySelectorAll:()=>[],addEventListener:(type,fn)=>handlers[type]=fn};
  const localStorage={getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>{if(options.failWrite?.(k))throw Error('Quota');data.set(k,String(v));}};
  const c={window:{addEventListener(){}},document,localStorage,console,navigator:{},setTimeout:()=>0,clearTimeout(){},crypto:{randomUUID:()=> 'fixture-id'}};vm.createContext(c);
  for(const file of ['catalog.js','engine.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c,{filename:file});
  return {data,node,click:async(dataset)=>handlers.click({target:{closest:()=>({dataset})}}),submit:()=>handlers.submit({target:{id:'customForm'},preventDefault(){}}),toggle:(id,open)=>handlers.toggle({target:{dataset:{fold:id},open}})};
}
test('bootstrap backs up exact legacy bytes once, preserving custom text and collapse keys',()=>{
  const raw=JSON.stringify({selectedMaster:'neutral',selectedScenes:['custom-a'],scenes:[{id:'custom-a',title:'Custom',text:' JP ',textEn:' EN ',notes:{value:1}}]},null,3);
  const b=boot(raw,{fold:'{"scene":true,"pose":false,"unknown":true}'});
  assert.equal(b.data.get(BACKUP),raw);const s=JSON.parse(b.data.get(KEY));assert.equal(s.schemaVersion,17);assert.equal(s.custom.scenes[0].text,' JP ');assert.deepEqual(s.custom.scenes[0].notes,{value:1});
  assert.match(b.node('app').innerHTML,/data-fold="scenes" >/);b.toggle('scenes',true);assert.equal(JSON.parse(b.data.get('promptPaletteV2Collapsed')).unknown,true);
});
test('legacy V1 fallback migrates without deleting V1',()=>{
  const raw='{"selectedMaster":"safe","selectedOutfit":""}',b=boot(undefined,{legacy:raw});assert.equal(b.data.get('promptPaletteV1'),raw);assert.equal(b.data.get(BACKUP),raw);assert.equal(JSON.parse(b.data.get(KEY)).look,'safe');
});
test('unreadable and future data are never overwritten after interaction',async()=>{
  for(const raw of ['{broken',JSON.stringify({schemaVersion:18}),JSON.stringify({unrecognized:true})]){
    const b=boot(raw);await b.click({path:'layout',value:'2'});assert.equal(b.data.get(KEY),raw);assert.match(b.node('storageNotice').textContent,/停止/);
  }
});
test('backup or migration write failure leaves old storage intact',async()=>{
  const raw='{"selectedMaster":"neutral"}';
  for(const blocked of [BACKUP,KEY]){const b=boot(raw,{failWrite:k=>k===blocked});await b.click({path:'layout',value:'2'});assert.equal(b.data.get(KEY),raw);assert.match(b.node('storageNotice').textContent,/停止/);}
});
test('stale tab cannot overwrite another tab and custom text cannot inject markup',async()=>{
  const b=boot();b.data.set(KEY,'{"newer":"external"}');await b.click({path:'layout',value:'3'});assert.equal(b.data.get(KEY),'{'+'"newer":"external"}');assert.match(b.node('storageNotice').textContent,/別のタブ/);
  const raw={schemaVersion:17,custom:{scenes:[{id:'x" onclick="evil',title:'<img src=x onerror=evil>',text:'safe',textEn:'safe'}]}};
  const x=boot(JSON.stringify(raw));assert.doesNotMatch(x.node('app').innerHTML,/<img src=x/);assert.match(x.node('app').innerHTML,/&lt;img/);assert.doesNotMatch(x.node('app').innerHTML,/data-id="x" onclick=/);
});
test('UI selections preserve multi-body and toggle optional outfit/coverage',async()=>{
  const b=boot();await b.click({path:'body.regions',value:'hypertrophy-delts'});await b.click({path:'body.regions',value:'hypertrophy-lats'});await b.click({path:'outfitId',value:'bold'});await b.click({path:'outfitId',value:'bold'});await b.click({path:'coverageId',value:'coverage-strong'});await b.click({path:'coverageId',value:'coverage-strong'});
  const s=JSON.parse(b.data.get(KEY));assert.deepEqual(s.body.regions,['hypertrophy-delts','hypertrophy-lats']);assert.equal(s.outfitId,'');assert.equal(s.coverageId,'');
});
test('custom editor preserves both languages and metadata; failed save retains draft',async()=>{
  const raw=JSON.stringify({schemaVersion:17,custom:{poses:[{id:'mine',title:'A',text:'old jp',textEn:'old en',custom:true,extra:42}]}}),b=boot(raw);
  await b.click({action:'info',group:'poses',id:'mine'});await b.click({action:'edit-item'});b.node('editTitle').value='New';b.node('editJp').value='新しい日本語';b.node('editEn').value='New English';b.submit();
  const row=JSON.parse(b.data.get(KEY)).custom.poses[0];assert.equal(row.extra,42);assert.equal(row.text,'新しい日本語');assert.equal(row.textEn,'New English');
  const fail=boot(raw,{failWrite:k=>k===KEY});await fail.click({action:'info',group:'poses',id:'mine'});await fail.click({action:'edit-item'});fail.node('editTitle').value='Draft';fail.node('editJp').value='draft text';fail.submit();assert.equal(fail.data.get(KEY),raw);assert.equal(fail.node('editJp').value,'draft text');assert.equal(fail.node('sheet').open,true);
});
test('custom bodies select custom IDs, independently of bust boolean',()=>{
  const b=boot(JSON.stringify({schemaVersion:17,body:{bust:true},custom:{bodies:[{id:'custom-x',title:'X',text:'x',textEn:'x'}]}}));
  assert.match(b.node('app').innerHTML,/data-path="body.customIds" data-value="custom-x" aria-pressed="false"/);
});
test('malformed collapse storage is preserved',()=>{const b=boot(undefined,{fold:'{bad'});b.toggle('scenes',true);assert.equal(b.data.get('promptPaletteV2Collapsed'),'{bad');});
