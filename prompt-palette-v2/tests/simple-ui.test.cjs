const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),C=require('../simple-core.js');
test('compact favorites sort naturally by name without reordering stored records; preference reloads',async()=>{
 const s=C.defaults();s.favorites=['test10','test2','test1'].map((name,i)=>({id:'id'+i,name,text:'text'+i,language:'jp',createdAt:'2026-11-07T00:00:00Z',updatedAt:'2026-11-07T00:00:00Z'}));
 delete s.favoriteSort;const b=boot([[C.KEY,JSON.stringify(s)]]),html=()=>b.node('favorites').innerHTML;
 assert.ok(html().indexOf('test1')<html().indexOf('test2'));assert.ok(html().indexOf('test2')<html().indexOf('test10'));
 assert.equal((html().match(/<button /g)||[]).length,9);assert.doesNotMatch(html(),/favorite-preview|favorite-meta|名前変更|削除/);
 await b.input('favoriteSort','name-desc','change');assert.ok(html().indexOf('test10')<html().indexOf('test2'));assert.deepEqual(b.saved().favorites,s.favorites);
 const reloaded=boot([...b.data]);assert.equal(reloaded.node('favoriteSort').value,'name-desc');
 await b.input('favoriteSort','saved','change');assert.ok(html().indexOf('test10')<html().indexOf('test2'));await b.favorite('more','id0');assert.equal(b.node('favoriteMenu').open,true);assert.match(b.node('menuBody').innerHTML,/名前変更/);assert.match(b.node('menuBody').innerHTML,/削除/);
 await b.event('menuClose');assert.equal(b.node('favoriteMenu').open,false);
});
test('editor copy, selection paste and confirmed clear preserve saved favorite text',async()=>{
 const b=boot([], {clipboard:'\n追加\n'});await b.input('draft','abcdef');await b.input('draftName','name');await b.event('saveNew');
 await b.event('editorCopy');assert.deepEqual(b.copied,['abcdef']);b.node('draft').selectionStart=2;b.node('draft').selectionEnd=4;
 await b.event('editorPaste');assert.equal(b.node('draft').value,'ab\n追加\nef');assert.equal(b.saved().draft,'ab\n追加\nef');assert.equal(b.saved().favorites[0].text,'abcdef');assert.equal(b.node('draft').selectionStart,6);
 b.options.confirm=false;await b.event('editorClear');assert.equal(b.node('draft').value,'ab\n追加\nef');b.options.confirm=true;await b.event('editorClear');assert.equal(b.node('draft').value,'');assert.equal(b.saved().favorites[0].text,'abcdef');assert.equal(b.node('editorCopy').disabled,true);
});
test('denied clipboard read preserves the exact draft and provides manual paste guidance',async()=>{
 const b=boot([], {pasteError:true});await b.input('draft','keep exact\n');await b.event('editorPaste');assert.equal(b.node('draft').value,'keep exact\n');assert.match(b.node('storageNotice').textContent,/長押し/);assert.equal(b.node('editorPaste').disabled,false);
});
function boot(entries=[],options={}){
 const data=new Map(entries),nodes=new Map(),copied=[],downloads=[],dialogs=[],errors=[];let serial=0;
 const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',checked:false,disabled:false,hidden:false,innerHTML:'',textContent:'',style:{},handlers:{},classList:{add(){},remove(){}},addEventListener(type,fn){this.handlers[type]=fn;},focus(){},select(){},scrollIntoView(){},showModal(){this.open=true;},close(){this.open=false;},setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;},remove(){},click(){downloads.push({name:this.download,url:this.href});}});return nodes.get(id);};
 const db={getItem:k=>data.has(k)?data.get(k):null,setItem(k,v){if(options.fail&&k===C.KEY)throw Error('QuotaExceeded');data.set(k,String(v));}};
 const document={getElementById:node,createElement:()=>node('created'+serial++),body:{appendChild(){}},execCommand:()=>true};
 const c={window:{isSecureContext:true,addEventListener(){},confirm(message){dialogs.push(message);return options.confirm!==false;},prompt:()=>options.rename??'新しい名前'},localStorage:db,document,navigator:{clipboard:{writeText:async text=>copied.push(text),readText:async()=>{if(options.pasteError)throw Error('NotAllowedError');return options.clipboard||'';}}},crypto:{randomUUID:()=> 'favorite-'+serial++},console:{...console,error:e=>errors.push(e)},Blob,URL:{createObjectURL:blob=>{downloads.push({blob});return 'blob:test';},revokeObjectURL(){}},setTimeout:()=>1,clearTimeout(){}};
 vm.createContext(c);for(const f of ['simple-core.js','simple-app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c,{filename:f});
 return {data,node,copied,downloads,dialogs,options,errors,saved:()=>JSON.parse(data.get(C.KEY)),event:async(id,type='click',target)=>node(id).handlers[type]({target:target||node(id)}),input:async(id,value,type='input')=>{node(id).value=value;await node(id).handlers[type]({target:node(id)});},choose:async(id,checked)=>{node(id).checked=checked;await node(id).handlers.change({target:node(id)});},favorite:async(action,id)=>node('favorites').handlers.click({target:{closest:()=>({dataset:{action,id}})}})};
}
test('simple UI saves exact edited text, preserves draft on selection changes and reloads without regeneration',async()=>{
 const b=boot([['promptPaletteV2','existing bytes'],['promptPaletteV2Collapsed','fold bytes']]);await b.choose('muscle',true);await b.event('generate');
 const exact='  自分の全文\n\n空白も維持。  ';await b.input('draft',exact);await b.input('draftName','自分の名前');await b.choose('vascularity',true);assert.equal(b.node('draft').value,exact);
 await b.event('saveNew');const s=b.saved();assert.equal(s.favorites[0].text,exact);assert.equal(s.favorites[0].name,'自分の名前');assert.equal(s.draft,exact);
 const reload=boot([...b.data]);assert.equal(reload.node('draft').value,exact);assert.equal(reload.node('draftName').value,'自分の名前');assert.equal(reload.saved().favorites[0].text,exact);
 await b.event('copy');assert.deepEqual(b.copied,[exact]);assert.equal(b.data.get('promptPaletteV2'),'existing bytes');assert.equal(b.data.get('promptPaletteV2Collapsed'),'fold bytes');
});
test('simple UI requires explicit update, allows same-name copies, and guards replacing unsaved draft',async()=>{
 const b=boot();await b.input('draft','first');await b.input('draftName','same');await b.event('saveNew');const id=b.saved().activeId;
 await b.input('draft','edited');assert.equal(b.saved().favorites[0].text,'first');b.options.confirm=false;await b.event('generate');assert.equal(b.node('draft').value,'edited');await b.favorite('open',id);assert.equal(b.node('draft').value,'edited');assert.equal(b.dialogs.length,2);
 await b.event('saveUpdate');assert.equal(b.saved().favorites[0].text,'edited');await b.event('saveNew');assert.equal(b.saved().favorites.length,2);assert.equal(b.saved().favorites[0].name,b.saved().favorites[1].name);
 b.options.confirm=true;await b.favorite('open',id);assert.equal(b.node('draft').value,'edited');await b.favorite('rename',id);assert.equal(b.saved().favorites[0].name,'新しい名前');
 await b.favorite('delete',id);assert.equal(b.saved().favorites.length,1);assert.equal(b.node('draft').value,'edited');assert.equal(b.saved().activeId,null);
});
test('simple UI exports/imports full text, skips IDs and does not inject saved markup',async()=>{
 const b=boot();await b.input('draft','<img src=x onerror=evil>\nexact');await b.input('draftName','<script>name</script>');await b.event('saveNew');
 assert.doesNotMatch(b.node('favorites').innerHTML,/<img src=x|<script>/);assert.match(b.node('favorites').innerHTML,/&lt;script/);
 await b.event('export');const json=await b.downloads.find(x=>x.blob).blob.text();const imported=boot();const target={files:[{text:async()=>json}],value:'file'};
 await imported.event('import','change',target);assert.equal(imported.saved().favorites[0].text,'<img src=x onerror=evil>\nexact');
 await imported.event('import','change',target);assert.equal(imported.saved().favorites.length,1);
 const bytes=imported.data.get(C.KEY);await imported.event('import','change',{files:[{text:async()=>'{bad'}],value:'file'});assert.equal(imported.data.get(C.KEY),bytes);
});
test('simple UI leaves drafts copyable after save failure and never shows successful favorite registration',async()=>{
 const b=boot([], {fail:true});await b.input('draft','recover me');await b.input('draftName','draft');await b.event('saveNew');assert.equal(b.node('draft').value,'recover me');assert.equal(b.data.has(C.KEY),false);assert.match(b.node('storageNotice').textContent,/保存できません/);assert.doesNotMatch(b.node('toast').textContent,/保存しました/);await b.event('copy');assert.deepEqual(b.copied,['recover me']);
 const bad=boot([[C.KEY,'{broken']]);await bad.input('draft','keep text');await bad.input('draftName','name');await bad.event('saveNew');assert.equal(bad.data.get(C.KEY),'{broken');assert.equal(bad.node('draft').value,'keep text');
});
