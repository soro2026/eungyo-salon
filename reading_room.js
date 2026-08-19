/* ══════════════════════════════════════════════════════════════════════════
   EG독서비행 — 방(room) 판 · reading_room.js · v0819P
   2026.08.19 소로 × 파이스 · 144회차
   ⚠ 판번호는 아래 VERSION 하나가 정본이다. 0819e 까지 이 줄이 a 로 남아 있었다 —
     「적어 두는 것과 읽는 것은 다른 일」의 표본. 고칠 때 둘을 함께 올린다.

   ⭐ 0819f — 소로 알프스 시승 「급강하·급상승 반복, 멀미」의 처방 네 벌 + 노선 mode
     ㉠ 발밑이 아니라 앞을 본다   — 곡선 앞 12km 여덟 점의 지면 중 최고값이 기준
     ㉡ 승강률 상한               — 분당 400m. 실제 여객기 순항 승강률의 상단
                                    ⚠ 바닥(지면+120m)을 뚫을 때만 3배로 급히 오른다
     ㉢ 계단을 없앤다             — 3단(450/700/1600)을 연속 셈으로 폈다.
                                    「경계 깜빡임은 화면에 안 드러난다」고 적었던 그 줄이 진범
     ㉣ 속도를 고도에서 뗀다      — 속도가 보는 고도는 시정수 20초의 딴 값.
                                    체감(25호)은 그대로, 출렁임만 사라진다
     ㉤ 노선 mode — 'agl' 지면추종(협곡·해안) · 'msl' 절대고도(산악)
        ⭐ 알프스는 msl 이다. 실제 관광비행도 알프스를 지면추종으로 안 난다 —
          비행기는 평평하고 산이 솟았다 가라앉는다. 그것이 창밖의 실물이다.
        ⚠ msl 에도 그물은 남는다 — 앞 지면이 순항고도를 넘보면 ㉡의 걸음으로 밀어올린다

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

  var VERSION = "0819P";

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
    /* ⭐ 0819f — 소로 시승 뒤 msl 로 전환. 지면추종은 알프스에서 급강하·급상승을 낳는다.
       msl 3600m — 계곡(400~1500m) 위로는 시원하게 높고, 고개(2000~2800m)와는 다정하게
       가깝다. 몽블랑·마터호른 옆구리(3000m대)를 지날 때만 그물이 살짝 밀어올린다. */
    mode: "msl",                     /* 'msl' 절대고도(산악) · 'agl' 지면추종(협곡·해안) */
    msl: 3600,                       /* 순항 해발고도(m) — mode:'msl' 일 때 */
    floor: 250,                      /* 앞 지면과의 최소 여유(m) — 그물 */
    agl: 700,                        /* ↓ 셋은 mode:'agl' 노선이 쓴다. 알프스는 안 읽는다 */
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
  /* ⚠ 0819P — CANVAS 사각형을 걷었다. 창밖이 화면 전체를 덮으므로 더는 안 쓴다.
     ⭐ 남겨 두면 다음 사람이 「창밖 크기」를 여기서 찾다가 헛돈다. 값을 지운다.
     var CANVAS = { l:3.613, t:25.837, w:71.838, h:28.947 };   ← 0819N 까지 쓰던 것 */
  var WINS = [                                                    /* 창 덮개가 앉을 곳 */
    { l: 3.613, t: 25.837, w: 27.630, h: 28.947 },
    { l: 38.682, t: 28.947, w: 14.665, h: 19.378 },
    { l: 58.555, t: 30.742, w: 8.714, h: 10.287 },
    { l: 69.926, t: 31.758, w: 5.526, h: 9.151 }
  ];
  var CABIN = { m: "jet_cabin_m.webp", d: "jet_cabin_d.webp", e: "jet_cabin_e.webp", n: "jet_cabin_n.webp" };

  /* ── 좌석 모니터 (0819h) ─────────────────────────────────────────
     ⚠ 화면이 네모가 아니라 **사다리꼴**이다 — 0819 실측(검정 화소 연결성분 · 네 변 직선 맞춤).
       오른쪽이 앞으로 나와 17px 길다. 네모를 얹으면 모서리가 12px 뜬다.
     ⭐ 네 점 사영변환(matrix3d)으로 평면 UI 를 그 자리에 앉힌다 — 부품 없이 셈 여덟 줄.
     좌표는 판(941×1672) 기준 %. 테두리 안쪽으로 0.5% 들여 앉힌다. */
  var MON = {
    tl: [58.02, 42.02], tr: [93.89, 42.35],
    br: [92.92, 56.16], bl: [57.62, 54.81],
    w: 620, h: 424                       /* UI 원판 크기(px) — 실물 비율 1.46 근사 */
  };
  /* 단위 사각형(w×h) → 임의 네 점 사영변환. 표준 호모그래피 셈 —
     기저 세 점으로 아핀을 풀고 넷째 점이 원근(g·h)을 정한다 */
  function homography(w2, h2, p) {   /* p = [[x,y]×4] TL TR BR BL (px) */
    var x0 = p[0][0], y0 = p[0][1], x1 = p[1][0], y1 = p[1][1];
    var x2 = p[2][0], y2 = p[2][1], x3 = p[3][0], y3 = p[3][1];
    var dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
    var sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
    var den = dx1 * dy2 - dx2 * dy1;
    var g = (sx * dy2 - dx2 * sy) / den, hh = (dx1 * sy - sx * dy1) / den;
    var a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, c = x0;
    var d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3, f = y0;
    /* 열 우선(matrix3d) · (0..1)² 이므로 w·h 로 나눠 넣는다 */
    return "matrix3d(" + [a / w2, d / w2, 0, g / w2,
                          b / h2, e / h2, 0, hh / h2,
                          0, 0, 1, 0,
                          c, f, 0, 1].join(",") + ")";
  }

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

  /* ⭐⭐ 곡선을 모듈 수준에 둔다 — 비행과 항로도가 **같은 곡선**을 봐야 한다.
     ⚠ cruise 안에만 두고 지도가 제 벌로 다시 셈하면, 언젠가 한쪽만 고쳐 놓고
       「지도와 실제가 다르다」를 며칠 헤매게 된다(22호의 사촌 — 같은 것을 두 곳에서 관리). */
  function legAt(route, i2) {
    var L = route.legs, N = L.length, k = ((i2 % N) + N) % N;
    return L[k];
  }
  function curveOf(route, sg, uu) {
    return [catmull(legAt(route, sg - 1)[0], legAt(route, sg)[0], legAt(route, sg + 1)[0], legAt(route, sg + 2)[0], uu),
            catmull(legAt(route, sg - 1)[1], legAt(route, sg)[1], legAt(route, sg + 1)[1], legAt(route, sg + 2)[1], uu)];
  }
  /* 고리 전체를 점으로 — 구간마다 per 점씩 */
  function curvePoints(route, per) {
    var out = [], N = route.legs.length, s, j;
    for (s = 0; s < N; s++) for (j = 0; j < per; j++) out.push(curveOf(route, s, j / per));
    out.push(curveOf(route, 0, 0));           /* 고리를 닫는다 */
    return out;
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
    function P(i2) { return legAt(route, i2); }
    function onCurve(sg, uu) { return curveOf(route, sg, uu); }
    var pos = onCurve(0, 0);
    var lat = pos[0], lon = pos[1];
    var ahead = onCurve(0, 0.02);
    var hd = bearing(lat, lon, ahead[0], ahead[1]);
    var roll = 0, tp = performance.now(), gT = 0, dist = 0, errN = 0;
    /* ⭐⭐ 0819f — 고도의 정본은 rel(지면 위)이 아니라 alt(해발)다.
       rel 로 들면 지면이 계단일 때 카메라도 계단이 된다 — 소로 시승의 멀미가 그것.
       alt 는 ㉡의 걸음(분당 400m)으로만 움직이므로 지면이 어떻게 날뛰어도 잔잔하다. */
    /* ⚠ 첫 지면 측정 전에도 카메라는 돈다 — 초기값이 땅속이면 첫 1초가 지옥이다.
       msl 노선은 순항고도로, agl 노선은 어림 1,600m 로 들고 settled 가 바로잡는다. */
    var alt = (route.mode === "msl") ? (route.msl || 3600) : 1600, settled = false;
    var spdH = 1200;                 /* ㉣ 속도가 보는 고도(지면 위) — 시정수 20초의 딴 값 */
    var prevAlt = alt, vs = 0;       /* 승강률 m/분 — 계기판이 쓴다 */
    var CLIMB = 400 / 60;            /* ㉡ 승강률 상한 m/s — 실제 여객기 순항 승강률의 상단 */
    /* ⚠⚠ 0819 소로 — 「고도가 바뀔 때 1초마다 딸꾹」.
       지면은 1초에 한 번 재는데 카메라는 매 프레임 그 값을 쓴다. 그래서 잰 순간마다
       절대고도가 계단처럼 툭 뛰었다(200km/h 면 1초에 60m — 산비탈이면 수십 m 차이).
       ⭐ 재는 주기를 줄이면 무겁다. **읽는 값을 부드럽게** 한다 — 공짜다.
         groundRaw 는 계단이고, groundH 는 그것을 좇아가는 매끈한 값이다. */
    var groundRaw = 0;
    /* ㉠ 앞보기 — 곡선 앞 열두 km 여덟 점의 지면 중 최고값. 지형추종 레이더의 셈이다.
       ⚠⚠ 0819 판1 소로 — 「1초에 1~2회 틱틱」. 아홉 점을 한 프레임에 몰아 쐈다.
          sampleHeight 는 장면을 찌르는 값비싼 손이라 그 프레임이 통째로 늦는다 —
          어제 잡은 딸꾹과 같은 모양의 병을 재는 쪽에 새로 심은 것.
       ⭐ 한 프레임에 **한 점씩** 돌아가며 잰다(150ms 간격 · 1.35초에 한 바퀴).
          재는 총량은 같고 어느 프레임도 무겁지 않다. */
    var gAhead = 0;
    var LOOK_KM = [0, 1.5, 3, 4.5, 6, 8, 10, 12];
    var LA = [];                     /* 점마다 마지막 측정값 — [0]이 발밑 */
    var laIdx = 0;
    function groundAt(sg, uu) {
      var p = onCurve(sg, uu);
      var hh = viewer.scene.sampleHeight(Cesium.Cartographic.fromDegrees(p[1], p[0]));
      return Cesium.defined(hh) ? hh : null;
    }
    function sampleOne(sg, uu, segKm0) {
      var kmAt = LOOK_KM[laIdx], sg2 = sg, uu2 = uu, sk = segKm0;
      uu2 += kmAt / sk;
      while (uu2 >= 1) {
        uu2 -= 1; sg2 = (sg2 + 1) % N;
        sk = Math.max(gcKm(P(sg2)[0], P(sg2)[1], P(sg2 + 1)[0], P(sg2 + 1)[1]), 0.001);
      }
      var k = groundAt(sg2, uu2);
      if (k !== null) {
        LA[laIdx] = k;
        if (laIdx === 0) groundRaw = k;
        var mx = null, j;
        for (j = 0; j < LA.length; j++) if (LA[j] != null && (mx === null || LA[j] > mx)) mx = LA[j];
        if (mx !== null) gAhead = mx;
      }
      laIdx = (laIdx + 1) % LOOK_KM.length;
      return k;
    }
    /* ㉢ 계단을 폈다 — agl 노선용 연속 셈. 옛 3단은 경계(900·2600)에서 목표가 900m 씩
       통째로 뛰었다 — 분당 13,500m. 그 줄에 「화면에 안 드러난다」고 적어 두기까지 했다.
       ⭐ 꺾은선 하나면 끝이다: 지면 600m 이하 → 1600 · 1500m → 700 · 2600m 이상 → 450 */
    function lerp2(g, g0, v0, g1, v1) { return v0 + (v1 - v0) * (g - g0) / (g1 - g0); }
    function aglWant(g) {
      var lo = route.aglLow || 450, mid = route.agl || 700, hi = route.aglHigh || 1600;
      if (g <= 600)  return hi;
      if (g <= 1500) return lerp2(g, 600, hi, 1500, mid);
      if (g <= 2600) return lerp2(g, 1500, mid, 2600, lo);
      return lo;
    }

    var off = viewer.clock.onTick.addEventListener(function () {
      try {
        var now = performance.now(), dt = Math.min((now - tp) / 1000, 0.25); tp = now;

        /* ── 지면 — 150ms 에 한 점씩 돌아가며(위 ㉠ 주석). 몰아 쏘지 않는다 */
        if (now - gT > 150) {
          gT = now;
          try {
            var segK0 = Math.max(gcKm(P(seg)[0], P(seg)[1], P(seg + 1)[0], P(seg + 1)[1]), 0.001);
            sampleOne(seg, u, segK0);
            /* ⭐ 0819 소로 — 「초기에 계속 올라가는 느낌」.
               첫 발밑 측정 때 목표 고도에 한 번에 맞춰 앉힌다 — 순항 중 진입이므로
               (활주로 생략) 처음부터 순항 고도가 맞다. ㉡의 걸음은 그 다음부터다. */
            if (!settled && LA[0] != null) {
              settled = true;
              groundH = groundRaw;
              alt = (route.mode === "msl")
                ? Math.max(route.msl || 3600, gAhead + (route.floor || 250))
                : groundRaw + aglWant(gAhead);
            }
          } catch (e) { }
        }

        /* ⭐ 지면을 매 프레임 부드럽게 좇는다 — 계기판·속도가 읽는 값이다.
           ⚠ 1.8 은 「1초에 약 83%를 따라잡는다」. */
        groundH += (groundRaw - groundH) * Math.min(dt * 1.8, 1);

        /* ── ⭐⭐ 고도 (0819f) — 목표는 셈이 내고, 걸음은 ㉡이 낸다 ──
           msl  순항 해발고도로 평평하게. 앞 지면이 넘보면 floor 만큼 위로 밀린다
           agl  앞 지면 최고값 기준으로 aglWant — 계곡·해안용 */
        var wantAlt = (route.mode === "msl")
          ? Math.max(route.msl || 3600, gAhead + (route.floor || 250))
          : gAhead + aglWant(gAhead);
        var dA = wantAlt - alt;
        var step = CLIMB * dt;                       /* ㉡ 분당 400m 의 걸음 */
        /* ⚠ 그물 — 발밑 지면+120m 를 뚫기 직전이면 걸음을 3배로. 멀미보다 추락이 나쁘다 */
        if (alt < groundH + 120 && dA > 0) step *= 3;
        alt += Math.max(-step, Math.min(step, dA));
        if (alt < groundH + 80) alt = groundH + 80;  /* 최후의 바닥 */
        var rel = alt - groundH;                     /* 계기판·지평선 각이 쓰는 지면 위 높이 */

        /* ── ⭐ 속도는 셈이 낸다 (25호) — 다만 ㉣ 고도 출렁임은 안 받는다.
           속도가 보는 고도는 시정수 20초의 딴 값. 체감은 일정하고 속도는 잔잔하다 */
        spdH += (rel - spdH) * Math.min(dt / 20, 1);
        var kmh = Math.max(60, Math.min(route.felt * (spdH / 1000), 900));
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

        /* ⚠ 0819f — 옛 3단 고도 블록이 여기 있었다. 진범이라 원인째 걷었다.
           고도는 위(㉠㉡㉢)에서 이미 alt 로 섰다. */

        /* 창가 시점 — 창밖이 지나간다(v1.4 8호). 왼쪽 창가는 빼기다 */
        var look = Cesium.Math.toRadians((hd + side * 90 + 360) % 360);
        var pit = horizonDeg(Math.max(rel, 80)) + (opt.sky || 6);

        if (!window.__egShut) {
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
            orientation: { heading: look, pitch: Cesium.Math.toRadians(pit), roll: Cesium.Math.toRadians(roll) }
          });
        }

        /* 승강률 — 항상 잰다. 계기판이 없어도 값은 흘러야 한다 */
        vs += ((alt - prevAlt) / Math.max(dt, 0.001) * 60 - vs) * Math.min(dt, 1); prevAlt = alt;

        /* ⚠ 계기판 한 줄이 죽어도 Cesium 렌더가 통째로 멈추지 않게 감싼다(0817) */
        if (opt.onTick) {
          try { opt.onTick({ lat: lat, lon: lon, hd: hd, kmh: kmh, rel: rel, alt: alt, vs: vs, ground: groundH, dist: dist, leg: P(seg)[2], next: P(seg + 1)[2], roll: roll,
                             seg: seg, legN: N }); }
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
    return { stop: off, routeCode: route.code };
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
#readingExit:hover{border-color:#d9bd7e;color:#f0dfb4}
/* ⭐ 창 덮개 손잡이 (0819P) — 그림 속 그것 위에 얹는 투명 판.
   따로 그리지 않는다. 손을 올리면 살짝 빛나고, 누르면 덮개가 내려온다(24호 문법). */
#readingGrip{position:fixed;z-index:11;pointer-events:auto;cursor:pointer;border-radius:99px;
  background:transparent;transition:background .2s,box-shadow .2s}
#readingGrip:hover{background:rgba(255,244,214,.13);
  box-shadow:0 0 14px 3px rgba(255,244,214,.16)}
#readingGrip::after{content:attr(data-tip);position:absolute;left:50%;top:118%;
  transform:translateX(-50%);white-space:nowrap;font-size:11px;font-family:Georgia,serif;
  color:rgba(232,228,216,0);transition:color .2s;pointer-events:none;
  text-shadow:0 1px 5px rgba(0,0,0,.9)}
