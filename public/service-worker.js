const CACHE_NAME = 'my-site-cache-v1';
const urlsToCache = [
    '/',
    '/styles/main.css',
    '/script/main.js'
];
const OFFLINE_URL = '/offline.html';

// Install
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll([...urlsToCache, OFFLINE_URL]))
    );
    self.skipWaiting();
});

// Activate
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            )
        )
    );
    self.clients.claim();
});

// Fetch
self.addEventListener('fetch', event => {
    // Só intercepta requisições GET
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Se resposta inválida, retorna ela mesmo
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseToCache = response.clone();

                caches.open(CACHE_NAME)
                    .then(cache => cache.put(event.request, responseToCache));

                return response;
            })
            .catch(() => {
                // Se falhar no fetch, retorna cache ou página offline
                return caches.match(event.request)
                    .then(cachedResponse => cachedResponse || caches.match(OFFLINE_URL));
            })
    );
});