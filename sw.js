const CACHE_NAME = 'shuying-v17'; // 每次更新 index.html 时递增

// 动态获取当前应用的基础路径（GitHub Pages 下是 '/my-app/'，本地可能是 '/'）
const basePath = self.location.pathname.replace(/\/[^/]*$/, '') || '';

const urlsToCache = [
  basePath + '/',
  basePath + '/index.html',
  basePath + '/manifest.json',
  basePath + '/icon.png'
].filter(url => !url.endsWith('undefined')); // 过滤掉异常路径

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        urlsToCache.map(url => cache.add(url).catch(err => {
          console.warn('缓存失败，忽略:', url, err);
        }))
      );
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// HTML 文件网络优先，保证内容最新；其他文件缓存优先
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// 监听页面发来的更新指令（可选，用于手动刷新）
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});