/* ═══════════════════════════════════════════════════════════════════════════
   EG탐험대 미션 카드 — mission.js  (1111 · 파이스 · 소로 결정)

   ⭐ 한 파일이 어느 화면에서나 같은 일을 한다 — 지도(terra) · 천문대(constella) · 음악관(concert) …
     · 진행 중 표      왼쪽 아래 「진행 중 · 02 끝내 보지 못한 집」 → 누르면 카드판
     · 카드판          가운데 본 카드 · 양옆 작은 카드가 살짝 비침(아코디언) · ‹ › · 맨 위 안내
     · 닿음            그 화면이 egMission.mark(kind, ref) 한 줄을 부르면 서버가 판정 → 「찾았습니다 · 소감 쓰기」
     · 소감 창 · 대원들의 소감 · 뒤집힘(밤판 → 축제판) · 황금사과 알림
   ⭐ 서버(eg_mission_*)가 대원이 볼 수 있는 만큼만 내려준다 — 단서 · 물음은 이 파일에 없다.
   ⭐ 결정문 — 1101 진행방식 · 1101 목록 · 1110 미션카드33 · 1111(하루 최대 두 곳 · 아코디언 · 축제판)
   ⚠ 쓰는 쪽은 페이지의 전역 supa(supabase 클라이언트)를 빌린다. 없으면 조용히 쉰다.
   ⚠ 「12 / 33」 같은 분모는 어디에도 적지 않는다. 오늘 마친 수는 동그라미 둘로만.
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){
  if (window.egMission) return;
  const C = () => (typeof supa !== 'undefined' && supa) ? supa : (window.supa || null);
  const pad = n => String(n).padStart(2, '0');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const NUM = { 1:'한', 2:'두', 3:'세', 4:'네', 5:'다섯' };
  const GRAD = ['linear-gradient(165deg,#173a6b,#2f6fb3 55%,#102a4f)', 'linear-gradient(165deg,#6b1f1f,#c2452d 55%,#4a1414)',
                'linear-gradient(165deg,#14532d,#2f8f4e 55%,#0f3a20)', 'linear-gradient(165deg,#6b4a12,#d39a22 55%,#4a330c)',
                'linear-gradient(165deg,#3b1d5c,#7a4bb0 55%,#29143f)'];

  /* ── 모양 ─────────────────────────────────────────────────────────── */
  const CSS = `
  .egm, .egm *{ box-sizing:border-box; }
  .egm{ font-family:'Pretendard', -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; color:#1d1812; word-break:keep-all; }
  .egm-chip{ position:fixed; left:18px; bottom:58px; z-index:9400; display:none; align-items:center; gap:9px; padding:9px 15px 9px 12px;
    background:rgba(13,22,40,.92); color:#f4efe6; border:1px solid rgba(242,201,76,.6); border-radius:999px; cursor:pointer;
    box-shadow:0 8px 22px rgba(0,0,0,.35); font-size:14px; line-height:1.3; }
  .egm-chip.on{ display:flex; }
  .egm-chip i{ width:9px; height:9px; border-radius:50%; background:#f2c94c; box-shadow:0 0 0 4px rgba(242,201,76,.25); flex:none; }
  .egm-chip b{ font-family:'Noto Serif KR', serif; font-weight:600; }
  .egm-chip small{ color:rgba(244,239,230,.72); font-size:12px; }
  .egm-chip.reached{ background:#f2c94c; color:#1d1812; border-color:#1d1812; }
  .egm-chip.reached small{ color:#3a332b; }
  .egm-chip.reached i{ background:#1d1812; box-shadow:none; }
  .egm-toast{ position:fixed; left:50%; bottom:30px; transform:translate(-50%, 20px); opacity:0; pointer-events:none; z-index:9700;
    display:flex; align-items:center; gap:14px; padding:13px 16px 13px 20px; background:#f4efe6; border-radius:10px;
    box-shadow:0 14px 36px rgba(0,0,0,.4); transition:.3s ease; font-size:15px; line-height:1.5; max-width:calc(100% - 40px); }
  .egm-toast.on{ opacity:1; transform:translate(-50%, 0); pointer-events:auto; }
  .egm-toast b{ font-family:'Noto Serif KR', serif; }
  .egm-toast button{ flex:none; font:inherit; font-size:14px; font-weight:700; background:#f2c94c; color:#1d1812; border:none; border-radius:6px; padding:8px 14px; cursor:pointer; }
  .egm-toast button.x{ background:transparent; padding:6px 4px; color:#6b6052; font-weight:400; }
  .egm-veil{ position:fixed; inset:0; z-index:9500; background:rgba(8,10,16,.55); backdrop-filter:blur(3px); display:none; }
  .egm-veil.on{ display:block; }
  .egm-board{ position:fixed; z-index:9501; left:50%; top:50%; transform:translate(-50%,-48%) scale(.97); opacity:0; pointer-events:none;
    width:min(1080px, calc(100% - 40px)); max-height:calc(100% - 50px); overflow:auto; background:#f4efe6; border-radius:16px;
    padding:28px clamp(18px, 3vw, 38px) 24px; box-shadow:0 30px 80px rgba(0,0,0,.55); transition:.28s ease; }
  .egm-board.on{ opacity:1; transform:translate(-50%,-50%) scale(1); pointer-events:auto; }
  .egm-bx{ position:absolute; top:16px; right:16px; width:42px; height:42px; border-radius:50%; border:1px solid #cbbfac; background:transparent; cursor:pointer; font-size:18px; color:#3a332b; }
  .egm-bx:hover{ background:#1d1812; color:#f4efe6; }
  .egm-eyebrow{ font-size:12px; letter-spacing:.3em; color:#8a5f18; font-weight:700; }
  .egm-title{ font-family:'Noto Serif KR', serif; font-weight:600; font-size:26px; margin-top:6px; }
  .egm-who{ margin-top:4px; font-size:14px; color:#6b6052; }
  .egm-preview{ display:inline-block; margin-left:8px; padding:1px 8px; border-radius:999px; background:#1d1812; color:#f4efe6; font-size:11.5px; vertical-align:2px; }
  .egm-guide{ margin-top:18px; border:1px solid #cbbfac; border-radius:12px; background:#fbf8f2; }
  .egm-guide summary{ list-style:none; cursor:pointer; padding:14px 18px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .egm-guide summary::-webkit-details-marker{ display:none; }
  .egm-ghead{ font-family:'Noto Serif KR', serif; font-weight:600; font-size:17px; }
  .egm-ghead em{ font-style:normal; margin-left:8px; padding:2px 9px; border-radius:999px; background:#f2c94c; font-family:inherit; font-size:13px; font-weight:800; vertical-align:2px; }
  .egm-gfold{ font-size:13px; color:#6b6052; white-space:nowrap; }
  .egm-guide[open] .egm-gfold::after{ content:"접기 ▲"; }
  .egm-guide:not([open]) .egm-gfold::after{ content:"펼치기 ▼"; }
  .egm-gbody{ padding:2px 18px 16px; }
  .egm-steps{ list-style:none; display:grid; grid-template-columns:repeat(5, minmax(0,1fr)); gap:10px; counter-reset:s; margin:0; padding:0; }
  @media (max-width:900px){ .egm-steps{ grid-template-columns:1fr 1fr; } }
  .egm-steps li{ counter-increment:s; padding:12px 12px 13px; background:#fff; border:1px solid #cbbfac; border-radius:10px; font-size:13.5px; line-height:1.65; color:#3a332b; }
  .egm-steps li::before{ content:counter(s); display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; background:#1d1812; color:#f4efe6; font-size:12px; font-weight:700; margin-bottom:6px; }
  .egm-steps b{ display:block; font-family:'Noto Serif KR', serif; font-size:15px; color:#1d1812; margin-bottom:3px; }
  .egm-facts{ list-style:none; margin:12px 0 0; padding:0; display:flex; flex-wrap:wrap; gap:8px; }
  .egm-facts li{ padding:6px 12px; border-radius:999px; background:#ebe4d7; font-size:13.5px; color:#3a332b; }
  .egm-facts li b{ color:#1d1812; }
  .egm-facts li.key{ background:#f2c94c; color:#1d1812; font-weight:700; }
  .egm-status{ margin-top:14px; padding:12px 16px; background:#ebe4d7; border-radius:10px; font-size:15px; line-height:1.65; color:#3a332b; display:flex; gap:10px; align-items:center; }
  .egm-status b{ color:#1d1812; }
  .egm-today{ flex:none; display:flex; gap:5px; }
  .egm-today i{ width:14px; height:14px; border-radius:50%; border:2px solid #1d1812; }
  .egm-today i.done{ background:#1d1812; }
  .egm-empty{ margin-top:22px; padding:40px 20px; text-align:center; font-size:16px; line-height:1.8; color:#3a332b; background:#fbf8f2; border-radius:12px; }
  .egm-car{ position:relative; height:560px; margin-top:16px; overflow:hidden; }
  .egm-slot{ position:absolute; top:14px; left:50%; width:380px; height:520px; margin-left:-190px;
    transition:transform .5s cubic-bezier(.3,.1,.2,1), opacity .5s ease, filter .5s ease; will-change:transform; }
  .egm-slot.side{ cursor:pointer; }
  .egm-slot.side .egm-card *{ pointer-events:none; }
  .egm-slot.side:hover{ opacity:.8 !important; }
  .egm-slot.away{ pointer-events:none; }
  .egm-nav{ position:absolute; top:50%; z-index:30; transform:translateY(-50%); width:46px; height:46px; border-radius:50%; border:1px solid #cbbfac;
    background:#fbf8f2; cursor:pointer; font-size:22px; color:#1d1812; box-shadow:0 6px 18px rgba(0,0,0,.18); }
  .egm-nav:hover{ background:#1d1812; color:#f4efe6; }
  .egm-nav.l{ left:calc(50% - 250px); } .egm-nav.r{ right:calc(50% - 250px); }
  .egm-chint{ text-align:center; font-size:13px; color:#6b6052; margin-top:2px; }
  .egm-next{ margin-top:20px; padding-top:16px; border-top:1px solid #cbbfac; font-size:14.5px; line-height:1.75; color:#3a332b; text-align:center; }
  .egm-next b{ color:#1d1812; }
  .egm-card{ position:absolute; inset:0; perspective:1400px; }
  .egm-face{ position:absolute; inset:0; border-radius:14px; overflow:hidden; backface-visibility:hidden; -webkit-backface-visibility:hidden;
    transition:transform .7s cubic-bezier(.3,.1,.2,1); display:flex; flex-direction:column; padding:18px 18px 16px; }
  .egm-face.back{ background:linear-gradient(170deg, #17223a, #0d1628 60%, #0a101e); color:#f4efe6; }
  .egm-face.front{ transform:rotateY(180deg); color:#f4efe6; background:#0d1117; }
  .egm-card.flipped .egm-face.back{ transform:rotateY(-180deg); }
  .egm-card.flipped .egm-face.front{ transform:rotateY(0deg); }
  .egm-art{ position:absolute; left:0; right:0; top:12%; bottom:-4%; background-position:center top; background-size:cover; background-repeat:no-repeat; }
  .egm-face.back .egm-art{ filter:brightness(.82); }
  .egm-face.back .egm-art.grad{ opacity:.55; }
  .egm-shade{ position:absolute; inset:0; background:linear-gradient(180deg, rgba(13,22,40,1) 0%, rgba(13,22,40,.95) 14%, rgba(13,22,40,.1) 32%, rgba(8,12,20,.2) 48%, rgba(8,12,20,.85) 74%, rgba(8,12,20,.96) 100%); }
  .egm-face > *:not(.egm-art):not(.egm-shade){ position:relative; z-index:1; }
  .egm-no{ font-family:'Noto Serif KR', serif; font-size:13px; letter-spacing:.24em; color:#f2c94c; }
  .egm-ttl{ margin-top:4px; font-family:'Noto Serif KR', serif; font-weight:600; font-size:28px; line-height:1.3; }
  .egm-knd{ margin-top:4px; font-size:12.5px; color:rgba(244,239,230,.68); letter-spacing:.04em; }
  .egm-frt{ margin-top:auto; font-family:'Noto Serif KR', serif; font-size:19px; line-height:1.65; color:#fff; text-shadow:0 1px 10px rgba(0,0,0,.7); }
  .egm-btn{ margin-top:14px; width:100%; height:48px; border:none; border-radius:9px; background:#f2c94c; color:#1d1812; font-family:inherit; font-weight:700; font-size:16px; cursor:pointer; }
  .egm-btn:hover{ background:#e0b432; }
  .egm-btn.line{ background:transparent; color:#f4efe6; border:1px solid rgba(244,239,230,.5); font-weight:600; }
  .egm-btn.line:hover{ background:rgba(244,239,230,.12); }
  .egm-btn:disabled{ opacity:.4; cursor:default; }
  .egm-why{ margin-top:8px; font-size:13px; line-height:1.55; color:rgba(244,239,230,.8); text-align:center; }
  .egm-card.open .egm-face.back{ outline:2px solid #f2c94c; outline-offset:-2px; }
  .egm-tag{ align-self:flex-start; margin-top:10px; padding:3px 10px; border-radius:999px; background:#f2c94c; color:#1d1812; font-size:12px; font-weight:800; }
  .egm-clue{ margin-top:auto; font-size:15.5px; line-height:1.75; color:#f4efe6; background:rgba(13,22,40,.55); border:1px solid rgba(244,239,230,.25); border-radius:10px; padding:13px 15px; }
  .egm-clue b{ color:#f2c94c; font-weight:700; display:block; font-size:12px; letter-spacing:.12em; margin-bottom:4px; }
  .egm-note{ margin-top:auto; font-size:15px; line-height:1.7; color:#fff; background:rgba(242,201,76,.16); border:1px solid rgba(242,201,76,.5); border-radius:10px; padding:13px 15px; }
  .egm-mine{ margin-top:auto; font-family:'Noto Serif KR', serif; font-size:16px; line-height:1.7; display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; }
  .egm-cday{ margin-top:8px; font-size:12.5px; }
  .egm-brow{ display:flex; gap:8px; margin-top:12px; }
  .egm-brow .egm-btn{ margin-top:0; height:42px; font-size:14px; }
  .egm-face.front.day{ background:#fbf3e6; color:#1d1812; }
  .egm-face.front.day .egm-art{ top:0; bottom:0; }
  .egm-face.front.day .egm-shade{ background:linear-gradient(180deg, rgba(251,246,236,0) 0%, rgba(251,246,236,0) 58%, rgba(251,246,236,.9) 72%, rgba(251,246,236,.97) 100%); }
  .egm-face.front .egm-no{ text-shadow:0 1px 6px rgba(0,0,0,.35); }
  .egm-face.front.day .egm-ttl{ color:#fff; text-shadow:0 2px 12px rgba(0,0,0,.55); }
  .egm-face.front.day .egm-knd{ color:rgba(255,255,255,.9); text-shadow:0 1px 8px rgba(0,0,0,.5); }
  .egm-face.front.day .egm-mine{ color:#2a2219; }
  .egm-face.front.day .egm-cday{ color:#6b5a44; }
  .egm-face.front.day .egm-btn.line{ color:#1d1812; border-color:rgba(29,24,18,.4); background:rgba(255,255,255,.55); }
  .egm-face.front.day .egm-btn.line:hover{ background:#1d1812; color:#f4efe6; }
  .egm-mveil{ position:fixed; inset:0; z-index:9600; background:rgba(8,10,16,.45); display:none; }
  .egm-mveil.on{ display:block; }
  .egm-modal{ position:fixed; z-index:9601; left:50%; top:50%; transform:translate(-50%,-50%); width:min(640px, calc(100% - 32px)); max-height:calc(100% - 50px); overflow:auto;
    background:#fbf8f2; border-radius:14px; padding:28px 26px 22px; box-shadow:0 30px 80px rgba(0,0,0,.6); display:none; }
  .egm-modal.on{ display:block; }
  .egm-mq{ margin-top:16px; padding:14px 16px; border-left:3px solid #e0b432; background:#f4efe6; border-radius:0 8px 8px 0; font-family:'Noto Serif KR', serif; font-size:18px; line-height:1.6; }
  .egm-mhow{ margin-top:12px; font-size:14px; line-height:1.75; color:#3a332b; }
  .egm-mhow b{ color:#1d1812; }
  .egm-ta{ margin-top:12px; width:100%; min-height:210px; resize:vertical; padding:14px; border:1px solid #cbbfac; border-radius:8px; background:#fff; font-family:inherit; font-size:16px; line-height:1.75; color:#1d1812; }
  .egm-ta:focus{ outline:none; border-color:#1d1812; box-shadow:0 0 0 3px rgba(242,201,76,.55); }
  .egm-hint{ margin-top:6px; font-size:13px; color:#6b6052; min-height:18px; }
  .egm-consent{ margin-top:12px; display:flex; gap:10px; align-items:flex-start; padding:12px 14px; background:#f4efe6; border-radius:8px; cursor:pointer; }
  .egm-consent input{ margin-top:4px; width:18px; height:18px; accent-color:#1d1812; flex:none; }
  .egm-consent span{ font-size:14.5px; line-height:1.6; color:#1d1812; }
  .egm-consent small{ display:block; font-size:13px; color:#6b6052; }
  .egm-mrow{ display:flex; gap:10px; margin-top:16px; }
  .egm-mbtn{ flex:1; height:50px; border:none; border-radius:8px; background:#f2c94c; color:#1d1812; font-family:inherit; font-size:16px; font-weight:700; cursor:pointer; }
  .egm-mbtn:disabled{ opacity:.4; cursor:default; }
  .egm-mbtn.line{ flex:0 0 auto; padding:0 20px; background:transparent; border:1px solid #1d1812; font-weight:600; }
  .egm-mafter{ margin-top:10px; font-size:13px; color:#6b6052; text-align:center; }
  .egm-merr{ margin-top:8px; font-size:14px; color:#a8441c; }
  .egm-vtabs{ display:flex; gap:6px; margin-top:14px; }
  .egm-vtabs button{ font:inherit; font-size:13px; padding:5px 12px; border-radius:999px; border:1px solid #cbbfac; background:transparent; cursor:pointer; }
  .egm-vtabs button.on{ background:#1d1812; color:#f4efe6; border-color:#1d1812; }
  .egm-vitem{ margin-top:14px; padding:14px 16px; background:#fff; border:1px solid #cbbfac; border-radius:10px; }
  .egm-vitem.me{ background:#f6e9b8; border-color:#e3cf8a; }
  .egm-vwho{ font-size:13px; color:#6b6052; }
  .egm-vwho b{ color:#1d1812; }
  .egm-vbody{ margin-top:6px; font-size:15px; line-height:1.75; white-space:pre-wrap; }
  .egm-vnone{ margin-top:14px; font-size:15px; color:#6b6052; line-height:1.7; }
  `;

  const GUIDE = `
    <details class="egm-guide" id="egm-guide">
      <summary><span class="egm-ghead">미션은 이렇게 합니다 <em>하루에 최대 두 곳까지 탐험할 수 있습니다</em></span><span class="egm-gfold"></span></summary>
      <div class="egm-gbody">
        <ol class="egm-steps">
          <li><b>카드 고르기</b>열린 카드 가운데 마음이 가는 한 장을 골라 [미션 시작]을 누릅니다. 번호 순서는 상관없습니다.</li>
          <li><b>단서 따라가기</b>카드에 단서가 열립니다. 판을 접고 단서대로 타륜 메뉴를 따라가세요. 진행 중인 미션은 화면 왼쪽 아래에 늘 떠 있습니다.</li>
          <li><b>그 자리에 닿기</b>맞는 곳에 닿으면 화면에 「찾았습니다」가 뜨고, 그때 물음 하나가 열립니다. 정답을 맞히는 물음이 아니라 당신에게로 돌아오는 물음입니다.</li>
          <li><b>소감 남기기</b>물음을 곁에 두고 떠오르는 대로 200자 이상 적습니다. 200자는 문턱일 뿐 길이 제한은 없습니다. 잘 쓰려 애쓰지 않으셔도 됩니다.</li>
          <li><b>카드가 뒤집힘</b>저장하면 카드가 뒤집히고 황금사과 한 알이 도착합니다. 같은 카드를 먼저 마친 대원들의 소감도 이때 열립니다.</li>
        </ol>
        <ul class="egm-facts">
          <li class="key">하루 최대 두 곳(두 장)</li>
          <li>한 번에 한 장씩 — 진행 중인 카드를 소감까지 마치면 다음 카드를 고를 수 있습니다</li>
          <li>못 마친 카드는 <b>다음 날에도 그대로</b> 열려 있습니다</li>
          <li>미션 하나를 마칠 때마다 <b>황금사과 1알</b></li>
          <li>처음 펼친 날 합류 선물 <b>황금사과 15알</b> (그림 들이기 · 컴퍼니 합류에 쓰입니다)</li>
          <li>소감은 [내 소감]에서 <b>언제든 고쳐 쓸 수</b> 있습니다</li>
          <li>홈페이지 인용은 <b>직접 체크한 소감만</b></li>
        </ul>
      </div>
    </details>`;

  let root, B = null, SEL = 0, CUR = null, NEWEST = false, toastTimer = null, BUSY = false;
  const $ = id => document.getElementById(id);
  const store = { get:(k)=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } },
                  set:(k,v)=>{ try{ localStorage.setItem(k, v); }catch(e){} } };

  function mount(){
    if (root) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement('div'); root.className = 'egm';
    root.innerHTML = `
      <div class="egm-chip" id="egm-chip" role="button" tabindex="0"><i></i><span><small id="egm-chip-s">진행 중</small> <b id="egm-chip-t">—</b></span></div>
      <div class="egm-veil" id="egm-veil"></div>
      <section class="egm-board" id="egm-board" aria-label="미션 카드" role="dialog">
        <button class="egm-bx" type="button" id="egm-bx" aria-label="접기">✕</button>
        <div class="egm-eyebrow">EG탐험대</div>
        <h2 class="egm-title">미션 카드</h2>
        <div class="egm-who" id="egm-who">—</div>
        ${GUIDE}
        <div class="egm-status" id="egm-status"></div>
        <div id="egm-stage"></div>
        <div class="egm-next" id="egm-next"></div>
      </section>
      <div class="egm-mveil" id="egm-mveil"></div>
      <div class="egm-modal" id="egm-essay" role="dialog" aria-modal="true">
        <div class="egm-eyebrow" id="egm-m-no">—</div>
        <div class="egm-title" id="egm-m-title" style="font-size:22px">—</div>
        <div class="egm-mq" id="egm-m-q">—</div>
        <p class="egm-mhow"><b>이렇게 쓰시면 됩니다</b> — 방금 본 것과 떠오른 생각, 기억 하나를 이어 적어도 좋고, 물음과 조금 멀어져도 괜찮습니다. 200자를 넘기면 [저장]이 켜집니다.</p>
        <textarea class="egm-ta" id="egm-m-ta" placeholder="떠오르는 대로 적어 주세요."></textarea>
        <div class="egm-hint" id="egm-m-hint">조금 더 적어 주세요</div>
        <label class="egm-consent"><input type="checkbox" id="egm-m-ok"><span>이 소감을 EG유니버스 홈페이지에 인용해도 좋습니다.<small>닉네임과 탐험대원 번호가 함께 실립니다. 언제든 [내 소감]에서 바꿀 수 있습니다.</small></span></label>
        <div class="egm-merr" id="egm-m-err" hidden></div>
        <div class="egm-mrow"><button class="egm-mbtn line" type="button" id="egm-m-later">나중에</button><button class="egm-mbtn" type="button" id="egm-m-save" disabled>저장</button></div>
        <p class="egm-mafter" id="egm-m-after">저장하면 카드가 뒤집히고 황금사과 한 알이 도착합니다. 쓰던 글은 [나중에]를 눌러도 남아 있습니다.</p>
      </div>
      <div class="egm-modal" id="egm-voices" role="dialog" aria-modal="true">
        <div class="egm-eyebrow" id="egm-v-no">—</div>
        <div class="egm-title" style="font-size:22px">대원들의 소감</div>
        <div class="egm-vtabs"><button type="button" id="egm-v-first">먼저 쓴 순서로</button><button type="button" id="egm-v-new">최신순으로 읽기</button></div>
        <div id="egm-v-list"></div>
        <div class="egm-mrow"><button class="egm-mbtn line" type="button" id="egm-v-close" style="flex:1">닫기</button></div>
      </div>
      <div class="egm-toast" id="egm-toast"><span id="egm-toast-t">—</span><button type="button" id="egm-toast-b">확인</button><button type="button" class="x" id="egm-toast-x" aria-label="닫기">✕</button></div>`;
    document.body.appendChild(root);
    $('egm-chip').addEventListener('click', () => { const o = window.__egmOpen; if (o && o.reached) openEssayFor(o.no); else openBoard(); });
    $('egm-veil').addEventListener('click', closeBoard);
    $('egm-bx').addEventListener('click', closeBoard);
    $('egm-m-ta').addEventListener('input', hint);
    $('egm-m-save').addEventListener('click', () => saveEssay(true));
    $('egm-m-later').addEventListener('click', () => saveEssay(false));
    $('egm-v-first').addEventListener('click', () => loadVoices(false));
    $('egm-v-new').addEventListener('click', () => loadVoices(true));
    $('egm-v-close').addEventListener('click', closeModal);
    $('egm-mveil').addEventListener('click', () => { if ($('egm-voices').classList.contains('on')) closeModal(); });
    $('egm-toast-x').addEventListener('click', hideToast);
    const g = $('egm-guide');
    g.open = store.get('egm_guide_folded') !== '1';
    g.addEventListener('toggle', () => store.set('egm_guide_folded', g.open ? '0' : '1'));
    document.addEventListener('keydown', e => {
      if (!$('egm-board').classList.contains('on') || document.querySelector('.egm-modal.on')) return;
      if (e.key === 'ArrowLeft'){ step(-1); e.preventDefault(); }
      else if (e.key === 'ArrowRight'){ step(1); e.preventDefault(); }
      else if (e.key === 'Escape') closeBoard();
    });
  }

  /* ── 아래쪽 한 줄 ── */
  function toast(html, btn, fn, ms){
    mount();
    $('egm-toast-t').innerHTML = html;
    const b = $('egm-toast-b');
    if (btn){ b.hidden = false; b.textContent = btn; b.onclick = () => { hideToast(); if (fn) fn(); }; } else b.hidden = true;
    $('egm-toast').classList.add('on'); clearTimeout(toastTimer);
    if (ms) toastTimer = setTimeout(hideToast, ms);
  }
  function hideToast(){ if ($('egm-toast')) $('egm-toast').classList.remove('on'); }

  /* ── 진행 중 표 · 배낭 카드 ── */
  async function refresh(){
    const c = C(); if (!c) return null;
    let d = null;
    try{ const r = await c.rpc('eg_mission_now'); d = r && r.data; }catch(e){ return null; }
    window.__egmNow = d;
    mount();
    const o = d && d.ok ? d.open : null;
    window.__egmOpen = o;
    const chip = $('egm-chip');
    chip.classList.toggle('on', !!o && !$('egm-board').classList.contains('on'));
    chip.classList.toggle('reached', !!(o && o.reached));
    if (o){
      $('egm-chip-s').textContent = o.reached ? '닿았습니다 · 소감 쓰기' : '진행 중';
      $('egm-chip-t').textContent = pad(o.no) + ' ' + o.title;
    }
    paintDock(d);
    return d;
  }
  function nextText(n){
    if (!n) return '';
    if (n.title) return '마지막 카드 「' + n.title + '」은 ' + n.date_text + '에 열립니다.';
    return '다음 미션 카드 ' + (NUM[n.count] || n.count) + ' 장은 ' + n.date_text + '에 열립니다.';
  }
  function paintDock(d){
    const card = document.getElementById('dockMission'); if (!card) return;
    if (!d || !d.ok){ card.hidden = true; return; }
    card.hidden = false;
    const sub = document.getElementById('dockMissionSub'), main = document.getElementById('dockMissionMain');
    const o = d.open;
    let s;
    if (d.wait_text) s = d.wait_text + ' 출항하는 날 첫 카드가 열립니다';
    else if (o) s = (o.reached ? '닿았습니다 · 소감 쓰기 · ' : '진행 중 · ') + pad(o.no) + ' ' + o.title;
    else if ((d.done_today || 0) >= (d.daily_max || 2)) s = '오늘 두 곳 탐험 · ' + nextText(d.next).replace('에 열립니다.', '');
    else s = '하루 최대 두 곳' + (d.next ? ' · 다음 ' + (NUM[d.next.count] || d.next.count) + ' 장 ' + d.next.date_text : '');
    sub.textContent = s;
    const fresh = d.batch && Number(store.get('egm_seen_batch') || 0) < d.batch;
    main.parentElement.querySelectorAll('.pol-new').forEach(x => x.remove());
    if (fresh){ const b = document.createElement('span'); b.className = 'pol-new'; b.textContent = 'NEW'; main.parentElement.appendChild(b); }
    return fresh;
  }

  /* ── 카드판 ── */
  async function openBoard(){
    mount(); hideToast();
    const c = C(); if (!c) return;
    const { data, error } = await c.rpc('eg_mission_board');
    if (error || !data){ toast('카드판을 여는 데 잠시 문제가 생겼습니다. 다시 눌러 주세요.', null, null, 4000); return; }
    if (!data.ok){ toast(data.why === 'not_crew' ? '미션 카드는 탐험대원만 펼칠 수 있습니다.' : '로그인한 뒤에 펼칠 수 있습니다.', null, null, 4000); return; }
    B = data;
    const open = B.cards.findIndex(x => x.state === 'open' || x.state === 'reached');
    if (open >= 0) SEL = open; else if (SEL >= B.cards.length) SEL = 0;
    paintBoard();
    $('egm-veil').classList.add('on'); $('egm-board').classList.add('on'); $('egm-chip').classList.remove('on');
    if (B.cards.length){ const mx = Math.max.apply(null, B.cards.map(x => x.batch)); store.set('egm_seen_batch', String(mx)); }
    refresh();
    if (B.gift) setTimeout(() => toast('🍎 탐험대 합류 선물로 <b>황금사과 15알</b>이 도착했습니다.', '확인', null, 6000), 450);
  }
  function closeBoard(){
    $('egm-veil').classList.remove('on'); $('egm-board').classList.remove('on');
    refresh();
  }

  function statusHtml(){
    const done = B.done_today || 0, max = B.daily_max || 2;
    const dots = '<span class="egm-today" title="오늘 마친 미션">' + Array.from({ length:max }, (_, i) => '<i' + (i < done ? ' class="done"' : '') + '></i>').join('') + '</span>';
    let t;
    const o = B.cards.find(x => x.state === 'open' || x.state === 'reached');
    if (B.wait_text) t = '<b>' + esc(B.wait_text) + '</b> 출항하는 날 첫 미션 카드가 열립니다. 그때까지는 짐을 풀며 EG유니버스를 둘러보세요.';
    else if (o) t = o.state === 'reached'
      ? '<b>' + pad(o.no) + ' ' + esc(o.title) + '</b>에 닿았습니다. 카드의 [소감 쓰기]로 소감을 남기시면 카드가 뒤집힙니다.'
      : '<b>' + pad(o.no) + ' ' + esc(o.title) + '</b>을 찾아가는 중입니다. 판을 접고 단서를 따라가 보세요.';
    else if (done >= max) t = '<b>오늘은 두 곳을 탐험하셨습니다.</b> 내일 다시 새 카드를 고르실 수 있습니다.';
    else if (done === 1) t = '오늘 <b>한 곳을 더</b> 탐험하실 수 있습니다.';
    else t = '오늘 <b>두 곳까지</b> 탐험하실 수 있습니다. 마음이 가는 카드를 골라 [미션 시작]을 누르세요.';
    return dots + '<span>' + t + '</span>';
  }
  function artDiv(c, which){
    const p = which === 'd' ? (c.art_d || c.art_n) : c.art_n;
    if (p) return '<div class="egm-art" style="background-image:url(\'' + esc(p) + '?v=1111\')"></div>';
    return '<div class="egm-art grad" style="background:' + GRAD[(c.no - 1) % GRAD.length] + '"></div>';
  }
  function cardHtml(c){
    const anyOpen = B.cards.some(x => x.state === 'open' || x.state === 'reached');
    const full = (B.done_today || 0) >= (B.daily_max || 2);
    let back = '<div class="egm-face back">' + artDiv(c, 'n') + '<div class="egm-shade"></div>'
      + '<span class="egm-no">' + pad(c.no) + '</span><span class="egm-ttl">' + esc(c.title) + '</span><span class="egm-knd">' + esc(c.kind || '') + '</span>';
    if (c.state === 'fog'){
      let why = '';
      if (c.gate) why = esc(c.gate.msg);
      else if (anyOpen) why = '진행 중인 카드를 소감까지 마치시면 시작할 수 있습니다.';
      else if (full) why = '오늘은 두 곳을 탐험하셨습니다. 내일 시작할 수 있습니다.';
      back += '<span class="egm-frt">' + esc(c.front) + '</span>'
        + '<button class="egm-btn" type="button" data-act="start" data-no="' + c.no + '"' + (why ? ' disabled' : '') + '>미션 시작</button>'
        + (why ? '<div class="egm-why">' + why + '</div>' : '')
        + (c.gate && c.gate.link ? '<button class="egm-btn line" type="button" data-act="link" data-href="' + esc(c.gate.link) + '">' + esc(c.gate.link_label || '가기') + '</button>' : '');
    } else if (c.state === 'open'){
      back += '<span class="egm-tag">진행 중</span><div class="egm-clue"><b>단서</b>' + esc(c.clue) + '</div>'
        + '<button class="egm-btn line" type="button" data-act="close">판을 접고 길 떠나기</button>';
    } else if (c.state === 'reached'){
      back += '<span class="egm-tag">닿았습니다</span>'
        + (c.reach_note ? '<div class="egm-note">' + esc(c.reach_note) + '</div>' : '<div class="egm-note">' + esc(c.reach_text || '찾았습니다') + ' · 물음 하나가 열렸습니다.</div>')
        + '<button class="egm-btn" type="button" data-act="essay" data-no="' + c.no + '">소감 쓰기</button>';
    }
    back += '</div>';
    let front = '';
    if (c.state === 'cleared'){
      const day = !!(c.art_d);
      front = '<div class="egm-face front' + (day ? ' day' : '') + '">' + artDiv(c, 'd') + '<div class="egm-shade"></div>'
        + '<span class="egm-no">' + pad(c.no) + '</span><span class="egm-ttl">' + esc(c.title) + '</span><span class="egm-knd">' + esc(c.kind || '') + '</span>'
        + '<span class="egm-mine">' + esc(c.essay || '') + '</span><span class="egm-cday">' + esc(c.cleared_text || '') + ' 클리어</span>'
        + '<div class="egm-brow"><button class="egm-btn line" type="button" data-act="essay" data-no="' + c.no + '">내 소감</button>'
        + '<button class="egm-btn line" type="button" data-act="voices" data-no="' + c.no + '">대원들의 소감' + (c.voices_n ? ' ' + c.voices_n : '') + '</button></div></div>';
    }
    return '<div class="egm-card' + (c.state === 'cleared' ? ' flipped' : '') + (c.state === 'open' || c.state === 'reached' ? ' open' : '') + '" id="egm-card-' + c.no + '">' + back + front + '</div>';
  }
  function paintBoard(){
    $('egm-who').innerHTML = '탐험대원 No.' + String(B.crew.no).padStart(3, '0') + ' · ' + esc(B.crew.voyage_name)
      + (B.preview ? '<span class="egm-preview">시험 중 · 이 계정에만 미리 열림</span>' : '');
    $('egm-status').innerHTML = statusHtml();
    const stage = $('egm-stage');
    if (!B.cards.length){
      stage.innerHTML = '<div class="egm-empty">' + (B.wait_text ? esc(B.wait_text) + ' 출항하는 날, 첫 미션 카드가 이 자리에 펼쳐집니다.' : '아직 열린 카드가 없습니다.') + '</div>';
    } else {
      stage.innerHTML = '<div class="egm-car"><button class="egm-nav l" type="button" data-act="prev" aria-label="이전 카드">‹</button><div id="egm-slots">'
        + B.cards.map(c => '<div class="egm-slot">' + cardHtml(c) + '</div>').join('')
        + '</div><button class="egm-nav r" type="button" data-act="next" aria-label="다음 카드">›</button></div>'
        + (B.cards.length > 1 ? '<div class="egm-chint">양옆 카드를 누르거나 ‹ › 로 넘기면 가운데로 옵니다. 키보드 ← → 도 됩니다.</div>' : '');
      stage.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', onAct));
      place();
    }
    const n = B.next;
    $('egm-next').innerHTML = n ? (nextText(n).replace(n.date_text, '<b>' + esc(n.date_text) + '</b>')
      + (String(n.date) <= '2026-12-14' ? '<br>미션 카드는 12월 14일까지 5일마다 다섯 장씩 새로 열립니다.' : '')) : '이제 모든 카드가 열렸습니다.';
  }
  function place(){
    const slots = document.querySelectorAll('#egm-slots .egm-slot'); const n = slots.length;
    slots.forEach((el, i) => {
      let d = i - SEL; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
      if (n === 2 && d === -1 && SEL === 0) d = 1;
      const a = Math.abs(d), sc = a === 0 ? 1 : (a === 1 ? .8 : .64);
      el.style.transform = 'translateX(' + (d * 64) + '%) scale(' + sc + ')';
      el.style.opacity = a === 0 ? 1 : (a === 1 ? .5 : (a === 2 ? .2 : 0));
      el.style.filter = a === 0 ? 'none' : 'saturate(.55)';
      el.style.zIndex = 10 - a;
      el.classList.toggle('side', a === 1 || a === 2);
      el.classList.toggle('away', a > 2);
      el.onclick = a === 0 ? null : () => { SEL = i; place(); };
    });
  }
  function step(d){ if (!B || !B.cards.length) return; SEL = (SEL + d + B.cards.length) % B.cards.length; place(); }

  async function onAct(e){
    e.stopPropagation();
    const b = e.currentTarget, act = b.dataset.act, no = Number(b.dataset.no);
    if (act === 'prev') return step(-1);
    if (act === 'next') return step(1);
    if (act === 'close') return closeBoard();
    if (act === 'link'){ location.href = b.dataset.href; return; }
    if (act === 'essay') return openEssayFor(no);
    if (act === 'voices') return openVoices(no);
    if (act === 'start'){
      if (BUSY) return; BUSY = true; b.disabled = true;
      try{
        const { data } = await C().rpc('eg_mission_start', { p_no: no });
        if (!data || !data.ok){ toast(esc((data && data.msg) || '미션을 시작하지 못했습니다. 잠시 뒤에 다시 눌러 주세요.'), null, null, 5000); b.disabled = false; return; }
        await openBoard();
        if (!data.reached) toast('미션을 시작했습니다. <b>단서</b>를 읽고 판을 접은 뒤 길을 떠나 보세요.', null, null, 5000);
      } finally { BUSY = false; }
    }
  }

  /* ── 소감 ── */
  async function openEssayFor(no){
    mount();
    let c = B && B.cards.find(x => x.no === no && x.question);
    if (!c){
      const { data } = await C().rpc('eg_mission_check', { p_no: no });
      if (data && data.reached) c = { no:data.no, title:data.title, kind:data.kind, question:data.question, min_chars:data.min_chars, essay:data.essay, voices_ok:data.voices_ok, state:'reached' };
      else { const r = await C().rpc('eg_mission_board'); B = r.data; c = B && B.cards && B.cards.find(x => x.no === no); }
    }
    if (!c || !c.question){ toast('아직 소감을 쓸 차례가 아닙니다. 단서를 따라 그 자리에 먼저 닿아 주세요.', null, null, 5000); return; }
    CUR = c; hideToast();
    $('egm-m-no').textContent = pad(c.no) + ' · ' + (c.kind || '');
    $('egm-m-title').textContent = c.title;
    $('egm-m-q').textContent = c.question;
    $('egm-m-ta').value = c.essay || '';
    $('egm-m-ok').checked = !!c.voices_ok;
    $('egm-m-err').hidden = true;
    const cleared = c.state === 'cleared';
    $('egm-m-save').textContent = cleared ? '고쳐 저장' : '저장';
    $('egm-m-after').textContent = cleared ? '고쳐 써도 클리어한 날은 그대로입니다.'
      : '저장하면 카드가 뒤집히고 황금사과 한 알이 도착합니다. 쓰던 글은 [나중에]를 눌러도 남아 있습니다.';
    hint();
    $('egm-mveil').classList.add('on'); $('egm-essay').classList.add('on');
    setTimeout(() => $('egm-m-ta').focus(), 60);
  }
  function hint(){
    const min = (CUR && CUR.min_chars) || 200;
    const n = $('egm-m-ta').value.replace(/\s+$/, '').length;
    $('egm-m-hint').textContent = n < min ? '조금 더 적어 주세요' : '';
    $('egm-m-save').disabled = n < min;
  }
  function closeModal(){ $('egm-mveil').classList.remove('on'); $('egm-essay').classList.remove('on'); $('egm-voices').classList.remove('on'); }
  async function saveEssay(final){
    if (!CUR) return;
    const text = $('egm-m-ta').value, ok = $('egm-m-ok').checked;
    if (!final){
      if (CUR.state !== 'cleared' && text.trim()) { try{ await C().rpc('eg_mission_save', { p_no: CUR.no, p_essay: text, p_voices: ok, p_final: false }); }catch(e){} }
      closeModal(); return;
    }
    $('egm-m-save').disabled = true;
    const { data } = await C().rpc('eg_mission_save', { p_no: CUR.no, p_essay: text, p_voices: ok, p_final: true });
    if (!data || !data.ok){ $('egm-m-err').textContent = (data && data.msg) || '저장하지 못했습니다. 잠시 뒤에 다시 눌러 주세요.'; $('egm-m-err').hidden = false; hint(); return; }
    const no = CUR.no, first = !!data.first;
    closeModal();
    await openBoard();
    if (first){
      SEL = Math.max(0, B.cards.findIndex(x => x.no === no)); place();
      const el = $('egm-card-' + no);
      if (el){ el.classList.remove('flipped'); void el.offsetWidth; requestAnimationFrame(() => el.classList.add('flipped')); }
      const done = B.done_today || 0, max = B.daily_max || 2;
      setTimeout(() => toast('🍎 <b>황금사과 한 알</b>이 도착했습니다.' + (done >= max ? ' 오늘은 두 곳을 탐험하셨습니다.' : ' 오늘 한 곳을 더 탐험하실 수 있습니다.'), '확인', null, 6000), 800);
    } else {
      toast('소감을 고쳐 저장했습니다.', null, null, 3000);
    }
  }

  /* ── 대원들의 소감 ── */
  function openVoices(no){
    const c = B && B.cards.find(x => x.no === no); if (!c) return;
    CUR = c;
    $('egm-v-no').textContent = pad(c.no) + ' · ' + c.title;
    $('egm-mveil').classList.add('on'); $('egm-voices').classList.add('on');
    loadVoices(store.get('egm_voices_newest') === '1');
  }
  async function loadVoices(newest){
    NEWEST = newest; store.set('egm_voices_newest', newest ? '1' : '0');
    $('egm-v-first').classList.toggle('on', !newest); $('egm-v-new').classList.toggle('on', newest);
    $('egm-v-list').innerHTML = '<div class="egm-vnone">불러오는 중…</div>';
    const { data } = await C().rpc('eg_mission_voices', { p_no: CUR.no, p_newest: newest });
    if (!data || !data.ok){ $('egm-v-list').innerHTML = '<div class="egm-vnone">' + esc((data && data.msg) || '잠시 문이 열리지 않았습니다.') + '</div>'; return; }
    const list = data.list || [];
    const others = list.filter(v => !v.mine).length;
    $('egm-v-list').innerHTML = (others ? '' : '<div class="egm-vnone">아직 이 카드를 마친 다른 대원이 없습니다. 당신이 이 카드의 첫 발자국입니다.</div>')
      + list.map(v => '<div class="egm-vitem' + (v.mine ? ' me' : '') + '"><div class="egm-vwho"><b>' + esc(v.nickname) + '</b>'
        + (v.crew_no ? ' · No.' + String(v.crew_no).padStart(3, '0') : '') + (v.mine ? ' · 내 소감' : '') + '</div><div class="egm-vbody">' + esc(v.essay) + '</div></div>').join('');
  }

  /* ── 그 자리에 닿았다 — 각 화면이 부르는 한 줄 ── */
  async function mark(kind, ref){
    const c = C(); if (!c) return;
    try{
      const { data } = await c.rpc('eg_mission_mark', { p_kind: kind, p_ref: ref || null });
      if (!data || !data.kept) return;
      const r = await c.rpc('eg_mission_check', { p_no: null });
      const d = r && r.data;
      if (d && d.reached && d.fresh){
        toast('<b>' + esc(d.reach_text || '찾았습니다') + '</b> · 물음 하나가 열렸습니다.', '소감 쓰기', () => openEssayFor(d.no), 0);
        refresh();
      }
    }catch(e){}
  }

  /* ── 처음 ── */
  async function init(opt){
    opt = opt || {};
    if (!C()) return;
    try{ const s = await C().auth.getSession(); if (!s || !s.data || !s.data.session) return; }catch(e){ return; }
    const d = await refresh();
    if (!d || !d.ok) return;
    if (opt.arrival && d.batch && !d.wait_text && Number(store.get('egm_seen_batch') || 0) < d.batch){
      setTimeout(() => toast('<b>미션 카드 ' + (NUM[d.batch_n] || d.batch_n) + ' 장</b>이 배낭에 들어왔습니다.', '펼쳐 보기', openBoard, 9000), 1800);
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  }

  window.egMission = { init, mark, openBoard, refresh, toast };
})();
