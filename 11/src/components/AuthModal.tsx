import React, { useState } from 'react';
import { registerUser, loginUser, ApiError } from '../services/api';
import type { User } from '../services/api';
import { Spinner } from './Spinner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, isNewRegistration: boolean) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) throw new Error('Please enter your name.');
        if (!email.trim()) throw new Error('Please enter your email.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');

        const res = await registerUser({ name: name.trim(), email: email.trim(), password });
        onSuccess(res.user, true);
        onClose();
      } else {
        if (!email.trim() || !password) throw new Error('Please enter email and password.');

        const res = await loginUser({ email: email.trim(), password });
        onSuccess(res.user, false);
        onClose();
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication request failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content auth-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="auth-brand">
            <span className="auth-icon">🔐</span>
            <div>
              <h3 className="modal-title">
                {mode === 'login' ? 'Sign In to Your Workspace' : 'Create New Account'}
              </h3>
              <p className="auth-subtitle">
                {mode === 'login'
                  ? 'Access your authenticated Task Management pipeline'
                  : 'Get started with JWT protected task persistence'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="auth-mode-switch">
          <button
            type="button"
            className={`auth-mode-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-mode-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setError(null);
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="auth-error-banner">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-name" className="form-label">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="auth-name"
                type="text"
                className="form-input"
                placeholder="e.g., Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email" className="form-label">
              Email Address <span className="required">*</span>
            </label>
            <input
              id="auth-email"
              type="email"
              className="form-input"
              placeholder="name@charusat.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus={mode === 'login'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password" className="form-label">
              Password <span className="required">*</span>
              {mode === 'register' && (
                <span className="label-hint"> (min 6 characters)</span>
              )}
            </label>
            <input
              id="auth-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: '130px' }}
            >
              {loading ? (
                <>
                  <Spinner />
                  <span>Processing...</span>
                </>
              ) : mode === 'login' ? (
                'Sign In'
              ) : (
                'Register'
              )}
            </button>
          </div>
        </form>

        {/* Security Footer Note */}
        <div className="auth-footer-note">
          <small>
            🔒 Passwords hashed server-side with <strong>bcrypt (10 rounds)</strong>. Authenticated with <strong>JWT Bearer Token</strong>.
          </small>
        </div>
      </div>
    </div>
  );
};
