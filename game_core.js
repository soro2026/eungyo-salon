/* ===================================================================
 * game_core.js — 은교살롱 EG스타디움 게임 엔진 (공통 모듈)
 * ===================================================================
 *
 * 역할: 모든 리그(루키/싱글A/더블A/트리플A/메이저)에서 공통으로 쓰는
 *       야구 게임의 코어 로직.
 *
 * 호출 관계:
 *   - game_rookie.html → 이 파일을 <script src>로 부름
 *   - 향후 game_singleA.html 등도 같은 방식
 *
 * 설계 원칙 (2026-04-26 확장구조 설계노트 기반):
 *   - 게임 로직 ≠ 리그 규칙
 *   - 리그별 차이는 leagueConfig 객체로 받아서 처리
 *   - 봇 정보(OPPONENTS, HOME, CARD_STATS 등)는 리그별 html에서 선언
 *
 * 분리 작업: 2026-05-01 1-A 매듭에서 추출
 * 출처: index.html 2191~4193 줄 (B블록)
 *
 * ⚠️ 1-A 단계 주의: 이 파일은 아직 활성화되지 않음.
 *    index.html이 여전히 같은 코드를 들고 있고, 작동도 그대로.
 *    이 파일은 "복사본"으로 존재만 하고, 1-B에서 game_rookie.html과
 *    연결될 때 비로소 살아남.
 *
 * 추후 정리할 것 (1-B 단계):
 *   - 루키 전용 데이터를 game_rookie.html로 옮기기
 *     · OPPONENTS, HOME (3801~3845줄)
 *     · CARD_STATS, OPP_STATS (3576~3629줄)
 *     · currentOpp, currentIsHome (3845~3846줄)
 *     · 카드 슬라이드 (3631~3677줄)
 *     · 카운트다운, showStadiumHome, enterStadium, goToHome (3471~3574줄)
 *   - 황금사과 정책 새 정책으로 박기 (5단계)
 *
 * =================================================================== */

// ── 문제 DB: JSON에서 동적 로드 ──
let QS = [];
let QS_LOADED = false;



// 한국어 조사 처리 함수
function getJosa(name, type) {
  const last = name[name.length - 1];
  const code = last.charCodeAt(0);
  const hasBatchim = (code - 0xAC00) % 28 !== 0;
  if (type === 'ga') return hasBatchim ? '이' : '가';
  if (type === 'eul') return hasBatchim ? '을' : '를';
  if (type === 'eun') return hasBatchim ? '은' : '는';
  if (type === 'wa') return hasBatchim ? '과' : '와';
  return '';
}
// 카테고리명 2자 메인명으로 정규화
// categories_standard.md (2026.04.19 확정) 단일 진실 원천 기준
// 입력 형태 3가지 모두 처리:
//   1) "예술 · 아름다움의 형식"  (풀카테고리)
//   2) "예술"                   (메인 2자)
//   3) "아름다움의 형식"         (부제만)
function shortCat(cat) {
  if (!cat) return '';
  const trimmed = cat.trim();

  // 12 메인 카테고리 (categories_standard.md 표준)
  const MAIN_CATS = ['문학','철학','역사','예술','신화','과학','심리','사회','영성','생태','지리','일상'];

  // 1) 메인명이 이미 들어왔으면 그대로 반환 (가장 흔한 경우)
  if (MAIN_CATS.includes(trimmed)) return trimmed;

  // 2) "메인 · 부제" 형태면 split해서 메인 추출
  if (trimmed.includes('·')) {
    const main = trimmed.split('·')[0].trim();
    if (MAIN_CATS.includes(main)) return main;
  }

  // 3) 부제만 들어온 경우 — 부제 → 메인 매핑
  const SUB_TO_MAIN = {
    '종이 위의 인간': '문학',
    '생각의 탄생':   '철학',
    '시간의 지층':   '역사',
    '아름다움의 형식': '예술',
    '신들의 정원':   '신화',
    '우주의 문법':   '과학',
    '내면의 거울':   '심리',
    '세상의 구조':   '사회',
    '초월의 언어':   '영성',
    '땅의 노래':     '생태',
    '세계의 골목':   '지리',
    '삶의 향기':     '일상',
  };
  if (SUB_TO_MAIN[trimmed]) return SUB_TO_MAIN[trimmed];

  // 4) 옛 표준 흔적 fallback (마이그레이션 잔해 보호)
  const LEGACY_MAP = {
    '권력과 자본': '사회',
    '삶의 맛':    '일상',
  };
  if (LEGACY_MAP[trimmed]) return LEGACY_MAP[trimmed];

  // 5) 부분 일치 fallback
  for (const [sub, main] of Object.entries(SUB_TO_MAIN)) {
    if (trimmed.includes(sub) || sub.includes(trimmed)) return main;
  }

  // 6) 마지막 fallback — 앞 2자
  return trimmed.slice(0, 2);
}
// 풀배경 이미지 랜덤 선택 (stadium_bg_01.webp ~ stadium_bg_30.webp)
// 하루에 1번 랜덤 선택 → localStorage에 저장 → 같은 날엔 같은 배경
const STADIUM_BG_COUNT = 30;
function getTodayBgIndex() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const stored = localStorage.getItem('eg_stadium_bg_today');
  if (stored) {
    try {
      const { date, idx } = JSON.parse(stored);
      if (date === today) return idx; // 같은 날이면 저장된 거 재사용
    } catch (e) {}
  }
  // 새 날 → 랜덤 선택 후 저장
  const idx = Math.floor(Math.random() * STADIUM_BG_COUNT) + 1;
  localStorage.setItem('eg_stadium_bg_today', JSON.stringify({ date: today, idx }));
  return idx;
}
function applyRandomStadiumBg(fieldBgEl) {
  if (!fieldBgEl) return;
  const idx = getTodayBgIndex();
  const num = String(idx).padStart(2, '0');
  const url = `stadium_bg_${num}.webp`;
  // 기존 잔디 클래스 제거 후 풀배경 클래스 적용
  fieldBgEl.classList.remove('stadium-soro', 'stadium-socrates', 'stadium-proust', 'stadium-pascal');
  fieldBgEl.classList.add('stadium-bg-image');
  // ::before 가상요소에 배경 이미지 동적 적용 (CSS 변수 활용)
  fieldBgEl.style.setProperty('--stadium-bg-url', `url('${url}')`);
}

// ===================================================================
// v1.5 헬퍼 — 형식 정규화·셔플·정답 비교
// 매뉴얼 v1.7 5.6~5.9절 합의 시안 흡수
// ===================================================================

/**
 * question_type 정규화 — 영문(카리)·한글(매뉴얼) 둘 다 받음
 * 30년 호환을 위한 길
 */
function getNormalizedType(qType) {
  if (!qType) return '주관식';
  const t = String(qType).trim().toLowerCase();
  if (t === 'subjective' || t === '주관식') return '주관식';
  if (t === 'multiple_choice' || t === 'mc' || t === '객관식') return '객관식';
  if (t === 'ox' || t === 'o/x') return 'OX';
  return '주관식'; // 기본값
}

/**
 * 객관식 보기 셔플 — Fisher-Yates
 * answer 텍스트 비교 모양이라 correct_index 재계산 불필요
 */
function shuffleChoices(choices) {
  if (!Array.isArray(choices)) return [];
  const shuffled = [...choices];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 객관식 정답 판정 — 클릭한 보기 텍스트 vs answer (+ aliases)
 * 띄어쓰기·번역어 차이 흡수를 위해 aliases도 함께 비교
 */
function checkAnswerMC(userChoice, question) {
  if (userChoice === question.answer) return true;
  // aliases 안에 있어도 정답 처치 (띄어쓰기·번역어 차이)
  if (Array.isArray(question.aliases)) {
    for (const alias of question.aliases) {
      if (userChoice === alias) return true;
    }
  }
  // 정규화 비교 (공백·구두점 제거 후 비교) — 마지막 안전망
  const normUser = String(userChoice).replace(/\s+/g, '').replace(/[·,.!?]/g, '');
  const normAnswer = String(question.answer).replace(/\s+/g, '').replace(/[·,.!?]/g, '');
  return normUser === normAnswer;
}

/**
 * OX 정답 판정 — "O" 또는 "X"
 */
function checkAnswerOX(userChoice, question) {
  return userChoice === question.answer;
}

/**
 * 객관식 보기 버튼 렌더 — 셔플된 순서로 화면에 띄움
 * 보기 클릭 = 타격 + 정답 처리 한 번에
 */
function renderMCButtons(q) {
  const panel = document.getElementById('mc-panel');
  if (!panel) return;
  const shuffled = shuffleChoices(q.choices);
  panel.innerHTML = '';
  shuffled.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'btn-mc';
    btn.textContent = choice;
    btn.onclick = () => hitMC(choice);
    panel.appendChild(btn);
  });
  panel.style.display = 'flex';
}

/**
 * OX 보기 버튼 렌더
 */
function renderOXButtons(q) {
  const panel = document.getElementById('ox-panel');
  if (!panel) return;
  panel.innerHTML = '';
  ['O', 'X'].forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'btn-ox btn-' + choice.toLowerCase();
    btn.textContent = choice;
    btn.onclick = () => hitOX(choice);
    panel.appendChild(btn);
  });
  panel.style.display = 'flex';
}

/**
 * 객관식 보기 클릭 — 타격 + 정답 처리 한 번에
 */
function hitMC(choice) {
  if (st.phase !== 'typing') return; // 타이핑 중에만 유효
  clearAll();
  st.hitMs = st.elapsed;
  // 보기 카드 모두 비활성화 (중복 클릭 방지)
  const panel = document.getElementById('mc-panel');
  if (panel) {
    panel.querySelectorAll('button').forEach(b => b.disabled = true);
    panel.style.display = 'none';
  }
  SND.hit();
  processAns(choice);
}

/**
 * OX 보기 클릭 — 타격 + 정답 처리 한 번에
 */
function hitOX(choice) {
  if (st.phase !== 'typing') return;
  clearAll();
  st.hitMs = st.elapsed;
  const panel = document.getElementById('ox-panel');
  if (panel) {
    panel.querySelectorAll('button').forEach(b => b.disabled = true);
    panel.style.display = 'none';
  }
  SND.hit();
  processAns(choice);
}

/**
 * 뮤세움 연동 — 회원이 경험한 문제를 quiz_log에 기록
 *
 * 정신: 정답·오답 무관하게 *경험한 문제*는 모두 책등으로 박힘.
 *      〈잃어버리기 연습〉의 정신 — 한 번의 마주침이 곧 영원한 책꽂이.
 *
 * 호출 자리: processAns(타격) / doAutoOut(시간초과) / showReveal(각인)
 * INSERT 시점: 결과 화면 도달 직전
 *
 * 안전망:
 *  - 비로그인 회원: 조용히 스킵
 *  - 수비 시: 봇의 답이라 INSERT 안 함
 *  - 중복 (같은 문제 두 번째): UPSERT 없이 INSERT — 같은 문제 여러 번 풀어도 한 번만 책으로
 *    (실제 중복 처치는 museum.html이 answer 키로 dedupe 하므로 부담 없음)
 *  - 네트워크 실패: 콘솔 경고만, 게임 흐름 안 끊김
 */
async function logQuizToMuseum(q) {
  // 수비 중에는 INSERT 안 함 (봇 답이라)
  if (!st.isAttack) return;
  // 비로그인 회원은 스킵
  if (!currentUser) return;
  if (!q || !q.answer) return;

  try {
    const session = (await supa.auth.getSession()).data.session;
    if (!session) return;
    const token = session.access_token;

    await fetch(`${SUPA_URL}/rest/v1/quiz_log`, {
      method: 'POST',
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        uid: currentUser.id,
        answer: q.answer,
        seed_id: q.seed_id || '',
        category: q.cat || ''
      })
    });
  } catch (e) {
    console.warn('[뮤세움 연동] quiz_log INSERT 실패 (무시):', e?.message || e);
    // 게임 흐름 안 끊음
  }
}


async function loadQuestions() {
  // ── 문제 파일 목록을 questions_index.json에서 동적 로드 ──
  //   (인물 추가 시 인덱스만 수정 — game_core는 안 건드림)
  let files = null;
  try {
    const idx = await fetch('questions_index.json?t=' + Date.now()).then(r => r.json());
    if (Array.isArray(idx.files) && idx.files.length) files = idx.files;
  } catch (e) {
    console.warn('[문제] questions_index.json 로드 실패 — 폴백 목록 사용', e?.message || e);
  }
  if (!files) {
    // 폴백: 인덱스 못 읽을 때 최소 풀
    files = [
      'questions_davinci.json', 'questions_homer.json', 'questions_mozart.json',
      'questions_ovid.json', 'questions_sejong.json', 'questions_shakespeare.json',
      'questions_socrates.json', 'questions_tolstoy.json', 'questions_vangogh.json'
    ];
  }
  const results = await Promise.all(
    files.map(f => fetch(f).then(r => r.json()).catch(() => ({ questions: [] })))
  );
  QS = results.flatMap(r => r.questions.map(q => ({
    seed_id: q.seed_id,
    difficulty: q.difficulty,
    cat: q.category,
    keyword: q.keyword,
    zone_keyword: q.zone_keyword || '',
    text: q.text,
    answer: q.answer,
    display: q.display || q.title || q.answer,
    boxes: q.boxes,
    initials: q.initials,
    library: q.library || {},
    // ── v1.5 신규 필드 (OX·객관식·주관식 호환) ──
    question_type: getNormalizedType(q.question_type),
    aliases: Array.isArray(q.aliases) ? q.aliases : [],
    choices: Array.isArray(q.choices) ? q.choices : [],
    title: q.title || '',
    // ── 0층·큐레이션·메타 (콘스텔라티오·뮤세움·함수 A·B용) ──
    constellatio_card: q.constellatio_card || null,
    curation_links: q.curation_links || null,
    metadata: q.metadata || null,
    figures: Array.isArray(q.figures) ? q.figures : []
  })));
  // ── 균등 분배 셔플 (seed_id별 골고루, 난이도 랜덤) ──
  // 1. seed_id별로 그룹화
  const seedMap = {};
  QS.forEach(q => {
    if(!seedMap[q.seed_id]) seedMap[q.seed_id] = [];
    seedMap[q.seed_id].push(q);
  });
  // 2. 각 그룹 내부 난이도를 랜덤 셔플
  Object.values(seedMap).forEach(group => {
    for(let i = group.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [group[i], group[j]] = [group[j], group[i]];
    }
  });
  // 3. 그룹 순서를 랜덤 셔플
  const seeds = Object.keys(seedMap).sort(() => Math.random() - 0.5);
  // 4. 라운드 로빈 — 각 그룹에서 1개씩 돌아가며 배열 구성
  //    매 라운드 주제 순서도 다시 셔플 (패턴 방지)
  const result = [];
  const maxRounds = Math.max(...seeds.map(s => seedMap[s].length));
  for(let round = 0; round < maxRounds; round++){
    const roundSeeds = [...seeds].sort(() => Math.random() - 0.5);
    roundSeeds.forEach(seed => {
      if(seedMap[seed][round]) result.push(seedMap[seed][round]);
    });
  }
  QS = result;
  QS_LOADED = true;
  console.log('문제 DB 로드 완료: 총 ' + QS.length + '문제 (균등 분배 셔플 완료 / ' + seeds.length + '주제)');
  // 매트릭스 갱신 (로드 후) - initGame 재실행으로 전체 갱신
  initGame();
}


const TS=75, CIRC=132, JSEC=5, AI_AVG=0.31;
const PITCHER=`<svg class="icon" viewBox="0 0 34 34"><circle cx="17" cy="9" r="5" fill="rgba(248,244,238,0.7)"/><rect x="12" y="14" width="10" height="10" rx="3" fill="rgba(248,244,238,0.7)"/><line x1="22" y1="16" x2="30" y2="10" stroke="rgba(248,244,238,0.7)" stroke-width="2.5" stroke-linecap="round"/><line x1="14" y1="24" x2="11" y2="32" stroke="rgba(248,244,238,0.7)" stroke-width="2.5" stroke-linecap="round"/><line x1="20" y1="24" x2="23" y2="32" stroke="rgba(248,244,238,0.7)" stroke-width="2.5" stroke-linecap="round"/></svg>`;
const CATCHER=`<svg class="icon" viewBox="0 0 34 34"><circle cx="17" cy="9" r="5" fill="rgba(248,244,238,0.7)"/><rect x="10" y="12" width="14" height="4" rx="2" fill="rgba(248,244,238,0.4)"/><rect x="11" y="14" width="12" height="10" rx="3" fill="rgba(248,244,238,0.7)"/><line x1="11" y1="17" x2="4" y2="13" stroke="rgba(248,244,238,0.7)" stroke-width="2.5" stroke-linecap="round"/><circle cx="4" cy="12" r="3.5" fill="rgba(248,244,238,0.4)" stroke="rgba(248,244,238,0.7)" stroke-width="1.5"/><line x1="14" y1="24" x2="12" y2="32" stroke="rgba(248,244,238,0.7)" stroke-width="2.5" stroke-linecap="round"/><line x1="20" y1="24" x2="22" y2="32" stroke="rgba(248,244,238,0.7)" stroke-width="2.5" stroke-linecap="round"/></svg>`;
const BATTER=`<svg class="icon" viewBox="0 0 34 34"><circle cx="17" cy="9" r="5" fill="rgba(248,244,238,0.7)"/><rect x="12" y="14" width="10" height="10" rx="3" fill="rgba(248,244,238,0.7)"/><line x1="12" y1="16" x2="4" y2="10" stroke="rgba(248,244,238,0.7)" stroke-width="2.5" stroke-linecap="round"/><line x1="4" y1="10" x2="1" y2="6" stroke="rgba(248,244,238,0.7)" stroke-width="3" stroke-linecap="round"/><line x1="14" y1="24" x2="11" y2="32" stroke="rgba(248,244,238,0.7)" stroke-width="2.5" stroke-linecap="round"/><line x1="20" y1="24" x2="23" y2="32" stroke="rgba(248,244,238,0.7)" stroke-width="2.5" stroke-linecap="round"/></svg>`;

