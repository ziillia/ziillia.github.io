(function(){
  const STORE_KEY='promptPaletteV2';

  const vascularity={
    id:'vascularity-athlete',
    title:'⚡ VASCULARITY / ATHLETE',
    text:`元画像と同じ人物として、顔立ち、骨格、筋肉量、全身のプロポーション、自然な肌質を維持しながら、アスリートとして自然に見える皮下血管の視認性を明確に高めてください。\n\n前腕、上腕、肩、胸上部、腹部、大腿四頭筋、膝周辺、ふくらはぎなど、鍛えられた部位に沿って血管が自然に見えるようにしてください。血管は筋肉の形状と解剖学的な走行に沿わせ、身体全体の立体感や筋肉のセパレーションを補強する要素として表現してください。\n\n低体脂肪、トレーニング後のパンプ、運動による体温上昇、競技前後のコンディショニングなど、スポーツ・フィットネスの文脈で自然に生じるvascularityとして表現してください。必要に応じて元画像より一段階強く見せても構いませんが、血管だけが不自然に主役にならないようにしてください。\n\n腫れ、静脈瘤のような不自然な膨らみ、あざ、病的な変色、極端に太すぎる血管、解剖学的に不自然な走行は避けてください。肌の質感と全身のバランスはリアルに保ってください。\n\nそれ以外はMASTER、VARIATION、LAYOUT、SCENE、POSE、OUTFIT、COVERAGEの指示を維持してください。`,
    textEn:`Preserve the same person as the reference, including facial features, skeletal structure, muscular mass, full-body proportions, and natural skin texture, while clearly increasing visible subcutaneous vascularity in a way that looks natural for a highly conditioned athlete.\n\nShow realistic vascularity along trained areas such as the forearms, upper arms, shoulders, upper chest, abdomen, quadriceps, around the knees, and calves. Let the veins follow believable anatomical paths and use them to reinforce muscular shape, separation, and three-dimensional definition rather than becoming the sole visual focus.\n\nFrame the vascularity as a natural result of low body fat, post-training pump, increased body temperature from exertion, and competition-level athletic conditioning. It may appear moderately stronger than in the reference when appropriate, while remaining believable within a sports and fitness context.\n\nAvoid swelling, varicose-looking bulges, bruising, pathological discoloration, excessively thick veins, or anatomically implausible vein patterns. Keep the skin texture and overall body balance realistic.\n\nMaintain all other MASTER, VARIATION, LAYOUT, SCENE, POSE, OUTFIT, and COVERAGE instructions.`
  };

  function patch(obj){
    if(!obj)return;
    if(!Array.isArray(obj.bodies))obj.bodies=[];
    const current=obj.bodies.find(x=>x.id===vascularity.id);
    if(current){
      current.title=vascularity.title;
      current.text=vascularity.text;
      current.textEn=vascularity.textEn;
    }else{
      obj.bodies.push(JSON.parse(JSON.stringify(vascularity)));
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