//Cache Name
const CACHE_NAME = "nugt-cache-v11";
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
  './js/modules/services/pwa-updater.js',
  // Assets
  './webfonts/fa-regular-400.woff2',
  './webfonts/fa-solid-900.woff2',
  './webfonts/fa-brands-400.woff2',
  './nugt512.png',
  './favicon.ico',
  './manifest.json'
];

self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache:', CACHE_NAME);
        return cache.addAll(cacheFiles);
      })
      .then(() => {
        console.log('All files cached successfully');
      })
      .catch(error => {
        console.error('Failed to cache files:', error);
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
  console.log('Service Worker activating...');
  
  // Take control of all clients immediately
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activated and controlling all clients');
      // Notify clients about the update
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: CACHE_NAME
          });
        });
      });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Received SKIP_WAITING message');
    self.skipWaiting();
  }
});

// Enhanced fetch handler with update-first strategy for HTML
self.addEventListener('fetch', function(event) {
  // For HTML requests, try network first to get updates
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If network succeeds, update cache and return response
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, fall back to cache
          return caches.match(event.request);
        })
    );
  } else {
    // For other resources, use cache-first strategy
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          if (response) {
            return response;
          }
          return fetch(event.request).then(fetchResponse => {
            // Cache successful responses
            if (fetchResponse.ok) {
              const responseClone = fetchResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return fetchResponse;
          });
        })
    );
  }
});