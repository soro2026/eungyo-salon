/* ══════════════════════════════════════════════════════════════════════════
   eg_book_add.js — 책 들이는 손 (공용 부품)
   0819 · 파이스 · 독서비행 기획결정문 v2.0 → 30호(떼어내기) · 21호(검색은 한 문)
   원본 : wunderkammer_shell_v4_4.html 0818g · Floor3 안 4578~4766행

   ⭐ 이 부품은 배관만 한다. 화면은 한 조각도 안 만든다.
      부르는 쪽이 제 화면에 맞게 그린다 —
        Ⅱ층 책의 방  → 모달 격자
        독서비행 좌석 → 기내 모니터

   ⚠ 끝나고 무엇을 할지도 부르는 쪽이 정한다.
      여기서 loadBooks·buildShelfPages·EGStamp 를 부르지 않는다.
      (좌석에는 책장이 없다 — 없는 것을 그리려다 터진다 · v2.0 30호 ㉢)

   ⚠ 물과 전기는 부르는 쪽이 댄다 — init() 로 넷을 받는다.
      제 벌을 만들지 않는다(「한 문서 · 한 클라이언트」 · v173 §4 ㉣).

   ⭐ 0819 · 보관함 — archived_at 이 null 이면 서가에 서고, 값이 있으면 보관함에 있다.
      ⚠ 표를 늘리지 않는다(v2.0 22호). seq 는 안 건드리므로 꺼내면 원래 번호로 돌아온다.
      ⚠ 남에게 안 보이는 것은 화면이 아니라 RLS 가 한다 —
        books_read_public using (archived_at is null or auth.uid() = owner_id)

   ⚠ 도장은 여기서 안 놓는다. 들이는 손과 도장 놓는 손은 다른 손이다.
      Ⅱ층은 모달을 닫을 때 놓고(0812), 좌석은 기록을 저장할 때 놓는다(v2.0 16호).

   창구
     EGBookAdd.init({ url, key, sbFetch, getValidToken })
     EGBookAdd.search(q, ownerId)     → { mine:[], outer:[], outerError }   ⭐ 한 문
     EGBookAdd.add(book, ownerId, onStep) → { row, via, w, h, cover_url, seq }
     EGBookAdd.inscription(title)     → 각인용 짧은 제목
     EGBookAdd.forget(ownerId)        → 들고 있던 목록을 버린다(보관·꺼냄·지움 뒤)
     EGBookAdd.archive(id, on)        → 보관함에 넣기(true) · 서가로 꺼내기(false)
     EGBookAdd.remove(id)             → ⚠ 아주 지운다. 보관함 안에서만 부를 것
     EGBookAdd.listArchived(ownerId)  → 보관함 목록
     EGBookAdd.version
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var VERSION = '0819b';
  var C = null;                       /* { url, key, sbFetch, getValidToken } */

  function init(cfg) {
    if (!cfg || !cfg.url || !cfg.key || !cfg.sbFetch || !cfg.getValidToken)
      throw new Error('[EGBookAdd] init 에 url·key·sbFetch·getValidToken 넷이 다 필요합니다');
    C = cfg;
    return API;
  }
  function need() {
    if (!C) throw new Error('[EGBookAdd] init 을 먼저 부르십시오');
    return C;
  }

  /* ── 각인 다듬기 ──────────────────────────────────────────────
     실측 0812 — 검색 우물이 부제를 괄호로 붙여 준다.
     원본 최대 58자 → 괄호 걷으면 32자 → 24자에서 접으면 스물여섯 중 여섯만 잘린다 */
  function inscription(t) {
    var x = String(t || '').replace(/\s*[\(（][^)）]*[\)）]\s*$/, '').trim();
    if (!x) x = String(t || '').trim();
    return x.length <= 24 ? x : (x.slice(0, 23) + '…');
  }

  /* ── 견주기용 열쇠 ────────────────────────────────────────────
     ⚠ 「월든」과 「월든 (개정판)」이 다른 책으로 갈리면 21호가 헛돈다.
       괄호 토막·띄어쓰기·문장부호를 걷고 견준다 */
  function keyTitle(s) {
    return String(s || '')
      .replace(/[（(\[][^)）\]]*[)）\]]/g, ' ')
      .replace(/[^0-9A-Za-z가-힣]/g, '')
      .toLowerCase();
  }
  /* 검색 우물이 ISBN 을 둘 붙여 준다 — 「8937460440 9788937460449」 */
  function keyIsbn(s) {
    var m = String(s || '').match(/[0-9Xx]{10,13}/g) || [], out = [], i;
    for (i = 0; i < m.length; i++) out.push(m[i].toUpperCase());
    return out;
  }

  /* ── 내 서가 목록 — 한 번 읽고 들고 있는다 ────────────────────
     ⭐ 목록을 손에 들면 부분 일치·띄어쓰기 무시·부제 무시가 전부 이 안에서 된다.
        서버에 ilike 를 보내면 손님이 적은 글자에 괄호나 쉼표가 하나만 섞여도 문법이 깨진다 */
  var IDX = { owner: null, rows: null, at: 0 };
  var IDX_TTL = 5 * 60 * 1000;

  function index(ownerId, force) {
    var c = need();
    if (!ownerId) return Promise.resolve([]);
    if (!force && IDX.owner === ownerId && IDX.rows && (Date.now() - IDX.at) < IDX_TTL)
      return Promise.resolve(IDX.rows);
    return c.sbFetch('/rest/v1/wunderkammer_books?owner_id=eq.' + encodeURIComponent(ownerId)
      + '&select=id,title,author,publisher,isbn,cover_url,seq,archived_at'
      + '&order=seq.desc&limit=1000').then(function (rows) {
        IDX = { owner: ownerId, rows: rows || [], at: Date.now() };
        return IDX.rows;
      });
  }
  /* ⚠ 보관·꺼냄·지움 뒤에는 반드시 부른다. 안 부르면 5분간 옛 상태로 뜬다.
     ⭐ archive·remove 는 스스로 부른다 — 부르는 쪽이 잊어도 어긋나지 않는다 */
  function forget(ownerId) {
    if (!ownerId || IDX.owner === ownerId) IDX = { owner: null, rows: null, at: 0 };
  }

  function hits(row, k) {
    if (!k) return false;
    return keyTitle(row.title).indexOf(k) >= 0 || keyTitle(row.author).indexOf(k) >= 0;
  }

  /* ── 바깥 우물 ────────────────────────────────────────────── */
  function searchOuter(q) {
    var c = need();
    return c.sbFetch('/functions/v1/naver-book-search', {
      method: 'POST', body: JSON.stringify({ q: q, display: 21 })
    }).then(function (data) {
      if (data && data.error) throw new Error(data.error);
      return (data && data.books) || [];
    });
  }

  /* ── ⭐ 21호 · 한 문 — 내 서가와 바깥 우물을 함께 훑는다 ──────
     손님은 「내 책방에 이 책이 있었나」를 기억할 의무가 없다 */
  function search(q, ownerId) {
    q = String(q || '').trim();
    if (!q) return Promise.resolve({ mine: [], kept: [], outer: [], outerError: null });
    var k = keyTitle(q);

    /* ⚠ 둘을 나란히 보낸다. 바깥 우물이 막혀도 내 서가는 나온다 */
    var jobs = [
      index(ownerId).catch(function (e) { console.warn('[EGBookAdd] 내 서가 읽기 실패', e); return []; }),
      searchOuter(q).then(
        function (v) { return { ok: true, v: v }; },
        function (e) { return { ok: false, e: e }; })
    ];

    return Promise.all(jobs).then(function (got) {
      var rows = got[0] || [];
      var outer = got[1].ok ? got[1].v : [];
      var oerr = got[1].ok ? null : got[1].e;

      /* ⭐ 0819 — 내 책은 서가와 보관함 둘로 갈라 낸다.
         ⚠ 중복 판정에는 둘 다 셈한다 — 보관함에 있어도 책방에 있는 것은 맞다.
            그래서 검색창이 보관함에서 책을 꺼내는 가장 자연스러운 문이 된다 */
      var got_mine = rows.filter(function (r) { return hits(r, k); });
      var mine = got_mine.filter(function (r) { return !r.archived_at; }).slice(0, 12);
      var kept = got_mine.filter(function (r) { return !!r.archived_at; }).slice(0, 12);

      /* ⭐ 바깥 결과에 「이미 있음」을 붙인다 — 중복 들이기가 여기서 막힌다 */
      var byT = {}, byI = {};
      rows.forEach(function (r) {
        var t = keyTitle(r.title); if (t) byT[t] = r;
        keyIsbn(r.isbn).forEach(function (x) { byI[x] = r; });
      });
      outer.forEach(function (b) {
        var hit = null, ks = keyIsbn(b.isbn), i;
        for (i = 0; i < ks.length && !hit; i++) hit = byI[ks[i]] || null;
        if (!hit) hit = byT[keyTitle(b.title)] || null;
        b.owned = !!hit;
        b.owned_id = hit ? hit.id : null;
        b.owned_kept = !!(hit && hit.archived_at);   /* 보관함에 있는 것도 「이미 있음」이다 */
      });

      /* 내 서가도 비고 바깥도 막혔으면 그건 그냥 막힌 것이다 */
      if (oerr && !mine.length && !kept.length) throw oerr;
      return { mine: mine, kept: kept, outer: outer,
               outerError: oerr ? String(oerr.message || oerr) : null };
    });
  }

  /* ── 표지 복사 : 1차 직접 fetch → 막히면 Edge Function 프록시 ──
     ⚠ blob 이라 sbFetch 를 못 쓴다 — 날 fetch + 토큰 */
  function fetchCoverBlob(coverUrl) {
    var c = need();
    return fetch(coverUrl, { mode: 'cors' }).then(function (r) {
      if (!r.ok) return null;
      return r.blob().then(function (b) { return (b && b.size > 0) ? { blob: b, via: '직접' } : null; });
    }).catch(function () { return null; })
      .then(function (got) {
        if (got) return got;
        return c.getValidToken().then(function (token) {
          if (!token) throw new Error('로그인 세션 없음');
          return fetch(c.url + '/functions/v1/naver-book-search', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'apikey': c.key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ img: coverUrl })
          });
        }).then(function (r2) {
          if (!r2.ok) throw new Error('표지 프록시 실패 ' + r2.status);
          return r2.blob();
        }).then(function (b2) {
          if (!b2 || b2.size === 0) throw new Error('표지 빈 응답');
          return { blob: b2, via: '프록시' };
        });
      });
  }

  function imgSize(blob) {
    return new Promise(function (res) {
      var u = URL.createObjectURL(blob), im = new Image();
      im.onload = function () { res({ w: im.naturalWidth, h: im.naturalHeight }); URL.revokeObjectURL(u); };
      im.onerror = function () { res({ w: null, h: null }); URL.revokeObjectURL(u); };
      im.src = u;
    });
  }

  /* ── 들이기 ───────────────────────────────────────────────────
     ⚠ 화면을 한 조각도 안 만진다. onStep 으로 어디까지 왔는지만 알린다
       ('cover' → 'seq' → 'insert')
     ⭐ v2.0 22호 — 넣는 곳은 언제나 wunderkammer_books 하나다.
        비행기용 책 표를 따로 두지 않는다 */
  function add(book, ownerId, onStep) {
    var c = need();
    var step = (typeof onStep === 'function') ? onStep : function () { };
    if (!book) return Promise.reject(new Error('고른 책이 없습니다'));
    if (!ownerId) return Promise.reject(new Error('로그인이 필요합니다'));

    var via = '—', w = null, h = null, cover_url = null, seq = 1;

    return Promise.resolve().then(function () {
      if (!book.cover_url) return null;
      step('cover');
      return fetchCoverBlob(book.cover_url).then(function (got) {
        via = got.via;
        return imgSize(got.blob).then(function (sz) {
          w = sz.w; h = sz.h;
          var ext = ((got.blob.type.split('/')[1]) || 'jpg').replace('jpeg', 'jpg');
          var path = ownerId + '/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext;
          return c.getValidToken().then(function (token) {
            return fetch(c.url + '/storage/v1/object/book-covers/' + path, {
              method: 'POST',
              headers: { 'Authorization': 'Bearer ' + token, 'apikey': c.key, 'Content-Type': got.blob.type },
              body: got.blob
            });
          }).then(function (up) {
            if (!up.ok) throw new Error('Storage 업로드 실패 ' + up.status);
            cover_url = c.url + '/storage/v1/object/public/book-covers/' + path;
          });
        });
      });
    }).then(function () {
      /* ⚠ 번호는 DB가 매긴다(wk_book_next_seq). 화면이 읽고·더하고·넣으면
           창을 둘 띄웠을 때 같은 칸에 두 권이 선다 */
      step('seq');
      return c.sbFetch('/rest/v1/rpc/wk_book_next_seq', {
        method: 'POST', body: JSON.stringify({ p_owner: ownerId })
      }).then(function (n) {
        if (n != null && !isNaN(Number(n))) seq = Number(n);
      }).catch(function (e) { console.warn('[EGBookAdd] 다음 번호 조회 실패', e); });
    }).then(function () {
      step('insert');
      return c.sbFetch('/rest/v1/wunderkammer_books', {
        method: 'POST', headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({
          owner_id: ownerId, source: 'search',
          title: book.title, author: book.author,
          publisher: book.publisher, isbn: book.isbn,
          cover_url: cover_url, cover_w: w, cover_h: h, seq: seq
        })
      });
    }).then(function (ins) {
      var row = Array.isArray(ins) ? ins[0] : ins;
      /* 들고 있던 목록에 바로 얹는다 — 다시 읽으러 안 나간다.
         ⭐ 방금 들인 책이 다음 검색에서 곧바로 「이미 있음」으로 뜬다 */
      if (row && IDX.owner === ownerId && IDX.rows) IDX.rows.unshift(row);
      return { row: row, via: via, w: w, h: h, cover_url: cover_url, seq: seq };
    });
  }

  /* ── ⭐ 0819 · 보관함 ────────────────────────────────────────
     on=true  보관함에 넣는다 (서가에서 내려온다)
     on=false 서가로 꺼낸다   (원래 번호로 돌아온다 — seq 를 안 건드렸으므로)
     ⚠ 지우지 않는다. 글도 그대로 남는다 */
  function archive(id, on) {
    var c = need();
    if (!id) return Promise.reject(new Error('어느 책인지 모르겠습니다'));
    return c.sbFetch('/rest/v1/wunderkammer_books?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH', headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({ archived_at: on ? new Date().toISOString() : null })
    }).then(function (out) {
      var row = Array.isArray(out) ? out[0] : out;
      forget(IDX.owner);
      return row;
    });
  }

  /* ⚠⚠ 아주 지운다. 글(에세이·기록)도 함께 사라지고 되돌릴 수 없다.
     ⭐ 보관함 안에서만 부를 것 — 서가에서 곧장 이 손을 부르지 않는다(0819 소로 결정) */
  function remove(id) {
    var c = need();
    if (!id) return Promise.reject(new Error('어느 책인지 모르겠습니다'));
    return c.sbFetch('/rest/v1/wunderkammer_books?id=eq.' + encodeURIComponent(id), {
      method: 'DELETE', headers: { 'Prefer': 'return=minimal' }
    }).then(function () { forget(IDX.owner); return true; });
  }

  /* 보관함 목록 — 넣은 지 오래된 것이 아래로 */
  function listArchived(ownerId) {
    var c = need();
    if (!ownerId) return Promise.resolve([]);
    return c.sbFetch('/rest/v1/wunderkammer_books?owner_id=eq.' + encodeURIComponent(ownerId)
      + '&archived_at=not.is.null'
      + '&select=id,title,author,publisher,cover_url,seq,archived_at,essay_body'
      + '&order=archived_at.desc&limit=300').then(function (rows) { return rows || []; });
  }

  var API = {
    init: init, search: search, searchOuter: searchOuter,
    add: add, inscription: inscription, forget: forget,
    archive: archive, remove: remove, listArchived: listArchived,
    fetchCoverBlob: fetchCoverBlob, imgSize: imgSize,
    version: VERSION
  };
  window.EGBookAdd = API;
  console.log('%c[EG] eg_book_add ' + VERSION + ' — 책 들이는 손 · 한 문 검색 · 보관함', 'color:#c9a84c');
})();
