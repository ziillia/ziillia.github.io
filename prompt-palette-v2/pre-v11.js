(function(){
  const STORE_KEY='promptPaletteV2';

  const flatJp=`見開きレイアウトとして構成する場合でも、実際に本を開いた状態の物理的な見開きは描写しないでください。中央の綴じ目、ノド、折り目、ページ間の切れ目、中央の影、紙の湾曲、厚み、冊子としての立体感は入れないでください。\n\n出版前のフラットなデジタル誌面データ、入稿前のレイアウトデータ、または1枚の連続した横長キャンバスとして扱ってください。左右ページに相当する構成を使う場合でも、中央で画像や背景を物理的に分断せず、キャンバス全体をシームレスに連続させてください。`;

  const flatEn=`When composing a two-page editorial layout, do not depict a physical open book. Do not add a center gutter, binding seam, fold, page gap, center shadow, paper curvature, page thickness, or any three-dimensional book structure.\n\nTreat the result as a flat pre-publication digital spread, prepress layout, or one continuous wide canvas. Even when the design implies left and right pages, keep the image and background visually seamless across the center with no physical interruption.`;

  function appendOnce(text,addition,marker){
    if(!text)return addition;
    if(String(text).includes(marker))return text;
    return `${String(text).trim()}\n\n${addition}`;
  }

  function patch(obj){
    if(!obj||!Array.isArray(obj.masters))return;
    obj.masters.forEach(master=>{
      master.text=appendOnce(master.text,flatJp,'出版前のフラットなデジタル誌面データ');
      master.textEn=appendOnce(master.textEn,flatEn,'flat pre-publication digital spread');
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