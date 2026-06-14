// ═══════════════════════════════════════════════════════════
// 📰 EG HERITAGE TIMES — 자동조립 엔진 v1 (2026.06.15)
//
//   설계 원칙 (야구저널 v1 골격 이식):
//   · 시드 고정: 난수 시드 = "타임즈호수 + 주차" → 같은 호는 언제 읽어도 같은 신문.
//     기사를 저장하지 않는다. 데이터 + 시드가 곧 보존이다.
//   · 어휘 헌법: 과장 금지("최고·압도적·유일" 없음), 담담하고 시적으로.
//   · 다리 단락: 광고가 아니라 문장 안의 길 — 분더카머·콘스텔라티오로.
//   · 영혼 헌장 9장: 비교·우열·랭킹 없음. 추첨은 운이지 실력이 아니다.
//     1등은 "가장 잘한 사람"이 아니라 "별을 영원히 곁에 두게 된 한 우주".
//
//   콩파뇽이 주인공인 신문:
//   · 마감호 — 응모한 콩파뇽들의 설렘이 다섯 보물 사이로 흐른다.
//   · 월요일은 보물을 직접 감상하지 못하는 날 → 신문이 감상을 대신 데려온다.
//     섬네일 다섯 점 + 카리 4겹에서 시드로 고른 한 겹을 인용. 매 호 다른 겹.
//
//   사용:
//     EGHeritageTimes.assembleClosing(data)   // 마감호(홀수 호)
//   data = {
//     vol: 2, wkId:'2026-W24', dateLabel:'6월 14일 일요일', drawLabel:'내일 정오',
//     items: [{ salle, id, name, artist, img, grade, lovers,
//               layers:{scene,thought,curation,knowledge,connection}|null }]
//   }
// ═══════════════════════════════════════════════════════════

