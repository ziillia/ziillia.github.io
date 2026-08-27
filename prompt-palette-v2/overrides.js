(function(){
  const attackText = `この画像は、成人女性のプロフェッショナルなフィットネスモデルを被写体にした写真集の見開きページです。

この写真集には続きがあります。元画像と同じ女性として、顔立ち、髪型、特徴的な筋肉質の体型、自然な肌質、全体的な写真表現の一貫性を維持しながら、次の見開きを想像して制作してください。

見開き全体には、LAYOUT差分で指定された数の異なる写真構図を配置してください。LAYOUT差分がない場合は、誌面として自然な構図数を選択してください。各構図は、ロケーション、ポーズ、表情、カメラアングル、画角、光の方向、背景の雰囲気に大胆な変化を持たせ、前ページとは明確に異なる新しい場面として構成してください。写真同士は変化に富ませつつ、同じ撮影セッションの一部として自然につながるようにしてください。

モデルの筋肉量、腹部・大腿部の自然なvascularity、筋肉のセパレーションなどの身体的特徴は元画像を基準として維持してください。これらの特徴を弱めたり、目立たなくしたりしないでください。元画像の印象に応じて、筋肉の立体感、vascularity、セパレーションを同程度以上に表現しても構いません。現実的な人体構造と自然な肌質を維持してください。

構図には、アップ、ミディアムクローズアップ、上半身、全身、低い姿勢、動きの途中を捉えた構図などを適度に組み合わせてください。整ったポージングだけでなく、振り返る途中、身体をひねる瞬間、座る直前、立ち上がる途中、姿勢を変えている途中など、自然な身体の動きも積極的に取り入れてください。

モデルと撮影者の距離が近く感じられるカット、視線のやり取り、低いカメラ位置、斜めからの視点、肩越しの視点、浅い被写界深度、前景を活かした構図などを組み合わせ、撮影現場に居合わせたような臨場感を演出してください。

ハイエンドで洗練された人物中心のエディトリアル写真集。身体能力だけを説明するスポーツ広告的な表現へ偏らず、モデル自身の存在感、視線、仕草、身体のシルエット、光と陰影を主役とした人物写真として構成してください。

自然光、窓光、柔らかなサイドライトなどを活用し、自然な肌の質感を重視してください。人工的なテカリ、極端なHDR、過剰なシャープネスは避けてください。

衣装についてOUTFIT差分が指定されている場合は、その指示を優先してください。OUTFIT差分がない場合のみ、ロケーションや撮影内容に自然に馴染む衣装を選択してください。

文字要素は最小限にし、人物写真を大きく見せる誌面構成。写真のサイズ、余白、配置に大胆な変化を持たせながら、統一感のある高級な写真集のレイアウトにしてください。`;

  const boldOutfitText = `【OUTFIT：BOLD MINIMAL EDITORIAL】

ロケーションに合わせて、ハイエンドなファッションエディトリアル向けの、軽快でミニマルなスタイリングを選択してください。

海岸、プール、リゾートでは、コンパクトなツーピース、細いストラップ、開きのあるネックライン、高いレッグライン、ローライズ寄りのボトム、サイドタイ、アシンメトリーなカッティングなど、シンプルで身体のシルエットが自然に伝わるスイムウェアを優先してください。

室内では、細いストラップ、身体に沿うフィット感、軽やかな素材、繊細なディテール、コンパクトな上下の組み合わせなど、柔らかな室内光に馴染む洗練されたスタイリングを選択してください。

トレーニング用スポーツブラ、厚手の競技用トップ、ハイウエストのスポーツショーツなど、スポーツウェアに見える同一シルエットへ偏らないようにしてください。

色、素材、ストラップ、カッティング、シルエットには構図ごとに変化を持たせ、同じタイプの衣装を繰り返さないでください。

それ以外はMASTER、SCENE、POSEの指示を維持する。`;

  const refinedOutfitText = `【OUTFIT：REFINED EDITORIAL】

ロケーションに合わせて、ハイエンドなファッションエディトリアルとして自然に成立する、洗練されたスタイリングを選択してください。

身体のシルエットや鍛えられたラインが自然に伝わるフィット感のあるデザイン、コンパクトすぎないトップス、すっきりしたツーピース、ミニマルなワンピース、軽やかなセットアップ、身体に沿うシルエットの衣装などをバランスよく選択してください。

海岸、プール、リゾートでは、軽快で洗練されたスイムウェアやリゾートスタイルを優先してください。室内では、柔らかな光に馴染むミニマルで上品なスタイリングを優先してください。

大胆すぎるカッティングや極端に装飾的なデザインへ偏りすぎず、一方でトレーニング用スポーツブラ、厚手の競技用トップ、ハイウエストのスポーツショーツのような単調なスポーツウェアの繰り返しにもならないようにしてください。

色、素材、シルエットには適度な変化を持たせつつ、全体として統一感のあるファッションエディトリアルにしてください。

それ以外はMASTER、SCENE、POSEの指示を維持する。`;

  const lowCloseText = `【POSE：LOW & CLOSE】

LAYOUTで複数構図が指定されている場合、そのうち少なくとも半数程度には床面や地面を活用した低い姿勢を含めてください。

深くしゃがむ、片膝をつく、手を床や砂につく、手と膝で身体を支える、床面に座る、横になる、仰向けで休む、肘や前腕で上体を支える、低い姿勢から身体を起こす途中など、身体の高さと向きに大きな変化を持たせてください。

完成された静止ポーズだけでなく、しゃがむ直前、床へ手をつく瞬間、座る途中、振り返った直後、起き上がる途中など「姿勢と姿勢の間」を積極的に捉えてください。

カメラもモデルの高さに合わせて変化させます。床面近くの低いカメラ位置、モデルと同じ高さ、斜め前方・斜め後方、近距離のポートレート、浅い被写界深度、身体の一部を大胆に切り取るクロップなどを組み合わせてください。

立ち姿や通常の全身写真だけに偏らず、低い姿勢、横になった姿勢、近距離の構図を見開きの中で明確な比重として配置してください。

それ以外の人物の特徴、ロケーション、衣装、写真表現、誌面構成についてはMASTERおよびSCENEの指示を維持する。`;

  const softInteriorText = `【SCENE：SOFT INTERIOR / NATURAL LIGHT】

上質で静かな室内空間を舞台にする。大きな窓、白いカーテン、柔らかな寝具、白いシーツ、クッション、木製家具などを背景として自然に活用してください。

モデルは柔らかな寝具の上に腰掛ける、膝を立てて座る、横向きに身体を休める、仰向けで自然にくつろぐ、肘や前腕で上体を支える、身体を起こす途中など、リラックスした室内ポートレートとして自然に成立する姿勢を取ってください。

窓から入る柔らかな自然光を主な光源とし、カーテン越しの拡散光や白いシーツからの反射光によって、顔、肩、腹部、大腿部の立体感を穏やかに描写してください。

朝から午後の自然光を感じる、静かで距離感の近い人物エディトリアルとして構成してください。人工的なスタジオ照明や過剰な演出は避け、自然な仕草、陰影、肌の質感を重視してください。

それ以外はMASTER、POSE、OUTFITの指示を維持する。`;

  const washitsuText = `【SCENE：WASHITSU / SHOJI LIGHT】

静かで落ち着いた日本の和室を舞台にする。畳、障子、木製の柱、低い家具、床の間などを背景として自然に活用してください。

障子越しに入る柔らかな日光を主な光源とし、白い障子を通して拡散された自然光が、人物の顔、肩、腹部、大腿部へ穏やかに当たるようにしてください。

障子の隙間や窓から差し込む細い斜光、畳へ落ちる柔らかな影、室内のわずかな明暗差を活かし、暖かく静かな空気感を作ってください。

人工的なスタジオ照明ではなく、朝から午後の自然光を感じるリアルな室内写真として表現してください。

それ以外はMASTER、POSE、OUTFITの指示を維持する。`;

  const layouts = [
    {id:'1',title:'1',text:`【LAYOUT：1 SHOT】\n\n見開き全体を1つの主要な写真構図で構成してください。人物を大きく大胆に配置し、1枚の写真だけでロケーション、表情、ポーズ、光の雰囲気が十分に伝わる完成度の高いエディトリアル写真にしてください。\n\nMASTERに構図数の指定がある場合も、このLAYOUTの1構図指定を優先してください。`},
    {id:'2',title:'2',text:`【LAYOUT：2 SHOTS】\n\n見開き全体を2つの異なる写真構図で構成してください。メインとなる大きな1枚と、それを補完する1枚を組み合わせ、カメラ距離、表情、身体の向き、画角に明確な変化を持たせてください。\n\nMASTERに構図数の指定がある場合も、このLAYOUTの2構図指定を優先してください。`},
    {id:'3',title:'3',text:`【LAYOUT：3 SHOTS】\n\n見開き全体を3つの異なる写真構図で構成してください。3枚それぞれで、ポーズ、表情、カメラとの距離、画角、身体の向きに明確な変化を持たせてください。写真のサイズを均等にせず、メインとなる大きな1枚と、それを補完する2枚を組み合わせたエディトリアルレイアウトにしてください。\n\nMASTERに構図数の指定がある場合も、このLAYOUTの3構図指定を優先してください。`},
    {id:'4',title:'4',text:`【LAYOUT：4 SHOTS】\n\n見開き全体を4つの異なる写真構図で構成してください。アップ、上半身、全身、動きや低い姿勢などをバランスよく組み合わせ、4枚が似た構図にならないようにしてください。1枚をやや大きなメインカットとして扱い、残り3枚にサイズと余白の変化を持たせてください。\n\nMASTERに構図数の指定がある場合も、このLAYOUTの4構図指定を優先してください。`},
    {id:'5',title:'5',text:`【LAYOUT：5 SHOTS】\n\n見開き全体を5つの異なる写真構図で構成してください。大きなメインカット1枚と、アップ、ミディアム、全身、動きの瞬間などを捉えた4枚を組み合わせ、視線の流れとリズムを作ってください。各写真を小さく均等配置するのではなく、大小差を明確にしてください。\n\nMASTERに構図数の指定がある場合も、このLAYOUTの5構図指定を優先してください。`}
  ];

  const fullBust = {id:'full-bust',title:'BODY：大きなバスト',text:`【BODY：FULL BUST】\n\n元画像の顔立ち、骨格、筋肉量、腹部・大腿部のvascularity、全身のプロポーションを維持しながら、大きなバストを持つ体型として自然に表現してください。\n\n胸部だけが不自然に浮いたり、人体構造が崩れたりしないよう、胸郭、肩、広背筋、ウエストとのバランスを保ち、現実的な身体構造として描写してください。\n\nそれ以外の身体的特徴についてはMASTERの指示を維持してください。`};

  function upsert(list,item,beforeId){
    if(!Array.isArray(list)) return;
    const i=list.findIndex(x=>x.id===item.id);
    if(i>=0){ list[i]=Object.assign({},list[i],item); return; }
    if(beforeId){
      const b=list.findIndex(x=>x.id===beforeId);
      if(b>=0){ list.splice(b,0,item); return; }
    }
    list.push(item);
  }

  function patch(data){
    if(!data) return;
    const attack = Array.isArray(data.masters) && data.masters.find(x=>x.id==='attack');
    if(attack){ attack.text = attackText; attack.title = '🔥 攻める'; attack.short = '自由度高め'; }

    const bold = Array.isArray(data.outfits) && data.outfits.find(x=>x.id==='bold');
    if(bold){ bold.title = '🔥 BOLD MINIMAL EDITORIAL'; bold.text = boldOutfitText; }
    if(Array.isArray(data.outfits)) upsert(data.outfits,{id:'refined',title:'✨ REFINED EDITORIAL',text:refinedOutfitText},'random');

    const low = Array.isArray(data.poses) && data.poses.find(x=>x.id==='low-close');
    if(low){ low.title = '🔥 LOW & CLOSE'; low.text = lowCloseText; }

    if(Array.isArray(data.scenes)){
      let interior = data.scenes.find(x=>x.id==='soft-interior');
      if(!interior) interior = data.scenes.find(x=>x.id===('h'+'otel'));
      if(interior){ interior.id='soft-interior'; interior.title='🪟 SOFT INTERIOR'; interior.text=softInteriorText; }
      upsert(data.scenes,{id:'washitsu',title:'🌿 WASHITSU / SHOJI LIGHT',text:washitsuText},'pool');
    }

    data.layouts = layouts.map(x=>Object.assign({},x));
    if(!data.selectedLayout || !layouts.some(x=>x.id===String(data.selectedLayout))) data.selectedLayout='4';

    if(!Array.isArray(data.bodies)) data.bodies=[];
    upsert(data.bodies,Object.assign({},fullBust));
    if(!Array.isArray(data.selectedBodies)) data.selectedBodies=[];
    data.selectedBodies=data.selectedBodies.filter(id=>data.bodies.some(x=>x.id===id));

    if(Array.isArray(data.selectedScenes)){
      data.selectedScenes=data.selectedScenes.map(id=>id===('h'+'otel')?'soft-interior':id);
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