import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut, signInWithPopup, provider } from './firebase';
import Flow from './Flow';
import ScenarioList from './ScenarioList';
import Board from './Board';
import Login from './Login';
import HelpModal from './HelpModal';
import ScenarioModal from './ScenarioModal';
import ApiDocs from './ApiDocs';
import Admin from './Admin';
import useStore from './store';
import * as backendService from './backendService';
import { AlertProvider } from './context/AlertProvider';
import './App.css';

const adminUsers = ['cutiefunny@gmail.com'];

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [view, setView] = useState('list');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [backend, setBackend] = useState('firebase');

  const fetchNodeColors = useStore((state) => state.fetchNodeColors);
  const fetchNodeTextColors = useStore((state) => state.fetchNodeTextColors);
  const fetchNodeVisibility = useStore((state) => state.fetchNodeVisibility);

  const isAdmin = user && adminUsers.includes(user.email);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
       if (currentUser) {
        const allowedEmails = ['cutiefunny@gmail.com', 'hyh8414@gmail.com'];
        const allowedDomains = ['cyberlogitec.com', 'wisenut.co.kr'];
        const userEmail = currentUser.email;
        const userDomain = userEmail.split('@')[1];
        const isAuthorized = allowedEmails.includes(userEmail) || allowedDomains.includes(userDomain);

        if (isAuthorized) {
          setUser(currentUser);
        } else {
          signOut(auth);
          alert("Access denied. You don't have permission to access this account.");
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    fetchNodeColors();
    fetchNodeTextColors();
    // 💡 [수정] backend 상태에 따라 fetch
    fetchNodeVisibility(backend);

    return () => unsubscribe();
  }, [fetchNodeColors, fetchNodeTextColors, fetchNodeVisibility, backend]); // backend 의존성 추가

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      alert("Login failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const handleScenarioSelect = async (scenario) => {
    try {
      const updatedScenarioData = await backendService.updateScenarioLastUsed(backend, { scenarioId: scenario.id });
      
      const newLastUsedAt = updatedScenarioData.lastUsedAt || (updatedScenarioData.last_used_at ? new Date(updatedScenarioData.last_used_at) : new Date());

      setScenarios(prevScenarios => 
        prevScenarios.map(s => 
          s.id === scenario.id 
          ? { ...s, lastUsedAt: newLastUsedAt } 
          : s
        )
      );
      
      setSelectedScenario({ ...scenario, lastUsedAt: newLastUsedAt });
      
    } catch (error) {
      console.error("Failed to update last used time:", error);
      setSelectedScenario(scenario);
    } finally {
      setView('flow');
    }
  };

  const handleOpenAddScenarioModal = () => {
    setEditingScenario(null);
    setIsScenarioModalOpen(true);
  };

  const handleOpenEditScenarioModal = (scenario) => {
    setEditingScenario(scenario);
    setIsScenarioModalOpen(true);
  };

  const handleSaveScenario = async ({ name, job, description }) => {
    try {
      if (editingScenario) {
        if (name !== editingScenario.name && scenarios.some(s => s.name === name)) {
          alert("A scenario with that name already exists.");
          return;
        }
        await backendService.renameScenario(backend, { oldScenario: editingScenario, newName: name, job, description });
        setScenarios(prev => prev.map(s => (s.id === editingScenario.id ? { ...s, name, job, description } : s)));
        alert('Scenario updated successfully.');
      } else {
        if (scenarios.some(s => s.name === name)) {
          alert("A scenario with that name already exists.");
          return;
        }
        const newScenario = await backendService.createScenario(backend, { newScenarioName: name, job, description });
         
        setScenarios(prev => [...prev, { ...newScenario, lastUsedAt: null }]); 
        setSelectedScenario({ ...newScenario, lastUsedAt: null });
        
        setView('flow');
        alert(`Scenario '${newScenario.name}' has been created.`);
      }
      setIsScenarioModalOpen(false);
      setEditingScenario(null);
    } catch (error) {
      console.error("Error saving scenario: ", error);
      alert(`Failed to save scenario: ${error.message}`);
    }
  };

  const handleViewChange = (targetView) => {
    if (targetView === 'flow') {
        if (selectedScenario) {
            setView('flow');
        } else {
            handleOpenAddScenarioModal();
        }
    } else {
        setView(targetView);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <AlertProvider>
      <div className="app-container">
        <header className="app-header">
          <div className="header-title-container">
            <h1>Chatbot Flow & Board</h1>
            <button className="help-button" onClick={() => setIsHelpModalOpen(true)}>?</button>
          </div>
          <nav>
            <button onClick={() => handleViewChange('list')} className={view === 'list' ? 'active' : ''}>
              Scenario List
            </button>
            <button
              onClick={() => handleViewChange('flow')}
              className={view === 'flow' ? 'active' : ''}
              disabled={!selectedScenario && view !== 'flow'}
            >
              Flow Editor
            </button>
            <button onClick={() => handleViewChange('board')} className={view === 'board' ? 'active' : ''}>
              Board
            </button>
            <button onClick={() => handleViewChange('api')} className={view === 'api' ? 'active' : ''}>
              API Docs
            </button>
            {isAdmin && (
              <button onClick={() => handleViewChange('admin')} className={view === 'admin' ? 'active' : ''}>
                Admin
              </button>
            )}
          </nav>
          <div className="user-profile">
            <div className="backend-switch">
              <span>Firebase</span>
              <label className="switch">
                <input type="checkbox" checked={backend === 'fastapi'} onChange={() => setBackend(prev => prev === 'firebase' ? 'fastapi' : 'firebase')} />
                <span className="slider round"></span>
              </label>
              <span>FastAPI</span>
            </div>
            {user ? (
              <>
                <img src={user.photoURL} alt={user.displayName} className="user-avatar" />
                <span>{user.displayName}</span>
                <button onClick={handleLogout} className="logout-button">Logout</button>
              </>
            ) : (
              <button onClick={handleLogin} className="logout-button">Login</button>
            )}
          </div>
        </header>
        <main className="app-main">
           <div className={`view-container ${view !== 'list' ? 'hidden' : ''}`}>
              <ScenarioList
                  backend={backend}
                  onSelect={handleScenarioSelect}
                  onAddScenario={handleOpenAddScenarioModal}
                  onEditScenario={handleOpenEditScenarioModal}
                  scenarios={scenarios}
                  setScenarios={setScenarios}
              />
          </div>

          <div className={`view-container ${view !== 'flow' ? 'hidden' : ''}`}>
            {selectedScenario && (
              <Flow scenario={selectedScenario} backend={backend} scenarios={scenarios} />
            )}
          </div>

          <div className={`view-container ${view !== 'board' ? 'hidden' : ''}`}>
              <Board user={user} />
          </div>

          <div className={`view-container ${view !== 'api' ? 'hidden' : ''}`}>
              <ApiDocs />
          </div>
          
          <div className={`view-container ${view !== 'admin' ? 'hidden' : ''}`}>
              {/* 💡 [수정] backend prop 전달 */}
              {isAdmin ? <Admin backend={backend} /> : <div style={{padding: '20px'}}>Access Denied.</div>}
          </div>
        </main>
        <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
        <ScenarioModal
          isOpen={isScenarioModalOpen}
          onClose={() => { setIsScenarioModalOpen(false); setEditingScenario(null); }}
          onSave={handleSaveScenario}
          scenario={editingScenario}
        />
      </div>
    </AlertProvider>
  );
}

export default App;