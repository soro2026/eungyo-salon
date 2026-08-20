/* ══════════════════════════════════════════════════════════════════════════
   EG독서비행 — 방(room) 판 · reading_room.js · v0820a
   2026.08.20 소로 × 파이스 · 145회차
   ⭐⭐ 0820a — 기록판을 비너스 시안 넉 벌로 다시 지었다.
     ① 색 이름을 --dk- 로 갈랐다. ⚠⚠ 모니터와 **같은 이름에 정반대 값**이기 때문이다
        (A 이른아침: 모니터 ink #e4ecf2 / 기록판 ink #2e3a42). 섞으면 흰 종이에 흰 글자다
     ② 막(#egrVeil)을 걷었다 — 떠 있는 판이라야 밖(C)에서도 창밖을 안 가린다
     ③ 왼쪽 246px 목록 → 78px 회차 타임라인. 책별 묶음은 「책 목록」 층으로
     ④ 끌어 옮기고 모서리로 크기를 바꾼다. 두 번 누르면 설계 크기로 돌아온다
     ⑤ 아래줄이 지금 나는 곳을 흘린다 · 저장 알림은 2초만 그 곳을 빌린다
     ⚠ 손님이 끈 크기(DSIZE)와 설계값(DESK_W·DESK_H)을 한 그릇에 안 담는다 — 0819W 사고
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

  var VERSION = "0820a";

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
       ⚠⚠ 0819R — 3600 이 **낮았다.** 소로 캡처에서 몽블랑 남서 사면을 지나며
          해발 3,887m · 승강률 −398m/분 (㉡ 상한의 하한에 딱 붙음) · 속도 104km/h.
          앞보기가 계속 밀어올리다 내려오기를 되풀이한 것이다 — 진짜 순항이 아니었다.
       ⭐ 3950 으로 올린다. 몽블랑 4,808 · 마터호른 4,478 보다는 낮아 봉우리가 위에 남고,
          어깨선·능선·빙하는 눈높이에 온다. 계곡(400~1500)에서는 여전히 시원하게 높다.
       ⚠ 더 올리면(4200+) 봉우리가 발밑으로 내려가 알프스가 언덕이 된다. 여기가 상한이다. */
    mode: "msl",                     /* 'msl' 절대고도(산악) · 'agl' 지면추종(협곡·해안) */
    msl: 3950,                       /* 순항 해발고도(m) — mode:'msl' 일 때 */
    floor: 320,                      /* 앞 지면과의 최소 여유(m) — 그물. 0819R 250→320 */
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
    /* ⚠⚠ 0819W — 원판 크기(w·h)를 이 객체에서 **뺐다.** 아래 MON_W · MON_H 로 옮겼다.
       까닭은 41호 ㉬ 를 보라 — 편집값이 설계값을 덮어 화면 절반이 사라졌다. */
  };
  /* ⭐⭐ 원판 크기 — **설계값이다. 편집값이 아니다.**
     880×580(비율 1.517)이 사다리꼴 실비율 1.518 에 왜곡 없이 앉는다.
     ⚠⚠ MON 안에 두었다가 0819V 에서 사고가 났다(41호 ㉬). 여기는 아무도 안 덮는다. */
  var MON_W = 880, MON_H = 580;
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
    /* ⭐ 0819T — 시작 지점을 밖에서 받는다. 안 주면 첫 길목(옛 판과 같다).
       ⚠ 11호(「읽는 중」 상태 칸을 안 짓는다)와 안 부딪힌다 —
         그 조항이 막은 것은 **진도**이지 「내가 있던 곳」이 아니다.
         고리에는 끝이 없으므로 진도가 될 수 없고, 남은 것도 셀 수 없다(14호). */
    var seg = Math.max(0, (opt.startSeg | 0)) % N, u = Math.min(0.999, Math.max(0, +opt.startU || 0));
    /* ⚠⚠ 0819 소로 — 「멀리 산을 두고 도시 위를 빙글빙글」.
       첫 판은 목표점을 **좇아가는** 셈이었다. 방위를 한 프레임에 조금씩만 돌리는데
       돌 수 있는 것보다 목표가 옆에 오면 영원히 그 둘레를 돈다 — 꼬리를 쫓는 개다.
       게다가 첫 구간은 Catmull 제어점에 마지막 길목(코르티나·동쪽 끝)이 끼어들어
       목표 자체가 옆으로 틀어져 있었다.
       ⭐ 좇지 않는다. **곡선 위에 태운다** — 자리도 방위도 곡선이 직접 준다.
         표류가 구조적으로 없다. 앞으로 가는 것이 보장된다. */
    function P(i2) { return legAt(route, i2); }
    function onCurve(sg, uu) { return curveOf(route, sg, uu); }
    var pos = onCurve(seg, u);
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
        /* ⭐⭐ 0819T 일시정지 — 창밖이 그 지점에 선다.
           ⚠⚠ tp 를 **매 프레임 계속 밀어야 한다.** 멈춘 동안 tp 를 안 고치면
              재개하는 순간 dt 가 몇 분치로 부풀어 비행기가 순간이동한다.
              그래서 return 을 위가 아니라 여기에 둔다 — tp = now 다음이다.
           ⭐ 카메라는 그대로 두므로 화면은 얼어붙은 게 아니라 「멈춰 서 있다」. */
        if (PAUSED) return;

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
    return { stop: off, routeCode: route.code,
             where: function () { return { seg: seg, u: u }; } };
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
#readingRoom #plate,#readingRoom #plateB{position:absolute;left:0;top:0;width:100%;height:100%;
  pointer-events:none;z-index:6;background-size:100% 100%;background-repeat:no-repeat}
/* ⭐ 윗겹 — 조명이 바뀔 때만 3초에 걸쳐 드러난다. 평소엔 투명하게 겹쳐만 있다 */
#readingRoom #plateB{z-index:7;opacity:0}
#readingRoom .shade{position:fixed;z-index:5;
  background:linear-gradient(#d8cfc0,#cdc3b2 62%,#c0b6a4);
  box-shadow:0 4px 12px rgba(0,0,0,.28) inset;
  transform:translateY(-101%);transition:transform .75s cubic-bezier(.35,.9,.3,1)}
#readingRoom.shut .shade{transform:translateY(0)}
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
/* ⭐ 모서리 손잡이 넷 — 편집 중에만 선다. 한 점씩 끌어 베젤에 맞춘다 */
.egrCorner{display:none;position:fixed;z-index:19;width:22px;height:22px;margin:-11px 0 0 -11px;
  border-radius:50%;cursor:crosshair;pointer-events:auto;
  background:rgba(201,168,106,.22);border:2px solid rgba(201,168,106,.9);
  box-shadow:0 0 10px 2px rgba(0,0,0,.5)}
#readingRoom.edit .egrCorner{display:block}
.egrCorner:hover{background:rgba(240,223,180,.55);transform:scale(1.15)}
.egrCorner::after{content:attr(data-k);position:absolute;left:50%;top:120%;
  transform:translateX(-50%);font:9px Georgia,serif;color:rgba(232,228,216,.75);
  pointer-events:none;text-shadow:0 1px 4px rgba(0,0,0,.9)}
#readingTune{position:fixed;left:18px;bottom:18px;z-index:24;display:none;pointer-events:auto;
  background:rgba(12,15,20,.93);border:1px solid #2a323f;border-radius:8px;padding:11px 15px;
  color:#9aa5b1;font:11.5px/1.75 Georgia,'Noto Serif KR',serif;max-width:440px}
#readingRoom.edit #readingTune{display:block}
#readingTune b{color:#e6d9ae;font-weight:normal}
#readingTune .sv{color:#c9a84c;font-size:11px}
/* ⭐⭐ 저작자 표시 (0819Q · 39호) — 가리지 않는다. 기내에 옮겨 단다.
   ⚠⚠ 0819P 에서 창밖이 화면 전체가 되며 크레딧이 화면 오른쪽 아래로 갔는데,
      그곳은 기내 그림이 덮는다. 즉 **가려졌다.** Cesium·구글 타일 모두
      저작자 표시가 이용 조건이라 그대로 두면 개막 뒤에 걸린다.
   ⭐ 창 아래 호두나무 판 위에 옅게 한 줄 — 실제 기내에도 제조사 명판이 붙어 있다.
      숨기는 대신 제 곳을 주는 쪽이 이 집 문법이고, 실물에도 더 가깝다. */
#readingRoom .cesium-viewer-bottom.eg-plaque{position:fixed;z-index:9;
  left:auto;right:auto;bottom:auto;top:auto;pointer-events:auto;text-align:left}
#readingRoom .cesium-viewer-bottom.eg-plaque .cesium-widget-credits{
  font-size:9px!important;opacity:.62;color:#efe6d2;
  text-shadow:0 1px 2px rgba(0,0,0,.55);line-height:1.5}
#readingRoom .cesium-viewer-bottom.eg-plaque .cesium-widget-credits a{color:#efe6d2}
#readingRoom .cesium-viewer-bottom.eg-plaque:hover .cesium-widget-credits{opacity:.95}
/* 0819g — 좌석 전환·외부 보기·소리 */
#readingRoom.flip #plate,#readingRoom.flip #plateB{transform:scaleX(-1)}   /* 그림만 거울 — 글은 안 뒤집는다 */
#readingRoom.out #plate,#readingRoom.out #plateB,#readingRoom.out .shade{visibility:hidden}
.readingSeat{position:fixed;top:50%;transform:translateY(-50%);z-index:13;width:34px;height:56px;
  cursor:pointer;pointer-events:auto;border:0;background:transparent;color:rgba(240,232,214,.34);
  font-size:30px;line-height:1;text-shadow:0 1px 6px rgba(0,0,0,.8);transition:color .25s}
.readingSeat:hover{color:rgba(240,232,214,.85)}
#readingSeatL{left:6px}#readingSeatR{right:6px}
#readingFade{position:fixed;inset:0;z-index:20;background:#05070f;opacity:0;
  pointer-events:none;transition:opacity .28s}
#readingFade.on{opacity:1}
/* ══ 좌석 모니터 (0819U) — EG 전속 디자이너 비너스 시안 ══════════════════
   ⚠ 원판 880×580(비율 1.517) — 사다리꼴 실비율 1.518 에 왜곡 없이 앉는다.
     시안은 952×566(1.682)이라 우리 판에서는 세로가 남았다. 남는 쪽이라 지도를 키웠다.
   ⚠⚠ 화면 실크기는 517×362px 다. 시안 글자를 그대로 쓰면 라벨이 6px 이 되어 안 읽힌다.
     원판 배율 0.588 을 거꾸로 셈해 **원판 글자를 키웠다** — 라벨 11→18, 지명 12→18.
     화면에서 10.6px 이 되어 겨우 읽힌다. 여기가 하한이다.
   ⭐ 색은 전부 CSS 변수다. 조명 넉 벌이 바뀌면 테마도 함께 바뀐다(setTheme).
     3초 겹치기가 걸려 있어 해 뜰 때 화면도 함께 아침이 된다.
   ⭐ 탭이 없어졌다 — 지도·수치·책이 한 화면에 다 있다. 20호가 「셋이 아니라 둘」이었는데
     하나가 됐다. 책 고르기는 화면을 덮는 판(#egrPick)이 받는다(21호는 그대로). */
#egrMon{position:fixed;left:0;top:0;transform-origin:0 0;z-index:8;pointer-events:auto;
  background:var(--screen,#14110c);color:var(--ink,#efe4cd);overflow:hidden;border-radius:10px;
  font-family:'Noto Sans KR',Georgia,serif;
  transition:background 3s linear,color 3s linear}
#readingRoom.out #egrMon{display:none}
#egrMon .btn{border:1px solid var(--ring,#59492f);background:var(--btn,#3f3524);
  color:var(--glow,#f0dfb4);border-radius:6px;padding:9px 16px;cursor:pointer;
  font:600 17px 'Noto Sans KR',serif;letter-spacing:.02em;
  box-shadow:0 2px 6px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,235,190,.2)}
#egrMon .btn:hover{border-color:var(--accent,#c9a961)}
/* ── 머리줄 ── */
#egrHead{position:absolute;left:34px;right:34px;top:20px;height:56px;display:flex;align-items:flex-start;gap:16px}
#egrHead .t{flex:1;min-width:0}
#egrHead .t b{display:block;font:700 26px 'Noto Serif KR',serif;color:var(--ink,#efe4cd);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color 3s linear}
#egrHead .t small{display:block;font:400 19px 'Noto Sans KR',serif;color:var(--muted,#9a8f77);
  margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color 3s linear}
/* 조작판 — 확대 · 소리 · 멈춤이 한 줄에 모인다(0819U 소로) */
#egrCtl{display:flex;align-items:center;gap:1px;border:1px solid var(--ring,#59492f);
  border-radius:9px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.5);flex:none}
#egrCtl button{height:46px;min-width:46px;padding:0 6px;border:0;cursor:pointer;
  background:var(--btn,#3f3524);color:var(--glow,#f0dfb4);
  font:700 24px Tahoma,sans-serif;line-height:1;display:flex;align-items:center;justify-content:center}
#egrCtl button:disabled{opacity:.32;cursor:default}
#egrCtl button:not(:disabled):hover{color:var(--accent,#c9a961)}
#egrCtl .lv{height:46px;min-width:62px;padding:0 12px;display:flex;align-items:center;
  justify-content:center;background:var(--btn,#3f3524);color:var(--accent2,#c9b586);
  font:600 18px 'Noto Sans KR',serif;letter-spacing:.02em}
#egrCtl .ico{font-size:19px}
#egrCtl .ico.on{color:var(--accent,#c9a961)}
/* ── 항로도 ── */
#egrMap{position:absolute;left:34px;right:34px;top:88px;height:318px;
  border:1px solid var(--ring,#59492f);border-radius:12px;overflow:hidden;
  background:var(--map,#a86e46);box-shadow:inset 0 2px 12px rgba(0,0,0,.45);
  transition:background 3s linear}
#egrMap .gridbg{position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent 0 46px,var(--grid,rgba(70,35,15,.14)) 46px 47px),
             repeating-linear-gradient(90deg,transparent 0 46px,var(--grid,rgba(70,35,15,.14)) 46px 47px)}
