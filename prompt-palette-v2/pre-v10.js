(function(){
  const STORE_KEY='promptPaletteV2';

  const skinJp='肌は明るく均一で透明感のある色白のトーンを維持してください。ページを進めるごとに日焼けが強くなったり、肌が徐々に暗くなったりしないようにしてください。自然光による陰影は残しつつ、強いブロンズ化、過度な日焼け、オレンジ寄りの色調変化を避け、元画像の明るい肌色を一貫して保ってください。';
  const skinEn='Maintain a bright, even, luminous fair skin tone consistent with the reference. Do not let the skin become progressively more tanned, darker, heavily bronzed, or orange-toned across pages. Preserve natural light and shadow while keeping the reference skin tone consistent.';

  const masters={
    attack:{
      text:`この画像は、成人女性のプロフェッショナルなフィットネスモデルを被写体にしたハイエンドな写真集です。\n\n元画像と同じ女性として、顔立ち、髪型、特徴的な筋肉質の体型、骨格バランス、自然な肌質、全体的な写真表現の一貫性を維持してください。\n\nモデルの筋肉量、腹部・大腿部の自然なvascularity、筋肉のセパレーション、全身のコンディショニングは元画像を基準として維持してください。これらの特徴を弱めたり目立たなくしたりせず、必要に応じて同程度以上に表現しても構いません。ただし、現実的な人体構造と自然なプロポーションを維持してください。\n\n人物の存在感、視線、仕草、身体のシルエット、光と陰影を主役とした、洗練された人物中心のエディトリアル写真として表現してください。スポーツ広告的な説明写真へ偏りすぎず、高級な写真集として成立する自然な写真表現を優先してください。\n\n自然光、窓光、柔らかなサイドライトなどを活用し、自然な肌の質感を重視してください。人工的なテカリ、極端なHDR、過剰なシャープネスは避けてください。\n\n${skinJp}\n\nポーズ、構図、カメラ距離、画角、背景、ロケーション、光の方向、変化量についてVARIATION差分が指定されている場合は、その指示を優先してください。LAYOUT、SCENE、POSE、BODY、OUTFIT、COVERAGEの各差分が指定されている場合も、それぞれの指示を優先してください。差分で明示されていない要素を、MASTERだけを理由に大きく変更しないでください。\n\n文字要素は最小限にし、人物を大きく見せる統一感のある高級な写真集の表現を維持してください。`,
      textEn:`This is a high-end photobook featuring an adult professional female fitness model.\n\nPreserve the same woman as the reference: facial features, hairstyle, distinctive muscular build, skeletal balance, natural skin texture, and overall photographic continuity.\n\nMaintain the reference level of muscular mass, natural abdominal and thigh vascularity, muscle separation, and overall conditioning. Do not weaken or hide these traits. They may be rendered at the same level or slightly stronger when appropriate, while keeping anatomy and proportions realistic.\n\nCreate sophisticated, person-centered editorial photography in which the model's presence, gaze, gestures, silhouette, and interplay of light and shadow remain the visual focus. Avoid defaulting to explanatory sports-advertising imagery; keep the result suitable for a premium photobook.\n\nUse natural daylight, window light, and soft side light. Preserve realistic skin texture and avoid artificial shine, extreme HDR, and excessive sharpening.\n\n${skinEn}\n\nIf a VARIATION modifier is selected, let it control pose, composition, camera distance, framing, background, location, light direction, and the amount of change. Also prioritize any selected LAYOUT, SCENE, POSE, BODY, OUTFIT, and COVERAGE modifiers. Do not substantially alter unspecified elements merely because of the MASTER prompt.\n\nKeep typography minimal and preserve a cohesive premium photobook presentation centered on the model.`
    },
    neutral:{
      text:`この画像は、成人女性のプロフェッショナルなフィットネスモデルを被写体にしたハイエンドな写真集です。\n\n元画像と同じ女性として、顔立ち、髪型、特徴的な筋肉質の体型、骨格バランス、自然な肌質、写真表現の一貫性を維持してください。\n\n元画像の筋肉量、腹部・大腿部の自然なvascularity、筋肉のセパレーション、全身のバランスを維持し、身体的特徴を不必要に弱めたり隠したりしないでください。人体構造、顔、手足、関節、全身の比率は現実的に保ってください。\n\n自然光を基調とした、洗練された人物中心のエディトリアル写真として表現してください。自然な肌の質感、落ち着いた陰影、適度な被写界深度を重視し、人工的なテカリ、極端なHDR、過剰なシャープネスを避けてください。\n\n${skinJp}\n\nポーズ、構図、カメラ距離、画角、背景、ロケーション、光の方向、変化量についてVARIATION差分が指定されている場合は、その指示を優先してください。LAYOUT、SCENE、POSE、BODY、OUTFIT、COVERAGEの各差分も、それぞれの要素について優先してください。差分で変更を求めていない要素は、元画像との連続性を優先してください。\n\n文字要素は最小限にし、全体として統一感のある高級な写真集の写真表現を維持してください。`,
      textEn:`This is a high-end photobook featuring an adult professional female fitness model.\n\nPreserve the same woman as the reference, including her facial features, hairstyle, distinctive muscular build, skeletal balance, natural skin texture, and photographic continuity.\n\nMaintain the reference muscular mass, natural abdominal and thigh vascularity, muscle separation, and overall body balance. Do not unnecessarily reduce or obscure these traits. Keep the face, hands, limbs, joints, anatomy, and overall proportions realistic.\n\nUse refined, person-centered editorial photography built around natural light. Prioritize realistic skin texture, controlled shadows, and appropriate depth of field while avoiding artificial gloss, extreme HDR, and excessive sharpening.\n\n${skinEn}\n\nIf a VARIATION modifier is selected, let it control pose, composition, camera distance, framing, background, location, light direction, and the amount of change. Also prioritize selected LAYOUT, SCENE, POSE, BODY, OUTFIT, and COVERAGE modifiers for their respective elements. For anything not explicitly changed by a modifier, prioritize continuity with the reference.\n\nKeep typography minimal and maintain a cohesive premium photobook presentation.`
    },
    safe:{
      text:`この画像は、成人女性のプロフェッショナルなフィットネスモデルを被写体にした、洗練された女性アスリート写真集です。\n\n元画像と同じ女性として、顔立ち、髪型、筋肉質の体型、骨格バランス、自然な肌質、全体的な写真表現の一貫性を維持してください。\n\n元画像の筋肉量、腹部・大腿部のvascularity、筋肉のセパレーション、現実的な人体構造、バランスの取れた全身のプロポーションを維持してください。\n\nスポーツ・フィットネスの文脈に自然に馴染む、清潔感があり洗練された人物中心のエディトリアル写真として表現してください。自然光、窓光、柔らかなサイドライトを活用し、自然な肌の質感を保ってください。人工的なテカリ、極端なHDR、過剰なシャープネスは避けてください。\n\n${skinJp}\n\nポーズ、構図、カメラ距離、画角、背景、ロケーション、光の方向、変化量についてVARIATION差分が指定されている場合は、その指示を優先してください。LAYOUT、SCENE、POSE、BODY、OUTFIT、COVERAGEの各差分も優先してください。MASTER単体では、元画像のポーズや環境を不必要に変更しないでください。\n\n文字要素は最小限にし、統一感のある高品質なスポーツエディトリアル写真集として仕上げてください。`,
      textEn:`This is a refined female-athlete photobook featuring an adult professional female fitness model.\n\nPreserve the same woman as the reference, including her facial features, hairstyle, muscular physique, skeletal balance, natural skin texture, and overall photographic continuity.\n\nMaintain the reference muscular mass, abdominal and thigh vascularity, muscle separation, realistic anatomy, and balanced full-body proportions.\n\nPresent her in clean, sophisticated, person-centered editorial photography that naturally fits a sports and fitness context. Use natural daylight, window light, and soft side light while preserving realistic skin texture. Avoid artificial shine, extreme HDR, and excessive sharpening.\n\n${skinEn}\n\nIf a VARIATION modifier is selected, let it control pose, composition, camera distance, framing, background, location, light direction, and the amount of change. Also prioritize selected LAYOUT, SCENE, POSE, BODY, OUTFIT, and COVERAGE modifiers. The MASTER alone should not unnecessarily change the reference pose or environment.\n\nKeep typography minimal and maintain a cohesive, high-quality sports-editorial photobook presentation.`
    }
  };

  const variations=[
    {
      id:'keep',
      title:'🔒 KEEP',
      short:'ほぼ維持',
      text:`元画像のポーズ、身体の向き、構図、カメラ距離、画角、撮影位置、背景、ロケーション、光の方向など、撮影条件の基本構成をできるだけ維持してください。\n\n表情、視線、手指や足の位置、重心、身体のひねり、髪の動きなどに、ごく軽い自然な差分を加える程度にとどめてください。別のポーズ体系、別のロケーション、別のカメラアングル、別のフレーミングへ勝手に変更しないでください。\n\nSCENEまたはPOSE差分が明示的に選択されている場合のみ、その指定された変更は適用して構いません。それ以外の要素は元画像との連続性を優先してください。\n\n同一撮影の非常に近い別テイクとして自然に成立するようにしてください。`,
      textEn:`Preserve the reference pose, body orientation, composition, camera distance, framing, shooting position, background, location, and light direction as closely as possible.\n\nLimit changes to very subtle natural differences in expression, gaze, finger and foot placement, weight distribution, slight torso rotation, or hair movement. Do not independently switch to a different pose family, location, camera angle, or framing.\n\nOnly apply a larger scene or pose change when a SCENE or POSE modifier explicitly requests it. Otherwise prioritize continuity with the reference.\n\nThe result should feel like a very closely related alternate take from the same setup.`
    },
    {
      id:'balanced',
      title:'⚖️ BALANCED',
      short:'適度に変化',
      text:`元画像の雰囲気と撮影セッションの連続性を維持しながら、ポーズ、身体の向き、構図、カメラ距離、画角、背景の見え方に適度な変化を加えてください。\n\nロケーションの種類や全体の空気感は大きく変えず、同じ場所または近い環境で撮影した別カットとして自然に成立する程度の変化にしてください。\n\n身体の向き、視線、姿勢、フレーミング、撮影位置には明確な差分を持たせつつ、元画像とのつながりが失われないようにしてください。\n\nSCENEやPOSE差分が選択されている場合は、その内容を優先しながら、この中程度の変化量を維持してください。`,
      textEn:`Maintain the atmosphere and continuity of the reference shooting session while introducing moderate variation in pose, body orientation, composition, camera distance, framing, and background treatment.\n\nDo not radically change the type of location or the overall mood. Make the result feel like a different shot captured in the same place or a closely related environment.\n\nCreate clear differences in body direction, gaze, posture, framing, and shooting position without losing continuity with the reference.\n\nIf SCENE or POSE modifiers are selected, prioritize their content while keeping the overall amount of change moderate.`
    },
    {
      id:'dynamic',
      title:'⚡ DYNAMIC',
      short:'大胆に変化',
      text:`元画像と同じ女性としての一貫性を保ちながら、ポーズ、身体の向き、構図、カメラ距離、画角、撮影位置、光の方向、背景の見え方に大胆な変化を持たせてください。\n\n前の写真とは明確に異なる新しいカットとして成立するよう、姿勢、視線、動き、フレーミング、撮影位置に積極的な差分を加えてください。\n\nSCENE差分が選択されている場合はその環境を優先してください。SCENE差分がない場合は、同じ撮影セッションとして自然につながる範囲で背景や撮影場所にも変化を持たせて構いません。\n\n人物の顔立ち、髪型、筋肉質の体型、自然な肌質などの一貫性は維持してください。`,
      textEn:`Keep the same woman and overall identity consistent while introducing bold variation in pose, body orientation, composition, camera distance, framing, shooting position, light direction, and background treatment.\n\nMake the result feel clearly different from the previous image by actively changing posture, gaze, movement, framing, and camera position.\n\nIf a SCENE modifier is selected, prioritize that environment. If no SCENE modifier is selected, the background or shooting area may also vary as long as the result still feels connected to the same overall session.\n\nPreserve continuity in facial features, hairstyle, muscular physique, and natural skin texture.`
    }
  ];

  function patch(obj){
    if(!obj)return;
    if(!Array.isArray(obj.masters))obj.masters=[];
    Object.entries(masters).forEach(([id,fresh])=>{
      const current=obj.masters.find(x=>x.id===id);
      if(current){current.text=fresh.text;current.textEn=fresh.textEn;}
    });
    obj.variations=variations.map(x=>JSON.parse(JSON.stringify(x)));
    if(!variations.some(x=>x.id===obj.selectedVariation))obj.selectedVariation='balanced';
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