/* ══════════════════════════════════════════════════════════════════════
   EG베스페르 — 방(room) 판  ·  vesper_room.js  ·  v0818a
   2026.08.18 소로 × 파이스 · 142회차

   ⭐⭐ 왜 이 파일이 생겼나 — 「한 문서 · 한 root」
     옛 판: terra 가 액자(iframe)로 vesper.html 을 열었다. 액자는 **별도 문서**라
       WebGL 자원을 못 건네받는다. 그래서 지구가 한 벌 더 서고, 구글 실사 타일의
       root 요청이 **한 사람이 들어올 때마다 한 번 더** 나갔다.
     ⚠ 구글 과금 단위가 바로 그 root 요청이다. 개별 타일은 셈에 안 들어가고 문 여는
       값만 낸다. 그러니 액자 하나가 곧 청구서 두 배였다. 게다가 root 에는 하루
       10,000 이라는 기본 할당량이 있어, 규모가 커지면 비용 이전에 **지구가 멈추는**
       문제가 된다 (0818 소로 — 「1만~10만이면 월 비용차이가 엄청날 듯」).
     새 판: terra 의 viewer 를 그대로 받아 쓴다.
       root 추가 0 · Cesium 3MB 재수신 0 · WebGL 컨텍스트 한 벌.

   ⭐ 곁들여 낫는 것
     0817 의 C · ←→ 병. 액자가 없어지면 포커스를 뺏길 부모가 없다. 원인이 사라진다.
     그래도 grabFocus 를 그물로 남긴다 — 타자가 terra 쪽 입력칸으로 새는 길이 있다.

   ⚠ 이 파일이 지키는 규약 넷
     ① 이름 공간 — 전체가 IIFE 안이다. 밖으로 내놓는 것은 window.egVesper 하나뿐.
        terra 와 이 방은 tick · up · note · clamp · rpc · $ 같은 흔한 이름을 둘 다 쓴다.
        감싸지 않으면 나중에 온 쪽이 먼저 온 쪽을 말없이 덮어쓴다.
     ② viewer 를 새로 안 만든다. 하늘 설정도 다시 안 건다 —
        실측 결과 terra 와 한 줄도 안 달랐다 (skyAtmosphere · baseColor · fog ·
        enableLighting · dynamicAtmosphereLighting ×3 · 달 · OSM 0.55/0.65/0.8 ·
        SYSTEM_CLOCK). 다시 걸면 같은 값을 덮어쓸 뿐이고, 되돌릴 것만 생긴다.
     ③ enter 가 바꾼 것을 leave 가 되돌린다. 리스너는 EGV_on 이 전부 적어 둔다.
     ④ CSS 는 전량 #vesperRoom 으로 스코프했다. 실측상 terra 와 겹치던 것은
        .on 하나뿐이었고 그것도 스코프 안으로 들어갔다.

   ⚠ 캐시 꼬리표 — 이 파일을 고치면 부르는 쪽(terra.html)의 ?v= 도 함께 올린다.

   창구
     egVesper.enter(viewer)   방을 세우고 비행을 시작한다
     egVesper.leave()         비행을 세우고 카메라·화면을 terra 로 되돌린다
   ══════════════════════════════════════════════════════════════════════ */
