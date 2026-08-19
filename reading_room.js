/* ══════════════════════════════════════════════════════════════════════════
   EG독서비행 — 방(room) 판 · reading_room.js · v0819i
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

  var VERSION = "0819i";

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
  var CANVAS = { l: 3.613, t: 25.837, w: 71.838, h: 28.947 };     /* 창 넷을 다 덮는 한 장 */
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
          try { opt.onTick({ lat: lat, lon: lon, hd: hd, kmh: kmh, rel: rel, alt: alt, vs: vs, ground: groundH, dist: dist, leg: P(seg)[2], next: P(seg + 1)[2], roll: roll }); }
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
#egrInfo{padding:22px 26px}
#egrInfo .rte{font-size:15px;color:#e6d9ae;letter-spacing:.04em;margin-bottom:4px}
#egrInfo .leg{color:#8fa0b4;font-size:12px;margin-bottom:16px}
#egrInfo .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 22px}
#egrInfo .cell b{display:block;font-weight:normal;color:#5f6a78;font-size:10.5px;
  letter-spacing:.14em;margin-bottom:1px}
#egrInfo .cell span{font-size:17px;color:#dfe6ee;font-variant-numeric:tabular-nums}
#egrInfo .cell small{color:#7d8794;font-size:11px}
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
#egrWrite{position:absolute;left:0;right:0;top:0;bottom:44px;background:#0d1015;
  padding:14px 20px 10px;display:none}
#egrWrite.on{display:flex;flex-direction:column}
#egrWrite .hd{color:#e6d9ae;font-size:13px;margin-bottom:7px;flex:0 0 auto}
#egrWrite textarea{flex:1 1 auto;width:100%;box-sizing:border-box;resize:none;min-height:0;
  background:#12161d;border:1px solid #263041;color:#dfe6ee;padding:12px;border-radius:4px;
  font:13.5px/1.7 'Noto Serif KR',Georgia,serif}