// 상황별 복수 중계 멘트 — 랜덤 선택
const MSGS_POOL={
  homerun:[
    ["타격 — 완벽한 스윙입니다!","공이 하늘 높이 솟구칩니다...","올라갑니다, 올라가요...","펜스를 훌쩍 넘어갑니다!!","홈런!! 장외 홈런입니다!!!"],
    ["배트가 공을 정확히 때렸습니다!","강렬한 타구! 외야 깊숙이!","외야수가 뒤로 달립니다...","펜스 앞에 서 있는 외야수, 고개를 젖힙니다...","넘어갔습니다! 홈런입니다!!"],
    ["풀스윙! 몸이 돌아갑니다!","공이 포물선을 그리며 날아갑니다...","펜스 쪽으로, 점점 가까워집니다...","외야수 포기! 뒤돌아봅니다!","홈런!! 관중이 일어섭니다!!!"],
    ["타이밍이 완벽합니다! 임팩트!","공이 빛처럼 뻗어나갑니다...","이건... 이건 안 잡힙니다!","펜스를 넘었습니다! 넘었어요!!","솔로 홈런!! 환호성이 터집니다!!!"],
    ["스윙! 딱! 하는 타격음이 들립니다!","외야로 날아가는 공... 엄청난 타구!","외야수가 울타리 쪽으로 전력 질주!","손이 닿지 않습니다! 닿지 않아요!","홈런!! 이 교양은 담장을 넘었습니다!!!"],
  ],
  triple:[
    ["타격! 깊은 외야로 뻗어나갑니다!","외야수가 코너를 향해 달립니다...","공이 외야 잔디를 굴러갑니다!","타자가 2루를 돌아 3루로!!","3루타! 슬라이딩! 세이프!!!"],
    ["강한 타구! 코너를 향해 날아갑니다!","좌익수가 담장을 등지고 달립니다...","공이 담장을 맞고 튕깁니다!","타자가 전속력으로 달립니다! 2루 통과!","3루타!! 베이스를 세 개나 밟았습니다!"],
    ["라인드라이브! 외야 코너로!","중견수와 좌익수 사이로 빠집니다!","타자가 1루를 무섭게 달립니다!","2루 코치가 손을 돌립니다! 계속 뛰어요!","3루타! 슬라이딩 세이프!! 박진감 넘칩니다!"],
  ],
  double:[
    ["타격! 중견수 앞으로 날아갑니다!","외야수가 달려갑니다...","공이 잔디를 구릅니다!","타자가 1루를 돌아 2루로!","2루타! 세이프입니다!"],
    ["좋은 타구! 좌중간으로 뻗어나갑니다!","두 명의 외야수가 협공을 시도합니다!","공이 사이를 빠져나갑니다!","타자가 전력 질주! 2루를 노립니다!","2루타!! 다이빙 슬라이딩! 세이프!!!"],
    ["임팩트! 우중간 깊숙이!","우익수가 전력 질주합니다!","이 공... 잡힐까요? 못 잡겠습니다!","타자가 1루를 돌아 2루로 쇄도합니다!","2루타! 유유히 2루에 섭니다!"],
    ["배트 끝에 맞았지만 힘이 있습니다!","좌익수가 옆으로 달립니다...","담장 앞에서 멈추는 공!","타자가 2루까지 달려갑니다!","2루타! 럭키 트윈 베이스히트!!"],
    ["멋진 타이밍! 좌익선상으로!","파울인가 페어인가!","페어볼! 담장을 맞고 굴러갑니다!","타자가 쏜살같이 달립니다!","2루타입니다! 라인드라이브 2루타!"],
    ["강습 타구! 3루수 옆을 빠져나갑니다!","유격수가 커버하러 달려갑니다!","따라잡을 수 없는 타구 속도!","타자가 망설임 없이 2루로!","2루타! 우직한 2루타입니다!"],
    ["풀카운트 끝에 터진 타격!","외야 깊숙이 날아갑니다!","외야수가 뒤로 달리지만...","공이 먼저 땅에 닿습니다!","2루타!! 결정적인 한 방!"],
    ["스트레이트를 공략했습니다!","중견수 정면이지만 깊습니다!","아웃이냐 안타냐... 아! 땅에 닿습니다!","타자가 재빠르게 2루로!","2루타! 발 빠른 2루타!!"],
    ["인사이드 아웃 스윙!","우익선상으로 날카롭게 뻗습니다!","우익수가 코너로 달립니다!","공이 담장 모서리를 맞고 튕깁니다!","2루타! 코너를 공략한 영리한 타격!"],
    ["끝내기 상황은 아니지만... 타격!","외야로 뻗어나가는 타구!","수비 시프트 사이를 뚫었습니다!","타자가 힘껏 달립니다!","2루타! 시프트를 무력화했습니다!"],
  ],
  single:[
    ["타격! 내야를 강하게 굴러갑니다!","유격수가 몸을 날립니다...","손에 닿지 않습니다!","타자가 1루로 전력 질주!","단타! 내야 안타입니다!"],
    ["라인드라이브! 2루수 옆을 빠져나갑니다!","오른쪽 외야로 굴러가는 공!","우익수가 달려가 공을 잡습니다!","타자가 1루 베이스를 밟습니다!","단타입니다! 깔끔한 히트!"],
    ["타격! 투수 글러브 옆을 맞고 튕깁니다!","내야에 공이 떨어집니다!","1루수가 달려가지만 늦었습니다!","세이프! 내야 안타!","단타! 행운의 히트입니다!"],
    ["배트에 맞았습니다! 중전 안타성!","중견수가 앞으로 달려옵니다!","공이 잔디를 구릅니다!","1루수가 베이스를 밟으며 공을 기다립니다!","단타! 깨끗한 중전 안타!"],
    ["끊어치기! 3루수 앞으로!","3루수가 돌진합니다!","공을 집어올리지만 타자가 더 빠릅니다!","세이프! 박빙의 승부!","단타! 내야 안타로 출루합니다!"],
    ["코스를 잘 공략했습니다!","좌중간 방향으로 낮게 뻗습니다!","유격수가 점프하지만 닿지 않습니다!","타자가 여유있게 1루로!","단타! 정교한 히트!"],
    ["스윙! 배트 끝에 맞았지만...","공이 예상외로 뻗어나갑니다!","외야수가 달려오지만 앞에 떨어집니다!","타자가 뛰어서 1루로!","단타! 테キサス 리거 안타!"],
    ["투수의 공을 받아쳤습니다!","1루선상으로 날카롭게!","1루수가 베이스를 지키며 잡을 수 없습니다!","타자가 들어옵니다!","단타! 1루선을 가른 히트!"],
    ["타격! 유격수와 3루수 사이로!","두 선수 다 소리를 지르며 달려갑니다!","공이 사이를 빠져나갑니다!","타자가 1루로!","단타! 틈새를 파고들었습니다!"],
    ["끈질긴 파울 연속 끝에 타격!","내야와 외야 사이에 떨어집니다!","유격수와 좌익수 모두 닿지 않습니다!","빠른 발로 1루를 밟습니다!","단타! 끈기가 만들어낸 안타!"],
  ],
  bb:[
    ["공이 바깥쪽으로 흘러갑니다...","포수가 글러브를 뻗습니다...","심판이 바라봅니다...","볼! 네 번째 볼입니다!","볼넷! 타자가 1루로 걸어나갑니다."],
    ["낮게 빠지는 공...","배트가 멈춥니다. 참았습니다!","포수가 공을 잡지만...","심판의 판정은... 볼!","볼넷! 선구안이 빛났습니다."],
    ["바깥쪽 코너를 벗어났습니다...","타자가 배트를 내리지 않았습니다!","투수가 고개를 숙입니다...","볼 판정!","볼넷으로 출루합니다. 선구안 승리!"],
  ],
  out:[
    ["스윙!","헛스윙입니다! 배트가 공을 못 잡았습니다!","포수가 공을 안정적으로 잡습니다!","심판이 오른손을 번쩍 올립니다!","삼진! 스트라이크아웃!!"],
    ["배트가 돌아갑니다!","하지만 공이 이미 포수 미트 안에 있습니다!","헛스윙! 낚였습니다!","배트를 힘없이 내리는 타자...","삼진! 투수의 완벽한 공!"],
    ["스윙— 맞았나요?","파울! 파울이었습니다!","타자가 헛웃음을 짓습니다...","그리고 다시 스윙!","삼진! 결국 무릎을 꿇었습니다."],
    ["낮은 공에 손이 나갑니다...","배트가 공 밑을 통과했습니다!","헛스윙! 완전히 속았습니다!","타자가 타석을 벗어납니다...","삼진! 변화구의 마법이었습니다."],
    ["큰 스윙!","완전히 타이밍이 맞지 않았습니다!","공은 이미 포수 미트 속으로...","타자가 배트를 바닥에 내려놓습니다...","삼진! 압도적인 삼진입니다!"],
    ["조심스러운 스윙...","배트가 공을 살짝 빗나갑니다!","포수 미트에 공이 안착합니다!","아깝습니다! 조금만 더 당겼어도...","삼진! 간발의 차이었습니다."],
    ["배트가 나오다가 멈췄나요?","아니! 스윙으로 판정됩니다!","타자가 심판에게 따지지만...","판정은 번복되지 않습니다!","삼진! 체크스윙 삼진입니다!"],
    ["이 공을 칠 수 있을까요...","바깥쪽 낮은 코스로 꽂히는 공!","배트가 돌아가지만 맞지 않습니다!","포수가 환호하며 공을 들어올립니다!","삼진! 코너 웍의 승리입니다!"],
    ["몸쪽 빠른 공에 배트가 나옵니다!","공이 배트 안쪽을 통과합니다!","헛스윙! 속구에 완전히 압도당했습니다!","타자가 황당한 표정을 짓습니다...","삼진!! 손도 못 댔습니다!"],
    ["마지막 공... 타자가 배트를 올립니다!","풀스윙! 전력을 다한 스윙이지만!","공기만 가르는 배트...","정적이 흐릅니다...","삼진! 게임, 마무리됩니다."],
  ],
  timeout:[
    ["시간이 다 됐습니다...","타자가 아직 배트를 들지 못했습니다!","포수가 공을 받아 심판에게 건넵니다...","심판이 손을 올립니다...","시간 초과 아웃! 더 빠르게 생각해야 합니다!"],
    ["타임바가 바닥을 치고 있습니다!","타자가 망설이고 있습니다...","공이 포수 미트에 쏙 들어갑니다!","배트를 들지도 못한 채...","삼진! 시간이 먼저였습니다!"],
    ["초읽기... 3... 2... 1...","타자가 뒤늦게 배트를 올립니다!","하지만 너무 늦었습니다!","심판이 아웃을 선언합니다...","시간 초과! 조금만 더 빨리 생각해봐요!"],
  ],
  ai_hit:[
    ["마들렌이 배트를 들어올립니다...","공을 주시합니다... 스윙!","맞았습니다! 타구가 날아갑니다!","외야수가 달려가지만 늦었습니다!","안타! 마들렌이 출루합니다."],
    ["마들렌이 타이밍을 잡습니다!","공이 날아오고... 스윙!","라인드라이브! 내야를 뚫었습니다!","1루수가 손을 뻗지만 닿지 않습니다!","안타! 마들렌의 집중력이 빛납니다."],
    ["마들렌, 여유있게 기다립니다...","투수가 공을 던집니다!","딱! 배트에 정확히 맞습니다!","공이 외야로 뻗어나갑니다!","안타! 마들렌이 진루합니다."],
  ],
  ai_homerun:[
    ["마들렌이 강하게 배트를 들어올립니다!","공이 날아오고... 풀스윙!!","엄청난 타구! 하늘 높이 솟아오릅니다!","외야수가 뒤로 달리지만... 안 됩니다!","홈런!! 마들렌의 장외 홈런! 실점입니다."],
    ["마들렌, 지금 자세가 심상치 않습니다!","배트가 돌아갑니다! 임팩트!","공이 펜스를 향해 직선으로!","넘어갑니다! 넘어가요!!","홈런 허용!! 마들렌에게 무릎을 꿇었습니다."],
    ["마들렌이 공을 기다립니다... 스윙!","이 타구... 방향이 심상치 않습니다!","외야수가 고개를 들고 바라보기만 합니다!","관중석으로 빨려들어 갑니다!!","홈런!! 실점. 마들렌의 완벽한 한 방!"],
  ],
  ai_out:[
    ["마들렌이 배트를 올립니다...","공이 날아옵니다! 스윙!","빗나갔습니다! 헛스윙!","포수가 공을 잡습니다!","아웃! 잘 막아냈습니다 ⚾"],
    ["마들렌, 공을 노리고 있습니다...","투수가 공을 뿌립니다!","배트가 돌지만 공이 없습니다!","포수 미트에 딱 소리가 납니다!","삼진! 완벽한 피칭이었습니다 ⚾"],
    ["마들렌이 스윙 타이밍을 잽니다...","낮게 들어오는 공에 배트가 나옵니다!","배트 아래로 공이 통과합니다!","포수가 공을 잡으며 환호합니다!","아웃! 변화구가 통했습니다 ⚾"],
  ],
  // ── 100칸 시스템 신규 결과 (v1.0 임시 멘트 / 매듭3에서 포지션·동작 조합으로 대체 예정) ──
  strikeout:[
    ["스윙!","헛스윙입니다!","포수 미트에 공이 꽂힙니다!","심판의 손이 올라갑니다!","삼진 아웃!"],
    ["배트가 나오지 않습니다...","공이 한복판을 가릅니다!","꼼짝 못 했습니다!","루킹 삼진!","아웃! 완벽한 코스였습니다."],
  ],
  groundout:[
    ["타격! 공이 땅을 강하게 구릅니다!","내야수가 몸을 숙입니다...","잡아서 1루로 송구!","아웃! 깔끔한 땅볼 처리입니다."],
    ["빠른 땅볼 타구!","내야수 정면으로 향합니다!","여유 있게 잡아 던집니다!","땅볼 아웃입니다."],
  ],
  flyout:[
    ["타격! 공이 외야로 높이 떠오릅니다!","외야수가 자리를 잡습니다...","낙구 지점에서 기다립니다!","아웃! 평범한 뜬공입니다."],
    ["공이 하늘로 솟구칩니다!","외야수가 뒷걸음으로 따라갑니다...","글러브 안으로!","뜬공 아웃입니다."],
  ],
  popout:[
    ["빗맞았습니다! 내야에 높이 떴습니다!","내야수들이 서로 부릅니다...","가볍게 잡아냅니다!","팝업 아웃! 아쉬운 타구입니다."],
  ],
  lineout:[
    ["강한 타구! 빨랫줄처럼 뻗어나갑니다!","하지만 수비수 정면입니다!","몸을 날려 잡아냅니다!","직선타 아웃! 잘 맞았지만 아쉽습니다."],
  ],
  hbp:[
    ["공이 몸쪽으로 바짝 붙습니다...","앗! 타자의 몸을 맞혔습니다!","타자가 1루로 향합니다.","몸에 맞는 볼! 출루합니다."],
  ],
  error:[
    ["타격! 평범한 타구입니다...","아! 수비수가 공을 놓칩니다!","타자가 재빨리 1루로!","실책! 행운의 출루입니다."],
  ],
};
// 상대팀 한글 이름 (조사 처리용)
function getOppKor(){
  if(!currentOpp) return '프루스트';
  return currentOpp.name || 'AI';
}
// 랜덤 멘트 선택 함수 (상대팀명 + 조사 동적 치환)
function getMsg(key){
  let pool=MSGS_POOL[key];
  if(!pool){ pool = MSGS_POOL[ (OUT_META&&OUT_META[key]) ? 'out' : 'single' ] || MSGS_POOL.single; }
  const msgs = pool[Math.floor(Math.random()*pool.length)];
  const name = getOppKor();
  return msgs.map(m =>
    m.replace(/마들렌이/g, name + getJosa(name,'ga'))
     .replace(/마들렌의/g, name + '의')
     .replace(/마들렌에게/g, name + '에게')
     .replace(/마들렌/g, name)
  );
}

// ── 존 보드 전역 상태 ──
let ZONE_BOARD = [];      // 현재 9개 존 카드 [{q, status:'pending'|'correct'|'wrong'}]
let ZONE_SELECTED = null; // 현재 선택된 인덱스
let GAME_ACTIVE = false;  // 게임 진행 중 여부 (오디오 제어용)

// ── 한 경기 누적 사용 ── v1.5+
// 공격·수비 자세 무관하게 한 경기에서 같은 문제·인물·정답이 두 번 등장 안 하게
// 새 경기 시작 시 startNewGame에서 청산
let GAME_USED_SEEDS = new Set();
let GAME_USED_FIGURES = new Set();
let GAME_USED_ANSWERS = new Set();

// 최근 사용된 문제 ID 추적 (중복 출제 방지)
// 12개 카테고리 순환 인덱스 (라운드로빈)
// categories_standard.md 기준 — 2글자 메인명으로 통일
const CAT_FULL_NAMES = [
  '문학', '철학', '역사', '예술',
  '신화', '과학', '심리', '사회',
  '영성', '생태', '지리', '일상'
];
// 항상 고정되는 3개 카테고리
const CAT_FIXED = ['문학', '철학', '예술'];
// CAT_ROTATION_IDX 제거 — 고정3+랜덤6 방식으로 교체

