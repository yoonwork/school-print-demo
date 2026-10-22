/* =====================================================================
   data.js — 데모용 샘플(부품) 목록과 미리 넣어 둔 구성표
   ---------------------------------------------------------------------
   실제 운영에서는 이 목록을 서버(PHP)가 그누보드 게시판에서 읽어서
   같은 모양(JSON)으로 내려줘요. 칸 이름을 아래처럼 맞춰 두면
   화면 코드는 고치지 않아도 돼요.

   샘플 한 개의 칸
   - id     : 샘플 번호(화면 표시용)
   - book   : 품목 갈래  read = 독서기록장, plan = 학습플래너
   - part   : 부품 탭    cover 표지 / divider 간지 / booklist 도서목록 / inner 내지
   - cat    : 분류(그누보드 게시판 분류 ca_name)
   - title  : 글 제목(wr_subject)
   - grade  : 인기 등급 0·1·2 (여분 칸 wr_1 등에 저장한다고 가정, 착수 회의에서 확정)
   - hits   : 조회수(wr_hit)
   - date   : 올린 날(wr_datetime)
   - board  : 게시판 아이디(bo_table), wr: 글 번호(wr_id)
   - art    : 데모 그림을 그리는 설정(실제로는 서버 썸네일 주소가 들어가요)
   ===================================================================== */