#readingGrip:hover::after{color:rgba(232,228,216,.78)}
#readingRoom.out #readingGrip{display:none}
/* 편집기 — 베스페르 문법. 끌어서 옮기고 휠로 키운다 */
#readingRoom.edit #readingGrip{outline:1px dashed rgba(201,168,106,.75);cursor:move;
  background:rgba(255,244,214,.06)}
#readingRoom.edit #egrMon{outline:2px dashed rgba(201,168,106,.75);cursor:move}
#readingRoom.edit #egrMon *{pointer-events:none}   /* 끄는 동안 속 단추가 안 눌리게 */
#readingTune{position:fixed;left:18px;bottom:18px;z-index:24;display:none;pointer-events:auto;
  background:rgba(12,15,20,.93);border:1px solid #2a323f;border-radius:8px;padding:11px 15px;
  color:#9aa5b1;font:11.5px/1.75 Georgia,'Noto Serif KR',serif;max-width:320px}
#readingRoom.edit #readingTune{display:block}
#readingTune b{color:#e6d9ae;font-weight:normal}
#readingTune .sv{color:#c9a84c;font-size:11px}
/* 0819g — 좌석 전환·외부 보기·소리 */
#readingRoom.flip #plate{transform:scaleX(-1)}   /* 그림만 거울 — 글은 안 뒤집는다 */
#readingRoom.out #plate,#readingRoom.out .shade{visibility:hidden}
.readingSeat{position:fixed;top:50%;transform:translateY(-50%);z-index:13;width:34px;height:56px;
  cursor:pointer;pointer-events:auto;border:0;background:transparent;color:rgba(240,232,214,.34);
  font-size:30px;line-height:1;text-shadow:0 1px 6px rgba(0,0,0,.8);transition:color .25s}
.readingSeat:hover{color:rgba(240,232,214,.85)}
#readingSeatL{left:6px}#readingSeatR{right:6px}
#readingSnd{position:fixed;right:18px;top:64px;z-index:14;width:38px;height:38px;
  border-radius:50%;cursor:pointer;pointer-events:auto;font-size:15px;line-height:1;
  background:radial-gradient(circle at 35% 30%,#3f3524,#241d12);
  border:1px solid #43371f;color:#c9b586;
  box-shadow:inset 0 2px 5px rgba(0,0,0,.6),0 1px 0 rgba(255,244,210,.35)}
#readingSnd.off{color:#7a6c4d}
#readingFade{position:fixed;inset:0;z-index:20;background:#05070f;opacity:0;
  pointer-events:none;transition:opacity .28s}
#readingFade.on{opacity:1}
/* ══ 좌석 모니터 (0819h) — 기내 IFE 문법: 지도 화면 ↔ 책 ══════════ */
#egrMon{position:fixed;left:0;top:0;transform-origin:0 0;z-index:8;pointer-events:auto;
  background:#0a0c10;color:#cfd6de;font:13px/1.55 Georgia,'Noto Serif KR',serif;
  overflow:hidden;border-radius:6px}
#readingRoom.out #egrMon{display:none}
#egrMon .scr{position:absolute;inset:0 0 44px 0;display:none;overflow:hidden}
#egrMon .scr.on{display:block}
#egrMon .tabs{position:absolute;left:0;right:0;bottom:0;height:44px;display:flex;
  border-top:1px solid #1d2430;background:#0d1015}
#egrMon .tabs button{flex:1;border:0;background:transparent;color:#6d7887;cursor:pointer;
  font:13px Georgia,'Noto Serif KR',serif;letter-spacing:.06em}
#egrMon .tabs button.on{color:#e6d9ae;background:#12161d}
#egrInfo{padding:14px 18px 10px;display:flex;flex-direction:column}
#egrInfo .rte{font-size:14px;color:#e6d9ae;letter-spacing:.04em;flex:0 0 auto}
#egrInfo .leg{color:#8fa0b4;font-size:11.5px;margin:1px 0 6px;flex:0 0 auto}
/* ⭐ 항로도 — 고정 고리라 지도 타일이 필요 없다. 경로 자체가 지도다 */
#egrMap{flex:1 1 auto;min-height:0;position:relative}
#egrMap svg{width:100%;height:100%;display:block}
/* ⭐ 확대 다섯 단계 — 실제 IFE 지도의 그것. 겹침은 감추는 게 아니라 퍼뜨려 푼다 */
#egrZoom{position:absolute;right:2px;top:2px;display:flex;gap:3px;align-items:center}
#egrZoom button{width:19px;height:19px;padding:0;border:1px solid #263041;background:#12161d;
  color:#7d8794;border-radius:3px;cursor:pointer;font:12px/1 Georgia,serif}
#egrZoom button:hover:not(:disabled){border-color:#8a743c;color:#e6d9ae}
#egrZoom button:disabled{opacity:.3;cursor:default}
#egrZoom .lv{color:#5f6a78;font-size:9.5px;min-width:38px;text-align:center;
  font-variant-numeric:tabular-nums}
#egrMap .wpt{fill:#5f6a78;font-size:8.5px;font-family:Georgia,'Noto Serif KR',serif}
#egrMap .wpt.now{fill:#e6d9ae;font-size:9.5px}
#egrMap .wpt.hide{display:none}
/* 밑그림 — 항로보다 뒤. 있는 듯 없는 듯해야 항로가 산다 */
#egrMap .ne-lake{fill:#16222e;stroke:#22384a;stroke-width:.6}
#egrMap .ne-border{fill:none;stroke:#242c38;stroke-width:.7;stroke-dasharray:3 3}
#egrMap .ne-river{fill:none;stroke:#1c2c3a;stroke-width:.7}
#egrMap .seg{fill:none;stroke:#2c3a4c;stroke-width:1.6;stroke-linecap:round}
#egrMap .seg.now{stroke:#c9a84c;stroke-width:2.2}
#egrMap .wp{fill:#3c4a5c}
#egrMap .wp.now{fill:#c9a84c}
#egrMap .ship{fill:#f2e8cf}
#egrInfo .strip{flex:0 0 auto;display:grid;grid-template-columns:repeat(4,1fr);
  gap:2px 14px;border-top:1px solid #1d2430;padding-top:8px;margin-top:6px}
