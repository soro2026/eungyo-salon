/* ────────────────────────────────────────────────────────────────
   EG Credencial — 도장 놓기 · 누르기
   0803 · 결정문 3호(손님이 누른다) · 4호(찍는 곳과 보는 곳을 떼어놓는다)
   0804 · 종이 조각(18호 정본값) · 거두기(withdraw)
   0805 · 인장 시안 여러 벌 중 하나를 굴려 뽑고 그 행에 붙박음(15호)
   0808 · 규칙 겹침 복원 — daily_per_area와 once_per_subject를 **둘 다** 묻는다.
          천문대(별)·뮤세움(책)이 「그날 처음 만난 새 대상」에만 놓인다.
          ⚠ 부르는 쪽 꼬리표를 ?v=0808a로 올려야 캐시가 갈린다.

   쓰는 법 — 그 우주의 파일에 두 줄:
     <script src="stamp_press.js?v=0805a"></script>
     EGStamp.offer({ supa, area:'musica' });

   supabase-js가 없는 파일이면 supa를 빼고 부른다 — 스스로 REST로 간다:
     EGStamp.offer({ area:'camera' });

   더 줄 수 있는 것:
     kind        판 코드를 직접 지정 (안 주면 그 우주의 입국 도장을 찾는다)
     subject     대상 키 (별 id · 지명 코드 · 기수:회차)
     inscription 각인에 새길 말 (곡명 · 책 제목 · 지명)
     onPressed   찍힌 뒤 부를 것
     bottom      화면 아래에서 띄울 높이(px). 그 우주에 이미 뭔가 앉아 있을 때

   거두는 법 — 잠깐 열렸다 닫히는 화면에서:
     EGStamp.withdraw();
     놓아둔 도장을 조용히 거둔다. 나무라지 않고 아무 말도 안 띄운다.
     안 누른 것은 손해가 아니므로 다음에 그 화면이 다시 열리면 또 놓인다(3호).

   ⚠ 지켜야 할 것
   - 저절로 안 찍는다. 놓아두기만 하고 누르는 것은 손님이다(3호).
   - 안 눌러도 아무 손해가 없다. 재촉하는 말을 띄우지 않는다.
   - 누른 뒤 수첩을 열지 않는다. 종이 한 조각과 잉크 자국만 잠깐 떴다 사라진다(4호).
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

/* ── 0804. 찍히는 곳 — 허공이 아니라 종이 위 ──────────────────────
   0803까지는 잉크 실루엣 한 겹만 띄웠다. 흰 화면(음악관)에서는 또렷했으나
   짙은 목재 벽(콜레주 3층)·야간 구장·미술관에서는 남색 위의 남색이라 안 보였다.
   결정문 3호가 이미 답을 적어두고 있었다 —
   「순례길에서 스탬프의 절반은 도장 그림이 아니라 크레덴시알을 내미는 손이다.」
   그 절반이 빠져 있었다. 종이를 먼저 깔면 어떤 배경이 와도 도장이 산다.        */
+ '#egStampFlash{position:fixed;inset:0;z-index:2147483001;display:none;'
+ '  place-items:center;pointer-events:none}'
+ '#egStampFlash.on{display:grid;animation:egVeil 1.65s ease forwards}'
+ '@keyframes egVeil{0%{background:rgba(0,0,0,0)}11%{background:rgba(0,0,0,.26)}'
+ '  72%{background:rgba(0,0,0,.26)}100%{background:rgba(0,0,0,0)}}'
/* 종이 조각 — 낱장 하나지, 펼쳐진 수첩이 아니다(4호).
   그래서 페이지 번호도 머리글도 넣지 않는다. 무지 종이 한 장 + 무늬뿐. */
+ '#egStampPaper{position:relative;overflow:hidden;background:#FDFCFA;'
+ '  width:min(342px,74vw);aspect-ratio:1.09/1;'
+ '  box-shadow:0 10px 30px rgba(0,0,0,.3);'
+ '  display:grid;place-items:center;'
+ '  animation:egPaper 1.65s cubic-bezier(.2,.85,.25,1.05) forwards}'
/* ⭐ 모서리를 둥글리지 않는다 — 둥글면 UI 카드가 되고, 각지면 종이가 된다.
   ⭐ 회전은 부모(종이)에만 건다(12호). 종이와 도장이 함께 기울어야
      「올려놓고 찍은 것」이 된다. 따로 놀면 스티커로 보인다. */
