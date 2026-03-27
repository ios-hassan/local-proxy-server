# Local Proxy Server

API 요청을 프록시하고 Fake Response를 설정할 수 있는 로컬 프록시 서버입니다.
웹 기반 관리 UI를 통해 API 목록 관리, 실시간 로그 모니터링, 모바일 프리셋 데이터 조회 등을 지원합니다.

## 프로젝트 구조

```
local-proxy-server/
├── proxy-server/              # Express 기반 프록시 서버 (포트 3000)
│   ├── index.js               # 메인 서버 파일
│   ├── api-list.json          # 저장된 API 목록 (자동 생성)
│   └── settings.json          # 전역 설정 (자동 생성)
├── proxy-web/                 # Next.js 기반 관리 웹 UI (포트 8080)
│   └── src/app/
│       ├── components/        # 공통 컴포넌트 (Sidebar 등)
│       ├── api-list/          # API 목록 페이지
│       ├── api-add/           # API 추가 페이지
│       ├── api-edit/[id]/     # API 수정 페이지
│       ├── logs/              # 일반 로그 조회 페이지
│       ├── ads-log/           # Ads 로그 조회 페이지
│       ├── ohs-log/           # OHS Log V1 조회 페이지
│       ├── log-v2/            # OHS Log V2 조회 페이지
│       └── mobile-preset/     # 모바일 프리셋 데이터 페이지
└── preset_list/               # 모바일 프리셋 JSON 파일 (60+ 타입)
```

## 요구사항

- **Node.js**: v18.0.0 이상
- **npm**: v9.0.0 이상

## 설치

### 1. 저장소 클론

```bash
git clone https://github.com/ios-hassan/local-proxy-server.git
cd local-proxy-server
```

### 2. proxy-server 의존성 설치

```bash
cd proxy-server
npm install
```

### 3. proxy-web 의존성 설치

```bash
cd ../proxy-web
npm install
```

## 실행

### 1. proxy-server 실행

```bash
cd proxy-server
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

### 2. proxy-web 실행 (새 터미널에서)

```bash
cd proxy-web
npm run dev
```

웹 UI가 `http://localhost:8080`에서 실행됩니다.

## 사용 방법

### 프록시 사용

프록시를 통해 API를 호출하려면 다음 형식을 사용합니다:

```
http://localhost:3000?target=<TARGET_URL>
```

예시:
```
http://localhost:3000?target=https://api.example.com/users
```

### Fake Response 설정

1. 웹 UI (`http://localhost:8080`)에 접속
2. **API 추가** 메뉴에서 새 API 등록
   - Base URL: 대상 서버 주소 (예: `https://api.example.com`)
   - Path: API 경로 (예: `/users`)
   - Query: 쿼리 파라미터 (선택, 예: `id=1&name=test`)
   - Body: 요청 바디 (선택, JSON 형식)
   - Redirect URL: 요청을 전달할 다른 서버 주소 (선택)
   - Delay: API별 응답 지연 시간 (ms, 선택)
   - Fake Responses: 반환할 가짜 응답 목록 (JSON 형식, 복수 등록 가능)
3. 등록된 API와 매칭되는 요청이 들어오면 활성화된 Fake Response가 반환됩니다.

## 주요 기능

### 프록시 서버
- 모든 HTTP 메소드 지원 (GET, POST, PUT, DELETE 등)
- Query/Body 기반 매칭 (key-value 순서 무관)
- 프록시 시 불필요한 헤더 자동 제거 (host, content-length, content-encoding)

### 다중 Fake Response
- 하나의 API에 여러 개의 Fake Response 등록 가능
- 탭 인터페이스로 Response 전환 관리
- 각 Response별 이름, Body, HTTP Status Code 지정
- 활성/비활성 전환으로 원하는 Response만 반환

### API 활성/비활성 토글
- API를 삭제하지 않고 비활성화 가능
- 비활성화된 API는 매칭에서 제외
- API 목록에서 한 클릭으로 토글

### Redirect URL
- Fake Response 대신 다른 서버로 요청을 전달
- 개발/스테이징 서버 간 전환 시 유용

### 응답 지연 (Delay)
- API별 개별 Delay 설정 (ms)
- Global Delay 설정 (개별 Delay 미설정 시 적용)
- 네트워크 지연 시뮬레이션에 활용