(function(){

var ROOT = null;                 /* 방 뿌리 — 이 아래로만 산다 */
var STYLED = false;              /* 겉옷은 한 번만 입힌다 */
var LISTENERS = [];              /* EGV_on 이 적어 두는 곳 */
var CAM = null;                  /* terra 카메라를 적어 두는 곳 */

/* ── 리스너 장부 ─────────────────────────────────────────────
   ⚠ 옮겨온 몸통은 리스너를 익명 함수로 붙인다. 익명은 뗄 수가 없다.
     괄호를 한 짝도 건드리지 않고 떼는 유일한 길이 이 헬퍼다 —
     붙이면서 적어 두고, 나갈 때 적힌 대로 뗀다. */
function EGV_on(type, fn, opt){
  window.addEventListener(type, fn, opt);
  LISTENERS.push([type, fn, opt]);
}
function EGV_off(){
  LISTENERS.forEach(function(a){
    try{ window.removeEventListener(a[0], a[1], a[2]); }catch(e){}
  });
  LISTENERS.length = 0;
}

/* ── 포커스 그물 ─────────────────────────────────────────────
   0817 의 C · ←→ 병은 액자가 사라지면 원인이 없어진다. 그래도 남기는 까닭:
   ⚠ 같은 문서 안이라도 활성 요소가 terra 쪽 입력칸이면 타자가 그리로 샌다.
   ⭐ 마우스가 올라오기만 해도 조용히 되찾는다 — 누를 필요가 없다.
   ⚠ 일기를 쓰는 중이면 활성 요소가 방 안의 textarea 다. 그때는 안 뺏는다. */
function grabFocus(){
  try{
    if (!document.hasFocus()) window.focus();
    var a = document.activeElement;
    if (ROOT && a && a !== document.body && !ROOT.contains(a)) ROOT.focus();
  }catch(e){}
}

var CSS = `#vesperRoom{margin:0;height:100%;background:#05070f;overflow:hidden;
            font-family:"Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:#e8e4d8}
#vesperRoom .cesium-widget-credits{font-size:9px!important;opacity:.3}

/* ── 기내 판 — 결정문 9호: 폭은 화면을 채우고 위아래가 잘린다 ── *//* ⚠ 좌우를 바꾸면 카메라만 돌 게 아니라 기내 그림도 뒤집혀야 한다.
     안 그러면 오른쪽 창가에 앉아 왼쪽 창가 사진을 보게 된다 (0817 소로). */
#vesperRoom #plate{position:fixed;left:0;top:0;pointer-events:none;z-index:6;display:none;
         transform-origin:50% 50%}
#vesperRoom #plate.flip{transform:scaleX(-1)}

/* 좌석을 옮기는 사이의 암전 */
#vesperRoom #fade{position:fixed;inset:0;z-index:15;background:#05070f;opacity:0;
        pointer-events:none;transition:opacity .32s ease}
#vesperRoom #fade.on{opacity:1}
#vesperRoom #plate.on{display:block}
#vesperRoom #cabin{position:absolute;left:0;top:0;width:100%;height:100%;
         background:url(cabin_window_v1.webp) center/100% 100% no-repeat}
#vesperRoom .wing{position:absolute}

/* ⚠ 판을 scaleX(-1) 로 뒤집으면 날개의 EG 글자까지 거울상이 된다.
     안쪽에 한 겹을 더 두고 되뒤집어 글자만 바로 세운다 (0817 소로). */
#vesperRoom .wing i{position:absolute;inset:0;display:block;
          background:url(wing_blank_v1.webp) center/100% 100% no-repeat}

/* ⚠⚠ 판 scaleX(-1)이 위치·clip을 통째로 미러하므로 이미지는 절대 안 건드린다.
     되뒤집기를 얹었다가 두 번(0817) 부러졌다. 글자만 HTML 로 얹어 되세운다. *//* 자리·크기·기울기는 JS(LOGO)가 덮어쓴다 *//* ⭐ 창 덮개 — 기내 PNG 뒤에 두면 창 구멍 모양대로 잘린다.
     멀미나는 분, 글에만 집중하고 싶은 분을 위해 (0817 소로) */
#vesperRoom .shade{position:absolute;background:linear-gradient(#cdbfa8,#c3b49c 62%,#b6a68e);
         box-shadow:0 4px 12px rgba(0,0,0,.28) inset;
         transform:translateY(-101%);transition:transform .75s cubic-bezier(.35,.9,.3,1)}
#vesperRoom #plate.shut .shade{transform:translateY(0)}
#vesperRoom .shade::after{content:"";position:absolute;left:38%;right:38%;bottom:2.5%;height:2.5%;
                border-radius:99px;background:rgba(90,78,62,.5)}

/* 손잡이 — 그림에 이미 그려져 있는 그것 위에 얹는다 (실측 0817).
     따로 그리지 않는다. 손을 올리면 살짝 빛나고, 누르면 덮개가 내려온다. */
#vesperRoom #shadeBtn{position:fixed;z-index:11;pointer-events:auto;cursor:pointer;border-radius:99px;
            background:transparent;transition:background .2s,box-shadow .2s}
#vesperRoom #shadeBtn:hover{background:rgba(255,244,214,.13);
                  box-shadow:0 0 14px 3px rgba(255,244,214,.16)}
#vesperRoom #shadeBtn::after{content:attr(data-tip);position:absolute;left:50%;top:112%;
                   transform:translateX(-50%);white-space:nowrap;font-size:11px;
                   color:rgba(232,228,216,.0);transition:color .2s;pointer-events:none;
                   text-shadow:0 1px 5px rgba(0,0,0,.9)}
#vesperRoom #shadeBtn:hover::after{color:rgba(232,228,216,.78)}
#vesperRoom .wing b{position:absolute;font-family:Georgia,serif;font-weight:500;color:#f4f0e4;
          letter-spacing:.03em;pointer-events:none;white-space:nowrap;
          text-shadow:0 0 2px rgba(0,0,0,.3);transform-origin:50% 50%}
#vesperRoom #wingNear{clip-path:inset(0 56.8% 0 0)}
#vesperRoom #wingFar{clip-path:inset(0 0 0 56.6%)}

  @media (prefers-reduced-motion: no-preference){
    /* ⚠⚠ 0817 소로 — 「7초에 0.35%」로 넣어 두고 실제 픽셀을 안 쟀다.
       화면 2560에서 날개 높이가 823px 이므로 0.35% = 2.9px.
       7초에 걸쳐 3픽셀이면 눈에 안 잡힌다. 창밖 지형이 흐르고 있어 더 그렇다.
     ⭐ 그리고 진짜 날개는 한 마디로 안 움직인다 — 느린 큰 휨 위에 잔떨림이 얹힌다.
       두 겹이라 요소도 둘로 나눈다: .wing(휨) · .wing i(떨림). */
    @keyframes wflex {0%,100%{transform:translateY(0)}      50%{transform:translateY(-1.9%)}}
    @keyframes wshiver{0%,100%{transform:translateY(0)}
                       35%{transform:translateY(.22%)} 70%{transform:translateY(-.18%)}}#vesperRoom .wing{animation:wflex 6.5s ease-in-out infinite}
#vesperRoom .wing i{animation:wshiver 1.7s ease-in-out infinite}

  }
/* ⭐ 창밖은 무한히 멀어 고개를 들어도 안 움직인다. 움직이는 것은 창틀이다.
     그래서 기내 판만 위아래로 밀고 Cesium 캔버스는 그대로 둔다. */
#vesperRoom #plate{transition:none}

/* 모니터 홈 — 실측 left 66% top 36% w 33% h 14% (0817) *//* ⚠ 판 밖(fixed)에 둔다. 판 안에 두면 미러되어 계기판(fixed)과 좌표계가 갈린다 — 0817 */
#vesperRoom #homeBtn{position:fixed;z-index:11;transform-origin:50% 50%;
           pointer-events:auto;cursor:pointer;border-radius:8px;
           background:transparent;transition:background .2s,box-shadow .2s}

/* 창 덮개 손잡이·버튼 다섯과 같은 마감 — 테두리 대신 은은한 빛 (0817 소로) */
#vesperRoom #homeBtn:hover{background:rgba(255,244,214,.07);
                 box-shadow:0 0 22px 5px rgba(255,244,214,.10)}

/* 모니터 — 홈에 접혀 있다가 오른쪽 경첩으로 돌아 나온다 *//* ═══ EG베스페르 일기판 (0817 소로 시안 3번) ═══
     색은 열두 벌 팔레트에서 CSS 변수로 들어온다 — 규칙은 한 벌만 쓴다. */
#vesperRoom #mon{position:fixed;z-index:12;transform-origin:right center;
       transform:rotateY(-58deg) translateX(16%) scale(.58);opacity:0;
       pointer-events:none;transition:transform .62s cubic-bezier(.18,.85,.25,1),opacity .3s;
       background:var(--paper,#faf8f2);border-radius:18px;
       box-shadow:0 24px 80px rgba(0,0,0,.5);overflow:hidden;display:flex;flex-direction:column;
       font-family:'Noto Sans KR',system-ui,sans-serif}
#vesperRoom #mon.on{transform:rotateY(-5deg) translateX(0) scale(1);opacity:1;pointer-events:auto}

/* ⚠ 끌고 있는 동안은 되돌아오는 애니메이션을 끈다 — 손을 따라오지 못하면 미끄러진다 */
#vesperRoom #mon.drag{transition:opacity .3s}
#vesperRoom #monHead{display:flex;align-items:flex-start;gap:10px;padding:22px 28px 18px;
           border-bottom:1px solid var(--line,#e6dfd0);cursor:grab;user-select:none}
#vesperRoom #monHead.grabbing{cursor:grabbing}
#vesperRoom #mhName{display:flex;flex-direction:column;gap:3px;min-width:0}
#vesperRoom #mhEg{font:600 12px 'Noto Sans KR';letter-spacing:.14em;color:var(--accent,#8a6d3b);white-space:nowrap}
#vesperRoom #mhEg i{font:400 10.5px 'Noto Sans KR';letter-spacing:.08em;color:var(--faint,#b3aa99);font-style:normal}
#vesperRoom #mhSub{font:400 11.5px 'Noto Sans KR';color:var(--muted,#948b7a);white-space:nowrap}
#vesperRoom #dCount{font:600 15px 'Noto Sans KR';border-radius:999px;padding:4px 14px;white-space:nowrap;
          color:var(--badgeFg,#a3766c);background:var(--badgeBg,#f0e1da);transition:background .25s,color .25s}
#vesperRoom #monX{background:none;border:none;cursor:pointer;font:400 16px 'Noto Sans KR';
        color:var(--muted,#948b7a);padding:2px 4px;line-height:1}
#vesperRoom #monX:hover{color:var(--ink,#464036)}
#vesperRoom #monMain{flex:1;display:grid;grid-template-columns:56px 1fr;gap:0 16px;padding:24px 28px 0;
           min-height:0;position:relative}

/* 세로 딱지 — 지난 일기로 드는 문 (결정문 13호 · 판을 안 벗어난다) */
#vesperRoom #dPast{align-self:start;margin-top:6px;background:none;border:none;padding:0;cursor:pointer;text-align:left;
         font:600 11.5px/1.35 'Noto Sans KR';letter-spacing:.06em;color:var(--label,#5c7a5f);
         transition:opacity .2s}
#vesperRoom #dPast:hover{opacity:.65}
#vesperRoom #dPast small{display:block;font:400 10px 'Noto Sans KR';color:var(--faint,#b3aa99);margin-top:6px}
#vesperRoom #monCol{display:flex;flex-direction:column;min-width:0;min-height:0}
#vesperRoom #dHead{display:flex;align-items:baseline;gap:9px;padding:4px 0 10px;flex-wrap:wrap;
         border-bottom:1px solid var(--line,#e6dfd0)}
#vesperRoom #dDate{font:700 17px/1.4 'Noto Serif KR',Georgia,serif;color:var(--ink,#464036)}
#vesperRoom #dWho{font:400 12.5px 'Noto Sans KR';color:var(--muted,#948b7a)}
#vesperRoom #dToday{display:none;margin-left:auto;background:none;border:1px solid var(--line,#e6dfd0);
          border-radius:999px;padding:4px 12px;cursor:pointer;
          font:500 11.5px 'Noto Sans KR';color:var(--accent,#8a6d3b)}
#vesperRoom #dToday:hover{opacity:.75}
#vesperRoom #mon.viewing #dToday{display:inline-block}
#vesperRoom #mon.viewing #dTemp{display:none}

/* 지난 일기엔 임시 저장이 뜻이 없다 *//* ⭐ 유령판 — textarea 는 한 색뿐이라 첫 문장(또렷)과 힌트(흐림)를 함께 못 그린다.
     같은 조판으로 값을 투명 복제해 두고 그 끝에 힌트를 붙인다. 정확히 이어 붙는다. */
#vesperRoom #dWrap{position:relative;flex:1;min-height:120px;display:flex}
#vesperRoom #dGhost, #vesperRoom #dBody{font:400 15px/1.9 'Noto Serif KR',Georgia,serif;padding:14px 0 0;margin:0;border:0;
                 white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;
                 letter-spacing:normal;width:100%;box-sizing:border-box}
#vesperRoom #dGhost{position:absolute;inset:0;pointer-events:none;overflow:hidden;color:transparent}
#vesperRoom #gHint{color:var(--faint,#b3aa99)}
#vesperRoom #dBody{position:relative;background:transparent;resize:none;outline:none;overflow:auto;
         color:var(--ink,#464036);caret-color:var(--accent,#8a6d3b)}
#vesperRoom #dBody::-webkit-scrollbar{width:0}

/* 지난 일기 — 같은 판 안에서 옆으로 밀려 나온다 *//* ⚠ inset:0 이면 세로 딱지까지 덮어 돌아갈 문이 사라진다 (0817 소로 신고).
     딱지 칸 = 판 여백 28 + 딱지 56 + 사이 16 = 100px 만 비운다. */
#vesperRoom #dList{position:absolute;inset:0 0 0 100px;background:var(--paper,#faf8f2);padding:24px 28px 8px 0;
         overflow:auto;transform:translateX(-6%);opacity:0;pointer-events:none;
         transition:transform .34s cubic-bezier(.18,.85,.25,1),opacity .22s}
#vesperRoom #mon.past #dList{transform:translateX(0);opacity:1;pointer-events:auto}
#vesperRoom #dList h4{margin:0 0 12px;font:600 12px 'Noto Sans KR';letter-spacing:.1em;color:var(--accent,#8a6d3b)}
#vesperRoom .dItem{padding:11px 0;border-top:1px solid var(--line,#e6dfd0);cursor:pointer}
#vesperRoom .dItem:first-of-type{border-top:none}
#vesperRoom .dItem b{display:block;font:600 13px 'Noto Serif KR',Georgia,serif;color:var(--ink,#464036)}
#vesperRoom .dItem span{display:block;font:400 11.5px/1.6 'Noto Sans KR';color:var(--muted,#948b7a);margin-top:3px;
              overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#vesperRoom .dItem i{font-style:normal;color:var(--faint,#b3aa99)}
#vesperRoom #dList .empty{font:400 12px/1.9 'Noto Sans KR';color:var(--faint,#b3aa99)}
#vesperRoom #monFoot{display:flex;align-items:center;gap:10px;padding:14px 28px 22px;margin-top:18px;
           border-top:1px solid var(--line,#e6dfd0)}
#vesperRoom #dSun{font:500 12px 'Noto Sans KR';color:var(--accent,#8a6d3b);white-space:nowrap}
#vesperRoom #dAlt{font:400 12px 'Noto Sans KR';color:var(--faint,#b3aa99);white-space:nowrap}
#vesperRoom #monFoot .sp{flex:1}
#vesperRoom #dTemp, #vesperRoom #dSave{font-family:'Noto Sans KR';border-radius:999px;cursor:pointer;white-space:nowrap;
                transition:opacity .2s,transform .12s}
#vesperRoom #dTemp{font:500 13px 'Noto Sans KR';padding:8px 18px;color:var(--accent,#8a6d3b);
         background:transparent;border:1px solid var(--line,#e6dfd0)}
#vesperRoom #dSave{font:600 13px 'Noto Sans KR';padding:9px 22px;border:none;
         color:var(--paper,#faf8f2);background:var(--accent,#8a6d3b)}
#vesperRoom #dTemp:hover, #vesperRoom #dSave:hover{opacity:.82}
#vesperRoom #dTemp:active, #vesperRoom #dSave:active{transform:translateY(1px)}
#vesperRoom #dTemp:disabled, #vesperRoom #dSave:disabled{opacity:.4;cursor:default}
#vesperRoom #dNote{font:400 11.5px 'Noto Sans KR';color:var(--muted,#948b7a);white-space:nowrap}

/* 모니터 홈 위에 얹는 계기판 — 실측 rotateY −13° · 면 기울기 −6.3° (0817) */
#vesperRoom #homeInfo{position:fixed;z-index:11;pointer-events:none;
            transform:rotate(-6.3deg) perspective(700px) rotateY(-13deg);
            transform-origin:50% 50%;
            display:flex;flex-direction:column;justify-content:center;gap:5px;
            padding:0 4%;font-variant-numeric:tabular-nums;
            color:rgba(232,228,216,.82);text-shadow:0 1px 4px rgba(0,0,0,.95);display:none;
            overflow:hidden;box-sizing:border-box}
#vesperRoom #homeInfo>div{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:0 0 auto}
#vesperRoom #homeInfo .hr{flex:0 0 auto}
#vesperRoom #homeInfo.on{display:flex}
#vesperRoom #homeInfo b{color:#f2eddf;font-weight:500}
#vesperRoom #hiTap{color:rgba(201,168,106,.42);letter-spacing:.02em;font-size:.9em}
#vesperRoom #homeInfo .hr{height:1px;background:rgba(232,228,216,.22);margin:2px 0}
#vesperRoom #sndBtn{position:fixed;z-index:12;width:26px;height:26px;border-radius:50%;
          border:1px solid rgba(201,168,106,.4);background:rgba(12,14,20,.5);
          color:rgba(201,168,106,.75);font-size:12px;line-height:24px;text-align:center;
          cursor:pointer;display:none;backdrop-filter:blur(3px)}
#vesperRoom #sndBtn.show{display:block}
#vesperRoom #sndBtn.off{color:rgba(120,114,100,.6);border-color:rgba(120,114,100,.3)}

/* ⭐ 콕 짚어 끌어 맞추는 편집 — 슬라이더로 좌표계를 뒤쫓는 대신 눈으로 (0817 소로) */
#vesperRoom.edit #homeInfo{outline:1px dashed rgba(201,168,106,.7);cursor:move;pointer-events:auto}
#vesperRoom.edit .wing b{outline:1px dashed rgba(201,168,106,.7);cursor:move;pointer-events:auto}
#vesperRoom.edit #homeBtn{pointer-events:none}
#vesperRoom.edit #shadeBtn{outline:1px dashed rgba(201,168,106,.7);cursor:move}
#vesperRoom #saveTag{position:fixed;right:16px;top:16px;z-index:25;background:rgba(12,14,20,.9);
           border:1px solid #c9a86a;border-radius:6px;padding:5px 11px;font-size:11px;
           color:#c9a86a;opacity:0;transition:opacity .25s;pointer-events:none}
#vesperRoom #saveTag.on{opacity:1}
#vesperRoom #editTip{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:24;
           background:rgba(12,14,20,.9);border:1px solid #c9a86a;border-radius:8px;
           padding:8px 14px;font-size:12px;color:#e8e4d8;display:none;line-height:1.7}
#vesperRoom.edit #editTip{display:block}
#vesperRoom #editTip b{color:#c9a86a;font-weight:500}
#vesperRoom #scrollHint{position:fixed;right:16px;top:50%;transform:translateY(-50%);z-index:11;
              font-size:11px;color:rgba(232,228,216,.35);writing-mode:vertical-rl;
              text-shadow:0 1px 6px rgba(0,0,0,.9);pointer-events:none;display:none}
#vesperRoom #scrollHint.on{display:block}

/* ═══ 0817 소로 — 모니터 아래 물리 버튼 다섯 위에 얹는 투명 손잡이 ═══
     그림에 이미 그려져 있는 것을 누르게 한다 (창 덮개 손잡이와 같은 문법 · 결정문 24호).
     ⚠ 좌·우 좌석은 딴 벌로 든다 — 미러가 정확히 대칭이 아니다 (결정문 25호). */
#vesperRoom #vBar{position:fixed;z-index:12;display:flex;align-items:center;justify-content:space-between;
        transform-origin:50% 50%;pointer-events:none}

/* ⚠ 0817 소로 — 테두리는 편집기를 끈 뒤에도 남아 거슬렸다.
     창 덮개 손잡이와 같은 문법으로 — 테두리 없이 은은한 빛만. */
#vesperRoom #vBar .vb{position:relative;flex:0 0 auto;border-radius:50%;cursor:pointer;pointer-events:auto;
            border:none;background:transparent;transition:background .2s,box-shadow .2s}
#vesperRoom #vBar .vb:hover{background:rgba(255,244,214,.13);
                  box-shadow:0 0 14px 3px rgba(255,244,214,.16)}
#vesperRoom #vBar .vb.on{background:rgba(255,244,214,.08);
               box-shadow:0 0 10px 2px rgba(255,244,214,.10)}

/* 호버하면 글씨가 뜬다 — 동그라미 위쪽에 (소로 ④) */
#vesperRoom #vBar .vb b{position:absolute;left:50%;bottom:calc(100% + 7px);transform:translateX(-50%);
              font:500 11.5px 'Noto Sans KR';white-space:nowrap;font-weight:400;
              color:rgba(232,228,216,0);transition:color .2s;pointer-events:none;
              text-shadow:0 1px 5px rgba(0,0,0,.95)}
#vesperRoom #vBar .vb:hover b{color:rgba(232,228,216,.82)}
#vesperRoom.edit #vBar{outline:1px dashed rgba(201,168,106,.7);cursor:move;pointer-events:auto}
#vesperRoom.edit #vBar .vb{pointer-events:none}

/* ⚠⚠ 0817 소로 — 기내를 끄면 창 덮개 손잡이·음소거·일기장 단추가 허공에 둥둥 떴다.
     기내에 붙은 물건이므로 기내와 함께 걷는다.
     ⚠ 이 규칙은 반드시 #homeInfo.on · #scrollHint.on 뒤에 있어야 한다 — 같은 힘이면 뒤가 이긴다. */
#vesperRoom:not(.cabin) #shadeBtn, #vesperRoom:not(.cabin) #sndBtn, #vesperRoom:not(.cabin) #homeBtn, #vesperRoom:not(.cabin) #homeInfo, #vesperRoom:not(.cabin) #homeInfo.on, #vesperRoom:not(.cabin) #scrollHint, #vesperRoom:not(.cabin) #scrollHint.on, #vesperRoom:not(.cabin) #vBar{display:none}
#vesperRoom #frames{position:fixed;inset:0;pointer-events:none;z-index:10;display:none;
          transform-origin:50% 50%}
#vesperRoom #frames.flip{transform:scaleX(-1)}
#vesperRoom #frames.on{display:block}
#vesperRoom .fr{position:absolute;border:1.5px solid rgba(201,168,106,.8);border-radius:44% / 30%}
#vesperRoom .fr b{position:absolute;left:2px;top:-18px;font-size:10px;font-weight:400;
        color:rgba(201,168,106,.8);letter-spacing:.04em}
#vesperRoom #hud{position:fixed;left:14px;top:14px;transition:transform .28s ease,opacity .2s;z-index:20;background:rgba(12,14,20,.86);
       border:1px solid #3a3730;border-radius:10px;padding:13px 15px;width:312px;
       backdrop-filter:blur(6px);max-height:calc(100vh - 28px);overflow:auto}
#vesperRoom #hud::-webkit-scrollbar{display:none}
#vesperRoom #hud.hide{transform:translateX(calc(-100% - 20px));opacity:0;pointer-events:none}

/* 접었을 때 남는 것 — 여는 손잡이와 위치 한 줄 */
#vesperRoom #tab{position:fixed;left:12px;top:14px;z-index:21;width:30px;height:30px;border-radius:50%;
       border:1px solid rgba(201,168,106,.5);background:rgba(12,14,20,.55);color:#c9a86a;
       font-size:14px;line-height:28px;text-align:center;cursor:pointer;display:block;
       backdrop-filter:blur(4px)}
#vesperRoom #tab.on{display:block}
#vesperRoom #tab:hover{background:rgba(12,14,20,.85)}
#vesperRoom #mini{position:fixed;left:52px;top:19px;z-index:21;font-size:12px;color:rgba(232,228,216,.75);
        text-shadow:0 1px 6px rgba(0,0,0,.8);display:none;pointer-events:none}
#vesperRoom #mini.on{display:block}
#vesperRoom #keys{position:fixed;right:14px;bottom:14px;z-index:21;font-size:11px;
        color:rgba(232,228,216,.45);text-shadow:0 1px 6px rgba(0,0,0,.9);
        display:none;pointer-events:none;text-align:right;line-height:1.7}
#vesperRoom #keys.on{display:block}
#vesperRoom #hud h1{margin:0 0 10px;font-size:13px;font-weight:500;letter-spacing:.04em;color:#c9a86a}
#vesperRoom .sec{margin:11px 0 5px;padding-top:9px;border-top:1px solid #2e2b26;
       font-size:10px;letter-spacing:.1em;color:#6a655c}
#vesperRoom .row{display:flex;align-items:center;gap:7px;margin:6px 0;font-size:12px}
#vesperRoom .row label{color:#9a9186;min-width:46px}
#vesperRoom input[type=range]{flex:1;accent-color:#c9a86a}
#vesperRoom .v{min-width:52px;text-align:right;font-variant-numeric:tabular-nums;color:#e8e4d8}
#vesperRoom button{background:#1a1d24;color:#e8e4d8;border:1px solid #4a463c;border-radius:5px;
         padding:5px 9px;font-size:11px;cursor:pointer;white-space:nowrap}
#vesperRoom button:hover{background:#242832}
#vesperRoom button.on{border-color:#c9a86a;color:#c9a86a}
#vesperRoom #tel{margin-top:10px;padding-top:9px;border-top:1px solid #2e2b26;
       font-size:11px;line-height:1.75;color:#b8b2a4;font-variant-numeric:tabular-nums}
#vesperRoom #tel b{color:#e8e4d8;font-weight:500}
#vesperRoom #bar{height:3px;background:#2e2b26;border-radius:2px;margin:8px 0 2px;overflow:hidden}
#vesperRoom #barIn{height:100%;width:0;background:#c9a86a}
#vesperRoom #dump{width:100%;margin-top:8px;background:#0d0f14;color:#8a8177;border:1px solid #2e2b26;
        border-radius:5px;font:11px/1.5 ui-monospace,monospace;padding:7px;resize:vertical}`;

var HTML = `<div id="fade"></div>
<div id="plate">
  <div class="wing" id="wingNear"><i></i><b>EG</b></div>
  <div class="wing" id="wingFar"><i></i><b>EG</b></div>
  <div class="shade" id="shNear"></div>
  <div class="shade" id="shFar"></div>
  <div id="cabin"></div>
</div>
<div id="homeBtn"></div><!-- ⚠ title 없음 — 계기판이 이미 말하고 있다 (0817) -->
<div id="shadeBtn" data-tip="창 닫기" title="창 덮개 (S)"></div>
<div id="scrollHint">위아래로 밀어 보세요</div>
<div id="saveTag"></div>
<div id="editTip">
  <b>편집 중</b> &mdash; 계기판 · EG 글자 · 창 덮개 손잡이를 <b>끌어서</b> 옮기고,
  <b>휠</b>로 크기, <b>Shift+휠</b>로 기울기 &nbsp;·&nbsp;
  <b>E</b> 로 끝내기 &nbsp;·&nbsp; 손 떼면 <b>서버에 저장</b>
</div>
<div id="homeInfo">
  <div id="hiWhere">&nbsp;</div>
  <div class="hr"></div>
  <div>고도 <b id="hiAlt">&mdash;</b> <span id="hiVs"></span></div>
  <div id="hiPos" style="font-size:.88em">&nbsp;</div>
  <div><span id="hiElapsed">0:00</span> 비행 &nbsp;·&nbsp; 남은 <b id="hiLeft">30:00</b></div>
  <div class="hr"></div>
  <div id="hiTap">&#9992; 여기를 누르면 일기장이 열립니다</div>
</div>
<div id="vBar">
  <button class="vb" data-r="today" title="오늘 일기"><b>오늘 일기</b></button>
  <button class="vb" data-r="7"     title="지난 7일"><b>지난 7일</b></button>
  <button class="vb" data-r="30"    title="지난 한 달"><b>지난 한 달</b></button>
  <button class="vb" data-r="90"    title="지난 3개월"><b>지난 3개월</b></button>
  <button class="vb" data-r="all"   title="전체 보기"><b>전체 보기</b></button>
</div>
<div id="sndBtn" title="기내 소음 켬/끔">&#128266;</div>

<div id="mon">
  <div id="monHead" title="머리를 잡고 끌면 판이 옮겨집니다">
    <div id="mhName">
      <span id="mhEg">EG 베스페르 <i>VESPER</i></span>
      <span id="mhSub">석양에 기내에서 쓰는 교양일기</span>
    </div>
    <span style="flex:1"></span>
    <span id="dCount">0자</span>
    <button id="monX" aria-label="닫기">&#10005;</button>
  </div>
  <div id="monMain">
    <button id="dPast" title="지난 일기">교양<br>일기<small>지난 일기 &rsaquo;</small></button>
    <div id="monCol">
      <div id="dHead">
        <span id="dDate">&nbsp;</span>
        <span id="dWho">&nbsp;</span>
        <button id="dToday">오늘 일기로 &rsaquo;</button>
      </div>
      <div id="dWrap">
        <div id="dGhost" aria-hidden="true"><span id="gSeen"></span><span id="gHint">(이어서 써 보세요&hellip;)</span></div>
        <textarea id="dBody" spellcheck="false"></textarea>
      </div>
    </div>
    <div id="dList"></div>
  </div>
  <div id="monFoot">
    <span id="dSun">&nbsp;</span>
    <span id="dAlt"></span>
    <span class="sp"></span>
    <span id="dNote"></span>
    <button id="dTemp">임시 저장</button>
    <button id="dSave">저장</button>
  </div>
</div>
<div id="frames">
  <div class="fr" id="frNear"><b>가까운 창</b></div>
  <div class="fr" id="frFar"><b>먼 창</b></div>
</div>

<div id="tab" title="편집기 열기 (H)">&#9776;</div>
<div id="mini"></div>
<div id="keys">H 편집기 &middot; C 기내 &middot; Space 비행 시작/정지<br>&larr; &rarr; 좌석 &middot; L 땅 찾기 &middot; S 창 덮개<br>&#9998; E 끌어서 맞추기</div>
<div id="hud" class="hide">
  <h1 style="display:flex;align-items:center;justify-content:space-between"><span>EG CRUISE · 편집기 0817c</span><button id="bHide" style="padding:2px 7px;font-size:11px" title="H 키로도 닫힘">✕</button></h1>

  <div class="sec">어디서</div>
  <div class="row"><label>위도</label>
    <input type="range" id="lat" min="-60" max="70" value="38" step="1">
    <span class="v" id="latV">38&deg;</span></div>
  <div class="row"><span style="font-size:11px;color:#6a655c" id="latHint">&nbsp;</span></div>

  <div class="sec">어떻게</div>
  <div class="row">
    <button id="aFix" style="flex:1">고도 고정</button>
    <button id="aDsc" class="on" style="flex:1">&#8600; 강하</button></div>
  <div class="row"><label>시작</label>
    <input type="range" id="alt" min="1" max="20" value="11" step="1">
    <span class="v" id="altV">11km</span></div>
  <div class="row" id="rEnd"><label>도착</label>
    <input type="range" id="aEnd" min="2" max="60" value="50" step="1">
    <span class="v" id="aEndV">0.5km</span></div>
  <div class="row" id="rMin"><label>걸쳐서</label>
    <input type="range" id="aMin" min="2" max="30" value="30" step="1">
    <span class="v" id="aMinV">10분</span></div>
  <div class="row">
    <button id="pAuto" class="on" style="flex:1">내림각 자동</button>
    <button id="pMan" style="flex:1">직접</button></div>
  <div class="row"><label id="pitL">하늘</label>
    <input type="range" id="pit" min="-10" max="10" value="0" step="1">
    <span class="v" id="pitV">반반</span></div>
  <div class="row"><label>해 높이</label>
    <input type="range" id="sel" min="-6" max="8" value="-1" step="1">
    <span class="v" id="selV">-1&deg;</span></div>
  <div class="sec">항로</div>
  <div class="row">
    <button id="mSun" class="on" style="flex:1">해 추종</button>
    <button id="mGeo" style="flex:1">대권 고정</button></div>
  <div class="row">
    <button id="wL" class="on" style="flex:1">왼창</button>
    <button id="wR" style="flex:1">오른창</button></div>

  <div class="row" style="margin-top:9px">
    <button id="go" style="flex:1">비행 시작 &middot; 900km/h</button>
    <button id="stop">비행 정지</button></div>
  <div class="row">
    <button id="bLand" style="flex:1">&#9733; 땅 찾기</button></div>
  <div class="row">
    <button id="bCab" style="flex:1">&#9992; 기내</button>
    <button id="bFr" style="flex:1">창 테두리</button>
    <button id="bDump" style="flex:1">값 뽑기</button></div>

  <div class="row" style="margin-top:10px">
    <button id="bEdit" style="flex:1">&#9998; 끌어서 맞추기 (E)</button></div>
  <div class="sec">모니터 계기판 — <span id="eSide">왼창</span> 좌석용 (좌·우 따로 저장)</div>
  <div class="row"><label>기울기</label>
    <input type="range" id="eRot" min="-15" max="15" value="-6.3" step="0.1">
    <span class="v" id="eRotV">-6.3&deg;</span></div>
  <div class="row"><label>돌림Y</label>
    <input type="range" id="eRy" min="-35" max="35" value="-13" step="0.5">
    <span class="v" id="eRyV">-13&deg;</span></div>
  <div class="row"><label>가로</label>
    <input type="range" id="eX" min="50" max="80" value="66" step="0.5">
    <span class="v" id="eXV">66%</span></div>
  <div class="row"><label>세로</label>
    <input type="range" id="eY" min="25" max="50" value="36" step="0.5">
    <span class="v" id="eYV">36%</span></div>
  <div class="row"><label>폭</label>
    <input type="range" id="eW" min="20" max="45" value="33" step="0.5">
    <span class="v" id="eWV">33%</span></div>
  <div class="row"><label>높이</label>
    <input type="range" id="eH" min="8" max="24" value="14" step="0.5">
    <span class="v" id="eHV">14%</span></div>
  <div class="sec">날개 EG 글자 — <span id="lSide">왼창</span>용</div>
  <div class="row"><label>가로</label>
    <input type="range" id="lX" min="0" max="20" value="8" step="0.1">
    <span class="v" id="lXV">8%</span></div>
  <div class="row"><label>세로</label>
    <input type="range" id="lY" min="5" max="45" value="26" step="0.5">
    <span class="v" id="lYV">26%</span></div>
  <div class="row"><label>크기</label>
    <input type="range" id="lS" min="0.4" max="4" value="1.6" step="0.05">
    <span class="v" id="lSV">1.6%</span></div>
  <div class="row"><label>기울기</label>
    <input type="range" id="lR" min="-30" max="30" value="-8" step="1">
    <span class="v" id="lRV">-8&deg;</span></div>
  <div id="bar"><div id="barIn"></div></div>
  <div id="tel">대기 중</div>
  <div id="where" style="margin-top:8px;padding-top:8px;border-top:1px solid #2e2b26;font-size:12px;color:#c9a86a">&nbsp;</div>
</div>`;

/* ══════════════════════════════════════════════════════════════════════
   아래는 vesper.html 0817k 에서 옮겨온 몸통이다.
   손댄 곳은 넷뿐 —
     ① var KEY (구글 키) 걷음         ② new Cesium.Viewer 걷고 hostViewer 를 받음
     ③ 끝의 타일 생성 블록 걷음        ④ addEventListener → EGV_on · document.body → ROOT
   나머지는 한 자도 안 고쳤다. 주석도 그대로다 — 거기에 이유가 적혀 있다.
   ══════════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════
   EG cruise 편집기 0817c
   ⭐ 해 추종 — 매 프레임 진행 방위 = 태양 방위 ± 90. 항로가 완만히 휘며
      해가 창 한가운데 머문다. 0817 실측: 대권 고정이면 19분에 창을 벗어난다.
   ⚠ 창 테두리는 판(9:16) 기준 %를 화면 px로 환산해서 그린다 — 세로가 2.8~3.2배다
   ══════════════════════════════════════════════════════════════ */
console.log("[EG] vesper 0817k \u2014 EG\ubca0\uc2a4\ud398\ub974 \uc77c\uae30\ud310 \u00b7 \ud314\ub808\ud2b8 12\ubc8c \u00b7 \uc11c\ubc84 \uc800\uc7a5");

/* ⚠ 0818 — 구글 API 키를 걷었다. 이 방은 terra 의 타일을 그대로 쓴다.
   키가 여기 남아 있으면 root 요청이 또 나가고, 그것이 곧 청구서다. */
var KMH = 900, R_PLATE = 941/1672;
var FLIGHT_SEC = 30*60;
var ANNOUNCE_SRC = "cabin_announce_v1.mp3";     /* ⭐ 소로가 올릴 안내 방송 파일 이름 */
/* ── 서버 저장 — EG의 다른 편집기와 같은 자리(eg_settings) · 같은 문법 ── */
var SUPA_URL = "https://cyhlotwdisjvoxvfkpnd.supabase.co";
var SUPA_KEY = "sb_publishable_jYYfQV_wQgMRFjSUuDq7xA_gWc9vsnR";
var TUNE_KEY = "cruise_tune";                   /* eg_settings.key */
var sb = null;
try{
  if (window.supabase) sb = window.supabase.createClient(SUPA_URL, SUPA_KEY, {
    auth:{ storageKey:"eungyo-auth", persistSession:true, autoRefreshToken:true }
  });
}catch(e){ console.warn("[EG] Supabase 미연결:", e); }     /* ⭐ 소로가 올릴 안내 방송 파일 이름 */          /* 한 번의 비행 = 30분 (결정문 6호) */
function mmss(t){ var m=Math.floor(t/60), s2=Math.floor(t%60); return m+":"+(s2<10?"0":"")+s2; }
var FOVX = 60;                                   /* Cesium 기본 가로 시야각 */

/* 판(9:16) 기준 창 좌표 — 결정문 10호 실측값 */
var WIN = { near:{L:7.1,  T:32.8, W:24.3, H:21.9},
            far :{L:48.8, T:37.5, W:8.9,  H:13.9} };

var viewer, flight = null, side = -1, mode = "SUN";
var altMode = "DSC", pitMode = "AUTO", groundH = 0;
var Re_M = 6371000;
/* 지평선 각도 — 이 값에 맞추면 하늘과 땅이 반반이 된다 (0817 실측) */
function horizonDeg(relAlt){ return -Cesium.Math.toDegrees(Math.acos(Re_M/(Re_M+relAlt))); }
var LATHINT = [[70,"노르웨이해·북극"],[65,"캐나다 북부"],[60,"허드슨만 — 물뿐"],
  [55,"매니토바 호수지대"],[50,"캐나다 대평원"],[45,"미국 북부 대평원"],
  [40,"콜로라도 로키"],[35,"뉴멕시코 고원·협곡"],[30,"시에라마드레"],
  [25,"바하캘리포니아"],[20,"멕시코 남부 산악"],[10,"태평양"],[0,"태평양"],[-20,"안데스 접근"]];

function $(s){ return document.getElementById(s); }
function deg(r){ return (Cesium.Math.toDegrees(r)+360)%360; }
function fm(n,d){ return n.toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d}); }

