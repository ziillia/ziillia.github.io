(function(){
  const STORE_KEY='promptPaletteV2';

  const presets=[
    {
      id:'coverage-strong',
      title:'🧵 MORE COVERAGE / STRONG',
      text:`元画像や他の差分で選ばれた衣装が、開きの大きいデザインや露出の多いデザインであっても、衣装の布面積を明確に増やし、よりカバー範囲の広い衣装へ調整してください。\n\n胸元、脇、腹部、腰まわり、臀部周辺などのカバー範囲を自然に増やし、全体として落ち着きがあり、実用的で洗練されたデザインにしてください。トップスは身頃や丈をやや長めにし、ボトムも安定感のあるカバー範囲を持たせてください。\n\n露出を下げても野暮ったくならないよう、全体のシルエット、色、素材感、エディトリアルとしての洗練は維持してください。\n\nそれ以外はMASTER、SCENE、POSE、OUTFITの指示を維持してください。`,
      textEn:`Even if the reference or other selected modifiers imply highly revealing clothing, clearly increase the amount of fabric and adjust the outfit toward a more covered design.\n\nNaturally extend coverage around the neckline, side openings, midsection, waist, and seat area so the styling feels calmer, practical, and polished. Use slightly longer and fuller top silhouettes and give the bottoms more secure overall coverage.\n\nDo not let the result become bulky or unfashionable. Preserve a clean silhouette, cohesive colors, appropriate materials, and the overall editorial refinement while reducing exposure.\n\nMaintain all other MASTER, SCENE, POSE, and OUTFIT instructions.`
    },
    {
      id:'coverage-swim',
      title:'🌊 MORE COVERAGE / SWIM',
      text:`水辺やリゾートのシーンでは、元画像や他の差分で選ばれた水着が開きの大きいデザインであっても、布面積を増やした、よりカバー範囲の広いスイムウェアへ調整してください。\n\nトップは胸元と脇のカバー範囲を自然に増やし、ボトムも腰まわりとヒップ周辺をより安定して覆うデザインにしてください。よりカバー力のあるツーピース、ミニマルなワンピース、水辺に合う軽い羽織りなどを優先してください。\n\n競技用スポーツウェアに寄りすぎず、水辺に自然に馴染む軽快さと、ファッションエディトリアルとしての洗練を両立してください。\n\nそれ以外はMASTER、SCENE、POSE、OUTFITの指示を維持してください。`,
      textEn:`In waterside or resort settings, if the selected swimwear is highly revealing, increase the fabric area and convert it into a more covered swimwear design.\n\nNaturally increase coverage around the neckline and side areas of the top, and give the bottoms more secure coverage around the waist and seat. Favor more covered two-piece swimwear, minimal one-piece designs, and light layering pieces that still feel appropriate near the water.\n\nDo not let the result default to heavy competition sportswear. Keep the styling light, location-appropriate, fashionable, and polished as a high-end editorial look.\n\nMaintain all other MASTER, SCENE, POSE, and OUTFIT instructions.`
    },
    {
      id:'coverage-indoor',
      title:'🪟 MORE COVERAGE / INDOOR',
      text:`室内シーンでは、元画像や他の差分で選ばれた衣装が開きの大きいデザインであっても、布面積を増やし、より落ち着いた室内向けスタイリングへ調整してください。\n\nトップスは身頃や肩まわりのカバー範囲を自然に増やし、ボトムも丈や覆う範囲をやや増やしてください。身体に沿うシルエットは保ちながら、露出を抑えた上品で静かな印象にしてください。\n\n柔らかな光に馴染む素材感、落ち着いた色味、整ったシルエットを重視し、室内ポートレートとして自然に成立する洗練された衣装にしてください。\n\nそれ以外はMASTER、SCENE、POSE、OUTFITの指示を維持してください。`,
      textEn:`For indoor scenes, if the selected clothing has very open or revealing cuts, increase the fabric coverage and adjust it toward a calmer indoor editorial look.\n\nNaturally extend coverage through the body and shoulder area of the top, and slightly increase the length and coverage of the bottoms. Keep the silhouette body-following and refined while making the overall styling more covered, composed, and elegant.\n\nPrioritize materials that work well with soft natural light, restrained colors, and clean silhouettes so the result feels believable as polished indoor portrait styling.\n\nMaintain all other MASTER, SCENE, POSE, and OUTFIT instructions.`
    }
  ];

  function ensureArray(obj,key){if(!Array.isArray(obj[key]))obj[key]=[];}

  function syncEnglish(obj){
    const fresh=window.initialData||{};
    ['masters','layouts','scenes','poses','outfits','bodies'].forEach(key=>{
      ensureArray(obj,key);
      const map=new Map((fresh[key]||[]).map(x=>[x.id,x]));
      obj[key].forEach(item=>{
        const src=map.get(item.id);
        if(!src)return;
        if(src.textEn)item.textEn=src.textEn;
        if(src.title)item.title=src.title;
        if(key==='masters'&&src.short)item.short=src.short;
      });
    });
  }

  function patch(obj){
    if(!obj)return;
    if(typeof obj.selectedOutfit!=='string')obj.selectedOutfit='';
    if(typeof obj.selectedCoverage!=='string')obj.selectedCoverage='';
    ensureArray(obj,'coverages');
    obj.coverages=presets.map(x=>JSON.parse(JSON.stringify(x)));
    syncEnglish(obj);
  }

  patch(window.initialData);
  try{
    const raw=localStorage.getItem(STORE_KEY);
    if(raw){
      const saved=JSON.parse(raw);
      patch(saved);
      localStorage.setItem(STORE_KEY,JSON.stringify(saved));
    }
  }catch(e){}
})();