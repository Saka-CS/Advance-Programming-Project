import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, ArrowRight } from 'lucide-react';

function AuthModal({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Handle Enter key for submission
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [username, password, isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      if (!email.trim() || !password.trim()) {
        setError('Please fill in all fields');
        return;
      }
    } else {
      if (!email.trim() || !username.trim() || !password.trim()) {
        setError('Please fill in all fields');
        return;
      }
    }

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const bodyPayload = isLogin 
        ? { email: email.trim(), password }
        : { email: email.trim(), username: username.trim(), password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Authentication failed');
      } else {
        onLogin(data);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Failed to connect to the server');
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
        width: '400px',
        padding: '40px',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background gradients */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          left: '-50px',
          width: '150px',
          height: '150px',
          background: 'var(--accent-primary)',
          filter: 'blur(80px)',
          opacity: 0.5,
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          right: '-50px',
          width: '150px',
          height: '150px',
          background: 'var(--accent-secondary)',
          filter: 'blur(80px)',
          opacity: 0.5,
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h2 className="gradient-text" style={{ fontSize: '28px', marginBottom: '8px' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {isLogin ? 'Log in to access your research and files.' : 'Sign up to start managing your research.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '4px' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: '40px', paddingRight: '14px', height: '46px' }}
                autoFocus
              />
            </div>
          </div>

          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '4px' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Enter your username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ width: '100%', paddingLeft: '40px', paddingRight: '14px', height: '46px' }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '4px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '40px', paddingRight: '14px', height: '46px' }}
              />
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '13px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '8px' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ height: '46px', marginTop: '8px', fontSize: '16px' }}>
            {isLogin ? 'Log In' : 'Sign Up'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: '8px' }}>
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '4px'
            }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
