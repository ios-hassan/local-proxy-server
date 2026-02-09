const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// API 목록 저장 파일 경로
const API_LIST_FILE = path.join(__dirname, 'api-list.json');

// MobileAPI Preset 디렉토리 경로
const MOBILE_PRESET_DIR = path.join(__dirname, '..', 'preset_list');

// 로그 저장소 (메모리)
const MAX_LOGS = 1000;
const logs = [];
const sseClients = new Set();

// 로그 제외 패턴
const LOG_EXCLUDE_PATTERNS = ['/ads/tracker'];

// 로그 추가 함수
function addLog(log) {
  // 제외 패턴 체크
  const targetUrl = log.request?.targetUrl || log.request?.path || '';
  if (LOG_EXCLUDE_PATTERNS.some((pattern) => targetUrl.includes(pattern))) {
    return null;
  }

  const logEntry = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    ...log,
  };
  logs.push(logEntry);

  // 최대 개수 초과 시 오래된 로그 제거
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }

  // SSE 클라이언트들에게 전송
  broadcastLog(logEntry);

  return logEntry;
}

// SSE 브로드캐스트
function broadcastLog(log) {
  console.log(`[SSE] Broadcasting to ${sseClients.size} clients`);
  const data = JSON.stringify(log);
  sseClients.forEach((client) => {
    try {
      const result = client.write(`data: ${data}\n\n`);
      console.log(`[SSE] Write result: ${result}`);
    } catch (e) {
      console.error('[SSE] Broadcast error:', e.message);
    }
  });
}

// CORS 설정 (proxy-web에서 접근 허용)
app.use(cors());

// Raw body 파싱을 위한 미들웨어
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.raw({ type: '*/*', limit: '50mb' }));

// 파일에서 API 목록 로드
function loadApiList() {
  try {
    if (fs.existsSync(API_LIST_FILE)) {
      const data = fs.readFileSync(API_LIST_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[Load Error] API 목록 로드 실패:', error.message);
  }
  return [];
}

// 파일에 API 목록 저장
function saveApiList() {
  try {
    fs.writeFileSync(API_LIST_FILE, JSON.stringify(apiList, null, 2), 'utf-8');
    console.log(`[Saved] API 목록이 ${API_LIST_FILE}에 저장되었습니다.`);
  } catch (error) {
    console.error('[Save Error] API 목록 저장 실패:', error.message);
  }
}

// API 저장소 (파일에서 로드)
let apiList = loadApiList();

// 중복 API 체크 함수
function isDuplicateApi(baseUrl, apiPath, query, body, excludeId = null) {
  return apiList.some((api) => {
    // excludeId가 있으면 해당 API는 제외 (수정 시 자기 자신 제외)
    if (excludeId !== null && api.id === excludeId) {
      return false;
    }

    // baseUrl과 path가 다르면 중복 아님
    if (api.baseUrl !== baseUrl || api.path !== apiPath) {
      return false;
    }

    // query 또는 body 중 하나라도 동일하면 중복
    const queryMatch = compareQueryStrings(api.query || '', query || '');
    const bodyMatch = compareBodies(api.body || '', body || '');

    return queryMatch || bodyMatch;
  });
}

// API 저장 엔드포인트
app.post('/api/add-proxy-api', (req, res) => {
  const { baseUrl, path, query, body, fakeResponse } = req.body;

  if (!baseUrl || !path || !fakeResponse) {
    return res.status(400).json({ error: 'baseUrl, path, fakeResponse는 필수입니다.' });
  }

  // 중복 체크
  if (isDuplicateApi(baseUrl, path, query, body)) {
    return res.status(409).json({ error: '동일한 baseUrl, path, query 또는 body를 가진 API가 이미 존재합니다.' });
  }

  const newApi = {
    id: Date.now(),
    baseUrl,
    path,
    query: query || '',
    body: body || '',
    fakeResponse,
    createdAt: new Date().toISOString(),
  };

  apiList.push(newApi);
  saveApiList();
  console.log(`[API Added] ${baseUrl}${path}`);

  res.status(201).json({ message: 'API가 저장되었습니다.', data: newApi });
});

// API 목록 조회 엔드포인트
app.get('/api/get-proxy-api-list', (req, res) => {
  res.json(apiList);
});

// 단일 API 조회 엔드포인트
app.get('/api/get-proxy-api/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const api = apiList.find((item) => item.id === id);

  if (!api) {
    return res.status(404).json({ error: 'API를 찾을 수 없습니다.' });
  }

  res.json(api);
});

// API 수정 엔드포인트
app.put('/api/update-proxy-api/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { baseUrl, path, query, body, fakeResponse } = req.body;

  if (!baseUrl || !path || !fakeResponse) {
    return res.status(400).json({ error: 'baseUrl, path, fakeResponse는 필수입니다.' });
  }

  const index = apiList.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'API를 찾을 수 없습니다.' });
  }

  apiList[index] = {
    ...apiList[index],
    baseUrl,
    path,
    query: query || '',
    body: body || '',
    fakeResponse,
    updatedAt: new Date().toISOString(),
  };

  saveApiList();
  console.log(`[API Updated] ${baseUrl}${path}`);

  res.json({ message: 'API가 수정되었습니다.', data: apiList[index] });
});