### 실시간 로그 모니터링
- SSE(Server-Sent Events) 기반 실시간 스트리밍
- 가상 스크롤링으로 대량 로그 처리 최적화
- 일시정지/재개, 자동스크롤 토글
- URL, 메소드, 상태 코드 필터링
- 카테고리별 최대 1,000개 로그 보관

### 로그 카테고리
| 페이지 | URL 패턴 | 설명 |
|--------|----------|------|
| Logs | 기본 | 모든 프록시 요청 로그 |
| Ads Log | `/ads/tracker` | 광고 트래커 요청 전용 로그 |
| OHS Log V1 | `/log` (v2 제외) | OHS 로그 (2패널 레이아웃, 주요 키 요약) |
| OHS Log V2 | `/log/v2` | OHS V2 로그 (body 이벤트 파싱, 배치 요청 분리) |

### OHS 로그 상세 기능
- 좌우 2패널 레이아웃 (목록 + 상세)
- 주요 키 자동 추출 및 요약 표시 (category, action, intent, url, params, page_id, object_* 등)
- Impression 로그 필터링
- V2: body 이벤트 배열/data 프로퍼티에서 개별 이벤트 파싱

### 모바일 프리셋
- 60+ 타입의 모바일 API 프리셋 데이터 관리
- 타입별 아이템 목록 조회 및 검색
- 복수 아이템 선택 및 클립보드 복사
- 선택한 아이템들로 조합 데이터 생성

### 데이터 영속성
- API 목록: 파일 저장 (서버 재시작 후에도 유지)
- 설정: 파일 저장
- 로그: 메모리 저장 (카테고리별 최대 1,000개)
- 서버 시작 시 자동 마이그레이션 (이전 형식 호환)

## API 엔드포인트

### 프록시 (포트 3000)

| 메소드 | 경로 | 설명 |
|--------|------|------|
| ALL | `/?target=<URL>` | 프록시 요청 |

### API 관리

| 메소드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/get-proxy-api-list` | API 목록 조회 |
| GET | `/api/get-proxy-api/:id` | 단일 API 조회 |
| POST | `/api/add-proxy-api` | API 추가 |
| PUT | `/api/update-proxy-api/:id` | API 수정 |
| DELETE | `/api/delete-proxy-api/:id` | API 삭제 |
| PATCH | `/api/toggle-active/:id` | API 활성/비활성 토글 |
| PATCH | `/api/switch-response/:id` | 활성 Response 전환 |
| PATCH | `/api/update-delay/:id` | API별 Delay 수정 |

### 설정

| 메소드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/settings` | 전역 설정 조회 |
| PATCH | `/api/settings` | 전역 설정 수정 (globalDelay 등) |

### 로그

각 로그 카테고리(`logs`, `ads-logs`, `ohs-logs`, `log-v2-logs`)마다 동일한 엔드포인트 제공:

| 메소드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/{type}` | 로그 목록 조회 (limit, offset 지원) |
| GET | `/api/{type}/:id` | 단일 로그 상세 조회 |
| DELETE | `/api/{type}` | 로그 전체 삭제 |
| GET | `/api/{type}/stream` | SSE 실시간 스트리밍 |

### 모바일 프리셋

| 메소드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/mobile-presets/summary` | 타입별 개수 요약 |
| GET | `/api/mobile-presets/type/:name` | 특정 타입 데이터 조회 |
| GET | `/api/mobile-presets/sources` | 전체 타입 목록 조회 |

## 설정

### 로그 분류 패턴

`proxy-server/index.js`에서 URL 패턴을 수정하여 로그 분류를 변경할 수 있습니다:

```javascript
const LOG_EXCLUDE_PATTERNS = ['/ads/tracker'];  // Ads 로그
const LOG_V2_PATTERNS = ['/log/v2'];            // Log V2 (우선 체크)
const OHS_LOG_PATTERNS = ['/log'];              // OHS 로그
```

### 최대 로그 수

```javascript
const MAX_LOGS = 1000;  // 카테고리별 최대 보관 로그 수
```

## 기술 스택

- **Backend**: Node.js, Express.js 5
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **데이터 저장**: JSON 파일 (API, 설정) / 메모리 (로그)
- **실시간 통신**: SSE (Server-Sent Events)
