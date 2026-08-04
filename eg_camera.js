/* ============================================================
 *  eg_camera.js  v1.2 — 0804
 *  「들어서는 3초」 — 천장에서 시작해 바닥을 스치고 목표에 안착한다.
 *
 *  왜 있는가:
 *    홀·전시실 그림은 9:16 세로다. 그런데 도착하자마자 스크린(또는 액자)이
 *    화면 한가운데 앉으면, 손님은 그 그림에 천장이 있다는 사실조차 모른다.
 *    소로가 스무 장에 넣은 유리 볼트·금박 코니스·프레스코가 통째로 화면 밖이다.
 *    이 부품은 장식이 아니라 그 그림들을 살리는 유일한 길이다.
 *
 *  쓰는 곳:
 *    미술관 galerie.html  → 목표 = frame_rect (액자 자리)
 *    음악관 concert.html  → 목표 = screen_rect (무대 스크린)
 *    자리만 다르고 움직임은 같다.
 *
 *  쓰는 법:
 *    EGCamera.enter({
 *      box:'#hall', fit:'#hallFit', ratio:941/1672,
 *      rect:{L,T,W,H},            // % 단위
 *      onDone(){ ... }            // 안착한 뒤 (도장·재생버튼 등)
 *    });
 *    EGCamera.settle(opts)        // 움직임 없이 목표에 바로 앉힌다
 *    EGCamera.relayout()          // 창 크기가 바뀌었을 때
 *
 *  ⚠ 세 가지 원칙
 *    ① 되돌아오지 않는다 — 바닥에 머무르지 않고 그대로 목표로 올라온다
 *    ② 언제든 건너뛴다 — 매일 들르는 곳이다. 세 번째부터 3초는 길다
 *    ③ 끝나면 손을 뗀다 — 손님이 다시 위아래로 훑을 수 있어야 한다
 * ============================================================ */
