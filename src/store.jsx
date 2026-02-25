// src/store.jsx

import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { createNodeData, createFormElement } from './nodeFactory';
import * as backendService from './backendService';

const defaultColors = {
  message: '#f39c12',
  form: '#9b59b6',
  branch: '#2ecc71',
  slotfilling: '#3498db',
  api: '#e74c3c',
  llm: '#1abc9c',
  setSlot: '#8e44ad',
  delay: '#f1c40f',
  fixedmenu: '#e74c3c',
  link: '#34495e',
  toast: '#95a5a6',
  iframe: '#2c3e50',
  scenario: '#7f8c8d',
};

const defaultTextColors = {
  message: '#ffffff',
  form: '#ffffff',
  branch: '#ffffff',
  slotfilling: '#ffffff',
  api: '#ffffff',
  llm: '#ffffff',
  setSlot: '#ffffff',
  delay: '#333333',
  fixedmenu: '#ffffff',
  link: '#ffffff',
  toast: '#ffffff',
  iframe: '#ffffff',
  scenario: '#ffffff',
};

export const ALL_NODE_TYPES = Object.keys(defaultColors);

const defaultVisibleNodeTypes = [
  'message',
  'form',
  'branch',
  'api',
  'setSlot',
  'delay',
  'link',
  'iframe',
];


