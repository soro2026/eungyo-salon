/* ─────────────────────────────────────────────────────────────────────
   wp_paginate.js — EG백서 조판기
   2026.09.14 · 비너스 목업 `EG백서 전자책.dc.html` 에서 이식 · 파이스
   2026.09.15 오후 · 반면·띠 대기 자리를 줄로 — 잇달아 오면 앞 그림이 사라지던 것
   2026.09.15 오후 2 · 홀수 쪽은 오른쪽 · 오른쪽 빈 면 금지 · 장 경계의 빈 한 장 폐기
   2026.09.15 오후 3 · 큰 대사의 「 / 」 줄 나눔을 자가 잰다

   ⭐ 규칙 여덟은 비너스가 이미 돌아가는 코드로 구현해 두었다.
      새로 짜지 않고 그대로 옮긴다. 값도 안 건드린다.

   손본 곳 셋 — 목업이 0장·Ⅰ장 48쪽만 봤기 때문에 없던 것들.
      ① 건물 머리   번호 없는 절 머리 3행(99px)          0914 소로 결정
      ② 속머리      @sub 2행(66px) · 본문 흐름 안
      ③ 전면 삽화   제 crop 값을 들고 간다(서고 plates)
   ───────────────────────────────────────────────────────────────────── */

const PLATE_W = 363, PLATE_H = 495, LH = 33;
const HEAD_H = 132;   // 절 머리 4행 — 번호 + 이름
const UNIT_H = 99;    // ① 건물 머리 3행 — 번호 줄을 뺀 절 머리
const SUB_H  = 66;    // ② 속머리 2행 — 위 한 행 비우고 이름 한 행

/* 숨은 자. ⚠ document.fonts.ready 뒤에 잴 것 */
function makeRuler() {
  const d = document.createElement('div');
  d.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;' +
    `width:${PLATE_W}px;word-break:keep-all;white-space:normal;text-align:left;` +
    "font-family:'Gowun Batang',serif;";
  document.body.appendChild(d);
  const body = (text, ind) => {
    d.style.cssText = d.style.cssText.replace(/font-size[^;]*;|line-height[^;]*;|letter-spacing[^;]*;|text-indent[^;]*;/g, '');
    d.style.fontSize = '17px'; d.style.lineHeight = LH + 'px';
    d.style.letterSpacing = '-0.012em'; d.style.textIndent = (ind || 0) + 'px';
    d.style.fontWeight = '400';
    d.textContent = String(text).replace(/\*\*/g, '');
    return d.offsetHeight;
  };
  const big = (text) => {
    d.style.fontSize = '25px'; d.style.lineHeight = '49.5px';
    d.style.letterSpacing = '-0.025em'; d.style.textIndent = '0px';
    d.style.fontWeight = '400';
    /* ⭐ 0915 — 큰 대사도 「 / 」 에서 줄을 나눈다(면 전체 대사 · 구호와 같은 문법). 나눈 채로 잰다 */
    d.style.whiteSpace = 'pre-line';
    d.textContent = String(text).split(' / ').join('\n');
    const h = d.offsetHeight;
    d.style.whiteSpace = 'normal';
    return h;
  };
  return { body, big, done: () => d.remove() };
}

/* 어절(공백) 경계 */
function breakPoints(s) {
  const pts = [];
  for (let i = 0; i < s.length; i++) if (s[i] === ' ') pts.push(i + 1);
  pts.push(s.length);
  return pts;
}

/* ── 면 나누기 ─────────────────────────────────────────────── */

