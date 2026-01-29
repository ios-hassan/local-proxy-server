const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// CORS 설정 (proxy-web에서 접근 허용)
app.use(cors());

// Raw body 파싱을 위한 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.raw({ type: '*/*', limit: '10mb' }));

// API 저장소
const apiList = [
  {
    id: 1,
    baseUrl: 'https://api.example.com',
    path: '/users',
    query: '',
    body: '',
    fakeResponse: '{"users": [{"id": 1, "name": "John"}, {"id": 2, "name": "Jane"}]}',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    baseUrl: 'https://api.example.com',
    path: '/users/1',
    query: 'include=profile',
    body: '',
    fakeResponse: '{"id": 1, "name": "John", "email": "john@example.com"}',
    createdAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 3,
    baseUrl: 'https://api.example.com',
    path: '/posts',
    query: '',
    body: '{"title": "New Post", "content": "Hello World"}',
    fakeResponse: '{"id": 100, "title": "New Post", "content": "Hello World", "created": true}',
    createdAt: '2024-01-03T00:00:00.000Z',
  },
];

// API 저장 엔드포인트
app.post('/api/add-proxy-api', (req, res) => {
  const { baseUrl, path, query, body, fakeResponse } = req.body;

  if (!baseUrl || !path || !fakeResponse) {
    return res.status(400).json({ error: 'baseUrl, path, fakeResponse는 필수입니다.' });
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
  console.log(`[API Deleted] ${deleted.baseUrl}${deleted.path}`);

  res.json({ message: 'API가 삭제되었습니다.', data: deleted });
});

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

      // api.query가 비어있으면 query 비교 스킵, 있으면 비교
      if (api.query && api.query.trim() !== '') {
        if (api.query !== query) {
          continue;
        }
      }

      // api.body가 비어있으면 body 비교 스킵, 있으면 비교
      if (api.body && api.body.trim() !== '') {
        const apiBody = typeof api.body === 'string' ? api.body : JSON.stringify(api.body);
        const reqBody = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody);
        if (apiBody !== reqBody) {
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

// 상세 로그 출력 함수
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

  // 원본 요청 로그
  logRequest('INCOMING REQUEST', {
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: JSON.stringify(req.query),
    headers: req.headers,
    body: requestBody,
  });

  // apiList에서 매칭되는 API 찾기
  const matchedApi = findMatchingApi(targetUrl, requestBody);

  if (matchedApi) {
    console.log(`\n>>> [FAKE RESPONSE MATCHED] <<<`);
    console.log(`Matched API ID: ${matchedApi.id}`);
    console.log(`Returning fake response for: ${matchedApi.baseUrl}${matchedApi.path}`);
    console.log(`Fake Response: ${matchedApi.fakeResponse}\n`);

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

    // 실제 서버로 보내는 요청 로그
    logRequest('OUTGOING REQUEST TO TARGET SERVER', {
      method: req.method,
      url: targetUrl,
      baseUrl: `${parsedUrl.protocol}//${parsedUrl.host}`,
      path: parsedUrl.pathname,
      query: parsedUrl.search || '(none)',
      headers: headers,
      body: requestBody,
    });

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

    // 응답 로그
    logRequest('RESPONSE FROM TARGET SERVER', {
      url: targetUrl,
      headers: responseHeaders,
      body: responseBody.substring(0, 1000) + (responseBody.length > 1000 ? '... (truncated)' : ''),
    });
    console.log(`Status: ${response.status}`);

    res.send(responseBody);

  } catch (error) {
    console.error('[Proxy Error]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
  console.log(`Usage: http://localhost:${PORT}?target=<TARGET_URL>`);
});
