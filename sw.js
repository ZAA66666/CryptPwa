/* Service Worker：离线可用 + 可“添加到主屏幕” */
/* 策略：网络优先（始终拿最新文件），网络不可用时回退缓存（离线可用）。
   这样每次改完代码，刷新即可看到新版，不会被旧缓存卡住。 */

const CACHE_NAME = "crypto-pwa-v78";
// 需要预缓存的「应用外壳」文件（保证断网也能首屏打开）
const ASSETS = [
  "./",
  "index.html",
  "css/style.css",
  "js/core/app.js",
  "js/core/settings.js",
  "js/utils/i18n.js",
  "js/pages/hash.js",
  "js/pages/enc.js",
  "js/pages/sym.js",
  "js/pages/asym.js",
  "js/pages/qr.js",
  "js/pages/guide.js",
  "js/pages/incoming.js",
  "js/pages/json.js",
  "js/pages/cron.js",
  "js/pages/rand.js",
  "js/pages/txt.js",
  "js/vendor/crypto-js.js",
  "js/vendor/qrcode-generator.js",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "manifest.webmanifest",
  "manifest-en.webmanifest"
];

// 安装：预缓存资源
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting(); // 安装完立即激活，不等旧页面关闭
});

// 激活：清理旧版本缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim(); // 立即接管已打开的页面
});

// 拦截请求：网络优先，离线回退缓存
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return; // 非 GET 不拦截
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // 拿到的响应用一份更新缓存（下次离线可用）
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match("./"))
      )
  );
});
