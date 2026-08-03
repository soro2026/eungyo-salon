/* ────────────────────────────────────────────────────────────────
   EG Credencial — 도장 놓기 · 누르기
   0803 · 결정문 3호(손님이 누른다) · 4호(찍는 곳과 보는 곳을 떼어놓는다)

   쓰는 법 — 그 우주의 파일에 두 줄:
     <script src="stamp_press.js"></script>
     EGStamp.offer({ supa, area:'musica' });

   더 줄 수 있는 것:
     kind        판 코드를 직접 지정 (안 주면 그 우주의 입국 도장을 찾는다)
     subject     대상 키 (별 id · 지명 코드 · 기수:회차)
     inscription 각인에 새길 말 (곡명 · 책 제목 · 지명)
     onPressed   찍힌 뒤 부를 것
     bottom      화면 아래에서 띄울 높이(px). 그 우주에 이미 뭔가 앉아 있을 때

   ⚠ 지켜야 할 것
   - 저절로 안 찍는다. 놓아두기만 하고 누르는 것은 손님이다(3호).
   - 안 눌러도 아무 손해가 없다. 재촉하는 말을 띄우지 않는다.
   - 누른 뒤 수첩을 열지 않는다. 잉크 자국만 잠깐 떴다 사라진다(4호).
   - 개수·진행률을 절대 말하지 않는다(2호·5호).
   - 이미 가진 도장이면 아무것도 안 나타난다. 「이미 받으셨습니다」도 안 띄운다.
   ──────────────────────────────────────────────────────────────── */
