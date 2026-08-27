(function(){
  const COLLAPSE_KEY='promptPaletteV2Collapsed';

  const style=document.createElement('style');
  style.textContent=`
    .section-head.is-collapsible{cursor:pointer;user-select:none}
    .section-title-wrap{display:flex;align-items:center;gap:8px;min-width:0}
    .section-collapse-icon{font-size:13px;opacity:.85;width:16px;text-align:center;flex:0 0 16px}
  `;
  document.head.appendChild(style);

  function stripPresetHeading(text){
    return String(text||'')
      .replace(/^\s*【[^】]+】\s*(?:\r?\n)*/,'')
      .replace(/^\s*\[[^\]\r\n]+\]\s*(?:\r?\n)*/,'')
      .trim();
  }

  function ensureCoverage(){
    if(!Array.isArray(state.coverages))state.coverages=JSON.parse(JSON.stringify(window.initialData.coverages||[]));
    if(typeof state.selectedCoverage!=='string')state.selectedCoverage='';
  }

  function getCollapsed(){try{return JSON.parse(localStorage.getItem(COLLAPSE_KEY)||'{}')}catch(e){return {}}}
  function setCollapsed(map){try{localStorage.setItem(COLLAPSE_KEY,JSON.stringify(map))}catch(e){}}

  itemText=function(item){
    if(!item)return'';
    const raw=state.selectedLanguage==='en'?(item.textEn||''):(item.text||item.textEn||'');
    return stripPresetHeading(raw);
  };

  function renderCoverage(){
    ensureCoverage();
    const root=document.getElementById('coverageCards');
    if(!root)return;
    root.innerHTML='';
    (state.coverages||[]).forEach(item=>{
      const selected=state.selectedCoverage===item.id;
      const card=document.createElement('div');
      card.className='card'+(selected?' selected':'');
      card.innerHTML=`<div class="card-top"><div class="select-dot">✓</div><div class="card-title">${esc(item.title)}</div><div class="card-actions"><button class="icon-btn copy-one">${state.selectedLanguage==='en'?'Copy':'コピー'}</button></div></div><div class="preview">${esc(excerpt(itemText(item)))}</div>`;
      card.querySelector('.card-top').addEventListener('click',e=>{
        if(e.target.closest('button'))return;
        state.selectedCoverage=state.selectedCoverage===item.id?'':item.id;
        save();render();
      });
      card.querySelector('.copy-one').addEventListener('click',()=>copyText(itemText(item)));
      root.appendChild(card);
    });
  }

  toggle=function(kind,id){
    if(kind==='outfits')state.selectedOutfit=state.selectedOutfit===id?'':id;
    else{
      const key=kind==='scenes'?'selectedScenes':kind==='poses'?'selectedPoses':'selectedBodies';
      const arr=state[key];
      state[key]=arr.includes(id)?arr.filter(x=>x!==id):[...arr,id];
    }
    save();render();
  };

  compose=function(){
    ensureCoverage();
    const m=state.masters.find(x=>x.id===state.selectedMaster)||state.masters[0];
    const layout=(state.layouts||[]).find(x=>String(x.id)===String(state.selectedLayout));
    const bodies=(state.bodies||[]).filter(x=>state.selectedBodies.includes(x.id));
    const scenes=(state.scenes||[]).filter(x=>state.selectedScenes.includes(x.id));
    const poses=(state.poses||[]).filter(x=>state.selectedPoses.includes(x.id));
    const outfit=(state.outfits||[]).find(x=>x.id===state.selectedOutfit);
    const coverage=(state.coverages||[]).find(x=>x.id===state.selectedCoverage);
    return [m,layout,...bodies,...scenes,...poses,outfit,coverage].map(itemText).filter(Boolean).join('\n\n');
  };

  updateStatus=function(){
    ensureCoverage();
    const m=state.masters.find(x=>x.id===state.selectedMaster);
    const outfit=(state.outfits||[]).find(x=>x.id===state.selectedOutfit);
    const coverage=(state.coverages||[]).find(x=>x.id===state.selectedCoverage);
    const extraCount=state.selectedScenes.length+state.selectedPoses.length+state.selectedBodies.length;
    const lang=state.selectedLanguage.toUpperCase();
    const outfitLabel=outfit?.title||(state.selectedLanguage==='en'?'NO OUTFIT':'OUTFITなし');
    document.getElementById('selectionTitle').textContent=`${lang} · ${m?.title||'MASTER'} · ${state.selectedLayout||'-'} SHOT · ${outfitLabel}`;
    let sub=extraCount?(state.selectedLanguage==='en'?`${extraCount} SCENE / POSE / BODY add-ons selected`:`SCENE / POSE / BODY 差分 ${extraCount}件を選択中`):(state.selectedLanguage==='en'?'No additional add-ons':'追加差分なし');
    if(coverage)sub+=state.selectedLanguage==='en'?' · coverage modifier enabled':' ・布面積UPあり';
    document.getElementById('selectionSub').textContent=sub;
  };

  const originalRender=render;
  render=function(){
    originalRender();
    renderCoverage();
    applyCollapse();
    updateStatus();
  };

  function applyCollapse(){
    const map=getCollapsed();
    document.querySelectorAll('body > section').forEach(section=>{
      const head=section.querySelector('.section-head');
      const title=head?.querySelector('.section-title');
      if(!head||!title)return;
      const key=title.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-');
      let wrap=head.querySelector('.section-title-wrap');
      if(!wrap){
        wrap=document.createElement('div');wrap.className='section-title-wrap';
        head.insertBefore(wrap,title);wrap.appendChild(title);
      }
      let icon=head.querySelector('.section-collapse-icon');
      if(!icon){icon=document.createElement('span');icon.className='section-collapse-icon';wrap.insertBefore(icon,wrap.firstChild)}
      head.classList.add('is-collapsible');
      const collapsed=!!map[key];
      Array.from(section.children).forEach((child,i)=>{if(i>0)child.style.display=collapsed?'none':''});
      icon.textContent=collapsed?'▸':'▾';
      if(head.dataset.collapseBound!=='1'){
        head.dataset.collapseBound='1';
        head.addEventListener('click',()=>{
          const current=getCollapsed();current[key]=!current[key];if(!current[key])delete current[key];setCollapsed(current);applyCollapse();
        });
      }
    });
  }

  render();
})();