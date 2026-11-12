/* eiffel_tower.js — 탐험대 에펠탑을 앱 지도(terra.html)의 파리 3D 위에 세운다 · 1112 저녁 파이스
   ─────────────────────────────────────────────────────────────────────────────
   ⭐ 1112 소로 — 「홈페이지 LIVE 에만 보이고 실제 파리 에펠탑 근처에 가면 구현이 안 되어 있던데 통합할 수 없나」
     → 홈페이지 상영 화면(eiffel_engrave_test_1104.html?live)이 그리는 탑 장식을 그대로 옮겨 앱 지도에도 세운다.
       자리 · 크기는 같은 값(eg_settings 'eiffel_tune' — 소로가 시험판에서 확정한 값)을 읽고,
       이름 · 숫자는 같은 명부(eg_tower_crew() — 승선한 대원)를 읽는다. 그래서 두 곳이 늘 같은 탑이다.
   ⭐ 1112 소로 — 밤은 파리 현지 시각대로.
     카메라가 에펠탑 가까이(NEAR_M) 있고 파리 해가 지평선 아래로 내려가면, 구글 타일에 홈페이지와 같은 밤빛을 입힌다.
     (구글 3D 건물은 그냥 두면 밤에도 낮처럼 밝다) · 탑을 떠나면 밤빛을 걷고 원래대로 돌려놓는다.
     ⚠ 독서비행 중(body.reading-on)에는 밤빛을 입히지 않는다 — 비행은 제 하늘을 쓴다.
   ⚠ 그리는 셈(명패 나누기 · 4명 묶음 뒤섞음 SLOT_SEED · 장식 자리 · 꼭대기 숫자)은 시험판과 한 글자도 다르지 않게 옮겼다.
     시험판에서 셈을 고치면 여기도 같이 고친다(두 곳이 다른 탑이 되면 안 된다).
   ⚠ 자리는 에펠탑의 공개된 치수로 계산한다 — 구글 타일에서 탑 모양을 따내지 않는다(구글 약관 3.2.3(c)).
   부르는 법  EGTower.mount(viewer, { supa, tileset })   — terra.html 이 타일을 올린 직후 한 번 */
