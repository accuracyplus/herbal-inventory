/*
 * The shell and its hashed assets are kept for a weak signal; API calls are never cached — a
 * stock figure from yesterday shown as today's would be worse than an honest "offline".
 */
const CACHE = 'hifive-inventory-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/index.html']).catch(() => {}))); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res;
    })));
    return;
  }
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then((res) => {
      const copy = res.clone(); caches.open(CACHE).then((c) => c.put('/index.html', copy)); return res;
    }).catch(() => caches.match('/index.html')));
  }
});
