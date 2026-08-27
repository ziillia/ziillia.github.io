const initialData = window.initialData;

const STORE_KEY = "promptPaletteV2";
const LEGACY_STORE_KEY = "promptPaletteV1";
let state;
let editContext = null;

function clone(x){ return JSON.parse(JSON.stringify(x)); }
function load(){
  try{
    const saved = localStorage.getItem(STORE_KEY);
    const legacy = localStorage.getItem(LEGACY_STORE_KEY);
    state = saved ? JSON.parse(saved) : (legacy ? JSON.parse(legacy) : clone(initialData));

    if(!Array.isArray(state.masters)) state.masters = clone(initialData.masters);
    if(!Array.isArray(state.scenes)) state.scenes = clone(initialData.scenes);
    if(!Array.isArray(state.poses)) state.poses = clone(initialData.poses);
    if(!Array.isArray(state.outfits)) state.outfits = clone(initialData.outfits);
    if(!state.selectedOutfit) state.selectedOutfit = initialData.selectedOutfit;

    initialData.poses.forEach(item=>{
      if(!state.poses.some(x=>x.id===item.id)) state.poses.push(clone(item));
    });
    initialData.outfits.forEach(item=>{
      if(!state.outfits.some(x=>x.id===item.id)) state.outfits.push(clone(item));
    });

    ["attack","safe"].forEach(id=>{
      const fresh=initialData.masters.find(x=>x.id===id);
      const current=state.masters.find(x=>x.id===id);
      if(fresh && current) current.text=fresh.text;
    });
    initialData.scenes.forEach(fresh=>{
      const current=state.scenes.find(x=>x.id===fresh.id);
      if(current) current.text=fresh.text;
    });
    save();
  }catch(e){ state = clone(initialData); }
}
function save(){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }catch(e){}
}
function esc(s=""){
  return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
}
function excerpt(s){ return s.replace(/\s+/g," ").trim().slice(0,150); }

function renderMasters(){
  const root=document.getElementById("masterGrid");
  root.innerHTML="";
  state.masters.forEach(item=>{
    const b=document.createElement("button");
    b.className="master-choice"+(state.selectedMaster===item.id?" active":"");
    b.innerHTML=`${esc(item.title)}<small>${esc(item.short||"")}</small>`;
    b.addEventListener("click",()=>{
      state.selectedMaster=item.id; save(); render();
    });
    b.addEventListener("contextmenu",(e)=>{e.preventDefault();openEdit("masters",item.id,false)});
    let pressTimer;
    b.addEventListener("touchstart",()=>{pressTimer=setTimeout(()=>openEdit("masters",item.id,false),650)},{passive:true});
    b.addEventListener("touchend",()=>clearTimeout(pressTimer));
    b.addEventListener("touchmove",()=>clearTimeout(pressTimer));
    root.appendChild(b);
  });
}

function cardHTML(item,selected){
  return `
    <div class="card-top">
      <div class="select-dot">✓</div>
      <div class="card-title">${esc(item.title)}</div>
      <div class="card-actions">
        <button class="icon-btn copy-one">コピー</button>
        <button class="icon-btn edit-one">編集</button>
      </div>
    </div>
    <div class="preview">${esc(excerpt(item.text))}</div>`;
}

function renderCards(kind){
  const config={
    scenes:{root:"sceneCards", multi:true, key:"selectedScenes"},
    poses:{root:"poseCards", multi:true, key:"selectedPoses"},
    outfits:{root:"outfitCards", multi:false, key:"selectedOutfit"}
  }[kind];
  const root=document.getElementById(config.root);
  const items=state[kind];
  root.innerHTML="";
  if(!items.length){root.innerHTML='<div class="empty">まだプリセットがありません</div>';return}
  items.forEach(item=>{
    const selected=config.multi ? state[config.key].includes(item.id) : state[config.key]===item.id;
    const card=document.createElement("div");
    card.className="card"+(selected?" selected":"");
    card.innerHTML=cardHTML(item,selected);
    card.querySelector(".card-top").addEventListener("click",(e)=>{
      if(e.target.closest("button")) return;
      toggle(kind,item.id);
    });
    card.querySelector(".copy-one").addEventListener("click",()=>copyText(item.text));
    card.querySelector(".edit-one").addEventListener("click",()=>openEdit(kind,item.id,false));
    root.appendChild(card);
  });
}

function toggle(kind,id){
  if(kind==="outfits"){
    state.selectedOutfit=id;
  }else{
    const key=kind==="scenes"?"selectedScenes":"selectedPoses";
    const arr=state[key];
    state[key]=arr.includes(id)?arr.filter(x=>x!==id):[...arr,id];
  }
  save();render();
}

