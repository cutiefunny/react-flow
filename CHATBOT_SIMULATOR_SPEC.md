# 챗봇 시뮬레이터 구현 스펙 (에이전트 설명용)

이 문서는 현재 프로젝트의 챗봇 시뮬레이터 동작을 실제 챗봇 프로젝트에 재현할 수 있도록, **스키마**, **런타임 로직**, **노드 실행 규칙**, **저장/복원 포맷**을 에이전트에게 설명하기 위한 요약 스펙이다.

---

## 1. 목적

- 시뮬레이터의 노드/엣지 기반 대화 흐름을 **백엔드 런타임**에서 재현
- 프론트 편집 데이터(시나리오)와 **동일한 결과**가 나오도록 규칙화
- 실제 챗봇 서비스에 연결 가능한 **정형 스키마** 제공

---

## 2. 기본 개념

### 2.1 시나리오(Scenario)
- 하나의 챗봇 흐름 정의
- 노드/엣지 그래프 기반
- 실행 시작점은 `start_node_id`

### 2.2 노드(Node)
- 각 노드는 하나의 동작 단위를 의미
- 노드 타입에 따라 서로 다른 실행 로직을 가진다
- 노드는 **입력(이전 노드 실행 결과)**을 받아 **출력(메시지/상태/다음 분기)**을 생성한다

### 2.3 엣지(Edge)
- 노드 간 연결을 의미
- 일반 연결 외에 **조건 분기용 엣지** 존재 가능

---

## 3. 데이터 스키마 (필수 필드)

### 3.1 Scenario
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "job": "string",
  "nodes": [Node],
  "edges": [Edge],
  "start_node_id": "string|null",
  "updated_at": "datetime|null",
  "last_used_at": "datetime|null"
}
```

### 3.2 Node
```json
{
  "id": "string",
  "type": "string",
  "position": { "x": 0, "y": 0 },
  "data": {
    "label": "string",
    "text": "string",
    "payload": "object",
    "options": ["string"],
    "api": { /* API 노드용 */ },
    "form": { /* Form 노드용 */ },
    "slots": { /* Slot 채움용 */ },
    "delayMs": 0,
    "next": "string|null"
  }
}
```

### 3.3 Edge
```json
{
  "id": "string",
  "source": "string",
  "target": "string",
  "sourceHandle": "string|null",
  "targetHandle": "string|null",
  "data": {
    "condition": "string|null",
    "label": "string|null"
  }
}
```

---

## 4. 실행 규칙 (런타임 동작)

### 4.1 공통 실행 흐름
1. `start_node_id`를 시작점으로 실행
2. 현재 노드 실행 → 출력 생성
3. 다음 노드 결정
4. 종료 조건이 없으면 반복

### 4.2 상태 객체 (Runtime State)
```json
{
  "currentNodeId": "string",
  "variables": { "key": "value" },
  "slots": { "slotName": "value" },
  "history": [
    { "from": "bot|user", "text": "string", "timestamp": "datetime" }
  ]
}
```

---

## 5. 노드 타입별 실행 규칙

### 5.1 MessageNode
- 텍스트 메시지를 출력
- 다음 노드는 연결된 기본 엣지로 이동

### 5.2 FixedMenuNode
- 선택지 제공
- 유저 응답(선택지)으로 분기
- `sourceHandle`로 분기 조건 결정

### 5.3 BranchNode
- 조건 분기
- 조건식 평가 → 첫 매칭 엣지로 이동

### 5.4 ApiNode
- 외부 API 호출
- 응답을 변수/슬롯에 저장 가능

### 5.5 FormNode
- 여러 입력을 순차로 수집
- 완료 시 다음 노드로 이동

### 5.6 DelayNode
- 지정 시간만큼 지연 후 다음 노드

### 5.7 SetSlotNode
- 슬롯/변수에 값 저장

### 5.8 SlotFillingNode
- 특정 슬롯이 채워질 때까지 반복

### 5.9 LinkNode
- URL 링크 제공

### 5.10 IframeNode
- 웹 콘텐츠 임베드

### 5.11 ToastNode
- 알림 메시지 출력

### 5.12 LlmNode
- LLM 호출 (프롬프트 + 변수) → 결과를 메시지로 반환

---

## 6. 분기 조건 처리

- BranchNode/FixedMenuNode는 `Edge.data.condition` 또는 `sourceHandle`을 기준으로 분기
- 조건문 평가 방식은 서비스에 맞게 단순 비교 또는 스크립트 평가 가능

예시:
```json
{
  "condition": "user.age >= 18"
}
```

---

## 7. 저장/복원 규칙

- 시나리오는 항상 **nodes + edges + start_node_id** 형태로 저장
- 실행 중 생성되는 `variables`, `slots`, `history`는 별도 저장 (세션 상태)

---

## 8. 참고: 실제 구현 시 권장 구조

### 8.1 엔진 구조
- `ScenarioLoader`: 시나리오 로딩
- `Executor`: 노드 실행
- `Router`: 다음 노드 결정
- `StateStore`: 슬롯/변수 저장

### 8.2 실행 루프 (의사 코드)
```pseudo
state.currentNodeId = scenario.start_node_id
while state.currentNodeId != null:
  node = findNode(state.currentNodeId)
  output = executeNode(node, state)
  state.history.append(output)
  state.currentNodeId = resolveNextNode(node, output, scenario.edges, state)
```

---

## 9. 최소 필수 구현 체크리스트

- [ ] Scenario 스키마 파싱
- [ ] 노드 타입별 실행 함수 매핑
- [ ] 엣지 기반 분기 처리
- [ ] 슬롯/변수 상태 저장
- [ ] 실행 로그(history) 기록
- [ ] 종료 조건 처리

---

## 10. 요약

- 이 스펙은 **프론트 시뮬레이터와 동일한 동작**을 목표로 한다.
- 실제 챗봇 런타임은 이 스펙을 기반으로 노드/엣지를 순차 실행하면 된다.
- 백엔드는 데이터 저장, 상태 유지, 조건 분기 처리만 정확히 맞추면 된다.
