/* Simple mode: explicit edits, exact-text favorites and isolated storage. */
(function(root){
  'use strict';
  const KEY='promptPaletteSimpleV1',FORMAT='prompt-palette-simple-favorites';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const defaults=()=>({version:1,selections:{language:'jp',muscle:false,vascularity:false,bust:false},draft:'',draftLanguage:'jp',draftName:'',activeId:null,favorites:[]});
  function compile(s){
    const t=(jp,en)=>s.language==='en'?en:jp;
    const p=[t('参照画像の成人女性を被写体にした、非性的なフィットネス写真を1枚制作する。','Create one non-sexual fitness photograph of the adult woman in the reference image.')];
    if(s.muscle)p.push(t('全身の筋量を増やし、肩・腕・背中・腹部・脚の筋肉の厚みと立体感を強調する。','Increase overall muscular mass, emphasizing muscle thickness and three-dimensional form in the shoulders, arms, back, abdomen and legs.'));
    if(s.vascularity)p.push(t('運動後のアスリートに見られる表在血管を、解剖学的な走行に沿って明瞭に描写する。','Clearly depict the superficial veins seen in an athlete after exercise, following anatomical pathways.'));
    if(s.bust){
      p.push(t('バストは参照画像の印象を保ちながら、より豊かでボリュームのある自然な形状に調整する。','Adjust the bust to a naturally fuller, more voluminous shape while retaining the impression of the reference image.'));
      p.push(s.muscle?t('選択した筋量と骨格のバランスに合わせ、重力に沿った自然な立体感を表現する。','Balance it with the selected muscular mass and skeletal proportions, expressing natural three-dimensional form consistent with gravity.'):t('身体全体の筋肉量や骨格とのバランスを維持し、重力に沿った自然な立体感を表現する。','Retain the overall muscular mass and balance with the skeletal proportions, expressing natural three-dimensional form consistent with gravity.'));
    }
    p.push(t('衣装のデザイン、素材、着用状態、姿勢、構図、背景、肌色は参照画像に合わせる。現実的な人体構造と自然な肌の質感を保つ。文字は入れない。','Retain the reference clothing design, material and state of wear, posture, composition, background and skin color. Preserve realistic anatomy and natural skin texture. No text.'));
    return p.join('\n\n');
  }
  const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
  const language=x=>x==='jp'||x==='en';
  function favorite(x){
    if(!object(x)||typeof x.id!=='string'||!x.id||typeof x.name!=='string'||!x.name.trim()||typeof x.text!=='string'||!x.text.trim()||!language(x.language)||!['createdAt','updatedAt'].every(k=>typeof x[k]==='string'&&Number.isFinite(Date.parse(x[k]))))throw Error('お気に入りの形式が不正です。');
    return {id:x.id,name:x.name,text:x.text,language:x.language,createdAt:x.createdAt,updatedAt:x.updatedAt};
  }
  function favorites(rows){
    if(!Array.isArray(rows))throw Error('お気に入り一覧の形式が不正です。');
    const ids=new Set();return rows.map(row=>{const f=favorite(row);if(ids.has(f.id))throw Error('保存IDが重複しています。');ids.add(f.id);return f;});
  }
  function validate(x){
    if(!object(x)||x.version!==1||!object(x.selections)||!language(x.selections.language)||!['muscle','vascularity','bust'].every(k=>typeof x.selections[k]==='boolean')||typeof x.draft!=='string'||!language(x.draftLanguage)||typeof x.draftName!=='string'||!(x.activeId===null||typeof x.activeId==='string'))throw Error('保存データを読み取れません。元データの上書きを停止しました。');
    const s=defaults();s.selections=clone(x.selections);s.draft=x.draft;s.draftLanguage=x.draftLanguage;s.draftName=x.draftName;s.favorites=favorites(x.favorites);s.activeId=s.favorites.some(f=>f.id===x.activeId)?x.activeId:null;return s;
  }
  function exportFavorites(state){return JSON.stringify({format:FORMAT,version:1,favorites:state.favorites},null,2);}
  function mergeFavorites(state,text){
    const data=JSON.parse(text);
    if(!object(data)||data.format!==FORMAT||data.version!==1)throw Error('シンプル版のお気に入りJSONを選んでください。');
    const incoming=favorites(data.favorites),next=clone(state),ids=new Set(next.favorites.map(f=>f.id));let added=0,skipped=0;
    for(const f of incoming){if(ids.has(f.id)){skipped++;continue;}next.favorites.push(f);ids.add(f.id);added++;}
    return {state:next,added,skipped};
  }
  class Store{
    constructor(storage){
      this.storage=storage;this.raw=null;this.state=defaults();this.blocked=false;this.error='';
      try{this.raw=storage.getItem(KEY);if(this.raw!==null)this.state=validate(JSON.parse(this.raw));}
      catch(e){this.blocked=true;this.error=e.message;}
    }
    save(next){
      if(this.blocked)throw Error(this.error||'保存を停止しています。');
      const checked=validate(next);
      if(this.storage.getItem(KEY)!==this.raw){this.blocked=true;this.error='別のタブで保存内容が変わりました。編集中の全文をコピーしてから再読み込みしてください。';throw Error(this.error);}
      const raw=JSON.stringify(checked);this.storage.setItem(KEY,raw);this.raw=raw;this.state=checked;return clone(checked);
    }
  }
  const api={KEY,FORMAT,defaults,compile,clone,validate,exportFavorites,mergeFavorites,Store};
  root.PPSimple=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
