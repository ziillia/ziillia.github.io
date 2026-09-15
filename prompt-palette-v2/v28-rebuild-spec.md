# Prompt Palette v28 rebuild specification

Status: prompt and behavior draft. This file is not loaded by the application and does not change the public v27 build.

## 1. Rebuild policy

- Use v14 as the baseline for expressive freedom, not as a literal code rollback.
- Retain the current clean catalog/compiler/UI structure and schema-compatible migration.
- Emit affirmative, concrete instructions for selected attributes.
- Do not add unselected restrictions on garment coverage, garment cutting, expression, pose or composition.
- COVERAGE is the only axis that increases garment coverage.
- Do not design euphemisms or filter-bypass wording. Use ordinary professional fashion, photography and fitness terminology.
- In multi-shot output, one selected outfit remains exactly the same across every photograph.

## 2. Responsibility map

| Axis | Responsibility | Must not control |
|---|---|---|
| FOUNDATION | Adult subject, photographic quality, anatomy, complexion continuity | Outfit, coverage, pose, layout, composition, camera choice |
| IDENTITY | Reference subject or look-alike subject | Physique adjustment, outfit, setting |
| LOOK | Overall editorial tone | Exposure, garment form, camera geometry |
| VARIATION | Change amount for otherwise unspecified axes | Explicit choices on other axes |
| LAYOUT | Photograph count and frame arrangement on the canvas | Composition within photographs, pose, outfit |
| COMPOSITION | Subject scale, placement, crop, negative space and visual balance within photographs | Pose, setting, outfit, exact camera angle or lighting |
| SCENE | Environment and environmental light sources | Outfit, pose, photograph count |
| POSE | Posture, action and body orientation | Camera, outfit, setting |
| EXPRESSION | Gaze and visible expression | Posture, outfit, camera distance |
| CAMERA / LIGHT | Distance, angle and lighting treatment | Pose, outfit, setting |
| BODY | Muscular mass, selected regions, vascularity and bust adjustment | Outfit and complexion |
| OUTFIT | Garment form, material, color, straps, cutting and details | Body, pose, scene, composition |
| COVERAGE | Increased garment coverage | Body, pose, scene, composition |

## 3. FOUNDATION and IDENTITY copy

### FOUNDATION common — JP

成人女性のプロフェッショナルなフィットネスモデル1人を主役にした、ハイエンドな人物写真集。鍛えられた身体の立体感、現実的な人体構造、自然な肌のきめ、髪と布の細部、ハイライトの質感、影の奥行きを丁寧に描写する。人工的なテカリ、極端なHDR、過剰なシャープネス、均一な美肌加工を加えず、人物中心の写真表現として仕上げる。

参照画像の明るく均一で透明感のある肌色を全カットで一貫させる。光による自然な陰影は残しながら、ページや身体調整に伴う日焼け、ブロンズ化、暗色化、オレンジ寄りの色調変化を加えない。この写真品質の指定だけを理由に、衣装、姿勢、構図、撮影距離、環境を変更しない。

### FOUNDATION common — EN

A high-end, person-centered photobook featuring one adult professional female fitness model. Carefully render the three-dimensional form of the trained physique, realistic anatomy, natural skin texture, fine hair and fabric detail, textured highlights and depth in the shadows. Finish it as professional portrait photography without artificial gloss, extreme HDR, excessive sharpening or uniform skin smoothing.

Keep the reference image's bright, even and translucent complexion consistent across every photograph. Retain natural shading from the light without adding tanning, bronzing, darkening or an orange shift from page progression or physique adjustments. Photographic-quality instructions alone must not change the outfit, posture, composition, camera distance or setting.

### REFERENCE identity — normal JP

各写真の被写体は参照画像と同じ成人女性1人。顔立ち、髪型、骨格、身長感、筋肉質な体型の特徴を一貫させる。

### REFERENCE identity — normal EN