// API 삭제 엔드포인트
app.delete('/api/delete-proxy-api/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = apiList.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'API를 찾을 수 없습니다.' });
  }

  const deleted = apiList.splice(index, 1)[0];
  saveApiList();
  console.log(`[API Deleted] ${deleted.baseUrl}${deleted.path}`);

  res.json({ message: 'API가 삭제되었습니다.', data: deleted });
});

// 로그 목록 조회 엔드포인트
app.get('/api/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;

  // 최신 로그가 먼저 오도록 역순으로 반환
  const reversedLogs = [...logs].reverse();
  const paginatedLogs = reversedLogs.slice(offset, offset + limit);

  res.json({
    total: logs.length,
    logs: paginatedLogs,
  });
});

// 로그 초기화 엔드포인트
app.delete('/api/logs', (req, res) => {
  logs.length = 0;
  res.json({ message: '로그가 초기화되었습니다.' });
});

// SSE 로그 스트리밍 엔드포인트 (/:id 보다 먼저 정의해야 함)
app.get('/api/logs/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // 클라이언트 등록
  sseClients.add(res);
  console.log(`[SSE] Client connected. Total clients: ${sseClients.size}`);

  // 연결 확인 이벤트 전송
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connected' })}\n\n`);

  // 연결 유지를 위한 주기적 ping
  const pingInterval = setInterval(() => {
    try {
      res.write(':ping\n\n');
    } catch (e) {
      clearInterval(pingInterval);
    }
  }, 15000);

  // 연결 종료 시 클라이언트 제거
  req.on('close', () => {
    sseClients.delete(res);
    clearInterval(pingInterval);
    console.log(`[SSE] Client disconnected. Total clients: ${sseClients.size}`);
  });
});

// 단일 로그 조회 엔드포인트
app.get('/api/logs/:id', (req, res) => {
  const id = parseFloat(req.params.id);
  const log = logs.find((l) => l.id === id);

  if (!log) {
    return res.status(404).json({ error: '로그를 찾을 수 없습니다.' });
  }

  res.json(log);
});

// MobileAPI Preset - 타입 요약 목록 조회
app.get('/api/mobile-presets/summary', (req, res) => {
  try {
    if (!fs.existsSync(MOBILE_PRESET_DIR)) {
      return res.status(404).json({ error: 'Preset 데이터가 없습니다. preset_list 디렉토리를 확인하세요.' });
    }
    const files = fs.readdirSync(MOBILE_PRESET_DIR).filter(f => f.endsWith('.json'));
    const types = {};
    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(MOBILE_PRESET_DIR, file), 'utf-8'));
      const typeName = file.replace('.json', '');
      types[typeName] = data.count || (data.items ? data.items.length : 0);
    }
    res.json({ total_types: Object.keys(types).length, types });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MobileAPI Preset - 특정 타입의 데이터 조회
