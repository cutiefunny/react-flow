// src/simulatorUtils.js
import * as scenarioCore from '@clt-chatbot/scenario-core';
const { ChatbotEngine } = scenarioCore;

// Dummy scenario data for engine initialization (Utility only)
const engine = new ChatbotEngine({ nodes: [], edges: [], version: '1.0' });

// ========================================================================
// == Chatbot Scenario Utility Functions Reference ==
// This file contains utility functions used by the scenario simulator
// (useChatFlow.js). Functions like interpolateMessage and evaluateCondition
// represent the standard way these operations should be performed.
// The actual chatbot engine should use equivalent logic.
// ========================================================================

/**
 * 고유 ID를 생성합니다.
 * @returns {string}
 */
export const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * 메시지 문자열 내의 {{slotName}} 구문을 실제 슬롯 값으로 치환하는 함수.
 * 모든 노드 타입에서 이 함수를 사용합니다.
 * @param {string} message - 치환할 대상 문자열
 * @param {object} slots - 현재 슬롯 값 객체
 * @returns {string} 슬롯 값이 치환된 문자열
 */
export const interpolateMessage = (message, slots) => {
    return engine.interpolateMessage(message, slots);
};

export const getNestedValue = (obj, path) => {
    return engine.getDeepValue(obj, path);
};

// 💡 [추가] 객체의 깊은 경로에 값을 설정하는 setNestedValue 함수
/**
 * 객체의 깊은 경로에 값을 설정하는 함수입니다.
 * @param {object} obj - 업데이트할 객체
 * @param {string} path - 설정할 경로 (예: 'a.b.c' 또는 'a[0].b')
 * @param {*} value - 설정할 값
 */
export const setNestedValue = (obj, path, value) => {
    if (!path) return obj;
    // 경로를 . 기준으로 분리하되, 배열 인덱스 표기법 [숫자]는 .숫자로 변환
    const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    let current = obj;
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
            // 마지막 부분이면 값 설정
            current[part] = value;
        } else {
            // 중간 경로
            if (!current[part] || typeof current[part] !== 'object') {
                // 다음 부분이 숫자라면 배열로, 아니라면 객체로 초기화
                const nextPart = parts[i + 1];
                if (nextPart !== undefined && !isNaN(parseInt(nextPart, 10)) && String(parseInt(nextPart, 10)) === nextPart) {
                     current[part] = [];
                } else {
                     current[part] = {};
                }
            }
            current = current[part];
        }
    }
    return obj;
};

export const validateInput = (value, validation) => {
  if (!validation) return true;
// ... (validateInput 로직 생략)
  switch (validation.type) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'phone number':
      return /^\d{2,3}-\d{3,4}-\d{4}$/.test(value);
    case 'custom':
        if (validation.regex) { // Input type custom
            try {
                return new RegExp(validation.regex).test(value);
            } catch (e) {
                console.error("Invalid regex:", validation.regex);
                return false;
            }
        } else if (validation.startDate && validation.endDate) { // Date type custom
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
            const selectedDate = new Date(value);
            const startDate = new Date(validation.startDate);
            const endDate = new Date(validation.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            return selectedDate >= startDate && selectedDate <= endDate;
        }
        return true;
    case 'today after':
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const selectedDateAfter = new Date(value);
      const todayAfter = new Date();
      todayAfter.setHours(0, 0, 0, 0);
      return selectedDateAfter >= todayAfter;
    case 'today before':
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const selectedDateBefore = new Date(value);
      const todayBefore = new Date();
      todayBefore.setHours(23, 59, 59, 999);
      return selectedDateBefore <= todayBefore;
    default:
      return true;
  }
};

export const evaluateCondition = (slotValue, operator, condition, slots) => {
  let conditionValue = condition.value;
  if (condition.valueType === 'slot') {
    conditionValue = getNestedValue(slots, condition.value);
  }
  return engine.evaluateCondition(slotValue, operator, conditionValue);
};