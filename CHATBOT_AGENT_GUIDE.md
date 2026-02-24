# 챗봇 에이전트 시나리오 실행 가이드

## 목적

이 문서는 최소한의 데이터(nodes, edges)만 가지고 챗봇 시나리오를 실행할 수 있도록 하는 에이전트 구현 가이드입니다.

---

## 1. 필수 데이터 구조

### 최소 요구사항

시나리오 실행에는 다음 정보만 필요합니다:

```json
{
  "nodes": [...],      // 노드 배열
  "edges": [...]       // 엣지(연결) 배열
}
```

**선택사항 (있으면 좋음):**
- `start_node_id`: 시작 노드 ID (없으면 첫 번째 노드 자동 선택)
- `name`: 시나리오 이름
- `description`: 설명

---

## 2. 노드(Node) 구조 이해

### 기본 노드 구조

```javascript
{
  "id": "unique-node-id",
  "type": "node-type",           // message, form, branch, api, llm, delay, 등
  "data": {                      // 노드 타입마다 다른 데이터
    // 타입별 내용
  },
  "position": { "x": 0, "y": 0 }
}
```

### 주요 노드 타입별 처리 방법

#### 1) **Message (메시지)**
```javascript
{
  "type": "message",
  "data": {
    "content": "안녕하세요!",      // 표시할 메시지
    "replies": [                  // 선택지 (있으면)
      { "display": "네", "value": "yes" },
      { "display": "아니오", "value": "no" }
    ],
    "chainNext": false            // true면 자동으로 다음 노드 진행
  }
}
```

**에이전트 처리:**
1. 메시지 표시
2. `replies`가 있으면 선택지 제시
3. 사용자 입력 대기
4. `proceedToNextNode()` 호출

---

#### 2) **Form (폼)**
```javascript
{
  "type": "form",
  "data": {
    "title": "정보 입력",
    "elements": [
      {
        "name": "name",
        "type": "input",           // input, date, select, checkbox 등
        "label": "이름",
        "required": true,
        "validation": { "type": "required" }
      }
    ]
  }
}
```

**에이전트 처리:**
1. 폼 렌더링
2. 사용자 입력 수집
3. 유효성 검사 (validation 규칙 적용)
4. 입력값을 슬롯에 저장
5. `proceedToNextNode()` 호출

---

#### 3) **Branch (분기)**
```javascript
{
  "type": "branch",
  "data": {
    "condition": "BUTTON",        // BUTTON 또는 CONDITION
    "choices": [
      { "display": "선택지 1", "value": "choice-1" },
      { "display": "선택지 2", "value": "choice-2" }
    ]
  }
}
```

**에이전트 처리:**
- `BUTTON`: 사용자가 선택지 클릭 → 해당 handle의 엣지를 따라 이동
- `CONDITION`: 조건 평가 → 맞는 엣지 자동 선택

---

#### 4) **API Node**
```javascript
{
  "type": "api",
  "data": {
    "apis": [
      {
        "name": "fetch-data",
        "url": "https://api.example.com/data",
        "method": "GET",
        "headers": "{}",
        "responseMapping": [
          { "path": "result.name", "slot": "user_name" }
        ]
      }
    ]
  }
}
```

**에이전트 처리:**
1. URL 보간 (슬롯 값 대입)
2. 실제 API 호출
3. 응답을 슬롯에 매핑
4. `proceedToNextNode('onSuccess', ...)` 호출

---

#### 5) **LLM Node**
```javascript
{
  "type": "llm",
  "data": {
    "prompt": "사용자: {user_input}\n\nAI 응답:",
    "outputVar": "llm_response",
    "conditions": [
      { "keyword": "yes", "nextNode": "handle-yes" }
    ]
  }
}
```

**에이전트 처리:**
1. 프롬프트 보간 (슬롯 값 대입)
2. LLM 호출
3. 응답을 outputVar 슬롯에 저장
4. 조건 확인 후 해당 엣지 선택

---

#### 6) **기타 노드**
- **SetSlot**: 슬롯 값 설정
- **Delay**: 지연 처리
- **SlotFilling**: 슬롯 채우기 (사용자 입력)
- **FixedMenu**: 고정 메뉴
- **Link**: 링크 열기
- **Toast**: 알림 표시
- **Iframe**: iframe 표시
- **Scenario**: 다른 시나리오 호출

---

## 3. 엣지(Edge) 구조 이해

```javascript
{
  "id": "reactflow__edge-source-target",
  "source": "message-1",              // 출발 노드 ID
  "target": "message-2",              // 도착 노드 ID
  "sourceHandle": "handle-id or null" // 분기 시 어느 선택지인지 구분
}
```

