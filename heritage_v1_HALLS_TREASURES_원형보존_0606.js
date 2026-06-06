const HALLS = [
  {
    id: 'renaissance',
    name: '르네상스·바로크관',
    bg: 'bg-renaissance',
    isLight: false,
    accentColor: 'rgba(220,150,40,0.8)',
    rooms: [
      { id: 'italy_renaissance', name: '이탈리아 르네상스실', en: 'Italian Renaissance', desc: '15~16세기 · 인간의 재발견', theme: '인체와 신성의 경계' },
      { id: 'north_renaissance', name: '북유럽 르네상스실',   en: 'Northern Renaissance', desc: '15~16세기 · 빛과 디테일', theme: '일상 속의 영원' },
      { id: 'baroque',           name: '바로크실',             en: 'Baroque',              desc: '17세기 · 극적 명암',     theme: '빛이 어둠을 가르다' },
    ]
  },
  {
    id: 'romantic',
    name: '낭만·인상주의관',
    bg: 'bg-romantic',
    isLight: true,
    accentColor: 'rgba(120,80,20,0.7)',
    rooms: [
      { id: 'romanticism',        name: '낭만주의실',       en: 'Romanticism',              desc: '19세기 전반 · 감정의 해방', theme: '폭풍 속의 숭고' },
      { id: 'impressionism',      name: '인상주의실',       en: 'Impressionism',            desc: '19세기 후반 · 빛의 포착', theme: '빛을 그린 사람들' },
      { id: 'post_impressionism', name: '후기인상주의실',   en: 'Post-Impressionism',       desc: '19세기 말 · 내면의 색채', theme: '색이 감정이 될 때' },
    ]
  },
  {
    id: 'modern',
    name: '근현대관',
    bg: 'bg-modern',
    isLight: false,
    accentColor: 'rgba(200,200,220,0.6)',
    rooms: [
      { id: 'early_modern',  name: '20세기 전반실', en: 'Early Modern',  desc: '1900~1950 · 해체와 실험', theme: '형태는 무너지고' },
      { id: 'late_modern',   name: '20세기 후반실', en: 'Late Modern',   desc: '1950~2000 · 개념의 시대', theme: '예술은 무엇인가' },
      { id: 'contemporary',  name: '동시대 미술실', en: 'Contemporary',  desc: '2000~ · 경계의 소멸',    theme: '지금 이 순간' },
    ]
  },
  {
    id: 'ancient',
    name: '고대·중세관',
    bg: 'bg-ancient',
    isLight: false,
    accentColor: 'rgba(201,168,76,0.7)',
    rooms: [
      { id: 'ancient_egypt', name: '고대 이집트실',   en: 'Ancient Egypt',        desc: '영원을 향한 집착',       theme: '죽음 너머의 세계' },
      { id: 'greece_rome',   name: '그리스·로마실',   en: 'Greece & Rome',        desc: '이상적 인간의 탄생',     theme: '아름다움의 기준' },
      { id: 'medieval',      name: '중세·비잔틴실',   en: 'Medieval & Byzantine', desc: '신을 향한 예술',         theme: '금빛 하늘의 성인들' },
    ]
  },
  {
    id: 'oriental',
    name: '동양관',
    bg: 'bg-oriental',
    isLight: false,
    accentColor: 'rgba(40,160,120,0.7)',
    rooms: [
      { id: 'east_asia',  name: '동아시아실',       en: 'East Asia',         desc: '중국·일본·조선',       theme: '여백의 철학' },
      { id: 'islamic',    name: '이슬람·페르시아실', en: 'Islamic & Persian', desc: '기하학과 문자의 예술', theme: '신의 이름으로' },
      { id: 'india_sea',  name: '인도·동남아실',     en: 'India & SE Asia',   desc: '신화가 살아있는 공간', theme: '천 개의 신들' },
    ]
  },
  {
    id: 'music',
    name: '음악당',
    bg: 'bg-music',
    isLight: false,
    accentColor: 'rgba(100,120,220,0.8)',
    rooms: [
      { id: 'baroque_classic', name: '바로크·고전실',   en: 'Baroque & Classical',      desc: '바흐·모차르트·베토벤', theme: '형식이 곧 자유다' },
      { id: 'romantic_music',  name: '낭만·인상주의실', en: 'Romantic & Impressionist', desc: '쇼팽·드뷔시·말러',    theme: '소리로 쓴 일기' },
      { id: 'modern_jazz',     name: '근현대·재즈실',   en: 'Modern & Jazz',            desc: '20세기의 소리',       theme: '즉흥의 철학' },
    ]
  },
  {
    id: 'architecture',
    name: '건축·공간관',
    bg: 'bg-architecture',
    isLight: false,
    accentColor: 'rgba(100,150,200,0.7)',
    rooms: [
      { id: 'arch_ancient', name: '고대·중세 건축실', en: 'Ancient Architecture', desc: '파르테논부터 고딕까지', theme: '돌이 하늘에 닿다' },
      { id: 'arch_modern',  name: '근세 건축실',       en: 'Early Modern Arch',    desc: '르네상스·바로크 공간', theme: '비례의 아름다움' },
      { id: 'arch_contemp', name: '근현대 건축실',     en: 'Contemporary Arch',    desc: '사그라다에서 렘쿨하스', theme: '공간이 말을 건다' },
    ]
  },
];

