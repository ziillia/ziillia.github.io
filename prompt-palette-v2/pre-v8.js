(function(){
  const coastJp = `明るく開放的な海岸でのロケーション撮影。広い砂浜、波打ち際、青い海、岩場などを背景として活用してください。同じ海岸の中でも撮影位置を変え、背景に十分なバリエーションを持たせてください。\n\n海風による髪や衣装の自然な動き、砂浜を歩く瞬間、波打ち際で立ち止まる瞬間など、屋外ロケーションならではの自然な変化を取り入れてください。\n\nそれ以外の人物の特徴、写真表現、構図、誌面構成についてはMASTERの指示を維持してください。`;
  const coastEn = `Shoot along a bright, open coastline using broad sand, the waterline, blue sea, and rocky areas as varied backgrounds. Change shooting positions enough to create strong visual variety within the same coastal location.\n\nUse sea breeze, natural movement in hair and clothing, walking across the sand, and brief pauses near the waterline to create genuine outdoor motion.\n\nMaintain all other MASTER instructions.`;

  function patch(data){
    if(!data) return;
    const scene = Array.isArray(data.scenes) && data.scenes.find(x=>x.id==='beach');
    if(scene){
      scene.title='🌊 COAST';
      scene.text=coastJp;
      scene.textEn=coastEn;
    }
  }

  patch(window.initialData);
  try{
    const key='promptPaletteV2';
    const raw=localStorage.getItem(key);
    if(raw){
      const saved=JSON.parse(raw);
      patch(saved);
      localStorage.setItem(key,JSON.stringify(saved));
    }
  }catch(e){}
})();
