import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import type { AuthResponse } from '../types';

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('student@synapse.ai');
  const [password, setPassword] = useState('123456');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError('');

    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body =
        mode === 'login'
          ? { email, password }
          : { name, email, password, role: 'student' };

      const result = await apiFetch<AuthResponse>(path, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      localStorage.setItem('synapse_token', result.token);
      localStorage.setItem('synapse_user', JSON.stringify(result.user));

      navigate(result.user.role === 'student' ? '/student' : '/parent');
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={leftStyle}>
        <div style={heroBadgeStyle}>AI × PBL × 成长画像</div>
        <h1 style={titleStyle}>让兴趣，长成看得见的学习成果</h1>
        <p style={descStyle}>
          星脉 Synapse 把“学生兴趣、项目学习、成长反馈、家长沟通”连接成一条完整链路。
          不只是完成任务，而是让每一次探索都能沉淀成真正的成长证据。
        </p>

        <div style={featureGridStyle}>
          <FeatureCard
            title="学生端"
            desc="兴趣提交、难度分层、语音输入、分步作答、AI反馈"
          />
          <FeatureCard
            title="家长端"
            desc="学习报告、能力雷达、成长建议、持续看见孩子的变化"
          />
          <FeatureCard
            title="连续成长"
            desc="画像、路径、项目沉淀，让兴趣不再只是一次性体验"
          />
        </div>
      </div>

      <div style={rightStyle}>
        <div style={cardStyle} className="synapse-card">
          <div style={cardHeaderStyle}>
            <div style={cardTitleStyle}>进入星脉</div>
            <div style={cardDescStyle}>登录后继续你的 AI 学习成长旅程</div>
          </div>

          <div style={tabWrapStyle}>
            <button onClick={() => setMode('login')} style={tabStyle(mode === 'login')}>
              登录
            </button>
            <button onClick={() => setMode('register')} style={tabStyle(mode === 'register')}>
              注册
            </button>
          </div>

          {mode === 'register' && (
            <input
              placeholder="姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          )}

          <input
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={submitStyle}
            className="synapse-primary-btn"
          >
            {loading ? '处理中...' : mode === 'login' ? '进入星脉' : '创建账号'}
          </button>

          {error && (
            <div style={errorStyle} className="synapse-status-error">
              {error}
            </div>
          )}

          <div style={demoBoxStyle} className="synapse-soft-card">
            <div style={demoTitleStyle}>体验账号</div>
            <div><strong>学生：</strong>student@synapse.ai / 123456</div>
            <div><strong>家长：</strong>parent@synapse.ai / 123456</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={featureCardStyle} className="synapse-soft-card">
      <div style={featureTitleStyle}>{title}</div>
      <div style={featureDescStyle}>{desc}</div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.08fr) minmax(360px, 0.92fr)',
  gap: 24,
  alignItems: 'center',
  minHeight: 'calc(100vh - 140px)'
};

const leftStyle: React.CSSProperties = {
  minWidth: 0,
  padding: '10px 6px'
};

const rightStyle: React.CSSProperties = {
  minWidth: 0,
  display: 'flex',
  justifyContent: 'center'
};

const heroBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '8px 12px',
  borderRadius: 999,
  background: 'rgba(109,124,255,0.14)',
  border: '1px solid rgba(109,124,255,0.22)',
  color: '#dbe7ff',
  fontWeight: 800,
  marginBottom: 18
};

const titleStyle: React.CSSProperties = {
  fontSize: 54,
  lineHeight: 1.08,
  margin: '0 0 18px',
  color: '#f8fbff',
  letterSpacing: '-0.03em'
};

const descStyle: React.CSSProperties = {
  fontSize: 18,
  lineHeight: 1.9,
  color: '#9fb0c8',
  maxWidth: 700,
  margin: 0
};

const featureGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 16,
  marginTop: 28
};

const featureCardStyle: React.CSSProperties = {
  borderRadius: 22,
  padding: 18
};

const featureTitleStyle: React.CSSProperties = {
  fontWeight: 800,
  color: '#f4f8ff',
  marginBottom: 8,
  fontSize: 17
};

const featureDescStyle: React.CSSProperties = {
  color: '#9fb0c8',
  lineHeight: 1.7,
  fontSize: 14
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 460,
  borderRadius: 28,
  padding: 28
};

const cardHeaderStyle: React.CSSProperties = {
  marginBottom: 18
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 900,
  color: '#f8fbff',
  marginBottom: 8
};

const cardDescStyle: React.CSSProperties = {
  color: '#9fb0c8',
  lineHeight: 1.7
};

const tabWrapStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  marginBottom: 14
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  border: 'none',
  borderRadius: 999,
  padding: '10px 18px',
  background: active
    ? 'linear-gradient(90deg, #6d7cff, #8b5cf6)'
    : 'rgba(109,124,255,0.08)',
  color: active ? '#fff' : '#d8e4ff',
  fontWeight: 800,
  cursor: 'pointer'
});

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 16,
  fontSize: 16,
  marginBottom: 12
};

const submitStyle: React.CSSProperties = {
  width: '100%',
  border: 'none',
  borderRadius: 16,
  padding: '14px 16px',
  fontWeight: 900,
  fontSize: 16,
  cursor: 'pointer',
  marginTop: 4
};

const errorStyle: React.CSSProperties = {
  marginTop: 14,
  padding: '12px 14px',
  borderRadius: 14,
  fontWeight: 700
};

const demoBoxStyle: React.CSSProperties = {
  marginTop: 18,
  padding: 16,
  borderRadius: 18,
  color: '#c9d7ea',
  lineHeight: 1.9
};

const demoTitleStyle: React.CSSProperties = {
  fontWeight: 800,
  color: '#f4f8ff',
  marginBottom: 6
};