Each photograph features one adult woman: the same subject as the reference. Keep her facial features, hairstyle, skeletal proportions, perceived height and characteristic muscular physique consistent.

### REFERENCE identity — KEEP JP

各写真の被写体は参照画像と同じ成人女性1人。髪型、骨格、身長感、筋肉質な体型の特徴を一貫させる。

### REFERENCE identity — KEEP EN

Each photograph features one adult woman: the same subject as the reference. Keep her hairstyle, skeletal proportions, perceived height and characteristic muscular physique consistent.

KEEP output omits facial-feature, eye-focus, gaze and expression copy. It does not add absolute face-lock wording.

## 4. OUTFIT copy

When no OUTFIT is selected, emit no outfit replacement instruction and retain the reference clothing through compiler behavior.

### MINIMAL — JP

ハイエンドなファッションエディトリアルとして成立する、軽快で大胆なミニマルスタイリング。衣装は、細いストラップ、細幅の縁取り、必要最小限の直線と曲線、コンパクトなパネル構成、身体に沿うシャープなカッティングを中心にする。軽やかな素材と少ない構成要素によって、明確で洗練されたシルエットを作る。サイドタイ、アシンメトリー、すっきりしたツーピース、またはミニマルなワンピースとしてまとめる。

### MINIMAL — EN

Lightweight, bold minimal styling suitable for a high-end fashion editorial. Build the garment around slim straps, narrow edging, a minimal arrangement of clean lines and curves, compact panel construction and sharp body-following cuts. Use lightweight materials and very few design elements to create a clear, refined silhouette. Resolve the outfit as a clean two-piece or minimal one-piece, with details such as side ties or asymmetry.

### REFINED — JP

ハイエンドなファッションエディトリアルとして成立する、上品で洗練されたスタイリング。鍛えられた身体のラインが自然に伝わるフィット感、端正なシルエット、軽やかで上質な素材、精密で控えめなディテールを組み合わせる。すっきりしたツーピース、ミニマルなワンピース、軽やかなセットアップ、または身体に沿うトップとボトムから、撮影環境に調和する一着を選ぶ。色、素材、シルエットを統一し、落ち着いた編集的な品位を持たせる。

### REFINED — EN

Polished, refined styling suitable for a high-end fashion editorial. Combine a fit that naturally presents the trained silhouette with clean proportions, lightweight premium materials and precise, restrained details. Choose one outfit suited to the setting: a clean two-piece, a minimal one-piece, a lightweight coordinated set, or fitted separates. Unify its color, material and silhouette with a composed editorial finish.

### EDITORIAL MIX — JP

撮影環境に調和する衣装を、モダンカジュアル、リゾートスタイル、ミニマルファッション、端正なセットアップから1着選ぶ。人物を主役にする明確なシルエットと、写真集全体に馴染む色・素材・ディテールを具体化する。

### EDITORIAL MIX — EN

Choose one outfit suited to the setting from modern casualwear, resort styling, minimal fashion or a clean coordinated set. Define a clear subject-centered silhouette with color, material and details that suit the photobook as a whole.

### ATHLETIC — JP

撮影環境と動作に合う、機能的で洗練されたスポーツスタイリング。身体の動きを妨げないフィット、軽量で伸縮性のある素材、端正なライン、競技やトレーニングの文脈に適したトップとボトムを1着として構成する。

### ATHLETIC — EN

Functional, refined athletic styling suited to the setting and action. Build one outfit from a movement-ready fit, lightweight stretch materials, clean lines and a top-and-bottom combination appropriate to sport or training.

### OUTFIT continuity — JP

最初に衣装を一着として確定し、すべての写真で同じ形、色、素材、ストラップ、カッティング、ディテールを維持する。SCENE、POSE、LAYOUT、COMPOSITION、BODYを理由に別の衣装へ変更しない。

### OUTFIT continuity — EN

Establish one specific outfit before composing the photographs and retain exactly the same shape, color, material, straps, cutting and details in every image. Do not change to another outfit because of SCENE, POSE, LAYOUT, COMPOSITION or BODY choices.