function buildZoneBoard() {
  // ── 존 보드 9칸 구성 규칙 ──
  // 고정 3칸: 문학 / 철학 / 예술 (항상 포함)
  // 랜덤 6칸: 나머지 9개 카테고리 중 6개 랜덤 선택
  // ── v1.5+ 중복 방지 ──
  // 한 게임에 같은 인물 두 번 나오지 않도록:
  //   ① 같은 seed_id 두 번 안 뽑음
  //   ② 같은 figures(주인공 인물) 두 번 안 뽑음
  //   ③ 같은 answer 두 번 안 뽑음 (다른 인물이 같은 작품 만든 경우 대비)

  const picked = [];
  const usedSeedIds = new Set();
  const usedFigures = new Set();   // 이미 등장한 인물 이름들
  const usedAnswers = new Set();   // 이미 등장한 정답들
  const usedCats = new Set();      // 이미 등장한 카테고리들

  // 한 문제가 중복 조건에 걸리는지 체크
  // — 이번 보드 안 + 이번 경기 누적 둘 다 회피
  function isDuplicate(q) {
    if (usedSeedIds.has(q.seed_id) || GAME_USED_SEEDS.has(q.seed_id)) return true;
    if (usedAnswers.has(q.answer) || GAME_USED_ANSWERS.has(q.answer)) return true;
    // figures 배열 안의 *어느 한 인물*이라도 이미 등장했으면 중복
    if (Array.isArray(q.figures)) {
      for (const fig of q.figures) {
        if (usedFigures.has(fig) || GAME_USED_FIGURES.has(fig)) return true;
      }
    }
    return false;
  }

  // 한 문제를 picked에 등록 (이번 보드 + 경기 누적 둘 다 박음)
  function register(q) {
    picked.push(q);
    usedSeedIds.add(q.seed_id);
    usedAnswers.add(q.answer);
    GAME_USED_SEEDS.add(q.seed_id);
    GAME_USED_ANSWERS.add(q.answer);
    if (Array.isArray(q.figures)) {
      q.figures.forEach(fig => {
        usedFigures.add(fig);
        GAME_USED_FIGURES.add(fig);
      });
    }
    const qCat = q.cat ? q.cat.split('·')[0].trim() : '';
    if (qCat) usedCats.add(qCat);
  }

  // 카테고리별 문제 1개 선택 헬퍼 (중복 회피)
  function pickFromCat(catName) {
    const pool = QS.filter(q => {
      const qCat = q.cat ? q.cat.split('·')[0].trim() : '';
      return qCat === catName && !isDuplicate(q);
    });
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // 1. 고정 3칸: 문학 / 철학 / 예술
  CAT_FIXED.forEach(catName => {
    const q = pickFromCat(catName);
    if (q) register(q);
  });

  // 2. 나머지 9개 카테고리 중 6개 랜덤 선택
  const remainCats = CAT_FULL_NAMES.filter(c => !CAT_FIXED.includes(c));
  // Fisher-Yates 셔플로 랜덤 6개 뽑기
  for (let i = remainCats.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remainCats[i], remainCats[j]] = [remainCats[j], remainCats[i]];
  }
  remainCats.slice(0, 6).forEach(catName => {
    const q = pickFromCat(catName);
    if (q) register(q);
  });

  // 3. 부족하면 전체에서 채우기 (fallback)
  // — 풀이 작아서 figures 중복 회피로 9칸 못 채울 수도 있음
  // — 1차: figures + 카테고리 중복 모두 회피
  // — 2차: 카테고리만 회피 (figures 양보)
  // — 3차: seed_id·answer만 회피 (모두 양보) — 풀 너무 작을 때만 도달
  if (picked.length < 9) {
    const fallback = [...QS].sort(() => Math.random() - 0.5);
    // 1차: figures + 카테고리 모두 회피
    for (const q of fallback) {
      if (picked.length >= 9) break;
      const qCat = q.cat ? q.cat.split('·')[0].trim() : '';
      if (!isDuplicate(q) && !usedCats.has(qCat)) register(q);
    }
    // 2차: 카테고리만 회피 (figures 양보)
    if (picked.length < 9) {
      for (const q of fallback) {
        if (picked.length >= 9) break;
        const qCat = q.cat ? q.cat.split('·')[0].trim() : '';
        if (!usedSeedIds.has(q.seed_id) && !usedAnswers.has(q.answer) 
            && !GAME_USED_SEEDS.has(q.seed_id) && !GAME_USED_ANSWERS.has(q.answer)
            && !usedCats.has(qCat)) {
          picked.push(q);
          usedSeedIds.add(q.seed_id);
          usedAnswers.add(q.answer);
          GAME_USED_SEEDS.add(q.seed_id);
          GAME_USED_ANSWERS.add(q.answer);
          usedCats.add(qCat);
        }
      }
    }
    // 3차: 모두 양보 — 12 카테고리 풀이 9개 미만일 때만 도달
    if (picked.length < 9) {
      for (const q of fallback) {
        if (picked.length >= 9) break;
        if (!usedSeedIds.has(q.seed_id) && !usedAnswers.has(q.answer)) {
          picked.push(q);
          usedSeedIds.add(q.seed_id);
          usedAnswers.add(q.answer);
          GAME_USED_SEEDS.add(q.seed_id);
          GAME_USED_ANSWERS.add(q.answer);
        }
      }
    }
  }

  // 4. 9칸 순서 자체도 랜덤 셔플 (고정칸이 항상 같은 위치에 안 오도록)
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }

  ZONE_BOARD = picked.slice(0, 9).map(q => ({ q, status: 'pending' }));
  ZONE_SELECTED = null;
}

