/* eg-crash-guard.js — 3D 크래시 감지·안내 (breadcrumb 방식)
 * 2026.07.06 · EG유니버스
 *
 * 대상: maison.html · star_voyage.html (Cesium WebGL) + wunderkammer_shell (CSS 3D)
 * 원리: 3D 진입 직전 표식을 심고, 정상 이탈 시 지운다. 펑 터져 죽으면 표식이
 *       남으므로, 다음 진입 때 그 표식을 주워 crash_logs에 INSERT하고 팝업을 띄운다.
 * 특징: supabase-js 라이브러리에 의존하지 않음 — localStorage + fetch 만 사용.
 *       (셸은 supabase-js를 안 쓰므로 순수 방식이어야 세 곳이 하나를 공유한다.)
 *
 * 사용:
 *   ① <script src="eg-crash-guard.js"></script>
 *   ② 페이지 로드 즉시(3D 시작 전):  if (EGCrashGuard.check()) return;   // 지난 크래시면 팝업만 띄우고 3D 중단
 *   ③ 3D 진입 직전:                 EGCrashGuard.mark('voyage');  // 'maison'|'voyage'|'shell'
 *   ④ (WebGL만) 뷰어 생성 후:
 *        viewer.scene.canvas.addEventListener('webglcontextlost', EGCrashGuard.markWebGL);
 *   ※ 정상 이탈(clear)은 pagehide에서 자동 처리 — 별도 호출 불필요.
 */
(function () {
  var KEY = 'eg-crash-breadcrumb';
  var SUPA_URL = 'https://cyhlotwdisjvoxvfkpnd.supabase.co';
  var SUPA_KEY = 'sb_publishable_jYYfQV_wQgMRFjSUuDq7xA_gWc9vsnR';

  // 로그인 세션(access_token·uid)을 storageKey에서 직접 파싱
  function readSession() {
    try {
      var raw = localStorage.getItem('eungyo-auth');
      if (!raw) return { token: null, uid: null };
      var s = JSON.parse(raw);
      return { token: s.access_token || null, uid: (s.user && s.user.id) || null };
    } catch (e) { return { token: null, uid: null }; }
  }

  // 진단정보 수집
  function diag(page) {
    return {
      page: page,
      entered_at: new Date().toISOString(),
      device_memory: (navigator.deviceMemory != null ? navigator.deviceMemory : null),
      cores: (navigator.hardwareConcurrency != null ? navigator.hardwareConcurrency : null),
      screen_size: (window.screen ? (window.screen.width + 'x' + window.screen.height) : null),
      ua: navigator.userAgent,
      reason: 'breadcrumb'
    };
  }

  var EGCrashGuard = {
    // 3D 진입 직전 — 표식 ON
    mark: function (page) {
      try { localStorage.setItem(KEY, JSON.stringify(diag(page))); } catch (e) {}
    },

    // 정상 이탈 — 표식 OFF
    clear: function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
    },

    // WebGL 컨텍스트 손실(GPU 폭발 확정) — 표식에 마킹
    markWebGL: function () {
      try {
        var c = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (c) { c.reason = 'webglcontextlost'; localStorage.setItem(KEY, JSON.stringify(c)); }
      } catch (e) {}
    },

    // 재진입 검사 — 표식 있으면 crash_logs INSERT + 팝업 (1회 뜨고 리셋)
    check: function () {
      var c;
      try { c = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { c = null; }
      if (!c) return false;   // 지난 크래시 없음 → 3D 정상 진행
      try { localStorage.removeItem(KEY); } catch (e) {}   // 즉시 리셋 (다음 1회만)

      // best-effort 기록 (실패해도 팝업은 뜬다)
      var sess = readSession();
      try {
        fetch(SUPA_URL + '/rest/v1/crash_logs', {
          method: 'POST',
          headers: {
            'apikey': SUPA_KEY,
            'Authorization': 'Bearer ' + (sess.token || SUPA_KEY),
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            uid: sess.uid,
            page: c.page || null,
            reason: c.reason || 'breadcrumb',
            device_memory: c.device_memory,
            cores: c.cores,
            screen_size: c.screen_size,
            ua: c.ua,
            entered_at: c.entered_at
          }),
          keepalive: true
        }).catch(function () {});
      } catch (e) {}

      _showPopup();
      return true;   // 지난 크래시 감지 → 호출한 페이지는 3D 초기화를 건너뛴다
    }
  };

  // 재진입 안내 팝업 — 노트북·데스크톱·태블릿 권유 (진입 차단 아님)
  function _showPopup() {
    if (document.getElementById('eg-crash-overlay')) return;
    var ov = document.createElement('div');
    ov.id = 'eg-crash-overlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.82);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:24px';
    ov.innerHTML =
      '<div style="background:#faf6ee;border:1px solid rgba(184,136,30,.3);border-top:3px solid #C9A84C;border-radius:20px;padding:30px 26px 24px;max-width:360px;width:100%;text-align:center;box-shadow:0 12px 48px rgba(0,0,0,.4);font-family:system-ui,-apple-system,sans-serif">' +
        '<div style="font-size:34px;margin-bottom:12px">🖥️</div>' +
        '<div style="font-size:17px;font-weight:700;color:#2a2018;margin-bottom:12px">넉넉한 화면에서 만나요</div>' +
        '<div style="font-size:14px;line-height:1.75;color:#5a4a32;margin-bottom:22px">지난번 이 기기에서 3차원 공간이 버거워 멈춘 듯합니다.<br>노트북 · 데스크톱 · 태블릿에서 열면 온전히 거닐 수 있어요.</div>' +
        '<div style="display:flex;gap:8px">' +
          '<button id="eg-crash-back" style="flex:1;font-family:inherit;font-size:14px;font-weight:600;padding:12px 0;border:1px solid rgba(184,136,30,.35);border-radius:11px;background:transparent;color:#6a5a3a;cursor:pointer">뒤로 가기</button>' +
          '<button id="eg-crash-go" style="flex:1;font-family:inherit;font-size:14px;font-weight:600;padding:12px 0;border:none;border-radius:11px;background:#C9A84C;color:#2a2018;cursor:pointer">그래도 계속</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    document.getElementById('eg-crash-go').onclick = function () { location.reload(); };  // 표식은 이미 지워졌으니 리로드=3D 재시도
    document.getElementById('eg-crash-back').onclick = function () {
      if (history.length > 1) history.back(); else ov.remove();
    };
  }

  // 정상 이탈 자동 감지 — 페이지가 실제로 떠날 때 표식 제거
  window.addEventListener('pagehide', function () { EGCrashGuard.clear(); });

  window.EGCrashGuard = EGCrashGuard;
})();
