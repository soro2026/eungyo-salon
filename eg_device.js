/* ══════════════════════════════════════════════════════════════════════════
   eg_device.js — 폰인가 아닌가. 한 곳에서만 판정한다. (2026.07.28)

   index.html · terra.html · m.html 이 한 벌을 함께 쓴다.
   판정이 여러 곳에 흩어지면 서로 어긋나고, 어긋나면 손님이 엉뚱한 셸로
   끌려간다. 고칠 곳은 언제나 이 파일 하나뿐이어야 한다.

   ⚠ User-Agent는 보지 않는다.
     아이패드는 자기를 맥이라 하고, 데스크톱 모드를 켠 폰은 자기를
     데스크톱이라 한다. 물어보면 거짓말을 하니 재는 수밖에 없다.

   ─────────────────────────────────────────────────────────────────────────
   왜 "창 너비"가 아니라 "화면의 짧은 변"인가 — 0728 소로 실기기 실측

     기기              창 너비    화면        손가락
     노트북 전체         1440    1440×900    아니오
     노트북 절반          763    1440×900    아니오
     아이폰13 세로        390     390×844    예
     아이폰13 가로        750     390×844    예      ← 844가 아니다

   아이폰을 눕히면 창 너비가 750이 된다. 노치 좌우가 잘려 나가기 때문이다.
   그런데 **아이패드 미니 세로가 744다. 단 6px 차이.**
   창 너비로는 이 둘을 영영 가를 수 없다. 실제로 후보 다섯(744·768·820·
   860·900) 중 일곱 경우를 모두 옳게 가르는 숫자가 하나도 없었다.
   특히 애초 잠정값이던 820은 **아이패드 11인치까지 폰으로 판정**한다.

   화면의 짧은 변은 다르다.
     · 폰은 최대 ~440 (아이폰 프로 맥스 430)
     · 아이패드는 최소 744 (미니)
   사이가 300px이나 비어 있다. 게다가 창을 줄이거나 기기를 눕혀도
   이 값은 변하지 않는다 — 노트북 창을 아무리 좁혀도 폰이 되지 않는다.
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";

  /* 폰 짧은 변 최대 ~440, 아이패드 최소 744. 그 넓은 사이의 한가운데.
     폴더블을 펼친 경우(짧은 변 ~670)는 데스크톱 쪽으로 보낸다 — 펼친 폴드는
     태블릿에 가깝고, 무엇보다 그 화면에서 3D 지구가 감당된다. */
  var PHONE_MAX = 600;

  function shortSide(){
    try{
      var w = (screen && screen.width)  || window.innerWidth;
      var h = (screen && screen.height) || window.innerHeight;
      return Math.min(w, h);
    }catch(e){
      return Math.min(window.innerWidth, window.innerHeight);
    }
  }

  function coarse(){
    try{ return window.matchMedia("(pointer: coarse)").matches; }
    catch(e){ return false; }
  }

  /* 숨은 문 하나 — 손님에게 안내하지 않는다.
     ?phone=1  노트북에서 폰 셸을 본다 (m.html을 책상에서 손볼 때)
     한 번 열면 그 세션 내내 유지된다.

     ⚠ 반대 방향 문(?desk=1)은 두지 않는다 — 0728 소로 결정.
       결정문 4호: "3D 타일은 막지 말고 길을 놓지 않는다."
       폰에서 지구는 잠깐 돌다가 결국 터진다. 뒷문을 하나라도 남기면
       그것은 결국 누군가 밟는 길이 되고, 그 사람은 터진 화면을 본다.
       소로도 예외가 아니다 — 노트북을 늘 들고 다니기로 했다. */
  function override(){
    var v = null;
    try{
      var q = new URLSearchParams(location.search);
      if (q.get("phone") === "1") v = "phone";
      if (q.get("shell") === "auto"){ sessionStorage.removeItem("eg_shell"); return null; }
      if (v) sessionStorage.setItem("eg_shell", v);
      else   v = sessionStorage.getItem("eg_shell");
    }catch(e){}          /* 프라이빗 모드·iframe에서 던질 수 있다 */
    return v;
  }

  function egIsPhone(){
    if (override() === "phone") return true;
    return shortSide() <= PHONE_MAX && coarse();
  }

  /* ── 되돌림 장치 ──
     주소를 직접 친 폰 손님을 폰 셸로 돌려보낸다 (결정문 4호).
     terra.html 진입부 맨 앞에서 부른다. 되돌렸으면 true를 주므로
     호출부는 그 즉시 return해 Cesium을 한 줄도 켜지 않아야 한다.

     ⚠ 스위치가 꺼져 있는 동안은 아무 일도 하지 않는다.
       m.html이 서기 전에 켜면 폰 손님이 없는 파일로 간다.
       m.html을 올리는 날 아래 한 줄만 true로 바꾼다. */
  var PHONE_SHELL_READY = false;

  function egPhoneGuard(){
    if (!PHONE_SHELL_READY) return false;
    if (!egIsPhone()) return false;
    try{ location.replace("m.html"); }catch(e){ location.href = "m.html"; }
    return true;
  }

  window.egIsPhone   = egIsPhone;
  window.egPhoneGuard = egPhoneGuard;

  /* 진단용 — 콘솔에서 egDevice.report() 한 줄이면 왜 그렇게 판정했는지 나온다 */
  window.egDevice = {
    PHONE_MAX: PHONE_MAX,
    shortSide: shortSide,
    coarse: coarse,
    override: override,
    phoneShellReady: PHONE_SHELL_READY,
    report: function(){
      return {
        "짧은 변": shortSide(),
        "손가락": coarse(),
        "강제": override() || "없음",
        "판정": egIsPhone() ? "폰" : "데스크톱",
        "폰 셸 준비": PHONE_SHELL_READY ? "됨 (되돌림 작동)" : "아직 (되돌림 꺼짐)"
      };
    }
  };
})();
