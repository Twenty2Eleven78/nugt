//Cache Name
const CACHE_NAME = "nugt-cache-v2";
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
  './webfonts/fa-regular-400.woff2',
  './webfonts/fa-solid-900.woff2',
  './webfonts/fa-brands-400.woff2',
  './nugt512.png',
  './favicon.ico',
  './manifest.json'
];

self.addEventListener('install', function(event) {
  // Perform install steps
      event.waitUntil(
          caches.open(CACHE_NAME)
          .then(function(cache) {
              console.log('Opened cache');
          return cache.addAll(cacheFiles);
          })
      );
  });

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
  var cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});