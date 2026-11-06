// smart-hire PWA Service Worker
const CACHE_NAME = 'smart-hire-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // For navigation requests (loading an HTML page)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline.html');
      })
    );
    return;
  }

  // Ignore Vite dev assets and local dev URLs
  if (
    request.url.includes('/@') ||
    request.url.includes('/src/') ||
    request.url.includes('/node_modules/') ||
    request.url.includes('localhost') ||
    request.url.includes('127.0.0.1')
  ) {
    return;
  }

  // For static or assets
  if (request.method === 'GET' && !request.url.includes('/api/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }).catch(() => {
          return new Response('', { status: 408, statusText: 'Request timed out' });
        });
      })
    );
  }
});