+ '#egStampPaper .gu{position:absolute;inset:0;width:100%;height:100%;'
+ '  pointer-events:none}'
+ '#egStampPaper i{position:relative;z-index:1;display:block;width:62%;height:62%;'
+ '  background:currentColor;-webkit-mask-size:contain;mask-size:contain;'
+ '  -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;'
+ '  -webkit-mask-position:center;mask-position:center;'
+ '  mix-blend-mode:multiply;'
+ '  animation:egPress 1.65s cubic-bezier(.2,.85,.25,1.15) forwards}'
+ '@keyframes egPaper{0%{opacity:0;transform:rotate(var(--r)) translateY(15px) scale(.955)}'
+ '  9%{opacity:1;transform:rotate(var(--r)) translateY(0) scale(1)}'
+ '  74%{opacity:1;transform:rotate(var(--r)) translateY(0) scale(1)}'
+ '  100%{opacity:0;transform:rotate(var(--r)) translateY(-7px) scale(1)}}'
+ '@keyframes egPress{0%{transform:scale(2.05);opacity:0}'
+ '  10%{opacity:0}22%{opacity:var(--a)}'
+ '  56%{transform:scale(1);opacity:var(--a)}'
+ '  100%{transform:scale(1);opacity:var(--a)}}'
+ '@keyframes egSlip{from{transform:translateX(26px);opacity:0}to{transform:none;opacity:1}}'
+ '@media (prefers-reduced-motion:reduce){'
+ '  #egStampDock.on{animation:none}#egStampBtn{transition:none}'
+ '  #egStampPaper{animation:egFadeP 1.5s linear forwards}'
+ '  #egStampPaper i{animation:egFade 1.5s linear forwards}'
+ '  @keyframes egFadeP{0%,78%{opacity:1;transform:rotate(var(--r))}'
+ '    100%{opacity:0;transform:rotate(var(--r))}}'
+ '  @keyframes egFade{0%,78%{opacity:var(--a);transform:none}'
+ '    100%{opacity:var(--a);transform:none}}}'
+ '@media (max-width:640px){#egStampDock{right:12px;bottom:12px}'
+ '  #egStampBtn{width:70px;height:70px}#egStampBtn i{width:50px;height:50px}}';

/* ── 기요셰 — 쌍핵 지문 중 한 핵. credencial.html 236행과 같은 수식.
   18호 정본값(진하기 .3 · 간격 3 · 3색 겹쳐찍기)을 그대로 쓴다.
   ⭐ 같은 수식이어야 나중에 수첩을 펼쳤을 때 「아까 그 종이」가 된다.
   ⭐ 배율도 수첩과 맞춘다 — 종이 342px에 300단위를 담아 1.14배. 여기서 확대해 버리면
     무늬가 같아도 「다른 종이」로 읽힌다(0804 실측: 처음 잡았던 2.44배는 탈락).
  고리 70 · 점 46, 약 106KB. 첫 도장 때 한 번 굽고 계속 돌려 쓴다. */
var GC = [['#D98A9A',.5],['#8FB6D6',.55],['#D9C271',.45]];
var _guSVG = null;
function guilloche(){
  if (_guSVG) return _guSVG.cloneNode(true);
  var gop = .3, gap = 3, N = 70, P = 46, cx = 150, cy = 137, s = '';
  for (var g = 0; g < 3; g++){
    var off = g*2.7, tint = g*1.9;
    s += '<g stroke="' + GC[g][0] + '" fill="none" stroke-width=".45" opacity="'
       + (GC[g][1]*gop).toFixed(3) + '">';
    for (var i = 1; i < N; i++){
      var rr = i*gap*0.92, d = '';
      for (var a = 0; a <= P; a++){
        var th  = a/P*6.2832;
        var rad = rr + 2.8*Math.sin(th*2+off) + 1.8*Math.sin(th*6);
        d += (a?'L':'M') + (cx + tint + rad*Math.cos(th)).toFixed(1) + ' '
                         + (cy + rad*Math.sin(th)*0.93).toFixed(1);
      }
      s += '<path d="' + d + 'Z"/>';
    }
    s += '</g>';
  }
  var wrap = document.createElement('div');
  wrap.innerHTML = '<svg class="gu" xmlns="http://www.w3.org/2000/svg" '
    + 'viewBox="0 0 300 275" preserveAspectRatio="xMidYMid slice">' + s + '</svg>';
  _guSVG = wrap.firstChild;
  return _guSVG.cloneNode(true);
}

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
  f.id = 'egStampFlash';
  f.innerHTML = '<div id="egStampPaper"><i></i></div>';
  document.body.appendChild(f);
}

