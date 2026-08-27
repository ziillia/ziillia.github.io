(function(){
  const STORE_KEY='promptPaletteV2';

  const oneShotJp=`1枚の写真だけで構成してください。\n\n横長のキャンバス全体を1枚の写真で無理に埋めるのではなく、人物を大きく見せられる縦位置または縦長寄りの写真を主役として配置してください。\n\n人物の頭から足元まで、または意図した範囲が十分な大きさで見えるようにし、横方向へ不自然に引き伸ばした構図や、人物が小さくなる極端な引きの横長構図は避けてください。\n\n余った横方向のスペースは、背景の自然な延長、意図的な余白、またはシンプルな誌面デザインとして有効活用してください。人物を中央に固定する必要はなく、左右どちらかへ大胆に寄せた縦長写真と広い余白を組み合わせても構いません。\n\n出版前のフラットなデジタル誌面として、1枚の写真が最も大きく魅力的に見えるレイアウトを優先してください。\n\nこの1 SHOTの指示は、MASTER内に構図数や見開き配置に関する記述がある場合より優先してください。`;

  const oneShotEn=`Use exactly one photograph.\n\nDo not force a single landscape photograph to stretch across the entire wide canvas. Instead, prioritize a portrait-oriented or vertically dominant image that allows the model to appear large and visually prominent.\n\nKeep the model large enough to clearly show the intended full-body or partial-body composition. Avoid excessively wide establishing shots that make the subject small or compositions that feel unnaturally stretched horizontally.\n\nUse the remaining horizontal space efficiently through a natural continuation of the background, intentional negative space, or minimal editorial layout design. The portrait image may be positioned boldly toward either side rather than centered.\n\nTreat the result as a flat pre-publication digital layout and prioritize the presentation that makes the single photograph feel largest and strongest.\n\nThis 1 SHOT instruction takes priority over any composition-count or spread-placement wording in MASTER.`;

  function patch(obj){
    if(!obj||!Array.isArray(obj.layouts))return;
    const layout=obj.layouts.find(x=>String(x.id)==='1');
    if(layout){
      layout.text=oneShotJp;
      layout.textEn=oneShotEn;
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