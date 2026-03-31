import { CSSProperties, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import type { LearningPath, ProjectTask, StudentProfile, SubmissionResponse } from '../types';

export function StudentPage() {
  const [interestType, setInterestType] = useState<'text' | 'image' | 'link'>('text');
  const [interestContent, setInterestContent] = useState('我喜欢原神跑图和地图探索');
  const [task, setTask] = useState<ProjectTask | null>(null);
  const [answer, setAnswer] = useState('我选择了三条不同路线进行对比，记录每条路线的用时、坡度变化和体力损耗。最后发现绕开高坡区域虽然路径更长，但整体效率更高。');
  const [submitResult, setSubmitResult] = useState<SubmissionResponse | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [loadingTask, setLoadingTask] = useState(false);
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [loadingHints, setLoadingHints] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadTask() {
    setLoadingTask(true);
    try {
      const result = await apiFetch<ProjectTask>('/student/getProject');
      setTask(result);
    } catch {
      setTask(null);
    } finally {
      setLoadingTask(false);
    }
  }

  async function loadProfile() {
    try {
      const result = await apiFetch<StudentProfile>('/student/getProfile');
      setProfile(result);
    } catch {}
  }

  async function loadPath() {
    try {
      const result = await apiFetch<LearningPath>('/student/getPath');
      setPath(result);
    } catch {}
  }

  useEffect(() => {
    loadTask();
    loadProfile();
    loadPath();
  }, []);

  async function handleSubmitInterest() {
    setError('');
    setSuccess('');

    if (!interestContent.trim()) {
      setError('请输入你的兴趣内容');
      return;
    }

    setSubmittingInterest(true);
    try {
      const result = await apiFetch<{ task: ProjectTask }>('/student/submitInterest', {
        method: 'POST',
        body: JSON.stringify({
          type: interestType,
          content: interestContent
        })
      });

      setTask(result.task);
      setHints([]);
      setSubmitResult(null);
      setSuccess('新的个性化探究任务已生成。');
      await loadProfile();
      await loadPath();
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交兴趣失败');
    } finally {
      setSubmittingInterest(false);
    }
  }

  async function handleSubmitAnswer() {
    if (!task) {
      setError('请先生成任务');
      return;
    }

    setSubmittingAnswer(true);
    setError('');
    setSuccess('');

    try {
      const result = await apiFetch<SubmissionResponse>('/student/submitAnswer', {
        method: 'POST',
        body: JSON.stringify({
          taskId: task.id,
          answer
        })
      });

      setSubmitResult(result);
      setSuccess('作业提交成功，你已获得 AI 反馈。');
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交作业失败');
    } finally {
      setSubmittingAnswer(false);
    }
  }

  async function handleLoadHints() {
    if (!task) return;

    setLoadingHints(true);
    setError('');
    try {
      const result = await apiFetch<{ hints: string[] }>(`/student/getFeedback?taskId=${task.id}`);
      setHints(result.hints);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取提示失败');
    } finally {
      setLoadingHints(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={heroStyle}>
        <div>
          <div style={heroBadge}>学生端工作台</div>
          <h2 style={{ margin: '10px 0', fontSize: 34 }}>兴趣驱动的连续学习系统</h2>
          <p style={{ margin: 0, color: '#52606d', lineHeight: 1.8 }}>
            从兴趣切入，生成探究任务，形成作答反馈，并持续沉淀学习画像与成长路径。
          </p>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr', gap: 20 }}>
        <div style={{ display: 'grid', gap: 20 }}>
          <section style={cardStyle}>
            <h3 style={sectionTitleStyle}>第 1 步：提交兴趣</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={labelStyle}>兴趣类型</label>
              <select
                value={interestType}
                onChange={(e) => setInterestType(e.target.value as 'text' | 'image' | 'link')}
                style={inputStyle}
              >
                <option value="text">文本</option>
                <option value="image">图片 URL</option>
                <option value="link">视频/网页链接</option>
              </select>

              <label style={labelStyle}>兴趣内容</label>
              <textarea
                rows={4}
                value={interestContent}
                onChange={(e) => setInterestContent(e.target.value)}
                style={textareaStyle}
              />

              <button onClick={handleSubmitInterest} disabled={submittingInterest} style={primaryButtonStyle}>
                {submittingInterest ? '生成中...' : '生成个性化探究任务'}
              </button>
            </div>
          </section>

          <section style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={sectionTitleStyle}>第 2 步：查看任务</h3>
              <button onClick={loadTask} disabled={loadingTask} style={ghostButtonStyle}>
                {loadingTask ? '刷新中...' : '刷新任务'}
              </button>
            </div>

            {task ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <InfoRow label="任务标题" value={task.title} />
                <InfoRow label="对应学科" value={task.subject} />
                <InfoRow label="任务描述" value={task.description} />

                <div>
                  <strong>探究问题</strong>
                  <ul>
                    {task.questions.map((q) => <li key={q}>{q}</li>)}
                  </ul>
                </div>

                <button onClick={handleLoadHints} disabled={loadingHints} style={ghostButtonStyle}>
                  {loadingHints ? '加载中...' : '查看苏格拉底分层提示'}
                </button>

                {hints.length > 0 && (
                  <div style={softBoxStyle}>
                    <strong>提示：</strong>
                    <ul>
                      {hints.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#7b8794' }}>当前还没有任务，请先提交兴趣内容。</div>
            )}
          </section>

          <section style={cardStyle}>
            <h3 style={sectionTitleStyle}>第 3 步：提交作业</h3>
            <textarea
              rows={8}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              style={textareaStyle}
            />

            <div style={{ marginTop: 12 }}>
              <button onClick={handleSubmitAnswer} disabled={!task || submittingAnswer} style={primaryButtonStyle}>
                {submittingAnswer ? '提交中...' : '提交作业'}
              </button>
            </div>

            {submitResult && (
              <div style={resultBoxStyle}>
                <InfoRow label="得分" value={String(submitResult.submission.score)} />
                <InfoRow label="AI反馈" value={submitResult.submission.feedback} />
              </div>
            )}
          </section>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          <section style={cardStyle}>
            <h3 style={sectionTitleStyle}>学习画像</h3>
            {profile ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <TagGroup title="标签" items={profile.tags} />
                <TagGroup title="优势" items={profile.strengths} />
                <TagGroup title="下一步聚焦" items={profile.nextFocus} />
              </div>
            ) : (
              <div style={{ color: '#7b8794' }}>暂无画像数据</div>
            )}
          </section>

          <section style={cardStyle}>
            <h3 style={sectionTitleStyle}>连续学习路径</h3>
            {path ? (
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ fontWeight: 700, color: '#243b53' }}>{path.title}</div>
                {path.steps.map((step, index) => (
                  <div key={step} style={stepStyle}>
                    <div style={stepIndexStyle}>{index + 1}</div>
                    <div>{step}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#7b8794' }}>暂无成长路径</div>
            )}
          </section>
        </div>
      </div>

      {success && <div style={{ color: '#157347', fontWeight: 700 }}>{success}</div>}
      {error && <div style={{ color: '#c62828', fontWeight: 700 }}>{error}</div>}
    </div>
  );
}

function TagGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {items.map((item) => (
          <span key={item} style={tagStyle}>{item}</span>
        ))}
      </div>
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

const sectionTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 16,
  fontSize: 24,
  color: '#102a43'
};

const labelStyle: CSSProperties = {
  fontWeight: 700,
  color: '#243b53'
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 14,
  border: '1px solid #d9e2ec',
  fontSize: 15
};

const textareaStyle: CSSProperties = {
  width: '100%',
  padding: '14px',
  borderRadius: 16,
  border: '1px solid #d9e2ec',
  resize: 'vertical',
  fontSize: 15
};

const primaryButtonStyle: CSSProperties = {
  border: 'none',
  borderRadius: 16,
  padding: '14px 18px',
  background: 'linear-gradient(90deg, #3156d3, #6f4ef6)',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer'
};

const ghostButtonStyle: CSSProperties = {
  border: '1px solid #c7d2fe',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#eef4ff',
  color: '#3156d3',
  fontWeight: 700,
  cursor: 'pointer'
};

const softBoxStyle: CSSProperties = {
  background: '#f8fbff',
  borderRadius: 16,
  padding: 16,
  border: '1px solid #dbeafe'
};

const resultBoxStyle: CSSProperties = {
  marginTop: 14,
  background: '#f6fff8',
  borderRadius: 16,
  padding: 16,
  border: '1px solid #cdebd5',
  display: 'grid',
  gap: 8
};

const tagStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 999,
  background: '#eef4ff',
  color: '#3156d3',
  fontWeight: 700,
  fontSize: 13
};

const stepStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '32px 1fr',
  gap: 12,
  alignItems: 'center',
  background: '#f8fbff',
  borderRadius: 16,
  padding: 12,
  border: '1px solid #dbeafe'
};

const stepIndexStyle: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 999,
  background: 'linear-gradient(90deg, #3156d3, #6f4ef6)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800
};
