import React, { useState, useEffect, useCallback } from 'react';
import '../../styles/admin.css';
import { apiClient, WishRecord } from '../../utils/apiClient';

interface AdminDashboardProps {
  onLogout: () => void;
  onRequireLogin: () => void;
  onNavigateHome: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  onRequireLogin,
  onNavigateHome,
}) => {
  const [wishes, setWishes] = useState<WishRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWishes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // First check session
      const meRes = await apiClient.getAdminMe();
      if (!meRes.success) {
        onRequireLogin();
        return;
      }

      // Fetch wishes
      const res = await apiClient.getAdminWishes();
      if (res.success && Array.isArray(res.wishes)) {
        setWishes(res.wishes);
      } else {
        setError(res.message || 'Failed to load guest wishes.');
      }
    } catch {
      setError('Unable to reach the server. Please check your network.');
    } finally {
      setLoading(false);
    }
  }, [onRequireLogin]);

  useEffect(() => {
    fetchWishes();
  }, [fetchWishes]);

  const handleLogout = async () => {
    try {
      await apiClient.adminLogout();
    } finally {
      onLogout();
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="admin-viewport">
      <div className="admin-dashboard-container">
        {/* Dashboard Header Bar */}
        <header className="admin-dashboard-header">
          <div className="admin-brand">
            <h1>Guest Blessings</h1>
            <p>Manya &amp; Sarthak Wedding</p>
          </div>

          <div className="admin-actions">
            <span className="admin-badge" aria-label="Total blessings received">
              {wishes.length} {wishes.length === 1 ? 'Wish' : 'Wishes'}
            </span>
            <button
              type="button"
              className="admin-logout-btn"
              onClick={handleLogout}
              aria-label="Log out of admin dashboard"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content Body */}
        {loading ? (
          <div className="admin-loading-container" role="status">
            <div className="admin-spinner" />
            <p style={{ color: '#775a19', fontSize: 13, fontFamily: 'Cinzel, serif' }}>
              Loading blessings...
            </p>
          </div>
        ) : error ? (
          <div className="admin-card" style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ color: '#9a3b4d', marginBottom: 16 }}>{error}</p>
            <button
              type="button"
              className="admin-submit-btn"
              style={{ display: 'inline-flex', margin: '0 auto' }}
              onClick={fetchWishes}
            >
              Try Again
            </button>
          </div>
        ) : wishes.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">💌</div>
            <h2 className="admin-empty-title">No Wishes Yet</h2>
            <p className="admin-empty-subtitle">
              Submitted guest wishes will appear here in chronological order.
            </p>
          </div>
        ) : (
          <div className="wishes-list" role="feed" aria-label="Submitted Guest Wishes">
            {wishes.map((item, idx) => (
              <article key={item._id || idx} className="wish-item-card">
                <div className="wish-item-top">
                  <span className="wish-guest-name">
                    <span className="wish-guest-heart">♥</span>
                    {item.name}
                  </span>
                  <time className="wish-submitted-date" dateTime={item.createdAt}>
                    {formatDate(item.createdAt)}
                  </time>
                </div>
                <p className="wish-content-text">{item.wishes}</p>
              </article>
            ))}
          </div>
        )}

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <button
            type="button"
            onClick={onNavigateHome}
            className="admin-back-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← View Public Wedding Invitation
          </button>
        </div>
      </div>
    </div>
  );
};
