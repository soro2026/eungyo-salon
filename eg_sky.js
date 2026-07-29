/* ══════════════════════════════════════════════════════════════════════════
   eg_sky.js — EG의 하늘. 온 우주가 같은 시계로 돈다. (2026.07.29)

   ─────────────────────────────────────────────────────────────────────────
   왜 지었나 — 0729 실측: 잣대가 넷이었다

     폰 차림표 · 분더카머 거실   손님 시각 + 고정 구간(5/9/17/20)
     콜레주 · 전당 · 팝업        서울 시각 + 실제 일출·일몰(NOAA)

   해외 손님만의 이야기가 아니었다. **국내에서도 갈렸다.**

     2026-12-15 (서울 일몰 17:15)
       16:00   콜레주 저녁  ↔  거실 낮
       18:00   콜레주 밤    ↔  거실 저녁
       19:00   콜레주 밤    ↔  거실 저녁

   겨울 저녁 일곱 시에 거실에서 콜레주로 걸어가면 저녁이던 창이 밤이 된다.
   한 손님이 같은 순간에 두 하늘을 본다.

   ─────────────────────────────────────────────────────────────────────────
   두 축을 이렇게 정했다

     ① 누구의 시각인가 → **서울.**
        EG의 하루는 서울에서 열리고 닫힌다(경기·날짜·타석 마감이 이미 그렇다).
        ⚠ 0729 오전에 「창밖만은 손님 시각」이라 정했다가 같은 날 거뒀다.
          파리 콩파뇽이 차림표에서 밤을 보고 콜레주에서 낮 하늘을 만나면
          한 손님 안에서 세계가 갈린다. 통일이 어느 쪽이냐보다 중요하다.

     ② 무엇으로 나누는가 → **실제 일출·일몰.**
        겨울 저녁 여섯 시는 이미 캄캄한데 고정 구간은 저녁 그림을 내민다.
        하늘은 계절을 따라 움직이므로 잣대도 따라 움직여야 한다.

   ─────────────────────────────────────────────────────────────────────────
   계산 — 외부 API 없음. NOAA 태양 방정식, 오차 ±2분.

   한국은 서머타임이 없어 UTC+9 고정이다. Date.now()는 시간대라는 개념이
   없는 눈금이므로, 거기에 9시간을 얹어 getUTC*로 읽으면 그것이 곧 서울
   벽시계다. 손님 폰의 시간대 설정을 한 번도 쳐다보지 않는다 —
   시간대를 손으로 잘못 맞춰 둔 폰이 와도 EG의 하늘은 흔들리지 않는다.

   ─────────────────────────────────────────────────────────────────────────
   쓰는 법

     <script src="eg_sky.js?v=20260729"></script>

     egSky.phase()          'm' | 'd' | 'e' | 'n'      넉 장짜리 방
     egSky.phase2()         'd' | 'n'                  두 장짜리 방(팝업)
     egSky.sun()            {rise, set}  서울 일출·일몰 (시 단위 소수)
     egSky.hour()           서울 시각 (시 단위 소수)
     egSky.parts()          {y, mo, d, h, mi, dow}
     egSky.today()          '2026-07-29'  ← 서울 날짜
     egSky.secToMidnight()  서울 자정까지 남은 초
     egSky.watch(fn)        구간이 바뀌면 fn(새 구간) — 60초 보초. 끄려면 반환값()
     egSky.report()         진단 한 줄

   ⚠ 새 셸을 지을 때 시각 분기를 직접 쓰지 말 것. 여기에 한 줄 더 붙인다.
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";

  var LAT = 37.5665, LNG = 126.9780;   /* 서울 */
  var KST_MS = 9*3600*1000;
  var DAY_MS = 86400000;

  /* 서울 벽시계를 UTC 칸에 담아 돌려준다 */
  function seoulDate(){ return new Date(Date.now() + KST_MS); }

  function parts(){
    var d = seoulDate();
    return { y:d.getUTCFullYear(), mo:d.getUTCMonth()+1, d:d.getUTCDate(),
             h:d.getUTCHours(), mi:d.getUTCMinutes(), dow:d.getUTCDay() };
  }

  function hour(){
    var d = seoulDate();
    return d.getUTCHours() + d.getUTCMinutes()/60;
  }

  function today(){
    var p = parts(), z = function(n){ return (n<10?"0":"")+n; };
    return p.y + "-" + z(p.mo) + "-" + z(p.d);
  }

  function secToMidnight(){
    return Math.floor((DAY_MS - ((Date.now() + KST_MS) % DAY_MS)) / 1000);
  }

  /* NOAA 태양 방정식 — 서울 일출·일몰(시 단위 소수, KST) */
  function sun(){
    var d = seoulDate();
    var N = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
                      - Date.UTC(d.getUTCFullYear(), 0, 0)) / DAY_MS);
    var g = 2*Math.PI/365 * (N - 1 + (d.getUTCHours()-12)/24);      /* 연중 각도 */
    var eqt = 229.18*(0.000075 + 0.001868*Math.cos(g) - 0.032077*Math.sin(g)
            - 0.014615*Math.cos(2*g) - 0.040849*Math.sin(2*g));      /* 균시차(분) */
    var decl = 0.006918 - 0.399912*Math.cos(g) + 0.070257*Math.sin(g)
             - 0.006758*Math.cos(2*g) + 0.000907*Math.sin(2*g)
             - 0.002697*Math.cos(3*g) + 0.00148*Math.sin(3*g);       /* 적위 */
    var rad = Math.PI/180;
    var cosH = ( Math.cos(rad*90.833) / (Math.cos(rad*LAT)*Math.cos(decl)) )
             - Math.tan(rad*LAT)*Math.tan(decl);
    if (cosH >=  1) return { rise:24, set:24 };   /* 해가 안 뜨는 날 (서울엔 없다) */
    if (cosH <= -1) return { rise:0,  set:24 };   /* 해가 안 지는 날 */
    var ha = Math.acos(cosH)/rad;                 /* 시간각(도) */
    return { rise: ((720 - 4*(LNG+ha) - eqt)/60 + 9 + 24) % 24,
             set:  ((720 - 4*(LNG-ha) - eqt)/60 + 9 + 24) % 24 };
  }

  function inSpan(x, a, b){ return a<=b ? (x>=a && x<b) : (x>=a || x<b); }

  /* 넉 칸 — 콜레주 혈통 그대로.
     아침은 일출 앞뒤 두 시간, 저녁은 일몰 앞 두 시간. */
  function phase(){
    var s = sun(), h = hour();
    var mS = (s.rise-2+24)%24, mE = (s.rise+2)%24, dE = (s.set-2+24)%24;
    if (inSpan(h, mS, mE)) return "m";
    if (inSpan(h, mE, dE)) return "d";
    if (inSpan(h, dE, s.set%24)) return "e";
    return "n";
  }

  /* 두 칸 — 팝업 혈통 그대로. 해가 떠 있으면 낮. */
  function phase2(){
    var s = sun(), h = hour();
    return (h >= s.rise && h < s.set) ? "d" : "n";
  }

  /* 보초 — 구간이 바뀌는 순간에만 부른다. 60초면 충분하다.
     반환값을 부르면 멈춘다. */
  function watch(fn, opts){
    var two = opts && opts.two;
    var read = two ? phase2 : phase;
    var cur = read();
    var id = setInterval(function(){
      var next = read();
      if (next === cur) return;
      cur = next;
      try{ fn(next); }catch(e){}
    }, 60000);
    return function(){ clearInterval(id); };
  }

  var KO = { m:"아침", d:"낮", e:"저녁", n:"밤" };
  function pad2(n){ return (n<10?"0":"")+n; }
  function hhmm(x){ return pad2(Math.floor(x)) + ":" + pad2(Math.round((x%1)*60)); }

  window.egSky = {
    phase: phase, phase2: phase2, sun: sun, hour: hour,
    parts: parts, today: today, secToMidnight: secToMidnight,
    watch: watch,
    report: function(){
      var s = sun(), p = parts();
      return {
        "서울": p.y+"-"+pad2(p.mo)+"-"+pad2(p.d)+" "+pad2(p.h)+":"+pad2(p.mi),
        "일출": hhmm(s.rise), "일몰": hhmm(s.set),
        "구간": phase() + " (" + KO[phase()] + ")",
        "두 칸": phase2(),
        "자정까지": Math.floor(secToMidnight()/3600) + "시간 " +
                    Math.floor(secToMidnight()%3600/60) + "분"
      };
    }
  };
})();
