/* Prompt Palette v17: bilingual, single-responsibility preset catalog. */
(function(root){
  'use strict';
  const row=(id,title,titleEn,text,textEn,extra={})=>({id,title,titleEn,text,textEn,...extra});
  const C={
    looks:[
      row('neutral','写真集','Photobook','人物を主役に、余韻のある洗練された写真集の仕上がり。','A refined, person-centered photobook with a quietly evocative finish.'),
      row('attack','表現的','Expressive','人物の存在感と光の奥行きを活かす、表現豊かなファッションエディトリアル。','An expressive fashion editorial emphasizing presence and depth of light.'),
      row('safe','アスリート','Athlete','鍛えられた身体の機能美を伝える、洗練された女性アスリートのエディトリアル。','A refined female-athlete editorial conveying the functional beauty of a trained physique.')
    ],
    variations:[
      row('keep','🔒 KEEP','🔒 KEEP','指定した要素だけ変更。未指定の姿勢・環境・撮影条件を固定。','Change only selected elements; lock unspecified posture, setting and camera conditions.'),
      row('balanced','⚖ BALANCED','⚖ BALANCED','同じ撮影セッションの別カット。未指定の要素に控えめな変化。','Related takes from one session, with modest changes to unspecified elements.'),
      row('dynamic','⚡ DYNAMIC','⚡ DYNAMIC','未指定の姿勢や撮影条件を大きく変え、新しいカットを構成。','Build distinctly new shots through bold changes to unspecified pose and camera conditions.')
    ],
    scenes:[
      row('beach','🌊 COAST','🌊 COAST','砂浜、波打ち際、海を背景にした開放的な海岸。','An open coastline with sand, the waterline and sea in the background.',{light:'day',setting:'water'}),
      row('soft-interior','🪟 SOFT INTERIOR','🪟 SOFT INTERIOR','大きな窓、白いカーテン、柔らかな寝具、白いシーツ、クッション、木製家具のある静かな室内。','A quiet interior with large windows, white curtains, soft bedding, white sheets, cushions and wooden furniture.',{light:'window',setting:'indoor'}),
      row('washitsu','🎋 和室','🎋 Japanese room','畳、障子、木の柱、低い家具のある静かな和室。','A quiet Japanese room with tatami, shoji screens, timber pillars and low furniture.',{light:'window',setting:'indoor'}),
      row('pool','💧 プールサイド','💧 Poolside','水面とデッキ、端正な建築が見える屋外プールサイド。','An outdoor poolside with water, a deck and clean architectural lines.',{light:'water',setting:'water'}),
      row('city-night','🌃 街の夜景','🌃 City at night','ビルの灯り、ガラスの反射、歩道を背景とした夜の都市。','A city at night with illuminated buildings, glass reflections and pavement.',{light:'night',setting:'urban',fixedTime:true}),
      row('gym','🏋 ジム','🏋 Gym','トレーニング器具、マット、端正な壁面のある整ったジム。','A well-kept gym with training equipment, mats and clean wall surfaces.',{light:'window',setting:'sport'}),
      row('daily-interior','☕ 日常の室内','☕ Everyday interior','椅子、ソファ、テーブルと生活の気配がある落ち着いた室内。','A calm lived-in interior with a chair, sofa and table.',{light:'window',setting:'indoor'}),
      row('nature','🌿 自然','🌿 Nature','緑、木立、草地、自然の小道を背景にした屋外。','An outdoor setting with greenery, trees, grass and a natural path.',{light:'day',setting:'outdoor'}),
      row('sports-hall','🏟 スポーツホール','🏟 Sports hall','床のライン、広い空間、壁面を活かした屋内スポーツホール。','An indoor sports hall with floor markings, open space and clean walls.',{light:'hall',setting:'sport'}),
      row('tennis','🎾 テニスコート','🎾 Tennis court','ネット、コートのライン、フェンスを背景にしたテニスコート。','A tennis court with a net, court markings and a perimeter fence.',{light:'day',setting:'sport'})
    ],
    poses:[
      row('standing','立つ','Standing','片脚に自然に重心を置いた立ち姿。肩と手の力を抜く。','Stand with weight naturally on one leg, shoulders and hands relaxed.'),
      row('sitting','座る','Sitting','環境内の座面に腰掛け、無理のない脚位置と安定した重心を保つ。','Sit on a suitable surface in the setting, with comfortable leg placement and stable support.'),
      row('motion','動き','Motion','その場を歩き、進行方向へ自然に身体を向けた一瞬。髪と衣服に動きが残る。','Capture a step through the setting, the body naturally oriented along the movement, with motion in hair and clothing.'),
      row('low-close','低い姿勢','Low posture','床または地面に座り、片手で上体を支えた安定した姿勢。','Sit on the floor or ground with the torso stably supported by one hand.'),
      row('low-athletic','ストレッチ','Stretching','片膝をついたウォームアップの姿勢。身体の支持と重心を明確にする。','Use a one-knee-down warm-up posture with clear support and balance.')
    ],
    expressions:[
      row('auto','変化量に合わせる','Follow variation','表情は選択した変化量に合わせる。','Let the variation level determine changes in expression.'),
      row('reference','参照を維持','Reference','参照画像の視線と表情を維持。','Preserve the reference gaze and expression.'),
      row('candid-close','自然なやりとり','Candid','短い会話の合間のような、気持ちの伝わる自然な表情。','Natural, emotionally readable expressions between brief exchanges.'),
      row('partner-pov','視線・表情','Gaze & expression','視線の方向、目元と口元の小さな変化、表情が切り替わるタイミングを捉える。撮影者やその手は写さない。','Capture gaze direction, small changes around the eyes and mouth, and the timing of expression transitions. Keep the photographer and their hands out of frame.')
    ],
    distances:[
      row('auto','おまかせ','Auto','選択した変化量の範囲で撮影距離を決める。','Choose camera distance within the selected variation level.'),
      row('reference','参照固定','Lock reference','参照画像の撮影距離と写真内のフレーミングを維持する。','Preserve reference camera distance and framing within the photograph.'),
      row('close','顔寄り','Portrait','顔と肩を中心とした、人物の表情がよく伝わるポートレート。','A face-and-shoulders portrait with a clearly readable expression.'),
      row('medium','上半身','Upper body','頭から腰付近までを収めた上半身の写真。','An upper-body photograph framed from the head to around the waist.'),
      row('full','全身','Full length','頭から足先までを収め、人物を十分大きく見せる全身写真。','A full-length photograph including head and feet, with the subject prominent in frame.')
    ],
    angles:[
      row('auto','おまかせ','Auto','選択した変化量の範囲で撮影角度を決める。','Choose the camera angle within the selected variation level.'),
      row('reference','参照固定','Lock reference','参照画像の撮影位置とカメラ角度を維持する。','Preserve reference camera position and angle.'),
      row('eye','目の高さ','Eye level','目の高さから撮影。','Photograph at eye level.'),
      row('three-quarter','斜めから','Oblique','正面から少し横へ移動した撮影位置。身体の向きは変えない。','Place the camera slightly to one side of the frontal view without changing body orientation.'),
      row('low','少し低く','Slightly low','少し低いカメラ位置。顔や手足の遠近感を誇張しない。','Use a slightly low camera position without exaggerated facial or limb perspective.'),
      row('high','少し高く','Slightly high','少し高いカメラ位置。自然な人物の比率を保つ。','Use a slightly elevated camera position while retaining natural proportions.')
    ],
    lighting:[
      row('auto','環境に合わせる','Match setting','環境と変化量に合う光。','Light matched to the setting and variation level.'),
      row('reference','参照固定','Lock reference','参照画像の光の方向・柔らかさ・露出を維持する。','Preserve the reference light direction, softness and exposure.'),
      row('soft','柔らかな光','Soft light','場の光を柔らかく拡散させ、緩やかな陰影を作る。','Diffuse the available light for gentle tonal transitions.'),
      row('sunset','夕方の光','Evening light','夕方の低い斜光。顔の肌色は参照画像に合わせて補正する。','Low evening light, with facial skin color balanced to the reference.')
    ],
    masses:[
      row('reference','参照を維持','Reference','参照画像の全身の筋量を維持。','Maintain the reference overall muscular mass.'),
      row('hypertrophy','筋肥大','Hypertrophy','全身の筋量を増やし、筋腹の厚み、丸み、張りとセパレーションを強調する。','Increase overall muscular mass, emphasizing muscle-belly thickness, roundness, fullness and separation.'),
      row('hypertrophy-direct','💥 DIRECT','💥 DIRECT','肩、上腕、前腕、胸部、広背筋、腹部、臀部、大腿四頭筋、内転筋、ハムストリングス、ふくらはぎの筋量を大幅に増やす。筋腹の厚み、丸み、張り、立体感、セパレーションを強く表現する。','Substantially increase muscular mass in the shoulders, upper arms, forearms, chest, lats, abdomen, glutes, quadriceps, adductors, hamstrings and calves. Strongly emphasize muscle-belly thickness, roundness, fullness, three-dimensional volume and separation.')
    ],
    regions:[
      row('hypertrophy-abs','腹筋','Abs','腹直筋と腹斜筋の厚み、ブロック感、溝、セパレーション','rectus abdominis and oblique thickness, block-like volume, grooves and separation'),
      row('hypertrophy-delts','三角筋','Delts','三角筋前部・中部・後部の丸み、張り、幅、厚み、上腕との境界','anterior, lateral and posterior deltoid roundness, fullness, width, thickness and separation from the upper arm'),
      row('hypertrophy-lats','広背筋','Lats','広背筋の幅、厚み、外側への張り出し、背中の立体感、V字の輪郭','lat width, thickness, lateral projection, back depth and V-taper'),
      row('hypertrophy-thighs','大腿部','Thighs','大腿四頭筋・内転筋・ハムストリングスの太さ、厚み、前後左右への張り、立体感、セパレーション','quadriceps, adductor and hamstring size, thickness, multidirectional fullness, three-dimensional volume and separation')
    ],
    vascularity:[
      row('reference','参照を維持','Reference','参照画像の血管の見え方を維持。','Preserve reference vascularity.'),
      row('vascularity-athlete','⚡ ATHLETE','⚡ ATHLETE','低体脂肪、運動後のパンプ、体温上昇を伴う成人アスリートのコンディショニング。前腕、上腕、肩、胸上部、腹部、大腿四頭筋、膝周辺、ふくらはぎの血管を、解剖学的走行と筋肉の形に沿って明瞭にする。','Adult-athlete conditioning with low body fat, post-training pump and increased body temperature. Define vascularity along anatomical pathways and muscle contours in the forearms, upper arms, shoulders, upper chest, abdomen, quadriceps, around the knees and calves.'),
      row('vascularity-extreme','🔥 EXTREME','🔥 EXTREME','競技直前のピークコンディション、強いパンプ、非常に低い体脂肪。前腕、上腕、肩、胸部、腹部、腰、大腿四頭筋、内転筋、ハムストリングス、膝周辺、ふくらはぎに太く密な血管網、明瞭な枝分かれ、高いコントラスト、強い表面への浮き上がりを表現する。前腕から胸部、大腿からふくらはぎ、腹部へ広がる血管の連続性を解剖学的走行に沿って強調する。','Pre-competition peak conditioning, a strong pump and very low body fat. Show thick, dense vascular networks with clear branching, high contrast and strongly raised surface definition across the forearms, upper arms, shoulders, chest, abdomen, waist, quadriceps, adductors, hamstrings, knees and calves. Emphasize anatomically routed vascular continuity from forearms to chest, thighs to calves and across the abdomen.')
    ],
    bodies:[row('full-bust','バストのボリューム','Bust volume','成人女性モデルのバストのボリュームを増やす。顔、身長感、骨格、胸郭は維持する。','Increase bust volume in the adult female model, retaining her face, perceived height, skeletal proportions and rib cage.')],
    outfits:[
      row('bold','ミニマル','Minimal','軽やかな素材、すっきりしたストラップ、身体に沿うカッティングのミニマルなファッションスタイリング。','Minimal fashion styling with lightweight materials, clean straps and body-following cuts.'),
      row('refined','洗練','Refined','上品なフィット感、端正なシルエット、軽やかな素材を組み合わせた洗練された衣装。','Refined styling with a polished fit, clean silhouette and lightweight materials.'),
      row('random','おまかせ','Editorial mix','場所に合うモダンカジュアル、リゾートスタイル、ミニマルファッションから衣装を選ぶ。','Choose clothing appropriate to the location from modern casualwear, resort styling and minimal fashion.'),
      row('athletic','スポーツ','Athletic','場所と動作に合う機能的で洗練されたスポーツウェア。','Functional, refined sportswear appropriate to the location and action.')
    ],
    coverages:[
      row('coverage-strong','しっかり','Strong','胸元、脇、腹部、腰、臀部周辺の布面積を明確に増やす。身頃と丈にゆとりを持たせ、端正なシルエットと素材感を保つ。','Clearly extend fabric coverage at the neckline, sides, abdomen, waist and seat. Use fuller, longer panels while retaining a clean silhouette and refined materials.'),
      row('coverage-swim','水辺向け','Swim','スイムウェアの胸元と脇、腰とヒップの布面積を増やし、安定したカバー範囲と洗練されたシルエットを両立する。','Extend swimwear fabric at the neckline, sides, waist and hips, combining secure coverage with a refined silhouette.'),
      row('coverage-indoor','室内向け','Indoor','室内向けの衣装の胸元、腹部、腰、臀部周辺を柔らかな布で広くカバーし、心地よいフィット感と洗練を保つ。','Extend soft fabric coverage at the neckline, abdomen, waist and seat in indoor styling, retaining a comfortable fit and refined finish.')
    ]
  };
  root.PPCatalog=C;
  if(typeof module==='object'&&module.exports)module.exports=C;
})(typeof window!=='undefined'?window:globalThis);