/* ── 태양 ──────────────────────────────────────────────────── */
function subsolar(jd){
  try{
    var icrf = Cesium.Simon1994PlanetaryPositions.computeSunPositionInEarthInertialFrame(jd);
    var m = Cesium.Transforms.computeIcrfToFixedMatrix(jd)
         || Cesium.Transforms.computeTemeToPseudoFixedMatrix(jd);
    return Cesium.Cartographic.fromCartesian(
      Cesium.Matrix3.multiplyByVector(m, icrf, new Cesium.Cartesian3()));
  }catch(e){
    var d = Cesium.JulianDate.toDate(jd);
    var doy = Math.floor((d - Date.UTC(d.getUTCFullYear(),0,0))/864e5);
    var fr = d.getUTCHours()+d.getUTCMinutes()/60+d.getUTCSeconds()/3600;
    return new Cesium.Cartographic(Cesium.Math.toRadians(-15*(fr-12)),
      Cesium.Math.toRadians(23.44)*Math.sin(2*Math.PI*(284+doy)/365), 0);
  }
}
function sunAzEl(lat, lon){
  var sp = subsolar(viewer.clock.currentTime);
  var dir = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.fromRadians(sp.longitude, sp.latitude, 0), new Cesium.Cartesian3());
  var sun = Cesium.Cartesian3.multiplyByScalar(dir, 1.496e11, new Cesium.Cartesian3());
  var inv = Cesium.Matrix4.inverse(
    Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(lon,lat,0)),
    new Cesium.Matrix4());
  var loc = Cesium.Matrix4.multiplyByPoint(inv, sun, new Cesium.Cartesian3());
  var n = Cesium.Cartesian3.normalize(loc, new Cesium.Cartesian3());
  return { az: Math.atan2(n.x, n.y), el: Math.asin(n.z) };
}
function sunLonAt(latDeg, elDeg){
  var s = subsolar(viewer.clock.currentTime);
  var f = Cesium.Math.toRadians(latDeg), d = s.latitude, h = Cesium.Math.toRadians(elDeg);
  var c = (Math.sin(h) - Math.sin(f)*Math.sin(d))/(Math.cos(f)*Math.cos(d));
  if (c < -1 || c > 1) return null;
  return ((Cesium.Math.toDegrees(s.longitude + Math.acos(c)) + 540) % 360) - 180;
}

