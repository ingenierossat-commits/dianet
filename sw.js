// ════════════════════════════════════════════
// DIANET — Service Worker
// Sistema de control campo de tiro
// ════════════════════════════════════════════

const CACHE_NAME = 'dianet-v1.0';

// Archivos a cachear para funcionamiento offline
const ASSETS = [
  '/dianet/',
  '/dianet/index.html',
  '/dianet/manifest.json',
  'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Bebas+Neue&display=swap'
];

// ── INSTALL: cachear assets al instalar ──
self.addEventListener('install', event => {
  console.log('[DIANET SW] Instalando v1.0...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[DIANET SW] Cacheando assets...');
      return cache.addAll(ASSETS).catch(err => {
        console.warn('[DIANET SW] Error cacheando algunos assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE: limpiar caches antiguas ──
self.addEventListener('activate', event => {
  console.log('[DIANET SW] Activando...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[DIANET SW] Eliminando cache antigua:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// ── FETCH: estrategia Cache First, red como fallback ──
self.addEventListener('fetch', event => {
  // BLE no pasa por fetch, ignorar peticiones no HTTP
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Devolver cache y actualizar en background
        fetch(event.request).then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, response.clone());
            });
          }
        }).catch(() => {});
        return cached;
      }

      // No está en cache, ir a red
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        // Cachear la respuesta nueva
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => {
        // Sin red y sin cache: devolver página offline si es navegación
        if (event.request.mode === 'navigate') {
          return caches.match('/dianet/index.html');
        }
      });
    })
  );
});

// ── MENSAJE: forzar actualización desde la app ──
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