function renderZoneBoard() {
  const grid = document.getElementById('zone-board-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const remain = ZONE_BOARD.filter(z => z.status === 'pending').length;
  const zbRemain = document.getElementById('zb-remain');
  if (zbRemain) zbRemain.textContent = `9개 중 ${remain}개 남음`;

  ZONE_BOARD.forEach((zone, i) => {
    const kw = zone.q.zone_keyword || zone.q.keyword || zone.q.cat.split('·')[0].trim();
    const card = document.createElement('div');
    card.className = 'zone-card';
    if (zone.status === 'correct') card.classList.add('done-correct');
    else if (zone.status === 'wrong') card.classList.add('done-wrong');
    else if (ZONE_SELECTED === i) card.classList.add('selected');

    const catShort = shortCat(zone.q.cat ? zone.q.cat.split('·')[0].trim() : '');
    card.innerHTML = `<span class="zc-num">ZONE ${i + 1}</span>${catShort}`;

    if (zone.status === 'pending') {
      card.onclick = () => selectZone(i);
    }
    grid.appendChild(card);
  });
}

function selectZone(idx) {
  // 이미 선택된 상태면 무시 (스탯바 노출 중 재선택 방지)
  if (ZONE_SELECTED !== null) return;
  ZONE_SELECTED = idx;
  SND.ding();
  renderZoneBoard();

  // 선택된 존의 문제를 st.qIdx에 반영
  const selectedQ = ZONE_BOARD[idx].q;
  const qIdx = QS.findIndex(q => q.seed_id === selectedQ.seed_id && q.difficulty === selectedQ.difficulty);
  if (qIdx >= 0) st.qIdx = qIdx;

  // 존 보드 타이틀 변경
  const parts = selectedQ.cat.split('·');
  const catMain = parts[0]?.trim() || selectedQ.cat;
  const catSub  = parts[1]?.trim() || '';
  const titleEl = document.getElementById('zb-title');
  if (titleEl) titleEl.textContent = '▸ ' + (selectedQ.zone_keyword || catMain);

  // 스탯바 데이터 채우기
  document.getElementById('zb-catname').textContent = shortCat(catMain);
  const zbSub = document.getElementById('zb-subname');
  if (zbSub) zbSub.textContent = catSub;

  // Supabase 스탯 로드
  (async () => {
    let ab = 0, h = 0, hr = 0, league = 'ROOKIE';
    if (currentUser) {
      try {
        const token = (await supa.auth.getSession()).data.session?.access_token;
        const res = await fetch(
          `${SUPA_URL}/rest/v1/season_stats?uid=eq.${currentUser.id}&season_id=eq.${currentSeasonId}&select=at_bats,hits,hr`,
          { headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data?.[0]) { ab = data[0].at_bats||0; h = data[0].hits||0; hr = data[0].hr||0; }
        const uRes = await fetch(
          `${SUPA_URL}/rest/v1/users?id=eq.${currentUser.id}&select=league`,
          { headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${token}` } }
        );
        const uData = await uRes.json();
        if (uData?.[0]) league = uData[0].league || 'ROOKIE';
      } catch(e) {}
    }
    document.getElementById('zb-league').textContent = league;
    document.getElementById('zb-ab').textContent = ab;
    document.getElementById('zb-h').textContent = h;
    document.getElementById('zb-avg').textContent = ab > 0 ? (h/ab).toFixed(3).replace('0.','.') : '.000';
    document.getElementById('zb-hr').textContent = hr;

    // 스탯바 슬라이드 인 (아래서 올라옴)
    const wrap = document.getElementById('zb-statbar-wrap');
    wrap.style.pointerEvents = 'auto';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      wrap.style.transform = 'translateY(0)';
      wrap.style.opacity = '1';
    }));

    // 은빛 테두리 펄스
    const bar = document.getElementById('zb-statbar');
    setTimeout(() => {
      bar.style.animation = 'silverPulse 1.2s ease-in-out 3';
    }, 550);
  })();
}

function proceedFromZoneStatBar() {
  // 스탯바 숨기고 투구 준비 화면으로
  const wrap = document.getElementById('zb-statbar-wrap');
  wrap.style.transform = 'translateY(20px)';
  wrap.style.opacity = '0';
  wrap.style.pointerEvents = 'none';
  // 타이틀 원복
  const titleEl = document.getElementById('zb-title');
  if (titleEl) titleEl.textContent = '▸ 스트라이크 존 · 타석을 선택하세요';
  setTimeout(() => showZonePitchReady(), 300);
}

function showZoneBoardScreen() {
  // 모두 소진 체크 → 셔플링
  const remain = ZONE_BOARD.filter(z => z.status === 'pending').length;
  if (remain === 0) {
    buildZoneBoard();
  }
  // 선택 상태 리셋 (새 존보드 열릴 때마다)
  ZONE_SELECTED = null;

  // 이닝 표시
  const half = st.isAttack ? (currentIsHome ? '말' : '초') : (currentIsHome ? '초' : '말');
  const arrow = st.isAttack ? (currentIsHome ? '▼' : '▲') : (currentIsHome ? '▲' : '▼');
  const zbInning = document.getElementById('zb-inning');
  if (zbInning) zbInning.textContent = `${st.inning}회 ${half} ${arrow} · ${st.atbat}번 타자`;

  renderZoneBoard();

  // 스탯바 데이터 갱신 (공수교대 후에도 최신 스탯 반영)
  const currentQ = getQ();
  if (currentQ) updateGameStatBar(currentQ);

  // 스탯바 리셋
  const wrap = document.getElementById('zb-statbar-wrap');
  if (wrap) {
    wrap.style.transform = 'translateY(20px)';
    wrap.style.opacity = '0';
    wrap.style.pointerEvents = 'none';
    wrap.style.transition = 'none';
    setTimeout(() => { wrap.style.transition = ''; }, 50);
  }
  const bar = document.getElementById('zb-statbar');
  if (bar) bar.style.animation = '';

  // 화면 전환
  document.getElementById('pregame-screen').style.display = 'none';
  document.getElementById('atstep-screen').style.display = 'none';
  document.getElementById('pitchready-screen').style.display = 'none';
  document.getElementById('main-header').style.display = 'flex';
  document.getElementById('main-content').style.display = 'flex';
  document.getElementById('game-area').style.display = 'none';
  document.getElementById('result-area').style.display = 'none';
  document.getElementById('judging-area').style.display = 'none';
  document.getElementById('reveal-screen').style.display = 'none';
  document.getElementById('zone-board-screen').style.display = 'flex';
  renderBadge(); // 스코어보드 현재 상태 반영
}

function showZonePitchReady() {
  const zone = ZONE_BOARD[ZONE_SELECTED];
  const q = zone.q;
  const parts = q.cat.split('·');
  const catMain = parts[0]?.trim() || q.cat;
  const half = currentIsHome ? '말' : '초';
  const arrow = currentIsHome ? '▼' : '▲';
  const inningTxt = `${st.inning}회 ${half} ${arrow} · ${st.atbat}번 타자`;

  document.getElementById('zone-board-screen').style.display = 'none';
  document.getElementById('pitchready-screen').style.display = 'flex';
  document.getElementById('pr-inning').textContent = inningTxt;
  document.getElementById('pr-category').textContent = shortCat(catMain);
  document.getElementById('pr-keyword').textContent = q.keyword || q.zone_keyword || catMain;
  document.getElementById('pr-sub').textContent = '배트를 꽉 쥐고 — 준비되면 사인을 보내세요';
  // 매 타석 보드 셔플 (이 타석의 100칸 지도)
  st.hitBoard = buildBoard(HIT_DIST);
  st.outBoard = buildBoard(OUT_DIST);
  renderBadge();
}

let st={
  qIdx:0,phase:'idle',typIdx:0,frozenText:'',isAttack:true,inning:1,
  typTimer:null,barTimer:null,cdTimer:null,hrTimer:null,msgTimer:null,aiTimer:null,
  totalMs:0,elapsed:0,hitMs:null,
  outs:0,bases:[false,false,false],scoreMe:0,scoreAi:0,tq:0,aiTq:0,
  atbat:1,hits:0,totalAB:0,hr:0,rbi:0,bb:0,singles:0,doubles:0,triples:0,hbp:0,errors:0,
  pitchAB:0,hitsAllowed:0,earnedRuns:0,outsRecorded:0,
  hitBoard:[],outBoard:[],aiHitBoard:[],aiOutBoard:[]
};

// ═══════════════════════════════════════════════════════════════
// 100칸 셔플 타격 시스템 (결정문 v1.0 / 2026.06.09)
//   타임바 100칸 = 확률의 분모. 정답→출루보드, 오답→아웃보드.
//   매 타석 셔플. 입력 순간 잔여%가 떨어진 칸이 결과를 부른다.
//   (반응속도 구간분할 폐기 — 빨라도 범타, 느려도 한 방)
// ═══════════════════════════════════════════════════════════════
const HIT_DIST = { homerun:8, triple:2, double:14, single:42, bb:25, hbp:3, error:6 }; // 합 100
const OUT_DIST = { strikeout:32, groundout:31, flyout:22, popout:8, lineout:7 };       // 합 100

// 결과 유형 → 표시·진루 메타
const HIT_META = {
  homerun:{label:'홈런!',        cls:'r-homerun', adv:4, hit:true },
  triple: {label:'3루타!',       cls:'r-triple',  adv:3, hit:true },
  double: {label:'2루타!',       cls:'r-double',  adv:2, hit:true },
  single: {label:'단타!',        cls:'r-single',  adv:1, hit:true },
  bb:     {label:'볼넷',          cls:'r-single',  adv:0, hit:false },
  hbp:    {label:'몸에 맞는 볼',  cls:'r-single',  adv:0, hit:false },
  error:  {label:'출루 (수비 실책)', cls:'r-single', adv:1, hit:false },
};
const OUT_META = {
  strikeout:{label:'삼진 아웃',   cls:'r-out', adv:0},
  groundout:{label:'땅볼 아웃',   cls:'r-out', adv:0},
  flyout:   {label:'뜬공 아웃',   cls:'r-out', adv:0},
  popout:   {label:'팝업 아웃',   cls:'r-out', adv:0},
  lineout:  {label:'직선타 아웃', cls:'r-out', adv:0},
};

// 분포를 100칸으로 펼친 뒤 Fisher-Yates 셔플
function buildBoard(dist){
  const b=[];
  for(const k in dist){ for(let i=0;i<dist[k];i++) b.push(k); }
  for(let i=b.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=b[i];b[i]=b[j];b[j]=t; }
  return b;
}
// 입력 순간의 타임바 잔여 퍼센트(100→0) → 칸 인덱스 0~99
function hitMsToIdx(hitMs,totalMs){
  const remain = Math.max(0, 1 - (hitMs/totalMs));   // 빨리 답할수록 잔여 큼
  return Math.min(99, Math.max(0, Math.floor(remain*100)));
}

// ── 멘트 조합 엔진 (매듭3 / 2026.06.09) — 결과유형 × 포지션 × 동작 ──
//    유저 타격 멘트 전담. 봇 멘트(ai_*)는 당분간 getMsg 유지(멘트 공들이기에서 세분).
//    ※ 추후 다듬기: 볼넷 변주 확대 + 안타 상황 다양화 (소로 6/9 피드백)
const pickC = a => a[Math.floor(Math.random()*a.length)];
const C_INFIELD  = ['투수','1루수','2루수','3루수','유격수'];
const C_OUTFIELD = ['좌익수','중견수','우익수'];
const C_SWING = ['배트가 돌아갑니다!','정확히 받아쳤습니다!','힘차게 휘두릅니다!','방망이 중심에 맞았습니다!','스윙 — 타격!'];
const C_GO_ACT  = ['정면으로 잡아','한 발 옆으로 잡아','앞으로 달려나와 잡아','백핸드로 처리해','몸으로 막아 잡아'];
const C_FLY_ACT = ['제자리에서','두어 걸음 물러나','앞으로 달려나와','자리를 잡고'];
const C_GREAT   = ['몸을 날려 다이빙으로','펜스를 등지고 점프해','글러브 끝에 걸쳐','전력 질주 끝에 겨우'];
const C_ERR_ACT = ['공을 더듬다가','포구하지 못하고','송구가 빗나가','글러브를 튕겨나와'];
const COMMENTARY = {
  homerun(){ return [ pickC(C_SWING), '공이 까마득하게 솟구칩니다...', `${pickC(C_OUTFIELD)}가 타구를 바라보기만 합니다`, '담장을 훌쩍 넘어갑니다!', '홈런!! 관중이 일어섭니다!' ]; },
  triple(){ const lr=pickC(['좌중간','우중간']); const of=lr[0]==='좌'?'좌익수':'우익수';
    return [ pickC(C_SWING), `공이 ${lr}을 깊숙이 가릅니다!`, `${of}가 끝까지 쫓아갑니다...`, '타자는 벌써 2루를 돌았습니다!', '3루타! 슬라이딩 세이프!' ]; },
  double(){ const lr=pickC(['좌중간','우중간','좌익선상','우익선상']);
    return [ pickC(C_SWING), `${lr} 방면으로 빠르게 뻗습니다!`, '외야수가 따라붙지만 늦었습니다', '여유 있게 2루로!', '2루타!' ]; },
  single(){ const d=pickC(['중전','좌전','우전','중전','좌전','우전','내야']);   // 내야안타 비중 ↓ (약 1/7)
    if(d==='내야'){ const p=pickC(['3루수','유격수','2루수']); return [ pickC(C_SWING), `${p} 앞 느린 땅볼!`, '잡아서 송구하지만...', '한 발 빨랐습니다!', '내야안타! 살아나갑니다.' ]; }
    return [ pickC(C_SWING), `${d} 방면으로 깔끔하게!`, '외야수 앞에 떨어집니다', '1루를 밟습니다', '단타! 안타입니다.' ]; },
  bb(){ return [ '투수의 공이 자꾸 빠집니다...', '볼, 또 볼...', '타자는 배트를 내지 않습니다', '네 번째 볼!', '볼넷 — 1루로 걸어나갑니다.' ]; },
  hbp(){ return [ '공이 몸쪽으로 바짝 붙습니다...', '앗! 타자의 몸을 맞혔습니다!', '타자가 1루로 향합니다', '몸에 맞는 볼!' ]; },
  error(){ const p=pickC(C_INFIELD); return [ pickC(C_SWING), '평범한 타구입니다...', `${p}가 ${pickC(C_ERR_ACT)}!`, '그 틈에 타자가 1루로!', '실책! 행운의 출루입니다.' ]; },
  strikeout(){ return pickC([
    [ '스윙 — 헛돕니다!', '포수 미트에 공이 꽂힙니다!', '삼진 아웃!' ],
    [ '배트가 나오지 않습니다...', '한복판을 가르는 공!', '루킹 삼진! 꼼짝 못 했습니다.' ],
    [ '살짝 스쳤나요?', '파울팁 — 포수가 잡았습니다!', '삼진 아웃!' ],
    [ '바깥쪽 변화구에 헛스윙!', '완전히 속았습니다', '삼진! 마법 같은 공이었습니다.' ],
  ]); },
  groundout(){ const p=pickC(C_INFIELD); return [ pickC(C_SWING), `공이 ${p} 쪽으로 굴러갑니다!`, `${p}가 ${pickC(C_GO_ACT)}`, '1루로 송구 — 아웃!' ]; },
  flyout(){ const p=pickC(C_OUTFIELD); const great=Math.random()<0.22;
    return great
      ? [ pickC(C_SWING), `공이 ${p} 방면 깊숙이 뻗습니다!`, `${p}가 ${pickC(C_GREAT)}...`, '잡았습니다! 호수비! 안타가 될 뻔했습니다!' ]
      : [ pickC(C_SWING), `공이 ${p} 방면으로 떠오릅니다!`, `${p}가 ${pickC(C_FLY_ACT)} 기다립니다...`, '뜬공 아웃!' ]; },
  popout(){ const p=pickC(C_INFIELD.concat('포수')); return [ pickC(C_SWING), '빗맞아 내야에 높이 떴습니다!', `${p}가 가볍게 잡아냅니다`, '팝업 아웃! 아쉬운 타구입니다.' ]; },
  lineout(){ const p=pickC(C_INFIELD.concat(C_OUTFIELD)); const great=Math.random()<0.4;
    return great
      ? [ pickC(C_SWING), '총알 같은 직선타!', `${p}가 ${pickC(C_GREAT)}...`, '믿기지 않는 호수비! 잡았습니다!' ]
      : [ pickC(C_SWING), '강한 직선타!', `${p} 정면입니다!`, '아웃! 잘 맞았지만 정면이었습니다.' ]; },
};
function composeComment(mk){ const fn=COMMENTARY[mk]; return fn ? fn() : ['타격!','결과 처리 중...']; }

// ── 봇(상대) 출루 멘트 — 결과 유형별 (소로 6/9 피드백: 볼넷인데 "안타" 멘트 모순 해결) ──
//    유저 시점은 '수비/허용' 관점. 봇 이름은 호출부에서 getMsg와 동일하게 치환.
function composeAIComment(mk){
  const n = getOppKor();
  const ga = n + getJosa(n,'ga');   // "프루스트가"
  const ui = n + getJosa(n,'eun');  // "프루스트는" 주격 보조
  const POOL = {
    homerun: [
      [ `${ga} 풀스윙!`, '타구가 까마득히 솟구칩니다...', '외야수가 바라보기만 합니다!', '담장을 넘어갑니다 — 홈런 허용!' ],
      [ `${ga} 노렸습니다 — 임팩트!`, '공이 펜스를 향해 쭉쭉 뻗습니다...', '넘어갑니다, 넘어가요!', '장외 홈런! 실점입니다.' ],
    ],
    triple: [
      [ `${ga} 받아쳤습니다!`, '공이 우중간을 깊숙이 가릅니다!', '외야수가 끝까지 쫓지만 늦었습니다...', '3루타 허용! 발 빠르게 3루까지.' ],
    ],
    double: [
      [ `${ga} 정확히 맞혔습니다!`, '좌중간으로 빠르게 빠집니다...', '외야수 앞에서 한 번 튕깁니다', '2루타 허용. 주자 진루합니다.' ],
    ],
    single: [
      [ `${ga} 스윙 — 깔끔합니다!`, '외야 앞에 툭 떨어집니다', '수비가 달려오지만 늦었습니다', '안타 허용! 1루로 나갑니다.' ],
      [ `${ga} 받아쳤습니다!`, '내야를 살짝 넘기는 타구...', '잡을 수 없는 코스였습니다', '안타 허용. 출루를 내줍니다.' ],
    ],
    bb: [
      [ '투수의 공이 자꾸 빠집니다...', '볼, 또 볼...', `${ga} 배트를 내지 않습니다`, '네 번째 볼!', '볼넷 허용 — 1루로 걸어나갑니다.' ],
      [ '제구가 흔들립니다...', `${ga} 침착하게 골라냅니다`, '풀카운트에서 또 하나 빠집니다', '볼넷 허용. 거저 출루를 내줬습니다.' ],
    ],
    hbp: [
      [ '공이 몸쪽으로 바짝 붙습니다...', `앗! ${ga} 맞았습니다!`, `${ui} 1루로 향합니다`, '몸에 맞는 볼! 출루 허용.' ],
    ],
    error: [
      [ `${ga} 평범한 타구를 굴립니다...`, '수비가 공을 더듬습니다!', '그 틈에 주자가 1루로!', '실책 출루! 아쉽게 내줬습니다.' ],
    ],
  };
  const arr = POOL[mk] || POOL.single;
  return arr[Math.floor(Math.random()*arr.length)];
}

function getQ(){return QS[st.qIdx%QS.length];}

// ── 별표 *...* 굵게 변환 (소로 6/10: 타이핑에 *기호*가 그대로 노출되던 문제, A안) ──
//    HTML 특수문자 이스케이프 후, 짝이 맞는 *...* 만 <b>로. 미완성(한쪽) 별표는 숨김.
function escHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function boldStars(raw){
  // 완성 텍스트용: *...* → <b>...</b>, 별표 기호 제거
  let out='', i=0, open=false;
  while(i<raw.length){
    const ch=raw[i];
    if(ch==='*'){ out += open ? '</b>' : '<b>'; open=!open; i++; continue; }
    out += escHtml(ch); i++;
  }
  if(open) out += '</b>';   // 안 닫힌 별표 방어
  return out;
}
function boldStarsTyping(slice){
  // 타이핑 조각용: 짝 맞는 *...*만 <b>로, 아직 안 닫힌 마지막 *부터는 통째로 숨김
  const lastOpen = (slice.split('*').length-1) % 2 === 1;  // 별표 개수 홀수면 미완성
  let work = slice;
  if(lastOpen){ work = slice.slice(0, slice.lastIndexOf('*')); }  // 미완성 별표 이후 잘라냄
  return boldStars(work);
}

// 게임 시작 시 QS 배열 셔플 — 매 게임마다 다른 순서로 문제 출제
function shuffleQSForGame() {
  for (let i = QS.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [QS[i], QS[j]] = [QS[j], QS[i]];
  }
}
function resetClock(){
  const clk=document.getElementById('pitch-clock');
  if(clk){clk.textContent=':10';clk.className='pitch-clock idle';}
}
function clearAll(){
  ['typTimer','barTimer','cdTimer','msgTimer'].forEach(k=>{if(st[k]){clearInterval(st[k]);st[k]=null;}});
  if(st.aiTimer){clearTimeout(st.aiTimer);st.aiTimer=null;}
}

function renderPitch(pct=100){
  const row=document.getElementById('pitch-row');
  const c=st.isAttack?(pct>50?'#40916C':pct>25?'#C9A84C':'#D85A30'):(pct>50?'#185FA5':pct>25?'#C9A84C':'#D85A30');
  if(st.isAttack){
    row.innerHTML=`${PITCHER}<div class="pitch-bar-wrap"><div class="pitch-bar-bg"><div id="timebar" style="height:100%;border-radius:3px;background:${c};width:${pct}%;position:relative;transition:width 0.1s linear,background 0.3s;"><div class="pitch-ball-l"><div class="seam"></div></div></div></div></div><div class="pitch-pct" id="tpct">—</div>${CATCHER}`;
  } else {
    row.innerHTML=`${CATCHER}<div class="pitch-pct" id="tpct">—</div><div class="pitch-bar-wrap"><div class="pitch-bar-bg" style="display:flex;justify-content:flex-end;"><div id="timebar" style="height:100%;border-radius:3px;background:${c};width:${pct}%;position:relative;transition:width 0.1s linear,background 0.3s;"><div class="pitch-ball-r"><div class="seam"></div></div></div></div></div>${BATTER}`;
  }
}

function setBar(pct){
  const b=document.getElementById('timebar');if(!b)return;
  const c=st.isAttack?(pct>50?'#40916C':pct>25?'#C9A84C':'#D85A30'):(pct>50?'#185FA5':pct>25?'#C9A84C':'#D85A30');
  b.style.width=pct+'%';b.style.background=c;
  const e=document.getElementById('tpct');if(e)e.textContent=Math.round(100-pct)+'%';
  // 피치클락 — 10단위 :09→:08 형태
  const clk=document.getElementById('pitch-clock');
  if(clk){
    const raw=Math.round(pct/10);
    const val=Math.max(0,Math.min(10,raw));
    clk.textContent=val<10?':0'+val:':'+val;
    clk.className='pitch-clock'+(val<=3?' danger':val<=6?' warning':'');
  }
}
function setRing(s,t){
  document.getElementById('ring-fill').style.strokeDashoffset=CIRC*(1-s/t);
  document.getElementById('ring-fill').style.stroke=s>5?'#D85A30':s>2?'#C9A84C':'#8B1A1A';
  document.getElementById('ring-num').textContent=s;
}
function renderBases(){
  if(st.hrTimer)return;
  ['base1','base2','base3'].forEach((id,i)=>{
    const e=document.getElementById(id);if(!e)return;
    if(st.bases[i]){
      e.setAttribute('fill','#D85A30');
      e.setAttribute('stroke','#FF7A50');
      e.style.filter='drop-shadow(0 0 4px #D85A30)';
    } else {
      e.setAttribute('fill','transparent');
      e.setAttribute('stroke','rgba(248,244,238,0.25)');
      e.style.filter='none';
    }
  });
}
function renderOuts(){
  for(let i=1;i<=3;i++)document.getElementById('out'+i).className='out-dot'+(st.outs>=i?' on':'');
  const ol=document.getElementById('out-label');if(ol)ol.textContent=st.outs+' 아웃';
}
function renderBadge(){
  const b=document.getElementById('inning-badge');
  // 홈=후공(공격:말, 수비:초) / 원정=선공(공격:초, 수비:말)
  const attackHalf = currentIsHome ? '말' : '초';
  const defenseHalf = currentIsHome ? '초' : '말';
  const attackArrow = currentIsHome ? '▼' : '▲';
  const defenseArrow = currentIsHome ? '▲' : '▼';
  if(st.isAttack){b.textContent=st.inning+'회 '+attackHalf+' '+attackArrow+' 공격';b.className='inning-badge';}
  else{b.textContent=st.inning+'회 '+defenseHalf+' '+defenseArrow+' 수비';b.className='inning-badge defense';}
  // 중앙 이닝컬럼 업데이트
  const inningNum = document.getElementById('inning-num');
  const arrowTop = document.getElementById('inning-arrow-top');
  const arrowBot = document.getElementById('inning-arrow-bot');
  if(inningNum) inningNum.textContent = st.inning;
  if(arrowTop && arrowBot){
    const isTop = st.isAttack ? (currentIsHome?false:true) : (currentIsHome?true:false);
    arrowTop.className = 'inning-arrow' + (isTop ? ' active' : '');
    arrowBot.className = 'inning-arrow' + (!isTop ? ' active' : '');
  }
}
function renderBoxes(){
  const q=getQ(),w=document.getElementById('hint-boxes');w.innerHTML='';
  // ── OX·객관식은 힌트 칸을 그리지 않는다 (소로 6/9: 보기에 정답이 그대로 노출되던 버그) ──
  //    주관식(타이핑)만 초성 힌트 칸을 갖는다. 컨테이너째 숨겨 여백(margin-bottom)까지 제거.
  if (q.question_type === 'OX' || q.question_type === '객관식') { w.style.display='none'; return; }
  w.style.display='flex';
  // ── v1.5+ boxes 필드 fallback ──
  // 카리 새 출제는 boxes 안 박음 — initials.length 또는 answer.length로 대체
  let n = q.boxes;
  if (!n && Array.isArray(q.initials)) n = q.initials.length;
  if (!n && q.answer) n = String(q.answer).length;
  if (!n) n = 0;
  for(let i=0;i<n;i++){
    const d=document.createElement('div');
    d.className='hint-box';
    d.textContent=(q.initials && q.initials[i])||'';
    w.appendChild(d);
  }
}
async function updateGameStatBar(q) {
  // 카테고리명 업데이트
  const parts = (q.cat || '').split('·');
  const catMain = parts[0]?.trim() || q.cat || '';
  const gscat = document.getElementById('gs-catname');
  if (gscat) gscat.textContent = shortCat(catMain);

  // Supabase 스탯 로드
  let ab = 0, h = 0, hr = 0, league = 'ROOKIE';
  if (currentUser) {
    try {
      const token = (await supa.auth.getSession()).data.session?.access_token;
      const res = await fetch(
        `${SUPA_URL}/rest/v1/season_stats?uid=eq.${currentUser.id}&season_id=eq.${currentSeasonId}&select=at_bats,hits,hr`,
        { headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data?.[0]) { ab = data[0].at_bats||0; h = data[0].hits||0; hr = data[0].hr||0; }
      const uRes = await fetch(
        `${SUPA_URL}/rest/v1/users?id=eq.${currentUser.id}&select=league`,
        { headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${token}` } }
      );
      const uData = await uRes.json();
      if (uData?.[0]) league = uData[0].league || 'ROOKIE';
    } catch(e) {}
  }
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('gs-league', league);
  set('gs-ab', ab);
  set('gs-h', h);
  set('gs-avg', ab > 0 ? (h/ab).toFixed(3).replace('0.','.') : '.000');
  set('gs-hr', hr);
}

function resetUI(){
  document.getElementById('input-panel').className='input-panel';
  document.getElementById('ans-input').value='';
  document.getElementById('ai-area').style.display='none';
  document.getElementById('game-area').style.display='block';
  document.getElementById('judging-area').style.display='none';
  document.getElementById('result-area').style.display='none';
  document.getElementById('hit-wrap').style.display='flex';
  const btn=document.getElementById('hit-btn');btn.style.opacity='1';btn.disabled=false;
  // ── v1.5 객관식·OX 패널 초기화 ──
  const mcPanel = document.getElementById('mc-panel');
  if (mcPanel) { mcPanel.style.display = 'none'; mcPanel.innerHTML = ''; }
  const oxPanel = document.getElementById('ox-panel');
  if (oxPanel) { oxPanel.style.display = 'none'; oxPanel.innerHTML = ''; }
  document.getElementById('stat-timing').textContent='—';switchStatPanel();
}

function startQ(){
  clearAll();
  const q=getQ();
  st.typIdx=0;st.hitMs=null;st.elapsed=0;st.frozenText='';
  st.totalMs=Math.max(12000,q.text.length*TS*1.3);
  resetUI();renderPitch(100);renderBadge();renderBoxes();setRing(10,10);resetClock();
  const qEl=document.getElementById('q-text');
  qEl.className='q-text';qEl.style.color='';qEl.style.fontSize='';
  document.getElementById('q-cat').textContent=q.cat;

  // 게임 스탯바 업데이트
  updateGameStatBar(q);

  const btn=document.getElementById('hit-btn');

  // 난이도 3 문제면 오르간 긴장감
  if(q.difficulty === 3){ setTimeout(()=>SND.organTension(), 200); }

  // game-statbar: 공격 시만 표시, 수비 시 숨김
  const gsbar = document.getElementById('game-statbar');
  if(gsbar) gsbar.style.display = st.isAttack ? 'flex' : 'none';

  if(st.isAttack){
    st.phase='typing';qEl.textContent='';
    btn.className='btn-hit attack';btn.textContent='⚾ 타격';

    // ── v1.5 객관식·OX 처치 — 보기 카드 미리 렌더 ──
    if (q.question_type === '객관식') {
      renderMCButtons(q);
      // 타격 버튼 숨김 (보기 클릭 = 타격)
      const hitWrap = document.getElementById('hit-wrap');
      if (hitWrap) hitWrap.style.display = 'none';
    } else if (q.question_type === 'OX') {
      renderOXButtons(q);
      const hitWrap = document.getElementById('hit-wrap');
      if (hitWrap) hitWrap.style.display = 'none';
    }

    // 휙 소리 끝나고 0.4초 후 타이핑 시작
    setTimeout(()=>{
      st.typTimer=setInterval(()=>{
        if(st.phase!=='typing')return;
        const txt=getQ().text;
        if(st.typIdx<txt.length){st.typIdx++;qEl.innerHTML=boldStarsTyping(txt.slice(0,st.typIdx));if(Math.random()<0.5)SND.type();}
        else{clearInterval(st.typTimer);st.typTimer=null;qEl.innerHTML=boldStars(txt);const c=document.createElement('span');c.className='cursor';qEl.appendChild(c);}
      },TS);
      st.barTimer=setInterval(()=>{
        if(st.phase!=='typing')return;
        st.elapsed+=100;setBar(Math.max(0,100-st.elapsed/st.totalMs*100));
        if(st.elapsed>=st.totalMs){clearInterval(st.barTimer);st.barTimer=null;doAutoOut();}
      },100);
    }, 400);
  } else {
    st.phase='pitch_ready';
    qEl.innerHTML='[던질 문제]  '+boldStars(q.text);
    qEl.style.color='rgba(248,244,238,0.4)';qEl.style.fontSize='12px';
    btn.className='btn-hit pitch-mode';btn.textContent='⚾ 피칭!';
    const aiLbl=document.getElementById('ai-label');
    if(aiLbl){const n=getOppKor();aiLbl.textContent=n+getJosa(n,'ga')+' 공을 노려보고 있습니다.';}
  }
}

function onAction(){
  if(st.isAttack){
    if(st.phase!=='typing')return;
    clearAll();st.hitMs=st.elapsed;st.phase='input';
    st.frozenText=getQ().text.slice(0,st.typIdx);
    const qEl=document.getElementById('q-text');
    qEl.textContent='';qEl.className='q-text frozen';
    qEl.innerHTML=boldStarsTyping(st.frozenText);
    const badge=document.createElement('span');badge.className='frozen-badge';badge.textContent='■ 타격';qEl.appendChild(badge);
    const btn=document.getElementById('hit-btn');btn.disabled=true;btn.style.opacity='0';
    setTimeout(()=>{
      document.getElementById('hit-wrap').style.display='none';
      document.getElementById('input-panel').className='input-panel open';
      setTimeout(()=>document.getElementById('ans-input').focus(),300);
    },150);
    let cd=10;setRing(cd,10);
    st.cdTimer=setInterval(()=>{cd--;setRing(cd,10);if(cd<=0){clearInterval(st.cdTimer);st.cdTimer=null;onConfirm();}},1000);
  } else {
    if(st.phase!=='pitch_ready')return;
    st.phase='ai_batting';
    document.getElementById('hit-wrap').style.display='none';
    const qEl=document.getElementById('q-text');
    qEl.textContent='';qEl.className='q-text';qEl.style.color='';qEl.style.fontSize='';
    st.typIdx=0;st.elapsed=0;
    document.getElementById('ai-area').style.display='block';
    // ai-label 한글 이름으로 설정
    const aiLblEl = document.getElementById('ai-label');
    if(aiLblEl){ const n=getOppKor(); aiLblEl.textContent=n+getJosa(n,'ga')+' 공을 노려보고 있습니다.'; }
    // 피칭 휙 소리 → 0.4초 후 타이핑 시작
    SND.pitch();
    setTimeout(()=>{
      st.typTimer=setInterval(()=>{
        if(st.phase!=='ai_batting')return;
        const txt=getQ().text;
        if(st.typIdx<txt.length){st.typIdx++;qEl.textContent=txt.slice(0,st.typIdx);if(Math.random()<0.5)SND.type();}
        else{clearInterval(st.typTimer);st.typTimer=null;}
      },TS);
      st.barTimer=setInterval(()=>{
        if(st.phase!=='ai_batting')return;
        st.elapsed+=100;setBar(Math.max(0,100-st.elapsed/st.totalMs*100));
      },100);
    },400);
    const aiPct=0.2+Math.random()*0.6,aiMs=st.totalMs*aiPct;
    // 봇도 매 타석 보드 셔플 — 무작위 칸 (반응속도 없음, 유저와 동일 시스템)
    st.aiHitBoard = buildBoard(HIT_DIST);
    st.aiOutBoard = buildBoard(OUT_DIST);
    const aiOnBase = Math.random() < AI_AVG;            // 출루 게이트 (OBP 개념)
    const aiIdx = Math.floor(Math.random()*100);
    const aiMk = aiOnBase ? st.aiHitBoard[aiIdx] : st.aiOutBoard[aiIdx];
    setTimeout(()=>{if(st.phase==='ai_batting'){const n=getOppKor();document.getElementById('ai-label').textContent=n+getJosa(n,'ga')+' 스윙합니다!';}},aiMs*0.7);
    st.aiTimer=setTimeout(()=>{
      if(st.phase!=='ai_batting')return;
      clearAll();st.phase='judging';
      document.getElementById('ai-area').style.display='none';
      document.getElementById('game-area').style.display='none';
      let mk,label,cls,adv,msgKey;
      mk = aiMk;
      if(aiOnBase){
        // 봇 출루 (출루 보드)
        const hm = HIT_META[aiMk] || HIT_META.single;
        adv = hm.adv; cls='r-defense-fail';
        const AILBL={homerun:'홈런 허용',triple:'3루타 허용',double:'2루타 허용',single:'안타 허용',bb:'볼넷 허용',hbp:'몸에 맞는 볼',error:'실책 출루'};
        label = AILBL[aiMk] || '출루 허용';
        st.pitchAB++;
        if(hm.hit) st.hitsAllowed++;            // 안타만 피안타 집계 (볼넷·몸맞·에러 제외)
        st.aiTq += calcTQ(aiMk, adv, false);
        msgKey = null;   // 봇 출루 멘트는 composeAIComment(aiMk)로 유형별 생성
      } else {
        // 봇 아웃 (아웃 보드)
        adv=0; cls='r-defense-ok';
        const AOLBL={strikeout:'삼진!',groundout:'땅볼 아웃!',flyout:'뜬공 아웃!',popout:'팝업 아웃!',lineout:'직선타 아웃!'};
        label = AOLBL[aiMk] || '아웃!';
        st.outs++; st.outsRecorded++;
        msgKey = 'ai_out';
      }
      showJudging(aiOnBase ? composeAIComment(aiMk) : getMsg(msgKey),()=>{
        // (봇 공격은 유저 타수 totalAB에 더하지 않음 — pitchAB로 별도 집계)
        if(adv>=4){let r=1;for(let i=0;i<3;i++)if(st.bases[i])r++;st.bases=[false,false,false];animHR(r,()=>{st.scoreAi+=r;st.earnedRuns+=r;const aiEl=getAiEl();if(aiEl)aiEl.textContent=st.scoreAi;renderOuts();updateStats();showResultDef(label,cls);});}
        else if(aiMk==='bb'||aiMk==='hbp'){const prevAi=st.scoreAi;advBasesAiBB();st.earnedRuns+=(st.scoreAi-prevAi);renderOuts();updateStats();showResultDef(label,cls);}
        else if(adv>0){const prevAi=st.scoreAi;advBasesAi(adv);st.earnedRuns+=(st.scoreAi-prevAi);renderOuts();updateStats();showResultDef(label,cls);}
        else{renderBases();renderOuts();updateStats();showResultDef(label,cls);}
      });
    },aiMs);
  }
}

function onConfirm(){
  if(st.phase!=='input')return;
  SND.hit();
  if(st.cdTimer){clearInterval(st.cdTimer);st.cdTimer=null;}
  processAns(document.getElementById('ans-input').value);
}

function norm(s){return s.replace(/[\s\-_]/g,'').toLowerCase();}

function showJudging(msgs,onDone){
  const ja=document.getElementById('judging-area'),msgEl=document.getElementById('judging-msg'),bar=document.getElementById('judging-bar');
  ja.style.display='block';msgEl.textContent=msgs[0];msgEl.classList.remove('fade');
  bar.className='judging-bar-fill';setTimeout(()=>bar.className='judging-bar-fill run',50);
  let mi=0;
  st.msgTimer=setInterval(()=>{mi++;if(mi<msgs.length){msgEl.classList.add('fade');setTimeout(()=>{msgEl.textContent=msgs[mi];msgEl.classList.remove('fade');},300);}if(mi>=msgs.length-1){clearInterval(st.msgTimer);st.msgTimer=null;}},1000);
  setTimeout(()=>{if(st.msgTimer){clearInterval(st.msgTimer);st.msgTimer=null;}ja.style.display='none';onDone();},JSEC*1000);
}

// ── 사운드 엔진 (Web Audio API) ──────────────────────────
const SND = (()=>{
  let ctx = null;
  function getCtx(){ if(!ctx) ctx = new (window.AudioContext||window.webkitAudioContext)(); return ctx; }

  // 타격음 — 배트가 공을 때리는 딱! 소리
  function hit(){
    const c = getCtx();
    const t = c.currentTime;
    // 저음 충격 (배트 울림)
    const osc1 = c.createOscillator();
    const gain1 = c.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(180, t);
    osc1.frequency.exponentialRampToValueAtTime(60, t + 0.08);
    gain1.gain.setValueAtTime(0.8, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc1.connect(gain1); gain1.connect(c.destination);
    osc1.start(t); osc1.stop(t + 0.18);
    // 고음 크랙 (충격음)
    const buf = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/d.length, 2);
    const src = c.createBufferSource();
    const gain2 = c.createGain();
    src.buffer = buf;
    gain2.gain.setValueAtTime(0.6, t);
    src.connect(gain2); gain2.connect(c.destination);
    src.start(t);
  }

  // 홈런 — 더 묵직하고 울리는 타격
  function homerun(){
    const c = getCtx();
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.15);
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t); osc.stop(t + 0.35);
    // 함성 느낌 — 짧은 화이트노이즈 웨이브
    const buf = c.createBuffer(1, c.sampleRate * 0.4, c.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/d.length, 1.5) * 0.3;
    const src = c.createBufferSource();
    const gn = c.createGain();
    src.buffer = buf; gn.gain.setValueAtTime(0.4, t+0.05);
    src.connect(gn); gn.connect(c.destination);
    src.start(t + 0.05);
  }

  // 아웃 — 낮고 짧은 탄식음
  function out(){
    const c = getCtx();
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.25);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t); osc.stop(t + 0.3);
  }

  // 타이핑 소리 — 묵직한 타자기 탁탁
  function type(){
    const c = getCtx();
    const t = c.currentTime;
    const bufLen = Math.floor(c.sampleRate * 0.04);
    const buf = c.createBuffer(1, bufLen, c.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<bufLen;i++){
      d[i] = (Math.random()*2-1) * Math.pow(1 - i/bufLen, 2.2);
    }
    const src = c.createBufferSource();
    const gain = c.createGain();
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420 + Math.random()*120, t);
    filter.Q.value = 2.0;
    src.buffer = buf;
    gain.gain.setValueAtTime(0.06 + Math.random()*0.02, t);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    src.start(t);
  }

  // 투구 휙 — 바람 가르는 소리 (0.3초)
  function pitch(){
    const c = getCtx();
    const t = c.currentTime;
    const buf = c.createBuffer(1, c.sampleRate * 0.3, c.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<d.length;i++){
      const env = Math.pow(1 - i/d.length, 1.2) * Math.pow(i/d.length < 0.05 ? i/d.length/0.05 : 1, 1);
      d[i] = (Math.random()*2-1) * env * 0.35;
    }
    const src = c.createBufferSource();
    const filter = c.createBiquadFilter();
    const gain = c.createGain();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, t);
    filter.frequency.exponentialRampToValueAtTime(800, t + 0.3);
    filter.Q.value = 0.8;
    src.buffer = buf;
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    src.connect(filter); filter.connect(gain); gain.connect(c.destination);
    src.start(t);
  }

  // 관중 환호 — 안타/2루타용 (1.2초)
  function cheer(){
    const c = getCtx();
    const t = c.currentTime;
    const dur = 1.2;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<d.length;i++){
      const env = Math.pow(i/(d.length*0.1) < 1 ? i/(d.length*0.1) : Math.pow(1-(i-d.length*0.1)/(d.length*0.9), 0.6), 1);
      d[i] = (Math.random()*2-1) * env * 0.25;
    }
    const src = c.createBufferSource();
    const filter = c.createBiquadFilter();
    const gain = c.createGain();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.Q.value = 0.5;
    src.buffer = buf;
    gain.gain.setValueAtTime(0.5, t);
    src.connect(filter); filter.connect(gain); gain.connect(c.destination);
    src.start(t);
  }

  // 폭발적 환호 — 홈런용 (2.5초, 오르간 파일 있으면 병행)
  function crowd(){
    const c = getCtx();
    const t = c.currentTime;
    const dur = 2.5;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<d.length;i++){
      const ramp = i/(d.length*0.08) < 1 ? i/(d.length*0.08) : 1;
      const tail = Math.pow(1 - Math.max(0,(i-d.length*0.5))/(d.length*0.5), 0.5);
      d[i] = (Math.random()*2-1) * ramp * tail * 0.4;
    }
    const src = c.createBufferSource();
    const filter = c.createBiquadFilter();
    const gain = c.createGain();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t);
    src.buffer = buf;
    gain.gain.setValueAtTime(0.7, t);
    src.connect(filter); filter.connect(gain); gain.connect(c.destination);
    src.start(t);

    // 오르간 파일 랜덤 재생 (파일 있을 때만)
    const organs = ['organ1.mp3','organ2.mp3','organ3.mp3'];
    const pick = organs[Math.floor(Math.random()*organs.length)];
    const audio = new Audio(pick);
    audio.volume = 0.7;
    audio.play().catch(()=>{});
  }

  // 난이도3 투구 전 오르간 긴장감 (파일 있을 때만)
  function organTension(){
    const organs = ['organ1.mp3','organ2.mp3','organ3.mp3'];
    const pick = organs[Math.floor(Math.random()*organs.length)];
    const audio = new Audio(pick);
    audio.volume = 0.5;
    audio.play().catch(()=>{});
  }

  // 관중 소음 — m4a 파일 재생 (존 보드 화면)
  function crowd_ambient(){
    // crowd_ambient.m4a 삭제됨 — 추후 다른 파일로 교체 예정
    return null;
  }

  // 전광판 딩동 — 카드 선택 시
  function ding(){
    const c = getCtx();
    const t = c.currentTime;
    // 딩 — 맑은 벨 소리
    const osc1 = c.createOscillator();
    const gain1 = c.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1047, t);      // C6
    osc1.frequency.setValueAtTime(1319, t+0.01); // E6
    gain1.gain.setValueAtTime(0.0, t);
    gain1.gain.linearRampToValueAtTime(0.18, t+0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, t+0.6);
    osc1.connect(gain1); gain1.connect(c.destination);
    osc1.start(t); osc1.stop(t+0.6);
    // 동 — 약간 낮은 잔향
    const osc2 = c.createOscillator();
    const gain2 = c.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(784, t+0.08); // G5
    gain2.gain.setValueAtTime(0.0, t+0.08);
    gain2.gain.linearRampToValueAtTime(0.1, t+0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, t+0.7);
    osc2.connect(gain2); gain2.connect(c.destination);
    osc2.start(t+0.08); osc2.stop(t+0.7);
  }

  return { hit, homerun, out, type, pitch, cheer, crowd, organTension, crowd_ambient, ding };
})();

