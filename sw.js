/* 321禱告服事 Service Worker —— 自動更新版
   ‧ 每次發佈 V 都不同 → 瀏覽器偵測到 sw.js 位元組改變就安裝新 SW
   ‧ install：skipWaiting；預載用 cache:'reload' 繞過 HTTP 快取（GitHub Pages 會快取 10 分鐘）
   ‧ activate：刪舊快取、clients.claim，並通知所有頁面；背景中的舊頁面直接重新導向成新版
     （連「沒有更新程式碼的舊版頁面」也能被帶到新版）
   ‧ fetch：HTML／JS／JSON 網路優先（no-cache），離線才用快取；圖片快取優先；影音不攔截（Range 請求） */
var V = 'pr321-1.0.202610070802';
var VER = '1.0.202610070802';
var SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './hero-s.jpg', './c-zh.json', './c-zs.json', './c-en.json', './hero.jpg', './icon-32.png', './lang-zs.json', './lang-en.json', './media.js'];
self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(function (c) {
    return Promise.all(SHELL.map(function (u) { return fetch(new Request(u, { cache: 'reload' })).then(function (r) { if (r && r.ok) return c.put(u, r); })['catch'](function () { }); }));
  }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches['delete'](k); }));
  }).then(function () { return self.clients.claim(); }).then(function () {
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  }).then(function (cs) {
    cs.forEach(function (c) {
      try { c.postMessage({ t: 'sw-updated', v: VER }); } catch (x) { }
      if (c.visibilityState === 'hidden' && c.navigate) { try { c.navigate(c.url); } catch (x) { } }
    });
  }));
});
self.addEventListener('message', function (e) { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u = new URL(r.url); if (u.origin !== self.location.origin) return;
  var p = u.pathname;
  if (/\.(mp3|m4a|aac|wav|ogg|opus|mp4|mov|webm)$/i.test(p) || r.headers.get('range')) return;
  if (/version\.json$/.test(p)) { e.respondWith(fetch(p + '?t=' + Date.now(), { cache: 'no-store' })['catch'](function () { return new Response('{}', { headers: { 'Content-Type': 'application/json' } }); })); return; }
  var nav = r.mode === 'navigate' || /\.html$/.test(p) || /\/$/.test(p);
  var key = nav ? './index.html' : (/\.(json|js)$/.test(p) ? u.origin + p : r);
  if (nav || /\.(json|js|css)$/.test(p)) {
    e.respondWith(fetch(nav ? u.origin + p + u.search : r.url, { cache: 'no-cache', credentials: 'same-origin' }).then(function (resp) {
      if (resp && resp.ok) { var cp = resp.clone(); caches.open(V).then(function (c) { c.put(key, cp); }); }
      return resp;
    })['catch'](function () { return caches.match(key).then(function (h) { return h || caches.match(r, { ignoreSearch: true }).then(function (h2) { return h2 || caches.match('./index.html'); }); }); }));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(function (h) {
    return h || fetch(r).then(function (resp) { if (resp && resp.ok) { var cp = resp.clone(); caches.open(V).then(function (c) { c.put(r, cp); }); } return resp; });
  }));
});
