// BOCCHI/SLICE offline cache. Copyright 2026 Haruki Fukuda. Apache License 2.0.
// Serves the app from the device cache so it opens without a connection;
// when online it refreshes the cache in the background (the new version appears on the next launch).
const CACHE = 'bocchi-slice-v1';
const APP = './bocchi-slice.html';
const FILES = [APP, './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;   // e.g. optional Google Fonts: not cached
  const key = req.mode === 'navigate' ? APP : req;   // the app is a single page
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(key, { ignoreSearch: true });
    const net = fetch(req).then((res) => { if (res && res.ok) c.put(key, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || Response.error();
  }));
});
