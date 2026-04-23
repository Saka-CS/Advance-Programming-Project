import React, { useState, useRef } from 'react';
import { FileText, Upload, Plus, Trash2, X, File } from 'lucide-react';
import { extractTextFromFile } from '../services/gemini';
import * as pdfjsLib from 'pdfjs-dist';

// Point the worker at the bundled worker file served by Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

const extractPdfText = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tokenized = await page.getTextContent();
    pages.push(tokenized.items.map(item => item.str).join(' '));
  }
  return pages.join('\n\n');
};

const ResourceManager = ({ resources, onAddResource, onDeleteResource }) => {
  const [isAddingText, setIsAddingText] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingName, setProcessingName] = useState('');
  
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsProcessing(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingName(file.name);
        let content = '';
        
        if (file.type === 'application/pdf') {
          content = await extractPdfText(file);
        } else {
          content = await extractTextFromFile(file);
        }
        
        onAddResource({
          id: Date.now() + i,
          title: file.name,
          type: file.type === 'application/pdf' ? 'pdf' : 'file',
          content: content.substring(0, 20000) // up to 20k chars per resource
        });
      }
    } catch (error) {
      console.error("Error processing file", error);
      alert(`Error processing file: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveManualText = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    onAddResource({
      id: Date.now(),
      title: newTitle,
      type: 'text',
      content: newContent
    });
    setNewTitle('');
    setNewContent('');
    setIsAddingText(false);
  };

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileText size={18} className="gradient-text" /> 
        Resources
      </h3>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button 
          className="btn btn-secondary" 
          style={{ flex: 1, fontSize: '12px' }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          <Upload size={14} /> {isProcessing ? `Reading ${processingName}…` : 'Upload File'}
        </button>
        <button 
          className="btn btn-secondary" 
          style={{ flex: 1, fontSize: '12px' }}
          onClick={() => setIsAddingText(true)}
        >
          <Plus size={14} /> Add Text
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".txt,.md,.csv,.json,.pdf" 
          multiple
          onChange={handleFileUpload}
        />
      </div>

      {isAddingText && (
        <div style={{ 
          background: 'var(--bg-primary)', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>New Text Resource</span>
            <button className="btn-icon" style={{ padding: '2px' }} onClick={() => setIsAddingText(false)}>
              <X size={14} />
            </button>
          </div>
          <input 
            type="text" 
            placeholder="Title" 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ width: '100%', marginBottom: '8px', fontSize: '12px' }}
          />
          <textarea 
            placeholder="Paste your content here..." 
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            style={{ width: '100%', height: '100px', resize: 'none', fontSize: '12px', marginBottom: '8px' }}
          />
          <button className="btn btn-primary" style={{ width: '100%', fontSize: '12px' }} onClick={handleSaveManualText}>
            Save Resource
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {resources.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', marginTop: '20px' }}>
            No resources yet. Upload files or paste text to build your knowledge base.
          </div>
        ) : (
          resources.map(resource => (
            <div key={resource.id} style={{ 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              padding: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{ color: 'var(--accent-secondary)' }}>
                {resource.type === 'pdf' ? <File size={16} color="var(--danger)" /> : resource.type === 'file' ? <File size={16} /> : <FileText size={16} />}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '13px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                    {resource.title}
                  </h4>
                  {resource.type === 'pdf' && (
                    <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', padding: '1px 6px', borderRadius: '4px', flexShrink: 0 }}>PDF</span>
                  )}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {resource.content.substring(0, 60)}...
                </p>
              </div>
              <button className="btn-icon" style={{ padding: '4px', color: 'var(--danger)' }} onClick={() => onDeleteResource(resource.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ResourceManager;
