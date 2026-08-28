const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../engine.js'),C=require('../catalog.js');
const defaults=E.defaults;
test('every built-in has JP/EN; public labels and output avoid legacy location words',()=>{
  for(const rows of Object.values(C))for(const row of rows){
    assert.ok(row.text&&row.textEn,row.id);assert.ok(row.title&&row.titleEn,row.id);
    assert.doesNotMatch(row.textEn,/[\u3040-\u30ff\u3400-\u9fff]/u);
    assert.doesNotMatch([row.title,row.titleEn,row.text,row.textEn].join(' '),/hotel|beach|ホテル|ビーチ|ベッド/i);
  }
});
test('migration preserves custom metadata, selections, IDs and resolves legacy axis overlaps',()=>{
  const custom={id:'mine',title:'追加',text:'【見出し】\n独自の本文',textEn:'[Title]\nCustom text.',extra:{note:'retain'}};
  const raw={selectedMaster:'attack',selectedLanguage:'en',selectedVariation:'keep',selectedLayout:'3',selectedScenes:['hotel','sunset','mine'],selectedPoses:['sitting','partner-pov','candid-close','mine'],selectedBodies:['hypertrophy','hypertrophy-direct','hypertrophy-delts','hypertrophy-lats','vascularity-athlete','vascularity-extreme','full-bust','mine'],selectedOutfit:'mine',selectedCoverage:'coverage-strong',scenes:[custom],poses:[custom],outfits:[custom],bodies:[custom]};
  const before=JSON.stringify(raw),{state:s,migrated}=E.migrate(raw);
  assert.equal(JSON.stringify(raw),before);assert.equal(migrated,true);
  assert.deepEqual(s.sceneIds,['soft-interior','mine']);assert.equal(s.lighting,'sunset');assert.equal(s.expression,'partner-pov');assert.deepEqual(s.poseIds,['sitting','mine']);
  assert.equal(s.body.mass,'hypertrophy-direct');assert.equal(s.body.vascularity,'vascularity-extreme');assert.deepEqual(s.body.regions,['hypertrophy-delts','hypertrophy-lats']);assert.equal(s.body.bust,true);assert.deepEqual(s.body.customIds,['mine']);
  assert.equal(s.outfitId,'mine');assert.equal(s.coverageId,'coverage-strong');assert.equal(s.language,'en');assert.equal(s.look,'attack');assert.equal(s.variation,'keep');assert.equal(s.layout,'3');
  for(const g of E.groups)assert.deepEqual(s.custom[g],[{...custom,custom:true}]);
  assert.deepEqual(E.migrate(s),{state:s,migrated:false});
});
test('legacy default and optional outfit survive; malformed/future data is rejected',()=>{
  assert.equal(E.migrate({selectedMaster:'neutral',selectedOutfit:''}).state.outfitId,'');
  assert.equal(E.migrate({selectedMaster:'neutral'}).state.variation,'balanced');
  for(const raw of [null,[],{},'string',{schemaVersion:18}])assert.throws(()=>E.migrate(raw));
});
test('strict EN omits missing or mixed custom English, while preserving source text',()=>{
  const s=defaults();s.language='en';s.custom.scenes=[{id:'a',title:'A',text:'日本語のみ'},{id:'b',title:'B',text:'JP',textEn:'English 日本語'}];s.sceneIds=['a','b'];
  const r=E.compile(s);assert.equal(r.shots[0].sceneId,'');assert.doesNotMatch(r.text,/[\u3040-\u30ff\u3400-\u9fff]/u);assert.equal(r.warnings.length,2);assert.equal(s.custom.scenes[0].text,'日本語のみ');
  assert.equal(E.textOf({text:'',textEn:'Fallback'},'jp'),'Fallback');assert.equal(E.textOf({text:'日本語'},'en'),'');
});
test('leading headings are stripped without altering interior bracket text',()=>{
  assert.equal(E.strip(' 【TITLE】\n\n[SECOND]\n Body [detail]'),'Body [detail]');
  assert.equal(E.strip('Text\n【内側】'),'Text\n【内側】');
});
test('all built-in body combinations produce one coherent mass/vascularity instruction',()=>{
  for(const mass of C.masses)for(const vascularity of C.vascularity)for(let mask=0;mask<16;mask++)for(const language of ['jp','en']){
    const s=defaults();s.language=language;s.body.mass=mass.id;s.body.vascularity=vascularity.id;s.body.regions=C.regions.filter((r,i)=>mask&(1<<i)).map(r=>r.id);
    const r=E.compile(s);assert.equal(r.warnings.length,0);assert.equal(r.shots.length,4);
    if(mass.id!=='reference')assert.doesNotMatch(r.text,/指定部位以外の筋量|Maintain reference muscular mass|Retain reference muscular mass outside/);
    if(mass.id!=='reference'&&mask)assert.match(r.text,/全身の筋量増加に加え|In addition to overall growth/);
    if(language==='en')assert.doesNotMatch(r.text,/[\u3040-\u30ff\u3400-\u9fff]/u);
    assert.doesNotMatch(r.text,/\b(?:MASTER|VARIATION|LAYOUT|SCENE|POSE|OUTFIT|COVERAGE|BODY|KEEP|BALANCED|DYNAMIC)\b/);
  }
});
test('KEEP locks every implicit axis; explicit scene, pose and camera override only their axis',()=>{
  const s=defaults();s.variation='keep';s.layout='3';s.expression='partner-pov';let r=E.compile(s);
  assert.ok(r.shots.every(x=>x.distance==='reference'&&x.angle==='reference'&&x.light==='reference'&&!x.poseId&&!x.sceneId));
  s.sceneIds=['soft-interior'];s.poseIds=['sitting'];r=E.compile(s);assert.ok(r.shots.every(x=>x.sceneId==='soft-interior'&&x.poseId==='sitting'&&x.light==='window'&&x.distance==='reference'&&x.angle==='reference'));
  s.distance='close';r=E.compile(s);assert.ok(r.shots.every(x=>x.distance==='close'&&x.angle==='reference'));
  s.variation='dynamic';s.distance='reference';s.angle='reference';s.lighting='reference';r=E.compile(s);assert.ok(r.shots.every(x=>x.distance==='reference'&&x.angle==='reference'&&x.light==='reference'));
});
test('one scene and posture per shot; fixed count; overflow rotates deterministically',()=>{
  for(let n=1;n<=5;n++){
    const s=defaults();s.layout=String(n);s.sceneIds=C.scenes.map(x=>x.id);s.poseIds=C.poses.map(x=>x.id);
    const before=JSON.stringify(s),r=E.compile(s);assert.equal(r.shots.length,n);assert.equal(JSON.stringify(s),before);
    assert.equal((r.text.match(/\d枚目/g)||[]).length,n+ (n>1?1:0));
    assert.deepEqual(r,E.compile(s));s.take=1;assert.notEqual(E.compile(s).shots[0].sceneId,r.shots[0].sceneId);
  }
});
test('unselected strength instructions are absent; no scene-imposed clothing fallback',()=>{
  const s=defaults();s.sceneIds=['beach'];const r=E.compile(s);assert.match(r.text,/参照画像の衣装を維持/);assert.doesNotMatch(r.text,/スイムウェア|血管網|筋量を大幅に|カバー範囲はこの指定/);
});
test('coverage wins styling, and night scene resolves evening-light conflict',()=>{
  const s=defaults();s.outfitId='bold';s.coverageId='coverage-strong';s.sceneIds=['city-night'];s.lighting='sunset';const r=E.compile(s);
  assert.match(r.text,/カバー範囲はこの指定を優先/);assert.doesNotMatch(r.text,/参照画像の衣装を維持する|夕方の低い斜光/);assert.ok(r.shots.every(x=>x.light==='night'));assert.equal(r.warnings.length,1);
});
test('all preset selections compile in both languages without headings or routing jargon',()=>{
  for(const language of ['jp','en'])for(const group of ['scenes','poses','outfits','coverages'])for(const item of C[group]){
    const s=defaults();s.language=language;s.layout='1';s.variation='dynamic';
    if(group==='scenes')s.sceneIds=[item.id];if(group==='poses')s.poseIds=[item.id];if(group==='outfits')s.outfitId=item.id;if(group==='coverages')s.coverageId=item.id;
    const r=E.compile(s);assert.ok(r.text);assert.equal(r.shots.length,1);assert.doesNotMatch(r.text,/【|\[|hotel|beach|ホテル|ビーチ|ベッド/i);
    if(language==='en')assert.doesNotMatch(r.text,/[\u3040-\u30ff\u3400-\u9fff]/u);
  }
});
test('new take changes a default KEEP result only through micro expression',()=>{
  const s=defaults();s.variation='keep';s.layout='1';const a=E.compile(s);s.take=1;const b=E.compile(s);assert.notEqual(a.text,b.text);
  assert.deepEqual({...a.shots[0],text:''},{...b.shots[0],text:''});
});