function flash(art, ink){
  mount();
  var f = document.getElementById('egStampFlash');
  var p = document.getElementById('egStampPaper');
  var i = p.querySelector('i');
  /* 종이 무늬 — 첫 도장 때 한 번 굽고 그 뒤로는 그대로 둔다 */
  if (!p.querySelector('svg.gu')) p.insertBefore(guilloche(), i);

  var rot = (Math.random()*20 - 10).toFixed(1);
  i.style.color = ink;
  p.style.setProperty('--r', rot + 'deg');           /* 회전은 종이에 */
  i.style.setProperty('--a', (0.72 + Math.random()*0.18).toFixed(2));
  i.style.webkitMaskImage = "url('" + art + "')";
  i.style.maskImage = "url('" + art + "')";
  /* ⭐ 찰칵 — 종이에 도장이 닿는 그 프레임(330ms).
     ⚠ mp3는 서비스워커에서 여전히 cache-first다(네트워크 우선은 .html·.js뿐).
        소리를 다시 녹음해 올릴 때마다 아래 ?v= 숫자를 올릴 것 — 안 그러면 옛 소리가 계속 난다.
     파일이 아직 없어도 catch가 조용히 삼킨다. 화면에는 아무 일도 안 일어난다. */
  try{
    var snd = new Audio('stamp_press.mp3?v=0804a');
    snd.volume = 0.6;
    setTimeout(function(){ snd.play().catch(function(){}); }, 330);
  }catch(e){}
  f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
  setTimeout(function(){ f.classList.remove('on'); }, 1750);
}

/* 놓아둔 도장을 거둔다 — 잠깐 열렸다 닫히는 화면(스타디움 입장 · 미술관 관 이동)에서.
   아무 말도 안 띄운다. 다음에 그 화면이 다시 열리면 또 놓인다(3호). */
function withdraw(){
  var d = document.getElementById('egStampDock');
  if (d) d.classList.remove('on');
}

/* ── 0804. supa 없이도 걷는다 ─────────────────────────────────────
   분더카머 셸(wunderkammer_shell_v4_4)은 일부러 supabase-js를 안 쓰고
   날 REST(sbFetch)로 돈다. 그 파일에 라이브러리 한 줄을 얹어 남의 결정을
   뒤집는 대신, 부품이 스스로 걷게 했다. 앞으로 같은 방식의 파일이 또 나와도
   그때마다 얹을 일이 없다.
   도장이 DB에 묻는 것은 넷뿐이다 — 누구인가 · 판 · 이미 가졌나 · 넣기.
   열쇠는 SUPA_URL과 localStorage('eungyo-auth')에 이미 다 있다.        */
var SUPA_URL = 'https://cyhlotwdisjvoxvfkpnd.supabase.co';
var SUPA_KEY = 'sb_publishable_jYYfQV_wQgMRFjSUuDq7xA_gWc9vsnR';

function authBag(){
  try{ return JSON.parse(localStorage.getItem('eungyo-auth')) || null; }catch(e){ return null; }
}
function restHead(){
  var b = authBag();
  return { 'apikey': SUPA_KEY,
           'Authorization': 'Bearer ' + ((b && b.access_token) || SUPA_KEY),
           'Content-Type': 'application/json' };
}
async function restGet(path){
  var r = await fetch(SUPA_URL + '/rest/v1/' + path, { headers: restHead() });
  if (!r.ok) throw new Error('rest ' + r.status);
  return await r.json();
}

/* 누구인가 */
async function whoAmI(supa){
  if (supa){
    var ses = await supa.auth.getSession();
    return (ses && ses.data && ses.data.session && ses.data.session.user) || null;
  }
  var b = authBag();
  return (b && b.user) || null;
}

/* 판 찾기 — kind를 주면 그것, 안 주면 그 우주의 입국 도장 */
async function findKind(supa, opt){
  var cols = 'code,title,art_url,art_urls,ink,rules,family,area,active,opens_at,closes_at';
  if (supa){
    var q = supa.from('stamp_kinds').select(cols)
      .eq('active', true).not('art_url', 'is', null).limit(1);
    q = opt.kind ? q.eq('code', opt.kind)
                 : q.eq('area', opt.area).eq('family', 'intrare');
    var kr = await q;
    return (kr.data && kr.data[0]) || null;
  }
  var u = 'stamp_kinds?select=' + cols + '&active=eq.true&art_url=not.is.null&limit=1'
        + (opt.kind ? '&code=eq.' + encodeURIComponent(opt.kind)
                    : '&area=eq.' + encodeURIComponent(opt.area) + '&family=eq.intrare');
  var rows = await restGet(u);
  return rows[0] || null;
}

