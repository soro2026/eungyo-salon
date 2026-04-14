const CACHE = 'eungyo-v20';

// ── 필수 캐시 파일 (install 시 전부 성공해야 함) ──────────────────
const CORE_FILES = [
  '/eungyo-salon/',
  '/eungyo-salon/index.html',
  '/eungyo-salon/museum.html',
  '/eungyo-salon/terra.html',
  '/eungyo-salon/heritage.html',
  '/eungyo-salon/constella.html',
];

// ── 문제 DB ──────────────────────────────────────────────────────
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

// ── 오디오 ───────────────────────────────────────────────────────
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

// ── 영상 (용량 큰 파일 — 캐시 실패해도 앱 작동) ──────────────────
const VIDEO_FILES = [
  '/eungyo-salon/intro_logo.mp4',
  '/eungyo-salon/drone_socrates.mp4',
  '/eungyo-salon/drone_proust.mp4',
  '/eungyo-salon/drone_pascal.mp4',
  '/eungyo-salon/drone_soro.mp4',
];

// ── 이미지 ───────────────────────────────────────────────────────
const IMAGE_FILES = [
  '/eungyo-salon/matchup_title.png',
  '/eungyo-salon/card_socrates2.png',
  '/eungyo-salon/card_proust2.png',
  '/eungyo-salon/card_pascal2.png',
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

// ── install ───────────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async cache => {
      // 핵심 파일은 반드시 캐시
      await cache.addAll([
        ...CORE_FILES,
        ...QUESTION_FILES,
        ...AUDIO_FILES,
        ...IMAGE_FILES,
      ]);
      // 영상은 개별 시도 — 실패해도 install 계속
      for (const url of VIDEO_FILES) {
        cache.add(url).catch(() => {
          console.warn('[SW] 영상 캐시 실패 (정상):', url);
        });
      }
    })
  );
  self.skipWaiting();
});

// ── activate: 이전 캐시 전부 삭제 ────────────────────────────────
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

// ── fetch: 캐시 우선, 없으면 네트워크 ────────────────────────────
self.addEventListener('fetch', e => {
  // Supabase API는 항상 네트워크 직접
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