(function(){
"use strict";

var S = null;          /* 지금 도는 판 */
var raf = 0;
var hintEl = null;

function $(s){ return typeof s === 'string' ? document.querySelector(s) : s; }
function clamp(v,a,b){ return v<a?a:(v>b?b:v); }

/* 감속 곡선 — 사람 눈은 등속을 기계로 읽는다 */
function easeInOut(t){ return t<0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; }
function easeOut(t){ return 1-Math.pow(1-t,3); }

/* ── 판짜기 ────────────────────────────────────────────────
   concert.html의 fitHall과 같은 규칙을 따르되, 배율 한 겹을 얹는다.
   z=1이 곧 옛 fitHall이므로 눈에 보이는 기본 크기는 달라지지 않는다. */
function layout(z, focusY, anchor){
  var vw = innerWidth, vh = innerHeight;
  var R = S.ratio;
  var baseW = baseWidth(vw, vh, R);
  var w = baseW*z, h = w/R;

  S.fit.style.width  = w + 'px';
  S.fit.style.height = h + 'px';
  S.fit.style.marginLeft = ((vw - w)/2) + 'px';     /* 넘치면 음수 — 가로는 숨김 처리 */
  var mt = h < vh ? (vh - h)/2 : 0;
  S.fit.style.marginTop = mt + 'px';

  var top = focusY*h + mt - vh*anchor;
  var max = Math.max(0, h + mt - vh);
  S.box.scrollTop = clamp(top, 0, max);
  S.z = z; S.focusY = focusY; S.anchor = anchor;
}

/* ⭐⭐ 기본 판 폭 — 폭은 언제나 화면을 채운다. 이것이 이 우주의 규칙이다.
   concert.html의 fitHall과 한 글자도 다르지 않다.

   ⚠ 0804에 파이스가 가로 화면에서 「세로 기둥」으로 세우는 안을 냈다가 소로가 물렀다.
     미술관은 **그림 위아래가 잘리고 스크롤로 공간감이 나오는** 곳이다.
     노트북에서 좌우가 날아간 그림은 금지. 위아래가 잘리는 것은 설계다. */
function baseWidth(vw, vh, R){
  return (vw/vh < R) ? Math.max(vh*R, vw) : vw;
}

/* ⭐ 배율은 1로 고정한다.
   폭이 이미 화면을 꽉 채우고 있으므로, 여기서 조금이라도 확대하면 그 순간 좌우가 잘린다.
   「줌인」과 「좌우 날아감」이 같은 말이다.
   그리고 확대할 까닭도 없다 — 1440×900에서 액자 하나가 이미 화면 세로의 101%다.
   압도적 공간감은 자연 배율에서 그냥 나온다. 카메라가 하는 일은 훑는 움직임 하나뿐이다.

   opts.maxZoom을 주면 올릴 수 있으나, 올리는 만큼 좌우가 잘린다는 뜻임을 알고 줄 것. */
function targetZoom(){
  var mz = S.maxZoom || 1;
  if(mz <= 1) return 1;
  var vw = innerWidth, vh = innerHeight, R = S.ratio;
  var baseW = baseWidth(vw, vh, R), baseH = baseW/R;
  var r = S.rect;
  return clamp(Math.min((0.72*vh*100)/(r.H*baseH), (0.98*vw*100)/(r.W*baseW)), 1, mz);
}
function frameY(){ return (S.rect.T + S.rect.H/2)/100; }

/* ── 힌트 ── */
function showHint(){
  if(!S.hint) return;
  hintEl = document.createElement('div');
  hintEl.id = 'egCamHint';
  hintEl.textContent = '건너뛰기';
  hintEl.style.cssText =
    'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:30;'+
    'font:400 11.5px/1 inherit;letter-spacing:.14em;color:rgba(255,255,255,.42);'+
    'pointer-events:none;opacity:0;transition:opacity .5s;';
  document.body.appendChild(hintEl);
  setTimeout(function(){ if(hintEl) hintEl.style.opacity='1'; }, 500);
  setTimeout(function(){ if(hintEl) hintEl.style.opacity='0'; }, 2400);
}
function killHint(){
  if(!hintEl) return;
  var el = hintEl; hintEl = null;
  el.style.opacity = '0';
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 500);
}

/* ── 끝내기 ── */
function finish(){
  if(!S || S.done) return;
  S.done = true;
  cancelAnimationFrame(raf);
  detachSkip();
  killHint();
  layout(targetZoom(), frameY(), 0.5);
  S.box.style.overflowY = S.prevOverflow || '';     /* 손을 뗀다 */
  if(typeof S.onDone === 'function'){ try{ S.onDone(); }catch(e){ console.warn('[EGCamera] onDone', e); } }
}

/* ── 건너뛰기 ── */
var skipEvents = ['pointerdown','wheel','touchstart','keydown'];
function onSkip(e){
  if(e.type === 'keydown' && ['Tab','Shift','Control','Alt','Meta'].indexOf(e.key) >= 0) return;
  finish();
}
function attachSkip(){
  skipEvents.forEach(function(t){
    window.addEventListener(t, onSkip, {passive:true, capture:true});
  });
}
function detachSkip(){
  skipEvents.forEach(function(t){
    window.removeEventListener(t, onSkip, {capture:true});
  });
}

/* ── 본 동작 ──────────────────────────────────────────────
   ①  0.00 ~ 1.80  천장에서 아래로. 벽을 지나 바닥을 스친다
   ②  1.80 ~ 3.00  바닥에서 그림으로 되올라오며 줌인
   바닥에 머무르지 않는다 — 머무르면 「되돌아오는 길」이 되고,
   스치면 「눈이 멎는 것」이 된다.                              */
var T_DOWN = 1800, T_UP = 1200;
var Y_TOP = 0.045, Y_FLOOR = 0.965;

function enter(opts){
  var box = $(opts.box), fit = $(opts.fit);
  if(!box || !fit){ console.warn('[EGCamera] 상자를 찾지 못했습니다'); return; }
  if(!opts.rect){ console.warn('[EGCamera] rect가 없습니다'); return; }

  S = { box:box, fit:fit, ratio:opts.ratio || (1080/1920), rect:opts.rect,
        onDone:opts.onDone, hint: opts.hint !== false, done:false, maxZoom: opts.maxZoom || 1,
        prevOverflow: box.style.overflowY, z:1, focusY:0, anchor:0.5 };

  /* 움직임을 원치 않는 손님 · 아주 짧은 화면은 그냥 앉힌다 */
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce || opts.instant){ settle(opts); return; }

  var z1 = targetZoom(), yF = frameY();
  var z0 = 1;                                     /* 배율은 보통 1 그대로다 */

  box.style.overflowY = 'hidden';                 /* 도는 동안은 손님 스크롤을 막는다 */
  layout(z0, Y_TOP, 0.5);
  attachSkip();
  showHint();

  var t0 = performance.now();

  function step(now){
    if(!S || S.done) return;
    var t = now - t0;
    if(t < T_DOWN){
      var k = easeInOut(t/T_DOWN);
      layout(z0, Y_TOP + (Y_FLOOR-Y_TOP)*k, 0.5);
    }else if(t < T_DOWN + T_UP){
      var k2 = easeOut((t-T_DOWN)/T_UP);
      layout(z0 + (z1-z0)*k2, Y_FLOOR + (yF-Y_FLOOR)*k2, 0.5);
    }else{
      finish(); return;
    }
    raf = requestAnimationFrame(step);
  }
  raf = requestAnimationFrame(step);
}

/* 움직임 없이 목표에 바로 앉힌다 */
function settle(opts){
  if(opts){
    var box = $(opts.box), fit = $(opts.fit);
    if(!box || !fit || !opts.rect) return;
    S = { box:box, fit:fit, ratio:opts.ratio || (1080/1920), rect:opts.rect,
          onDone:opts.onDone, hint:false, done:true, prevOverflow:box.style.overflowY,
          maxZoom: opts.maxZoom || 1, z:1, focusY:0, anchor:0.5 };
  }
  if(!S) return;
  S.done = true;
  cancelAnimationFrame(raf); detachSkip(); killHint();
  layout(targetZoom(), frameY(), 0.5);
  S.box.style.overflowY = S.prevOverflow || '';
  if(opts && typeof opts.onDone === 'function'){ try{ opts.onDone(); }catch(e){} }
}

/* 창 크기가 바뀌면 보던 곳을 지키며 다시 판을 짠다.
   ⚠ 돌고 있는 중이면 손대지 않는다 — 다음 프레임이 어차피 다시 그린다 */
function relayout(){
  if(!S) return;
  if(!S.done) return;
  var h = S.fit.getBoundingClientRect().height || 1;
  var mt = parseFloat(S.fit.style.marginTop) || 0;
  var keep = (S.box.scrollTop + innerHeight*0.5 - mt) / h;   /* 지금 화면 한가운데가 그림의 어디였나 */
  layout(targetZoom(), clamp(keep, 0, 1), 0.5);
}

window.EGCamera = { enter:enter, settle:settle, relayout:relayout,
                    get running(){ return !!(S && !S.done); } };
console.log('%c[EG] eg_camera v1.2 · 0804 천장→바닥→그림 · 폭 고정', 'color:#c9a24a');
})();
