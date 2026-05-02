import React, { useState, useRef, useEffect } from 'react';
import { Folder, Plus, ChevronRight, BrainCircuit, Trash2, Pencil } from 'lucide-react';

const Sidebar = ({ projects, activeProjectId, setActiveProjectId, onCreateProject, onDeleteProject, onRenameProject }) => {
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const editInputRef = useRef(null);

  useEffect(() => {
    if (editingProjectId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingProjectId]);

  const handleSaveRename = (projectId) => {
    if (editingName.trim()) {
      onRenameProject(projectId, editingName.trim());
    }
    setEditingProjectId(null);
  };
  return (
    <aside className="glass" style={{
      width: '280px',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 20
    }}>
      <div style={{
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{
          width: '36px', height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white'
        }}>
          <BrainCircuit size={20} />
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'white' }}>
          ResearchAI
        </h1>
      </div>

      <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.5px' }}>Research</span>
          <button onClick={onCreateProject} className="btn-icon" style={{ padding: '4px' }}>
            <Plus size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {projects.map(project => (
            <div
              key={project.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: activeProjectId === project.id ? 'var(--bg-tertiary)' : 'transparent',
                border: `1px solid ${activeProjectId === project.id ? 'var(--border-color)' : 'transparent'}`,
                color: activeProjectId === project.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                width: '100%',
                cursor: 'pointer'
              }}
              onClick={() => setActiveProjectId(project.id)}
            >
              <Folder size={16} color={activeProjectId === project.id ? 'var(--accent-primary)' : 'currentColor'} />
              
              {editingProjectId === project.id ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => handleSaveRename(project.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveRename(project.id);
                    } else if (e.key === 'Escape') {
                      setEditingProjectId(null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: 1,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--accent-primary)',
                    color: 'var(--text-primary)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none',
                    width: '100%'
                  }}
                />
              ) : (
                <span 
                  style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingProjectId(project.id);
                    setEditingName(project.name);
                  }}
                >
                  {project.name}
                </span>
              )}
              
              {!editingProjectId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProjectId(project.id);
                      setEditingName(project.name);
                    }}
                    className="btn-icon" 
                    style={{ 
                      padding: '4px',
                      opacity: activeProjectId === project.id ? 1 : 0.4,
                    }}
                    title="Rename Research"
                  >
                    <Pencil size={14} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
                        onDeleteProject(project.id);
                      }
                    }}
                    className="btn-icon" 
                    style={{ 
                      padding: '4px',
                      opacity: activeProjectId === project.id ? 1 : 0.4,
                      color: 'var(--danger)'
                    }}
                    title="Delete Research"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
        Powered by Gemini AI
      </div>
    </aside>
  );
};

export default Sidebar;
