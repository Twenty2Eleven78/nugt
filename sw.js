//Cache Name
const CACHE_NAME = "nugt-cache-v329";
//Files to cache - Modular Architecture
const cacheFiles = [
  './',
  './index.html',
  './css/all.min.css',
  './css/custom-framework.css',
  './js/main.js',
  // Core modules
  './js/modules/app.js',
  './js/modules/shared/constants.js',
  './js/modules/shared/utils.js',
  './js/modules/shared/dom.js',
  './js/modules/shared/error-boundary.js',
  './js/modules/shared/storage-manager.js',
  './js/modules/shared/custom-modal.js',
  './js/modules/shared/modal-factory.js',
  // Data modules
  './js/modules/data/state.js',
  './js/modules/data/storage.js',
  './js/modules/data/default-roster.js',
  // Game modules
  './js/modules/match/timer.js',
  // Match modules
  './js/modules/match/goals.js',
  './js/modules/match/combined-events.js',
  './js/modules/match/momentum.js',
  './js/modules/match/teams.js',
  './js/modules/match/roster.js',
  // UI modules
  './js/modules/ui/modals.js',
  './js/modules/ui/components.js',
  './js/modules/ui/auth-ui.js',
  './js/modules/ui/new-match-modal.js',
  './js/modules/ui/match-save-modal.js',
  './js/modules/ui/match-load-modal.js',
  './js/modules/ui/match-summary-modal.js',
  './js/modules/ui/admin-modal.js',
  './js/modules/ui/sharing-modal.js',
  './js/modules/ui/reset-modal.js',
  './js/modules/ui/release-notes.js',
  './js/modules/ui/roster-modal.js',
  './js/modules/ui/statistics-tab.js',
  './js/modules/ui/season-charts.js',
  './js/modules/ui/league-table-modal.js',
  // Services
  './js/modules/services/notifications.js',
  './js/modules/services/sharing.js',
  './js/modules/services/pwa-updater.js',
  './js/modules/services/attendance.js',
  './js/modules/services/auth.js',
  './js/modules/services/user-matches-api.js',
  './js/modules/services/fa-fulltime.js',
  // Assets
  './webfonts/fa-regular-400.woff2',
  './webfonts/fa-solid-900.woff2',
  './webfonts/fa-brands-400.woff2',
  './nugt512.png',
  './favicon.ico',
  './manifest.json'
];

self.addEventListener('install', function (event) {
  console.log('Service Worker installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();

  // Perform install steps with individual file caching
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        console.log('Opened cache:', CACHE_NAME);
        // Cache files individually to avoid single failure breaking everything
        return Promise.allSettled(
          cacheFiles.map(file =>
            cache.add(file).catch(error => {
              console.warn(`Failed to cache ${file}:`, error);
              return null;
            })
          )
        );
      })
      .then((results) => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`Cached ${successful}/${cacheFiles.length} files successfully`);
      })
      .catch(error => {
        console.error('Failed to open cache:', error);
      })
  );
});



self.addEventListener('activate', function (event) {
  console.log('Service Worker activating...');

  // Take control of all clients immediately
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (cacheName) {
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
self.addEventListener('message', function (event) {
  try {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      console.log('Received SKIP_WAITING message');
      self.skipWaiting();

      // Send acknowledgment back to prevent runtime.lastError
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
    } else if (event.data && event.data.type === 'CLEAR_API_CACHE') {
      console.log('Received CLEAR_API_CACHE message');

      // Clear all caches that might contain API responses
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            return caches.open(cacheName).then(cache => {
              return cache.keys().then(requests => {
                return Promise.all(
                  requests.map(request => {
                    // Clear any API-related requests
                    if (request.url.includes('/api/') ||
                      request.url.includes('user-matches') ||
                      request.url.includes('match') ||
                      request.url.includes('statistics') ||
                      request.url.includes('.netlify/functions/')) {
                      return cache.delete(request);
                    }
                  })
                );
              });
            });
          })
        );
      }).then(() => {
        console.log('API cache cleared successfully');
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true, type: 'CACHE_CLEARED' });
        }
      }).catch(error => {
        console.error('Failed to clear API cache:', error);
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: false, error: error.message });
        }
      });
    }
  } catch (error) {
    console.error('Service worker message handling error:', error);

    // Still try to send error response to prevent runtime.lastError
    if (event.ports && event.ports[0]) {
      try {
        event.ports[0].postMessage({ success: false, error: error.message });
      } catch (portError) {
        console.error('Failed to send error response:', portError);
      }
    }
  }
});

// Helper function to check if request can be cached
function isRequestCacheable(request) {
  // Only cache HTTP/HTTPS requests
  if (!request.url.startsWith('http')) {
    return false;
  }

  // Don't cache extension requests
  if (request.url.startsWith('chrome-extension://') ||
    request.url.startsWith('moz-extension://') ||
    request.url.startsWith('safari-extension://')) {
    return false;
  }

  // Don't cache requests with non-GET methods
  if (request.method !== 'GET') {
    return false;
  }

  return true;
}

// Enhanced fetch handler with update-first strategy for HTML
self.addEventListener('fetch', function (event) {
  // Skip non-cacheable requests
  if (!isRequestCacheable(event.request)) {
    return;
  }

  // For HTML requests, try network first to get updates
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If network succeeds, update cache and return response
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone).catch(error => {
                console.warn('Failed to cache document request:', error);
              });
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
        .then(function (response) {
          if (response) {
            return response;
          }
          return fetch(event.request).then(fetchResponse => {
            // Cache successful responses
            if (fetchResponse.ok) {
              const responseClone = fetchResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone).catch(error => {
                  console.warn('Failed to cache resource request:', error);
                });
              });
            }
            return fetchResponse;
          });
        })
    );
  }
});