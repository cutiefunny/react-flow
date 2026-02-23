// src/fastApi.js

import {
  MOCK_NODE_COLORS,
  MOCK_NODE_TEXT_COLORS,
  delay,
} from './mockData';

const BASE_URL = 'http://202.20.84.65:8083/api/v1/builder';

// 리소스별 Base URL 정의
const API_BASE_URL = `${BASE_URL}/scenarios`;
const SETTINGS_BASE_URL = `${BASE_URL}/settings`;
const TEMPLATE_BASE_URL = `${BASE_URL}/templates`;

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
    // GET 요청 시 슬래시 유무 확인이 필요할 수 있습니다.
    const response = await fetch(`${API_BASE_URL}`);
    const data = await handleApiResponse(response);
    const scenarios = data?.scenarios || (Array.isArray(data) ? data : []);
    
    return scenarios.map(scenario => ({
       ...scenario,
       name: scenario.name || scenario.title || '',
       title: scenario.title,
       job: scenario.job || 'Process',
       description: scenario.description || '',
       // Python snake_case -> JS camelCase 매핑
       updatedAt: scenario.updated_at || null,
       lastUsedAt: scenario.last_used_at || null,
    }));
};

export const createScenario = async ({ newScenarioName, job, description }) => {
    // 💡 405 에러 해결을 위해 엔드포인트 뒤에 / 를 붙이거나 백엔드 라우팅 설정을 확인해야 합니다.
    // 많은 경우 FastAPI는 /scenarios/ (POST) 처럼 마지막 슬래시를 명시적으로 요구할 수 있습니다.
    const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: newScenarioName,
            job: job,
            description: description,
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
  const response = await fetch(`${API_BASE_URL}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: newName,
      job: scenarioToClone.job,
      clone_from_id: scenarioToClone.id,
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
    const response = await fetch(`${API_BASE_URL}/${oldScenario.id}`, {
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
    const response = await fetch(`${API_BASE_URL}/${scenarioId}`, {
        method: 'DELETE',
    });
    return handleApiResponse(response);
};

export const fetchScenarioData = async ({ scenarioId }) => {
    if (!scenarioId) return { nodes: [], edges: [], startNodeId: null, description: '' };
    const response = await fetch(`${API_BASE_URL}/${scenarioId}`);
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
        name: scenario.name,
        job: scenario.job,
        description: scenario.description || '',
        nodes: data.nodes,
        edges: data.edges,
        start_node_id: data.startNodeId
    };

    const response = await fetch(`${API_BASE_URL}/${scenario.id}`, {
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
  const response = await fetch(`${API_BASE_URL}/${scenarioId}`, {
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

// --- 템플릿 (API/Form) 관련 함수 ---

// API Templates
export const fetchApiTemplates = async () => {
    const response = await fetch(`${TEMPLATE_BASE_URL}/api`);
    return handleApiResponse(response);
};

export const saveApiTemplate = async (templateData) => {
    const response = await fetch(`${TEMPLATE_BASE_URL}/api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
    });
    return handleApiResponse(response);
};

export const deleteApiTemplate = async (templateId) => {
    const response = await fetch(`${TEMPLATE_BASE_URL}/api/${templateId}`, {
        method: 'DELETE',
    });
    return handleApiResponse(response);
};

// Form Templates
export const fetchFormTemplates = async () => {
    const response = await fetch(`${TEMPLATE_BASE_URL}/form`);
    return handleApiResponse(response);
};

export const saveFormTemplate = async (templateData) => {
    const response = await fetch(`${TEMPLATE_BASE_URL}/form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
    });
    return handleApiResponse(response);
};

export const deleteFormTemplate = async (templateId) => {
    const response = await fetch(`${TEMPLATE_BASE_URL}/form/${templateId}`, {
        method: 'DELETE',
    });
    return handleApiResponse(response);
};

// --- 노드 표시 설정 (Settings) 관련 함수 (Mock 사용) ---

export const saveNodeVisibility = async (visibleNodeTypes) => {
    await delay();
    console.log('[Mock API] Saved node visibility');
    return { visibleNodeTypes };
};

export const fetchNodeVisibility = async () => {
    await delay();
    // 모든 노드 타입을 true로 반환
    const allNodeTypes = {
        message: true,
        apiNode: true,
        formNode: true,
        branchNode: true,
        delayNode: true,
        setSlotNode: true,
        slotFillingNode: true,
        fixedMenuNode: true,
        linkNode: true,
        iframeNode: true,
        toastNode: true,
        llmNode: true,
    };
    console.log('[Mock API] Fetching node visibility');
    return { visibleNodeTypes: allNodeTypes };
};

// Node Colors - Mock 사용
export const fetchNodeColors = async () => {
    await delay();
    console.log('[Mock API] Fetching node colors');
    return MOCK_NODE_COLORS;
};

export const saveNodeColors = async (colors) => {
    await delay();
    console.log('[Mock API] Saved node colors');
    return colors;
};

// Node Text Colors - Mock 사용
export const fetchNodeTextColors = async () => {
    await delay();
    console.log('[Mock API] Fetching node text colors');
    return MOCK_NODE_TEXT_COLORS;
};

export const saveNodeTextColors = async (textColors) => {
    await delay();
    console.log('[Mock API] Saved node text colors');
    return textColors;
};