**엣지 따라가기:**
```javascript
// 현재 노드 ID가 "node-1"일 때, 다음 노드 찾기
const nextEdges = edges.filter(e => e.source === "node-1");
const nextNodeId = nextEdges[0].target; // 단순 흐름
// or
const nextNodeId = nextEdges.find(e => e.sourceHandle === selectedChoice).target; // 분기 흐름
```

---

## 4. 슬롯(Slots) 관리

슬롯은 시나리오 실행 중 상태를 저장하는 메모리입니다.

### 슬롯 업데이트 시점

1. **Message 노드**: 사용자가 replies 선택 → 슬롯 저장 (선택지에 slot 정의 있으면)
2. **Form 노드**: 폼 제출 → 모든 입력값을 슬롯에 저장
3. **SlotFilling 노드**: 사용자 입력 → slot에 저장
4. **API 노드**: API 응답 → responseMapping으로 슬롯에 저장
5. **SetSlot 노드**: 값 설정 → 슬롯에 저장

### 슬롯 활용 (보간)

```javascript
const message = "안녕하세요, {user_name}님!";
const slots = { user_name: "철수" };

// 보간 처리
const result = message.replace(/{(\w+)}/g, (match, key) => slots[key] || match);
// 결과: "안녕하세요, 철수님!"
```

---

## 5. 실행 흐름 알고리즘

### 기본 흐름

```
1. 시작 노드 결정
   └─ start_node_id 있으면 사용
   └─ 없으면 첫 번째 노드 선택

2. 현재 노드 처리
   ├─ 노드 타입별 처리 (message, form, branch, api 등)
   ├─ 사용자 입력 또는 조건 평가
   └─ 슬롯 업데이트

3. 다음 노드 결정
   ├─ 엣지에서 현재 노드 ID 기준 찾기
   ├─ sourceHandle로 분기 처리
   └─ 다음 노드로 이동

4. 반복 (종료 조건까지)
   └─ 다음 노드가 없으면 종료
```

### 분기 처리 로직

```javascript
function proceedToNextNode(sourceHandleId, sourceNodeId, updatedSlots) {
  // 현재 노드에서 출발하는 모든 엣지 찾기
  const outgoingEdges = edges.filter(e => e.source === sourceNodeId);
  
  // Case 1: 단순 흐름 (엣지가 1개)
  if (outgoingEdges.length === 1) {
    nextNodeId = outgoingEdges[0].target;
  }
  
  // Case 2: 분기 (엣지가 여러 개, sourceHandle 구분)
  if (outgoingEdges.length > 1) {
    const selectedEdge = outgoingEdges.find(e => 
      e.sourceHandle === sourceHandleId
    );
    nextNodeId = selectedEdge.target;
  }
  
  // Case 3: 조건 분기 (CONDITION 타입)
  if (sourceNode.type === 'branch' && sourceNode.data.condition === 'CONDITION') {
    const matchedChoice = sourceNode.data.choices.find(choice =>
      evaluateCondition(choice.condition, updatedSlots)
    );
    const selectedEdge = outgoingEdges.find(e => 
      e.sourceHandle === matchedChoice.value
    );
    nextNodeId = selectedEdge.target;
  }
}
```

---

## 6. 예제: "근육고양이 테스트" 시나리오

### 데이터

```json
{
  "name": "근육고양이 테스트",
  "nodes": [
    {
      "id": "message-1770690334688-yc1u947",
      "type": "message",
      "data": {
        "content": "안녕",
        "replies": [],
        "chainNext": false
      }
    },
    {
      "id": "message-1770690348294-x1vqosa",
      "type": "message",
      "data": {
        "content": "테스트",
        "replies": [],
        "chainNext": false
      }
    }
  ],
  "edges": [
    {
      "source": "message-1770690334688-yc1u947",
      "target": "message-1770690348294-x1vqosa"
    }
  ]
}
```

### 실행 순서

1. **시작**: `start_node_id` 없음 → 첫 번째 노드 선택
   - 현재 노드: `message-1770690334688-yc1u947`

2. **첫 번째 메시지 표시**
   - 메시지: "안녕"
   - replies 없음 → 사용자 입력 대기

3. **사용자 입력 (아무거나)**
   - 슬롯 업데이트 (필요한 경우)
   - 엣지 따라 다음 노드로 이동

4. **두 번째 메시지 표시**
   - 메시지: "테스트"
   - replies 없음 → 사용자 입력 대기

5. **사용자 입력**
   - 다음 엣지 없음 → 시나리오 종료

---

## 7. 에이전트 구현 체크리스트