function processAns(ans){
  st.phase='judging';
  const q=getQ();
  let ok;
  // ── v1.5 형식별 정답 비교 ──
  if (q.question_type === '객관식') {
    // 클릭한 보기 텍스트 vs answer 텍스트 단순 비교
    ok = checkAnswerMC(ans, q);
  } else if (q.question_type === 'OX') {
    // "O" 또는 "X" 비교
    ok = checkAnswerOX(ans, q);
  } else {
    // 주관식 — 기존 로직 (정규화 + aliases 비교)
    const ua = norm(ans);
    const ca = norm(q.answer);
    ok = ua === ca || (ua.length >= 2 && ca.includes(ua));
    // aliases 비교 (있으면)
    if (!ok && Array.isArray(q.aliases)) {
      for (const alias of q.aliases) {
        if (ua === norm(alias) || (ua.length >= 2 && norm(alias).includes(ua))) {
          ok = true;
          break;
        }
      }
    }
  }
  const idx = hitMsToIdx(st.hitMs, st.totalMs);
  let label,cls,adv,mk;
  if(!ok){
    // 오답 → 아웃 보드에서 칸 추첨
    mk = (st.outBoard && st.outBoard.length===100) ? st.outBoard[idx] : 'strikeout';
    const m = OUT_META[mk] || OUT_META.strikeout;
    label=m.label; cls=m.cls; adv=0;
    st.outs++; st.tq+=calcTQ('out',0,false); SND.out();
  } else {
    // 정답 → 출루 보드에서 칸 추첨
    mk = (st.hitBoard && st.hitBoard.length===100) ? st.hitBoard[idx] : 'single';
    const m = HIT_META[mk] || HIT_META.single;
    label=m.label; cls=m.cls; adv=m.adv;
    if(m.hit) st.hits++;            // 안타만 H로 집계 (볼넷·몸맞공·에러 제외)
    if(mk==='homerun') st.hr++;
    else if(mk==='triple') st.triples++;
    else if(mk==='double') st.doubles++;
    else if(mk==='single') st.singles++;
    else if(mk==='bb') st.bb++;
    else if(mk==='hbp') st.hbp++;
    else if(mk==='error') st.errors++;
    st.tq += calcTQ(mk, adv, false);
    if(mk==='homerun'){ SND.homerun(); SND.crowd(); }
    else if(mk==='triple'||mk==='double'){ SND.hit(); SND.cheer(); }
    else { SND.hit(); }
  }
  const tp=idx, tt=label;
  document.getElementById('stat-timing').textContent=tp+'%';
  // 존 보드 상태 업데이트
  if(ZONE_SELECTED !== null && ZONE_BOARD[ZONE_SELECTED]) {
    ZONE_BOARD[ZONE_SELECTED].status = ok ? 'correct' : 'wrong';
  }
  document.getElementById('input-panel').className='input-panel';
  document.getElementById('game-area').style.display='none';
  showJudging(composeComment(mk),()=>{
    if(mk!=='bb'&&mk!=='hbp') st.totalAB++;   // 볼넷·몸맞공은 타수(AB)에서 제외 → 타율 정확
    if(adv>=4){let r=1;for(let i=0;i<3;i++)if(st.bases[i])r++;st.bases=[false,false,false];animHR(r,()=>{st.scoreMe+=r;st.rbi+=r;popScore();renderOuts();updateStats();showResultAtk(label,cls,q,ok,tp,tt);});}
    else{const prevScore=st.scoreMe;if(mk==='bb'||mk==='hbp')advBasesBB();else advBases(adv);st.rbi+=(st.scoreMe-prevScore);renderOuts();updateScore();updateStats();showResultAtk(label,cls,q,ok,tp,tt);}
  });
}

function doAutoOut(){
  if(st.phase==='judging'||st.phase==='idle')return;
  st.phase='judging';st.outs++;
  // 존 보드 — 시간초과 = 오답
  if(ZONE_SELECTED !== null && ZONE_BOARD[ZONE_SELECTED]) {
    ZONE_BOARD[ZONE_SELECTED].status = 'wrong';
  }
  // 뮤세움 연동 — 시간초과도 경험한 문제로 기록
  logQuizToMuseum(getQ());
  document.getElementById('game-area').style.display='none';
  showJudging(getMsg('timeout'),()=>{
    st.totalAB++;renderOuts();updateStats();
    const ra=document.getElementById('result-area');
    ra.innerHTML=mkResult('OUT','r-out','시간 초과 | 정답: '+getQ().display);
    ra.style.display='block';st.atbat++;document.getElementById('stat-atbat').textContent=st.atbat+'타석';
  });
}

function mkResult(label,cls,sub){
  const done=st.outs>=3;
  // 홈=후공: 공격(말) 끝나면 게임종료, 수비(초) 끝나면 공수교대
  // 원정=선공: 수비(말) 끝나면 게임종료, 공격(초) 끝나면 공수교대
  const gameOver = done && (currentIsHome ? st.isAttack : !st.isAttack);
  const halfOver = done && !gameOver;
  let btnLabel = '이번 타석 돌아보기 →';
  if(gameOver) btnLabel = '이번 타석 돌아보기 →';
  else if(halfOver) btnLabel = '이번 타석 돌아보기 →';
  const doneMsg = halfOver ? '⚾ 3아웃! 공수 교대' : gameOver ? '⚾ 3아웃! 경기 종료' : '';
  const onclickFn = 'showReveal()';
  return `<div class="result-box ${cls}"><div class="result-label">${label}</div><div class="result-sub">${sub}</div></div>`+(done?`<div style="text-align:center;font-size:11px;color:rgba(248,244,238,0.5);margin-bottom:10px">${doneMsg}</div>`:'')+`<button class="btn-next" onclick="${onclickFn}">${btnLabel}</button>`;
}

function showReveal() {
  const q = getQ();
  // 결과 화면 숨기기
  document.getElementById('result-area').style.display = 'none';
  document.getElementById('game-area').style.display = 'none';

  // 각인 화면 세팅
  document.getElementById('reveal-question').innerHTML = boldStars(q.text);
  document.getElementById('reveal-answer').textContent = q.display;
  document.getElementById('reveal-commentary').innerHTML = '';

  // 다음 버튼 라벨
  const done = st.outs >= 3;
  const gameOver = done && (currentIsHome ? st.isAttack : !st.isAttack);
  const halfOver = done && !gameOver;
  const btn = document.getElementById('reveal-next-btn');
  btn.textContent = gameOver ? '경기 결과 보기 🏆' : halfOver ? '공수 교대 →' : '다음 타자 →';
  btn.onclick = gameOver ? showGameResult : halfOver ? switchHalf : nextQ;
  if(gameOver || halfOver) btn.style.fontWeight = '800';

  // 각인 화면 표시
  const rs = document.getElementById('reveal-screen');
  rs.style.display = 'flex';

  // 해설 타이핑 애니메이션 (library knowledge 있으면 사용, 없으면 기본)
  const commentary = q.library ? q.library.knowledge : 
    (q.cat ? '이 문제의 카테고리는 ' + q.cat + ' 입니다.' : '');
  
  if(commentary) {
    let i = 0;
    const el = document.getElementById('reveal-commentary');
    el.innerHTML = '<span class="typing-cursor"></span>';
    const timer = setInterval(() => {
      if(i < commentary.length) {
        el.textContent = commentary.slice(0, ++i);
        const cur = document.createElement('span');
        cur.className = 'typing-cursor';
        el.appendChild(cur);
      } else {
        clearInterval(timer);
        el.textContent = commentary;
      }
    }, 28);
  }
}

