import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export function Layout({ children }: { children: ReactNode }) {
  const userRaw = localStorage.getItem('synapse_user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  function handleLogout() {
    localStorage.removeItem('synapse_token');
    localStorage.removeItem('synapse_user');
    navigate('/');
  }

  return (
    <div style={shellStyle}>
      <header style={headerStyle}>
        <div>
          <div style={brandStyle}>星脉 Synapse</div>
          <div style={tagStyle}>不要去学知识，让知识来找你。</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user && (
            <>
              <Link to="/student" style={navLinkStyle(isActive('/student'))}>学生端</Link>
              <Link to="/parent" style={navLinkStyle(isActive('/parent'))}>家长端</Link>
              <div style={userChipStyle}>{user.name}</div>
              <button onClick={handleLogout} style={logoutButtonStyle}>退出</button>
            </>
          )}
        </div>
      </header>

      <main style={mainStyle}>{children}</main>
    </div>
  );
}

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #eef3ff 0%, #f8fbff 100%)'
};

const headerStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '24px 20px 12px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16
};

const brandStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  color: '#102a43'
};

const tagStyle: React.CSSProperties = {
  marginTop: 6,
  color: '#5b7083',
  fontSize: 14
};

const mainStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '20px'
};

const navLinkStyle = (active: boolean): React.CSSProperties => ({
  textDecoration: 'none',
  padding: '10px 14px',
  borderRadius: 999,
  color: active ? '#fff' : '#3156d3',
  background: active ? 'linear-gradient(90deg, #3156d3, #6f4ef6)' : '#eef4ff',
  fontWeight: 700
});

const userChipStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: '#fff',
  borderRadius: 999,
  color: '#334e68',
  border: '1px solid #d9e2ec',
  fontWeight: 700
};

const logoutButtonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 999,
  padding: '10px 16px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer'
};
