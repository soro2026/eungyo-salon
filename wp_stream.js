/* ─────────────────────────────────────────────────────────────────────
   wp_stream.js — EG백서 서고 → STREAM
   2026.09.14 · 파이스

   eg_guidebook 58칸 + eg_guidebook_plates 를 비너스 paginate() 가 그대로
   먹는 배열로 바꾼다.

   ⭐ PAGES 를 거치지 않는다.
      목업의 STREAM 빌더(317~350행)가 하는 일은 손으로 가른 면을 도로
      잇는 것이 전부였다 — runsOn 정규식 · lastP 병합 · spread 중복 제거.
      서고 원고는 애초에 안 잘려 있다. 멀쩡한 문단을 잘랐다 다시 붙이면
      붙는 자리에서만 사고가 난다.

   ⭐ 목업에서 건져 온 것은 sinceCh 규칙 하나뿐이다.
      장이 열린 직후의 전면 삽화는 장 표지를 때우지 않고 본문 두 문단
      뒤에 선다. 이것은 이어 붙이기가 아니라 조판 규칙이라 그대로 온다.
   ───────────────────────────────────────────────────────────────────── */

/* 장 색 — 각 장 첫 삽화에서 뽑는다(비너스 장정체성체계 2호).
   Ⅱ~Ⅶ은 삽화가 구워진 뒤 채운다. 그때까지 0장 색으로 흐른다. */
const HUE = {
  '0': '#C2921F',   // 표석의 노랑
  'Ⅰ': '#9C3B64',   // 폐온실 난초의 자홍
};
const HUE_FALLBACK = '#C2921F';

/* 면 높이(HEAD_H·UNIT_H·SUB_H)는 조판기가 갖는다 — wp_paginate.js */

/* ⭐ 일곱 차림 — 노랑 속표지가 서는 절.
   Ⅳ장의 절 일곱이 곧 일곱 차림이다(여행·회화·음악·별·자연·텍스트·대화).
   다른 장에도 두시려면 이 한 줄만 고치면 된다. 끄시려면 null. */
const COURSE_CHAPTER = 'Ⅳ';

/* 삽화 fit → 면 종류 */
const FIT_LINES = { band: 4, half: 7 };

/* ── 자잘한 손 ──────────────────────────────────────────────── */

