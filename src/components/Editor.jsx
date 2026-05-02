import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Edit3, Loader2, BookCheck } from 'lucide-react';
import { generateAutocomplete, suggestEdits, checkCitation, hasApiKey } from '../services/gemini';

const Editor = ({ content, onChange, resources }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCheckingCitation, setIsCheckingCitation] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [citationReport, setCitationReport] = useState(null);
  const [error, setError] = useState(null);

  const [ghostText, setGhostText] = useState('');
  const [isGhostLoading, setIsGhostLoading] = useState(false);
  const [ghostCursorPos, setGhostCursorPos] = useState(0);
  const [cursorCoords, setCursorCoords] = useState(null);

  const textareaRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const cursorPosRef = useRef(null);
  const abortRef = useRef(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Use a mirror div to compute the pixel coords of the cursor
  const computeCursorCoords = useCallback((pos) => {
    const textarea = textareaRef.current;
    const container = textarea?.parentElement;
    if (!textarea || !container) return null;

    const s = window.getComputedStyle(textarea);
    const mirror = document.createElement('div');

    // Mirror must match textarea layout exactly
    mirror.style.position = 'absolute';
    mirror.style.top = '0';
    mirror.style.left = '0';
    mirror.style.width = textarea.offsetWidth + 'px';
    mirror.style.fontFamily = s.fontFamily;
    mirror.style.fontSize = s.fontSize;
    mirror.style.fontWeight = s.fontWeight;
    mirror.style.lineHeight = s.lineHeight;
    mirror.style.padding = s.padding;
    mirror.style.borderWidth = s.borderWidth;
    mirror.style.boxSizing = s.boxSizing;
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordBreak = 'break-word';
    mirror.style.overflowWrap = 'break-word';
    mirror.style.visibility = 'hidden';
    mirror.style.pointerEvents = 'none';
    mirror.style.zIndex = '-1';

    // Text up to cursor, then a zero-width marker span
    mirror.textContent = textarea.value.slice(0, pos);
    const span = document.createElement('span');
    span.textContent = '\u200b';
    mirror.appendChild(span);

    // Insert into the same container so coords are in the same space
    container.appendChild(mirror);
    const spanRect = span.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    container.removeChild(mirror);

    return {
      // Subtract textarea scroll so position tracks the visible area
      top: spanRect.top - containerRect.top - textarea.scrollTop,
      left: spanRect.left - containerRect.left,
    };
  }, []);

  const scheduleGhostSuggestion = useCallback((text, pos) => {
    clearTimeout(debounceTimerRef.current);
    setGhostText('');
    setCursorCoords(null);

    if (!text.trim() || !hasApiKey() || pos < 5) return;

    debounceTimerRef.current = setTimeout(async () => {
      const textBeforeCursor = text.slice(0, pos);
      if (!textBeforeCursor.trim()) return;

      abortRef.current = false;
      setIsGhostLoading(true);
      try {
        const continuation = await generateAutocomplete(textBeforeCursor, resources);
        if (abortRef.current) return;
        const trimmed = continuation.trim();
        if (trimmed) {
          const pad = textBeforeCursor.endsWith(' ') || textBeforeCursor.endsWith('\n') ? '' : ' ';
          const ghost = pad + trimmed;
          setGhostText(ghost);
          setGhostCursorPos(pos);
          setCursorCoords(computeCursorCoords(pos));
        }
      } catch {
        // Silently fail
      } finally {
        setIsGhostLoading(false);
      }
    }, 1000);
  }, [resources, computeCursorCoords]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    const pos = e.target.selectionStart;
    abortRef.current = true;
    setGhostText('');
    setCursorCoords(null);
    onChange(newValue);
    scheduleGhostSuggestion(newValue, pos);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab' && ghostText) {
      e.preventDefault();
      const before = content.slice(0, ghostCursorPos);
      const after = content.slice(ghostCursorPos);
      const newContent = before + ghostText + after;
      const newPos = ghostCursorPos + ghostText.length;
      onChange(newContent);
      setGhostText('');
      setCursorCoords(null);
      clearTimeout(debounceTimerRef.current);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      });
    } else if (e.key !== 'Tab') {
      abortRef.current = true;
      setGhostText('');
      setCursorCoords(null);
    }
  };

  const handleAutocomplete = async () => {
    if (!hasApiKey()) { setError("Please set your Gemini API key in settings."); return; }
    const textarea = textareaRef.current;
    const pos = textarea ? textarea.selectionStart : content.length;
    const before = content.slice(0, pos);
    const after = content.slice(pos);
    if (!before.trim()) { setError("Place your cursor after some text to autocomplete."); return; }
    setIsGenerating(true);
    setError(null);
    setGhostText('');
    cursorPosRef.current = pos;
    try {
      const continuation = await generateAutocomplete(before, resources);
      const pad = before.endsWith(' ') ? '' : ' ';
      const inserted = pad + continuation.trim();
      onChange(before + inserted + after);
      const newPos = pos + inserted.length;
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      });
    } catch (err) {
      setError(`Failed to generate text. ${err.message || "Please check your API key."}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestEdits = async () => {
    if (!hasApiKey()) { setError("Please set your Gemini API key in settings."); return; }
    if (!content.trim()) { setError("Please write some text first to get suggestions."); return; }
    setIsAnalyzing(true);
    setError(null);
    setSuggestions(null);
    try {
      const result = await suggestEdits(content, resources);
      setSuggestions(result);
    } catch (err) {
      setError(`Failed to analyze text. ${err.message || "Please check your API key."}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCheckCitation = async () => {
    if (!hasApiKey()) { setError("Please set your Gemini API key in settings."); return; }
    if (!content.trim()) { setError("Please write some text to check citations for."); return; }
    if (!resources || resources.length === 0) {
      setError("Please upload at least one PDF source document first.");
      return;
    }
    setIsCheckingCitation(true);
    setError(null);
    setCitationReport(null);
    try {
      // Use selected text if available, otherwise use full content
      const textarea = textareaRef.current;
      const selected = textarea
        ? content.slice(textarea.selectionStart, textarea.selectionEnd).trim()
        : '';
      const textToCheck = selected || content;
      const report = await checkCitation(textToCheck, resources);
      setCitationReport(report);
    } catch (err) {
      setError(`Citation check failed. ${err.message || "Please check your API key."}`);
    } finally {
      setIsCheckingCitation(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={handleAutocomplete} disabled={isGenerating || isAnalyzing || isCheckingCitation}>
          {isGenerating ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
          Autocomplete Text
        </button>
        <button className="btn btn-secondary" onClick={handleSuggestEdits} disabled={isGenerating || isAnalyzing || isCheckingCitation}>
          {isAnalyzing ? <Loader2 size={16} className="spin" /> : <Edit3 size={16} />}
          Suggest Edits
        </button>
        <button className="btn btn-secondary" onClick={handleCheckCitation} disabled={isGenerating || isAnalyzing || isCheckingCitation}>
          {isCheckingCitation ? <Loader2 size={16} className="spin" /> : <BookCheck size={16} />}
          Check Citation
        </button>

        {isGhostLoading && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <Loader2 size={13} className="spin" /> Generating suggestion...
          </span>
        )}
        {ghostText && !isGhostLoading && (
          <span style={{ fontSize: '13px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} />
            Press <kbd style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '1px 6px', fontFamily: 'monospace', fontSize: '12px' }}>Tab</kbd> to accept
          </span>
        )}
        {error && <span style={{ color: 'var(--danger)', fontSize: '13px' }}>{error}</span>}
      </div>

      {/* Editor Area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>

        {/* Floating ghost text pinned to cursor position */}
        {ghostText && cursorCoords && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: cursorCoords.top,
              left: cursorCoords.left,
              fontSize: '16px',
              lineHeight: '1.8',
              fontFamily: 'inherit',
              color: 'rgba(160, 140, 255, 0.65)',
              pointerEvents: 'none',
              zIndex: 3,
              whiteSpace: 'pre',
              maxWidth: `calc(100% - ${cursorCoords.left + 32}px)`,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {ghostText}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onSelect={() => {
            if (ghostText) { abortRef.current = true; setGhostText(''); setCursorCoords(null); }
          }}
          placeholder="Start writing your research paper here..."
          style={{
            position: 'relative',
            zIndex: 2,
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
            minHeight: '0',
            caretColor: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Suggestions Popup */}
      {suggestions && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setSuggestions(null); }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '24px' }}
        >
          <div className="glass" style={{ width: '100%', maxWidth: '680px', maxHeight: '75vh', background: 'var(--bg-primary)', borderRadius: '16px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <h4 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} style={{ color: 'var(--accent-secondary)' }} /> Editor Suggestions
              </h4>
              <button className="btn-icon" onClick={() => setSuggestions(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div
                style={{ fontSize: '14px', lineHeight: '1.8', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}
                dangerouslySetInnerHTML={{ __html: suggestions
                  .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
                  .replace(/^- /gm, '• ')
                }}
              />
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button className="btn btn-primary" onClick={() => setSuggestions(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      {/* Citation Check Popup */}
      {citationReport && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setCitationReport(null); }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '24px' }}
        >
          <div className="glass" style={{ width: '100%', maxWidth: '720px', maxHeight: '80vh', background: 'var(--bg-primary)', borderRadius: '16px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <h4 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookCheck size={18} style={{ color: 'var(--accent-primary)' }} /> Citation Check Report
              </h4>
              <button className="btn-icon" onClick={() => setCitationReport(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: '8px 16px', background: 'rgba(99,102,241,0.08)', borderBottom: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0 }}>
              💡 Tip: Select specific text before clicking "Check Citation" to verify only that passage.
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div
                style={{ fontSize: '14px', lineHeight: '1.9', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}
                dangerouslySetInnerHTML={{ __html: citationReport
                  .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
                  .replace(/✅/g, '<span style="color:#10b981">✅</span>')
                  .replace(/⚠️/g, '<span style="color:#f59e0b">⚠️</span>')
                  .replace(/❌/g, '<span style="color:#ef4444">❌</span>')
                  .replace(/^- /gm, '• ')
                }}
              />
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button className="btn btn-primary" onClick={() => setCitationReport(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