function revealNext() {
  // 각인 화면 초기화
  document.getElementById('reveal-question').textContent = '';
  document.getElementById('reveal-answer').textContent = '';
  document.getElementById('reveal-commentary').textContent = '';
  document.getElementById('reveal-screen').style.display = 'none';
  nextQ();
}

function showResultAtk(label,cls,q,ok,tp,tt){
  let sub=(ok?'정답: '+q.display:'오답 | 정답: '+q.display)+' · '+tt+' '+tp+'%';
  // ── v1.5+ OX 해설 추가 ──
  // 카리가 박은 ox_explanation 필드 — 회원이 OX 정답 후 *왜 그런지* 만남
  if (q.question_type === 'OX' && q.ox_explanation) {
    sub += '<br><br>💡 ' + q.ox_explanation;
  }
  const ra=document.getElementById('result-area');ra.innerHTML=mkResult(label,cls,sub);ra.style.display='block';
  st.atbat++;document.getElementById('stat-atbat').textContent=st.atbat+'타석';
  setTimeout(()=>ra.scrollIntoView({behavior:'smooth',block:'start'}),100);
  // 뮤세움 연동 — 공격 타석에서 경험한 문제 기록
  logQuizToMuseum(q);
}
function showResultDef(label,cls){
  const ok=cls==='r-defense-ok';
  // 실점 여부 체크: 이전 점수와 비교
  const scored = st.scoreAi > (st._prevScoreAi||0);
  const subText = ok ? '잘 막아냈습니다! ⚾' : scored ? '실점 허용' : '출루 허용';
  st._prevScoreAi = st.scoreAi;
  const ra=document.getElementById('result-area');ra.innerHTML=mkResult(ok?'OUT':label,cls,subText);ra.style.display='block';
  setTimeout(()=>ra.scrollIntoView({behavior:'smooth',block:'start'}),100);
  st.atbat++;document.getElementById('stat-atbat').textContent=st.atbat+'타석';
}

function animHR(runs,onDone){
  if(st.hrTimer)clearInterval(st.hrTimer);
  const ids=['base1','base2','base3','home-plate'];let step=0,cycles=0,max=runs*4+4;
  ids.forEach(id=>{const e=document.getElementById(id);if(e){e.setAttribute('fill','#C9A84C');e.setAttribute('stroke','#A07830');}});
  st.hrTimer=setInterval(()=>{
    ids.forEach((id,i)=>{const e=document.getElementById(id);if(!e)return;const a=(i===step%4);e.setAttribute('fill',a?'#C9A84C':'rgba(201,168,76,0.15)');e.setAttribute('stroke',a?'#A07830':'rgba(160,120,48,0.2)');e.style.filter=a?'drop-shadow(0 0 4px #C9A84C)':'none';});
    step++;cycles++;
    if(cycles>=max){clearInterval(st.hrTimer);st.hrTimer=null;ids.forEach(id=>{const e=document.getElementById(id);if(e){e.setAttribute('fill','transparent');e.setAttribute('stroke','rgba(248,244,238,0.2)');e.style.filter='none';}});if(onDone)onDone();}
  },160);
}

function getMeEl(){return document.getElementById(currentIsHome?'score-right':'score-left');}
function getAiEl(){return document.getElementById(currentIsHome?'score-left':'score-right');}
function popScore(){const e=getMeEl();if(e){e.textContent=st.scoreMe;e.style.transform='scale(1.4)';setTimeout(()=>e.style.transform='',300);}}
function updateScore(){const e=getMeEl();if(e)e.textContent=st.scoreMe;}
function calcTQ(mk, adv, isDefense){
  // ⚠️ 새 정책 (2026-05-02): TQ는 공격 성과만 측정, 수비는 0.
  //    승부 결판은 점수 → 동점이면 주사위가 책임. TQ는 통계 표시용.
  if(isDefense) return 0;  // 수비는 TQ에 안 들어감
  
  // 공격 TQ — 순수 가산점 (아웃은 0, 처벌하지 않음)
  if(mk==='homerun') return 4.0;
  if(mk==='triple')  return 3.0;
  if(mk==='double')  return 2.0;
  if(mk==='single')  return 1.0;
  if(mk==='bb')      return 0.5;
  if(mk==='hbp')     return 0.5;  // 몸맞공 출루도 +0.5
  if(mk==='error')   return 0.5;  // 에러로 인한 출루도 +0.5
  return 0;  // out 등
}
function updateStats(){
  // --- 타격 스탯 ---
  const ab=st.totalAB;
  const avg=ab?st.hits/ab:0;
  // 출루율: (안타+볼넷)/(타석) 단순화
  const obp=ab?(st.hits+st.bb)/ab:0;
  // 장타율: (단타 + 2*2루타 + 3*3루타 + 4*홈런)/타수
  const slg=ab?(st.singles+st.doubles*2+st.triples*3+st.hr*4)/ab:0;
  const ops=obp+slg;
  document.getElementById('stat-avg').textContent=fmtAvg(avg);
  document.getElementById('stat-ops').textContent=fmtAvg(ops);
  document.getElementById('stat-hr').textContent=st.hr;
  document.getElementById('stat-rbi').textContent=st.rbi;
  // --- 수비 스탯 (ERA) ---
  // ERA = 자책점 / (아웃수/3) * 9
  const inningsPitched=st.outsRecorded/3;
  const era=inningsPitched>0?(st.earnedRuns/inningsPitched*9):0;
  document.getElementById('stat-era').textContent=era.toFixed(2);
  document.getElementById('stat-hits-allowed').textContent=st.hitsAllowed;
  document.getElementById('stat-er').textContent=st.earnedRuns;
  document.getElementById('stat-outs-rec').textContent=st.outsRecorded;
  // TQ 표시
  const tqEl1=document.getElementById('stat-tq-atk');
  const tqEl2=document.getElementById('stat-tq-def');
  const tqStr=(st.tq>=0?'+':'')+st.tq.toFixed(1);
  if(tqEl1) tqEl1.textContent=tqStr;
  if(tqEl2) tqEl2.textContent=tqStr;
}
function fmtAvg(n){
  if(n===0)return'.000';
  return n.toFixed(3).replace(/^0/,'');
}
function switchStatPanel(){
  document.getElementById('stat-attack-panel').style.display=st.isAttack?'block':'none';
  document.getElementById('stat-defense-panel').style.display=st.isAttack?'none':'block';
}
function advBasesBB(){
  // 볼넷 전용: 1루부터 밀어내기 방식
  const [b1,b2,b3] = st.bases;
  let scored = 0;
  // 만루 → 밀어내기 득점
  if(b1 && b2 && b3){ scored = 1; st.bases = [true,true,true]; }
  // 1,2루 → 만루
  else if(b1 && b2){ st.bases = [true,true,true]; }
  // 1,3루 → 만루
  else if(b1 && b3){ st.bases = [true,true,true]; }
  // 2,3루 → 1,2,3루 (만루)
  else if(b2 && b3){ st.bases = [true,true,true]; }
  // 1루 → 1,2루
  else if(b1){ st.bases = [true,true,false]; }
  // 2루 → 1,2루
  else if(b2){ st.bases = [true,true,false]; }
  // 3루 → 1,3루
  else if(b3){ st.bases = [true,false,true]; }
  // 없음 → 1루
  else { st.bases = [true,false,false]; }
  if(scored > 0){ st.scoreMe += scored; st.rbi += scored; popScore(); }
  renderBases();
  return scored;
}
function advBases(n){
  if(n===0)return;
  if(n>=4){let r=1;for(let i=0;i<3;i++)if(st.bases[i])r++;st.bases=[false,false,false];st.scoreMe+=r;}
  else{let nb=[false,false,false];for(let i=2;i>=0;i--){if(st.bases[i]){const np=i+n;if(np>=3)st.scoreMe++;else nb[np]=true;}}if(n===1)nb[0]=true;else if(n===2)nb[1]=true;else if(n===3)nb[2]=true;st.bases=nb;}
  renderBases();
}
function advBasesAi(n){
  let nb=[false,false,false];
  for(let i=2;i>=0;i--){if(st.bases[i]){const np=i+n;if(np>=3)st.scoreAi++;else nb[np]=true;}}
  if(n===1)nb[0]=true;else if(n>=2)nb[1]=true;
  st.bases=nb;const aiEl=getAiEl();if(aiEl)aiEl.textContent=st.scoreAi;renderBases();
}
// 봇 볼넷·몸맞공 — 밀어내기 진루 (막힌 주자만 한 칸씩)
function advBasesAiBB(){
  if(st.bases[0]){           // 1루 점유 → 밀림 발생
    if(st.bases[1]){         // 2루도 점유
      if(st.bases[2]){ st.scoreAi++; }  // 만루 → 3루주자 득점
      st.bases[2]=true;      // 2루주자 → 3루
    }
    st.bases[1]=true;        // 1루주자 → 2루
  }
  st.bases[0]=true;          // 타자 1루
  const aiEl=getAiEl();if(aiEl)aiEl.textContent=st.scoreAi;renderBases();
}
// nextQ → 하단 흐름제어 블록에서 재정의

// ── 경기 결과 화면 ──────────────────────────────
function showGameResult(){
  // 승패 판정
  let result, resultColor, emoji;
  if(st.scoreMe > st.scoreAi){
    result='승리'; resultColor='#52B788'; emoji='🏆';
  } else if(st.scoreAi > st.scoreMe){
    result='패배'; resultColor='#D85A30'; emoji='💧';
  } else {
    // ⚠️ 점수 동점 → 즉시 주사위 결판 (TQ 결판 단계 제거됨, 2026-05-02)
    //    TQ는 통계로만 표시. 승부는 주사위가 책임.
    showDiceScreen();  // 주사위 화면 띄우고 함수 종료
    return;
  }
  // 결판난 경우만 아래 코드 진행
  showFinalResult(result, resultColor, emoji);
}

// ── 결과 화면 그리기 (점수/주사위 결판 후 공통 호출) ──
function showFinalResult(result, resultColor, emoji){

  const ab = st.totalAB || 1;
  const avg = st.hits/ab;
  const obp = (st.hits+st.bb)/ab;
  const slg = (st.singles+st.doubles*2+st.triples*3+st.hr*4)/ab;
  const ops = obp+slg;
  const fmtA = n => n>=1?n.toFixed(3):(n===0?'.000':n.toFixed(3).replace(/^0/,''));

  // 결과 화면 HTML
  const ra = document.getElementById('result-area');
  document.getElementById('game-area').style.display='none';
  document.getElementById('judging-area').style.display='none';
  document.getElementById('atstep-screen').style.display='none';
  document.getElementById('pitchready-screen').style.display='none';

  ra.innerHTML = `
    <div style="text-align:center;padding:20px 0 12px">
      <div style="font-size:36px;margin-bottom:8px">${emoji}</div>
      <div style="font-size:28px;font-weight:700;color:${resultColor};letter-spacing:0.05em;margin-bottom:4px">${result}</div>
      <div style="font-size:13px;color:rgba(248,244,238,0.5);margin-bottom:20px">
        ${st.scoreMe} : ${st.scoreAi}
      </div>
    </div>
    <div style="background:rgba(248,244,238,0.06);border-radius:12px;padding:16px;margin-bottom:12px">
      <div style="font-size:9px;letter-spacing:0.12em;color:rgba(248,244,238,0.35);margin-bottom:12px">▲ 타격 스탯</div>
      <div style="display:flex;justify-content:space-between;text-align:center">
        <div><div style="font-size:8px;color:rgba(248,244,238,0.35)">타율</div><div style="font-size:16px;font-family:'Courier New';color:var(--chalk)">${fmtA(avg)}</div></div>
        <div><div style="font-size:8px;color:rgba(248,244,238,0.35)">OPS</div><div style="font-size:16px;font-family:'Courier New';color:var(--chalk)">${fmtA(ops)}</div></div>
        <div><div style="font-size:8px;color:rgba(248,244,238,0.35)">홈런</div><div style="font-size:16px;font-family:'Courier New';color:var(--chalk)">${st.hr}</div></div>
        <div><div style="font-size:8px;color:rgba(248,244,238,0.35)">타점</div><div style="font-size:16px;font-family:'Courier New';color:var(--chalk)">${st.rbi}</div></div>
        <div><div style="font-size:8px;color:rgba(248,244,238,0.35);white-space:nowrap">TQ</div><div style="font-size:16px;font-family:'Courier New';color:var(--gold-light)">${st.tq>=0?'+':''}${st.tq.toFixed(1)}</div></div>
      </div>
    </div>
    <div style="background:rgba(248,244,238,0.06);border-radius:12px;padding:16px;margin-bottom:20px">
      <div style="font-size:9px;letter-spacing:0.12em;color:rgba(248,244,238,0.35);margin-bottom:12px">▽ 수비 스탯</div>
      <div style="display:flex;justify-content:space-between;text-align:center">
        <div><div style="font-size:8px;color:rgba(248,244,238,0.35)">방어율</div><div style="font-size:16px;font-family:'Courier New';color:var(--chalk)">${(st.outsRecorded>0?(st.earnedRuns/(st.outsRecorded/3)*9):0).toFixed(2)}</div></div>
        <div><div style="font-size:8px;color:rgba(248,244,238,0.35)">피안타</div><div style="font-size:16px;font-family:'Courier New';color:var(--chalk)">${st.hitsAllowed}</div></div>
        <div><div style="font-size:8px;color:rgba(248,244,238,0.35)">자책점</div><div style="font-size:16px;font-family:'Courier New';color:var(--chalk)">${st.earnedRuns}</div></div>
        <div><div style="font-size:8px;color:rgba(248,244,238,0.35)">아웃</div><div style="font-size:16px;font-family:'Courier New';color:var(--chalk)">${st.outsRecorded}</div></div>
      </div>
    </div>
    <!-- 황금사과 수령 — 끝까지 뛴 모든 경기에 대한 환대의 증표 (승/패 무관) -->
    <div id="apple-award-section" style="text-align:center;margin-bottom:20px">
      <button class="btn-next" style="width:100%;background:linear-gradient(135deg,rgba(201,168,76,0.3),rgba(201,168,76,0.1));border:1px solid rgba(201,168,76,0.6);color:#C9A84C;font-size:15px;letter-spacing:0.08em;padding:14px" onclick="showAppleAward()">
        🍎 황금사과 한 알 받기
      </button>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn-next" style="flex:1" onclick="location.href='index.html'">🏠 홈으로</button>
    </div>
  `;
  ra.style.display='block';
  // Supabase에 스탯 저장
  saveStatsToSupabase();
}