(function(){
"use strict";
if (window.EGStamp) return;

var CSS = ''
+ '#egStampDock{position:fixed;right:18px;bottom:18px;z-index:2147483000;'
+ '  display:none;flex-direction:column;align-items:center;gap:7px;'
+ '  font-family:"Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif}'
+ '#egStampDock.on{display:flex;animation:egSlip .45s cubic-bezier(.32,.72,0,1)}'
+ '#egStampBtn{width:82px;height:82px;border-radius:50%;border:0;cursor:pointer;padding:0;'
+ '  background:#FDFCFA;box-shadow:0 8px 22px rgba(0,0,0,.34);position:relative;'
+ '  display:grid;place-items:center;transition:transform .18s ease}'
+ '#egStampBtn:hover{transform:translateY(-3px) scale(1.04)}'
+ '#egStampBtn:active{transform:translateY(0) scale(.96)}'
+ '#egStampBtn[disabled]{opacity:.5;cursor:default}'
+ '#egStampBtn i{display:block;width:60px;height:60px;background:currentColor;'
+ '  -webkit-mask-size:contain;mask-size:contain;-webkit-mask-repeat:no-repeat;'
+ '  mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center;'
+ '  mix-blend-mode:multiply;opacity:.82}'
+ '#egStampDock .cap{font-size:11.5px;letter-spacing:.06em;color:#FDFCFA;'
+ '  background:rgba(24,20,16,.72);padding:4px 11px;border-radius:12px;white-space:nowrap}'
+ '#egStampFlash{position:fixed;inset:0;z-index:2147483001;display:none;'
+ '  place-items:center;pointer-events:none}'
+ '#egStampFlash.on{display:grid}'
+ '#egStampFlash i{display:block;width:min(300px,62vw);height:min(300px,62vw);'
+ '  background:currentColor;-webkit-mask-size:contain;mask-size:contain;'
+ '  -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;'
+ '  -webkit-mask-position:center;mask-position:center;'
+ '  animation:egPress 1.5s cubic-bezier(.2,.85,.25,1.15) forwards}'
+ '@keyframes egPress{0%{transform:rotate(var(--r)) scale(2.1);opacity:0}'
+ '  14%{opacity:var(--a)}62%{transform:rotate(var(--r)) scale(1);opacity:var(--a)}'
+ '  100%{transform:rotate(var(--r)) scale(1);opacity:0}}'
+ '@keyframes egSlip{from{transform:translateX(26px);opacity:0}to{transform:none;opacity:1}}'
+ '@media (prefers-reduced-motion:reduce){'
+ '  #egStampDock.on{animation:none}#egStampBtn{transition:none}'
+ '  #egStampFlash i{animation:egFade 1.2s linear forwards}'
+ '  @keyframes egFade{0%,70%{opacity:var(--a)}100%{opacity:0}}}'
+ '@media (max-width:640px){#egStampDock{right:12px;bottom:12px}'
+ '  #egStampBtn{width:70px;height:70px}#egStampBtn i{width:50px;height:50px}}';

function mount(){
  if (document.getElementById('egStampDock')) return;
  var st = document.createElement('style'); st.textContent = CSS;
  document.head.appendChild(st);
  var d = document.createElement('div');
  d.id = 'egStampDock';
  d.innerHTML = '<button id="egStampBtn" type="button"><i></i></button>'
              + '<span class="cap"></span>';
  document.body.appendChild(d);
  var f = document.createElement('div');
  f.id = 'egStampFlash'; f.innerHTML = '<i></i>';
  document.body.appendChild(f);
}

function flash(art, ink){
  var f = document.getElementById('egStampFlash'), i = f.firstChild;
  var rot = (Math.random()*20 - 10).toFixed(1);
  i.style.color = ink;
  i.style.setProperty('--r', rot + 'deg');
  i.style.setProperty('--a', (0.72 + Math.random()*0.18).toFixed(2));
  i.style.webkitMaskImage = "url('" + art + "')";
  i.style.maskImage = "url('" + art + "')";
  f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
  setTimeout(function(){ f.classList.remove('on'); }, 1600);
}

async function offer(opt){
  opt = opt || {};
  var supa = opt.supa;
  if (!supa) { console.warn('[EGStamp] supa 없이 부를 수 없습니다'); return; }

  try{
    var ses = await supa.auth.getSession();
    var user = ses && ses.data && ses.data.session && ses.data.session.user;
    if (!user) return;                       /* 손님이 아니면 조용히 물러난다 */

    /* 판 찾기 — kind를 주면 그것, 안 주면 그 우주의 입국 도장 */
    var q = supa.from('stamp_kinds')
      .select('code,title,art_url,ink,rules,family,area,active,opens_at,closes_at')
      .eq('active', true).not('art_url', 'is', null).limit(1);
    q = opt.kind ? q.eq('code', opt.kind)
                 : q.eq('area', opt.area).eq('family', 'intrare');
    var kr = await q;
    var kind = kr.data && kr.data[0];
    if (!kind) return;                       /* 안 구운 도장은 그냥 없다(30호) */

    var now = Date.now();
    if (kind.opens_at  && now < +new Date(kind.opens_at))  return;
    if (kind.closes_at && now > +new Date(kind.closes_at)) return;

    /* 이미 가졌는가 — 규칙마다 묻는 것이 다르다 */
    var rules = kind.rules || [];
    var has = supa.from('stamps').select('id', { count:'exact', head:true })
      .eq('user_id', user.id).eq('kind_code', kind.code);
    if (rules.indexOf('once_per_subject') >= 0 && opt.subject)
      has = has.eq('subject_id', String(opt.subject));
    if (rules.indexOf('daily_per_area') >= 0){
      var today = new Date(Date.now() + 9*3600*1000).toISOString().slice(0,10);
      has = supa.from('stamps').select('id', { count:'exact', head:true })
        .eq('user_id', user.id).eq('area', kind.area).eq('stamped_on', today);
    }
    if (rules.indexOf('unlimited') < 0){
      var hr = await has;
      if (hr.count) return;                  /* 있으면 아무것도 안 나타난다 */
    }

    /* 놓아둔다 — 누르는 것은 손님 */
    mount();
    var dock = document.getElementById('egStampDock');
    var btn  = document.getElementById('egStampBtn');
    btn.firstChild.style.color = kind.ink || '#2E3F63';
    btn.firstChild.style.webkitMaskImage = "url('" + kind.art_url + "')";
    btn.firstChild.style.maskImage = "url('" + kind.art_url + "')";
    btn.setAttribute('aria-label', kind.title + ' 도장 받기');
    dock.querySelector('.cap').textContent = '도장 받기';
    if (opt.bottom) dock.style.bottom = opt.bottom + 'px';
    dock.classList.add('on');

    btn.onclick = async function(){
      btn.disabled = true;
      var row = { user_id:user.id, kind_code:kind.code, area:kind.area };
      if (opt.subject)     row.subject_id  = String(opt.subject);
      if (opt.inscription) row.inscription = opt.inscription;
      var ins = await supa.from('stamps').insert(row);
      if (ins.error){
        /* 이미 찍혀 있었다면 조용히 거두기만 한다 — 나무라지 않는다 */
        console.warn('[EGStamp]', ins.error.message);
        dock.classList.remove('on');
        return;
      }
      dock.classList.remove('on');
      flash(kind.art_url, kind.ink || '#2E3F63');
      /* 0803 저녁 — 도장 깃발. 타륜(terra)이 이 자국을 읽어 30분 동안 세운다.
         여러 장을 받아도 마지막 한 자국만 남는다 — 개수는 말하지 않는다(5호). */
      try{ localStorage.setItem('eg_stamp_flag', JSON.stringify(
        { art:kind.art_url, ink:kind.ink || '#2E3F63', at:Date.now() })); }catch(e){}
      if (typeof opt.onPressed === 'function') opt.onPressed(kind);
    };
  }catch(e){ console.warn('[EGStamp] 물러납니다:', e); }
}

window.EGStamp = { offer: offer };
})();
