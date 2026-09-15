/* ─────────────────────────────────────────────────────────────────────
   guide_cover.js — 타륜 › 배낭 › EG가이드북
   2026.09.15 · 파이스

   ① 배낭의 「EG가이드북」을 누르면 흐린 지구 위에 입체 앞표지가 뜬다
   ② 좌우 화살표(← → 키)로 앞뒤를 바꿔 본다 — 페이드아웃 · 페이드인 (0915 소로)
   ③ 표지 몸통을 누르면 whitepaper.html 이 모달로 열린다
   ④ 책을 덮으면(×) 표지로, 표지를 닫으면(× · Esc · 바깥) 지구로

   ⭐ 뒷표지 문안은 그림에서 지우고 여기서 글자로 얹는다 (0913 결정문 6호)
      그림 속 글자는 고칠 수 없지만 여기 글자는 BLURB 한 곳만 고치면 끝난다.
      면의 원근은 BACK_FACE 행렬 하나가 맡는다 — 692×1000 가상 면을
      그림 속 사다리꼴(45,132)(580,56)(580,1035)(40,991)에 맞춘 호모그래피(0915 실측).
      ⚠ 뒷표지 그림을 새로 구우면 이 행렬도 다시 재야 한다.

   ⚠ terra.html 과 같은 창에 산다 — 이름은 전부 이 IIFE 안에 가둔다.
   ───────────────────────────────────────────────────────────────────── */