#egrInfo .cell b{display:block;font-weight:normal;color:#5f6a78;font-size:9.5px;
  letter-spacing:.12em;margin-bottom:1px}
#egrInfo .cell span{font-size:15px;color:#dfe6ee;font-variant-numeric:tabular-nums}
#egrInfo .cell small{color:#7d8794;font-size:10px}
#egrInfo .tail{flex:0 0 auto;color:#6d7887;font-size:10.5px;margin-top:6px;
  display:flex;justify-content:space-between;font-variant-numeric:tabular-nums}
#egrBook{padding:18px 22px}
#egrBook input{width:100%;box-sizing:border-box;background:#12161d;border:1px solid #263041;
  color:#dfe6ee;padding:9px 12px;border-radius:4px;font:13px 'Noto Serif KR',Georgia,serif}
#egrBook input:focus{outline:none;border-color:#8a743c}
#egrBook .hint{color:#5f6a78;font-size:11.5px;margin:8px 2px}
#egrBook .list{position:absolute;left:22px;right:22px;top:74px;bottom:8px;overflow:auto}
#egrBook .row{display:flex;gap:10px;align-items:center;padding:7px 6px;border-radius:4px;cursor:pointer}
#egrBook .row:hover{background:#141a23}
#egrBook .row img{width:30px;height:42px;object-fit:cover;border-radius:2px;background:#1a212c}
#egrBook .row .t{flex:1;min-width:0}
#egrBook .row .t b{display:block;font-weight:normal;color:#dfe6ee;font-size:13px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#egrBook .row .t small{color:#7d8794;font-size:11px}
#egrBook .row .tag{font-size:10px;color:#c9a84c;border:1px solid #4a3f22;border-radius:3px;
  padding:1px 5px;white-space:nowrap}
#egrBook .sect{color:#5f6a78;font-size:10.5px;letter-spacing:.14em;margin:10px 4px 3px}
#egrBook .chosen{display:flex;gap:16px}
#egrBook .chosen img{width:96px;height:138px;object-fit:cover;border-radius:3px;
  box-shadow:0 4px 14px rgba(0,0,0,.5)}
#egrBook .chosen .t b{display:block;font-weight:normal;color:#e6d9ae;font-size:15px;margin-bottom:2px}
#egrBook .chosen .t small{color:#8fa0b4;font-size:12px}
#egrBook .chosen .acts{margin-top:12px;display:flex;gap:8px;flex-wrap:wrap}
#egrMon .btn{border:1px solid #3a4356;background:#151b25;color:#cfd6de;
  border-radius:4px;padding:6px 12px;cursor:pointer;font:12px 'Noto Serif KR',Georgia,serif}
#egrMon .btn:hover{border-color:#8a743c;color:#e6d9ae}
#egrBook .notes{margin-top:14px;max-height:132px;overflow:auto;border-top:1px solid #1d2430;padding-top:8px}
#egrBook .note{padding:5px 4px;color:#9aa5b1;font-size:12px;cursor:pointer;border-radius:3px}
#egrBook .note:hover{background:#141a23;color:#dfe6ee}
#egrBook .note b{font-weight:normal;color:#c9a84c;margin-right:8px}
/* ══ 독서일지 판 (0819M) — ⭐ 모니터에서 승격시켰다 ═══════════════════
   ⚠⚠ 소로 0819: 「모니터가 좀 작아서 나같은 노안에게는 무척 부담스러운데」.
     맞다. 모니터는 517×362px 인데 그 안에 글칸을 넣으면 실제 쓸 폭이 400px 남짓이다.
     ⭐ 베스페르 일기판처럼 별도 판으로 뺀다. 모니터는 「보는 곳」, 판은 「쓰는 곳」.
   ⭐ 글씨 크기 단추를 단다 — 노안 배려는 곁다리가 아니라 이 집의 손님 절반의 문제다. */
#egrDesk{position:fixed;z-index:22;left:50%;top:50%;transform:translate(-50%,-50%);
  width:min(920px,92vw);height:min(660px,86vh);display:none;
  background:#0d1015;border:1px solid #2a323f;border-radius:10px;
  box-shadow:0 18px 60px rgba(0,0,0,.6);color:#cfd6de;
  font-family:Georgia,'Noto Serif KR',serif;overflow:hidden;pointer-events:auto}
#egrDesk.on{display:flex;flex-direction:column}
#egrDesk .hd{display:flex;align-items:center;gap:12px;padding:12px 16px;
  border-bottom:1px solid #1d2430;background:#12161d;flex:0 0 auto}
#egrDesk .hd img{width:36px;height:52px;object-fit:cover;border-radius:2px;background:#1a212c}
#egrDesk .hd .t{flex:1;min-width:0}
#egrDesk .hd .t b{display:block;font-weight:normal;color:#e6d9ae;font-size:16px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#egrDesk .hd .t small{color:#8fa0b4;font-size:12px}
#egrDesk .hd .cnt{color:#7d8794;font-size:12px;font-variant-numeric:tabular-nums}
#egrDesk .hd .fs{display:flex;gap:3px}
#egrDesk .body{flex:1 1 auto;min-height:0;display:flex}
/* 왼쪽 — 정돈된 기록들 */
#egrDesk .side{width:246px;flex:0 0 auto;border-right:1px solid #1d2430;
  display:flex;flex-direction:column;background:#0a0c10}
#egrDesk .rng{display:flex;flex-wrap:wrap;gap:4px;padding:10px 10px 8px;flex:0 0 auto}
#egrDesk .rng button{border:1px solid #263041;background:#12161d;color:#7d8794;
  border-radius:3px;padding:3px 8px;cursor:pointer;font:11.5px Georgia,'Noto Serif KR',serif}
#egrDesk .rng button.on{border-color:#8a743c;color:#e6d9ae;background:#171d26}
#egrDesk .arch{flex:1 1 auto;overflow:auto;padding:0 8px 10px}
#egrDesk .bk{margin-top:8px}
#egrDesk .bk .bt{display:flex;gap:8px;align-items:center;padding:4px 6px;border-radius:4px;
  color:#8fa0b4;font-size:12px;cursor:pointer}
#egrDesk .bk .bt:hover{background:#12161d;color:#dfe6ee}
#egrDesk .bk .bt img{width:18px;height:26px;object-fit:cover;border-radius:1px;background:#1a212c}
#egrDesk .bk .bt span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#egrDesk .bk .bt em{font-style:normal;color:#5f6a78;font-size:10.5px}
#egrDesk .ent{padding:4px 8px 4px 34px;color:#7d8794;font-size:11.5px;cursor:pointer;
  border-radius:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#egrDesk .ent:hover{background:#12161d;color:#dfe6ee}
#egrDesk .ent.on{color:#e6d9ae;background:#141a23}
#egrDesk .ent b{font-weight:normal;color:#c9a84c;margin-right:6px}
#egrDesk .ent i{font-style:normal;color:#4e5866;font-size:10px;margin-left:5px}
#egrDesk .none{color:#5f6a78;font-size:11.5px;padding:14px 8px;line-height:1.7}
/* 오른쪽 — 글칸 */
#egrDesk .pane{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;padding:14px 18px 12px}
#egrDesk textarea{flex:1 1 auto;min-height:0;width:100%;box-sizing:border-box;resize:none;
  background:#12161d;border:1px solid #263041;color:#e4ebf3;padding:16px 18px;border-radius:5px;
  font-family:'Noto Serif KR',Georgia,serif;font-size:17px;line-height:1.9}
#egrDesk textarea:focus{outline:none;border-color:#8a743c}
#egrDesk .ft{margin-top:10px;display:flex;gap:8px;align-items:center;flex:0 0 auto}
#egrDesk .msg{color:#7d8794;font-size:12px;margin-left:auto}
#egrDesk .btn{border:1px solid #3a4356;background:#151b25;color:#cfd6de;
  border-radius:4px;padding:7px 15px;cursor:pointer;font:13px 'Noto Serif KR',Georgia,serif}
#egrDesk .btn:hover{border-color:#8a743c;color:#e6d9ae}
#egrDesk .btn.sm{padding:3px 8px;font-size:12px}
#egrVeil{position:fixed;inset:0;z-index:21;background:rgba(4,6,10,.55);display:none;
  pointer-events:auto}
#egrVeil.on{display:block}
/* 모니터 한 켠의 최근 책 표지 (⑥) */
#egrRecent{position:absolute;right:6px;bottom:6px;width:44px;cursor:pointer;
  opacity:.82;transition:opacity .2s}
#egrRecent:hover{opacity:1}
#egrRecent img{width:44px;height:63px;object-fit:cover;border-radius:2px;display:block;
  box-shadow:0 3px 10px rgba(0,0,0,.6)}
