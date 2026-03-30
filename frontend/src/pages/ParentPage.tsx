import { CSSProperties, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import type { Child, RadarData } from '../types/index';

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
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [loadingRadar, setLoadingRadar] = useState(false);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadChildren() {
    setLoadingChildren(true);
    setError('');
    try {
      const res = await apiFetch<{ children: Child[] }>('/parent/getChildren');
      setChildren(res.children);

      if (res.children.length > 0) {
        setSelectedStudentId((prev) => prev || res.children[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取孩子失败');
    } finally {
      setLoadingChildren(false);
    }
  }

  async function loadRadar(studentId: string) {
    if (!studentId) return;
    setLoadingRadar(true);
    try {
      const res = await apiFetch<RadarData>(`/parent/getRadar?studentId=${studentId}`);
      setRadar(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取雷达图失败');
    } finally {
      setLoadingRadar(false);
    }
  }

  async function loadOverview(studentId: string) {
    if (!studentId) return;
    setLoadingOverview(true);
    try {
      const res = await apiFetch<OverviewResponse>(`/parent/getOverview?studentId=${studentId}`);
      setOverview(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取成长看板失败');
    } finally {
      setLoadingOverview(false);
    }
  }

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (!selectedStudentId) return;
    setError('');
    setSuccess('');
    loadRadar(selectedStudentId);
    loadOverview(selectedStudentId);
  }, [selectedStudentId]);

  async function handleDownloadReport() {
    if (!selectedStudentId) {
      setError('请先选择孩子');
      return;
    }

    setDownloading(true);
    setError('');
    setSuccess('');

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
      setError(err instanceof Error ? err.message : '下载报告失败');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={cardStyle}>
        <h2>家长端 V1 · 第一阶段</h2>
        <p>已打通：孩子列表 → 成长看板 → 能力雷达 → 成果报告导出。</p>
      </section>

      <section style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h3>第 1 步：选择孩子</h3>
          <button onClick={loadChildren} disabled={loadingChildren} style={secondaryButtonStyle}>
            {loadingChildren ? '刷新中...' : '刷新孩子列表'}
          </button>
        </div>

        {children.length > 0 ? (
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            style={inputStyle}
          >
            {children.map((child) => (
              <option value={child.id} key={child.id}>
                {child.name}（{child.email}）
              </option>
            ))}
          </select>
        ) : (
          <div>当前没有绑定学生。</div>
        )}
      </section>

      <section style={cardStyle}>
        <h3>第 2 步：查看成长看板</h3>

        {loadingOverview ? (
          <div>加载中...</div>
        ) : overview ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <strong>学生姓名：</strong>{overview.student.name}
            </div>
            <div>
              <strong>学生邮箱：</strong>{overview.student.email}
            </div>

            <div style={innerPanelStyle}>
              <h4 style={{ marginTop: 0 }}>最近任务</h4>
              {overview.latestTask ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>标题：</strong>{overview.latestTask.title}</div>
                  <div><strong>学科：</strong>{overview.latestTask.subject}</div>
                  <div><strong>描述：</strong>{overview.latestTask.description}</div>
                  <div>
                    <strong>探究问题：</strong>
                    <ul>
                      {overview.latestTask.questions.map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div>暂无任务记录</div>
              )}
            </div>

            <div style={innerPanelStyle}>
              <h4 style={{ marginTop: 0 }}>最近一次作答</h4>
              {overview.latestSubmission ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>得分：</strong>{overview.latestSubmission.score}</div>
                  <div><strong>学生作答：</strong>{overview.latestSubmission.answer}</div>
                  <div><strong>AI反馈：</strong>{overview.latestSubmission.feedback}</div>
                </div>
              ) : (
                <div>暂无作答记录</div>
              )}
            </div>
          </div>
        ) : (
          <div>请选择孩子后查看成长看板。</div>
        )}
      </section>

      <section style={cardStyle}>
        <h3>第 3 步：查看能力雷达</h3>

        {loadingRadar ? (
          <div>雷达图加载中...</div>
        ) : radar ? (
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

      <section style={cardStyle}>
        <h3>第 4 步：导出成果报告</h3>
        <button onClick={handleDownloadReport} disabled={!selectedStudentId || downloading} style={buttonStyle}>
          {downloading ? '下载中...' : '下载学习成果报告'}
        </button>
      </section>

      {success && <div style={{ color: '#157347', fontWeight: 600 }}>{success}</div>}
      {error && <div style={{ color: 'crimson', fontWeight: 600 }}>{error}</div>}
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
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #4f7cff, #7c3aed)'
          }}
        />
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

const innerPanelStyle: CSSProperties = {
  background: '#f8fbff',
  borderRadius: 14,
  padding: 16,
  border: '1px solid #dbeafe'
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #d7dce5'
};

const buttonStyle: CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  padding: '10px 16px',
  cursor: 'pointer'
};

const secondaryButtonStyle: CSSProperties = {
  background: '#eef4ff',
  color: '#1d4ed8',
  border: '1px solid #c9dafc',
  borderRadius: 12,
  padding: '10px 16px',
  cursor: 'pointer'
};
