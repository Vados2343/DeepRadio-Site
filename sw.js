const CACHE_NAME = 'deepradio-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// ИСПРАВЛЕНИЕ: Список доменов, которые не нужно кешировать
const EXTERNAL_DOMAINS = [
  'dfm.ru',
  'radiorecord.ru',
  '101.ru',
  'tavrmedia.ua',
  'zaycev.fm',
  'pcradio.ru'
];

// ИСПРАВЛЕНИЕ: Проверка, является ли URL внешним API
function isExternalAPI(url) {
  try {
    const urlObj = new URL(url);
    return EXTERNAL_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Cache failed', error);
      })
  );

  // Принудительная активация нового SW
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Берем контроль над всеми клиентами
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const requestURL = event.request.url;

  // ИСПРАВЛЕНИЕ: Игнорируем внешние API запросы
  if (isExternalAPI(requestURL)) {
    console.log('Service Worker: Skipping external API:', requestURL);
    return; // Пропускаем без обработки
  }

  // ИСПРАВЛЕНИЕ: Игнорируем запросы к нашему API прокси
  if (requestURL.includes('/api/') || requestURL.includes('/proxy/')) {
    console.log('Service Worker: Skipping API request:', requestURL);
    return; // Пропускаем без обработки
  }

  // ИСПРАВЛЕНИЕ: Обрабатываем только статические ресурсы
  if (event.request.method === 'GET' &&
      (requestURL.includes(self.location.origin) || requestURL.startsWith('/'))) {

    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Возвращаем из кеша если есть
          if (response) {
            console.log('Service Worker: Serving from cache:', requestURL);
            return response;
          }

          // ИСПРАВЛЕНИЕ: Клонируем запрос для безопасности
          const fetchRequest = event.request.clone();

          return fetch(fetchRequest)
            .then(response => {
              // ИСПРАВЛЕНИЕ: Проверяем валидность ответа
              if (!response || response.status !== 200 || response.type !== 'basic') {
                console.log('Service Worker: Invalid response, not caching:', requestURL);
                return response;
              }

              // ИСПРАВЛЕНИЕ: Кешируем только определенные типы файлов
              const url = new URL(requestURL);
              const isStaticAsset = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(url.pathname);
              const isHTMLPage = url.pathname === '/' || url.pathname.endsWith('.html');

              if (isStaticAsset || isHTMLPage) {
                const responseToCache = response.clone();

                caches.open(CACHE_NAME)
                  .then(cache => {
                    console.log('Service Worker: Caching new resource:', requestURL);
                    cache.put(event.request, responseToCache);
                  })
                  .catch(error => {
                    console.error('Service Worker: Caching failed:', error);
                  });
              }

              return response;
            })
            .catch(error => {
              console.error('Service Worker: Fetch failed:', error);

              // ИСПРАВЛЕНИЕ: Возвращаем fallback для HTML страниц
              if (event.request.destination === 'document') {
                return caches.match('/index.html');
              }

              throw error;
            });
        })
        .catch(error => {
          console.error('Service Worker: Cache match failed:', error);
          // Fallback к сетевому запросу
          return fetch(event.request);
        })
    );
  }
});

// ИСПРАВЛЕНИЕ: Обработка ошибок
self.addEventListener('error', event => {
  console.error('Service Worker: Global error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker: Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// ИСПРАВЛЕНИЕ: Сообщения от клиентов
self.addEventListener('message', event => {
  console.log('Service Worker: Received message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('Service Worker: Cache cleared');
      event.ports[0].postMessage({ success: true });
    });
  }
});

console.log('Service Worker: Script loaded successfully');