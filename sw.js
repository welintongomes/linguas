const CACHE_NAME = 'jogo-educativo-v1.4';
const BASE_PATH = '/lingua'; // Altere para o nome do seu repositório

const urlsToCache = [
  BASE_PATH + '/',
  BASE_PATH + '/index.html',
  // Não precisa de mais nada pois é uma página única
];

// Instalar o Service Worker
self.addEventListener('install', function(event) {
  console.log('Service Worker: Installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Ativar o Service Worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activating');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', function(event) {
  // Só interceptar requisições GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Se está no cache, retorna do cache
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }

        // Se não está no cache, busca da rede
        return fetch(event.request).then(function(response) {
          // Verifica se a resposta é válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clona a resposta para colocar no cache
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(function() {
          // Se a rede falhar, retorna a página principal do cache
          return caches.match(BASE_PATH + '/');
        });
      })
  );
});