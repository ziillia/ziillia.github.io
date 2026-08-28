(function(){
  // Resolve overlapping strength presets in output only; keep saved selections intact.
  function resolveBodies(items){
    const ids=new Set(items.map(item=>item.id));
    return items.filter(item=>
      !(item.id==='hypertrophy'&&ids.has('hypertrophy-direct'))&&
      !(item.id==='vascularity-athlete'&&ids.has('vascularity-extreme'))
    );
  }

  compose=function(){
    const master=state.masters.find(x=>x.id===state.selectedMaster)||state.masters[0];
    const variations=state.variations||[];
    const variation=variations.find(x=>x.id===state.selectedVariation)||variations.find(x=>x.id==='balanced');
    const layout=(state.layouts||[]).find(x=>String(x.id)===String(state.selectedLayout));
    const bodies=resolveBodies((state.bodies||[]).filter(x=>state.selectedBodies.includes(x.id)));
    const scenes=(state.scenes||[]).filter(x=>state.selectedScenes.includes(x.id));
    const poses=(state.poses||[]).filter(x=>state.selectedPoses.includes(x.id));
    const outfit=(state.outfits||[]).find(x=>x.id===state.selectedOutfit);
    const coverage=(state.coverages||[]).find(x=>x.id===state.selectedCoverage);
    return [master,variation,layout,...bodies,...scenes,...poses,outfit,coverage].map(itemText).filter(Boolean).join('\n\n');
  };
})();
