(function(){
  // Update built-ins by stable ID. Custom presets and selections are not rewritten.
  const data=window.initialData;
  if(!data)return;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const appendOnce=(text,addition)=>String(text||'').includes(addition)?text:`${String(text||'').trim()}\n\n${addition}`;
  const update=(kind,id,values)=>{
    const item=(data[kind]||[]).find(x=>x.id===id);
    if(item)Object.assign(item,values);
  };

  const qualityJp='光の階調、瞳のピント、髪や布の細部、自然な肌のきめを丁寧に描写し、プロが撮影・仕上げを行った人物中心の写真集として表現してください。白い肌のハイライトにも質感を残し、影には奥行きを持たせてください。自然光・窓光・柔らかなサイドライトを基本とし、明示されたSCENEやKEEPで維持する光の条件に合わせてください。人工的なテカリ、極端なHDR、過剰なシャープネス、均一な美肌加工は避けてください。この写真品質の指示だけを理由に、ポーズや撮影距離を変えないでください。';
  const qualityEn='Create a professionally photographed and finished, person-centered photobook with nuanced tonal transitions, attentive focus on the eyes when visible, fine hair and fabric detail, and natural skin texture. Retain detail in fair-skin highlights and depth in the shadows. Use daylight, window light, and soft side light as the default, adapting to the explicit SCENE or the lighting preserved by KEEP. Avoid artificial gloss, extreme HDR, excessive sharpening, and uniform skin smoothing. These quality instructions alone must not change the pose or camera distance.';
  const rulesJp='各差分は担当する要素だけに適用してください。VARIATIONは撮影条件の変化量、LAYOUTは写真数と誌面配置、SCENEは環境とその光、POSEは姿勢・動作・視線・表情、OUTFITは衣装、COVERAGEは衣装のカバー範囲、BODYは身体的差分を担当します。明示された差分はその要素についてMASTERの維持指示より優先し、変更指定のない要素は参照画像に合わせてください。OUTFIT未選択時は参照画像の衣装を維持し、COVERAGE選択時はそのカバー範囲を優先してください。\n\n複数のBODY差分は指定部位・要素の変更を合わせて適用してください。全身筋肥大と部位別筋肥大の併用では、全身の筋量増加に加えて指定部位を重点的に発達させてください。vascularityは筋量とは独立して調整し、衣装を変えたりカバー範囲を減らしたりする指示にはしないでください。\n\n複数のSCENEやPOSEは、両立する要素だけを同じ写真に組み合わせてください。両立しない環境や姿勢は、複数SHOTならカット間に配分し、1 SHOTなら選択肢の中から一貫した一場面・一姿勢を選んでください。指定された写真数や人物数を増やさないでください。';
  const rulesEn='Apply each modifier only to its own responsibility: VARIATION controls the amount of change in the photographic setup; LAYOUT controls photograph count and page arrangement; SCENE controls the environment and its light; POSE controls posture, action, gaze, and expression; OUTFIT controls clothing; COVERAGE controls fabric coverage; BODY controls physical changes. Explicit modifiers take priority over MASTER preservation instructions for their respective elements. Preserve reference elements not explicitly changed. With no OUTFIT selected, retain the reference clothing; a selected COVERAGE modifier takes priority for fabric coverage.\n\nCombine the targeted regions and properties of all selected BODY modifiers. When full-body and regional hypertrophy are combined, increase overall muscular mass and give the specified regions additional emphasis. Adjust vascularity independently of muscular mass; it does not instruct a clothing change or reduced coverage.\n\nCombine multiple SCENE or POSE choices within one photograph only when they are compatible. Distribute incompatible environments or postures across photographs in a multi-shot layout; for 1 SHOT, choose one coherent setting and posture from the selections. Do not increase the specified photograph or subject count.';

  (data.masters||[]).forEach(master=>{
    if(!['attack','neutral','safe'].includes(master.id))return;
    master.text=master.text.split('\n\n').map(paragraph=>{
      if(paragraph.startsWith('ポーズ、構図、カメラ距離'))return rulesJp;
      if(paragraph.startsWith('自然光、窓光')||paragraph.startsWith('自然光を基調とした'))return qualityJp;
      if(paragraph.startsWith('スポーツ・フィットネスの文脈に自然に馴染む'))return 'スポーツ・フィットネスの文脈に自然に馴染む、洗練された女性アスリート写真集として表現してください。\n\n'+qualityJp;
      return paragraph;
    }).join('\n\n');
    master.textEn=master.textEn.split('\n\n').map(paragraph=>{
      if(paragraph.startsWith('If a VARIATION modifier'))return rulesEn;
      if(paragraph.startsWith('Use natural daylight')||paragraph.startsWith('Use refined, person-centered'))return qualityEn;
      if(paragraph.startsWith('Present her in clean, sophisticated'))return 'Present her in a refined female-athlete photobook that naturally fits a sports and fitness context.\n\n'+qualityEn;
      return paragraph;
    }).join('\n\n');
  });

  update('variations','keep',{
    text:'参照画像のポーズ、身体の向き、写真内の構図、カメラ距離、画角、撮影位置、背景、ロケーション、光の方向を可能な限り維持してください。表情・視線・指先・足位置・重心・髪の動きには、ごく小さな自然な違いだけを加えて構いません。\n\nSCENEが明示された場合は環境とその環境に必要な光だけを、POSEが明示された場合は指定の姿勢・動作・視線・表情だけを変更してください。BODY、OUTFIT、COVERAGEもそれぞれの担当要素に適用し、それを理由に撮影位置や画角を変えないでください。\n\nLAYOUTの写真数と誌面配置は適用してください。ただし、写真内のポーズやフレーミングを変える根拠にはしないでください。複数SHOTでも、同じ撮影条件の近い別テイクや微細な表情の違いとして構成し、無関係な新しいカットを作らないでください。',
    textEn:'Preserve the reference pose, body orientation, composition within each photograph, camera distance, framing, camera position, background, location, and light direction as closely as possible. Allow only very small natural differences in expression, gaze, fingers, foot placement, weight distribution, or hair movement.\n\nAn explicit SCENE changes only the environment and the light needed for that environment. An explicit POSE changes only its specified posture, action, gaze, and expression. Apply BODY, OUTFIT, and COVERAGE to their respective elements without using them to justify a different camera position or framing.\n\nApply the LAYOUT photograph count and page arrangement, but do not use them to change the pose or framing within a photograph. Even with multiple shots, use closely related takes under the same setup and subtle expression differences rather than unrelated new views.'
  });
  const posePriorityJp='POSEが指定されている場合は、その姿勢・動作・視線・表情を採用したうえで、指定されていない撮影条件にこの変化量を適用してください。';
  const posePriorityEn='When POSE is selected, use its specified posture, action, gaze, and expression, then apply this variation level to the photographic conditions it does not specify.';
  ['balanced','dynamic'].forEach(id=>{
    const item=data.variations.find(x=>x.id===id);
    item.text=appendOnce(item.text,posePriorityJp);
    item.textEn=appendOnce(item.textEn,posePriorityEn);
  });

  const layoutScopeJp='写真内の変化量はVARIATION、姿勢・視線はPOSE、環境はSCENEに従ってください。LAYOUTだけを理由に撮影角度・衣装・ポーズを変えないでください。KEEPでは写真内のフレーミングを維持し、誌面上の写真枠と余白で配置を調整してください。出版前のフラットなデジタル誌面として仕上げてください。';
  const layoutScopeEn='Follow VARIATION for changes within photographs, POSE for posture and gaze, and SCENE for the environment. LAYOUT alone must not change camera angles, clothing, or poses. With KEEP, preserve framing within each photograph and adjust only the image frames and negative space on the page. Finish as a flat pre-publication digital layout.';
  const layouts=[
    ['1','1枚の写真だけで構成してください。KEEP以外では、人物を大きく見せる縦位置または縦長寄りの人物写真を主役にしてください。横長キャンバス全体を無理に1枚の横長写真で埋めたり、人物が小さくなる極端な引き構図にしたりしないでください。余った横方向のスペースは背景の自然な延長、意図的な余白、最小限の誌面デザインに使い、写真を左右どちらかに寄せても構いません。KEEPでは参照写真の向きとフレーミングを維持してください。','Use exactly one photograph. Except under KEEP, prioritize a portrait-oriented or vertically dominant image that makes the model large and prominent. Do not force a landscape photograph to fill the entire wide canvas or use an extreme establishing shot that makes the model small. Use remaining horizontal space for natural background continuation, intentional negative space, or minimal editorial design; the photograph may sit toward either side. With KEEP, retain the reference photograph orientation and framing.'],
    ['2','写真を正確に2枚配置してください。大きなメイン写真1枚と、それを補完する写真1枚を、余白とサイズ差でまとめてください。','Use exactly two photographs: one large main image and one supporting image, unified through spacing and a clear size hierarchy.'],
    ['3','写真を正確に3枚配置してください。大きなメイン写真1枚と補助写真2枚を組み合わせ、均等な小分割ではなく、人物が十分大きく見えるサイズと余白にしてください。','Use exactly three photographs: one large main image and two supporting images. Avoid equal small panels; use image sizes and negative space that keep the model clearly visible.'],
    ['4','写真を正確に4枚配置してください。やや大きなメイン写真1枚と補助写真3枚を、大小差と余白によってまとまりのある誌面にしてください。','Use exactly four photographs: one larger main image and three supporting images, arranged with varied panel sizes and coherent negative space.'],
    ['5','写真を正確に5枚配置してください。大きなメイン写真1枚と補助写真4枚を組み合わせ、写真を小さく均等に並べず、視線の流れが生まれるサイズ差と余白を使ってください。','Use exactly five photographs: one large main image and four supporting images. Avoid equally small panels; use differences in size and spacing to guide the eye.']
  ];
  layouts.forEach(([id,jp,en])=>update('layouts',id,{text:jp+'\n\n'+layoutScopeJp,textEn:en+'\n\n'+layoutScopeEn}));

  // Scene descriptions specify environments, not mandatory poses or camera moves.
  const scenes=[
    ['beach','明るく開放的な海岸を舞台にしてください。広い砂浜、波打ち際、青い海、岩場を環境として活用し、海風と自然光、砂や水面の反射を描写してください。','Use a bright, open coastline with broad sand, the waterline, blue sea, and rocks. Convey sea breeze, natural light, and reflections from sand and water.'],
    ['soft-interior','上質で静かな室内空間を舞台にしてください。大きな窓、白いカーテン、柔らかな寝具、白いシーツ、クッション、木製家具を背景として活用してください。窓からの拡散光と白い布の反射光で、穏やかな奥行きと自然な肌の質感を描写してください。','Use a quiet, refined interior with large windows, white curtains, soft bedding, white sheets, cushions, and wooden furniture. Diffused window light and bounce from white fabric create gentle depth and natural skin texture.'],
    ['washitsu','静かな日本の和室を舞台にしてください。畳、障子、木製の柱、低い家具、床の間を背景とし、障子越しの柔らかな日光、細い斜光、畳に落ちる影を活かして、暖かく落ち着いた空気を表現してください。','Use a quiet Japanese tatami room with shoji screens, wooden posts, low furniture, and an alcove. Soft daylight through shoji, narrow shafts of side light, and shadows on tatami create a warm, calm atmosphere.'],
    ['pool','開放感のある屋外プールと周囲のデッキを舞台にしてください。水面、デッキチェア、建築、周囲の景観を背景に、水面の反射光と自然な風を活かし、明るい夏の空気を表現してください。','Use an open outdoor pool and surrounding deck with water, lounge furniture, architecture, and nearby scenery. Reflected light from the water and natural breeze establish a bright summer atmosphere.'],
    ['city-night','都会の夜景を舞台にしてください。ビルの明かり、歩道、ガラス壁、屋上、ネオンの反射を背景に、街の環境光と実在する照明で映画的な奥行きを作ってください。肌色は参照画像に合わせ、色付きの光を肌全体の色調変化にしないでください。','Use an urban night setting with building lights, sidewalks, glass walls, rooftops, and reflected neon. Use existing practical lights and city illumination for cinematic depth. Retain the reference skin tone rather than turning colored light into an overall change in complexion.'],
    ['gym','実際のトレーニングジムを舞台にしてください。フリーウェイト、マシン、ベンチ、ラック、鏡、通路などを背景とし、窓光や施設に自然な照明、器具の素材感と空間の奥行きを描写してください。','Use a real training gym with free weights, machines, benches, racks, mirrors, and aisles. Show window light or believable facility lighting, equipment materials, and depth through the space.'],
    ['daily-interior','明るく落ち着いた住宅やモダンな室内を舞台にしてください。窓際、ソファ、テーブル、廊下、キッチン周辺の生活感と、自然な窓光、木材や布の素材感を活かしてください。','Use a bright, calm residence or modern interior with windows, a sofa, table, hallway, and kitchen area. Retain lived-in details, natural window light, and the texture of wood and fabric.'],
    ['nature','緑の多い公園、森林、湖畔、草原、遊歩道のいずれかを舞台にしてください。木漏れ日、自然な風、前景の植物、奥行きのある背景によって、開放的で静かな自然の空気を表現してください。','Use a green park, forest, lakeside, grassland, or walking trail. Dappled daylight, natural breeze, foreground plants, and a layered background establish an open, quiet natural atmosphere.'],
    ['sports-hall','明るい体育館やインドアスポーツ施設を舞台にしてください。コート、ネット、ベンチ、ライン、壁面、観客席を背景とし、高い窓からの光や施設の照明、床面の穏やかな反射を描写してください。','Use a bright indoor sports hall with a court, nets, benches, floor lines, walls, and spectator seating. Show light from high windows or facility fixtures and restrained reflections from the floor.'],
    ['sunset','夕方からマジックアワーの屋外を舞台にしてください。低い夕日、逆光や斜光、長い影、柔らかな空の色で落ち着いた空気を表現してください。他のSCENEも選択されている場合は、その屋外環境の時間帯・光として適用し、別の場所を追加しないでください。肌色を一様にオレンジへ変えないでください。','Set an outdoor scene in late afternoon or magic hour, using low sunlight, backlight or side light, long shadows, and a softly colored sky. When another SCENE is selected, apply this as the time and lighting of that outdoor setting rather than adding another location. Do not turn the entire complexion orange.'],
    ['tennis','明るい屋外テニスコートを舞台にしてください。ハードコート、ネット、ベースライン、ベンチ、フェンス、観客席、周囲の建築を背景とし、屋外の自然光とコートの質感を表現してください。','Use a bright outdoor tennis court with hard court surfaces, a net, baseline, bench, fence, spectator seating, and surrounding architecture. Show natural outdoor light and the texture of the court.']
  ];
  scenes.forEach(([id,jp,en])=>update('scenes',id,{text:jp,textEn:en}));

  const poseScopeJp='環境はSCENE、写真数はLAYOUTに従ってください。カメラ位置・距離・画角の変化はVARIATIONの範囲内に留め、KEEPでは維持してください。他のPOSEと併用する場合は両立する動作・表情を組み合わせ、異なる姿勢を同じ身体に同時に要求しないでください。';
  const poseScopeEn='Follow SCENE for the setting and LAYOUT for photograph count. Keep camera-position, distance, and framing changes within VARIATION; preserve them under KEEP. When combining POSE modifiers, combine compatible actions and expressions without requiring incompatible postures from the same body at once.';
  const poses=[
    ['standing','立ち姿を基本に、正面、斜め、横向き、軽い身体のひねり、自然な片足重心、既存の壁や手すりに寄りかかる姿勢を選んでください。完成したポーズだけでなく、手の置き方や視線がふっと変わる瞬間も活かしてください。','Build around standing: front, three-quarter, side, a slight torso turn, a natural weight shift, or leaning against an existing wall or rail. Include small changes in hand placement and gaze as well as settled poses.'],
    ['sitting','選択された環境にある椅子、ベンチ、ソファ、床、段差などで、自然な座り姿を取ってください。脚の曲げ伸ばし、身体の軽いひねり、前後への重心移動、休憩や立ち上がる前の姿勢を活かし、肩と手は落ち着かせてください。','Use a natural seated posture on a chair, bench, sofa, floor, or step already appropriate to the selected setting. Use comfortable leg positions, slight torso turns, forward or backward weight shifts, rest, or preparation to stand, with relaxed shoulders and hands.'],
    ['motion','選択された環境に合う歩行、振り返り、方向転換、軽い走行、腕の動きを捉えてください。動作の直前・最中・直後にある自然な表情と、髪や衣装の動きを活かしてください。','Capture walking, turning, changing direction, light running, or arm movement appropriate to the selected environment. Use natural expressions immediately before, during, or after an action and the movement of hair and clothing.'],
    ['candid-close','撮影者との短い会話の合間のように、目が合う、ふっと視線を外す、笑い終わる、髪を整える、相手の言葉に反応する瞬間を捉えてください。肩や手を自然に保ち、作り込んだ表情よりも気持ちが伝わる小さな変化を優先してください。親しさは視線と表情で作り、距離を変えることは必須にしないでください。','Capture moments between brief exchanges with the photographer: meeting the lens, glancing away, a smile settling, adjusting hair, or reacting to a remark. Keep shoulders and hands natural and favor small emotionally readable changes over exaggerated expressions. Create familiarity through gaze and expression without requiring a change in camera distance.'],
    ['low-close','床面や地面を使う低い姿勢を選んでください。自然なしゃがみ、片膝をつく、床に座る、横向きに休む、肘や前腕で上体を支える、座る途中や起き上がる途中などを、身体の支えと重心が分かる姿勢として表現してください。顔や手の仕草を活かし、低い姿勢だけを理由に撮影位置を下げたり、身体の一部へ寄ったりしないでください。','Choose a low posture using the floor or ground: a natural squat, one knee down, sitting on the floor, resting on the side, supporting the torso on an elbow or forearm, or settling down or rising. Keep support and weight distribution readable. Use facial expression and hand gestures; a low posture alone does not call for a lower camera or a crop focused on an isolated body part.'],
    ['low-athletic','ウォームアップ、ストレッチ、運動後の休憩に合う低い姿勢を選んでください。片膝姿勢、しゃがみ、手と膝で支えるストレッチ、マットや床での休憩、横向きのストレッチ、起き上がる途中などを、自然な支持と重心で表現してください。','Choose low postures appropriate to warm-up, stretching, or rest after activity: one knee down, a squat, a stretch supported on hands and knees, rest on a mat or floor, a side-lying stretch, or rising. Keep support and weight distribution natural.']
  ];
  poses.forEach(([id,jp,en])=>update('poses',id,{text:jp+'\n\n'+poseScopeJp,textEn:en+'\n\n'+poseScopeEn}));
  const partner={
    id:'partner-pov',title:'🤍 PARTNER POV',
    text:'成人女性モデルを、親しい恋人が撮影しているような視点で捉えてください。撮影されることを楽しみ、信頼している相手にだけ見せる自然な表情として、ふと目が合う瞬間、笑い終わりの余韻、少し照れた微笑み、言葉を待つような静かな視線を表現してください。\n\n選択された姿勢の中で、顔を少しこちらへ向ける、相手の話に耳を傾ける、視線を外してから戻すなど、小さな反応によって親しさと胸が高鳴る空気を作ってください。衣装の変更ではなく、視線、表情、間合いで感情を伝えてください。写真集としての丁寧な光と仕上がりを維持し、撮影者や別の人物、その手を画面に追加しないでください。\n\n'+poseScopeJp,
    textEn:'Photograph the adult female model from the perspective of a close romantic partner. Let her visibly enjoy being photographed by someone she trusts, capturing an unexpected meeting of eyes, the lingering end of a laugh, a slightly shy smile, or a quiet look as she waits for a reply.\n\nWithin the selected posture, use small reactions such as turning her face slightly toward the viewer, listening attentively, or looking away and returning her gaze. Build warmth and a flutter of anticipation through eye contact, expression, and timing rather than a change in clothing. Keep the carefully shaped light and professional finish of a photobook. Do not add the photographer, another person, or their hands to the image.\n\n'+poseScopeEn
  };
  const existingPartner=(data.poses||[]).find(x=>x.id===partner.id);
  if(existingPartner)Object.assign(existingPartner,partner);else data.poses.push(partner);

  const bodyScopeJp='他のBODY差分も選択されている場合は、その指定部位・要素の変更も適用してください。参照画像の維持は、BODYで変更を指定していない要素にだけ適用します。顔立ち・骨格・身長感は維持し、筋肉や血管を見せるために衣装のカバー範囲を減らさないでください。';
  const bodyScopeEn='Also apply changes to regions and properties specified by other selected BODY modifiers. Reference-preservation instructions apply only to properties not explicitly changed by BODY. Preserve facial features, skeletal structure, and apparent height; do not reduce clothing coverage to expose muscles or veins.';
  const regional={
    'hypertrophy-abs':['腹部','the abdominal region'],
    'hypertrophy-delts':['三角筋','the deltoids'],
    'hypertrophy-lats':['広背筋','the lats'],
    'hypertrophy-thighs':['大腿部','the thighs']
  };
  (data.bodies||[]).forEach(item=>{
    const region=regional[item.id];
    if(region){
      item.text=item.text.replace(`${region[0]}以外の筋肉量は元画像の基準を維持してください。`,`${region[0]}以外の筋肉量は、他のBODY差分が指定されていない限り、参照画像の基準を維持してください。`);
      item.textEn=item.textEn.replace(`Keep muscular mass outside ${region[1]} at the reference level.`,`Keep muscular mass outside ${region[1]} at the reference level unless another selected BODY modifier changes it.`);
    }
    if(['vascularity-athlete','vascularity-extreme','full-bust'].includes(item.id)){
      item.text=item.text.replace('骨格、筋肉量、','骨格、身長感、');
      item.textEn=item.textEn.replace('skeletal structure, muscular mass,','skeletal structure, apparent height,').replace('skeletal frame, muscular mass,','skeletal frame, apparent height,');
    }
    if(item.id==='hypertrophy'){
      item.text=item.text.replace('単一部位だけを極端に巨大化させたり、骨格や関節の比率を崩したりせず、現実的な人体構造を保ってください。','骨格や関節の比率と現実的な人体構造を保ち、部位別BODY差分がある場合は、その部位に追加の筋量と立体感を与えてください。');
      item.textEn=item.textEn.replace('Do not enlarge a single body part disproportionately or distort joints and skeletal proportions. Keep the anatomy realistic.','Keep joints, skeletal proportions, and anatomy realistic. When regional BODY modifiers are selected, give those regions additional muscular mass and volume.');
    }
    item.text=appendOnce(item.text,bodyScopeJp);
    item.textEn=appendOnce(item.textEn,bodyScopeEn);
  });

  try{
    const key='promptPaletteV2';
    const raw=localStorage.getItem(key);
    if(raw){
      const saved=JSON.parse(raw);
      ['masters','variations','layouts','scenes','poses','bodies'].forEach(kind=>{
        if(!Array.isArray(saved[kind]))return;
        (data[kind]||[]).forEach(fresh=>{
          const current=saved[kind].find(x=>x.id===fresh.id);
          if(current){current.title=fresh.title;current.text=fresh.text;current.textEn=fresh.textEn;}
          else saved[kind].push(clone(fresh));
        });
      });
      localStorage.setItem(key,JSON.stringify(saved));
    }
  }catch(e){}
})();
