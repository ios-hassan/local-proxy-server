# Local Proxy Server

API 요청을 프록시하고 Fake Response를 설정할 수 있는 로컬 프록시 서버입니다.

## 프로젝트 구조

```
local-proxy-server/
├── proxy-server/     # Express 기반 프록시 서버
│   ├── index.js      # 메인 서버 파일
│   └── api-list.json # 저장된 API 목록 (자동 생성)
└── proxy-web/        # Next.js 기반 관리 웹 UI
    └── src/app/
        ├── api-list/     # API 목록 페이지
        ├── api-add/      # API 추가 페이지
        ├── api-edit/     # API 수정 페이지
        └── logs/         # 로그 조회 페이지
```

## 요구사항

- **Node.js**: v18.0.0 이상
- **npm**: v9.0.0 이상 (또는 yarn)

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
   - Fake Response: 반환할 가짜 응답 (JSON 형식)
3. 등록된 API와 매칭되는 요청이 들어오면 Fake Response가 반환됩니다.

### 로그 조회

1. 웹 UI에서 **Logs** 메뉴 클릭
2. 실시간으로 프록시를 통한 모든 요청/응답 확인 가능
3. 로그 클릭 시 상세 정보 조회

## 주요 기능

- **프록시 서버**: 모든 HTTP 메소드 지원 (GET, POST, PUT, DELETE 등)
- **Fake Response**: 특정 API에 대해 가짜 응답 반환
- **Query/Body 비교**: key-value 기반 비교로 순서에 관계없이 매칭
- **실시간 로그**: SSE를 통한 실시간 로그 스트리밍
- **로그 필터링**: URL, 메소드, 상태 코드로 검색
- **데이터 영속성**: API 목록은 파일로 저장되어 서버 재시작 후에도 유지

## API 엔드포인트

### Proxy Server (포트 3000)

| 메소드 | 경로 | 설명 |
|--------|------|------|
| ALL | `/?target=<URL>` | 프록시 요청 |
| GET | `/api/get-proxy-api-list` | API 목록 조회 |
| GET | `/api/get-proxy-api/:id` | 단일 API 조회 |
| POST | `/api/add-proxy-api` | API 추가 |
| PUT | `/api/update-proxy-api/:id` | API 수정 |
| DELETE | `/api/delete-proxy-api/:id` | API 삭제 |
| GET | `/api/logs` | 로그 목록 조회 |
| GET | `/api/logs/:id` | 단일 로그 조회 |
| GET | `/api/logs/stream` | SSE 로그 스트리밍 |
| DELETE | `/api/logs` | 로그 초기화 |

## 설정

### 로그 제외 패턴

`proxy-server/index.js`에서 `LOG_EXCLUDE_PATTERNS` 배열을 수정하여 특정 경로의 로그를 제외할 수 있습니다:

```javascript
const LOG_EXCLUDE_PATTERNS = ['/ads/tracker'];
```

### 최대 로그 수

`proxy-server/index.js`에서 `MAX_LOGS` 상수를 수정하여 메모리에 저장되는 최대 로그 수를 변경할 수 있습니다:

```javascript
const MAX_LOGS = 1000;
```
