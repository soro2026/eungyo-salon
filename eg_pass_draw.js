/* ═════════════════════════════════════════════════
   eg_pass_draw.js — 표 한 장을 그린다 (2026.09.23 · 파이스)

   베타 초대권 · 준회원 바우처 — 파운더 대시보드가 뽑는 그 표.
   개찰구(/pass)와 타벨라이(조용한 초대장)도 같은 표를 그려야 해서 한 파일로 떼었다.
   ⚠ drawPass 는 founder_dash.html 0919 판을 한 글자도 바꾸지 않고 옮겼다.
     표를 고칠 때는 여기 한 곳만 — 대시보드도 곧 이 파일을 부르게 바꾼다(대청소 명단).

   쓰는 법   const cv = await EGPass.render(P);     // 1600 × 800 캔버스
             P = { kind:'beta'|'associate', guest, building, where, founder,
                   from, to, code, url, value(준회원만 · 쉼표 찍힌 글자) }
   ═════════════════════════════════════════════════ */
(function(){
  "use strict";

function drawPass(ctx, W, H, P, F) {
  const WINE = '#5C1A2B';
  const NAVY = '#16243D', GOLD = '#8A6712', GOLD2 = '#C2921F', INK = '#1F232B', SOFT = '#6B7079', PAPER = '#F8F3E6', LINE = '#C9B98A';
  const S = F.serif, M = F.mono;
  const CUT = 1150;                       /* 절취선 x */
  const R = 34;

  /* 종이 */
  ctx.clearRect(0, 0, W, H);
  const BETA = P.kind === 'beta';
  ctx.fillStyle = BETA ? PAPER : '#FFFFFF';          /* 종이 — 베타는 크림, 준회원 바우처는 흰색 (0919 소로) */
  rr(ctx, 0, 0, W, H, R); ctx.fill();
  if (!BETA) { ctx.strokeStyle = LINE; ctx.lineWidth = 3; rr(ctx, 1.5, 1.5, W - 3, H - 3, R); ctx.stroke(); }   /* 흰 종이는 흰 배경에서 윤곽이 사라진다 */

  /* 바탕 — 크레덴시알 수첩의 쌍핵 지문 기요셰 (18호 정본값 · 진하기 .3 · 간격 3 · 3색) 를 표 크기로 옮긴다 (0919 소로) */
  guilloche();

  /* 머리 띠 */
  ctx.save(); rr(ctx, 0, 0, W, H, R); ctx.clip();
  ctx.fillStyle = P.kind === 'beta' ? NAVY : WINE; ctx.fillRect(0, 0, W, 132);   /* 머리 색 — 베타는 남색, 준회원 바우처는 포도주 (0919 소로) */
  ctx.fillStyle = GOLD2; ctx.fillRect(0, 132, W, 5);
  ctx.restore();

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#FFFFFF'; ctx.font = '700 40px ' + S;
  spaced('EG UNIVERSE', 64, 84, 17);         /* 자간은 한 자씩 직접 띄운다 — 브라우저를 가리지 않는다 (0919 소로) */
  ctx.fillStyle = '#E9D9A8'; ctx.font = '400 25px ' + S;
  ctx.textAlign = 'right';
  ctx.fillText(P.kind === 'beta' ? 'BETA BOARDING PASS  |  베타 초대권 · 3주' : 'BOARDING PASS  |  준회원 바우처 · 2주', CUT - 40, 82);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#E9D9A8'; ctx.font = '400 22px ' + S;
  ctx.fillText(P.kind === 'beta' ? 'BETA · 3 WEEKS' : 'PRE-MEMBER · 2 WEEKS', CUT + 44, 82);   /* 0923 소로 — 이름표와 같은 말 */

  /* 절취선 + 위아래 홈 */
  ctx.save();
  ctx.strokeStyle = LINE; ctx.lineWidth = 3; ctx.setLineDash([3, 13]); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(CUT, 160); ctx.lineTo(CUT, H - 28); ctx.stroke();
  ctx.restore();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(CUT, 0, 26, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(CUT, H, 26, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  if (!BETA) { ctx.strokeStyle = LINE; ctx.lineWidth = 3;          /* 흰 종이 — 아래 홈에도 테두리를 잇는다 */
    ctx.beginPath(); ctx.arc(CUT, H, 26, Math.PI, Math.PI * 2); ctx.stroke(); }

  /* ── 본권 ── */
  const X = 64;
  label(X, 196, 'PASSENGER', '받는 분');
  guestLine(X, 282, 78, 620);
  rule(X, 310, 660);

  label(760, 196, 'INVITED BY', '초대한 분');
  founderLine(760, 268, 40, 340);
  rule(760, 310, 340);

  label(X, 362, 'TO', '도착');
  bldLine(X, 428, 52, 660);
  ctx.fillStyle = SOFT; ctx.font = '400 26px ' + S;
  ctx.fillText(P.where, X, 470);
  rule(X, 496, 660);

  label(760, 362, 'VALID', '본 PASS의 입력 유효기간');
  ctx.fillStyle = INK; ctx.font = '500 ' + fit(ctx, P.from + ' — ' + P.to, 500, 38, 340, S) + 'px ' + S;
  ctx.fillText(P.from + ' — ' + P.to, 760, 428);
  const stay = P.kind === 'beta' ? '도착한 날로부터 3주 체류 가능합니다.' : '도착한 날로부터 2주 체류 가능합니다.';
  ctx.fillStyle = SOFT; ctx.font = '400 ' + fit(ctx, stay, 400, 24, 340, S) + 'px ' + S;
  ctx.fillText(stay, 760, 470);
  rule(760, 496, 340);

  label(X, 548, 'PASS No.', '번호');
  /* 번호 — 흰 띠를 깔아 강조한다 (0919 소로) */
  ctx.font = '700 56px ' + M;
  const GAP = 11;                                  /* 자간 — 한 자씩 직접 띄운다 (0919 소로 · 2배 → 액면 칸과 부딪혀 조금 좁힘) */
  band(X, 568, Math.min(ctx.measureText(P.code).width + GAP * (P.code.length - 1) + 56, 640), 88);
  ctx.fillStyle = NAVY; ctx.font = '700 56px ' + M;
  spaced(P.code, X + 28, 631, GAP);

  /* 액면 — 준회원 바우처에만 (0919 소로). ⚠ 금액은 부르는 쪽이 DB 값을 넘긴다 — 여기에 숫자를 적지 않는다 */
  if (P.value) {
    label(760, 548, 'VALUE', '액면');
    ctx.fillStyle = SOFT; ctx.font = '500 26px ' + M; ctx.fillText('KRW', 760, 630);
    const kw = ctx.measureText('KRW').width;
    ctx.fillStyle = NAVY; ctx.font = '700 ' + fit(ctx, P.value, 700, 56, 340 - kw - 16, S) + 'px ' + S;
    ctx.fillText(P.value, 760 + kw + 16, 632);
  }

  /* 아랫줄 — 들어오는 길 */
  ctx.fillStyle = GOLD2; ctx.fillRect(X, 676, CUT - X - 50, 2);
  ctx.fillStyle = INK; ctx.font = '400 27px ' + S;
  if (BETA) {
    const b = P.url, c = '  에 들어와 위 번호를 입력해 주십시오';
    let x = X;
    ctx.fillStyle = NAVY; ctx.font = '700 29px ' + M; ctx.fillText(b, x, 722); x += ctx.measureText(b).width;
    ctx.fillStyle = INK; ctx.font = '400 27px ' + S; ctx.fillText(c, x, 722);
  } else {
    /* 준회원 바우처는 받는 분이 두 부류다 (0919 소로) — 처음 오시는 분 · 기존 이용자 (표에 「베타」라는 말을 적지 않는다) */
    way(712, '처음 오시는 분', P.url, ' 에서 위 번호를 입력해 주십시오');
    way(745, '기존 이용자의 경우', '', '교양 자화상의 「준회원 바우처 입력」에 위 번호를 입력해 주십시오');
  }
  /* 필독 — 노트북 · 데스크톱 전용 (0919 소로) */
  ctx.fillStyle = GOLD; ctx.font = '400 ' + (BETA ? 20 : 18) + 'px ' + S;
  ctx.fillText('※ EG유니버스는 노트북이나 데스크톱에서 웹으로 접속합니다. 모바일에서는 접속할 수 없으니 착오 없으시길 바랍니다.', X, BETA ? 764 : 776);

  /* ── 부권 ── */
  const SX = CUT + 44, SW = W - SX - 50;
  label(SX, 196, 'PASSENGER', '받는 분');
  guestLine(SX, 256, 44, SW);
  rule(SX, 284, SW);
  label(SX, 336, 'TO', '도착');
  bldLine(SX, 390, 32, SW);
  rule(SX, 418, SW);
  label(SX, 470, 'VALID', '본 PASS의 입력 유효기간');
  ctx.fillStyle = INK; ctx.font = '500 28px ' + S;
  ctx.fillText(P.from + ' — ' + P.to, SX, 522);
  rule(SX, 550, SW);
  label(SX, 602, 'PASS No.', '번호');
  band(SX, 620, SW, 58);
  ctx.fillStyle = NAVY; ctx.font = '700 ' + fit(ctx, P.code, 700, 34, SW - 32, M) + 'px ' + M;
  ctx.fillText(P.code, SX + 16, 661);
  ctx.fillStyle = SOFT; ctx.font = '400 21px ' + M;
  ctx.fillText(P.url, SX, 722);

  function label(x, y, en, ko) {
    ctx.font = '500 19px ' + M; ctx.fillStyle = GOLD; ls(ctx, 1.5);
    ctx.fillText(en, x, y); const w = ctx.measureText(en).width; ls(ctx, 0);
    ctx.fillStyle = LINE; ctx.fillRect(x + w + 12, y - 16, 2, 18);
    ctx.fillStyle = GOLD; ctx.font = '400 20px ' + S; ctx.fillText(ko, x + w + 26, y);
  }
  /* 초대한 분 — 이름은 그대로, FOUNDER 는 영문 작은 글씨로 (0919 소로) */
  function founderLine(x, y, size, max) {
    let s = size; const tag = 'FOUNDER';
    const w = (z) => { ctx.font = '500 ' + z + 'px ' + S; const a = ctx.measureText(P.founder).width;
                       ctx.font = '500 ' + Math.round(z * 0.5) + 'px ' + S; return a + z * 0.32 + ctx.measureText(tag).width + tag.length * 2; };
    while (s > 18 && w(s) > max) s -= 2;
    ctx.fillStyle = INK; ctx.font = '500 ' + s + 'px ' + S; ctx.fillText(P.founder, x, y);
    let fx = x + ctx.measureText(P.founder).width + s * 0.32;
    ctx.fillStyle = SOFT; ctx.font = '500 ' + Math.round(s * 0.5) + 'px ' + S;
    for (const ch of tag) { ctx.fillText(ch, fx, y); fx += ctx.measureText(ch).width + 2; }
  }
  /* 고유 명칭은 크게, 격(MAISON · HOUSE · LOFT · TOWER)은 2/3 크기로 (0919 소로) */
  function bldLine(x, y, size, max) {
    const parts = String(P.building || '').trim().split(/\s+/);
    const grade = parts.length > 1 ? parts.pop() : '';
    const head = parts.join(' ');
    let s = size;
    const w = (z) => { ctx.font = '700 ' + z + 'px ' + S; const a = ctx.measureText(head).width;
                       if (!grade) return a;
                       ctx.font = '500 ' + Math.round(z * 2 / 3) + 'px ' + S; return a + z * 0.30 + ctx.measureText(grade).width; };
    while (s > 18 && w(s) > max) s -= 2;
    ctx.fillStyle = NAVY; ctx.font = '700 ' + s + 'px ' + S; ctx.fillText(head, x, y);
    if (grade) { const gx = x + ctx.measureText(head).width + s * 0.30;
      ctx.font = '500 ' + Math.round(s * 2 / 3) + 'px ' + S; ctx.fillText(grade, gx, y); }
  }
  /* 이름은 크게, 「님」은 절반 크기로 (0919 소로) */
  function guestLine(x, y, size, max) {
    let s = size;
    const w = (z) => { ctx.font = '700 ' + z + 'px ' + S; const a = ctx.measureText(P.guest).width;
                       ctx.font = '500 ' + Math.round(z / 2) + 'px ' + S; return a + z * 0.22 + ctx.measureText('님').width; };
    while (s > 18 && w(s) > max) s -= 2;
    ctx.fillStyle = NAVY; ctx.font = '700 ' + s + 'px ' + S; ctx.fillText(P.guest, x, y);
    const nx = x + ctx.measureText(P.guest).width + s * 0.22;
    ctx.font = '500 ' + Math.round(s / 2) + 'px ' + S; ctx.fillText('님', nx, y);
  }
  function spaced(text, x, y, gap) {
    for (const ch of text) { ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + gap; }
  }
  function guilloche() {
    const GC = [['#D98A9A', .5], ['#8FB6D6', .55], ['#D9C271', .45]];
    const K = 2.5, gop = .3, gap = 3 * K, cs = [[470, 470], [1230, 560]];
    ctx.save(); rr(ctx, 0, 0, W, H, R); ctx.clip();
    ctx.lineWidth = .45 * K;
    for (let g = 0; g < 3; g++) {
      const off = g * 2.7, tint = g * 1.9 * K, N = Math.round(300 / 3);
      ctx.strokeStyle = GC[g][0]; ctx.globalAlpha = GC[g][1] * gop;
      for (let j = 0; j < cs.length; j++) {
        for (let i = 1; i < N; i++) {
          const r0 = i * gap * 0.92;
          ctx.beginPath();
          for (let a = 0; a <= 64; a++) {
            const th = a / 64 * 6.2832;
            const rad = r0 + 2.8 * K * Math.sin(th * 2 + off) + 1.8 * K * Math.sin(th * 6 + j);
            const px = cs[j][0] + tint + rad * Math.cos(th), py = cs[j][1] + rad * Math.sin(th) * 0.93;
            if (a) ctx.lineTo(px, py); else ctx.moveTo(px, py);
          }
          ctx.closePath(); ctx.stroke();
        }
      }
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function way(y, who, url, text) {
    ctx.fillStyle = GOLD; ctx.font = '500 20px ' + S; ctx.fillText(who, X, y);
    let x = X + 212;
    ctx.fillStyle = LINE; ctx.fillRect(x - 18, y - 17, 2, 20);
    if (url) { ctx.fillStyle = NAVY; ctx.font = '700 23px ' + M; ctx.fillText(url, x, y); x += ctx.measureText(url).width; }
    ctx.fillStyle = INK; ctx.font = '400 22px ' + S; ctx.fillText(text, x, y);
  }
  function band(x, y, w, h) {
    ctx.save(); ctx.shadowColor = 'rgba(60,45,10,.10)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 2;
    ctx.fillStyle = BETA ? '#FFFFFF' : '#F6EBC9'; rr(ctx, x, y, w, h, 8); ctx.fill(); ctx.restore();   /* 번호 띠 — 베타는 흰색, 바우처는 옅은 금 */
    ctx.strokeStyle = BETA ? LINE : GOLD2; ctx.lineWidth = 1.5; rr(ctx, x, y, w, h, 8); ctx.stroke();
  }
  function rule(x, y, w) { ctx.fillStyle = LINE; ctx.fillRect(x, y, w, 2); }
  function fit(c, text, wt, size, max, fam) {
    let s = size; c.font = wt + ' ' + s + 'px ' + fam;
    while (s > 18 && c.measureText(text).width > max) { s -= 2; c.font = wt + ' ' + s + 'px ' + fam; }
    return s;
  }
  function ls(c, px) { try { c.letterSpacing = px + 'px'; } catch (_) {} }
  function rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
}

  const F = { serif: '"Noto Serif KR", serif', mono: '"IBM Plex Mono", monospace' };

  /* 글꼴 조각을 그릴 글자로 먼저 부른다 — 한글 웹폰트는 쓰는 글자만 내려온다 (대시보드와 같은 까닭) */
  async function loadFonts(P) {
    const all = Object.values(P).join(' ') + ' 님 받는 분 초대한 도착 본 PASS의 입력 유효기간 번호 액면 처음 오시는 분 기존 이용자의 경우 에서 교양 자화상의 「준회원 바우처 입력」 준회원 바우처 2주 베타 초대권 3주 에 들어와 위 번호를 입력해 주십시오 도착한 날로부터 2주 3주 체류 가능합니다. ※ EG유니버스는 노트북이나 데스크톱에서 웹으로 접속합니다. 모바일에서는 접속할 수 없으니 착오 없으시길 바랍니다.';
    try {
      await Promise.all([
        document.fonts.load('400 30px "Noto Serif KR"', all), document.fonts.load('500 30px "Noto Serif KR"', all),
        document.fonts.load('700 30px "Noto Serif KR"', all), document.fonts.load('500 30px "IBM Plex Mono"', all),
        document.fonts.load('700 30px "IBM Plex Mono"', all)]);
    } catch (_) {}
  }

  async function render(P) {
    await loadFonts(P);
    const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 800;
    drawPass(cv.getContext('2d'), 1600, 800, P, F);
    return cv;
  }

  window.EGPass = { render: render, draw: drawPass };
})();