/* 이미 가졌는가 — 규칙마다 묻는 것이 다르다
   ⭐ 0808 — 규칙이 둘이면 **둘 다** 물어야 한다. 여기가 if/else라 daily가 있으면
     once_per_subject를 아예 안 물었고, 그래서 천문대가 「별마다 한 번」을 못 지켰다.
     어제 본 별을 오늘 다시 열면 도장이 또 놓였다(설계는 안 그랬는데 구현이 그랬다).
     결정문 8호 「새 규칙을 만들지 않고 둘을 겹치는 것으로 끝낸다」의 그 겹침이 이것이다.
   ⚠ 겹쳐 쓰는 우주는 지금 둘 — 천문대(별) · 뮤세움(책). 둘 다
     「하루 한 장」 그리고 「대상마다 한 번」이라, 그날 처음 만난 새 대상에만 놓인다.
     별도 장치 없이 규칙 겹침이 「그날의 첫」을 만든다.
   ⚠ 규칙이 하나뿐인 우주(음악관·미술관·한스푼·콜레주·입국)는 결과가 전과 같다. */
async function alreadyHas(supa, uid, kind, opt){
  var rules = kind.rules || [];
  var daily = rules.indexOf('daily_per_area') >= 0;
  var subj  = rules.indexOf('once_per_subject') >= 0 && !!opt.subject;
  var today = new Date(Date.now() + 9*3600*1000).toISOString().slice(0,10);

  /* ① 하루 한 장 — 이 우주에 오늘 한 장이라도 있으면 (입국 도장도 한 장으로 센다) */
  if (daily && await anyStamp(supa, uid, { area:kind.area, on:today })) return true;
  /* ② 대상마다 한 번 — 이 판으로 이 대상을 받은 적이 있으면 */
  if (subj  && await anyStamp(supa, uid, { code:kind.code, subject:opt.subject })) return true;
  /* ③ 둘 다 아니면 평생 한 번 — 이 판을 받은 적이 있으면 */
  if (!daily && !subj && await anyStamp(supa, uid, { code:kind.code })) return true;
  return false;
}

/* 묻기 한 곳 — supabase-js와 REST 두 갈래를 여기 한 데 모은다.
   ⚠ 갈래마다 조건을 따로 적으면 한쪽만 고치는 날이 반드시 온다(0808 통합). */
async function anyStamp(supa, uid, w){
  if (supa){
    var q = supa.from('stamps').select('id', { count:'exact', head:true }).eq('user_id', uid);
    if (w.area)    q = q.eq('area', w.area);
    if (w.on)      q = q.eq('stamped_on', w.on);
    if (w.code)    q = q.eq('kind_code', w.code);
    if (w.subject) q = q.eq('subject_id', String(w.subject));
    var hr = await q;
    return !!hr.count;
  }
  var u = 'stamps?select=id&limit=1&user_id=eq.' + uid
    + (w.area    ? '&area=eq.'       + encodeURIComponent(w.area) : '')
    + (w.on      ? '&stamped_on=eq.' + w.on : '')
    + (w.code    ? '&kind_code=eq.'  + encodeURIComponent(w.code) : '')
    + (w.subject ? '&subject_id=eq.' + encodeURIComponent(String(w.subject)) : '');
  var rows = await restGet(u);
  return rows.length > 0;
}

/* 넣기 — 에러는 던지지 않고 돌려준다(이미 찍혀 있었을 때 조용히 거두기 위해) */
async function putStamp(supa, row){
  if (supa){
    var ins = await supa.from('stamps').insert(row);
    return ins.error ? ins.error.message : null;
  }
  var r = await fetch(SUPA_URL + '/rest/v1/stamps',
    { method:'POST', headers: restHead(), body: JSON.stringify(row) });
  if (r.ok) return null;
  var t = ''; try{ t = await r.text(); }catch(e){}
  return 'rest ' + r.status + ' ' + t;
}

