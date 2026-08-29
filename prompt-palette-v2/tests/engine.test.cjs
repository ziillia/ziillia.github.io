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
  for(const mass of C.masses)for(const vascularity of C.vascularity)for(let mask=0;mask<2**C.regions.length;mask++)for(const language of ['jp','en']){
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
test('unselected environment retains the reference time and light source',()=>{
  for(const variation of ['keep','balanced','dynamic']){
    const s=defaults();s.variation=variation;const r=E.compile(s);assert.doesNotMatch(r.text,/自然な日光と|Natural daylight with/);
    assert.ok(r.shots.every(x=>x.light===(variation==='dynamic'?'session':'reference')));
    s.sceneIds=['city-night'];assert.ok(E.compile(s).shots.every(x=>x.light==='night'));
  }
});
test('all explicit locks produce an identical next take, allowing the UI to disable it',()=>{
  const s=defaults();s.variation='keep';s.expression='reference';const a=E.compile(s).text;s.take=1;assert.equal(E.compile(s).text,a);
});
test('gaze preset retains four visible expression patterns without relationship instructions',()=>{
  const markers={jp:['レンズへ短く視線','笑い終わり','視線は静止','視線をレンズへ戻す'],en:['Briefly meet the lens','end of a laugh','steady gaze','gaze returns to the lens']};
  for(const language of ['jp','en']){
    const s=defaults();s.language=language;s.expression='partner-pov';s.layout='1';s.variation='keep';
    for(let take=0;take<4;take++){
      s.take=take;const r=E.compile(s);
      assert.ok(r.shots[0].text.includes(markers[language][take]));
      assert.doesNotMatch(r.text,/恋人|彼氏|信頼する|胸が高鳴|照れ|親しみ|romantic|partner|trusts|anticipation|shy|warmth/i);
      assert.match(r.text,/変更対象は視線と表情のみ|only to gaze and expression/);
      assert.match(r.text,/撮影者やその手は写さない|photographer and their hands out of frame/);
      if(language==='en')assert.doesNotMatch(r.text,/[\u3040-\u30ff\u3400-\u9fff]/u);
    }
    s.take=4;assert.ok(E.compile(s).shots[0].text.includes(markers[language][0]));
  }
});
test('gaze preset does not alter resolved scene, posture, camera, light, body or wardrobe',()=>{
  for(const language of ['jp','en'])for(const variation of ['keep','balanced','dynamic'])for(const layout of ['1','3','5']){
    const s=defaults();Object.assign(s,{language,variation,layout,sceneIds:['beach','soft-interior'],poseIds:['standing','sitting'],outfitId:'refined',coverageId:'coverage-strong'});
    Object.assign(s.body,{mass:'hypertrophy-direct',regions:['hypertrophy-delts','hypertrophy-lats'],vascularity:'vascularity-extreme'});
    const before=JSON.stringify(s),base=E.compile(s),gaze=E.compile({...s,expression:'partner-pov'});
    assert.equal(JSON.stringify(s),before);
    assert.deepEqual(gaze.shots.map(({text,...shot})=>shot),base.shots.map(({text,...shot})=>shot));
    const common=base.text.split('\n\n').slice(0,-Number(layout));
    for(const paragraph of common)assert.ok(gaze.text.includes(paragraph));
    assert.deepEqual(gaze.warnings,base.warnings);
  }
});
test('existing gaze selection and custom text survive the label change',()=>{
  const s=defaults();s.expression='partner-pov';s.custom.poses=[{id:'custom-copy',title:'Saved',text:'信頼する相手に向けた表情。',textEn:'An expression toward someone she trusts.',custom:true,extra:{keep:true}}];
  const before=JSON.stringify(s),migrated=E.migrate(s);
  assert.equal(migrated.state.expression,'partner-pov');assert.equal(migrated.migrated,false);
  assert.deepEqual(migrated.state.custom,s.custom);assert.equal(JSON.stringify(s),before);
});
test('new poses and overhead angle affect only their explicitly selected axes under KEEP',()=>{
  const poseIds=['supine-arms-open','low-recline-side-turn','kneeling-forward-lean','back-turn-look-over-shoulder'];
  for(const language of ['jp','en'])for(const poseId of poseIds){
    const s=defaults();Object.assign(s,{language,variation:'keep',layout:'1',expression:'reference',poseIds:[poseId]});
    const r=E.compile(s),shot=r.shots[0];
    assert.equal(shot.poseId,poseId);assert.equal(shot.sceneId,'');assert.equal(shot.angle,'reference');assert.equal(shot.distance,'reference');assert.equal(shot.light,'reference');
    assert.ok(shot.text.includes(E.textOf(E.find(s,'poses',poseId),language)));
    s.angle='overhead';const overhead=E.compile(s).shots[0];
    assert.deepEqual({...overhead,text:'',angle:'reference'},{...shot,text:''});
    assert.match(overhead.text,/鉛直下向き|vertically downward/);
    s.poseIds=[];assert.equal(E.compile(s).shots[0].poseId,'');
  }
});
test('pecs growth is independent from bust volume at every global muscle strength',()=>{
  for(const language of ['jp','en'])for(const mass of C.masses)for(const bust of [false,true]){
    const s=defaults();s.language=language;Object.assign(s.body,{mass:mass.id,regions:['hypertrophy-pecs','hypertrophy-delts'],bust,vascularity:'vascularity-extreme'});
    const before=JSON.stringify(s),r=E.compile(s);
    assert.match(r.text,/大胸筋の筋組織|muscle tissue of the pectoralis major/);
    assert.match(r.text,/三角筋前部|anterior, lateral and posterior deltoid/);
    assert.equal(JSON.stringify(s),before);assert.equal(r.state.body.bust,bust);
    if(bust){assert.match(r.text,/バストのボリュームを増やす|Increase bust volume/);assert.doesNotMatch(r.text,/乳房組織自体のボリュームは参照|Retain the reference volume of the breast tissue/);}
    else {assert.match(r.text,/乳房組織自体のボリュームは参照|Retain the reference volume of the breast tissue/);assert.doesNotMatch(r.text,/バストのボリュームを増やす|Increase bust volume/);}
    if(mass.id==='reference')assert.match(r.text,/指定部位以外の筋量は参照|Retain reference muscular mass outside/);
    else assert.match(r.text,/全身の筋量増加に加え|In addition to overall growth/);
  }
  const custom=defaults();custom.body.regions=['hypertrophy-pecs'];custom.body.customIds=['custom-volume'];custom.custom.bodies=[{id:'custom-volume',title:'Custom',text:'バストのボリュームを増やす。',textEn:'Increase bust volume.',custom:true}];
  assert.doesNotMatch(E.compile(custom).text,/乳房組織自体のボリュームは参照/);
});
test('pecs growth leaves shot planning and wardrobe selections untouched',()=>{
  const s=defaults();Object.assign(s,{variation:'dynamic',sceneIds:['beach','soft-interior'],poseIds:['standing','sitting'],expression:'partner-pov',outfitId:'refined',coverageId:'coverage-strong'});
  const base=E.compile(s);s.body.regions=['hypertrophy-pecs'];const pecs=E.compile(s);
  assert.deepEqual(pecs.shots,base.shots);assert.equal(pecs.state.outfitId,base.state.outfitId);assert.equal(pecs.state.coverageId,base.state.coverageId);
  assert.match(pecs.text,/身体の調整を理由に衣装のカバー範囲や撮影距離を変えない/);
});
test('multi-shot layouts forbid gaps between adjacent photographs',()=>{
  for(const language of ['jp','en'])for(const layout of ['2','3','4','5']){
    const s=defaults();s.language=language;s.layout=layout;const text=E.compile(s).text;
    assert.match(text,/写真同士の間に白い余白|Do not place white gaps/);
    assert.match(text,/隣接する写真枠を互いに接して|make adjacent image frames touch/);
    assert.match(text,/写真内のネガティブスペース|within the photographs/);
  }
  const one=defaults();one.layout='1';assert.doesNotMatch(E.compile(one).text,/写真同士の間に白い余白/);
});
test('camera modes preserve individual choices while free and blank omit resolved camera axes',()=>{
  for(const language of ['jp','en'])for(const variation of ['keep','balanced','dynamic'])for(const cameraMode of ['free-distinct','blank']){
    const s=defaults();Object.assign(s,{language,variation,cameraMode,distance:'close',angle:'overhead',lighting:'sunset',expression:'partner-pov'});Object.assign(s.body,{mass:'hypertrophy-direct',vascularity:'vascularity-extreme'});
    const r=E.compile(s);
    assert.equal(r.state.distance,'close');assert.equal(r.state.angle,'overhead');assert.equal(r.state.lighting,'sunset');
    assert.ok(r.shots.every(x=>x.distance===''&&x.angle===''&&x.light===''));
    assert.doesNotMatch(r.text,/身体の調整を理由に衣装のカバー範囲や撮影距離|Physical adjustments must not change clothing coverage or camera distance/);
    assert.doesNotMatch(r.text,/姿勢、撮影距離、衣装|posture, camera distance or clothing/);
    if(cameraMode==='free-distinct'){
      assert.match(r.text,/必ず明確に異なる構図|must use a composition clearly distinct/);
      assert.match(r.text,/同じトリミング、人物サイズ、カメラ位置を繰り返さない|Do not repeat the same crop, subject scale or camera position/);
    }else{
      assert.doesNotMatch(r.text,/必ず明確に異なる構図|must use a composition clearly distinct/);
      for(const item of [...C.distances,...C.angles,...C.lighting])assert.ok(!r.shots.some(x=>x.text.includes(E.textOf(item,language))));
    }
    if(language==='en')assert.doesNotMatch(r.text,/[\u3040-\u30ff\u3400-\u9fff]/u);
  }
});
