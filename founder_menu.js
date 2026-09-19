/* ─────────────────────────────────────────────────────────────────────
   founder_menu.js — 타륜 › EG파운더 전용메뉴
   2026.09.19 · 파이스 · 0919 왼쪽 슬라이드 넷 (0918 도시별현황 · 지구 임장 위에)

   ① 타륜 배낭(PERA) 목록의 가이드북 다음에 「EG파운더 전용메뉴」 카드를 세운다 (0917 소로 — 이름표 없이 · 무늬 타륜)
      ⭐ 보이는 조건 = eg_founder_guide 를 읽을 수 있는 계정 (RLS 가 정한다)
         지금은 살롱지기만 · 뒤에 제안서를 받은 분께 RLS 를 열면 그분들께도 저절로 선다
      ⭐ 데스크톱에서만 (소로 0916 — 파운더 메뉴는 웹 · 데스크톱)
   ② 누르면 흐린 지구 위에 founder_guide.html?embed=1 이 뜬다 (가이드북과 같은 문법)
   ③ ⭐ 소로 0917 — 문서가 떠 있는 동안 뒤 지구는 멈춘다
      terra 가 방을 열 때 쓰는 그 손(viewer.useDefaultRenderLoop = false) 그대로.
      렌더 루프가 서면 clock tick 도 서므로 궤도 회전도 함께 선다.
      닫을 때는 **이 창이 멈춘 것만** 되살린다 — 다른 방이 멈춰 둔 지구는 건드리지 않는다
   ④ 닫기 — 문서의 ✕ · Esc · 판 바깥 누르기 → postMessage('fg-close')

   ⭐ 0918 — 창은 하나, 종이만 바뀐다 (소로)
      ⚠ 창을 둘로 띄우지 않는다. 창이 둘이면 닫는 차례와 지구 멈춤·되살림이 엉킨다.
      같은 #fgRoot 안에 iframe 여러 장을 두고 보이는 쪽만 바꾼다 — 전부 읽던 자리가 산다.

   ⭐ 0918 지구 임장 — [보기]를 누르면 서류가 오른쪽으로 접히고 지구가 그 건물로 난다
      접힘(.dock) = 흐림·어둠을 걷고 · 지구를 되살리고 · 판을 오른쪽 460 으로 · 바깥은 손이 통과한다
      비행은 terra 의 창구 window.egFlyToBuilding 하나로만 부른다 (terra.html 블록 A 끝)

   ⭐⭐ 0919 왼쪽 슬라이드 — 프로세스에 따라 칸이 하나씩 켜진다 (소로)
      계약 전            01 신청안내 · 02 도시별현황 · 03 계약서
      계약 확정 후        01 대시보드 · 02 계약서 원본 · 03 도시별현황 · 04 신청안내
      ⭐ 문이 하나뿐이면 슬라이드를 세우지 않는다 — 처음 오신 분께는 제안서가 바로 펴진다
      ⭐ 열림/닫힘은 브라우저가 아니라 DB 가 안다 — rpc eg_founder_doors() 한 손
         도시별현황 = 신청안내 ⑧ 장에 닿았다(eg_founder_trace.guide_done)
         계약서     = 살아 있는 예약 or 서명한 계약서
         대시보드   = 입금이 확인된 계약 (eg_contracts.confirmed_at)
         ⚠ 문을 늘릴 때는 저 함수 하나만 고친다. 여기에 조건을 적지 않는다
      ⭐ 작은 타륜 무늬 = 대시보드 직행 — 확정 뒤에만 손이 닿는다 (그전에는 무늬 그대로)
      ⚠ 접혀 있을 때(.dock)는 슬라이드를 걷는다 — 지구를 보고 계신 중이다

   주고받는 말
     받음  fg-close · fc-close · ct-close · cd-close   닫는다
           fg-link                    신청안내 → 도시별현황
           fc-back                    도시별현황 → 신청안내
           fc-contract                도시별현황 → 계약서  (신청이 섰다)
           ct-back                    계약서 → 도시별현황  ⭐ 이름을 겹치지 않는다
           ct-signed                  서명이 끝났다 — 문을 다시 묻는다
           fc-fly {building}          접고 그 건물로 난다
           fc-unfold                  펴고 목록으로
     보냄  fc-folded {on}             도시별현황에게 접혔다 / 펴졌다

   ⚠ terra.html 과 같은 창에 산다 — 이름은 전부 이 IIFE 안에 가둔다.
   ⚠ 클라이언트는 terra 의 window.egSupa 를 쓴다 (0818 한 문서 · 한 클라이언트)
   ───────────────────────────────────────────────────────────────────── */