/* 육지·도시·대양은 eg_geo.js 가 맡는다 (EGGeo)
   ⚠ 부품이 안 실렸어도 화면이 죽지 않게 대역을 세운다 — 0817 실제로 겪었다 */
var EGGeo = window.EGGeo || {
  inland: function(){ return 9; },
  where:  function(){ return "eg_geo.js 없음"; },
  pickSunsetLand: function(){ return null; },
  nearest: function(){ return null; }
};
function stepFrom(lat, lon, brgDeg, km){
  var Re=6371, d=km/Re, f1=Cesium.Math.toRadians(lat), l1=Cesium.Math.toRadians(lon),
      b=Cesium.Math.toRadians(brgDeg);
  var f2=Math.asin(Math.sin(f1)*Math.cos(d)+Math.cos(f1)*Math.sin(d)*Math.cos(b));
  var l2=l1+Math.atan2(Math.sin(b)*Math.sin(d)*Math.cos(f1), Math.cos(d)-Math.sin(f1)*Math.sin(f2));
  return [Cesium.Math.toDegrees(f2), ((Cesium.Math.toDegrees(l2)+540)%360)-180];
}

/* ── 창 테두리를 실제 크기로 ─────────────────────────────────── */
var panY = 0, panMin = 0, panMax = 0;
/* ⚠ 홈이 판 오른쪽 끝에 붙어 있어 미러 셈이 정확히 대칭이 안 된다 (0817 소로).
   왼창·오른창을 딴 벌로 들고, 편집기는 지금 보고 있는 쪽을 만진다. */
/* 날개 EG 글자 — 이미지에서 지우고 HTML 로 얹은 것. 좌·우 따로 (0817 소로) */
/* 윙렛 남색판 실측 x 4.5~15.4% · y 20.6~43.2% — 그 안쪽에 앉힌다 (0817) */
/* 창 덮개 손잡이 — 그림 속 그것 위에 얹는 투명 판. 좌·우 따로 (0817 소로) */
var GRIP_L = { x:15.5, y:29.75, w:11.5, h:2.0 };
var GRIP_R = { x:15.5, y:29.75, w:11.5, h:2.0 };
function GRIP(){ return side < 0 ? GRIP_L : GRIP_R; }

var LOGO_L = { x:8.0, y:26, s:1.6, rot:-8 };     /* x·y 는 날개 폭·높이 %, s 는 글자 크기 % */
var LOGO_R = { x:8.0, y:26, s:1.6, rot:-8 };
function LOGO(){ return side < 0 ? LOGO_L : LOGO_R; }

/* 0817 소로 — 모니터 아래 물리 버튼 다섯. 줄 하나로 다룬다(손잡이 다섯을 각각 옮기면 지옥이다).
   x·y·w 는 판(9:16) 기준 % · d 는 동그라미 지름 % · rot/ry 는 홈과 같은 면 기울기. */
var VBAR_L = { x:67, y:53.5, w:31, d:3.2, rot:-6.3, ry:-13 };
var VBAR_R = { x:2,  y:53.5, w:31, d:3.2, rot: 6.3, ry: 13 };
function VBAR(){ return side < 0 ? VBAR_L : VBAR_R; }
var HOME_L = { x:66, y:36, w:33, h:14, rot:-6.3, ry:-13 };
var HOME_R = { x:1,  y:36, w:33, h:14, rot: 6.3, ry: 13 };   /* 미러 초깃값 — 소로가 맞춘다 */
function HOME(){ return side < 0 ? HOME_L : HOME_R; }
function layoutFrames(){
  var flipped = $("plate").classList.contains("flip");
  var vw = innerWidth, vh = innerHeight;
  var w = (vw/vh < R_PLATE) ? Math.max(vh*R_PLATE, vw) : vw;
  var h = w/R_PLATE;
  var cx = (vw - w)/2;
  /* 가까운 창의 세로 한가운데가 화면 한가운데에 오도록 판을 세운다 */
  var focus = (WIN.near.T + WIN.near.H/2)/100;
  var py = vh*0.5 - h*focus;

  /* 기내 판 전체 — panY 만큼 위아래로 민다 (창밖은 안 움직인다) */
  var pl = $("plate");
  panMin = -(h + py - vh);          /* 더 내릴 수 없는 한계 (판 아래끝이 화면 바닥) */
  panMax = -py;                     /* 더 올릴 수 없는 한계 (판 위끝이 화면 천장) */
  panY = Math.max(panMin, Math.min(panMax, panY));
  pl.style.left = cx + "px"; pl.style.top = (py + panY) + "px";
  pl.style.width = w + "px"; pl.style.height = h + "px";

  /* 모니터 — 홈 자리에 맞춰 세운다 (판을 따라 움직인다) */
  var HM = HOME();
  var hx = cx + (HM.x/100)*w, hy = py + panY + (HM.y/100)*h,
      hw = (HM.w/100)*w, hh = (HM.h/100)*h;
  var mw = Math.max(hw*1.9, 380), mh = Math.max(mw*0.72, 300);
  mw = Math.min(mw, vw*0.52); mh = Math.min(mh, vh*0.78);
  /* 홈 단추 — 계기판과 똑같은 화면 좌표 (둘 다 fixed) */
  var hb = $("homeBtn");
  hb.style.left = hx + "px"; hb.style.top = hy + "px";
  hb.style.width = hw + "px"; hb.style.height = hh + "px";
  /* ⚠ 0817 소로 — 마우스를 대면 뜨던 테두리가 모니터와 안 맞았다.
     사각형이 틀린 게 아니라 **눕혀 놓지 않아서**였다. 계기판과 똑같은 면에 얹는다.
     ⭐ 손잡이를 하나 더 만들지 않는다 — 값은 HOME() 하나에서만 온다 (0816 조항 ⑧). */
  hb.style.transform = "rotate(" + HM.rot + "deg) perspective(700px) rotateY(" + HM.ry + "deg)";

  /* 0817 — 모니터 아래 물리 버튼 줄. 홈과 같은 화면 좌표 문법(둘 다 fixed).
     ⚠ 판 밖이므로 미러 셈이 없다 — 좌·우 값을 딴 벌로 든다 (결정문 25호 · 함정 ㉪). */
  var VB = VBAR(), vb = $("vBar");
  var vx = cx + (VB.x/100)*w, vy = py + panY + (VB.y/100)*h,
      vw2 = (VB.w/100)*w, vd = Math.max(14, (VB.d/100)*w);
  vb.style.left = vx + "px"; vb.style.top = vy + "px";
  vb.style.width = vw2 + "px"; vb.style.height = vd + "px";
  vb.style.transform = "rotate(" + VB.rot + "deg) perspective(700px) rotateY(" + VB.ry + "deg)";
  Array.prototype.forEach.call(vb.querySelectorAll(".vb"), function(b){
    b.style.width = vd + "px"; b.style.height = vd + "px";
  });

  /* 홈 계기판 — 홈 사각형에 딱 얹는다. 판이 뒤집히면 각도도 반대로 */
  var hi = $("homeInfo");
  hi.style.left = hx + "px"; hi.style.top = hy + "px";
  hi.style.width = hw + "px"; hi.style.height = hh + "px";
  /* ⚠ 높이에만 물리면 창을 좁혔을 때 글자가 홈 밖으로 넘친다 (0817 소로).
     폭에도 물리고, 그래도 넘치면 아래에서 한 번 더 줄인다. */
  var fs = Math.min(hh*0.155, hw*0.052, 20);
  hi.style.fontSize = Math.max(7.5, fs) + "px";
  hi.style.lineHeight = "1.32";
  /* 넘치면 맞을 때까지 줄인다 (최대 여덟 번) */
  (function fitHome(){
    var n = 0;
    while (n < 8 && (hi.scrollHeight > hi.clientHeight + 1 || hi.scrollWidth > hi.clientWidth + 1)){
      fs *= 0.92; hi.style.fontSize = Math.max(6, fs) + "px"; n++;
      if (fs < 6.2) break;
    }
  })();

  var sb = $("sndBtn");
  sb.style.left = (hx + hw - 30) + "px";
  sb.style.top  = (hy + hh + 8) + "px";

  /* 각도도 그 벌의 값 그대로 — 미러 셈 없음 */
  hi.style.transform = "rotate(" + HM.rot + "deg) perspective(700px) rotateY(" + HM.ry + "deg)";

  var mo = $("mon");
  mo.style.width = mw + "px"; mo.style.height = mh + "px";
  mo.style.left = Math.max(12, Math.min(vw-mw-12, hx + hw/2 - mw/2)) + "px";
  mo.style.top  = Math.max(12, Math.min(vh-mh-12, hy + hh/2 - mh/2)) + "px";

  /* 날개 두 겹 — 0817 확정값 s75 · near 8% · far −2% · top 36% */
  var ww = 0.75*w, wh = ww * 821/1916;
  ["wingNear","wingFar"].forEach(function(id, k){
    var e = $(id);
    e.style.width = ww + "px"; e.style.height = wh + "px";
    var b = e.querySelector("b"), LG = LOGO();
    if (b){
      b.style.left = LG.x + "%"; b.style.top = LG.y + "%";
      b.style.fontSize = (ww*LG.s/100) + "px";
      b.style.transform = flipped ? "rotate(" + (-LG.rot) + "deg) scaleX(-1)"
                                  : "rotate(" + LG.rot + "deg)";
    }
    e.style.left = ((k === 0 ? 8 : -2)/100*w) + "px";
    e.style.top  = (0.36*h) + "px";
  });

  /* 창 덮개 — 창보다 조금 크게 잡아 틈이 안 보이게 */
  [["shNear","near"],["shFar","far"]].forEach(function(t){
    var e = $(t[0]), c = WIN[t[1]];
    e.style.left   = ((c.L-1.5)/100*w) + "px";
    e.style.top    = ((c.T-1.5)/100*h) + "px";
    e.style.width  = ((c.W+3)/100*w) + "px";
    e.style.height = ((c.H+3)/100*h) + "px";
  });
  /* 덮개 손잡이 — 그림 속 그 자리 (가까운 창 위, 실측 0817) */
  var sb2 = $("shadeBtn"), GP = GRIP();
  sb2.style.left   = (cx + (GP.x/100)*w) + "px";
  sb2.style.top    = (py + panY + (GP.y/100)*h) + "px";
  sb2.style.width  = ((GP.w/100)*w) + "px";
  sb2.style.height = ((GP.h/100)*h) + "px";

  /* 창 테두리 (선만) */
  ["near","far"].forEach(function(k){
    var e = $(k === "near" ? "frNear" : "frFar"), c = WIN[k];
    e.style.left   = (cx + c.L/100*w) + "px";
    e.style.top    = (py + c.T/100*h) + "px";
    e.style.width  = (c.W/100*w) + "px";
    e.style.height = (c.H/100*h) + "px";
  });
  return { w:w, h:h, vw:vw, vh:vh, cx:cx, py:py };
}
/* 가까운 창의 가로 시야각 절반 */
function halfFovX(){
  var L = layoutFrames();
  return WIN.near.W/100*L.w / L.vw * FOVX / 2;
}

/* ── 부품 ──────────────────────────────────────────────────── */
function cruise(lat0, lon0, opt){
  var lat = lat0, lon = lon0, t0 = performance.now(), tp = t0, gT = 0;
  var lastRel = opt.alt, lastPit = 0;
  var brg0 = null, dist = 0;
  /* ⚠⚠ 리스너 전체를 감싼다. onTick 안쪽만 감쌌더니 setView·sunAzEl 에서 난 오류가
     그대로 Cesium 렌더 루프를 세웠다 (0817 두 번). 여기서 나는 어떤 오류도 비행을 못 멈춘다. */
  var errN = 0;
  var off = viewer.clock.onTick.addEventListener(function(){
   try{
    var now = performance.now(), dt = (now - tp)/1000, sec = (now-t0)/1000; tp = now;
    var s = sunAzEl(lat, lon);
    var az = deg(s.az);
    var brg;
    if (mode === "SUN") brg = (az - side*90 + 360) % 360;   /* 해가 창 쪽에 오도록 */
    else { if (brg0 === null) brg0 = (az - side*90 + 360) % 360; brg = brg0; }

    var km = KMH * dt/3600; dist += km;
    var p = stepFrom(lat, lon, brg, km); lat = p[0]; lon = p[1];

    var look = Cesium.Math.toRadians((brg + side*90 + 360) % 360);

    /* 지면 높이 — 1초에 한 번만 잰다. 로키에서 300m 절대고도면 땅속이다 */
    if (now - gT > 1000){
      gT = now;
      try{
        var hh = viewer.scene.sampleHeight(
          Cesium.Cartographic.fromDegrees(lon, lat));
        if (Cesium.defined(hh)) groundH = hh;
      }catch(e){}
    }

    /* 강하 — 시작 고도에서 도착 고도로, 완만하게 */
    var rel = opt.alt;
    if (altMode === "DSC"){
      var f2 = Math.min(sec/opt.descSec, 1);
      var e2 = f2 < 0.5 ? 2*f2*f2 : 1 - Math.pow(-2*f2+2, 2)/2;   /* ease-in-out */
      rel = opt.alt + (opt.altEnd - opt.alt)*e2;
    }
    var pit = (pitMode === "AUTO") ? horizonDeg(rel) + opt.sky : opt.pitch;

    if (!window.__egShut){                      /* 창이 닫혀 있으면 그리지 않는다 */
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, groundH + rel),
        orientation:{ heading: look, pitch: Cesium.Math.toRadians(pit), roll:0 }
      });
    }
    lastRel = rel; lastPit = pit;
    /* ⚠ 계기판 한 줄이 죽어도 Cesium 렌더가 통째로 멈추지 않게 감싼다 (0817) */
    if (opt.onTick){
      try{ opt.onTick(sec, lat, lon, brg, deg(look), s, dist, lastRel, lastPit); }
      catch(err){ if (!window.__egTickWarned){ window.__egTickWarned = true;
                    console.error("[EG] 계기판 오류 — 비행은 계속합니다:", err); } }
    }
   }catch(fatal){
     errN++;
     if (errN < 3) console.error("[EG] 비행 오류 " + errN + "회:", fatal);
     if (errN === 20){ console.error("[EG] 오류가 잦아 비행을 멈춥니다"); off(); }
   }
  });
  return { stop: off };
}

