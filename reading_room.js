/* ══════════════════════════════════════════════════════════════════════════
   EG독서비행 — 방(room) 판 · reading_room.js · v0819a
   2026.08.19 소로 × 파이스 · 144회차

   ⭐ 한 줄 — 읽을 책을 손에 들고 좌석에 앉아, 창밖이 흐르는 동안 읽는다.
      0호(소로) 「곁에 두는 것이지 켜 두는 것이 아니다」 — 숲도 카페도 보라고 있는 게 아니다.

   ⚠⚠ 베스페르(vesper_room.js)의 형제다. 방 문법·소리·창 덮개·좌석 전환을 물려받되
      **항로가 다르다.** 베스페르는 해를 창에 두고 날고, 여기는 길목을 잇는 곡선을 난다.

   ⭐ 0819 소로 결정 — v2.0 에서 무른 것들
     · 기내가 자가용 제트기다 (jet_cabin_{m|d|e|n}.webp · 창 넷 · ⚠ 날개 없음)
     · 활주로·이륙 없음. **순항 고도에서 바로 시작한다**
     · 착륙 없음 · 도착 없음 — 길목 고리를 끝없이 돈다
       ⭐ 비행이 손님보다 먼저 끝나면 안 된다(14호). 책을 덮는 곳이 그날의 도착지다
     · 노선은 좌표 둘이 아니라 **길목 여럿 + 곡선 보간**
     · 고도는 지면 추종(sampleHeight) · 속도는 셈이 낸다(체감 일정 · 25호)

   ⚠ 이 파일이 지키는 규약 넷 (vesper_room.js 와 같다)
     ① 전체가 IIFE. 밖으로 내놓는 것은 window.egReading 하나뿐
     ② viewer 를 새로 안 만든다 — 「한 문서 · 한 root」. 하늘도 다시 안 건다
     ③ enter 가 바꾼 것을 leave 가 되돌린다. 리스너는 EGR_on 이 전부 적어 둔다
     ④ CSS 는 전량 #readingRoom 으로 스코프

   ⚠ 캐시 꼬리표 — 이 파일을 고치면 부르는 쪽(terra.html)의 ?v= 도 함께 올린다

   창구
     egReading.enter(viewer, route)   방을 세우고 비행을 시작한다
     egReading.leave()                비행을 세우고 카메라·화면을 terra 로 되돌린다
     egReading.routes()               실린 노선 목록
   ══════════════════════════════════════════════════════════════════════════ */
