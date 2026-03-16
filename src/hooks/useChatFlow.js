// src/hooks/useChatFlow.js

// ========================================================================
// == Chatbot Scenario Execution Reference Implementation ==
// This hook defines the standard logic for executing chatbot scenarios
// based on the defined node and edge structures. The actual chatbot engine
// should aim to replicate this behavior as closely as possible.
// ========================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import useStore from '../store';
import { interpolateMessage, getNestedValue, evaluateCondition, generateUniqueId } from '../simulatorUtils';
import * as nodeExecutor from '../nodeExecutors'; // 💡 [추가]
import * as scenarioCore from '@clt-chatbot/scenario-core';
const { ChatbotEngine } = scenarioCore;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// 💡 [추가] 노드 타입별 실행기(전략) 매핑
const executorMap = {
  start: nodeExecutor.invisible,
  message: nodeExecutor.message,
  form: nodeExecutor.form,
  branch: nodeExecutor.branch, // branch 실행기가 내부적으로 BUTTON/CONDITION 분기 처리
  slotfilling: nodeExecutor.slotfilling,
  api: null, // 비동기: 별도 처리
  llm: null, // 비동기: 별도 처리
  setSlot: nodeExecutor.setSlot,
  delay: nodeExecutor.delay,
  fixedmenu: nodeExecutor.fixedmenu,
  link: nodeExecutor.link,
  toast: nodeExecutor.toast,
  iframe: nodeExecutor.iframe,
  scenario: nodeExecutor.scenario,
};

