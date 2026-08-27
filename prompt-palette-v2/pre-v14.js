(function(){
  const STORE_KEY='promptPaletteV2';

  const presets=[
    {
      id:'hypertrophy-direct',
      title:'💥 MUSCLE HYPERTROPHY / DIRECT',
      text:`元画像の顔立ち、骨格、身長感、自然な肌質を維持しながら、全身の筋肉量を明確に増やしてください。\n\n肩、上腕、前腕、胸部、広背筋、腹部、臀部、大腿四頭筋、内転筋、ハムストリングス、ふくらはぎをバランスよく発達させ、筋腹の厚み、丸み、張り、立体感、セパレーションを強く表現してください。\n\n元画像に見られる腹部・大腿部のvascularity、筋肉のセパレーション、ストリエーションも維持または強調してください。\n\nそれ以外の人物の特徴、写真表現、ロケーション、ポーズ、衣装、誌面構成についてはMASTERおよび各差分の指示を維持してください。`,
      textEn:`Preserve the reference facial features, skeletal structure, apparent height, and natural skin texture while clearly increasing overall muscular mass.\n\nDevelop the shoulders, upper arms, forearms, chest, lats, abdomen, glutes, quadriceps, adductors, hamstrings, and calves with greater thickness, roundness, fullness, three-dimensional volume, and muscle separation.\n\nMaintain or strengthen the abdominal and thigh vascularity, muscle separation, and visible striations present in the reference.\n\nMaintain all other MASTER, VARIATION, LAYOUT, SCENE, POSE, OUTFIT, and COVERAGE instructions.`
    },
    {
      id:'hypertrophy-abs',
      title:'🧱 ABS HYPERTROPHY',
      text:`元画像の人物の特徴と全身バランスを維持しながら、腹部の筋肉量と立体感を重点的に増やしてください。\n\n腹直筋の各筋腹をより厚く、深く、明確にし、外腹斜筋を含む腹部全体の厚み、ブロック感、溝、セパレーションを強調してください。腹部のvascularityやストリエーションが見られる場合は、それらも維持または強調してください。\n\n腹部以外の筋肉量は元画像の基準を維持してください。\n\nそれ以外はMASTER、VARIATION、LAYOUT、SCENE、POSE、OUTFIT、COVERAGEの指示を維持してください。`,
      textEn:`Preserve the subject's identity and overall body balance while specifically increasing muscular mass and three-dimensional definition in the abdomen.\n\nMake the individual segments of the rectus abdominis thicker, deeper, and more distinct, while emphasizing the overall thickness, block structure, grooves, and separation of the abdominal wall including the external obliques. Maintain or strengthen visible abdominal vascularity and striations when present.\n\nKeep muscular mass outside the abdominal region at the reference level.\n\nMaintain all other MASTER, VARIATION, LAYOUT, SCENE, POSE, OUTFIT, and COVERAGE instructions.`
    },
    {
      id:'hypertrophy-delts',
      title:'🛡️ DELTS HYPERTROPHY',
      text:`元画像の人物の特徴と全身バランスを維持しながら、三角筋を重点的に筋肥大させてください。\n\n三角筋の前部、中部、後部をそれぞれ明確に発達させ、肩全体の丸み、張り、幅、厚みを強調してください。上腕との境界や肩の筋肉のセパレーションも明確にしてください。\n\n三角筋以外の筋肉量は元画像の基準を維持してください。\n\nそれ以外はMASTER、VARIATION、LAYOUT、SCENE、POSE、OUTFIT、COVERAGEの指示を維持してください。`,
      textEn:`Preserve the subject's identity and overall body balance while specifically hypertrophying the deltoids.\n\nDevelop the anterior, lateral, and posterior deltoid heads clearly, increasing overall shoulder roundness, fullness, width, and thickness. Emphasize the separation between the deltoids and upper arms and make the shoulder musculature visually distinct.\n\nKeep muscular mass outside the deltoids at the reference level.\n\nMaintain all other MASTER, VARIATION, LAYOUT, SCENE, POSE, OUTFIT, and COVERAGE instructions.`
    },
    {
      id:'hypertrophy-lats',
      title:'🪽 LATS HYPERTROPHY',
      text:`元画像の人物の特徴と全身バランスを維持しながら、広背筋を重点的に筋肥大させてください。\n\n脇の下から腰方向へ広がる広背筋の幅、厚み、外側への張り出し、背中の立体感を強調し、正面・斜め・背面のいずれから見ても広背筋の存在感が明確に分かるようにしてください。上半身のV字シルエットもより強く表現してください。\n\n広背筋以外の筋肉量は元画像の基準を維持してください。\n\nそれ以外はMASTER、VARIATION、LAYOUT、SCENE、POSE、OUTFIT、COVERAGEの指示を維持してください。`,
      textEn:`Preserve the subject's identity and overall body balance while specifically hypertrophying the latissimus dorsi.\n\nIncrease lat width, thickness, outward flare, and three-dimensional back volume from the underarm region down toward the waist so the lats remain clearly visible from front, three-quarter, and rear views. Strengthen the upper-body V-taper created by the expanded lats.\n\nKeep muscular mass outside the lats at the reference level.\n\nMaintain all other MASTER, VARIATION, LAYOUT, SCENE, POSE, OUTFIT, and COVERAGE instructions.`
    },
    {
      id:'hypertrophy-thighs',
      title:'🦵 THIGHS HYPERTROPHY',
      text:`元画像の人物の特徴と全身バランスを維持しながら、大腿部を重点的に筋肥大させてください。\n\n大腿四頭筋、内転筋、ハムストリングスの筋量を増やし、大腿部全体の太さ、厚み、前後左右への張り、筋腹の立体感を強調してください。大腿四頭筋の各部位、内転筋、ハムストリングスの境界とセパレーションも明確にし、大腿部のvascularityが見られる場合は維持または強調してください。\n\n大腿部以外の筋肉量は元画像の基準を維持してください。\n\nそれ以外はMASTER、VARIATION、LAYOUT、SCENE、POSE、OUTFIT、COVERAGEの指示を維持してください。`,
      textEn:`Preserve the subject's identity and overall body balance while specifically hypertrophying the thighs.\n\nIncrease muscular mass in the quadriceps, adductors, and hamstrings, emphasizing overall thigh circumference, thickness, outward fullness, and three-dimensional muscle volume. Make the individual quadriceps regions, adductors, and hamstrings more distinct through stronger separation, and maintain or strengthen visible thigh vascularity when present.\n\nKeep muscular mass outside the thighs at the reference level.\n\nMaintain all other MASTER, VARIATION, LAYOUT, SCENE, POSE, OUTFIT, and COVERAGE instructions.`
    }
  ];

  function patch(obj){
    if(!obj)return;
    if(!Array.isArray(obj.bodies))obj.bodies=[];
    presets.forEach(preset=>{
      const current=obj.bodies.find(x=>x.id===preset.id);
      if(current){
        current.title=preset.title;
        current.text=preset.text;
        current.textEn=preset.textEn;
      }else{
        obj.bodies.push(JSON.parse(JSON.stringify(preset)));
      }
    });
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