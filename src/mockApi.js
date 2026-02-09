// Mock API Service Layer
// This file implements mock API functions with the same interface as fastApi.js
// Later, simply switch between mockApi.js and fastApi.js in backendService.js

import {
  MOCK_SCENARIOS,
  MOCK_API_TEMPLATES,
  MOCK_FORM_TEMPLATES,
  MOCK_NODE_VISIBILITY,
  MOCK_NODE_COLORS,
  MOCK_NODE_TEXT_COLORS,
  addTimestamps,
  delay,
} from './mockData';

// Store for in-memory data mutations
let mockStore = {
  scenarios: JSON.parse(JSON.stringify(MOCK_SCENARIOS)),
  apiTemplates: JSON.parse(JSON.stringify(MOCK_API_TEMPLATES)),
  formTemplates: JSON.parse(JSON.stringify(MOCK_FORM_TEMPLATES)),
  nodeVisibility: JSON.parse(JSON.stringify(MOCK_NODE_VISIBILITY)),
  nodeColors: JSON.parse(JSON.stringify(MOCK_NODE_COLORS)),
  nodeTextColors: JSON.parse(JSON.stringify(MOCK_NODE_TEXT_COLORS)),
};

// Scenario Management
export const fetchScenarios = async () => {
  await delay();
  console.log('[Mock API] Fetching scenarios...');
  return mockStore.scenarios.map((scenario) => ({
    ...scenario,
    updatedAt: scenario.updated_at,
    lastUsedAt: scenario.last_used_at,
  }));
};

export const createScenario = async ({ newScenarioName, job, description }) => {
  await delay();
  const newScenario = {
    id: `scenario-${Date.now()}`,
    name: newScenarioName,
    job,
    description,
    category_id: 'DEV_1000_S_1_1_1',
    nodes: [],
    edges: [],
    start_node_id: null,
    ...addTimestamps({}),
  };
  mockStore.scenarios.push(newScenario);
  console.log('[Mock API] Created scenario:', newScenarioName);
  return {
    ...newScenario,
    startNodeId: newScenario.start_node_id,
    updatedAt: newScenario.updated_at,
    lastUsedAt: newScenario.last_used_at,
  };
};

export const renameScenario = async ({ oldScenario, newName, job, description }) => {
  await delay();
  const scenarioIndex = mockStore.scenarios.findIndex((s) => s.id === oldScenario.id);
  if (scenarioIndex === -1) {
    throw new Error('Scenario not found');
  }
  
  if (newName !== oldScenario.name && mockStore.scenarios.some((s) => s.name === newName)) {
    throw new Error('A scenario with that name already exists');
  }

  mockStore.scenarios[scenarioIndex] = {
    ...mockStore.scenarios[scenarioIndex],
    name: newName,
    job,
    description,
    updated_at: new Date().toISOString(),
  };

  console.log('[Mock API] Renamed scenario to:', newName);
  return mockStore.scenarios[scenarioIndex];
};

export const deleteScenario = async ({ scenarioId }) => {
  await delay();
  const index = mockStore.scenarios.findIndex((s) => s.id === scenarioId);
  if (index === -1) {
    throw new Error('Scenario not found');
  }
  mockStore.scenarios.splice(index, 1);
  console.log('[Mock API] Deleted scenario:', scenarioId);
};

export const cloneScenario = async ({ scenarioToClone, newName }) => {
  await delay();
  if (mockStore.scenarios.some((s) => s.name === newName)) {
    throw new Error('A scenario with that name already exists');
  }

  const clonedScenario = {
    ...JSON.parse(JSON.stringify(scenarioToClone)),
    id: `scenario-${Date.now()}`,
    name: newName,
    ...addTimestamps({}),
  };

  mockStore.scenarios.push(clonedScenario);
  console.log('[Mock API] Cloned scenario:', newName);
  return {
    ...clonedScenario,
    startNodeId: clonedScenario.start_node_id,
    updatedAt: clonedScenario.updated_at,
    lastUsedAt: clonedScenario.last_used_at,
  };
};

export const fetchScenarioData = async ({ scenarioId }) => {
  await delay();
  if (!scenarioId) return { nodes: [], edges: [], startNodeId: null, description: '' };

  const scenario = mockStore.scenarios.find((s) => s.id === scenarioId);
  if (!scenario) {
    console.warn('[Mock API] Scenario not found:', scenarioId);
    return { nodes: [], edges: [], startNodeId: null, description: '' };
  }

  console.log('[Mock API] Fetched scenario data:', scenarioId);
  return {
    ...scenario,
    nodes: scenario.nodes || [],
    edges: scenario.edges || [],
    startNodeId: scenario.start_node_id,
    updatedAt: scenario.updated_at,
    lastUsedAt: scenario.last_used_at,
  };
};