export const useChatFlow = (nodes, edges) => {
  const [history, setHistory] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [fixedMenu, setFixedMenu] = useState(null);
  const [isStarted, setIsStarted] = useState(false);

  const engine = useRef(new ChatbotEngine({ nodes, edges, version: '1.0' }));
  
  useEffect(() => {
    engine.current = new ChatbotEngine({ nodes, edges, version: '1.0' });
  }, [nodes, edges]);

  const { slots, setSlots, anchorNodeId, startNodeId } = useStore();
  const currentNode = nodes.find(n => n.id === currentId);

  const addBotMessageRef = useRef(null);

  // --- 👇 [수정] activeChainId 인자 추가 ---
  const proceedToNextNode = useCallback((sourceHandleId, sourceNodeId, updatedSlots, activeChainId = null) => {
    if (sourceNodeId === anchorNodeId) {
        setCurrentId(null);
        return;
    }
    if (!sourceNodeId) return;

    const nextNode = engine.current.getNextNode(sourceNodeId, sourceHandleId, updatedSlots);

    if (nextNode) {
      setCurrentId(nextNode.id);
      if (addBotMessageRef.current) {
        addBotMessageRef.current(nextNode.id, updatedSlots, activeChainId);
      }
    } else {
      const sourceNode = nodes.find(n => n.id === sourceNodeId);
      if (sourceNode?.parentNode) {
        const parentEdge = edges.find(edge => edge.source === sourceNode.parentNode);
        if (parentEdge) {
          proceedToNextNode(parentEdge.sourceHandle, sourceNode.parentNode, updatedSlots, activeChainId);
        } else {
          setCurrentId(null);
        }
        return;
      }
      if (!engine.current.isInteractiveNode(sourceNode)) {
        setTimeout(() => setCurrentId(null), 500);
      }
    }
  }, [edges, nodes, anchorNodeId]); // addBotMessageRef 제거

  // --- 👇 [수정] activeChainId 인자 추가 ---
  const handleApiNode = useCallback(async (node, currentSlots, activeChainId = null) => {
    const loadingId = generateUniqueId(); // 고유 ID 사용
    // --- 👇 [수정] API 로딩은 chainNext와 상관없이 항상 즉시 표시 ---
    setHistory(prev => [...prev, { type: 'loading', id: loadingId }]);
    let finalSlots = { ...currentSlots };
    try {
        const { isMulti, apis } = node.data;

        const processApiCall = (apiCall) => {
            const interpolatedUrl = interpolateMessage(apiCall.url, currentSlots);
            const interpolatedHeaders = JSON.parse(interpolateMessage(apiCall.headers || '{}', currentSlots));

            const rawBody = apiCall.body || '{}';
            let finalBody;
             try {
                const interpolatedBodyString = interpolateMessage(rawBody, currentSlots);
                finalBody = interpolatedBodyString;
                 try {
                     JSON.parse(finalBody); // Validate if it's still JSON
                 } catch(e) {
                      console.warn("API body is not valid JSON after interpolation:", finalBody);
                 }
             } catch (e) {
                 console.error("Error processing API body string:", e);
                 throw new Error(`Invalid body format or interpolation error: ${e.message}`);
             }

            return fetch(interpolatedUrl, {
                method: apiCall.method,
                headers: { 'Content-Type': 'application/json', ...interpolatedHeaders },
                body: apiCall.method !== 'GET' && apiCall.method !== 'HEAD' ? finalBody : undefined,
            }).then(async res => {
                const resBody = await res.json().catch(() => null);
                if (!res.ok) {
                    const errorDetail = resBody ? (resBody.detail || JSON.stringify(resBody)) : res.statusText;
                    throw new Error(`API call '${apiCall.name || 'Unnamed'}' failed with status ${res.status}: ${errorDetail}`);
                 }
                return { data: resBody, mapping: apiCall.responseMapping, apiName: apiCall.name };
            });
        };

        const promises = isMulti ? (apis || []).map(processApiCall) : [processApiCall(node.data)];
        const results = await Promise.allSettled(promises);

        const failedCalls = results.filter(r => r.status === 'rejected');
        if (failedCalls.length > 0) {
             throw new Error(failedCalls[0].reason.message || `API call '${failedCalls[0].reason.apiName || 'Unnamed'}' failed.`);
        }

        const newSlots = {};
        results.forEach(res => {
            if (res.status === 'fulfilled') {
                const { data, mapping } = res.value;
                (mapping || []).forEach(m => {
                    if (m.path && m.slot) {
                        const value = getNestedValue(data, m.path);
                        if (value !== undefined) newSlots[m.slot] = value;
                    }
                });
            }
        });

        finalSlots = { ...currentSlots, ...newSlots };
        setSlots(finalSlots);
        setHistory(prev => prev.filter(item => item.id !== loadingId)); // 로딩 제거
        // --- 👇 [수정] activeChainId 인자 전달 ---
        proceedToNextNode('onSuccess', node.id, finalSlots, activeChainId);
    } catch (error) {
        console.error("API Error:", error);
        setHistory(prev => prev.filter(item => item.id !== loadingId)); // 로딩 제거
        // --- 👇 [수정] API 에러는 chainNext와 상관없이 항상 즉시 표시 ---
        setHistory(prev => [...prev, { type: 'bot', message: `API Error: ${error.message}`, id: generateUniqueId() }]); // 고유 ID 사용
        // --- 👇 [수정] activeChainId 인자 전달 (에러시 체인 중단) ---
        proceedToNextNode('onError', node.id, finalSlots, null); // 에러 발생 시 체인 중단
    }
  }, [setSlots, nodes, edges, anchorNodeId, proceedToNextNode]);

  // --- 👇 [수정] activeChainId 인자 추가 ---
  const handleLlmNode = useCallback(async (node, currentSlots, activeChainId = null) => {
    if (!GEMINI_API_KEY) {
      console.error("Gemini API key (VITE_GEMINI_API_KEY) is not set.");
      // --- 👇 [수정] LLM 에러는 chainNext와 상관없이 항상 즉시 표시 ---
      setHistory(prev => [...prev, { type: 'bot', message: "LLM Error: API key not configured.", id: generateUniqueId() }]); // 고유 ID 사용
      // --- 👇 [수정] activeChainId 인자 전달 (에러시 체인 중단) ---
      proceedToNextNode(null, node.id, currentSlots, null); // 에러 발생 시 체인 중단
      return;
    }

    // --- 👇 [수정] LLM 로딩 표시 ---
    const loadingId = generateUniqueId();
    setHistory(prev => [...prev, { type: 'loading', id: loadingId }]);
    let accumulatedContent = '';
    // 히스토리 추가 제거됨

    try {
      const interpolatedPrompt = interpolateMessage(node.data.prompt, currentSlots);
      // 모델 버전 gemini-2.0-flash 로 고정
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: interpolatedPrompt }] }],
          // generationConfig: { ... }
        }),
      });

      console.log("LLM Response Headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(`LLM API Error ${response.status}: ${errorBody.error?.message || 'Unknown error'}`);
      }
      if (!response.body) throw new Error('ReadableStream not available');

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';

      console.log("Starting to read stream...");

      while (true) {
        const { value, done } = await reader.read();
        // console.log("Reader Read:", { value: value ? value.substring(0, 100) + '...' : value, done });

        if (value) {
            buffer += value;
        }

        let boundaryIndex;
        while ((boundaryIndex = buffer.search(/\r?\n\r?\n/)) !== -1) {
          const message = buffer.substring(0, boundaryIndex);
          const boundaryLength = buffer.substring(boundaryIndex).startsWith('\r\n\r\n') ? 4 : 2;
          buffer = buffer.substring(boundaryIndex + boundaryLength);

          if (message.startsWith('data: ')) {
            const jsonString = message.substring(6).replace(/\r/g, '').trim();
            if (jsonString) {
              try {
                const jsonData = JSON.parse(jsonString);
                // console.log("Attempting to extract text from:", JSON.stringify(jsonData, null, 2));
                const contentChunk = jsonData.candidates?.[0]?.content?.parts?.[0]?.text || '';
                // console.log(`Extracted Chunk: "${contentChunk}" (Type: ${typeof contentChunk})`);

                if (contentChunk) {
                  accumulatedContent += contentChunk;
                  // 히스토리 업데이트 제거됨
                  // console.log("Accumulated content NOW:", accumulatedContent);
                } else {
                   // console.log("contentChunk extraction failed or resulted in empty string.");
                }
              } catch (parseError) {
                console.error("Error parsing LLM stream chunk:", parseError, "Original Message:", message);
              }
            } else {
                 // console.log("Skipping empty jsonString after 'data: '.");
            }
          } else if (message.trim()) {
              console.log("Received non-data message:", message);
          } else {
              // console.log("Skipping message not starting with 'data: ':", message);
          }
        } // 내부 while 종료

        if (done) {
          console.log("Stream finished.");
          break;
        }
      } // 외부 while 종료
    } catch (error) {
       console.error("LLM Error:", error);
      accumulatedContent = `LLM Error: ${error.message}`;
      // 에러 시 히스토리 추가
      // --- 👇 [수정] LLM 에러는 chainNext와 상관없이 항상 즉시 표시 ---
      setHistory(prev => [...prev, { type: 'bot', message: accumulatedContent, id: generateUniqueId() }]); // 고유 ID 사용
    } finally {
      // --- 👇 [수정] LLM 로딩 제거 ---
      setHistory(prev => prev.filter(item => item.id !== loadingId));
      console.log("Finally block reached. Final accumulated content:", accumulatedContent);
      // 히스토리 업데이트 제거됨

      let finalSlots = { ...currentSlots };
      if (node.data.outputVar && !accumulatedContent.startsWith('LLM Error:')) {
        finalSlots[node.data.outputVar] = accumulatedContent;
        setSlots(finalSlots);
        console.log(`LLM Response stored in slot '${node.data.outputVar}'.`);
      } else if (node.data.outputVar) {
        console.log(`LLM Error occurred, not storing in slot '${node.data.outputVar}'.`);
      }
      // LLM 노드는 사용자에게 보여지는 부분이 없으므로 바로 다음 노드로 진행
      // --- 👇 [수정] activeChainId 인자 전달 (에러시 체인 중단) ---
      const nextChainId = accumulatedContent.startsWith('LLM Error:') ? null : activeChainId;
      proceedToNextNode(null, node.id, finalSlots, nextChainId);
    }
  }, [setSlots, nodes, edges, anchorNodeId, proceedToNextNode]); // proceedToNextNode 의존성 유지

  // --- 👇 [수정] addBotMessage 함수 전체 리팩토링 ---
  const addBotMessage = useCallback((nodeId, updatedSlots, activeChainId = null) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // 1. 비동기 노드 (api, llm)는 별도 핸들러로 즉시 위임
    if (node.type === 'api') {
      handleApiNode(node, updatedSlots, activeChainId);
      return;
    }
    if (node.type === 'llm') {
      handleLlmNode(node, updatedSlots, activeChainId);
      return;
    }

    // 2. executorMap에서 노드 타입에 맞는 실행기(전략) 조회
    const executor = executorMap[node.type];

    if (executor) {
        // 3. 실행기에 전달할 컨텍스트(Context) 객체 생성
        const executionContext = {
            node,
            updatedSlots,
            activeChainId,
            nodes,
            edges,
            setSlots,
            setHistory,
            setFixedMenu,
            setCurrentId,
            proceedToNextNode: proceedToNextNode,
            addBotMessage: (id, slots, chainId) => addBotMessageRef.current(id, slots, chainId) // 재귀 호출용
        };
        
        // 4. 실행기(전략) 실행
        executor(executionContext);
    } else {
        console.warn(`No executor found for node type: ${node.type}. Proceeding to next node.`);
        proceedToNextNode(null, nodeId, updatedSlots, activeChainId);
    }

  }, [nodes, edges, setSlots, handleApiNode, handleLlmNode, proceedToNextNode, setFixedMenu, setCurrentId]);
  // --- 👆 [수정 끝] ---

  useEffect(() => {
    addBotMessageRef.current = addBotMessage;
  }, [addBotMessage]);

  const startSimulation = useCallback(() => {
    setIsStarted(true);
    let effectiveStartNodeId = startNodeId;
    if (!effectiveStartNodeId) {
      let startNode = nodes.find(n => n.type === 'start');
      if (!startNode) {
          startNode = nodes.find(n => !edges.some(e => e.target === n.id) && !n.parentNode);
      }
      effectiveStartNodeId = startNode?.id;
    }
    if (effectiveStartNodeId) {
      setSlots({});
      setFixedMenu(null);
      setHistory([]);
      setCurrentId(effectiveStartNodeId);
      if (addBotMessageRef.current) {
        // --- 👇 [수정] 체인 시작 (null 전달) ---
          addBotMessageRef.current(effectiveStartNodeId, {}, null);
      }
    } else {
        console.warn("No start node found for simulation.");
        setIsStarted(false);
    }
  }, [nodes, edges, setSlots, startNodeId]);

  useEffect(() => {
     setIsStarted(false);
    setHistory([]);
    setCurrentId(null);
    setFixedMenu(null);
  }, [nodes, edges]);

  return {
    history, setHistory, currentId, currentNode, fixedMenu, isStarted, startSimulation, proceedToNextNode
  };
};