(function () {
  'use strict';

  // 품목 갈래와 부품 탭. 실제로는 관리 화면의 '게시판 연동' 표에서 읽어요.
  var BOOKS = [
    { key: 'read', name: '독서기록장', parts: [
      { key: 'cover', name: '표지', board: 'item01_1', cats: ['그림', '사진 넣기', '단색'] },
      { key: 'divider', name: '간지', board: 'item01_2', cats: ['학기', '주제'] },
      { key: 'booklist', name: '도서목록', board: 'item01_3', cats: ['학년별', '직접 쓰기'] },
      { key: 'inner', name: '내지', board: 'item01_4', cats: ['독서기록', '독후활동', '노트'] }
    ] },
    { key: 'plan', name: '학습플래너', parts: [
      { key: 'cover', name: '표지', board: 'item02_1', cats: ['그림', '단색'] },
      { key: 'divider', name: '간지', board: 'item02_2', cats: ['월별', '학기', '주제'] },
      { key: 'inner', name: '내지', board: 'item02_3', cats: ['계획', '기록', '노트'] }
    ] }
  ];

  // 그림 색(샘플 그림 전용). 화면 색과는 따로 써요.
  var C = {
    sage: ['#DDE9DA', '#2F5D3A'], sky: ['#DCE8F5', '#244E7A'], butter: ['#F7EDCB', '#7A5A12'],
    peach: ['#F7E0D4', '#8A3E1C'], sand: ['#EEE7DB', '#5E4B32'], mint: ['#D9EFE6', '#1F5E4A'],
    night: ['#26344F', '#F4E7B0'], navy: ['#2C3E66', '#FFFFFF']
  };

  function s(id, book, part, cat, title, grade, hits, date, wr, art) {
    var b = BOOKS.filter(function (x) { return x.key === book; })[0];
    var p = b.parts.filter(function (x) { return x.key === part; })[0];
    return { id: id, book: book, part: part, cat: cat, title: title, grade: grade, hits: hits, date: date, board: p.board, wr: wr, art: art };
  }

  var SAMPLES = [
    // 독서기록장 · 표지
    s('R-C01', 'read', 'cover', '그림', '숲속 도서관', 2, 1284, '2026-09-02', 41, { t: 'cover', m: 'forest', c: C.sage, h: '독서기록장' }),
    s('R-C02', 'read', 'cover', '그림', '책 읽는 고래', 2, 1102, '2026-08-21', 38, { t: 'cover', m: 'whale', c: C.sky, h: '독서기록장' }),
    s('R-C05', 'read', 'cover', '사진 넣기', '우리 학교 사진', 2, 958, '2026-07-14', 33, { t: 'cover', m: 'photo', c: C.sand, h: '독서기록장' }),
    s('R-C03', 'read', 'cover', '그림', '연필 한 자루', 1, 876, '2026-09-18', 44, { t: 'cover', m: 'pencil', c: C.butter, h: '독서기록장' }),
    s('R-C04', 'read', 'cover', '그림', '별 헤는 밤', 1, 642, '2026-10-06', 47, { t: 'cover', m: 'stars', c: C.night, h: '독서기록장' }),
    s('R-C08', 'read', 'cover', '단색', '물방울', 1, 402, '2026-06-30', 29, { t: 'cover', m: 'dots', c: C.sky, h: '독서기록장' }),
    s('R-C07', 'read', 'cover', '단색', '줄무늬', 0, 540, '2026-05-12', 21, { t: 'cover', m: 'stripes', c: C.peach, h: '독서기록장' }),
    s('R-C06', 'read', 'cover', '사진 넣기', '반 단체 사진', 0, 311, '2026-10-13', 49, { t: 'cover', m: 'photo2', c: C.mint, h: '독서기록장' }),
    s('R-C09', 'read', 'cover', '그림', '새싹 화분', 0, 233, '2026-10-16', 50, { t: 'cover', m: 'sprout', c: C.mint, h: '독서기록장' }),
    // 독서기록장 · 간지
    s('R-D01', 'read', 'divider', '학기', '1학기', 2, 690, '2026-03-04', 12, { t: 'divider', c: C.sage, h: '1학기', sub: '3월 ~ 7월' }),
    s('R-D02', 'read', 'divider', '학기', '2학기', 2, 655, '2026-03-04', 13, { t: 'divider', c: C.peach, h: '2학기', sub: '8월 ~ 2월' }),
    s('R-D03', 'read', 'divider', '학기', '여름방학', 1, 301, '2026-06-10', 18, { t: 'divider', c: C.sky, h: '여름방학', sub: '방학 동안 읽은 책' }),
    s('R-D04', 'read', 'divider', '주제', '나의 꿈', 0, 188, '2026-09-08', 22, { t: 'divider', c: C.butter, h: '나의 꿈', sub: '꿈을 찾아 읽는 책' }),
    s('R-D05', 'read', 'divider', '주제', '가족과 함께 읽기', 0, 97, '2026-10-02', 24, { t: 'divider', c: C.sand, h: '가족 독서', sub: '함께 읽고 이야기해요' }),
    // 독서기록장 · 도서목록
    s('R-B01', 'read', 'booklist', '학년별', '1~2학년 권장 도서 30권', 2, 812, '2026-02-20', 7, { t: 'booklist', c: C.sage, h: '1~2학년 권장 도서', n: 30 }),
    s('R-B02', 'read', 'booklist', '학년별', '3~4학년 권장 도서 30권', 2, 790, '2026-02-20', 8, { t: 'booklist', c: C.sky, h: '3~4학년 권장 도서', n: 30 }),
    s('R-B04', 'read', 'booklist', '직접 쓰기', '빈칸 도서목록', 1, 520, '2026-04-11', 10, { t: 'booklist', c: C.butter, h: '내가 고른 책', n: 0 }),
    s('R-B03', 'read', 'booklist', '학년별', '5~6학년 권장 도서 40권', 1, 433, '2026-02-20', 9, { t: 'booklist', c: C.peach, h: '5~6학년 권장 도서', n: 40 }),
    // 독서기록장 · 내지
    s('R-I01', 'read', 'inner', '독서기록', '기본 독서기록', 2, 1530, '2026-02-25', 3, { t: 'readlog', c: C.sage }),
    s('R-I02', 'read', 'inner', '독서기록', '별점 독서기록', 2, 1207, '2026-03-10', 4, { t: 'readlog2', c: C.butter }),
    s('R-I03', 'read', 'inner', '독후활동', '그림으로 남기기', 2, 980, '2026-03-10', 5, { t: 'drawlog', c: C.sky }),
    s('R-I07', 'read', 'inner', '노트', '줄노트', 1, 640, '2026-01-15', 1, { t: 'lined', c: C.sand }),
    s('R-I04', 'read', 'inner', '독후활동', '생각 그물(마인드맵)', 1, 512, '2026-05-02', 6, { t: 'mindmap', c: C.mint }),
    s('R-I05', 'read', 'inner', '독후활동', '등장인물 소개', 1, 377, '2026-08-28', 11, { t: 'characters', c: C.peach }),
    s('R-I08', 'read', 'inner', '노트', '모눈노트', 0, 318, '2026-01-15', 2, { t: 'grid', c: C.sand }),
    s('R-I06', 'read', 'inner', '독서기록', '책 속 한 문장', 0, 259, '2026-10-09', 14, { t: 'quote', c: C.sky }),
    // 학습플래너 · 표지
    s('P-C01', 'plan', 'cover', '그림', '나의 학습플래너', 2, 905, '2026-01-28', 15, { t: 'cover', m: 'gridm', c: C.sky, h: '학습플래너' }),
    s('P-C02', 'plan', 'cover', '그림', '학교 가는 길', 2, 744, '2026-02-03', 16, { t: 'cover', m: 'school', c: C.sage, h: '학습플래너' }),
    s('P-C03', 'plan', 'cover', '그림', '연필과 자', 1, 410, '2026-07-07', 19, { t: 'cover', m: 'pencil', c: C.peach, h: '학습플래너' }),
    s('P-C04', 'plan', 'cover', '단색', '체크무늬', 1, 365, '2026-04-22', 17, { t: 'cover', m: 'check', c: C.butter, h: '학습플래너' }),
    s('P-C05', 'plan', 'cover', '단색', '깔끔한 남색', 0, 150, '2026-09-29', 21, { t: 'cover', m: 'plain', c: C.navy, h: '학습플래너' }),
    // 학습플래너 · 간지
    s('P-D01', 'plan', 'divider', '월별', '3월', 2, 380, '2026-02-12', 5, { t: 'divider', c: C.mint, h: '3월', sub: '새 학년 첫 달' }),
    s('P-D02', 'plan', 'divider', '학기', '1학기 계획', 1, 290, '2026-02-12', 6, { t: 'divider', c: C.sky, h: '1학기', sub: '나의 계획' }),
    s('P-D03', 'plan', 'divider', '주제', '시험 준비', 0, 120, '2026-09-30', 9, { t: 'divider', c: C.peach, h: '시험 준비', sub: '2주 전부터 차근차근' }),
    // 학습플래너 · 내지
    s('P-I01', 'plan', 'inner', '계획', '주간 계획표', 2, 1340, '2026-01-20', 2, { t: 'weekly', c: C.sky }),
    s('P-I02', 'plan', 'inner', '계획', '월간 달력', 2, 1112, '2026-01-20', 3, { t: 'monthly', c: C.sage }),
    s('P-I03', 'plan', 'inner', '계획', '하루 공부 시간', 1, 640, '2026-03-16', 4, { t: 'timetable', c: C.butter }),
    s('P-I04', 'plan', 'inner', '기록', '나의 목표', 1, 588, '2026-03-16', 5, { t: 'goal', c: C.mint }),
    s('P-I05', 'plan', 'inner', '기록', '오답 노트', 1, 470, '2026-05-06', 7, { t: 'wrong', c: C.peach }),
    s('P-I06', 'plan', 'inner', '노트', '줄노트', 0, 300, '2026-01-15', 1, { t: 'lined', c: C.sand }),
    s('P-I07', 'plan', 'inner', '노트', '모눈노트', 0, 260, '2026-01-15', 8, { t: 'grid', c: C.sand })
  ];

  // ---------------------------------------------------------------
  // 관리 화면에 미리 들어 있는 구성표(데모). 개인정보는 가려 두었어요.
  // 날짜는 2026-10-21 기준으로 적었고, server.js의 relativize()가 처음 열 때
  // '지금' 기준으로 옮겨요(번호·메일 기록·받을 날도 함께).
  // ---------------------------------------------------------------
  function pg(sid, rep) { return { sid: sid, rep: rep || null }; }
  var penA = { k: 'pen', pts: [[22, 150], [40, 146], [60, 147], [82, 144], [104, 146], [118, 150]] };
  var penB = { k: 'pen', pts: [[30, 30], [26, 40], [30, 52], [44, 56], [58, 52], [62, 40], [56, 30], [42, 26], [30, 30]] };

  var SEED = [
    { no: 'SP-20261021-0004', at: '2026-10-21T16:40:00', org: '논산 ○○초등학교', person: '김○○ 선생님', phone: '010-****-4821', email: 'k***@○○○.es.kr', book: 'read', qty: 320, due: '2026-12-18',
      msg: '3학년 4개 반 독서기록장이에요. 표지는 반마다 색만 다르게 해 주시고, 1쪽 표지 아래에 교표를 넣어 주세요. 도서목록은 학교에서 정한 목록으로 바꿔 주세요(원고 첨부).',
      pages: [pg('R-C01'), pg('R-D01'), pg('R-B02', { name: '3학년_권장도서_목록.hwp', size: 1240000 }), pg('R-I01'), pg('R-I01'), pg('R-I02'), pg('R-I03'), pg('R-I03'), pg('R-I04'), pg('R-D02'), pg('R-I01'), pg('R-I02'), pg('R-I05'), pg('R-I07')],
      marks: { 0: [penA, { k: 'text', x: 62, y: 168, t: '교표 여기에 넣어 주세요' }], 2: [{ k: 'text', x: 18, y: 40, t: '첨부한 목록으로 바꿔 주세요' }] },
      files: [{ name: '교표_원본.png', size: 412000 }, { name: '3학년_권장도서_목록.hwp', size: 1240000 }],
      mail: 'sent', mailLog: ['10.21 16:40 사내 메일 보냄', '10.21 16:40 고객 접수 확인 메일 보냄'], spam: null },
    { no: 'SP-20261021-0003', at: '2026-10-21T11:05:00', org: '대전 ○○중학교', person: '박○○ 선생님', phone: '010-****-1736', email: 'p***@○○○.ms.kr', book: 'plan', qty: 450, due: '2027-02-20',
      msg: '1학년 학습플래너 450부 견적 부탁드려요. 월간 달력은 2027년 3월부터 시작하게 해 주세요.',
      pages: [pg('P-C02'), pg('P-I04'), pg('P-D01'), pg('P-I02'), pg('P-I01'), pg('P-I01'), pg('P-I03'), pg('P-I05'), pg('P-I06')],
      marks: { 3: [{ k: 'text', x: 20, y: 30, t: '2027년 3월 시작' }] },
      files: [], mail: 'failed', mailLog: ['10.21 11:05 사내 메일 실패: SMTP 465 연결 시간 초과', '10.21 11:05 고객 접수 확인 메일 실패'], spam: null },
    { no: 'SP-20261021-0002', at: '2026-10-21T09:12:00', org: '검색 상위노출 무료 진단', person: '마케팅팀', phone: '010-****-0000', email: 'ad***@mail.test', book: 'read', qty: 1, due: '2026-10-22',
      msg: '대표님 사이트 검색 순위 무료 진단해 드립니다. 아래 링크 확인 부탁드립니다. (링크 생략)',
      pages: [pg('R-C01')], marks: {}, files: [], mail: 'skipped', mailLog: ['스팸으로 거름: 메일 보내지 않음'], spam: '숨은 칸 채움' },
    { no: 'SP-20261021-0001', at: '2026-10-21T03:47:00', org: 'ㅁㄴㅇㄹ', person: 'ㅁㄴㅇㄹ', phone: '010-****-1111', email: 'x***@mail.test', book: 'read', qty: 1, due: '2026-10-21',
      msg: '좋은 정보 공유합니다 (링크 생략)', pages: [pg('R-C02')], marks: {}, files: [], mail: 'skipped', mailLog: ['스팸으로 거름: 메일 보내지 않음'], spam: '1.2초 만에 제출' },
    { no: 'SP-20261020-0003', at: '2026-10-20T15:30:00', org: '세종 ○○초등학교', person: '이○○ 선생님', phone: '010-****-5530', email: 'l***@○○○.es.kr', book: 'read', qty: 180, due: '2026-12-04',
      msg: '5학년 독서기록장이에요. 내지는 별점 독서기록으로만 채워 주세요.',
      pages: [pg('R-C04'), pg('R-B03'), pg('R-I02'), pg('R-I02'), pg('R-I02'), pg('R-I02'), pg('R-I06')], marks: {}, files: [], mail: 'sent', mailLog: ['10.20 15:30 사내 메일 보냄', '10.20 15:30 고객 접수 확인 메일 보냄'], spam: null },
    { no: 'SP-20261020-0002', at: '2026-10-20T13:02:00', org: '공주 ○○초등학교 도서관', person: '최○○ 사서', phone: '010-****-2019', email: 'c***@○○○.es.kr', book: 'read', qty: 96, due: '2026-11-27',
      msg: '도서관 행사용이에요. 표지에 학교 사진을 넣고 싶어요(사진 첨부).',
      pages: [pg('R-C05', { name: '학교전경_2026.jpg', size: 3800000 }), pg('R-I01'), pg('R-I03'), pg('R-I07')], marks: { 0: [penB] },
      files: [{ name: '학교전경_2026.jpg', size: 3800000 }], mail: 'sent', mailLog: ['10.20 13:02 사내 메일 보냄', '10.20 13:02 고객 접수 확인 메일 보냄'], spam: null },
    { no: 'SP-20261020-0001', at: '2026-10-20T08:55:00', org: '천안 ○○고등학교', person: '정○○ 선생님', phone: '010-****-8842', email: 'j***@○○○.hs.kr', book: 'plan', qty: 610, due: '2027-02-12',
      msg: '전교생 학습플래너 견적 문의드려요. 오답 노트 쪽을 늘리고 싶어요.',
      pages: [pg('P-C05'), pg('P-I04'), pg('P-I02'), pg('P-I01'), pg('P-I05'), pg('P-I05'), pg('P-I05'), pg('P-I07')], marks: {}, files: [],
      mail: 'failed', mailLog: ['10.20 08:55 사내 메일 실패: 받는 서버 응답 없음'], spam: null },
    { no: 'SP-20261017-0002', at: '2026-10-17T17:20:00', org: '청주 ○○초등학교', person: '윤○○ 선생님', phone: '010-****-3307', email: 'y***@○○○.es.kr', book: 'read', qty: 240, due: '2026-12-11',
      msg: '2학년 독서기록장 240부요.', pages: [pg('R-C02'), pg('R-B01'), pg('R-I01'), pg('R-I03'), pg('R-I01'), pg('R-I03')], marks: {}, files: [],
      mail: 'sent', mailLog: ['10.17 17:20 사내 메일 보냄'], spam: null },
    { no: 'SP-20261017-0001', at: '2026-10-17T02:10:00', org: '빠른 승인 안내', person: '상담원', phone: '010-****-9999', email: 'loan***@mail.test', book: 'plan', qty: 1, due: '2026-10-17',
      msg: '당일 승인 안내드립니다 (링크 생략)', pages: [pg('P-C01')], marks: {}, files: [], mail: 'skipped', mailLog: ['스팸으로 거름: 메일 보내지 않음'], spam: '숨은 칸 채움' },
    { no: 'SP-20261016-0001', at: '2026-10-16T10:44:00', org: '부여 ○○중학교', person: '한○○ 선생님', phone: '010-****-6612', email: 'h***@○○○.ms.kr', book: 'plan', qty: 150, due: '2027-02-19',
      msg: '2학년 학습플래너예요. 표지에 학교 이름만 크게 넣어 주세요.', pages: [pg('P-C04'), pg('P-I02'), pg('P-I01'), pg('P-I03'), pg('P-I06')], marks: { 0: [{ k: 'text', x: 30, y: 60, t: '학교 이름 크게' }] }, files: [],
      mail: 'sent', mailLog: ['10.16 10:44 사내 메일 보냄'], spam: null },
    { no: 'SP-20261015-0002', at: '2026-10-15T14:18:00', org: '논산 ○○지역아동센터', person: '서○○ 센터장', phone: '010-****-7720', email: 's***@mail.test', book: 'read', qty: 40, due: '2026-11-20',
      msg: '아이들 40명이 쓸 독서기록장이에요.', pages: [pg('R-C09'), pg('R-I01'), pg('R-I03'), pg('R-I05')], marks: {}, files: [],
      mail: 'sent', mailLog: ['10.15 14:18 사내 메일 보냄'], spam: null },
    { no: 'SP-20261014-0001', at: '2026-10-14T09:30:00', org: '계룡 ○○초등학교', person: '강○○ 선생님', phone: '010-****-1258', email: 'g***@○○○.es.kr', book: 'read', qty: 300, due: '2026-12-01',
      msg: '4학년 독서기록장 300부, 표지 두 가지로 나눠서 받을 수 있나요?', pages: [pg('R-C03'), pg('R-C08'), pg('R-B02'), pg('R-I01'), pg('R-I02'), pg('R-I04')], marks: {},
      files: [{ name: '4학년_요청사항.pdf', size: 820000 }], mail: 'sent', mailLog: ['10.14 09:30 사내 메일 보냄'], spam: null }
  ];

  window.DATA = { BOOKS: BOOKS, SAMPLES: SAMPLES, SEED: SEED };
})();