/* ── 화면 ──────────────────────────────────────────────────── */
function latHint(v){
  var best = LATHINT[0];
  for (var i=0;i<LATHINT.length;i++)
    if (Math.abs(LATHINT[i][0]-v) < Math.abs(best[0]-v)) best = LATHINT[i];
  return best[1];
}
function preview(){
  stopAll();
  var lat = +$("lat").value, el = +$("sel").value;
  var lon = sunLonAt(lat, el);
  $("latHint").textContent = latHint(lat) + (lon===null ? " — 백야·극야"
    : "  ·  " + (EGGeo.inland(lat,lon) >= 5 ? "내륙 " + EGGeo.inland(lat,lon) + "/9" : "바다"));
  if (lon === null){ $("tel").textContent = "이 위도는 지금 백야·극야입니다"; return; }
  var s = sunAzEl(lat, lon);
  var az = deg(s.az), brg = (az - side*90 + 360)%360;
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(lon, lat, (+$("alt").value)*1000),
    orientation:{ heading: Cesium.Math.toRadians(az),
                  pitch: Cesium.Math.toRadians(pitchNow((+$("alt").value)*1000)), roll:0 }
  });
  $("tel").innerHTML =
    "지금 이 위도의 일몰 지점<br>위치 <b>" + fm(lat,1) + ", " + fm(lon,2) + "</b><br>" +
    "&#9788; 방위 <b>" + fm(az,1) + "&deg;</b> · 고도 <b>" + fm(Cesium.Math.toDegrees(s.el),1) + "&deg;</b><br>" +
    "진행 방위 <b>" + fm(brg,1) + "&deg;</b> · 창 시야각 <b>" + fm(halfFovX()*2,1) + "&deg;</b>";
  $("where").textContent = EGGeo.where(lat, lon);
}
function pitchNow(relAlt){
  return (pitMode === "AUTO") ? horizonDeg(relAlt) + (+$("pit").value) : (+$("pit").value);
}
function stopAll(){ if (flight){ flight.stop(); flight=null; } $("barIn").style.width="0"; }

function pick(a,b,onA){ $(a).classList.toggle("on",onA); $(b).classList.toggle("on",!onA); }

