/* =====================================================================
   send.js — 보내기 화면: 연락처·첨부 → 스팸 검사 → 저장·번호 발급 → 메일
   ---------------------------------------------------------------------
   순서가 중요해요.
     1) 서버에 먼저 저장하고 구성표 번호를 받아요.
     2) 그다음 메일을 보내요. 메일이 실패해도 구성표는 남아 있어요.
   칸 이름(org, person, phone, email, qty, due, msg)은 착수 회의에서
   귀사 1:1 문의 칸 이름과 똑같이 맞춰요.
   ===================================================================== */
(function () {
  'use strict';
  var U = window.UI, ic = U.ic, esc = U.esc, R = window.Server.RULES;
  var root, openedAt = Date.now(), busy = false, capOk = false;
  var attach = [];      // { name, size, ok, why }
  var lab = { honeypot: false, fast: false, mailFail: false };

  var FIELDS = [
    { k: 'org', label: '기관명', ph: '예) 논산 ○○초등학교', req: true },
    { k: 'person', label: '담당자', ph: '예) 3학년 부장 김○○', req: true },
    { k: 'phone', label: '휴대폰', ph: '010-0000-0000', req: true, type: 'tel', im: 'tel' },
    { k: 'email', label: '메일', ph: '예) name@school.es.kr', req: true, type: 'email', im: 'email' }
  ];

  function mount() {
    root = U.$('#view-send');
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    root.addEventListener('input', onInput);
    root.addEventListener('focusout', function (e) { if (e.target.name && e.target.closest('#sform')) check(e.target.name); });
    root.addEventListener('submit', onSubmit);
  }

  function show() {
    var snap = window.Pick.snapshot();
    openedAt = Date.now(); busy = false; capOk = false;
    if (!snap.pages.length) {
      root.innerHTML = '<div class="sapp">' + backHead() + '<div class="card empty big-empty"><div class="em-ic">' + ic('book') + '</div>' +
        '<h4>보낼 구성표가 없어요</h4><p>샘플을 한 쪽 이상 담으면 여기서 보낼 수 있어요.</p><div class="row">' +
        '<button type="button" class="btn btn-secondary" data-fill-example>예시 구성표로 채워 보기</button><a class="btn btn-primary" href="#pick">샘플 고르러 가기</a></div></div></div>';
      return;
    }
    var today = new Date(), min = today.getFullYear() + '-' + U.pad(today.getMonth() + 1) + '-' + U.pad(today.getDate());
    root.innerHTML =
      '<div class="sapp">' + backHead() +
      '<section class="hello">' + U.stepbar(3) + '<p>마지막 단계예요</p><h1>구성표와 요청을 보내 주세요</h1></section>' +
      '<div class="send">' +
      '<aside class="send-side">' + summaryCard(snap) + labCard() + '</aside>' +
      '<form class="card fcard" id="sform" novalidate>' +
      '<div class="form-err" id="formErr" role="alert" hidden></div>' +
      '<div class="field"><label class="label" for="f-msg">문의 내용<span class="req">*</span></label>' +
      '<textarea class="input big" id="f-msg" name="msg" maxlength="2000" rows="6" placeholder="예) 3학년 4개 반이에요. 반마다 표지 색만 다르게 하고, 표지 아래에 교표를 넣어 주세요."></textarea>' +
      '<div class="help"><span>원하는 것을 편하게 적어 주세요. 쪽 순서는 구성표로 함께 가요.</span><span class="num" id="msgCount">0 / 2,000</span></div><div class="err" data-err="msg" hidden></div></div>' +
      '<div class="row2">' + FIELDS.map(fieldHTML).join('') + '</div>' +
      '<div class="row2">' +
      '<div class="field"><label class="label" for="f-qty">수량<span class="req">*</span></label><div class="affix"><input class="input" id="f-qty" name="qty" inputmode="numeric" placeholder="0" autocomplete="off"><span class="sfx">부</span></div><div class="err" data-err="qty" hidden></div></div>' +
      '<div class="field"><label class="label" for="f-due">받을 날<span class="req">*</span></label><input class="input" id="f-due" name="due" type="date" min="' + min + '"><div class="help"><span>정확하지 않아도 괜찮아요</span></div><div class="err" data-err="due" hidden></div></div>' +
      '</div>' +
      attachHTML(snap) +
      // 숨은 칸: 사람 눈에는 안 보이고, 자동 등록 프로그램만 채워요
      '<div class="hp" aria-hidden="true"><label for="f-homepage">홈페이지</label><input id="f-homepage" name="homepage" tabindex="-1" autocomplete="off"></div>' +
      '<div class="field"><span class="label">자동 등록 방지<span class="req">*</span></span>' +
      '<div class="cap" id="cap"><button type="button" class="cap-box" data-cap aria-pressed="false"><span class="cap-cb"></span><span class="cap-t">로봇이 아니에요</span></button>' +
      '<span class="cap-note">실제 사이트에는 무료 캡차 위젯이 들어가요</span></div><div class="err" data-err="cap" hidden></div></div>' +
      '<div class="field agree"><label class="check"><input type="checkbox" class="cb" name="agree" id="f-agree"><span>개인정보 수집·이용에 동의해요 <span class="req">*</span></span></label>' +
      '<details class="pp"><summary>내용 보기</summary><dl><div><dt>모으는 것</dt><dd>기관명, 담당자, 휴대폰, 메일, 올린 파일</dd></div>' +
      '<div><dt>쓰는 곳</dt><dd>구성표 확인, 견적·제작 연락</dd></div><div><dt>보관 기간</dt><dd>받은 날부터 1년, 지나면 첨부 파일과 함께 자동 삭제</dd></div></dl></details>' +
      '<div class="err" data-err="agree" hidden></div></div>' +
      '<div class="factions"><button type="submit" class="btn btn-primary btn-cta" id="sendBtn">' + ic('send') + '구성표 보내기</button></div>' +
      '</form></div></div>';
    renderAttach();
  }
  function backHead() {
    return '<header class="apphead"><a class="back" href="#pick">' + ic('left') + '구성표로 돌아가기</a>' +
      '<a class="logo ml-auto" href="#pick" aria-label="바른쪽 처음으로"><span class="mark" aria-hidden="true"></span>바른쪽</a></header>';
  }
  function fieldHTML(f) {
    return '<div class="field"><label class="label" for="f-' + f.k + '">' + f.label + (f.req ? '<span class="req">*</span>' : '') + '</label>' +
      '<input class="input" id="f-' + f.k + '" name="' + f.k + '" type="' + (f.type || 'text') + '" ' + (f.im ? 'inputmode="' + f.im + '" ' : '') +
      'placeholder="' + esc(f.ph) + '" autocomplete="' + ({ org: 'organization', person: 'name', phone: 'tel', email: 'email' }[f.k]) + '"><div class="err" data-err="' + f.k + '" hidden></div></div>';
  }
  function summaryCard(snap) {
    var strip = snap.pages.slice(0, 8).map(function (p, i) {
      return '<div class="ss-p"><div class="paper">' + window.Art.svg(U.sample(p.sid)) + '</div><span class="num">' + (i + 1) + '</span></div>';
    }).join('');
    return '<div class="card ssum"><div class="ss-h"><div><p class="ss-k">보낼 구성표</p><h3>' + U.bookName(snap.book) + ' <span class="num">' + snap.pages.length + '쪽</span></h3></div>' +
      '<a class="btn btn-sm btn-secondary" href="#pick">' + ic('pen', 'ic-s') + '고치기</a></div>' +
      '<div class="ss-strip">' + strip + (snap.pages.length > 8 ? '<div class="ss-more num">+' + (snap.pages.length - 8) + '</div>' : '') + '</div>' +
      '<div class="ss-meta"><span>교체 원고 <b class="num">' + snap.repFiles.length + '</b></span><span>펜·글상자 표시 <b class="num">' + snap.markCount + '</b></span></div></div>';
  }
  function labCard() {
    return '<details class="card lab"><summary><span>' + ic('shield') + '스팸 막기 시험해 보기</span><span class="tag">데모</span></summary>' +
      '<ul class="labl">' +
      '<li><b>무료 캡차</b><span>서버가 캡차 회사에 토큰을 한 번 더 확인해요</span></li>' +
      '<li><b>숨은 칸</b><span>사람 눈에 안 보이는 칸이 채워지면 스팸으로 표시해요</span></li>' +
      '<li><b>과속 제출 거름</b><span>화면을 연 지 3초 안에 보내면 스팸으로 표시해요</span></li>' +
      '<li><b>횟수 제한</b><span>같은 곳에서 10분에 5번 넘게 보내면 잠시 막아요</span></li></ul>' +
      '<div class="labsw">' +
      sw('honeypot', '로봇처럼 숨은 칸 채우기') + sw('fast', '열자마자 보낸 것처럼 하기') + sw('mailFail', '메일 서버 실패 흉내 내기') +
      '</div></details>';
  }
  function sw(k, label) {
    return '<label class="switch-row"><span><b>' + label + '</b></span><input type="checkbox" class="sw" data-lab="' + k + '" ' + (lab[k] ? 'checked' : '') + '></label>';
  }
  function attachHTML(snap) {
    return '<div class="field"><span class="label">교표·사진·원고 파일<span class="opt">(선택)</span></span>' +
      '<label class="drop" for="f-files">' + ic('upload') + '<span><b>파일 올리기</b><small>한글(hwp·hwpx), PDF, 그림(jpg·png), 일러스트(ai), 압축(zip) · 파일 하나 20MB · 한 번에 30개까지</small></span></label>' +
      '<input type="file" id="f-files" class="sr" multiple>' +
      '<div class="flist" id="flist"></div>' +
      '<button type="button" class="link-btn" data-example>' + ic('plus', 'ic-s') + '예시 파일 넣어 보기</button></div>';
  }
  function renderAttach() {
    var snap = window.Pick.snapshot(), el = U.$('#flist');
    if (!el) return;
    var rows = snap.repFiles.map(function (f) {
      return '<li class="frow2 ' + (f.missing ? 'warn' : '') + '">' + ic('clip', 'ic-s') + '<span class="fn">' + esc(f.name) + '</span>' +
        '<span class="fs num">' + U.size(f.size) + '</span><span class="fst">' + (f.missing ? '구성표에서 다시 올려 주세요' : '쪽 교체 원고') + '</span></li>';
    });
    attach.forEach(function (f, i) {
      rows.push('<li class="frow2 ' + (f.ok ? '' : 'bad') + '">' + ic(f.ok ? 'file' : 'alert', 'ic-s') + '<span class="fn">' + esc(f.name) + '</span>' +
        '<span class="fs num">' + U.size(f.size) + '</span><span class="fst">' + (f.ok ? '올릴 수 있어요' : esc(f.why)) + '</span>' +
        '<button type="button" class="ib ib-s" data-rm="' + i + '" aria-label="' + esc(f.name) + ' 빼기">' + ic('x', 'ic-xs') + '</button></li>');
    });
    var okN = attach.filter(function (f) { return f.ok; }).length + snap.repFiles.filter(function (f) { return !f.missing; }).length, badN = attach.filter(function (f) { return !f.ok; }).length;
    el.innerHTML = rows.length ? '<ul>' + rows.join('') + '</ul><p class="fsum num">올릴 파일 ' + okN + '개 / 30개' + (badN ? ' · 거른 파일 ' + badN + '개는 보내지 않아요' : '') + '</p>' : '';
  }
  function addFiles(list) {
    var snap = window.Pick.snapshot();
    Array.prototype.forEach.call(list, function (f) {
      var ext = (f.name.split('.').pop() || '').toLowerCase(), ok = true, why = '';
      var used = attach.filter(function (a) { return a.ok; }).length + snap.repFiles.filter(function (r) { return !r.missing; }).length;
      if (R.exts.indexOf(ext) < 0) { ok = false; why = '올릴 수 없는 형식이에요'; }
      else if (f.size > R.fileMaxMB * 1048576) { ok = false; why = '20MB를 넘어요'; }
      else if (used >= R.fileMaxCount) { ok = false; why = '한 번에 30개까지예요'; }
      attach.push({ name: f.name, size: f.size, ok: ok, why: why });
    });
    renderAttach();
  }

  // ---------------- 검사 ----------------
  function val(k) { var el = U.$('#sform [name="' + k + '"]'); return el ? (el.type === 'checkbox' ? el.checked : el.value.trim()) : ''; }
  function setErr(k, msg) {
    var e = U.$('[data-err="' + k + '"]'), inp = U.$('#sform [name="' + k + '"]');
    if (e) { e.hidden = !msg; e.innerHTML = msg ? ic('alert') + '<span>' + esc(msg) + '</span>' : ''; }
    if (inp && inp.classList.contains('input')) inp.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }
  function check(k) {
    var v = val(k);
    switch (k) {
      case 'msg': return setErr(k, v.length < 5 ? '문의 내용을 5자 이상 써 주세요' : '');
      case 'org': return setErr(k, !v ? '기관명을 써 주세요' : '');
      case 'person': return setErr(k, !v ? '담당자 이름을 써 주세요' : '');
      case 'phone': return setErr(k, !/^01[016789]-?\d{3,4}-?\d{4}$/.test(v) ? '휴대폰 번호 10~11자리를 모두 써 주세요' : '');
      case 'email': return setErr(k, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '메일 주소를 다시 확인해 주세요 (예: name@school.es.kr)' : '');
      case 'qty': return setErr(k, !(Number(v.replace(/,/g, '')) >= 1) ? '수량을 1부 이상 숫자로 써 주세요' : '');
      case 'due': return setErr(k, !v ? '받고 싶은 날을 골라 주세요' : '');
      case 'agree': return setErr(k, !v ? '개인정보 수집·이용에 동의해야 보낼 수 있어요' : '');
      default: return true;
    }
  }

  function onInput(e) {
    var t = e.target;
    if (t.name === 'msg') U.$('#msgCount').textContent = U.num(t.value.length) + ' / 2,000';
    if (t.name === 'phone') {
      var d = t.value.replace(/\D/g, '').slice(0, 11);
      t.value = d.length < 4 ? d : d.length < 8 ? d.slice(0, 3) + '-' + d.slice(3) : d.slice(0, 3) + '-' + d.slice(3, d.length - 4) + '-' + d.slice(-4);
    }
    if (t.name === 'qty') { var n = t.value.replace(/\D/g, '').slice(0, 6); t.value = n ? Number(n).toLocaleString('ko-KR') : ''; }
    if (t.getAttribute('aria-invalid') === 'true') check(t.name);
  }
  function onChange(e) {
    var t = e.target;
    if (t.id === 'f-files') { addFiles(t.files); t.value = ''; }
    if (t.dataset.lab) {
      lab[t.dataset.lab] = t.checked;
      if (t.dataset.lab === 'honeypot') U.$('#f-homepage').value = t.checked ? 'http://spam.example' : '';
      if (t.dataset.lab === 'fast' && t.checked) openedAt = Date.now();
    }
    if (t.name === 'agree') check('agree');
  }
  function onClick(e) {
    var t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.cap !== undefined) runCaptcha(t);
    else if (t.dataset.rm !== undefined) { attach.splice(Number(t.dataset.rm), 1); renderAttach(); }
    else if (t.dataset.example !== undefined) {
      addFiles([{ name: '교표_원본.png', size: 412000 }, { name: '3학년_원고.hwp', size: 1240000 }, { name: '행사사진_원본.zip', size: 24500000 }, { name: 'setup.php', size: 3100 }]);
    }
    else if (t.dataset.copy) {
      var no = t.dataset.copy;
      (navigator.clipboard ? navigator.clipboard.writeText(no) : Promise.reject()).then(function () { U.toast('번호를 복사했어요'); }, function () { U.toast('번호: ' + no); });
    }
    else if (t.dataset.new !== undefined) location.hash = '#pick';
    else if (t.dataset.fillExample !== undefined) { window.Pick.loadExample(); show(); U.toast('예시 구성표 ' + window.Pick.snapshot().pages.length + '쪽을 불러왔어요'); }
  }
  function runCaptcha(btn) {
    if (capOk || btn.classList.contains('busy')) return;
    btn.classList.add('busy');
    btn.querySelector('.cap-t').textContent = '확인하는 중…';
    setTimeout(function () {
      capOk = true;
      btn.classList.remove('busy'); btn.classList.add('ok'); btn.setAttribute('aria-pressed', 'true');
      btn.querySelector('.cap-t').textContent = '확인됐어요';
      setErr('cap', '');
    }, 700);
  }

  function onSubmit(e) {
    e.preventDefault();
    if (busy) return; // 두 번 눌러도 한 번만
    var keys = ['msg', 'org', 'person', 'phone', 'email', 'qty', 'due', 'agree'], bad = null;
    keys.forEach(function (k) { if (!check(k) && !bad) bad = k; });
    if (!capOk) { setErr('cap', '\'로봇이 아니에요\'를 눌러 확인해 주세요'); if (!bad) bad = 'cap'; }
    if (bad) {
      var el = bad === 'cap' ? U.$('[data-cap]') : U.$('#sform [name="' + bad + '"]');
      if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      return;
    }
    busy = true;
    var btn = U.$('#sendBtn');
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span>저장하는 중';
    var snap = window.Pick.snapshot();
    var form = { msg: val('msg'), org: val('org'), person: val('person'), phone: val('phone'), email: val('email'), qty: val('qty').replace(/,/g, ''), due: val('due') };
    var okFiles = snap.repFiles.filter(function (f) { return !f.missing; }).map(function (f) { return { name: f.name, size: f.size }; })
      .concat(attach.filter(function (f) { return f.ok; }).map(function (f) { return { name: f.name, size: f.size }; }));
    window.Server.submit(
      { form: form, book: snap.book, pages: snap.pages, marks: snap.marks, files: okFiles },
      { honeypot: U.$('#f-homepage').value, openedAt: lab.fast ? Date.now() - 1200 : openedAt, captchaOk: capOk }
    ).then(function (res) {
      if (!res.ok) {
        busy = false; btn.disabled = false; btn.innerHTML = ic('send') + '구성표 보내기';
        var fe = U.$('#formErr'); fe.hidden = false; fe.innerHTML = ic('alert') + '<span>' + esc(res.error) + '</span>';
        fe.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
      done(res, form, snap, okFiles.length);
    });
  }

  function done(res, form, snap, nFiles) {
    window.Pick.afterSend();
    attach = [];
    window.scrollTo(0, 0);
    var spam = res.spam;
    root.innerHTML = '<div class="sapp">' + backHead() +
      '<div class="done">' +
      '<div class="card dcard reveal">' +
      '<div class="d-ic">' + ic('check') + '</div><p class="d-k">구성표를 받았어요</p>' +
      '<div class="d-no num" id="dNo">' + res.no + '</div>' +
      '<button type="button" class="btn btn-sm btn-secondary" data-copy="' + res.no + '">' + ic('copy', 'ic-s') + '번호 복사</button>' +
      '<ol class="dsteps">' +
      '<li class="ok">' + ic('check', 'ic-s') + '<span>서버에 먼저 저장했어요</span><small class="num">' + U.hm(new Date()) + '</small></li>' +
      '<li class="ok">' + ic('check', 'ic-s') + '<span>구성표 번호를 받았어요</span><small class="num">오늘 ' + Number(res.no.slice(-4)) + '번째</small></li>' +
      '<li class="' + (spam ? 'neu' : 'run') + '" id="mailStep">' + (spam ? ic('x', 'ic-s') + '<span>메일은 보내지 않았어요</span>' : '<span class="spin"></span><span>담당자와 선생님께 메일 보내는 중</span>') + '</li>' +
      '</ol>' +
      '<div id="mailNote">' + (spam ? '<div class="note neu"><b>데모 설명</b> ' + esc(spam) + ' → 스팸으로 표시해 저장만 했어요. 실제로는 보낸 쪽에 똑같이 \'받았어요\'만 보여 줘요.</div>' : '') + '</div>' +
      '<div class="d-a"><a class="btn btn-primary btn-lg" href="#admin" data-focus="' + res.no + '">관리 화면에서 확인하기</a><button type="button" class="btn btn-ghost btn-lg" data-new>새 구성표 만들기</button></div>' +
      '</div>' +
      '<div class="card dsum"><h3>보낸 내용</h3><dl class="dl">' +
      '<div><dt>기관</dt><dd>' + esc(form.org) + '</dd></div><div><dt>품목</dt><dd>' + U.bookName(snap.book) + '</dd></div>' +
      '<div><dt>수량</dt><dd class="num">' + U.num(form.qty) + '부</dd></div><div><dt>받을 날</dt><dd class="num">' + form.due.replace(/-/g, '.') + '</dd></div>' +
      '<div><dt>쪽 수</dt><dd class="num">' + snap.pages.length + '쪽</dd></div><div><dt>첨부</dt><dd class="num">' + nFiles + '개</dd></div></dl></div>' +
      '</div></div>';
    var link = root.querySelector('[data-focus]');
    link.addEventListener('click', function () { window.Admin.focus(res.no, true); });
    if (spam) return;
    window.Server.sendMail(res.no, lab.mailFail).then(function (r) {
      var st = U.$('#mailStep'), nt = U.$('#mailNote');
      if (!st) return;
      if (r.ok) { st.className = 'ok'; st.innerHTML = ic('check', 'ic-s') + '<span>담당자와 선생님께 메일을 보냈어요</span>'; }
      else {
        st.className = 'bad'; st.innerHTML = ic('alert', 'ic-s') + '<span>메일을 보내지 못했어요</span>';
        nt.innerHTML = '<div class="note warn"><b>구성표는 안전하게 저장돼 있어요.</b> 담당자가 관리 화면에서 \'메일 실패\' 표시를 보고 연락드려요.</div>';
      }
    });
  }

  window.Send = { init: mount, show: show, state: function () { return { openedAt: openedAt, capOk: capOk, attach: attach, lab: lab }; },
    _age: function (ms) { openedAt -= ms; } };
})();