(function () {
  "use strict";
  if (window.EGTower) return;

  const TOWER = { lon: 2.294481, lat: 48.858370 };
  const BASE_BEARINGS = [313, 43, 133, 223];
  const PROFILE = [[0, 62.5], [57, 35.3], [115, 20.5], [190, 13.5], [276, 9.3], [300, 4.5], [330, 0.8]];
  const NAMES = ["lonelywalden","노란화살표","새벽길","월든의아침","뒷방의몽테뉴","책방고양이","안데스우편기",
    "라탱산책","청음실","별지기","카타딘","오두막","엘리펀트섬","순례자","밤의독서","몽블랑","헌책방",
    "플루트","델프트블루","실스마리아","프로코프","리스본일몰","마우나케아","인듀어런스"];
  const START = { rot: 0, groundH: 79, friezeH: 52, bandH: 7, bandW: 80, out: 2, titleS: 100, polarisH: 336, numH: 362, numS: 28 };
  const TUNE_KEY = "eiffel_tune";
  const TUNE_FIELDS = ["rot", "groundH", "friezeH", "bandH", "bandW", "out", "titleS", "polarisH", "numH", "numS", "line2", "plate", "anchors", "blocks"];
  const NEAR_M = 4000;                               // 탑에서 이만큼 안에 카메라가 있으면 탑을 세운다
  /* ⭐ 1113 소로 — 「에펠탑 근처에 가면 어두워지는 게 아니라, 그냥 조명 효과는 빼 주세요. 어제 보니까 낮에도 괜찮더라고요」
     → 밤빛(건물 어둡게 · 번짐)을 끈다. 탑 장식 · 명패 · 전구는 그대로. 다시 켜려면 true 로. */
  const NIGHT_ON = false;
  const FONT = '"Nanum Myeongjo", serif';

  const lerpProfile = (h) => {
    for (let i = 1; i < PROFILE.length; i++) {
      const [h0, w0] = PROFILE[i - 1], [h1, w1] = PROFILE[i];
      if (h <= h1) return w0 + (w1 - w0) * (h - h0) / (h1 - h0);
    }
    return PROFILE[PROFILE.length - 1][1];
  };
  const rng = (seed) => () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const clone = (x) => JSON.parse(JSON.stringify(x));

  /* 해의 높이(도) — 날짜와 경위도로(근사 · 1분 안쪽) · 파리 해가 졌는지만 알면 된다 */
  function sunAltDeg(ms, lat, lon) {
    const r = Math.PI / 180, d = ms / 86400000 + 2440587.5 - 2451545.0;
    const g = (357.529 + 0.98560028 * d) * r, q = 280.459 + 0.98564736 * d;
    const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * r;
    const e = (23.439 - 0.00000036 * d) * r;
    const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
    const gmst = ((18.697374558 + 24.06570982441908 * d) % 24 + 24) % 24;
    const H = (gmst * 15 + lon) * r - ra;
    return Math.asin(Math.sin(lat * r) * Math.sin(dec) + Math.cos(lat * r) * Math.cos(dec) * Math.cos(H)) / r;
  }
  /* 밤빛 세기 — 해가 지평선에 걸리면 0, 6도 아래(시민박명 끝)면 홈페이지와 같은 0.8 */
  const nightAmount = (ms) => Math.max(0, Math.min(1, -sunAltDeg(ms, TOWER.lat, TOWER.lon) / 6)) * 0.8;

  async function mount(viewer, opts) {
    opts = opts || {};
    if (!viewer || !window.Cesium) return;
    if (mount._done) return; mount._done = true;
    const Cesium = window.Cesium, scene = viewer.scene, rad = Cesium.Math.toRadians;
    const supa = opts.supa || window.egSupa || null;
    const tileset = () => opts.tileset || window.egTileset || null;

    try { await Promise.all([document.fonts.load('700 80px ' + FONT), document.fonts.load('700 30px ' + FONT)]); } catch (e) {}

    /* ── 확정한 값 · 명부 ───────────────────────────────── */
    const V = Object.assign({}, START, { line2: true, plate: true, anchors: {}, blocks: {} });
    if (supa) {
      try {
        const { data } = await supa.from("eg_settings").select("val").eq("key", TUNE_KEY).maybeSingle();
        if (data && data.val) for (const k of TUNE_FIELDS) if (data.val[k] !== undefined && data.val[k] !== null) V[k] = clone(data.val[k]);
      } catch (e) { console.warn("[EG 에펠탑] 확정한 값 읽기 실패", e); }
    }
    let roster = [];
    async function loadRoster() {
      if (!supa) return;
      try {
        const { data, error } = await supa.rpc("eg_tower_crew");
        if (!error && Array.isArray(data)) roster = data.map((r) => ({ no: r.crew_no, nick: r.nickname }));
      } catch (e) { console.warn("[EG 에펠탑] 명부 읽기 실패", e); }
    }
    await loadRoster();

    /* ── 탑 좌표계 ─────────────────────────────────────── */
    const towerCenter = () => {
      const a = V.anchors || {};
      if ([0, 1, 2, 3].every((f) => a[f])) {
        return { lon: [0, 1, 2, 3].reduce((s, f) => s + a[f].lon, 0) / 4, lat: [0, 1, 2, 3].reduce((s, f) => s + a[f].lat, 0) / 4 };
      }
      return { lon: TOWER.lon, lat: TOWER.lat };
    };
    let enu = null;
    const setFrame = () => { const c = towerCenter(); enu = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(c.lon, c.lat, V.groundH)); };
    const local = (x, y, z) => Cesium.Matrix4.multiplyByPoint(enu, new Cesium.Cartesian3(x, y, z), new Cesium.Cartesian3());
    const bearing = (f) => BASE_BEARINGS[f] + V.rot;
    setFrame();
    const CENTER = local(0, 0, 0);

    function facePoint(f, h, t, out) {
      const th = rad(bearing(f));
      const nx = Math.sin(th), ny = Math.cos(th), rx = -Math.cos(th), ry = Math.sin(th);
      const w = lerpProfile(h);
      return local(nx * (w + out) + rx * (t * w), ny * (w + out) + ry * (t * w), h);
    }
    function faceNormal(f) {
      const th = rad(bearing(f));
      const v = Cesium.Matrix4.multiplyByPointAsVector(enu, new Cesium.Cartesian3(Math.sin(th), Math.cos(th), 0), new Cesium.Cartesian3());
      return Cesium.Cartesian3.normalize(v, v);
    }
    function faceRight(f) {
      const th = rad(bearing(f));
      const v = Cesium.Matrix4.multiplyByPointAsVector(enu, new Cesium.Cartesian3(-Math.cos(th), Math.sin(th), 0), new Cesium.Cartesian3());
      return Cesium.Cartesian3.normalize(v, v);
    }

    /* ── 그릇 — 멀리 있으면 통째로 숨긴다 ──────────────── */
    const friezeSource = new Cesium.CustomDataSource("eg-eiffel-title"); viewer.dataSources.add(friezeSource);
    const plateSources = [0, 1, 2, 3].map((f) => { const ds = new Cesium.CustomDataSource("eg-eiffel-plates-" + f); viewer.dataSources.add(ds); return ds; });
    const bulbsByFace = [0, 1, 2, 3].map(() => scene.primitives.add(new Cesium.PointPrimitiveCollection()));
    const tagsByFace = [0, 1, 2, 3].map(() => scene.primitives.add(new Cesium.LabelCollection()));
    const sparkles = scene.primitives.add(new Cesium.PointPrimitiveCollection());
    const stars = scene.primitives.add(new Cesium.BillboardCollection());
    const countBoard = scene.primitives.add(new Cesium.BillboardCollection());
    const allPrims = [...bulbsByFace, ...tagsByFace, sparkles, stars, countBoard];

    /* ── 꼭대기 타이틀 「EG유니버스 탐험대원」 ─────────── */
    const friezeEntities = [];
    function friezeCanvas(widthM, heightM) {
      const W = 2400, H = Math.max(120, Math.round(W * heightM / widthM));
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const g = c.getContext("2d");
      if (V.plate) {
        const bg = g.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, "#4b3621"); bg.addColorStop(0.5, "#3a2a19"); bg.addColorStop(1, "#2a1e12");
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        g.fillStyle = "#b8913f";
        const rule = Math.max(2, Math.round(H * 0.025));
        g.fillRect(0, Math.round(H * 0.07), W, rule); g.fillRect(0, Math.round(H * 0.93) - rule, W, rule);
      }
      const lines = V.line2 ? [["EG유니버스 탐험대원", 0.44, 800, 0.47], ["2026 · 폴라리스호", 0.17, 700, 0.79]]
                            : [["EG유니버스 탐험대원", 0.56, 800, 0.53]];
      g.textAlign = "center"; g.textBaseline = "middle";
      for (const [text, sizeR, weight, yR] of lines) {
        let size = Math.round(H * sizeR);
        const fit = () => { g.font = weight + " " + size + "px " + FONT; try { g.letterSpacing = Math.round(size * 0.08) + "px"; } catch (e) {} };
        fit();
        while (g.measureText(text).width > W * 0.9 && size > 10) { size -= 2; fit(); }
        const x = W / 2, y = H * yR, d = Math.max(1, size * 0.035);
        g.fillStyle = "rgba(0,0,0,0.65)"; g.fillText(text, x + d, y + d);
        g.fillStyle = "rgba(255,238,190,0.35)"; g.fillText(text, x - d * 0.6, y - d * 0.6);
        const gold = g.createLinearGradient(0, y - size / 2, 0, y + size / 2);
        gold.addColorStop(0, "#f8e6a6"); gold.addColorStop(0.45, "#d9ae4b"); gold.addColorStop(1, "#8c6422");
        g.fillStyle = gold; g.fillText(text, x, y);
        g.lineWidth = Math.max(1, size * 0.02); g.strokeStyle = "rgba(70,46,10,0.8)"; g.strokeText(text, x, y);
      }
      return c;
    }
    const TITLE_H = 279;
    function titleRef(f) {
      const B = V.blocks && V.blocks["title-" + f];
      if (B) return { p: Cesium.Cartesian3.fromDegrees(B.lon, B.lat, B.alt), alt: B.alt };
      return { p: facePoint(f, TITLE_H, 0, 0), alt: V.groundH + TITLE_H };
    }
    const titleDims = () => { const W = 2 * lerpProfile(TITLE_H) * 0.95 * V.titleS / 100; return { W, H: W * 0.16 }; };
    function buildFrieze() {
      friezeSource.entities.removeAll(); friezeEntities.length = 0;
      const d = titleDims(), img = friezeCanvas(d.W, d.H);
      for (let f = 0; f < 4; f++) {
        const nrm = faceNormal(f), rgt = faceRight(f), ref = titleRef(f);
        const mid = Cesium.Cartesian3.add(ref.p, Cesium.Cartesian3.multiplyByScalar(nrm, V.out, new Cesium.Cartesian3()), new Cesium.Cartesian3());
        const off = Cesium.Cartesian3.multiplyByScalar(rgt, d.W / 2, new Cesium.Cartesian3());
        const lo = ref.alt - d.H / 2, hi = ref.alt + d.H / 2;
        const e = friezeSource.entities.add({
          wall: { positions: [Cesium.Cartesian3.subtract(mid, off, new Cesium.Cartesian3()), Cesium.Cartesian3.add(mid, off, new Cesium.Cartesian3())],
                  minimumHeights: [lo, lo], maximumHeights: [hi, hi],
                  material: new Cesium.ImageMaterialProperty({ image: img, transparent: true }) }
        });
        friezeEntities.push({ e, f, mid, nrm });
      }
    }

    /* ── 명패 띠 — 시험판 셈 그대로 ─────────────────────── */
    const PER_FACE = 27, PER_RING = PER_FACE * 4, SLOT_SEED = 20261114, GAP = 0.3, RING2_H = 116;
    const facesOfBatch = (() => {
      const cache = {};
      return (ring, b) => {
        const k = ring + "|" + b;
        if (cache[k]) return cache[k];
        const a = [0, 1, 2, 3], r = rng(SLOT_SEED + ring * 7919 + b * 131);
        for (let i = 3; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return (cache[k] = a);
      };
    })();
    function slotOf(no) {
      const ring = Math.floor((no - 1) / PER_RING), m = (no - 1) % PER_RING, b = Math.floor(m / 4);
      return { ring, face: facesOfBatch(ring, b)[m % 4], idx: b };
    }
    const layoutOf = (k) => { const rows = k <= 4 ? 1 : k <= 12 ? 2 : 3; return { rows, cols: Math.ceil(k / rows) }; };
    function bandRef(f) {
      const A = V.anchors && V.anchors[f];
      if (A) return { p: Cesium.Cartesian3.fromDegrees(A.lon, A.lat, A.alt), alt: A.alt, hRel: A.alt - V.groundH };
      return { p: facePoint(f, V.friezeH, 0, 0), alt: V.groundH + V.friezeH, hRel: V.friezeH };
    }
    function ringRect(ring, f) {
      const half = V.bandW / 100, b = bandRef(f);
      const W1 = 2 * lerpProfile(b.hRel) * half;
      if (ring === 0) return { p: b.p, alt: b.alt, W: W1, H: V.bandH };
      const W = 2 * lerpProfile(RING2_H) * half, H = V.bandH * W / W1;
      const B = V.blocks && V.blocks["r2-" + f];
      if (B) return { p: Cesium.Cartesian3.fromDegrees(B.lon, B.lat, B.alt), alt: B.alt, W, H };
      return { p: facePoint(f, RING2_H + H / 2, 0, 0), alt: V.groundH + RING2_H + H / 2, W, H };
    }
    function plateWall(ring, f, idx, k) {
      const R = ringRect(ring, f), { rows, cols } = layoutOf(k);
      const row = Math.floor(idx / cols), col = idx % cols;
      const inRow = row < rows - 1 ? cols : k - cols * (rows - 1);
      const cellW = (R.W - (cols - 1) * GAP) / cols, cellH = (R.H - (rows - 1) * GAP) / rows;
      const rowW = inRow * cellW + (inRow - 1) * GAP;
      const x = -rowW / 2 + cellW / 2 + col * (cellW + GAP);
      const y = R.alt + R.H / 2 - cellH / 2 - row * (cellH + GAP);
      const nrm = faceNormal(f), rgt = faceRight(f);
      const c = Cesium.Cartesian3.add(R.p, Cesium.Cartesian3.multiplyByScalar(nrm, V.out, new Cesium.Cartesian3()), new Cesium.Cartesian3());
      const mid = Cesium.Cartesian3.add(c, Cesium.Cartesian3.multiplyByScalar(rgt, x, new Cesium.Cartesian3()), new Cesium.Cartesian3());
      const half = Cesium.Cartesian3.multiplyByScalar(rgt, cellW / 2, new Cesium.Cartesian3());
      return { positions: [Cesium.Cartesian3.subtract(mid, half, new Cesium.Cartesian3()), Cesium.Cartesian3.add(mid, half, new Cesium.Cartesian3())],
               lo: y - cellH / 2, hi: y + cellH / 2, aspect: cellW / cellH };
    }
    const plateCache = new Map();
    function plateCanvas(noText, name, aspect) {
      const k = noText + "|" + name + "|" + aspect.toFixed(2);
      if (plateCache.has(k)) return plateCache.get(k);
      const H = 128, W = Math.max(160, Math.round(H * aspect));
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const g = c.getContext("2d");
      const bg = g.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#f8f1dc"); bg.addColorStop(1, "#e6d7b0");
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.strokeStyle = "#7a5a2a"; g.lineWidth = 5; g.strokeRect(3, 3, W - 6, H - 6);
      g.strokeStyle = "rgba(122,90,42,0.45)"; g.lineWidth = 2; g.strokeRect(11, 11, W - 22, H - 22);
      if (name) {
        g.textAlign = "center"; g.textBaseline = "middle";
        const draw = (text, size, weight, y, maxW) => {
          const set = () => { g.font = weight + " " + size + "px " + FONT; };
          set(); while (g.measureText(text).width > maxW && size > 10) { size -= 2; set(); }
          g.fillStyle = "rgba(255,255,255,0.7)"; g.fillText(text, W / 2 + 1, y + 2);
          g.fillStyle = "#231a10"; g.fillText(text, W / 2, y);
        };
        if (noText) { draw(noText, 30, 700, H * 0.33, W - 34); draw(name, 46, 800, H * 0.68, W - 34); }
        else draw(name, 46, 800, H * 0.52, W - 34);   // 1112 박수 명패 — 번호 없이 이름만 가운데
      }
      plateCache.set(k, c);
      return c;
    }

    /* ── 트리 장식 · 폴라리스 · 꼭대기 숫자 ─────────────── */
    const ornamentCount = (n) => n <= 0 ? 0 : Math.max(Math.round(30 + 28.85 * Math.log(n)), 3 * n);
    const ORN_PALETTE = ["#e8433a", "#2fb36a", "#f2c230", "#3b82f6", "#fff6e0", "#e86ac0"].map((c) => Cesium.Color.fromCssColorString(c));
    function ornSeat(k) {
      const r = rng(k * 2654435761 + 17);
      let h = 62;
      for (let i = 0; i < 60; i++) { h = 62 + r() * 238; if (r() <= lerpProfile(h) / lerpProfile(62)) break; }
      return { face: k % 4, h, t: (r() * 2 - 1) * 0.9, col: ORN_PALETTE[Math.floor(r() * ORN_PALETTE.length)], phase: r() * 6.283 };
    }
    const CHEER_SEAT0 = 100000;
    function starImage() {
      const c = document.createElement("canvas"); c.width = c.height = 128;
      const g = c.getContext("2d"), m = 64;
      const rd = g.createRadialGradient(m, m, 0, m, m, 46);
      rd.addColorStop(0, "rgba(255,255,255,1)"); rd.addColorStop(0.18, "rgba(255,246,214,0.95)");
      rd.addColorStop(0.45, "rgba(255,214,140,0.35)"); rd.addColorStop(1, "rgba(255,200,120,0)");
      g.fillStyle = rd; g.beginPath(); g.arc(m, m, 46, 0, 6.283); g.fill();
      g.strokeStyle = "rgba(255,248,225,0.95)"; g.lineCap = "round";
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4, len = k % 2 ? 34 : 60;
        g.lineWidth = k % 2 ? 2 : 3.5;
        g.beginPath(); g.moveTo(m, m); g.lineTo(m + Math.cos(a) * len, m + Math.sin(a) * len); g.stroke();
      }
      return c;
    }
    const STAR_IMG = starImage();
    function countCanvas(text, glow) {
      const H = 256, c = document.createElement("canvas"), g = c.getContext("2d");
      const font = "800 220px " + FONT;
      g.font = font; c.width = Math.ceil(g.measureText(text).width) + 80; c.height = H;
      g.font = font; g.textAlign = "center"; g.textBaseline = "middle";
      const x = c.width / 2, y = H / 2 + 8;
      g.lineJoin = "round"; g.lineWidth = 16; g.strokeStyle = "rgba(20,12,3,0.85)"; g.strokeText(text, x, y);
      const gold = g.createLinearGradient(0, 30, 0, H - 30);
      if (glow) { gold.addColorStop(0, "#ffffff"); gold.addColorStop(1, "#ffe7a6"); }
      else { gold.addColorStop(0, "#fff1c4"); gold.addColorStop(0.5, "#e8bd52"); gold.addColorStop(1, "#a8782a"); }
      g.fillStyle = gold; g.fillText(text, x, y);
      return c;
    }

    /* 단계 — 날짜로 (시험판 stageByDate 그대로) */
    function stageByDate(hasCrew) {
      const k = new Date(Date.now() + 9 * 3600 * 1000), md = (k.getUTCMonth() + 1) * 100 + k.getUTCDate(), y = k.getUTCFullYear();
      if (!hasCrew) return "notice";
      if ((y === 2026 && md >= 1224) || (y === 2027 && md <= 115)) return "eve";
      if (y >= 2027) return "after";
      return "sailed";
    }

    const NIGHT_IVORY = new Cesium.Color(0.74, 0.70, 0.62, 1);
    let stage = "notice", lights = [], faceRefs = [], nightNow = 0, eveUntil = 0;
    function buildCrew() {
      plateSources.forEach((ds) => ds.entities.removeAll()); sparkles.removeAll(); stars.removeAll();
      bulbsByFace.forEach((c) => c.removeAll()); tagsByFace.forEach((c) => c.removeAll()); countBoard.removeAll();
      lights = [];
      stage = stageByDate(roster.length > 0);
      const eve = stage === "eve";
      const R = stage === "notice" ? [] : roster.filter((r) => r.no <= PER_RING * 2);
      const n = R.reduce((m, r) => Math.max(m, r.no), 0);
      const nick = new Map(R.map((r) => [r.no, r.nick]));
      const nameOf = (no) => nick.get(no) || NAMES[(no - 1) % NAMES.length];

      /* ① 각인 — 1112 소로: 면마다 그 면에 앉은 사람 수만큼 띠를 나눈다(빈 칸 없음 · 5명이면 한 면 2장 · 세 면 1장)
         아무도 안 앉은 면(4명이 되기 전)은 앞 순번 이름을 번호 없이 — 트리의 박수 장식과 같은 셈 · 번호 달린 명패는 한 사람에 하나 */
      const rings = n > PER_RING ? 2 : 1, seats = {};
      for (const r of R) { const s = slotOf(r.no), key = s.ring + "|" + s.face; (seats[key] = seats[key] || []).push(r.no); }
      const byNo = R.map((r) => r.no).sort((a, b) => a - b);
      let cheer = 0;
      for (let ring = 0; ring < rings; ring++) {
        for (let f = 0; f < 4; f++) {
          const mine = (seats[ring + "|" + f] || []).sort((a, b) => a - b);
          const list = mine.length ? mine.map((no) => ({ no, num: true }))
                                   : [{ no: byNo.length ? byNo[cheer++ % byNo.length] : 0, num: false }];
          const k = list.length;
          for (let idx = 0; idx < k; idx++) {
            const it = list[idx], w = plateWall(ring, f, idx, k);
            const img = plateCanvas(it.num ? "No." + String(it.no).padStart(3, "0") : "", it.no ? nameOf(it.no) : "", w.aspect);
            const phase = (f * 27 + idx) * 0.618;
            const color = new Cesium.CallbackProperty(() => {
              if (eve) { const t = performance.now() / 1000, b = 0.82 + 0.18 * Math.sin(t * 2.2 + phase);
                         return new Cesium.Color(1, 0.96 * b + 0.04, 0.82 * b + 0.12, 1); }
              return nightNow > 0.2 ? NIGHT_IVORY : Cesium.Color.WHITE;   // 밤엔 한 톤 눌러 번짐에 하얗게 타지 않게
            }, false);
            plateSources[f].entities.add({ wall: { positions: w.positions, minimumHeights: [w.lo, w.lo], maximumHeights: [w.hi, w.hi],
              material: new Cesium.ImageMaterialProperty({ image: img, transparent: false, color }) } });
          }
        }
      }

      /* ② 트리 장식 — 출항 뒤 · 귀환 전야에만 */
      if (R.length > 0 && (stage === "sailed" || eve)) {
        const total = ornamentCount(R.length);
        const add = (seatNo, text, own) => {
          const S = ornSeat(seatNo), pos = facePoint(S.face, S.h, S.t, 3);
          const p = bulbsByFace[S.face].add({ position: pos, pixelSize: own ? 10 : 7, color: S.col, outlineColor: S.col.withAlpha(0.35), outlineWidth: own ? 4 : 3 });
          tagsByFace[S.face].add({ position: pos, text, font: (own ? "800 16px " : "700 13px ") + FONT,
            fillColor: S.col, style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineColor: Cesium.Color.fromCssColorString("#140d04"), outlineWidth: own ? 4 : 3,
            pixelOffset: new Cesium.Cartesian2(own ? 9 : 7, -2), horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, own ? 480 : 300) });
          lights.push({ p, base: S.col, phase: S.phase });
        };
        for (const r of R) add(r.no, "No." + String(r.no).padStart(3, "0") + " " + nameOf(r.no), true);
        for (let j = 0; j < total - R.length; j++) add(CHEER_SEAT0 + j, nameOf(R[j % R.length].no), false);
      }

      faceRefs = [0, 1, 2, 3].map((f) => ({ pt: facePoint(f, 90, 0, 0), nrm: faceNormal(f) }));
      for (let i = 0; i < 700; i++) {
        const r = rng(900000 + i), face = i % 4, h = 10 + r() * 300;
        const t = h < 57 ? (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.38) : (r() * 2 - 1) * 0.96;
        sparkles.add({ position: facePoint(face, h, t, 2.5), pixelSize: 3, color: Cesium.Color.WHITE.withAlpha(0) });
      }
      if (R.length > 0) {
        const img = countCanvas(String(R.length), eve);
        countBoard.add({ position: local(0, 0, V.numH), image: img, sizeInMeters: true,
          width: V.numS * img.width / img.height, height: V.numS, verticalOrigin: Cesium.VerticalOrigin.CENTER });
      }
      stars.add({ position: local(0, 0, V.polarisH), image: STAR_IMG, scale: eve ? 0.8 : 0.5,
        color: eve ? Cesium.Color.WHITE : Cesium.Color.WHITE.withAlpha(0.14) });
    }
    buildFrieze(); buildCrew();
    setInterval(async () => { const before = JSON.stringify(roster); await loadRoster(); if (JSON.stringify(roster) !== before || stageByDate(roster.length > 0) !== stage) buildCrew(); }, 10 * 60 * 1000);

    /* ── 밤빛 — 홈페이지 상영 화면과 같은 셰이더 · 탑 가까이 + 파리가 밤일 때만 ── */
    const nightShader = new Cesium.CustomShader({
      lightingModel: Cesium.LightingModel.UNLIT,
      uniforms: { u_night: { type: Cesium.UniformType.FLOAT, value: 0.8 } },
      fragmentShaderText: `
        void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
          vec3 c = material.diffuse;
          float l = dot(c, vec3(0.299, 0.587, 0.114));
          vec3 night = mix(vec3(l), c, 0.25) * vec3(0.42, 0.52, 0.85) * 0.22;
          material.diffuse = mix(c, night, u_night);
        }`
    });
    let shaderSave = null, bloomSave = null;           // 덮기 전 값 — 떠날 때 그대로 돌려놓는다
    function setNight(amount) {
      const ts = tileset();
      if (amount > 0) {
        if (ts && !shaderSave) { shaderSave = { v: ts.customShader }; try { ts.customShader = nightShader; } catch (e) { shaderSave = null; } }
        try { nightShader.setUniform("u_night", amount); } catch (e) {}
        const bl = scene.postProcessStages.bloom;
        if (!bloomSave) {
          const u = bl.uniforms;
          bloomSave = { enabled: bl.enabled, glowOnly: u.glowOnly, contrast: u.contrast, brightness: u.brightness, delta: u.delta, sigma: u.sigma, stepSize: u.stepSize };
          bl.enabled = true; u.glowOnly = false; u.contrast = 119; u.brightness = -0.35; u.delta = 1.0; u.sigma = 3.2; u.stepSize = 1.0;
        }
      } else {
        if (ts && shaderSave) { try { ts.customShader = shaderSave.v; } catch (e) {} }
        shaderSave = null;
        if (bloomSave) { const bl = scene.postProcessStages.bloom, u = bl.uniforms;
          bl.enabled = bloomSave.enabled; u.glowOnly = bloomSave.glowOnly; u.contrast = bloomSave.contrast; u.brightness = bloomSave.brightness;
          u.delta = bloomSave.delta; u.sigma = bloomSave.sigma; u.stepSize = bloomSave.stepSize; bloomSave = null; }
      }
      nightNow = amount;
    }

    /* ── 한 장면마다 — 가까우면 세우고, 카메라 쪽 면만 보이고, 전구는 숨 쉰다 ── */
    let near = null, lastNightCheck = -Infinity;
    const showAll = (on) => { friezeSource.show = on; plateSources.forEach((ds) => { ds.show = on; }); allPrims.forEach((p) => { p.show = on; }); };
    showAll(false);
    scene.preRender.addEventListener(() => {
      const camPos = viewer.camera.positionWC;
      const isNear = Cesium.Cartesian3.distance(camPos, CENTER) < NEAR_M;
      const now = performance.now();
      if (isNear !== near) {
        near = isNear; showAll(isNear);
        if (!isNear) setNight(0);
        else { lastNightCheck = -Infinity; if (stage === "eve") eveUntil = now + 20000; }   // 귀환 전야 — 다가오면 20초 반짝임
      }
      if (!isNear) return;

      if (now - lastNightCheck > 30000) {              // 해는 30초에 한 번만 본다
        lastNightCheck = now;
        const reading = document.body && document.body.classList.contains("reading-on");
        setNight(NIGHT_ON && !reading ? nightAmount(Date.now()) : 0);
      }

      for (const F of friezeEntities) {
        const toCam = Cesium.Cartesian3.subtract(camPos, F.mid, new Cesium.Cartesian3());
        F.e.show = Cesium.Cartesian3.dot(Cesium.Cartesian3.normalize(toCam, toCam), F.nrm) > 0.12;
      }
      const facing = (lim) => faceRefs.map((R) => {
        const v = Cesium.Cartesian3.subtract(camPos, R.pt, new Cesium.Cartesian3());
        return Cesium.Cartesian3.dot(Cesium.Cartesian3.normalize(v, v), R.nrm) > lim;
      });
      const vis = facing(0.1), visSide = facing(-0.35);
      plateSources.forEach((ds, f) => { const on = !!vis[f]; if (ds.show !== on) ds.show = on; });
      for (let f = 0; f < 4; f++) { const on = !!visSide[f]; if (bulbsByFace[f].show !== on) bulbsByFace[f].show = on; if (tagsByFace[f].show !== on) tagsByFace[f].show = on; }

      const tsec = now / 1000, sparkle = stage === "eve" && now < eveUntil;
      for (const L of lights) {
        const a = 0.78 + 0.22 * Math.sin(tsec * 1.3 + L.phase);
        L.p.color = sparkle && Math.sin(tsec * 23 + L.phase * 9) > 0.6 ? Cesium.Color.WHITE : L.base.withAlpha(a);
      }
      const n = sparkles.length;
      for (let i = 0; i < n; i++) {
        const sp = sparkles.get(i);
        if (!sparkle) { if (sp.color.alpha !== 0) sp.color = Cesium.Color.WHITE.withAlpha(0); continue; }
        sp.color = Cesium.Color.WHITE.withAlpha(Math.sin(tsec * 31 + i * 12.9898) > 0.82 ? 1 : 0);
      }
    });
    console.log("[EG 에펠탑] 앱 지도에 세움 — 대원 " + roster.length + "명 · 단계 " + stage);
  }

  window.EGTower = { mount, _sunAltDeg: sunAltDeg, _nightAmount: nightAmount };
})();
