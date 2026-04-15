const CACHE = 'eungyo-v21';

const CORE_FILES = [
  '/eungyo-salon/',
  '/eungyo-salon/index.html',
  '/eungyo-salon/museum.html',
  '/eungyo-salon/terra.html',
  '/eungyo-salon/heritage.html',
  '/eungyo-salon/constella.html',
];

const QUESTION_FILES = [
  '/eungyo-salon/questions_taeyang.json',
  '/eungyo-salon/questions_gil.json',
  '/eungyo-salon/questions_bada.json',
  '/eungyo-salon/questions_terra.json',
  '/eungyo-salon/questions_bam.json',
  '/eungyo-salon/questions_bul.json',
  '/eungyo-salon/questions_namu.json',
  '/eungyo-salon/questions_dol.json',
  '/eungyo-salon/questions_baram.json',
  '/eungyo-salon/questions_geoul.json',
  '/eungyo-salon/questions_mun.json',
];

const AUDIO_FILES = [
  '/eungyo-salon/organ01_game_opening.mp3',
  '/eungyo-salon/organ1.mp3',
  '/eungyo-salon/organ2.mp3',
  '/eungyo-salon/organ3.mp3',
  '/eungyo-salon/match_up.mp3',
  '/eungyo-salon/page_turn.mp3',
  '/eungyo-salon/reaction_apple.mp3',
  '/eungyo-salon/terra_nature.mp3',
];

const VIDEO_FILES = [
  '/eungyo-salon/intro_logo.mp4',
  '/eungyo-salon/drone_socrates.mp4',
  '/eungyo-salon/drone_proust.mp4',
  '/eungyo-salon/drone_pascal.mp4',
  '/eungyo-salon/drone_soro.mp4',
];

const IMAGE_FILES = [
  '/eungyo-salon/matchup_title.png',
  '/eungyo-salon/card_socrates2.png',
  '/eungyo-salon/card_proust2.png',
  '/eungyo-salon/card_pascal2.png',
  '/eungyo-salon/pitcher_set.png',
  '/eungyo-salon/pitcher_windup.png',
  '/eungyo-salon/stadium_socrates.jpg',
  '/eungyo-salon/stadium_proust.jpg',
  '/eungyo-salon/stadium_soro.jpg',
  '/eungyo-salon/stadium_pascal.jpg',
  '/eungyo-salon/emblem_socrates.jpg',
  '/eungyo-salon/emblem_proust.jpg',
  '/eungyo-salon/emblem_soro.jpg',
  '/eungyo-salon/emblem_pascal.jpg',
  '/eungyo-salon/bookself.png',
  '/eungyo-salon/terra_seedling.png',
  '/eungyo-salon/terra_sapling.png',
  '/eungyo-salon/terra_tree.png',
  '/eungyo-salon/terra_golden_tree.png',
  '/eungyo-salon/terra_golden_mini.png',
  '/eungyo-salon/terra_apple.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async cache => {
      await cache.addAll([
        ...CORE_FILES,
        ...QUESTION_FILES,
        ...AUDIO_FILES,
        ...IMAGE_FILES,
      ]);
      for (const url of VIDEO_FILES) {
        cache.add(url).catch(() => {
          console.warn('[SW] 영상 캐시 실패 (정상):', url);
        });
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => {
          console.log('[SW] 이전 캐시 삭제:', k);
          return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('supabase.co')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
