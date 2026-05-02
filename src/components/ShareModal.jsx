import React, { useState, useEffect } from 'react';
import { Mail, Send, X, User, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import emailjs from '@emailjs/browser';

const ShareModal = ({ project, onClose }) => {
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [savedSenders, setSavedSenders] = useState([]);
  const [savedReceivers, setSavedReceivers] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  
  const [showSettings, setShowSettings] = useState(false);
  const [serviceId, setServiceId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [publicKey, setPublicKey] = useState('');

  useEffect(() => {
    fetch(`/api/settings/${project.userId}`)
      .then(res => res.json())
      .then(data => {
        const senders = data.saved_senders || [];
        const receivers = data.saved_receivers || [];
        setSavedSenders(senders);
        setSavedReceivers(receivers);
        
        setServiceId(data.emailjs_service_id || '');
        setTemplateId(data.emailjs_template_id || '');
        setPublicKey(data.emailjs_public_key || '');

        const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
        if (currentUser.username && !senders.includes(currentUser.username)) {
          setSender(currentUser.username);
        } else if (senders.length > 0) {
          setSender(senders[0]);
        }
      })
      .catch(err => console.error('Failed to load share settings', err));
  }, [project.userId]);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    fetch(`/api/settings/${project.userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailjs_service_id: serviceId.trim(),
        emailjs_template_id: templateId.trim(),
        emailjs_public_key: publicKey.trim()
      })
    })
    .then(() => setShowSettings(false))
    .catch(err => console.error('Failed to save email settings', err));
  };

  const handleShare = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });
    
    if (!serviceId || !templateId || !publicKey) {
      setShowSettings(true);
      return;
    }

    if (!sender.trim() || !receiver.trim()) return;

    setIsSending(true);

    const newSenders = [...new Set([sender.trim(), ...savedSenders])].slice(0, 10);
    const newReceivers = [...new Set([receiver.trim(), ...savedReceivers])].slice(0, 10);
    
    setSavedSenders(newSenders);
    setSavedReceivers(newReceivers);

    fetch(`/api/settings/${project.userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        saved_senders: newSenders,
        saved_receivers: newReceivers
      })
    }).catch(err => console.error('Failed to update contacts', err));

    try {
      await emailjs.send(
        serviceId.trim(),
        templateId.trim(),
        {
          from_name: sender.trim(),
          to_email: receiver.trim(),
          project_name: project.name,
          message: project.content || 'This research has no content yet.',
        },
        publicKey.trim()
      );
      
      setStatusMsg({ type: 'success', text: 'Email sent successfully!' });
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error('Failed to send email:', err);
      setStatusMsg({ type: 'error', text: 'Failed to send. Please check your API keys.' });
      setIsSending(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div className="glass" style={{
        width: '450px',
        padding: '32px',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, display: 'flex', gap: '8px' }}>
          {!showSettings && (
            <button className="btn-icon" onClick={() => setShowSettings(true)} title="EmailJS Settings">
              <Settings size={20} />
            </button>
          )}
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ 
            width: '48px', height: '48px', 
            borderRadius: '16px', 
            background: 'rgba(99, 102, 241, 0.1)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--accent-primary)'
          }}>
            {showSettings ? <Settings size={24} /> : <Mail size={24} />}
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
            {showSettings ? 'EmailJS Configuration' : 'Share Research'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {showSettings 
              ? 'Configure your EmailJS credentials to send emails.' 
              : `Send "${project.name}" as an email report.`}
          </p>
        </div>

        {statusMsg.text && (
          <div style={{ 
            background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
            color: statusMsg.type === 'success' ? 'var(--success)' : 'var(--danger)', 
            padding: '16px', 
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            fontWeight: 500,
            animation: 'fadeIn 0.3s ease-in-out'
          }}>
            {statusMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {statusMsg.text}
          </div>
        )}

        {showSettings ? (
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '4px' }}>Service ID</label>
              <input type="text" value={serviceId} onChange={(e) => setServiceId(e.target.value)} placeholder="service_xyz" style={{ height: '42px' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '4px' }}>Template ID</label>
              <input type="text" value={templateId} onChange={(e) => setTemplateId(e.target.value)} placeholder="template_xyz" style={{ height: '42px' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '4px' }}>Public Key</label>
              <input type="text" value={publicKey} onChange={(e) => setPublicKey(e.target.value)} placeholder="public_key" style={{ height: '42px' }} required />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1, height: '46px' }} onClick={() => setShowSettings(false)}>Back</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '46px' }}>Save Settings</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleShare} style={{ display: 'flex', flexDirection: 'column', gap: '16px', display: statusMsg.type === 'success' ? 'none' : 'flex' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '4px' }}>From (Sender Name/Email)</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="Sender Name"
                  list="sender-suggestions"
                  style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', height: '42px' }}
                  required
                />
                <datalist id="sender-suggestions">
                  {savedSenders.map((s, idx) => <option key={idx} value={s} />)}
                </datalist>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '4px' }}>To (Receiver Email)</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="email" 
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  placeholder="receiver@email.com"
                  list="receiver-suggestions"
                  style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', height: '42px' }}
                  required
                />
                <datalist id="receiver-suggestions">
                  {savedReceivers.map((r, idx) => <option key={idx} value={r} />)}
                </datalist>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ height: '46px', marginTop: '12px', fontSize: '15px' }}
              disabled={isSending || !sender.trim() || !receiver.trim()}
            >
              {isSending ? 'Sending...' : 'Send Email'}
              {!isSending && <Send size={16} style={{ marginLeft: '4px' }} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
