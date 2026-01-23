import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

export const fetchScenarios = async () => {
  const scenariosCollection = collection(db, 'scenarios');
  const querySnapshot = await getDocs(scenariosCollection);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || doc.id,
      description: data.description || '',
      updatedAt: data.updatedAt || null,
      lastUsedAt: data.lastUsedAt || null,
      ...data,
    };
  });
};

export const createScenario = async ({ newScenarioName, job, description }) => {
  const newScenarioRef = doc(db, 'scenarios', newScenarioName);
  const docSnap = await getDoc(newScenarioRef);
  if (docSnap.exists()) {
    throw new Error('A scenario with that name already exists.');
  }
  const newScenarioData = { 
    name: newScenarioName, 
    job, 
    description, 
    nodes: [], 
    edges: [], 
    startNodeId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastUsedAt: null
  };
  await setDoc(newScenarioRef, newScenarioData);
  return { id: newScenarioName, ...newScenarioData, createdAt: new Date(), updatedAt: new Date(), lastUsedAt: null };
};

export const renameScenario = async ({ oldScenario, newName, job, description }) => {
    const oldDocRef = doc(db, 'scenarios', oldScenario.id);

    if (oldScenario.name !== newName) {
      const newDocRef = doc(db, 'scenarios', newName);
      const newDocSnap = await getDoc(newDocRef);
      if (newDocSnap.exists()) {
        throw new Error('A scenario with that name already exists.');
      }

      const oldDocSnap = await getDoc(oldDocRef);
      if (oldDocSnap.exists()) {
        const batch = writeBatch(db);
        const newData = { ...oldDocSnap.data(), name: newName, job, description, updatedAt: serverTimestamp() };
        batch.set(newDocRef, newData);
        batch.delete(oldDocRef);
        await batch.commit();
      } else {
        throw new Error('Original scenario not found.');
      }
    } else {
      await updateDoc(oldDocRef, { job, description, updatedAt: serverTimestamp() });
    }
};

export const deleteScenario = async ({ scenarioId }) => {
  const docRef = doc(db, 'scenarios', scenarioId);
  await deleteDoc(docRef);
};

export const cloneScenario = async ({ scenarioToClone, newName }) => {
  const originalDocRef = doc(db, 'scenarios', scenarioToClone.id);
  const newDocRef = doc(db, 'scenarios', newName);

  const newDocSnap = await getDoc(newDocRef);
  if (newDocSnap.exists()) {
    throw new Error('A scenario with that name already exists.');
  }

  const originalDocSnap = await getDoc(originalDocRef);
  if (!originalDocSnap.exists()) {
    throw new Error('The scenario to clone does not exist.');
  }

  const originalData = originalDocSnap.data();
  const newData = {
    ...originalData,
    name: newName,
    job: scenarioToClone.job, 
    description: originalData.description || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastUsedAt: null
  };

  await setDoc(newDocRef, newData);
  return { id: newName, ...newData, createdAt: new Date(), updatedAt: new Date(), lastUsedAt: null };
};


export const fetchScenarioData = async ({ scenarioId }) => {
  if (!scenarioId) return { nodes: [], edges: [], startNodeId: null, description: '' };
  const scenarioDocRef = doc(db, "scenarios", scenarioId);
  const docSnap = await getDoc(scenarioDocRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return { ...data, startNodeId: data.startNodeId || null, description: data.description || '', lastUsedAt: data.lastUsedAt || null };
  }
  console.log(`No such document for scenario: ${scenarioId}!`);
  return { nodes: [], edges: [], startNodeId: null, description: '' };
};

export const saveScenarioData = async ({ scenario, data }) => {
  if (!scenario || !scenario.id) {
    throw new Error('No scenario selected to save.');
  }
  const scenarioDocRef = doc(db, "scenarios", scenario.id);
  const saveData = {
    ...data,
    name: scenario.name,
    job: scenario.job,
    description: scenario.description || '',
    updatedAt: serverTimestamp()
  };
  await setDoc(scenarioDocRef, saveData, { merge: true });
};

export const updateScenarioLastUsed = async ({ scenarioId }) => {
  const docRef = doc(db, 'scenarios', scenarioId);
  await updateDoc(docRef, {
    lastUsedAt: serverTimestamp()
  });
  const updatedDocSnap = await getDoc(docRef);
  if (updatedDocSnap.exists()) {
    const data = updatedDocSnap.data();
    return { id: updatedDocSnap.id, ...data };
  }
  return null;
};

// KWJ - download 추가
export const downloadScenario = async ({ scenarioId }) => {
  const docRef = doc(db, 'scenarios', scenarioId);
  const data = await getDoc(docRef)

  const content = data.data()
  const filename = content.name

  const jsonString = JSON.stringify(content, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.json`;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// ... (API/Form 템플릿 함수들) ...
export const fetchApiTemplates = async () => {
  const templatesCollection = collection(db, 'apiTemplates');
  const querySnapshot = await getDocs(templatesCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveApiTemplate = async (templateData) => {
  const templatesCollection = collection(db, 'apiTemplates');
  const docRef = await addDoc(templatesCollection, templateData);
  return { id: docRef.id, ...templateData };
};

export const deleteApiTemplate = async (templateId) => {
  const templateDocRef = doc(db, 'apiTemplates', templateId);
  await deleteDoc(templateDocRef);
};

export const fetchFormTemplates = async () => {
  const templatesCollection = collection(db, 'formTemplates');
  const querySnapshot = await getDocs(templatesCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveFormTemplate = async (templateData) => {
  const templatesCollection = collection(db, 'formTemplates');
  const docRef = await addDoc(templatesCollection, templateData);
  return { id: docRef.id, ...templateData };
};

export const deleteFormTemplate = async (templateId) => {
  const templateDocRef = doc(db, 'formTemplates', templateId);
  await deleteDoc(templateDocRef);
};

// 💡 [추가] 노드 표시 여부 설정 저장
export const saveNodeVisibility = async (visibleNodeTypes) => {
  const docRef = doc(db, "settings", "nodeVisibility");
  await setDoc(docRef, { visibleNodeTypes }); // 배열을 Firestore에 저장
};

// 💡 [추가] 노드 표시 여부 설정 불러오기
export const fetchNodeVisibility = async () => {
  const docRef = doc(db, "settings", "nodeVisibility");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data(); // { visibleNodeTypes: [...] } 반환
  }
  return null; // 데이터가 없음
};