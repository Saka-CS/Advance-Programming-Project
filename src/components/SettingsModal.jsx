import React, { useState, useEffect, useRef } from 'react';
import { Key, X, Lock, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { fetchAvailableModels } from '../services/gemini';

const SettingsModal = ({ currentKey, currentModel, onSave, onClose }) => {
  const [key, setKey] = useState(currentKey || '');
  const [model, setModel] = useState(currentModel || '');
  const [availableModels, setAvailableModels] = useState([]);
  const [fetchState, setFetchState] = useState('idle'); // idle | loading | success | error
  const [fetchError, setFetchError] = useState('');
  const debounceRef = useRef(null);

  // Auto-fetch when the key field is a plausible length (>= 20 chars)
  useEffect(() => {
    if (key.trim().length < 20) {
      setAvailableModels([]);
      setFetchState('idle');
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadModels(key.trim());
    }, 700);
    return () => clearTimeout(debounceRef.current);
  }, [key]);

  const loadModels = async (apiKey) => {
    setFetchState('loading');
    setFetchError('');
    try {
      const models = await fetchAvailableModels(apiKey);
      setAvailableModels(models);
      setFetchState('success');
      // auto-select previously saved model if it's still available, otherwise pick the first
      const still = models.find(m => m.name === currentModel);
      setModel(still ? still.name : (models[0]?.name || ''));
    } catch (err) {
      setFetchState('error');
      setFetchError(err.message);
      setAvailableModels([]);
    }
  };

  const handleSave = () => {
    if (key.trim() && model) {
      onSave(key.trim(), model);
    }
  };

  const statusIcon = () => {
    if (fetchState === 'loading') return <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />;
    if (fetchState === 'success') return <CheckCircle size={14} color="var(--success)" />;
    if (fetchState === 'error') return <AlertCircle size={14} color="var(--danger)" />;
    return null;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="glass" style={{
        width: '440px',
        background: 'var(--bg-primary)',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} style={{ color: 'var(--accent-primary)' }} /> API Settings
          </h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ padding: '24px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
            Enter your Google Gemini API key. Available models will be fetched automatically so you can select the one that works for your account.
          </p>

          {/* API Key Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Google Gemini API Key
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AIzaSy..."
                style={{ width: '100%', paddingLeft: '36px', paddingRight: '36px' }}
              />
              {/* Inline status indicator */}
              <span style={{ position: 'absolute', right: '12px', top: '12px' }}>
                {statusIcon()}
              </span>
            </div>
            <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank" rel="noreferrer"
                style={{ fontSize: '12px', color: 'var(--accent-primary)', textDecoration: 'none' }}
              >
                Get an API key →
              </a>
              {fetchState !== 'idle' && (
                <button
                  className="btn-icon"
                  style={{ padding: '2px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}
                  onClick={() => key.trim().length >= 20 && loadModels(key.trim())}
                >
                  <RefreshCw size={12} /> Retry
                </button>
              )}
            </div>
          </div>

          {/* Error message */}
          {fetchState === 'error' && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              color: 'var(--danger)',
              marginBottom: '16px'
            }}>
              {fetchError}
            </div>
          )}

          {/* Model Selector */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Gemini Model
            </label>

            {fetchState === 'loading' && (
              <div style={{
                padding: '12px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Fetching available models...
              </div>
            )}

            {fetchState === 'success' && availableModels.length > 0 && (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {availableModels.map(m => (
                  <option key={m.name} value={m.name}>{m.displayName}</option>
                ))}
              </select>
            )}

            {fetchState === 'idle' && (
              <div style={{
                padding: '12px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px dashed var(--border-color)',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                textAlign: 'center'
              }}>
                Enter your API key above to load available models
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!key.trim() || !model || fetchState === 'loading'}
              style={{ opacity: (!key.trim() || !model || fetchState === 'loading') ? 0.5 : 1 }}
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SettingsModal;