### 필수 구현사항

- [ ] 노드 배열과 엣지 배열 파싱
- [ ] 시작 노드 결정 로직
- [ ] 현재 노드 ID 추적
- [ ] 슬롯(상태) 관리 (딕셔너리/맵)
- [ ] 노드 타입별 처리 함수 (message, form, branch, api, llm)
- [ ] 엣지 추적 및 다음 노드 결정
- [ ] 분기 처리 (BUTTON/CONDITION)
- [ ] 메시지 보간 (슬롯 값 대입)

### 권장 구현사항

- [ ] 에러 처리 (노드 없음, 엣지 없음)
- [ ] 무한 루프 방지
- [ ] 실행 이력 기록
- [ ] 조건 평가 함수 (CONDITION 분기용)
- [ ] API 호출 재시도 로직
- [ ] LLM 호출 타임아웃

---

## 8. 보간(Interpolation) 함수 구현

```javascript
function interpolateMessage(message, slots) {
  if (typeof message !== 'string') return message;
  
  return message.replace(/{(\w+)}/g, (match, key) => {
    return slots[key] !== undefined ? slots[key] : match;
  });
}

// 예제
const result = interpolateMessage(
  "사용자: {name}, 나이: {age}",
  { name: "철수", age: 25 }
);
// 결과: "사용자: 철수, 나이: 25"
```

---

## 9. 조건 평가 함수 구현

```javascript
function evaluateCondition(condition, slots) {
  // 조건 예제: "{age} > 18"
  const expression = condition.replace(/{(\w+)}/g, (match, key) => {
    const value = slots[key];
    return typeof value === 'string' ? `"${value}"` : value;
  });
  
  try {
    return Function(`"use strict"; return (${expression})`)();
  } catch (e) {
    console.error("Condition evaluation error:", e);
    return false;
  }
}

// 예제
const result = evaluateCondition("{age} > 18", { age: 25 });
// 결과: true
```

---

## 10. 전체 실행 의사 코드

```javascript
class ChatbotAgent {
  constructor(scenario) {
    this.nodes = scenario.nodes;
    this.edges = scenario.edges;
    this.slots = {};
    this.currentNodeId = null;
    this.history = [];
  }
  
  start() {
    // 시작 노드 결정
    const startNode = scenario.start_node_id 
      ? this.nodes.find(n => n.id === scenario.start_node_id)
      : this.nodes[0];
    
    this.currentNodeId = startNode.id;
    this.processCurrentNode();
  }
  
  processCurrentNode() {
    const currentNode = this.nodes.find(n => n.id === this.currentNodeId);
    
    switch (currentNode.type) {
      case 'message':
        this.handleMessage(currentNode);
        break;
      case 'form':
        this.handleForm(currentNode);
        break;
      case 'branch':
        this.handleBranch(currentNode);
        break;
      case 'api':
        this.handleApi(currentNode);
        break;
      // ... 기타 노드 타입
    }
  }
  
  handleMessage(node) {
    console.log(node.data.content);
    
    if (node.data.replies.length > 0) {
      // 사용자 선택 대기
      // onUserSelect(choice) → proceedToNextNode(choice.value)
    } else {
      // 사용자 입력 대기
      // onUserInput(text) → proceedToNextNode(null)
    }
  }
  
  proceedToNextNode(sourceHandleId, userInput = null) {
    // 슬롯 업데이트
    if (userInput) {
      // 필요시 슬롯에 저장
    }
    
    // 다음 노드 결정
    const outgoingEdges = this.edges.filter(
      e => e.source === this.currentNodeId
    );
    
    if (outgoingEdges.length === 0) {
      console.log("시나리오 종료");
      return;
    }
    
    const nextEdge = outgoingEdges.find(
      e => e.sourceHandle === sourceHandleId
    ) || outgoingEdges[0];
    
    this.currentNodeId = nextEdge.target;
    this.processCurrentNode();
  }
}
```

---

## 참고사항

- **보간 시점**: 메시지, API URL, 프롬프트 등 `{slot_name}` 형태일 때
- **엣지 없음**: 시나리오 종료
- **API 실패**: `proceedToNextNode('onError', ...)` 호출
- **무한 루프**: 같은 노드 반복 방지 필요
- **타임스탐프**: 각 단계마다 기록 (디버깅용)

---

## 참고 파일

- 실제 구현: [src/hooks/useChatFlow.js](src/hooks/useChatFlow.js)
- 노드 실행자: [src/nodeExecutors.js](src/nodeExecutors.js)
- 유틸 함수: [src/simulatorUtils.js](src/simulatorUtils.js)
