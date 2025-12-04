// src/fastApi.js

// 💡 [수정] 제공해주신 Mock API 엔드포인트 설정
const BASE_URL = 'https://musclecat-api.vercel.app/api/v1/chat';

// 리소스별 Base URL 정의
const API_BASE_URL = `${BASE_URL}/scenarios`;
const SETTINGS_BASE_URL = `${BASE_URL}/settings`;
const TEMPLATE_BASE_URL = `${BASE_URL}/templates`;

const TENANT_ID = '1000';
const STAGE_ID = 'DEV';

const handleApiResponse = async (response) => {
    if (!response.ok) {
        let errorDetail = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            // FastAPI의 HTTPException detail 파싱
            errorDetail = errorData.detail ? JSON.stringify(errorData.detail) : errorDetail;
        } catch (e) {
            // JSON 파싱 실패 시, 상태 코드로 오류 메시지 설정
        }
        throw new Error(errorDetail);
    }
    if (response.status === 204) {
        return;
    }
    return response.json();
};

export const fetchScenarios = async () => {
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}`);
    const data = await handleApiResponse(response);
    const scenarios = data?.scenarios || (Array.isArray(data) ? data : []);
    
    return scenarios.map(scenario => ({
       ...scenario,
       job: scenario.job || 'Process',
       description: scenario.description || '',
       // Python snake_case -> JS camelCase 매핑
       updatedAt: scenario.updated_at || null,
       lastUsedAt: scenario.last_used_at || null,
    }));
};

export const createScenario = async ({ newScenarioName, job, description }) => {
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: newScenarioName,
            job: job,
            description: description,
            category_id: 'DEV_1000_S_1_1_1',
            nodes: [],
            edges: [],
            start_node_id: null
        }),
    });
    const data = await handleApiResponse(response);
    return { 
        ...data, 
        startNodeId: data.start_node_id, 
        description: data.description || '', 
        updatedAt: data.updated_at || null, 
        lastUsedAt: data.last_used_at || null 
    };
};

export const cloneScenario = async ({ scenarioToClone, newName }) => {
  const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: newName,
      job: scenarioToClone.job,
      clone_from_id: scenarioToClone.id,
      category_id: 'DEV_1000_S_1_1_1',
      description: scenarioToClone.description
    }),
  });
  const data = await handleApiResponse(response);
  return { 
      ...data, 
      startNodeId: data.start_node_id, 
      description: data.description || '', 
      updatedAt: data.updated_at || null, 
      lastUsedAt: data.last_used_at || null 
  };
};

export const renameScenario = async ({ oldScenario, newName, job, description }) => {
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${oldScenario.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, job: job, description: description }),
    });
    const data = await handleApiResponse(response);
    return { 
        ...data, 
        startNodeId: data.start_node_id, 
        description: data.description || '', 
        updatedAt: data.updated_at || null, 
        lastUsedAt: data.last_used_at || null 
    };
};

export const deleteScenario = async ({ scenarioId }) => {
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${scenarioId}`, {
        method: 'DELETE',
    });
    return handleApiResponse(response);
};

export const fetchScenarioData = async ({ scenarioId }) => {
    if (!scenarioId) return { nodes: [], edges: [], startNodeId: null, description: '' };
    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${scenarioId}`);
    const data = await handleApiResponse(response);
    return {
        ...data,
        nodes: data.nodes || [],
        edges: data.edges || [],
        startNodeId: data.start_node_id || null,
        description: data.description || '',
        updatedAt: data.updated_at || null,
        lastUsedAt: data.last_used_at || null
    };
};

export const saveScenarioData = async ({ scenario, data }) => {
    if (!scenario || !scenario.id) {
        throw new Error('No scenario selected to save.');
    }

    const payload = {
        ten_id: TENANT_ID,
        stg_id: STAGE_ID,
        category_id: "DEV_1000_S_1_1_1",
        name: scenario.name,
        job: scenario.job,
        description: scenario.description || '',
        nodes: data.nodes,
        edges: data.edges,
        start_node_id: data.startNodeId
    };

    const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${scenario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const responseData = await handleApiResponse(response);
    return { 
        ...responseData, 
        startNodeId: responseData.start_node_id, 
        description: responseData.description || '', 
        updatedAt: responseData.updated_at || null, 
        lastUsedAt: responseData.last_used_at || null 
    };
};

export const updateScenarioLastUsed = async ({ scenarioId }) => {
  const response = await fetch(`${API_BASE_URL}/${TENANT_ID}/${STAGE_ID}/${scenarioId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ last_used_at: new Date().toISOString() }), 
  });
  const data = await handleApiResponse(response);
  return { 
      ...data, 
      startNodeId: data.start_node_id, 
      description: data.description || '', 
      updatedAt: data.updated_at || null, 
      lastUsedAt: data.last_used_at || null 
  };
};

// --- 💡 [구현] 템플릿 (API/Form) 관련 함수 (Mock API 명세 반영) ---

// API Templates
export const fetchApiTemplates = async () => {
    const response = await fetch(`${TEMPLATE_BASE_URL}/api/${TENANT_ID}`);
    return handleApiResponse(response);
};

export const saveApiTemplate = async (templateData) => {
    const response = await fetch(`${TEMPLATE_BASE_URL}/api/${TENANT_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
    });
    return handleApiResponse(response);
};

export const deleteApiTemplate = async (templateId) => {
    const response = await fetch(`${TEMPLATE_BASE_URL}/api/${TENANT_ID}/${templateId}`, {
        method: 'DELETE',
    });
    return handleApiResponse(response);
};

// Form Templates
export const fetchFormTemplates = async () => {
    const response = await fetch(`${TEMPLATE_BASE_URL}/form/${TENANT_ID}`);
    return handleApiResponse(response);
};

export const saveFormTemplate = async (templateData) => {
    const response = await fetch(`${TEMPLATE_BASE_URL}/form/${TENANT_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
    });
    return handleApiResponse(response);
};

export const deleteFormTemplate = async (templateId) => {
    const response = await fetch(`${TEMPLATE_BASE_URL}/form/${TENANT_ID}/${templateId}`, {
        method: 'DELETE',
    });
    return handleApiResponse(response);
};

// --- 💡 [구현] 노드 표시 설정 (Settings) 관련 함수 (Mock API 명세 반영) ---

export const saveNodeVisibility = async (visibleNodeTypes) => {
    const response = await fetch(`${SETTINGS_BASE_URL}/${TENANT_ID}/node_visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibleNodeTypes }),
    });
    return handleApiResponse(response);
};

export const fetchNodeVisibility = async () => {
    const response = await fetch(`${SETTINGS_BASE_URL}/${TENANT_ID}/node_visibility`);
    // 404 등 실패 시 null을 반환하여 Store에서 기본값을 사용하도록 함
    if (!response.ok) return null;
    return handleApiResponse(response);
};