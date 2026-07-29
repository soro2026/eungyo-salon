/* ══════════════════════════════════════════════════════════════════════════
   eg_back.js — 폰에서 방을 나가는 문. 한 곳에서만 짓는다. (2026.07.29)

   ─────────────────────────────────────────────────────────────────────────
   왜 필요한가

   X 버튼은 방이 가진 것이 아니라 **액자가 가진 것**이었다.
     terra.html 892줄  <button id="stadClose">×</button>
                       <iframe id="stadFrame">

   웹에서는 terra가 방을 액자에 넣어 띄우므로 액자의 X로 나간다.
   폰에서는 m.html이 location.href로 생짜 이동을 하므로 액자가 없고,
   따라서 문고리도 없다. 열 방 전부가 같은 상태였다.

   ─────────────────────────────────────────────────────────────────────────
   뜨는 조건 둘 — 둘 다일 때만 뜬다

     ① 액자 밖일 것   (window.self === window.top)
        액자 안에서 뜨면 X가 두 개가 된다.
     ② 폰일 것        (egIsPhone)
        노트북에는 액자의 X가 이미 있다.

   ⚠ 판정은 절대 여기서 새로 하지 않는다. eg_device.js 한 벌을 쓴다.
     그 파일이 아직 안 실린 방이면 스스로 불러온다 — 방마다 <script>를
     두 줄씩 넣게 하면 언젠가 한 방에서 한 줄이 빠진다.
     불러오기에 실패하면 아무것도 그리지 않는다.
     **없는 버튼이 잘못 판정한 버튼보다 낫다.**

   ─────────────────────────────────────────────────────────────────────────
   돌아가는 방법

     직전 곳이 m.html이면  history.back()  — 내려두었던 곳이 보존된다
     그 밖(북마크·PWA 직입장)  location.href = "m.html"

   열 방 전부 pushState·replaceState가 0건임을 실측했으므로(0729),
   한 걸음 뒤로는 언제나 방 밖이다. 탭을 갈아도 이력이 안 쌓인다.

   ─────────────────────────────────────────────────────────────────────────
   왼쪽 아래인 이유 셋

     ① 열 방의 머리 구조가 제각각이다. 위에 한 벌로 놓으면 어느 방에선가
        반드시 다른 것을 덮는다.
     ② 폰은 엄지가 아래에 있다. 왼쪽 위 구석이 가장 닿기 어렵다.
     ③ 사파리 툴바는 env(safe-area-inset-bottom)으로 피한다.

   z-index 900 — 방의 모달(9999)보다 낮다. 모달이 뜨면 가려지는 것이 맞다.
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";

  /* ── 관문 ① 액자 안이면 아무 일도 하지 않는다 ── */
  try{ if (window.self !== window.top) return; }catch(e){ return; }

  var DEVICE_SRC = "eg_device.js?v=20260729";
  var HOME       = "m.html";

  /* ── 판별기 확보 후 착수 ── */
  if (typeof window.egIsPhone === "function"){
    ready(boot);
  } else {
    var s = document.createElement("script");
    s.src = DEVICE_SRC;
    s.onload  = function(){ ready(boot); };
    s.onerror = function(){ /* 판별기를 못 받으면 그리지 않는다 */ };
    document.head.appendChild(s);
  }

  function ready(fn){
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once:true });
    else fn();
  }

  function boot(){
    /* ── 관문 ② 폰이 아니면 아무 일도 하지 않는다 ── */
    if (typeof window.egIsPhone !== "function") return;
    if (!window.egIsPhone()) return;
    if (document.getElementById("egBackChip")) return;   /* 두 번 실려도 하나만 */
    if (!document.body) return;

    var css = document.createElement("style");
    css.id = "egBackChipCSS";
    css.textContent =
      '#egBackChip{' +
        'position:fixed;left:14px;z-index:900;' +
        'bottom:calc(14px + env(safe-area-inset-bottom,0px));' +
        'display:inline-flex;align-items:center;gap:7px;' +
        'margin:0;padding:9px 15px 9px 12px;' +
        'border:1px solid rgba(248,244,238,0.16);border-radius:999px;' +
        'background:rgba(30,27,22,0.82);' +
        '-webkit-backdrop-filter:saturate(140%) blur(10px);' +
        'backdrop-filter:saturate(140%) blur(10px);' +
        'box-shadow:0 6px 20px rgba(20,17,13,0.28);' +
        'color:#f2ece1;cursor:pointer;' +
        '-webkit-tap-highlight-color:transparent;' +
        'transition:transform .16s ease,opacity .16s ease;' +
      '}' +
      '#egBackChip:active{transform:scale(0.96);opacity:.85}' +
      '#egBackChip .eg-bc-a{font-size:13px;line-height:1;color:#c9a86a}' +
      '#egBackChip .eg-bc-t{' +
        'font-family:"JetBrains Mono","SFMono-Regular",Menlo,monospace;' +
        'font-size:10px;font-weight:500;letter-spacing:0.14em;line-height:1;' +
        'white-space:nowrap;' +
      '}' +
      '@media print{#egBackChip{display:none}}';
    document.head.appendChild(css);

    var b = document.createElement("button");
    b.id = "egBackChip";
    b.type = "button";
    b.setAttribute("aria-label", "EG UNIVERSE로 돌아가기");
    b.innerHTML = '<span class="eg-bc-a" aria-hidden="true">&#8592;</span>' +
                  '<span class="eg-bc-t">EG UNIVERSE</span>';
    b.addEventListener("click", goHome);
    document.body.appendChild(b);
  }

  function goHome(){
    var ref = "";
    try{ ref = document.referrer || ""; }catch(e){}
    var fromShell = /\/m\.html(?:[?#]|$)/.test(ref);
    if (fromShell && history.length > 1){ history.back(); return; }
    location.href = HOME;
  }

  /* 진단용 — 콘솔에서 egBack.report() */
  window.egBack = {
    home: HOME,
    goHome: goHome,
    report: function(){
      return {
        "액자 안": (function(){ try{ return window.self !== window.top; }catch(e){ return "알 수 없음"; } })(),
        "판별기": typeof window.egIsPhone === "function" ? "실림" : "없음",
        "폰 판정": typeof window.egIsPhone === "function" ? window.egIsPhone() : "판정 불가",
        "칩": document.getElementById("egBackChip") ? "떠 있음" : "없음",
        "직전 곳": document.referrer || "없음"
      };
    }
  };
})();