/* ⭐ 0805 — 인장 시안 여러 벌 중 하나를 굴려 뽑는다.
   한 판에 그림이 다섯이면 시드니에 갈 때마다 다른 조가비가 찍힌다.
   ⚠ 굴리는 것은 **놓을 때 한 번뿐**이다. 뽑은 것을 stamps 행에 적어 두므로(15호)
     몇 달 뒤 수첩을 펼쳐도 그날 받은 그 그림이 그 자리에 있다.
     펼칠 때마다 굴리면 기록이 아니라 화면 보호기가 된다.
   ⚠ 「이번엔 안 나온 것으로」 돌리지 않는다. 그러면 다섯 번 가면 다섯 벌이 다 모이는
     구조가 되어 수집표가 된다(2호). 그냥 굴린다 — 겹쳐도 무방하다.
     실물도 같은 알베르게에 두 번 묵으면 같은 도장이 두 번 찍힌다. */
function rollArt(kind){
  var a = (kind && kind.art_urls && kind.art_urls.length) ? kind.art_urls : null;
  if (!a) return kind.art_url;
  return a[Math.floor(Math.random() * a.length)] || kind.art_url;
}

async function offer(opt){
  opt = opt || {};
  var supa = opt.supa || null;   /* 없으면 REST로 스스로 간다(0804) */

  try{
    var user = await whoAmI(supa);
    if (!user) return;                       /* 손님이 아니면 조용히 물러난다 */

    var kind = await findKind(supa, opt);
    if (!kind) return;                       /* 안 구운 도장은 그냥 없다(30호) */

    var now = Date.now();
    if (kind.opens_at  && now < +new Date(kind.opens_at))  return;
    if (kind.closes_at && now > +new Date(kind.closes_at)) return;

    if ((kind.rules || []).indexOf('unlimited') < 0){
      if (await alreadyHas(supa, user.id, kind, opt)) return;
                                             /* 있으면 아무것도 안 나타난다 */
    }

    /* 놓아둔다 — 누르는 것은 손님 */
    var art = rollArt(kind);                 /* 이 회차에 뽑힌 시안. 아래로 계속 이것만 쓴다 */
    mount();
    var dock = document.getElementById('egStampDock');
    var btn  = document.getElementById('egStampBtn');
    btn.disabled = false;
    btn.firstChild.style.color = kind.ink || '#2E3F63';
    btn.firstChild.style.webkitMaskImage = "url('" + art + "')";
    btn.firstChild.style.maskImage = "url('" + art + "')";
    btn.setAttribute('aria-label', kind.title + ' 도장 받기');
    dock.querySelector('.cap').textContent = '도장 받기';
    if (opt.bottom) dock.style.bottom = opt.bottom + 'px';
    dock.classList.add('on');

    btn.onclick = async function(){
      btn.disabled = true;
      var row = { user_id:user.id, kind_code:kind.code, area:kind.area };
      if (art && art !== kind.art_url) row.art_url = art;   /* 대표와 다를 때만 적어 둔다 */
      if (opt.subject)     row.subject_id  = String(opt.subject);
      if (opt.inscription) row.inscription = opt.inscription;
      var err = await putStamp(supa, row);
      if (err){
        /* 이미 찍혀 있었다면 조용히 거두기만 한다 — 나무라지 않는다 */
        console.warn('[EGStamp]', err);
        dock.classList.remove('on');
        return;
      }
      dock.classList.remove('on');
      flash(art, kind.ink || '#2E3F63');
      /* 0803 저녁 — 도장 깃발. 타륜(terra)이 이 자국을 읽어 30분 동안 세운다.
         여러 장을 받아도 마지막 한 자국만 남는다 — 개수는 말하지 않는다(5호). */
      var mark = { art:art, ink:kind.ink || '#2E3F63', at:Date.now() };
      try{ localStorage.setItem('eg_stamp_flag', JSON.stringify(mark)); }catch(e){}
      /* 0803 밤 — 이 우주가 타륜 안 액자로 열려 있으면 부모에게 곧장 알린다.
         storage 사건에만 기대면 브라우저·창 구성에 따라 안 오는 경우가 있었다.
         두 길을 다 두되 부모 쪽에서 같은 함수 하나로 받는다. */
      try{ if (window.parent && window.parent !== window)
             window.parent.postMessage({ eg:'stamped', mark:mark }, '*'); }catch(e){}
      if (typeof opt.onPressed === 'function') opt.onPressed(kind);
    };
  }catch(e){ console.warn('[EGStamp] 물러납니다:', e); }
}

window.EGStamp = { offer: offer, withdraw: withdraw };
})();
