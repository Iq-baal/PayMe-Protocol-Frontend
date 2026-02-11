// Simple Service Worker for PWA
self.addEventListener('fetch', function(event) {
  // Network-first strategy: always try to fetch from network
  event.respondWith(fetch(event.request));
});