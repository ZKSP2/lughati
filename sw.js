const CACHE = 'lughati-v2';
const FILES = [
  './',
  './index.html',
  './t1.html',
  './manifest.webmanifest',
  './icon.svg',
  './lughati-bundle.js',
  './lughati-images.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function blank(req) {
  const d = req.destination;
  const type = d === 'script' ? 'application/javascript'
             : d === 'style' ? 'text/css'
             : 'text/plain';
  return new Response('', { status: 200, headers: { 'Content-Type': type } });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.ok && new URL(req.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => {
        if (req.mode === 'navigate') {
          return caches.match('./t1.html', { ignoreSearch: true }).then(r => r || blank(req));
        }
        return blank(req);
      });
    })
  );
});