#egrWrite textarea:focus{outline:none;border-color:#8a743c}
#egrWrite .ft{margin-top:8px;display:flex;gap:8px;align-items:center;flex:0 0 auto}
#egrWrite .note-msg{color:#7d8794;font-size:11px;margin-left:auto}`;
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
  }

  /* ══ 판 세우기 ═══════════════════════════════════════════════
     ⚠ 세로 9:16 — 폭은 언제나 화면을 채우고 위아래가 잘린다(v1.4 9호).
     ⭐ 스크롤이 아니다. 판·창밖·덮개가 모두 fixed 이고 panY 하나로 함께 민다.
       ⚠⚠ 좌표계를 둘로 나누면 창밖만 제자리에 남는다(0819 실제로 겪음). */
  var panY = 0, panMin = 0, panMax = 0;
  var OUT = false;                 /* 0819g — 외부 보기. 왕복 하나, 별도 갈래가 아니다(0호) */

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

    /* ⭐ 창밖 — 판과 똑같은 화면 좌표. 둘 다 fixed 라 함께 움직인다.
       0819g · 외부(OUT)면 화면을 통째로 연다 — 잠깐 눈 돌리는 왕복이다(0호) */
    var cv = document.getElementById("cesiumContainer");
    if (cv) {
      cv.style.position = "fixed";
      if (OUT) {
        cv.style.left = "0px"; cv.style.top = "0px";
        cv.style.width = vw + "px"; cv.style.height = vh + "px";
      } else {
        cv.style.left = (cx + w * mx(CANVAS.l, CANVAS.w) / 100) + "px";
        cv.style.top = (top + h * CANVAS.t / 100) + "px";
        cv.style.width = (w * CANVAS.w / 100) + "px";
        cv.style.height = (h * CANVAS.h / 100) + "px";
      }
      cv.style.right = "auto"; cv.style.bottom = "auto";   /* ⚠ terra 의 inset:0 을 푼다 */
      cv.style.zIndex = "4";
      try { if (viewer) viewer.resize(); } catch (e) { }
    }
    /* 창 덮개 — 창보다 조금 크게 잡아 틈이 안 보이게 */
    var sh = ROOT.querySelectorAll(".shade");
    for (var i = 0; i < sh.length; i++) {
      var W = WINS[i]; if (!W) continue;
      sh[i].style.left = (cx + (mx(W.l, W.w) - 1.2) / 100 * w) + "px";
      sh[i].style.top = (top + (W.t - 1.2) / 100 * h) + "px";
      sh[i].style.width = ((W.w + 2.4) / 100 * w) + "px";
      sh[i].style.height = ((W.h + 2.4) / 100 * h) + "px";
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
      + '<div class="grid">'
      + '<div class="cell"><b>현지 시각</b><span id="egrClock">—</span></div>'
      + '<div class="cell"><b>해발 고도</b><span id="egrAlt">—</span> <small>m</small></div>'
      + '<div class="cell"><b>대지 속도</b><span id="egrSpd">—</span> <small>km/h</small></div>'
      + '<div class="cell"><b>승강률</b><span id="egrVs">—</span> <small>m/분</small></div>'
      + '<div class="cell"><b>좌표</b><span id="egrPos" style="font-size:13px">—</span></div>'
      + '<div class="cell"><b>비행 거리</b><span id="egrDist">—</span> <small>km</small></div>'
      + '</div></div>'
      + '<div id="egrBook" class="scr"></div>'
      + '<div id="egrWrite"><div class="hd" id="egrWHd">기록</div>'
      + '<textarea id="egrWBody" placeholder="그 책에 관한 나의 기록"></textarea>'
      + '<div class="ft"><button class="btn" id="egrWSave" type="button">저장</button>'
      + '<button class="btn" id="egrWClose" type="button">닫기</button>'
      + '<span class="note-msg" id="egrWMsg"></span></div></div>'
      + '<div class="tabs"><button id="egrTabI" class="on" type="button">비행정보</button>'
      + '<button id="egrTabB" type="button">읽는 책</button></div>';
    ROOT.appendChild(MONEL);
    EGR_on(MONEL.querySelector("#egrTabI"), "click", function () { setTab("info"); });
    EGR_on(MONEL.querySelector("#egrTabB"), "click", function () { setTab("book"); });
    EGR_on(MONEL.querySelector("#egrWSave"), "click", function () { saveNote("saved"); });
    EGR_on(MONEL.querySelector("#egrWClose"), "click", function () {
      if (WD.dirty) saveNote("draft");
      MONEL.querySelector("#egrWrite").classList.remove("on");
    });
    EGR_on(MONEL.querySelector("#egrWBody"), "input", touched);
    paintBook();
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
  function paintInfo(s) {
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
      Math.abs(s.lat).toFixed(3) + "°" + (s.lat >= 0 ? "N" : "S") + " · "
      + Math.abs(s.lon).toFixed(3) + "°" + (s.lon >= 0 ? "E" : "W");
    MONEL.querySelector("#egrDist").textContent = Math.round(s.dist).toLocaleString();
  }

  /* — 책 화면. 없으면 곧 검색 한 문(20호) — */
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
      + '<button class="btn" id="egrBSwap" type="button">다른 책</button></div></div></div>'
      + noteHtml;
    EGR_on(el.querySelector("#egrWNew"), "click", function () { openWrite(null); });
    EGR_on(el.querySelector("#egrBSwap"), "click", function () { BOOK = null; paintBook(); });
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
    BOOK = b;
    /* ⭐ 표지가 모니터에 걸린다(20호 ⑤) — 좌석에서 꽂은 책도 곧 wunderkammer_books 다(22호) */
    paintBook();
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
    var w = MONEL.querySelector("#egrWrite");
    var go = function (seq, body) {
      WD.seq = seq; WD.dirty = false; WD.sec = 0; WD.last = 0;
      MONEL.querySelector("#egrWHd").textContent = BOOK.title + " · 제" + seq + "회";
      MONEL.querySelector("#egrWBody").value = body || "";
      MONEL.querySelector("#egrWMsg").textContent = "";
      w.classList.add("on");
      MONEL.querySelector("#egrWBody").focus();
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
    if (!BOOK || WD.saving) return;
    var body = MONEL.querySelector("#egrWBody").value;
    if (status === "saved" && !body.trim()) {
      MONEL.querySelector("#egrWMsg").textContent = "아직 쓴 글이 없습니다"; return;
    }
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
      MONEL.querySelector("#egrWMsg").textContent = status === "saved" ? "저장했습니다" : "임시 저장";
      if (status === "saved") loadNotes();
      /* ⚠ 도장(16호)은 stamp_kinds 에 독서비행 줄이 서면 여기서 놓는다 — 원판은 소로 몫 */
    }).catch(function (e) {
      MONEL.querySelector("#egrWMsg").textContent =
        /JWT|auth|401|로그인/i.test(String(e && e.message)) ? "로그인이 필요합니다" : "저장하지 못했습니다";
    }).then(function () { WD.saving = false; });
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
    /* 0819g — 키보드. C 기내↔외부 · ←→ 좌석. 글칸이 쥐고 있으면 손대지 않는다 */
    EGR_on(window, "keydown", function (e) {
      if (e.isComposing || !e.key) return;
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      var k = e.key.toLowerCase();
      if (k === "c") toggleOut();
      else if (k === "arrowleft") swapSeat(-1);
      else if (k === "arrowright") swapSeat(+1);
    });
    paintCabin(route.legs[0][1]);
    mountMonitor(route);             /* ⭐ 좌석 모니터 — layout 이 사다리꼴에 앉힌다 */
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
        paintInfo(s);                /* ⭐ 모니터 비행정보 — 「남은 시간」은 없다(14호) */
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
    MONEL = null; TAB = "info"; SINFO = null;
    WD.dirty = false; WD.saving = false;
    /* ⚠ BOOK 은 남긴다 — 같은 세션에서 다시 타면 읽던 책이 그대로 걸려 있는 편이 맞다.
       상태 칸이 아니라 이 창의 기억일 뿐이다(11호와 안 부딪힘 — 저장 안 함) */
    console.log("[EG] 독서비행 방을 걷었습니다 — 카메라를 terra 로 되돌렸습니다.");
  }

  window.egReading = { enter: enter, leave: leave, routes: routes, version: VERSION };
})();
