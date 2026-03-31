import { CSSProperties, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import type { Child, ParentAdvice, RadarData } from '../types';

type OverviewResponse = {
  student: {
    id: string;
    name: string;
    email: string;
  };
  latestTask: {
    id: string;
    title: string;
    subject: string;
    description: string;
    questions: string[];
    createdAt: string;
  } | null;
  latestSubmission: {
    id: string;
    taskId: string;
    studentId: string;
    answer: string;
    feedback: string;
    score: number;
    createdAt: string;
  } | null;
};

export function ParentPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [radar, setRadar] = useState<RadarData | null>(null);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [advice, setAdvice] = useState<ParentAdvice | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadChildren() {
    const res = await apiFetch<{ children: Child[] }>('/parent/getChildren');
    setChildren(res.children);
    if (res.children.length > 0) {
      setSelectedStudentId((prev) => prev || res.children[0].id);
    }
  }

  async function loadAll(studentId: string) {
    const [radarRes, overviewRes, adviceRes] = await Promise.all([
      apiFetch<RadarData>(`/parent/getRadar?studentId=${studentId}`),
      apiFetch<OverviewResponse>(`/parent/getOverview?studentId=${studentId}`),
      apiFetch<ParentAdvice>(`/parent/getAdvice?studentId=${studentId}`)
    ]);

    setRadar(radarRes);
    setOverview(overviewRes);
    setAdvice(adviceRes);
  }

  useEffect(() => {
    loadChildren().catch((err) => setError(err instanceof Error ? err.message : '加载失败'));
  }, []);

  useEffect(() => {
    if (!selectedStudentId) return;
    loadAll(selectedStudentId).catch((err) => setError(err instanceof Error ? err.message : '加载失败'));
  }, [selectedStudentId]);

  async function handleDownloadReport() {
    if (!selectedStudentId) return;

    try {
      const html = await apiFetch<string>(`/parent/exportReport?studentId=${selectedStudentId}`);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `synapse-report-${selectedStudentId}.html`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('学习成果报告已下载。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '下载失败');
    }
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={heroStyle}>
        <div>
          <div style={heroBadge}>家长端成长看板</div>
          <h2 style={{ margin: '10px 0', fontSize: 34 }}>把孩子的兴趣探索变成看得见的成长资产</h2>
          <p style={{ margin: 0, color: '#52606d', lineHeight: 1.8 }}>
            这里会展示孩子的最近任务、最近反馈、能力雷达，以及 AI 为家长生成的成长建议。
          </p>
        </div>
      </section>

      <section style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h3 style={sectionTitleStyle}>选择孩子</h3>
          <button onClick={handleDownloadReport} style={primaryButtonStyle}>下载学习成果报告</button>
        </div>

        {children.length > 0 ? (
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            style={inputStyle}
          >
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}（{child.email}）
              </option>
            ))}
          </select>
        ) : (
          <div>当前没有绑定学生。</div>
        )}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
        <div style={{ display: 'grid', gap: 20 }}>
          <section style={cardStyle}>
            <h3 style={sectionTitleStyle}>最近学习记录</h3>
            {overview ? (
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={panelStyle}>
                  <h4 style={{ marginTop: 0 }}>最近任务</h4>
                  {overview.latestTask ? (
                    <div style={{ display: 'grid', gap: 8 }}>
                      <InfoRow label="标题" value={overview.latestTask.title} />
                      <InfoRow label="学科" value={overview.latestTask.subject} />
                      <InfoRow label="描述" value={overview.latestTask.description} />
                    </div>
                  ) : (
                    <div>暂无任务记录</div>
                  )}
                </div>

                <div style={panelStyle}>
                  <h4 style={{ marginTop: 0 }}>最近一次作答</h4>
                  {overview.latestSubmission ? (
                    <div style={{ display: 'grid', gap: 8 }}>
                      <InfoRow label="得分" value={String(overview.latestSubmission.score)} />
                      <InfoRow label="学生作答" value={overview.latestSubmission.answer} />
                      <InfoRow label="AI反馈" value={overview.latestSubmission.feedback} />
                    </div>
                  ) : (
                    <div>暂无作答记录</div>
                  )}
                </div>
              </div>
            ) : (
              <div>暂无数据</div>
            )}
          </section>

          <section style={cardStyle}>
            <h3 style={sectionTitleStyle}>AI 成长建议</h3>
            {advice ? (
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={panelStyle}>
                  <strong>总体总结：</strong>
                  <div style={{ marginTop: 8 }}>{advice.summary}</div>
                </div>
                <ListCard title="优势亮点" items={advice.strengths} />
                <ListCard title="关注点" items={advice.risks} />
                <ListCard title="建议家长这样做" items={advice.advice} />
              </div>
            ) : (
              <div>暂无建议</div>
            )}
          </section>
        </div>

        <section style={cardStyle}>
          <h3 style={sectionTitleStyle}>能力雷达</h3>
          {radar ? (
            <div style={{ display: 'grid', gap: 14 }}>
              <Metric label="逻辑推理" value={radar.logic} />
              <Metric label="抗挫折力" value={radar.resilience} />
              <Metric label="创造力" value={radar.creativity} />
              <Metric label="表达力" value={radar.expression} />
              <Metric label="协作意识" value={radar.collaboration} />
            </div>
          ) : (
            <div>暂无雷达数据</div>
          )}
        </section>
      </div>

      {success && <div style={{ color: '#157347', fontWeight: 700 }}>{success}</div>}
      {error && <div style={{ color: '#c62828', fontWeight: 700 }}>{error}</div>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div style={{ height: 12, background: '#e8eef8', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: 'linear-gradient(90deg, #3156d3, #6f4ef6)' }} />
      </div>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={panelStyle}>
      <strong>{title}</strong>
      <ul>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <strong>{label}：</strong>{value}
    </div>
  );
}

const heroStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #ffffff 0%, #f5f8ff 100%)',
  borderRadius: 28,
  padding: 28,
  boxShadow: '0 16px 40px rgba(49,86,211,0.08)'
};

const heroBadge: CSSProperties = {
  display: 'inline-block',
  padding: '8px 12px',
  borderRadius: 999,
  background: '#e8efff',
  color: '#3156d3',
  fontWeight: 700
};

const cardStyle: CSSProperties = {
  background: '#fff',
  borderRadius: 24,
  padding: 22,
  boxShadow: '0 12px 32px rgba(15,23,42,0.06)'
};

const panelStyle: CSSProperties = {
  background: '#f8fbff',
  borderRadius: 18,
  padding: 16,
  border: '1px solid #dbeafe'
};

const sectionTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 16,
  fontSize: 24,
  color: '#102a43'
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 14,
  border: '1px solid #d9e2ec',
  fontSize: 15
};

const primaryButtonStyle: CSSProperties = {
  border: 'none',
  borderRadius: 16,
  padding: '12px 16px',
  background: 'linear-gradient(90deg, #3156d3, #6f4ef6)',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer'
};
