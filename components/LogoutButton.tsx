'use client';

import { useState } from 'react';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        padding: '12px 24px',
        backgroundColor: '#ef4444',
        color: '#ffffff',
        border: 'none',
        borderRadius: '12px',
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '15px',
        boxShadow: '0 10px 20px rgba(239, 68, 68, 0.15)',
        transition: 'background-color 0.2s, transform 0.1s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {loading ? 'Logging out...' : 'Log Out'}
    </button>
  );
}
