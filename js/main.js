/* =====================================================================
   main.js — 화면 바꾸기(주소 # 뒤)와 맨 위 데모 띠
     #pick 선생님 화면 · #send 보내기 · #admin 관리 · #admin/boards · #api
   ===================================================================== */
(function () {
  'use strict';
  var U = window.UI;
  var ROUTES = [
    { hash: '#pick', label: '선생님 화면', view: 'pick' },
    { hash: '#send', label: '보내기', view: 'send' },
    { hash: '#admin', label: '관리 화면', view: 'admin' },
    { hash: '#api', label: 'API 미리보기', view: 'admin' }
  ];

  function current() {
    var h = location.hash || '#pick';
    if (h.indexOf('#admin/boards') === 0) return { key: '#admin', view: 'admin', tab: 'boards' };
    if (h.indexOf('#admin') === 0) return { key: '#admin', view: 'admin', tab: 'list' };
    if (h.indexOf('#api') === 0) return { key: '#api', view: 'admin', tab: 'api' };
    if (h.indexOf('#send') === 0) return { key: '#send', view: 'send' };
    return { key: '#pick', view: 'pick' };
  }

  function band(key) {
    U.$('#dnav').innerHTML = ROUTES.map(function (r) {
      return '<a href="' + r.hash + '" aria-current="' + (r.hash === key ? 'page' : 'false') + '">' + r.label + '</a>';
    }).join('');
    U.$('#dsel').value = key;
  }

  function route() {
    var c = current();
    U.closeModal();
    document.body.classList.remove('noscroll');
    ['pick', 'send', 'admin'].forEach(function (v) { U.$('#view-' + v).hidden = v !== c.view; });
    document.body.setAttribute('data-view', c.view);
    band(c.key);
    if (c.view === 'pick') window.Pick.show();
    if (c.view === 'send') window.Send.show();
    if (c.view === 'admin') window.Admin.show(c.tab);
    window.scrollTo(0, 0);
  }

  function boot() {
    U.$('#dsel').addEventListener('change', function (e) { location.hash = e.target.value; });
    window.Pick.init();
    window.Send.init();
    window.Admin.init();
    window.addEventListener('hashchange', route);
    route();
  }

  // 데모 확인용 도우미 (콘솔에서 demo.reset() 하면 처음 상태로 돌아가요)
  window.demo = {
    reset: function () {
      try { ['barunjjok_demo_db_v1', 'barunjjok_draft_v1', 'barunjjok_admin_demo'].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) { /* 무시 */ }
      location.reload();
    },
    exampleDraft: function () { window.Pick.loadExample(); },
    route: route
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
