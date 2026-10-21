/* =====================================================================
   art.js — 데모 샘플 그림(SVG)을 그려요.
   ---------------------------------------------------------------------
   실제 운영에서는 이 파일이 필요 없어요. 서버가 게시판 첫 첨부 그림으로
   만든 썸네일 주소(<img src="/thumb/item01_1/41.jpg">)를 대신 보여줘요.
   크기: 가로 140, 세로 198 (원본 평균 1400×1970과 같은 비율)
   ===================================================================== */
(function () {
  'use strict';
  var W = 140, H = 198;
  var FONT = 'font-family="Pretendard Variable,Pretendard,Apple SD Gothic Neo,sans-serif"';
  var LINE = '#D5DAE0', SUB = '#7A8491', INK = '#3A4350';

  function t(x, y, str, size, fill, weight, anchor) {
    return '<text x="' + x + '" y="' + y + '" ' + FONT + ' font-size="' + size + '" font-weight="' + (weight || 600) +
      '" fill="' + fill + '" text-anchor="' + (anchor || 'middle') + '">' + str + '</text>';
  }
  function r(x, y, w, h, fill, rx, extra) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (rx || 0) + '" fill="' + fill + '"' + (extra || '') + '/>';
  }
  function ln(x1, y1, x2, y2, c, w) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (c || LINE) + '" stroke-width="' + (w || 0.6) + '"/>';
  }
  function lines(x1, x2, y0, y1, gap) {
    var o = '';
    for (var y = y0; y <= y1; y += gap) o += ln(x1, y, x2, y);
    return o;
  }
  function head(title, c) {
    return r(0, 0, W, 26, c[0]) + t(12, 17, title, 8, c[1], 700, 'start');
  }
  function field(x, y, label, w) {
    return t(x, y, label, 5.2, SUB, 500, 'start') + ln(x + 20, y + 1, x + w, y + 1, '#C9CFD6', 0.6);
  }
  function star(cx, cy, rr, fill) {
    var p = [];
    for (var i = 0; i < 10; i++) {
      var a = Math.PI / 5 * i - Math.PI / 2, rad = i % 2 ? rr * 0.45 : rr;
      p.push((cx + Math.cos(a) * rad).toFixed(1) + ',' + (cy + Math.sin(a) * rad).toFixed(1));
    }
    return '<polygon points="' + p.join(' ') + '" fill="' + fill + '" stroke="#C9A43A" stroke-width=".5"/>';
  }

  // ----- 표지 무늬 -----
  var MOTIF = {
    forest: function (c) {
      return '<ellipse cx="70" cy="146" rx="62" ry="10" fill="' + c[1] + '" opacity=".12"/>' +
        r(32, 112, 4, 30, c[1], 1) + '<circle cx="34" cy="106" r="15" fill="' + c[1] + '" opacity=".75"/>' +
        r(68, 100, 5, 42, c[1], 1) + '<circle cx="70" cy="92" r="21" fill="' + c[1] + '"/>' +
        r(104, 116, 4, 26, c[1], 1) + '<circle cx="106" cy="110" r="13" fill="' + c[1] + '" opacity=".55"/>' +
        r(56, 128, 28, 14, '#fff', 2, ' opacity=".9"') + ln(70, 128, 70, 142, c[1], 0.8);
    },
    whale: function (c) {
      return '<path d="M30 104 C30 84 56 76 76 80 C100 84 110 98 108 108 C116 104 122 96 128 98 C124 106 122 114 128 122 C120 122 114 116 108 114 C100 128 80 134 60 130 C42 127 30 118 30 104Z" fill="' + c[1] + '"/>' +
        '<circle cx="50" cy="100" r="2.2" fill="#fff"/>' +
        '<path d="M58 76 C56 68 60 64 62 60 M62 76 C64 68 70 66 72 62" stroke="' + c[1] + '" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M14 142 q8 -5 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" stroke="' + c[1] + '" stroke-width="1.2" fill="none" opacity=".5"/>' +
        '<path d="M14 150 q8 -5 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" stroke="' + c[1] + '" stroke-width="1.2" fill="none" opacity=".3"/>';
    },
    pencil: function (c) {
      return '<g transform="rotate(-32 70 110)">' + r(28, 102, 70, 16, c[1], 1) + r(28, 102, 70, 5, '#fff', 0, ' opacity=".25"') +
        r(16, 102, 12, 16, '#E79A8E', 2) + r(26, 102, 4, 16, '#B8BEC6') +
        '<polygon points="98,102 114,110 98,118" fill="#F1D9B5"/><polygon points="108,107 114,110 108,113" fill="' + INK + '"/></g>' +
        ln(24, 150, 116, 150, c[1], 0.8);
    },
    stars: function (c) {
      var o = '<circle cx="98" cy="84" r="14" fill="' + c[1] + '"/><circle cx="104" cy="80" r="12" fill="' + c[0] + '"/>';
      var pts = [[24, 76], [40, 96], [62, 74], [30, 126], [54, 112], [80, 132], [112, 120], [120, 140], [66, 146], [18, 104], [46, 140], [96, 108]];
      pts.forEach(function (p, i) { o += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i % 3 ? 1 : 1.8) + '" fill="' + c[1] + '"/>'; });
      return o;
    },
    photo: function (c) {
      return r(18, 66, 104, 80, '#fff', 6, ' opacity=".85"') +
        '<rect x="18" y="66" width="104" height="80" rx="6" fill="none" stroke="' + c[1] + '" stroke-dasharray="3 2" stroke-width=".8"/>' +
        '<path d="M44 126 l16 -20 l12 14 l8 -9 l16 15z" fill="' + c[1] + '" opacity=".35"/><circle cx="92" cy="92" r="6" fill="' + c[1] + '" opacity=".35"/>' +
        t(70, 140, '학교 사진 자리', 5.4, c[1], 600);
    },
    photo2: function (c) {
      var o = r(16, 70, 108, 70, '#fff', 4, ' opacity=".9"');
      for (var i = 0; i < 6; i++) o += '<circle cx="' + (30 + i * 16) + '" cy="100" r="5" fill="' + c[1] + '" opacity=".35"/>' + r(24 + i * 16, 106, 12, 14, c[1], 4, ' opacity=".25"');
      return o + t(70, 134, '우리 반 단체 사진', 5.4, c[1], 600);
    },
    stripes: function (c) {
      var o = '';
      for (var y = 62; y < 152; y += 12) o += r(0, y, W, 6, c[1], 0, ' opacity=".14"');
      return o;
    },
    dots: function (c) {
      var o = '';
      for (var y = 70; y < 150; y += 14) for (var x = 16 + ((y / 14) % 2 ? 7 : 0); x < 132; x += 14) o += '<circle cx="' + x + '" cy="' + y + '" r="3" fill="' + c[1] + '" opacity=".22"/>';
      return o;
    },
    sprout: function (c) {
      return '<path d="M52 122 h36 l-5 24 h-26z" fill="' + c[1] + '" opacity=".8"/>' + r(48, 116, 44, 7, c[1], 2) +
        '<path d="M70 116 V92" stroke="' + c[1] + '" stroke-width="2"/>' +
        '<ellipse cx="58" cy="90" rx="13" ry="6" fill="' + c[1] + '" opacity=".6" transform="rotate(-25 58 90)"/>' +
        '<ellipse cx="82" cy="84" rx="14" ry="6.5" fill="' + c[1] + '" opacity=".85" transform="rotate(25 82 84)"/>';
    },
    gridm: function (c) {
      var o = r(22, 66, 96, 80, '#fff', 4, ' opacity=".8"');
      for (var x = 22; x <= 118; x += 8) o += ln(x, 66, x, 146, c[1], 0.3);
      for (var y = 66; y <= 146; y += 8) o += ln(22, y, 118, y, c[1], 0.3);
      return o + '<path d="M36 128 l14 -16 l12 8 l16 -22 l20 12" stroke="' + c[1] + '" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    },
    school: function (c) {
      return r(30, 96, 80, 48, '#fff', 2, ' opacity=".9"') + '<polygon points="26,98 70,72 114,98" fill="' + c[1] + '"/>' +
        r(62, 120, 16, 24, c[1], 1, ' opacity=".8"') +
        [38, 50, 84, 96].map(function (x) { return r(x, 104, 8, 8, c[1], 1, ' opacity=".35"'); }).join('') +
        ln(70, 72, 70, 58, c[1], 1) + '<polygon points="70,58 82,62 70,66" fill="#E5484D" opacity=".8"/>' + ln(12, 144, 128, 144, c[1], 1);
    },
    check: function (c) {
      var o = '';
      for (var x = 0; x < W; x += 16) o += r(x, 60, 8, 92, c[1], 0, ' opacity=".1"');
      for (var y = 60; y < 152; y += 16) o += r(0, y, W, 8, c[1], 0, ' opacity=".1"');
      return o;
    },
    plain: function (c) { return ln(30, 106, 110, 106, c[1], 0.8) + ln(30, 110, 110, 110, c[1], 0.4); }
  };

  function cover(a) {
    var c = a.c, dark = (a.m === 'stars' || a.m === 'plain');
    var labelFill = dark ? 'rgba(255,255,255,.12)' : '#fff';
    var lab = dark ? c[1] : SUB;
    return r(0, 0, W, H, c[0]) +
      t(70, 36, a.h, 15, c[1], 800) + t(70, 50, '2027 · ○○초등학교', 6, c[1], 500) +
      MOTIF[a.m](c) +
      r(16, 162, 108, 22, labelFill, 4) +
      t(24, 175.5, '학년', 5.2, lab, 500, 'start') + t(50, 175.5, '반', 5.2, lab, 500, 'start') + t(72, 175.5, '이름', 5.2, lab, 500, 'start') +
      ln(86, 177, 116, 177, dark ? c[1] : '#C9CFD6', 0.6);
  }

  function divider(a) {
    var c = a.c;
    return r(0, 0, W, H, c[0]) + '<circle cx="70" cy="86" r="34" fill="#fff" opacity=".55"/>' +
      t(70, 94, a.h, a.h.length > 3 ? 16 : 22, c[1], 800) + t(70, 136, a.sub, 6.4, c[1], 500) +
      ln(52, 146, 88, 146, c[1], 0.8) + '<circle cx="70" cy="160" r="2" fill="' + c[1] + '"/>';
  }

  function booklist(a) {
    var c = a.c, o = r(0, 0, W, H, '#fff') + head(a.h, c);
    o += r(10, 34, 120, 10, '#F3F5F7') + t(16, 41, '번호', 4.8, SUB, 600, 'start') + t(34, 41, '책 제목', 4.8, SUB, 600, 'start') +
      t(92, 41, '지은이', 4.8, SUB, 600, 'start') + t(124, 41, '읽음', 4.8, SUB, 600, 'end');
    var rows = 14;
    for (var i = 0; i < rows; i++) {
      var y = 44 + i * 10.4;
      o += ln(10, y + 10.4, 130, y + 10.4, '#E6E9ED', 0.5) + t(19, y + 7, a.n ? String(i + 1) : '', 4.6, SUB, 500);
      if (a.n) o += r(34, y + 3.6, 34 + (i * 7) % 22, 3.4, '#DCE0E5', 1.5) + r(92, y + 3.6, 14 + (i * 5) % 8, 3.4, '#E6E9ED', 1.5);
      o += '<rect x="118" y="' + (y + 2.6) + '" width="5" height="5" rx="1" fill="none" stroke="#C9CFD6" stroke-width=".5"/>';
    }
    return o + t(70, 192, a.n ? '총 ' + a.n + '권 중 1쪽' : '읽고 싶은 책을 직접 적어요', 4.8, SUB, 500);
  }

  var INNER = {
    readlog: function (c) {
      return head('독서 기록', c) + field(12, 40, '읽은 날', 66) + field(72, 40, '쪽수', 128) + field(12, 52, '책 제목', 128) +
        field(12, 64, '지은이', 66) + field(72, 64, '출판사', 128) +
        t(12, 82, '기억에 남는 장면', 5.6, INK, 600, 'start') + r(12, 86, 116, 44, '#F6F7F9', 3) +
        t(12, 144, '느낀 점', 5.6, INK, 600, 'start') + lines(12, 128, 154, 188, 8.5);
    },
    readlog2: function (c) {
      var o = head('별점 독서기록', c) + field(12, 40, '책 제목', 128) + field(12, 52, '지은이', 66) + field(72, 52, '읽은 날', 128) +
        t(12, 70, '내 별점', 5.6, INK, 600, 'start');
      for (var i = 0; i < 5; i++) o += star(46 + i * 12, 68, 4.6, i < 3 ? '#F6D36B' : '#fff');
      return o + t(12, 88, '친구에게 추천하는 이유', 5.6, INK, 600, 'start') + lines(12, 128, 98, 140, 8.5) +
        t(12, 156, '한 줄 평', 5.6, INK, 600, 'start') + r(12, 162, 116, 22, c[0], 4);
    },
    drawlog: function (c) {
      return head('그림으로 남기기', c) + field(12, 40, '책 제목', 128) +
        r(12, 48, 116, 92, '#fff', 4, ' stroke="#C9CFD6" stroke-width=".6"') + t(70, 98, '가장 기억에 남는 장면을 그려요', 5, '#A3ABB5', 500) +
        lines(12, 128, 152, 188, 9);
    },
    lined: function () {
      return t(12, 18, '날짜', 5.2, SUB, 500, 'start') + ln(26, 19, 70, 19, '#C9CFD6') + lines(12, 128, 32, 190, 8);
    },
    grid: function () {
      var o = t(12, 18, '날짜', 5.2, SUB, 500, 'start') + ln(26, 19, 70, 19, '#C9CFD6');
      for (var x = 12; x <= 128; x += 5.8) o += ln(x, 28, x, 190, '#E3E7EB', 0.4);
      for (var y = 28; y <= 190; y += 5.8) o += ln(12, y, 128, y, '#E3E7EB', 0.4);
      return o;
    },
    mindmap: function (c) {
      var o = head('생각 그물', c), pts = [[30, 62], [70, 50], [110, 62], [114, 130], [70, 150], [26, 130]];
      pts.forEach(function (p) {
        o += ln(70, 100, p[0], p[1], '#B8C0CA', 0.8) + '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="17" ry="10" fill="#fff" stroke="#C9CFD6" stroke-width=".6"/>';
      });
      return o + '<ellipse cx="70" cy="100" rx="26" ry="15" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width=".8"/>' +
        t(70, 102, '책 제목', 6, c[1], 700) + t(70, 182, '책을 읽고 떠오른 낱말을 이어 봐요', 5, SUB, 500);
    },
    characters: function (c) {
      var o = head('등장인물 소개', c);
      for (var i = 0; i < 3; i++) {
        var y = 36 + i * 52;
        o += r(10, y, 120, 46, '#F7F8FA', 4) + '<circle cx="30" cy="' + (y + 23) + '" r="14" fill="#fff" stroke="#C9CFD6" stroke-width=".6"/>' +
          field(52, y + 14, '이름', 124) + field(52, y + 27, '성격', 124) + field(52, y + 40, '한 일', 124);
      }
      return o;
    },
    quote: function (c) {
      return head('책 속 한 문장', c) + t(20, 62, '“', 28, c[1], 700, 'start') + r(14, 70, 112, 56, c[0], 4, ' opacity=".6"') +
        lines(20, 120, 82, 118, 9) + field(12, 142, '책 제목', 128) + field(12, 156, '쪽', 50) +
        t(12, 174, '이 문장을 고른 까닭', 5.6, INK, 600, 'start') + ln(12, 186, 128, 186);
    },
    weekly: function (c) {
      var o = head('주간 계획표', c) + field(12, 38, '기간', 100), d = ['월', '화', '수', '목', '금', '토', '일'];
      d.forEach(function (x, i) {
        var y = 46 + i * 20.5;
        o += r(10, y, 120, 18, i > 4 ? '#F7F8FA' : '#fff', 3, ' stroke="#E3E7EB" stroke-width=".5"') + t(18, y + 11.5, x, 6, c[1], 700) +
          ln(28, y + 6.5, 112, y + 6.5, '#E6E9ED', 0.5) + ln(28, y + 12.5, 112, y + 12.5, '#E6E9ED', 0.5) +
          '<rect x="117" y="' + (y + 6) + '" width="6" height="6" rx="1.2" fill="none" stroke="#C9CFD6" stroke-width=".6"/>';
      });
      return o + t(12, 196, '이번 주 다짐 ________________', 5, SUB, 500, 'start');
    },
    monthly: function (c) {
      var o = head('____ 월', c), d = ['일', '월', '화', '수', '목', '금', '토'], cw = 120 / 7;
      d.forEach(function (x, i) { o += t(10 + cw * i + cw / 2, 40, x, 5.2, i === 0 ? '#C0453F' : SUB, 600); });
      for (var rr = 0; rr <= 5; rr++) o += ln(10, 46 + rr * 26, 130, 46 + rr * 26, '#E3E7EB', 0.5);
      for (var cc = 0; cc <= 7; cc++) o += ln(10 + cc * cw, 46, 10 + cc * cw, 176, '#E3E7EB', 0.5);
      return o + t(12, 190, '이달의 목표', 5.6, INK, 600, 'start') + ln(44, 191, 128, 191);
    },
    timetable: function (c) {
      var o = head('하루 공부 시간', c) + field(12, 38, '날짜', 70);
      for (var i = 0; i < 16; i++) {
        var y = 46 + i * 9;
        o += t(18, y + 6.4, String(6 + i), 4.8, SUB, 500) + ln(26, y, 130, y, '#E3E7EB', 0.5);
        for (var k = 1; k < 6; k++) o += ln(26 + k * 17.3, y, 26 + k * 17.3, y + 9, '#EEF0F3', 0.4);
      }
      return o + r(43, 64, 52, 9, c[0], 1.5) + r(26, 109, 35, 9, c[0], 1.5) + t(12, 196, '오늘 공부한 시간 ___시간 ___분', 5, SUB, 500, 'start');
    },
    goal: function (c) {
      var o = head('나의 목표', c) + t(12, 42, '이번 학기 목표', 5.8, INK, 600, 'start') + r(12, 47, 116, 22, c[0], 4);
      for (var i = 0; i < 9; i++) {
        var y = 84 + i * 11;
        o += '<rect x="12" y="' + (y - 5) + '" width="6" height="6" rx="1.2" fill="none" stroke="#C9CFD6" stroke-width=".6"/>' + ln(22, y + 1, 128, y + 1);
      }
      return o + t(12, 190, '다짐 한 줄 ______________________', 5, SUB, 500, 'start');
    },
    wrong: function (c) {
      return head('오답 노트', c) + field(12, 38, '과목', 60) + field(66, 38, '단원', 128) +
        r(12, 46, 56, 10, '#F3F5F7') + t(40, 53, '문제', 5.2, SUB, 600) + r(72, 46, 56, 10, '#F3F5F7') + t(100, 53, '바른 풀이', 5.2, SUB, 600) +
        '<rect x="12" y="56" width="56" height="78" fill="none" stroke="#E3E7EB" stroke-width=".5"/><rect x="72" y="56" width="56" height="78" fill="none" stroke="#E3E7EB" stroke-width=".5"/>' +
        t(12, 150, '왜 틀렸나요?', 5.6, INK, 600, 'start') + lines(12, 128, 160, 190, 9.5);
    }
  };

  function svg(sample) {
    var a = sample.art, body;
    if (a.t === 'cover') body = cover(a);
    else if (a.t === 'divider') body = divider(a);
    else if (a.t === 'booklist') body = booklist(a);
    else body = r(0, 0, W, H, '#fff') + INNER[a.t](a.c || ['#EEF0F3', '#4E5968']);
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' + body + '</svg>';
  }

  // 펜·글상자 표시를 그리는 덧그림(관리 화면에서도 같은 함수로 '보낸 그대로' 보여줘요)
  function marks(list) {
    if (!list || !list.length) return '';
    return list.map(function (m) {
      if (m.k === 'pen') {
        return '<polyline points="' + m.pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') +
          '" fill="none" stroke="#E5484D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>';
      }
      var words = wrap(m.t, 12), h = 6 + words.length * 7, w = Math.min(84, 8 + Math.max.apply(null, words.map(function (x) { return x.length; })) * 5.6);
      var x = Math.min(Math.max(m.x, 2), W - w - 2), y = Math.min(Math.max(m.y, 2), H - h - 2);
      return '<g><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2" fill="#FFF4C2" stroke="#E2BE45" stroke-width=".6"/>' +
        words.map(function (line, i) { return t(x + 4, y + 9 + i * 7, esc(line), 5.4, '#5A4300', 600, 'start'); }).join('') + '</g>';
    }).join('');
  }
  function wrap(s, n) {
    var out = [], cur = '';
    String(s).split(' ').forEach(function (w) {
      if ((cur + ' ' + w).trim().length > n && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
    });
    if (cur) out.push(cur);
    return out.slice(0, 4);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }

  window.Art = { W: W, H: H, svg: svg, marks: marks };
})();
