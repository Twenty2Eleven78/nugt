//Cache Name
const CACHE_NAME = "nugt-cache-v1";
//Files to cache
const cacheFiles = [
  '/',
  '/index.html',
  '/css/all.min.css',
  '/css/bootstrap.min.css',
  '/css/style.css',
  '/js/bootstrap.bundle.min.js',
  '/js/roster.js',
  '/js/script.js',
  '/nugt512.png',
];

self.addEventListener('install', function(event) {
  // Perform install steps
      event.waitUntil(
          caches.open(CACHE_NAME)
          .then(function(cache) {
              console.log('Opened cache');
          return cache.addAll(urlsToCache);
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
  var cacheWhitelist = ['pigment'];
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