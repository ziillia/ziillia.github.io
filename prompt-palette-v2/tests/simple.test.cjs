const test=require('node:test'),assert=require('node:assert/strict'),C=require('../simple-core.js');
const row=(id='a',text='  独自の全文\n\n改行と空白。  ')=>( {id,name:'同じ名前',text,language:'jp',createdAt:'2026-11-07T00:00:00.000Z',updatedAt:'2026-11-07T00:00:00.000Z'} );
const storage=(entries=[])=>{const data=new Map(entries);return {data,getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v)};};
test('simple generator: all 16 bilingual combinations keep selected edits independent',()=>{
 for(const language of ['jp','en'])for(let mask=0;mask<8;mask++){
  const s={language,muscle:!!(mask&1),vascularity:!!(mask&2),bust:!!(mask&4)},before=JSON.stringify(s),text=C.compile(s);
  assert.equal(JSON.stringify(s),before);assert.match(text,/成人女性|adult woman/);assert.match(text,/非性的|non-sexual/);
  assert.equal(/全身の筋量を増やし|Increase overall muscular mass/.test(text),s.muscle);
  assert.equal(/表在血管|superficial veins/.test(text),s.vascularity);assert.equal(/バストは|Adjust the bust/.test(text),s.bust);
  assert.match(text,/衣装のデザイン、素材、着用状態|clothing design, material and state of wear/);
  assert.match(text,/写真を1枚|one non-sexual fitness photograph/);assert.match(text,/文字は入れない|No text/);
  if(s.muscle)assert.doesNotMatch(text,/身体全体の筋肉量や骨格とのバランスを維持|Retain the overall muscular mass/);
  if(language==='en')assert.doesNotMatch(text,/[\u3040-\u30ff\u3400-\u9fff]/u);
 }
});
test('isolated store round-trips exact draft, favorite text, dates and duplicate names',()=>{
 const db=storage([['promptPaletteV2','legacy exact bytes'],['promptPaletteV2Collapsed','{"x":true}']]),store=new C.Store(db),s=C.defaults();
 s.draft='\n edited text  \n';s.draftName='名前';s.draftLanguage='en';s.favorites=[row('a'),row('b')];s.activeId='a';store.save(s);
 const reload=new C.Store(db);assert.deepEqual(reload.state,s);assert.equal(db.getItem('promptPaletteV2'),'legacy exact bytes');assert.equal(db.getItem('promptPaletteV2Collapsed'),'{"x":true}');
 const destination=C.defaults(),merged=C.mergeFavorites(destination,C.exportFavorites(s));assert.equal(merged.added,2);assert.deepEqual(merged.state.favorites,s.favorites);assert.deepEqual(destination,C.defaults());
 assert.equal(C.mergeFavorites(merged.state,C.exportFavorites(s)).skipped,2);
});
test('malformed/future storage and stale-tab conflicts never overwrite saved bytes',()=>{
 for(const raw of ['{bad',JSON.stringify({...C.defaults(),version:2}),JSON.stringify({...C.defaults(),favorites:[row(),row()]})]){
  const db=storage([[C.KEY,raw]]),store=new C.Store(db);assert.ok(store.blocked);assert.throws(()=>store.save(C.defaults()));assert.equal(db.getItem(C.KEY),raw);
 }
 const db=storage(),a=new C.Store(db),b=new C.Store(db);a.save(C.defaults());assert.throws(()=>b.save(C.defaults()),/別のタブ/);assert.equal(db.getItem(C.KEY),JSON.stringify(C.defaults()));
});
test('write failures keep stored state and favorites intact',()=>{
 const db=storage(),store=new C.Store(db),s=C.defaults();s.favorites=[row()];store.save(s);const saved=db.getItem(C.KEY);db.setItem=()=>{throw Error('QuotaExceeded');};
 const next=C.clone(s);next.favorites[0].text='replacement';assert.throws(()=>store.save(next));assert.equal(db.getItem(C.KEY),saved);assert.deepEqual(store.state,s);
});
test('import validates all records before merging and keeps existing same-ID records',()=>{
 const s=C.defaults();s.favorites=[row('a')];const source=C.defaults();source.favorites=[row('a','changed'),row('b')];
 const m=C.mergeFavorites(s,C.exportFavorites(source));assert.equal(m.added,1);assert.equal(m.skipped,1);assert.equal(m.state.favorites[0].text,s.favorites[0].text);
 const before=JSON.stringify(s);
 for(const text of ['{bad',JSON.stringify({format:C.FORMAT,version:2,favorites:[]}),JSON.stringify({format:C.FORMAT,version:1,favorites:[row('b'),{...row('c'),text:''}]}),JSON.stringify({format:C.FORMAT,version:1,favorites:[row('b'),row('b')]})])assert.throws(()=>C.mergeFavorites(s,text));
 assert.equal(JSON.stringify(s),before);
});
