const CACHE_NAME='drive-dj-finder-v1.7.5-trusted-multi-trace';
const APP_URL='./drive-dj-finder.html?v=1.7.5';
const MANIFEST_URL='./manifest.webmanifest?v=1.7.5';
const DICTIONARY_URL='./musicbrainz-ocr-dictionary.js';
const APP_SHELL=['./',APP_URL,MANIFEST_URL,'./pwa-icon-180.png','./pwa-icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('drive-dj-finder-')&&key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
  const isDictionary=url.pathname.endsWith('/musicbrainz-ocr-dictionary.js');
  const isDocument=event.request.mode==='navigate'||url.pathname.endsWith('/drive-dj-finder')||url.pathname.endsWith('/drive-dj-finder.html');
  const cacheKey=isDictionary?DICTIONARY_URL:(isDocument?APP_URL:event.request);
  const fallback=()=>caches.match(cacheKey).then(cached=>cached||(isDocument?caches.match(APP_URL):null));
  event.respondWith(fetch(event.request,{cache:isDocument||isDictionary?'no-store':'default'}).then(response=>{
    if(!response.ok)return fallback().then(cached=>cached||response);
    const copy=response.clone();
    caches.open(CACHE_NAME).then(cache=>cache.put(cacheKey,copy));
    return response;
  }).catch(async()=>{
    const cached=await fallback();
    if(cached)return cached;
    throw new Error('network and cache unavailable');
  }));
});
