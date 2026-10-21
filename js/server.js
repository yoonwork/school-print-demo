/* =====================================================================
   server.js — 브라우저 안의 '가짜 서버' (데모 전용)
   ---------------------------------------------------------------------
   실제 제품에서는 이 일을 PHP 파일들이 해요. 함수 이름을 실제 파일과
   맞춰 두었어요.
     submit()   → api/submit.php   : 스팸 검사 → DB 저장 → 번호 발급
     sendMail() → lib/mail.php     : PHPMailer, SMTP 465, 실패하면 기록
     list/get   → admin/list.php, admin/view.php (로그인해야 열려요)
     apiGet()   → api/v1/spread.php: 번호 + API 키(서버끼리만)
   저장은 localStorage에 해요. 같은 브라우저에서만 보여요.
   ===================================================================== */
(function () {
  'use strict';
  var KEY = 'barunjjok_demo_db_v1';
  var RULES = {
    minSeconds: 3,          // 화면을 연 지 3초 안에 보내면 '과속 제출'로 봐요
    rateWindowMin: 10,      // 같은 곳에서 10분에
    rateMax: 5,             // 5번 넘게 보내면 잠시 막아요
    fileMaxMB: 20,          // 파일 하나 20MB
    fileMaxCount: 30,       // 한 번에 30개
    exts: ['hwp', 'hwpx', 'pdf', 'jpg', 'jpeg', 'png', 'ai', 'zip']
  };
  // 데모 API 키. 실제로는 관리 화면에서 만들고, 서버에는 해시만 저장해요.
  var DEMO_KEY = 'demo-2026-7f3a9c1e';

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* 저장소를 못 쓰면 메모리로만 동작 */ }
    return null;
  }
  var mem = null;
  function db() {
    if (mem) return mem;
    mem = load();
    if (!mem) {
      mem = { spreads: JSON.parse(JSON.stringify(window.DATA.SEED)), hits: [], boardsReadAt: '2026-10-21T21:00:00' };
    }
    return mem;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* 무시 */ } }
  function wait(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
  function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }
  function ymd(d) { return d.getFullYear() + pad(d.getMonth() + 1, 2) + pad(d.getDate(), 2); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2) + 'T' + pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2) + ':' + pad(d.getSeconds(), 2); }

  /**
   * 구성표 받기. 메일보다 '저장'이 먼저예요. (메일이 안 가도 구성표를 잃지 않게)
   * payload: { form, pages, marks, files, book }
   * meta:    { honeypot, openedAt, captchaOk }
   * 돌려주는 값: { ok, no, spam, error }
   */
  function submit(payload, meta) {
    return wait(700).then(function () {
      var d = db(), now = new Date();
      // ① 같은 곳에서 너무 자주 보내면 막아요 (실제: IP별로 DB에 기록)
      var since = now.getTime() - RULES.rateWindowMin * 60000;
      d.hits = d.hits.filter(function (t) { return t > since; });
      if (d.hits.length >= RULES.rateMax) {
        return { ok: false, code: 429, error: '같은 곳에서 짧은 시간에 여러 번 보냈어요. 10분 뒤에 다시 보내 주세요.' };
      }
      // ② 캡차를 통과하지 못하면 저장하지 않아요 (실제: 서버가 캡차 회사에 토큰 확인)
      if (!meta.captchaOk) return { ok: false, code: 400, error: '자동 등록 방지 확인을 먼저 해 주세요.' };
      // ③ 숨은 칸·과속 제출은 '스팸 표시'를 붙여 저장만 하고 메일은 보내지 않아요
      var spam = null, secs = (now.getTime() - meta.openedAt) / 1000;
      if (meta.honeypot) spam = '숨은 칸 채움';
      else if (secs < RULES.minSeconds) spam = secs.toFixed(1) + '초 만에 제출';
      d.hits.push(now.getTime());

      // ④ 번호 발급: SP-날짜-그날 순번
      var prefix = 'SP-' + ymd(now) + '-';
      var seq = d.spreads.filter(function (x) { return x.no.indexOf(prefix) === 0; }).length + 1;
      var rec = {
        no: prefix + pad(seq, 4), at: iso(now), org: payload.form.org, person: payload.form.person, phone: payload.form.phone,
        email: payload.form.email, book: payload.book, qty: Number(payload.form.qty), due: payload.form.due, msg: payload.form.msg,
        pages: payload.pages, marks: payload.marks, files: payload.files,
        mail: spam ? 'skipped' : 'sending', mailLog: spam ? ['스팸으로 거름: 메일 보내지 않음'] : [], spam: spam
      };
      d.spreads.unshift(rec);
      save();
      return { ok: true, no: rec.no, spam: spam };
    });
  }

  /** 메일 보내기(사내 메일 + 고객 접수 확인 메일). fail=true면 실패를 흉내 내요. */
  function sendMail(no, fail) {
    return wait(1400).then(function () {
      var rec = get(no);
      if (!rec) return { ok: false };
      var t = new Date(), hm = pad(t.getMonth() + 1, 2) + '.' + pad(t.getDate(), 2) + ' ' + pad(t.getHours(), 2) + ':' + pad(t.getMinutes(), 2);
      if (fail) {
        rec.mail = 'failed';
        rec.mailLog.push(hm + ' 사내 메일 실패: SMTP 465 연결 시간 초과');
      } else {
        rec.mail = 'sent';
        rec.mailLog.push(hm + ' 사내 메일 보냄', hm + ' 고객 접수 확인 메일 보냄');
      }
      save();
      return { ok: !fail };
    });
  }

  function list() { return db().spreads.slice(); }
  function get(no) { return db().spreads.filter(function (x) { return x.no === no; })[0] || null; }
  function remove(nos) {
    var d = db();
    d.spreads = d.spreads.filter(function (x) { return nos.indexOf(x.no) < 0; });
    save();
  }
  function setSpam(no, flag) {
    var rec = get(no);
    if (rec) { rec.spam = flag ? '관리자가 스팸으로 표시' : null; save(); }
  }
  function touchBoards() { db().boardsReadAt = iso(new Date()); save(); return db().boardsReadAt; }
  function boardsReadAt() { return db().boardsReadAt; }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) { /* 무시 */ } mem = null; }

  /**
   * 사내 시스템용 API 흉내. 실제 주소: GET /api/v1/spread.php?no=번호  (머리글 X-Api-Key)
   * 키가 없거나 틀리면 401, 번호가 없으면 404. 번호만으로는 절대 열리지 않아요.
   */
  function apiGet(no, key) {
    return wait(350).then(function () {
      if (!key) return { status: 401, body: { ok: false, error: 'missing_api_key', message: 'X-Api-Key 머리글이 필요해요.' } };
      if (key !== DEMO_KEY) return { status: 401, body: { ok: false, error: 'invalid_api_key', message: 'API 키가 맞지 않아요.' } };
      var rec = get(no);
      if (!rec) return { status: 404, body: { ok: false, error: 'not_found', message: '그 번호의 구성표가 없어요.' } };
      var byId = {};
      window.DATA.SAMPLES.forEach(function (x) { byId[x.id] = x; });
      var exp = Math.floor(Date.now() / 1000) + 600;
      return {
        status: 200,
        body: {
          ok: true,
          spread: {
            no: rec.no, created_at: rec.at.replace('T', ' '), book: rec.book === 'read' ? '독서기록장' : '학습플래너',
            org: rec.org, contact: { name: rec.person, phone: rec.phone, email: rec.email },
            quantity: rec.qty, due_date: rec.due, message: rec.msg, spam: !!rec.spam, mail_status: rec.mail,
            pages: rec.pages.map(function (p, i) {
              var smp = byId[p.sid] || {};
              return {
                order: i + 1, sample_id: p.sid, board: smp.board, wr_id: smp.wr, title: smp.title,
                thumb_url: '/thumb/' + smp.board + '/' + smp.wr + '.jpg',
                replace_file: p.rep ? p.rep.name : null,
                marks: (rec.marks && rec.marks[i]) ? rec.marks[i].length : 0
              };
            }),
            files: (rec.files || []).map(function (f, i) {
              return { name: f.name, size: f.size, url: '/api/v1/file.php?no=' + rec.no + '&f=' + (i + 1) + '&exp=' + exp + '&sig=…' };
            })
          }
        }
      };
    });
  }

  window.Server = {
    RULES: RULES, DEMO_KEY: DEMO_KEY, submit: submit, sendMail: sendMail, list: list, get: get, remove: remove,
    setSpam: setSpam, apiGet: apiGet, touchBoards: touchBoards, boardsReadAt: boardsReadAt, reset: reset
  };
})();
