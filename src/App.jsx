import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ProjectArea from './components/ProjectArea';
import SettingsModal from './components/SettingsModal';
import { initGemini, hasApiKey } from './services/gemini';
import { Settings } from 'lucide-react';

function App() {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('projects');
    return saved ? JSON.parse(saved) : [{ id: 1, name: 'Default Project', resources: [], content: '' }];
  });
  
  const [activeProjectId, setActiveProjectId] = useState(projects[0]?.id || null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [modelName, setModelName] = useState(() => localStorage.getItem('gemini_model') || 'gemini-1.5-flash');

  useEffect(() => {
    if (apiKey) {
      initGemini(apiKey, modelName);
    } else {
      setIsSettingsOpen(true);
    }
  }, [apiKey, modelName]);

  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  const handleUpdateProject = (updatedProject) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleCreateProject = () => {
    const newProject = {
      id: Date.now(),
      name: `New Project ${projects.length + 1}`,
      resources: [],
      content: ''
    };
    setProjects([...projects, newProject]);
    setActiveProjectId(newProject.id);
  };

  const saveSettings = (key, model) => {
    setApiKey(key);
    setModelName(model);
    localStorage.setItem('gemini_api_key', key);
    localStorage.setItem('gemini_model', model);
    setIsSettingsOpen(false);
  };

  return (
    <div className="app-container">
      <Sidebar 
        projects={projects} 
        activeProjectId={activeProjectId} 
        setActiveProjectId={setActiveProjectId}
        onCreateProject={handleCreateProject}
      />
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <header className="glass" style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border-color)', zIndex: 10 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 500 }}>
            {activeProject ? activeProject.name : 'Select a Project'}
          </h2>
          <button className="btn-icon" onClick={() => setIsSettingsOpen(true)} title="Settings">
            <Settings size={20} />
          </button>
        </header>

        {activeProject ? (
          <ProjectArea project={activeProject} onUpdateProject={handleUpdateProject} />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            Select or create a project to start researching.
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
    </div>
  );
}

export default App;
