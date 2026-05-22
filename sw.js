// Service Worker — Správce úkolů v3
const CACHE = 'tm-shell-v3';
const SHELL = ['./index.html', './manifest.json'];

// Instalace — uloží app shell do cache
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Aktivace — smaže staré cache
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch — cache-first pro app shell, network-first pro ostatní
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Cross-origin (Apps Script, OpenAI) — nechej prohlížeč řešit
  if (!url.startsWith(self.location.origin)) return;

  // App shell — cache first, pak síť
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached); // offline → vrať cache
      return cached || networkFetch;
    })
  );
});
