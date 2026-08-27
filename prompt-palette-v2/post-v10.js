(function(){
  const style=document.createElement('style');
  style.textContent=`
    .variation-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .variation-choice{min-height:58px;border:1px solid var(--line);border-radius:14px;background:var(--panel);color:var(--text);font-weight:800;padding:9px 5px;text-align:center}
    .variation-choice small{display:block;color:var(--muted);font-weight:600;margin-top:4px;font-size:10px}
    .variation-choice.active{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset,0 8px 24px rgba(122,162,255,.12)}
  `;
  document.head.appendChild(style);

  function ensureVariation(){
    if(!Array.isArray(state.variations))state.variations=JSON.parse(JSON.stringify(window.initialData.variations||[]));
    if(!(state.variations||[]).some(x=>x.id===state.selectedVariation))state.selectedVariation=window.initialData.selectedVariation||'balanced';
  }

  function renderVariation(){
    ensureVariation();
    const root=document.getElementById('variationGrid');
    if(!root)return;
    root.innerHTML='';
    state.variations.forEach(item=>{
      const b=document.createElement('button');
      b.className='variation-choice'+(state.selectedVariation===item.id?' active':'');
      b.innerHTML=`${esc(item.title)}<small>${esc(item.short||'')}</small>`;
      b.addEventListener('click',()=>{state.selectedVariation=item.id;save();render();});
      root.appendChild(b);
    });
  }

  compose=function(){
    ensureVariation();
    const m=state.masters.find(x=>x.id===state.selectedMaster)||state.masters[0];
    const variation=state.variations.find(x=>x.id===state.selectedVariation);
    const layout=(state.layouts||[]).find(x=>String(x.id)===String(state.selectedLayout));
    const bodies=(state.bodies||[]).filter(x=>state.selectedBodies.includes(x.id));
    const scenes=(state.scenes||[]).filter(x=>state.selectedScenes.includes(x.id));
    const poses=(state.poses||[]).filter(x=>state.selectedPoses.includes(x.id));
    const outfit=(state.outfits||[]).find(x=>x.id===state.selectedOutfit);
    const coverage=(state.coverages||[]).find(x=>x.id===state.selectedCoverage);
    return [m,variation,layout,...bodies,...scenes,...poses,outfit,coverage].map(itemText).filter(Boolean).join('\n\n');
  };

  const priorStatus=updateStatus;
  updateStatus=function(){
    ensureVariation();
    priorStatus();
    const title=document.getElementById('selectionTitle');
    const variation=state.variations.find(x=>x.id===state.selectedVariation);
    if(title&&variation){
      const parts=title.textContent.split(' · ');
      if(parts.length>=2)parts.splice(2,0,variation.title);
      title.textContent=parts.join(' · ');
    }
  };

  const priorRender=render;
  render=function(){
    priorRender();
    renderVariation();
    updateStatus();
  };

  render();
})();