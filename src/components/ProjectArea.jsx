import React, { useState } from 'react';
import Editor from './Editor';
import ResourceManager from './ResourceManager';
import ShareModal from './ShareModal';
import { Share2 } from 'lucide-react';

const ProjectArea = ({ project, onUpdateProject }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const handleContentChange = (newContent) => {
    onUpdateProject({ ...project, content: newContent });
  };

  const handleAddResource = (resource) => {
    onUpdateProject({ 
      ...project, 
      resources: [...project.resources, resource] 
    });
  };

  const handleAddResources = (newResources) => {
    onUpdateProject({
      ...project,
      resources: [...project.resources, ...newResources]
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
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '16px' }}>
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
              flex: 1,
              padding: '0',
            }}
            placeholder="Research Title"
          />
          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Share2 size={18} />
            Share
          </button>
        </div>
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
          onAddResources={handleAddResources}
          onDeleteResource={handleDeleteResource} 
        />
      </div>

      {isShareModalOpen && (
        <ShareModal 
          project={project} 
          onClose={() => setIsShareModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default ProjectArea;