function paginate(STREAM, R) {
  const pages = [];
  let cur = null, hue = '#C2921F', chapLabel = '', sectLabel = '', markNext = false;
  const later = [];   // ④ 통독에서 볼 자리

  const push = (pg) => { pg.hue = pg.hue || hue; pages.push(pg); return pg; };
  const toLeft  = () => { if (pages.length % 2 === 1) push({ type: 'blank' }); };
  const toRight = () => { if (pages.length % 2 === 0) push({ type: 'blank' }); };

  /* 면지 — 순례길 표석의 노랑에 판화의 해칭 */
  push({ type: 'endpaper' }); push({ type: 'endpaper' });
  /* 차례 — 몇 면이 될지 먼저 센다.
     ⚠ 쪽번호가 차례 면 수에 달려 있으므로, 본문을 흘리기 전에 자리를 잡아 둬야 한다.
     차례 항목은 STREAM 의 장·절 머리와 순서가 정확히 같다. */
  const TOC_H = 451;                                   // top 140 ~ 판면 밑선 591
  const eH = (e) => e.chapter ? 74 : (e.unit ? 32 : 38);
  const entries = [];
  STREAM.forEach(it => {
    if (it.k === 'chapter') entries.push({ chapter: true, num: it.num, name: it.name });
    else if (it.k === 'section') entries.push({ num: it.num, name: it.name, unit: !it.num, course: !!it.cover });
  });
  const chunks = []; let bin = [], acc = 0;
  entries.forEach(e => {
    const h = eH(e);
    if (acc + h > TOC_H && bin.length) { chunks.push(bin); bin = []; acc = 0; }
    bin.push(e); acc += h;
  });
  if (bin.length) chunks.push(bin);

  push({ type: 'tocLeft' });
  chunks.forEach(list => push({ type: 'toc', toc: list }));
  let ei = 0;

  /* 규칙6 — 전면·펼침 삽화는 글의 흐름을 자르지 않는다.
     걸린 면을 끝까지 채운 뒤 다음 면 경계에서 한 장으로 선다. */
  let pending = [];
  const flush = (force) => {
    if (!pending.length) return;
    /* 규칙8 — 펼침 삽화는 왼쪽 면에서만 시작한다. 지금이 오른쪽 면이면
       빈 면을 끼우지 않고 글을 한 면 더 흘린 뒤 다음 경계에서 세운다. */
    if (!force && pending[0].k === 'spread' && pages.length % 2 === 1) return;
    cur = null;
    /* 규칙7 — 한 경계에 한 장만. 잇달아 서면 그림이 사건이 아니라 화보가 된다 */
    do {
      /* ⭐ 0915 소로 — 오른쪽(홀수) 면은 비우지 않는다.
         펼침 차례인데 지금이 오른쪽이면, 줄에서 전면 한 장을 앞으로 당겨 오른쪽을 채운다.
         당길 전면이 없으면 펼침은 다음 왼쪽 경계까지 줄에서 기다린다 */
      if (pending[0].k === 'spread' && pages.length % 2 === 1) {
        const j = pending.findIndex((x) => x.k !== 'spread');
        if (j < 0) break;
        pending.unshift(pending.splice(j, 1)[0]);
      }
      const it = pending.shift();
      if (it.k === 'spread') { push({ type: 'spread', src: it.src }); push({ type: 'spread', src: it.src }); }
      else push({ type: 'full', src: it.src, focus: it.focus });   // ③ crop 을 들고 간다
    } while (force && pending.length);
  };

  /* ⭐ 0915 오후 — 반면·띠의 대기 자리를 한 칸에서 줄로 바꾼다.
     한 칸이던 때는 칸 끝에 반면·띠가 잇달아 오면 뒤 그림이 앞 그림을 덮어써서
     책에서 소리 없이 사라졌다(야구장 · 학술원 · 서고). 검산의 「끼움」은 흘리기 전
     수라 이 증발을 못 셌다. 한 면에 한 장 · 남은 것은 다음 면으로 차례대로 */
  const pendingFigs = [];
  const applyFig = () => {
    if (!pendingFigs.length || !cur || cur.fig) return;
    const it = pendingFigs.shift();
    cur.fig = { src: it.src, lines: it.lines, band: it.band, focus: it.focus };
    cur.cap = cur.cap - it.lines * LH;
  };

  /* ⭐ 색지는 오른쪽 면에서 열리고, 맞은편(왼쪽)은 흰 종이로 비운다.
     인계서 ⑥ 「면 1(왼) 흰 종이, 비움 ← 앞 장의 끝」.
     ⚠ 목업은 0장·Ⅰ장만 겪어 우연히 짝이 맞았다. 장 여덟 · 차림 일곱이면 우연에 못 맡긴다.
     ⭐ 삽화가 몇 장 들어와 면이 밀려도 매번 여기서 다시 묻는다 — 면 번호를 어디에도 안 박아 둔 덕이다 */
  const openOnRight = () => {
    flush(true); cur = null;
    /* ⭐ 0915 소로 — 빈 면은 왼쪽(짝수)에만 둔다. 오른쪽(홀수) 빈 면은 오류다.
       앞 장이 오른쪽에서 끝났으면 왼쪽 한 면만 비우고 연다.
       앞 장이 왼쪽에서 끝났으면 비우지 않고 바로 맞은편 오른쪽에 선다.
       ⚠ 0914 의 「맞은편이 글이면 흰 면 둘로 다음 펼침을 연다」는 한 장(앞뒤)을 통째로 버렸다 — 폐기 */
    toRight();
  };

  const openBody = (init) => {
    flush();
    const base = { type: 'body', paras: [], used: 0, cap: PLATE_H, footLabel: '' };
    cur = push(Object.assign(base, init || {}));
    cur.footLabel = cur.head ? chapLabel : (sectLabel || chapLabel);
    if (markNext) { cur.mark = true; markNext = false; }
    applyFig();
    return cur;
  };

  STREAM.forEach(it => {

    if (it.k === 'chapter') {
      hue = it.hue; chapLabel = it.num + ' · ' + it.name; sectLabel = '';
      openOnRight();
      if (entries[ei]) entries[ei++].ref = pages.length;   /* 장 표지 자리 */
      push({ type: 'divider', num: it.num, name: it.name });
      push({ type: 'dividerBack', num: it.num, name: it.name });
      markNext = true;
      return;
    }

    /* ⭐ 차림 색지 — 노랑. 장은 남색, 차림은 노랑.
       어두운 색지는 장, 밝은 색지는 차림. 넘기는 손이 먼저 안다 */
    if (it.k === 'course') {
      openOnRight();
      /* 차례에서 차림을 누르면 본문이 아니라 색지로 간다 */
      if (entries[ei] && entries[ei].ref == null) entries[ei].ref = pages.length;
      push({ type: 'courseCover', num: it.num, name: it.name });
      push({ type: 'courseBack',  num: it.num, name: it.name });
      return;
    }

    if (it.k === 'full') {
      if (cur && cur.used > 0) { pending.push(it); return; }
      flush(); cur = null; push({ type: 'full', src: it.src, focus: it.focus }); return;
    }

    if (it.k === 'solo') {
      flush(); cur = null;
      push({ type: 'solo', lines: it.lines, size: it.size, lh: it.lh, display: it.display });
      return;
    }

    if (it.k === 'verse') {
      const h = (it.lines || []).length * (it.lh || 54) + 74;
      if (!cur) openBody();
      if (cur.used + h > cur.cap + 0.5) openBody();
      cur.paras.push({ verse: true, lines: it.lines, size: it.size, lh: it.lh, display: it.display });
      cur.used += h;
      return;
    }

    if (it.k === 'spread') {
      /* 오른쪽 면이면 빈 면을 끼우지 않고 줄에서 기다린다 (0915 소로) */
      if ((cur && cur.used > 0) || pages.length % 2 === 1) { pending.push(it); return; }
      flush(); cur = null;
      push({ type: 'spread', src: it.src }); push({ type: 'spread', src: it.src });
      return;
    }

    if (it.k === 'section') {
      /* ① 번호가 없으면 건물이다 — 같은 글꼴, 번호 줄 하나를 뺀 3행.
         러닝 푸터의 이름도 건물이 가져간다. 야구장 열다섯 면을 읽는 동안
         면 아래에 「텍스트」가 아니라 「야구장」이 떠 있어야 한다. */
      const unit = !it.num;
      sectLabel = unit ? it.name : it.num + ' ' + it.name;
      if (entries[ei]) { if (entries[ei].ref == null) entries[ei].ref = pages.length; ei++; }
      markNext = true;
      /* ⭐ 색지가 이미 이름을 말했으면 절 머리를 다시 세우지 않는다 */
      openBody(it.cover
        ? { cap: PLATE_H }
        : { head: { num: it.num, name: it.name, unit }, cap: PLATE_H - (unit ? UNIT_H : HEAD_H) });
      return;
    }

    /* ② 속머리 — 본문 흐름 안에 선다.
       머리가 면 꼬리에 혼자 남지 않게, 아래로 본문 두 행은 따라와야 한다.
       규칙4(고아 줄)와 같은 결이다. */
    if (it.k === 'sub') {
      if (!cur) openBody();
      if (cur.used + SUB_H + LH * 2 > cur.cap + 0.5) openBody();
      cur.paras.push({ sub: true, text: it.text });
      cur.used += SUB_H;
      return;
    }

    if (it.k === 'fig') {
      const need = it.lines * LH;
      /* 줄에 먼저 선 그림이 있거나 이 면에 이미 한 장이 앉았으면 줄 뒤에 선다 — 앞지르지도 덮어쓰지도 않는다 */
      if (!cur || cur.fig || pendingFigs.length || cur.used > cur.cap - need) { pendingFigs.push(it); if (!cur) openBody(); return; }
      cur.fig = { src: it.src, lines: it.lines, band: it.band, focus: it.focus };
      cur.cap = cur.cap - need;
      return;
    }

    if (it.k === 'big') {
      const h = R.big(it.text) + LH * 2;
      if (!cur) openBody();
      if (cur.used + h > cur.cap + 0.5) openBody();
      cur.paras.push({ big: true, text: it.text });
      cur.used += h;
      return;
    }

    /* 본문 한 문단 — 행 단위로 잘라 면을 채운다. 자를 자리는 어절 경계에서 이분 탐색 */
    let text = it.text, start = true, guard = 0;
    while (text.length && guard++ < 200) {
      if (!cur) openBody();
      let room = cur.cap - cur.used;
      if (room < LH - 0.5) { openBody(); room = cur.cap; }
      const ind = start ? 17 : 0;
      const h = R.body(text, ind);
      if (h <= room + 0.5) { cur.paras.push({ text, ind }); cur.used += h; text = ''; break; }

      let lines = Math.floor((room + 0.5) / LH);
      const total = Math.round(h / LH);
      if (lines < 2) { openBody(); continue; }
      /* 규칙4 — 꼬리에 한 행만 남기지 않는다. 넘길 행을 줄여 두 행을 함께 보낸다.
         ⚠ 면을 버리고 새 면을 열면 아래가 서너 행씩 빈다 — 첫 목업의 버그 */
      if (total - lines < 2) lines = total - 2;
      if (lines < 2) { openBody(); continue; }
      const pts = breakPoints(text);
      let lo = 0, hi = pts.length - 1, best = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (R.body(text.slice(0, pts[mid]), ind) <= lines * LH + 0.5) { best = mid; lo = mid + 1; } else hi = mid - 1;
      }
      if (best < 0) { openBody(); continue; }
      cur.paras.push({ text: text.slice(0, pts[best]).replace(/\s+$/, ''), ind });
      cur.used = cur.cap;
      text = text.slice(pts[best]);
      start = false;
      openBody();
    }
  });

  flush(true);
  pendingFigs.forEach((it) => later.push(`못 세운 삽화 — 책 끝까지 줄에 남음 「${it.src}」`));
  pending.forEach((it) => later.push(`못 세운 펼침 — 책 끝까지 줄에 남음 「${it.src}」`));
  if (pages.length % 2 === 1) { push({ type: 'blank' }); later.push('책 맨 끝 오른쪽 면이 비었다 — 소로 판정 자리'); }

  /* 쪽 번호 — 본문 면에만. 면지·차례·장 표지·삽화·면 전체·빈 면에는 없다 */
  const SHOW = { body: 1 };
  /* ⭐ 0915 소로 — 책은 홀수 쪽이 오른쪽이다. 첫 펼침 왼쪽(면지)이 0쪽, 오른쪽이 1쪽.
     면을 옮기지 않고 번호만 한 칸 당긴다 — 장 표지가 오른쪽에 서는 규칙과 맞물린다 */
  pages.forEach((p, i) => { if (SHOW[p.type]) p.folio = i; });

  /* 차례의 쪽 번호는 흘린 결과에서 되받는다 */
  entries.forEach(e => {
    for (let i = e.ref || 0; i < pages.length; i++) if (pages[i].folio) { e.folio = pages[i].folio; break; }
  });

  /* ④ 통독에서 볼 자리 — 짧은 면과 빈 면을 세어 둔다 */
  pages.forEach((p, i) => {
    if (p.type === 'body' && p.used < p.cap * 0.34 && p.paras.length && !p.head && !p.fig)
      later.push(`짧은 면 ${String(p.folio).padStart(3, '0')} — 판면의 ${Math.round(p.used / p.cap * 100)}%만 참`);
  });

  return { pages, toc: entries, later };
}

if (typeof module !== 'undefined') module.exports = { paginate, makeRuler, breakPoints, PLATE_H, LH, HEAD_H, UNIT_H, SUB_H };