#egrMap svg{position:absolute;inset:0;width:100%;height:100%;display:block}
#egrMap .ne-lake{fill:var(--mapDot,#7a4a26);opacity:.28;stroke:var(--mapSub,#5c3418);stroke-width:.8}
#egrMap .ne-border{fill:none;stroke:var(--mapSub,#5c3418);stroke-width:.9;opacity:.42;stroke-dasharray:4 4}
#egrMap .ne-river{fill:none;stroke:var(--mapSub,#5c3418);stroke-width:.9;opacity:.3}
#egrMap .seg{fill:none;stroke:var(--mapDash,#6d4020);stroke-width:1.8;
  stroke-dasharray:2.5 7;stroke-linecap:round}
#egrMap .seg.now{stroke:var(--mapInk,#331b0a);stroke-width:3.4;stroke-dasharray:none}
#egrMap .wp{fill:var(--mapDot,#7a4a26)}
#egrMap .wp.now{fill:var(--mapInk,#331b0a)}
#egrMap .wpt{fill:var(--mapSub,#5c3418);font:500 18px 'Noto Sans KR',serif}
#egrMap .wpt.now{fill:var(--mapInk,#331b0a);font-weight:700;font-size:20px}
#egrMap .wpt.hide{display:none}
/* ⚠ vector-effect — scale 을 키워도 테두리 굵기는 그대로 둔다.
   안 두면 +4 에서 선이 2.6배가 되어 비행기가 뭉툭해진다 */
#egrMap .ship{fill:var(--mapInk,#331b0a);stroke:var(--planeRing,#ffe4c4);stroke-width:1.6;
  stroke-linejoin:round;vector-effect:non-scaling-stroke}
/* ── 아래단 ── */
#egrLow{position:absolute;left:34px;right:34px;top:418px;height:150px;
  display:grid;grid-template-columns:471fr 349fr;gap:12px}
/* ⚠⚠ 0819X — line-height 를 **반드시 적는다.** 안 적으면 브라우저 기본(normal)이
   폰트마다 1.15~1.35 로 달라 셈이 안 맞는다. 0819W 에서 게이지가 175.6px 이 되어
   150px 상자를 25.6px 넘쳤고, 원판 여백 12px 밖으로 나간 만큼 그대로 잘렸다.
   ⭐ 절대 px 로 짠 판은 안에 든 것의 높이를 손으로 셈해 두어야 한다(41호 ㉭). */
#egrGauge{border:1px solid var(--line,#3a3226);border-radius:12px;
  background:var(--panel,#1c1710);box-shadow:inset 0 2px 8px rgba(0,0,0,.5);
  padding:12px 20px;display:grid;grid-template-columns:1fr 1fr;gap:5px 18px;
  transition:background 3s linear}
#egrGauge .c{border-left:2px solid var(--ring,#59492f);padding-left:12px;min-width:0}
#egrGauge .c i{display:block;font:700 17px/1.1 Tahoma,sans-serif;color:var(--muted,#9a8f77);
  letter-spacing:.2em;font-style:normal;transition:color 3s linear}
#egrGauge .c b{display:block;font:700 36px/1 Tahoma,sans-serif;color:var(--glow,#f0dfb4);
  margin-top:2px;letter-spacing:.02em;text-shadow:0 0 12px var(--glowSoft,rgba(240,223,180,.25));
  white-space:nowrap;transition:color 3s linear}
#egrGauge .c b u{font:700 17px Tahoma,sans-serif;color:var(--muted,#9a8f77);
  text-decoration:none;margin-left:3px}
/* 책칸 */
#egrBookBox{position:relative;border:1px solid var(--line,#3a3226);border-radius:12px;
  background:var(--bookBg,rgba(201,169,97,.08));padding:12px 16px 0;
  display:flex;align-items:flex-end;gap:12px;overflow:hidden;transition:background 3s linear}
#egrBookBox .cv{width:112px;height:158px;margin:-18px 0 -24px;border-radius:6px;flex:none;
  object-fit:cover;background:linear-gradient(160deg,#dce8ee,#a9c3d2);
  box-shadow:0 6px 24px rgba(0,0,0,.55);transform:rotate(-4deg);z-index:1;cursor:pointer}
#egrBookBox .shelf{position:absolute;left:0;right:0;bottom:0;height:18px;z-index:2;
  background:var(--pocket,#3a3226);border-top:1px solid var(--ring,#59492f);
  box-shadow:0 -3px 10px rgba(0,0,0,.45);transition:background 3s linear}
#egrBookBox .t{position:relative;z-index:3;display:flex;flex-direction:column;gap:2px;
  padding-bottom:22px;min-width:0;flex:1}
#egrBookBox .t i{font:700 16px/1.15 Tahoma,sans-serif;color:var(--accent,#c9a961);
  letter-spacing:.18em;font-style:normal;transition:color 3s linear}
#egrBookBox .t b{font:700 21px/1.25 'Noto Serif KR',serif;color:var(--ink,#efe4cd);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color 3s linear}
#egrBookBox .t small{font:400 16px/1.2 'Noto Sans KR',serif;color:var(--muted,#9a8f77);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color 3s linear}
#egrBookBox .t a{margin-top:5px;align-self:flex-start;text-decoration:none;
  border:1px solid var(--ring,#59492f);border-radius:6px;padding:6px 13px;cursor:pointer;
  background:var(--btn,#3f3524);color:var(--glow,#f0dfb4);
  font:700 17px/1 Tahoma,sans-serif;letter-spacing:.12em;
  box-shadow:0 2px 6px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,235,190,.2)}
#egrBookBox .t a:hover{border-color:var(--accent,#c9a961)}
#egrBookBox.empty{align-items:center;justify-content:center;padding-bottom:16px;cursor:pointer}
#egrBookBox.empty .t{align-items:center;text-align:center;padding-bottom:0}
/* ── 책 고르기 — 화면을 덮는다 (21호 · 한 문 검색) ── */
#egrPick{position:absolute;inset:0;z-index:5;display:none;padding:22px 30px 20px;
  background:var(--screen,#14110c);transition:background 3s linear}
#egrPick.on{display:flex;flex-direction:column}
#egrPick .top{display:flex;align-items:center;gap:12px;flex:0 0 auto}
#egrPick input{flex:1;box-sizing:border-box;background:var(--panel,#1c1710);
  border:1px solid var(--ring,#59492f);color:var(--ink,#efe4cd);padding:12px 16px;
  border-radius:7px;font:400 20px 'Noto Sans KR',serif}
#egrPick input:focus{outline:none;border-color:var(--accent,#c9a961)}
#egrPick .hint{color:var(--muted,#9a8f77);font:400 17px 'Noto Sans KR',serif;
  margin:10px 4px;line-height:1.6}
#egrPick .list{flex:1 1 auto;min-height:0;overflow:auto;margin-top:6px}
#egrPick .sect{color:var(--muted,#9a8f77);font:700 16px Tahoma,sans-serif;
  letter-spacing:.18em;margin:12px 4px 4px}
