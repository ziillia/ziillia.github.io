/* Pure state migration, shot planning and prompt compilation. No DOM or storage access. */
(function(root){
  'use strict';
  const C=root.PPCatalog||(typeof require==='function'?require('./catalog.js'):null);
  const clone=v=>JSON.parse(JSON.stringify(v));
  const list=v=>Array.isArray(v)?[...new Set(v.filter(x=>typeof x==='string'))]:[];
  const groups=['scenes','poses','outfits','bodies'];
  const defaults=()=>({schemaVersion:17,language:'jp',identity:'reference',look:'neutral',variation:'balanced',layout:'4',sceneIds:[],poseIds:[],expression:'auto',cameraMode:'planned',distance:'auto',angle:'auto',lighting:'auto',body:{mass:'reference',regions:[],vascularity:'reference',bust:false,customIds:[]},outfitId:'',coverageId:'',take:0,custom:{scenes:[],poses:[],outfits:[],bodies:[]}});
  const valid=(group,id,fallback)=>C[group].some(x=>x.id===id)?id:fallback;
  const strip=text=>String(text||'').replace(/^(?:\s*(?:【[^】\n]*】|\[[^\]\n]*\]))+\s*/u,'').trim();
  const textOf=(item,lang='jp')=>strip(lang==='en'?(item?.textEn||''):(item?.text||item?.textEn||''));
  const label=(item,lang='jp')=>String(lang==='en'?(item?.titleEn||item?.title||''):(item?.title||item?.titleEn||''));
  function normalize(raw){
    const d=defaults();
    const s={...d,...clone(raw||{}),schemaVersion:17};
    s.language=['jp','en'].includes(s.language)?s.language:'jp';
    for(const [key,group] of [['identity','identities'],['look','looks'],['variation','variations'],['expression','expressions'],['cameraMode','cameraModes'],['distance','distances'],['angle','angles'],['lighting','lighting']])s[key]=valid(group,s[key],d[key]);
    s.layout=['1','2','3','4','5'].includes(String(s.layout))?String(s.layout):'4';
    s.sceneIds=list(list(s.sceneIds).map(x=>x==='hotel'?'soft-interior':x));
    s.poseIds=list(s.poseIds);
    s.outfitId=typeof s.outfitId==='string'?s.outfitId:'';
    s.coverageId=valid('coverages',s.coverageId,'');
    s.take=Number.isSafeInteger(s.take)&&s.take>=0?s.take%1000000:0;
    s.body={...d.body,...(s.body&&typeof s.body==='object'?s.body:{})};
    s.body.mass=valid('masses',s.body.mass,'reference');
    s.body.vascularity=valid('vascularity',s.body.vascularity,'reference');
    s.body.regions=list(s.body.regions).filter(id=>C.regions.some(r=>r.id===id));
    s.body.customIds=list(s.body.customIds);s.body.bust=!!s.body.bust;
    s.custom={...d.custom,...(s.custom&&typeof s.custom==='object'?s.custom:{})};
    for(const g of groups){
      const seen=new Set();
      s.custom[g]=(Array.isArray(s.custom[g])?s.custom[g]:[]).filter(x=>x&&typeof x==='object'&&typeof x.id==='string'&&x.id&&!seen.has(x.id)&&seen.add(x.id)).map(x=>({...x,custom:true}));
    }
    return s;
  }
  function migrate(raw){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Invalid saved data');
    if(Number(raw.schemaVersion)>17)throw new Error('Newer saved data');
    if(raw.schemaVersion===17)return {state:normalize(raw),migrated:false};
    if(!['selectedMaster','selectedScenes','masters','scenes','poses'].some(k=>k in raw))throw new Error('Unrecognized saved data');
    const s=defaults();
    s.language=raw.selectedLanguage;s.look=raw.selectedMaster;s.variation=raw.selectedVariation;
    s.layout=raw.selectedLayout||'4';s.sceneIds=list(raw.selectedScenes).map(id=>id==='hotel'?'soft-interior':id);
    if(s.sceneIds.includes('sunset')){s.lighting='sunset';s.sceneIds=s.sceneIds.filter(id=>id!=='sunset');}
    const poses=list(raw.selectedPoses);
    s.expression=poses.includes('partner-pov')?'partner-pov':poses.includes('candid-close')?'candid-close':'auto';
    s.poseIds=poses.filter(id=>!['partner-pov','candid-close'].includes(id));
    const body=list(raw.selectedBodies);
    s.body.mass=body.includes('hypertrophy-direct')?'hypertrophy-direct':body.includes('hypertrophy')?'hypertrophy':'reference';
    s.body.vascularity=body.includes('vascularity-extreme')?'vascularity-extreme':body.includes('vascularity-athlete')?'vascularity-athlete':'reference';
    s.body.regions=body.filter(id=>C.regions.some(x=>x.id===id));s.body.bust=body.includes('full-bust');
    const oldIds={scenes:[...C.scenes.map(x=>x.id),'hotel','sunset'],poses:[...C.poses.map(x=>x.id),'partner-pov','candid-close'],outfits:C.outfits.map(x=>x.id),bodies:[...C.bodies,...C.masses,...C.regions,...C.vascularity].map(x=>x.id)};
    for(const g of groups)s.custom[g]=(Array.isArray(raw[g])?raw[g]:[]).filter(x=>x&&typeof x.id==='string'&&!oldIds[g].includes(x.id)).map(x=>({...clone(x),custom:true}));
    s.body.customIds=body.filter(id=>!oldIds.bodies.includes(id));
    s.outfitId=raw.selectedOutfit||'';s.coverageId=raw.selectedCoverage||'';
    return {state:normalize(s),migrated:true};
  }
  function items(s,group){return [...(C[group]||[]),...(s.custom[group]||[])];}
  const find=(s,g,id)=>items(s,g).find(x=>x.id===id);
  function compile(input){
    const s=normalize(input),en=s.language==='en',t=(jp,english)=>en?english:jp,warnings=[],parts=[],usedCustom=new Set();
    const warn=(jp,english)=>warnings.push(t(jp,english));
    function usable(item){
      if(!item)return false;
      const text=textOf(item,s.language);
      if(!text){warn(`${label(item,s.language)}：${en?'EN':'JP'}本文がないため出力しません。`,`${label(item,'en')}: no English text; omitted.`);return false;}
      if(en&&/[\u3040-\u30ff\u3400-\u9fff]/u.test(text)){warn('EN本文に日本語を含むため出力しません。',`${label(item,'en')}: Japanese characters in English text; omitted.`);return false;}
      if(item.custom)usedCustom.add(item.id);
      return true;
    }
    const chosen=(group,ids)=>ids.map(id=>{const item=find(s,group,id);if(!item)warn('見つからない選択項目があります。保存データは保持しています。','A selected preset is unavailable; its saved ID is retained.');return item;}).filter(usable);
    const scenes=chosen('scenes',s.sceneIds),poses=chosen('poses',s.poseIds),customBody=chosen('bodies',s.body.customIds);
    const outfit=s.outfitId?chosen('outfits',[s.outfitId])[0]:null;
    const coverage=find(s,'coverages',s.coverageId),n=Number(s.layout),locked=s.variation==='keep',cameraPlanned=s.cameraMode==='planned',cameraFree=s.cameraMode==='free-distinct';
    if(scenes.length>n||poses.length>n)warn('写真数を超える候補があります。「別カット」で採用する候補を切り替えられます。','More choices than photographs. Use “New take” to rotate the chosen candidates.');
    parts.push(s.identity==='lookalike'?t('成人女性のプロフェッショナルなフィットネスモデルを撮影した高品質な写真集。各写真の被写体は、参照画像によく似た別の成人女性1人。顔立ちは参照画像に近い目鼻立ち、輪郭、全体の印象を持たせつつ、同一人物の完全再現ではない自然な個人差を加える。髪型、骨格、身長感、筋肉質な体型の特徴を受け継ぎ、手足、関節、人体の比率は現実的に保つ。','A high-end photobook featuring one adult professional female fitness model who closely resembles the reference while remaining a distinct adult woman. Give her similar facial proportions, contours and overall impression, with natural individual differences rather than an exact identity match. Carry over the hairstyle, skeletal proportions, perceived height and muscular physique, keeping hands, limbs, joints and anatomical proportions realistic.'):locked?t('成人女性のプロフェッショナルなフィットネスモデルを撮影した高品質な写真集。各写真の被写体は参照画像と同じ女性1人。髪型、骨格、身長感を維持し、手足、関節、人体の比率を現実的に保つ。','A high-end photobook featuring an adult professional female fitness model. Each photograph features one subject: the same woman as the reference. Preserve her hairstyle, skeleton and perceived height, with realistic hands, limbs, joints and anatomical proportions.'):t('成人女性のプロフェッショナルなフィットネスモデルを撮影した高品質な写真集。各写真の被写体は参照画像と同じ女性1人。顔立ち、髪型、骨格、身長感を維持し、手足、関節、人体の比率を現実的に保つ。','A high-end photobook featuring an adult professional female fitness model. Each photograph features one subject: the same woman as the reference. Preserve her facial features, hairstyle, skeleton and perceived height, with realistic hands, limbs, joints and anatomical proportions.'));
    parts.push(textOf(find(s,'looks',s.look),s.language)+' '+(locked?t('髪と布の細部、肌のきめ、白い肌のハイライトの質感、影の奥行きを丁寧に描写する。明るく均一で透明感のある参照画像の色白トーンを全カットで維持し、日焼け・ブロンズ化・オレンジ化を避ける。人工的なテカリ、極端なHDR、過剰なシャープネス、均一な美肌加工は使わない。','Render fine hair and fabric detail, natural skin texture, detailed fair-skin highlights and deep shadows. Maintain the reference bright, even, translucent fair complexion across every photograph, avoiding tanning, bronzing or orange shifts. Avoid artificial gloss, extreme HDR, excessive sharpening and uniform skin smoothing.'):t('瞳に的確にピントを合わせ、髪と布の細部、肌のきめ、白い肌のハイライトの質感、影の奥行きを丁寧に描写する。明るく均一で透明感のある参照画像の色白トーンを全カットで維持し、日焼け・ブロンズ化・オレンジ化を避ける。人工的なテカリ、極端なHDR、過剰なシャープネス、均一な美肌加工は使わない。','Focus precisely on visible eyes; render fine hair and fabric detail, natural skin texture, detailed fair-skin highlights and deep shadows. Maintain the reference bright, even, translucent fair complexion across every photograph, avoiding tanning, bronzing or orange shifts. Avoid artificial gloss, extreme HDR, excessive sharpening and uniform skin smoothing.')));
    const body=[];
    if(s.body.mass!=='reference')body.push(textOf(find(s,'masses',s.body.mass),s.language));
    if(s.body.regions.length){
      body.push(t(s.body.mass==='reference'?'次の部位を重点的に発達させる：':'全身の筋量増加に加え、次の部位をさらに重点的に発達させる：',s.body.mass==='reference'?'Develop the following regions with emphasis on ':'In addition to overall growth, further develop the following regions with emphasis on ')+s.body.regions.map(id=>textOf(find(s,'regions',id),s.language)).join(t('、','; '))+t('。','.'));
      if(s.body.mass==='reference'&&!customBody.length)body.push(t('指定部位以外の筋量は参照画像のまま保つ。','Retain reference muscular mass outside these regions.'));
    }else if(s.body.mass==='reference'&&!customBody.length)body.push(t('参照画像の筋肉量とセパレーション、全身のバランスを維持し、身体的特徴を不必要に弱めない。','Maintain reference muscular mass, separation and overall balance without unnecessarily diminishing physical characteristics.'));
    if(s.body.vascularity!=='reference')body.push(textOf(find(s,'vascularity',s.body.vascularity),s.language));
    else if(!customBody.length)body.push(t('腹部・大腿部を含め、参照画像の自然な血管の見え方を維持する。','Preserve reference natural vascularity, including the abdomen and thighs.'));
    if(s.body.regions.includes('hypertrophy-pecs')){
      body.push(t('大胸筋の筋組織を発達させ、胸郭と骨格の大きさは維持する。','Develop the muscle tissue of the pectoralis major while preserving rib-cage and skeletal dimensions.'));
      if(!s.body.bust&&!customBody.length)body.push(t('乳房組織自体のボリュームは参照画像のまま保つ。','Retain the reference volume of the breast tissue itself.'));
    }
    if(s.body.bust)body.push(textOf(C.bodies[0],s.language));
    body.push(...customBody.map(x=>textOf(x,s.language)));
    if(s.body.vascularity!=='reference'||s.body.mass!=='reference'||s.body.regions.length)body.push(cameraPlanned?t('身体の調整を理由に衣装のカバー範囲や撮影距離を変えない。','Physical adjustments must not change clothing coverage or camera distance.'):t('身体の調整を理由に衣装のカバー範囲を変えない。','Physical adjustments must not change clothing coverage.'));
    parts.push(body.join(' '));
    if(s.body.mass!=='reference'||s.body.regions.length||s.body.vascularity!=='reference')parts.push(t('身体の差分で明示された筋量、部位、vascularityだけを変更する。肌の明度、色相、アンダートーン、ホワイトバランス、カラーグレーディングは参照画像と同じ状態に固定し、すべての写真で一貫させる。競技コンディショニングを理由に日焼け、ブロンズ化、オレンジ寄りの色かぶりを加えない。','Change only the explicitly selected muscle mass, regions and vascularity. Lock complexion brightness, hue, undertone, white balance and color grading to the reference across every photograph. Athletic conditioning must not introduce tanning, bronzing or an orange color cast.'));
    const framingLocked=cameraPlanned&&(s.distance==='reference'||(s.distance==='auto'&&locked));
    let layout=t(`写真は正確に${n}枚。`,`Use exactly ${n} photograph${n===1?'':'s'}. `);
    if(n===1)layout+=framingLocked?t('参照写真内の向きとフレーミングを維持し、誌面の余白で配置を整える。','Preserve the reference orientation and framing within the photograph; use page space to arrange it.'):t('縦位置または縦長寄りの人物写真を主役にし、人物を大きく見せる。横の余りは背景の自然な延長や余白に使い、極端な横長の引き構図にしない。','Prioritize a portrait-oriented or vertically dominant photograph with the model prominent. Use extra horizontal space for background continuation or negative space, not an extreme landscape establishing shot.');
    else layout+=t(`1枚目を大きな主役、残り${n-1}枚を補助写真として人物を見やすく配置する。写真同士の間に白い余白、背景色の帯、ガターを入れず、隣接する写真枠を互いに接してキャンバスを埋める。写真間の境界は画像が直接切り替わるだけとし、境界線や枠線も入れない。写真群の周囲にも大きな空白を残さない。余白が必要な場合は、写真枠の外ではなく写真内のネガティブスペースとして設ける。`,`Make photograph 1 the large main image and the remaining ${n-1} supporting images, keeping the subject clearly visible. Do not place white gaps, background-colored bands or gutters between photographs; make adjacent image frames touch and fill the canvas. Let one image transition directly into the next at each boundary, with no divider or frame line. Do not leave large empty bands around the image group. If negative space is needed, create it within the photographs rather than outside their frames.`);
    layout+=' '+t('出版前のフラットなデジタル誌面、1枚の連続した横長キャンバスとして仕上げる。中央の綴じ目、ノド、折り目、中央の影、紙の湾曲や厚み、冊子の立体感は描かない。中央で背景を物理的に分断しない。文字は最小限。','Finish as a flat pre-publication digital layout on one continuous wide canvas. No binding, gutter, fold, center shadow, paper curvature, thickness or physical booklet. Do not physically split the background at the center. Keep typography minimal.');
    parts.push(layout);
    if(locked)parts.push(cameraPlanned?t('以下で具体的に変更する要素以外は、参照画像の姿勢、身体の向き、写真内の構図、撮影位置、距離、画角、背景、光の方向を固定する。写真枠の配置だけでは撮影条件を変えない。','Lock the reference posture, body orientation, composition within photographs, camera position, distance, field of view, background and light direction, except for the specific changes stated below. Page arrangement alone does not change the photographic setup.'):t('以下で具体的に変更する要素以外は、参照画像の姿勢、身体の向き、背景を固定する。','Lock the reference posture, body orientation and background except for the specific changes stated below.'));
    else parts.push(s.variation==='balanced'?t('同じ撮影セッションの近い別テイクとしてまとめる。指定のない姿勢や背景には小さな変化だけを加える。','Keep the photographs as closely related takes from one session, with only small changes to unspecified posture and background.'):(cameraPlanned?t('同じ女性としての一貫性を保ち、指定のない撮影条件には明確な変化をつける。場所の指定がなければ、参照画像と自然につながる撮影場所の別の一角を使う。','Keep the same woman consistent while making distinct changes to unspecified photographic conditions. Without a specified location, use another part of a setting that naturally connects to the reference.'):t('同じ女性としての一貫性を保ち、指定のない姿勢や背景には明確な変化をつける。場所の指定がなければ、参照画像と自然につながる撮影場所の別の一角を使う。','Keep the same woman consistent while making distinct changes to unspecified posture and background. Without a specified location, use another part of a setting that naturally connects to the reference.')));
    if(cameraFree)parts.push(t('撮影距離、画角、カメラの高さ・角度、光の方向と質は具体的に指定せず、生成側が各カットに適した条件を決める。ただし、各写真は参照画像および同じ誌面内の他の写真と必ず明確に異なる構図にし、同じトリミング、人物サイズ、カメラ位置を繰り返さない。この撮影条件の指定は、参照維持を求める変化量より優先する。','Do not prescribe camera distance, field of view, camera height or angle, or the direction and quality of light; let the generator choose suitable conditions for each photograph. However, every photograph must use a composition clearly distinct from both the reference and the other photographs in the layout. Do not repeat the same crop, subject scale or camera position. This camera-condition instruction overrides a variation setting that otherwise preserves the reference.'));
    if(!locked&&s.expression==='partner-pov')parts.push(textOf(find(s,'expressions',s.expression),s.language)+' '+(cameraPlanned?t('変更対象は視線と表情のみ。姿勢、撮影距離、衣装はこの指定を理由に変更しない。','Apply this adjustment only to gaze and expression. It must not change posture, camera distance or clothing.'):t('変更対象は視線と表情のみ。姿勢と衣装はこの指定を理由に変更しない。','Apply this adjustment only to gaze and expression. It must not change posture or clothing.')));
    else if(!locked&&s.expression==='candid-close')parts.push(textOf(find(s,'expressions',s.expression),s.language)+' '+(cameraPlanned?t('感情は視線、微笑み、間合いで伝える。姿勢、撮影距離、衣装をそれだけの理由で変更しない。','Convey emotion through gaze, smiles and timing without using it to change posture, camera distance or clothing.'):t('感情は視線、微笑み、間合いで伝える。姿勢と衣装をそれだけの理由で変更しない。','Convey emotion through gaze, smiles and timing without using it to change posture or clothing.')));
    if(outfit)parts.push(textOf(outfit,s.language)+(coverage?'':t(' 全カットで統一した衣装を使う。',' Use a consistent outfit across photographs.')));
    else if(!coverage)parts.push(t('参照画像の衣装を維持する。','Retain the reference clothing.'));
    if(coverage)parts.push((outfit?t('選んだ衣装の色と素材を活かし、','Retain the chosen outfit’s colors and materials; '):t('参照衣装の色と素材を活かし、','Retain the reference outfit’s colors and materials; '))+textOf(coverage,s.language)+' '+t('カバー範囲はこの指定を優先し、衣装の別の指示や筋肉表現を理由に布面積を減らさない。','This coverage requirement takes priority; do not reduce fabric to satisfy other styling or muscle-definition instructions.'));
    const distanceAuto=['medium','close','full','medium','full'];
    const angleAuto=['eye','three-quarter','low','high','three-quarter'];
    const expressions={
      'partner-pov':[
        ['レンズへ短く視線を合わせ、口元に小さな微笑みを残す。','Briefly meet the lens with a small smile around the mouth.'],
        ['笑い終わりの口元の動きが残り、目元はわずかに緩む。','Capture the end of a laugh, with residual movement around the mouth and slightly relaxed eyes.'],
        ['視線は静止し、目元はわずかに緩んでいる。','A steady gaze with slightly relaxed eyes.'],
        ['一度外した視線をレンズへ戻す瞬間。口元にごく小さな微笑みを残す。','Capture the instant the gaze returns to the lens after looking away, with a very small smile around the mouth.']],
      'candid-close':[
        ['短い会話に応える自然な微笑み。','A natural smile in response to a brief exchange.'],
        ['言葉を聞いてふっと笑う瞬間。','The instant of a spontaneous laugh in response to a remark.'],
        ['視線を少し外した、落ち着いた表情。','A relaxed expression with a slight glance away.']]
    };
    const lightText={
      session:['参照画像の時間帯と光源に合う光。入射角と陰影に変化をつけ、新しいカットとして仕上げる。','Keep the reference time of day and type of light source, varying light direction and shading for a distinctly new photograph.'],
      day:['自然な日光と穏やかなサイドライト。','Natural daylight with gentle side light.'],
      window:['窓や障子からの拡散光と室内の自然な反射光。','Diffused window or shoji light with natural interior bounce.'],
      water:['日光と水面からの反射光。肌のハイライトを白飛びさせない。','Daylight and reflected light from the water; retain skin highlight detail.'],
      night:['街の環境光を活かし、顔は自然な肌色に整える。','Use ambient city light while balancing facial skin color naturally.'],
      hall:['屋内の環境光を柔らかく整え、自然な陰影を作る。','Shape the indoor ambient light softly for natural shading.']
    };
    const shots=[];
    for(let i=0;i<n;i++){
      const k=i+s.take,scene=scenes.length?scenes[k%scenes.length]:null;
      const pose=poses.length?poses[(i+Math.floor(s.take/Math.max(scenes.length,1)))%poses.length]:null;
      const shot=[];
      if(scene)shot.push(textOf(scene,s.language));
      else shot.push(locked?t('参照画像と同じ環境。','The same setting as the reference.'):t('参照画像と同じ撮影セッションにつながる環境。','A setting continuous with the reference session.'));
      if(pose){
        if(locked&&!pose.custom&&pose.id==='low-recline-side-turn')shot.push(t('横たわった低い姿勢から、片方の前腕で上体をわずかに起こす。骨盤と脚の支持を保ち、胸郭だけをカメラ側へ軽く回旋する。','From a low reclining posture, raise the upper torso slightly on one forearm. Keep the pelvis and legs supported and gently rotate only the rib cage toward the camera.'));
        else if(locked&&!pose.custom&&pose.id==='back-turn-look-over-shoulder')shot.push(t('身体を背面から斜め後ろ向きにし、首と肩を無理に回旋させない。','Turn the body away or into a rear three-quarter orientation without forcing rotation through the neck or shoulders.'));
        else shot.push(textOf(pose,s.language));
      }
      else if(locked)shot.push(t('参照画像と同じ姿勢と身体の向き。','The same posture and body orientation as the reference.'));
      else if(s.variation==='balanced')shot.push(t('参照の姿勢を基調に、重心や手の位置だけをわずかに変えた別テイク。','A related take based on the reference posture, with slight changes in weight or hand position.'));
      else shot.push(textOf(C.poses[k%3],s.language));
      let distance='',angle='',light='';
      if(cameraPlanned){
        distance=s.distance==='auto'?(locked?'reference':s.variation==='balanced'?'relative':distanceAuto[k%5]):s.distance;
        angle=s.angle==='auto'?(locked?'reference':s.variation==='balanced'?'relative':angleAuto[k%5]):s.angle;
        if(distance==='relative')shot.push(t(...[
          ['参照に近い撮影距離と画角。','A camera distance and field of view close to the reference.'],
          ['参照より少し近い距離。人物が大きく見える範囲に収める。','A little closer than the reference, keeping the subject prominent.'],
          ['参照よりわずかに距離をとり、人物を大きく保ったまま周囲を少し含める。','A little farther from the reference distance, including slightly more surroundings while keeping the subject prominent.']
        ][k%3]));
        else shot.push(textOf(find(s,'distances',distance),s.language));
        if(angle==='relative')shot.push(k%2?t('参照の撮影位置から少し横へ移動した視点。','A viewpoint slightly to one side of the reference camera position.'):t('参照に近いカメラの高さと角度。','A camera height and angle close to the reference.'));
        else shot.push(textOf(find(s,'angles',angle),s.language));
        light=s.lighting;
        if(light==='auto')light=scene?(scene.light||'reference'):(s.variation==='dynamic'?'session':'reference');
        if(light==='sunset'&&scene?.fixedTime){light='night';warn('夜景では夕方の光を使わず、夜の環境光を優先します。','Night scenes use ambient night light instead of evening daylight.');}
        shot.push(light==='night'&&locked?t('街の環境光を活かし、露出と色調は参照画像に合わせる。','Use ambient city light while retaining the reference exposure and color balance.'):light==='sunset'&&locked?t('夕方の低い斜光。','Low evening light.'):(lightText[light]?t(...lightText[light]):textOf(find(s,'lighting',light),s.language)));
      }
      if(!locked){
        if(s.expression==='reference')shot.push(textOf(find(s,'expressions','reference'),s.language));
        else if(expressions[s.expression])shot.push(t(...expressions[s.expression][k%expressions[s.expression].length]));
        else shot.push(k%2?t('視線を少し外した、落ち着いた表情。','A relaxed expression with a slight glance away.'):t('自然な微笑みを浮かべ、レンズへ視線を向ける。','A natural small smile with a gaze toward the lens.'));
      }
      const heading=t(`${i+1}枚目${i===0?'（メイン）':''}：`,`Photograph ${i+1}${i===0?' (main)':''}: `);
      shots.push({index:i+1,sceneId:scene?.id||'',poseId:pose?.id||'',distance,angle,light,text:heading+shot.join(' ')});
    }
    if(outfit&&scenes.some(x=>x.setting==='water')&&scenes.some(x=>x.setting!=='water')){
      // A single shared wardrobe avoids simultaneous incompatible styles across environments.
      parts.push(t('異なる場所でも自然につながる共通の衣装を選ぶ。','Choose one shared outfit that works naturally across the different settings.'));
    }
    parts.push(shots.map(x=>x.text).join('\n\n'));
    if(usedCustom.size)warn('追加プリセットの自由文はそのまま使います。独自の指示同士の競合はプレビューで確認してください。','Custom text is used as written. Review the preview for conflicts between custom instructions.');
    return {text:parts.filter(Boolean).join('\n\n'),shots,warnings:[...new Set(warnings)],state:s};
  }
  const api={defaults,normalize,migrate,compile,items,find,textOf,label,strip,clone,groups};
  root.PPEngine=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
