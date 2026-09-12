const test=require('node:test');
const assert=require('node:assert/strict');
const {context,plain,html}=require('./source.cjs');

function setup(){
  const nodes={importCollection:{value:'spotify_other'},newPlaylistName:{value:'',hidden:true,focus(){}},saveImportCollection:{hidden:true}};
  const customCollections={},collectionCatalog={},saved=[],messages=[];
  const ctx=context(['normalText','customCollectionDefinition','createCustomCollection','toggleNewPlaylistInput','beginImportCollection','resolveImportCollection','saveImportCollection'],{
    customCollections,collectionCatalog,customCollectionId:()=>`user_playlist_${Object.keys(customCollections).length}`,
    recordSharedMutation:(scope,id)=>saved.push({scope,id,value:structuredClone(customCollections[id])}),
    $:id=>nodes[id],setTimeout:fn=>fn(),
    refreshImportCollectionOptions:id=>{nodes.importCollection.value=id;ctx.toggleNewPlaylistInput();},
    refreshCollectionFilter:()=>{},collectionLabel:id=>collectionCatalog[id]?.label||id,
    setImportStatus:(text,kind)=>messages.push({text,kind})
  });
  return{ctx,nodes,customCollections,saved,messages};
}
test('visible create button opens named destination and saves selected destination',()=>{
  const s=setup();s.ctx.beginImportCollection();assert.equal(s.nodes.newPlaylistName.hidden,false);assert.equal(s.nodes.saveImportCollection.hidden,false);
  s.nodes.newPlaylistName.value='シティポップ';s.ctx.saveImportCollection();
  assert.equal(s.nodes.importCollection.value,'user_playlist_0');assert.equal(s.saved[0].scope,'customCollections');
  assert.equal(s.saved[0].value.label,'シティポップ');assert.equal(s.nodes.newPlaylistName.hidden,true);
  assert.equal(s.ctx.resolveImportCollection(),'user_playlist_0');assert.equal(s.messages.at(-1).kind,'ok');
});
test('blank name does not create a destination',()=>{
  const s=setup();s.ctx.beginImportCollection();s.nodes.newPlaylistName.value='  ';s.ctx.saveImportCollection();
  assert.equal(s.saved.length,0);assert.equal(s.messages.at(-1).kind,'error');assert.equal(s.nodes.newPlaylistName.hidden,false);
});
test('same named destination is reused without changing existing collections',()=>{
  const s=setup();const id=s.ctx.createCustomCollection('韓国R&B');const before=plain(s.customCollections);
  assert.equal(s.ctx.createCustomCollection(' 韓国R&B '),id);assert.equal(s.saved.length,1);assert.deepEqual(plain(s.customCollections),before);
});
test('named destination reloads from existing storage key',()=>{
  const s=setup();s.ctx.createCustomCollection('シティポップ');
  const ctx=context(['CUSTOM_COLLECTIONS_STORAGE_KEY','loadCustomCollections'],{localStorage:{getItem:key=>{assert.equal(key,'driveDjCustomCollectionsV1');return JSON.stringify(s.customCollections);}}});
  assert.deepEqual(plain(ctx.loadCustomCollections()),plain(s.customCollections));
});
test('Enter ignores Japanese IME composition and explicit save is available',()=>{
  assert.match(html,/id="newImportCollection"/);assert.match(html,/id="saveImportCollection"/);
  assert.match(html,/event.key==='Enter'&&!event.isComposing&&event.keyCode!==229/);
});
