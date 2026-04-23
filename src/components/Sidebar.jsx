import React from 'react';
import { Folder, Plus, ChevronRight, BrainCircuit } from 'lucide-react';

const Sidebar = ({ projects, activeProjectId, setActiveProjectId, onCreateProject }) => {
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
          <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.5px' }}>Projects</span>
          <button onClick={onCreateProject} className="btn-icon" style={{ padding: '4px' }}>
            <Plus size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => setActiveProjectId(project.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: activeProjectId === project.id ? 'var(--bg-tertiary)' : 'transparent',
                border: `1px solid ${activeProjectId === project.id ? 'var(--border-color)' : 'transparent'}`,
                color: activeProjectId === project.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                textAlign: 'left',
                width: '100%'
              }}
            >
              <Folder size={16} color={activeProjectId === project.id ? 'var(--accent-primary)' : 'currentColor'} />
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.name}</span>
              {activeProjectId === project.id && <ChevronRight size={14} />}
            </button>
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
