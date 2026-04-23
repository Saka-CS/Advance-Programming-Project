import React from 'react';
import Editor from './Editor';
import ResourceManager from './ResourceManager';

const ProjectArea = ({ project, onUpdateProject }) => {
  const handleContentChange = (newContent) => {
    onUpdateProject({ ...project, content: newContent });
  };

  const handleAddResource = (resource) => {
    onUpdateProject({ 
      ...project, 
      resources: [...project.resources, resource] 
    });
  };

  const handleDeleteResource = (resourceId) => {
    onUpdateProject({ 
      ...project, 
      resources: project.resources.filter(r => r.id !== resourceId) 
    });
  };

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <input 
          type="text" 
          value={project.name} 
          onChange={(e) => onUpdateProject({ ...project, name: e.target.value })}
          style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            background: 'transparent', 
            border: 'none', 
            color: 'var(--text-primary)',
            width: '100%',
            padding: '0',
            marginBottom: '20px',
            flexShrink: 0
          }}
          placeholder="Project Title"
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Editor 
            content={project.content} 
            onChange={handleContentChange} 
            resources={project.resources} 
          />
        </div>
      </div>
      
      <div style={{ width: '320px', borderLeft: '1px solid var(--border-color)', background: 'var(--bg-secondary)', overflowY: 'auto' }}>
        <ResourceManager 
          resources={project.resources} 
          onAddResource={handleAddResource} 
          onDeleteResource={handleDeleteResource} 
        />
      </div>
    </div>
  );
};

export default ProjectArea;
