import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import type { AuthResponse, UserRole } from '../types';

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('student@synapse.ai');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login' ? { email, password } : { name, email, password, role };
      const result = await apiFetch<AuthResponse>(path, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      localStorage.setItem('synapse_token', result.token);
      localStorage.setItem('synapse_user', JSON.stringify(result.user));
      navigate(result.user.role === 'student' ? '/student' : '/parent');
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '48px auto', background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }}>
      <h1>欢迎进入星脉 Synapse</h1>
      <p>不要去学知识，让知识来找你。</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setMode('login')}>登录</button>
        <button onClick={() => setMode('register')}>注册</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        {mode === 'register' && (
          <>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="姓名" />
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="student">学生</option>
              <option value="parent">家长</option>
            </select>
          </>
        )}

        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="邮箱" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码" />

        <button type="submit" disabled={loading}>{loading ? '提交中...' : mode === 'login' ? '登录' : '注册'}</button>
        {error && <div style={{ color: 'crimson' }}>{error}</div>}
      </form>

      <div style={{ marginTop: 20, fontSize: 14, color: '#666' }}>
        <div>学生体验账号：student@synapse.ai / 123456</div>
        <div>家长体验账号：parent@synapse.ai / 123456</div>
      </div>
    </div>
  );
}