// ═══════════════════════════════════════════════════
// 💾 경기 종료 후 Supabase 저장 — 4건 일괄 처치
// ═══════════════════════════════════════════════════
//
//  처치 흐름 (종합설계도 v1.1 데이터 흐름 4·5단계):
//    1. 현재 active 시즌 조회 (seasons 테이블)
//    2. matches: 오늘 my_game 행 INSERT or UPDATE → completed
//    3. season_stats: UPSERT (시즌 누적)
//    4. career_stats: UPSERT (통산 누적, golden_apples +1)
//    5. apple_log: INSERT (황금사과 한 알, 끝까지 뛴 보상)
//
//  실패 시: 콘솔 경고만 — 게임 화면 안 깨짐
//
async function saveStatsToSupabase() {
  if (!currentUser) {
    console.warn('[저장] 비로그인 — 스킵');
    return;
  }

  const _dbgFails = [];  // 🔧 임시 진단: 저장 실패 수집 (원인 확정 후 제거)
  try {
    const session = (await supa.auth.getSession()).data.session;
    if (!session) {
      console.warn('[저장] 세션 없음 — 스킵');
      alert('🔧 저장 디버그: 로그인 세션 없음 — 저장 스킵됨');
      return;
    }
    const token = session.access_token;
    const baseHeaders = {
      'apikey': SUPA_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // ── 1단계. 현재 active 시즌 조회 ────────────────────────
    const seasonRes = await fetch(
      `${SUPA_URL}/rest/v1/seasons?user_id=eq.${currentUser.id}&status=eq.active&select=id,league&order=id.desc&limit=1`,
      { headers: baseHeaders }
    );
    const seasonData = await seasonRes.json();
    if (!seasonData?.[0]) {
      console.warn('[저장] active 시즌 없음 — 스킵');
      return;
    }
    const seasonId = seasonData[0].id;

    // ── 2단계. matches 처치 ──────────────────────────────
    //   오늘 날짜의 my_game 행 찾기 → 있으면 UPDATE, 없으면 INSERT
    const today = new Date().toISOString().slice(0, 10);  // 'YYYY-MM-DD'
    const isWin = st.scoreMe > st.scoreAi;
    const homeScore = currentIsHome ? st.scoreMe : st.scoreAi;
    const awayScore = currentIsHome ? st.scoreAi : st.scoreMe;
    const homeTeam  = currentIsHome ? 'soro' : (currentOpp?.id || 'unknown');
    const awayTeam  = currentIsHome ? (currentOpp?.id || 'unknown') : 'soro';

    const matchSearchRes = await fetch(
      `${SUPA_URL}/rest/v1/matches?user_id=eq.${currentUser.id}&match_date=eq.${today}&is_my_game=eq.true&select=id,status,week_num`,
      { headers: baseHeaders }
    );
    const existingMatches = await matchSearchRes.json();

    if (existingMatches?.[0]) {
      // 이미 cron이 만들어둔 행 — UPDATE
      const matchId = existingMatches[0].id;
      const _mRes = await fetch(
        `${SUPA_URL}/rest/v1/matches?id=eq.${matchId}`,
        {
          method: 'PATCH',
          headers: { ...baseHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            status: 'completed',
            home_score: homeScore,
            away_score: awayScore,
            completed_at: new Date().toISOString()
          })
        }
      );
      if(!_mRes.ok) _dbgFails.push('matches-UPDATE '+_mRes.status+': '+(await _mRes.text().catch(()=>'')).slice(0,150));
    } else {
      // 행 없음 — 새로 INSERT (cron 도입 전 상황 대응)
      const dayOfWeek = new Date().getDay() === 0 ? 7 : new Date().getDay();  // ISO: 월=1, 일=7
      // week_num은 임시로 시즌 시작일 기준 주차 계산
      const seasonStartRes = await fetch(
        `${SUPA_URL}/rest/v1/seasons?id=eq.${seasonId}&select=start_date`,
        { headers: baseHeaders }
      );
      const seasonInfo = await seasonStartRes.json();
      let weekNum = 1;
      if (seasonInfo?.[0]?.start_date) {
        const startDate = new Date(seasonInfo[0].start_date);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - startDate) / (1000 * 60 * 60 * 24));
        weekNum = Math.floor(diffDays / 7) + 1;
      }

      await fetch(
        `${SUPA_URL}/rest/v1/matches`,
        {
          method: 'POST',
          headers: { ...baseHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            user_id: currentUser.id,
            match_date: today,
            week_num: weekNum,
            day_of_week: dayOfWeek,
            home_team: homeTeam,
            away_team: awayTeam,
            is_my_game: true,
            home_score: homeScore,
            away_score: awayScore,
            status: 'completed',
            completed_at: new Date().toISOString()
          })
        }
      );
    }

    // ── 시범경기(week_num=0): 일정(matches)만 completed로 남기고 통계는 미반영 ──
    const isPreseason = existingMatches?.[0]?.week_num === 0;
    if (isPreseason) {
      console.log('[저장] 시범경기 — 시즌/통산 통계 미반영 (matches만 completed)');
      return;
    }

    // ── 3단계. season_stats UPSERT ────────────────────────
    //   기존 행 있으면 통계 더하고, 없으면 INSERT
    const statsSearchRes = await fetch(
      `${SUPA_URL}/rest/v1/season_stats?uid=eq.${currentUser.id}&season_id=eq.${seasonId}&select=*`,
      { headers: baseHeaders }
    );
    const existingStats = await statsSearchRes.json();

    const winInc  = isWin ? 1 : 0;
    const lossInc = isWin ? 0 : 1;
    const ab = st.totalAB || 0;

    if (existingStats?.[0]) {
      const cur = existingStats[0];
      await fetch(
        `${SUPA_URL}/rest/v1/season_stats?id=eq.${cur.id}`,
        {
          method: 'PATCH',
          headers: { ...baseHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            games:         (cur.games || 0) + 1,
            wins:          (cur.wins || 0) + winInc,
            losses:        (cur.losses || 0) + lossInc,
            hits:          (cur.hits || 0) + (st.hits || 0),
            at_bats:       (cur.at_bats || 0) + ab,
            hr:            (cur.hr || 0) + (st.hr || 0),
            rbi:           (cur.rbi || 0) + (st.rbi || 0),
            singles:       (cur.singles || 0) + (st.singles || 0),
            doubles:       (cur.doubles || 0) + (st.doubles || 0),
            triples:       (cur.triples || 0) + (st.triples || 0),
            bb:            (cur.bb || 0) + (st.bb || 0),
            earned_runs:   (cur.earned_runs || 0) + (st.earnedRuns || 0),
            outs_recorded: (cur.outs_recorded || 0) + (st.outsRecorded || 0),
            tq:            (cur.tq || 0) + (st.tq || 0),
            updated_at:    new Date().toISOString()
          })
        }
      );
    } else {
      const _sRes = await fetch(
        `${SUPA_URL}/rest/v1/season_stats`,
        {
          method: 'POST',
          headers: { ...baseHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            uid:           currentUser.id,
            season_id:     seasonId,
            games:         1,
            wins:          winInc,
            losses:        lossInc,
            hits:          st.hits || 0,
            at_bats:       ab,
            hr:            st.hr || 0,
            rbi:           st.rbi || 0,
            singles:       st.singles || 0,
            doubles:       st.doubles || 0,
            triples:       st.triples || 0,
            bb:            st.bb || 0,
            earned_runs:   st.earnedRuns || 0,
            outs_recorded: st.outsRecorded || 0,
            tq:            st.tq || 0,
            updated_at:    new Date().toISOString()
          })
        }
      );
      if(!_sRes.ok) _dbgFails.push('season-INSERT '+_sRes.status+': '+(await _sRes.text().catch(()=>'')).slice(0,150));
    }

    // ── 4단계. career_stats UPSERT ────────────────────────
    //   uid PK라 단순. golden_apples는 황금사과 수령 시 따로 +1 (apple_log 트리거)
    const careerSearchRes = await fetch(
      `${SUPA_URL}/rest/v1/career_stats?uid=eq.${currentUser.id}&select=*`,
      { headers: baseHeaders }
    );
    const existingCareer = await careerSearchRes.json();

    if (existingCareer?.[0]) {
      const cur = existingCareer[0];
      await fetch(
        `${SUPA_URL}/rest/v1/career_stats?uid=eq.${currentUser.id}`,
        {
          method: 'PATCH',
          headers: { ...baseHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            games:         (cur.games || 0) + 1,
            wins:          (cur.wins || 0) + winInc,
            losses:        (cur.losses || 0) + lossInc,
            hits:          (cur.hits || 0) + (st.hits || 0),
            at_bats:       (cur.at_bats || 0) + ab,
            hr:            (cur.hr || 0) + (st.hr || 0),
            rbi:           (cur.rbi || 0) + (st.rbi || 0),
            singles:       (cur.singles || 0) + (st.singles || 0),
            doubles:       (cur.doubles || 0) + (st.doubles || 0),
            triples:       (cur.triples || 0) + (st.triples || 0),
            bb:            (cur.bb || 0) + (st.bb || 0),
            earned_runs:   (cur.earned_runs || 0) + (st.earnedRuns || 0),
            outs_recorded: (cur.outs_recorded || 0) + (st.outsRecorded || 0),
            updated_at:    new Date().toISOString()
          })
        }
      );
    } else {
      await fetch(
        `${SUPA_URL}/rest/v1/career_stats`,
        {
          method: 'POST',
          headers: { ...baseHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            uid:           currentUser.id,
            games:         1,
            wins:          winInc,
            losses:        lossInc,
            hits:          st.hits || 0,
            at_bats:       ab,
            hr:            st.hr || 0,
            rbi:           st.rbi || 0,
            singles:       st.singles || 0,
            doubles:       st.doubles || 0,
            triples:       st.triples || 0,
            bb:            st.bb || 0,
            earned_runs:   st.earnedRuns || 0,
            outs_recorded: st.outsRecorded || 0,
            golden_apples: 0,  // apple_log 처치 시 +1 (showAppleAward에서)
            updated_at:    new Date().toISOString()
          })
        }
      );
    }

    console.log('[저장] matches/season_stats/career_stats 저장 완료', {
      season_id: seasonId,
      isWin,
      score: `${st.scoreMe}:${st.scoreAi}`
    });
    // 🔧 임시 진단: 실패가 있으면 화면에 표시 (원인 확정 후 제거)
    if(_dbgFails.length){
      console.error('[저장 실패]', _dbgFails);
      alert('🔧 저장 디버그 — 실패 지점:\n\n' + _dbgFails.join('\n\n'));
    } else {
      console.log('[저장] ✅ 전부 성공 (matches·season·career)');
    }

  } catch (e) {
    console.warn('[저장] Supabase 저장 실패 (게임 흐름 안 끊음):', e?.message || e);
    alert('🔧 저장 디버그 — 예외 발생:\n' + (e?.message || e));
  }
}

// ── 황금사과 수령 UI 처치 (HTML onclick에서 호출) ──
//   버튼 누르면: 황금사과 한 알 박아주고 + 버튼 비활성화 + 안내
async function showAppleAward() {
  const section = document.getElementById('apple-award-section');
  if (!section) return;

  // 버튼 비활성화 — 중복 클릭 방지
  section.innerHTML = `
    <div style="background:linear-gradient(135deg,rgba(201,168,76,0.2),rgba(201,168,76,0.05));border:1px solid rgba(201,168,76,0.4);border-radius:8px;padding:14px;color:#C9A84C;font-size:14px;letter-spacing:0.04em">
      🍎 황금사과 한 알이 자화상 월렛에 들어왔어요
    </div>
  `;

  // 실제 처치
  await awardGoldenApple(1, '경기 완주');
}

// ── 황금사과 수령 처치 (사용자가 *받기* 버튼 누를 때 호출) ──
//   apple_log INSERT + career_stats.golden_apples += 1
async function awardGoldenApple(amount = 1, reason = '경기 완주') {
  if (!currentUser) return;

  try {
    const session = (await supa.auth.getSession()).data.session;
    if (!session) return;
    const token = session.access_token;
    const baseHeaders = {
      'apikey': SUPA_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 1. apple_log INSERT
    await fetch(
      `${SUPA_URL}/rest/v1/apple_log`,
      {
        method: 'POST',
        headers: { ...baseHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          uid: currentUser.id,
          amount: amount,
          reason: reason,
          locked: false
        })
      }
    );

    // 2. career_stats.golden_apples += amount
    const careerRes = await fetch(
      `${SUPA_URL}/rest/v1/career_stats?uid=eq.${currentUser.id}&select=golden_apples`,
      { headers: baseHeaders }
    );
    const careerData = await careerRes.json();
    const curApples = careerData?.[0]?.golden_apples || 0;

    await fetch(
      `${SUPA_URL}/rest/v1/career_stats?uid=eq.${currentUser.id}`,
      {
        method: 'PATCH',
        headers: { ...baseHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          golden_apples: curApples + amount,
          updated_at: new Date().toISOString()
        })
      }
    );

    console.log('[황금사과] 수령 완료', { amount, reason, total: curApples + amount });
  } catch (e) {
    console.warn('[황금사과] apple_log INSERT 실패:', e?.message || e);
  }
}

// ═══════════════════════════════════════════════════
// 🎲 주사위 결판 시스템 (점수 동점 시)
// ═══════════════════════════════════════════════════
// 각 숫자가 정면에 보이게 하는 회전 각도
const FACE_ROTATIONS = {
  1: { x: 0,   y: 0   },
  2: { x: 0,   y: 180 },
  3: { x: 0,   y: -90 },
  4: { x: 0,   y: 90  },
  5: { x: -90, y: 0   },
  6: { x: 90,  y: 0   },
};

let diceRound = 0;

function showDiceScreen() {
  // 결과 화면 숨기기 + 주사위 화면 띄우기
  const ra = document.getElementById('result-area');
  if(ra) ra.style.display = 'none';
  
  document.getElementById('dice-screen').style.display = 'flex';
  
  // 상대 이름 표시
  const aiLabel = document.getElementById('dice-label-ai');
  if(aiLabel) aiLabel.textContent = currentOpp ? currentOpp.shortName : '상대';
  
  // 초기화
  diceRound = 0;
  resetDiceVisuals();
}

function resetDiceVisuals() {
  ['dice-me-1', 'dice-me-2', 'dice-ai-1', 'dice-ai-2'].forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.style.transition = 'none';
    el.style.transform = 'rotateX(-20deg) rotateY(25deg)';
    // 다음 굴림 위해 transition 다시 켜기 (next frame)
    requestAnimationFrame(() => {
      el.style.transition = 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
    });
  });
  document.getElementById('dice-product-me').textContent = '—';
  document.getElementById('dice-product-ai').textContent = '—';
  document.getElementById('btn-roll-dice').disabled = false;
  document.getElementById('btn-roll-dice').textContent = '🎲 주사위 던지기';
}

function diceSleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function rollOneDice(elId) {
  const el = document.getElementById(elId);
  if(!el) return Math.floor(Math.random() * 6) + 1;
  
  const num = Math.floor(Math.random() * 6) + 1;
  const t = FACE_ROTATIONS[num];
  
  // 매번 다른 방향으로 굴리기 위해 추가 회전 랜덤화
  const extraSpinX = (Math.floor(Math.random() * 2) + 3) * 360;
  const extraSpinY = (Math.floor(Math.random() * 2) + 3) * 360;
  const finalRotX = extraSpinX + t.x;
  const finalRotY = extraSpinY + t.y;
  
  el.style.transform = `rotateX(${finalRotX}deg) rotateY(${finalRotY}deg)`;
  el.style.webkitTransform = `rotateX(${finalRotX}deg) rotateY(${finalRotY}deg)`;
  
  await diceSleep(1200);
  return num;
}

async function rollDice() {
  diceRound++;
  document.getElementById('dice-rounds-display').textContent = diceRound + '회차';
  document.getElementById('btn-roll-dice').disabled = true;
  document.getElementById('dice-product-me').textContent = '—';
  document.getElementById('dice-product-ai').textContent = '—';
  
  // 🎵 9초 통합 주사위 사운드 (굴림 + 확정음)
  const diceSfx = new Audio('dice_sequence.mp3');
  diceSfx.volume = 0.7;
  diceSfx.play().catch(()=>{});
  
  // 소로 두 알 (한 알씩, 0.6초 간격)
  const me1 = await rollOneDice('dice-me-1');
  await diceSleep(600);
  const me2 = await rollOneDice('dice-me-2');
  const myProduct = me1 * me2;
  document.getElementById('dice-product-me').textContent = `${me1} × ${me2} = ${myProduct}`;
  await diceSleep(1500);
  
  // 상대 두 알 (자동)
  const ai1 = await rollOneDice('dice-ai-1');
  await diceSleep(600);
  const ai2 = await rollOneDice('dice-ai-2');
  const aiProduct = ai1 * ai2;
  document.getElementById('dice-product-ai').textContent = `${ai1} × ${ai2} = ${aiProduct}`;
  await diceSleep(1500);
  
  // 결판
  if (myProduct > aiProduct) {
    finishDice('승리', myProduct, aiProduct, [me1, me2], [ai1, ai2]);
  } else if (myProduct < aiProduct) {
    finishDice('패배', myProduct, aiProduct, [me1, me2], [ai1, ai2]);
  } else {
    // 또 동점 → 즉시 자동 재굴림
    document.getElementById('dice-rounds-display').textContent = '동점! 즉시 재굴림...';
    await diceSleep(800);
    resetDiceVisuals();
    document.getElementById('btn-roll-dice').disabled = true;
    rollDice();
  }
}

function finishDice(diceResult, myProduct, aiProduct, myDice, aiDice) {
  // 결과 저장
  st.diceResult = {
    myDice, aiDice,
    myProduct, aiProduct,
    rounds: diceRound,
  };
  
  // 1.5초 후 주사위 화면 닫고 결과 화면으로
  setTimeout(() => {
    document.getElementById('dice-screen').style.display = 'none';
    
    // 결과 화면이 들어있는 main-content 띄우기
    const mh = document.getElementById('main-header');
    const mc = document.getElementById('main-content');
    if(mh) mh.style.display = 'flex';
    if(mc) mc.style.display = 'flex';
    
    // 🎵 팡파레 사운드 (승/패에 따라 다른 음원)
    const oppName = currentOpp ? currentOpp.shortName : 'OPPONENT';
    if(diceResult === '승리') {
      const winSfx = new Audio('dice_fanfare_win.mp3');
      winSfx.volume = 0.8;
      winSfx.play().catch(()=>{});
      showFinalResult('SORO 운명의 승리', '#C9A84C', '🎲');
    } else {
      const loseSfx = new Audio('dice_fanfare_lose.mp3');
      loseSfx.volume = 0.8;
      loseSfx.play().catch(()=>{});
      showFinalResult(`${oppName} 운명의 승리`, '#8B5E52', '🎲');
    }
  }, 1500);
}

// ── 게임 흐름 제어 ──────────────────────────────
// 루키리그 상대팀 데이터
// ── 옛 매치업 카드 화면(countdown/showStadiumHome/enterStadium/goToHome) 함수들 ──
//    2026-05-01 분리 작업 중 제거됨 (현재 흐름에서 안 쓰임)
//    필요 시 git history에서 복원 가능


// ── CARD_STATS, OPP_STATS는 game_rookie.html에서 선언됨 ──
// 봇별 야구카드 스탯 데이터. 리그가 바뀌면 이 데이터도 바뀜.


// 카드 슬라이드 타이머
let cardSlideTimer = null;
let cardSlideIdx = 0;

function startCardSlide() {
  cardSlideIdx = 0;
  const track = document.getElementById('card-slide-track');
  if(track) {
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';
  }
  updateCardDots(0);
  if(cardSlideTimer) clearInterval(cardSlideTimer);
  cardSlideTimer = setInterval(() => {
    cardSlideIdx++;
    const track = document.getElementById('card-slide-track');
    if(!track) return;
    track.style.transition = 'transform 0.6s cubic-bezier(0.4,0,0.2,1)';
    // 4장 트랙에서 25%씩 이동
    track.style.transform = `translateX(-${cardSlideIdx * 25}%)`;
    updateCardDots(cardSlideIdx % 2);
    // 3번째(인덱스2) 상대 카드까지 오면 → 순간이동으로 처음으로
    if(cardSlideIdx === 2) {
      setTimeout(() => {
        if(!cardSlideTimer) return;
        const t = document.getElementById('card-slide-track');
        if(t) {
          t.style.transition = 'none';
          t.style.transform = 'translateX(0)';
        }
        cardSlideIdx = 0;
        updateCardDots(0);
      }, 600);
    }
  }, 5000);
}

function updateCardDots(activeIdx) {
  [0,1].forEach(i => {
    const dot = document.getElementById('dot-' + i);
    if(dot) dot.className = 'card-dot' + (i === activeIdx ? ' active' : '');
  });
}

function stopCardSlide() {
  if(cardSlideTimer) { clearInterval(cardSlideTimer); cardSlideTimer = null; }
}

function showEntryScreen() {
  const opp = currentOpp;
  if(!opp) return;

  // 드론 영상 — 구장별 연동
  const key = opp.emblemImg.replace('emblem_','').replace('.jpg','');
  const droneMap = {
    proust:   'drone_proust.mp4',
    socrates: 'drone_socrates.mp4',
    pascal:   'drone_pascal.mp4',
    soro:     'drone_soro.mp4',
  };
  const stadiumKey = currentIsHome ? 'soro' : key;
  const droneSrc = droneMap[stadiumKey] || 'drone_socrates.mp4';

  const droneVideo = document.getElementById('entry-drone-video');
  if(droneVideo) {
    // 소크라테스 구장은 무음, 나머지는 오디오 포함
    droneVideo.muted = (stadiumKey === 'socrates');
    droneVideo.src = droneSrc;
    droneVideo.load();
    droneVideo.play().catch(()=>{});
  }

  // 소크라테스 구장 관중 소음 — 추후 다른 파일로 교체 예정
  // if(stadiumKey === 'socrates' && GAME_ACTIVE) { SND.crowd_ambient(); }

  const droneLabel = document.getElementById('entry-drone-label');
  if(droneLabel) droneLabel.textContent = (currentIsHome ? '🏠 홈 경기' : '✈️ 원정 경기') + ' · ' + (currentIsHome ? HOME.stadium : opp.stadium);

  // 상대 카드 이미지 연동
  const cardMap = {
    proust:   'card_proust2.png',
    socrates: 'card_socrates2.png',
    pascal:   'card_pascal2.png',
  };
  const oppCardSrc = cardMap[key] || 'card_pascal2.png';
  const oppCardEl = document.getElementById('card-opp-img');
  if(oppCardEl) oppCardEl.src = oppCardSrc;
  const oppCardEl2 = document.getElementById('card-opp-img2');
  if(oppCardEl2) oppCardEl2.src = oppCardSrc;

  // 상대 카드 스탯 업데이트
  const cs = CARD_STATS[key] || CARD_STATS.pascal;
  const setEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  setEl('opp-league', cs.league);
  setEl('opp-games',  cs.games);
  setEl('opp-record', cs.record);
  setEl('opp-avg',    cs.avg);
  setEl('opp-ops',    cs.ops);
  setEl('opp-rbi',    cs.rbi);
  setEl('opp-hr',     cs.hr);
  setEl('opp-era',    cs.era);

  // 소로 카드 스탯 — Supabase season_stats 연동
  updateSoroCard();

  // 카드 슬라이드 시작
  startCardSlide();

  // 화면 전환
  document.getElementById('pregame-screen').style.display = 'none';
  document.getElementById('main-header').style.display = 'none';
  document.getElementById('main-content').style.display = 'none';
  document.getElementById('game-area').style.display = 'none';
  document.getElementById('result-area').style.display = 'none';
  document.getElementById('zone-board-screen').style.display = 'none';
  document.getElementById('entry-screen').style.display = 'flex';
}

