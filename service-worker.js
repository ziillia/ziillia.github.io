// Deployment cleanup worker: do not intercept requests.
// The app is intentionally network-only so Cloudflare redirects and new builds
// are never hidden behind an old iPhone/PWA cache.
self.addEventListener('install',event=>{
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('drive-dj-finder-')).map(key=>caches.delete(key)));
    await self.clients.claim();
    await self.registration.unregister();
  })());
});