#egrRecent .cap{color:#7d8794;font-size:8px;text-align:center;margin-top:2px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`;
    document.head.appendChild(css);
  }

  function mountHtml() {
    ROOT = document.createElement("div");
    ROOT.id = "readingRoom";
    ROOT.innerHTML = '<div id="fit"><div id="plate"></div></div><div id="hud"></div>'
      + '<div id="readingFade"></div>';
    document.body.appendChild(ROOT);
    EXIT = document.createElement("button");
    EXIT.id = "readingExit"; EXIT.type = "button";
    EXIT.textContent = "×"; EXIT.title = "내리기";
    document.body.appendChild(EXIT);
    EGR_on(EXIT, "click", function () { leave(); });
    /* 0819g — 좌·우 창 화살표. 방 밖 물건이 아니라 방(ROOT) 안이다 — KEEP 을 안 늘린다 */
    var sL = document.createElement("button");
    sL.id = "readingSeatL"; sL.className = "readingSeat"; sL.type = "button";
    sL.innerHTML = "&#8249;"; sL.title = "왼쪽 창 (←)";
    var sR = document.createElement("button");
    sR.id = "readingSeatR"; sR.className = "readingSeat"; sR.type = "button";
    sR.innerHTML = "&#8250;"; sR.title = "오른쪽 창 (→)";
    ROOT.appendChild(sL); ROOT.appendChild(sR);
    EGR_on(sL, "click", function () { swapSeat(-1); });
    EGR_on(sR, "click", function () { swapSeat(+1); });
    var sn = document.createElement("button");
    sn.id = "readingSnd"; sn.type = "button"; sn.innerHTML = "&#128266;"; sn.title = "기내 소음";
    ROOT.appendChild(sn);
    EGR_on(sn, "click", function () { engineSet(!sndOn); });
    /* ⭐ 창 덮개 손잡이 — 그림 속 그것 위. 방(ROOT) 안이라 KEEP 을 안 늘린다 */
    var gp = document.createElement("div");
    gp.id = "readingGrip"; gp.setAttribute("data-tip", "창 닫기"); gp.title = "창 덮개 (S)";
    ROOT.appendChild(gp);
    EGR_on(gp, "click", function () { if (!editing) toggleShade(); });
    var tn = document.createElement("div");
    tn.id = "readingTune";
    ROOT.appendChild(tn);
  }

  /* ══ 판 세우기 ═══════════════════════════════════════════════
     ⚠ 세로 9:16 — 폭은 언제나 화면을 채우고 위아래가 잘린다(v1.4 9호).
     ⭐ 스크롤이 아니다. 판·창밖·덮개가 모두 fixed 이고 panY 하나로 함께 민다.
       ⚠⚠ 좌표계를 둘로 나누면 창밖만 제자리에 남는다(0819 실제로 겪음). */
  var panY = 0, panMin = 0, panMax = 0;
  var cvW = 0, cvH = 0;            /* 캔버스 마지막 크기 — 같으면 resize 를 안 부른다 */
  var OUT = false;                 /* 0819g — 외부 보기. 왕복 하나, 별도 갈래가 아니다(0호) */
  var SHUT = false;                /* 0819P — 창 덮개. 24호 · 손님이 여닫는다 */

  /* ⭐ 덮개 손잡이 — 그림 속 그 곳 위에 얹는 투명 판. 좌·우 따로(거울이라 홈이 안 대칭).
     ⚠ 처음 값은 어림이다. 소로가 E 편집기로 맞춰 저장하시면 서버 값이 이깁니다. */
  var GRIP_L = { x: 20.0, y: 27.0, w: 9.0, h: 1.8 };
  var GRIP_R = { x: 20.0, y: 27.0, w: 9.0, h: 1.8 };
  function GRIP() { return side < 0 ? GRIP_L : GRIP_R; }
  var TUNE_KEY = "reading_tune";   /* eg_settings.key — 베스페르는 cruise_tune */

  /* ⭐ 좌석 전환 — cruise 가 매 프레임 side 를 다시 읽으므로 비행은 안 끊긴다.
     ⚠ 짧은 암전으로 덮는다. 창밖 방위가 180° 도는 순간을 맨눈에 보이면 어지럽다. */
  var swapping = false;
  function swapSeat(next) {
    if (!ROOT || swapping || side === next) return;
    swapping = true;
    var fade = ROOT.querySelector("#readingFade");
    fade.classList.add("on");
    EGR_later(function () {
      side = next;
      ROOT.classList.toggle("flip", side > 0);
      layout();
      EGR_later(function () {
        fade.classList.remove("on");
        EGR_later(function () { swapping = false; }, 320);
      }, 120);
    }, 300);
  }
  function toggleOut() {
    if (!ROOT) return;
    OUT = !OUT;
    ROOT.classList.toggle("out", OUT);
    layout();
  }

  /* ══ 창 덮개 (0819P) — 24호 · 손님이 여닫는다 ═══════════════════════
     ⚠ 자동으로 안 닫는다. 「멀미나는 분, 글에만 집중하고 싶은 분」을 위한 손이다.
       실제 여객기는 이착륙 때 덮개를 **여는데**, 그건 규정이고 여기는 취향이다. */
  function toggleShade() {
    if (!ROOT) return;
    SHUT = !SHUT;
    ROOT.classList.toggle("shut", SHUT);
    var g = ROOT.querySelector("#readingGrip");
    if (g) g.setAttribute("data-tip", SHUT ? "창 열기" : "창 닫기");
  }

  /* ══ 편집기 (0819P) — 베스페르 문법 그대로 ═════════════════════════
     E 로 켜고 끈다. 끌어서 옮기고 휠로 키운다. 끄면 저장한다.
     ⚠ 값은 eg_settings 에 한 줄(reading_tune). 읽기는 모두, 쓰기는 관리자만(RLS). */
  var editing = false, egrab = null, tuneT = null;
  function setEdit(on) {
    editing = on;
    ROOT.classList.toggle("edit", on);
    if (!on) pushTune();
  }
  function tuneTarget(el) {
    if (!el || !el.closest) return null;
    if (el.closest("#readingGrip")) return "grip";
    if (el.closest("#egrMon")) return "mon";
    return null;
  }
  /* 모니터 네 점을 통째로 옮긴다 — 사영변환이라 한 점만 끌면 모양이 일그러진다 */
  function monMove(dxp, dyp) {
    ["tl", "tr", "br", "bl"].forEach(function (k) { MON[k][0] += dxp; MON[k][1] += dyp; });
  }
  function monScale(f) {
    var ks = ["tl", "tr", "br", "bl"], mx0 = 0, my0 = 0;
    ks.forEach(function (k) { mx0 += MON[k][0] / 4; my0 += MON[k][1] / 4; });
    ks.forEach(function (k) {
      MON[k][0] = mx0 + (MON[k][0] - mx0) * f;
      MON[k][1] = my0 + (MON[k][1] - my0) * f;
    });
  }
  function tuneSay() {
    var box = ROOT && ROOT.querySelector("#readingTune");
    if (!box) return;
    var GP = GRIP();
    box.innerHTML = '<b>편집 중</b> — 창 덮개 손잡이와 모니터를 <b>끌어서</b> 옮기고,'
      + ' <b>휠</b>로 크기를 맞추십시오. <b>E</b> 로 닫으면 저장됩니다.<br>'
      + '<span class="sv">손잡이 ' + (side < 0 ? "왼창" : "오른창")
      + ' x ' + GP.x.toFixed(2) + ' y ' + GP.y.toFixed(2)
      + ' w ' + GP.w.toFixed(2) + ' h ' + GP.h.toFixed(2)
      + ' · 모니터 좌상 ' + MON.tl[0].toFixed(2) + ',' + MON.tl[1].toFixed(2) + '</span>';
  }
  function tuneNow() { return { GL: GRIP_L, GR: GRIP_R, MON: MON }; }
  function applyTune(v) {
    if (!v) return;
    if (v.GL) GRIP_L = v.GL;
    if (v.GR) GRIP_R = v.GR;
    if (v.MON && v.MON.tl) { MON.tl = v.MON.tl; MON.tr = v.MON.tr; MON.br = v.MON.br; MON.bl = v.MON.bl;
                             if (v.MON.w) MON.w = v.MON.w; if (v.MON.h) MON.h = v.MON.h; }
  }
  function pushTune() {
    try { localStorage.setItem("eg_reading_tune", JSON.stringify(tuneNow())); } catch (e) { }
    var sb = egr_sb(); if (!sb) return;
    sb.from("eg_settings")
      .upsert({ key: TUNE_KEY, val: tuneNow(), updated_at: new Date().toISOString() },
              { onConflict: "key" })
      .then(function (r) {
        if (r.error) console.warn("[EG] 편집값 저장 실패:", r.error.message);
        else console.log("[EG] 편집값을 서버에 적었습니다");
      });
  }
  function loadTune() {
    /* 먼저 브라우저 값으로 그려 두고, 서버 값이 오면 덮는다 (베스페르 문법) */
    try { applyTune(JSON.parse(localStorage.getItem("eg_reading_tune") || "null")); } catch (e) { }
    var sb = egr_sb(); if (!sb) return;
    sb.from("eg_settings").select("val").eq("key", TUNE_KEY).maybeSingle()
      .then(function (r) {
        if (r.error || !r.data || !r.data.val) return;
        applyTune(r.data.val);
        if (ROOT) layout();
        console.log("[EG] 서버에서 편집값을 받았습니다");
      });
  }
  function saveTuneSoon() { clearTimeout(tuneT); tuneT = setTimeout(pushTune, 600); }

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

    /* 0819g — 오른쪽 창가면 그림이 거울이다. 창·캔버스 좌표도 거울로 잰다.
       ⭐ 날개가 없어 베스페르의 되뒤집기 두 겹이 통째로 없다 — x' = 100 − l − w 한 줄이다 */
    var flip = (side > 0);
    function mx(l2, w2) { return flip ? (100 - l2 - w2) : l2; }

    /* ⭐⭐ 창밖 — **화면에 못박는다.** 판만 움직이고 지구는 안 움직인다 (0819P · 소로).
       ⚠⚠ 0819N 까지는 캔버스가 판과 같은 top(= py + panY)을 써서 스크롤할 때
          지구가 판을 따라 함께 흘렀다. 창 구멍이 지구 위를 훑는 게 아니라
          창과 지구가 한 덩어리로 미끄러졌다 — 기내를 둘러보는 게 아니라 세상이 흔들렸다.
       ⭐ 베스페르는 처음부터 이랬다. 창밖이 화면 전체를 덮고, 창 구멍 뚫린 판이 그 위를 덮는다.
          판이 어디로 가든 구멍 뒤에는 언제나 그 지점의 지구가 있다.
       ⚠ 기내 판은 창 넷이 실제로 뚫려 있다(알파 10.2% 실측). 그래서 이 방식이 선다.
       ⚠ 픽셀이 1.7배로 는다. 다만 C(외부 보기)에서 이미 같은 크기를 쓰고 있어 감당이 확인됐다. */
    var cv = document.getElementById("cesiumContainer");
    if (cv) {
      cv.style.position = "fixed";
      cv.style.left = "0px"; cv.style.top = "0px";
      cv.style.width = vw + "px"; cv.style.height = vh + "px";
      cv.style.right = "auto"; cv.style.bottom = "auto";   /* ⚠ terra 의 inset:0 을 푼다 */
      cv.style.zIndex = "4";
      /* ⚠ 같은 크기면 resize 를 안 부른다 — 매 프레임 부르면 Cesium 이 통째로 다시 잰다 */
      if (cvW !== vw || cvH !== vh) {
        cvW = vw; cvH = vh;
        try { if (viewer) viewer.resize(); } catch (e) { }
      }
    }
    /* 창 덮개 — 창보다 조금 크게 잡아 틈이 안 보이게.
       ⭐ 덮개는 창 구멍의 짝이므로 **판을 따라간다**(top). 창밖과 달리 함께 움직여야 맞다. */
    var sh = ROOT.querySelectorAll(".shade");
    for (var i = 0; i < sh.length; i++) {
      var W = WINS[i]; if (!W) continue;
      sh[i].style.left = (cx + (mx(W.l, W.w) - 1.2) / 100 * w) + "px";
      sh[i].style.top = (top + (W.t - 1.2) / 100 * h) + "px";
      sh[i].style.width = ((W.w + 2.4) / 100 * w) + "px";
      sh[i].style.height = ((W.h + 2.4) / 100 * h) + "px";
    }
    /* ⭐ 덮개 손잡이 — 그림 속 그것 위에 얹는 투명 판. 편집기가 만진다(0819P) */
    var gb = ROOT.querySelector("#readingGrip");
    if (gb) {
      var GP = GRIP();
      gb.style.left = (cx + mx(GP.x, GP.w) / 100 * w) + "px";
      gb.style.top = (top + GP.y / 100 * h) + "px";
      gb.style.width = (GP.w / 100 * w) + "px";
      gb.style.height = (GP.h / 100 * h) + "px";
    }
    /* 모니터 — 사다리꼴 네 점에 앉힌다(0819h). 판 % → 화면 px → matrix3d.
       ⚠ 오른창(거울)이면 x' = 100−x 에 좌·우 모서리도 서로 바뀐다 —
         TL↔TR · BL↔BR 을 안 바꾸면 변환이 안팎으로 뒤집혀 글이 거울이 된다 */
    if (MONEL) {
      function px(c) { return [cx + w * (flip ? (100 - c[0]) : c[0]) / 100, top + h * c[1] / 100]; }
      var pts = flip
        ? [px(MON.tr), px(MON.tl), px(MON.bl), px(MON.br)]
        : [px(MON.tl), px(MON.tr), px(MON.br), px(MON.bl)];
      MONEL.style.transform = homography(MON.w, MON.h, pts);
    }
  }

  /* ⭐ 휠 — 기내를 위아래로 본다. 창밖은 함께 움직이되 비행은 안 멈춘다.
     ⚠ #readingRoom 이 pointer-events:none 이라 휠이 안 닿는다. window 에 건다. */
  function onWheel(e) {
    if (!ROOT) return;
    /* ⚠ 모니터 안 목록(검색 결과·기록들)은 제 스크롤이 있다 — 판을 밀지 않는다 */
    if (e.target && e.target.closest && e.target.closest("#egrMon")) return;
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

  /* ══ 좌석 모니터 (0819h) — 실제 기내 IFE 와 같은 문법 ══════════════
     지도 화면 ↔ 엔터테인먼트. 여기서는 엔터테인먼트 대신 **책**이 앉는다.
     ⚠⚠ 비행정보에 「남은 시간」이 없다 — 14호. 끝이 없는 비행이다.
     ⭐ 화면이 셋이 아니라 둘이다 — 책이 없을 때의 모습이 곧 검색 한 문(20·21호). */
  var MONEL = null, TAB = "info", BOOK = null, SINFO = null;
  var WD = { seq: 1, dirty: false, saving: false, tmr: null, sec: 0, last: 0 };

  /* 물과 전기 — egSupa(집주인 클라이언트) 한 벌로 두 손을 짓는다.
     ⚠ Ⅱ층 셸의 sbFetch 를 복사하지 않는다 — 그 손은 localStorage 를 직접 읽는데,
       여기는 egSupa 가 이미 세션·갱신을 다 들고 있다. 「한 문서 · 한 클라이언트」. */
  var SUPA_URL = "https://cyhlotwdisjvoxvfkpnd.supabase.co";
  var SUPA_KEY = "sb_publishable_jYYfQV_wQgMRFjSUuDq7xA_gWc9vsnR";
  function egr_sb() { return window.egSupa || null; }
  function egr_token() {
    var sb = egr_sb();
    if (!sb) return Promise.resolve(null);
    return sb.auth.getSession().then(function (r) {
      return (r && r.data && r.data.session && r.data.session.access_token) || null;
    }).catch(function () { return null; });
  }
  function egr_fetch(path, options) {
    options = options || {};
    return egr_token().then(function (token) {
      var hd = { apikey: SUPA_KEY, Authorization: "Bearer " + (token || SUPA_KEY),
                 "Content-Type": "application/json" };
      if (options.headers) for (var k in options.headers) hd[k] = options.headers[k];
      return fetch(SUPA_URL + path, Object.assign({}, options, { headers: hd }));
    }).then(function (res) {
      if (!res.ok) return res.json().catch(function () { return {}; }).then(function (e) {
        var msg = e.message || e.error || e.msg || res.statusText || ("HTTP " + res.status);
        throw new Error(msg);
      });
      return res.status === 204 ? null : res.json();
    });
  }
  function egr_uid() {
    var sb = egr_sb();
    if (!sb) return Promise.resolve(null);
    return sb.auth.getUser().then(function (r) {
      return (r && r.data && r.data.user && r.data.user.id) || null;
    }).catch(function () { return null; });
  }
  function rpc(name, args) {
    return egr_fetch("/rest/v1/rpc/" + name, { method: "POST", body: JSON.stringify(args || {}) });
  }
  function bookAddReady() {
    if (!window.EGBookAdd) return false;
    try {
      EGBookAdd.init({ url: SUPA_URL, key: SUPA_KEY, sbFetch: egr_fetch, getValidToken: egr_token });
      return true;
    } catch (e) { console.warn("[EG] 책 들이는 손 연결 실패:", e); return false; }
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function mountMonitor(route) {
    MONEL = document.createElement("div");
    MONEL.id = "egrMon";
    MONEL.style.width = MON.w + "px"; MONEL.style.height = MON.h + "px";
    MONEL.innerHTML =
      '<div id="egrInfo" class="scr on">'
      + '<div class="rte">' + esc(route.name) + '</div>'
      + '<div class="leg" id="egrLeg">—</div>'
      + '<div id="egrMap">' + buildMap(route) + '</div>'
      + '<div id="egrZoom"><button id="egrZout" type="button" disabled>&#8722;</button>'
      + '<span class="lv" id="egrZlv">전체</span>'
      + '<button id="egrZin" type="button">&#43;</button></div>'
      + '<div class="strip">'
      + '<div class="cell"><b>현지 시각</b><span id="egrClock">—</span></div>'
      + '<div class="cell"><b>해발</b><span id="egrAlt">—</span> <small>m</small></div>'
      + '<div class="cell"><b>대지 속도</b><span id="egrSpd">—</span> <small>km/h</small></div>'
      + '<div class="cell"><b>승강률</b><span id="egrVs">—</span> <small>m/분</small></div>'
      + '</div>'
      + '<div class="tail"><span id="egrPos">—</span><span id="egrDist">—</span></div>'
      + '</div>'
      + '<div id="egrBook" class="scr"></div>'
      + '<div class="tabs"><button id="egrTabI" class="on" type="button">비행정보</button>'
      + '<button id="egrTabB" type="button">읽는 책</button></div>';
    ROOT.appendChild(MONEL);
    mountDesk();                     /* ⭐ 독서일지 판 — 모니터 밖 별도 판 */
    EGR_on(MONEL.querySelector("#egrTabI"), "click", function () { setTab("info"); });
    EGR_on(MONEL.querySelector("#egrTabB"), "click", function () { setTab("book"); });
    EGR_on(MONEL.querySelector("#egrZin"), "click", function () { setZoom(zi + 1, route); });
    EGR_on(MONEL.querySelector("#egrZout"), "click", function () { setZoom(zi - 1, route); });
    paintBook();
    paintRecent();                   /* ⑥ 모니터 한 켠의 최근 책 표지 */
  }

  /* ══ ⑥ 최근 책 표지 — 비행정보 화면 한 켠에 (0819M · 소로) ══════════
     ⭐ 누르면 「읽는 책」으로 간다. 지금 읽는 책이 없으면 마지막으로 기록한 책이 선다. */
  var RECENT = null;
  function paintRecent() {
    var box = MONEL && MONEL.querySelector("#egrMap");
    if (!box) return;
    var old = MONEL.querySelector("#egrRecent");
    if (old) old.parentNode.removeChild(old);
    var b = BOOK || RECENT;
    if (!b || !b.cover_url) return;
    var el = document.createElement("div");
    el.id = "egrRecent";
    el.title = b.title + (b.author ? " · " + b.author : "");
    el.innerHTML = '<img src="' + esc(b.cover_url) + '" onerror="this.parentNode.style.display=\'none\'">'
      + '<div class="cap">' + esc(String(b.title).slice(0, 7)) + '</div>';
    MONEL.querySelector("#egrInfo").appendChild(el);
    EGR_on(el, "click", function () { if (!BOOK && RECENT) BOOK = RECENT; setTab("book"); paintBook(); });
  }
  /* 마지막으로 기록한 책을 데려온다 — 탑승하자마자 표지가 서 있게 */
  function loadRecent() {
    rpc("get_my_recent_book", {}).then(function (rows) {
      if (rows && rows[0]) { RECENT = rows[0]; if (!BOOK) paintRecent(); }
    }).catch(function () { /* 없으면 없는 대로 */ });
  }
  function setTab(t) {
    TAB = t;
    if (!MONEL) return;
    MONEL.querySelector("#egrInfo").classList.toggle("on", t === "info");
    MONEL.querySelector("#egrBook").classList.toggle("on", t === "book");
    MONEL.querySelector("#egrTabI").classList.toggle("on", t === "info");
    MONEL.querySelector("#egrTabB").classList.toggle("on", t === "book");
  }

  /* — 비행정보. 400ms 마다 (onTick 이 부른다) — */
  function paintInfo(s, route) {
    if (!MONEL || TAB !== "info") return;
    var utc = new Date();
    var loc = (utc.getUTCHours() + utc.getUTCMinutes() / 60 + s.lon / 15 + 24) % 24;
    var hh2 = Math.floor(loc), mm = Math.floor((loc - hh2) * 60);
    MONEL.querySelector("#egrClock").textContent = hh2 + ":" + (mm < 10 ? "0" : "") + mm;
    MONEL.querySelector("#egrLeg").textContent = s.leg + "  →  " + s.next;
    MONEL.querySelector("#egrAlt").textContent = Math.round(s.alt).toLocaleString();
    MONEL.querySelector("#egrSpd").textContent = Math.round(s.kmh);
    var v = Math.round(s.vs);
    MONEL.querySelector("#egrVs").textContent = (v > 0 ? "+" : "") + v;
    MONEL.querySelector("#egrPos").textContent =
      Math.abs(s.lat).toFixed(3) + "°" + (s.lat >= 0 ? "N" : "S") + "  "
      + Math.abs(s.lon).toFixed(3) + "°" + (s.lon >= 0 ? "E" : "W");
    MONEL.querySelector("#egrDist").textContent = "비행 " + Math.round(s.dist).toLocaleString() + " km";
    paintMap(s, route);              /* ⭐ 항로도 — 확대 중이면 지도가 따라 흐른다 */
  }

  /* ══ 독서일지 판 (0819M) ═══════════════════════════════════════════
     ⭐ 왼쪽은 정돈된 기록들, 오른쪽은 글칸. 베스페르 일기판과 같은 문법이다.
     ⚠ 판이 떠 있는 동안에도 비행은 계속된다 — 14호. 멈추게 하지 않는다. */
  var DESK = null, VEIL = null, ARANGE = 30, FSIZE = 17;
  var RANGES = [["오늘", 1], ["7일", 7], ["30일", 30], ["90일", 90], ["전체", null]];

  function mountDesk() {
    VEIL = document.createElement("div"); VEIL.id = "egrVeil";
    DESK = document.createElement("div"); DESK.id = "egrDesk";
    DESK.innerHTML =
      '<div class="hd"><img id="egrDCov" alt=""><div class="t">'
      + '<b id="egrDTitle">독서일지</b><small id="egrDSub">&nbsp;</small></div>'
      + '<span class="cnt" id="egrDCnt">0자</span>'
      + '<span class="fs"><button class="btn sm" id="egrFsm" type="button" title="글씨 작게">가&#8722;</button>'
      + '<button class="btn sm" id="egrFsp" type="button" title="글씨 크게">가&#43;</button></span>'
      + '<button class="btn sm" id="egrDX" type="button">&#10005;</button></div>'
      + '<div class="body"><div class="side">'
      + '<div class="rng" id="egrRng"></div><div class="arch" id="egrArch"></div></div>'
      + '<div class="pane"><textarea id="egrDBody" placeholder="그 책에 관한 나의 기록"></textarea>'
      + '<div class="ft"><button class="btn" id="egrDSave" type="button">저장</button>'
      + '<button class="btn" id="egrDNew" type="button">다음 회차</button>'
      + '<span class="msg" id="egrDMsg"></span></div></div></div>';
    ROOT.appendChild(VEIL); ROOT.appendChild(DESK);
    var rng = DESK.querySelector("#egrRng");
    RANGES.forEach(function (r) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = r[0];
      b.className = (r[1] === ARANGE) ? "on" : "";
      EGR_on(b, "click", function () {
        ARANGE = r[1];
        var all = rng.querySelectorAll("button");
        for (var i = 0; i < all.length; i++) all[i].classList.remove("on");
        b.classList.add("on");
        loadArchive();
      });
      rng.appendChild(b);
    });
    EGR_on(DESK.querySelector("#egrDX"), "click", closeDesk);
    EGR_on(VEIL, "click", closeDesk);
    EGR_on(DESK.querySelector("#egrDSave"), "click", function () { saveNote("saved"); });
    EGR_on(DESK.querySelector("#egrDNew"), "click", function () {
      if (WD.dirty) saveNote("draft");
      openWrite(null);
    });
    EGR_on(DESK.querySelector("#egrDBody"), "input", function () {
      touched();
      DESK.querySelector("#egrDCnt").textContent =
        DESK.querySelector("#egrDBody").value.length + "자";
    });
    EGR_on(DESK.querySelector("#egrFsp"), "click", function () { setFont(FSIZE + 2); });
    EGR_on(DESK.querySelector("#egrFsm"), "click", function () { setFont(FSIZE - 2); });
  }
  /* ⭐ 노안 배려 — 이 집 손님 절반의 문제다. 곁다리가 아니다 */
  function setFont(px) {
    FSIZE = Math.max(13, Math.min(28, px));
    var t = DESK && DESK.querySelector("#egrDBody");
    if (t) { t.style.fontSize = FSIZE + "px"; t.style.lineHeight = (FSIZE > 20 ? 1.8 : 1.9); }
    try { localStorage.setItem("eg_read_fs", String(FSIZE)); } catch (e) { }
  }
  function openDesk() {
    if (!DESK) return;
    try { var f = +localStorage.getItem("eg_read_fs"); if (f) FSIZE = f; } catch (e) { }
    setFont(FSIZE);
    VEIL.classList.add("on"); DESK.classList.add("on");
    loadArchive();
  }
  function closeDesk() {
    if (!DESK) return;
    if (WD.dirty) saveNote("draft");
    VEIL.classList.remove("on"); DESK.classList.remove("on");
  }

  /* ③ 아카이빙 — 기간으로 좁히고 책별로 묶는다 */
  function loadArchive() {
    var box = DESK && DESK.querySelector("#egrArch");
    if (!box) return;
    box.innerHTML = '<div class="none">불러오는 중…</div>';
    rpc("get_my_book_archive", { p_days: ARANGE }).then(function (rows) {
      rows = rows || [];
      if (!rows.length) {
        box.innerHTML = '<div class="none">이 기간에 쓴 기록이 없습니다.<br>'
          + '모니터에서 책을 고르고 첫 회차를 여십시오.</div>';
        return;
      }
      /* 책별로 묶는다 — 서버가 이미 책 단위로 정렬해 준다 */
      var html = "", cur = null;
      rows.forEach(function (r) {
        if (r.book_id !== cur) {
          cur = r.book_id;
          html += '<div class="bk"><div class="bt" data-bk="' + r.book_id + '">'
            + '<img src="' + esc(r.cover_url || "") + '" onerror="this.style.visibility=\'hidden\'">'
            + '<span>' + esc(r.title) + '</span></div>';
        }
        html += '<div class="ent" data-bk="' + r.book_id + '" data-seq="' + r.seq + '">'
          + '<b>제' + r.seq + '회</b>'
          + esc(String(r.body || "").replace(/\s+/g, " ").slice(0, 22))
          + (r.status === "draft" ? '<i>초안</i>' : "") + '</div>';
      });
      box.innerHTML = html;
      var ents = box.querySelectorAll(".ent"), i;
      for (i = 0; i < ents.length; i++) (function (el) {
        EGR_on(el, "click", function () {
          var bk = el.getAttribute("data-bk"), sq = +el.getAttribute("data-seq");
          var row = rows.filter(function (r) { return r.book_id === bk && r.seq === sq; })[0];
          if (!row) return;
          if (!BOOK || BOOK.id !== bk) {
            BOOK = { id: bk, title: row.title, author: row.author, cover_url: row.cover_url };
            paintBook(); paintRecent();
          }
          openWrite({ seq: row.seq, body: row.body });
          var on = box.querySelectorAll(".ent.on");
          for (var j = 0; j < on.length; j++) on[j].classList.remove("on");
          el.classList.add("on");
        });
      })(ents[i]);
      var bts = box.querySelectorAll(".bt");
      for (i = 0; i < bts.length; i++) (function (el) {
        EGR_on(el, "click", function () {
          var bk = el.getAttribute("data-bk");
          var row = rows.filter(function (r) { return r.book_id === bk; })[0];
          if (!row) return;
          BOOK = { id: bk, title: row.title, author: row.author, cover_url: row.cover_url };
          paintBook(); paintRecent(); openWrite(null);
        });
      })(bts[i]);
    }).catch(function (e) {
      box.innerHTML = '<div class="none">' + esc(e.message || e) + '</div>';
    });
  }

  /* ══ 인장 (0819N) — 16호 「도장은 저장할 때 한 번」 ═══════════════════
     ⭐ vol_lectio · area volatus · motto VOLATVS · daily_per_area
     ⚠⚠ 규칙이 daily_per_area 하나뿐인 까닭 — 소로 0819: 「독서일지 매일 1회차분」.
        회차마다 주면 「많이 쓰면 많이 받는다」가 되어 14호(재촉 금지)가 무너진다.
        하루에 세 권을 읽고 세 편을 써도 도장은 하나다. 그것이 이 집의 셈이다.
     ⚠ 3호 — 저절로 안 찍는다. 놓아두기만 하고 누르는 것은 손님이다.
       안 눌러도 아무 손해가 없고, 다음 날 또 저장하면 또 놓인다.
     ⭐ 원판이 없으면 아무 일도 안 일어난다 — stamp_press 가 art_url 로 거른다(30호).
       그래서 줄을 먼저 세워도 손님 화면은 조용하다. 소로가 구우면 그날부터 선다. */
  function offerStamp() {
    if (!window.EGStamp || !BOOK) return;
    /* ⚠ 늦게 온 응답은 방이 아직 있을 때만 받는다 — 0818 밤 베스페르에서 덴 곳.
       × 로 내리며 초안이 저장되면 여기까지 오는데, 그때는 terra 위에 인장이 홀로 뜬다. */
    if (!ROOT || !document.body.contains(ROOT)) return;
    var mark = (window.EGBookAdd && EGBookAdd.inscription)
      ? EGBookAdd.inscription(BOOK.title) : String(BOOK.title || "").slice(0, 24);
    try {
      EGStamp.offer({ supa: egr_sb(), area: "volatus", kind: "vol_lectio",
                      inscription: mark || null,
                      bottom: 96 });      /* 기록판 위로 올린다 */
    } catch (e) { console.warn("[EG] 인장을 못 놓았습니다:", e); }
  }

  function paintBook() {
    if (!MONEL) return;
    var el = MONEL.querySelector("#egrBook");
    if (!BOOK) {
      el.innerHTML = '<input id="egrQ" placeholder="읽을 책을 검색하십시오 — 서가와 바깥을 함께 훑습니다">'
        + '<div class="hint">엔터로 검색 · 서가에 없으면 그 자리에서 들입니다</div>'
        + '<div class="list" id="egrList"></div>';
      var q = el.querySelector("#egrQ");
      EGR_on(q, "keydown", function (e) {
        if (e.key === "Enter") { e.stopPropagation(); doSearch(q.value); }
      });
      return;
    }
    var noteHtml = '<div class="notes" id="egrNotes"></div>';
    el.innerHTML = '<div class="chosen">'
      + '<img src="' + esc(BOOK.cover_url || "") + '" onerror="this.style.visibility=\'hidden\'">'
      + '<div class="t"><b>' + esc(BOOK.title) + '</b><small>' + esc(BOOK.author || "") + '</small>'
      + '<div class="acts"><button class="btn" id="egrWNew" type="button">기록 쓰기</button>'
      + '<button class="btn" id="egrWArch" type="button">지난 기록</button>'
      + '<button class="btn" id="egrBSwap" type="button">다른 책</button></div></div></div>'
      + noteHtml;
    EGR_on(el.querySelector("#egrWNew"), "click", function () { openWrite(null); });
    EGR_on(el.querySelector("#egrWArch"), "click", function () { openDesk(); });
    EGR_on(el.querySelector("#egrBSwap"), "click", function () { BOOK = null; paintBook(); paintRecent(); });
    loadNotes();
  }
  function doSearch(qs) {
    var list = MONEL && MONEL.querySelector("#egrList");
    if (!list || !String(qs || "").trim()) return;
    if (!bookAddReady()) { list.innerHTML = '<div class="hint">책 들이는 손이 아직 안 실렸습니다</div>'; return; }
    list.innerHTML = '<div class="hint">훑는 중…</div>';
    egr_uid().then(function (uid) {
      if (!uid) { list.innerHTML = '<div class="hint">로그인이 필요합니다</div>'; return; }
      return EGBookAdd.search(qs, uid).then(function (r) { renderSearch(list, r, uid); });
    }).catch(function (e) { list.innerHTML = '<div class="hint">' + esc(e.message || e) + '</div>'; });
  }
  function rowHtml(b, tag) {
    return '<div class="row"><img src="' + esc(b.cover_url || "") + '" onerror="this.style.visibility=\'hidden\'">'
      + '<div class="t"><b>' + esc(b.title) + '</b><small>' + esc(b.author || "") + '</small></div>'
      + (tag ? '<span class="tag">' + tag + '</span>' : '') + '</div>';
  }
  function renderSearch(list, r, uid) {
    var html = "", picks = [];
    function add(b, tag, act) { html += rowHtml(b, tag); picks.push(act); }
    if (r.mine.length) { html += '<div class="sect">내 서가</div>';
      r.mine.forEach(function (b) { add(b, "", function () { choose(b); }); }); }
    if (r.kept && r.kept.length) { html += '<div class="sect">보관함</div>';
      r.kept.forEach(function (b) { add(b, "보관함", function () { choose(b); }); }); }
    if (r.outer.length) { html += '<div class="sect">바깥 우물</div>';
      r.outer.forEach(function (b) {
        add(b, b.owned ? "이미 있음" : "들이기", function () {
          if (b.owned) { pickOwned(b.owned_id, uid); return; }
          var msg = MONEL.querySelector("#egrList");
          msg.insertAdjacentHTML("afterbegin", '<div class="hint" id="egrAddMsg">들이는 중…</div>');
          EGBookAdd.add(b, uid, function (st) {
            var m2 = MONEL.querySelector("#egrAddMsg");
            if (m2) m2.textContent = { cover: "표지를 옮겨 오는 중…", seq: "자리를 받는 중…", insert: "서가에 꽂는 중…" }[st] || "…";
          }).then(function (out) { choose(out.row); })
            .catch(function (e) { var m2 = MONEL.querySelector("#egrAddMsg");
              if (m2) m2.textContent = "못 들였습니다 — " + (e.message || e); });
        });
      }); }
    if (!html) html = '<div class="hint">아무것도 못 찾았습니다</div>';
    if (r.outerError) html += '<div class="hint">⚠ 바깥 우물: ' + esc(r.outerError) + '</div>';
    list.innerHTML = html;
    var rows = list.querySelectorAll(".row");
    for (var i = 0; i < rows.length; i++) (function (i2) {
      EGR_on(rows[i2], "click", function () { picks[i2] && picks[i2](); });
    })(i);
  }
  function pickOwned(id, uid) {
    egr_fetch("/rest/v1/wunderkammer_books?id=eq." + encodeURIComponent(id)
      + "&select=id,title,author,cover_url").then(function (rows) {
        if (rows && rows[0]) choose(rows[0]);
      }).catch(function (e) { console.warn("[EG] 책 확인 실패:", e); });
  }
  function choose(b) {
    BOOK = b; RECENT = b;
    /* ⭐ 표지가 모니터에 걸린다(20호 ⑤) — 좌석에서 꽂은 책도 곧 wunderkammer_books 다(22호) */
    paintBook(); paintRecent();
  }
  function loadNotes() {
    var box = MONEL && MONEL.querySelector("#egrNotes");
    if (!box || !BOOK) return;
    rpc("get_my_book_notes", { p_book: BOOK.id }).then(function (rows) {
      rows = rows || [];
      if (!rows.length) { box.innerHTML = '<div class="hint">아직 기록이 없습니다 — 첫 회차를 여십시오</div>'; return; }
      box.innerHTML = rows.map(function (n) {
        return '<div class="note" data-seq="' + n.seq + '"><b>제' + n.seq + '회</b>'
          + esc(String(n.body || "").replace(/\s+/g, " ").slice(0, 42))
          + (n.status === "draft" ? ' <span class="tag">초안</span>' : "") + '</div>';
      }).join("");
      var items = box.querySelectorAll(".note");
      for (var i = 0; i < items.length; i++) (function (el2) {
        EGR_on(el2, "click", function () {
          var sq = +el2.getAttribute("data-seq");
          var row = rows.filter(function (n) { return n.seq === sq; })[0];
          openWrite(row);
        });
      })(items[i]);
    }).catch(function (e) { box.innerHTML = '<div class="hint">' + esc(e.message || e) + '</div>'; });
  }
  function openWrite(row) {
    if (!BOOK || !DESK) return;
    var go = function (seq, body) {
      WD.seq = seq; WD.dirty = false; WD.sec = 0; WD.last = 0;
      DESK.querySelector("#egrDTitle").textContent = BOOK.title;
      DESK.querySelector("#egrDSub").textContent =
        (BOOK.author ? BOOK.author + " · " : "") + "제" + seq + "회";
      var cv = DESK.querySelector("#egrDCov");
      cv.src = BOOK.cover_url || ""; cv.style.visibility = BOOK.cover_url ? "" : "hidden";
      var t = DESK.querySelector("#egrDBody");
      t.value = body || "";
      DESK.querySelector("#egrDCnt").textContent = t.value.length + "자";
      DESK.querySelector("#egrDMsg").textContent = "";
      openDesk();
      t.focus();
    };
    if (row) { go(row.seq, row.body); return; }
    rpc("book_note_next_seq", { p_book: BOOK.id })
      .then(function (n) { go(Math.max(1, +n || 1), ""); })
      .catch(function () { go(1, ""); });
  }
  /* ⚠ 창밖 보러 나갔다 돌아오니 백지 — 그건 다시는 안 쓰게 되는 사고다(v1.4 13호).
     손을 멈추면 2.5초 뒤 조용히 초안으로 남긴다. 베스페르 touched 문법 그대로. */
  function touched() {
    var now = performance.now();
    if (WD.last && now - WD.last < 5000) WD.sec += (now - WD.last) / 1000;
    WD.last = now;
    WD.dirty = true;
    clearTimeout(WD.tmr);
    WD.tmr = setTimeout(function () { if (WD.dirty) saveNote("draft"); }, 2500);
  }
  function saveNote(status) {
    if (!BOOK || WD.saving || !DESK) return;
    var body = DESK.querySelector("#egrDBody").value;
    var msg = DESK.querySelector("#egrDMsg");
    if (status === "saved" && !body.trim()) { msg.textContent = "아직 쓴 글이 없습니다"; return; }
    if (!body.trim() && status === "draft") { WD.dirty = false; return; }
    WD.saving = true;
    var s = SINFO || {};
    rpc("save_my_book_note", {
      p_book: BOOK.id, p_seq: WD.seq, p_body: body, p_status: status,
      p_route: (flight && flight.routeCode) || null,
      p_place: s.leg || null,
      p_lat: (typeof s.lat === "number") ? +s.lat.toFixed(5) : null,
      p_lon: (typeof s.lon === "number") ? +s.lon.toFixed(5) : null,
      p_alt_km: (typeof s.alt === "number") ? +(s.alt / 1000).toFixed(2) : null,
      p_write_sec: Math.round(WD.sec)
    }).then(function () {
      WD.dirty = false;
      msg.textContent = status === "saved" ? "저장했습니다" : "임시 저장";
      RECENT = BOOK; paintRecent();
      loadNotes();
      if (DESK.classList.contains("on")) loadArchive();
      /* ⭐ 16호 — 도장은 **저장할 때** 한 번. 초안에는 안 놓는다.
         자동 초안까지 도장을 놓으면 「글을 쓰다 멈춘 것」에도 상을 주는 꼴이 된다. */
      if (status === "saved") offerStamp();
    }).catch(function (e) {
      msg.textContent =
        /JWT|auth|401|로그인/i.test(String(e && e.message)) ? "로그인이 필요합니다" : "저장하지 못했습니다";
    }).then(function () { WD.saving = false; });
  }

  /* ══ 항로도 (0819L) — 실제 IFE 의 moving map ═══════════════════════
     ⭐ 지도 타일을 안 부른다. 경로가 고정 고리라 **경로 자체가 지도**다.
        타일을 부르면 새 의존이 생기고 저작자 표시가 하나 더 는다(39호).
     ⚠⚠ 경도를 위도의 코사인으로 눌러야 한다. 안 누르면 알프스가 옆으로 늘어난다 —
        46°N 에서 실측 7.41:1 이 5.12:1 로 바뀐다(실제 464km × 90km).
     ⚠ 날짜변경선을 넘는 노선(인천→뉴욕 같은 것)은 경도가 튄다.
        지금은 닫힌 고리뿐이라 안 걸리지만, 직선 장거리를 실을 때 여기를 먼저 볼 것.

     ⭐⭐ 확대 다섯 단계 (0819L · 소로) — 겹침을 **감추지 않고 퍼뜨려** 푼다.
        「전체보기 → +1 → +2 → +3 → +4」. 확대하면 지도가 비행기를 따라 흐른다.
        ⭐ 겹침 판정을 배율마다 다시 셈하므로, 벌어지면 이름이 저절로 나타난다 —
          숨기는 규칙과 확대가 따로가 아니라 한 벌이다.
        ⚠ 지금 나는 구간의 두 이름은 겹침 판정에서 언제나 이긴다. */
  var MAPBOX = { w: 584, h: 196, pad: 18 };
  var MAPF = null;                 /* 좌표 → 화면 변환 */
  var MAPBASE = null;              /* 전체보기일 때의 변환 (배율의 기준) */
  var ZOOM = [1, 2, 4, 8, 16];
  var ZLABEL = ["전체", "+1", "+2", "+3", "+4"];
  var zi = 0;                      /* 지금 단계 */
  var mapSeg = -1;

  function mapFit(route) {
    var pts = curvePoints(route, 12);
    var laMin = 90, laMax = -90, loMin = 180, loMax = -180, i;
    for (i = 0; i < pts.length; i++) {
      if (pts[i][0] < laMin) laMin = pts[i][0];
      if (pts[i][0] > laMax) laMax = pts[i][0];
      if (pts[i][1] < loMin) loMin = pts[i][1];
      if (pts[i][1] > loMax) loMax = pts[i][1];
    }
    /* ⚠ 상자는 **항로만** 보고 잡는다. 밑그림까지 넣어 잡으면 노선이 상자 한복판에서
       쪼그라든다 — 주인공은 항로다. 밑그림은 넘치는 대로 잘린다(clip). */
    var kx = Math.cos(Cesium.Math.toRadians((laMin + laMax) / 2));   /* ⭐ 경도 보정 */
    var w = (loMax - loMin) * kx, h = (laMax - laMin);
    if (w <= 0) w = 1e-6; if (h <= 0) h = 1e-6;
    var s = Math.min((MAPBOX.w - MAPBOX.pad * 2) / w, (MAPBOX.h - MAPBOX.pad * 2) / h);
    return { s: s, kx: kx, loMin: loMin, laMax: laMax,
             ox: (MAPBOX.w - w * s) / 2, oy: (MAPBOX.h - h * s) / 2 };
  }
  /* 배율과 중심을 받아 변환 하나를 만든다. 중심이 없으면 전체보기 */
  function mapView(base, mul, cLa, cLo) {
    var s = base.s * mul, ox, oy;
    if (mul === 1 || cLa == null) {
      ox = base.ox * 1; oy = base.oy * 1;
      return {
        s: s, mul: mul,
        x: function (lo) { return ox + (lo - base.loMin) * base.kx * base.s; },
        y: function (la) { return oy + (base.laMax - la) * base.s; }
      };
    }
    /* ⭐ 비행기를 화면 한복판에 둔다 — 실제 네비게이션의 그것 */
    return {
      s: s, mul: mul,
      x: function (lo) { return MAPBOX.w / 2 + (lo - cLo) * base.kx * s; },
      y: function (la) { return MAPBOX.h / 2 - (la - cLa) * s; }
    };
  }
  /* 밑그림 한 겹 — 상자 밖은 clipPath 가 자른다 */
  function neLayer(segs, cls, close) {
    if (!segs || !segs.length) return "";
    var out = "", i, j, s, d;
    for (i = 0; i < segs.length; i++) {
      s = segs[i]; d = "";
      for (j = 0; j < s.length; j++)
        d += (j ? "L" : "M") + MAPF.x(s[j][1]).toFixed(1) + " " + MAPF.y(s[j][0]).toFixed(1) + " ";
      if (close) d += "Z";
      out += '<path class="' + cls + '" d="' + d + '"/>';
    }
    return out;
  }
  function buildMap(route, cLa, cLo) {
    if (!MAPBASE) MAPBASE = mapFit(route);
    MAPF = mapView(MAPBASE, ZOOM[zi], cLa, cLo);
    var N = route.legs.length, s, j, d, p, out = [];
    /* ── 밑그림 (있으면) — 항로보다 먼저 그려 뒤에 깔린다 */
    var ne = (window.EGMapNE && EGMapNE.get) ? EGMapNE.get(route.code) : null;
    if (ne) {
      out.push('<g clip-path="url(#egrClip)">');
      out.push(neLayer(ne.river, "ne-river", false));
      out.push(neLayer(ne.border, "ne-border", false));
      out.push(neLayer(ne.lake, "ne-lake", true));       /* 호수가 맨 위 — 강이 물고 들어온다 */
      out.push('</g>');
    }
    out.push('<g clip-path="url(#egrClip)">');
    /* 구간마다 따로 그린다 — 지금 나는 구간만 금빛으로 바꾸려면 조각이 나뉘어야 한다.
       ⭐ 확대할수록 표본을 늘린다. 안 늘리면 파고들었을 때 곡선이 각져 보인다 */
    var per = 14 + zi * 8;
    for (s = 0; s < N; s++) {
      d = "";
      for (j = 0; j <= per; j++) {
        p = curveOf(route, s, j / per);
        d += (j ? "L" : "M") + MAPF.x(p[1]).toFixed(1) + " " + MAPF.y(p[0]).toFixed(1) + " ";
      }
      out.push('<path class="seg" id="egrSeg' + s + '" d="' + d + '"/>');
    }
    /* ⭐⭐ 길목 이름 — 겹침을 화면 좌표로 미리 재서 감춘다.
       ⚠ 감추는 규칙은 확대와 한 벌이다. 벌어지면 저절로 다시 나타난다.
       실제 IFE 도 이렇게 한다 — 확대하면 지명이 나타나고 축소하면 사라진다. */
    var placed = [], hide = {};
    for (s = 0; s < N; s++) {
      p = route.legs[s];
      var px = MAPF.x(p[1]), py = MAPF.y(p[0]);
      var up = (s % 2 === 0);
      var ty = py + (up ? -7 : 13);
      var half = String(p[2]).length * 4.6;             /* 글자 폭 어림 (8.5px 한글) */
      var clash = false;
      for (j = 0; j < placed.length; j++) {
        if (Math.abs(placed[j][1] - ty) < 11
            && Math.abs(placed[j][0] - px) < (placed[j][2] + half)) { clash = true; break; }
      }
      if (clash) hide[s] = true; else placed.push([px, ty, half]);
      var anc = (px < 46) ? "start" : (px > MAPBOX.w - 46 ? "end" : "middle");
      out.push('<circle class="wp" id="egrWp' + s + '" cx="' + px.toFixed(1)
        + '" cy="' + py.toFixed(1) + '" r="2.4"/>');
      out.push('<text class="wpt' + (hide[s] ? " hide" : "") + '" id="egrWt' + s
        + '" text-anchor="' + anc + '" x="' + px.toFixed(1)
        + '" y="' + ty.toFixed(1) + '">' + esc(p[2]) + '</text>');
    }
    out.push('</g>');
    /* 비행기 — 기수가 위(북)를 보게 그린다. rotate(heading) 이 곧 방위다 */
    out.push('<g id="egrShip"><path class="ship" d="M0,-7.5 L4.6,5.2 L0,2.6 L-4.6,5.2 Z"/></g>');
    return '<svg viewBox="0 0 ' + MAPBOX.w + ' ' + MAPBOX.h + '" preserveAspectRatio="xMidYMid meet">'
      + '<defs><clipPath id="egrClip"><rect x="0" y="0" width="' + MAPBOX.w
      + '" height="' + MAPBOX.h + '"/></clipPath></defs>'
      + out.join("") + '</svg>';
  }
  /* ⭐ 확대 중이면 지도가 비행기를 따라 흐른다 — 실제 네비게이션의 그것.
     ⚠ 확대일 때는 좌표계 자체가 매 틱 바뀌므로 다시 그린다. 400ms 에 한 번이고
       조각이 백 개 남짓이라 가볍다. 전체보기에서는 비행기 하나만 옮긴다. */
  var redrawT = 0;
  function paintMap(s, route) {
    var box = MONEL && MONEL.querySelector("#egrMap");
    if (!box || !MAPBASE) return;
    if (zi > 0) {
      var now2 = performance.now();
      if (now2 - redrawT > 380) {
        redrawT = now2;
        box.innerHTML = buildMap(route, s.lat, s.lon);
        mapSeg = -1;                                   /* 다시 그렸으니 강조를 새로 */
      }
    }
    var ship = box.querySelector("#egrShip");
    if (ship) ship.setAttribute("transform",
      "translate(" + MAPF.x(s.lon).toFixed(1) + "," + MAPF.y(s.lat).toFixed(1)
      + ") rotate(" + s.hd.toFixed(1) + ")");
    if (s.seg === mapSeg) return;               /* 구간이 안 바뀌면 손대지 않는다 */
    var old = box.querySelectorAll(".now");
    for (var i = 0; i < old.length; i++) old[i].classList.remove("now");
    mapSeg = s.seg;
    var sg = box.querySelector("#egrSeg" + s.seg); if (sg) sg.classList.add("now");
    var nx = (s.seg + 1) % s.legN;
    /* ⚠ 지금 구간의 두 이름은 겹침 판정에서 언제나 이긴다 — hide 를 걷는다 */
    ["#egrWp" + s.seg, "#egrWt" + s.seg, "#egrWp" + nx, "#egrWt" + nx].forEach(function (q) {
      var el = box.querySelector(q);
      if (el) { el.classList.add("now"); el.classList.remove("hide"); }
    });
  }
  function setZoom(next, route) {
    zi = Math.max(0, Math.min(ZOOM.length - 1, next));
    var box = MONEL && MONEL.querySelector("#egrMap");
    if (!box) return;
    var c = (zi > 0 && SINFO) ? SINFO : null;
    box.innerHTML = buildMap(route, c && c.lat, c && c.lon);
    mapSeg = -1;
    var lv = MONEL.querySelector("#egrZlv");
    if (lv) lv.textContent = ZLABEL[zi];
    MONEL.querySelector("#egrZout").disabled = (zi === 0);
    MONEL.querySelector("#egrZin").disabled = (zi === ZOOM.length - 1);
    if (SINFO) paintMap(SINFO, route);
  }

  /* ══ 소리 (0819g) — 방송 → 엔진음. 베스페르 0817 문법 그대로 ══════════
     ⭐ 엔진음은 파일이 아니다 — 백색소음을 그 자리에서 만들어 저역필터로 거른다.
        루프 이음매가 없고 용량이 0이다. 그리고 0817에 적어만 두고 못 쓴 것을
        오늘 쓴다 — **필터를 고도에 물린다.** 낮으면 굵게, 높으면 멀게.
     ⚠ 방송(cabin_announce_v1.mp3)은 당분간 베스페르와 같은 파일이다(소로 0819 —
        「나중에 다시 녹음할게」). 갈아탈 때 이 한 줄만 바꾼다.
     ⚠⚠ window.__egHush 를 쓰지 않는다 — 그건 베스페르가 제 소리를 끄려고 내놓은
        창구다. 두 방이 한 문서에 사니, 여기서 그 이름을 부르면 남의 소리를 끄고
        제 소리는 남긴다. leave() 는 이 방의 hush() 를 직접 부른다. */
  var ANNOUNCE_SRC = "cabin_announce_v1.mp3";
  var AC = window.AudioContext || window.webkitAudioContext;
  var ac = null, engGain = null, engLp = null, annAudio = null;
  var sndOn = true, announced = false, engBase = 0.07;   /* 0817 소로: 크다 → 절반 */
  function ensureAC() { if (!ac) ac = new AC(); return ac; }
  function engineStart() {
    if (engGain || !sndOn) return;
    try {
      var a = ensureAC();
      var buf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      var src = a.createBufferSource(); src.buffer = buf; src.loop = true;
      engLp = a.createBiquadFilter(); engLp.type = "lowpass";
      engLp.frequency.value = 420; engLp.Q.value = 0.4;
      engGain = a.createGain(); engGain.gain.value = 0;
      src.connect(engLp).connect(engGain).connect(a.destination);
      src.start();
      engGain.gain.linearRampToValueAtTime(engBase, a.currentTime + 2.5);   /* 스르르 */
    } catch (e) { }
  }
  /* ⭐ 고도에 물린다 — 지면 가까이(굵은 웅—) 480Hz · 높이 오르면(먼 쉬—) 300Hz */
  function engineTune(rel) {
    if (!engLp) return;
    try { engLp.frequency.value = 480 - Math.min(Math.max(rel, 0), 4000) / 4000 * 180; } catch (e) { }
  }
  function engineSet(on) {
    sndOn = on;
    var b = document.getElementById("readingSnd");
    if (b) { b.classList.toggle("off", !on); b.innerHTML = on ? "&#128266;" : "&#128263;"; }
    if (!engGain) { if (on && announced) engineStart(); return; }
    engGain.gain.linearRampToValueAtTime(on ? engBase : 0, ensureAC().currentTime + 0.6);
  }
  function playAnnounce() {
    if (announced) return; announced = true;
    annAudio = new Audio(ANNOUNCE_SRC);
    annAudio.volume = 0.9;
    var started = false;
    annAudio.addEventListener("ended", function () { engineStart(); });   /* 끝나는 순간 스르르 */
    annAudio.play().then(function () { started = true; }).catch(function () { });
    /* ⚠ 폴백 — 파일이 없거나 재생이 막히면 3초 뒤 조용히 엔진음만 */
    EGR_later(function () { if (!started) engineStart(); }, 3000);
  }
  function hush() {
    try { if (annAudio) { annAudio.pause(); annAudio = null; } } catch (e) { }
    try { if (engGain) engGain.gain.linearRampToValueAtTime(0, ensureAC().currentTime + 0.25); } catch (e) { }
    engGain = null; engLp = null; announced = false;
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
    /* 0819g — 키보드. C 기내↔외부 · ←→ 좌석 · S 창 덮개 · E 편집기 */
    EGR_on(window, "keydown", function (e) {
      if (e.isComposing || !e.key) return;
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      var k = e.key.toLowerCase();
      if (k === "c") toggleOut();
      else if (k === "s") toggleShade();
      else if (k === "e") setEdit(!editing);
      else if (k === "arrowleft") swapSeat(-1);
      else if (k === "arrowright") swapSeat(+1);
    });
    /* ── 편집기 손 — 끌기·휠 (베스페르 문법) ── */
    EGR_on(window, "pointerdown", function (e) {
      if (!editing) return;
      var t = tuneTarget(e.target); if (!t) return;
      e.preventDefault(); e.stopPropagation();
      var vw2 = window.innerWidth, vh2 = window.innerHeight, R2 = PLATE_W / PLATE_H;
      var w2 = (vw2 / vh2 < R2) ? Math.max(vh2 * R2, vw2) : vw2;
      egrab = { t: t, x: e.clientX, y: e.clientY, w: w2, h: w2 / R2, flip: (side > 0) };
    }, true);
    EGR_on(window, "pointermove", function (e) {
      if (!egrab) return;
      var dx = e.clientX - egrab.x, dy = e.clientY - egrab.y;
      egrab.x = e.clientX; egrab.y = e.clientY;
      /* ⚠ 거울일 때는 화면상 오른쪽이 판에서는 왼쪽이다 — 부호를 뒤집는다 */
      var px = (egrab.flip ? -dx : dx) / egrab.w * 100, py2 = dy / egrab.h * 100;
      if (egrab.t === "grip") { var GP = GRIP(); GP.x += px; GP.y += py2; }
      else monMove(px, py2);
      layout(); tuneSay();
    }, true);
    EGR_on(window, "pointerup", function () {
      if (!egrab) return; egrab = null; saveTuneSoon();
    }, true);
    EGR_on(window, "wheel", function (e) {
      if (!editing) return;
      var t = tuneTarget(e.target); if (!t) return;
      e.preventDefault(); e.stopPropagation();
      var d = e.deltaY > 0 ? -1 : 1;
      if (t === "grip") {
        var GP = GRIP();
        GP.w = Math.max(2, GP.w + d * 0.4); GP.h = Math.max(0.5, GP.h + d * 0.1);
      } else monScale(1 + d * 0.02);
      layout(); tuneSay(); saveTuneSoon();
    }, { passive: false, capture: true });
    loadTune();                      /* 저장된 편집값 — 브라우저 먼저, 서버가 덮는다 */
    paintCabin(route.legs[0][1]);
    mountMonitor(route);             /* ⭐ 좌석 모니터 — layout 이 사다리꼴에 앉힌다 */
    loadRecent();                    /* ⑥ 마지막으로 기록한 책 표지를 데려온다 */
    layout();
    playAnnounce();                  /* 방송 → 끝나면 엔진음이 스르르 (0817 문법) */

    var hud = ROOT.querySelector("#hud"), hudT = 0;
    flight = cruise(route, {
      sky: 6,
      onTick: function (s) {
        SINFO = s;                   /* 기록 저장이 좌표를 읽는다 */
        var now = performance.now();
        if (now - hudT < 400) return; hudT = now;
        paintCabin(s.lon);
        engineTune(s.rel);           /* 낮으면 굵게 · 높으면 멀게 */
        paintInfo(s, route);         /* ⭐ 모니터 비행정보 — 「남은 시간」은 없다(14호) */
        /* msl 노선은 해발이 정본이다 — 「지면 위」로 읽으면 산비탈마다 숫자가 널뛴다 */
        hud.textContent = route.name + " · " + s.leg + " → " + s.next
          + "  ·  " + (route.mode === "msl"
              ? "해발 " + Math.round(s.alt) + "m"
              : "지면 위 " + Math.round(s.rel) + "m")
          + " · " + Math.round(s.kmh) + "km/h";
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
    /* ⚠ 쓰다 만 기록이 있으면 초안으로 건진다 — 방이 걷히기 전에, 이 방이 아직 있을 때.
       늦게 온 응답은 그냥 버려진다(31호 ㉤) — MONEL 이 이미 null 이라 만질 DOM 이 없다. */
    try { clearTimeout(WD.tmr); if (WD.dirty && BOOK) saveNote("draft"); } catch (e) { }
    EGR_clearTimers();
    /* ⚠ 놓아둔 도장을 조용히 거둔다 — 방이 걷히는데 인장만 terra 위에 남으면 안 된다.
       안 누른 것은 손해가 아니므로 나무라지 않고 아무 말도 안 띄운다(3호). */
    try { if (window.EGStamp && EGStamp.withdraw) EGStamp.withdraw(); } catch (e) { }
    try { hush(); } catch (e) { }   /* ⚠ 제 소리는 제 손으로 끈다 — __egHush 는 베스페르 것 */
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
    OUT = false; side = -1; swapping = false;   /* 다음 탑승은 기내 · 왼창에서 */
    SHUT = false; editing = false; egrab = null; cvW = 0; cvH = 0;
    try { clearTimeout(tuneT); } catch (e) { }
    MONEL = null; TAB = "info"; SINFO = null; DESK = null; VEIL = null; RECENT = null;
    MAPF = null; MAPBASE = null; mapSeg = -1; zi = 0; redrawT = 0;
    WD.dirty = false; WD.saving = false;
    /* ⚠ BOOK 은 남긴다 — 같은 세션에서 다시 타면 읽던 책이 그대로 걸려 있는 편이 맞다.
       상태 칸이 아니라 이 창의 기억일 뿐이다(11호와 안 부딪힘 — 저장 안 함) */
    console.log("[EG] 독서비행 방을 걷었습니다 — 카메라를 terra 로 되돌렸습니다.");
  }

  window.egReading = { enter: enter, leave: leave, routes: routes, version: VERSION };
})();
