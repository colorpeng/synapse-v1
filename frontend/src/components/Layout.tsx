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
      <div style={bgGlow1} />
      <div style={bgGlow2} />
      <div style={bgGlow3} />

      <header style={headerWrapStyle}>
        <div style={headerStyle} className="synapse-card">
          <div style={brandBlockStyle}>
            <div style={logoWrapStyle}>
              <div style={logoDotStyle} />
              <div>
                <div style={brandStyle}>星脉 Synapse</div>
                <div style={tagStyle}>不要去学知识，让知识来找你。</div>
              </div>
            </div>
          </div>

          <div style={navAreaStyle}>
            {user ? (
              <>
                <Link to="/student" style={navLinkStyle(isActive('/student'))}>
                  学生端
                </Link>
                <Link to="/parent" style={navLinkStyle(isActive('/parent'))}>
                  家长端
                </Link>
                <div style={userChipStyle}>{user.name}</div>
                <button onClick={handleLogout} style={logoutButtonStyle}>
                  退出
                </button>
              </>
            ) : (
              <div style={guestChipStyle}>欢迎使用 AI 学习成长系统</div>
            )}
          </div>
        </div>
      </header>

      <main style={mainStyle}>{children}</main>
    </div>
  );
}

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  position: 'relative',
  overflow: 'hidden'
};

const bgGlow1: React.CSSProperties = {
  position: 'fixed',
  top: -120,
  left: -120,
  width: 320,
  height: 320,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(109,124,255,0.22) 0%, transparent 70%)',
  pointerEvents: 'none',
  filter: 'blur(18px)'
};

const bgGlow2: React.CSSProperties = {
  position: 'fixed',
  top: 80,
  right: -80,
  width: 280,
  height: 280,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
  pointerEvents: 'none',
  filter: 'blur(18px)'
};

const bgGlow3: React.CSSProperties = {
  position: 'fixed',
  bottom: -80,
  left: '20%',
  width: 260,
  height: 260,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)',
  pointerEvents: 'none',
  filter: 'blur(18px)'
};

const headerWrapStyle: React.CSSProperties = {
  maxWidth: 1240,
  margin: '0 auto',
  padding: '20px 20px 10px',
  position: 'relative',
  zIndex: 2
};

const headerStyle: React.CSSProperties = {
  borderRadius: 24,
  padding: '18px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap'
};

const brandBlockStyle: React.CSSProperties = {
  minWidth: 0
};

const logoWrapStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14
};

const logoDotStyle: React.CSSProperties = {
  width: 16,
  height: 16,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #6d7cff, #8b5cf6)',
  boxShadow: '0 0 20px rgba(109,124,255,0.6)'
};

const brandStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  color: '#f8fbff',
  letterSpacing: '-0.02em'
};

const tagStyle: React.CSSProperties = {
  marginTop: 4,
  color: '#9fb0c8',
  fontSize: 14
};

const navAreaStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap'
};

const navLinkStyle = (active: boolean): React.CSSProperties => ({
  textDecoration: 'none',
  padding: '10px 14px',
  borderRadius: 999,
  color: active ? '#fff' : '#dbe7ff',
  background: active
    ? 'linear-gradient(90deg, #6d7cff, #8b5cf6)'
    : 'rgba(109,124,255,0.1)',
  border: active ? 'none' : '1px solid rgba(109,124,255,0.22)',
  fontWeight: 800
});

const userChipStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.05)',
  borderRadius: 999,
  color: '#d8e4ff',
  border: '1px solid rgba(148,163,184,0.18)',
  fontWeight: 700
};

const guestChipStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.05)',
  borderRadius: 999,
  color: '#a9b8cc',
  border: '1px solid rgba(148,163,184,0.18)',
  fontWeight: 600
};

const logoutButtonStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 999,
  padding: '10px 16px',
  background: 'rgba(255,255,255,0.06)',
  color: '#f8fbff',
  fontWeight: 800,
  cursor: 'pointer'
};

const mainStyle: React.CSSProperties = {
  maxWidth: 1240,
  margin: '0 auto',
  padding: '14px 20px 28px',
  position: 'relative',
  zIndex: 2
};