function bootRoom(hostViewer){
  /* ⭐⭐ 0818 「한 문서 · 한 root」 — 여기가 오늘 공사의 알맹이다.
     옛 판: new Cesium.Viewer 로 지구를 한 벌 더 만들고 타일도 한 벌 더 받았다.
       액자(iframe)는 별도 문서라 WebGL 자원을 못 건네받는다. 그래서 terra 가 이미
       지구를 띄워 둔 채로 root 요청이 또 나갔다 — 한 사람이 들어올 때마다 두 번.
     새 판: terra 의 viewer 를 그대로 받는다. root 추가 0 · Cesium 3MB 재수신 0.
     ⚠ 하늘 설정을 여기서 다시 하지 않는다. 실측 결과 terra 와 한 줄도 안 달랐다
       (skyAtmosphere · baseColor · fog · enableLighting · 달 · OSM 밑그림 · SYSTEM_CLOCK).
       다시 걸면 같은 값을 덮어쓸 뿐이고, 나갈 때 되돌릴 것만 생긴다. */
  viewer = hostViewer;
  /* ⚠ 옛 판에 있던 var s = viewer.scene 은 안 둔다. 실측 결과 이 몸통에서
     scene 을 직접 만지는 곳이 하나도 없었다 — 하늘 설정과 타일 붙이기에만
     쓰이던 것인데 둘 다 terra 몫이 되었다. 쓰지 않는 이름은 남기지 않는다.
     (아래 s. 다섯 곳은 태양 좌표 subsolar 의 지역 s 다. 다른 물건이다.) */

  function pitLabel(){
    var v = +$("pit").value;
    if (pitMode === "AUTO"){
      $("pitL").textContent = "하늘";
      $("pitV").textContent = v === 0 ? "반반" : (v > 0 ? "+" + v : "" + v);
    } else {
      $("pitL").textContent = "내림각";
      $("pitV").textContent = v + "\u00B0";
    }
  }
  var HOME_KEYS = [["eRot","rot","\u00B0"],["eRy","ry","\u00B0"],["eX","x","%"],
                   ["eY","y","%"],["eW","w","%"],["eH","h","%"]];
  HOME_KEYS.forEach(function(t){
    $(t[0]).oninput = function(e){
      HOME()[t[1]] = +e.target.value;              /* 지금 보고 있는 쪽만 */
      $(t[0]+"V").textContent = e.target.value + t[2];
      layoutFrames();
    };
  });
  var LOGO_KEYS = [["lX","x","%"],["lY","y","%"],["lS","s","%"],["lR","rot","\u00B0"]];
  LOGO_KEYS.forEach(function(t){
    $(t[0]).oninput = function(e){
      LOGO()[t[1]] = +e.target.value;
      $(t[0]+"V").textContent = e.target.value + t[2];
      layoutFrames();
    };
  });
  function syncLogoEditor(){
    var LG = LOGO();
    $("lSide").textContent = side < 0 ? "왼창" : "오른창";
    LOGO_KEYS.forEach(function(t){
      $(t[0]).value = LG[t[1]];
      $(t[0]+"V").textContent = LG[t[1]] + t[2];
    });
  }
  /* ── 끌어서 맞추기 ─────────────────────────────────────── */
  var editing = false, grab = null;
  function setEdit(on){
    editing = on;
    ROOT.classList.toggle("edit", on);
    $("bEdit").classList.toggle("on", on);
    if (!on) saveTune();
  }
  $("bEdit").onclick = function(){ setEdit(!editing); };

  function tuneTarget(el){
    if (el.closest && el.closest("#homeInfo")) return "home";
    if (el.closest && el.closest(".wing b")) return "logo";
    if (el.closest && el.closest("#shadeBtn")) return "grip";
    if (el.closest && el.closest("#vBar")) return "vbar";      /* 0817 — 버튼 다섯 줄 */
    return null;
  }
  EGV_on("pointerdown", function(e){
    if (!editing) return;
    var t = tuneTarget(e.target); if (!t) return;
    e.preventDefault(); e.stopPropagation();
    var L = layoutFrames();
    grab = { t:t, x:e.clientX, y:e.clientY, w:L.w, h:L.h,
             flip:$("plate").classList.contains("flip") };
  }, true);
  EGV_on("pointermove", function(e){
    if (!grab) return;
    var dx = e.clientX - grab.x, dy = e.clientY - grab.y;
    grab.x = e.clientX; grab.y = e.clientY;
    if (grab.t === "home"){
      var HM = HOME();
      HM.x += dx/grab.w*100; HM.y += dy/grab.h*100;
    } else if (grab.t === "grip"){
      var GP = GRIP();
      GP.x += dx/grab.w*100; GP.y += dy/grab.h*100;
    } else if (grab.t === "vbar"){
      var VB = VBAR();
      VB.x += dx/grab.w*100; VB.y += dy/grab.h*100;
    } else {
      var LG = LOGO(), ww = 0.75*grab.w, wh = ww*821/1916;
      /* 날개는 판 안이라 뒤집히면 화면상 반대로 움직인다 */
      LG.x += (grab.flip ? -dx : dx)/ww*100;
      LG.y += dy/wh*100;
    }
    layoutFrames();
  }, true);
  EGV_on("pointerup", function(){
    if (!grab) return;
    grab = null; syncHomeEditor(); syncLogoEditor(); saveTune();
  }, true);
  EGV_on("wheel", function(e){
    if (!editing) return;
    var t = tuneTarget(e.target); if (!t) return;
    e.preventDefault(); e.stopPropagation();
    var d = e.deltaY > 0 ? -1 : 1;
    if (t === "home"){
      var HM = HOME();
      if (e.shiftKey) HM.rot += d*0.5; else { HM.w += d*0.6; HM.h += d*0.26; }
    } else if (t === "grip"){
      var GP = GRIP();
      GP.w = Math.max(2, GP.w + d*0.4); GP.h = Math.max(0.6, GP.h + d*0.12);
    } else if (t === "vbar"){
      var VB = VBAR();
      /* 휠 = 줄 길이 · Shift+휠 = 기울기 · Alt+휠 = 동그라미 크기 */
      if (e.shiftKey) VB.rot += d*0.5;
      else if (e.altKey) VB.d = Math.max(1.2, VB.d + d*0.15);
      else VB.w = Math.max(6, VB.w + d*0.7);
    } else {
      var LG = LOGO();
      if (e.shiftKey) LG.rot += d; else LG.s = Math.max(0.2, LG.s + d*0.06);
    }
    layoutFrames(); syncHomeEditor(); syncLogoEditor(); saveTune();
  }, { passive:false, capture:true });

  /* ── 서버 저장 — eg_settings 한 줄. 읽기는 모두, 쓰기는 관리자만 (RLS) ── */
  var saveT = null;
  function tuneNow(){ return { HL:HOME_L, HR:HOME_R, LL:LOGO_L, LR:LOGO_R, GL:GRIP_L, GR:GRIP_R,
                               BL:VBAR_L, BR:VBAR_R }; }
  function saveTune(){
    /* 끌 때마다 부르지 않게 잠깐 모았다 보낸다 */
    clearTimeout(saveT);
    saveT = setTimeout(pushTune, 500);
  }
  function pushTune(){
    try{ localStorage.setItem("eg_cruise_tune2", JSON.stringify(tuneNow())); }catch(e){}
    if (!sb){ flashSave("연결 없음"); return; }
    sb.from("eg_settings")
      .upsert({ key:TUNE_KEY, val:tuneNow(), updated_at:new Date().toISOString() },
              { onConflict:"key" })
      .then(function(r){
        if (r.error){ console.warn("[EG] 저장 실패:", r.error.message);
                      flashSave(r.error.message.indexOf("row-level") >= 0 ? "관리자 로그인 필요" : "저장 실패"); }
        else flashSave("서버 저장됨");
      });
  }
  function flashSave(msg){
    var e = $("saveTag"); if (!e) return;
    e.textContent = msg; e.classList.add("on");
    clearTimeout(e._t); e._t = setTimeout(function(){ e.classList.remove("on"); }, 2200);
  }
  function loadTune(){
    /* 먼저 브라우저 값으로 그려 두고, 서버 값이 오면 덮는다 */
    try{
      var v = JSON.parse(localStorage.getItem("eg_cruise_tune2") || "null");
      if (v) applyTune(v);
    }catch(e){}
    if (!sb) return;
    sb.from("eg_settings").select("val").eq("key", TUNE_KEY).maybeSingle()
      .then(function(r){
        if (r.error || !r.data || !r.data.val) return;
        applyTune(r.data.val);
        syncHomeEditor(); syncLogoEditor(); layoutFrames();
        console.log("[EG] 서버에서 편집값을 받았습니다");
      });
  }
  function applyTune(v){
    if (v.HL) HOME_L = v.HL; if (v.HR) HOME_R = v.HR;
    if (v.LL) LOGO_L = v.LL; if (v.LR) LOGO_R = v.LR;
    if (v.GL) GRIP_L = v.GL; if (v.GR) GRIP_R = v.GR;
    if (v.BL) VBAR_L = v.BL; if (v.BR) VBAR_R = v.BR;
  }

  function syncHomeEditor(){
    var HM = HOME();
    $("eSide").textContent = side < 0 ? "왼창" : "오른창";
    HOME_KEYS.forEach(function(t){
      $(t[0]).value = HM[t[1]];
      $(t[0]+"V").textContent = HM[t[1]] + t[2];
    });
  }
  ["lat","alt","aEnd","aMin","pit","sel"].forEach(function(id){
    $(id).oninput = function(e){
      var v = +e.target.value;
      if (id === "aEnd") $("aEndV").textContent = (v/10).toFixed(1) + "km";
      else if (id === "aMin") $("aMinV").textContent = v + "분";
      else if (id === "pit") pitLabel();
      else $(id+"V").textContent = v + ({lat:"\u00B0",alt:"km",sel:"\u00B0"}[id]);
      preview();
    };
  });
  function setAltMode(d){
    altMode = d ? "DSC" : "FIX";
    $("aDsc").classList.toggle("on", d); $("aFix").classList.toggle("on", !d);
    $("rEnd").style.display = d ? "" : "none";
    $("rMin").style.display = d ? "" : "none";
  }
  $("aDsc").onclick = function(){ setAltMode(true);  preview(); };
  $("aFix").onclick = function(){ setAltMode(false); preview(); };
  function setPitMode(a){
    pitMode = a ? "AUTO" : "MAN";
    $("pAuto").classList.toggle("on", a); $("pMan").classList.toggle("on", !a);
    $("pit").min = a ? -10 : -45; $("pit").max = a ? 10 : -2;
    $("pit").value = a ? 0 : -5;
    pitLabel(); preview();
  }
  $("pAuto").onclick = function(){ setPitMode(true); };
  $("pMan").onclick  = function(){ setPitMode(false); };
  $("mSun").onclick = function(){ mode="SUN"; pick("mSun","mGeo",true); };
  $("mGeo").onclick = function(){ mode="GEO"; pick("mSun","mGeo",false); };
  var swapping = false, swapGuard = null;
  function swapSeat(next){
    /* ⚠⚠ 0817 — swapping 은 한 번 굳으면 좌석이 영영 안 바뀐다.
       가운데 어느 줄이 예외를 내도 반드시 풀리게 안전 시계를 함께 건다. */
    if (swapping || side === next) return;
    swapping = true;
    clearTimeout(swapGuard);
    swapGuard = setTimeout(function(){ swapping = false; }, 1600);
    $("fade").classList.add("on");            /* 어두워진다 */
    setTimeout(function(){
      side = next;
      pick("wL","wR", side < 0);
      /* 오른쪽 창가면 기내 그림과 창 테두리를 좌우로 뒤집는다 */
      var f = (side > 0);
      $("plate").classList.toggle("flip", f);
      $("frames").classList.toggle("flip", f);
      syncHomeEditor(); syncLogoEditor();
      /* ⚠⚠ 0817 소로 — 좌석을 바꾸면 비행이 리셋됐다. 진범은 preview() 안의 stopAll() 이었다.
         cruise 는 매 프레임 side 를 다시 읽으므로(해 추종 · 결정문 7호),
         비행 중에는 아무것도 안 해도 다음 프레임에 반대쪽 창으로 갈아탄다. */
      if (flight) layoutFrames(); else preview();
      setTimeout(function(){                   /* 다시 켜진다 */
        $("fade").classList.remove("on");
        setTimeout(function(){ swapping = false; }, 340);
      }, 90);
    }, 340);
  }
  $("wL").onclick = function(){ swapSeat(-1); };
  $("wR").onclick = function(){ swapSeat(+1); };
  $("bLand").onclick = function(){
    var p = EGGeo.pickSunsetLand(sunLonAt, +$("sel").value);
    if (!p){
      $("tel").innerHTML = "지금 일몰선은 <b>통째로 바다</b>입니다.<br>" +
        "하루 중 약 8%가 그렇습니다 — 대양의 일몰이 되겠습니다.";
      return;
    }
    $("lat").value = p.lat; $("latV").textContent = p.lat + "\u00B0";
    preview();
    $("tel").innerHTML += "<br><span style='color:#c9a86a'>&#9733; 땅 찾음 — 북위 "
      + p.lat + "&deg; · 내륙 밀도 " + p.s + "/9</span>";
  };
  function setHud(open){
    $("hud").classList.toggle("hide", !open);
    $("tab").classList.toggle("on", !open);
    $("mini").classList.toggle("on", !open);
    $("keys").classList.toggle("on", !open);
  }
  $("bHide").onclick = function(){ setHud(false); };
  $("tab").onclick   = function(){ setHud(true); };
  /* ⭐ 접은 채로도 다 된다 — 편집기를 열지 않고 기내만 보고 싶을 때 */
  window.__egKeysReady = true;
  EGV_on("keydown", function(e){
    /* ⚠ 0817 — C·←→ 가 안 먹힌 까닭을 세 번 헛짚었다. 이번엔 재고 간다.
       첫 입력 때 한 번만 말한다. 무엇이 포커스를 쥐고 있는지가 여기서 드러난다. */
    if (!window.__egKeySeen){
      window.__egKeySeen = true;
      console.log("[EG] 첫 키 입력:", e.key,
                  "· 잡고 있는 것:", (document.activeElement && document.activeElement.tagName) + "#" +
                                    ((document.activeElement && document.activeElement.id) || "-"),
                  "· 기내여닫이:", typeof window.egCabin,
                  "· 좌석:", typeof window.egSwapSeat);
    }
    if (e.isComposing) return;                    /* 한글 조합 중에는 손대지 않는다 */
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){
      /* ⚠ 안전망 — 일기판이 닫혀 있는데도 글칸이 포커스를 쥐고 있으면 놓게 하고 계속 간다.
         ①번 처방이 어디선가 새더라도 단축키가 통째로 죽지는 않는다. */
      var live = $("mon").classList.contains("on") && e.target.closest && e.target.closest("#mon");
      if (live) return;
      try{ e.target.blur(); }catch(err){}
    }
    if (!e.key) return;
    var k = e.key.toLowerCase();
    if (k === "h")        setHud($("hud").classList.contains("hide"));
    else if (k === "escape") setHud(false);
    else if (k === "c")   { if (window.egCabin) window.egCabin();
                            else console.warn("[EG] 기내 여닫이가 아직 안 섰습니다 — init 이 중간에 멈췄을 수 있습니다"); }
    else if (k === " ")   { e.preventDefault(); if (flight) stopAll(); else $("go").click(); }
    else if (k === "arrowleft")  { try{ swapSeat(-1); }catch(err){ console.warn("[EG] 좌석:", err); } }
    else if (k === "arrowright") { try{ swapSeat(+1); }catch(err){ console.warn("[EG] 좌석:", err); } }
    else if (k === "l")   $("bLand").click();
    else if (k === "f")   $("bFr").click();
    else if (k === "d")   setDiary(!$("mon").classList.contains("on"));
    else if (k === "s")   setShade(!shut);
    else if (k === "e")   setEdit(!editing);
    else if (k === "arrowup")   { e.preventDefault(); panBy(60); }
    else if (k === "arrowdown") { e.preventDefault(); panBy(-60); }
  });
  /* ══ 소리 — 띵동 → 방송(10초) → 엔진음이 스르르 (0817 소로) ══ */
  var announced = false, annAudio = null;
  var AC = window.AudioContext || window.webkitAudioContext;
  var ac = null, engGain = null, engLp = null, sndOn = true, engBase = 0.07;   /* 0817 소로: 크다 → 절반 */

  function ensureAC(){ if (!ac) ac = new AC(); return ac; }

  /* 기내 소음 — 파일 없이 만든다. 백색소음 → 저역필터 = 엔진 웅—
     ⭐ 루프 파일과 달리 이음매가 없고, 필터를 고도에 물릴 수 있다 */
  function engineStart(){
    if (engGain || !sndOn) return;
    try{
      var a = ensureAC();
      var buf = a.createBuffer(1, a.sampleRate*2, a.sampleRate);
      var d = buf.getChannelData(0);
      for (var i=0;i<d.length;i++) d[i] = Math.random()*2-1;
      var src = a.createBufferSource(); src.buffer = buf; src.loop = true;
      engLp = a.createBiquadFilter(); engLp.type = "lowpass";
      engLp.frequency.value = 420; engLp.Q.value = 0.4;
      engGain = a.createGain(); engGain.gain.value = 0;
      src.connect(engLp).connect(engGain).connect(a.destination);
      src.start();
      engGain.gain.linearRampToValueAtTime(engBase, a.currentTime + 2.5);   /* 스르르 */
    }catch(e){}
  }
  function engineSet(on){
    sndOn = on;
    $("sndBtn").classList.toggle("off", !on);
    $("sndBtn").innerHTML = on ? "&#128266;" : "&#128263;";
    if (!engGain){ if (on && announced) engineStart(); return; }
    engGain.gain.linearRampToValueAtTime(on ? engBase : 0, ensureAC().currentTime + 0.6);
  }
  $("sndBtn").onclick = function(){ engineSet(!sndOn); };

  function playAnnounce(){
    if (announced) return;                       /* 한 번만 */
    announced = true;
    $("sndBtn").classList.add("show");
    /* ⚠ 차임은 안 낸다 — 소로 녹음에 이미 들어 있다 (0817) */
    annAudio = new Audio(ANNOUNCE_SRC);
    annAudio.volume = 0.9;
    var started = false;
    /* ⭐ 방송(10초)이 실제로 끝나는 순간 엔진음이 올라온다 */
    annAudio.addEventListener("ended", function(){ engineStart(); });
    annAudio.play().then(function(){ started = true; })
      .catch(function(){ /* 아직 파일 없음 — 아래 폴백이 맡는다 */ });
    /* ⚠ 폴백 — 파일이 없거나 재생이 막히면 3초 뒤 조용히 엔진음만 */
    setTimeout(function(){ if (!started) engineStart(); }, 3000);
  }
  function paintHomeIdle(){
    if (flight) return;
    $("hiAlt").textContent = (+$("alt").value).toFixed(1) + " km";
    $("hiElapsed").textContent = "0:00";
    $("hiLeft").textContent = mmss(FLIGHT_SEC);
    $("hiWhere").textContent = $("where").textContent || "이륙 대기";
  }
  var shut = false;
  function setShade(on){
    shut = on; window.__egShut = on;
    $("plate").classList.toggle("shut", on);
    $("shadeBtn").setAttribute("data-tip", on ? "창 열기" : "창 닫기");
    /* ⚠ 닫혀 있으면 카메라를 안 옮긴다 — 안 보이는 것을 30분간 그릴 까닭이 없다.
       좌표와 시간은 계속 흐르므로 다시 열면 그동안 간 만큼 가 있다. */
  }
  $("shadeBtn").onclick = function(e){ e.stopPropagation(); setShade(!shut); };
  /* ═══════════ EG베스페르 · 교양일기 ═══════════
     0817 소로 시안 3번. 서버는 eg_diary · eg_diary_seed (같은 날 지음).
     ⚠ 함수 다섯 다 인자에 「사람」이 없다 — auth.uid() 로만 뽑는다 (v167 §2). */

  /* 열두 벌 — 소로가 준 시안 그대로. 새 글이 태어날 때 한 벌 뽑아 그 글에 박는다. */
  var PALETTES = [
    { name:'01 한지',   paper:'#faf8f2', ink:'#464036', label:'#5c7a5f', accent:'#8a6d3b', muted:'#948b7a', faint:'#b3aa99', line:'#e6dfd0', badgeBg:'#f0e1da', badgeFg:'#a3766c' },
    { name:'02 노을',   paper:'#fbf4ec', ink:'#4a3b32', label:'#b06a4a', accent:'#b0562f', muted:'#a08877', faint:'#c4b0a2', line:'#eeddce', badgeBg:'#f6e2d3', badgeFg:'#b0562f' },
    { name:'03 청자',   paper:'#f2f6f4', ink:'#37423e', label:'#4c7a6e', accent:'#3f6e62', muted:'#84968f', faint:'#a9b8b2', line:'#dbe6e1', badgeBg:'#dcebe5', badgeFg:'#3f6e62' },
    { name:'04 먹빛',   paper:'#f5f4f1', ink:'#33322e', label:'#6a675e', accent:'#4a4841', muted:'#8d8a80', faint:'#b2afa5', line:'#e2e0da', badgeBg:'#e8e6df', badgeFg:'#4a4841' },
    { name:'05 자둣빛', paper:'#faf3f4', ink:'#463338', label:'#96566b', accent:'#8c4a60', muted:'#a1858d', faint:'#c2abb1', line:'#eedbdf', badgeBg:'#f3dee4', badgeFg:'#8c4a60' },
    { name:'06 쪽빛',   paper:'#f2f5f9', ink:'#333c48', label:'#4a6684', accent:'#3d5a78', muted:'#84919f', faint:'#a9b4c1', line:'#dde4ec', badgeBg:'#dfe8f1', badgeFg:'#3d5a78' },
    { name:'07 유채',   paper:'#fbf7e9', ink:'#45402c', label:'#8a7a2e', accent:'#7f6d21', muted:'#9c9377', faint:'#bfb69a', line:'#ece4c9', badgeBg:'#f1e8c8', badgeFg:'#7f6d21' },
    { name:'08 흑단',   paper:'#2e2a24', ink:'#e8e2d4', label:'#a4c0a7', accent:'#c9a961', muted:'#9d968a', faint:'#77716a', line:'#453f36', badgeBg:'#453c2a', badgeFg:'#c9a961' },
    { name:'09 등불',   paper:'#332a2e', ink:'#efe4e0', label:'#e0a68a', accent:'#d98d63', muted:'#a8969a', faint:'#7d7074', line:'#4a3f44', badgeBg:'#4a3a33', badgeFg:'#d98d63' },
    { name:'10 감잎',   paper:'#f4f7ee', ink:'#3c4632', label:'#5e7d43', accent:'#55703c', muted:'#8d9a7e', faint:'#aeb9a1', line:'#e0e7d3', badgeBg:'#e4ecd5', badgeFg:'#55703c' },
    { name:'11 백자',   paper:'#ffffff', ink:'#3b3b3b', label:'#7a7a7a', accent:'#5a5a5a', muted:'#949494', faint:'#bcbcbc', line:'#e9e9e9', badgeBg:'#efefef', badgeFg:'#5a5a5a' },
    { name:'12 밤바다', paper:'#252b33', ink:'#dfe6ee', label:'#8fb0c9', accent:'#7ea3c2', muted:'#8b96a3', faint:'#68727e', line:'#3a424c', badgeBg:'#33404d', badgeFg:'#9dc0da' }
  ];
  function paintPalette(n){
    var p = PALETTES[(Math.max(1, Math.min(12, n|0)) - 1)] || PALETTES[0], m = $("mon");
    ["paper","ink","label","accent","muted","faint","line","badgeBg","badgeFg"].forEach(function(k){
      m.style.setProperty("--" + k, p[k]);
    });
    D.palette = (Math.max(1, Math.min(12, n|0)));
  }

  var WDAY = ["일","월","화","수","목","금","토"];
  function todayKey(){                      /* 손님의 하루 — 기기 시각 기준 */
    var d = new Date();
    return d.getFullYear() + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + ("0"+d.getDate()).slice(-2);
  }
  function dayLabel(iso, seq){
    var p = iso.split("-"), d = new Date(+p[0], +p[1]-1, +p[2]);
    return p[0] + "년 " + (+p[1]) + "월 " + (+p[2]) + "일 " + WDAY[d.getDay()] + "요일"
         + (seq > 1 ? " (" + seq + ")" : "");
  }

  /* 지금 쓰고 있는 한 편 */
  var D = { day: todayKey(), seq: 1, palette: 1, seed: null, seedText: "",
            nick: "", loaded: false, dirty: false, saving: false, tmr: null,
            viewing: null };   /* 지난 한 편을 보는 중이면 {day,seq} */

  /* ⭐ 유령판 — textarea 는 한 색뿐이다. 값을 투명하게 복제해 두고 그 끝에 힌트를 붙인다.
     첫 문장은 또렷하고 「(이어서 써 보세요…)」만 흐리다 (0817 소로). */
  function paintGhost(){
    var v = $("dBody").value;
    $("gSeen").textContent = v;
    /* 첫 문장 그대로면 힌트를 보인다. 한 글자라도 더하거나 지우면 사라진다. */
    $("gHint").style.display = (D.seedText && v === D.seedText) ? "" : "none";
    $("dGhost").scrollTop = $("dBody").scrollTop;
  }
  /* 자수 — 원고지 셈. 제시문도 공백도 다 센다 (0817 소로).
     받아들인 순간 그 문장도 내 일기의 일부다. */
  function myChars(){ return $("dBody").value.length; }
  /* ⚠ 저장 판정은 따로 둔다 — 안 그러면 제시문만 있는 빈 일기가 저장된다 */
  function wroteAnything(){
    var v = $("dBody").value;
    if (D.seedText && v.indexOf(D.seedText) === 0) v = v.slice(D.seedText.length);
    return v.trim().length > 0;
  }
  function paintCount(){ $("dCount").textContent = myChars() + "자"; }

  /* ── 실제로 쓴 시간 ──
     ⚠ updated_at − created_at 으로 재면 창밖 본 시간·나중에 고친 시간까지 삼킨다.
        이 화면에는 「멍때리기」가 설계로 들어 있어서 특히 그렇다.
     ⭐ 입력과 입력 사이만 더한다. 사이가 120초를 넘으면 그 구간은 자리를 비운 것으로 본다. */
  var WT = { sec: 0, last: 0 };
  var WT_GAP = 120;
  function tick(){
    var now = Date.now() / 1000;
    if (WT.last && now - WT.last < WT_GAP) WT.sec += now - WT.last;
    WT.last = now;
  }
  function fmSpan(sec){
    sec = Math.round(sec || 0);
    if (sec < 60) return sec + "초";
    var m = Math.floor(sec / 60), s2 = sec % 60;
    if (m < 60) return m + "분" + (s2 ? " " + s2 + "초" : "");
    return Math.floor(m / 60) + "시간" + (m % 60 ? " " + (m % 60) + "분" : "");
  }
  /* 소요시간 · 글자수 · 분당 — 글쓰기 훈련 지표 (0817 소로) */
  function statLine(chars, sec){
    if (!sec || sec < 20) return chars + "자";      /* 너무 짧으면 분당이 거짓말이 된다 */
    return fmSpan(sec) + " \u00b7 " + chars + "자 \u00b7 분당 " + Math.round(chars / sec * 60) + "자";
  }

  function note(msg, keep){
    $("dNote").textContent = msg || "";
    if (msg && !keep) setTimeout(function(){ if ($("dNote").textContent === msg) $("dNote").textContent = ""; }, 2600);
  }

  /* ── 서버 ── */
  function rpc(fn, args){
    if (!sb) return Promise.reject(new Error("no-supabase"));
    return sb.rpc(fn, args || {}).then(function(r){ if (r.error) throw r.error; return r.data; });
  }
  /* 지금 어디를 나는가 — onTick 이 채우고 일기가 읽는다 (⚠ 없는 전역을 보지 않는다) */
  var VNOW = { la:null, lo:null, rel:null, dist:null, place:null, el:null, at:0, sunLeft:null };
  function whereNow(){
    return { place: VNOW.place || ($("where").textContent || "").trim() || null,
             lat: (typeof VNOW.la === "number" ? +VNOW.la.toFixed(5) : null),
             lon: (typeof VNOW.lo === "number" ? +VNOW.lo.toFixed(5) : null),
             alt: (typeof VNOW.rel === "number" ? +(VNOW.rel/1000).toFixed(2) : null),
             dist:(typeof VNOW.dist === "number" ? +VNOW.dist.toFixed(1) : null) };
  }
  function saveDiary(status){
    if (!sb || D.saving) return Promise.resolve();
    if (status === "saved" && !wroteAnything()){ note("아직 쓴 글이 없습니다"); return Promise.resolve(); }
    D.saving = true; var w = whereNow();
    return rpc("save_my_diary", { p_wrote_on:D.day, p_seq:D.seq, p_body:$("dBody").value,
      p_palette:D.palette, p_status:status, p_seed_id:D.seed,
      p_place:w.place, p_lat:w.lat, p_lon:w.lon, p_alt_km:w.alt, p_dist_km:w.dist,
      p_write_sec:Math.round(WT.sec) })
      .then(function(){ D.dirty = false;
        note(status === "saved" ? "저장했습니다" : "임시 저장했습니다");
        /* ⭐⭐ 도장은 **놓기만** 한다 — 누르는 것은 손님이다(크레덴시알 결정문 3호).
           ⚠ 0817에 서버가 저장과 함께 몰래 찍게 지었다가 소로가 무르셨다.
             그러면 「도장 받기」라는 대목 자체가 사라진다.
           ⚠ 각인에 날짜를 넣지 않는다 — 수첩이 이미 날짜를 붙인다(두 번 적힌다).
           ⚠ 이미 오늘 것을 받았으면 부품이 아무것도 안 띄운다. 재촉하지 않는다. */
        if (status === "saved" && window.EGStamp) offerStamp();
      })
      .catch(function(e){ console.warn("[EG] 일기 저장 실패:", e);
        note(/JWT|auth|401/i.test(String(e && e.message)) ? "로그인이 필요합니다" : "저장하지 못했습니다"); })
      .then(function(){ D.saving = false; });
  }
  /* ⚠ 결정문 13호 — 창밖 보러 나갔다 돌아오니 백지, 그건 다시는 안 쓰게 되는 사고다.
     손을 멈추면 2.5초 뒤 조용히 초안으로 남긴다. */
  function touched(){
    tick();                                       /* ⚠ 값을 바꾸기 전에 시간부터 잰다 */
    D.dirty = true; paintGhost(); paintCount();
    clearTimeout(D.tmr);
    /* ⚠ 지난 일기를 고치는 중이면 draft 로 떨어뜨리지 않는다 — 목록(saved 만)에서 사라진다 */
    D.tmr = setTimeout(function(){ if (D.dirty) saveDiary(D.viewing ? "saved" : "draft"); }, 2500);
  }

  /* 도장을 놓는다 — 우측 하단에 인장이 나타나고, 손님이 누르면 꾹 눌린다.
     그 뒤는 부품이 알아서 한다 — 종이 조각·타륜 깃발·수첩. */
  function offerStamp(){
    if (!window.EGStamp || !sb) return;
    var body = $("dBody").value;
    rpc("diary_first_line", { p_body: body }).catch(function(){ return null; })
      .then(function(line){
        EGStamp.offer({ supa: sb, area: "vesper", kind: "ves_scribere",
                        inscription: line || null,
                        bottom: 96 });      /* 조작판 위로 올린다 */
      });
  }

  function loadDiary(){
    if (D.loaded) return Promise.resolve();
    D.day = todayKey();
    var jobs = [ rpc("get_my_diary", { p_day:D.day }).catch(function(){ return []; }),
                 rpc("get_diary_seed", {}).catch(function(){ return []; }) ];
    if (sb) jobs.push(sb.auth.getUser().then(function(r){
        var u = r && r.data && r.data.user; if (!u) return null;
        return sb.from("users").select("nickname").eq("id", u.id).maybeSingle()
                 .then(function(x){ return (x.data && x.data.nickname) || null; }).catch(function(){ return null; });
      }).catch(function(){ return null; }));
    return Promise.all(jobs).then(function(res){
      var mine = res[0] || [], seed = (res[1] || [])[0] || null, nick = res[2] || null;
      D.nick = nick || "";
      /* 오늘 쓰던 초안이 있으면 그것을 이어 쓴다. 다 저장했으면 새 편을 연다. */
      var open = null;
      for (var i = 0; i < mine.length; i++) if (mine[i].status === "draft") open = mine[i];
      if (open){
        D.seq = open.seq; D.seed = open.seed_id; D.seedText = "";
        paintPalette(open.palette);
        $("dBody").value = open.body || "";
      }else{
        D.seq = mine.length + 1;
        D.seed = seed ? seed.id : null;
        D.seedText = seed ? seed.line : "";
        paintPalette(1 + Math.floor(Math.random() * 12));     /* 태어날 때 한 번 (소로: 열 때마다 랜덤) */
        $("dBody").value = D.seedText;
      }
      $("dDate").textContent = dayLabel(D.day, D.seq);
      $("dWho").textContent  = D.nick ? D.nick + "의 베스페르" : "나의 베스페르";
      WT.sec = open ? (+open.write_sec || 0) : 0;    /* 이어 쓰던 초안이면 그때까지 쓴 시간을 이어받는다 */
      WT.last = 0;
      paintGhost(); paintCount();
      D.loaded = true;
    }).catch(function(e){
      console.warn("[EG] 일기 불러오기 실패:", e);
      paintPalette(1 + Math.floor(Math.random() * 12));
      $("dDate").textContent = dayLabel(D.day, D.seq);
      $("dWho").textContent  = "나의 베스페르";
      D.loaded = true;
    });
  }

  /* ── 지난 일기 — 판을 벗어나지 않는다 (결정문 13호 · 우주 미아 방지) ── */
  /* 기간 다섯 — 모니터 아래 물리 버튼 (0817 소로 ③④) */
  var RANGES = { today:{ d:0,  ko:"오늘 일기" }, "7":{ d:7,  ko:"지난 7일" },
                 "30":{ d:30, ko:"지난 한 달" }, "90":{ d:90, ko:"지난 3개월" },
                 all:{ d:null, ko:"전체 보기" } };
  var RANGE = "7";
  function inRange(iso){
    var r = RANGES[RANGE]; if (!r || r.d === null) return true;
    var t = new Date(iso + "T00:00:00"), now = new Date(todayKey() + "T00:00:00");
    var gap = Math.round((now - t) / 86400000);
    return r.d === 0 ? gap === 0 : gap <= r.d;
  }
  function paintPast(){
    var box = $("dList"), title = (RANGES[RANGE] || {}).ko || "지난 일기";
    box.innerHTML = '<h4>' + title + '</h4><div class="empty">불러오는 중&hellip;</div>';
    rpc("get_my_diary_list", { p_offset:0, p_limit:50 }).then(function(rows){
      rows = (rows || []).filter(function(r){ return inRange(r.wrote_on); });
      if (!rows.length){
        box.innerHTML = '<h4>' + title + '</h4><div class="empty">'
          + (RANGE === "today" ? "오늘 저장한 일기가 아직 없습니다."
                               : "이 기간에 저장한 일기가 없습니다.") + '</div>';
        return;
      }
      var h = '<h4>' + title + ' <i style="font-style:normal;opacity:.6">' + rows.length + '편</i></h4>';
      rows.forEach(function(r){
        h += '<div class="dItem" data-d="' + r.wrote_on + '" data-s="' + r.seq + '">'
           + '<b>' + dayLabel(r.wrote_on, r.seq) + '</b>'
           + '<span>' + (r.head || "").replace(/[<>&]/g, "") + '</span>'
           + '<span><i>' + (r.place || "") + '</i></span>'
           + '<span><i>' + statLine(r.chars || 0, +r.write_sec || +r.span_sec || 0) + '</i></span></div>';
      });
      box.innerHTML = h;
    }).catch(function(){
      box.innerHTML = '<h4>지난 일기</h4><div class="empty">지금은 불러올 수 없습니다.</div>';
    });
  }
  /* ── 지난 한 편을 판에 띄운다 (0817 소로 신고 — 목록에 클릭 배관이 없었다) ── */
  function openEntry(day, seq){
    return rpc("get_my_diary", { p_day:day }).then(function(rows){
      var e = null; (rows || []).forEach(function(r){ if (+r.seq === +seq) e = r; });
      if (!e){ note("그 일기를 찾지 못했습니다"); return; }
      if (D.dirty) saveDiary(D.viewing ? "saved" : "draft");
      D.viewing = { day:day, seq:+seq };
      D.day = day; D.seq = +seq; D.seed = e.seed_id; D.seedText = "";   /* 이미 쓴 글이라 힌트는 없다 */
      D.dirty = false;
      paintPalette(e.palette);                                          /* 그날 그 색 그대로 */
      $("dBody").value = e.body || "";
      $("dDate").textContent = dayLabel(day, +seq);
      $("dWho").textContent  = D.nick ? D.nick + "의 베스페르" : "나의 베스페르";
      $("dSun").textContent  = e.place || "\u00a0";                      /* 그때 어디였는지 */
      /* ⭐ 소요시간 · 글자수 · 분당 (0817 소로) — 옛 글은 write_sec 이 없을 수 있어 근사로 받는다 */
      WT.sec = +e.write_sec || Math.max(0,
        (new Date(e.updated_at) - new Date(e.created_at)) / 1000);
      WT.last = 0;                                                      /* 이어 쓰면 그때부터 다시 잰다 */
      $("dAlt").textContent = statLine((e.body || "").length, WT.sec);
      $("mon").classList.add("viewing");
      closePast();
      paintGhost(); paintCount();
    }).catch(function(){ note("지금은 열 수 없습니다"); });
  }
  function backToToday(){
    if (D.dirty) saveDiary("saved");
    D.viewing = null; D.loaded = false;
    $("mon").classList.remove("viewing");
    $("dSun").textContent = "\u00a0"; $("dAlt").textContent = "";
    loadDiary().then(function(){ $("dBody").focus(); });
  }
  function closePast(){
    $("mon").classList.remove("past");
    $("dPast").querySelector("small").innerHTML = "지난 일기 &rsaquo;";
  }
  $("dToday").onclick = backToToday;
  /* 물리 버튼 다섯 — 누르면 그 기간 목록이 판 안에서 열린다 */
  $("vBar").addEventListener("click", function(e){
    var b = e.target.closest(".vb"); if (!b) return;
    RANGE = b.getAttribute("data-r");
    Array.prototype.forEach.call($("vBar").querySelectorAll(".vb"), function(x){
      x.classList.toggle("on", x === b);
    });
    if (!$("mon").classList.contains("on")) setDiary(true);
    if (D.dirty) saveDiary(D.viewing ? "saved" : "draft");
    $("mon").classList.add("past");
    $("dPast").querySelector("small").innerHTML = "덮기 &rsaquo;";
    paintPast();
  });
  $("dList").addEventListener("click", function(e){
    var it = e.target.closest(".dItem");
    if (it) openEntry(it.getAttribute("data-d"), it.getAttribute("data-s"));
  });

  $("dPast").onclick = function(){
    var on = !$("mon").classList.contains("past");
    $("mon").classList.toggle("past", on);
    /* ⚠ 닫는 말은 「덮기」다. 「오늘로」는 지난 일기를 볼 때만 쓰는 말이라
       머리의 dToday 하나로 모았다 — 같은 말이 두 곳에 서면 어느 쪽이 진짜인지 모른다 */
    $("dPast").querySelector("small").innerHTML = on ? "덮기 &rsaquo;" : "지난 일기 &rsaquo;";
    if (on){ if (D.dirty) saveDiary(D.viewing ? "saved" : "draft"); paintPast(); }
    else   { $("dBody").focus(); }
  };

  /* ── 판 끌어 옮기기 (0817 소로 ①) ──
     ⚠ 화면 밖으로 나가면 못 돌아온다. 가장자리를 문다. 옮긴 곳은 이 브라우저가 기억한다. */
  (function dragMon(){
    var hd = $("monHead"), mo = $("mon"), on = false, sx = 0, sy = 0, ox = 0, oy = 0;
    function clamp(){
      var r = mo.getBoundingClientRect();
      var x = Math.max(8, Math.min(innerWidth  - r.width  - 8, parseFloat(mo.style.left) || 0));
      var y = Math.max(8, Math.min(innerHeight - r.height - 8, parseFloat(mo.style.top)  || 0));
      mo.style.left = x + "px"; mo.style.top = y + "px";
    }
    hd.addEventListener("pointerdown", function(e){
      if (e.target.closest("#monX")) return;
      on = true; sx = e.clientX; sy = e.clientY;
      ox = parseFloat(mo.style.left) || mo.getBoundingClientRect().left;
      oy = parseFloat(mo.style.top)  || mo.getBoundingClientRect().top;
      mo.classList.add("drag"); hd.classList.add("grabbing");
      hd.setPointerCapture(e.pointerId);
    });
    hd.addEventListener("pointermove", function(e){
      if (!on) return;
      mo.style.left = (ox + e.clientX - sx) + "px";
      mo.style.top  = (oy + e.clientY - sy) + "px";
    });
    function up(){
      if (!on) return;
      on = false; mo.classList.remove("drag"); hd.classList.remove("grabbing"); clamp();
      try{ localStorage.setItem("eg_vesper_pos",
        JSON.stringify({ x:parseFloat(mo.style.left), y:parseFloat(mo.style.top) })); }catch(e){}
    }
    hd.addEventListener("pointerup", up);
    hd.addEventListener("pointercancel", up);
    EGV_on("resize", function(){ if ($("mon").classList.contains("on")) clamp(); });
    window._vesperPos = function(){
      try{
        var p = JSON.parse(localStorage.getItem("eg_vesper_pos") || "null");
        if (p && isFinite(p.x) && isFinite(p.y)){ mo.style.left = p.x + "px"; mo.style.top = p.y + "px"; clamp(); return true; }
      }catch(e){}
      return false;
    };
  })();

  function setDiary(open){
    $("mon").classList.toggle("on", open);
    if (open){
      layoutFrames();
      if (window._vesperPos) window._vesperPos();     /* 지난번에 옮겨 둔 곳이 있으면 거기로 */
      loadDiary().then(function(){ setTimeout(function(){
        var t = $("dBody"); t.focus();
        try{ t.setSelectionRange(t.value.length, t.value.length); }catch(e){}   /* 첫 문장 끝에서 이어 쓴다 */
      }, 380); });
    }else{
      if (D.dirty) saveDiary(D.viewing ? "saved" : "draft");   /* ⚠ 닫을 때 반드시 남긴다 */
      /* ⚠⚠ 0817 소로 — 판을 닫아도 textarea 가 포커스를 쥐고 있어 단축키가 통째로 죽었다.
         안 보이는 요소도 포커스는 붙들고 있다. 판을 덮을 때 손도 함께 뗀다. */
      try{ $("dBody").blur(); ROOT.focus(); }catch(e){}
      /* ⚠ 잠깐 열렸다 닫히는 화면에서는 놓아둔 도장을 거둔다.
         나무라지 않고 조용히 — 다음에 저장하면 또 놓인다(3호). */
      try{ if (window.EGStamp && EGStamp.withdraw) EGStamp.withdraw(); }catch(e){}
    }
  }
  $("homeBtn").onclick = function(){ setDiary(!$("mon").classList.contains("on")); };
  $("monX").onclick    = function(){ setDiary(false); };
  $("dBody").oninput   = touched;
  $("dBody").onscroll  = function(){ $("dGhost").scrollTop = this.scrollTop; };
  $("dTemp").onclick   = function(){ saveDiary("draft"); };
  $("dSave").onclick   = function(){
    saveDiary("saved").then(function(){
      if (D.dirty) return;                            /* 저장이 실패했으면 다음 편으로 안 넘어간다 */
      if (D.viewing){ note("고쳐 두었습니다"); return; }   /* 지난 일기는 그 자리에 그대로 */
      D.loaded = false; loadDiary();                  /* 다음 편 (2) 를 새 색으로 연다 */
    });
  };
  /* ⚠ 창을 닫거나 새로고침해도 남긴다 */
  EGV_on("beforeunload", function(){
    if (D.dirty && sb) saveDiary(D.viewing ? "saved" : "draft");
  });
  $("stop").onclick = stopAll;
  /* ⚠⚠ 0817 소로 — C·←→ 가 안 먹혔다. 키 처리부가 **남의 onclick 에 얹혀** 있었던 것이
     근본 약점이다. 배선이 한 줄이라도 어긋나면 키가 통째로 죽는다.
     ⭐ 이름 있는 함수로 꺼내 두고, 키는 이것을 **직접** 부른다.
        단추도 같은 함수를 쓰므로 둘이 갈릴 일이 없다 (0816 조항 ⑧). */
  window.egCabin = function toggleCabin(){
    var on = !$("plate").classList.contains("on");
    $("plate").classList.toggle("on", on); $("bCab").classList.toggle("on", on);
    ROOT.classList.toggle("cabin", on);      /* 기내에 붙은 물건들이 함께 걷힌다 */
    $("scrollHint").classList.toggle("on", on);
    $("homeInfo").classList.toggle("on", on);
    if (on) playAnnounce();
    /* ⚠ 기내를 꺼도 일기장은 안 닫는다 — 창밖 보러 나갔다 와도 쓰던 글이 그대로 (0817 소로) */
    if (on){ panY = 0; layoutFrames(); paintHomeIdle();
      setTimeout(function(){ $("scrollHint").classList.remove("on"); }, 4000);
      /* 기내를 켜면 테두리는 걷는다 — 창틀이 이미 제자리를 말한다 */
      $("frames").classList.remove("on"); $("bFr").classList.remove("on"); }
  };
  $("bCab").onclick = window.egCabin;
  window.egSwapSeat = swapSeat;
  $("bFr").onclick = function(){
    var on = !$("frames").classList.contains("on");
    $("frames").classList.toggle("on", on); $("bFr").classList.toggle("on", on);
    if (on) layoutFrames();
  };
  $("bDump").onclick = function(){
    var L = layoutFrames();
    var txt =
      "위도        " + $("lat").value + "\n" +
      "고도        " + $("alt").value + " km\n" +
      "해 높이     " + $("sel").value + " deg\n" +
      "항로        " + (mode==="SUN"?"해 추종":"대권 고정") + "\n" +
      "EG글자(왼) x " + LOGO_L.x.toFixed(2) + " · y " + LOGO_L.y.toFixed(2) +
        " · 크기 " + LOGO_L.s.toFixed(2) + " · 기울기 " + LOGO_L.rot.toFixed(1) + "\n" +
      "EG글자(오) x " + LOGO_R.x.toFixed(2) + " · y " + LOGO_R.y.toFixed(2) +
        " · 크기 " + LOGO_R.s.toFixed(2) + " · 기울기 " + LOGO_R.rot.toFixed(1) + "\n" +
      "계기판(왼)  x " + HOME_L.x.toFixed(2) + " · y " + HOME_L.y.toFixed(2) +
        " · w " + HOME_L.w.toFixed(2) + " · h " + HOME_L.h.toFixed(2) +
        " · 기울기 " + HOME_L.rot.toFixed(1) + " · 돌림Y " + HOME_L.ry.toFixed(1) + "\n" +
      "계기판(오)  x " + HOME_R.x.toFixed(2) + " · y " + HOME_R.y.toFixed(2) +
        " · w " + HOME_R.w.toFixed(2) + " · h " + HOME_R.h.toFixed(2) +
        " · 기울기 " + HOME_R.rot.toFixed(1) + " · 돌림Y " + HOME_R.ry.toFixed(1) + "\n" +
      "화면        " + L.vw + "x" + L.vh + " · 창 시야각 " + (halfFovX()*2).toFixed(1) + " deg\n" +
      "RAW " + JSON.stringify({HL:HOME_L,HR:HOME_R,LL:LOGO_L,LR:LOGO_R});
    console.log("[EG] 값 뽑기\n" + txt);
    /* ⚠ readOnly textarea 의 select() 는 조용히 실패한다 — 클립보드로 바로 (0817) */
    var done = function(ok){
      $("bDump").textContent = ok ? "복사됨 ✓" : "콘솔에 찍음";
      setTimeout(function(){ $("bDump").textContent = "값 뽑기"; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt).then(function(){ done(true); })
        .catch(function(){ fallbackCopy(txt, done); });
    } else fallbackCopy(txt, done);
  };
  function fallbackCopy(txt, done){
    try{
      var ta = document.createElement("textarea");
      ta.value = txt;
      ta.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta); done(ok);
    }catch(e){ done(false); }
  }
  $("go").onclick = function(){
    stopAll();
    var lat = +$("lat").value, lon = sunLonAt(lat, +$("sel").value);
    if (lon === null) return;
    var alt = (+$("alt").value)*1000, HF = halfFovX();
    var altEnd = (+$("aEnd").value)/10*1000, descSec = (+$("aMin").value)*60;
    var wT = 0, lastRelShown = alt, lastRelAt = 0;   /* 하강 속도 셈용 */
    flight = cruise(lat, lon, { alt:alt, pitch:+$("pit").value, sky:+$("pit").value,
      altEnd:altEnd, descSec:descSec,
      onTick: function(sec, la, lo, brg, look, sun, dist, rel, pit){
        $("barIn").style.width = Math.min(sec/FLIGHT_SEC*100,100)+"%";
        if (sec - wT > 1){ wT = sec;
          var wx = EGGeo.where(la, lo);
          $("where").textContent = wx;
          $("mini").textContent = wx + "   ·   " + Math.round(dist) + " km";
          $("hiWhere").textContent = wx;
          VNOW.place = wx;                          /* 일기에 함께 적힐 곳 */
        }
        /* 홈 계기판 — 남은 시간은 30분 고정 (결정문 6호) */
        var left = Math.max(0, FLIGHT_SEC - sec);
        $("hiAlt").textContent = Math.round(rel).toLocaleString() + " m";
        var vs = (rel - lastRelShown)/Math.max(sec - lastRelAt, 0.5);   /* m/s */
        if (sec - lastRelAt > 0.9){
          $("hiVs").textContent = Math.abs(vs) < 0.3 ? "· 수평"
            : "· " + (vs<0 ? "&#8600; " : "&#8599; ").replace("&#8600; ","\u2198 ").replace("&#8599; ","\u2197 ")
              + Math.abs(vs*60).toFixed(0) + " m/분";
          lastRelShown = rel; lastRelAt = sec;
        }
        $("hiPos").textContent = fm(la,3) + ", " + fm(lo,3);
        $("hiElapsed").textContent = mmss(sec);
        /* ── EG베스페르 발 — 「일몰까지」와 고도·비행거리 (0817) ── */
        VNOW.la = la; VNOW.lo = lo; VNOW.rel = rel; VNOW.dist = dist;
        if (sec - VNOW.at > 0.9){
          var elNow = sun ? Cesium.Math.toDegrees(sun.el) : null;
          if (elNow != null){
            if (VNOW.el != null && sec > VNOW.at){
              var rate = (elNow - VNOW.el) / (sec - VNOW.at);        /* 도/초 */
              if (rate < -1e-5 && elNow > -0.83){
                VNOW.sunLeft = (elNow + 0.83) / -rate;               /* −0.83° = 해가 지평선에 걸리는 각 */
              }else if (elNow <= -0.83){ VNOW.sunLeft = 0; }
            }
            VNOW.el = elNow;
          }
          VNOW.at = sec;
          $("dSun").textContent = VNOW.sunLeft == null ? "\u00a0"
            : (VNOW.sunLeft > 0 ? "일몰까지 " + mmss(VNOW.sunLeft) : "해가 졌습니다");
          $("dAlt").textContent = (rel/1000).toFixed(1) + " km \u00b7 " + Math.round(dist) + " km 비행";
        }
        $("hiLeft").textContent = left > 0 ? mmss(left) : "착륙";
        var az = deg(sun.az), el = Cesium.Math.toDegrees(sun.el);
        var dif = ((az - look + 540)%360)-180;
        var m = Math.floor(sec/60), ss = Math.floor(sec%60);
        $("tel").innerHTML =
          "경과 <b>" + m + "분 " + (ss<10?"0":"") + ss + "초</b> · 이동 <b>"
            + dist.toFixed(0) + " km</b><br>" +
          ($("dAlt").textContent = (rel/1000).toFixed(1) + " km · " + Math.round(dist) + " km 비행") &&
          "고도 <b>" + (rel/1000).toFixed(2) + " km</b>"
            + (altMode==="DSC" ? " <span style='color:#c9a86a'>&#8600;</span>" : "")
            + " · 내림각 <b>" + fm(pit,2) + "&deg;</b> · 지면 " + Math.round(groundH) + "m<br>" +
          "위치 <b>" + fm(la,3) + ", " + fm(lo,3) + "</b><br>" +
          "진행 <b>" + fm(brg,1) + "&deg;</b> · 보는 쪽 <b>" + fm(look,1) + "&deg;</b><br>" +
          "&#9788; 방위 <b>" + fm(az,1) + "&deg;</b> · 고도 <b>" + fm(el,1) + "&deg;</b><br>" +
          "<span style='color:" + (Math.abs(dif)<=HF?"#c9a86a":"#e07a5f") + "'>" +
          (Math.abs(dif)<=HF ? "해가 창 안 (중앙에서 " + fm(dif,1) + "&deg;)"
                             : "해가 창 밖 (" + fm(dif,1) + "&deg; · 한계 " + fm(HF,1) + "&deg;)")
          + "</span>";
      }});
  };
  /* 판 밀기 — 휠·드래그·화살표. 기내가 켜져 있을 때만 */
  function panBy(dy){
    if (!$("plate").classList.contains("on")) return;
    panY = Math.max(panMin, Math.min(panMax, panY + dy));
    layoutFrames();
  }
  EGV_on("wheel", function(e){
    if (!$("plate").classList.contains("on")) return;
    if ($("mon").classList.contains("on")) return;      /* 일기장 열려 있으면 두지 않는다 */
    e.preventDefault(); panBy(-e.deltaY * 0.9);
  }, { passive:false });
  var dragY = null;
  EGV_on("pointerdown", function(e){
    if (!$("plate").classList.contains("on")) return;
    if (e.target.closest("#hud,#mon,#tab")) return;
    dragY = e.clientY;
  });
  EGV_on("pointermove", function(e){
    if (dragY === null) return;
    panBy(e.clientY - dragY); dragY = e.clientY;
  });
  EGV_on("pointerup", function(){ dragY = null; });
  EGV_on("resize", function(){ layoutFrames(); });

  loadTune();
  setAltMode(true); setPitMode(true); syncHomeEditor(); syncLogoEditor();
  layoutFrames();
  preview();
  paintHomeIdle();

  /* ═══ 0817 소로 ⑥⑦ — 들어서면 곧바로 난다 ═══
     손님은 조종간을 만지러 온 것이 아니다. 땅을 찾고, 기내를 켜고, 비행을 시작한 상태로 만난다.
     ⚠ 조종간(H)은 접힌 채로 있고 살롱지기가 필요할 때만 편다. */
  console.log("[EG] vesper init 완주 \u2014 단축키 준비:", !!window.__egKeysReady,
              "· 기내여닫이:", typeof window.egCabin);

  (function autoStart(){
    try{
      var p = EGGeo.pickSunsetLand(sunLonAt, +$("sel").value);      /* 지금 일몰선에서 땅 (결정문 21호) */
      if (p){ $("lat").value = p.lat; $("latV").textContent = p.lat + "\u00B0"; }
      preview();
      if (!$("plate").classList.contains("on")) $("bCab").click();   /* 기내를 켠다 (안내 방송도 함께) */
      setTimeout(function(){ $("go").click(); }, 60);                /* 곧바로 비행 */
    }catch(err){ console.warn("[EG] 자동 출발 실패 — 조종간으로 시작하십시오:", err); }
  })();

  grabFocus();          /* 그물 — 아래 설명 */
  EGV_on("resize", layoutFrames);
  return true;
}

