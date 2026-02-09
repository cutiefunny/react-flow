# Mock API 개발 가이드

## 개요

이 프로젝트는 백엔드 준비 중에도 프론트엔드 개발과 테스트를 할 수 있도록 **Mock API**를 제공합니다.

## 🚀 빠른 시작

### 1. Mock API 사용 (개발 중, 추천)

```bash
# .env.local에서 설정
VITE_USE_MOCK_API=true

# 앱 실행
npm run dev
```

Mock API는 자동으로 활성화되며, 모든 API 호출이 메모리 기반으로 처리됩니다.

### 2. 실제 FastAPI 백엔드 사용

```bash
# .env.local에서 설정
VITE_USE_MOCK_API=false

# FastAPI 서버 실행 (별도 터미널)
# python -m uvicorn main:app --reload --port 8082

# 앱 실행
npm run dev
```

## 📁 파일 구조

### Mock 관련 파일

- **`src/mockData.js`** - Mock 데이터 정의
  - 샘플 시나리오 (scenarios)
  - API 템플릿 (apiTemplates)
  - 폼 템플릿 (formTemplates)
  - 노드 설정 (colors, visibility, text colors)

- **`src/mockApi.js`** - Mock API 구현
  - `fastApi.js`와 동일한 인터페이스
  - 메모리 기반 데이터 관리
  - 실제 async 동작 시뮬레이션 (300ms 지연)

- **`src/backendService.js`** - 백엔드 추상화 레이어
  - 환경 변수에 따라 mock/real API 선택
  - API 호출 라우팅

## 🔄 Mock API 인터페이스

Mock API는 FastAPI와 **정확히 동일한 함수 서명**을 가집니다:

```javascript
// Mock API
import * as mockApi from './mockApi';
mockApi.fetchScenarios() // 샘플 데이터 반환

// 실제 API로 교체 시
import * as fastApi from './fastApi';
fastApi.fetchScenarios() // 실제 서버 호출
```

## 💾 Mock 데이터 수정

### 샘플 시나리오 추가

`src/mockData.js`에서 `MOCK_SCENARIOS` 배열을 수정:

```javascript
export const MOCK_SCENARIOS = [
  {
    id: 'scenario-004',
    name: 'New Scenario',
    job: 'Support',
    description: 'My new scenario',
    // ... 다른 속성들
  },
];
```

### 샘플 API 템플릿 추가

```javascript
export const MOCK_API_TEMPLATES = [
  {
    id: 'api-template-004',
    name: 'My API',
    url: 'https://api.example.com/endpoint',
    method: 'POST',
    // ... 다른 속성들
  },
];
```

## 🛠️ 유틸리티 함수

### Mock 데이터 리셋

콘솔에서 실행:

```javascript
import { resetMockData } from './mockApi';
resetMockData();
```

### Mock 스토어 상태 확인

콘솔에서 실행:

```javascript
import { getMockStoreState } from './mockApi';
getMockStoreState();
```

## 🔀 실제 백엔드로 전환

### Step 1: 환경 변수 설정

`.env.local` 파일 수정:

```bash
VITE_USE_MOCK_API=false
```

### Step 2: FastAPI 백엔드 시작

```bash
python -m uvicorn main:app --reload --port 8082
```

### Step 3: 앱 재시작

```bash
npm run dev
```

**완료!** 코드 변경 없이 자동으로 실제 API로 전환됩니다.

## 📋 Mock API 함수 목록

### Scenario Management

- `fetchScenarios()` - 모든 시나리오 조회
- `createScenario({ newScenarioName, job, description })` - 시나리오 생성
- `renameScenario({ oldScenario, newName, job, description })` - 시나리오 수정
- `deleteScenario({ scenarioId })` - 시나리오 삭제
- `cloneScenario({ scenarioToClone, newName })` - 시나리오 복제
- `fetchScenarioData({ scenarioId })` - 시나리오 상세 데이터 조회
- `saveScenarioData({ scenario, data })` - 시나리오 데이터 저장
- `updateScenarioLastUsed({ scenarioId })` - 마지막 사용 시간 업데이트

### Template Management

- `fetchApiTemplates()` - API 템플릿 조회
- `saveApiTemplate(templateData)` - API 템플릿 저장
- `deleteApiTemplate(templateId)` - API 템플릿 삭제
- `fetchFormTemplates()` - 폼 템플릿 조회
- `saveFormTemplate(templateData)` - 폼 템플릿 저장
- `deleteFormTemplate(templateId)` - 폼 템플릿 삭제

### Settings Management

- `fetchNodeVisibility()` - 노드 표시 설정 조회
- `saveNodeVisibility(visibleNodeTypes)` - 노드 표시 설정 저장
- `fetchNodeColors()` - 노드 색상 조회
- `saveNodeColors(colors)` - 노드 색상 저장
- `fetchNodeTextColors()` - 노드 텍스트 색상 조회
- `saveNodeTextColors(textColors)` - 노드 텍스트 색상 저장

## 🐛 디버깅

### 콘솔 로그 확인

Mock API는 모든 작업을 콘솔에 로깅합니다:

```
[Mock API] Fetching scenarios...
[Mock API] Created scenario: Customer Support Flow
[Mock API] Saved scenario data: scenario-001
```

### 현재 사용 중인 API 확인

앱 시작 시 콘솔에 출력됩니다:

```
🔧 [Development Mode] Using Mock API for testing
```

또는

```
🚀 [Production Mode] Using Real FastAPI backend
```

## 💡 팁

1. **데이터 영속성**: Mock API는 메모리에 저장되므로 페이지 새로고침 시 데이터가 리셋됩니다.
2. **지연 시뮬레이션**: 실제 API 호출의 지연을 시뮬레이션하기 위해 300ms 지연이 추가됩니다.
3. **타임스탬프**: 모든 생성/수정 시간은 자동으로 업데이트됩니다.

## 🎯 다음 단계

- [ ] FastAPI 백엔드 개발 완료
- [ ] `VITE_USE_MOCK_API=false`로 설정 변경
- [ ] 실제 서버에서 테스트
- [ ] 프로덕션 배포
