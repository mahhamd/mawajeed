// غيّر رقم النسخة هنا مع كل تحديث (لازم يطابق APP_VERSION في index.html)
const VERSION = '2.0.2';
const CACHE = 'mawajeed-' + VERSION;
const FB_CACHE = 'mawajeed-fb-13.2.0';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
const FB = ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'].map(f => 'https://www.gstatic.com/firebasejs/13.2.0/' + f);

self.addEventListener('install', e => {
  e.waitUntil(Promise.all([
    caches.open(CACHE).then(c => c.addAll(FILES)),
    caches.open(FB_CACHE).then(c => Promise.all(FB.map(u => c.match(u).then(h => h || fetch(u, { mode: 'cors' }).then(r => r.ok && c.put(u, r)).catch(() => {})))))
  ]));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FB_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  // مكتبات Firebase: من الجهاز عشان البرنامج يفتح بدون نت
  if (u.origin === 'https://www.gstatic.com' && u.pathname.startsWith('/firebasejs/')) {
    e.respondWith(caches.open(FB_CACHE).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }))));
    return;
  }
  if (u.origin !== location.origin) return; // اتصالات السيرفر ما نلمسها
  if (u.pathname.endsWith('/sw.js')) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit ||
      fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => req.mode === 'navigate' ? caches.match('./index.html') : undefined)
    )
  );
});
