// Minimal offline cache for the app shell. Bump CACHE on any file change.
const CACHE = 'dwmj-v8';
const SHELL = [
  '.', 'index.html', 'styles.css',
  'src/app.js', 'src/economy.js',
  'manifest.webmanifest', 'icon-smoke.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first: always try the network (so updates land immediately), fall
// back to cache only when offline. Keeps the app installable + offline-capable
// without serving stale code during iteration.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then(hit => hit || caches.match('index.html')))
  );
});
