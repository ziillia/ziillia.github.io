const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {context,html}=require('./source.cjs');
function setup(){
  const state={favoriteArtistsOnly:false,page:3},favoriteArtists={},mutations=[];
  const ctx=context(['normalText','esc','favoriteArtistKey','isFavoriteArtistName','artistSearchNames','trackHasFavoriteArtist','favoriteArtistFilterMatches','favoriteArtistButtons','toggleFavoriteArtistsFilter','toggleFavoriteArtist'],{
    state,favoriteArtists,recordSharedMutation:(...args)=>mutations.push(args),showToast:()=>{},updateFavoriteControls:()=>{},render:()=>{},renderArtistSearchSuggestions:()=>{},$:()=>({value:''})
  });return{ctx,state,favoriteArtists,mutations};
}
test('favorite artist filter toggles, resets page and excludes other artists',()=>{
  const s=setup();s.ctx.toggleFavoriteArtist('EXILE');s.ctx.toggleFavoriteArtistsFilter();
  assert.equal(s.state.page,1);assert.equal(s.ctx.favoriteArtistFilterMatches({artist:'EXILE'}),true);
  assert.equal(s.ctx.favoriteArtistFilterMatches({artist:'GENERATIONS from EXILE TRIBE'}),false);
  s.ctx.toggleFavoriteArtistsFilter();assert.equal(s.ctx.favoriteArtistFilterMatches({artist:'Other'}),true);
});
test('multi artist credits match a favorite member without substring matching',()=>{
  const s=setup();s.ctx.toggleFavoriteArtist('Artist');s.state.favoriteArtistsOnly=true;
  assert.equal(s.ctx.favoriteArtistFilterMatches({artist:'Artist; Guest'}),true);
  assert.equal(s.ctx.favoriteArtistFilterMatches({artist:'Artist Junior'}),false);
});
test('detail buttons offer individual credits and escape user supplied text',()=>{
  const s=setup();const markup=s.ctx.favoriteArtistButtons({artist:'A; <B>'});
  assert.equal((markup.match(/data-favorite-artist=/g)||[]).length,2);assert.ok(markup.includes('&lt;B&gt;'));assert.ok(!markup.includes('<B>'));
});
test('register/unregister reuse favoriteArtists sync scope and update pressed state',()=>{
  const s=setup();s.ctx.toggleFavoriteArtist('AAA');assert.ok(s.ctx.favoriteArtistButtons({artist:'AAA'}).includes('aria-pressed="true"'));
  s.ctx.toggleFavoriteArtist('AAA');assert.ok(s.ctx.favoriteArtistButtons({artist:'AAA'}).includes('aria-pressed="false"'));
  assert.deepEqual(s.mutations,[['favoriteArtists','aaa',false],['favoriteArtists','aaa',true]]);
});
test('empty favorites yields no matches and both view templates include buttons',()=>{
  const s=setup();s.state.favoriteArtistsOnly=true;assert.equal(s.ctx.favoriteArtistFilterMatches({artist:'AAA'}),false);
  assert.equal((html.match(/\$\{favoriteArtistButtons\(t\)\}/g)||[]).length,2);
  assert.ok(html.includes('.filter(favoriteArtistFilterMatches)'));
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g))if(!match[1].includes('src='))new vm.Script(match[2]);
});
