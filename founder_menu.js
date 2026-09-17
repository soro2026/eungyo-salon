/* ─────────────────────────────────────────────────────────────────────
   founder_menu.js — 타륜 › EG파운더 전용메뉴 › 파운더 신청안내
   2026.09.17 · 파이스

   ① 타륜의 배낭(PERA) 아래에 「EG파운더 전용메뉴」 칸을 낸다
      ⭐ 보이는 조건 = eg_founder_guide 를 읽을 수 있는 계정 (RLS 가 정한다)
         지금은 살롱지기만 · 뒤에 제안서를 받은 분께 RLS 를 열면 그분들께도 저절로 선다
      ⭐ 데스크톱에서만 (소로 0916 — 파운더 메뉴는 웹 · 데스크톱)
   ② 누르면 흐린 지구 위에 founder_guide.html?embed=1 이 뜬다 (가이드북과 같은 문법)
   ③ ⭐ 소로 0917 — 문서가 떠 있는 동안 뒤 지구는 멈춘다
      terra 가 방을 열 때 쓰는 그 손(viewer.useDefaultRenderLoop = false) 그대로.
      렌더 루프가 서면 clock tick 도 서므로 궤도 회전도 함께 선다.
      닫을 때는 **이 창이 멈춘 것만** 되살린다 — 다른 방이 멈춰 둔 지구는 건드리지 않는다
   ④ 닫기 — 문서의 ✕ · Esc · 판 바깥 누르기 → postMessage('fg-close')

   ⚠ terra.html 과 같은 창에 산다 — 이름은 전부 이 IIFE 안에 가둔다.
   ⚠ 클라이언트는 terra 의 window.egSupa 를 쓴다 (0818 한 문서 · 한 클라이언트)
   ───────────────────────────────────────────────────────────────────── */
(function () {
  if (window.__egFounderMenu) return;
  window.__egFounderMenu = true;

  const V = '0917';
  const PAGE = 'founder_guide.html?embed=1&v=' + V;

  const CSS = `
  #fgRoot{ position:fixed; inset:0; z-index:90000; display:none; opacity:0; transition:opacity .28s ease;
    background:rgba(18,24,36,.34); -webkit-backdrop-filter:blur(13px); backdrop-filter:blur(13px); }
  #fgRoot.on{ display:block; }
  #fgRoot.show{ opacity:1; }
  #fgRoot iframe{ position:absolute; inset:0; width:100%; height:100%; border:0; background:transparent; }
  `;

  let root = null, frame = null, stoppedGlobe = false;

  const desktop = () => window.matchMedia('(min-width: 1100px) and (hover: hover) and (pointer: fine)').matches;

  /* ── 지구 멈춤 · 되살림 ── */
  function pauseGlobe() {
    try {
      if (typeof viewer !== 'undefined' && viewer && viewer.useDefaultRenderLoop) {
        viewer.useDefaultRenderLoop = false;
        stoppedGlobe = true;
      }
    } catch (_) {}
  }
  function resumeGlobe() {
    try {
      if (stoppedGlobe && typeof viewer !== 'undefined' && viewer) viewer.useDefaultRenderLoop = true;
    } catch (_) {}
    stoppedGlobe = false;
  }

  /* ── 창 ── */
  function build() {
    if (root) return;
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    root = document.createElement('div');
    root.id = 'fgRoot';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', '파운더 신청안내');
    frame = document.createElement('iframe');
    frame.title = '파운더 신청안내';
    frame.setAttribute('allowtransparency', 'true');
    frame.src = PAGE;                               /* 한 번만 싣는다 — 닫았다 다시 열어도 읽던 자리가 산다 */
    frame.addEventListener('load', focusFrame);
    root.appendChild(frame);
    document.body.appendChild(root);
  }
  function focusFrame() { try { frame.focus(); frame.contentWindow.focus(); } catch (_) {} }

  function open() {
    build();
    pauseGlobe();
    root.classList.add('on');
    requestAnimationFrame(() => { root.classList.add('show'); focusFrame(); });
  }
  function close() {
    if (!root || !root.classList.contains('on')) return;
    root.classList.remove('show');
    setTimeout(() => { root.classList.remove('on'); resumeGlobe(); }, 300);
  }

  /* 문서가 보내는 말 */
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || typeof e.data !== 'object') return;
    if (e.data.type === 'fg-close') close();
    /* ⏳ fg-link — EG도시별현황 · 전자계약서가 서면 여기서 두 메뉴를 열고 읽음 기록을 남긴다 */
  });

  /* 창이 떠 있을 때 키는 terra 지구 키로 번지지 않게 먼저 받는다 */
  window.addEventListener('keydown', (e) => {
    if (!root || !root.classList.contains('on')) return;
    if (e.key === 'Escape') close();
    e.stopPropagation();
  }, true);

  /* ── 타륜 칸 ── */
  function inject() {
    if (document.getElementById('dockFounder')) return;
    const pera = document.getElementById('dockPera');
    if (!pera) return;
    const sec = document.createElement('div');
    sec.id = 'dockFounder';
    sec.innerHTML =
      '<div class="dock-sec"><span class="dock-sec-ko">EG파운더 전용메뉴</span></div>' +
      '<div class="dock-card nogo orn" id="dockFounderGuide" role="button" tabindex="0">' +
        '<div class="dock-main"><span>파운더 신청안내</span></div>' +
      '</div>';
    pera.insertAdjacentElement('afterend', sec);
  }

  let checking = false;
  async function mayShow() {
    if (checking || document.getElementById('dockFounder') || !desktop()) return;
    const sb = window.egSupa;
    if (!sb) return;
    checking = true;
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;
      const { data, error } = await sb.from('eg_founder_guide').select('slug').limit(1);
      if (!error && data && data.length) inject();
    } catch (e) {
      console.warn('[founder_menu]', e);
    } finally {
      checking = false;
    }
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest && e.target.closest('#dockFounderGuide')) open();
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('#dockFounderGuide')) {
      e.preventDefault(); open();
    }
  });

  if (window.egSupa && window.egSupa.auth && window.egSupa.auth.onAuthStateChange) {
    window.egSupa.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_IN' || ev === 'INITIAL_SESSION') mayShow(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mayShow);
  else mayShow();

  window.EGFounderMenu = { open, close };
})();
