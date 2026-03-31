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
      const body = mode === 'login'
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
      <div style={heroStyle}>
        <div style={heroBadge}>AI × PBL × 成长画像</div>
        <h1 style={titleStyle}>让兴趣变成可展示的学习成果</h1>
        <p style={descStyle}>
          学生端负责“兴趣 → 任务 → 反馈”，家长端负责“雷达 → 报告 → 建议”，把探索过程变成看得见的成长资产。
        </p>
      </div>

      <div style={cardStyle}>
        <div style={tabWrapStyle}>
          <button onClick={() => setMode('login')} style={tabStyle(mode === 'login')}>登录</button>
          <button onClick={() => setMode('register')} style={tabStyle(mode === 'register')}>注册</button>
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

        <button onClick={handleSubmit} disabled={loading} style={submitStyle}>
          {loading ? '处理中...' : mode === 'login' ? '进入星脉' : '创建账号'}
        </button>

        {error && <div style={{ color: '#c62828', fontWeight: 700 }}>{error}</div>}

        <div style={demoBoxStyle}>
          <div><strong>学生体验号：</strong>student@synapse.ai / 123456</div>
          <div><strong>家长体验号：</strong>parent@synapse.ai / 123456</div>
        </div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.1fr 0.9fr',
  gap: 24,
  alignItems: 'center',
  minHeight: '70vh'
};

const heroStyle: React.CSSProperties = {
  padding: 24
};

const heroBadge: React.CSSProperties = {
  display: 'inline-block',
  padding: '8px 12px',
  borderRadius: 999,
  background: '#e8efff',
  color: '#3156d3',
  fontWeight: 700,
  marginBottom: 16
};

const titleStyle: React.CSSProperties = {
  fontSize: 48,
  lineHeight: 1.1,
  margin: '0 0 16px',
  color: '#102a43'
};

const descStyle: React.CSSProperties = {
  fontSize: 18,
  lineHeight: 1.8,
  color: '#52606d',
  maxWidth: 640
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 28,
  padding: 28,
  boxShadow: '0 20px 60px rgba(49,86,211,0.12)',
  display: 'grid',
  gap: 14
};

const tabWrapStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  marginBottom: 6
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  border: 'none',
  borderRadius: 999,
  padding: '10px 18px',
  background: active ? 'linear-gradient(90deg, #3156d3, #6f4ef6)' : '#eef4ff',
  color: active ? '#fff' : '#3156d3',
  fontWeight: 700,
  cursor: 'pointer'
});

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 16,
  border: '1px solid #d9e2ec',
  fontSize: 16
};

const submitStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 16,
  padding: '14px 16px',
  background: 'linear-gradient(90deg, #3156d3, #6f4ef6)',
  color: '#fff',
  fontWeight: 800,
  fontSize: 16,
  cursor: 'pointer'
};

const demoBoxStyle: React.CSSProperties = {
  marginTop: 8,
  padding: 14,
  borderRadius: 16,
  background: '#f8fbff',
  border: '1px solid #dbeafe',
  color: '#486581',
  lineHeight: 1.8
};