/* ══ 방을 세우고 걷는 일 ══════════════════════════════════════════════ */

function mountStyle(){
  if (STYLED) return;
  var st = document.createElement("style");
  st.id = "vesperRoomStyle";
  st.textContent = CSS;
  document.head.appendChild(st);
  STYLED = true;
}

function mountHtml(){
  ROOT = document.createElement("div");
  ROOT.id = "vesperRoom";
  ROOT.tabIndex = -1;                 /* ⭐ 포커스를 받을 수 있어야 grabFocus 가 든다 */
  ROOT.innerHTML = HTML;
  document.body.appendChild(ROOT);
}

/* ⚠ 되돌리기 ① — terra 카메라.
   방은 매 프레임 setView 로 카메라를 쥔다. 놓을 때 원래 있던 곳으로 정확히
   돌려놓지 않으면 손님은 방을 나오자마자 엉뚱한 하늘에 떨어진다. */
function saveCam(v){
  try{
    CAM = { pos: v.camera.position.clone(),
            heading: v.camera.heading, pitch: v.camera.pitch, roll: v.camera.roll };
  }catch(e){ CAM = null; }
}
function restoreCam(v){
  if (!CAM || !v) return;
  try{
    v.camera.setView({ destination: CAM.pos,
      orientation:{ heading:CAM.heading, pitch:CAM.pitch, roll:CAM.roll } });
  }catch(e){}
  CAM = null;
}

