const CACHE_NAME='drive-dj-finder-v1.9.1-access-safe';
const APP_SHELL=['./pwa-icon.svg','./pwa-icon-180.png','./pwa-icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const requestUrl=new URL(event.request.url);
  if(requestUrl.origin!==self.location.origin)return;
  // Cloudflare Accessの認証リダイレクトをService Worker内へ閉じ込めない。
  // HTML遷移とAPIは常にネットワークへ渡し、ブラウザ自身にログイン遷移させる。
  if(event.request.mode==='navigate'||requestUrl.pathname.startsWith('/api/')){event.respondWith(fetch(event.request));return;}
  event.respondWith(fetch(event.request).then(response=>{
    // ログイン画面への転送・エラー・別originの最終応答は絶対にキャッシュしない。
    if(!response.ok||response.redirected||new URL(response.url).origin!==self.location.origin)return response;
    const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
    return response;
  }).catch(()=>caches.match(event.request)));
});
