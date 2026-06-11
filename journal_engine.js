// ═══════════════════════════════════════════════════════════
// 📰 EG 야구 저널 — 자동조립 엔진 v1 (2026.06.10)
//
//   설계 원칙 (저널 결정문 v0.1):
//   · 시드 고정: 난수 시드 = match id → 같은 경기는 언제 읽어도 같은 기사.
//     기사를 저장하지 않는다. 데이터 + 시드가 곧 보존이다.
//   · 포맷 3종 회전: A 스트레이트 보도 / B 그라운드 단상 / C 라커룸 인터뷰
//   · 구장 풍토: 실제 날씨가 아닌 "그 구장의 가상 기후" (세계관)
//   · 다리 단락: 광고가 아니라 문장 안의 길 — 콘스텔라티오·뮤세움으로
//   · 어휘 헌법: 과장 금지("최고·압도적·유일" 없음), 담담하고 시적으로
//
//   사용: EGJournal.assemble(data) / EGJournal.assembleShort(data)
//   data = { matchId, date:'YYYY-MM-DD', weekNum, isMyGame,
//            homeTeam, awayTeam, homeScore, awayScore, persons:[..] }
// ═══════════════════════════════════════════════════════════

const EGJournal = (() => {

  // ── 시드 고정 난수 (xmur3 + mulberry32) ──
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
  function pickW(rng, pairs){ // [[값, 가중치], ...]
    const total = pairs.reduce((s, p) => s + p[1], 0);
    let r = rng() * total;
    for(const [v, w] of pairs){ if((r -= w) < 0) return v; }
    return pairs[0][0];
  }

  // ── 조사 (받침 유무) — 라틴 표기는 한글 독음으로 판정 ──
  const READING = { 'SORO':'소로', 'SOCRATES':'소크라테스', 'PROUST':'프루스트', 'PASCAL':'파스칼' };
  const hasJong = s => {
    const r = READING[s] || s;
    const c = r.charCodeAt(r.length - 1);
    return c >= 0xAC00 && c <= 0xD7A3 && ((c - 0xAC00) % 28) !== 0;
  };
  const josa = (s, a, b) => s + (hasJong(s) ? a : b);   // josa(이름,'이','가')
  // 숫자 + 로/으로 — 받침 없거나 ㄹ(1·7·8)이면 '로', 그 외(0·3·6)는 '으로'
  const roJosa = n => ([0,3,6].includes(n % 10) ? '으로' : '로');

  // ── 팀 · 구장 메타 ──
  const TEAM = {
    soro:     { label: 'SORO',     park: '소로 파크' },
    socrates: { label: 'SOCRATES', park: '소크라테스 파크' },
    proust:   { label: 'PROUST',   park: '프루스트 파크' },
    pascal:   { label: 'PASCAL',   park: '파스칼 파크' }
  };
  const T = code => TEAM[code] || { label: (code||'').toUpperCase(), park: '구장' };

  const seasonOf = dateStr => {
    const m = parseInt((dateStr || '').slice(5, 7), 10) || 6;
    return m >= 3 && m <= 5 ? '봄' : m >= 6 && m <= 8 ? '여름' : m >= 9 && m <= 11 ? '가을' : '겨울';
  };
  const dateK = dateStr => {
    const d = new Date(dateStr + 'T00:00:00Z');   // 달력 날짜 그대로 (실행 환경 TZ 무관)
    const dow = ['일','월','화','수','목','금','토'][d.getUTCDay()];
    return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${dow}요일`;
  };

  // ── 구장 풍토 — 계절 × 구장의 가상 기후 (세계관) ──
  const WEATHER = {
    soro: {
      봄:   ['호수 쪽에서 건너온 봄바람이 외야 잔디를 천천히 깨웠다.',
             '월든 호숫가의 구장답게, 물 냄새가 1루 쪽까지 올라왔다.'],
      여름: ['한낮의 해가 내야를 데웠고, 호수의 물비늘이 전광판보다 밝게 반짝였다.',
             '외야 너머 숲에서 매미 소리가 응원가처럼 이어졌다.'],
      가을: ['외야 담장 너머 숲의 빛이 하루치 가을만큼 깊어져 있었다.',
             '호수 위로 낮게 깔린 안개가 경기 시작과 함께 걷혔다.'],
      겨울: ['차고 맑은 공기 속에서 타구 소리가 평소보다 멀리 갔다.',
             '관중석의 입김이 호숫가 구장의 겨울을 증언했다.']
    },
    socrates: {
      봄:   ['언덕 위 구장답게 바람이 자주, 질문처럼 방향을 바꿨다.',
             '아고라 언덕의 봄바람이 깃발을 쉬지 않고 흔들었다.'],
      여름: ['언덕의 한여름 해는 피하기 어려웠으나, 그늘은 토론하기 좋았다.',
             '더위 속에서도 바람만은 끝까지 묻기를 멈추지 않았다.'],
      가을: ['언덕 아래로 내려다보이는 들판이 온통 가을이었다.',
             '높은 하늘이 구장 위로 또 하나의 질문처럼 열려 있었다.'],
      겨울: ['언덕의 겨울바람은 매서웠지만, 그 안에 이상하게 정신을 맑게 하는 데가 있었다.']
    },
    proust: {
      봄:   ['외야 담장의 산사나무 울타리가 꽃을 피우기 시작했다.',
             '담장 너머에서 이따금 마들렌 굽는 냄새가 넘어왔다는 관중석의 증언이 있었다.'],
      여름: ['홍차색 노을이 외야를 물들일 무렵, 경기가 무르익었다.',
             '담장 밖 보리수 길에서 불어온 바람에 잠깐, 모두가 무언가를 떠올리는 듯했다.'],
      가을: ['낙엽이 파울 라인을 따라 굴렀고, 누구도 그것을 치우려 하지 않았다.',
             '구장 전체가 오래된 사진첩의 색을 띠는 계절이었다.'],
      겨울: ['난로 연기 냄새가 관중석에 낮게 깔렸다. 기억의 냄새와 닮은 데가 있었다.']
    },
    pascal: {
      봄:   ['전광판 옆 강수확률 표지판은 종일 {p}%에 머물렀다. 비는 오지 않았다.',
             '외야 둑의 갈대가 봄바람에 일제히 기울었다 — 생각에 잠긴 것처럼.'],
      여름: ['강수확률 {p}%. 구름은 계산을 비웃듯 끝내 비를 내리지 않았다.',
             '무한히 높은 여름 하늘 아래에서, 구장은 작고 정확했다.'],
      가을: ['표지판의 강수확률이 {p}%에서 움직이지 않았다. 가을다운 확신이었다.',
             '갈대 둑이 온통 금빛으로 흔들리는 계절이었다.'],
      겨울: ['차가운 공기 속에서 모든 궤적이 평소보다 또렷하게 보였다.']
    }
  };

  // ── 관중석 묘사 ──
  const CROWD = [
    '관중석은 듬성했지만, 박수는 정확한 순간에 나왔다.',
    '조용한 관중석이었다. 그러나 빈 데가 없는 침묵이었다.',
    '외야석의 누군가는 경기 내내 책을 읽다가, 타구 소리에만 고개를 들었다.',
    '응원가는 없었다. 대신 좋은 타구마다 낮은 감탄이 물결처럼 지나갔다.'
  ];

  // ── 이닝 서술 (점수 구간별) ──
  const HALF_AWAY = {   // 1회초 — 원정팀 공격
    0:  ['1회초, {t}의 방망이는 끝내 침묵했다. 출루는 있었으나 홈은 멀었다.',
         '{t}의 1회초는 조용히 지나갔다. 세 개의 아웃카운트가 차곡차곡 쌓였다.',
         '{t}의 타자들이 연이어 물러났다. 1회초는 투수의 시간이었다.',
         '1회초 {t}의 공격은 주자를 두고도 끝내 문을 열지 못했다.',
         '{t}는 1회초를 빈손으로 닫았다. 기회가 없던 것은 아니었다.'],
    1:  ['1회초 {t}가 먼저 한 점을 가져갔다. 크지 않지만 분명한 발자국이었다.',
         '{t}의 1회초 — 한 점. 야구에서 가장 흔하고, 가장 무거운 숫자다.',
         '1회초, {t}의 한 점이 먼저 전광판에 불을 켰다.',
         '{t}가 1회초 선취점을 가져갔다. 경기의 첫 단추였다.',
         '1회초 {t}의 한 점 — 멀리 가지 않은 타구 하나가 주자를 불러들였다.'],
    2:  ['{t}의 1회초 공격이 두 점을 만들어냈다. 흐름이 원정 쪽으로 기울었다.',
         '1회초 {t}가 두 점을 앞세웠다. 원정 더그아웃이 먼저 데워졌다.',
         '{t}의 방망이가 1회초에 두 번 홈을 두드렸다. 두 점, 산뜻한 출발이었다.'],
    3:  ['{t}의 방망이가 1회초부터 뜨거웠다. {s}점이 전광판에 올랐다.',
         '1회초에만 {s}점 — {t}의 타선이 작정한 듯 몰아쳤다.']
  };
  const HALF_HOME = {   // 1회말 — 홈팀 공격
    0:  ['1회말 {t}의 반격은 끝내 점수로 이어지지 못했다.',
         '{t}의 1회말은 아쉬움 속에 닫혔다. 방망이는 돌았으나 전광판은 그대로였다.',
         '1회말 {t}는 끝내 홈을 밟지 못했다. 박수는 그래도 나왔다.',
         '{t}의 1회말, 주자는 2루까지 갔으나 거기까지였다.',
         '1회말 {t}의 마지막 타자가 큰 타구를 날렸지만, 담장은 멀었다.'],
    1:  ['1회말 {t}가 한 점을 돌려놓았다.',
         '{t}의 1회말 — 홈 관중 앞에서 한 점을 새겼다.',
         '{t}의 1회말 한 점 — 짧은 공격이 길게 남는 법도 있다.',
         '1회말 {t}가 곧바로 한 점으로 응수했다. 경기가 팽팽해졌다.',
         '{t}의 1회말 한 점이 홈을 데웠다. 균형이 한쪽으로 기울지 않았다.'],
    2:  ['1회말 {t}의 방망이가 두 점을 몰아왔다.',
         '{t}가 1회말 두 점으로 경기를 뒤집었다. 홈 관중석이 처음으로 일어섰다.',
         '1회말 {t}의 연속 안타가 두 점으로 이어졌다. 흐름이 홈 쪽으로 넘어왔다.'],
    3:  ['1회말 {t}의 공격이 길게 이어졌다. {s}점이 쏟아졌다.']
  };
  const bucket = s => s >= 3 ? 3 : s;
  const halfLine = (rng, pool, team, score) =>
    pick(rng, pool[bucket(score)]).replace(/\{t\}/g, team).replace(/\{s\}/g, score);

  // ── 헤드라인 풀 (내 경기) ──
  const HL = {
    win_shut:  ['{me}, {opp}를 무득점으로 묶고 {ms}−{os} 승리',
                '한 점도 내주지 않은 밤 — {me}, {opp}전 {ms}−{os}'],
    win_close: ['{me}, 한 점 차의 무게를 끝까지 지켜내다',
                '{me}, {opp}와의 접전 끝에 {ms}−{os} 승리'],
    win_big:   ['{me}의 방망이가 깨어난 날 — {opp}전 {ms}−{os}',
                '{me}, {park}에서 {ms}−{os} 너른 승리'],
    loss_close:['한 점이 모자랐다 — {me}, {opp}전 {os}−{ms}',
                '{me}, 접전 끝 {os}−{ms} 석패. 내일의 타석을 기약'],
    loss_big:  ['오늘은 {opp}의 날이었다 — {me} {os}−{ms} 패배',
                '{me}, {opp}의 타선에 길을 내주다. {os}−{ms}'],
    dice_win:  ['주사위는 {me}의 편이었다 — 운명의 {ms}−{os}'],
    dice_loss: ['주사위가 {opp}를 가리켰다 — {me}, 운명의 한 점에 무릎']
  };

  // ── B 단상 풀 ──
  const ESSAY_OPEN = [
    '야구는 점수보다 오래 남는 것을 기록한다.',
    '한 이닝짜리 경기에도, 하루만큼의 시간이 들어 있다.',
    '구장에 가 본 사람은 안다 — 경기는 스코어보드 바깥에서도 일어난다는 것을.',
    '오늘도 누군가는 이기고 누군가는 졌다. 그리고 둘 다 내일 다시 타석에 선다.'
  ];
  const ESSAY_PRE = [   // 시범경기 전용
    '기록되지 않는 경기가 있다. 그러나 겪지 않은 경기는 아니다.',
    '시범경기의 점수는 어디에도 남지 않는다. 타석에 선 시간만이 남는다.'
  ];
  const ESSAY_CLOSE = [
    '내일도 타석은 열린다. 오전 열 시부터 자정까지.',
    '승패는 결국, 자신과 시간 사이의 일이다.',
    '3할 타자도 열 번 중 일곱 번은 돌아선다. 그래서 야구는 계속된다.',
    '경기는 끝났다. 그러나 오늘 만난 문장들은 이제 막 시작이다.'
  ];

  // ── C 라커룸 — 봇 인격별 코멘트 ──
  const QUOTE = {
    socrates: {
      win:  ['"이긴 쪽이 더 배웠다고 말할 수 있을까. 나는 아직 모르겠네."',
             '"오늘의 승리가 무엇인지 안다고 생각한 순간, 나는 또 하나를 모르게 됐네."'],
      loss: ['"진다는 것이 무엇인지 나는 정말 아는가 — 오늘 그 질문 하나를 얻어 가네."',
             '"패배는 스승이라더군. 그렇다면 나는 오늘 좋은 수업을 받은 셈이지."']
    },
    pascal: {
      win:  ['"기적이 아닙니다. 분포의 한쪽 끝일 뿐이지요."',
             '"오늘의 승리 확률은 어젯밤 이미 계산되어 있었습니다. 다만 말하지 않았을 뿐."'],
      loss: ['"이런 날이 올 확률은 이미 계산 안에 있었습니다. 오늘이 그날이었을 뿐이지요."',
             '"인간은 생각하는 갈대지만, 갈대도 가끔은 헛스윙을 합니다."']
    },
    proust: {
      win:  ['"승리란 지나가고 나서야 비로소 가졌었다는 걸 알게 되는 것이지요."',
             '"이 기쁨의 냄새를 잘 적어 두겠습니다. 언젠가 불현듯 다시 찾아올 테니까요."'],
      loss: ['"이 패배의 맛은… 콩브레의 어느 흐린 오후를 떠올리게 하는군요."',
             '"잃어버린 한 점을 찾아서 — 제 다음 경기의 제목으로 삼지요."']
    }
  };
  const SORO_SILENT = [
    '한편 SORO는 늘 그렇듯 말을 아낀 채, 배트를 닦고 조용히 구장을 나섰다.',
    'SORO의 라커룸은 문이 닫혀 있었다. 안에서 책장 넘기는 소리만 들렸다는 전언이다.',
    'SORO는 인터뷰 요청에 가볍게 목례만 남겼다. 그것으로 충분한 대답이었다.'
  ];

  // ── 다리 단락 — 콘스텔라티오·뮤세움으로 가는 문장 ──
  const BRIDGE_NAMES = [
    '오늘의 타석에는 {names}{j_iga} 함께 들어섰다.',
    '오늘 SORO의 방망이 끝에서 {names}{j_iga} 스쳐 갔다.'
  ];
  const BRIDGE_STAR = [
    '<a href="constella.html">콘스텔라티오의 밤하늘</a>에서 그 별들은 오늘도 빛나고 있다.',
    '경기가 끝난 지금도, <a href="constella.html">콘스텔라티오</a>에서는 그들의 별빛이 깜빡인다.'
  ];
  const BRIDGE_BOOK = [
    '오늘 만난 문장들은 책이 되어 <a href="museum.html">뮤세움 서가</a>에 꽂혔다.',
    '<a href="museum.html">뮤세움 책장</a>에는 오늘의 책이 새로 한 권, 등을 보이고 서 있다.'
  ];

  // 인물 표기 다듬기 (씨앗 prefix → 표시명)
  const NAME_FIX = {
    '빅토르위고': '빅토르 위고', '에드거앨런포': '에드거 앨런 포',
    '레오나르도다빈치': '레오나르도 다 빈치', '미야자와겐지': '미야자와 겐지',
    '헨리데이비드소로': '헨리 데이비드 소로'
  };
  const fixName = n => NAME_FIX[n] || n;

  function bridgePara(rng, persons){
    persons = (persons || []).filter(p => p && p !== 'topic');   // 주제 씨앗 제외 (이중 방어)
    if(!persons.length) return null;
    const names = persons.slice(0, 3).map(fixName).join(', ');
    const last = persons.slice(0, 3).map(fixName).pop();
    const nameLine = pick(rng, BRIDGE_NAMES)
      .replace('{names}', names)
      .replace('{j_iga}', hasJong(last) ? '이' : '가');
    return nameLine + ' ' + pick(rng, BRIDGE_STAR) + ' ' + pick(rng, BRIDGE_BOOK);
  }

  // ── 공통 재료 준비 ──
  function prep(data){
    const rng = makeRng(data.matchId || (data.date + data.homeTeam));
    const home = T(data.homeTeam), away = T(data.awayTeam);
    const hs = data.homeScore ?? 0, as = data.awayScore ?? 0;
    const meHome = data.homeTeam === 'soro';
    const myGame = !!data.isMyGame;
    const me = myGame ? 'SORO' : null;
    const oppCode = myGame ? (meHome ? data.awayTeam : data.homeTeam) : null;
    const opp = oppCode ? T(oppCode).label : null;
    const ms = myGame ? (meHome ? hs : as) : null;
    const os = myGame ? (meHome ? as : hs) : null;
    const winnerCode = hs > as ? data.homeTeam : data.awayTeam;
    const season = seasonOf(data.date);
    const wpool = (WEATHER[data.homeTeam] || WEATHER.soro)[season] || WEATHER.soro[season];
    const weather = pick(rng, wpool).replace('{p}', 7 + Math.floor(rng() * 40));
    return { rng, home, away, hs, as, meHome, myGame, me, oppCode, opp, ms, os,
             winnerCode, season, weather, isPre: data.weekNum === 0 };
  }

  // ── 헤드라인 선택 ──
  function headlineFor(c, data){
    const { rng, home, ms, os, opp } = c;
    let key;
    const diff = Math.abs(ms - os);
    if(ms > os) key = os === 0 ? 'win_shut' : diff >= 3 ? 'win_big' : 'win_close';
    else        key = diff >= 3 ? 'loss_big' : 'loss_close';
    return pick(rng, HL[key])
      .replace(/\{me\}/g, 'SORO').replace(/\{opp\}/g, opp)
      .replace(/\{ms\}/g, ms).replace(/\{os\}/g, os)
      .replace(/\{park\}/g, home.park);
  }

  // ── 리드 문단 ──
  function leadFor(c, data){
    const { home, away, hs, as, myGame, isPre } = c;
    const winner = T(c.winnerCode).label;
    const loser  = winner === home.label ? away.label : home.label;
    const wsc = Math.max(hs, as), lsc = Math.min(hs, as);
    let lead = `${dateK(data.date)}, ${home.park}에서 열린 경기에서 ${josa(winner,'이','가')} ${josa(loser,'을','를')} ${wsc}−${lsc}${roJosa(lsc)} 눌렀다.`;
    if(isPre && myGame) lead += ' 시범경기 — 기록에는 남지 않는 승부였다.';
    return lead;
  }

  // ── 포맷 A. 스트레이트 보도 ──
  function fmtA(c, data){
    const { rng, away, home, as, hs } = c;
    const paras = [];
    paras.push(c.weather + ' ' + pick(rng, CROWD));
    paras.push(halfLine(rng, HALF_AWAY, away.label, as));
    paras.push(halfLine(rng, HALF_HOME, home.label, hs));
    if(c.isPre && c.myGame) paras.push(pick(rng, ESSAY_PRE));
    return paras;
  }

  // ── 포맷 B. 그라운드 단상 ──
  function fmtB(c, data){
    const { rng, ms, os, opp } = c;
    const paras = [];
    paras.push(c.isPre ? pick(rng, ESSAY_PRE) : pick(rng, ESSAY_OPEN));
    const ref = ms > os
      ? `오늘의 ${ms}−${os}은 ${opp}와의 거리가 아니라, 어제의 나와의 거리다. 전광판은 그렇게 읽을 때 비로소 정직해진다.`
      : `${os}−${ms}. 숫자는 오늘 분명히 기울었다. 그러나 타석에 들어선 횟수만큼은 누구도 빼앗아 가지 못한다.`;
    paras.push(ref);
    paras.push(c.weather);
    paras.push(pick(rng, ESSAY_CLOSE));
    return paras;
  }

  // ── 포맷 C. 라커룸 인터뷰 ──
  function fmtC(c, data){
    const { rng, oppCode, opp, ms, os } = c;
    const paras = [];
    paras.push(`경기가 끝난 ${T(c.meHome ? 'soro' : oppCode).park}의 복도는 금세 한산해졌다. 라커룸 앞에서 ${josa(opp,'을','를')} 만났다.`);
    const q = QUOTE[oppCode] || QUOTE.socrates;
    paras.push(`${opp}의 말이다. ${pick(rng, ms > os ? q.loss : q.win)}`);
    paras.push(pick(rng, SORO_SILENT));
    return paras;
  }

  // ── 메인: 전체 기사 조립 ──
  function assemble(data){
    const c = prep(data);
    const { rng } = c;
    let fmt = 'A';
    if(c.myGame) fmt = pickW(rng, [['A', 5], ['B', 3], ['C', 3]]);
    const tag = fmt === 'A' ? '보도' : fmt === 'B' ? '그라운드 단상' : '라커룸';

    const headline = c.myGame
      ? headlineFor(c, data)
      : shortHeadline(c);
    const lead = leadFor(c, data);
    const paras = (fmt === 'A' ? fmtA : fmt === 'B' ? fmtB : fmtC)(c, data);

    if(c.myGame){
      const b = bridgePara(rng, data.persons);
      if(b) paras.push(b);
    }
    return { headline, lead, paragraphs: paras, tag, fmt,
             isPre: c.isPre, dateLabel: dateK(data.date) };
  }

  // ── 단신 (타구장·목록용) ──
  function shortHeadline(c){
    const w = T(c.winnerCode).label;
    const loser = w === c.home.label ? c.away.label : c.home.label;
    const ws = Math.max(c.hs, c.as), ls = Math.min(c.hs, c.as);
    return `${w}, ${josa(loser,'을','를')} ${ws}−${ls}${roJosa(ls)} 꺾다`;
  }
  function assembleShort(data){
    const c = prep(data);
    const headline = c.myGame ? headlineFor(c, data) : shortHeadline(c);
    const summary = leadFor(c, data);
    return { headline, summary, isPre: c.isPre, dateLabel: dateK(data.date) };
  }

  return { assemble, assembleShort };
})();
