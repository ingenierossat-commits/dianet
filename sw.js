// DIANET Service Worker v6.1
const CACHE_NAME = 'dianet-v6.1';

const ASSETS = [
  '/dianet/',
  '/dianet/index.html',
  '/dianet/manifest.json'
];

self.addEventListener('install', event => {
  console.log('[SW] Instalando v6.1');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network first — siempre intenta la red antes que la caché
self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith('http')) return;
  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
