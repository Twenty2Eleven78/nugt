//Cache Name
const CACHE_NAME = "nugt-cache-v7";
//Files to cache - Modular Architecture
const cacheFiles = [
  './',
  './index.html',
  './css/all.min.css',
  './css/bootstrap.min.css',
  './css/style.css',
  './js/bootstrap.bundle.min.js',
  './js/main.js',
  // Core modules
  './js/modules/app.js',
  './js/modules/shared/constants.js',
  './js/modules/shared/utils.js',
  './js/modules/shared/dom.js',
  // Data modules
  './js/modules/data/state.js',
  './js/modules/data/storage.js',
  './js/modules/data/default-roster.js',
  // Game modules
  './js/modules/game/timer.js',
  // Match modules
  './js/modules/match/goals.js',
  './js/modules/match/events.js',
  './js/modules/match/teams.js',
  './js/modules/match/roster.js',
  // UI modules
  './js/modules/ui/modals.js',
  './js/modules/ui/components.js',
  // Services
  './js/modules/services/notifications.js',
  './js/modules/services/sharing.js',
  // Assets
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