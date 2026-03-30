import { Link, useNavigate } from 'react-router-dom';
import { ReactNode } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const userRaw = localStorage.getItem('synapse_user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fb', color: '#1d2433' }}>
      <header style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e8ebf3', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <strong>星脉 Synapse V1</strong>
        </div>
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link to="/student">学生端</Link>
          <Link to="/parent">家长端</Link>
          {user && <span>{user.name}</span>}
          {user && (
            <button
              onClick={() => {
                localStorage.removeItem('synapse_token');
                localStorage.removeItem('synapse_user');
                navigate('/');
              }}
            >
              退出
            </button>
          )}
        </nav>
      </header>
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: 24 }}>{children}</main>
    </div>
  );
}
