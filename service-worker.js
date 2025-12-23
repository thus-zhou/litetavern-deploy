const CACHE_NAME = 'rpg-app-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './themes.css',
  './script.js',
  './manifest.json',
  './assets/paper.png',
  './assets/msg.mp3',
  './assets/forest.mp3',
  './assets/rain.mp3'
];

// Install Event: Cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
});

// Fetch Event: Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Ignore API calls (they should always go to network)
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // Ignore external API calls (OpenAI)
  if (event.request.url.includes('api.openai.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response;
      }
      // Otherwise fetch from network
      return fetch(event.request);
    })
  );
});