const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  anchorNodeId: null,
  startNodeId: null,
  nodeColors: defaultColors,
  nodeTextColors: defaultTextColors,
  slots: {},
  selectedRow: null,
  
  visibleNodeTypes: defaultVisibleNodeTypes,

  setAnchorNodeId: (nodeId) => {
    set((state) => ({
      anchorNodeId: state.anchorNodeId === nodeId ? null : nodeId,
    }));
  },

  setStartNodeId: (nodeId) => {
    set((state) => {
      if (state.startNodeId === nodeId) {
        return { startNodeId: null };
      }
      return { startNodeId: nodeId };
    });
  },

  setSelectedRow: (row) => set({ selectedRow: row }),

  setSlots: (newSlots) => set({ slots: newSlots }),

  fetchNodeColors: async (backend) => {
    try {
      const currentBackend = backend || 'fastapi';
      const colors = await backendService.fetchNodeColors(currentBackend);
      
      if (colors) {
        const mergedColors = ALL_NODE_TYPES.reduce((acc, type) => {
          acc[type] = colors[type] || defaultColors[type];
          return acc;
        }, {});
        set({ nodeColors: mergedColors });
      } else {
        await backendService.saveNodeColors(currentBackend, defaultColors);
        set({ nodeColors: defaultColors });
      }
    } catch (error) {
      console.error("Failed to fetch node colors from DB", error);
      set({ nodeColors: defaultColors });
    }
  },

  fetchNodeTextColors: async (backend) => {
    try {
      const currentBackend = backend || 'fastapi';
      const textColors = await backendService.fetchNodeTextColors(currentBackend);
      
      if (textColors) {
        const mergedTextColors = ALL_NODE_TYPES.reduce((acc, type) => {
          acc[type] = textColors[type] || defaultTextColors[type];
          return acc;
        }, {});
        set({ nodeTextColors: mergedTextColors });
      } else {
        await backendService.saveNodeTextColors(currentBackend, defaultTextColors);
        set({ nodeTextColors: defaultTextColors });
      }
    } catch (error) {
      console.error("Failed to fetch node text colors from DB", error);
      set({ nodeTextColors: defaultTextColors });
    }
  },

  // 💡 [수정] backend 인자를 받아 backendService 사용
  fetchNodeVisibility: async (backend) => {
    try {
      // backend가 지정되지 않았을 경우 기본값 fastapi 사용 (방어 코드)
      const currentBackend = backend || 'fastapi';
      const settings = await backendService.fetchNodeVisibility(currentBackend);
      
      if (settings && Array.isArray(settings.visibleNodeTypes)) {
        set({ visibleNodeTypes: settings.visibleNodeTypes });
      } else {
        // 데이터가 없으면 기본값 저장 (해당 백엔드에)
        await backendService.saveNodeVisibility(currentBackend, defaultVisibleNodeTypes);
        set({ visibleNodeTypes: defaultVisibleNodeTypes });
      }
    } catch (error) {
      console.error("Failed to fetch node visibility:", error);
      set({ visibleNodeTypes: defaultVisibleNodeTypes }); 
    }
  },

  // 💡 [수정] backend 인자를 받아 backendService 사용
  setNodeVisibility: async (backend, nodeType, isVisible) => {
    const currentVisible = get().visibleNodeTypes;
    const newVisibleSet = new Set(currentVisible);
    if (isVisible) {
      newVisibleSet.add(nodeType);
    } else {
      newVisibleSet.delete(nodeType);
    }
    const newVisibleArray = Array.from(newVisibleSet);
    
    set({ visibleNodeTypes: newVisibleArray });
    
    try {
      const currentBackend = backend || 'fastapi';
      await backendService.saveNodeVisibility(currentBackend, newVisibleArray);
    } catch (error) {
      console.error("Failed to save node visibility:", error);
    }
  },

  setNodeColor: async (backend, type, color) => {
    const newColors = { ...get().nodeColors, [type]: color };
    set({ nodeColors: newColors });
    try {
      const currentBackend = backend || 'fastapi';
      await backendService.saveNodeColors(currentBackend, newColors);
    } catch (error) {
      console.error("Failed to save node colors to DB", error);
    }
  },

  setNodeTextColor: async (backend, type, color) => {
    const newTextColors = { ...get().nodeTextColors, [type]: color };
    set({ nodeTextColors: newTextColors });
    try {
      const currentBackend = backend || 'fastapi';
      await backendService.saveNodeTextColors(currentBackend, newTextColors);
    } catch (error) {
      console.error("Failed to save node text colors to DB", error);
    }
  },

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),

  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  deleteNode: (nodeId) => {
    set((state) => {
      const nodeToDelete = state.nodes.find(n => n.id === nodeId);
      if (!nodeToDelete) return state;

      let nodesToRemove = [nodeId];
      if (nodeToDelete.type === 'scenario') {
        const childNodes = state.nodes.filter(n => n.parentNode === nodeId);
        childNodes.forEach(child => nodesToRemove.push(child.id));
      }

      const nodesToRemoveSet = new Set(nodesToRemove);
      const remainingNodes = state.nodes.filter(n => !nodesToRemoveSet.has(n.id));
      const remainingEdges = state.edges.filter(e => !nodesToRemoveSet.has(e.source) && !nodesToRemoveSet.has(e.target));

      const newStartNodeId = state.startNodeId === nodeId ? null : state.startNodeId;

      return {
        nodes: remainingNodes,
        edges: remainingEdges,
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        startNodeId: newStartNodeId,
      };
    });
  },

  toggleScenarioNode: (nodeId) => {
    set((state) => {
      const newNodes = state.nodes.map(n => {
        if (n.id === nodeId && n.type === 'scenario') {
          const isCollapsed = !(n.data.isCollapsed || false);
          let newStyle = { ...n.style };

          if (isCollapsed) {
            newStyle.width = 250;
            newStyle.height = 50;
          } else {
            const PADDING = 40;
            const childNodes = state.nodes.filter(child => child.parentNode === nodeId);
            if (childNodes.length > 0) {
              let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
              childNodes.forEach(node => {
                const x = node.position.x;
                const y = node.position.y;
                const nodeWidth = node.width || 250;
                const nodeHeight = node.height || 150;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x + nodeWidth);
                maxY = Math.max(maxY, y + nodeHeight);
              });

              newStyle.width = (maxX - minX) + PADDING * 2;
              newStyle.height = (maxY - minY) + PADDING * 2;

              childNodes.forEach(node => {
                node.position.x -= (minX - PADDING);
                node.position.y -= (minY - PADDING);
              });

            } else {
              newStyle.width = 250;
              newStyle.height = 100;
            }
          }

          return {
            ...n,
            style: newStyle,
            data: { ...n.data, isCollapsed },
          };
        }
        return n;
      });
      return { nodes: newNodes };
    });
  },

  deleteSelectedEdges: () => {
    set((state) => ({
      edges: state.edges.filter((edge) => !edge.selected),
    }));
  },

  duplicateNode: (nodeId) => {
    const { nodes } = get();
    const originalNode = nodes.find((node) => node.id === nodeId);
    if (!originalNode) return;

    const maxZIndex = nodes.reduce((max, node) => Math.max(node.zIndex || 0, max), 0);
    const newData = JSON.parse(JSON.stringify(originalNode.data));

    const newNode = {
      ...originalNode,
      id: `${originalNode.type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      position: { x: originalNode.position.x + 50, y: originalNode.position.y + 50 },
      data: newData,
      selected: false,
      zIndex: maxZIndex + 1,
    };

    set({ nodes: [...nodes, newNode] });
    get().setSelectedNodeId(newNode.id);
  },

  updateNodeData: (nodeId, dataUpdate) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...dataUpdate } } : node
      ),
    }));
  },

  addNode: (type, position = { x: 100, y: 100 }) => {
    const newNodeData = createNodeData(type);
    const newNode = {
        id: newNodeData.id,
        type,
        position,
        data: newNodeData,
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  addReply: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          const nodeType = node.type;
            const newReply = {
            display: nodeType === 'branch' ? 'New Condition' : (nodeType === 'fixedmenu' ? 'New Menu' : 'New Reply'),
            value: `${nodeType === 'branch' ? 'cond' : (nodeType === 'fixedmenu' ? 'menu' : 'val')}_${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
            };
          const newReplies = [...(node.data.replies || []), newReply];
          return { ...node, data: { ...node.data, replies: newReplies } };
        }
        return node;
      }),
    }));
  },

  updateReply: (nodeId, index, part, value) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          const newReplies = [...node.data.replies];
          newReplies[index] = { ...newReplies[index], [part]: value };
          return { ...node, data: { ...node.data, replies: newReplies } };
        }
        return node;
      }),
    }));
  },

  deleteReply: (nodeId, index) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          const newReplies = node.data.replies.filter((_, i) => i !== index);
          return { ...node, data: { ...node.data, replies: newReplies } };
        }
        return node;
      }),
    }));
  },

  addElement: (nodeId, elementType) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'form') {
          const newElement = createFormElement(elementType);
          const newElements = [...(node.data.elements || []), newElement];
          return { ...node, data: { ...node.data, elements: newElements } };
        }
        return node;
      }),
    }));
  },

  updateElement: (nodeId, elementIndex, elementUpdate) => {
    set((state) => ({
        nodes: state.nodes.map((node) => {
            if (node.id === nodeId && node.type === 'form') {
                const newElements = [...node.data.elements];
                const oldElement = newElements[elementIndex];
                const newElement = { ...oldElement, ...elementUpdate };

                if (newElement.type === 'grid' && (oldElement.rows !== newElement.rows || oldElement.columns !== newElement.columns)) {
                    const oldData = oldElement.data || [];
                    const newRows = newElement.rows || 2;
                    const newColumns = newElement.columns || 2;
                    const newData = Array(newRows * newColumns).fill('');

                    for (let r = 0; r < Math.min(oldElement.rows || 0, newRows); r++) {
                        for (let c = 0; c < Math.min(oldElement.columns || 0, newColumns); c++) {
                            const oldIndex = r * (oldElement.columns || 0) + c;
                            const newIndex = r * newColumns + c;
                            if (oldData[oldIndex] !== undefined) {
                                newData[newIndex] = oldData[oldIndex];
                            }
                        }
                    }
                    newElement.data = newData;
                }

                newElements[elementIndex] = newElement;
                return { ...node, data: { ...node.data, elements: newElements } };
            }
            return node;
        }),
    }));
  },

  deleteElement: (nodeId, elementIndex) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'form') {
          const newElements = node.data.elements.filter((_, i) => i !== elementIndex);
          return { ...node, data: { ...node.data, elements: newElements } };
        }
        return node;
      }),
    }));
  },

  updateGridCell: (nodeId, elementIndex, rowIndex, colIndex, value) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'form') {
          const newElements = JSON.parse(JSON.stringify(node.data.elements));
          const gridElement = newElements[elementIndex];

          if (gridElement && gridElement.type === 'grid') {
            const index = rowIndex * gridElement.columns + colIndex;
            gridElement.data[index] = value;
            return { ...node, data: { ...node.data, elements: newElements } };
          }
        }
        return node;
      }),
    }));
  },

  moveElement: (nodeId, startIndex, endIndex) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId && node.type === 'form') {
          const newElements = [...node.data.elements];
          const [removed] = newElements.splice(startIndex, 1);
          newElements.splice(endIndex, 0, removed);
          return { ...node, data: { ...node.data, elements: newElements } };
        }
        return node;
      }),
    }));
  },

  exportSelectedNodes: (selectedNodes) => {
    const { edges } = get();
    const selectedNodeIds = new Set(selectedNodes.map(n => n.id));

    const relevantEdges = edges.filter(e =>
      selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
    );

    const dataToExport = { nodes: selectedNodes, edges: relevantEdges };
    const dataString = JSON.stringify(dataToExport, null, 2);

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(dataString)
        .then(() => alert(`${selectedNodes.length} nodes exported to clipboard!`))
        .catch(err => {
          console.error('Failed to export nodes using Clipboard API: ', err);
          alert(`Failed to export nodes: ${err.message}. Check browser permissions.`);
        });
    } else {
      console.warn('Clipboard API not available. Using fallback method.');
      try {
        const textArea = document.createElement('textarea');
        textArea.value = dataString;
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        textArea.style.left = '-9999px';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        document.execCommand('copy');
        
        document.body.removeChild(textArea);
        alert(`${selectedNodes.length} nodes exported to clipboard (using fallback).`);
      } catch (err) {
        console.error('Failed to export nodes using fallback: ', err);
        alert('Failed to export nodes. Fallback method also failed.');
      }
    }
  },

  importNodes: async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const dataToImport = JSON.parse(clipboardText);

      if (!dataToImport.nodes || !Array.isArray(dataToImport.nodes)) {
        throw new Error('Invalid data format in clipboard.');
      }

      const { nodes: currentNodes, edges: currentEdges } = get();
      const idMapping = new Map();

      const newNodes = dataToImport.nodes.map((node, index) => {
        const oldId = node.id;
        const newId = `${node.type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${index}`;
        idMapping.set(oldId, newId);

        return {
          ...node,
          id: newId,
          position: { x: node.position.x + 20, y: node.position.y + 20 },
          selected: false,
        };
      });

      const newEdges = (dataToImport.edges || []).map(edge => {
        const newSource = idMapping.get(edge.source);
        const newTarget = idMapping.get(edge.target);
        if (newSource && newTarget) {
          return {
            ...edge,
            id: `reactflow__edge-${newSource}${edge.sourceHandle || ''}-${newTarget}${edge.targetHandle || ''}`,
            source: newSource,
            target: newTarget,
          };
        }
        return null;
      }).filter(Boolean);

      set({
        nodes: [...currentNodes, ...newNodes],
        edges: [...currentEdges, ...newEdges],
      });

      alert(`${newNodes.length} nodes imported successfully!`);

    } catch (err) {
      console.error('Failed to import nodes: ', err);
      alert('Failed to import nodes from clipboard. Check console for details.');
    }
  },

  addScenarioAsGroup: async (backend, scenario, position) => {
    const { nodes: currentNodes, edges: currentEdges } = get();

    const scenarioData = await backendService.fetchScenarioData(backend, { scenarioId: scenario.id });
    if (!scenarioData || !scenarioData.nodes || scenarioData.nodes.length === 0) {
      alert(`Failed to load scenario data for '${scenario.name}' or it is empty.`);
      return;
    }

    const PADDING = 40;

    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    scenarioData.nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      const nodeWidth = node.width || 250;
      const nodeHeight = node.height || 150;
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });

    const groupPosition = position ? position : { x: minX, y: minY };
    const groupWidth = (maxX - minX) + PADDING * 2;
    const groupHeight = (maxY - minY) + PADDING * 2;

    const idPrefix = `group-${scenario.id}-${Date.now()}`;
    const groupNodeId = `group-${idPrefix}`;
    const idMapping = new Map();

    const childNodes = scenarioData.nodes.map(node => {
      const newId = `${idPrefix}-${node.id}`;
      idMapping.set(node.id, newId);
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x - minX + PADDING,
          y: node.position.y - minY + PADDING
        },
        parentNode: groupNodeId,
        extent: 'parent'
      };
    });

    const groupNode = {
      id: groupNodeId,
      type: 'scenario',
      position: groupPosition,
      data: { label: scenario.name, scenarioId: scenario.id, isCollapsed: false },
      style: { width: groupWidth, height: groupHeight },
    };

    const newEdges = (scenarioData.edges || []).map(edge => ({
      ...edge,
      id: `${idPrefix}-${edge.id}`,
      source: idMapping.get(edge.source),
      target: idMapping.get(edge.target),
    }));

    set({
      nodes: [...currentNodes, groupNode, ...childNodes],
      edges: [...currentEdges, ...newEdges],
    });
  },

  fetchScenario: async (backend, scenarioId) => {
    try {
      const data = await backendService.fetchScenarioData(backend, { scenarioId });
      set({
        nodes: data.nodes || [],
        edges: data.edges || [],
        selectedNodeId: null,
        startNodeId: data.startNodeId || null
      });
    } catch (error) {
      console.error("Error fetching scenario:", error);
      alert('Failed to load scenario details.');
      set({ nodes: [], edges: [], selectedNodeId: null, startNodeId: null });
    }
  },

  saveScenario: async (backend, scenario) => {
    try {
      const { nodes, edges, startNodeId } = get();
      await backendService.saveScenarioData(backend, {
        scenario,
        data: { nodes, edges, startNodeId },
      });
      alert(`Scenario '${scenario.name}' has been saved successfully!`);
    } catch (error) {
      console.error("Error saving scenario:", error);
      alert(`Failed to save scenario: ${error.message}`);
    }
  },
}));

export default useStore;