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
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Se a resposta for inválida, apenas retorna
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseToCache = response.clone();

                // Somente cacheia requisições GET e HTTP/HTTPS
                if (event.request.method === 'GET' && event.request.url.startsWith('http')) {
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                }

                // Sempre retorna a resposta original
                return response;
            })
            .catch(() => {
                // Se o fetch falhar, retorna o cache ou a página offline
                return caches.match(event.request)
                    .then(cachedResponse => cachedResponse || caches.match(OFFLINE_URL));
            })
    );
});