// ══════════════════════════════════════════════
// 보물 데이터 (오픈 9점 샘플)
// status: 'available' | 'sold' | 'locked'
// img: 소로님이 제작한 투명 PNG 파일명
// ══════════════════════════════════════════════
const TREASURES = {
  // 르네상스·바로크관
  italy_renaissance: [
    {
      id: 'htg_001',
      name: '비너스의 탄생',
      artist: '산드로 보티첼리',
      period: '1484–1486',
      origin: '우피치 미술관, 피렌체',
      img: 'htg_001_botticelli_venus.webp',
      status: 'available',
      owner: null,
      grade: 'diamond',
      source_url: 'https://commons.wikimedia.org/wiki/File:Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg',
      library: {
        knowledge: '보티첼리가 메디치 가문의 의뢰로 제작한 이 작품은 고대 그리스 신화를 주제로 한 최초의 대형 캔버스 회화 중 하나입니다. 당시 종교화 일색이던 피렌체 화단에서 이교적 신화를 정면으로 다룬 혁신적 시도였습니다.',
        thought: '비너스는 완전한 모습으로 파도에서 태어납니다. 죄도 없이, 순수하게. 어쩌면 보티첼리는 인간의 이상적 아름다움을 신의 영역에서 꺼내 지상으로 내려오게 한 것인지도 모릅니다.',
        connection: '플라톤의 미론, 신플라톤주의 철학, 그리고 단테의 베아트리체가 이 그림 안에 녹아있습니다. 메디치 가문이 후원한 르네상스 인문주의의 정점이기도 합니다.',
        curation: '📖 곰브리치 《서양미술사》 / 🎵 비발디 《사계》 봄 1악장 / 🎬 영화 《아마데우스》',
      }
    },
  ],
  north_renaissance: [],
  baroque: [
    {
      id: 'htg_002',
      name: '진주 귀걸이를 한 소녀',
      artist: '요하네스 베르메르',
      period: '1665년경',
      origin: '마우리츠하이스 미술관, 헤이그',
      img: 'htg_002_vermeer_pearl.webp',
      status: 'available',
      owner: null,
      grade: 'diamond',
      source_url: 'https://commons.wikimedia.org/wiki/File:1665_Girl_with_a_Pearl_Earring.jpg',
      library: {
        knowledge: '"네덜란드의 모나리자"라 불리는 이 작품은 베르메르 특유의 빛 처리 기법이 절정에 달한 작품입니다. 검은 배경에서 떠오르는 소녀의 얼굴, 그리고 그 시선.',
        thought: '그녀는 누구를 바라보는가. 아니, 그녀는 왜 돌아보는가. 이 순간적인 포착이 350년 동안 수백만 명을 멈추게 했습니다. 영원한 것은 완성이 아니라 미완성 속에 있을지도.',
        connection: '트로니(Tronie)라는 네덜란드 특유의 초상화 장르. 실제 인물이 아닌 특정 유형의 인물을 표현합니다. 카라바조의 빛과 렘브란트의 심리가 베르메르 안에서 만납니다.',
        curation: '📖 트레이시 슈발리에 《진주 귀걸이 소녀》(소설) / 🎬 동명 영화(2003)',
      }
    },
    {
      id: 'htg_003',
      name: '야경',
      artist: '렘브란트 판 레인',
      period: '1642',
      origin: '암스테르담 국립미술관',
      img: 'htg_003_rembrandt_nightwatch.webp',
      status: 'available',
      owner: null,
      grade: 'gold',
      source_url: 'https://commons.wikimedia.org/wiki/File:The_Night_Watch_-_HD.jpg',
      library: {
        knowledge: '세계에서 가장 유명한 집단 초상화. 프란스 반닝 코크 대장이 이끄는 민병대원들이 출동하는 순간을 포착했습니다. 렘브란트의 빛과 그림자 대비(키아로스쿠로)가 극적으로 펼쳐집니다.',
        thought: '이 그림에서 가장 밝은 것은 무기가 아니라 소녀의 드레스입니다. 렘브란트는 전쟁의 영웅담이 아니라 빛 자체를 그렸는지도 모릅니다.',
        connection: '바로크 회화의 정수. 카라바조에서 시작된 극적 명암 대비가 북유럽에서 렘브란트를 통해 완성됩니다. 이후 고야, 들라크루아에게 영향.',
        curation: '🏛️ 암스테르담 국립미술관(Rijksmuseum) 온라인 컬렉션 / 📖 사이먼 샤마 《렘브란트의 눈》',
      }
    },
  ],

  // 낭만·인상주의관
  romanticism: [],
  impressionism: [
    {
      id: 'htg_004',
      name: '수련',
      artist: '클로드 모네',
      period: '1906',
      origin: '시카고 미술관',
      img: 'htg_004_monet_waterlilies.webp',
      status: 'available',
      owner: null,
      grade: 'diamond',
      source_url: 'https://commons.wikimedia.org/wiki/File:Claude_Monet_-_Water_Lilies_-_1906,_Ryerson.jpg',
      library: {
        knowledge: '모네는 말년 20여 년을 지베르니 정원의 수련 연못 앞에서 보냈습니다. 250여 점에 달하는 수련 시리즈 중 1906년작은 초기 완성도가 가장 높은 버전으로 꼽힙니다.',
        thought: '수평선이 없습니다. 하늘도 없습니다. 오직 수면과 반영만이 있을 뿐. 모네는 세계와 그 반영 사이의 경계가 무의미하다는 것을 발견했는지도 모릅니다.',
        connection: '인상주의는 사진의 발명에 대한 회화의 응답이었습니다. 사진이 현실을 기록한다면, 회화는 순간의 인상을 포착한다. 이 작품은 추상표현주의의 예언이기도 합니다.',
        curation: '🎵 드뷔시 《물의 반영》 / 📖 로스 킹 《빛의 화가 모네》 / 🏛️ 파리 오랑주리 미술관 수련 대형 벽화',
      }
    },
    {
      id: 'htg_005',
      name: '물랭 드 라 갈레트의 무도회',
      artist: '피에르 오귀스트 르누아르',
      period: '1876',
      origin: '오르세 미술관, 파리',
      img: 'htg_005_renoir_moulin.webp',
      status: 'available',
      owner: null,
      grade: 'gold',
      source_url: 'https://commons.wikimedia.org/wiki/File:Pierre-Auguste_Renoir,_Le_Moulin_de_la_Galette.jpg',
      library: {
        knowledge: '몽마르트르 언덕의 야외 댄스홀을 그린 이 작품은 나뭇잎 사이로 스며드는 햇빛과 군중의 활기를 동시에 담아냈습니다. 르누아르의 친구들이 모델로 등장합니다.',
        thought: '이 그림에는 슬픔이 없습니다. 모든 인상주의가 빛을 쫓지만, 르누아르는 행복을 쫓았습니다. 그것이 어떤 비평가들에게는 약점이었지만, 이 그림 앞에 선 사람들은 알 것입니다.',
        connection: '마네의 《풀밭 위의 점심》에서 시작된 야외 인물 회화의 완성. 드가의 발레 시리즈와 함께 근대 도시 여가문화를 기록한 최고의 작품 중 하나.',
        curation: '🎵 에릭 사티 《짐노페디》 / 📖 존 리처드슨 《르누아르》',
      }
    },
  ],
  post_impressionism: [
    {
      id: 'htg_006',
      name: '별이 빛나는 밤',
      artist: '빈센트 반 고흐',
      period: '1889',
      origin: '뉴욕 현대미술관(MoMA)',
      img: 'htg_006_vangogh_starrynight.webp',
      status: 'available',
      owner: null,
      grade: 'diamond',
      source_url: 'https://commons.wikimedia.org/wiki/File:Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
      library: {
        knowledge: '생레미 정신병원에서 그린 작품입니다. 고흐는 창밖으로 보이는 풍경에 상상의 마을을 더했습니다. 소용돌이치는 하늘은 실제이자 내면의 풍경입니다.',
        thought: '미쳐가는 사람이 이 그림을 그렸습니다. 그런데 이 그림은 너무 아름답습니다. 고통과 아름다움이 같은 뿌리를 가지고 있다는 걸 이 그림이 증명합니다.',
        connection: '반 고흐는 살아생전 단 한 점의 그림만 팔았습니다. 지금 이 작품의 가치는 수천억 원. 예술의 가치는 시장이 아닌 시간이 결정한다는 것을.',
        curation: '🎵 돈 맥클린 《Vincent(Starry Starry Night)》 / 📖 반 고흐의 편지들 / 🎬 영화 《러빙 빈센트》(2017)',
      }
    },
  ],

  // 음악당
  baroque_classic: [
    {
      id: 'htg_007',
      name: '골드베르크 변주곡 BWV 988',
      artist: '요한 제바스티안 바흐',
      period: '1741',
      origin: '악보 초판본 · 뉘른베르크',
      img: 'htg_007_bach_goldberg.webp',
      status: 'available',
      owner: null,
      grade: 'gold',
      source_url: 'https://www.youtube.com/watch?v=Ah392lnFHxM',
      library: {
        knowledge: '어느 백작이 불면증을 달래기 위해 바흐에게 의뢰했다는 전설이 있습니다. 아리아와 30개의 변주로 구성되어 있으며, 마지막에 아리아가 다시 돌아옵니다. 끝이 곧 시작입니다.',
        thought: '글렌 굴드가 평생 두 번 녹음했습니다. 1955년의 젊은 굴드와 1981년의 굴드. 같은 악보인데 완전히 다른 음악입니다. 악보는 지도이고, 연주자는 여행자입니다.',
        connection: '이 변주곡은 수학적 구조를 가집니다. 카논, 푸가, 춤곡이 교차하며 나타납니다. 바흐는 음악으로 우주의 질서를 묘사하려 했습니다.',
        curation: '🎵 Glenn Gould 1981년 DG 녹음 / 📖 더글러스 호프스태터 《괴델, 에셔, 바흐》',
      }
    },
    {
      id: 'htg_008',
      name: '월광 소나타 Op.27 No.2',
      artist: '루트비히 판 베토벤',
      period: '1801',
      origin: '악보 초판본 · 빈',
      img: 'htg_008_beethoven_moonlight.webp',
      status: 'available',
      owner: null,
      grade: 'gold',
      source_url: 'https://www.youtube.com/watch?v=4Tr0otuiQuU',
      library: {
        knowledge: '"월광"이라는 이름은 베토벤이 붙인 게 아닙니다. 시인 루트비히 렐슈타프가 "루체른 호수의 달빛"에 비유한 데서 유래했습니다. 베토벤은 이 곡을 황족 여인 줄리에타 귀차르디에게 헌정했습니다.',
        thought: '1악장의 그 세 음표. 반복되는 셋잇단음표. 슬픔인지 체념인지 구별되지 않는 그 감정. 베토벤은 이 무렵 청각을 잃어가고 있었습니다.',
        connection: '고전주의에서 낭만주의로의 전환점. 베토벤 이후 음악은 더 이상 귀족의 오락이 아니라 개인의 감정 표현이 됩니다.',
        curation: '🎵 우치다 미츠코 피아노 연주 / 📖 메이너드 솔로몬 《베토벤》 / 🎬 영화 《카피에드》',
      }
    },
  ],
  romantic_music: [
    {
      id: 'htg_009',
      name: '야상곡 Op.9 No.2',
      artist: '프레데리크 쇼팽',
      period: '1830–1832',
      origin: '악보 초판본 · 파리',
      img: 'htg_009_chopin_nocturne.webp',
      status: 'available',
      owner: null,
      grade: 'gold',
      source_url: 'https://www.youtube.com/watch?v=9E6b3swbnWg',
      library: {
        knowledge: '야상곡(Nocturne)이라는 장르를 피아노 음악으로 완성한 작품입니다. 아일랜드 작곡가 존 필드가 창안한 형식을 쇼팽이 완전히 자신의 것으로 만들었습니다.',
        thought: '이 곡을 들으면 잠들지 않게 됩니다. "야상곡"인데도. 어쩌면 쇼팽은 밤의 고요가 아니라 밤의 각성을 그린 것인지도 모릅니다.',
        connection: '쇼팽은 파리 살롱 문화의 중심에 있었습니다. 조르주 상드와의 사랑, 폴란드 망명자의 슬픔, 결핵의 그림자. 이 짧은 곡 안에 모든 것이 있습니다.',
        curation: '🎵 Maria João Pires 연주 / 📖 다리우스 밀요 《음악의 언어》 / 🎬 영화 《피아니스트》',
      }
    },
  ],
  modern_jazz: [],

  // 나머지 전시실은 기본값 (빈 배열)
  early_modern: [], late_modern: [], contemporary: [],
  ancient_egypt: [], greece_rome: [], medieval: [],
  east_asia: [], islamic: [], india_sea: [],
  arch_ancient: [], arch_modern: [], arch_contemp: [],
};

// ══════════════════════════════════════════════
// 상태 관리
// ══════════════════════════════════════════════
let currentHall = HALLS[0];
let currentRoom = HALLS[0].rooms[0];

// ══════════════════════════════════════════════
// 네비게이션 렌더
// ══════════════════════════════════════════════
