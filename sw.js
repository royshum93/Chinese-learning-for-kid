
const CACHE_NAME = 'canton-flashcards-v2';
const PRE_CACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 安裝時僅快取核心靜態檔案
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活時清理舊版本的快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 動態快取策略：先嘗試從快取獲取，若無則從網路獲取並存入快取
self.addEventListener('fetch', (event) => {
  // 僅快取 GET 請求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // 檢查是否為有效的響應
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // 將抓取到的新檔案（如編譯後的 JS）放入快取
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
