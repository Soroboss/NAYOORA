self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Simple pass-through for now, can be enhanced for offline support
  e.respondWith(fetch(e.request).catch(() => new Response("Offline", { status: 503 })));
});
