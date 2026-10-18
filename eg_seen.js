/* ══════════════════════════════════════════════════════════════════════════
   eg_seen.js — 「이 기기는 EG에 한 번 들어와 본 적이 있다」 표지 (2026.10.18)

   결정문 〈EG홈페이지_단추두얼굴 … v1.0 1018〉 §1.
   홈페이지(egsalon.com) 오른쪽 위 단추가 이 표지 하나만 보고 얼굴을 바꾼다.
     표지 없음   EG 둘러보기   처음 온 분
     표지 있음   EG 들어가기   → app.egsalon.com (저장된 로그인으로 바로 열림)

   ⭐ 개인정보는 싣지 않는다 — 값은 「1」 하나뿐. 누구인지는 홈페이지가 모른다.
   ⭐ 로그아웃해도 지우지 않는다 — 「한 번이라도 로그인한 기기」가 기준이다(1018 소로).
      로그아웃한 분이 「EG 들어가기」를 누르면 로그인 문이 열릴 뿐, 틀린 길이 아니다.
   ⭐ Supabase 클라이언트를 만들지 않는다 — 로그인 저장 칸(storageKey eungyo-auth)에
      값이 있는지만 본다. 「한 문서 · 한 클라이언트」(terra 0818)를 건드리지 않으려고.
   ⚠ egsalon.com 이 아닌 곳(github.io 주소 · 로컬)에서는 아무것도 하지 않는다.

   부르는 곳: index.html · terra.html · m.html
   ══════════════════════════════════════════════════════════════════════════ */
(function(){
  try{
    var host = location.hostname;
    if (host !== 'egsalon.com' && !/\.egsalon\.com$/.test(host)) return;
    var raw = localStorage.getItem('eungyo-auth');
    if (!raw) return;
    var s = JSON.parse(raw);
    if (!s || !(s.access_token || (s.currentSession && s.currentSession.access_token))) return;
    /* 2년. 들를 때마다 다시 적으니 드나드는 분에게는 끝나지 않는다 */
    document.cookie = 'eg_seen=1; Domain=egsalon.com; Path=/; Max-Age=63072000; SameSite=Lax; Secure';
  }catch(e){ /* 표지는 덤이다 — 실패해도 앱은 그대로 연다 */ }
})();
