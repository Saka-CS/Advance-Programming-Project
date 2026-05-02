import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import ProjectArea from './components/ProjectArea';
import SettingsModal from './components/SettingsModal';
import AuthModal from './components/AuthModal';
import { initGemini, hasApiKey } from './services/gemini';
import { Settings, LogOut, User } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      fetch(`/api/projects/${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          setProjects(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch projects', err);
          setIsLoading(false);
        });
    } else {
      setProjects([]);
    }
  }, [currentUser]);

  const userProjects = projects;

  const [activeProjectId, setActiveProjectId] = useState(null);

  useEffect(() => {
    if (userProjects.length > 0 && !userProjects.find(p => p.id === activeProjectId)) {
      setActiveProjectId(userProjects[0].id);
    } else if (userProjects.length === 0) {
      setActiveProjectId(null);
    }
  }, [userProjects, activeProjectId]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('gemini-1.5-flash');
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Fetch settings on login
  useEffect(() => {
    if (currentUser) {
      setSettingsLoaded(false);
      fetch(`/api/settings/${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.gemini_api_key) setApiKey(data.gemini_api_key);
          if (data.gemini_model) setModelName(data.gemini_model);
          setSettingsLoaded(true);
        })
        .catch(err => {
          console.error('Failed to fetch settings', err);
          setSettingsLoaded(true); // still mark as loaded so modal can open if needed
        });
    } else {
      setSettingsLoaded(false);
      setApiKey('');
    }
  }, [currentUser]);

  // Only open settings modal after settings are loaded and no key is found
  useEffect(() => {
    if (!settingsLoaded) return;
    if (apiKey) {
      initGemini(apiKey, modelName);
      setIsSettingsOpen(false);
    } else if (currentUser) {
      setIsSettingsOpen(true);
    }
  }, [apiKey, modelName, settingsLoaded]);

  const activeProject = userProjects.find(p => p.id === activeProjectId);

  const handleUpdateProject = (updatedProject) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    fetch(`/api/projects/${updatedProject.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject)
    }).catch(err => console.error('Failed to update project', err));
  };

  const handleCreateProject = () => {
    if (!currentUser) return;
    const newProject = {
      id: Date.now().toString(),
      userId: currentUser.id,
      name: `New Research ${userProjects.length + 1}`,
      resources: [],
      content: ''
    };
    setProjects([...projects, newProject]);
    setActiveProjectId(newProject.id);

    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProject)
    }).catch(err => console.error('Failed to create project', err));
  };

  const handleDeleteProject = (projectId) => {
    setProjects(projects.filter(p => p.id !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
    }
    fetch(`/api/projects/${projectId}`, {
      method: 'DELETE'
    }).catch(err => console.error('Failed to delete project', err));
  };

  const handleRenameProject = (projectId, newName) => {
    const updated = projects.map(p => p.id === projectId ? { ...p, name: newName } : p);
    setProjects(updated);
    
    const projectToUpdate = updated.find(p => p.id === projectId);
    if (projectToUpdate) {
      fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectToUpdate)
      }).catch(err => console.error('Failed to rename project', err));
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('current_user');
    setActiveProjectId(null);
  };

  const saveSettings = (key, model) => {
    setApiKey(key);
    setModelName(model);
    setIsSettingsOpen(false);
    
    if (currentUser) {
      fetch(`/api/settings/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gemini_api_key: key, gemini_model: model })
      }).catch(err => console.error('Failed to save settings', err));
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        projects={userProjects} 
        activeProjectId={activeProjectId} 
        setActiveProjectId={setActiveProjectId}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onRenameProject={handleRenameProject}
      />
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <header className="glass" style={{ height: '60px', display: 'flex', alignItems: 'center', justifyItems: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border-color)', zIndex: 10 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 500, flex: 1 }}>
            {activeProject ? activeProject.name : 'Select Research'}
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {currentUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <User size={18} />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{currentUser.username}</span>
              </div>
            )}
            <button className="btn-icon" onClick={() => setIsSettingsOpen(true)} title="Settings">
              <Settings size={20} />
            </button>
            <button className="btn-icon" onClick={handleLogout} title="Log Out" style={{ color: 'var(--danger)' }}>
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {activeProject ? (
          <ProjectArea project={activeProject} onUpdateProject={handleUpdateProject} />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            Select or create research to start.
          </div>
        )}
      </main>

      {isSettingsOpen && (
        <SettingsModal 
          currentKey={apiKey}
          currentModel={modelName}
          onSave={saveSettings} 
          onClose={() => hasApiKey() && setIsSettingsOpen(false)} 
        />
      )}

      {!currentUser && (
        <AuthModal onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
