const CACHE_NAME='drive-dj-finder-v1.5.6-mb-loader-fix';
const DICTIONARY_URL='./musicbrainz-ocr-dictionary.js';
const APP_SHELL=['./','./drive-dj-finder.html','./manifest.webmanifest','./pwa-icon-180.png','./pwa-icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys(),current=await caches.open(CACHE_NAME);
    if(!(await current.match(DICTIONARY_URL))){
      for(const key of keys){
        if(key===CACHE_NAME)continue;
        const old=await caches.open(key),cached=await old.match(DICTIONARY_URL);
        if(cached){await current.put(DICTIONARY_URL,cached.clone());break;}
      }
    }
    await Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||url.pathname.startsWith('/api/')){event.respondWith(fetch(event.request));return;}
  const isDictionary=url.pathname.endsWith('/musicbrainz-ocr-dictionary.js');
  const fallback=()=>caches.match(isDictionary?DICTIONARY_URL:event.request).then(cached=>cached||(isDictionary?null:caches.match('./drive-dj-finder.html')));
  event.respondWith(fetch(event.request).then(response=>{
    if(!response.ok)return fallback().then(cached=>cached||response);
    const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(isDictionary?DICTIONARY_URL:event.request,copy));return response;
  }).catch(async()=>{const cached=await fallback();if(cached)return cached;throw new Error('network and cache unavailable');}));
});
