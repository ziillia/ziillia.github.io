(function(){
  'use strict';
  const E=window.PPEngine,C=window.PPCatalog,KEY='promptPaletteV2',FOLD='promptPaletteV2Collapsed',BACKUP='promptPaletteV2BackupBeforeV17';
  const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let state=E.defaults(),fold={},foldReadable=true,lastRaw=null,storageBlocked=false,storageMessage='',migrationMessage='',result,context=null,toastTimer;
  const t=(jp,en)=>state.language==='en'?en:jp;
  function load(){
    try{
      lastRaw=localStorage.getItem(KEY);
      const raw=lastRaw||localStorage.getItem('promptPaletteV1');
      if(raw){
        const migrated=E.migrate(JSON.parse(raw));state=migrated.state;
        if(migrated.migrated){
          if(!localStorage.getItem(BACKUP))localStorage.setItem(BACKUP,raw);
          const next=JSON.stringify(state);localStorage.setItem(KEY,next);lastRaw=next;
          migrationMessage='v17に引き継ぎました。旧データは「設定とバックアップ」から書き出せます。';
        }
      }
    }catch(error){storageBlocked=true;storageMessage='保存データを安全に読み込めないため、自動保存を停止しています。元データは変更していません。設定から書き出して確認してください。';}
    try{const f=JSON.parse(localStorage.getItem(FOLD)||'{}');if(f&&typeof f==='object'&&!Array.isArray(f))fold=f;}catch(error){foldReadable=false;}
    if(fold['body-style']===undefined&&fold.body===true)fold['body-style']=true;
    if(fold.finish===undefined&&fold.master&&fold.variation&&fold.layout)fold.finish=true;
    for(const [oldKey,newKey] of [['scene','scenes'],['pose','poses'],['outfit','outfits'],['coverage','coverages'],['body','bodies']])if(fold[newKey]===undefined&&fold[oldKey]!==undefined)fold[newKey]=fold[oldKey];
  }
  function save(){
    if(storageBlocked)return false;
    try{
      if(localStorage.getItem(KEY)!==lastRaw){storageBlocked=true;storageMessage='別のタブで保存内容が変わりました。上書きを防ぐため保存を停止しました。現在の設定を書き出してから再読み込みしてください。';return false;}
      const raw=JSON.stringify(state);localStorage.setItem(KEY,raw);lastRaw=raw;storageMessage='';return true;
    }catch(error){storageMessage='この端末に保存できませんでした。現在の設定は書き出せます。空き容量やブラウザの保存設定を確認してください。';return false;}
  }
  const get=path=>path.split('.').reduce((v,k)=>v?.[k],state);
  function selected(path,value){const v=get(path);return Array.isArray(v)?v.includes(value):typeof v==='boolean'?v===true:v===value;}
  function choice(path,value,title){return `<button type="button" class="choice" data-path="${path}" data-value="${esc(value)}" aria-pressed="${selected(path,value)}">${esc(title)}</button>`;}
  function chips(path,group,cls='choices'){return `<div class="${cls}">${C[group].map(r=>choice(path,r.id,E.label(r,state.language))).join('')}</div>`;}
  function control(title,body,hint=''){return `<div class="control"><div class="control-head"><h3>${title}</h3>${hint?`<span class="hint">${hint}</span>`:''}</div>${body}</div>`;}
  function sub(id,title,body,defaultOpen=false){return `<details class="subsection" data-fold="${id}" ${fold[id]===undefined?(defaultOpen?'open':''):(!fold[id]?'open':'')}><summary>${title}</summary>${body}</details>`;}
  function group(id,number,title,body){return `<details class="group" data-fold="${id}" ${!fold[id]?'open':''}><summary><span class="group-num">${number}</span><span class="group-title">${title}<span id="summary-${id}" class="group-summary"></span></span></summary><div class="group-content">${body}</div></details>`;}
  function presets(path,groupName){
    return `<div class="preset-grid">${E.items(state,groupName).map(r=>`<div class="preset">${choice(groupName==='bodies'?(r.id==='full-bust'?'body.bust':'body.customIds'):path,r.id,E.label(r,state.language))}<button class="preset-info" data-action="info" data-group="${groupName}" data-id="${esc(r.id)}" aria-label="${esc(E.label(r,state.language))} ${t('詳細','details')}">···</button></div>`).join('')}${E.groups.includes(groupName)?`<button class="add" data-action="add" data-group="${groupName}">＋ ${t('追加','Add custom')}</button>`:''}</div>`;
  }
  function render(){
    document.documentElement.lang=state.language==='jp'?'ja':'en';
    document.querySelector('.intro p').textContent=t('同じ人。新しい一瞬。','The same person. A new moment.');
    document.querySelector('.intro span').textContent=t('必要な差分だけを選んで、ひとつの写真集へ。','Choose only what changes. Compose one coherent photobook.');
    document.querySelector('[data-action=settings]').setAttribute('aria-label',t('設定とバックアップ','Settings and backup'));
    const finish=control(t('写真のトーン','Photographic tone'),chips('look','looks','segmented'))+
      control(t('変化量','Variation'),chips('variation','variations','segmented')+'<p id="variationDescription" class="description"></p>')+
      control(t('写真数','Photograph count'),`<div class="shots-count">${[1,2,3,4,5].map(n=>choice('layout',String(n),String(n))).join('')}</div>`,t('大きなメイン＋補助写真','Main + supporting images'));
    const shooting=control(t('表情・関係性','Expression & connection'),chips('expression','expressions'))+
      sub('scenes',t('環境','Setting'),presets('sceneIds','scenes')+'<p class="description">'+t('未選択なら参照の環境。複数の候補はカットに配分。','No selection: reference setting. Multiple candidates are distributed across shots.')+'</p>',true)+
      sub('poses',t('姿勢・動作','Posture & action'),presets('poseIds','poses')+'<p class="description">'+t('未選択なら変化量に従う。複数の姿勢を同時に要求しません。','No selection: follow variation. Incompatible poses are never required simultaneously.')+'</p>',true)+
      sub('camera',t('撮影距離・角度・光','Camera & light'),control(t('距離・フレーミング','Distance & framing'),chips('distance','distances'))+control(t('カメラの角度','Camera angle'),chips('angle','angles'))+control(t('光','Lighting'),chips('lighting','lighting'))+'<p class="description">'+t('明示した設定は変化量より優先。「参照固定」ならDYNAMICでも固定。','Explicit choices override variation. “Lock reference” stays locked even in DYNAMIC.')+'</p>')+
      '<details class="mini-plan" data-fold="plan" '+(!fold.plan?'open':'')+'><summary>'+t('カットの組み立て','Shot plan')+'<span>'+t('自動作成','Resolved automatically')+'</span></summary><div id="shotPlan"></div></details><div id="warnings"></div>';
    const body=control(t('全身の筋量','Overall muscular mass'),chips('body.mass','masses','segmented'))+
      control(t('重点的に発達させる部位','Additional regional growth'),chips('body.regions','regions'),t('複数可','Multiple'))+
      control('Vascularity',chips('body.vascularity','vascularity','segmented'))+
      `<p class="description"><button class="inline-action" data-action="body-info">${t('筋肉・血管の指定内容を見る','View muscle & vascularity details')}</button></p>`+
      sub('bodies',t('その他の身体差分','Other physical adjustments'),presets('body.bust','bodies'));
    const wardrobe=sub('outfits',t('衣装','Outfit'),presets('outfitId','outfits')+'<p class="description">'+t('未選択なら参照衣装。同じ項目をタップすると解除。','No selection retains reference clothing. Tap again to deselect.')+'</p>',true)+
      sub('coverages',t('カバー範囲を増やす','More coverage'),`<div class="choices">${C.coverages.map(r=>choice('coverageId',r.id,E.label(r,state.language))).join('')}</div><p class="description">${t('任意・1つ。衣装のデザインよりカバー範囲を優先。','Optional, one choice. Coverage overrides the outfit’s cut.')}</p>`);
    $('app').innerHTML=group('finish','01',t('仕上がり','Finish'),finish)+group('shooting','02',t('撮影','Shoot'),shooting)+group('body-style','03',t('身体・衣装','Physique & styling'),body+wardrobe);
    document.querySelector('[data-action=take]').textContent=t('別カット','New take');document.querySelector('[data-action=preview]').textContent=t('プレビュー','Preview');document.querySelector('.dock [data-action=copy]').textContent=t('コピー','Copy');
    update();
  }
  function update(){
    result=E.compile(state);
    document.querySelectorAll('[data-path]').forEach(b=>b.setAttribute('aria-pressed',String(selected(b.dataset.path,b.dataset.value))));
    document.querySelectorAll('[data-action=language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===state.language)));
    const name=(g,id)=>E.label(E.find(state,g,id),state.language);
    $('variationDescription').textContent=E.textOf(E.find(state,'variations',state.variation),state.language);
    $('summary-finish').textContent=`${name('looks',state.look)} · ${state.variation.toUpperCase()} · ${state.layout} ${t('枚','shots')}`;
    $('summary-shooting').textContent=[name('expressions',state.expression),...state.sceneIds.map(id=>name('scenes',id)),...state.poseIds.map(id=>name('poses',id))].filter(Boolean).join(' · ');
    const b=state.body;const count=(b.mass!=='reference'?1:0)+b.regions.length+(b.vascularity!=='reference'?1:0)+(b.bust?1:0)+b.customIds.length;
    $('summary-body-style').textContent=[count?t(`身体 ${count}項目`,`${count} physical adjustments`):t('身体は参照','Reference physique'),state.outfitId?name('outfits',state.outfitId):t('参照衣装','Reference outfit'),state.coverageId?name('coverages',state.coverageId):''].filter(Boolean).join(' · ');
    $('outputSummary').textContent=`${state.language.toUpperCase()} · ${state.layout} ${t('枚','shots')} · ${state.variation.toUpperCase()}`;
    $('outputCount').textContent=t(`${result.text.length.toLocaleString()}字 · 案 ${state.take+1}`,`${result.text.length.toLocaleString()} chars · Take ${state.take+1}`)+(result.warnings.length?' ⚠':'');
    $('shotPlan').innerHTML=result.shots.map(x=>`<div class="plan-item"><strong>${x.index} ${x.index===1?t('メイン','Main'):t('補助','Supporting')} · ${esc(x.sceneId?name('scenes',x.sceneId):t('参照の環境','Reference setting'))}</strong>${esc([x.poseId?name('poses',x.poseId):t('変化量に合わせる','Follow variation'),x.distance==='relative'?t('参照に近い距離','Related distance'):name('distances',x.distance),x.angle==='relative'?t('近い撮影位置','Related viewpoint'):name('angles',x.angle)].join(' · '))}</div>`).join('');
    $('warnings').innerHTML=result.warnings.map(w=>`<p class="warning">${esc(w)}</p>`).join('');
    const notice=storageMessage||migrationMessage;$('storageNotice').textContent=notice;$('storageNotice').hidden=!notice;
  }
  function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2800);}
  function open(title,html){$('sheetTitle').textContent=title;$('sheetBody').innerHTML=html;if(!$('sheet').open)$('sheet').showModal();}
  function close(){$('sheet').close();context=null;}
  async function copy(text){
    try{
      if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);
      else{
        const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';($('sheet').open?$('sheet'):document.body).appendChild(area);area.focus();area.select();area.setSelectionRange(0,area.value.length);
        const ok=document.execCommand('copy');area.remove();if(!ok)throw new Error('Copy failed');
      }
      toast(t('コピーしました','Copied'));
    }catch(error){toast(t('コピーできません。プレビューの本文を選択してコピーしてください。','Copy failed. Select and copy the text in Preview.'));}
  }
  function preview(){open(t('生成プロンプト','Generated prompt'),`<p class="help">${t('内部カテゴリ名を除き、適用する指示だけを出力しています。','Only resolved instructions are emitted, without internal category routing.')}</p>${result.warnings.map(w=>`<p class="warning">${esc(w)}</p>`).join('')}<textarea id="promptText" aria-label="${t('生成プロンプト本文','Generated prompt text')}" readonly>${esc(result.text)}</textarea><div class="sheet-actions"><button class="button primary" data-action="copy">${t('コピー','Copy')}</button></div>`);}
  function details(groupName,id){
    const item=E.find(state,groupName,id);if(!item)return;context={group:groupName,id};
    open(E.label(item,state.language),`<div class="sheet-copy">${esc(E.textOf(item,state.language)||t('この言語の本文は未登録です。','No text in this language.'))}</div><div class="sheet-actions"><button class="button" data-action="copy-item">${t('本文コピー','Copy text')}</button>${E.groups.includes(groupName)?`<button class="button primary" data-action="edit-item">${item.custom?t('編集','Edit'):t('複製して編集','Duplicate & edit')}</button>`:''}</div>`);
  }
  function editor(groupName,item){
    context={group:groupName,id:item?.custom?item.id:null,original:item?.custom?E.clone(item):null};
    open(t(item?.custom?'追加プリセットを編集':'追加プリセット','Custom preset'),`<form id="customForm"><label class="field">${t('表示名','Display name')}<input id="editTitle" required maxlength="120" value="${esc(item?.title||'')}"></label><label class="field">${t('英語の表示名（任意）','English display name (optional)')}<input id="editTitleEn" maxlength="120" value="${esc(item?.titleEn||'')}"></label><label class="field">JP<textarea id="editJp" maxlength="20000">${esc(item?.text||'')}</textarea></label><label class="field">EN<textarea id="editEn" maxlength="20000">${esc(item?.textEn||'')}</textarea></label><p class="help">${t('ENが空なら、EN出力には含めません。この項目が担当する要素だけを記述してください。','Empty EN text is excluded from English output. Describe only the element this preset controls.')}</p><div class="sheet-actions">${item?.custom?`<button type="button" class="button danger" data-action="delete-item">${t('削除','Delete')}</button>`:''}<button type="submit" class="button primary">${t('保存','Save')}</button></div></form>`);
  }
  function download(name,text){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function settings(){
    open(t('設定とバックアップ','Settings & backup'),`<p class="help">${t('人物同一性・肌・写真品質は共通の土台として常に適用。撮影・表情・身体・衣装は独立して指定できます。','Identity, skin and photographic quality form a shared base. Specify camera, expression, physique and clothing independently.')}</p><p class="help">${t('旧MASTERは写真のトーンへ。彼氏目線は表情へ。夕方の設定は光へ移動しました。旧データは自動バックアップされ、追加プリセットを引き継いでいます。','Former MASTER choices are now photographic tones; Partner POV is an expression; sunset is lighting. Legacy data is backed up automatically and custom presets are retained.')}</p><div class="settings-row"><button class="button" data-action="export">${t('現在の設定を書き出す','Export current settings')}</button><button class="button" data-action="export-old">${t('旧データを書き出す','Export old data')}</button></div><div class="settings-row"><button class="button quiet" data-action="export-import-backup">${t('前回の読み込み前データ','Export pre-import backup')}</button></div><label class="field">${t('設定ファイルを読み込む','Import settings')}<input id="importFile" type="file" accept=".json,application/json"></label><p class="help">${t('読み込み時は現在のデータをバックアップします。自由文の指示内容は自動解析しません。','Import backs up the current saved data. Free-form custom instructions are not semantically parsed.')}</p><div class="settings-row"><button class="button quiet" data-action="reset">${t('選択だけ初期化','Reset selections only')}</button></div><p class="help">Prompt Palette v17 · ${t('保存はこのブラウザ内です。端末を移す前に書き出してください。','Data is stored in this browser. Export before moving to another device.')}</p>`);
  }
  document.addEventListener('click',async event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.path){
      const path=button.dataset.path,value=button.dataset.value,old=get(path);let next;
      if(Array.isArray(old))next=old.includes(value)?old.filter(x=>x!==value):[...old,value];
      else if(typeof old==='boolean')next=!old;
      else next=['outfitId','coverageId'].includes(path)&&old===value?'':value;
      const keys=path.split('.');if(keys.length===2)state[keys[0]][keys[1]]=next;else state[path]=next;
      state.take=0;save();update();return;
    }
    const action=button.dataset.action;
    if(action==='language'){state.language=button.dataset.value;save();render();}
    else if(action==='take'){state.take=(state.take+1)%1000000;save();update();toast(t('選択を保って別カットを組みました','New take, with selections unchanged'));}
    else if(action==='preview')preview();
    else if(action==='copy')await copy(result.text);
    else if(action==='close')close();
    else if(action==='settings')settings();
    else if(action==='info')details(button.dataset.group,button.dataset.id);
    else if(action==='add')editor(button.dataset.group,null);
    else if(action==='copy-item'&&context)await copy(E.textOf(E.find(state,context.group,context.id),state.language));
    else if(action==='edit-item'&&context)editor(context.group,E.find(state,context.group,context.id));
    else if(action==='body-info'){
      const b=state.body;open(t('身体の指定内容','Physical instructions'),`<div class="sheet-copy">${esc([E.find(state,'masses',b.mass),...b.regions.map(id=>E.find(state,'regions',id)),E.find(state,'vascularity',b.vascularity)].map(x=>E.textOf(x,state.language)).join('\n\n'))}</div><p class="help">${t('全身＋部位別は重点強化として統合。筋量とvascularityは別々に調整します。','Global and regional growth combine as additional emphasis. Mass and vascularity are adjusted independently.')}</p>`);
    }
    else if(action==='export')download('prompt-palette-v17.json',JSON.stringify({format:'prompt-palette',state,collapsed:fold},null,2));
    else if(action==='export-old'){
      try{const raw=localStorage.getItem(BACKUP)||localStorage.getItem(KEY);if(raw)download('prompt-palette-original.json',raw);else toast(t('旧データはありません','No old data available'));}catch(error){toast(t('保存データを読み出せません','Cannot read saved data'));}
    }
    else if(action==='export-import-backup'){
      try{const raw=localStorage.getItem('promptPaletteV2BackupBeforeImport');if(raw)download('prompt-palette-before-import.json',raw);else toast(t('読み込み前のバックアップはありません','No pre-import backup available'));}catch(error){toast(t('保存データを読み出せません','Cannot read saved data'));}
    }
    else if(action==='reset'){
      if(!window.confirm(t('追加プリセットは残し、選択だけ初期化しますか？','Reset selections while retaining custom presets?')))return;
      const old=state;state={...E.defaults(),language:state.language,custom:state.custom};if(!save()){state=old;update();toast(t('保存できないため変更していません','Not changed: storage unavailable'));return;}close();render();
    }
    else if(action==='delete-item'&&context?.id){
      if(!window.confirm(t('この追加プリセットを削除しますか？','Delete this custom preset?')))return;
      const old=E.clone(state),{group,id}=context;state.custom[group]=state.custom[group].filter(x=>x.id!==id);
      if(group==='scenes')state.sceneIds=state.sceneIds.filter(x=>x!==id);if(group==='poses')state.poseIds=state.poseIds.filter(x=>x!==id);if(group==='outfits'&&state.outfitId===id)state.outfitId='';if(group==='bodies')state.body.customIds=state.body.customIds.filter(x=>x!==id);
      if(!save()){state=old;update();toast(t('保存できないため削除していません','Not deleted: storage unavailable'));return;}close();render();
    }
  });
  document.addEventListener('submit',event=>{
    if(event.target.id!=='customForm')return;event.preventDefault();if(!context)return;
    const title=$('editTitle').value.trim(),jp=$('editJp').value.trim(),en=$('editEn').value.trim();if(!title||(!jp&&!en)){toast(t('表示名と、JPまたはENの本文を入力してください','Enter a name and JP or EN text'));return;}
    const old=E.clone(state),id=context.id||('custom-'+(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2)));
    const item={...(context.original||{}),id,title,titleEn:$('editTitleEn').value.trim(),text:jp,textEn:en,custom:true};
    const arr=state.custom[context.group],index=arr.findIndex(x=>x.id===id);if(index<0)arr.push(item);else arr[index]=item;
    if(!save()){state=old;update();toast(t('保存できません。本文を控えてから再試行してください','Save failed. Keep a copy of your text before retrying'));return;}close();render();toast(t('保存しました','Saved'));
  });
  document.addEventListener('change',async event=>{
    if(event.target.id!=='importFile')return;const file=event.target.files[0];if(!file)return;
    try{
      if(file.size>2*1024*1024)throw new Error('Too large');const parsed=JSON.parse(await file.text());const incoming=E.migrate(parsed.format==='prompt-palette'?parsed.state:parsed).state;
      if(!window.confirm(t('現在の設定をバックアップし、このファイルの設定へ切り替えますか？','Back up current settings and replace them with this file?')))return;
      if(storageBlocked)throw new Error('Storage protected');if(localStorage.getItem(KEY)!==lastRaw)throw new Error('Changed in another tab');
      if(lastRaw)localStorage.setItem('promptPaletteV2BackupBeforeImport',lastRaw);
      const raw=JSON.stringify(incoming);localStorage.setItem(KEY,raw);lastRaw=raw;state=incoming;storageMessage='';
      if(parsed.collapsed&&typeof parsed.collapsed==='object'&&!Array.isArray(parsed.collapsed))fold=parsed.collapsed;
      try{localStorage.setItem(FOLD,JSON.stringify(fold));}catch(error){/* Main data is already safely saved. */}
      close();render();toast(t('読み込みました','Imported'));
    }catch(error){toast(t('読み込めませんでした。形式・容量・保存状態を確認してください','Import failed. Check format, size and storage availability'));}
  });
  document.addEventListener('toggle',event=>{
    const id=event.target.dataset?.fold;if(!id)return;fold[id]=!event.target.open;
    if(foldReadable)try{localStorage.setItem(FOLD,JSON.stringify(fold));}catch(error){/* Selection persistence is independently reported. */}
  },true);
  $('sheet').addEventListener('close',()=>{context=null;});
  window.addEventListener('storage',event=>{if(event.key===KEY&&event.newValue!==lastRaw){storageBlocked=true;storageMessage=t('別のタブで設定が変わりました。保存を停止しています。現在の設定を書き出してから再読み込みしてください。','Settings changed in another tab. Saving is paused. Export current settings, then reload.');update();}});
  load();render();
})();