app.get('/api/mobile-presets/type/:typeName', (req, res) => {
  try {
    const { typeName } = req.params;
    const filePath = path.join(MOBILE_PRESET_DIR, `${typeName}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `타입 '${typeName}'을 찾을 수 없습니다.` });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MobileAPI Preset - 타입 목록 조회
app.get('/api/mobile-presets/sources', (req, res) => {
  try {
    if (!fs.existsSync(MOBILE_PRESET_DIR)) {
      return res.json({});
    }
    const files = fs.readdirSync(MOBILE_PRESET_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
    res.json({ preset_list: files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 객체를 deep equality로 비교
function compareObjects(obj1, obj2) {
  if (typeof obj1 !== typeof obj2) {
    return false;
  }

  if (typeof obj1 !== 'object' || obj1 === null) {
    return obj1 === obj2;
  }

  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    return false;
  }

  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) {
      return false;
    }
    for (let i = 0; i < obj1.length; i++) {
      if (!compareObjects(obj1[i], obj2[i])) {
        return false;
      }
    }
    return true;
  }

  const keys1 = Object.keys(obj1).sort();
  const keys2 = Object.keys(obj2).sort();

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (!keys2.includes(key)) {
      return false;
    }
    if (!compareObjects(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

// body를 파싱하여 key-value로 비교
function compareBodies(body1, body2) {
  try {
    const parsed1 = typeof body1 === 'string' ? JSON.parse(body1) : body1;
    const parsed2 = typeof body2 === 'string' ? JSON.parse(body2) : body2;
    return compareObjects(parsed1, parsed2);
  } catch {
    // JSON 파싱 실패 시 문자열로 비교
    const str1 = typeof body1 === 'string' ? body1 : JSON.stringify(body1);
    const str2 = typeof body2 === 'string' ? body2 : JSON.stringify(body2);
    return str1 === str2;
  }
}

// query string을 key-value로 파싱하여 비교
function compareQueryStrings(query1, query2) {
  const params1 = new URLSearchParams(query1);
  const params2 = new URLSearchParams(query2);

  // 정렬된 키들을 비교
  const keys1 = [...params1.keys()].sort();
  const keys2 = [...params2.keys()].sort();

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    const values1 = params1.getAll(key).sort();
    const values2 = params2.getAll(key).sort();

    if (values1.length !== values2.length) {
      return false;
    }

    for (let i = 0; i < values1.length; i++) {
      if (values1[i] !== values2[i]) {
        return false;
      }
    }
  }

  return true;
}

// apiList에서 매칭되는 API 찾기
function findMatchingApi(targetUrl, requestBody) {
  try {
    const url = new URL(targetUrl);
    const baseUrl = `${url.protocol}//${url.host}`;
    const path = url.pathname;
    const query = url.search ? url.search.slice(1) : ''; // '?' 제거

    for (const api of apiList) {
      // baseUrl과 path 매칭 (필수)
      if (api.baseUrl !== baseUrl || api.path !== path) {
        continue;
      }

      // api.query가 비어있으면 query 비교 스킵, 있으면 key-value로 파싱하여 비교
      if (api.query && api.query.trim() !== '') {
        if (!compareQueryStrings(api.query, query)) {
          continue;
        }
      }

      // api.body가 비어있으면 body 비교 스킵, 있으면 key-value로 비교
      if (api.body && api.body.trim() !== '') {
        if (!compareBodies(api.body, requestBody)) {
          continue;
        }
      }

      // 모든 조건 통과
      return api;
    }
  } catch (error) {
    console.error('[URL Parse Error]', error.message);
  }
  return null;
}

// 상세 로그 출력 함수 (콘솔 출력용)
function logRequest(title, info) {
  const separator = '='.repeat(60);
  console.log(`\n${separator}`);
  console.log(`[${title}] ${new Date().toISOString()}`);
  console.log(separator);

  if (info.method) console.log(`Method: ${info.method}`);
  if (info.url) console.log(`URL: ${info.url}`);
  if (info.baseUrl) console.log(`Base URL: ${info.baseUrl}`);
  if (info.path) console.log(`Path: ${info.path}`);
  if (info.query) console.log(`Query: ${info.query}`);

  if (info.headers) {
    console.log(`Headers:`);
    Object.entries(info.headers).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  }

  if (info.body) {
    console.log(`Body:`);
    try {
      const parsed = typeof info.body === 'string' ? JSON.parse(info.body) : info.body;
      console.log(JSON.stringify(parsed, null, 2));
    } catch {
      console.log(info.body);
    }
  }

  console.log(separator + '\n');
}

// 프록시 API
// 사용법: http://localhost:3000?target=http://someserver:port?a=b
app.all('/', async (req, res) => {
  // req.query.target 대신 원본 URL에서 target 파라미터 추출
  // Express가 query string을 분리하는 문제 방지
  const fullUrl = req.originalUrl;
  const targetMatch = fullUrl.match(/[?&]target=(.+)/);

  if (!targetMatch) {
    return res.status(400).json({ error: 'target URL is required. Use ?target=https://...' });
  }

  // target= 이후의 모든 문자열을 URL로 사용
  const targetUrl = decodeURIComponent(targetMatch[1]);

  if (!targetUrl) {
    return res.status(400).json({ error: 'target URL is required. Use ?target=https://...' });
  }

  // 요청 body 준비
  let requestBody = null;
  if (!['GET', 'HEAD'].includes(req.method)) {
    if (typeof req.body === 'object' && !(req.body instanceof Buffer)) {
      requestBody = JSON.stringify(req.body);
    } else {
      requestBody = req.body;
    }
  }

  // target URL 파싱
  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid target URL' });
  }

  // 콘솔 로그 출력
  const separator = '='.repeat(60);
  console.log(`\n${separator}`);
  console.log(`[INCOMING REQUEST] ${new Date().toISOString()}`);
  console.log(separator);
  console.log(`Method: ${req.method}`);
  console.log(`Target URL: ${targetUrl}`);
  if (requestBody) console.log(`Body: ${requestBody}`);
  console.log(separator);

  // apiList에서 매칭되는 API 찾기
  const matchedApi = findMatchingApi(targetUrl, requestBody);

  if (matchedApi) {
    console.log(`\n>>> [FAKE RESPONSE MATCHED] <<<`);
    console.log(`Matched API ID: ${matchedApi.id}`);
    console.log(`Returning fake response for: ${matchedApi.baseUrl}${matchedApi.path}`);
    console.log(`Fake Response: ${matchedApi.fakeResponse}\n`);

    // 통합 로그 저장 (Fake Response)
    addLog({
      type: 'PROXY_REQUEST',
      request: {
        method: req.method,
        targetUrl: targetUrl,
        baseUrl: `${parsedUrl.protocol}//${parsedUrl.host}`,
        path: parsedUrl.pathname,
        query: parsedUrl.search || '',
        headers: req.headers,
        body: requestBody,
      },
      response: {
        status: 200,
        isFake: true,
        matchedApiId: matchedApi.id,
        headers: { 'content-type': 'application/json' },
        body: matchedApi.fakeResponse,
      },
    });

    res.setHeader('Content-Type', 'application/json');
    return res.send(matchedApi.fakeResponse);
  }

  try {
    // 원본 요청 정보 수집
    const headers = { ...req.headers };

    // 프록시 관련 헤더 제거
    delete headers['host'];
    delete headers['content-length'];

    // fetch 옵션 구성
    const fetchOptions = {
      method: req.method,
      headers: headers,
    };

    // GET, HEAD가 아닌 경우 body 포함
    if (requestBody) {
      fetchOptions.body = requestBody;
    }

    // 외부 서버로 요청 전송
    const response = await fetch(targetUrl, fetchOptions);

    // 응답 헤더 복사
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    // 응답 상태 코드 및 본문 전송
    res.status(response.status);
    const responseBody = await response.text();

    // 콘솔 로그
    console.log(`[RESPONSE] Status: ${response.status}`);
    console.log(`Body: ${responseBody.substring(0, 500)}${responseBody.length > 500 ? '...' : ''}\n`);

    // 통합 로그 저장 (Real Response)
    addLog({
      type: 'PROXY_REQUEST',
      request: {
        method: req.method,
        targetUrl: targetUrl,
        baseUrl: `${parsedUrl.protocol}//${parsedUrl.host}`,
        path: parsedUrl.pathname,
        query: parsedUrl.search || '',
        headers: headers,
        body: requestBody,
      },
      response: {
        status: response.status,
        isFake: false,
        headers: responseHeaders,
        body: responseBody,
      },
    });

    res.send(responseBody);

  } catch (error) {
    console.error('[Proxy Error]', error.message);

    // 에러 로그 저장
    addLog({
      type: 'PROXY_REQUEST',
      request: {
        method: req.method,
        targetUrl: targetUrl,
        baseUrl: `${parsedUrl.protocol}//${parsedUrl.host}`,
        path: parsedUrl.pathname,
        query: parsedUrl.search || '',
        headers: req.headers,
        body: requestBody,
      },
      response: {
        status: 500,
        isFake: false,
        error: error.message,
      },
    });

    res.status(500).json({ error: error.message });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
  console.log(`Usage: http://localhost:${PORT}?target=<TARGET_URL>`);
});
