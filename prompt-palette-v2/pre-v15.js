(function(){
  const STORE_KEY='promptPaletteV2';

  const preset={
    id:'vascularity-extreme',
    title:'🔥 VASCULARITY / EXTREME',
    text:`元画像と同じ人物として、顔立ち、骨格、筋肉量、全身のプロポーション、肌の質感を維持しながら、全身のvascularityを非常に強く表現してください。\n\n前腕、上腕、肩、胸部、腹部、腰まわり、大腿四頭筋、内転筋、ハムストリングス、膝周辺、ふくらはぎにかけて、太く明瞭で密度の高い血管網を広く見せてください。表層の血管だけでなく、複数の血管が枝分かれしながら筋肉の輪郭に沿って走り、各部位の筋腹、セパレーション、立体感を強く浮き上がらせるようにしてください。\n\n前腕から上腕、肩、胸部へ続く血管、大腿部から膝周辺、ふくらはぎへ続く血管、腹部周辺の細かな血管まで、全身でvascularityが明確に視認できる状態にしてください。血管の太さ、密度、コントラスト、浮き上がりを大幅に高め、vascularityそのものが身体的特徴として強く認識できる表現にしてください。\n\n競技直前のピークコンディショニング、強いパンプ、低体脂肪、高度に仕上がったフィジークを持つアスリートとして表現し、筋肉の厚み、セパレーション、ストリエーションと血管表現を組み合わせて、非常にシャープで強烈な競技コンディションを作ってください。\n\nそれ以外はMASTER、VARIATION、LAYOUT、SCENE、POSE、OUTFIT、COVERAGEの指示を維持してください。`,
    textEn:`Preserve the same person as the reference, including facial features, skeletal structure, muscular mass, full-body proportions, and skin texture, while rendering extremely pronounced full-body vascularity.\n\nShow a dense network of thick, highly visible veins across the forearms, upper arms, shoulders, chest, abdomen, waist, quadriceps, adductors, hamstrings, knees, and calves. Let multiple branching veins track across the contours of the muscles and strongly reinforce muscle bellies, separation, and three-dimensional definition.\n\nMake vascularity clearly visible throughout the body, including prominent veins running from the forearms into the upper arms and shoulders, across the upper torso and chest, through the thighs and around the knees into the calves, plus finer vascular detail across the abdominal region. Greatly increase vein thickness, density, contrast, and surface prominence so vascularity becomes a major defining physical characteristic.\n\nPresent the physique in peak pre-competition conditioning with an intense pump, very low body fat, and highly developed athletic definition. Combine pronounced vascularity with muscular thickness, separation, and striations to create an extremely sharp and visually powerful competition-ready athlete appearance.\n\nMaintain all other MASTER, VARIATION, LAYOUT, SCENE, POSE, OUTFIT, and COVERAGE instructions.`
  };

  function patch(obj){
    if(!obj)return;
    if(!Array.isArray(obj.bodies))obj.bodies=[];
    const current=obj.bodies.find(x=>x.id===preset.id);
    if(current){
      current.title=preset.title;
      current.text=preset.text;
      current.textEn=preset.textEn;
    }else{
      obj.bodies.push(JSON.parse(JSON.stringify(preset)));
    }
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