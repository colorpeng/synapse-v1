import { CSSProperties, useEffect, useState } from 'react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';
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

  const radarChartData = radar
    ? [
        { subject: '逻辑', value: radar.logic },
        { subject: '抗挫', value: radar.resilience },
        { subject: '创造', value: radar.creativity },
        { subject: '表达', value: radar.expression },
        { subject: '协作', value: radar.collaboration }
      ]
    : [];

  return (
    <div style={pageWrapStyle}>
      <section style={heroStyle}>
        <div style={heroBadge}>家长端成长看板</div>
        <h2 style={heroTitleStyle}>把兴趣探索转化为可见的成长证据</h2>
        <p style={heroDescStyle}>
          这里会聚合孩子的最近任务、最近作答、能力雷达与 AI 建议，帮助家长更轻松地看见成长过程，而不只盯着结果。
        </p>
      </section>

      <section style={cardStyle}>
        <div style={sectionHeaderRowStyle}>
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
          <div style={emptyTextStyle}>当前没有绑定学生。</div>
        )}
      </section>

      <div style={responsiveGridStyle}>
        <div style={leftColumnStyle}>
          <section style={cardStyle}>
            <h3 style={sectionTitleStyle}>最近学习记录</h3>
            {overview ? (
              <div style={stackStyle}>
                <div style={panelStyle}>
                  <h4 style={panelTitleStyle}>最近任务</h4>
                  {overview.latestTask ? (
                    <div style={stackSmallStyle}>
                      <InfoRow label="标题" value={overview.latestTask.title} />
                      <InfoRow label="学科" value={overview.latestTask.subject} />
                      <InfoRow label="描述" value={overview.latestTask.description} />
                    </div>
                  ) : (
                    <div style={emptyTextStyle}>暂无任务记录</div>
                  )}
                </div>

                <div style={panelStyle}>
                  <h4 style={panelTitleStyle}>最近一次作答</h4>
                  {overview.latestSubmission ? (
                    <div style={stackSmallStyle}>
                      <InfoRow label="得分" value={String(overview.latestSubmission.score)} />
                      <InfoRow label="学生作答" value={overview.latestSubmission.answer} />
                      <InfoRow label="AI反馈" value={overview.latestSubmission.feedback} />
                    </div>
                  ) : (
                    <div style={emptyTextStyle}>暂无作答记录</div>
                  )}
                </div>
              </div>
            ) : (
              <div style={emptyTextStyle}>暂无数据</div>
            )}
          </section>

          <section style={cardStyle}>
            <h3 style={sectionTitleStyle}>AI 成长建议</h3>
            {advice ? (
              <div style={stackStyle}>
                <div style={panelStyle}>
                  <strong style={strongTitleStyle}>总体总结</strong>
                  <div style={paragraphStyle}>{advice.summary}</div>
                </div>
                <ListCard title="优势亮点" items={advice.strengths} />
                <ListCard title="关注点" items={advice.risks} />
                <ListCard title="建议家长这样做" items={advice.advice} />
              </div>
            ) : (
              <div style={emptyTextStyle}>暂无建议</div>
            )}
          </section>
        </div>

        <div style={rightColumnStyle}>
          <section style={cardStyle}>
            <h3 style={sectionTitleStyle}>能力雷达图</h3>
            {radar ? (
              <div style={stackStyle}>
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarChartData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <Radar dataKey="value" />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div style={metricListStyle}>
                  <MetricBadge label="逻辑推理" value={radar.logic} />
                  <MetricBadge label="抗挫折力" value={radar.resilience} />
                  <MetricBadge label="创造力" value={radar.creativity} />
                  <MetricBadge label="表达力" value={radar.expression} />
                  <MetricBadge label="协作意识" value={radar.collaboration} />
                </div>
              </div>
            ) : (
              <div style={emptyTextStyle}>暂无雷达数据</div>
            )}
          </section>
        </div>
      </div>

      {success && <StatusBanner type="success" text={success} />}
      {error && <StatusBanner type="error" text={error} />}
    </div>
  );
}

function MetricBadge({ label, value }: { label: string; value: number }) {
  return (
    <div style={metricBadgeStyle}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={metricValueStyle}>{value}</div>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={panelStyle}>
      <strong style={strongTitleStyle}>{title}</strong>
      <ul style={listStyle}>
        {items.map((item) => <li key={item} style={listItemStyle}>{item}</li>)}
      </ul>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoRowStyle}>
      <strong style={infoLabelStyle}>{label}：</strong>
      <span style={infoValueStyle}>{value}</span>
    </div>
  );
}