function enter(hostViewer){
  if (!hostViewer){ console.error("[EG] 베스페르 — viewer 를 못 받았습니다."); return false; }
  if (ROOT) leave();                  /* 남아 있으면 먼저 걷는다 */
  mountStyle();
  mountHtml();
  saveCam(hostViewer);
  var ok = false;
  try{ ok = bootRoom(hostViewer); }
  catch(err){ console.error("[EG] 베스페르 착석 실패:", err); leave(); return false; }
  console.log("[EG] 베스페르 방 — terra 의 지구를 그대로 씁니다. root 추가 없음.");
  return ok;
}

function leave(){
  var v = (typeof viewer !== "undefined") ? viewer : null;
  /* ⚠ 순서가 중요하다 — stopAll 은 $("barIn") 을 만진다. 방을 지운 뒤 부르면 터진다.
     그리고 저장이 가장 먼저다. 손님이 쓴 것을 잃는 일만은 없어야 한다. */
  try{ if (typeof D !== "undefined" && D && D.dirty && typeof saveDiary === "function")
         saveDiary(D.viewing ? "saved" : "draft"); }catch(e){}
  try{ if (typeof stopAll === "function") stopAll(); }catch(e){}
  EGV_off();
  restoreCam(v);
  if (ROOT){ try{ ROOT.remove(); }catch(e){} ROOT = null; }
  try{ document.body.classList.remove("cabin","edit"); }catch(e){}
  console.log("[EG] 베스페르 방을 걷었습니다 — 카메라를 terra 로 되돌렸습니다.");
}

window.egVesper = { enter: enter, leave: leave, version: "0818a" };
})();
