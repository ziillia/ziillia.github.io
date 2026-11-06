(function(){
  'use strict';
  const C=window.PPSimple,$=id=>document.getElementById(id),store=new C.Store(localStorage);
  let state=C.clone(store.state),toastTimer;
  const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function notice(message){$('storageNotice').textContent=message;$('storageNotice').hidden=!message;}
  function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2600);}
  function persist(next){
    try{const saved=store.save(next);state=saved;notice('');return true;}
    catch(e){notice('保存できませんでした。'+e.message+' 入力中の全文はコピーできます。');return false;}
  }
  function active(){return state.favorites.find(f=>f.id===state.activeId);}
  function dirty(){const f=active();return !!state.draft.trim()&&(!f||f.text!==state.draft||f.language!==state.draftLanguage||f.name!==state.draftName);}
  function allowReplace(){return !dirty()||window.confirm('未保存の全文を置き換えます。必要なら先にお気に入りへ保存してください。置き換えますか？');}
  function status(){
    $('charCount').textContent=state.draft.length+'文字';
    $('draftStatus').textContent=state.activeId?(dirty()?'未保存の変更あり':'お気に入りを編集中'):(state.draft?'未登録の全文':'');
    $('saveUpdate').disabled=!active()||!state.draft.trim()||!state.draftName.trim();
    $('saveNew').disabled=!state.draft.trim()||!state.draftName.trim();$('copy').disabled=!state.draft.trim();
    $('favoriteCount').textContent=state.favorites.length+'件';
    $('saveHelp').textContent=active()?'編集だけでは登録内容は変わりません。更新保存、または別名で保存してください。':'名前を付けると保存できます。保存するのは、この欄の全文です。';
  }
  function paintEditor(){
    $('draft').value=state.draft;$('draftName').value=state.draftName;$('draftLanguage').value=state.draftLanguage;
    $('language').value=state.selections.language;
    for(const k of ['muscle','vascularity','bust'])$(k).checked=state.selections[k];
    status();
  }
  function renderFavorites(){
    $('favorites').innerHTML=state.favorites.length?state.favorites.map(f=>`<article class="favorite"><div class="favorite-title">${esc(f.name)}</div><div class="favorite-meta">${f.language.toUpperCase()} · 更新 ${esc(new Date(f.updatedAt).toLocaleString('ja-JP'))}</div><p class="favorite-preview">${esc(f.text)}</p><div class="favorite-actions"><button data-action="open" data-id="${esc(f.id)}">開く</button><button data-action="copy" data-id="${esc(f.id)}">コピー</button><button data-action="rename" data-id="${esc(f.id)}">名前変更</button><button class="danger" data-action="delete" data-id="${esc(f.id)}">削除</button></div></article>`).join(''):'<p class="help">まだ登録がありません。微調整した全文を保存できます。</p>';
    status();
  }
  async function copy(text){
    try{
      if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(text);
      else{
        const node=document.createElement('textarea');node.value=text;node.style.position='fixed';node.style.opacity='0';document.body.appendChild(node);node.select();
        let ok;try{ok=document.execCommand('copy');}finally{node.remove();}
        if(!ok)throw Error('copy');
      }
      toast('全文をコピーしました');
    }catch(e){notice('コピーできませんでした。編集欄の全文を選択してコピーしてください。');$('draft').focus();$('draft').select();}
  }
  function saveFavorite(update){
    if(!state.draft.trim()||!state.draftName.trim()){toast('全文と名前を入力してください');return;}
    const next=C.clone(state),now=new Date().toISOString();
    if(update){
      const f=next.favorites.find(x=>x.id===next.activeId);if(!f)return;
      Object.assign(f,{name:next.draftName,text:next.draft,language:next.draftLanguage,updatedAt:now});
    }else{
      const id=crypto.randomUUID();next.favorites.push({id,name:next.draftName,text:next.draft,language:next.draftLanguage,createdAt:now,updatedAt:now});next.activeId=id;
    }
    if(persist(next)){renderFavorites();toast(update?'更新保存しました':'お気に入りに保存しました');}
  }
  for(const k of ['language','muscle','vascularity','bust'])$(k).addEventListener('change',()=>{
    state.selections[k]=k==='language'?$(k).value:$(k).checked;persist(state);status();
  });
  for(const k of ['draft','draftName','draftLanguage'])$(k).addEventListener(k==='draftLanguage'?'change':'input',()=>{
    state[k]=$(k).value;persist(state);status();
  });
  $('generate').addEventListener('click',()=>{
    if(!allowReplace())return;
    state.draft=C.compile(state.selections);state.draftLanguage=state.selections.language;state.activeId=null;
    persist(state);paintEditor();$('draft').focus();
  });
  $('copy').addEventListener('click',()=>copy(state.draft));
  $('saveNew').addEventListener('click',()=>saveFavorite(false));
  $('saveUpdate').addEventListener('click',()=>saveFavorite(true));
  $('favorites').addEventListener('click',async event=>{
    const button=event.target.closest('button[data-action]');if(!button)return;
    const {action,id}=button.dataset,f=state.favorites.find(x=>x.id===id);if(!f)return;
    if(action==='copy'){await copy(f.text);return;}
    if(action==='open'){
      if(!allowReplace())return;
      Object.assign(state,{draft:f.text,draftName:f.name,draftLanguage:f.language,activeId:f.id});state.selections.language=f.language;
      persist(state);paintEditor();$('editorTitle').scrollIntoView({block:'start'});return;
    }
    const next=C.clone(state);
    if(action==='rename'){
      const name=window.prompt('お気に入りの名前',f.name);if(name===null)return;if(!name.trim()){toast('名前を入力してください');return;}
      const item=next.favorites.find(x=>x.id===id);item.name=name;item.updatedAt=new Date().toISOString();
      // An edited draft name remains independent from the registered name.
      if(next.activeId===id&&next.draftName===f.name)next.draftName=name;
    }else if(action==='delete'){
      if(!window.confirm('「'+f.name+'」を削除しますか？'))return;
      next.favorites=next.favorites.filter(x=>x.id!==id);if(next.activeId===id)next.activeId=null;
    }else return;
    if(persist(next)){paintEditor();renderFavorites();toast(action==='rename'?'名前を変更しました':'削除しました');}
  });
  $('export').addEventListener('click',()=>{
    const blob=new Blob([C.exportFavorites(state)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='prompt-palette-simple-favorites.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  $('import').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    try{
      const text=await file.text(),merged=C.mergeFavorites(state,text);
      if(persist(merged.state)){renderFavorites();toast(merged.added+'件追加・同じID '+merged.skipped+'件をスキップ');}
    }catch(e){notice('読み込めませんでした。'+e.message+' 既存のお気に入りは変更していません。');}
    finally{event.target.value='';}
  });
  window.addEventListener('storage',event=>{if(event.key===C.KEY||event.key===null)notice('別のタブで保存内容が変わりました。編集中の全文をコピーしてから再読み込みしてください。');});
  paintEditor();renderFavorites();if(store.blocked)notice(store.error+' 入力中の全文はコピーできます。');
})();