(function () {

  var VERSION = "0819d";

  var ROOT = null;                 /* 방 뿌리 — 이 아래로만 산다 */
  var EXIT = null;                 /* 나가는 문 — 방 밖에 선다 */
  var STYLED = false;
  var LISTENERS = [];
  var TIMERS = [];
  var CAM = null;                  /* terra 카메라를 적어 두는 곳 */
  var HOMEWARD = false;
  var viewer = null;
  var flight = null;
  var side = -1;                   /* 좌석 — 왼창 −1 · 오른창 +1 (v1.4 8호) */
  /* ⚠⚠ 뱅크 상한 — 0819 소로가 taxi 실사용에서 잡으신 값.
     10도를 넘으면 창밖 지평선이 너무 기울어 몸이 먼저 이상하다고 안다.
     실제 여객기 표준 선회도 25~30도이나, 그건 「타고 있는 사람」 기준이고
     화면으로 보는 사람에게는 몸이 안 따라오므로 훨씬 작아야 한다. */
  var ROLL_MAX = 10;
  var groundH = 0;

  /* ⚠ 방 밖에 두는 물건은 이 배열에만 더한다. 선택자를 손으로 잇지 않는다.
     0818 하루에 같은 병을 두 번 겪었다(#vesperExit 낮 · 인장 둘 밤).
     stamp_press.js 는 도크·플래시를 document.body 직계로 붙이므로 마스크에 정통으로 걸린다. */
  var KEEP = ["#cesiumContainer", "#readingRoom", "#readingExit", "#egStampDock", "#egStampFlash"];

  function EGR_later(fn, ms) { var t = setTimeout(fn, ms); TIMERS.push(t); return t; }
  function EGR_clearTimers() { TIMERS.forEach(function (t) { clearTimeout(t); }); TIMERS.length = 0; }
  function EGR_on(el, type, fn, opt) {
    el.addEventListener(type, fn, opt); LISTENERS.push([el, type, fn, opt]);
  }
  function EGR_off() {
    LISTENERS.forEach(function (a) { try { a[0].removeEventListener(a[1], a[2], a[3]); } catch (e) { } });
    LISTENERS.length = 0;
  }

  /* ══════════════════════════════════════════════════════════════════
     노선 — 길목을 잇는다. 좌표 둘이 아니다.
     ⚠ 표가 아직 없다. 첫 노선 한 벌을 여기 싣고, 표가 서면 이 배열만 갈아 끼운다.
     ⭐ 길목이 곧 뷰포인트다 — 26호(뷰포인트 출처)가 이것으로 닫혔다.
     ══════════════════════════════════════════════════════════════════ */
  var ROUTES = [{
    code: "alps_traverse",
    name: "알프스 종단",
    face: "몽블랑에서 돌로미티까지 · 빙하와 석회암 탑",   /* 타륜 카드 둘째 줄 */
    kind: "tour",                    /* tour 관광기 · liner 여객기 */
    felt: 220,                       /* ⭐ 체감(속도÷고도). 25호 — 이 값 하나가 속도를 다 정한다 */
    agl: 700,                        /* 지면 위 기본 고도(m) — 「스치듯」 */
    aglLow: 450, aglHigh: 1600,      /* 봉우리 옆 · 계곡 위 */
    loop: true,                      /* ⭐ 닫힌 고리 — 끝나지 않는다(13·14호) */
    /* ⚠ 봉우리 정상이 아니라 옆구리를 스치게 3~6km 비켜 찍었다.
         정상 위를 넘으면 지면추종 고도가 급히 오르내려 멀미가 난다. */
    legs: [
      [46.28500, 6.28000, "제네바 · 레만호 동안"],
      [45.95000, 6.72000, "샤모니 계곡"],
      [45.80500, 6.82000, "몽블랑 남서 사면"],
      [45.87000, 7.05000, "발 페레 · 국경"],
      [45.94000, 7.68500, "마터호른 남면"],
      [46.00500, 7.79000, "체르마트 · 고르너"],
      [46.44000, 8.06000, "알레치 빙하"],
      [46.57000, 8.41500, "푸르카 · 론 빙하"],
      [46.40000, 9.88000, "엥가딘 · 베르니나"],
      [46.51000, 10.54500, "스텔비오 · 오르틀러"],
      [46.61833, 12.30500, "트레 치메"],
      [46.53500, 12.13500, "코르티나 · 돌로미티"]
    ]
  }];
  function routes() { return ROUTES.map(function (r) { return { code: r.code, name: r.name, face: r.face }; }); }
  function routeBy(code) {
    for (var i = 0; i < ROUTES.length; i++) if (ROUTES[i].code === code) return ROUTES[i];
    return ROUTES[0];
  }

  /* ── 기내 판 실측값 (jet_cabin_*.webp · 941 × 1672) ────────────────
     ⚠ 0819 실측. 넉 벌의 창 좌표가 최대 2.3px 안에서 일치함을 확인했다.
     ⭐ 날개가 없다 — .wing 두 겹·되뒤집기·wing_blank 가 통째로 빠졌다. */
  var PLATE_W = 941, PLATE_H = 1672;
  var CANVAS = { l: 3.613, t: 25.837, w: 71.838, h: 28.947 };     /* 창 넷을 다 덮는 한 장 */
  var WINS = [                                                    /* 창 덮개가 앉을 곳 */
    { l: 3.613, t: 25.837, w: 27.630, h: 28.947 },
    { l: 38.682, t: 28.947, w: 14.665, h: 19.378 },
    { l: 58.555, t: 30.742, w: 8.714, h: 10.287 },
    { l: 69.926, t: 31.758, w: 5.526, h: 9.151 }
  ];
  var CABIN = { m: "jet_cabin_m.webp", d: "jet_cabin_d.webp", e: "jet_cabin_e.webp", n: "jet_cabin_n.webp" };

  /* ── 셈 ──────────────────────────────────────────────────────── */
  var Re_M = 6371000;
  function $(s) { return document.getElementById(s); }
  function deg(r) { return (Cesium.Math.toDegrees(r) + 360) % 360; }
  function horizonDeg(rel) { return -Cesium.Math.toDegrees(Math.acos(Re_M / (Re_M + rel))); }

  function stepFrom(lat, lon, brgDeg, km) {
    var R = 6371.0088, d = km / R;
    var p1 = Cesium.Math.toRadians(lat), l1 = Cesium.Math.toRadians(lon);
    var b = Cesium.Math.toRadians(brgDeg);
    var p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(b));
    var l2 = l1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(p1),
      Math.cos(d) - Math.sin(p1) * Math.sin(p2));
    return [Cesium.Math.toDegrees(p2), ((Cesium.Math.toDegrees(l2) + 540) % 360) - 180];
  }
  function gcKm(a, b, c, d) {
    var R = 6371.0088, p1 = Cesium.Math.toRadians(a), p2 = Cesium.Math.toRadians(c);
    var dp = Cesium.Math.toRadians(c - a), dl = Cesium.Math.toRadians(d - b);
    var x = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function bearing(a, b, c, d) {
    var p1 = Cesium.Math.toRadians(a), p2 = Cesium.Math.toRadians(c), dl = Cesium.Math.toRadians(d - b);
    var y = Math.sin(dl) * Math.cos(p2);
    var x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    return (Cesium.Math.toDegrees(Math.atan2(y, x)) + 360) % 360;
  }
  /* 각도 차 −180..180 — 방위를 부드럽게 좇을 때 쓴다 */
  function angDiff(a, b) { var d = ((b - a + 540) % 360) - 180; return d; }

  /* ⭐ Catmull-Rom — 길목을 부드럽게 잇는다.
     ⚠ 직선으로 이으면 길목마다 방향이 툭 꺾여 창밖이 홱 돈다. */
  function catmull(p0, p1, p2, p3, t) {
    var t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2 * p1) + (-p0 + p2) * t
      + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
      + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  }

  /* ══════════════════════════════════════════════════════════════════
     비행 — 길목 고리를 끝없이 돈다
     ⚠⚠ 리스너 전체를 감싼다. onTick 안쪽만 감쌌더니 setView 에서 난 오류가
        그대로 Cesium 렌더 루프를 세웠다(0817 두 번). 여기서 나는 어떤 오류도 비행을 못 멈춘다.
     ══════════════════════════════════════════════════════════════════ */
  function cruise(route, opt) {
    opt = opt || {};
    var L = route.legs, N = L.length;
    var seg = 0, u = 0;              /* 지금 몇 번째 구간의 어디쯤인가 */
    /* ⚠⚠ 0819 소로 — 「멀리 산을 두고 도시 위를 빙글빙글」.
       첫 판은 목표점을 **좇아가는** 셈이었다. 방위를 한 프레임에 조금씩만 돌리는데
       돌 수 있는 것보다 목표가 옆에 오면 영원히 그 둘레를 돈다 — 꼬리를 쫓는 개다.
       게다가 첫 구간은 Catmull 제어점에 마지막 길목(코르티나·동쪽 끝)이 끼어들어
       목표 자체가 옆으로 틀어져 있었다.
       ⭐ 좇지 않는다. **곡선 위에 태운다** — 자리도 방위도 곡선이 직접 준다.
         표류가 구조적으로 없다. 앞으로 가는 것이 보장된다. */
    function P(i2) { var k = ((i2 % N) + N) % N; return L[k]; }
    function onCurve(sg, uu) {
      return [catmull(P(sg - 1)[0], P(sg)[0], P(sg + 1)[0], P(sg + 2)[0], uu),
              catmull(P(sg - 1)[1], P(sg)[1], P(sg + 1)[1], P(sg + 2)[1], uu)];
    }
    var pos = onCurve(0, 0);
    var lat = pos[0], lon = pos[1];
    var ahead = onCurve(0, 0.02);
    var hd = bearing(lat, lon, ahead[0], ahead[1]);
    var roll = 0, tp = performance.now(), gT = 0, dist = 0, errN = 0;
    var rel = route.agl, settled = false;

    var off = viewer.clock.onTick.addEventListener(function () {
      try {
        var now = performance.now(), dt = Math.min((now - tp) / 1000, 0.25); tp = now;

        /* ── 지면 높이 — 1초에 한 번만 잰다.
           ⚠ 절대고도로 날면 몽블랑(4,808m)에서 산속으로 들어간다 */
        if (now - gT > 1000) {
          gT = now;
          try {
            var hh = viewer.scene.sampleHeight(Cesium.Cartographic.fromDegrees(lon, lat));
            if (Cesium.defined(hh)) {
              groundH = hh;
              /* ⭐ 0819 소로 — 「초기에 계속 올라가는 느낌」.
                 시작 rel(agl 700)과 첫 지형이 원하는 rel(계곡 1600)이 달라
                 30초를 기어 올라가고 있었다. 첫 측정 때 한 번에 맞춰 앉힌다 —
                 순항 중 진입이므로(활주로 생략) 처음부터 순항 고도가 맞다. */
              if (!settled) {
                settled = true;
                if (groundH > 2600) rel = route.aglLow;
                else if (groundH < 900) rel = route.aglHigh;
                else rel = route.agl;
              }
            }
          } catch (e) { }
        }

        /* ── ⭐ 속도는 셈이 낸다 (v2.0 25호) — 체감(속도÷고도)을 일정하게 */
        var kmh = Math.max(60, Math.min(route.felt * (rel / 1000), 900));
        var km = kmh * dt / 3600; dist += km;

        /* ── ⭐ 곡선 위를 나아간다 — u 를 거리만큼 민다 */
        var segKm = Math.max(gcKm(P(seg)[0], P(seg)[1], P(seg + 1)[0], P(seg + 1)[1]), 0.001);
        u += km / segKm;
        while (u >= 1) { u -= 1; seg = (seg + 1) % N;
          segKm = Math.max(gcKm(P(seg)[0], P(seg)[1], P(seg + 1)[0], P(seg + 1)[1]), 0.001); }

        var here = onCurve(seg, u);
        lat = here[0]; lon = here[1];

        /* 방위 — 곡선의 접선. 조금 앞의 점을 본다 */
        var ua = u + 0.02, sg2 = seg;
        if (ua >= 1) { ua -= 1; sg2 = (seg + 1) % N; }
        var nx = onCurve(sg2, ua);
        var want = bearing(lat, lon, nx[0], nx[1]);
        /* ⭐ 뱅크 — 방위가 도는 빠르기에서 나온다. 상한 10°(0819 소로 · taxi 실사용).
           ⚠ 곡선이 주는 방위라 홱 돌 일이 없지만, 길목을 넘는 순간을 위해 눅인다 */
        var turnRate = angDiff(hd, want) / Math.max(dt, 0.001);        /* °/s */
        hd = (hd + angDiff(hd, want) * Math.min(dt * 3.0, 1) + 360) % 360;
        var wantRoll = Math.max(-ROLL_MAX, Math.min(ROLL_MAX, turnRate * 1.1));
        var ease = (Math.abs(wantRoll) < Math.abs(roll)) ? 1.9 : 1.1;   /* 펼 때 조금 빠르게 */
        roll += (wantRoll - roll) * Math.min(dt * ease, 1);

        /* ── 고도 — 계곡에서는 높이, 봉우리 옆에서는 낮게 */
        var wantRel = route.agl;
        if (groundH > 2600) wantRel = route.aglLow;
        else if (groundH < 900) wantRel = route.aglHigh;
        rel += (wantRel - rel) * Math.min(dt * 0.25, 1);       /* 아주 천천히 */

        /* 창가 시점 — 창밖이 지나간다(v1.4 8호). 왼쪽 창가는 빼기다 */
        var look = Cesium.Math.toRadians((hd + side * 90 + 360) % 360);
        var pit = horizonDeg(rel) + (opt.sky || 6);

        if (!window.__egShut) {
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, groundH + rel),
            orientation: { heading: look, pitch: Cesium.Math.toRadians(pit), roll: Cesium.Math.toRadians(roll) }
          });
        }

        /* ⚠ 계기판 한 줄이 죽어도 Cesium 렌더가 통째로 멈추지 않게 감싼다(0817) */
        if (opt.onTick) {
          try { opt.onTick({ lat: lat, lon: lon, hd: hd, kmh: kmh, rel: rel, ground: groundH, dist: dist, leg: P(seg)[2], next: P(seg + 1)[2], roll: roll }); }
          catch (err) {
            if (!window.__egRTickWarned) { window.__egRTickWarned = true; console.error("[EG] 계기판 오류 — 비행은 계속합니다:", err); }
          }
        }
      } catch (fatal) {
        errN++;
        if (errN < 3) console.error("[EG] 독서비행 오류 " + errN + "회:", fatal);
        if (errN === 20) { console.error("[EG] 오류가 잦아 비행을 멈춥니다"); off(); }
      }
    });
    return { stop: off };
  }

  /* ══ 겉옷 ══════════════════════════════════════════════════════ */
  function mountStyle() {
    if (STYLED) return; STYLED = true;
    var HOST = "body.reading-on > *" + KEEP.map(function (s) { return ":not(" + s + ")"; }).join("") + "{display:none !important}";
    var css = document.createElement("style");
    css.id = "readingRoomCss";
    css.textContent = HOST + `
/* ⚠⚠ 0819 — 첫 판에서 스크롤 방식으로 지었다가 창밖이 통째로 어긋났다.
   #cesiumContainer 는 body 직계라 방이 스크롤해도 안 따라온다.
   v1.4 함정 ㉢ 을 주석에 옮겨 적어 놓고 정반대로 지은 것이다.
   ⭐ 베스페르 문법으로 고친다 — 스크롤이 없다. 판도 창밖도 fixed 이고,
     휠이 panY 하나를 바꾸면 둘이 함께 밀린다. 좌표계가 하나여야 안 어긋난다. */
#readingRoom{position:fixed;inset:0;z-index:5;pointer-events:none;overflow:hidden}
#readingRoom #fit{position:fixed;pointer-events:none}
#readingRoom #plate{position:absolute;left:0;top:0;width:100%;height:100%;
  pointer-events:none;z-index:6;background-size:100% 100%;background-repeat:no-repeat}
#readingRoom .shade{position:fixed;z-index:5;
  background:linear-gradient(#d8cfc0,#cdc3b2 62%,#c0b6a4);
  box-shadow:0 4px 12px rgba(0,0,0,.28) inset;
  transform:translateY(-101%);transition:transform .75s cubic-bezier(.35,.9,.3,1)}
#readingRoom.shut .shade{transform:translateY(0)}
#readingRoom #hud{position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:12;
  pointer-events:none;font:12px/1.6 Georgia,serif;color:rgba(240,232,214,.72);
  text-shadow:0 1px 6px rgba(0,0,0,.85);white-space:nowrap;letter-spacing:.02em}
#readingExit{position:fixed;right:18px;top:18px;z-index:14;width:38px;height:38px;
  border-radius:50%;cursor:pointer;pointer-events:auto;font-size:17px;line-height:1;
  background:radial-gradient(circle at 35% 30%,#3f3524,#241d12);
  border:1px solid #43371f;color:#c9b586;
  box-shadow:inset 0 2px 5px rgba(0,0,0,.6),0 1px 0 rgba(255,244,210,.35)}
#readingExit:hover{border-color:#d9bd7e;color:#f0dfb4}`;
    document.head.appendChild(css);
  }

  function mountHtml() {
    ROOT = document.createElement("div");
    ROOT.id = "readingRoom";
    ROOT.innerHTML = '<div id="fit"><div id="plate"></div></div><div id="hud"></div>';
    document.body.appendChild(ROOT);
    EXIT = document.createElement("button");
    EXIT.id = "readingExit"; EXIT.type = "button";
    EXIT.textContent = "×"; EXIT.title = "내리기";
    document.body.appendChild(EXIT);
    EGR_on(EXIT, "click", function () { leave(); });
  }

  /* ══ 판 세우기 ═══════════════════════════════════════════════
     ⚠ 세로 9:16 — 폭은 언제나 화면을 채우고 위아래가 잘린다(v1.4 9호).
     ⭐ 스크롤이 아니다. 판·창밖·덮개가 모두 fixed 이고 panY 하나로 함께 민다.
       ⚠⚠ 좌표계를 둘로 나누면 창밖만 제자리에 남는다(0819 실제로 겪음). */
  var panY = 0, panMin = 0, panMax = 0;

  function layout() {
    if (!ROOT) return;
    var R = PLATE_W / PLATE_H;
    var vw = window.innerWidth, vh = window.innerHeight;
    var w = (vw / vh < R) ? Math.max(vh * R, vw) : vw;
    var h = w / R;
    var cx = (vw - w) / 2;
    /* 첫 창의 세로 한가운데가 화면 한가운데에 오도록 판을 세운다 */
    var focus = (WINS[0].t + WINS[0].h / 2) / 100;
    var py = vh * 0.5 - h * focus;

    panMin = -(h + py - vh);          /* 더 내릴 수 없는 한계 (판 아래끝이 화면 바닥) */
    panMax = -py;                     /* 더 올릴 수 없는 한계 (판 위끝이 화면 천장) */
    if (panMin > panMax) { var t0 = panMin; panMin = panMax; panMax = t0; }
    panY = Math.max(panMin, Math.min(panMax, panY));
    var top = py + panY;

    var fit = ROOT.querySelector("#fit");
    fit.style.left = cx + "px"; fit.style.top = top + "px";
    fit.style.width = w + "px"; fit.style.height = h + "px";

    /* ⭐ 창밖 — 판과 똑같은 화면 좌표. 둘 다 fixed 라 함께 움직인다 */
    var cv = document.getElementById("cesiumContainer");
    if (cv) {
      cv.style.position = "fixed";
      cv.style.left = (cx + w * CANVAS.l / 100) + "px";
      cv.style.top = (top + h * CANVAS.t / 100) + "px";
      cv.style.width = (w * CANVAS.w / 100) + "px";
      cv.style.height = (h * CANVAS.h / 100) + "px";
      cv.style.right = "auto"; cv.style.bottom = "auto";   /* ⚠ terra 의 inset:0 을 푼다 */
      cv.style.zIndex = "4";
      try { if (viewer) viewer.resize(); } catch (e) { }
    }
    /* 창 덮개 — 창보다 조금 크게 잡아 틈이 안 보이게 */
    var sh = ROOT.querySelectorAll(".shade");
    for (var i = 0; i < sh.length; i++) {
      var W = WINS[i]; if (!W) continue;
      sh[i].style.left = (cx + (W.l - 1.2) / 100 * w) + "px";
      sh[i].style.top = (top + (W.t - 1.2) / 100 * h) + "px";
      sh[i].style.width = ((W.w + 2.4) / 100 * w) + "px";
      sh[i].style.height = ((W.h + 2.4) / 100 * h) + "px";
    }
  }

  /* ⭐ 휠 — 기내를 위아래로 본다. 창밖은 함께 움직이되 비행은 안 멈춘다.
     ⚠ #readingRoom 이 pointer-events:none 이라 휠이 안 닿는다. window 에 건다. */
  function onWheel(e) {
    if (!ROOT) return;
    e.preventDefault();
    panY = Math.max(panMin, Math.min(panMax, panY - e.deltaY * 0.9));
    layout();
  }
  /* 손가락으로도 — 폰·태블릿 */
  var tY = null;
  function onTouchStart(e) { if (e.touches && e.touches.length === 1) tY = e.touches[0].clientY; }
  function onTouchMove(e) {
    if (tY === null || !e.touches || e.touches.length !== 1) return;
    var y = e.touches[0].clientY;
    panY = Math.max(panMin, Math.min(panMax, panY + (y - tY)));
    tY = y; layout(); e.preventDefault();
  }
  function onTouchEnd() { tY = null; }

  /* ⭐ 기내 넉 벌 — 현지 시각에 맞춰 고른다.
     ⚠ 콜레주·미술관과 같은 m·d·e·n 문법. 창밖은 Cesium 이 실시간으로 그린다. */
  function cabinFor(hour) {
    if (hour < 5 || hour >= 20) return CABIN.n;
    if (hour < 9) return CABIN.m;
    if (hour < 17) return CABIN.d;
    return CABIN.e;
  }
  function paintCabin(lon) {
    var plate = ROOT && ROOT.querySelector("#plate"); if (!plate) return;
    var d = new Date();
    var utc = d.getUTCHours() + d.getUTCMinutes() / 60;
    var local = (utc + (lon || 0) / 15 + 24) % 24;          /* 태양시 어림 */
    var f = cabinFor(local);
    if (plate.__f !== f) { plate.__f = f; plate.style.backgroundImage = "url(" + f + ")"; }
  }

  /* ══ 카메라 되돌리기 ══════════════════════════════════════════════ */
  function saveCam(v) {
    try {
      var c = v.camera, p = Cesium.Cartographic.fromCartesian(c.positionWC);
      CAM = { lat: Cesium.Math.toDegrees(p.latitude), lon: Cesium.Math.toDegrees(p.longitude), hgt: p.height,
              hd: c.heading, pit: c.pitch, rol: c.roll };
      /* ⚠ 말이 안 되는 좌표는 적지 않는다 — 궤도가 걸려 있으면 −6373km 같은 헛것이 나온다 */
      if (!isFinite(CAM.hgt) || CAM.hgt < -1000 || CAM.hgt > 1e8) { CAM = null; HOMEWARD = true; }
    } catch (e) { CAM = null; HOMEWARD = true; }
  }
  function restoreCam(v) {
    if (!v) return;
    var cv = document.getElementById("cesiumContainer");
    if (cv) { cv.style.position = ""; cv.style.left = ""; cv.style.top = "";
              cv.style.right = ""; cv.style.bottom = "";
              cv.style.width = ""; cv.style.height = ""; cv.style.zIndex = ""; }
    try { v.resize(); } catch (e) { }
    if (!CAM) { HOMEWARD = true; return; }
    try {
      v.camera.cancelFlight();
      v.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(CAM.lon, CAM.lat, CAM.hgt),
        orientation: { heading: CAM.hd, pitch: CAM.pit, roll: CAM.rol }
      });
      /* ⚠ 한 프레임 뒤 한 번 더 — 남의 트윈이 덮는 일이 있다 */
      requestAnimationFrame(function () {
        try { v.camera.cancelFlight(); v.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(CAM.lon, CAM.lat, CAM.hgt),
          orientation: { heading: CAM.hd, pitch: CAM.pit, roll: CAM.rol } }); } catch (e) { }
      });
    } catch (e) { HOMEWARD = true; }
    CAM = null;
  }

  /* ══ 착석 ══════════════════════════════════════════════════════ */
  function bootRoom(hostViewer, route) {
    viewer = hostViewer;
    /* 창 덮개 넷 — 판 뒤에 두면 창 구멍 모양대로 잘린다 */
    var fit = ROOT.querySelector("#fit");
    WINS.forEach(function () {
      var s = document.createElement("div"); s.className = "shade"; fit.insertBefore(s, fit.firstChild);
    });
    document.body.classList.add("reading-on");
    layout();
    EGR_on(window, "resize", layout);
    EGR_on(window, "wheel", onWheel, { passive: false });
    EGR_on(window, "touchstart", onTouchStart, { passive: true });
    EGR_on(window, "touchmove", onTouchMove, { passive: false });
    EGR_on(window, "touchend", onTouchEnd, { passive: true });
    paintCabin(route.legs[0][1]);

    var hud = ROOT.querySelector("#hud"), hudT = 0;
    flight = cruise(route, {
      sky: 6,
      onTick: function (s) {
        var now = performance.now();
        if (now - hudT < 400) return; hudT = now;
        paintCabin(s.lon);
        hud.textContent = route.name + " · " + s.leg + " → " + s.next
          + "  ·  지면 위 " + Math.round(s.rel) + "m · " + Math.round(s.kmh) + "km/h";
      }
    });
    console.log("%c[EG] reading_room " + VERSION + " — " + route.name + " · 길목 " + route.legs.length + "점 · 끝없는 고리", "color:#c9a84c");
    return true;
  }

  /* ══ 창구 ══════════════════════════════════════════════════════ */
  function enter(hostViewer, code) {
    if (!hostViewer) { console.error("[EG] 독서비행 — viewer 를 못 받았습니다."); return false; }
    if (ROOT) leave();
    mountStyle(); mountHtml();

    /* ⚠⚠⚠ 궤도 사슬부터 푼다. 순서가 중요하다(0818 밤 진범).
       ① completeFlight — 가려던 곳까지 보낸다. 취소하면 가던 길 한복판 좌표를 적게 된다
          ⚠ 비행이 끝나면서 궤도를 새로 켜는 길이 terra 에 넷 있다. 켜게 두고 나서 끈다
       ② stopOrbit — 궤도 tick 이 매 프레임 카메라를 도로 끌어간다
       ③ lookAtTransform(IDENTITY) — 좌표계를 세계로. 안 그러면 camera.position 이 상대 좌표다
       ④ 그러고 나서 적는다 */
    try { hostViewer.camera.completeFlight(); } catch (e) { }
    try { if (typeof window.stopOrbit === "function") window.stopOrbit(); } catch (e) { }
    try { hostViewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY); } catch (e) { }
    saveCam(hostViewer);

    /* ⚠ 이 지구가 곧 창밖이다. 재우면 창이 얼어붙는다 */
    try { hostViewer.useDefaultRenderLoop = true; } catch (e) { }

    var ok = false;
    try { ok = bootRoom(hostViewer, routeBy(code)); }
    catch (err) { console.error("[EG] 독서비행 착석 실패:", err); leave(); return false; }
    return ok;
  }

  function leave() {
    var v = viewer;
    EGR_clearTimers();
    try { if (window.__egHush) window.__egHush(); } catch (e) { }
    try { if (flight) { flight.stop(); flight = null; } } catch (e) { }
    EGR_off();
    restoreCam(v);
    if (EXIT) { try { EXIT.remove(); } catch (e) { } EXIT = null; }
    if (ROOT) { try { ROOT.remove(); } catch (e) { } ROOT = null; }
    try { document.body.classList.remove("reading-on"); } catch (e) { }
    try { if (typeof window.refreshDock === "function") window.refreshDock(false); } catch (e) { }
    if (HOMEWARD) {
      HOMEWARD = false;
      try {
        if (typeof window.goToMyHome === "function") window.goToMyHome();
        else if (typeof window.flyToParisOverview === "function") window.flyToParisOverview();
      } catch (e) { console.warn("[EG] 집으로 못 갔습니다:", e); }
    }
    viewer = null;
    console.log("[EG] 독서비행 방을 걷었습니다 — 카메라를 terra 로 되돌렸습니다.");
  }

  window.egReading = { enter: enter, leave: leave, routes: routes, version: VERSION };
})();
