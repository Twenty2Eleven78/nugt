//Cache Name
const CACHE_NAME = "nugt-cache-v1";
//Files to cache
const cacheFiles = [
  './',
  './index.html',
  './css/all.min.css',
  './css/bootstrap.min.css',
  './css/style.css',
  './js/bootstrap.bundle.min.js',
  './js/roster.js',
  './js/script.js',
  './nugt512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(cacheFiles))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});