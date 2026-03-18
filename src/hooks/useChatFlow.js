import { useState, useEffect, useCallback, useRef } from 'react';
import useStore from '../store';
import { generateUniqueId } from '../simulatorUtils';
import * as scenarioCore from '@clt-chatbot/scenario-core';
const { ChatbotEngine } = scenarioCore;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const useChatFlow = (nodes, edges) => {
  const [history, setHistory] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [fixedMenu, setFixedMenu] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const activeChainIdRef = useRef(null);

  const engine = useRef(new ChatbotEngine({ nodes, edges, version: '1.0' }));

  useEffect(() => {
    engine.current = new ChatbotEngine({ nodes, edges, version: '1.0' });
  }, [nodes, edges]);

  const { slots, setSlots, anchorNodeId, startNodeId } = useStore();
  const currentNode = nodes.find(n => n.id === currentId);

  // 시나리오 실행 코어 로직
  const runScenario = useCallback(async (targetNodeId, currentSlots) => {
    // targetNodeId가 null이면 라이브러리의 종료 시퀀스가 실행됩니다.

    // 시뮬레이터 특화: 실행 전 로딩 상태가 있다면 제거
    setHistory(prev => prev.filter(item => item.type !== 'loading'));

    const result = await engine.current.run(targetNodeId, currentSlots, {
      onMessage: (node, updatedSlots) => {
        const interpolatedText = engine.current.interpolateMessage(node.data?.content || node.data?.title || '', updatedSlots);

        const isInteractive = engine.current.isInteractiveNode(node);
        const isSystem = node.data?.isSystem === true;
        const isChaining = !isSystem && node.data?.chainNext === true && !isInteractive;

        const nodeDataPacket = {
          type: node.type,
          nodeId: node.id,
          data: { ...node.data, content: interpolatedText, isSystem }
        };

        if (activeChainIdRef.current && !isSystem) {
          // 기존 체인에 추가
          setHistory(prev => prev.map(item =>
            item.id === activeChainIdRef.current
              ? {
                ...item,
                combinedData: [...item.combinedData, nodeDataPacket],
                isChaining,
                isCompleted: !isInteractive
              }
              : item
          ));
        } else {
          // 새 체인(말풍선) 시작 (시스템 메시지도 포함)
          const newId = generateUniqueId();
          setHistory(prev => [...prev, {
            type: 'bot',
            id: newId,
            combinedData: [nodeDataPacket],
            isChaining,
            isCompleted: !isInteractive,
            isSystem: isSystem
          }]);
          if (isChaining) activeChainIdRef.current = newId;
        }

        if (!isChaining) activeChainIdRef.current = null;
      },
      onDelay: async (node) => {
        await new Promise(resolve => setTimeout(resolve, node.data.duration || 1000));
      },
      onApi: async (node, slots) => {
        const loadingId = generateUniqueId();
        setHistory(prev => [...prev, { type: 'loading', id: loadingId }]);

        try {
          const { isMulti, apis } = node.data;
          const processApiCall = async (apiCall) => {
            const url = engine.current.interpolateMessage(apiCall.url, slots);
            const headers = JSON.parse(engine.current.interpolateMessage(apiCall.headers || '{}', slots));
            const body = engine.current.interpolateMessage(apiCall.body || '{}', slots);

            const res = await fetch(url, {
              method: apiCall.method,
              headers: { 'Content-Type': 'application/json', ...headers },
              body: apiCall.method !== 'GET' ? body : undefined
            });
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const data = await res.json();
            return { data, mapping: apiCall.responseMapping };
          };

          const results = await Promise.all(isMulti ? apis.map(processApiCall) : [processApiCall(node.data)]);
          const newSlots = { ...slots };
          results.forEach(res => {
            (res.mapping || []).forEach(m => {
              const val = engine.current.getDeepValue(res.data, m.path);
              if (val !== undefined) newSlots[m.slot] = val;
            });
          });

          setSlots(newSlots);
          setHistory(prev => prev.filter(item => item.id !== loadingId));
          return { success: true, newSlots };
        } catch (error) {
          setHistory(prev => prev.filter(item => item.id !== loadingId));
          setHistory(prev => [...prev, { type: 'bot', message: `API Error: ${error.message}`, id: generateUniqueId() }]);
          return { success: false, newSlots: slots };
        }
      },
      onLlm: async (node, slots) => {
        if (!GEMINI_API_KEY) {
          setHistory(prev => [...prev, { type: 'bot', message: "LLM Error: API key not configured.", id: generateUniqueId() }]);
          return { success: false, newSlots: slots };
        }
        const loadingId = generateUniqueId();
        setHistory(prev => [...prev, { type: 'loading', id: loadingId }]);
        let accumulatedContent = '';
        try {
          const interpolatedPrompt = engine.current.interpolateMessage(node.data.prompt, slots);
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`;
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: interpolatedPrompt }] }] }),
          });
          if (!response.ok) throw new Error(`LLM Error ${response.status}`);
          const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
          let buffer = '';
          while (true) {
            const { value, done } = await reader.read();
            if (value) buffer += value;
            let boundaryIndex;
            while ((boundaryIndex = buffer.search(/\r?\n\r?\n/)) !== -1) {
              const message = buffer.substring(0, boundaryIndex);
              buffer = buffer.substring(boundaryIndex + 4);
              if (message.startsWith('data: ')) {
                const jsonString = message.substring(6).trim();
                try {
                  const jsonData = JSON.parse(jsonString);
                  const chunk = jsonData.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  accumulatedContent += chunk;
                } catch (e) { }
              }
            }
            if (done) break;
          }
          const finalSlots = { ...slots };
          if (node.data.outputVar) finalSlots[node.data.outputVar] = accumulatedContent;
          setSlots(finalSlots);
          return { success: true, newSlots: finalSlots };
        } catch (error) {
          setHistory(prev => [...prev, { type: 'bot', message: `LLM Error: ${error.message}`, id: generateUniqueId() }]);
          return { success: false, newSlots: slots };
        } finally {
          setHistory(prev => prev.filter(item => item.id !== loadingId));
        }
      },
      onToast: (node, slots) => {
        alert(`[Toast] ${engine.current.interpolateMessage(node.data.message, slots)}`);
      },
      onLink: (node, slots) => {
        const url = engine.current.interpolateMessage(node.data.content, slots);
        if (url) window.open(url, '_blank');
      },
      onEnd: () => {
        // 종료 시 추가 로직이 필요하다면 여기에 작성 (이미 라이브러리에서 메시지를 보냅니다)
      }
    });

    if (result.status === 'active') {
      const node = engine.current.getNodeById(result.currentNodeId);
      if (node?.type === 'fixedmenu') {
        setFixedMenu({ nodeId: node.id, ...node.data });
        setHistory([]);
      }
      setCurrentId(result.currentNodeId);
    } else {
      setCurrentId(null);
    }
  }, [setSlots, setHistory, setFixedMenu, nodes, edges]);

  const proceedToNextNode = useCallback((sourceHandle, sourceNodeId, updatedSlots) => {
    if (sourceNodeId === anchorNodeId) {
      setCurrentId(null);
      return;
    }
    const nextNode = engine.current.getNextNode(sourceNodeId, sourceHandle, updatedSlots);
    // nextNode가 null이더라도 runScenario(null)을 호출하여 라이브러리의 종료 시퀀스를 트리거합니다.
    runScenario(nextNode?.id || null, updatedSlots);
  }, [runScenario, anchorNodeId]);

  const startSimulation = useCallback(() => {
    setIsStarted(true);
    let startId = startNodeId;
    if (!startId) {
      const startNode = nodes.find(n => n.type === 'start') || nodes.find(n => !edges.some(e => e.target === n.id) && !n.parentNode);
      startId = startNode?.id;
    }
    if (startId) {
      setSlots({});
      setHistory([]);
      setFixedMenu(null);
      activeChainIdRef.current = null;
      runScenario(startId, {});
    } else {
      setIsStarted(false);
    }
  }, [nodes, edges, startNodeId, runScenario, setSlots]);

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