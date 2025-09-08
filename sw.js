// sw.js
const CACHE = 'app-cache-v24'; // ← 배포 시 숫자 올리기
const APP_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './sw.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 설치: 핵심 자원 캐싱 (대기 상태에서 머무름)
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_ASSETS)));
});

// 활성화: 예전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 라우팅
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 같은 오리진만 캐싱
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // HTML(탐색)은 네트워크 우선 → 실패 시 캐시된 index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 그 외 정적 파일은 캐시 우선
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }))
  );
});

// 페이지에서 오는 '업데이트 즉시 적용' 메시지
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});











