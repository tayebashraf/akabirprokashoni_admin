// Akabir Prokashoni Admin PWA Service Worker
// Transparent SW to fulfill installation requirements without static caching issues.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let the browser handle standard fetching, ensuring code is always fresh
});
