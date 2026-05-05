const CACHE = 'eungyo-v30';

const CORE_FILES = [
  '/eungyo-salon/',
  '/eungyo-salon/index.html',
  '/eungyo-salon/stadium_v2.html',
  '/eungyo-salon/museum.html',
  '/eungyo-salon/heritage.html',
  '/eungyo-salon/constella.html',
  '/eungyo-salon/wunderkammer.html',
  '/eungyo-salon/game_rookie.html',
  '/eungyo-salon/game_core.js',
  '/eungyo-salon/external_links.js',
  '/eungyo-salon/answer_compare.js',
  '/eungyo-salon/questions_index.json',
];

const QUESTION_FILES = [
  '/eungyo-salon/questions_aeschylus.json',
  '/eungyo-salon/questions_baekseok.json',
  '/eungyo-salon/questions_chekhov.json',
  '/eungyo-salon/questions_darwin.json',
  '/eungyo-salon/questions_davinci.json',
  '/eungyo-salon/questions_dostoevsky.json',
  '/eungyo-salon/questions_euripides.json',
  '/eungyo-salon/questions_goethe.json',
  '/eungyo-salon/questions_homer.json',
  '/eungyo-salon/questions_hugo.json',
  '/eungyo-salon/questions_kafka.json',
  '/eungyo-salon/questions_mozart.json',
  '/eungyo-salon/questions_ovid.json',
  '/eungyo-salon/questions_poe.json',
  '/eungyo-salon/questions_sejong.json',
  '/eungyo-salon/questions_shakespeare.json',
  '/eungyo-salon/questions_socrates.json',
  '/eungyo-salon/questions_sophocles.json',
  '/eungyo-salon/questions_tolstoy.json',
  '/eungyo-salon/questions_vangogh.json',
  '/eungyo-salon/questions_virgil.json',
  '/eungyo-salon/questions_yundongju.json',
];

const AUDIO_FILES = [
  '/eungyo-salon/organ01_game_opening.mp3',
  '/eungyo-salon/organ1.mp3',
  '/eungyo-salon/organ2.mp3',
  '/eungyo-salon/organ3.mp3',
  '/eungyo-salon/match_up.mp3',
  '/eungyo-salon/page_turn.mp3',
  '/eungyo-salon/reaction_apple.mp3',
  '/eungyo-salon/dice_sequence.mp3',
  '/eungyo-salon/dice_fanfare_win.mp3',
  '/eungyo-salon/dice_fanfare_lose.mp3',
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
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async cache => {
      // 핵심 파일들은 개별 처리 (하나 실패해도 install 안 깨지게)
      for (const url of [...CORE_FILES, ...QUESTION_FILES, ...AUDIO_FILES, ...IMAGE_FILES]) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn('[SW] 캐시 실패 (계속 진행):', url, err.message);
        }
      }
      // 영상은 원래도 부드럽게 실패 허용
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
