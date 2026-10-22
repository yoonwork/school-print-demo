/* =====================================================================
   pick.js — 선생님 화면: 샘플 고르기 → 담기 → 쪽 순서 → 미리보기
   ---------------------------------------------------------------------
   - 고른 내용과 표시는 브라우저에 자동 저장돼요(localStorage).
   - 첨부 파일은 브라우저에 저장할 수 없어서, 다시 열면 이름만 남기고
     '다시 올려 주세요'라고 알려줘요.
   ===================================================================== */
(function () {
  'use strict';
  var U = window.UI, D = window.DATA, ic = U.ic, esc = U.esc;
  var DRAFT_KEY = 'barunjjok_draft_v1';
  var ACCEPT = '.hwp,.hwpx,.pdf,.jpg,.jpeg,.png';

  // 화면 상태 하나로 모아 둬요. (고칠 때 여기부터 보면 돼요)
  var S = { book: 'read', part: 'cover', cat: '전체', sort: 'pop', pages: [], marks: {}, savedAt: null, resumed: null };
  var files = {}; // 쪽별 '내 원고로 교체' 파일(File 객체, 메모리에만)
  var seq = 0;
  function uid() { seq += 1; return 'p' + Date.now().toString(36) + seq; }
  var root;

  // ---------------- 자동 저장 ----------------
  function saveDraft() {
    S.savedAt = new Date();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        v: 1, book: S.book, savedAt: S.savedAt.toISOString(), marks: S.marks,
        pages: S.pages.map(function (p) { return { uid: p.uid, sid: p.sid, rep: p.rep ? { name: p.rep.name, size: p.rep.size } : null }; })
      }));
    } catch (e) { /* 저장 공간이 없으면 조용히 넘어가요 */ }
  }
  function loadDraft() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(DRAFT_KEY)); } catch (e) { d = null; }
    if (!d || !d.pages || !d.pages.length) return;
    S.book = d.book || 'read';
    S.marks = d.marks || {};
    S.savedAt = new Date(d.savedAt);
    var missing = 0;
    S.pages = d.pages.map(function (p) {
      if (p.rep) missing += 1;
      return { uid: p.uid, sid: p.sid, rep: p.rep ? { name: p.rep.name, size: p.rep.size, missing: true } : null };
    });
    S.resumed = { at: S.savedAt, missing: missing };
  }
  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* 무시 */ }
    S.pages = []; S.marks = {}; S.savedAt = null; S.resumed = null; files = {};
  }

  // ---------------- 데이터 도우미 ----------------
  function book() { return D.BOOKS.filter(function (b) { return b.key === S.book; })[0]; }
  function part() { return book().parts.filter(function (p) { return p.key === S.part; })[0]; }
  function samplesOf(partKey) { return D.SAMPLES.filter(function (x) { return x.book === S.book && x.part === partKey; }); }
  function visible() {
    var list = samplesOf(S.part).filter(function (x) { return S.cat === '전체' || x.cat === S.cat; });
    // 인기순: 인기 등급(2→0) → 조회수 → 최신순  (공고 요구 그대로)
    return list.sort(function (a, b) {
      if (S.sort === 'new') return b.date < a.date ? -1 : 1;
      return (b.grade - a.grade) || (b.hits - a.hits) || (b.date < a.date ? -1 : 1);
    });
  }
  function countIn(sid) { return S.pages.filter(function (p) { return p.sid === sid; }).length; }
  function markCount() { var n = 0; S.pages.forEach(function (p) { n += (S.marks[p.uid] || []).length; }); return n; }
  function repCount() { return S.pages.filter(function (p) { return p.rep; }).length; }
  function missingCount() { return S.pages.filter(function (p) { return p.rep && p.rep.missing; }).length; }
  function paper(sid) { return '<div class="paper">' + window.Art.svg(U.sample(sid)) + '</div>'; }
  // 담은 쪽을 겹쳐 쌓은 작은 책 묶음 (마지막에 담은 쪽이 맨 위)
  function stack(cls, max) {
    var last = S.pages.slice(-max);
    return '<div class="' + cls + '" aria-hidden="true">' + (last.length ? last.map(function (p) { return paper(p.sid); }).join('') : '<div class="paper ghost-paper"></div>') + '</div>';
  }

  // ---------------- 그리기 ----------------
  function mount() {
    root = U.$('#view-pick');
    root.innerHTML =
      '<div class="tapp">' +
      '<header class="apphead"><a class="logo" href="#pick" aria-label="바른쪽 처음으로"><span class="mark" aria-hidden="true"></span>바른쪽</a>' +
      '<span class="apphead-sub">학교 인쇄물 구성표</span>' +
      '<button class="ib ml-auto" data-help aria-label="만드는 방법 보기">' + ic('help') + '</button></header>' +
      '<div class="pick">' +
      '<div class="pick-main">' +
      '<section class="hello"><div id="stepbar"></div><p>선생님, 반가워요</p><h1>표지부터 한 쪽씩 골라 담아 주세요</h1>' +
      '<div class="booktype" role="radiogroup" aria-label="만들 책" id="booktype"></div></section>' +
      '<div id="resume"></div>' +
      // 부품 탭과 분류 칩은 아래로 내려도 위에 붙어 따라와요
      '<div class="pfilt-sen" id="pfiltSen" aria-hidden="true"></div>' +
      '<div class="pfilt" id="pfilt">' +
      '<div class="partbar"><div class="seg seg-lg" role="tablist" aria-label="부품" id="parts"></div></div>' +
      '<div class="frow"><div class="chips-x" id="cats" role="group" aria-label="분류"></div>' +
      '<label class="sortsel"><span class="sr">정렬</span><select id="sort"><option value="pop">인기순</option><option value="new">최신순</option></select></label></div>' +
      '</div>' +
      '<div class="sgrid" id="grid" aria-live="polite"></div>' +
      '</div>' +
      '<div class="scrim" id="scrim" hidden></div>' +
      '<aside class="book" id="book" aria-label="내 구성표"></aside>' +
      '</div></div>' +
      '<div class="mbar" id="mbar"></div>';
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    root.addEventListener('pointerdown', onGrip);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        U.$('#pfilt').classList.toggle('stuck', !en[0].isIntersecting && en[0].boundingClientRect.top < 0);
      }).observe(U.$('#pfiltSen'));
    }
  }
  // 위에 붙은 탭으로 분류를 바꾸면, 새 목록의 처음부터 보이게 올려 줘요
  function toGridTop() {
    var f = U.$('#pfilt');
    if (!f.classList.contains('stuck')) return;
    window.scrollTo(0, U.$('#pfiltSen').getBoundingClientRect().top + window.pageYOffset);
  }

  function render() {
    renderBookType(); renderResume(); renderParts(); renderCats(); renderGrid(); renderBook(); renderMbar();
    U.$('#sort').value = S.sort;
  }
  function renderBookType() {
    // 만들 책: 실제 표지 그림과 샘플 수를 같이 보여 줘요
    var coverOf = { read: 'R-C01', plan: 'P-C01' };
    U.$('#booktype').innerHTML = '<span class="bt-l">만들 책</span>' + D.BOOKS.map(function (b) {
      var n = D.SAMPLES.filter(function (x) { return x.book === b.key; }).length;
      return '<button type="button" class="btc" role="radio" aria-checked="' + (b.key === S.book) + '" data-book="' + b.key + '">' +
        '<span class="btc-th" aria-hidden="true">' + paper(coverOf[b.key]) + (b.key === S.book ? '<i>' + ic('check', 'ic-xs') + '</i>' : '') + '</span>' +
        '<span class="btc-t"><b>' + b.name + '</b><small class="num">샘플 ' + n + '개</small></span></button>';
    }).join('');
  }
  function renderResume() {
    var el = U.$('#resume');
    if (!S.resumed) { el.innerHTML = ''; return; }
    var r = S.resumed;
    el.innerHTML = '<div class="resume" role="status">' +
      '<div class="rs-ic">' + ic('refresh') + '</div>' +
      '<div class="rs-t"><b>지난번 구성표를 이어서 쓰고 있어요</b>' +
      '<span>' + (r.at.getMonth() + 1) + '월 ' + r.at.getDate() + '일 ' + U.hm(r.at) + '에 자동 저장한 ' + S.pages.length + '쪽을 불러왔어요.' +
      (missingCount() ? ' 교체 원고 ' + missingCount() + '개는 다시 올려 주세요.' : '') + '</span></div>' +
      '<div class="rs-a"><button class="btn btn-sm btn-ghost" data-reset>새로 시작</button><button class="btn btn-sm btn-white" data-resume-x>계속 쓰기</button></div></div>';
  }
  function renderParts() {
    U.$('#parts').innerHTML = book().parts.map(function (p) {
      return '<button type="button" role="tab" aria-selected="' + (p.key === S.part) + '" aria-pressed="' + (p.key === S.part) + '" data-part="' + p.key + '">' +
        p.name + '<span class="n num">' + samplesOf(p.key).length + '</span></button>';
    }).join('');
  }
  function renderCats() {
    var all = samplesOf(S.part);
    var html = '<button type="button" class="fchip" aria-pressed="' + (S.cat === '전체') + '" data-cat="전체">전체 <span class="n">' + all.length + '</span></button>';
    part().cats.forEach(function (c) {
      var n = all.filter(function (x) { return x.cat === c; }).length;
      html += '<button type="button" class="fchip" aria-pressed="' + (S.cat === c) + '" data-cat="' + esc(c) + '">' + esc(c) + ' <span class="n">' + n + '</span></button>';
    });
    U.$('#cats').innerHTML = html;
  }
  function renderGrid() {
    var list = visible();
    U.$('#grid').setAttribute('data-part', S.part);
    if (!list.length) {
      U.$('#grid').innerHTML = '<div class="empty span-all"><div class="em-ic">' + ic('search') + '</div><h4>이 분류에는 아직 샘플이 없어요</h4><p>다른 분류를 골라 보세요.</p><div class="row"><button class="btn btn-secondary btn-sm" data-cat="전체">전체 보기</button></div></div>';
      return;
    }
    U.$('#grid').innerHTML = list.map(function (x) {
      var n = countIn(x.id);
      return '<article class="scard">' +
        '<button type="button" class="sthumb" data-zoom="' + x.id + '" aria-label="' + esc(x.title) + ' 크게 보기">' + paper(x.id) +
        (n ? '<span class="got num">' + ic('check', 'ic-xs') + n + '쪽 담음</span>' : '') + '</button>' +
        '<div class="sinfo"><b>' + esc(x.title) + '</b><span class="num">' + (x.grade === 2 ? '<em class="hot">인기</em>' : '') + x.id + ' · 조회 ' + U.num(x.hits) + '</span></div>' +
        '<button type="button" class="btn btn-sm sadd ' + (n ? 'btn-soft' : 'btn-secondary') + '" data-add="' + x.id + '">' + ic('plus') + (n ? '한 번 더 담기' : '담기') + '</button>' +
        '</article>';
    }).join('');
  }
  function renderBook() {
    var el = U.$('#book');
    var rows = S.pages.map(function (p, i) {
      var smp = U.sample(p.sid), mc = (S.marks[p.uid] || []).length, rep = '';
      if (p.rep && p.rep.missing) {
        rep = '<label class="repchip warn" title="' + esc(p.rep.name) + ' 다시 올리기">' + ic('alert', 'ic-s') + '<span>원고 다시 올리기</span>' +
          '<input type="file" class="sr" accept="' + ACCEPT + '" data-rep="' + p.uid + '"></label>';
      } else if (p.rep) {
        rep = '<span class="repchip">' + ic('clip', 'ic-s') + '<span>' + esc(p.rep.name) + '</span><button type="button" data-unrep="' + p.uid + '" aria-label="교체 파일 빼기">' + ic('x', 'ic-xs') + '</button></span>';
      } else {
        rep = '<label class="repbtn">' + ic('clip', 'ic-s') + '<span>내 원고로 교체</span><input type="file" class="sr" accept="' + ACCEPT + '" data-rep="' + p.uid + '"></label>';
      }
      return '<li class="prow" data-uid="' + p.uid + '">' +
        '<button type="button" class="grip" aria-label="끌어서 순서 바꾸기" title="끌어서 순서 바꾸기">' + ic('grip') + '</button>' +
        '<span class="pno num" aria-hidden="true">' + (i + 1) + '</span>' +
        '<button type="button" class="pth" data-open-at="' + i + '" aria-label="' + (i + 1) + '쪽 미리보기">' + paper(p.sid) + '</button>' +
        '<div class="pm"><b>' + esc(smp.title) + '</b><span>' + U.partName(smp.part) + ' · ' + smp.id + (mc ? ' · 표시 ' + mc : '') + '</span></div>' +
        '<button type="button" class="ib ib-s pdel" data-del="' + p.uid + '" aria-label="' + (i + 1) + '쪽 빼기">' + ic('x', 'ic-s') + '</button>' +
        '<div class="pact">' + rep + '<span class="mvg"><button type="button" class="mv" data-up="' + i + '" aria-label="' + (i + 1) + '쪽 위로" ' + (i === 0 ? 'disabled' : '') + '>' + ic('up', 'ic-s') + '</button>' +
        '<button type="button" class="mv" data-down="' + i + '" aria-label="' + (i + 1) + '쪽 아래로" ' + (i === S.pages.length - 1 ? 'disabled' : '') + '>' + ic('down', 'ic-s') + '</button></span></div>' +
        '</li>';
    }).join('');
    el.innerHTML =
      '<div class="sheet-grab" aria-hidden="true"></div>' +
      '<div class="book-sum">' +
      '<div class="bs-top"><span>내 구성표 · ' + book().name + '</span><button type="button" class="ib ib-s sheet-x" data-sheet-x aria-label="구성표 닫기">' + ic('x', 'ic-s') + '</button></div>' +
      '<div class="bs-row"><div class="bs-n"><b class="num">' + S.pages.length + '</b><small>쪽</small></div>' + stack('bs-stack', 4) + '</div>' +
      '<div class="bs-meta"><span>교체 원고 ' + repCount() + '</span><span>표시 ' + markCount() + '</span><span>' + (S.savedAt ? '자동 저장 ' + U.hm(S.savedAt) : '고르면 자동 저장돼요') + '</span></div>' +
      '</div>' +
      '<div class="book-list">' + (S.pages.length ?
        '<p class="bl-help">' + ic('grip', 'ic-s') + '손잡이를 끌거나 화살표로 순서를 바꿔요</p><ol class="plist" id="plist">' + rows + '</ol>' :
        '<div class="empty"><div class="em-ic">' + ic('book') + '</div><h4>아직 담은 쪽이 없어요</h4><p>샘플의 \'담기\'를 누르면 여기에 순서대로 쌓여요.</p>' +
        '<div class="row"><button type="button" class="btn btn-secondary btn-sm" data-example>예시 구성표로 채워 보기</button></div></div>') +
      '</div>' +
      '<div class="book-act"><button type="button" class="btn btn-secondary btn-lg" data-preview ' + (S.pages.length ? '' : 'disabled') + '>' + ic('book') + '미리보기</button>' +
      '<button type="button" class="btn btn-primary btn-lg" data-go-send ' + (S.pages.length ? '' : 'disabled') + '>' + ic('send') + '보내기</button></div>';
  }
  function renderMbar() {
    U.$('#stepbar').innerHTML = U.stepbar(S.pages.length ? 2 : 1);
    var el = U.$('#mbar'), n = S.pages.length;
    el.classList.toggle('is-empty', !n);
    el.innerHTML = (n ?
      stack('mb-stack', 3) + '<div class="mb-t"><b class="num">' + n + '쪽 담음</b><span>' + (S.savedAt ? '자동 저장 ' + U.hm(S.savedAt) : '고르면 자동 저장돼요') + '</span></div>' :
      '<div class="mb-t"><b>아직 담은 쪽이 없어요</b><button type="button" class="link-btn" data-example>예시로 채워 보기</button></div>') +
      '<button type="button" class="btn btn-primary btn-lg" data-sheet>구성표 보기</button>';
  }
  function changed(msg) { saveDraft(); renderGrid(); renderBook(); renderMbar(); if (msg) U.toast(msg); }

  // ---------------- 동작 ----------------
  // src: 날아갈 그림(샘플 카드의 종이). flyer: 이미 띄워 둔 그림(크게 보기에서 담을 때).
  // 움직임 줄이기 설정이면 움직임 없이 숫자만 바꿔요.
  function add(sid, src, flyer) {
    flyer = flyer || U.flyFrom(src);
    S.pages.push({ uid: uid(), sid: sid, rep: null });
    var smp = U.sample(sid);
    changed(S.pages.length + '쪽에 ' + U.josa('\'' + smp.title + '\'', '을', '를') + ' 담았어요');
    var card = U.$('#grid [data-add="' + sid + '"]');
    if (card) { var got = card.closest('.scard').querySelector('.got'); if (got) got.classList.add('pop'); }
    var wide = window.matchMedia('(min-width:1024px)').matches;
    var stk = U.$(wide ? '#book .bs-stack' : '#mbar .mb-stack'), cnt = U.$(wide ? '#book .bs-n b' : '#mbar .mb-t b');
    var top = stk && stk.lastElementChild;
    if (!flyer || !top) { U.bump(cnt); return; }
    top.classList.add('pending');
    U.flyTo(flyer, top, function () { top.classList.remove('pending'); top.classList.add('land'); U.bump(cnt); });
  }
  function move(from, to) {
    if (to < 0 || to >= S.pages.length) return;
    var p = S.pages.splice(from, 1)[0];
    S.pages.splice(to, 0, p);
    changed();
    var btn = U.$('[data-' + (to > from ? 'down' : 'up') + '="' + to + '"]');
    if (btn && !btn.disabled) btn.focus(); else { var row = U.$('[data-uid="' + p.uid + '"] .grip'); if (row) row.focus(); }
  }
  function zoom(sid) {
    var x = U.sample(sid), n = countIn(sid);
    var m = U.modal('<div class="zbox"><div class="zpaper" data-part="' + x.part + '">' + paper(sid) + '</div><div class="zinfo">' +
      '<p class="z-k">' + U.partName(x.part) + ' · ' + esc(x.cat) + '</p><h3>' + esc(x.title) + '</h3>' +
      '<dl class="zdl"><div><dt>샘플 번호</dt><dd class="num">' + x.id + '</dd></div><div><dt>조회</dt><dd class="num">' + U.num(x.hits) + '</dd></div>' +
      '<div><dt>올린 날</dt><dd class="num">' + x.date.replace(/-/g, '.') + '</dd></div><div><dt>게시판 글</dt><dd class="num">' + x.board + ' #' + x.wr + '</dd></div></dl>' +
      (n ? '<p class="z-got">' + ic('check', 'ic-s') + '이미 ' + n + '쪽 담았어요</p>' : '') +
      '<div class="z-a"><button class="btn btn-secondary btn-lg" data-x>닫기</button><button class="btn btn-primary btn-lg" data-ok data-autofocus>' + ic('plus') + '이 쪽 담기</button></div></div></div>',
      { cls: 'zoom', label: x.title + ' 크게 보기' });
    m.querySelector('[data-x]').onclick = U.closeModal;
    m.querySelector('[data-ok]').onclick = function () {
      // 대화상자가 닫혀도 종이 그림은 화면 위에 남아 구성표로 날아가요
      var flyer = U.flyFrom(m.querySelector('.zpaper .paper'));
      U.closeModal();
      add(sid, null, flyer);
    };
  }
  function openSheet(on) {
    var b = U.$('#book'), sc = U.$('#scrim');
    b.classList.toggle('open', on);
    sc.hidden = !on;
    document.body.classList.toggle('noscroll', on);
  }
  function preview(at) {
    U.openViewer({
      title: '미리보기', note: '펜·글상자로 고칠 곳을 표시하면 함께 보내져요', editable: true, start: at || 0,
      pages: S.pages,
      marksOf: function (i) { return S.marks[S.pages[i].uid] || []; },
      onAdd: function (i, m) { var k = S.pages[i].uid; (S.marks[k] = S.marks[k] || []).push(m); saveDraft(); renderBook(); },
      onUndo: function (i) { var k = S.pages[i].uid; (S.marks[k] || []).pop(); saveDraft(); renderBook(); }
    });
  }
  function help() {
    var m = U.modal('<div class="cbox"><h3>이렇게 만들어요</h3><ol class="steps">' +
      '<li><b>담기</b><span>표지·간지·도서목록·내지에서 샘플을 골라 담아요. 같은 쪽을 여러 번 담아도 돼요.</span></li>' +
      '<li><b>순서와 교체</b><span>손잡이를 끌거나 화살표로 순서를 바꾸고, 바꿀 쪽에는 내 원고(한글·PDF·그림)를 붙여요.</span></li>' +
      '<li><b>미리보기와 보내기</b><span>책처럼 넘겨 보며 펜·글상자로 표시하고, 연락처와 함께 보내요.</span></li></ol>' +
      '<div class="cbox-a"><button class="btn btn-primary" data-x data-autofocus>알겠어요</button></div></div>', { cls: 'small', label: '만드는 방법' });
    m.querySelector('[data-x]').onclick = U.closeModal;
  }

  function onClick(e) {
    var t = e.target.closest('button, [data-sheet-x]');
    if (!t) { if (e.target.id === 'scrim') openSheet(false); return; }
    var d = t.dataset;
    if (d.add) add(d.add, t.closest('.scard').querySelector('.sthumb .paper'));
    else if (d.example !== undefined) {
      // 예시는 '어제 쓰다 둔 구성표'를 다시 연 모습이라 이어서 쓰기 안내도 함께 보여요
      loadExample(); openSheet(false); window.scrollTo(0, 0);
      U.toast('예시 구성표 ' + S.pages.length + '쪽을 불러왔어요');
    }
    else if (d.zoom) zoom(d.zoom);
    else if (d.book) { if (S.book !== d.book) { S.book = d.book; S.part = 'cover'; S.cat = '전체'; saveDraft(); render(); } }
    else if (d.part) { S.part = d.part; S.cat = '전체'; renderParts(); renderCats(); renderGrid(); toGridTop(); }
    else if (d.cat) { S.cat = d.cat; renderCats(); renderGrid(); toGridTop(); }
    else if (d.del) {
      var i = S.pages.findIndex(function (p) { return p.uid === d.del; });
      var removed = S.pages.splice(i, 1)[0];
      delete S.marks[removed.uid]; delete files[removed.uid];
      changed((i + 1) + '쪽을 뺐어요');
    }
    else if (d.up !== undefined) move(Number(d.up), Number(d.up) - 1);
    else if (d.down !== undefined) move(Number(d.down), Number(d.down) + 1);
    else if (d.unrep) {
      var p = S.pages.filter(function (x) { return x.uid === d.unrep; })[0];
      p.rep = null; delete files[p.uid]; changed('교체 파일을 뺐어요');
    }
    else if (d.openAt !== undefined) preview(Number(d.openAt));
    else if (d.preview !== undefined) preview(0);
    else if (d.goSend !== undefined) { openSheet(false); location.hash = '#send'; }
    else if (d.sheet !== undefined) openSheet(true);
    else if (d.sheetX !== undefined) openSheet(false);
    else if (d.help !== undefined) help();
    else if (d.resumeX !== undefined) { S.resumed = null; renderResume(); }
    else if (d.reset !== undefined) {
      U.confirmBox('새로 시작할까요?', '지금 담긴 ' + S.pages.length + '쪽과 표시를 모두 비워요.', '비우고 새로 시작', function () {
        clearDraft(); render(); U.toast('새 구성표를 시작해요');
      });
    }
  }
  function onChange(e) {
    var t = e.target;
    if (t.id === 'sort') { S.sort = t.value; renderGrid(); toGridTop(); return; }
    if (t.dataset.rep && t.files && t.files[0]) {
      var f = t.files[0], ext = (f.name.split('.').pop() || '').toLowerCase();
      if (['hwp', 'hwpx', 'pdf', 'jpg', 'jpeg', 'png'].indexOf(ext) < 0) { U.toast('한글·PDF·그림 파일만 붙일 수 있어요', 'bad'); t.value = ''; return; }
      if (f.size > window.Server.RULES.fileMaxMB * 1048576) { U.toast('파일 하나는 20MB까지예요 (' + U.size(f.size) + ')', 'bad'); t.value = ''; return; }
      var idx = S.pages.findIndex(function (p) { return p.uid === t.dataset.rep; });
      S.pages[idx].rep = { name: f.name, size: f.size };
      files[t.dataset.rep] = f;
      if (S.resumed && !missingCount()) S.resumed.missing = 0;
      changed((idx + 1) + '쪽을 내 원고로 바꿔 달라고 표시했어요');
      renderResume();
    }
  }

  // ---------------- 끌어서 순서 바꾸기 (마우스·손가락 모두) ----------------
  function onGrip(e) {
    var g = e.target.closest('.grip');
    if (!g) return;
    e.preventDefault();
    var row = g.closest('.prow'), list = row.parentElement, startY = e.clientY, moved = false;
    row.classList.add('dragging');
    function mv(ev) {
      if (Math.abs(ev.clientY - startY) > 3) moved = true;
      var others = Array.prototype.filter.call(list.children, function (r) { return r !== row; });
      var before = null;
      for (var k = 0; k < others.length; k++) {
        var rc = others[k].getBoundingClientRect();
        if (ev.clientY < rc.top + rc.height / 2) { before = others[k]; break; }
      }
      if (before !== row.nextElementSibling || (before === null && list.lastElementChild !== row)) list.insertBefore(row, before);
      var box = list.closest('.book-list');
      if (box) {
        var br = box.getBoundingClientRect();
        if (ev.clientY < br.top + 40) box.scrollTop -= 8; else if (ev.clientY > br.bottom - 40) box.scrollTop += 8;
      }
    }
    function up() {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      row.classList.remove('dragging');
      if (!moved) return;
      var order = Array.prototype.map.call(list.children, function (r) { return r.getAttribute('data-uid'); });
      S.pages.sort(function (a, b) { return order.indexOf(a.uid) - order.indexOf(b.uid); });
      changed('쪽 순서를 바꿨어요');
    }
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  // ---------------- 다른 화면에 넘겨줄 것 ----------------
  function snapshot() {
    var marksByIndex = {};
    S.pages.forEach(function (p, i) { if ((S.marks[p.uid] || []).length) marksByIndex[i] = S.marks[p.uid]; });
    return {
      book: S.book,
      pages: S.pages.map(function (p) { return { sid: p.sid, rep: p.rep ? { name: p.rep.name, size: p.rep.size } : null }; }),
      marks: marksByIndex,
      repFiles: S.pages.filter(function (p) { return p.rep; }).map(function (p) { return { name: p.rep.name, size: p.rep.size, missing: !!p.rep.missing }; }),
      markCount: markCount()
    };
  }
  function afterSend() { clearDraft(); render(); }

  // 데모 도우미: '이어서 작성' 상태를 바로 보여줘요
  function loadExample() {
    var at = new Date(); at.setHours(21, 40, 0, 0); at.setDate(at.getDate() - 1);
    var ids = ['R-C01', 'R-D01', 'R-B02', 'R-I01', 'R-I01', 'R-I02', 'R-I03', 'R-I04'];
    var pages = ids.map(function (sid, i) { return { uid: 'ex' + i, sid: sid, rep: i === 2 ? { name: '우리학교_권장도서.hwp', size: 1240000 } : null }; });
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ v: 1, book: 'read', savedAt: at.toISOString(), pages: pages,
        marks: { ex0: [{ k: 'text', x: 60, y: 166, t: '교표 넣어 주세요' }], ex3: [{ k: 'pen', pts: [[16, 52], [60, 52], [120, 52]] }] } }));
    } catch (e) { /* 무시 */ }
    S.pages = []; S.marks = {}; S.resumed = null; S.part = 'cover'; S.cat = '전체';
    loadDraft(); render();
  }

  function init() { mount(); loadDraft(); render(); }
  function show() { openSheet(false); }

  window.Pick = { init: init, show: show, snapshot: snapshot, afterSend: afterSend, loadExample: loadExample, state: S, add: add };
})();