const EGHeritageTimes = (() => {

  // ── 시드 고정 난수 (xmur3 + mulberry32) — 야구저널과 동일 ──
  function _hash(str){
    let h = 1779033703 ^ str.length;
    for(let i = 0; i < str.length; i++){
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return () => {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }
  function makeRng(seedStr){
    let a = _hash(String(seedStr))();
    return function(){
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
  function pickW(rng, pairs){          // [[값, 가중치], ...]
    const total = pairs.reduce((s, p) => s + p[1], 0);
    let r = rng() * total;
    for(const [v, w] of pairs){ if((r -= w) < 0) return v; }
    return pairs[0][0];
  }

  // ── 조사 (받침 유무) — 작가명은 한글 표기라 그대로 판정 ──
  const hasJong = s => {
    s = String(s || '');
    const c = s.charCodeAt(s.length - 1);
    return c >= 0xAC00 && c <= 0xD7A3 && ((c - 0xAC00) % 28) !== 0;
  };
  const josa = (s, a, b) => s + (hasJong(s) ? a : b);   // josa(작가,'이','가')

  // ── 4겹 라벨 (heritage.html 모달과 정합, 신문용 짧은 형) ──
  const LAYER_LABEL = { knowledge:'앎', thought:'사유', connection:'연결', curation:'큐레이션' };
  const LAYER_PICK  = [['thought',3], ['curation',2], ['knowledge',2], ['connection',2]];

  // 인용 발췌: 카리가 직접 박은 ** 강조 구절을 최우선, 없으면 첫 문장
  function cleanMd(s){
    return String(s || '').replace(/\*\*/g, '').replace(/\*/g, '').trim();
  }
  function excerpt(text){
    if(!text) return null;
    const m = String(text).match(/\*\*(.+?)\*\*/);          // 강조 구절
    if(m) return cleanMd(m[1]);
    const f = String(text).match(/^[\s\S]*?[.!?…]['"」』]?/); // 첫 문장
    return cleanMd(f ? f[0] : text);
  }

  // ── 제호 ──
  function masthead(data, kindLabel){
    const v = String(data.vol).padStart(2, '0');
    return {
      title: 'EG HERITAGE TIMES',
      sub: "Salon d'Eungyo",
      volLabel: 'Vol.' + v,
      stampVol: 'VOL. ' + v,
      kindLabel,
      dateLabel: data.dateLabel || '',
      meta: '제 ' + v + '호 · ' + kindLabel + (data.dateLabel ? ' · ' + data.dateLabel : '')
    };
  }

  // ════════ 마감호 풀 ════════
  const HEAD_CLOSING = [
    '다섯 빛이 마지막 밤을 보낸다',
    '오늘 자정, 살롱의 문이 한 주를 닫는다',
    '다섯 보물 앞에 모인 마음들 — 자정에 응모가 닫힌다',
    '한 주의 다섯 별, 응모를 마치고 추첨을 기다리다'
  ];
  const LEAD_CLOSING = [
    '{date} 자정, 헤리티지 살롱의 다섯 작품이 응모를 마감한다. {draw}, 추첨이 다섯 별의 갈 곳을 정한다. 그 전에 — 신문 한 장으로, 이번 주 살롱을 천천히 다시 걷는다.',
    '월요일의 살롱은 비어 있다. 보물들은 잠시 벽에서 내려와 추첨을 기다리고, 대신 이 신문이 다섯 점을 한 곳에 모아 둔다. {draw}에 별들이 떠날 곳이 정해진다.',
    '{date}, 한 주가 닫힌다. 다섯 보물은 오늘 밤 응모를 마치고, {draw}의 추첨을 향해 조용히 줄을 선다. 떠나기 전, 마지막으로 한 번 더 본다.'
  ];
  const LOVERS_PERMANENT = [
    '이번 주 {n}명의 콩파뇽이, 이 별을 영원히 곁에 두기를 바라며 마음을 보냈다.',
    '{n}명의 손이 이 한 점을 향했다. 그러나 영구작이 머무는 밤하늘은 단 하나뿐이다.',
    '{n}명의 콩파뇽이 응모함에 이름을 두고 갔다 — 이 별을 평생 자기 곳에 두려는 마음으로.'
  ];
  const LOVERS_RENTAL = [
    '{n}명의 콩파뇽이 이 작품과 한 달을 함께하고 싶다고 손을 들었다.',
    '이 한 점 앞에 {n}명의 마음이 줄을 섰다. 추첨은 그중 몇에게 한 철을 빌려준다.',
    '{n}명이 응모했다. 별 하나가 여럿의 곳을 돌며 한 해를 보낼 것이다.'
  ];
  const LOVERS_ZERO = [
    '아직 이 별을 향한 손은 없다. 자정까지, 문은 열려 있다.',
    '이 한 점은 조용히 응모를 기다리는 중이다. 마감까지 아직 시간이 있다.'
  ];
  const FALLBACK_BODY = [
    '{artist}의 한 점이 이번 주 {salle}번째 곳에 걸렸다. 그림은 말이 없고, 보는 이의 시간이 그 침묵을 채운다.',
    '{artist}{j} 남긴 이 작품 앞에서, 신문은 잠시 말을 아낀다. 직접 마주할 다음 주를 기약하며.',
    '아직 이 작품의 깊은 이야기는 살롱 노트에 도착하지 않았다. 그러나 그림은 이미 거기, 한 주를 살았다.'
  ];
  const PREVIEW_CLOSING = [
    '{draw}, 추첨함이 돌아간다. 다섯 별이 각자의 밤하늘 — 누군가의 분더카머로 흩어진다. 두구두구.',
    '{draw}의 추첨이 다섯 작품의 갈 곳을 가른다. 영구작 한 점은 한 사람에게 영원히, 나머지 넷은 여럿의 곳을 돌며. 두구두구.',
    '이제 남은 것은 {draw}의 추첨뿐이다. 운이 다섯 별을 다섯 밤하늘로 데려간다. 실력이 아니라 운이, 그래서 누구에게나 똑같이 열린 채로. 두구두구.'
  ];
  const BRIDGE = [
    '추첨이 끝나면 별은 <a href="wunderkammer_shell.html">분더카머</a>의 벽에 걸리고, 그 이야기는 <a href="constella.html">콘스텔라티오</a>의 밤하늘에 남는다.',
    '한 점을 품게 된 콩파뇽의 <a href="wunderkammer_shell.html">분더카머</a>로 별이 옮겨 간다. 그 빛이 <a href="constella.html">콘스텔라티오</a>에서 다시 깜빡인다.'
  ];

  // ── 작품 한 꼭지 조립 ──
  function articleOf(rng, item){
    const salle = item.salle;
    const isPermanent = salle === 1;
    const n = item.lovers || 0;
    const L = item.layers || null;

    const kicker = (L && L.scene) ? cleanMd(L.scene) : item.name;

    let body, quoteLabel = null;
    if(L){
      const cands = LAYER_PICK.filter(p => L[p[0]]);
      let key = cands.length ? pickW(rng, cands) : null;
      const ex = key ? excerpt(L[key]) : null;
      if(ex){ body = ex; quoteLabel = LAYER_LABEL[key] || null; }
    }
    if(!body){
      body = pick(rng, FALLBACK_BODY)
        .replace('{artist}', item.artist || '')
        .replace('{j}', hasJong(item.artist) ? '이' : '가')
        .replace('{salle}', salle);
    }

    let loversLine;
    if(n <= 0)            loversLine = pick(rng, LOVERS_ZERO);
    else if(isPermanent)  loversLine = pick(rng, LOVERS_PERMANENT).replace('{n}', n);
    else                  loversLine = pick(rng, LOVERS_RENTAL).replace('{n}', n);

    return {
      salle, id: item.id, name: item.name, artist: item.artist,
      img: item.img, isPermanent,
      tag: isPermanent ? '영구작' : '대여작',
      kicker, body, quoteLabel, lovers: n, loversLine
    };
  }

  // ── 메인: 마감호 조립 ──
  function assembleClosing(data){
    const rng = makeRng('TIMES-' + data.vol + '-' + (data.wkId || ''));
    const items = (data.items || []).slice().sort((a, b) => a.salle - b.salle);
    const totalLovers = items.reduce((s, i) => s + (i.lovers || 0), 0);

    const headline = pick(rng, HEAD_CLOSING);
    const lead = pick(rng, LEAD_CLOSING)
      .replace(/\{date\}/g, data.dateLabel || '오늘')
      .replace(/\{draw\}/g, data.drawLabel || '곧');
    const articles = items.map(it => articleOf(rng, it));
    const preview = pick(rng, PREVIEW_CLOSING).replace(/\{draw\}/g, data.drawLabel || '곧');
    const bridge = pick(rng, BRIDGE);

    return {
      kind: 'closing',
      masthead: masthead(data, '마감호'),
      headline, lead, articles, preview, bridge,
      totalLovers,
      footer: '이번 주, 모두 ' + totalLovers + '번의 마음이 다섯 별을 향했다.'
    };
  }

  // ════════ 결과호 풀 ════════
  //   영혼 헌장 9장: 우열·랭킹 없음. 1등은 "가장 잘한 사람"이 아니라 운이 데려간 한 사람.
  const HEAD_RESULT = [
    '{art1}, 한 사람의 품으로',
    '추첨이 끝났다 — 다섯 별이 갈 곳을 찾았다',
    '별들이 떠난 밤 — 다섯 작품, 다섯 갈래의 길',
    '{art1}{j_eun} 한 밤하늘로, 나머지 넷은 여럿의 곳으로'
  ];
  const LEAD_RESULT = [
    '{date} 정오, 추첨이 돌았다. 다섯 별이 각자의 밤하늘을 찾아 떠났다. 운이 갈랐을 뿐, 누구도 더 잘하거나 못한 밤이 아니었다.',
    '추첨함이 멈췄다. {pool}명의 콩파뇽이 마음을 보냈고, 다섯 작품은 저마다의 곳으로 흩어졌다. {date}, 한 주가 그렇게 닫혔다.',
    '{date}, 다섯 별의 갈 곳이 정해졌다. 영구작 한 점은 한 사람에게 영원히, 나머지 넷은 여럿의 곳을 한 철씩 돈다.'
  ];
  // 1등 가상 지면 인터뷰 — 따뜻하게, 개인을 캐묻지 않고, 운으로 온 기쁨을 담담히
  const FEATURE_INTRO = [
    '{art1}{eul} 영원히 곁에 두게 된 이는 {nick}님이다. 추첨은 실력이 아니라 운이었고, 그래서 이 한 점은 누구의 것이 되어도 좋았을 별이었다.',
    '오늘, {art1}{i} {nick}님의 분더카머로 떠났다. 영구작은 한 사람에게만 머무는 유일한 별 — 그 한 사람이 오늘은 {nick}님이었다.'
  ];
  const FEATURE_QUOTE = [
    '"제가 잘한 것이 아니라 운이 제게 온 것뿐인데, 이렇게 큰 별을 받아도 되는지 모르겠습니다."',
    '"이 그림을 매일 제 곳에서 볼 수 있다니, 아직 실감이 나지 않습니다."',
    '"제 분더카머의 벽 하나가, 오늘로 영영 채워졌습니다."',
    '"같이 응모한 다른 분들을 생각하면 미안하고 고맙습니다. 잘 간직하겠습니다."'
  ];
  const FEATURE_TAIL = [
    '{nick}님의 말이다. 별은 이제 그의 밤하늘에서 조용히 빛난다.',
    '{nick}님은 그렇게 짧게 답했다. 그 한 마디로 충분한 밤이었다.'
  ];
  const RESULT_RENTAL = [
    '{art}{neun} {copies}부가 풀려, {copies}명의 콩파뇽이 한 철 동안 곁에 두고 본다.',
    '{art} — {copies}명의 곳을 차례로 돌며 한 해를 보낼 {copies}부가 길을 떠났다.',
    '{copies}명이 {art}{wa} 한동안 함께 산다. 별 하나가 여러 밤하늘을 도는 방식이다.'
  ];
  const RESULT_RENTAL_ZERO = [
    '{art}{neun} 이번 주, 곁에 둘 콩파뇽을 만나지 못했다. 다음 별을 조용히 기다린다.',
    '{art}{neun} 응모의 손이 닿지 않았다. 다음 주를 기약하며 잠시 물러난다.'
  ];
  const RESULT_PRIZE = [
    '이번 주 모인 {total}알의 사과는 부상이 되어 흩어졌다. 절반은 1등에게, 나머지는 2·3·4등의 손으로 고르게.',
    '{total}알이 응모함에 쌓였고, 그대로 부상이 되어 콩파뇽들에게 돌아갔다. 들어온 사과가 다시 사과로 — 순환은 닫혔다.'
  ];
  const NEXT_PREVIEW = [
    '다음 주, 새 다섯 별이 화요일 0시 살롱에 도착한다. 또 한 번의 한 주가 그렇게 열린다.',
    '화요일 0시, 살롱의 벽이 다시 채워진다. 어떤 별이 올지는 그때의 기쁨으로 남겨 둔다.'
  ];

  function resultArticleOf(rng, item){
    const copies = item.copies || 0;
    const art = item.name;
    const line = copies > 0
      ? pick(rng, RESULT_RENTAL)
          .replace(/\{art\}/g, art)
          .replace(/\{neun\}/g, hasJong(art) ? '은' : '는')
          .replace(/\{wa\}/g, hasJong(art) ? '과' : '와')
          .replace(/\{copies\}/g, copies)
      : pick(rng, RESULT_RENTAL_ZERO)
          .replace(/\{art\}/g, art)
          .replace(/\{neun\}/g, hasJong(art) ? '은' : '는');
    return {
      salle: item.salle, id: item.id, name: art, artist: item.artist,
      img: item.img, copies, line
    };
  }

  // ── 메인: 결과호 조립 ──
  function assembleResult(data){
    const rng = makeRng('TIMES-R-' + data.vol + '-' + (data.wkId || ''));
    const items = (data.items || []).slice().sort((a, b) => a.salle - b.salle);
    const perm = items.find(i => i.salle === 1) || items[0] || { name:'영구작', artist:'' };
    const art1 = perm.name;
    const nick = (data.first && data.first.nickname) || '한 콩파뇽';
    const rentals = items.filter(i => i.salle >= 2);

    const headline = pick(rng, HEAD_RESULT)
      .replace(/\{art1\}/g, art1)
      .replace(/\{j_eun\}/g, hasJong(art1) ? '은' : '는');
    const lead = pick(rng, LEAD_RESULT)
      .replace(/\{date\}/g, data.dateLabel || '오늘')
      .replace(/\{pool\}/g, data.pool || 0);

    const featureIntro = pick(rng, FEATURE_INTRO)
      .replace(/\{art1\}/g, art1)
      .replace(/\{eul\}/g, hasJong(art1) ? '을' : '를')
      .replace(/\{i\}/g, hasJong(art1) ? '이' : '가')
      .replace(/\{nick\}/g, nick);
    const featureQuote = pick(rng, FEATURE_QUOTE);
    const featureTail = pick(rng, FEATURE_TAIL).replace(/\{nick\}/g, nick);

    const articles = rentals.map(it => resultArticleOf(rng, it));
    const prize = pick(rng, RESULT_PRIZE).replace(/\{total\}/g, data.totalTickets || 0);
    const nextPreview = pick(rng, NEXT_PREVIEW);
    const bridge = pick(rng, BRIDGE);

    return {
      kind: 'result',
      masthead: masthead(data, '결과호'),
      headline, lead,
      feature: { perm, nick, intro: featureIntro, quote: featureQuote, tail: featureTail },
      articles, prize, nextPreview, bridge,
      footer: '추첨은 운이 갈랐다. 그래서 모두가 같은 자격으로 별 앞에 섰다.'
    };
  }

  return { assembleClosing, assembleResult };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = { EGHeritageTimes };
