const CACHE = 'eungyo-v13';
const FILES = [
  '/eungyo-salon/',
  '/eungyo-salon/index.html',
  '/eungyo-salon/terra.html',
  '/eungyo-salon/questions_taeyang.json',
  '/eungyo-salon/questions_gil.json',
  '/eungyo-salon/questions_bada.json',
  '/eungyo-salon/questions_terra.json',
  '/eungyo-salon/questions_bam.json',
  '/eungyo-salon/questions_namu.json',
  '/eungyo-salon/intro_logo.mp4',
  '/eungyo-salon/organ01_game_opening.mp3',
  '/eungyo-salon/match_up.mp3',
  '/eungyo-salon/drone_socrates.mp4',
  '/eungyo-salon/matchup_title.png',
  '/eungyo-salon/stadium_socrates.jpg',
  '/eungyo-salon/stadium_proust.jpg',
  '/eungyo-salon/stadium_soro.jpg',
  '/eungyo-salon/stadium_pascal.jpg',
  '/eungyo-salon/emblem_socrates.jpg',
  '/eungyo-salon/emblem_proust.jpg',
  '/eungyo-salon/emblem_soro.jpg',
  '/eungyo-salon/emblem_pascal.jpg'
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
