// src/backendService.js

import * as fastApi from './fastApi';
import * as mockApi from './mockApi';
import { interpolateMessage } from './simulatorUtils';
import useStore from './store';

// Use mock API by default when VITE_USE_MOCK_API is true, or when FastAPI is not available
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

const services = {
  fastapi: USE_MOCK_API ? mockApi : fastApi,
  mock: mockApi,
};

const getService = (backend) => {
  const service = services[backend] || services.fastapi;
  if (!service) {
    throw new Error(`Invalid backend specified: ${backend}`);
  }
  return service;
};

// Log which API is being used
if (USE_MOCK_API) {
  console.log('🔧 [Development Mode] Using Mock API for testing');
} else {
  console.log('🚀 [Production Mode] Using Real FastAPI backend');
}

export const fetchScenarios = (backend, args) => getService(backend).fetchScenarios(args);
export const createScenario = (backend, args) => getService(backend).createScenario(args);
export const renameScenario = (backend, args) => getService(backend).renameScenario(args);
export const deleteScenario = (backend, args) => getService(backend).deleteScenario(args);
export const fetchScenarioData = (backend, args) => getService(backend).fetchScenarioData(args);
export const saveScenarioData = (backend, args) => getService(backend).saveScenarioData(args);
export const cloneScenario = (backend, args) => getService(backend).cloneScenario(args);
export const updateScenarioLastUsed = (backend, args) => getService(backend).updateScenarioLastUsed(args);

// API Templates
export const fetchApiTemplates = (backend, args) => getService(backend).fetchApiTemplates(args);
export const saveApiTemplate = (backend, args) => getService(backend).saveApiTemplate(args);
export const deleteApiTemplate = (backend, args) => getService(backend).deleteApiTemplate(args);

// Form Templates
export const fetchFormTemplates = (backend, args) => getService(backend).fetchFormTemplates(args);
export const saveFormTemplate = (backend, args) => getService(backend).saveFormTemplate(args);
export const deleteFormTemplate = (backend, args) => getService(backend).deleteFormTemplate(args);

// --- 💡 [추가] Node Visibility Settings ---
export const fetchNodeVisibility = (backend, args) => getService(backend).fetchNodeVisibility(args);
export const saveNodeVisibility = (backend, args) => getService(backend).saveNodeVisibility(args);
// --- 💡 [추가 끝] ---

// --- 💡 [추가] Node Colors Settings ---
export const fetchNodeColors = (backend, args) => getService(backend).fetchNodeColors(args);
export const saveNodeColors = (backend, args) => getService(backend).saveNodeColors(args);
// --- 💡 [추가 끝] ---

// --- 💡 [추가] Node Text Colors Settings ---
export const fetchNodeTextColors = (backend, args) => getService(backend).fetchNodeTextColors(args);
export const saveNodeTextColors = (backend, args) => getService(backend).saveNodeTextColors(args);
// --- 💡 [추가 끝] ---


export const testApiCall = async (apiCall) => {
  // ... (기존 API 테스트 로직 유지) ...
  const { slots } = useStore.getState();
  const interpolatedUrl = interpolateMessage(apiCall.url, slots);
  const interpolatedHeaders = JSON.parse(interpolateMessage(apiCall.headers || '{}', slots));

  const rawBody = apiCall.body || '{}';
  const finalBody = interpolateMessage(rawBody, slots);

  const options = {
    method: apiCall.method,
    headers: { 'Content-Type': 'application/json', ...interpolatedHeaders },
    body: (apiCall.method !== 'GET' && apiCall.method !== 'HEAD') ? finalBody : undefined,
  };

  const response = await fetch(interpolatedUrl, options);

  let result;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
      try {
          result = await response.json();
      } catch (e) {
          result = await response.text();
      }
  } else {
      result = await response.text();
  }

  if (!response.ok) {
      const errorMessage = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
  }

  return result;
};