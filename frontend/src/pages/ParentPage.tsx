import { CSSProperties, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import type { Child, RadarData } from '../types';

export function ParentPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [radar, setRadar] = useState<RadarData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ children: Child[] }>('/parent/getChildren')
      .then((res) => {
        setChildren(res.children);
        if (res.children[0]) {
          setSelectedStudentId(res.children[0].id);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : '获取孩子失败'));
  }, []);

  useEffect(() => {
    if (!selectedStudentId) return;
    apiFetch<RadarData>(`/parent/getRadar?studentId=${selectedStudentId}`)
      .then(setRadar)
      .catch((err) => setError(err instanceof Error ? err.message : '获取雷达图失败'));
  }, [selectedStudentId]);

  async function handleDownloadReport() {
    try {
      const html = await apiFetch<string>(`/parent/exportReport?studentId=${selectedStudentId}`);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `synapse-report-${selectedStudentId}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '下载报告失败');
    }
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={cardStyle}>
        <h2>家长端 V1</h2>
        <p>这里是“孩子成长看板 + 能力雷达 + 报告导出”的首版流程。</p>
      </section>

      <section style={cardStyle}>
        <h3>第 1 步：选择孩子</h3>
        <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
          {children.map((child) => (
            <option value={child.id} key={child.id}>{child.name}</option>
          ))}
        </select>
      </section>

      <section style={cardStyle}>
        <h3>第 2 步：查看能力雷达</h3>
        {radar ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <Metric label="逻辑推理" value={radar.logic} />
            <Metric label="抗挫折力" value={radar.resilience} />
            <Metric label="创造力" value={radar.creativity} />
            <Metric label="表达力" value={radar.expression} />
            <Metric label="协作意识" value={radar.collaboration} />
          </div>
        ) : (
          <div>暂无数据</div>
        )}
      </section>

      <section style={cardStyle}>
        <h3>第 3 步：导出成果报告</h3>
        <button onClick={handleDownloadReport} disabled={!selectedStudentId}>下载学习成果报告</button>
      </section>

      {error && <div style={{ color: 'crimson' }}>{error}</div>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div style={{ height: 10, background: '#edf1f8', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: '#4f7cff' }} />
      </div>
    </div>
  );
}

const cardStyle: CSSProperties = {
  background: '#fff',
  borderRadius: 18,
  padding: 20,
  boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
};