function enterZoneBoard() {
  stopCardSlide();
  document.getElementById('entry-screen').style.display = 'none';

  // 스코어보드 팀 설정 (startGame 로직과 동일)
  const oppName = currentOpp ? currentOpp.name : '';
  const oppEmblemSrc = currentOpp ? currentOpp.emblemImg : 'emblem_proust.jpg';
  const oppColor = currentOpp ? currentOpp.color : '#C94A0F';
  const soroEmblemSrc = 'emblem_soro.jpg';
  const soroColor = '#8B1A1A';
  const cl = document.getElementById('color-left');
  const cr = document.getElementById('color-right');
  const li = document.getElementById('emblem-left-img');
  const ri = document.getElementById('emblem-right-img');

  if(currentIsHome) {
    if(cl) cl.style.background = oppColor;
    if(cr) cr.style.background = soroColor;
    if(li) li.src = oppEmblemSrc;
    if(ri) ri.src = soroEmblemSrc;
  } else {
    if(cl) cl.style.background = soroColor;
    if(cr) cr.style.background = oppColor;
    if(li) li.src = soroEmblemSrc;
    if(ri) ri.src = oppEmblemSrc;
  }

  // 잔디 배경 활성화
  const fb = document.getElementById('field-bg');
  fb.className = 'field-bg';
  if(currentIsHome) {
    fb.classList.add('stadium-soro');
  } else {
    const key = currentOpp ? currentOpp.emblemImg.replace('emblem_','').replace('.jpg','') : 'proust';
    fb.classList.add('stadium-' + key);
  }
  fb.classList.add('game-active');
  applyRandomStadiumBg(fb); // 풀배경 이미지 랜덤 적용

  // 공수 설정 (홈=후공=수비먼저, 원정=선공=공격먼저)
  st.isAttack = !currentIsHome;

  // 오르간
  const opening = new Audio('organ01_game_opening.mp3');
  opening.volume = 0.75;
  opening.play().catch(()=>{});

  // 존 보드 초기화 후 공수에 맞는 화면으로
  buildZoneBoard();
  showAtStep();
}

// ── OPPONENTS, HOME 데이터는 game_rookie.html에서 선언됨 ──
// 리그별 봇 정보가 다르기 때문에 (루키: 3봇, 싱글A: 5봇 등)
// game_core.js는 currentOpp / currentIsHome 변수만 참조함


// 전역: 현재 경기 홈/원정 상태
let currentIsHome = false;
let currentOpp = null;

function fillMatrix() {
  const matrix = document.getElementById('pg-matrix');
  matrix.innerHTML = '';
  if(QS_LOADED && QS.length > 0) {
    // seed_id별로 하나씩만 뽑아 중복 방지
    const seedMap = {};
    [...QS].sort(()=>Math.random()-0.5).forEach(q => {
      if(!seedMap[q.seed_id]) seedMap[q.seed_id] = q;
    });
    const shuffled = Object.values(seedMap).sort(()=>Math.random()-0.5).slice(0,9);
    shuffled.forEach((q, i) => {
      // 조사 제거 + 스마트 키워드 추출
      function cleanKeyword(keyword) {
        if(!keyword) return '';
        // 첫 두 단어까지 사용
        const words = keyword.split(' ');
        let kw = words.slice(0, 2).join(' ');
        // 끝에 붙는 조사 제거
        kw = kw.replace(/(의|에서|으로|이|을|가|은|는|와|과|도|만|에|를|로|한|던|인|된|하는|라는|라|이라|이란|이다|다|며|고|서)$/, '');
        // 10자 초과면 자르기
        if(kw.length > 8) kw = kw.slice(0, 8);
        return kw;
      }
      const kw = q.zone_keyword || cleanKeyword(q.keyword) || q.cat.split('·')[0].trim();
      matrix.innerHTML += '<div class="pg-matrix-cell"><span class="zone-num">ZONE '+(i+1)+'</span>'+kw+'</div>';
    });
  } else {
    for(let i=0;i<9;i++) {
      matrix.innerHTML += '<div class="pg-matrix-cell"><span class="zone-num">ZONE '+(i+1)+'</span>···</div>';
    }
  }
}

function initGame(){
  GAME_ACTIVE = false;
  // 매 게임마다 문제 순서 새로 셔플 (반복 출현 방지)
  if (QS_LOADED) shuffleQSForGame();
  // 모든 게임 화면 숨기기 (깜빡임 방지)
  const hideIds = ['pregame-screen','zone-board-screen','entry-screen',
    'stadium-home-screen','atstep-screen','pitchready-screen','windup-screen','defense-ready-screen','main-header','main-content'];
  hideIds.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.style.display = 'none';
  });
  // 프리게임 화면 — 잔디 배경 비활성화 (딥그린 민짜)
  const fb = document.getElementById('field-bg');
  if(fb) fb.classList.remove('game-active');
  
  // ⚠️ 옛 흐름의 "랜덤 상대 매칭"은 제거됨.
  //    이제는 game_rookie.html의 enterGameDirectly()가 
  //    URL 파라미터(?opp=...&isHome=...)를 읽어 currentOpp/currentIsHome 설정.
  //    initGame()은 화면 초기화만 담당.
  return;
  
  // ↓↓↓ 아래는 옛 매치업 카드 화면용 코드 (미사용, 삭제 예정) ↓↓↓
  // 상대팀 랜덤 선택
  const opp = OPPONENTS[Math.floor(Math.random()*OPPONENTS.length)];
  currentOpp = opp;
  currentIsHome = Math.random() > 0.5;

  // 경기장 설정 (홈: 소로 파크, 원정: 상대방 구장)
  const stadium = currentIsHome ? HOME : opp;

  document.getElementById('pg-ai-name').textContent = opp.name;
  document.getElementById('pg-ai-stat').textContent = opp.stat;
  document.getElementById('pg-stadium-img').src = stadium.stadiumImg;
  document.getElementById('pg-emblem-img').src = opp.emblemImg;
  document.getElementById('pg-stadium-name').textContent = stadium.stadium;
  document.getElementById('pg-stadium-location').textContent = stadium.location;
  document.getElementById('pg-home-away').textContent = currentIsHome ? '🏠 홈 경기 · 후공' : '✈️ 원정 경기 · 선공';

  // 구장별 배경 변경
  const fieldBg = document.getElementById('field-bg');
  if(fieldBg) {
    fieldBg.className = 'field-bg';
    if(currentIsHome) {
      fieldBg.classList.add('stadium-soro');
    } else {
      const stadiumKey = opp.stadiumImg.replace('stadium_','').replace('.jpg','');
      fieldBg.classList.add('stadium-' + stadiumKey);
    }
  }

  // 매트릭스 채우기
  fillMatrix();
  // 프리게임은 goToStadium()에서 열림
}

function startGame(){
  GAME_ACTIVE = true;
  // ── 새 경기 시작 — 누적 set 청산 (v1.5+)
  // 이전 경기에서 등장한 문제·인물·정답 흔적 청산
  GAME_USED_SEEDS.clear();
  GAME_USED_FIGURES.clear();
  GAME_USED_ANSWERS.clear();
  if(!QS_LOADED || QS.length === 0){
    alert("문제를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
    return;
  }
  // 오르간은 타석 선택하기 버튼 누를 때 재생
  // 혹시 매트릭스가 ··· 상태면 다시 채우기
  fillMatrix();
  // 스코어보드 팀명 — 홈경기: 왼쪽=상대, 오른쪽=소로 / 원정경기: 왼쪽=소로, 오른쪽=상대
  const oppName = document.getElementById('pg-ai-name').textContent;
  const leftTeam  = document.getElementById('score-left-name');
  const rightTeam = document.getElementById('score-right-name');
  const scoreLeft  = document.getElementById('score-left');
  const scoreRight = document.getElementById('score-right');
  const oppEmblemSrc = currentOpp ? currentOpp.emblemImg : 'emblem_proust.jpg';
  const oppColor = currentOpp ? currentOpp.color : '#C94A0F';
  const soroEmblemSrc = 'emblem_soro.jpg';
  const soroColor = HOME.color || '#8B1A1A';
  const cl = document.getElementById('color-left');
  const cr = document.getElementById('color-right');
  const li = document.getElementById('emblem-left-img');
  const ri = document.getElementById('emblem-right-img');
  if(currentIsHome) {
    // 홈: 좌=상대, 우=소로
    if(leftTeam)  leftTeam.textContent  = oppName;
    if(rightTeam) rightTeam.textContent = '소로';
    if(cl) cl.style.background = oppColor;
    if(cr) cr.style.background = soroColor;
    if(li) li.src = oppEmblemSrc;
    if(ri) ri.src = soroEmblemSrc;
  } else {
    // 원정: 좌=소로, 우=상대
    if(leftTeam)  leftTeam.textContent  = '소로';
    if(rightTeam) rightTeam.textContent = oppName;
    if(cl) cl.style.background = soroColor;
    if(cr) cr.style.background = oppColor;
    if(li) li.src = soroEmblemSrc;
    if(ri) ri.src = oppEmblemSrc;
  }

  // 게임 시작 — 잔디 배경 활성화 + 구장 클래스 재확인
  const fb = document.getElementById('field-bg');
  fb.className = 'field-bg'; // 초기화
  // 현재 구장 클래스 다시 설정
  const pgStadiumName = document.getElementById('pg-stadium-name').textContent;
  if(currentIsHome) {
    fb.classList.add('stadium-soro');
  } else {
    if(pgStadiumName.includes('Socrates')) fb.classList.add('stadium-socrates');
    else if(pgStadiumName.includes('Proust')) fb.classList.add('stadium-proust');
    else if(pgStadiumName.includes('Pascal')) fb.classList.add('stadium-pascal');
    else fb.classList.add('stadium-soro');
  }
  fb.classList.add('game-active');
  applyRandomStadiumBg(fb); // 풀배경 이미지 랜덤 적용
  // 홈=후공(말, isAttack=false), 원정=선공(초, isAttack=true)
  st.isAttack = !currentIsHome;
  // 존 보드 초기화
  buildZoneBoard();
  // 프리게임 → 입장 화면 (드론영상 + 야구카드)
  showEntryScreen();
}

function showAtStep(){
  // 공격이면 → 존 보드 화면
  if(st.isAttack){
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('result-area').style.display = 'none';
    document.getElementById('judging-area').style.display = 'none';
    document.getElementById('reveal-screen').style.display = 'none';
    showZoneBoardScreen();
    return;
  }

  // 수비
  const q = getQ();
  const parts = q.cat.split('·');
  const catMain = parts[0]?.trim() || q.cat;
  const catSub  = parts[1]?.trim() || '';
  const half = currentIsHome?'초':'말';
  const arrow = currentIsHome?'▲':'▽';
  const inningTxt = st.inning+'회 '+half+' '+arrow+' · '+st.atbat+'번 타자';
  {
    // 수비 → 수비 준비 화면 (상대 타자 등장 멘트)
    document.getElementById('main-header').style.display = 'flex';
    document.getElementById('main-content').style.display = 'flex';
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('result-area').style.display = 'none';
    document.getElementById('judging-area').style.display = 'none';
    document.getElementById('atstep-screen').style.display = 'none';
    document.getElementById('pitchready-screen').style.display = 'none';
    document.getElementById('windup-screen').style.display = 'none';

    const oppName = currentOpp ? (currentOpp.shortName || 'AI') : 'AI';
    const drInning = document.getElementById('dr-inning');
    if (drInning) drInning.textContent = inningTxt.replace('번 타자', '번 상대 타자');

    // 스코어보드 동기화
    const leftName  = document.getElementById('dr-left-name');
    const rightName = document.getElementById('dr-right-name');
    const leftScore  = document.getElementById('dr-left-score');
    const rightScore = document.getElementById('dr-right-score');
    if (currentIsHome) {
      if (leftName)  leftName.textContent  = oppName;
      if (rightName) rightName.textContent = 'SORO';
      if (leftScore)  leftScore.textContent  = st.scoreAi;
      if (rightScore) rightScore.textContent = st.scoreMe;
    } else {
      if (leftName)  leftName.textContent  = 'SORO';
      if (rightName) rightName.textContent = oppName;
      if (leftScore)  leftScore.textContent  = st.scoreMe;
      if (rightScore) rightScore.textContent = st.scoreAi;
    }

    // 이닝 번호 동기화
    const drInningNum = document.getElementById('dr-inning-num');
    if (drInningNum) drInningNum.textContent = st.inning;

    // 타자 등장 멘트 — 2줄 슬라이딩 창 (새 줄이 오면 위 줄은 흐려지며 사라짐)
    const oppFull = currentOpp ? currentOpp.name : '상대 타자';
    const msgLines = [
      oppFull + ' 타자가 타석에 들어섭니다.',
      'Soro 마운드에서 준비를 하고 있습니다.',
      '준비가 되면 아래 셋 포지션 버튼을 누르세요.',
    ];
    const line1El = document.getElementById('dr-line1');
    const line2El = document.getElementById('dr-line2');
    const btn = document.getElementById('dr-btn');
    if (line1El && line2El) {
      line1El.textContent = '';
      line2El.textContent = '';
      btn.style.opacity = '0';

      let lineIdx = 0;
      let charIdx = 0;

      function typeNextLine() {
        if (lineIdx >= msgLines.length) {
          setTimeout(() => { btn.style.opacity = '1'; }, 300);
          return;
        }
        const line = msgLines[lineIdx];
        charIdx = 0;
        const typeTimer = setInterval(() => {
          line2El.textContent = line.slice(0, charIdx + 1);
          if (Math.random() < 0.6) SND.type();
          charIdx++;
          if (charIdx >= line.length) {
            clearInterval(typeTimer);
            lineIdx++;
            if (lineIdx < msgLines.length) {
              // 현재 line2 → line1으로 올리고 (흐릿하게), line2 초기화
              setTimeout(() => {
                line1El.textContent = line2El.textContent;
                line1El.style.opacity = '0.45';
                line2El.textContent = '';
                typeNextLine();
              }, 600);
            } else {
              setTimeout(() => { btn.style.opacity = '1'; }, 300);
            }
          }
        }, 55);
      }
      typeNextLine();
    }

    document.getElementById('defense-ready-screen').style.display = 'flex';
    // 홈 경기 첫 장면 — 관중 함성으로 분위기 살리기
    setTimeout(() => SND.cheer(), 400);
    renderBadge();
  }
}

function enterBatterBox(){
  // 타석 준비 → 투구 준비
  const q = getQ();
  const parts = q.cat.split('·');
  const catMain = parts[0]?.trim() || q.cat;
  const catSub  = parts[1]?.trim() || '';
  const half = currentIsHome ? '말' : '초';
  const arrow = currentIsHome ? '▼' : '▲';
  const inningTxt = st.inning+'회 '+half+' '+arrow+' · '+st.atbat+'번 타자';

  document.getElementById('atstep-screen').style.display = 'none';
  document.getElementById('pitchready-screen').style.display = 'flex';
  document.getElementById('pr-inning').textContent   = inningTxt;
  document.getElementById('pr-category').textContent = shortCat(catMain);
  document.getElementById('pr-keyword').textContent  = q.keyword || catSub || catMain;
  document.getElementById('pr-sub').textContent      = '배트를 꽉 쥐고 — 준비되면 투구 요청!';
}

function requestWindup(){
  // 셋 포지션 → 와인드업 화면으로 (공격)
  document.getElementById('pitchready-screen').style.display = 'none';
  const ws = document.getElementById('windup-screen');
  ws.style.display = 'flex';
  document.getElementById('wu-inning').textContent = document.getElementById('pr-inning').textContent;
  document.getElementById('wu-category').textContent = document.getElementById('pr-category').textContent;
  document.getElementById('wu-keyword').textContent = document.getElementById('pr-keyword').textContent;
}

function startDefenseWindup(){
  // 수비 준비 → 와인드업으로 (수비)
  document.getElementById('defense-ready-screen').style.display = 'none';
  const q = getQ();
  const parts = q.cat.split('·');
  const catMain = parts[0]?.trim() || q.cat;
  const ws = document.getElementById('windup-screen');
  ws.style.display = 'flex';
  document.getElementById('wu-inning').textContent = document.getElementById('dr-inning').textContent;
  document.getElementById('wu-category').textContent = shortCat(catMain);
  document.getElementById('wu-keyword').textContent = q.keyword || catMain;
}

function requestPitch(){
  // 와인드업 → 실제 문제 시작
  document.getElementById('pitchready-screen').style.display = 'none';
  document.getElementById('windup-screen').style.display = 'none';
  document.getElementById('defense-ready-screen').style.display = 'none';
  document.getElementById('main-header').style.display = 'flex';
  document.getElementById('main-content').style.display = 'flex';
  document.getElementById('game-area').style.display = 'block';
  startQ();
}

// nextQ — 1이닝 모델
// 공수 교대 전용 함수
function switchHalf(){
  const rs = document.getElementById('reveal-screen');
  rs.style.display = 'none';
  document.getElementById('zone-board-screen').style.display = 'none';
  document.getElementById('windup-screen').style.display = 'none';
  document.getElementById('defense-ready-screen').style.display = 'none';
  document.getElementById('reveal-question').textContent = '';
  document.getElementById('reveal-answer').textContent = '';
  document.getElementById('reveal-commentary').textContent = '';
  clearAll();
  if(st.hrTimer){clearInterval(st.hrTimer);st.hrTimer=null;}
  st.outs=0;st.bases=[false,false,false];
  st.atbat=1; // 이닝 바뀌면 타자 번호 1번으로 리셋
  st.isAttack = !st.isAttack; // 공수 전환
  renderBases();renderOuts();switchStatPanel();
  st.qIdx=(st.qIdx+1)%QS.length;
  showAtStep();
}

function nextQ(){
  // 각인 화면 완전 초기화
  const rs = document.getElementById('reveal-screen');
  rs.style.display = 'none';
  document.getElementById('zone-board-screen').style.display = 'none';
  document.getElementById('windup-screen').style.display = 'none';
  document.getElementById('defense-ready-screen').style.display = 'none';
  document.getElementById('reveal-question').textContent = '';
  document.getElementById('reveal-answer').textContent = '';
  document.getElementById('reveal-commentary').textContent = '';
  clearAll();
  if(st.hrTimer){clearInterval(st.hrTimer);st.hrTimer=null;}
  st.qIdx=(st.qIdx+1)%QS.length;
  showAtStep();
}

// initGame은 initAuth() 안에서 호출됨
