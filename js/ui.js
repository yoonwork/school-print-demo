/* =====================================================================
   ui.js — 여러 화면이 같이 쓰는 작은 도구들
   - $, esc, ic(아이콘), toast(알림), modal(대화상자)
   - Viewer: 양면·한 쪽 넘겨 보기 + 펜·글상자 표시
     (선생님 화면과 관리 화면이 같은 코드를 써서 '보낸 그대로' 보여요)
   ===================================================================== */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ic(name, cls) { return '<svg class="ic ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }
  function size(b) { return b >= 1048576 ? (b / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round(b / 1024)) + 'KB'; }
  function num(n) { return Number(n).toLocaleString('ko-KR'); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dt(isoStr, withYear) {
    var d = new Date(isoStr);
    return (withYear ? d.getFullYear() + '.' : '') + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function hm(d) {
    var h = d.getHours();
    return (h < 12 ? '오전 ' : '오후 ') + ((h % 12) || 12) + ':' + pad(d.getMinutes());
  }
  var sampleMap = null;
  function sample(id) {
    if (!sampleMap) { sampleMap = {}; window.DATA.SAMPLES.forEach(function (x) { sampleMap[x.id] = x; }); }
    return sampleMap[id];
  }
  // 단계 막대 (1 고르기 → 2 순서 → 3 보내기)
  function stepbar(n) {
    return '<div class="stepbar" role="img" aria-label="3단계 중 ' + n + '단계"><div class="pbar"><i style="width:' + Math.round(n / 3 * 100) + '%"></i></div>' +
      '<p class="pbar-t"><b class="num">' + n + '</b>/3 · ' + ['샘플 고르기', '순서 정하기', '보내기'][n - 1] + '</p></div>';
  }
  function partName(p) { return { cover: '표지', divider: '간지', booklist: '도서목록', inner: '내지' }[p] || p; }
  function bookName(b) { return b === 'plan' ? '학습플래너' : '독서기록장'; }

  // ----- 알림(토스트) -----
  var toastTimer = null;
  function toast(msg, kind) {
    var el = $('#toast');
    el.innerHTML = '<div class="toast"><span class="ok-ic ' + (kind || '') + '">' + ic(kind === 'bad' ? 'alert' : 'check', 'ic-xs') + '</span><span>' + esc(msg) + '</span></div>';
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('on'); }, 2600);
  }

  // ----- 대화상자 -----
  var lastFocus = null;
  function modal(html, opts) {
    opts = opts || {};
    closeModal();
    lastFocus = document.activeElement;
    var root = $('#modal-root');
    root.innerHTML = '<div class="modal ' + (opts.cls || '') + '" role="dialog" aria-modal="true" aria-label="' + esc(opts.label || '') + '"><div class="mbox">' + html + '</div></div>';
    var m = root.firstChild;
    m.addEventListener('click', function (e) { if (e.target === m) closeModal(); });
    document.body.classList.add('noscroll');
    var f = m.querySelector('[data-autofocus]') || m.querySelector('button');
    if (f) f.focus({ preventScroll: true });
    return m;
  }
  function closeModal() {
    var root = $('#modal-root');
    if (!root.firstChild) return;
    root.innerHTML = '';
    document.body.classList.remove('noscroll');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  function confirmBox(title, body, okLabel, onOk) {
    var m = modal('<div class="cbox"><h3>' + esc(title) + '</h3><p>' + esc(body) + '</p><div class="cbox-a">' +
      '<button class="btn btn-secondary" data-x>닫기</button><button class="btn btn-danger-solid" data-ok data-autofocus>' + esc(okLabel) + '</button></div></div>',
      { cls: 'small', label: title });
    m.querySelector('[data-x]').onclick = closeModal;
    m.querySelector('[data-ok]').onclick = function () { closeModal(); onOk(); };
  }

  // =====================================================================
  // Viewer — 양면·한 쪽 넘겨 보기와 펜·글상자 표시
  // o = { pages:[{sid,rep}], marksOf(i), editable, onAdd(i,m), onUndo(i), title, note }
  // =====================================================================
  var V = null;
  function spreads(n, mode) {
    var out = [];
    if (!n) return out;
    if (mode === 'single') { for (var i = 0; i < n; i++) out.push([i]); return out; }
    out.push([0]); // 1쪽(앞표지)은 오른쪽에 혼자
    for (var k = 1; k < n; k += 2) out.push(k + 1 < n ? [k, k + 1] : [k]);
    return out;
  }
  function openViewer(o) {
    V = { o: o, mode: 'spread', at: 0, tool: null };
    var start = o.start || 0;
    var sp = spreads(o.pages.length, V.mode);
    sp.forEach(function (s, idx) { if (s.indexOf(start) >= 0) V.at = idx; });
    var m = modal(
      '<div class="vhead"><div class="vt"><h3>' + esc(o.title || '미리보기') + '</h3><p>' + esc(o.note || '') + '</p></div>' +
      '<div class="seg" role="group" aria-label="보기 방식"><button type="button" data-mode="spread" aria-pressed="true">양면</button><button type="button" data-mode="single" aria-pressed="false">한 쪽</button></div>' +
      '<button class="ib" data-close aria-label="미리보기 닫기">' + ic('x') + '</button></div>' +
      '<div class="vstage" id="vstage"></div>' +
      '<div class="vfoot">' +
      (o.editable ?
        '<div class="vtools" role="group" aria-label="표시 도구">' +
        '<button type="button" class="tool" data-tool="pen" aria-pressed="false">' + ic('pen') + '<span>펜</span></button>' +
        '<button type="button" class="tool" data-tool="text" aria-pressed="false">' + ic('textbox') + '<span>글상자</span></button>' +
        '<button type="button" class="tool" data-undo>' + ic('undo') + '<span>되돌리기</span></button></div>'
        : '<p class="vro">' + ic('eye', 'ic-s') + '선생님이 보낸 표시 그대로예요</p>') +
      '<div class="vpager"><button class="ib" data-prev aria-label="앞 쪽">' + ic('left') + '</button><span id="vpos" class="num"></span>' +
      '<button class="ib" data-next aria-label="다음 쪽">' + ic('right') + '</button></div></div>',
      { cls: 'viewer', label: o.title || '미리보기' });
    m.querySelector('[data-close]').onclick = closeModal;
    m.querySelector('[data-prev]').onclick = function () { go(-1); };
    m.querySelector('[data-next]').onclick = function () { go(1); };
    $$('[data-mode]', m).forEach(function (b) {
      b.onclick = function () {
        var first = spreads(V.o.pages.length, V.mode)[V.at][0];
        V.mode = b.getAttribute('data-mode');
        $$('[data-mode]', m).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        spreads(V.o.pages.length, V.mode).forEach(function (s, idx) { if (s.indexOf(first) >= 0) V.at = idx; });
        drawSpread();
      };
    });
    $$('[data-tool]', m).forEach(function (b) {
      b.onclick = function () {
        var t = b.getAttribute('data-tool');
        V.tool = V.tool === t ? null : t;
        $$('[data-tool]', m).forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-tool') === V.tool)); });
        $('#vstage').classList.toggle('drawing', !!V.tool);
      };
    });
    var u = m.querySelector('[data-undo]');
    if (u) u.onclick = function () {
      var s = spreads(V.o.pages.length, V.mode)[V.at];
      for (var k = s.length - 1; k >= 0; k--) { if ((V.o.marksOf(s[k]) || []).length) { V.o.onUndo(s[k]); break; } }
      drawSpread();
    };
    m.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    });
    drawSpread();
  }
  function go(d) {
    var n = spreads(V.o.pages.length, V.mode).length;
    V.at = Math.max(0, Math.min(n - 1, V.at + d));
    drawSpread();
  }
  function pageHTML(i) {
    var p = V.o.pages[i], smp = sample(p.sid);
    return '<div class="vpage" data-i="' + i + '"><div class="paper">' + window.Art.svg(smp) + '</div>' +
      '<svg class="ov" viewBox="0 0 140 198" preserveAspectRatio="none">' + window.Art.marks(V.o.marksOf(i)) + '</svg>' +
      (p.rep ? '<div class="vrep">' + ic('clip', 'ic-s') + '<span>내 원고로 교체 · ' + esc(p.rep.name) + '</span></div>' : '') +
      '<div class="vno"><b class="num">' + (i + 1) + '</b><span>' + esc(smp.title) + '</span></div></div>';
  }
  function drawSpread() {
    var st = $('#vstage'), all = spreads(V.o.pages.length, V.mode);
    if (!all.length) { st.innerHTML = '<div class="empty"><h4>담은 쪽이 없어요</h4><p>샘플을 담으면 여기에서 넘겨 볼 수 있어요.</p></div>'; $('#vpos').textContent = ''; return; }
    var s = all[V.at], html = '<div class="spread ' + V.mode + '">';
    if (V.mode === 'spread' && s.length === 1 && s[0] === 0) html += '<div class="vpage blank" aria-hidden="true"></div>';
    s.forEach(function (i) { html += pageHTML(i); });
    if (V.mode === 'spread' && s.length === 1 && s[0] !== 0) html += '<div class="vpage blank" aria-hidden="true"></div>';
    st.innerHTML = html + '</div>';
    $('#vpos').textContent = (s.length === 2 ? (s[0] + 1) + '–' + (s[1] + 1) : (s[0] + 1)) + ' / ' + V.o.pages.length + '쪽';
    $('[data-prev]').disabled = V.at === 0;
    $('[data-next]').disabled = V.at === all.length - 1;
    if (V.o.editable) $$('.vpage:not(.blank)', st).forEach(bindDraw);
  }
  function pt(ov, e) {
    var r = ov.getBoundingClientRect();
    return [Math.max(0, Math.min(140, (e.clientX - r.left) / r.width * 140)), Math.max(0, Math.min(198, (e.clientY - r.top) / r.height * 198))];
  }
  function bindDraw(pageEl) {
    var ov = pageEl.querySelector('.ov'), i = Number(pageEl.getAttribute('data-i'));
    ov.addEventListener('pointerdown', function (e) {
      if (!V.tool) return;
      e.preventDefault();
      var p0 = pt(ov, e);
      if (V.tool === 'text') { askText(pageEl, i, p0); return; }
      var pts = [p0], line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      line.setAttribute('fill', 'none'); line.setAttribute('stroke', '#F04452'); line.setAttribute('stroke-width', '1.7');
      line.setAttribute('stroke-linecap', 'round'); line.setAttribute('stroke-linejoin', 'round');
      ov.appendChild(line);
      function mv(ev) {
        var q = pt(ov, ev), last = pts[pts.length - 1];
        if (Math.abs(q[0] - last[0]) + Math.abs(q[1] - last[1]) > 1.2) {
          pts.push(q);
          line.setAttribute('points', pts.map(function (p) { return p.join(','); }).join(' '));
        }
      }
      function up() {
        window.removeEventListener('pointermove', mv);
        window.removeEventListener('pointerup', up);
        if (pts.length > 1) V.o.onAdd(i, { k: 'pen', pts: pts.map(function (p) { return [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]; }) });
        drawSpread();
      }
      window.addEventListener('pointermove', mv);
      window.addEventListener('pointerup', up);
    });
  }
  function askText(pageEl, i, p) {
    var old = pageEl.querySelector('.vinput');
    if (old) old.remove();
    var box = document.createElement('div');
    box.className = 'vinput';
    box.style.left = (p[0] / 140 * 100) + '%';
    box.style.top = (p[1] / 198 * 100) + '%';
    box.innerHTML = '<input type="text" maxlength="40" placeholder="남길 말 쓰고 Enter" aria-label="글상자 내용">';
    pageEl.appendChild(box);
    var inp = box.querySelector('input'), done = false;
    function commit() {
      if (done) return; done = true;
      var v = inp.value.trim();
      if (v) V.o.onAdd(i, { k: 'text', x: Math.round(p[0]), y: Math.round(p[1]), t: v });
      drawSpread();
    }
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') { done = true; drawSpread(); e.stopPropagation(); } });
    inp.addEventListener('blur', commit);
    setTimeout(function () { inp.focus(); }, 0);
  }

  window.UI = {
    $: $, $$: $$, esc: esc, ic: ic, size: size, num: num, dt: dt, hm: hm, pad: pad, sample: sample, stepbar: stepbar, partName: partName, bookName: bookName,
    toast: toast, modal: modal, closeModal: closeModal, confirmBox: confirmBox, openViewer: openViewer
  };
})();
