/* ═══════════════════════════════════════════════════════════════════
   eg_rotate.js — EG 순회 셈 (정본) · 0816
   ───────────────────────────────────────────────────────────────────
   ⚠⚠ 이 다섯 줄짜리 공식이 여태 **네 집**에 각각 살고 있었다.
       terra.html · galerie.html · concert.html · bibliotheca.html
       terra 주석의 경고 그대로 — 「한 곳만 고치면 타륜은 드가라 적고
       방에 들어가면 뭉크가 걸린다」.
   ⭐ 여기가 정본이다. 새로 셈이 필요한 집은 반드시 이것을 부른다.
   ⚠ 딱지 — 위 네 집은 아직 제 사본을 쓴다. 차례로 이 부품으로 갈아끼울 것.
       갈아끼우기 전까지 **공식을 여기서 고치면 안 된다**(넷과 어긋난다).

   공식 (네 집이 쓰던 것과 한 글자도 다르지 않다)
       works[ (날수 + floor(곳번호 × 작품수 / 곳수)) mod 작품수 ]
   날수 = KST 기준. 타임머신(EG_TT_DAY)이 켜져 있으면 그 날을 따른다.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const mod = (a, n) => ((a % n) + n) % n;

  /* 날수 — 네 집이 모두 이 셈을 쓴다 (KST = UTC+9) */
  function day() {
    if (window.EG_TT_DAY != null) return window.EG_TT_DAY;   /* ⏱ 타임머신 */
    return Math.floor((Date.now() + 9 * 3600 * 1000) / 86400000);
  }

  /* 그날 그 곳에 서는 작품 하나 */
  function workAt(no, H, works, d) {
    const N = (works || []).length;
    if (!N || !H) return null;
    return works[mod((d == null ? day() : d) + Math.floor(no * N / H), N)];
  }

  /* 그날의 당번 곳 — 날수를 곳수로 나눈 나머지 */
  function gate(places, d) {
    const n = (places || []).length;
    if (!n) return null;
    return places[mod((d == null ? day() : d), n)];
  }

  /* ⭐ 앞으로 며칠 안에 이 작품이 서는 날·곳
       ⚠ 역산하지 않고 하루씩 정방향으로 훑는다. 곳마다 offset이 달라
         닫힌 식으로 풀면 곳 하나만 틀려도 조용히 어긋난다.
         21일 × 곳 다섯이면 105번 — 셀 것도 없는 양이다.
       places 의 각 항목은 { no, ... } 를 갖는다(no = museum_no · hall_no).      */
  function schedule(workId, places, works, days) {
    const N = (works || []).length, H = (places || []).length;
    const out = [];
    if (!N || !H || workId == null) return out;
    const d0 = day(), span = days || 21;
    for (let d = d0; d < d0 + span; d++) {
      for (let i = 0; i < H; i++) {
        const p = places[i];
        const no = Number(p && p.no != null ? p.no : i);
        const w = works[mod(d + Math.floor(no * N / H), N)];
        if (w && String(w.id) === String(workId)) out.push({ day: d, place: p });
      }
    }
    return out;
  }

  /* 날수 → 사람이 읽는 꼴 */
  function ymd(d) { return new Date(d * 86400000).toISOString().slice(0, 10); }
  function mdKo(d) {
    const t = new Date(d * 86400000);
    return (t.getUTCMonth() + 1) + '월 ' + t.getUTCDate() + '일';
  }
  function wdayKo(d) { return ['목', '금', '토', '일', '월', '화', '수'][mod(d, 7)]; }

  window.EGRotate = { day, workAt, gate, schedule, ymd, mdKo, wdayKo };
  console.log('[EG] eg_rotate 0816 — 순회 셈 정본 (네 집의 사본은 아직 제 것을 쓴다)');
})();
