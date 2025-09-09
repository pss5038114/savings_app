// 캐시 버전을 바꾸면 즉시 새 리소스를 받음
const CACHE_NAME = 'savings-app-v1.1r1-3';

// 설치 시 프리캐시(필요한 정적 리소스를 여기에 추가)
const ASSETS = [
  '/savings_app/',
  '/savings_app/index.html',
  '/savings_app/manifest.webmanifest',
  '/savings_app/icons/icon-192.png',
  '/savings_app/icons/icon-512.png'
];

// install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// activate - 이전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// fetch - 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', (event) => {
  // 동일 오리진만 처리(타 오리진은 브라우저 기본 동작)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((resp) => {
        // 동적으로 캐시에 넣고 반환
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, respClone));
        return resp;
      }).catch(() => {
        // 오프라인 폴백이 필요하면 여기서 처리
        if (event.request.mode === 'navigate') {
          return caches.match('/savings_app/index.html');
        }
      });
    })
  );
});
