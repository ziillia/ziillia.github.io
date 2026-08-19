const CACHE_NAME='drive-dj-finder-v1.5.3-deploy-crop';
const DICTIONARY_URL='./musicbrainz-ocr-dictionary.js';
const APP_SHELL=['./','./drive-dj-finder.html','./manifest.webmanifest','./pwa-icon-180.png','./pwa-icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||url.pathname.startsWith('/api/')){event.respondWith(fetch(event.request));return;}
  const isDictionary=url.pathname.endsWith('/musicbrainz-ocr-dictionary.js');
  const fallback=()=>caches.match(event.request).then(cached=>cached||(isDictionary?caches.match(DICTIONARY_URL):caches.match('./drive-dj-finder.html')));
  event.respondWith(fetch(event.request).then(response=>{
    if(!response.ok)return fallback().then(cached=>cached||response);
    const copy=response.clone();
    caches.open(CACHE_NAME).then(cache=>cache.put(isDictionary?DICTIONARY_URL:event.request,copy));
    return response;
  }).catch(fallback));
});