(function () {
  if (window.__egGuideCover) return;
  window.__egGuideCover = true;

  const V = '0915';
  const FRONT = 'guide_cover_front.webp?v=' + V;
  const BACK  = 'guide_cover_back.webp?v=' + V;
  const BOOK  = 'whitepaper.html?embed=1';
  const BOX   = { w: 728, h: 1087 };           /* 두 그림 가운데 큰 쪽에 맞춘 상자 */

  const BACK_FACE = 'matrix3d(0.670987,-0.119435,0,-0.00017596,-0.005577,0.849546,0,-0.00000962,0,0,1,0,45.0518,132.0611,0,1)';

  /* ⭐ 뒷표지 문안 — 오타는 여기서만 고친다 */
  const BLURB =
    '<p>이 가이드북은 EG유니버스에 처음 발걸음을 내딛는 분을 위해 준비했습니다. 왜 이런 곳을 지었는지, ' +
    '누구를 위해 지었는지, 무엇을 차렸는지.<br>여행과 회화, 고전음악과 별과 자연과 책과 대화, ' +
    '일곱 차림을 어떻게 빚어 식탁을 차렸고 이 우주가 지구 위 어디에 서 있는지, 어떤 시계로 도는지, ' +
    '마지막으로 약속 하나까지 정리했습니다.</p>' +
    '<p>앞의 세 부분은 꼭 읽어 보시길 권합니다. 나머지는 어느 건물 앞에서 멈칫할 때 그 대목만 ' +
    '펼쳐 보셔도 괜찮습니다. EG유니버스에는 갈림길이 많습니다. 처음 들어서면 누구나, 무엇부터 ' +
    '시작해야 할지 몰라 한 번쯤 멈칫합니다. 괜찮습니다. 멈칫하는 것도 걷는 일의 일부입니다.</p>' +
    '<p class="gc-src">— 본문 중에서</p>';

  const CSS = `
  #gcRoot{ position:fixed; inset:0; z-index:90000; display:none; align-items:center; justify-content:center;
    background:rgba(8,10,16,.36); -webkit-backdrop-filter:blur(14px) saturate(.9); backdrop-filter:blur(14px) saturate(.9);
    opacity:0; transition:opacity .32s ease; }
  #gcRoot.on{ display:flex; }
  #gcRoot.show{ opacity:1; }
  #gcWrap{ position:relative; }
  #gcBox{ position:absolute; left:0; top:0; width:${BOX.w}px; height:${BOX.h}px; transform-origin:0 0; }
  .gc-side{ position:absolute; inset:0; opacity:0; pointer-events:none; transition:opacity .28s ease, transform .25s ease; }
  .gc-side.on{ opacity:1; pointer-events:auto; }
  /* 들어 올리는 것은 면 전체 — 뒷표지 글자가 그림과 함께 떠야 한다 */
  .gc-side.on:hover{ transform:translateY(-6px); }
  .gc-side img{ position:absolute; top:0; height:${BOX.h}px; left:50%; transform:translateX(-50%);
    cursor:pointer; user-select:none; -webkit-user-drag:none;
    filter:drop-shadow(0 34px 38px rgba(0,0,0,.45)); }
  #gcFace{ position:absolute; left:0; top:0; width:692px; height:1000px; transform-origin:0 0;
    transform:${BACK_FACE}; pointer-events:none; }
  #gcBlurb{ position:absolute; left:52px; top:74px; width:572px;
    font-family:'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif; font-weight:400;
    font-size:15.6px; line-height:32px; letter-spacing:-.01em; color:#272B33; word-break:keep-all; }
  #gcBlurb p{ margin:0 0 32px; }
  #gcBlurb .gc-src{ font-size:13px; color:#3A3F49; margin:0; }
  .gc-arrow{ position:absolute; top:50%; width:52px; height:52px; margin-top:-26px; border-radius:50%;
    border:1px solid rgba(201,162,74,.55); background:rgba(12,14,20,.35); color:#E6CF96; font-size:26px;
    line-height:48px; text-align:center; cursor:pointer; user-select:none; transition:background .2s, border-color .2s; }
  .gc-arrow:hover{ background:rgba(201,162,74,.22); border-color:#C9A24A; }
  #gcPrev{ left:-86px; } #gcNext{ right:-86px; }
  .gc-x{ position:fixed; top:18px; right:22px; width:40px; height:40px; border-radius:50%;
    border:1px solid rgba(255,255,255,.22); background:rgba(12,14,20,.4); color:#E9E3D6; font-size:22px;
    line-height:38px; text-align:center; cursor:pointer; z-index:2; }
  .gc-x:hover{ background:rgba(255,255,255,.12); }
  #gcBook{ position:fixed; inset:0; z-index:90010; display:none; opacity:0; transition:opacity .3s ease;
    background:rgba(6,8,12,.5); -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px); }
  #gcBook.on{ display:block; }
  #gcBook.show{ opacity:1; }
  #gcBook iframe{ position:absolute; inset:0; width:100%; height:100%; border:0; background:transparent; }
  `;

  let root, wrap, box, sides = {}, side = 'front', busy = false;
  let bookEl = null, frame = null;

  function build() {
    if (root) return;
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    if (!document.querySelector('link[data-gc-font]')) {
      const lk = document.createElement('link');
      lk.rel = 'stylesheet';
      lk.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400&display=swap';
      lk.setAttribute('data-gc-font', '1');
      document.head.appendChild(lk);
    }

    root = document.createElement('div');
    root.id = 'gcRoot';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'EG가이드북 표지');
    root.innerHTML =
      '<div class="gc-x" id="gcClose" role="button" aria-label="표지 닫기">×</div>' +
      '<div id="gcWrap">' +
        '<div id="gcBox">' +
          '<div class="gc-side on" data-side="front"><img alt="EG가이드북 앞표지" draggable="false"></div>' +
          '<div class="gc-side" data-side="back"><img alt="EG가이드북 뒷표지" draggable="false">' +
            '<div id="gcFace"><div id="gcBlurb"></div></div></div>' +
        '</div>' +
        '<div class="gc-arrow" id="gcPrev" role="button" aria-label="표지 뒤집기">‹</div>' +
        '<div class="gc-arrow" id="gcNext" role="button" aria-label="표지 뒤집기">›</div>' +
      '</div>';
    document.body.appendChild(root);

    wrap = root.querySelector('#gcWrap');
    box  = root.querySelector('#gcBox');
    root.querySelectorAll('.gc-side').forEach((el) => { sides[el.dataset.side] = el; });
    sides.front.querySelector('img').src = FRONT;
    sides.back.querySelector('img').src  = BACK;
    root.querySelector('#gcBlurb').innerHTML = BLURB;

    root.querySelector('#gcClose').addEventListener('click', close);
    root.querySelector('#gcPrev').addEventListener('click', (e) => { e.stopPropagation(); flip(); });
    root.querySelector('#gcNext').addEventListener('click', (e) => { e.stopPropagation(); flip(); });
    root.querySelectorAll('.gc-side img').forEach((im) =>
      im.addEventListener('click', (e) => { e.stopPropagation(); openBook(); }));
    /* 표지 바깥 흐린 지구를 누르면 닫는다 */
    root.addEventListener('click', (e) => { if (e.target === root) close(); });

    fit();
    window.addEventListener('resize', fit);
  }

  /* 화면 높이의 80% 안쪽으로 — 노트북 세로 900 에서도 위아래가 남아 「떠 있다」가 산다 */
  function fit() {
    if (!box) return;
    const h = Math.min(window.innerHeight * 0.8, 860);
    const s = h / BOX.h;
    box.style.transform = 'scale(' + s + ')';
    wrap.style.width  = (BOX.w * s) + 'px';
    wrap.style.height = (BOX.h * s) + 'px';
  }

  function open() {
    build();
    showSide('front');
    root.classList.add('on');
    requestAnimationFrame(() => root.classList.add('show'));
  }

  function close() {
    if (!root) return;
    closeBook(true);
    root.classList.remove('show');
    setTimeout(() => root.classList.remove('on'), 320);
  }

  function showSide(name) {
    side = name;
    Object.keys(sides).forEach((k) => sides[k].classList.toggle('on', k === name));
  }

  /* ⭐ 0915 소로 — 앞뒤는 페이드아웃 · 페이드인으로 */
  function flip() {
    if (busy) return;
    busy = true;
    const next = side === 'front' ? 'back' : 'front';
    sides[side].classList.remove('on');
    setTimeout(() => { showSide(next); setTimeout(() => { busy = false; }, 280); }, 280);
  }

  function openBook() {
    if (!bookEl) {
      bookEl = document.createElement('div');
      bookEl.id = 'gcBook';
      bookEl.setAttribute('role', 'dialog');
      bookEl.setAttribute('aria-label', 'EG가이드북');
      bookEl.innerHTML = '<div class="gc-x" id="gcBookClose" role="button" aria-label="책 덮기">×</div>';
      frame = document.createElement('iframe');
      frame.title = 'EG가이드북';
      frame.setAttribute('allowtransparency', 'true');
      frame.src = BOOK;                         /* 한 번만 싣는다 — 덮었다 다시 펴도 읽던 자리가 산다 */
      frame.addEventListener('load', focusBook);
      bookEl.appendChild(frame);
      document.body.appendChild(bookEl);
      bookEl.querySelector('#gcBookClose').addEventListener('click', () => closeBook(false));
    }
    bookEl.classList.add('on');
    requestAnimationFrame(() => { bookEl.classList.add('show'); focusBook(); });
  }

  function focusBook() {
    try { frame.focus(); frame.contentWindow.focus(); } catch (_) {}
  }

  function closeBook(quick) {
    if (!bookEl || !bookEl.classList.contains('on')) return;
    bookEl.classList.remove('show');
    setTimeout(() => bookEl.classList.remove('on'), quick ? 0 : 300);
  }

  /* 키 — 책이 열려 있으면 키는 책(iframe) 몫이다. 표지만 떠 있을 때만 받는다.
     ⚠ 캡처 단계에서 먼저 받아 terra 의 지구 키(화살표 · Esc)로 번지지 않게 한다 */
  window.addEventListener('keydown', (e) => {
    if (!root || !root.classList.contains('on')) return;
    if (bookEl && bookEl.classList.contains('on')) return;
    let done = true;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') flip();
    else if (e.key === 'Escape') close();
    else if (e.key === 'Enter') openBook();
    else done = false;
    if (done) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  /* 배낭 카드 — terra.html 의 #dockGuide. 카드가 다시 그려져도 위임으로 산다 */
  document.addEventListener('click', (e) => {
    if (e.target.closest && e.target.closest('#dockGuide')) open();
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('#dockGuide')) {
      e.preventDefault(); open();
    }
  });

  window.EGGuideCover = { open, close, openBook };
})();