function compose(){
  const m=state.masters.find(x=>x.id===state.selectedMaster)||state.masters[0];
  const scenes=state.scenes.filter(x=>state.selectedScenes.includes(x.id));
  const poses=state.poses.filter(x=>state.selectedPoses.includes(x.id));
  const outfit=state.outfits.find(x=>x.id===state.selectedOutfit)||state.outfits[0];
  return [m?.text,...scenes.map(x=>x.text),...poses.map(x=>x.text),outfit?.text].filter(Boolean).join("\n\n");
}
function updateStatus(){
  const m=state.masters.find(x=>x.id===state.selectedMaster);
  const outfit=state.outfits.find(x=>x.id===state.selectedOutfit);
  const count=state.selectedScenes.length+state.selectedPoses.length;
  document.getElementById("selectionTitle").textContent=`${m?.title||"MASTER"} + ${outfit?.title||"OUTFIT"}`;
  document.getElementById("selectionSub").textContent=count?`SCENE / POSE 差分 ${count}件を選択中`:"SCENE / POSE 差分なし";
}
function render(){renderMasters();renderCards("scenes");renderCards("poses");renderCards("outfits");updateStatus()}

async function copyText(text){
  let ok=false;
  try{
    if(navigator.clipboard && window.isSecureContext){
      await navigator.clipboard.writeText(text); ok=true;
    }
  }catch(e){}
  if(!ok){
    const t=document.createElement("textarea");
    t.value=text;t.style.position="fixed";t.style.opacity="0";document.body.appendChild(t);
    t.focus();t.select();
    try{ok=document.execCommand("copy")}catch(e){}
    t.remove();
  }
  toast(ok?"コピーしました":"コピーできませんでした");
}
function toast(msg){
  const el=document.getElementById("toast");
  el.textContent=msg;el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer=setTimeout(()=>el.classList.remove("show"),1500);
}

function openEdit(kind,id,isNew){
  editContext={kind,id,isNew};
  let item;
  if(isNew){
    item={title:"",text:""};
  }else{
    item=state[kind].find(x=>x.id===id);
  }
  document.getElementById("modalHeading").textContent=isNew?"新規プリセット":"プリセット編集";
  document.getElementById("editTitle").value=item?.title||"";
  document.getElementById("editText").value=item?.text||"";
  document.getElementById("deleteItem").style.display=(!isNew && kind!=="masters")?"block":"none";
  document.getElementById("editModal").classList.add("open");
  setTimeout(()=>document.getElementById("editTitle").focus(),120);
}
function closeEdit(){document.getElementById("editModal").classList.remove("open");editContext=null}

document.getElementById("saveEdit").addEventListener("click",()=>{
  if(!editContext)return;
  const title=document.getElementById("editTitle").value.trim();
  const text=document.getElementById("editText").value.trim();
  if(!title||!text){toast("タイトルと本文を入力");return}
  const {kind,id,isNew}=editContext;
  if(isNew){
    const newId="custom-"+Date.now();
    state[kind].push({id:newId,title,text});
  }else{
    const item=state[kind].find(x=>x.id===id);
    if(item){item.title=title;item.text=text}
  }
  save();closeEdit();render();toast("保存しました");
});
document.getElementById("deleteItem").addEventListener("click",()=>{
  if(!editContext||editContext.isNew)return;
  const {kind,id}=editContext;
  state[kind]=state[kind].filter(x=>x.id!==id);
  if(kind==="scenes")state.selectedScenes=state.selectedScenes.filter(x=>x!==id);
  if(kind==="poses")state.selectedPoses=state.selectedPoses.filter(x=>x!==id);
  if(kind==="outfits" && state.selectedOutfit===id){
    state.selectedOutfit=state.outfits[0]?.id||"";
  }
  save();closeEdit();render();toast("削除しました");
});
document.getElementById("cancelEdit").addEventListener("click",closeEdit);
document.getElementById("editModal").addEventListener("click",e=>{if(e.target.id==="editModal")closeEdit()});

document.getElementById("addSceneBtn").addEventListener("click",()=>openEdit("scenes",null,true));
document.getElementById("addPoseBtn").addEventListener("click",()=>openEdit("poses",null,true));
document.getElementById("addOutfitBtn").addEventListener("click",()=>openEdit("outfits",null,true));
document.getElementById("copyCombined").addEventListener("click",()=>copyText(compose()));

function openPreview(){
  document.getElementById("combinedPreview").value=compose();
  document.getElementById("previewModal").classList.add("open");
}
document.getElementById("previewBtn").addEventListener("click",openPreview);
document.getElementById("closePreview").addEventListener("click",()=>document.getElementById("previewModal").classList.remove("open"));
document.getElementById("copyPreview").addEventListener("click",()=>copyText(document.getElementById("combinedPreview").value));
document.getElementById("previewModal").addEventListener("click",e=>{if(e.target.id==="previewModal")e.currentTarget.classList.remove("open")});

document.getElementById("resetBtn").addEventListener("click",()=>{
  if(confirm("編集内容・追加プリセット・選択状態をすべて初期化しますか？")){
    state=clone(initialData);save();render();toast("初期化しました");
  }
});

load();
render();