// ===================================================================
// external_links.js
// 큐레이션 외부 링크 자동 생성 — 영구 식별자 → 동적 URL
// ===================================================================
//
// 정신: 30년 가는 시스템에서 *직접 링크* 박는 자세는 위험.
//      서점 URL 패턴은 변하고, 유튜브 영상은 사라진다.
//      그러므로 questions JSON에는 영원히 안 변하는 식별자만 박고,
//      URL은 이 파일에서 동적 생성.
//
//      서점·플랫폼이 URL 패턴 바꾸면 이 파일 한 줄만 갱신.
//      모든 1,000+ 문제에 자동 반영.
//
// 출생: 2026.05.05 (화) 오전
//      카리·파이스 5/4 야근 합의 흡수 + 0층 기획서 정신 정합
// ===================================================================


// -------------------------------------------------------------------
// 1부. URL 패턴 정의 (변경 시 이 부분만 갱신)
// -------------------------------------------------------------------

const BOOKSTORE_PATTERNS = {
  kyobo:  'https://search.kyobobook.co.kr/search?keyword=${isbn}',
  aladin: 'https://www.aladin.co.kr/search/wsearchresult.aspx?KeyWord=${isbn}',
  yes24:  'https://www.yes24.com/Product/Search?domain=BOOK&query=${isbn}',
};

const YOUTUBE_SEARCH_PATTERN =
  'https://www.youtube.com/results?search_query=${keyword}';

const LIBRARY_SEARCH_PATTERN_NL_KOREA =
  'https://www.nl.go.kr/NL/search/search.do?kwd=${call_number}';
// 국립중앙도서관 검색 (청구기호로 검색)


// -------------------------------------------------------------------
// 2부. URL 생성 함수
// -------------------------------------------------------------------

/**
 * ISBN을 받아 한국 주요 서점 3곳의 검색 URL 객체 반환.
 * @param {string} isbn - ISBN-13 (13자리)
 * @returns {{kyobo: string, aladin: string, yes24: string}}
 */
function buildBookstoreUrls(isbn) {
  if (!isbn) return null;
  const cleanIsbn = String(isbn).replace(/[-\s]/g, '');
  return {
    kyobo:  BOOKSTORE_PATTERNS.kyobo.replace('${isbn}', cleanIsbn),
    aladin: BOOKSTORE_PATTERNS.aladin.replace('${isbn}', cleanIsbn),
    yes24:  BOOKSTORE_PATTERNS.yes24.replace('${isbn}', cleanIsbn),
  };
}

/**
 * 검색 키워드를 받아 유튜브 검색 URL 반환.
 * @param {string} keyword
 * @returns {string}
 */
function buildYoutubeUrl(keyword) {
  if (!keyword) return null;
  const encoded = encodeURIComponent(keyword);
  return YOUTUBE_SEARCH_PATTERN.replace('${keyword}', encoded);
}

/**
 * 청구기호를 받아 국립중앙도서관 검색 URL 반환.
 * @param {string} callNumber
 * @returns {string}
 */
function buildLibraryUrl(callNumber) {
  if (!callNumber) return null;
  const encoded = encodeURIComponent(callNumber);
  return LIBRARY_SEARCH_PATTERN_NL_KOREA.replace('${call_number}', encoded);
}


// -------------------------------------------------------------------
// 3부. 화면 렌더링 (큐레이션 카드 하단 영역)
// -------------------------------------------------------------------

/**
 * curation_links 객체를 받아 HTML 문자열 반환.
 * 게임 화면 또는 별 카드 모달에서 호출.
 *
 * @param {object} curationLinks - questions JSON의 curation_links 필드
 * @returns {string} 렌더링된 HTML
 *
 * 예상 입력:
 * {
 *   "books": [{ "title": "...", "publisher": "...", "translator": "...", "isbn": "..." }],
 *   "library_call_number": "891.7 톨",
 *   "youtube_keywords": ["키워드1", "키워드2"]
 * }
 */
function renderCurationLinks(curationLinks) {
  if (!curationLinks) return '';

  const parts = [];

  // 책 — 한국 주요 서점 검색 URL 자동 생성
  const books = curationLinks.books || [];
  for (const book of books) {
    if (!book.isbn) continue;
    const urls = buildBookstoreUrls(book.isbn);
    const meta = [book.publisher, book.translator ? `${book.translator} 옮김` : null]
      .filter(Boolean)
      .join(', ');

    parts.push(`
      <div class="curation-book">
        <div class="curation-book-title">📚 ${escapeHtml(book.title)}</div>
        ${meta ? `<div class="curation-book-meta">${escapeHtml(meta)}</div>` : ''}
        <div class="curation-book-links">
          <a href="${urls.kyobo}" target="_blank" rel="noopener noreferrer">교보문고</a>
          <a href="${urls.aladin}" target="_blank" rel="noopener noreferrer">알라딘</a>
          <a href="${urls.yes24}" target="_blank" rel="noopener noreferrer">예스24</a>
        </div>
      </div>
    `);
  }

  // 도서관 청구기호
  if (curationLinks.library_call_number) {
    const callNum = curationLinks.library_call_number;
    const url = buildLibraryUrl(callNum);
    parts.push(`
      <div class="curation-library">
        📖 도서관 청구기호:
        <a href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(callNum)}</a>
      </div>
    `);
  }

  // 유튜브 — 검색 URL 자동 생성
  const keywords = curationLinks.youtube_keywords || [];
  for (const keyword of keywords) {
    const url = buildYoutubeUrl(keyword);
    parts.push(`
      <div class="curation-youtube">
        <a href="${url}" target="_blank" rel="noopener noreferrer">🎬 ${escapeHtml(keyword)}</a>
      </div>
    `);
  }

  return parts.join('');
}


// -------------------------------------------------------------------
// 4부. 헬퍼
// -------------------------------------------------------------------

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


// -------------------------------------------------------------------
// 5부. export (브라우저·서비스워커 양쪽 호환)
// -------------------------------------------------------------------

if (typeof window !== 'undefined') {
  window.ExternalLinks = {
    buildBookstoreUrls,
    buildYoutubeUrl,
    buildLibraryUrl,
    renderCurationLinks,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildBookstoreUrls,
    buildYoutubeUrl,
    buildLibraryUrl,
    renderCurationLinks,
    BOOKSTORE_PATTERNS,
    YOUTUBE_SEARCH_PATTERN,
    LIBRARY_SEARCH_PATTERN_NL_KOREA,
  };
}
