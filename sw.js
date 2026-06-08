const CACHE_NAME = 'novaolimpia-v3-tablet-multiloja'; // Mudamos para v2 para forçar a atualização!

// Arquivos essenciais para o aplicativo funcionar offline
const urlsToCache = [
  '/novaolimpia/',
  '/novaolimpia/index.html',
  '/novaolimpia/manifest.json'
];

self.addEventListener('install', event => {
  // Força o novo Service Worker a assumir o controle imediatamente
  self.skipWaiting(); 
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// NOVO: Apaga o cache antigo (v1) para liberar memória e garantir a tela nova
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Garante que a página atual já use o novo cache sem precisar fechar a aba
  self.clients.claim(); 
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna o que está no cache. Se não tiver, busca na internet.
        return response || fetch(event.request);
      })
  );
});