const isQuoted = (s) => /^\s*[“"]/.test(s);

/* 슬래시가 줄을 나눈다. 없으면 한 줄로 두고 조판기가 흘린다. */
const toLines = (s) =>
  s.includes(' / ')
    ? s.split(' / ').map((x) => x.trim()).filter(Boolean)
    : [s.trim()];

/* 빈 줄이 문단을 나눈다. 마커는 줄머리에 선다. */
const toParas = (body) =>
  String(body || '')
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

/* ── 본체 ──────────────────────────────────────────────────── */

function buildStream(rows, plates) {
  const OUT = [];
  const tally = {
    chapter: 0, course: 0, section: 0, unit: 0, sub: 0, p: 0,
    big: 0, solo: 0, verse: 0, full: 0, spread: 0, fig: 0,
  };
  const later = [];   /* ④ 통독에서 볼 자리 — 막는 것이 아니라 적어 두는 것 */

  /* 삽화를 서고 칸(slug)에 묶어 둔다 */
  const bySlug = {};
  (plates || [])
    .filter((p) => p.active !== false && p.code)
    .slice()
    .sort((a, b) => (a.ord || 0) - (b.ord || 0))
    .forEach((p) => { (bySlug[p.slug] = bySlug[p.slug] || []).push(p); });

  /* 장이 열린 직후 두 문단 동안 전면 삽화를 붙들었다가 내려놓는다 */
  let held = [], sinceCh = -1, chapNum = null;
  const drop = () => { while (held.length) emit(held.shift()); };

  function emit(it) {
    OUT.push(it);
    if (it.k === 'section') tally[it.num ? 'section' : 'unit']++;
    else tally[it.k]++;
    return it;
  }

  /* 삽화 한 장 → STREAM 항목 */
  function plateItem(p) {
    const src = p.path || (p.code + '.webp');
    if (p.fit === 'full')   return { k: 'full',   src, focus: p.crop || 'center 46%' };
    if (p.fit === 'spread') return { k: 'spread', src };
    return {
      k: 'fig',
      src,
      lines: FIT_LINES[p.fit] || 7,
      band: p.fit === 'band',
      focus: p.crop || 'center 50%',
    };
  }

  /* 한 칸의 본문을 흘린다 */
  function pourBody(row) {
    toParas(row.body).forEach((para) => {
      let m;

      if ((m = para.match(/^@sub\s+([\s\S]+)$/))) {
        emit({ k: 'sub', text: m[1].trim() });
        return;
      }

      /* ⭐ 따옴표가 가른다 — 0914 소로 확인
         겹따옴표로 열리면 누군가 한 말(고운바탕),
         없으면 EG가 하는 말(나눔명조 800 구호).
         이 표식은 원고의 성질이 아니라 조판 표식이다. 아래 검산으로 센다. */
      if ((m = para.match(/^@big\s+([\s\S]+)$/))) {
        const t = m[1].trim();
        if (isQuoted(t)) emit({ k: 'big', text: t });
        else emit({ k: 'verse', lines: toLines(t), size: 24, lh: 52, display: true });
        return;
      }

      if ((m = para.match(/^@solo\s+([\s\S]+)$/))) {
        const t = m[1].trim();
        if (isQuoted(t)) {
          /* 줄 나눔이 없으면 한 줄로 넘긴다 — 판면 폭 417 에서 저절로 접힌다.
             ⭐ 어디서 끊을지는 그 면을 보면서 정할 일이라 여기서 정하지 않는다.
                ④ 통독에서 소로께서 슬래시를 넣으시면 그 자리에서 끊긴다. */
          const lines = toLines(t);
          if (lines.length === 1) {
            later.push(`면 전체 대사 줄 나눔 — ${row.num || row.title} 「${t.slice(0, 16)}…」`);
          }
          emit({ k: 'solo', lines, size: 33, lh: 62 });
        } else {
          emit({ k: 'verse', lines: toLines(t), size: 24, lh: 52, display: true });
        }
        return;
      }

      if (/^@/.test(para)) {
        later.push(`모르는 마커 — ${row.num || row.title} 「${para.slice(0, 24)}…」`);
        return;
      }

      emit({ k: 'p', text: para });
      if (sinceCh >= 0 && ++sinceCh >= 2) { drop(); sinceCh = -1; }
    });
  }

  /* ── 칸을 차례로 ─────────────────────────────────────────── */

  rows.slice()
    .sort((a, b) => a.ord - b.ord)
    .filter((r) => r.active !== false)
    .forEach((row) => {

      if (row.level === 'chapter') {
        drop();                       // 앞 장이 못 내려놓은 삽화를 먼저 세운다
        held = []; sinceCh = 0;
        emit({
          k: 'chapter',
          num: row.num,
          name: row.title,
          hue: row.color || HUE[row.num] || HUE_FALLBACK,
        });
        chapNum = row.num;
      } else if (row.level === 'section') {
        /* ⭐ 차림이면 노랑 색지가 먼저 서고, 그 뒤 본문에는 절 머리를 다시 세우지 않는다.
           이름이 두 번 나오면 색지가 무안해진다 */
        const course = COURSE_CHAPTER && chapNum === COURSE_CHAPTER;
        if (course) emit({ k: 'course', num: row.num, name: row.title });
        emit({ k: 'section', num: row.num, name: row.title, cover: course });
      } else if (row.level === 'unit') {
        /* ⭐ 건물 — 번호를 뗀 절 머리. 0914 소로 결정
           번호 줄이 없으므로 paginate 가 3행으로 잡고,
           러닝 푸터의 이름도 이 건물이 가져간다. */
        emit({ k: 'section', num: null, name: row.title });
      } else {
        later.push(`모르는 층 — ord ${row.ord} level「${row.level}」`);
        return;
      }

      pourBody(row);

      /* 이 칸에 걸린 삽화 */
      (bySlug[row.slug] || []).forEach((p) => {
        const it = plateItem(p);
        /* 장이 막 열렸으면 붙들어 둔다 — 장 표지를 삽화로 때우지 않는다 */
        if (it.k === 'full' && sinceCh >= 0 && sinceCh < 2) held.push(it);
        else emit(it);
      });
    });

  drop();

  /* ── 검산 — 매번 눈에 걸리게 ───────────────────────────────
     따옴표 규칙은 조판 표식이라, Ⅱ~Ⅶ에 큰 줄이 서면서 겹따옴표가
     안 붙으면 그 줄은 말없이 구호가 된다. 그래서 수를 세어 보인다. */
  const 대사 = tally.big + tally.solo;
  const check =
    `칸 ${rows.length} · 문단 ${tally.p} · ` +
    `머리 장 ${tally.chapter}/차림 ${tally.course}/절 ${tally.section}/건물 ${tally.unit}/속 ${tally.sub} · ` +
    `큰 줄 ${대사 + tally.verse} = 대사 ${대사}(본문 ${tally.big}·면 ${tally.solo}) · 구호 ${tally.verse} · ` +
    `삽화 전면 ${tally.full}/펼침 ${tally.spread}/끼움 ${tally.fig}`;

  return { stream: OUT, tally, check, later };
}

if (typeof module !== 'undefined') module.exports = { buildStream };
