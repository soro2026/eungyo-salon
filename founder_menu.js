/* ─────────────────────────────────────────────────────────────────────
   founder_menu.js — 좌측 상단 크라이슬러 버튼 › EG파운더 전용메뉴
   2026.09.23 · 파이스 (0923 타륜에서 꺼냄) · 2026.09.19 · 0919 왼쪽 슬라이드 넷 (0918 도시별현황 · EG에스테이트 투어 위에)

   ① ⭐⭐ 0923 소로 — 타륜에서 꺼냈다. 화면 좌측 상단의 크라이슬러 빌딩 버튼 하나가 입구다
      (타륜이 너무 복잡해졌고, EG 행정은 따로 구분한다). 마우스를 올리면 아래층부터 창에 불이 켜지고
      왕관 아치가 흰 금빛으로, 끝으로 첨탑에 별 하나. 메뉴가 열려 있는 동안은 불이 켜진 채로(.lit).
      ⚠ 옛 입구(타륜 배낭의 #dockFounderGuide 카드 · 작은 타륜 = 대시보드 직행)는 걷었다 —
        확정 뒤에는 첫 문이 대시보드라 버튼 하나로 충분하다
      이웃 — 현지 시계(#obsClock)는 버튼 오른쪽으로 비켜서고(body.eg-fbtn · --eg-fb-clock),
             별 항해 중(body.on-voyage)에는 항해 표지가 그 자리를 쓰니 버튼이 숨는다.
             살롱지기 나침반이 켜진 화면에서는 나침반 옆으로 한 칸 비켜선다
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

   ⭐ 0918 EG에스테이트 투어 — [보기]를 누르면 서류가 오른쪽으로 접히고 지구가 그 건물로 난다
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

  /* ── 0923 크라이슬러 버튼 — 메뉴 본체(build)보다 먼저 선다 ── */
  const BTN_CSS = '' +
  '#egFounderBtn{ position:fixed; top:12px; left:14px; z-index:30; height:52px; width:auto; margin:0; padding:0;' +
  '  border:0; background:none; cursor:pointer; display:block; line-height:0;' +
  '  filter:drop-shadow(0 2px 5px rgba(0,0,0,.65));' +
  '  transition:filter .5s ease, transform .5s cubic-bezier(.4,0,.2,1), opacity .4s ease; }' +
  '#egFounderBtn:hover, #egFounderBtn.lit{ transform:translateY(-1px);' +
  '  filter:drop-shadow(0 0 7px rgba(255,196,84,.55)) drop-shadow(0 2px 5px rgba(0,0,0,.6)); }' +
  '#egFounderBtn:focus-visible{ outline:1px solid rgba(255,201,92,.7); outline-offset:4px; border-radius:4px; }' +
  '#egFounderBtn svg{ display:block; height:100%; width:auto; overflow:visible; }' +
  '#egFounderBtn .body, #egFounderBtn .bar{ fill:#ece5d3; }' +
  '#egFounderBtn .pil{ fill:#141a26; }' +
  '#egFounderBtn .w{ fill:#1b2231; transition:fill .28s ease 0ms; }' +
  '#egFounderBtn .tip{ fill:#fff6d8; opacity:0; transform-origin:30px 1.6px; transform:scale(.2); transition:opacity .2s, transform .2s; }' +
  /* ⭐ 켤 때만 층마다 늦게(--d) — 끌 때는 한꺼번에 */
  '#egFounderBtn:hover .w, #egFounderBtn.lit .w{ fill:#ffc95c; transition:fill .16s ease var(--d); }' +
  '#egFounderBtn:hover .c, #egFounderBtn.lit .c{ fill:#ffecb8; }' +      /* 왕관은 흰 금빛 — 진짜 크라이슬러의 밤 */
  '#egFounderBtn:hover .tip, #egFounderBtn.lit .tip{ opacity:1; transform:scale(1);' +
  '  transition:opacity .25s ease var(--d), transform .35s ease var(--d); }' +
  'body.on-voyage #egFounderBtn{ opacity:0; pointer-events:none; }' +
  'body.eg-fbtn #obsClock{ left:var(--eg-fb-clock, 66px); }';

  /* 60 × 90 판 — 창 12 · 아치 창 · 왕관 아치 둘 · 첨탑 별. 켜지는 차례는 --d (아래층부터) */
  const BTN_SVG = '<svg viewBox="0 0 60 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path class="body" d="M4.5 84.4H55.5V88H4.5Z M7.5 46.7H52.5V84.6H7.5Z M14.2 41.8H45.8V46.9H14.2Z M17.2 35.9H42.8V42.0H17.2Z M20.4 29.2H39.6V36.1H20.4Z M22.2 24.6H37.8V29.4H22.2Z M23.20 24.80 C23.20 19.85 27.82 17.06 30.00 15.80 C32.18 17.06 36.80 19.85 36.80 24.80Z M25.90 18.20 C25.90 14.35 28.69 12.18 30.00 11.20 C31.31 12.18 34.10 14.35 34.10 18.20Z M28.7 13.5 L30 1.2 L31.3 13.5Z"/><path class="pil" d="M22.3 33.3H23.5V84.4H22.3ZM36.5 33.3H37.7V84.4H36.5Z"/><path class="w" style="--d:0ms" d="M11.5 76.2H18.0V82.2H11.5Z"/><path class="w" style="--d:34ms" d="M42.0 76.2H48.5V82.2H42.0Z"/><path class="w" style="--d:68ms" d="M26.4 72.0H33.6V78.8H26.4Z"/><path class="w" style="--d:102ms" d="M11.5 67.4H18.0V73.5H11.5Z"/><path class="w" style="--d:136ms" d="M42.0 67.4H48.5V73.5H42.0Z"/><path class="w" style="--d:170ms" d="M26.4 62.3H33.6V68.9H26.4Z"/><path class="w" style="--d:204ms" d="M11.5 58.6H18.0V64.6H11.5Z"/><path class="w" style="--d:238ms" d="M42.0 58.6H48.5V64.6H42.0Z"/><path class="w" style="--d:272ms" d="M26.4 52.7H33.6V59.2H26.4Z"/><path class="w" style="--d:306ms" d="M11.5 49.8H18.0V55.8H11.5Z"/><path class="w" style="--d:340ms" d="M42.0 49.8H48.5V55.8H42.0Z"/><path class="w" style="--d:374ms" d="M26.4 43.0H33.6V49.7H26.4Z"/><path class="w" style="--d:408ms" d="M25.60 40.00 C25.60 33.79 28.59 28.13 30.00 26.20 C31.41 28.13 34.40 33.79 34.40 40.00Z"/><path class="w c" style="--d:442ms" d="M25.30 24.80 C25.30 21.70 28.50 19.47 30.00 18.60 C31.50 19.47 34.70 21.70 34.70 24.80Z"/><path class="w c" style="--d:476ms" d="M28.10 18.20 C28.10 16.20 29.39 14.76 30.00 14.20 C30.61 14.76 31.90 16.20 31.90 18.20Z"/><path class="bar" d="M28.4 30.6H29.5V40.2H28.4ZM30.5 30.6H31.6V40.2H30.5Z"/><circle class="tip" style="--d:510ms" cx="30" cy="1.6" r="1.3"/></svg>';

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
    try { await window.egFlyToBuilding(b); } catch (e) { console.warn('[founder_menu] 에스테이트 투어', e); }
  }

  function open(which) {
    build();
    pauseGlobe();
    root.classList.add('on');
    lit(true);                                         /* 열려 있는 동안 빌딩은 불이 켜진 채로 */
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
    lit(false);
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

  /* ── 입구 — 0923 좌측 상단 크라이슬러 버튼 ──
     ⭐ 타륜 배낭의 카드를 걷고 버튼 하나로 옮겼다 (소로 — EG 행정은 따로)
     누르면   닫혀 있을 때 → 연다 (첫 문 — 확정 뒤에는 대시보드)
             접혀 있을 때(에스테이트 투어) → 서류를 편다
             펴져 있을 때 → 닫는다 */
  function inject() {
    if (document.getElementById('egFounderBtn')) return;
    if (!document.getElementById('egFounderBtnCss')) {
      const st = document.createElement('style');
      st.id = 'egFounderBtnCss';
      st.textContent = BTN_CSS;
      document.head.appendChild(st);
    }
    const b = document.createElement('button');
    b.id = 'egFounderBtn';
    b.type = 'button';
    b.title = 'EG파운더';
    b.setAttribute('aria-label', 'EG파운더 전용메뉴');
    b.innerHTML = BTN_SVG;
    b.addEventListener('click', onBtn);
    document.body.appendChild(b);
    document.body.classList.add('eg-fbtn');
    place();
    /* 살롱지기 판정은 늦게 끝난다 — 나침반이 켜지는 순간 한 칸 비켜선다 */
    const cb = document.getElementById('compassBtn');
    if (cb && window.MutationObserver) new MutationObserver(place).observe(cb, { attributes: true, attributeFilter: ['style', 'class'] });
    window.addEventListener('resize', place);
  }

  /* 자리 — 나침반이 있으면 그 옆, 없으면 구석. 현지 시계는 버튼 오른쪽 끝 + 16 */
  function place() {
    const b = document.getElementById('egFounderBtn');
    if (!b) return;
    const cb = document.getElementById('compassBtn');
    const withCompass = !!(cb && getComputedStyle(cb).display !== 'none');
    b.style.left = withCompass ? '50px' : '14px';
    requestAnimationFrame(() => {
      const r = b.getBoundingClientRect();
      if (r.width) document.body.style.setProperty('--eg-fb-clock', Math.round(r.right + 16) + 'px');
    });
  }

  function lit(on) {
    const b = document.getElementById('egFounderBtn');
    if (b) b.classList.toggle('lit', !!on);
  }

  function onBtn() {
    if (root && root.classList.contains('on')) {
      if (docked) dock(false);
      else close();
      return;
    }
    open();
  }

  let checking = false;
  async function mayShow() {
    if (checking || document.getElementById('egFounderBtn') || !desktop()) return;
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

  if (window.egSupa && window.egSupa.auth && window.egSupa.auth.onAuthStateChange) {
    window.egSupa.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_IN' || ev === 'INITIAL_SESSION') mayShow(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mayShow);
  else mayShow();

  window.EGFounderMenu = { open, close, showCity, showDash, dock, askDoors };
})();
