// スマホの裏側で動く係。電波がなくても開けるように、アプリのファイルを保存しておく。
const CACHE = "naritai-v3";
const FILES = [
  "./", "./index.html", "./owner.html", "./style.css", "./config.js", "./logic.js", "./mascot.js", "./ui.js", "./app.js", "./owner.js",
  "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// 通信できるときは最新を取り、できないときは保存しておいた分を返す。サーバー（/api）は保存しない。
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.includes("/api/")) return;
  e.respondWith(fetch(e.request, { cache: "no-cache" })
    .then((res) => {
      if (res.ok && res.type === "basic") {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    })
    .catch(() => caches.match(e.request)));
});
