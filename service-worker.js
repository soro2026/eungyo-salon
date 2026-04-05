const CACHE = 'eungyo-v3';
const FILES = [
  '/eungyo-salon/',
  '/eungyo-salon/index.html',
  '/eungyo-salon/questions_taeyang.json',
  '/eungyo-salon/questions_gil.json',
  '/eungyo-salon/intro_logo.mp4'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