function StatusBanner({ type, text }: { type: 'success' | 'error'; text: string }) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: '14px 16px',
        fontWeight: 700,
        lineHeight: 1.6,
        background: type === 'success' ? '#edfdf3' : '#fff1f2',
        color: type === 'success' ? '#157347' : '#c62828',
        border: type === 'success' ? '1px solid #cdebd5' : '1px solid #fecdd3'
      }}
    >
      {text}
    </div>
  );
}

const pageWrapStyle: CSSProperties = {
  width: '100%',
  maxWidth: 1200,
  margin: '0 auto',
  display: 'grid',
  gap: 20
};

const responsiveGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.25fr) minmax(320px, 0.85fr)',
  gap: 20,
  alignItems: 'start'
};

const leftColumnStyle: CSSProperties = {
  display: 'grid',
  gap: 20,
  minWidth: 0
};

const rightColumnStyle: CSSProperties = {
  display: 'grid',
  gap: 20,
  minWidth: 0
};

const heroStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #ffffff 0%, #f5f8ff 100%)',
  borderRadius: 28,
  padding: 28,
  boxShadow: '0 16px 40px rgba(49,86,211,0.08)',
  overflow: 'hidden'
};

const heroBadge: CSSProperties = {
  display: 'inline-block',
  padding: '8px 12px',
  borderRadius: 999,
  background: '#e8efff',
  color: '#3156d3',
  fontWeight: 700,
  fontSize: 13,
  marginBottom: 10
};

const heroTitleStyle: CSSProperties = {
  margin: '0 0 10px',
  fontSize: 34,
  lineHeight: 1.2,
  color: '#102a43'
};

const heroDescStyle: CSSProperties = {
  margin: 0,
  color: '#52606d',
  lineHeight: 1.8,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflowWrap: 'break-word'
};

const cardStyle: CSSProperties = {
  background: '#fff',
  borderRadius: 24,
  padding: 22,
  boxShadow: '0 14px 36px rgba(15,23,42,0.06)',
  overflow: 'hidden'
};

const sectionHeaderRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 16
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
  color: '#102a43'
};

const panelStyle: CSSProperties = {
  background: '#f8fbff',
  borderRadius: 18,
  padding: 16,
  border: '1px solid #dbeafe'
};

const panelTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
  color: '#243b53'
};

const stackStyle: CSSProperties = {
  display: 'grid',
  gap: 16
};

const stackSmallStyle: CSSProperties = {
  display: 'grid',
  gap: 10
};

const inputStyle: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  padding: '12px 14px',
  borderRadius: 14,
  border: '1px solid #d9e2ec',
  fontSize: 15,
  boxSizing: 'border-box'
};

const primaryButtonStyle: CSSProperties = {
  border: 'none',
  borderRadius: 16,
  padding: '12px 16px',
  background: 'linear-gradient(90deg, #3156d3, #6f4ef6)',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 10px 20px rgba(111,78,246,0.18)'
};

const metricListStyle: CSSProperties = {
  display: 'grid',
  gap: 10
};

const metricBadgeStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 14px',
  background: '#f8fbff',
  border: '1px solid #dbeafe',
  borderRadius: 14
};

const metricLabelStyle: CSSProperties = {
  color: '#486581',
  fontWeight: 700
};

const metricValueStyle: CSSProperties = {
  color: '#102a43',
  fontSize: 20,
  fontWeight: 800
};

const infoRowStyle: CSSProperties = {
  lineHeight: 1.7
};

const infoLabelStyle: CSSProperties = {
  color: '#243b53'
};

const infoValueStyle: CSSProperties = {
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflowWrap: 'break-word'
};

const listStyle: CSSProperties = {
  margin: '10px 0 0',
  paddingLeft: 20
};

const listItemStyle: CSSProperties = {
  marginBottom: 8,
  lineHeight: 1.7,
  wordBreak: 'break-word',
  overflowWrap: 'break-word'
};

const strongTitleStyle: CSSProperties = {
  color: '#243b53'
};

const paragraphStyle: CSSProperties = {
  marginTop: 10,
  lineHeight: 1.75,
  color: '#334e68',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word'
};

const emptyTextStyle: CSSProperties = {
  color: '#7b8794',
  lineHeight: 1.7
};