(function () {
  if (window.__egFounderMenu) return;
  window.__egFounderMenu = true;

  const V = '0919a';
  const GUIDE = 'founder_guide.html?embed=1&v=' + V;
  const CITY  = 'founder_city.html?embed=1&v=' + V;
  const CONT  = 'founder_contract.html?embed=1&v=' + V;
  const DASH  = 'founder_dash.html?embed=1&v=' + V;
  const DOCK_W = 460;                                  /* 접었을 때 오른쪽 판의 너비 */
  const RAIL_W = 196;                                  /* 왼쪽 슬라이드의 너비 */

  const CSS = '' +
  '#fgRoot{ position:fixed; inset:0; z-index:90000; display:none; opacity:0; transition:opacity .28s ease;' +
  '  background:rgba(18,24,36,.34); -webkit-backdrop-filter:blur(13px); backdrop-filter:blur(13px); }' +
  '#fgRoot.on{ display:block; }' +
  '#fgRoot.show{ opacity:1; }' +
  '#fgRoot iframe{ position:absolute; inset:0; width:100%; height:100%; border:0; background:transparent;' +
  '  transition:left .26s ease, width .26s ease; }' +
  '#fgRoot iframe.off{ display:none; }' +

  /* ── 왼쪽 슬라이드 ── */
  '#fgRoot .fg-rail{ position:absolute; left:0; top:0; bottom:0; width:' + RAIL_W + 'px; box-sizing:border-box;' +
  '  display:none; flex-direction:column; padding:30px 0 26px; background:rgba(11,16,26,.62);' +
  '  border-right:1px solid rgba(255,255,255,.13); transform:translateX(-14px); opacity:0;' +
  '  transition:transform .26s ease, opacity .26s ease; }' +
  '#fgRoot.rail .fg-rail{ display:flex; }' +
  '#fgRoot.rail.railin .fg-rail{ transform:none; opacity:1; }' +
  '#fgRoot.rail iframe{ left:' + RAIL_W + 'px; width:calc(100% - ' + RAIL_W + 'px); }' +
  '#fgRoot .fg-rail .hd{ padding:0 22px 20px; border-bottom:1px solid rgba(255,255,255,.10); margin-bottom:14px; }' +
  '#fgRoot .fg-rail .hd b{ display:block; font:500 14px/1.3 "Noto Serif KR",serif; color:#F3EFE6; letter-spacing:.02em; }' +
  '#fgRoot .fg-rail .hd i{ display:block; margin-top:5px; font:400 10px/1 "Cormorant Garamond",Georgia,serif;' +
  '  font-style:normal; color:rgba(226,214,190,.62); letter-spacing:.16em; text-transform:uppercase; }' +
  '#fgRoot .fg-door{ display:block; width:100%; text-align:left; box-sizing:border-box; padding:13px 22px;' +
  '  background:none; border:0; border-left:2px solid transparent; cursor:pointer; font-family:inherit; }' +
  '#fgRoot .fg-door i{ display:block; font:500 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace; font-style:normal;' +
  '  color:rgba(194,146,31,.86); letter-spacing:.1em; }' +
  '#fgRoot .fg-door b{ display:block; margin-top:7px; font:500 14px/1.35 "Noto Serif KR",serif;' +
  '  color:rgba(243,239,230,.80); word-break:keep-all; }' +
  '#fgRoot .fg-door em{ display:block; margin-top:3px; font:400 10px/1 "Cormorant Garamond",Georgia,serif;' +
  '  font-style:normal; color:rgba(226,214,190,.44); letter-spacing:.12em; }' +
  '#fgRoot .fg-door:hover b, #fgRoot .fg-door:focus-visible b{ color:#FFFFFF; }' +
  '#fgRoot .fg-door:focus-visible{ outline:none; background:rgba(255,255,255,.06); }' +
  '#fgRoot .fg-door.on{ border-left-color:#C2921F; background:rgba(194,146,31,.10); }' +
  '#fgRoot .fg-door.on b{ color:#FFFFFF; }' +
  '#fgRoot .fg-door.on em{ color:rgba(226,214,190,.68); }' +

  /* ── 접힘은 맨 뒤에 — 같은 무게의 규칙이라 나중에 적힌 쪽이 이긴다 ── */
  '#fgRoot.dock{ background:transparent; -webkit-backdrop-filter:none; backdrop-filter:none; pointer-events:none; }' +
  '#fgRoot.dock .fg-rail{ display:none; }' +
  '#fgRoot.dock iframe, #fgRoot.dock.rail iframe{ pointer-events:auto; left:auto; right:0; width:' + DOCK_W + 'px; }';

  let root = null, rail = null;
  let fGuide = null, fCity = null, fCont = null, fDash = null;
  let stoppedGlobe = false, docked = false;
  let CUR = 'guide';
  let DOORS = { guide: true, city: false, contract: false, dash: false };

  const desktop = () => window.matchMedia('(min-width: 1100px) and (hover: hover) and (pointer: fine)').matches;

  /* ── 문 넷의 이름 ── */
  const DOOR = {
    guide:    { ko: '신청안내',   la: 'Invitation' },
    city:     { ko: '도시별현황', la: 'Cities' },
    contract: { ko: '계약서',     la: 'Contract' },
    dash:     { ko: '대시보드',   la: 'Dashboard' }
  };
  /* ⭐ 확정되면 차례가 뒤집힌다 — 문은 그대로 넷, 순서만 한 번 돈다 */
  const order = () => (DOORS.dash ? ['dash', 'contract', 'city', 'guide'] : ['guide', 'city', 'contract']);

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
  function frame(src, title) {
    const f = document.createElement('iframe');
    f.title = title;
    f.setAttribute('allowtransparency', 'true');
    f.src = src;                                       /* 한 번만 싣는다 — 오가도 읽던 자리가 산다 */
    return f;
  }
  function build() {
    if (root) return;
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    root = document.createElement('div');
    root.id = 'fgRoot';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'EG파운더 전용메뉴');

    rail = document.createElement('nav');
    rail.className = 'fg-rail';
    rail.setAttribute('aria-label', '파운더 메뉴');
    rail.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-door]');
      if (b) show(b.getAttribute('data-door'));
    });
    root.appendChild(rail);

    fGuide = frame(GUIDE, '파운더 신청안내');
    fGuide.addEventListener('load', focusTop);
    root.appendChild(fGuide);
    document.body.appendChild(root);
  }
  function lazy(which) {
    if (which === 'city' && !fCity) { fCity = frame(CITY, 'EG 도시별 현황'); fCity.classList.add('off'); root.appendChild(fCity); }
    if (which === 'contract' && !fCont) { fCont = frame(CONT, '파운더 계약서'); fCont.classList.add('off'); root.appendChild(fCont); }
    if (which === 'dash' && !fDash) { fDash = frame(DASH, '파운더 대시보드'); fDash.classList.add('off'); root.appendChild(fDash); }
  }
  const pane = () => ({ guide: fGuide, city: fCity, contract: fCont, dash: fDash });
  const seen = (f) => f && !f.classList.contains('off');
  const top = () => seen(fDash) ? fDash : (seen(fCont) ? fCont : (seen(fCity) ? fCity : fGuide));
  function focusTop() { const f = top(); try { f.focus(); f.contentWindow.focus(); } catch (_) {} }

  /* ⭐ 종이 한 장만 보인다 — 나머지는 자리를 지킨 채 접힌다 */
  function show(which) {
    if (!root) build();
    lazy(which);
    const p = pane();
    Object.keys(p).forEach((k) => { if (p[k]) p[k].classList.toggle('off', k !== which); });
    CUR = which;
    paintRail();
    focusTop();
  }
  const showGuide = () => show('guide');
  const showCity  = () => show('city');
  /* ⭐ 계약서는 늘 펴진 채로 뜬다 — 지구를 보고 계시다 신청하셨을 수 있다 */
  function showContract() { dock(false); show('contract'); }
  function showDash()     { dock(false); show('dash'); }
  /* 계약서에서 돌아오면 매물이 하나 잠겨 있다 — 목록을 다시 세운다 */
  function backToCity() { show('city'); tell(fCity, { type: 'fc-reload' }); }

  function tell(f, msg) { try { if (f && f.contentWindow) f.contentWindow.postMessage(msg, location.origin); } catch (_) {} }

  /* ── 슬라이드 그리기 ── */
  function paintRail() {
    if (!root || !rail) return;
    const keys = order().filter((k) => DOORS[k]);
    const on = keys.length >= 2 && !docked;            /* ⭐ 문이 하나뿐이면 슬라이드를 세우지 않는다 */
    root.classList.toggle('rail', on);
    if (!on) { root.classList.remove('railin'); rail.innerHTML = ''; return; }
    rail.innerHTML =
      '<div class="hd"><b>EG파운더</b><i>Founder only</i></div>' +
      keys.map((k, i) =>
        '<button class="fg-door' + (k === CUR ? ' on' : '') + '" type="button" data-door="' + k + '"' +
        (k === CUR ? ' aria-current="page"' : '') + '>' +
        '<i>' + String(i + 1).padStart(2, '0') + '</i>' +
        '<b>' + (k === 'contract' && DOORS.dash ? '계약서 원본' : DOOR[k].ko) + '</b>' +
        '<em>' + DOOR[k].la + '</em></button>'
      ).join('');
    requestAnimationFrame(() => { if (root.classList.contains('rail')) root.classList.add('railin'); });
  }

  /* ── 문을 묻는다 — 브라우저가 아니라 DB 가 안다 ── */
  async function askDoors() {
    const sb = window.egSupa;
    if (!sb) return;
    try {
      const { data, error } = await sb.rpc('eg_founder_doors');
      if (!error && data) DOORS = Object.assign({ guide: true, city: false, contract: false, dash: false }, data);
    } catch (e) {
      console.warn('[founder_menu] 문', e);            /* ⭐ 조용히 진다 — 문을 못 물어도 신청안내는 열린다 */
    }
    paintRail();
    paintHelm();
  }

  /* ⭐ 작은 타륜 무늬 = 대시보드 직행 (확정 뒤에만 손이 닿는다) */
  function paintHelm() {
    const card = document.getElementById('dockFounderGuide');
    if (!card) return;
    const go = card.querySelector('.dock-go');
    if (!go) return;
    if (DOORS.dash) {
      go.style.pointerEvents = 'auto';
      go.style.cursor = 'pointer';
      go.dataset.egDash = '1';
      go.setAttribute('title', '파운더 대시보드');
    } else {
      go.style.pointerEvents = 'none';
      go.style.cursor = '';
      delete go.dataset.egDash;
      go.removeAttribute('title');
    }
  }

  /* ── 접기 · 펴기 ── */
  function dock(on) {
    if (!root || docked === !!on) return;
    docked = !!on;
    if (docked) { resumeGlobe(); root.classList.add('dock'); }
    else {
      root.classList.remove('dock');
      try { if (typeof window.egClearFounderTag === 'function') window.egClearFounderTag(); } catch (_) {}
      pauseGlobe();                                    /* 명패를 먼저 걷고 나서 지구를 멈춘다 */
    }
    paintRail();                                       /* 접히면 슬라이드를 걷는다 */
    tell(fCity, { type: 'fc-folded', on: docked });
  }

  async function fly(b) {
    if (!b) return;
    dock(true);
    if (typeof window.egFlyToBuilding !== 'function') {
      console.warn('[founder_menu] window.egFlyToBuilding 창구가 없다 — terra.html 판을 확인할 것');
      return;
    }
    try { await window.egFlyToBuilding(b); } catch (e) { console.warn('[founder_menu] 임장', e); }
  }

  function open(which) {
    build();
    pauseGlobe();
    root.classList.add('on');
    askDoors().then(() => {
      const first = order().filter((k) => DOORS[k])[0] || 'guide';
      const go = which && DOORS[which] ? which : first;
      if (go !== CUR || !seen(pane()[CUR])) show(go);
      else paintRail();
    });
    if (!seen(pane()[CUR])) show(CUR);                 /* 묻는 동안 빈 화면을 보여 드리지 않는다 */
    requestAnimationFrame(() => { root.classList.add('show'); focusTop(); });
  }
  function close() {
    if (!root || !root.classList.contains('on')) return;
    dock(false);                                       /* 접힌 채로 닫지 않는다 — 다음에 열면 온전한 서류 */
    root.classList.remove('show');
    setTimeout(() => { root.classList.remove('on'); resumeGlobe(); }, 300);
  }

  /* 문서가 보내는 말 */
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || typeof e.data !== 'object') return;
    switch (e.data.type) {
      case 'fg-close':
      case 'fc-close':
      case 'ct-close':
      case 'cd-close':  close();               break;
      case 'fg-link':   DOORS.city = true; showCity();        break;   /* ⑧ 을 지나오셨다 */
      case 'fc-back':   showGuide();           break;
      case 'fc-contract': DOORS.contract = true; showContract(); break; /* 신청이 섰다 */
      case 'ct-back':   backToCity();          break;
      case 'ct-signed': askDoors();            break;
      case 'fc-fly':    fly(e.data.building);  break;
      case 'fc-unfold': dock(false);           break;
    }
  });

  /* 창이 떠 있을 때 키는 terra 지구 키로 번지지 않게 먼저 받는다
     ⚠ 접혀 있을 때는 그냥 둔다 — 지구를 만지고 계신 중이다 */
  window.addEventListener('keydown', (e) => {
    if (!root || !root.classList.contains('on') || docked) return;
    if (e.key === 'Escape') close();
    e.stopPropagation();
  }, true);

  /* ── 타륜 칸 ──
     ⭐ 0917 소로 — 위의 작은 이름표는 두지 않는다. 배낭 목록(가이드북 다음)에 카드 한 장으로 잇는다.
        제목은 「EG파운더 전용메뉴」 + 원문 「Founder only」. 오른쪽 작은 타륜은 무늬 — 확정 전에는 카드 본체가 받는다 */
  function inject() {
    if (document.getElementById('dockFounderGuide')) return;
    const pera = document.getElementById('dockPera');
    if (!pera) return;
    const card = document.createElement('div');
    card.className = 'dock-card nogo orn';
    card.id = 'dockFounderGuide';
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.innerHTML = '<div class="dock-main"><span>EG파운더 전용메뉴</span></div>';
    /* ⭐ 0917 소로 — 크레덴시알 · 타벨라이처럼 원문 「Founder only」 + 오른쪽 무늬 타륜
       ⚠ terra 의 applyDockLatin · dockHelmSvg 는 감싸인 스크립트 안이라 창에서 안 보인다 → terra 가 내어 준
         window.egDockOrnament 한 손잡이로 붙인다. 아직 없으면 잠깐 기다렸다 다시 (최대 10초) */
    const ornament = () => {
      try {
        if (typeof window.egDockOrnament === 'function') { window.egDockOrnament(card, 'founder'); paintHelm(); return true; }
      } catch (_) {}
      return false;
    };
    const guide = document.getElementById('dockGuide');
    if (guide && guide.parentNode === pera) guide.insertAdjacentElement('afterend', card);
    else pera.appendChild(card);
    if (!ornament()) { let n = 0; const iv = setInterval(() => { if (ornament() || ++n >= 20) clearInterval(iv); }, 500); }
  }

  let checking = false;
  async function mayShow() {
    if (checking || document.getElementById('dockFounderGuide') || !desktop()) return;
    const sb = window.egSupa;
    if (!sb) return;
    checking = true;
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;
      const { data, error } = await sb.from('eg_founder_guide').select('slug').limit(1);
      if (!error && data && data.length) { inject(); askDoors(); }
    } catch (e) {
      console.warn('[founder_menu]', e);
    } finally {
      checking = false;
    }
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest) return;
    const helm = e.target.closest('#dockFounderGuide .dock-go[data-eg-dash]');
    if (helm) { e.stopPropagation(); open('dash'); return; }   /* ⭐ 작은 타륜 → 대시보드 직행 */
    if (e.target.closest('#dockFounderGuide')) open();
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

  window.EGFounderMenu = { open, close, showCity, showDash, dock, askDoors };
})();
