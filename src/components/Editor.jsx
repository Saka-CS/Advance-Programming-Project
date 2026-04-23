import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Edit3, Loader2 } from 'lucide-react';
import { generateAutocomplete, suggestEdits, hasApiKey } from '../services/gemini';

const Editor = ({ content, onChange, resources }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState(null);
  
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Track cursor position so we can insert at the right spot
  const cursorPosRef = useRef(null);

  const handleAutocomplete = async () => {
    if (!hasApiKey()) {
      setError("Please set your Gemini API key in settings.");
      return;
    }

    const textarea = textareaRef.current;
    // Snapshot the cursor position at the moment the button is clicked
    const cursorPos = textarea ? textarea.selectionStart : content.length;
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);

    if (!textBeforeCursor.trim()) {
      setError("Place your cursor after some text to autocomplete.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    cursorPosRef.current = cursorPos;
    try {
      const continuation = await generateAutocomplete(textBeforeCursor, resources);
      // Pad with a space if the text before cursor doesn't already end with one
      const pad = textBeforeCursor.endsWith(' ') ? '' : ' ';
      const inserted = pad + continuation.trim();
      const newContent = textBeforeCursor + inserted + textAfterCursor;
      onChange(newContent);

      // Restore cursor to end of the newly inserted text
      const newCursorPos = cursorPos + inserted.length;
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    } catch (err) {
      console.error(err);
      setError(`Failed to generate text. ${err.message || "Please check your API key."}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestEdits = async () => {
    if (!hasApiKey()) {
      setError("Please set your Gemini API key in settings.");
      return;
    }

    if (!content.trim()) {
      setError("Please write some text first to get suggestions.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setSuggestions(null);
    try {
      const result = await suggestEdits(content, resources);
      setSuggestions(result);
    } catch (err) {
      console.error(err);
      setError(`Failed to analyze text. ${err.message || "Please check your API key."}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button 
          className="btn btn-primary" 
          onClick={handleAutocomplete}
          disabled={isGenerating || isAnalyzing}
        >
          {isGenerating ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
          Autocomplete Text
        </button>
        
        <button 
          className="btn btn-secondary" 
          onClick={handleSuggestEdits}
          disabled={isGenerating || isAnalyzing}
        >
          {isAnalyzing ? <Loader2 size={16} className="spin" /> : <Edit3 size={16} />}
          Suggest Edits
        </button>

        {error && <span style={{ color: 'var(--danger)', fontSize: '13px' }}>{error}</span>}
      </div>

      {/* Editor Area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Start writing your research paper here..."
          style={{
            flex: 1,
            width: '100%',
            fontSize: '16px',
            lineHeight: '1.8',
            padding: '28px 32px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            resize: 'none',
            outline: 'none',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
            minHeight: '0'
          }}
        />
      </div>

      {/* Suggestions Popup */}
      {suggestions && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setSuggestions(null); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 500,
            padding: '24px'
          }}
        >
          <div className="glass" style={{
            width: '100%',
            maxWidth: '680px',
            maxHeight: '75vh',
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Popup header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <h4 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} style={{ color: 'var(--accent-secondary)' }} /> Editor Suggestions
              </h4>
              <button className="btn-icon" onClick={() => setSuggestions(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {/* Popup body */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}>
              <div
                style={{ fontSize: '14px', lineHeight: '1.8', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}
                dangerouslySetInnerHTML={{ __html: suggestions
                  .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
                  .replace(/^- /gm, '• ')
                }}
              />
            </div>
            {/* Popup footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex', justifyContent: 'flex-end',
              flexShrink: 0
            }}>
              <button className="btn btn-primary" onClick={() => setSuggestions(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Add spin animation utility in style block */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Editor;
