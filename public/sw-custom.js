// Service Worker customizado com estratégias avançadas de cache
// MetaFin - v1.0.2

const CACHE_VERSION = 'v1.0.2';
const STATIC_CACHE = `metafin-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `metafin-dynamic-${CACHE_VERSION}`;
const API_CACHE = `metafin-api-${CACHE_VERSION}`;

// Recursos que devem ser cacheados imediatamente
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.svg',
];

// Instalar e cachear recursos estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Limpar caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) =>
                        (key.startsWith('metafin-') || key.startsWith('static-') || key.startsWith('dynamic-')) &&
                        key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== API_CACHE
                    )
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Estratégia de fetch
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorar requisições não-GET
    if (request.method !== 'GET') return;

    // Ignorar chrome-extension e outros protocolos
    if (!url.protocol.startsWith('http')) return;

    // API do Supabase - Network First com fallback
    if (url.hostname.includes('supabase.co')) {
        event.respondWith(networkFirstWithCache(request, API_CACHE, 5000));
        return;
    }

    // Fontes do Google - Cache First
    if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
        event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE));
        return;
    }

    // Assets estáticos (JS, CSS, imagens) - Stale While Revalidate
    if (request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'image') {
        event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
        return;
    }

    // Navegação - Network First
    if (request.mode === 'navigate') {
        event.respondWith(networkFirstWithCache(request, STATIC_CACHE, 3000));
        return;
    }

    // Default - Network com fallback para cache
    event.respondWith(networkFirstWithCache(request, DYNAMIC_CACHE, 5000));
});

// Estratégia: Network First com timeout
async function networkFirstWithCache(request, cacheName, timeout = 5000) {
    const cache = await caches.open(cacheName);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const networkResponse = await fetch(request, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Fallback para página offline se for navegação
        if (request.mode === 'navigate') {
            return cache.match('/') || new Response('Offline', { status: 503 });
        }

        throw error;
    }
}

// Estratégia: Cache First com fallback para network
async function cacheFirstWithNetwork(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
    }
    return networkResponse;
}

// Estratégia: Stale While Revalidate
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => cachedResponse);

    return cachedResponse || fetchPromise;
}

// Listener para mensagens (limpar cache, etc)
self.addEventListener('message', (event) => {
    if (event.data === 'CLEAR_CACHE') {
        caches.keys().then((keys) => {
            keys.forEach((key) => caches.delete(key));
        });
    }

    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
