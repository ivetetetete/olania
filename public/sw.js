const CACHE_NAME = 'olania-pwa-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/pets/olaf-happy.png',
  '/pets/olaf-grumpy.png',
  '/pets/lana-sassy.png',
  '/pets/lana-fierce.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