COVERAGE text follows OUTFIT and overrides only the garment coverage when selected.

## 5. COMPOSITION modes

### FOLLOW VARIATION

No standalone composition paragraph. The compiler lets VARIATION resolve composition behavior. This is the migration/default value for existing saved states.

### REFERENCE — JP

写真内の人物サイズ、配置、縦横の収まり、クロップ、背景との面積比、ネガティブスペースを参照画像に合わせる。誌面上の写真枠を変えても、写真内部の構図は変えない。

### REFERENCE — EN

Match the reference subject scale, placement, portrait-or-landscape fit, crop, subject-to-background ratio and negative space within each photograph. Changes to page frames must not alter the composition inside the photograph.

### COHESIVE — JP

同じ撮影セッションとして自然につながる構図差を作る。人物サイズ、画面内の配置、クロップ、背景の見せ方、ネガティブスペースを控えめに変え、同じ切り抜きの反復を避けながら統一感を保つ。姿勢、撮影角度、光はこの指定だけを理由に変更しない。

### COHESIVE — EN

Create modest compositional differences that remain connected as one photographic session. Gently vary subject scale, placement, crop, background visibility and negative space, avoiding repeated crops while retaining cohesion. This choice alone must not change posture, camera angle or light.

### DISTINCT — JP

各写真を明確に異なる構図として成立させる。人物サイズ、画面内の配置、クロップ、背景との面積比、前景と奥行き、ネガティブスペースの使い方を写真ごとに変え、同じトリミングや人物配置を繰り返さない。指定された写真数と人物数は増やさない。

### DISTINCT — EN

Make every photograph a clearly distinct composition. Vary subject scale, placement, crop, subject-to-background ratio, foreground depth and use of negative space between photographs. Do not repeat the same framing or subject placement, and do not increase the specified photograph or subject count.

### AI DISTINCT — JP

具体的な構図は指定せず、各写真に適した構図を生成側が決める。ただし、各写真は参照画像および同じ誌面内の他の写真と明確に異なる構図にし、同じトリミング、人物サイズ、人物配置を繰り返さない。

### AI DISTINCT — EN

Do not prescribe an exact composition; let the generator determine a suitable composition for each image. Every photograph must nevertheless use a composition clearly distinct from the reference and the other photographs in the layout, without repeating the same crop, subject scale or placement.

### OMIT

Emit no dedicated composition instruction. Unlike FOLLOW VARIATION, VARIATION also omits composition wording in this mode.

## 6. Precedence

1. Explicit axis selection overrides only the same axis in VARIATION or FOUNDATION.
2. COVERAGE overrides only the coverage implied by OUTFIT.
3. Explicit COMPOSITION overrides only composition behavior in VARIATION.
4. Explicit CAMERA / LIGHT overrides automatic camera or light choices.
5. KEEP remains active for every axis not explicitly changed.
6. LAYOUT never changes photographic content solely to fit its page arrangement.

## 7. Output order

FOUNDATION / IDENTITY -> LOOK -> VARIATION -> LAYOUT -> COMPOSITION -> BODY -> CAMERA MODE -> EXPRESSION -> OUTFIT -> COVERAGE -> resolved per-shot SCENE / POSE / CAMERA / LIGHT / EXPRESSION

## 8. Implementation sequence

1. Preserve the public v27 implementation and record all target SHAs.
2. Build v28 locally from the current clean architecture.
3. Add COMPOSITION state with FOLLOW VARIATION as its migration-safe default.
4. Replace FOUNDATION and OUTFIT copy with the approved text above.
5. Remove compiler clauses that add unselected garment or expression restrictions.
6. Add focused compiler tests for responsibility boundaries and JP/EN purity.
7. Review generated prompts for representative KEEP, DYNAMIC, multi-shot, BODY and COVERAGE combinations.
8. Publish only after prompt review approval.
