import React, { useState } from 'react';
import '../../styles/admin.css';
import { apiClient } from '../../utils/apiClient';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onNavigateHome: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onNavigateHome,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both your email and password.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const response = await apiClient.adminLogin(email.trim(), password);

      if (!response.success) {
        setErrorMessage(response.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      onLoginSuccess();
    } catch {
      setErrorMessage('An unexpected network error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="admin-viewport">
      <div className="admin-login-wrapper">
        <div className="admin-card">
          <header className="admin-header">
            <div className="admin-ornament" aria-hidden="true">
              <span className="admin-ornament-line" />
              <span className="admin-ornament-icon">❖</span>
              <span className="admin-ornament-line" />
            </div>
            <p className="admin-subtitle">Manya &amp; Sarthak Wedding</p>
            <h1 className="admin-title">Admin Portal</h1>
          </header>

          <form className="admin-form" onSubmit={handleSubmit} noValidate>
            {errorMessage && (
              <div className="admin-error-box" role="alert">
                {errorMessage}
              </div>
            )}

            <div className="admin-field">
              <label htmlFor="admin-email" className="admin-label">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                className="admin-input"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={loading}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="admin-password" className="admin-label">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                className="admin-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="admin-submit-btn"
              disabled={loading}
              aria-label="Log in to admin dashboard"
            >
              {loading ? (
                <>
                  <span className="admin-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  <span>Logging In...</span>
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>

        <button
          type="button"
          onClick={onNavigateHome}
          className="admin-back-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← Return to Wedding Invitation
        </button>
      </div>
    </div>
  );
};
