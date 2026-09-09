import { useState } from 'react';
import { userLogin, userRegister } from '../api/api';
import './UserAuthModal.css';

/**
 * UserAuthModal — Modal for Shopper Login and Account Registration
 */
export default function UserAuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({
    username: '',
    email: '',
    usernameOrEmail: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      if (!form.usernameOrEmail.trim() || !form.password) {
        return setError('Please fill in both fields.');
      }
      setLoading(true);
      try {
        const res = await userLogin(form.usernameOrEmail.trim(), form.password);
        localStorage.setItem('vf_user_token', res.token);
        localStorage.setItem('vf_user_data', JSON.stringify(res.user));
        onSuccess(res.user);
      } catch (err) {
        setError(err.response?.data?.error || 'Login failed. Please check credentials.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!form.username.trim() || !form.email.trim() || !form.password) {
        return setError('All fields are required for registration.');
      }
      setLoading(true);
      try {
        const res = await userRegister(form.username.trim(), form.email.trim(), form.password);
        localStorage.setItem('vf_user_token', res.token);
        localStorage.setItem('vf_user_data', JSON.stringify(res.user));
        onSuccess(res.user);
      } catch (err) {
        setError(err.response?.data?.error || 'Registration failed.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="user-auth-card glass-card slide-down">
        <div className="user-auth-header">
          <h2>{mode === 'login' ? '🔑 User Login' : '✨ Create Shopper Account'}</h2>
          <button className="btn btn-ghost btn-sm close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Login / உள்நுழைக
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Register / பதிவு செய்ய
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'login' ? (
            <div className="form-group">
              <label className="form-label">Username or Email</label>
              <input
                type="text"
                className="input"
                placeholder="Enter your username or email"
                value={form.usernameOrEmail}
                onChange={e => handleChange('usernameOrEmail', e.target.value)}
                autoFocus
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. shopper1"
                  value={form.username}
                  onChange={e => handleChange('username', e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="e.g. user@example.com"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => handleChange('password', e.target.value)}
            />
          </div>

          {error && <div className="auth-error fade-in">⚠️ {error}</div>}

          <div className="auth-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Processing...' : mode === 'login' ? '🔐 Log In' : '🎉 Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