#egrPick .row{display:flex;gap:12px;align-items:center;padding:8px 8px;border-radius:6px;cursor:pointer}
#egrPick .row:hover{background:var(--panel,#1c1710)}
#egrPick .row img{width:38px;height:54px;object-fit:cover;border-radius:3px;
  background:var(--panel,#1c1710);flex:none}
#egrPick .row .t{flex:1;min-width:0}
#egrPick .row .t b{display:block;font:400 20px 'Noto Serif KR',serif;color:var(--ink,#efe4cd);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#egrPick .row .t small{font:400 17px 'Noto Sans KR',serif;color:var(--muted,#9a8f77)}
#egrPick .row .tag{font:700 15px Tahoma,sans-serif;color:var(--accent,#c9a961);
  border:1px solid var(--ring,#59492f);border-radius:5px;padding:3px 8px;white-space:nowrap;flex:none}
/* ══ 독서일지 판 (0820a) — EG 전속 디자이너 비너스 시안 넉 벌 ══════════
   ⚠⚠ 색 이름을 --dk- 로 갈라 두었다. 모니터와 **같은 이름에 정반대 값**이기 때문이다.
     모니터 A 이른아침 ink #e4ecf2 (어두운 화면 위 밝은 글자)
     기록판 A 이른아침 ink #2e3a42 (밝은 종이 위 어두운 글자)
     한 그릇에 담으면 흰 종이에 흰 글자가 된다. 0819W 와 같은 갈래의 병이다.
   ⚠ 시안의 판 바깥 배경(desk)은 안 쓴다 — 그 곳에는 진짜 창밖이 있다.
     비너스가 깔아 둔 그라데이션은 모니터 지도 색과 같은 값이라, 배치용으로 둔 것이다.
   ⭐ 막(#egrVeil)을 걷었다. 떠 있는 판이라야 밖에 나가서도 창밖을 안 가린다(0820 소로).
   ⭐ 원판 920×640. ⚠ 손님이 끈 크기는 기억값, 이 수는 설계값 — 섞지 않는다(0819W). */
#egrDesk{position:fixed;z-index:22;display:none;flex-direction:column;
  width:920px;height:640px;left:50%;top:50%;margin:-320px 0 0 -460px;
  background:var(--dk-paper,#faf4ea);border:1px solid var(--dk-frame,#d3c3a4);
  border-radius:22px;box-shadow:0 30px 90px rgba(10,20,30,.45);
  color:var(--dk-ink,#3d3222);font-family:'Noto Sans KR',system-ui,sans-serif;
  overflow:hidden;pointer-events:auto;
  transition:background .6s linear,border-color .6s linear,color .6s linear}
#egrDesk.on{display:flex;flex-direction:row}
#egrDesk.drag{opacity:.94}
#egrDesk.sizing{transition:none}
/* ── 왼쪽 레일 — 회차 타임라인 (78px) ── */
#egrDesk .rail{width:78px;flex:0 0 auto;display:flex;flex-direction:column;align-items:center;
  padding:22px 0 18px;box-sizing:border-box;
  background:var(--dk-rail,#f0e6d4);border-right:1px solid var(--dk-line,#e6dbc4);
  transition:background .6s linear}
#egrDesk .tl{flex:1 1 auto;min-height:0;width:100%;overflow:auto;
  display:flex;flex-direction:column;align-items:center;
  scrollbar-width:none}
#egrDesk .tl::-webkit-scrollbar{display:none}
#egrDesk .tl .lk{width:1px;height:26px;background:var(--dk-line2,#d8c9ab);flex:none}
#egrDesk .tl .nd{display:flex;flex-direction:column;align-items:center;cursor:pointer;flex:none}
#egrDesk .tl .nd i{width:7px;height:7px;border-radius:50%;background:var(--dk-dot,#c4ad88);
  font-style:normal;flex:none;transition:background .25s,box-shadow .25s}
#egrDesk .tl .nd b{display:block;margin-top:5px;font:500 11px 'Noto Sans KR';
  color:var(--dk-muted,#9a8a6e);text-align:center;line-height:1.3;font-weight:500}
#egrDesk .tl .nd small{display:block;font:500 10px Tahoma,sans-serif;
  color:var(--dk-muted,#9a8a6e)}
#egrDesk .tl .nd.on i{width:9px;height:9px;background:var(--dk-accent,#a8642f);
  box-shadow:0 0 0 3px var(--dk-accentSoft,#f3e2cd)}
#egrDesk .tl .nd.on b,#egrDesk .tl .nd.on small{color:var(--dk-accent,#a8642f);font-weight:700}
#egrDesk .tl .none{font:500 11px 'Noto Sans KR';color:var(--dk-muted,#9a8a6e);
  text-align:center;line-height:1.6;padding:8px 6px}
#egrDesk .books{width:40px;height:40px;border-radius:12px;flex:none;cursor:pointer;
  border:1px solid var(--dk-line2,#d8c9ab);background:var(--dk-paper,#faf4ea);
  display:flex;align-items:center;justify-content:center;gap:2px;padding:0;
  box-shadow:0 1px 3px rgba(40,35,25,.15)}
#egrDesk .books:hover{border-color:var(--dk-accent,#a8642f)}
#egrDesk .books s{width:4px;border-radius:1px;text-decoration:none;display:block}
#egrDesk .books s:nth-child(1){height:13px;background:var(--dk-dot,#c4ad88)}
#egrDesk .books s:nth-child(2){height:16px;background:var(--dk-accent,#a8642f)}
#egrDesk .books s:nth-child(3){height:11px;background:var(--dk-line2,#d8c9ab)}
#egrDesk .rail .cap{font:500 9.5px 'Noto Sans KR';color:var(--dk-muted,#9a8a6e);margin-top:5px}
/* ── 오른쪽 본체 ── */
#egrDesk .main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;position:relative}
/* 탭 줄 — ⭐ 여기를 잡고 판을 끈다(머리줄이 따로 없는 시안이라 이 줄이 그 몫을 한다) */
#egrDesk .top{display:flex;align-items:center;gap:8px;padding:16px 22px 0;
  flex:0 0 auto;cursor:grab}
#egrDesk .top.grabbing{cursor:grabbing}
#egrDesk .tabs{display:flex;gap:6px;align-items:center}
#egrDesk .tabs button{font:500 11.5px 'Noto Sans KR';color:var(--dk-muted,#9a8a6e);
  background:var(--dk-tab,#f4ecdc);border:1px solid var(--dk-line,#e6dbc4);border-bottom:none;
  border-radius:8px 8px 0 0;padding:6px 12px 8px;margin-bottom:-1px;cursor:pointer}
#egrDesk .tabs button.on{color:var(--dk-accent,#a8642f);font-weight:700;
  background:var(--dk-paper,#faf4ea)}
#egrDesk .sp{flex:1}
#egrDesk .fs{font:600 12px 'Noto Sans KR';color:var(--dk-muted,#9a8a6e);cursor:pointer;
  border:1px solid var(--dk-line2,#d8c9ab);border-radius:7px;padding:4px 9px;background:none}
#egrDesk .fs:hover{color:var(--dk-accent,#a8642f);border-color:var(--dk-accent,#a8642f)}
#egrDesk .x{font:400 16px 'Noto Sans KR';color:var(--dk-muted,#9a8a6e);padding:2px 6px;
  border:0;background:none;cursor:pointer;line-height:1}
#egrDesk .x:hover{color:var(--dk-accent,#a8642f)}
/* 종이 */
#egrDesk .sheet{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;
  border-top:1px solid var(--dk-line,#e6dbc4)}
#egrDesk .ttl{display:flex;align-items:baseline;gap:10px;padding:18px 26px 0;flex:0 0 auto}
#egrDesk .ttl b{font:700 16px 'Noto Serif KR',serif;color:var(--dk-ink,#3d3222);white-space:nowrap}
#egrDesk .ttl small{font:400 12.5px 'Noto Sans KR';color:var(--dk-muted,#9a8a6e);white-space:nowrap}
/* ⚠ 오른쪽 270px 를 비운다 — 책 표지가 그 곳에 걸린다(시안).
   ⚠⚠ line-height 를 반드시 적는다. 안 적으면 브라우저 기본이 폰트마다 갈린다(41호 ㉭) */
#egrDesk textarea{flex:1 1 auto;min-height:0;width:auto;box-sizing:border-box;resize:none;
  margin:12px 270px 0 26px;padding:0;border:0;background:transparent;
  font-family:'Noto Serif KR',Georgia,serif;font-size:17px;line-height:1.95;
  color:var(--dk-ink2,#4a3e2c);transition:color .6s linear}
#egrDesk textarea::placeholder{color:var(--dk-muted,#9a8a6e);opacity:.65}
#egrDesk textarea:focus{outline:none}
#egrDesk.narrow textarea{margin-right:26px}
/* 아래줄 — 지금 나는 곳 · 글자수 · 걸린 시간 */
#egrDesk .ft{display:flex;align-items:center;gap:10px;padding:12px 22px 16px;flex:0 0 auto}
#egrDesk .ft .place{font:500 11.5px 'Noto Sans KR';color:var(--dk-muted,#9a8a6e);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:46%}
#egrDesk .ft .mid{font:400 11px 'Noto Sans KR';color:var(--dk-line2,#d8c9ab)}
#egrDesk .ft .cnt{font:500 11.5px 'Noto Sans KR';color:var(--dk-accent,#a8642f);white-space:nowrap}
#egrDesk .ft .btn{font:500 12.5px 'Noto Sans KR';cursor:pointer;white-space:nowrap;
  border-radius:999px;padding:7px 16px;
  border:1px solid var(--dk-line2,#d8c9ab);background:none;color:var(--dk-accent,#a8642f)}
#egrDesk .ft .btn:hover{border-color:var(--dk-accent,#a8642f)}
#egrDesk .ft .btn.go{font-weight:600;padding:8px 22px;border:0;
  background:var(--dk-btn,linear-gradient(180deg,#c07a3e,#a8642f));color:var(--dk-btnFg,#faf4ea);
  box-shadow:0 3px 10px rgba(0,0,0,.25)}
#egrDesk .ft .btn:disabled{opacity:.45;cursor:default}
/* 책 표지 — −5° 로 걸린다 */
#egrDesk .cover{position:absolute;right:44px;bottom:70px;width:178px;height:300px;
  object-fit:cover;border-radius:8px;transform:rotate(-5deg);cursor:pointer;
  background:linear-gradient(160deg,#dce8ee,#a9c3d2);
  box-shadow:14px 16px 22px -6px rgba(10,25,40,.45)}
#egrDesk.narrow .cover{display:none}
/* 크기 조절 손잡이 — ⚠ 최소가 없으면 0 으로 접혀 다시 못 잡는다 */
#egrDesk .grip{position:absolute;right:6px;bottom:6px;width:16px;height:16px;z-index:4;
  border-right:2px solid var(--dk-line2,#d8c9ab);border-bottom:2px solid var(--dk-line2,#d8c9ab);
  border-radius:0 0 6px 0;cursor:nwse-resize;opacity:.75}
#egrDesk .grip:hover{opacity:1;border-color:var(--dk-accent,#a8642f)}
/* ── 책 목록 층 (0820a 소로) — 판을 덮는다 ──
   ⭐ 왼쪽 246px 목록이 78px 레일로 줄면서 갈 곳이 이 층뿐이었다.
   ⚠ 검색은 안 붙인다 — 그것은 모니터의 몫이다(21호 · 검색은 한 문) */
#egrDesk .booklist{position:absolute;inset:0;z-index:6;display:none;flex-direction:column;
  background:var(--dk-paper,#faf4ea);border-radius:22px}
#egrDesk .booklist.on{display:flex}
#egrDesk .booklist .bh{display:flex;align-items:center;gap:10px;padding:18px 24px 12px;
  border-bottom:1px solid var(--dk-line,#e6dbc4);flex:0 0 auto}
#egrDesk .booklist .bh b{font:700 15px 'Noto Serif KR',serif;color:var(--dk-ink,#3d3222)}
#egrDesk .booklist .bh small{font:400 12px 'Noto Sans KR';color:var(--dk-muted,#9a8a6e)}
#egrDesk .booklist .bl{flex:1 1 auto;min-height:0;overflow:auto;padding:10px 18px 18px}
#egrDesk .booklist .bk{display:flex;gap:14px;padding:12px 8px;border-radius:10px}
#egrDesk .booklist .bk:hover{background:var(--dk-tab,#f4ecdc)}
#egrDesk .booklist .bk img{width:52px;height:74px;object-fit:cover;border-radius:4px;flex:none;
  background:var(--dk-tab,#f4ecdc);box-shadow:0 3px 10px rgba(20,15,5,.2);cursor:pointer}
#egrDesk .booklist .bk .bi{flex:1;min-width:0}
#egrDesk .booklist .bk .bi b{display:block;font:600 14px 'Noto Serif KR',serif;
  color:var(--dk-ink,#3d3222);cursor:pointer;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#egrDesk .booklist .bk .bi small{display:block;font:400 11.5px 'Noto Sans KR';
  color:var(--dk-muted,#9a8a6e);margin-top:2px}
#egrDesk .booklist .ents{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
#egrDesk .booklist .ent{font:500 11.5px 'Noto Sans KR';cursor:pointer;
  border:1px solid var(--dk-line2,#d8c9ab);border-radius:999px;padding:4px 11px;
  color:var(--dk-muted,#9a8a6e);background:none;max-width:230px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#egrDesk .booklist .ent:hover{color:var(--dk-accent,#a8642f);border-color:var(--dk-accent,#a8642f)}
#egrDesk .booklist .ent u{text-decoration:none;color:var(--dk-accent,#a8642f);font-weight:700;
  margin-right:5px}
#egrDesk .booklist .ent i{font-style:normal;color:var(--dk-dot,#c4ad88);margin-left:5px}
#egrDesk .booklist .none{font:400 12.5px 'Noto Sans KR';color:var(--dk-muted,#9a8a6e);
  padding:26px 10px;line-height:1.8;text-align:center}
/* ⚠ 0820a — #egrVeil 을 걷었다. 막이 있으면 밖에 나가서 창밖을 볼 때 그 위에 어둠이 덮인다.
   ⭐ 그리고 .out 에 #egrDesk 규칙을 안 둔다 — 밖에서도 판은 살아 있어야 한다(0820 소로) */`;

    document.head.appendChild(css);
  }

  function mountHtml() {
    ROOT = document.createElement("div");
    ROOT.id = "readingRoom";
    ROOT.innerHTML = '<div id="fit"><div id="plate"></div><div id="plateB"></div></div>'
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
    /* ⚠ 0819U — 소리·멈춤 단추를 밖에서 걷었다. 모니터 조작판으로 들어갔다(소로).
       화면 가장자리에 셋이 세로로 서 있던 것이 × 하나만 남는다. */
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
  var PAUSED = false;              /* 0819T — 일시정지. cruise 루프가 이 값을 본다 */

  /* ══ 이어 타기 (0819T) ═════════════════════════════════════════════
     ⚠ 소로 0819: 「꽤 왔는데 다시 리셋하면 처음부터 시작하는 게 너무 아까운데」
     ⭐ 나갔던 곳을 적어 두었다가 다시 타면 거기서 시작한다. 책갈피와 같은 물건이다.
     ⚠⚠ 서버에 안 적는다 — 브라우저에만. 11호가 「저장하면 어긋나는 날이 온다」고
        경계한 그 곳이라, 어긋나도 잃을 것이 없는 데에만 둔다.
     ⚠ 열두 시간이 지나면 잊는다. 어제 날던 곳을 오늘 이어 타는 건 책갈피가 아니라
       기록이고, 그건 이 방이 안 하는 일이다.
     ⚠ 아무 말도 안 띄운다 — 「이어서 탑승합니다」 같은 알림 없이 그냥 거기 있다(3호 문법). */
  var RESUME_KEY = "eg_read_where", RESUME_MS = 12 * 3600 * 1000;
  function readResume(code) {
    try {
      var w = JSON.parse(localStorage.getItem(RESUME_KEY) || "null");
      if (!w || w.code !== code) return null;
      if (Date.now() - (w.at || 0) > RESUME_MS) return null;
      return { seg: w.seg | 0, u: +w.u || 0 };
    } catch (e) { return null; }
  }
  function writeResume() {
    try {
      if (!flight || !flight.where) return;
      var w = flight.where();
      localStorage.setItem(RESUME_KEY, JSON.stringify({
        code: flight.routeCode, seg: w.seg, u: w.u, at: Date.now() }));
    } catch (e) { }
  }
  function togglePause() {
    PAUSED = !PAUSED;
    syncCtl();                       /* ⭐ 모니터 안 단추도 함께 */
    /* ⭐ 멈춘 동안에도 있던 곳을 적어 둔다 — 창을 그냥 닫아도 안 잃는다 */
    if (PAUSED) writeResume();
  }

  /* ⭐ 덮개 손잡이 — 그림 속 그 곳 위에 얹는 투명 판. 좌·우 따로(거울이라 홈이 안 대칭).
     ⚠ 처음 값은 어림이다. 소로가 E 편집기로 맞춰 저장하시면 서버 값이 이깁니다. */
  var GRIP_L = { x: 20.0, y: 27.0, w: 9.0, h: 1.8 };
  var GRIP_R = { x: 20.0, y: 27.0, w: 9.0, h: 1.8 };
  function GRIP() { return side < 0 ? GRIP_L : GRIP_R; }
  var TUNE_KEY = "reading_tune";   /* eg_settings.key — 베스페르는 cruise_tune */
  /* ⭐ 저작자 표시가 앉을 곳 — 창 아래 호두나무 판 위 (판 좌표 %, 실측 0819)
     ⚠ 좌석(밝은 베이지)이 y 70% 아래 왼쪽을 침범한다. 64.5% 가 안전하다. */
  var PLAQUE = { x: 4.2, y: 64.5 };
  var CREDIT_HOME = null;

  /* ══ 타일 안정화 — 방에 있는 동안만 (0819Z) ═══════════════════════════
     ⚠⚠ 소로 0819: 「멀리 산들이 번쩍번쩍 불안정하다」. terra 에서 넷을 잡았지만
        독서비행은 조건이 더 나쁘다 — **해발 3.9km 저고도 순항**이라 지평선까지
        수백 km 가 한 화면에 들어오고, 그 먼 것들이 쉼 없이 LOD 를 갈아탄다.
     ⭐ 방에 있는 동안만 한 겹 더 조인다. 나갈 때 원래대로 돌려놓는다 —
        terra 와 다른 우주가 제 값으로 살아야 한다(카메라 되돌리기와 같은 문법).
     ⚠ 값을 적어 두고 그대로 되돌린다. 「기본값이 이랬겠지」로 되돌리면 언젠가 어긋난다. */
  var TILE_SAVE = null;
  function tuneTiles(on) {
    var ts = window.egTileset;
    if (!ts) return;
    try {
      if (on) {
        if (TILE_SAVE) return;
        TILE_SAVE = { sse: ts.maximumScreenSpaceError,
                      den: ts.dynamicScreenSpaceErrorDensity,
                      fac: ts.dynamicScreenSpaceErrorFactor,
                      dyn: ts.dynamicScreenSpaceError,
                      skip: ts.skipLevelOfDetail,
                      bfc: ts.backFaceCulling };
        ts.skipLevelOfDetail = false;
        ts.dynamicScreenSpaceError = true;
        /* ⭐ 멀리를 더 과감히 놓아 준다 — 저고도라 먼 것이 아주 많다.
           density 를 키우면 「먼 곳」의 기준이 가까워져, 지평선 쪽이 일찍 뭉개진다.
           ⚠ 뭉개지는 게 아니라 **안 바뀌는 것**이 목적이다. 번쩍임은 바뀔 때 난다. */
        ts.dynamicScreenSpaceErrorDensity = 0.0062;
        ts.dynamicScreenSpaceErrorFactor = 6.0;
        ts.maximumScreenSpaceError = 20;      /* 기본 16 → 20. 갈아타는 횟수 자체를 줄인다 */
        /* ⚠ 0819 캡처의 **파란 삼각형** — 봉우리를 스칠 때 카메라가 타일 껍질 안으로
           들어가 뒷면이 보인 것이다. backFaceCulling 을 켜면 뒷면을 아예 안 그린다.
           ⭐ 그물(floor 320)이 이미 막고 있지만, 한 프레임이라도 뚫으면 눈에 띈다. */
        if ('backFaceCulling' in ts) ts.backFaceCulling = true;
        console.log("[EG] 기내 타일 설정 — SSE 20 · dynDensity 0.0062 · skipLOD off");
      } else {
        if (!TILE_SAVE) return;
        ts.maximumScreenSpaceError = TILE_SAVE.sse;
        ts.dynamicScreenSpaceErrorDensity = TILE_SAVE.den;
        ts.dynamicScreenSpaceErrorFactor = TILE_SAVE.fac;
        ts.dynamicScreenSpaceError = TILE_SAVE.dyn;
        ts.skipLevelOfDetail = TILE_SAVE.skip;
        if ('bfc' in TILE_SAVE && 'backFaceCulling' in ts) ts.backFaceCulling = TILE_SAVE.bfc;
        TILE_SAVE = null;
        console.log("[EG] 타일 설정을 terra 것으로 돌려놓았습니다");
      }
    } catch (e) { console.warn("[EG] 타일 설정을 못 만졌습니다:", e); }
  }

  /* Cesium 크레딧 판을 방 안으로 데려온다 — 그냥 DOM 요소라 옮겨도 안 부서진다.
     ⭐ Cesium 이 creditContainer 옵션으로 바깥 요소를 지정하는 것을 공식 지원하므로
       옮기는 것은 정상 용법이다. 방을 걷을 때 제자리로 돌려놓는다. */
  function moveCredits(into) {
    var c = document.querySelector(".cesium-viewer-bottom");
    if (!c) return;
    if (into) {
      if (!CREDIT_HOME) CREDIT_HOME = c.parentNode;
      if (ROOT) { ROOT.appendChild(c); c.classList.add("eg-plaque"); }
    } else {
      c.classList.remove("eg-plaque");
      c.style.left = c.style.top = "";
      if (CREDIT_HOME) { CREDIT_HOME.appendChild(c); CREDIT_HOME = null; }
    }
  }

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
    if (!on) { clearPreview(); pushTune(); }   /* ⚠ 미리보기가 화면에 눌러앉지 않게 */
    else { mountMonHandles(); layout(); tuneSay(); }
  }
  function tuneTarget(el) {
    if (!el || !el.closest) return null;
    if (el.closest(".egrCorner")) return "corner";   /* ⭐ 모서리가 먼저 — 모니터 위에 얹혀 있다 */
    if (el.closest("#readingGrip")) return "grip";
    if (el.closest("#egrMon")) return "mon";
    return null;
  }
  /* ⭐⭐ 0819W 소로 — 「베젤이 여러 겹이라, 짙은 외곽 베젤에 얇게 맞춰 줘요」.
     ⚠ 통째로 옮기고 통째로 키우는 것만으로는 베젤에 못 맞춘다. 화면이 사다리꼴이라
       모서리마다 어긋나는 양이 다르기 때문이다 — **한 점씩 잡아야 한다.**
     ⭐ 그래서 편집 중에는 네 모서리에 손잡이가 뜬다. 하나를 끌면 그 점만 움직이고,
       가운데를 끌면 넷이 함께 움직인다(옛 문법 그대로). */
  var MON_KEYS = ["tl", "tr", "br", "bl"];
  var MON_KO = { tl: "좌상", tr: "우상", br: "우하", bl: "좌하" };
  function monMove(dxp, dyp, only) {
    (only ? [only] : MON_KEYS).forEach(function (k) { MON[k][0] += dxp; MON[k][1] += dyp; });
  }
  function monScale(f) {
    var mx0 = 0, my0 = 0;
    MON_KEYS.forEach(function (k) { mx0 += MON[k][0] / 4; my0 += MON[k][1] / 4; });
    MON_KEYS.forEach(function (k) {
      MON[k][0] = mx0 + (MON[k][0] - mx0) * f;
      MON[k][1] = my0 + (MON[k][1] - my0) * f;
    });
  }
  /* 모서리 손잡이 넷 — 편집 중에만 선다. 방(ROOT) 안이라 KEEP 을 안 늘린다 */
  function mountMonHandles() {
    if (!ROOT || ROOT.querySelector(".egrCorner")) return;
    MON_KEYS.forEach(function (k) {
      var h = document.createElement("div");
      h.className = "egrCorner"; h.setAttribute("data-k", k);
      h.title = MON_KO[k] + " 모서리 — 끌어서 베젤에 맞춥니다";
      ROOT.appendChild(h);
    });
  }
  function tuneSay() {
    var box = ROOT && ROOT.querySelector("#readingTune");
    if (!box) return;
    box.innerHTML = '<b>편집 중</b> &mdash; <b>E</b> 로 닫으면 저장됩니다.<br>'
      + '⭐ <b>모서리 넷</b>을 하나씩 끌어 짙은 베젤 안쪽에 맞추십시오.<br>'
      + '&nbsp;&nbsp;모서리 위 <b>휠</b> = 위아래 0.05% · <b>Shift+휠</b> = 좌우<br>'
      + '&nbsp;&nbsp;모니터 가운데를 끌면 넷이 함께 · 그 위 휠 = 크기<br>'
      + '<b>T</b> — 조명 미리보기 · 지금 '
      + (PREVIEW ? '<span class="sv">' + THEME_KO[PREVIEW] + '</span>' : '진짜 시각')
      + '<br><span class="sv">'
      + MON_KEYS.map(function (k) {
          return MON_KO[k] + ' ' + MON[k][0].toFixed(2) + ',' + MON[k][1].toFixed(2);
        }).join(' · ')
      + '</span>';
  }
  /* ⚠⚠ 41호 ㉬ — 편집값에 **설계값을 섞지 않는다.** 네 모서리만 적는다.
     0819V 에서 MON 을 통째로 적었더니 옛 원판 크기(620×424)가 함께 저장됐고,
     새 설계(880×580)를 덮어 아래단이 화면 밖으로 나갔다. */
  function tuneNow() {
    return { GL: GRIP_L, GR: GRIP_R,
             MON: { tl: MON.tl, tr: MON.tr, br: MON.br, bl: MON.bl } };
  }
  function applyTune(v) {
    if (!v) return;
    if (v.GL) GRIP_L = v.GL;
    if (v.GR) GRIP_R = v.GR;
    /* ⚠⚠ w·h 는 읽지 않는다 — 이미 저장된 헌 값(620×424)이 서버에 남아 있고,
       그것이 0819V 의 화면을 반토막 냈다. 원판 크기는 설계가 정한다. */
    if (v.MON && v.MON.tl) { MON.tl = v.MON.tl; MON.tr = v.MON.tr; MON.br = v.MON.br; MON.bl = v.MON.bl; }
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
    /* 먼저 브라우저 값으로 그려 두고, 서버 값이 오면 덮는다 (베스페르 문법)
       ⚠⚠ 0819W — 브라우저에 남은 헌 값에도 w·h 가 들어 있다. applyTune 이 이미
          무시하지만, 씻어 두지 않으면 다음에 저장할 때 되살아날 길이 남는다. */
    try {
      var lv = JSON.parse(localStorage.getItem("eg_reading_tune") || "null");
      if (lv && lv.MON) { delete lv.MON.w; delete lv.MON.h;
        try { localStorage.setItem("eg_reading_tune", JSON.stringify(lv)); } catch (e2) { } }
      applyTune(lv);
    } catch (e) { }
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
    /* 모서리 손잡이 넷 — 모니터 네 점 위에 (편집 중에만 보인다) */
    var cs = ROOT.querySelectorAll(".egrCorner");
    for (var ci = 0; ci < cs.length; ci++) {
      var kk = cs[ci].getAttribute("data-k"), pc = MON[kk];
      cs[ci].style.left = (cx + (flip ? (100 - pc[0]) : pc[0]) / 100 * w) + "px";
      cs[ci].style.top = (top + pc[1] / 100 * h) + "px";
    }
    /* ⭐ 저작자 표시 명판 (39호) — 판을 따라간다. 기내에 붙은 것이므로.
       ⚠ 외부 보기(C)에서는 기내가 없으니 화면 왼쪽 아래로 물러선다 */
    var cr = ROOT.querySelector(".cesium-viewer-bottom.eg-plaque");
    if (cr) {
      if (OUT) { cr.style.left = "12px"; cr.style.top = (vh - 26) + "px"; }
      else {
        cr.style.left = (cx + (flip ? (100 - PLAQUE.x - 26) : PLAQUE.x) / 100 * w) + "px";
        cr.style.top = (top + PLAQUE.y / 100 * h) + "px";
      }
    }
    /* 모니터 — 사다리꼴 네 점에 앉힌다(0819h). 판 % → 화면 px → matrix3d.
       ⚠ 오른창(거울)이면 x' = 100−x 에 좌·우 모서리도 서로 바뀐다 —
         TL↔TR · BL↔BR 을 안 바꾸면 변환이 안팎으로 뒤집혀 글이 거울이 된다 */
    if (MONEL) {
      function px(c) { return [cx + w * (flip ? (100 - c[0]) : c[0]) / 100, top + h * c[1] / 100]; }
      var pts = flip
        ? [px(MON.tr), px(MON.tl), px(MON.bl), px(MON.br)]
        : [px(MON.tl), px(MON.tr), px(MON.br), px(MON.bl)];
      MONEL.style.transform = homography(MON_W, MON_H, pts);
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
  /* ⭐⭐ 모니터 테마 넉 벌 (0819U) — EG 전속 디자이너 비너스 시안 A·B·C·D.
     ⚠⚠ 비너스가 넷을 그려 왔는데 **기내 조명 넉 벌과 정확히 짝**이었다.
        cabinFor() 가 이미 태양시로 넷을 가르고 있으므로 셈을 하나도 안 더한다 —
        해가 뜨면 기내와 모니터가 **함께** 아침이 된다.
     ⭐ 3초 겹치기(0819Q)도 그대로 얹힌다. CSS 변수라 transition 이 걸린다.
     ⚠ 색 이름은 비너스 시안의 것을 한 글자도 안 바꿨다. 다음에 시안이 오면
       이 표만 갈아끼우면 되고, 배치 코드는 손대지 않는다. */
  var THEME = {
    m: {   /* A · 이른 아침 — 새벽 안개, 은청색 */
      screen: "#10141a", ink: "#e4ecf2", muted: "#8595a3", accent: "#8fb0c9",
      accent2: "#a9c3d2", glow: "#dceaf5", glowSoft: "rgba(190,220,245,.3)",
      ring: "#3d4c59", line: "#28323c",
      btn: "linear-gradient(180deg,#333f4a,#1a2129)",
      panel: "linear-gradient(180deg,#161c23,#10151b)",
      bookBg: "linear-gradient(135deg,rgba(143,176,201,.12),rgba(143,176,201,.02))",
      pocket: "linear-gradient(180deg,#333f4a,#1a2129)",
      map: "linear-gradient(180deg,#aebfca,#8ea3b1 60%,#7e93a1)",
      grid: "rgba(30,45,60,.12)", mapInk: "#16242f", mapSub: "#33475a",
      mapDash: "#31465a", mapDot: "#3d5468", planeRing: "#e8f2fa"
    },
    d: {   /* B · 한낮 — 맑은 하늘, 아이보리·스카이 */
      screen: "#f4f2ec", ink: "#33322c", muted: "#8a8676", accent: "#3d6e8f",
      accent2: "#3d6e8f", glow: "#2c3a44", glowSoft: "rgba(60,90,110,.15)",
      ring: "#c6c1ae", line: "#ddd8c8",
      btn: "linear-gradient(180deg,#ffffff,#e4e0d3)",
      panel: "linear-gradient(180deg,#fbf9f3,#efece2)",
      bookBg: "linear-gradient(135deg,rgba(61,110,143,.1),rgba(61,110,143,.02))",
      pocket: "linear-gradient(180deg,#d6d1c0,#b9b4a2)",
      map: "linear-gradient(180deg,#cfe3ef,#b1cfe0 60%,#9fc2d6)",
      grid: "rgba(40,80,110,.1)", mapInk: "#1d3a4d", mapSub: "#3d6079",
      mapDash: "#4d7690", mapDot: "#5a86a0", planeRing: "#ffffff"
    },
    e: {   /* C · 저녁 노을 — 황동·앰버 (비너스 「현재 확정안」) */
      screen: "#14110c", ink: "#efe4cd", muted: "#9a8f77", accent: "#c9a961",
      accent2: "#c9b586", glow: "#f0dfb4", glowSoft: "rgba(240,223,180,.25)",
      ring: "#59492f", line: "#3a3226",
      btn: "linear-gradient(180deg,#3f3524,#241d12)",
      panel: "linear-gradient(180deg,#1c1710,#151109)",
      bookBg: "linear-gradient(135deg,rgba(201,169,97,.1),rgba(201,169,97,.02))",
      pocket: "linear-gradient(180deg,#3a3226,#241d12)",
      map: "linear-gradient(180deg,#c98d5f,#a86e46 60%,#8f5a38)",
      grid: "rgba(70,35,15,.14)", mapInk: "#331b0a", mapSub: "#5c3418",
      mapDash: "#6d4020", mapDot: "#7a4a26", planeRing: "#ffe4c4"
    },
    n: {   /* D · 한밤 — 심야 네이비, 달빛 */
      screen: "#0c0f16", ink: "#dbe2ee", muted: "#6d7686", accent: "#7ea3c2",
      accent2: "#8fa8c0", glow: "#c4d6ea", glowSoft: "rgba(150,190,230,.3)",
      ring: "#333d4f", line: "#222a38",
      btn: "linear-gradient(180deg,#28303f,#141924)",
      panel: "linear-gradient(180deg,#12161f,#0d1119)",
      bookBg: "linear-gradient(135deg,rgba(126,163,194,.1),rgba(126,163,194,.02))",
      pocket: "linear-gradient(180deg,#28303f,#141924)",
      map: "linear-gradient(180deg,#2b3a52,#1f2c40 60%,#182335)",
      grid: "rgba(160,190,230,.07)", mapInk: "#c4d6ea", mapSub: "#6d84a0",
      mapDash: "#44587a", mapDot: "#4d648a", planeRing: "#0c0f16"
    }
  };
  /* ⭐⭐ 기록판 팔레트 (0820a) — EG 전속 디자이너 비너스 시안 넉 벌. 값은 시안 소스 그대로.
     ⚠⚠ 모니터 THEME 과 **이름이 겹치는데 값이 정반대**다. 그래서 --dk- 로 가른다.
        모니터는 어두운 화면 위 밝은 글자, 기록판은 밝은 종이 위 어두운 글자다.
     ⚠ 시안의 판 바깥 배경(desk)은 안 옮겼다 — 그 곳에는 진짜 창밖이 있다.
        비너스가 깔아 둔 그라데이션은 모니터 지도 색과 같은 값이라 배치용으로 둔 것이다. */
  var DESK_THEME = {
    m: {   /* A · 이른 아침 — 새벽 안개, 은청색 */
      paper: "#f4f6f7", rail: "#e7ecef", frame: "#c2ccd3", line: "#dde4e8",
      line2: "#c5cfd6", tab: "#edf1f3", ink: "#2e3a42", ink2: "#3c4a54",
      muted: "#7f8e99", accent: "#4a7590", accentSoft: "#d8e6ee", dot: "#a4b4bf",
      btn: "linear-gradient(180deg,#5d8aa5,#4a7590)", btnFg: "#f2f6f8"
    },
    d: {   /* B · 한낮 — 종이·하늘 (비너스 「확정 기준안」) */
      paper: "#f6f4ee", rail: "#ece9df", frame: "#c6c1ae", line: "#ddd8c8",
      line2: "#d1ccba", tab: "#f0ede3", ink: "#33322c", ink2: "#3f3c33",
      muted: "#8a8676", accent: "#3d6e8f", accentSoft: "#dce8ef", dot: "#b3ad99",
      btn: "linear-gradient(180deg,#4d80a2,#3d6e8f)", btnFg: "#f4f2ec"
    },
    e: {   /* C · 저녁 노을 — 황동·앰버 */
      paper: "#faf4ea", rail: "#f0e6d4", frame: "#d3c3a4", line: "#e6dbc4",
      line2: "#d8c9ab", tab: "#f4ecdc", ink: "#3d3222", ink2: "#4a3e2c",
      muted: "#9a8a6e", accent: "#a8642f", accentSoft: "#f3e2cd", dot: "#c4ad88",
      btn: "linear-gradient(180deg,#c07a3e,#a8642f)", btnFg: "#faf4ea"
    },
    n: {   /* D · 한밤 — 심야 네이비, 달빛 (⭐ 넷 중 유일하게 어두운 종이) */
      paper: "#161c28", rail: "#1d2432", frame: "#2c3648", line: "#242e3f",
      line2: "#33405556", tab: "#1a2130", ink: "#dbe2ee", ink2: "#c4cfdf",
      muted: "#6d7a8e", accent: "#8fb0c9", accentSoft: "#26374a", dot: "#43536b",
      btn: "linear-gradient(180deg,#4a6f92,#3a5a7a)", btnFg: "#e8eef6"
    }
  };
  var themeNow = "";
  /* ⭐⭐ 조명 미리보기 (0819V · 소로) — 편집기 안에서만 넉 벌을 손으로 돌린다.
     ⚠⚠ 8호(거짓 하늘 금지)를 안 어긴다. 손님 화면은 언제나 진짜 태양시고,
        이건 **자를 대는 일**이지 하늘을 꾸미는 일이 아니다. 창 덮개 좌표를
        눈으로 맞추는 것과 같은 종류다.
     ⚠ 안 넣으면 넉 벌 중 저녁 하나만 보고 개막을 맞는다 — 아침을 보려면 다섯 시간을
       기다려야 하고, 게다가 멈춘 채로는 태양시가 안 가서 영영 안 바뀐다.
     ⚠ E 를 끄면 곧장 진짜 시각으로 되돌아온다. 미리보기가 화면에 눌러앉지 않는다. */
  var PREVIEW = null;              /* 'm'|'d'|'e'|'n' — 편집 중에만 값이 든다 */
  var THEME_ORDER = ["m", "d", "e", "n"];
  var THEME_KO = { m: "이른 아침", d: "한낮", e: "저녁 노을", n: "한밤" };
  function cyclePreview() {
    if (!editing) return;            /* ⚠ 편집기 밖에서는 아무 일도 안 한다 */
    var i = PREVIEW ? (THEME_ORDER.indexOf(PREVIEW) + 1) % 4 : 0;
    PREVIEW = THEME_ORDER[i];
    paintCabin(SINFO ? SINFO.lon : 0);
    tuneSay();
  }
  function clearPreview() {
    if (!PREVIEW) return;
    PREVIEW = null;
    paintCabin(SINFO ? SINFO.lon : 0);
  }
  function setTheme(file) {
    /* CABIN 파일 이름에서 갈래 글자를 되찾는다 — 조명과 테마를 한 값으로 묶는다 */
    var k = "e";
    for (var g in CABIN) if (CABIN[g] === file) k = g;
    if (k === themeNow || !ROOT) return;
    themeNow = k;
    var t = THEME[k] || THEME.e, v;
    if (MONEL) for (v in t) MONEL.style.setProperty("--" + v, t[v]);
    /* ⭐ 기록판도 같은 조명을 받는다 — 해가 뜨면 종이도 함께 아침이 된다.
       ⚠⚠ 이름을 --dk- 로 가른다. 모니터와 **같은 이름 다른 값**이기 때문이다
         (A 이른아침: 모니터 ink #e4ecf2 / 기록판 ink #2e3a42). 섞으면 흰 종이에 흰 글자다. */
    var dk = DESK_THEME[k] || DESK_THEME.e;
    for (v in dk) ROOT.style.setProperty("--dk-" + v, dk[v]);
  }
  /* ⭐⭐ 조명 넉 벌 갈아끼우기 (0819Q) — 실제 일출은 삼십 분에 걸쳐 오는데
     0819P 까지는 배경 그림을 한 프레임에 통째로 바꿔 **기내만 스위치**였다.
     소로가 해 뜨는 것을 보시다가 잡으신 곳이다.
     ⭐ 판을 두 겹으로 둔다 — 아래(#plate)가 지금 것, 위(#plateB)가 다음 것.
       위 겹을 3초에 걸쳐 드러내고, 끝나면 아래로 옮겨 담는다. 판을 새로 굽지 않는다.
     ⚠ 첫 그림은 겹치지 않는다 — 탑승하자마자 3초 동안 판이 반투명하면 사고로 보인다. */
  var fadeT = null;
  function paintCabin(lon) {
    if (!ROOT) return;
    var plate = ROOT.querySelector("#plate"), pb = ROOT.querySelector("#plateB");
    if (!plate) return;
    var d = new Date();
    var utc = d.getUTCHours() + d.getUTCMinutes() / 60;
    var local = (utc + (lon || 0) / 15 + 24) % 24;          /* 태양시 어림 */
    /* ⭐ 편집기 미리보기가 켜져 있으면 그것이 이긴다 — 편집 중에만 값이 든다 */
    var f = PREVIEW ? CABIN[PREVIEW] : cabinFor(local);
    setTheme(f);                                            /* ⭐ 모니터 테마도 한 값으로 */
    if (plate.__f === f) return;
    if (!plate.__f || !pb) {                                /* 첫 그림 — 그냥 앉힌다 */
      plate.__f = f; plate.style.backgroundImage = "url(" + f + ")";
      return;
    }
    if (pb.__f === f) return;                               /* 이미 그 겹으로 넘어가는 중 */
    pb.__f = f;
    pb.style.backgroundImage = "url(" + f + ")";
    pb.style.transition = "none";
    pb.style.opacity = "0";
    /* ⚠ 다음 프레임에 켜야 전환이 걸린다 — 같은 프레임에 0→1 이면 브라우저가 건너뛴다 */
    requestAnimationFrame(function () {
      if (!ROOT || !document.body.contains(ROOT)) return;
      pb.style.transition = "opacity 3s linear";
      pb.style.opacity = "1";
    });
    clearTimeout(fadeT);
    fadeT = setTimeout(function () {
      if (!ROOT || !document.body.contains(ROOT)) return;
      plate.__f = pb.__f;
      plate.style.backgroundImage = pb.style.backgroundImage;
      pb.style.transition = "none";
      pb.style.opacity = "0";
      pb.__f = null;
    }, 3100);
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
  var WD = { seq: 1, dirty: false, saving: false, tmr: null, sec: 0, last: 0, msgUntil: 0 };

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

  /* ⚠⚠ 41호 ㉬ 의 그물 — 아래단이 원판 밖으로 나가면 화면 절반이 조용히 사라진다.
     0819V 에서 실제로 그랬고 콘솔에 한 줄도 안 찍혔다. 다음엔 여기서 잡힌다. */
  var LOW_BOTTOM = 568;            /* #egrLow top 418 + height 150 — CSS 와 함께 고친다 */
  function checkMonFit() {
    if (MON_H < LOW_BOTTOM) {
      console.error("[EG] 모니터 원판이 짧습니다 — 높이 " + MON_H
        + "px 인데 아래단이 " + LOW_BOTTOM + "px 에서 끝납니다.");
    }
    /* ⭐⭐ 0819X — 안에 든 것이 상자를 넘치는지 **실제로 잰다.**
       ⚠⚠ CSS 만으로는 검산이 안 된다. 0819W 에서 line-height 를 안 적어
          게이지가 25.6px 넘쳤는데 콘솔에 한 줄도 안 찍혔고, 소로가 눈으로 잡으셨다.
       ⚠ 글꼴이 늦게 실리면 높이가 바뀐다 — 다음 프레임에 잰다. */
    EGR_later(function () {
      if (!MONEL || !document.body.contains(MONEL)) return;
      ["#egrGauge", "#egrBookBox", "#egrHead", "#egrMap"].forEach(function (q) {
        var el = MONEL.querySelector(q); if (!el) return;
        var over = el.scrollHeight - el.clientHeight;
        if (over > 2) console.warn("[EG] " + q + " 가 상자를 " + over
          + "px 넘칩니다 — 아래가 잘립니다");
      });
    }, 700);
  }
  function mountMonitor(route) {
    MONEL = document.createElement("div");
    MONEL.id = "egrMon";
    checkMonFit();
    MONEL.style.width = MON_W + "px"; MONEL.style.height = MON_H + "px";
    MONEL.innerHTML =
      '<div id="egrHead"><div class="t"><b>' + esc(route.name) + '</b>'
      + '<small id="egrLeg">&nbsp;</small></div>'
      + '<div id="egrCtl">'
      + '<button id="egrZout" type="button" title="넓게 보기" disabled>&#8722;</button>'
      + '<span class="lv" id="egrZlv">전체</span>'
      + '<button id="egrZin" type="button" title="가까이 보기">&#43;</button>'
      + '<button id="egrSnd" class="ico" type="button">&#128266;</button>'
      + '<button id="egrPz" class="ico" type="button" title="잠깐 멈춤 (Space)">&#10073;&#10073;</button>'
      + '</div></div>'
      + '<div id="egrMap"></div>'
      + '<div id="egrLow">'
      + '<div id="egrGauge">'
      + '<div class="c"><i>LOCAL TIME</i><b id="egrClock">—</b></div>'
      + '<div class="c"><i>ALTITUDE</i><b id="egrAlt">—<u>M</u></b></div>'
      + '<div class="c"><i>GND SPEED</i><b id="egrSpd">—<u>KM/H</u></b></div>'
      + '<div class="c"><i>V/S</i><b id="egrVs">—<u>M/MIN</u></b></div>'
      + '</div>'
      + '<div id="egrBookBox"></div>'
      + '</div>'
      + '<div id="egrPick"></div>';
    ROOT.appendChild(MONEL);
    setTheme(cabinFor(12));           /* 첫 붓 — paintCabin 이 곧 제 값으로 고친다 */
    MONEL.querySelector("#egrMap").innerHTML = buildMap(route);
    mountDesk();                      /* ⭐ 독서일지 판 — 모니터 밖 별도 판 */
    EGR_on(MONEL.querySelector("#egrZin"), "click", function () { setZoom(zi + 1, route); });
    EGR_on(MONEL.querySelector("#egrZout"), "click", function () { setZoom(zi - 1, route); });
    /* ⭐ 0819U 소로 — 「모니터에 음악 켜기 버튼」. 손이 한 곳에 모인다 */
    EGR_on(MONEL.querySelector("#egrSnd"), "click", function () { setChannel(CH + 1); });
    EGR_on(MONEL.querySelector("#egrPz"), "click", togglePause);
    paintBook();
  }

  /* ⭐ 조작판 표시 — 소리·멈춤은 모니터 안 단추와 밖 단추가 함께 산다.
     ⚠ 둘 중 하나만 고치면 화면이 갈라진다. 여기 한 곳에서 둘 다 만진다. */
  function syncCtl() {
    if (!MONEL) return;
    var a = MONEL.querySelector("#egrSnd"), b = MONEL.querySelector("#egrPz");
    if (a) {
      a.innerHTML = CH_ICON[CH];
      a.title = CH_TIP[CH] + " (다음: " + CH_TIP[(CH + 1) % 3] + ")";
      a.classList.toggle("on", CH === 1);
    }
    if (b) {
      b.innerHTML = PAUSED ? "&#9654;" : "&#10073;&#10073;";
      b.title = PAUSED ? "비행 다시 (Space)" : "잠깐 멈춤 (Space)";
      b.classList.toggle("on", PAUSED);
    }
  }

  /* ══ 최근 책 표지 — 아래단 오른쪽 책칸 (0819U) ══════════════════════
     ⭐ 시안의 NOW READING 칸이다. 지금 읽는 책이 없으면 마지막으로 기록한 책이 서고,
       그것도 없으면 칸 자체가 「책 고르기」 문이 된다(20호 · 21호). */
  var RECENT = null;
  function paintRecent() { paintBook(); }
  function loadRecent() {
    rpc("get_my_recent_book", {}).then(function (rows) {
      if (rows && rows[0]) { RECENT = rows[0]; if (!BOOK) paintBook(); }
    }).catch(function () { /* 없으면 없는 대로 */ });
  }
  function setTab(t) { TAB = t; if (t === "book") openPick(); }   /* 옛 이름 — 부르는 곳이 남아 있다 */

  /* — 비행정보. 400ms 마다 (onTick 이 부른다) — */
  function paintInfo(s, route) {
    if (!MONEL) return;
    var utc = new Date();
    var loc = (utc.getUTCHours() + utc.getUTCMinutes() / 60 + s.lon / 15 + 24) % 24;
    var hh2 = Math.floor(loc), mm = Math.floor((loc - hh2) * 60);
    var q = function (id) { return MONEL.querySelector(id); };
    q("#egrClock").textContent = (hh2 < 10 ? "0" : "") + hh2 + ":" + (mm < 10 ? "0" : "") + mm;
    q("#egrLeg").textContent = s.leg + "  →  " + s.next;
    q("#egrAlt").innerHTML = Math.round(s.alt).toLocaleString() + "<u>M</u>";
    q("#egrSpd").innerHTML = Math.round(s.kmh) + "<u>KM/H</u>";
    var v = Math.round(s.vs);
    q("#egrVs").innerHTML = (v > 0 ? "+" : "") + v + "<u>M/MIN</u>";
    paintMap(s, route);              /* ⭐ 항로도 — 확대 중이면 지도가 따라 흐른다 */
    paintWhere();                    /* ⭐ 기록판 아래줄 — 지금 나는 곳이 흐른다 */
  }
  /* ══ 독서일지 판 (0820a) — 비너스 시안 넉 벌 ═══════════════════════
     ⭐ 왼쪽은 78px 회차 타임라인, 오른쪽은 종이 한 장. 책별 묶음 목록은 「책 목록」 층으로.
     ⭐ 막이 없다 — 떠 있는 판이라야 밖(C)에 나가서도 창밖을 안 가린다(0820 소로).
     ⚠ 판이 떠 있는 동안에도 비행은 계속된다 — 14호. 멈추게 하지 않는다. */
  var DESK = null, ARANGE = 7, FSIZE = 17, NICK = "";
  var ARCH = [];                  /* 마지막으로 받은 아카이브 행 전체 */
  var RANGES = [["최근 7일", 7], ["30일", 30], ["6개월", 180], ["전체", null]];
  /* ⚠⚠ 설계값이다. 손님이 끈 크기(DSIZE)와 **한 그릇에 담지 않는다** — 0819W 사고 그대로 */
  var DESK_W = 920, DESK_H = 640, MIN_W = 640, MIN_H = 500, NARROW = 760, LOW = 560;
  var DSIZE = null;               /* 기억값 — 손님이 모서리를 끈 크기 */

  var WEEK = ["일", "월", "화", "수", "목", "금", "토"];
  function dateKo(d) {
    return d.getFullYear() + "년 " + (d.getMonth() + 1) + "월 " + d.getDate() + "일 "
         + WEEK[d.getDay()] + "요일";
  }
  function mdKo(d) { return (d.getMonth() + 1) + "." + d.getDate(); }
  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
  }
  function secKo(n) {
    n = Math.max(0, Math.round(n));
    return Math.floor(n / 60) + "분 " + (n % 60) + "초";
  }

  function mountDesk() {
    DESK = document.createElement("div"); DESK.id = "egrDesk";
    DESK.innerHTML =
        '<div class="rail">'
      +   '<div class="tl" id="egrTL"></div>'
      +   '<button class="books" id="egrBooks" type="button" title="책 목록">'
      +     '<s></s><s></s><s></s></button>'
      +   '<span class="cap">책 목록</span>'
      + '</div>'
      + '<div class="main">'
      +   '<div class="top" id="egrTop"><div class="tabs" id="egrRng"></div><span class="sp"></span>'
      +     '<button class="fs" id="egrFsm" type="button" title="글씨 작게">가&#8722;</button>'
      +     '<button class="fs" id="egrFsp" type="button" title="글씨 크게">가&#43;</button>'
      +     '<button class="x" id="egrDX" type="button" title="덮기">&#10005;</button></div>'
      +   '<div class="sheet">'
      +     '<div class="ttl"><b id="egrDDate">&nbsp;</b><small id="egrDWho">&nbsp;</small></div>'
      +     '<textarea id="egrDBody" placeholder="그 책에 관한 나의 기록"></textarea>'
      +     '<div class="ft"><span class="place" id="egrDMsg">&nbsp;</span>'
      +       '<span class="mid">&middot;</span><span class="cnt" id="egrDCnt">0자</span>'
      +       '<span class="sp"></span>'
      +       '<button class="btn" id="egrDNew" type="button">다음 회차</button>'
      +       '<button class="btn go" id="egrDSave" type="button">저장</button></div>'
      +   '</div>'
      +   '<img class="cover" id="egrDCov" alt="">'
      + '</div>'
      + '<div class="grip" id="egrDGrip"></div>'
      + '<div class="booklist" id="egrBookList"></div>';
    ROOT.appendChild(DESK);

    var rng = DESK.querySelector("#egrRng");
    RANGES.forEach(function (r) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = r[0];
      b.className = (r[1] === ARANGE) ? "on" : "";
      EGR_on(b, "click", function () {
        ARANGE = r[1];
        var all = rng.querySelectorAll("button"), i;
        for (i = 0; i < all.length; i++) all[i].classList.remove("on");
        b.classList.add("on");
        loadArchive();
      });
      rng.appendChild(b);
    });

    EGR_on(DESK.querySelector("#egrDX"), "click", closeDesk);
    EGR_on(DESK.querySelector("#egrDSave"), "click", function () { saveNote("saved"); });
    EGR_on(DESK.querySelector("#egrDNew"), "click", function () {
      if (WD.dirty) saveNote("draft");
      openWrite(null);
    });
    EGR_on(DESK.querySelector("#egrDBody"), "input", function () { touched(); paintCount(); });
    EGR_on(DESK.querySelector("#egrFsp"), "click", function () { setFont(FSIZE + 2); });
    EGR_on(DESK.querySelector("#egrFsm"), "click", function () { setFont(FSIZE - 2); });
    EGR_on(DESK.querySelector("#egrDCov"), "click", openPick);
    EGR_on(DESK.querySelector("#egrBooks"), "click", function () { showBookList(true); });
    dragDesk();
    restoreDesk();
    NICK = "";
    loadNick();
  }

  /* ⭐ 「Puffin의 독서일지」 — 베스페르가 쓰는 길 그대로 */
  function loadNick() {
    var sb = egr_sb();
    if (!sb || !sb.auth) return;
    sb.auth.getUser().then(function (r) {
      var u = r && r.data && r.data.user; if (!u) return null;
      return sb.from("users").select("nickname").eq("id", u.id).maybeSingle()
        .then(function (x) { return (x.data && x.data.nickname) || null; });
    }).then(function (n) {
      if (!DESK || !document.body.contains(DESK)) return;   /* 늦게 온 응답 */
      NICK = n || "";
      var w = DESK.querySelector("#egrDWho");
      if (w && NICK) w.textContent = NICK + "의 독서일지";
    }).catch(function () { });
  }

  /* ── 판 옮기기 · 크기 조절 (0820a 소로 · 베스페르 문법) ──
     ⚠ 화면 밖으로 나가면 못 돌아온다. 가장자리를 문다.
     ⚠ 최소가 없으면 0 으로 접혀 다시 못 잡는다. 최대는 화면의 94%. */
  function clampDesk() {
    if (!DESK) return;
    var r = DESK.getBoundingClientRect();
    var x = Math.max(8, Math.min(innerWidth - r.width - 8, r.left));
    var y = Math.max(8, Math.min(innerHeight - r.height - 8, r.top));
    DESK.style.margin = "0"; DESK.style.left = x + "px"; DESK.style.top = y + "px";
    /* ⚠ 표지는 −5° 로 걸려 실높이가 314px 다. 판이 낮으면 날짜 줄을 덮는다 —
       판정에 높이를 함께 넣는다. 셈: 표지 위끝 = 높이 − (314 + bottom 70) */
    DESK.classList.toggle("narrow", r.width < NARROW || r.height < LOW);
  }
  function saveDeskPos() {
    if (!DESK) return;
    try {
      var r = DESK.getBoundingClientRect();
      var o = { x: r.left, y: r.top };
      if (DSIZE) { o.w = DSIZE.w; o.h = DSIZE.h; }     /* ⚠ 크기는 DSIZE 가 있을 때만 적는다 */
      localStorage.setItem("eg_read_desk", JSON.stringify(o));
    } catch (e) { }
  }
  function restoreDesk() {
    try {
      var p = JSON.parse(localStorage.getItem("eg_read_desk") || "null");
      if (p && isFinite(p.w) && isFinite(p.h)) {
        DSIZE = { w: Math.max(MIN_W, p.w), h: Math.max(MIN_H, p.h) };
        DESK.style.width = DSIZE.w + "px"; DESK.style.height = DSIZE.h + "px";
      }
      if (p && isFinite(p.x) && isFinite(p.y)) {
        DESK.style.margin = "0"; DESK.style.left = p.x + "px"; DESK.style.top = p.y + "px";
      }
    } catch (e) { }
  }
  function dragDesk() {
    var hd = DESK.querySelector("#egrTop"), on = false, sx = 0, sy = 0, ox = 0, oy = 0;
    EGR_on(hd, "pointerdown", function (e) {
      if (e.target.closest("button")) return;          /* 탭·가−·✕ 는 제 일을 한다 */
      var r = DESK.getBoundingClientRect();
      on = true; sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
      DESK.style.margin = "0"; DESK.style.left = ox + "px"; DESK.style.top = oy + "px";
      DESK.classList.add("drag"); hd.classList.add("grabbing");
      try { hd.setPointerCapture(e.pointerId); } catch (er) { }
    });
    EGR_on(hd, "pointermove", function (e) {
      if (!on) return;
      DESK.style.left = (ox + e.clientX - sx) + "px";
      DESK.style.top = (oy + e.clientY - sy) + "px";
    });
    function up() {
      if (!on) return;
      on = false; DESK.classList.remove("drag"); hd.classList.remove("grabbing");
      clampDesk(); saveDeskPos();
    }
    EGR_on(hd, "pointerup", up); EGR_on(hd, "pointercancel", up);

    var g = DESK.querySelector("#egrDGrip"), sz = false, gx = 0, gy = 0, gw = 0, gh = 0;
    EGR_on(g, "pointerdown", function (e) {
      e.preventDefault(); e.stopPropagation();
      var r = DESK.getBoundingClientRect();
      sz = true; gx = e.clientX; gy = e.clientY; gw = r.width; gh = r.height;
      DESK.style.margin = "0"; DESK.style.left = r.left + "px"; DESK.style.top = r.top + "px";
      DESK.classList.add("sizing");
      try { g.setPointerCapture(e.pointerId); } catch (er) { }
    });
    EGR_on(g, "pointermove", function (e) {
      if (!sz) return;
      var w = Math.max(MIN_W, Math.min(innerWidth * 0.94, gw + e.clientX - gx));
      var h = Math.max(MIN_H, Math.min(innerHeight * 0.94, gh + e.clientY - gy));
      DESK.style.width = w + "px"; DESK.style.height = h + "px";
      DESK.classList.toggle("narrow", w < NARROW || h < LOW);
    });
    function gup() {
      if (!sz) return;
      sz = false; DESK.classList.remove("sizing");
      var r = DESK.getBoundingClientRect();
      DSIZE = { w: r.width, h: r.height };
      clampDesk(); saveDeskPos();
    }
    EGR_on(g, "pointerup", gup); EGR_on(g, "pointercancel", gup);
    /* 두 번 누르면 설계 크기로 — 망쳤을 때 나갈 문 */
    EGR_on(g, "dblclick", function (e) {
      e.preventDefault(); e.stopPropagation();
      DSIZE = null;
      DESK.style.width = DESK_W + "px"; DESK.style.height = DESK_H + "px";
      DESK.style.left = ((innerWidth - DESK_W) / 2) + "px";
      DESK.style.top = ((innerHeight - DESK_H) / 2) + "px";
      clampDesk(); saveDeskPos();
    });
    EGR_on(window, "resize", function () { if (DESK && DESK.classList.contains("on")) clampDesk(); });
  }

  /* ⭐ 노안 배려 — 이 집 손님 절반의 문제다. 곁다리가 아니다.
     ⚠ 시안 기본은 15.5px 인데 여기서는 17 로 시작한다. 가− 로 내려가고 그 값은 기억된다. */
  function setFont(px) {
    FSIZE = Math.max(13, Math.min(28, px));
    var t = DESK && DESK.querySelector("#egrDBody");
    if (t) { t.style.fontSize = FSIZE + "px"; t.style.lineHeight = (FSIZE > 20 ? 1.85 : 1.95); }
    try { localStorage.setItem("eg_read_fs", String(FSIZE)); } catch (e) { }
  }
  function openDesk() {
    if (!DESK) return;
    try { var f = +localStorage.getItem("eg_read_fs"); if (f) FSIZE = f; } catch (e) { }
    setFont(FSIZE);
    DESK.classList.add("on");
    clampDesk();
    loadArchive();
  }
  function closeDesk() {
    if (!DESK) return;
    if (WD.dirty) saveNote("draft");
    showBookList(false);
    DESK.classList.remove("on");
    /* ⚠ 안 보이는 요소도 포커스는 붙들고 있다 — 덮을 때 손도 함께 뗀다(0817 딱지) */
    try { DESK.querySelector("#egrDBody").blur(); } catch (e) { }
  }

  function paintCount() {
    if (!DESK) return;
    var t = DESK.querySelector("#egrDBody");
    DESK.querySelector("#egrDCnt").textContent =
      t.value.length + "자 · " + secKo(WD.sec);
  }
  /* 아래줄 왼쪽 — ⭐ 지금 나는 곳이 흐른다. paintInfo 가 400ms 마다 부른다 */
  function paintWhere() {
    if (!DESK || !DESK.classList.contains("on") || WD.msgUntil > Date.now()) return;
    var el = DESK.querySelector("#egrDMsg"); if (!el) return;
    var s = SINFO;
    if (!s) { el.textContent = ""; return; }
    var utc = new Date();
    var loc = (utc.getUTCHours() + utc.getUTCMinutes() / 60 + s.lon / 15 + 24) % 24;
    var hh = Math.floor(loc), mm = Math.floor((loc - hh) * 60);
    el.textContent = (s.leg || "") + " 상공 · 고도 " + Math.round(s.alt).toLocaleString() + "m · "
      + (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm;
  }
  function say(t) {                       /* 저장 알림 — 2초만 곳을 빌린다 */
    if (!DESK) return;
    var el = DESK.querySelector("#egrDMsg"); if (!el) return;
    WD.msgUntil = Date.now() + 2000;
    el.textContent = t;
  }

  /* ── 왼쪽 레일 — 지금 책의 회차 타임라인 ──
     ⭐ 오늘 쓴 것은 「오늘」, 지난 것은 「제N회」. 열려 있는 회차가 굵게 선다.
     ⚠ 아직 저장 안 한 새 회차는 서버에 없다 — 맨 위에 「지금」으로 세운다. */
  function railPaint() {
    if (!DESK) return;
    var box = DESK.querySelector("#egrTL"); if (!box) return;
    var rows = [], i;
    if (BOOK) for (i = 0; i < ARCH.length; i++)
      if (ARCH[i].book_id === BOOK.id) rows.push(ARCH[i]);
    rows.sort(function (a, b) { return b.seq - a.seq; });
    var today = new Date(), html = "", first = true;
    var live = BOOK && !rows.some(function (r) { return r.seq === WD.seq; });
    if (live) {
      html += '<div class="nd on" data-seq="' + WD.seq + '"><i></i>'
            + '<b>지금</b><small>' + mdKo(today) + '</small></div>';
      first = false;
    }
    for (i = 0; i < rows.length; i++) {
      var d = new Date(rows[i].updated_at);
      var nm = sameDay(d, today) ? "오늘" : ("제" + rows[i].seq + "회");
      if (!first || i > 0) html += '<span class="lk"></span>';
      first = false;
      html += '<div class="nd' + (rows[i].seq === WD.seq && !live ? " on" : "")
            + '" data-seq="' + rows[i].seq + '"><i></i><b>' + nm + '</b>'
            + '<small>' + mdKo(d) + '</small></div>';
    }
    if (!html) html = '<div class="none">첫 회차를<br>여기서 씁니다</div>';
    box.innerHTML = html;
    var nds = box.querySelectorAll(".nd[data-seq]");
    for (i = 0; i < nds.length; i++) (function (el) {
      EGR_on(el, "click", function () {
        var sq = +el.getAttribute("data-seq");
        if (sq === WD.seq) return;
        var row = rows.filter(function (r) { return r.seq === sq; })[0];
        if (row) openWrite(row);
      });
    })(nds[i]);
  }

  /* ③ 아카이빙 — 기간으로 좁히고 책별로 묶는다 */
  function loadArchive() {
    if (!DESK) return;
    rpc("get_my_book_archive", { p_days: ARANGE }).then(function (rows) {
      if (!DESK || !document.body.contains(DESK)) return;   /* 늦게 온 응답 */
      ARCH = rows || [];
      railPaint();
      if (DESK.querySelector("#egrBookList").classList.contains("on")) paintBookList();
    }).catch(function (e) {
      console.warn("[EG] 기록을 못 불러왔습니다:", e);
    });
  }

  /* ── 「책 목록」 층 (0820a 소로) — 판을 덮는다 ──
     ⚠ 검색은 안 붙인다. 새 책을 들이는 문은 모니터 쪽 한 문이다(21호). */
  function showBookList(on) {
    if (!DESK) return;
    var el = DESK.querySelector("#egrBookList");
    el.classList.toggle("on", !!on);
    if (on) paintBookList();
  }
  function paintBookList() {
    if (!DESK) return;
    var el = DESK.querySelector("#egrBookList");
    var head = '<div class="bh"><b>책 목록</b>'
             + '<small>' + esc(RANGES.filter(function (r) { return r[1] === ARANGE; })[0][0])
             + ' 안에 기록이 있는 책</small><span class="sp" style="flex:1"></span>'
             + '<button class="x" id="egrBLx" type="button">&#10005;</button></div>';
    var body = "", cur = null, i;
    for (i = 0; i < ARCH.length; i++) {
      var r = ARCH[i];
      if (r.book_id !== cur) {
        if (cur !== null) body += '</div></div></div>';
        cur = r.book_id;
        body += '<div class="bk"><img src="' + esc(r.cover_url || "")
              + '" onerror="this.style.visibility=\'hidden\'" data-bk="' + r.book_id + '" alt="">'
              + '<div class="bi"><b data-bk="' + r.book_id + '">' + esc(r.title) + '</b>'
              + '<small>' + esc(r.author || "") + '</small><div class="ents">';
      }
      body += '<button class="ent" type="button" data-bk="' + r.book_id + '" data-seq="' + r.seq
            + '"><u>제' + r.seq + '회</u>'
            + esc(String(r.body || "").replace(/\s+/g, " ").slice(0, 18))
            + (r.status === "draft" ? '<i>초안</i>' : "") + '</button>';
    }
    if (cur !== null) body += '</div></div></div>';
    if (!body) body = '<div class="none">이 기간에 쓴 기록이 없습니다.<br>'
                    + '모니터에서 책을 고르고 첫 회차를 여십시오.</div>';
    el.innerHTML = head + '<div class="bl">' + body + '</div>';
    EGR_on(el.querySelector("#egrBLx"), "click", function () { showBookList(false); });

    function pick(bk, sq) {
      var row = ARCH.filter(function (r) {
        return r.book_id === bk && (sq == null || r.seq === sq); })[0];
      if (!row) return;
      if (!BOOK || BOOK.id !== bk) {
        BOOK = { id: bk, title: row.title, author: row.author, cover_url: row.cover_url };
        RECENT = BOOK; paintBook();
      }
      showBookList(false);
      if (sq == null) openWrite(null); else openWrite(row);
    }
    var ents = el.querySelectorAll(".ent"), j;
    for (j = 0; j < ents.length; j++) (function (b) {
      EGR_on(b, "click", function () {
        pick(b.getAttribute("data-bk"), +b.getAttribute("data-seq")); });
    })(ents[j]);
    var tops = el.querySelectorAll("[data-bk]:not(.ent)");
    for (j = 0; j < tops.length; j++) (function (b) {
      EGR_on(b, "click", function () { pick(b.getAttribute("data-bk"), null); });
    })(tops[j]);
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
    var el = MONEL.querySelector("#egrBookBox");
    if (!el) return;
    var b = BOOK || RECENT;
    if (!b) {
      /* ⭐ 20호 — 책이 없을 때의 모습이 곧 검색 한 문이다. 칸 자체가 문이 된다 */
      el.className = "empty";
      el.innerHTML = '<div class="t"><i>NOW READING</i>'
        + '<b style="font-size:19px">아직 고른 책이 없습니다</b>'
        + '<small>여기를 눌러 책을 고르십시오</small></div>';
      EGR_on(el, "click", openPick);
      return;
    }
    el.className = "";
    el.innerHTML = '<img class="cv" src="' + esc(b.cover_url || "")
      + '" onerror="this.style.visibility=\'hidden\'" alt="">'
      + '<div class="shelf"></div>'
      + '<div class="t"><i>NOW READING</i>'
      + '<b>' + esc(b.title) + '</b>'
      + '<small>' + esc(b.author || "") + '</small>'
      + '<a id="egrRead">READ &#9656;</a></div>';
    /* 표지를 누르면 다른 책 — 시안의 「책이 꽂힌 주머니」 문법 그대로 */
    EGR_on(el.querySelector(".cv"), "click", openPick);
    EGR_on(el.querySelector("#egrRead"), "click", function () {
      if (!BOOK && RECENT) BOOK = RECENT;
      if (BOOK) openWrite(null);
    });
  }

  /* ══ 책 고르기 (0819U) — 화면을 덮는 판. 21호 「검색은 한 문」 ═══════ */
  function openPick() {
    if (!MONEL) return;
    var el = MONEL.querySelector("#egrPick");
    el.innerHTML = '<div class="top">'
      + '<input id="egrQ" placeholder="읽을 책을 검색하십시오">'
      + '<button class="btn" id="egrQx" type="button">닫기</button></div>'
      + '<div class="hint">엔터로 검색 &middot; 서가와 바깥을 함께 훑고, 없으면 그 자리에서 들입니다</div>'
      + '<div class="list" id="egrList"></div>';
    el.classList.add("on");
    var q = el.querySelector("#egrQ");
    EGR_on(q, "keydown", function (e) {
      if (e.key === "Enter") { e.stopPropagation(); doSearch(q.value); }
    });
    EGR_on(el.querySelector("#egrQx"), "click", closePick);
    q.focus();
  }
  function closePick() {
    var el = MONEL && MONEL.querySelector("#egrPick");
    if (el) { el.classList.remove("on"); el.innerHTML = ""; }
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
    return '<div class="row"><img src="' + esc(b.cover_url || "") + '" onerror="this.style.visibility=\'hidden\'" alt="">'
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
            if (m2) m2.textContent = { cover: "표지를 옮겨 오는 중…", seq: "번호를 받는 중…", insert: "서가에 꽂는 중…" }[st] || "…";
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
    closePick(); paintBook();
  }
  
/* ⚠ 0819U — loadNotes 를 걷었다. 회차 목록이 모니터 안에 있던 시절의 물건인데,
     기록판(0819M)이 왼쪽에 그 목록을 이미 그린다(loadArchive). 남겨 두면
     없는 #egrNotes 를 찾다가 조용히 물러나는 죽은 함수가 된다. */
  
  function openWrite(row) {
    if (!BOOK || !DESK) return;
    var go = function (seq, body, sec, when) {
      WD.seq = seq; WD.dirty = false; WD.last = 0; WD.msgUntil = 0;
      /* ⭐ 지난 회차를 다시 열면 그때까지 걸린 시간부터 이어 센다.
         ⚠ 0 부터 세면 서버의 greatest 가 옛 값을 지켜서 「0분 34초」가 영영 안 늘어난다. */
      WD.sec = +sec || 0;
      DESK.querySelector("#egrDDate").textContent = dateKo(when || new Date());
      DESK.querySelector("#egrDWho").textContent = NICK ? (NICK + "의 독서일지") : "독서일지";
      var cv = DESK.querySelector("#egrDCov");
      cv.src = BOOK.cover_url || ""; cv.style.visibility = BOOK.cover_url ? "" : "hidden";
      cv.title = BOOK.title + (BOOK.author ? " · " + BOOK.author : "");
      var t = DESK.querySelector("#egrDBody");
      t.value = body || "";
      paintCount(); railPaint();
      openDesk();
      t.focus();
      try { t.setSelectionRange(t.value.length, t.value.length); } catch (e) { }
    };
    if (row) { go(row.seq, row.body, row.write_sec, row.updated_at ? new Date(row.updated_at) : null); return; }
    rpc("book_note_next_seq", { p_book: BOOK.id })
      .then(function (n) { go(Math.max(1, +n || 1), "", 0, null); })
      .catch(function () { go(1, "", 0, null); });
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
    if (status === "saved" && !body.trim()) { say("아직 쓴 글이 없습니다"); return; }
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
    }).then(function (out) {
      WD.dirty = false;
      /* ⭐ 서버가 돌려준 행의 status 를 그대로 믿는다.
         한 번 saved 면 자동 초안이 와도 안 내려간다(0820 서버 걸쇠). 화면이 서버를 앞지르지 않게. */
      var st = (out && out.status) || status;
      say(st === "saved" ? "저장했습니다" : "임시 저장");
      RECENT = BOOK; paintRecent();
      if (DESK.classList.contains("on")) loadArchive();
      /* ⭐ 16호 — 도장은 **저장할 때** 한 번. 초안에는 안 놓는다.
         자동 초안까지 도장을 놓으면 「글을 쓰다 멈춘 것」에도 상을 주는 꼴이 된다. */
      if (status === "saved") offerStamp();
    }).catch(function (e) {
      say(/JWT|auth|401|로그인/i.test(String(e && e.message)) ? "로그인이 필요합니다" : "저장하지 못했습니다");
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
  /* ⚠ 0819U — 지도 상자를 시안대로 키웠다. 원판 880 에서 좌우 여백 34씩,
     세로는 좌표 한 줄을 걷어 낸 만큼 더 받았다(시안 290 → 318). */
  var MAPBOX = { w: 812, h: 318, pad: 26 };
  var MAPF = null;                 /* 좌표 → 화면 변환 */
  var MAPBASE = null;              /* 전체보기일 때의 변환 (배율의 기준) */
  var ZOOM = [1, 2, 4, 8, 16];
  var ZLABEL = ["전체", "+1", "+2", "+3", "+4"];
  var zi = 0;                      /* 지금 단계 */
  var mapSeg = -1;
  /* ⭐⭐ 비행기 (0819Y) — **비너스 시안의 그 아이콘**이다. 동체·주날개·꼬리날개가
     또렷한 실루엣이라 25mm 로 줄여도 비행기로 읽힌다. 화살촉보다 훨씬 낫다.
     기수가 위(-y)를 보게 그려져 있어 rotate(heading) 이 곧 방위다. */
  var SHIP_D = "M0,-9 L2,-2 L11,1 L11,3.5 L2,2.5 L1.5,8 L4.5,10.5 L4.5,12.5 "
             + "L0,11 L-4.5,12.5 L-4.5,10.5 L-1.5,8 L-2,2.5 L-11,3.5 L-11,1 L-2,-2 Z";
  /* ⚠⚠ 소로 0819: 「확대하면 할수록 더 작게 느껴진다」.
     크기는 같은데 **주변이 커지니 상대적으로 작아 보이는** 것이다 — 맞는 관찰이다.
     ⭐ 배율마다 키운다. 화면 배율 0.587 을 곱한 실크기를 셈해 두었다.
       전체 19px · +1 23px · +2 26px · +3 30px · +4 33px  (원판 기준 33~57) */
  var SHIP_SCALE = [1.5, 1.75, 2.0, 2.3, 2.6];

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
    out.push('<g id="egrShip"><path class="ship" d="' + SHIP_D + '"/></g>');
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
      + ") rotate(" + s.hd.toFixed(1) + ") scale(" + (SHIP_SCALE[zi] || 1.5) + ")");
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

  /* ══ 기내 오디오 갈래 셋 (0819R) ═══════════════════════════════════
     ⚠ 소로 0819: 「이 엄청난 광경을 비행기 소음과 듣는데 좀 짜증이 나더라.
       비행기에서 이어폰 끼듯, 우리도 소음 대신 음악을 고르게」
     ⭐ 실제 기내 IFE 의 오디오 채널이 이것이다. 단추 하나로 셋을 돈다 —
       엔진음(기본) → 기내 음악 → 끔 → 엔진음…
     ⭐ 음악은 **뮤세움 열두 곡을 그대로** 쓴다. 이미 이 집 사람이 고른 곡이고,
       새 파일을 안 들인다(22호의 사촌 — 같은 것을 두 곳에 두지 않는다).
     ⚠ 곡당 4~5MB 다. 미리 다 받지 않는다 — 하나씩, 끝나면 다음.
     ⚠ 무작위로 매번 뽑으면 방금 들은 곡이 또 나온다. 열둘을 섞어 한 바퀴 돌고
       다시 섞되, 새 첫 곡이 직전 곡과 같지 않게 한 번 더 민다. */
  var CH = 0;                      /* 0 엔진음 · 1 음악 · 2 끔 */
  var CH_ICON = ["&#128266;", "&#9835;", "&#128263;"];
  var CH_TIP = ["기내 소음", "기내 음악", "소리 끔"];
  var MUSIC_N = 12, MUSIC_VOL = 0.15;
  var mus = null, musSrc = null, musGain = null, musQ = [], musI = 0;

  function ensureAC() { if (!ac) ac = new AC(); return ac; }
  function shuffleMusic() {
    var last = musQ.length ? musQ[musQ.length - 1] : -1, i, j, t;
    musQ = [];
    for (i = 1; i <= MUSIC_N; i++) musQ.push(i);
    for (i = musQ.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1)); t = musQ[i]; musQ[i] = musQ[j]; musQ[j] = t;
    }
    if (musQ[0] === last && musQ.length > 1) { musQ.push(musQ.shift()); }
    musI = 0;
  }
  function musicSrc(n) { return "muse_bgm_" + (n < 10 ? "0" : "") + n + ".mp3"; }
  function musicNext() {
    if (CH !== 1 || !mus) return;
    if (musI >= musQ.length) shuffleMusic();
    mus.src = musicSrc(musQ[musI++]);
    mus.play().catch(function (e) { console.warn("[EG] 곡을 못 열었습니다:", e && e.message); });
  }
  function musicStart() {
    if (!mus) {
      mus = new Audio();
      mus.preload = "none";
      mus.crossOrigin = "anonymous";
      mus.addEventListener("ended", musicNext);
      /* ⚠ 곡 하나가 막혀도 방송처럼 멈추면 안 된다 — 다음 곡으로 넘어간다 */
      mus.addEventListener("error", function () { if (CH === 1) EGR_later(musicNext, 400); });
      try {
        var a = ensureAC();
        musSrc = a.createMediaElementSource(mus);
        musGain = a.createGain(); musGain.gain.value = 0;
        musSrc.connect(musGain).connect(a.destination);
      } catch (e) {
        /* ⚠ WebAudio 로 못 물리면 element 볼륨으로 간다 — 페이드만 못할 뿐 소리는 난다 */
        console.warn("[EG] 음악을 WebAudio 에 못 물렸습니다:", e && e.message);
        musGain = null; mus.volume = MUSIC_VOL;
      }
    }
    if (!musQ.length) shuffleMusic();
    /* ⭐ 2.4초에 걸쳐 샤르르 — 엔진음이 드는 시간과 같게. 둘이 한 문법이어야 한다 */
    if (musGain) {
      try {
        var a2 = ensureAC();
        musGain.gain.cancelScheduledValues(a2.currentTime);
        musGain.gain.setValueAtTime(musGain.gain.value, a2.currentTime);
        musGain.gain.linearRampToValueAtTime(MUSIC_VOL, a2.currentTime + 2.4);
      } catch (e) { }
    }
    if (mus.src) { mus.play().catch(function () { }); } else musicNext();
  }
  function musicStop(kill) {
    if (!mus) return;
    if (musGain) {
      try {
        var a3 = ensureAC();
        musGain.gain.cancelScheduledValues(a3.currentTime);
        musGain.gain.setValueAtTime(musGain.gain.value, a3.currentTime);
        musGain.gain.linearRampToValueAtTime(0, a3.currentTime + 0.9);   /* 엔진음과 같은 걸음 */
      } catch (e) { }
    }
    if (kill) { try { mus.pause(); mus.src = ""; } catch (e) { } }
    else EGR_later(function () { if (CH !== 1) { try { mus.pause(); } catch (e) { } } }, 1000);
  }
  function engineStart() {
    if (engGain || CH !== 0) return;
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
      engGain.gain.linearRampToValueAtTime(engBase, a.currentTime + 2.4);   /* 스르르 — 음악과 같은 걸음 */
    } catch (e) { }
  }
  /* ⭐ 고도에 물린다 — 지면 가까이(굵은 웅—) 480Hz · 높이 오르면(먼 쉬—) 300Hz */
  function engineTune(rel) {
    if (!engLp) return;
    try { engLp.frequency.value = 480 - Math.min(Math.max(rel, 0), 4000) / 4000 * 180; } catch (e) { }
  }
  /* ⭐ 갈래 하나를 고른다 — 단추가 셋을 돌린다. 브라우저에 기억한다.
     ⭐⭐ 0819S 소로 — 「소음이 페이드 아웃되고 음악이 샤르르」.
        ⚠ 0819R 은 둘을 **동시에** 물리고 들였다. 그러면 겹치는 1.4초 동안
          엔진음과 음악이 함께 울려 가장 지저분한 대목이 된다.
        ⭐ 실물은 순서가 있다 — 한쪽이 비켜준 **뒤에** 다른 쪽이 든다.
          이어폰을 끼는 것도 그렇다: 소음이 먼저 멀어지고, 그다음 음악이 온다.
        ⚠ 켜는 쪽 시간을 끄는 쪽보다 길게 둔다(0.9 → 2.4초). 비대칭이 자연스럽다 —
          소리는 사라질 때보다 다가올 때 더 천천히 와야 놀라지 않는다. */
  var chT = null;
  function setChannel(n, quick) {
    var prev = CH;
    CH = ((n % 3) + 3) % 3;
    sndOn = (CH === 0);
    try { localStorage.setItem("eg_read_ch", String(CH)); } catch (e) { }
    syncCtl();                       /* ⭐ 모니터 안 단추도 함께 — 한 곳에서 둘 다 만진다 */
    clearTimeout(chT);

    /* ── ① 물러날 것을 먼저 재운다 (0.9초) ── */
    var out = 0.9;
    if (prev === 0 && engGain) {
      try { engGain.gain.linearRampToValueAtTime(0, ensureAC().currentTime + out); } catch (e) { }
    }
    if (prev === 1) musicStop(false);

    /* ── ② 비켜준 뒤에 들어온다 ── */
    var enter = function () {
      if (!ROOT || !document.body.contains(ROOT)) return;
      if (CH === 0) {
        if (engGain) {
          try { engGain.gain.linearRampToValueAtTime(engBase, ensureAC().currentTime + 2.4); } catch (e) { }
        } else if (announced) engineStart();
      } else if (CH === 1) musicStart();
    };
    /* ⚠ 첫 탑승(quick)이나 갈래가 안 바뀌었으면 기다릴 까닭이 없다 */
    if (quick || prev === CH || prev === 2) enter();
    else chT = setTimeout(enter, out * 1000 + 120);
  }
  function engineSet(on) { setChannel(on ? 0 : 2); }   /* 옛 이름 — 부르는 곳이 남아 있을 때 */
  function playAnnounce() {
    if (announced) return; announced = true;
    annAudio = new Audio(ANNOUNCE_SRC);
    annAudio.volume = 0.9;
    var started = false;
    /* ⭐ 방송이 끝나면 **지금 고른 갈래**로 넘어간다 — 음악 갈래면 음악이 스르르 든다 */
    var after = function () { if (CH === 0) engineStart(); else if (CH === 1) musicStart(); };
    annAudio.addEventListener("ended", after);
    annAudio.play().then(function () { started = true; }).catch(function () { });
    /* ⚠ 폴백 — 파일이 없거나 재생이 막히면 3초 뒤 조용히 다음 갈래로 */
    EGR_later(function () { if (!started) after(); }, 3000);
  }
  function hush() {
    try { if (annAudio) { annAudio.pause(); annAudio = null; } } catch (e) { }
    try { if (engGain) engGain.gain.linearRampToValueAtTime(0, ensureAC().currentTime + 0.25); } catch (e) { }
    /* ⚠ 음악은 element 라 gain 만 내리면 계속 흐른다 — 실제로 멈춰야 한다 */
    try { musicStop(true); } catch (e) { }
    try { clearTimeout(chT); } catch (e) { }
    engGain = null; engLp = null; announced = false;
    mus = null; musSrc = null; musGain = null; musQ = []; musI = 0;
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
      if (k === "t") cyclePreview();   /* ⭐ 편집기 안에서만 — 조명 넉 벌 미리보기 */
      else if (k === " " || e.code === "Space") { e.preventDefault(); togglePause(); }
      else if (k === "c") toggleOut();
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
      egrab = { t: t, x: e.clientX, y: e.clientY, w: w2, h: w2 / R2, flip: (side > 0),
                k: (t === "corner") ? e.target.closest(".egrCorner").getAttribute("data-k") : null };
    }, true);
    EGR_on(window, "pointermove", function (e) {
      if (!egrab) return;
      var dx = e.clientX - egrab.x, dy = e.clientY - egrab.y;
      egrab.x = e.clientX; egrab.y = e.clientY;
      /* ⚠ 거울일 때는 화면상 오른쪽이 판에서는 왼쪽이다 — 부호를 뒤집는다 */
      var px = (egrab.flip ? -dx : dx) / egrab.w * 100, py2 = dy / egrab.h * 100;
      if (egrab.t === "grip") { var GP = GRIP(); GP.x += px; GP.y += py2; }
      else if (egrab.t === "corner") monMove(px, py2, egrab.k);   /* ⭐ 그 점만 */
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
      } else if (t === "corner") {
        /* ⭐ 모서리 위 휠 = 세로 미세 이동 0.05% · Shift+휠 = 가로.
           끌기로는 한 픽셀을 못 맞춘다 — 베젤 두께가 화면에서 2~3px 이다 */
        var kk2 = e.target.closest(".egrCorner").getAttribute("data-k");
        if (e.shiftKey) MON[kk2][0] += d * 0.05 * (side > 0 ? -1 : 1);
        else MON[kk2][1] -= d * 0.05;
      } else monScale(1 + d * 0.02);
      layout(); tuneSay(); saveTuneSoon();
    }, { passive: false, capture: true });
    loadTune();                      /* 저장된 편집값 — 브라우저 먼저, 서버가 덮는다 */
    paintCabin(route.legs[0][1]);
    moveCredits(true);               /* ⭐ 39호 — 저작자 표시를 기내 나무 판 위로 */
    tuneTiles(true);                 /* ⭐ 저고도 순항용 타일 설정 — 나갈 때 되돌린다 */
    mountMonitor(route);             /* ⭐ 좌석 모니터 — layout 이 사다리꼴에 앉힌다 */
    loadRecent();                    /* ⑥ 마지막으로 기록한 책 표지를 데려온다 */
    layout();
    /* ⭐ 지난번에 고른 갈래를 그대로 — 매번 소음으로 되돌아가면 고른 뜻이 없다 */
    try { var c0 = localStorage.getItem("eg_read_ch"); if (c0 !== null) CH = +c0 || 0; } catch (e) { }
    setChannel(CH, true);            /* ⚠ 첫 탑승은 곧장 — 방송이 시간을 이미 준다 */
    playAnnounce();                  /* 방송 → 끝나면 고른 갈래로 (0817·0819R 문법) */

    var hudT = 0;                    /* ⚠ #hud 는 0819R 에 걷었다 — 셈 주기만 남는다 */
    /* ⭐ 나갔던 곳에서 이어 탄다 — 없으면 첫 길목. 아무 말도 안 띄운다 */
    var rz = readResume(route.code) || { seg: 0, u: 0 };
    flight = cruise(route, {
      sky: 6, startSeg: rz.seg, startU: rz.u,
      onTick: function (s) {
        SINFO = s;                   /* 기록 저장이 좌표를 읽는다 */
        var now = performance.now();
        if (now - hudT < 400) return; hudT = now;
        paintCabin(s.lon);
        engineTune(s.rel);           /* 낮으면 굵게 · 높으면 멀게 */
        paintInfo(s, route);         /* ⭐ 모니터 비행정보 — 「남은 시간」은 없다(14호) */
        /* ⚠⚠ 0819R — 화면 아래 계기판 한 줄을 걷었다(소로).
           모니터가 서면서 노선·길목·고도·속도 넷이 통째로 겹쳤고,
           무엇보다 **기내에 없는 물건이 허공에 떠 있었다**(8호 실물 절차).
           계기판을 없앤 게 아니라 제 곳으로 옮겨 앉힌 것이다. */
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
    /* ⭐ 있던 곳을 적어 둔다 — flight 를 세우기 **전**이어야 값이 살아 있다 */
    try { writeResume(); } catch (e) { }
    try { if (flight) { flight.stop(); flight = null; } } catch (e) { }
    EGR_off();
    tuneTiles(false);                /* ⚠ 타일 설정을 terra 것으로 — 방보다 먼저 */
    moveCredits(false);              /* ⚠ 크레딧을 제자리로 — 방보다 먼저 돌려놓는다 */
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
    SHUT = false; editing = false; egrab = null; cvW = 0; cvH = 0; PAUSED = false;
    PREVIEW = null; themeNow = "";   /* ⚠ 다음 탑승은 진짜 시각으로 */
    try { clearTimeout(tuneT); clearTimeout(fadeT); } catch (e) { }
    MONEL = null; TAB = "info"; SINFO = null; DESK = null; RECENT = null;
    ARCH = []; DSIZE = null; NICK = "";
    MAPF = null; MAPBASE = null; mapSeg = -1; zi = 0; redrawT = 0;
    WD.dirty = false; WD.saving = false;
    /* ⚠ BOOK 은 남긴다 — 같은 세션에서 다시 타면 읽던 책이 그대로 걸려 있는 편이 맞다.
       상태 칸이 아니라 이 창의 기억일 뿐이다(11호와 안 부딪힘 — 저장 안 함) */
    console.log("[EG] 독서비행 방을 걷었습니다 — 카메라를 terra 로 되돌렸습니다.");
  }

  window.egReading = { enter: enter, leave: leave, routes: routes, version: VERSION };
})();