export const saveScenarioData = async ({ scenario, data }) => {
  await delay();
  if (!scenario || !scenario.id) {
    throw new Error('No scenario selected to save');
  }

  const scenarioIndex = mockStore.scenarios.findIndex((s) => s.id === scenario.id);
  if (scenarioIndex === -1) {
    throw new Error('Scenario not found');
  }

  mockStore.scenarios[scenarioIndex] = {
    ...mockStore.scenarios[scenarioIndex],
    nodes: data.nodes,
    edges: data.edges,
    start_node_id: data.startNodeId,
    name: scenario.name,
    job: scenario.job,
    description: scenario.description,
    updated_at: new Date().toISOString(),
  };

  console.log('[Mock API] Saved scenario data:', scenario.id);
  return mockStore.scenarios[scenarioIndex];
};

export const updateScenarioLastUsed = async ({ scenarioId }) => {
  await delay();
  const scenario = mockStore.scenarios.find((s) => s.id === scenarioId);
  if (!scenario) {
    throw new Error('Scenario not found');
  }

  scenario.last_used_at = new Date().toISOString();
  console.log('[Mock API] Updated last used:', scenarioId);
  return {
    ...scenario,
    startNodeId: scenario.start_node_id,
    updatedAt: scenario.updated_at,
    lastUsedAt: scenario.last_used_at,
  };
};

// API Templates
export const fetchApiTemplates = async () => {
  await delay();
  console.log('[Mock API] Fetching API templates...');
  return mockStore.apiTemplates;
};

export const saveApiTemplate = async (templateData) => {
  await delay();
  const newTemplate = {
    id: `api-template-${Date.now()}`,
    ...templateData,
  };
  mockStore.apiTemplates.push(newTemplate);
  console.log('[Mock API] Saved API template:', templateData.name);
  return newTemplate;
};

export const deleteApiTemplate = async (templateId) => {
  await delay();
  const index = mockStore.apiTemplates.findIndex((t) => t.id === templateId);
  if (index === -1) {
    throw new Error('Template not found');
  }
  mockStore.apiTemplates.splice(index, 1);
  console.log('[Mock API] Deleted API template:', templateId);
};

// Form Templates
export const fetchFormTemplates = async () => {
  await delay();
  console.log('[Mock API] Fetching form templates...');
  return mockStore.formTemplates;
};

export const saveFormTemplate = async (templateData) => {
  await delay();
  const newTemplate = {
    id: `form-template-${Date.now()}`,
    ...templateData,
  };
  mockStore.formTemplates.push(newTemplate);
  console.log('[Mock API] Saved form template:', templateData.name);
  return newTemplate;
};

export const deleteFormTemplate = async (templateId) => {
  await delay();
  const index = mockStore.formTemplates.findIndex((t) => t.id === templateId);
  if (index === -1) {
    throw new Error('Template not found');
  }
  mockStore.formTemplates.splice(index, 1);
  console.log('[Mock API] Deleted form template:', templateId);
};

// Node Settings - Visibility
export const fetchNodeVisibility = async () => {
  await delay();
  console.log('[Mock API] Fetching node visibility...');
  return mockStore.nodeVisibility;
};

export const saveNodeVisibility = async (visibleNodeTypes) => {
  await delay();
  mockStore.nodeVisibility = { visibleNodeTypes };
  console.log('[Mock API] Saved node visibility');
  return mockStore.nodeVisibility;
};

// Node Colors
export const fetchNodeColors = async () => {
  await delay();
  console.log('[Mock API] Fetching node colors...');
  return mockStore.nodeColors;
};

export const saveNodeColors = async (colors) => {
  await delay();
  mockStore.nodeColors = colors;
  console.log('[Mock API] Saved node colors');
  return mockStore.nodeColors;
};

// Node Text Colors
export const fetchNodeTextColors = async () => {
  await delay();
  console.log('[Mock API] Fetching node text colors...');
  return mockStore.nodeTextColors;
};

export const saveNodeTextColors = async (textColors) => {
  await delay();
  mockStore.nodeTextColors = textColors;
  console.log('[Mock API] Saved node text colors');
  return mockStore.nodeTextColors;
};

// Utility: Reset mock data to initial state
export const resetMockData = () => {
  mockStore = {
    scenarios: JSON.parse(JSON.stringify(MOCK_SCENARIOS)),
    apiTemplates: JSON.parse(JSON.stringify(MOCK_API_TEMPLATES)),
    formTemplates: JSON.parse(JSON.stringify(MOCK_FORM_TEMPLATES)),
    nodeVisibility: JSON.parse(JSON.stringify(MOCK_NODE_VISIBILITY)),
    nodeColors: JSON.parse(JSON.stringify(MOCK_NODE_COLORS)),
    nodeTextColors: JSON.parse(JSON.stringify(MOCK_NODE_TEXT_COLORS)),
  };
  console.log('[Mock API] Data reset to initial state');
};

// Utility: Get current mock store state (for debugging)
export const getMockStoreState = () => {
  console.log('[Mock API] Current store state:', mockStore);
  return JSON.parse(JSON.stringify(mockStore));
};
