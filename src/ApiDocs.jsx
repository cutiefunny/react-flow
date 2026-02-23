import styles from './ApiDocs.module.css';

function ApiDocs() {
  const nodeStructure = `{
  "id": "string",         // 노드의 고유 ID
  "type": "string",       // 노드 유형 (예: "message", "form", "api")
  "position": {           // 캔버스 내 노드의 위치
    "x": "number",
    "y": "number"
  },
  "data": { ... },        // 노드 유형에 따른 데이터 객체
  "width": "number",      // 노드의 너비
  "height": "number"      // 노드의 높이
}`;

  const edgeStructure = `{
  "id": "string",             // 엣지(연결선)의 고유 ID
  "source": "string",         // 시작 노드의 ID
  "target": "string",         // 끝 노드의 ID
  "sourceHandle": "string | null" // 시작 노드의 특정 핸들 ID
}`;

  const requestBodyExample = `{
  "ten_id": "1000",
  "stg_id": "DEV",
  "category_id": "DEV_1000_S_1_1_1",
  "name": "예약 시나리오 (수정)",
  "job": "Process",
  "description": "시나리오 설명",
  "nodes": [ ... ],
  "edges": [ ... ],
  "start_node_id": "message-1"
}`;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>시나리오 API 명세서 (FastAPI)</h1>
        <p>
          FastAPI 백엔드 서버 기반 챗봇 시나리오, 템플릿, 설정 관리 API 명세입니다.
          <br />
          Base URL: <code>/api/v1/builder</code> (Frontend Proxy: <code>/api/proxy/chat</code>)
        </p>
      </header>

      {/* ================================================================================== */}
      {/* 1. 시나리오 (Scenarios) */}
      {/* ================================================================================== */}
      <h2 style={{borderBottom: '2px solid #333', paddingBottom: '10px', marginTop: '40px'}}>1. 시나리오 (Scenarios)</h2>
      <p>Base Path: <code>/scenarios</code></p>

      {/* --- GET List --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.get}`}>GET</span>
          <span className={styles.path}>/scenarios/{'{tenant_id}'}/{'{stage_id}'}</span>
        </div>
        <div className={styles.endpointBody}>
          <h2>전체 시나리오 목록 조회</h2>
          <dl>
            <dt>응답 (200 OK):</dt>
            <dd>
              <pre>{`{
  "scenarios": [
    {
      "id": "string",
      "name": "string",
      "job": "string",
      "description": "string",
      "updated_at": "datetime",
      "last_used_at": "datetime"
    },
    ...
  ]
}`}</pre>
            </dd>
          </dl>
        </div>
      </section>

      {/* --- GET Detail --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.get}`}>GET</span>
          <span className={styles.path}>/scenarios/{'{tenant_id}'}/{'{stage_id}'}/{'{scenario_id}'}</span>
        </div>
        <div className={styles.endpointBody}>
          <h2>특정 시나리오 상세 조회</h2>
          <dl>
            <dt>응답 (200 OK):</dt>
            <dd>
              <pre>{`{
  "id": "string",
  "name": "string",
  "job": "string",
  "description": "string",
  "nodes": Array<Node>,
  "edges": Array<Edge>,
  "start_node_id": "string | null",
  "created_at": "datetime",
  "updated_at": "datetime",
  "last_used_at": "datetime"
}`}</pre>
            </dd>
          </dl>
        </div>
      </section>

      {/* --- POST Create/Clone --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.post}`}>POST</span>
          <span className={styles.path}>/scenarios/{'{tenant_id}'}/{'{stage_id}'}</span>
        </div>
        <div className={styles.endpointBody}>
          <h2>시나리오 생성 및 복제</h2>
          <dl>
            <dt>요청 본문 (신규):</dt>
            <dd><pre>{`{
  "name": "string",
  "job": "string",
  "description": "string",
  "category_id": "string",
  "nodes": [],
  "edges": [],
  "start_node_id": null
}`}</pre></dd>
            <dt>요청 본문 (복제):</dt>
            <dd><pre>{`{
  "name": "string",
  "job": "string",
  "description": "string",
  "clone_from_id": "string", // 원본 ID
  "category_id": "string"
}`}</pre></dd>
          </dl>
        </div>
      </section>

      {/* --- PUT Update --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.put}`}>PUT</span>
          <span className={styles.path}>/scenarios/{'{tenant_id}'}/{'{stage_id}'}/{'{scenario_id}'}</span>
        </div>
        <div className={styles.endpointBody}>
          <h2>시나리오 전체 수정 (저장)</h2>
          <dl>
            <dt>요청 본문:</dt>
            <dd><pre>{requestBodyExample}</pre></dd>
          </dl>
        </div>
      </section>

      {/* --- PATCH Update --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.patch}`}>PATCH</span>
          <span className={styles.path}>/scenarios/{'{tenant_id}'}/{'{stage_id}'}/{'{scenario_id}'}</span>
        </div>
        <div className={styles.endpointBody}>
          <h2>시나리오 부분 수정 (이름/설명 또는 최근 사용시간)</h2>
          <dl>
            <dt>요청 본문 (이름/설명 변경):</dt>
            <dd><pre>{`{ "name": "...", "job": "...", "description": "..." }`}</pre></dd>
            <dt>요청 본문 (최근 사용 시간 갱신):</dt>
            <dd><pre>{`{ "last_used_at": "2025-..." }`}</pre></dd>
          </dl>
        </div>
      </section>

      {/* --- DELETE --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.delete}`}>DELETE</span>
          <span className={styles.path}>/scenarios/{'{tenant_id}'}/{'{stage_id}'}/{'{scenario_id}'}</span>
        </div>
        <div className={styles.endpointBody}>
          <h2>시나리오 삭제</h2>
        </div>
      </section>


      {/* ================================================================================== */}
      {/* 2. 템플릿 (Templates) */}
      {/* ================================================================================== */}
      <h2 style={{borderBottom: '2px solid #333', paddingBottom: '10px', marginTop: '60px'}}>2. 템플릿 (Templates)</h2>
      <p>Base Path: <code>/templates</code></p>

      {/* --- API Templates --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.get}`}>GET</span>
          <span className={`${styles.method} ${styles.post}`}>POST</span>
          <span className={`${styles.method} ${styles.delete}`}>DELETE</span>
          <span className={styles.path}>/templates/api/{'{tenant_id}'}</span>
        </div>
        <div className={styles.endpointBody}>
          <h2>API 템플릿 관리</h2>
          <p><code>GET</code>: 목록 조회 / <code>POST</code>: 템플릿 생성 / <code>DELETE</code>: 삭제 (/{'{template_id}'})</p>
          <dl>
            <dt>POST 요청 본문:</dt>
            <dd>
              <pre>{`{
  "name": "템플릿 이름",
  "method": "GET",
  "url": "https://api...",
  "headers": "{}",
  "body": "{}",
  "responseMapping": []
}`}</pre>
            </dd>
          </dl>
        </div>
      </section>

      {/* --- Form Templates --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.get}`}>GET</span>
          <span className={`${styles.method} ${styles.post}`}>POST</span>
          <span className={`${styles.method} ${styles.delete}`}>DELETE</span>
          <span className={styles.path}>/templates/form/{'{tenant_id}'}</span>
        </div>
        <div className={styles.endpointBody}>
          <h2>Form 템플릿 관리</h2>
          <p><code>GET</code>: 목록 조회 / <code>POST</code>: 템플릿 생성 / <code>DELETE</code>: 삭제 (/{'{template_id}'})</p>
          <dl>
            <dt>POST 요청 본문:</dt>
            <dd>
              <pre>{`{
  "name": "템플릿 이름",
  "title": "폼 제목",
  "elements": [ ...Form Elements... ]
}`}</pre>
            </dd>
          </dl>
        </div>
      </section>


      {/* ================================================================================== */}
      {/* 3. 설정 (Settings) */}
      {/* ================================================================================== */}
      <h2 style={{borderBottom: '2px solid #333', paddingBottom: '10px', marginTop: '60px'}}>3. 설정 (Settings)</h2>
      <p>Base Path: <code>/settings</code></p>

      {/* --- Node Visibility --- */}
      <section className={styles.endpoint}>
        <div className={styles.endpointHeader}>
          <span className={`${styles.method} ${styles.get}`}>GET</span>
          <span className={`${styles.method} ${styles.put}`}>PUT</span>
          <span className={styles.path}>/settings/{'{tenant_id}'}/node_visibility</span>
        </div>
        <div className={styles.endpointBody}>
          <h2>노드 표시 여부 설정 (Node Visibility)</h2>
          <p>관리자 패널에서 설정한 노드 타입별 표시/숨김 상태를 관리합니다.</p>
          <dl>
            <dt>요청/응답 본문:</dt>
            <dd>
              <pre>{`{
  "visibleNodeTypes": [
    "message",
    "form",
    "api",
    "branch"
    // ... 표시할 노드 타입 문자열 배열
  ]
}`}</pre>
            </dd>
          </dl>
        </div>
      </section>

    </div>
  );
}

export default ApiDocs;