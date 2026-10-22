/* =====================================================================
   admin.js — 관리 화면(PC 먼저): 로그인 · 받은 구성표 · 게시판 연동 · API
   ---------------------------------------------------------------------
   실제 제품에서는
     - 로그인: 비밀번호를 password_hash()로 저장, 로그인 안 하면 모든 관리 주소가 막혀요.
     - 목록·상세: admin/list.php, admin/view.php
     - 게시판 연동: 그누보드 DB를 '읽기 전용' 계정으로만 읽어요.
   ===================================================================== */
(function () {
  'use strict';
  var U = window.UI, ic = U.ic, esc = U.esc, SV = window.Server;
  var AUTH_KEY = 'barunjjok_admin_demo';
  var A = { tab: 'list', q: '', period: 'all', book: 'all', filter: 'all', sel: null, checked: [], focusNo: null, flash: null, api: { no: '', key: '', log: [], last: null, ran: false } };
  var root;

  function authed() { try { return localStorage.getItem(AUTH_KEY) === '1'; } catch (e) { return false; } }
  function setAuth(on) { try { if (on) localStorage.setItem(AUTH_KEY, '1'); else localStorage.removeItem(AUTH_KEY); } catch (e) { /* 무시 */ } }
  function wide() { return window.matchMedia('(min-width:1024px)').matches; }

  function mount() {
    root = U.$('#view-admin');
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('change', onChange);
    root.addEventListener('submit', onSubmit);
  }

  function show(tab) {
    A.tab = tab;
    if (tab !== 'api' && !authed()) { root.innerHTML = loginHTML(); return; }
    root.innerHTML = '<div class="aapp">' + topHTML() + '<main id="amain"></main></div>';
    if (tab === 'list') renderList();
    else if (tab === 'boards') renderBoards();
    else renderApi();
  }

  function topHTML() {
    var nav = [['list', '#admin', '받은 구성표'], ['boards', '#admin/boards', '게시판 연동'], ['api', '#api', 'API 미리보기']];
    return '<header class="atop"><div class="topbar">' +
      '<a class="logo" href="#admin"><span class="mark" aria-hidden="true"></span>바른쪽<span class="logo-sub">관리</span></a>' +
      '<nav class="pnav" aria-label="관리 메뉴">' + nav.map(function (n) { return '<a href="' + n[1] + '" aria-current="' + (A.tab === n[0]) + '">' + n[2] + '</a>'; }).join('') + '</nav>' +
      '<div class="tools">' + (authed() ? '<span class="avatar" title="관리자">관</span><button class="ib" data-logout aria-label="로그아웃">' + ic('logout') + '</button>' :
        '<a class="btn btn-secondary btn-sm" href="#admin">' + ic('lock', 'ic-s') + '로그인</a>') + '</div>' +
      '</div></header>';
  }

  // ---------------- 로그인 ----------------
  function loginHTML() {
    return '<div class="login"><div class="lcard">' +
      '<a class="logo" href="#pick"><span class="mark" aria-hidden="true"></span>바른쪽<span class="logo-sub">관리</span></a>' +
      '<h1>관리자 로그인</h1><p class="l-sub">받은 구성표는 로그인한 담당자만 볼 수 있어요.</p>' +
      '<form id="lform" class="form" novalidate>' +
      '<div class="field"><label class="label" for="l-id">아이디</label><input class="input" id="l-id" name="login_id" value="admin" autocomplete="username"></div>' +
      '<div class="field"><label class="label" for="l-pw">비밀번호</label><input class="input" id="l-pw" name="login_pw" type="password" placeholder="데모는 비워 둬도 돼요" autocomplete="current-password"></div>' +
      '<button type="submit" class="btn btn-primary btn-cta">' + ic('lock') + '로그인</button></form>' +
      '<div class="note neu"><b>데모용 안내</b> 아이디만 있으면 들어가져요. 실제로는 비밀번호를 해시(password_hash)로 저장하고, 5번 틀리면 15분 동안 막아요.</div>' +
      '</div></div>';
  }

  // ---------------- 받은 구성표 ----------------
  function filtered() {
    var all = SV.list(), q = A.q.toLowerCase(), now = new Date();
    return all.filter(function (r) {
      if (A.filter === 'fail' && r.mail !== 'failed') return false;
      if (A.filter === 'spam' && !r.spam) return false;
      if (A.book !== 'all' && r.book !== A.book) return false;
      if (A.period !== 'all') {
        var days = { today: 0, d7: 7, d30: 30 }[A.period], d = new Date(r.at), start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
        if (d < start) return false;
      }
      if (q && (r.org + ' ' + r.no).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }
  function mailChip(m) {
    return { sent: '<span class="chip ok">보냄</span>', failed: '<span class="chip bad">메일 실패</span>', sending: '<span class="chip info">보내는 중</span>', skipped: '<span class="chip neu">안 보냄</span>' }[m] || '';
  }
  // 이 브라우저에서 1시간 안에 보낸 구성표는 '방금 받음'으로 눈에 띄게 해요
  function freshChip(r) { return r.fresh && (Date.now() - new Date(r.at).getTime()) < 3600000 ? ' <span class="chip info fresh">방금 받음</span>' : ''; }
  function spamChip(r) { return r.spam ? '<span class="chip warn" title="' + esc(r.spam) + '">스팸</span>' : '<span class="dash">–</span>'; }

  function renderList() {
    var all = SV.list(), rows = filtered();
    var today = new Date(), tk = today.getFullYear() + U.pad(today.getMonth() + 1) + U.pad(today.getDate());
    var nToday = all.filter(function (r) { return r.no.indexOf('SP-' + tk) === 0; }).length;
    var nFail = all.filter(function (r) { return r.mail === 'failed'; }).length, nSpam = all.filter(function (r) { return r.spam; }).length;
    if (A.focusNo) { A.sel = A.focusNo; A.focusNo = null; }
    if (A.sel && !SV.get(A.sel)) A.sel = null;
    if (!A.sel && wide() && rows.length) A.sel = (rows.filter(function (r) { return !r.spam; })[0] || rows[0]).no;
    A.checked = A.checked.filter(function (no) { return rows.some(function (r) { return r.no === no; }); });

    var body = rows.length ? rows.map(function (r) {
      return '<tr class="' + (r.no === A.sel ? 'on' : '') + (r.spam ? ' is-spam' : '') + (r.no === A.flash ? ' flash' : '') + '" data-row="' + r.no + '" tabindex="0">' +
        '<td class="cbx"><input type="checkbox" class="cb" data-check="' + r.no + '" aria-label="' + r.no + ' 고르기" ' + (A.checked.indexOf(r.no) >= 0 ? 'checked' : '') + '></td>' +
        '<td class="id num">' + r.no + freshChip(r) + '</td><td class="dt num">' + U.dt(r.at) + '</td>' +
        '<td class="org">' + esc(r.org) + '</td><td class="bk">' + U.bookName(r.book) + '</td>' +
        '<td class="r num qty">' + U.num(r.qty) + '<small>부</small></td><td class="ml">' + mailChip(r.mail) + '</td><td class="sp">' + spamChip(r) + '</td></tr>';
    }).join('') : '<tr class="empty-row"><td colspan="8"><div class="empty"><div class="em-ic">' + ic('search') + '</div><h4>찾는 구성표가 없어요</h4><p>검색어나 기간을 바꿔 보세요.</p><div class="row"><button class="btn btn-secondary btn-sm" data-clear>검색 지우기</button></div></div></td></tr>';

    U.$('#amain').innerHTML =
      '<div class="ahead"><div><h1>받은 구성표</h1><p class="meta num">오늘 ' + nToday + '건 · 전체 ' + all.length + '건</p></div>' +
      '<p class="ahead-r">' + ic('clock', 'ic-s') + '보관 기간 1년이 지난 구성표와 첨부 파일은 매일 새벽 자동으로 지워요</p></div>' +
      '<div class="agrid' + (A.sel ? ' has-sel' : '') + '">' +
      '<section class="card tcard alist" aria-label="구성표 목록">' +
      '<div class="tbar"><label class="search">' + ic('search', 'ic-s') + '<input id="aq" type="search" placeholder="기관명·번호 검색" value="' + esc(A.q) + '" aria-label="기관명이나 번호로 검색"></label>' +
      '<select class="mini" id="aPeriod" aria-label="기간"><option value="all">전체 기간</option><option value="today">오늘</option><option value="d7">최근 7일</option><option value="d30">최근 30일</option></select>' +
      '<select class="mini" id="aBook" aria-label="품목"><option value="all">모든 품목</option><option value="read">독서기록장</option><option value="plan">학습플래너</option></select></div>' +
      '<div class="tfilters"><div class="chips-x">' +
      '<button class="fchip" data-filter="all" aria-pressed="' + (A.filter === 'all') + '">전체 <span class="n num">' + all.length + '</span></button>' +
      '<button class="fchip" data-filter="fail" aria-pressed="' + (A.filter === 'fail') + '">메일 실패 <span class="n num">' + nFail + '</span></button>' +
      '<button class="fchip" data-filter="spam" aria-pressed="' + (A.filter === 'spam') + '">스팸 <span class="n num">' + nSpam + '</span></button></div>' +
      (A.filter === 'spam' && nSpam ? '<button class="btn btn-sm btn-danger" data-wipe>' + ic('trash', 'ic-s') + '스팸 ' + nSpam + '건 모두 지우기</button>' : '') +
      '</div>' +
      (A.filter === 'all' && nFail ? '<div class="attn" role="status"><span class="attn-ic">' + ic('alert', 'ic-s') + '</span><p><b>메일이 안 간 구성표 <span class="num">' + nFail + '</span>건</b><span>구성표는 저장돼 있어요. 담당자가 직접 연락해 주세요.</span></p>' +
        '<button type="button" class="btn btn-sm btn-white" data-filter="fail">모아 보기</button></div>' : '') +
      (A.checked.length ? '<div class="bulk"><span class="num">' + A.checked.length + '건 골랐어요</span><button class="btn btn-sm btn-danger" data-del-checked>' + ic('trash', 'ic-s') + '고른 것 지우기</button><button class="btn btn-sm btn-ghost" data-uncheck>고르기 취소</button></div>' : '') +
      '<div class="tscroll"><table class="tbl atbl"><thead><tr><th class="cbx"><span class="sr">고르기</span></th><th>번호</th><th>받은 날</th><th>기관</th><th>품목</th><th class="r">수량</th><th>메일</th><th>스팸</th></tr></thead><tbody>' + body + '</tbody></table></div>' +
      '<div class="tfoot"><span class="num">' + (rows.length === all.length ? '전체 ' + all.length + '건' : rows.length + '건 찾음') + '</span><span>줄을 누르면 자세히 보여요</span></div>' +
      '</section>' +
      '<section class="card adetail" id="adetail" aria-label="구성표 자세히">' + detailHTML(A.sel) + '</section>' +
      '</div>';
    U.$('#aPeriod').value = A.period;
    U.$('#aBook').value = A.book;
    A.flash = null; // 강조는 한 번만
    var fl = U.$('#amain tr.flash');
    if (fl && wide()) fl.scrollIntoView({ block: 'nearest' });
  }

  function detailHTML(no) {
    var r = no && SV.get(no);
    if (!r) return '<div class="empty"><div class="em-ic">' + ic('list') + '</div><h4>구성표를 골라 주세요</h4><p>목록에서 줄을 누르면 쪽 순서와 표시가 보여요.</p></div>';
    var mk = r.marks || {}, nMarks = 0;
    Object.keys(mk).forEach(function (k) { nMarks += mk[k].length; });
    var pages = r.pages.map(function (p, i) {
      var smp = U.sample(p.sid);
      return '<li><button type="button" class="dp" data-view="' + i + '" aria-label="' + (i + 1) + '쪽 크게 보기"><div class="paper">' + window.Art.svg(smp) + '</div>' +
        ((mk[i] || []).length ? '<svg class="ov" viewBox="0 0 140 198" preserveAspectRatio="none">' + window.Art.marks(mk[i]) + '</svg>' : '') +
        '<span class="no num">' + (i + 1) + '</span></button><span class="dp-t">' + esc(smp.title) + '</span>' +
        (p.rep ? '<span class="dp-rep" title="' + esc(p.rep.name) + '">' + ic('clip', 'ic-xs') + '<span>' + esc(p.rep.name) + '</span></span>' : '') + '</li>';
    }).join('');
    var filesHTML = (r.files || []).length ? '<ul class="dfiles">' + r.files.map(function (f) {
      return '<li>' + ic('file', 'ic-s') + '<span class="fn">' + esc(f.name) + '</span><span class="fs num">' + U.size(f.size) + '</span><button class="btn btn-sm btn-ghost" data-dl="' + esc(f.name) + '">' + ic('download', 'ic-s') + '받기</button></li>';
    }).join('') + '</ul>' : '<p class="muted">올린 파일이 없어요</p>';
    return '<div class="dh"><button class="btn btn-sm btn-ghost only-narrow" data-back>' + ic('left', 'ic-s') + '목록</button>' +
      '<div class="dh-t"><p class="dk num">' + U.dt(r.at, true) + ' 받음 · ' + U.bookName(r.book) + '</p><h2 class="num">' + r.no + '</h2></div>' +
      '<div class="dh-c">' + mailChip(r.mail) + (r.spam ? '<span class="chip warn">스팸 · ' + esc(r.spam) + '</span>' : '') + '</div></div>' +
      '<dl class="dgrid"><div><dt>기관</dt><dd>' + esc(r.org) + '</dd></div><div><dt>담당자</dt><dd>' + esc(r.person) + '</dd></div>' +
      '<div><dt>휴대폰</dt><dd class="num">' + esc(r.phone) + '</dd></div><div><dt>메일</dt><dd class="num">' + esc(r.email) + '</dd></div>' +
      '<div><dt>수량</dt><dd class="num">' + U.num(r.qty) + '부</dd></div><div><dt>받을 날</dt><dd class="num">' + esc(String(r.due).replace(/-/g, '.')) + '</dd></div></dl>' +
      '<div class="dmsg"><p class="dk">문의 내용</p><p>' + esc(r.msg) + '</p></div>' +
      '<div class="dsec"><div class="dsec-h"><h3>쪽 순서 <span class="num">' + r.pages.length + '쪽 · 표시 ' + nMarks + '</span></h3>' +
      '<button class="btn btn-sm btn-secondary" data-view="0">' + ic('book', 'ic-s') + '넘겨 보기</button></div><ol class="dpages">' + pages + '</ol></div>' +
      '<div class="dsec"><div class="dsec-h"><h3>올린 파일 <span class="num">' + (r.files || []).length + '</span></h3></div>' + filesHTML + '</div>' +
      '<div class="dsec"><div class="dsec-h"><h3>메일 기록</h3></div><ul class="dlog">' + r.mailLog.map(function (l) {
        return '<li class="' + (/실패/.test(l) ? 'bad' : '') + '">' + esc(l) + '</li>';
      }).join('') + (r.mail === 'sending' ? '<li>보내는 중…</li>' : '') + '</ul></div>' +
      '<div class="dact"><button class="btn btn-secondary btn-sm" data-spam="' + r.no + '">' + (r.spam ? '스팸 아님으로 바꾸기' : '스팸으로 표시') + '</button>' +
      '<button class="btn btn-danger btn-sm" data-del="' + r.no + '">' + ic('trash', 'ic-s') + '지우기</button></div>';
  }

  function viewSpread(no, at) {
    var r = SV.get(no);
    if (!r) return;
    U.openViewer({ title: r.no + ' · ' + r.org, note: r.pages.length + '쪽 · 고객이 보낸 순서와 표시 그대로예요', editable: false, start: at, pages: r.pages,
      marksOf: function (i) { return (r.marks || {})[i] || []; } });
  }

  // ---------------- 게시판 연동 ----------------
  function renderBoards() {
    var read = SV.boardsReadAt(), rows = '';
    window.DATA.BOOKS.forEach(function (b, bi) {
      b.parts.forEach(function (p, pi) {
        var n = window.DATA.SAMPLES.filter(function (x) { return x.book === b.key && x.part === p.key; }).length;
        var warn = (b.key === 'read' && p.key === 'inner');
        rows += '<tr><td>' + b.name + '</td><td>' + p.name + '</td><td class="num"><span class="site">사이트 A</span><code>' + p.board + '</code></td><td class="num"><span class="site">사이트 B</span><code>' + p.board + '</code></td>' +
          '<td class="r num">' + n + '<small>개</small></td><td class="dt num">' + U.dt(read) + '</td>' +
          '<td>' + (warn ? '<span class="chip warn" title="첫 첨부 그림이 없는 글은 목록에서 빼요">그림 없는 글 1</span>' : '<span class="chip ok">정상</span>') + '</td></tr>';
      });
    });
    U.$('#amain').innerHTML =
      '<div class="ahead"><div><h1>게시판 연동</h1><p class="meta">품목마다 어느 그누보드 게시판에서 샘플을 읽을지 정해요. 게시판은 읽기만 하고 고치지 않아요.</p></div>' +
      '<button class="btn btn-secondary" data-reread>' + ic('refresh', 'ic-s') + '지금 다시 읽기</button></div>' +
      '<div class="bgrid">' +
      '<section class="card tcard"><div class="tbar"><h3>품목·게시판 연결</h3><span class="cnt num">게시판 7개 · 두 사이트</span></div>' +
      '<div class="tscroll"><table class="tbl btbl"><thead><tr><th>품목</th><th>부품</th><th>사이트 A 게시판</th><th>사이트 B 게시판</th><th class="r">샘플</th><th>마지막 읽은 시각</th><th>상태</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="tfoot"><span>분류(표지·간지 등)는 게시판의 분류를 그대로 읽어요. 정렬은 인기 등급 → 조회수 → 최신순이에요.</span></div></section>' +
      '<div class="bside">' +
      '<section class="card"><div class="ch"><div><h3>받는 메일</h3><p>품목 갈래별로 사내 메일을 받을 주소예요</p></div></div>' +
      '<div class="form"><div class="field"><label class="label" for="m-read">독서기록장</label><input class="input" id="m-read" value="reading@barunjjok.test"></div>' +
      '<div class="field"><label class="label" for="m-plan">학습플래너</label><input class="input" id="m-plan" value="planner@barunjjok.test"></div>' +
      '<label class="switch-row"><span><b>고객 접수 확인 메일</b><small>선생님께 번호와 받은 내용을 보내요</small></span><input type="checkbox" class="sw" checked></label></div></section>' +
      '<section class="card"><div class="ch"><div><h3>운영 설정</h3></div></div><div class="form">' +
      '<label class="switch-row"><span><b>두 사이트의 같은 글은 하나로</b><small>같은 샘플이 두 번 보이지 않게 묶어요. 묶는 기준은 착수 회의에서 정해요.</small></span><input type="checkbox" class="sw" checked></label>' +
      '<div class="field"><label class="label" for="keep">보관 기간</label><select class="input" id="keep"><option>6개월</option><option selected>1년</option><option>2년</option></select>' +
      '<div class="help"><span>지나면 구성표와 첨부 파일을 함께 자동 삭제해요</span></div></div>' +
      '<dl class="dl"><div><dt>만들어 둔 썸네일</dt><dd class="num">412개</dd></div><div><dt>썸네일 크기</dt><dd class="num">긴 변 480px</dd></div><div><dt>API 키</dt><dd class="num">••••9c1e · 해시로 저장</dd></div></dl>' +
      '</div></section></div></div>';
  }

  // ---------------- API 미리보기 ----------------
  function renderApi() {
    var nos = SV.list().filter(function (r) { return !r.spam; }).map(function (r) { return r.no; });
    if (!A.api.no || nos.indexOf(A.api.no) < 0) A.api.no = nos[0] || '';
    U.$('#amain').innerHTML =
      '<div class="ahead"><div><h1>API 미리보기</h1><p class="meta">사내 시스템이 구성표 번호와 API 키로 구성표를 가져가요. 서버끼리만 쓰는 주소예요.</p></div></div>' +
      '<div class="apigrid">' +
      '<section class="card"><div class="ch"><div><h3>요청</h3><p>사내 서버가 보내는 요청을 흉내 내요</p></div></div>' +
      '<div class="reqline num"><span class="m">GET</span><span class="u">/api/v1/spread.php?no=<b id="reqNo">' + esc(A.api.no) + '</b></span></div>' +
      '<div class="reqline num hdr"><span class="m">머리글</span><span class="u">X-Api-Key: <b id="reqKey">' + (A.api.key ? esc(A.api.key.slice(0, 9)) + '…' : '(없음)') + '</b></span></div>' +
      '<form id="apiform" class="form" novalidate>' +
      '<div class="field"><label class="label" for="api-no">구성표 번호</label><select class="input num" id="api-no">' + nos.map(function (n) { return '<option' + (n === A.api.no ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '<option value="SP-20990101-0001">SP-20990101-0001 (없는 번호)</option></select></div>' +
      '<div class="field"><label class="label" for="api-key">API 키</label><div class="keyrow"><input class="input num" id="api-key" value="' + esc(A.api.key) + '" placeholder="키 없이 보내면 401이 나와요" autocomplete="off">' +
      '<button type="button" class="btn btn-secondary" data-demokey>' + (A.api.key ? '키 빼기' : '데모 키 넣기') + '</button></div></div>' +
      '<button type="submit" class="btn btn-primary btn-cta">' + ic('send') + '요청 보내기</button></form>' +
      '<ul class="rules"><li><b>번호만으로는 열리지 않아요.</b> 키가 없거나 틀리면 401이에요.</li><li>키는 서버에 <b>해시로만</b> 저장하고, 화면에는 끝 4자리만 보여요.</li>' +
      '<li>파일 주소는 서명이 붙어 <b>10분 뒤 만료</b>돼요.</li><li>모든 요청은 시각·IP·결과를 기록해요.</li></ul>' +
      '</section>' +
      '<section class="card apires"><div class="res-h"><h3>응답</h3><span id="resStat"></span></div><pre class="code" id="resBody"><code>요청을 보내면 여기에 응답이 보여요.</code></pre>' +
      '<div class="alog"><p class="dk">요청 기록</p><ul id="apiLog"></ul></div></section></div>';
    paintApi();
    if (!A.api.ran) { // 처음 열면 '키 없이' → '키 넣고' 두 번 보내서 둘 다 보여줘요
      A.api.ran = true;
      call(A.api.no, '').then(function () { A.api.key = SV.DEMO_KEY; U.$('#api-key').value = A.api.key; syncReq(); return call(A.api.no, A.api.key); });
    }
  }
  function syncReq() {
    U.$('#reqNo').textContent = U.$('#api-no').value;
    U.$('#reqKey').textContent = A.api.key ? A.api.key.slice(0, 9) + '…' : '(없음)';
    var b = U.$('[data-demokey]'); if (b) b.textContent = A.api.key ? '키 빼기' : '데모 키 넣기';
  }
  function call(no, key) {
    var t0 = performance.now();
    U.$('#resStat').innerHTML = '<span class="spin"></span>';
    return SV.apiGet(no, key).then(function (res) {
      A.api.last = res;
      var now = new Date();
      A.api.log.unshift({ t: U.pad(now.getHours()) + ':' + U.pad(now.getMinutes()) + ':' + U.pad(now.getSeconds()), status: res.status, no: no, key: !!key, ms: Math.round(performance.now() - t0) });
      A.api.log = A.api.log.slice(0, 5);
      paintApi();
    });
  }
  function paintApi() {
    var res = A.api.last;
    if (res) {
      var label = { 200: '200 OK', 401: '401 Unauthorized', 404: '404 Not Found' }[res.status];
      U.$('#resStat').innerHTML = '<span class="chip ' + (res.status === 200 ? 'ok' : 'bad') + ' num">' + label + '</span><span class="ms num">' + (A.api.log[0] ? A.api.log[0].ms + 'ms' : '') + '</span>';
      U.$('#resBody').innerHTML = '<code>' + highlight(JSON.stringify(res.body, null, 2)) + '</code>';
    }
    U.$('#apiLog').innerHTML = A.api.log.map(function (l) {
      return '<li><span class="num">' + l.t + '</span><span class="chip ' + (l.status === 200 ? 'ok' : 'bad') + ' num">' + l.status + '</span><span class="num">' + esc(l.no) + '</span><span class="lk">' + (l.key ? '키 있음' : '키 없음') + '</span></li>';
    }).join('');
  }
  function highlight(json) {
    return esc(json).replace(/(&quot;(?:[^&]|&(?!quot;))*?&quot;)(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g, function (m, str, colon, lit, n) {
      if (str) return '<span class="' + (colon ? 'k' : 's') + '">' + str + '</span>' + (colon || '');
      if (lit) return '<span class="b">' + lit + '</span>';
      return '<span class="n">' + n + '</span>';
    });
  }

  // ---------------- 동작 ----------------
  function onSubmit(e) {
    e.preventDefault();
    var fid = e.target.getAttribute('id');
    if (fid === 'lform') {
      if (!U.$('#l-id').value.trim()) { U.toast('아이디를 써 주세요', 'bad'); return; }
      setAuth(true); show(A.tab === 'api' ? 'list' : A.tab); U.toast('로그인했어요');
    }
    if (fid === 'apiform') { A.api.no = U.$('#api-no').value; A.api.key = U.$('#api-key').value.trim(); syncReq(); call(A.api.no, A.api.key); }
  }
  function onClick(e) {
    var row = e.target.closest('tr[data-row]');
    var cell = e.target.closest('.cbx');
    if (cell) { // 체크 칸 전체(44px)를 눌러도 골라져요
      var cb = cell.querySelector('input');
      if (cb && e.target !== cb) cb.click();
      return;
    }
    var t = e.target.closest('button');
    if (!t && row) { A.sel = row.getAttribute('data-row'); renderList(); if (!wide()) window.scrollTo(0, 0); return; }
    if (!t) return;
    var d = t.dataset;
    if (d.logout !== undefined) { setAuth(false); A.sel = null; show('list'); U.toast('로그아웃했어요'); }
    else if (d.filter) { A.filter = d.filter; A.sel = null; A.checked = []; renderList(); }
    else if (d.clear !== undefined) { A.q = ''; A.period = 'all'; A.book = 'all'; A.filter = 'all'; renderList(); }
    else if (d.back !== undefined) { A.sel = null; renderList(); }
    else if (d.view !== undefined) viewSpread(A.sel, Number(d.view));
    else if (d.dl) U.toast('데모라 실제 파일은 없어요: ' + d.dl);
    else if (d.spam) { var r = SV.get(d.spam); SV.setSpam(d.spam, !r.spam); renderList(); U.toast(r.spam ? '스팸 표시를 붙였어요' : '스팸 표시를 뗐어요'); }
    else if (d.del) {
      U.confirmBox('이 구성표를 지울까요?', d.del + '와 첨부 파일을 지워요. 지운 뒤에는 되돌릴 수 없어요.', '지우기', function () {
        SV.remove([d.del]); A.sel = null; renderList(); U.toast('구성표를 지웠어요');
      });
    }
    else if (d.wipe !== undefined) {
      var spam = SV.list().filter(function (x) { return x.spam; }).map(function (x) { return x.no; });
      U.confirmBox('스팸 ' + spam.length + '건을 지울까요?', '스팸으로 표시된 구성표와 첨부 파일을 모두 지워요. 되돌릴 수 없어요.', spam.length + '건 지우기', function () {
        SV.remove(spam); A.sel = null; A.filter = 'all'; renderList(); U.toast('스팸 ' + spam.length + '건을 지웠어요');
      });
    }
    else if (d.delChecked !== undefined) {
      var list = A.checked.slice();
      U.confirmBox(list.length + '건을 지울까요?', '고른 구성표와 첨부 파일을 지워요. 되돌릴 수 없어요.', list.length + '건 지우기', function () {
        SV.remove(list); A.checked = []; A.sel = null; renderList(); U.toast(list.length + '건을 지웠어요');
      });
    }
    else if (d.uncheck !== undefined) { A.checked = []; renderList(); }
    else if (d.reread !== undefined) { SV.touchBoards(); renderBoards(); U.toast('게시판 7개를 다시 읽었어요'); }
    else if (d.demokey !== undefined) { A.api.key = A.api.key ? '' : SV.DEMO_KEY; U.$('#api-key').value = A.api.key; syncReq(); }
  }
  function onInput(e) {
    if (e.target.id === 'aq') {
      A.q = e.target.value;
      var pos = e.target.selectionStart;
      renderList();
      var q = U.$('#aq'); q.focus(); try { q.setSelectionRange(pos, pos); } catch (err) { /* 무시 */ }
    }
    if (e.target.id === 'api-key') { A.api.key = e.target.value.trim(); syncReq(); }
  }
  function onChange(e) {
    var t = e.target;
    if (t.dataset.check) {
      var no = t.dataset.check, i = A.checked.indexOf(no);
      if (t.checked && i < 0) A.checked.push(no); else if (!t.checked && i >= 0) A.checked.splice(i, 1);
      renderList();
    }
    if (t.id === 'aPeriod') { A.period = t.value; A.sel = null; renderList(); }
    if (t.id === 'aBook') { A.book = t.value; A.sel = null; renderList(); }
    if (t.id === 'api-no') { A.api.no = t.value; syncReq(); }
  }
  document.addEventListener('keydown', function (e) {
    var row = e.target.closest && e.target.closest('tr[data-row]');
    if (row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); A.sel = row.getAttribute('data-row'); renderList(); }
  });

  window.Admin = { init: mount, show: show, focus: function (no, flash) { A.focusNo = no; A.flash = flash ? no : null; A.filter = 'all'; A.q = ''; A.period = 'all'; A.book = 'all'; }, login: function () { setAuth(true); } };
})();
