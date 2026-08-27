(function(){
  function stripPresetHeading(text){
    return String(text||'')
      .replace(/^\s*【[^】]+】\s*(?:\r?\n)*/,'')
      .replace(/^\s*\[[^\]\r\n]+\]\s*(?:\r?\n)*/,'')
      .trim();
  }

  itemText = function(item){
    if(!item) return '';
    const raw = state.selectedLanguage==='en' ? (item.textEn||item.text||'') : (item.text||item.textEn||'');
    return stripPresetHeading(raw);
  };

  toggle = function(kind,id){
    if(kind==='outfits'){
      state.selectedOutfit = state.selectedOutfit===id ? '' : id;
    }else{
      const key=kind==='scenes'?'selectedScenes':kind==='poses'?'selectedPoses':'selectedBodies';
      const arr=state[key];
      state[key]=arr.includes(id)?arr.filter(x=>x!==id):[...arr,id];
    }
    save();render();
  };

  compose = function(){
    const m=state.masters.find(x=>x.id===state.selectedMaster)||state.masters[0];
    const layout=(state.layouts||[]).find(x=>String(x.id)===String(state.selectedLayout));
    const bodies=(state.bodies||[]).filter(x=>state.selectedBodies.includes(x.id));
    const scenes=state.scenes.filter(x=>state.selectedScenes.includes(x.id));
    const poses=state.poses.filter(x=>state.selectedPoses.includes(x.id));
    const outfit=state.outfits.find(x=>x.id===state.selectedOutfit);
    return [m,layout,...bodies,...scenes,...poses,outfit].map(itemText).filter(Boolean).join('\n\n');
  };

  updateStatus = function(){
    const m=state.masters.find(x=>x.id===state.selectedMaster);
    const outfit=state.outfits.find(x=>x.id===state.selectedOutfit);
    const extraCount=state.selectedScenes.length+state.selectedPoses.length+state.selectedBodies.length;
    const lang=state.selectedLanguage.toUpperCase();
    const outfitLabel=outfit?.title||(state.selectedLanguage==='en'?'NO OUTFIT':'OUTFITなし');
    document.getElementById('selectionTitle').textContent=`${lang} · ${m?.title||'MASTER'} · ${state.selectedLayout||'-'} SHOT · ${outfitLabel}`;
    document.getElementById('selectionSub').textContent=extraCount
      ? (state.selectedLanguage==='en'?`${extraCount} SCENE / POSE / BODY add-ons selected`:`SCENE / POSE / BODY 差分 ${extraCount}件を選択中`)
      : (state.selectedLanguage==='en'?'No additional add-ons':'追加差分なし');
  };

  const outfitSection=[...document.querySelectorAll('section')].find(s=>s.querySelector('.section-title')?.textContent==='OUTFIT');
  if(outfitSection){
    const note=outfitSection.querySelector('.section-note');
    if(note) note.textContent='0〜1個選択・再タップで解除';
  }

  render();
})();
