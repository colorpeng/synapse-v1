import { CSSProperties, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import type { ProjectTask, SubmissionResponse } from '../types';

export function StudentPage() {
  const [interestType, setInterestType] = useState<'text' | 'image' | 'link'>('text');
  const [interestContent, setInterestContent] = useState('我喜欢原神跑图和地图探索');
  const [task, setTask] = useState<ProjectTask | null>(null);
  const [answer, setAnswer] = useState('我选择了三条不同路线进行对比，记录每条路线的用时、坡度变化和体力损耗。最后发现绕开高坡区域虽然路径更长，但整体效率更高。');
  const [submitResult, setSubmitResult] = useState<SubmissionResponse | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [error, setError] = useState('');

  async function loadTask() {
    try {
      const result = await apiFetch<ProjectTask>('/student/getProject');
      setTask(result);
    } catch {
      setTask(null);
    }
  }

  useEffect(() => {
    loadTask();
  }, []);

  async function handleSubmitInterest() {
    setError('');
    try {
      const result = await apiFetch<{ task: ProjectTask }>('/student/submitInterest', {
        method: 'POST',
        body: JSON.stringify({ type: interestType, content: interestContent })
      });
      setTask(result.task);
      setSubmitResult(null);
      setHints([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交兴趣失败');
    }
  }

  async function handleSubmitAnswer() {
    if (!task) return;
    setError('');
    try {
      const result = await apiFetch<SubmissionResponse>('/student/submitAnswer', {
        method: 'POST',
        body: JSON.stringify({ taskId: task.id, answer })
      });
      setSubmitResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交作业失败');
    }
  }

  async function handleLoadHints() {
    if (!task) return;
    setError('');
    try {
      const result = await apiFetch<{ hints: string[] }>(`/student/getFeedback?taskId=${task.id}`);
      setHints(result.hints);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取提示失败');
    }
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={cardStyle}>
        <h2>学生端 V1</h2>
        <p>这里是“兴趣折射器 + 项目任务 + 作业提交”的完整首版流程。</p>
      </section>

      <section style={cardStyle}>
        <h3>第 1 步：提交兴趣</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <select value={interestType} onChange={(e) => setInterestType(e.target.value as 'text' | 'image' | 'link')}>
            <option value="text">文本</option>
            <option value="image">图片 URL</option>
            <option value="link">视频/网页链接</option>
          </select>
          <textarea rows={4} value={interestContent} onChange={(e) => setInterestContent(e.target.value)} />
          <button onClick={handleSubmitInterest}>生成探究任务</button>
        </div>
      </section>

      <section style={cardStyle}>
        <h3>第 2 步：查看任务</h3>
        {task ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <div><strong>标题：</strong>{task.title}</div>
            <div><strong>学科：</strong>{task.subject}</div>
            <div><strong>描述：</strong>{task.description}</div>
            <div>
              <strong>探究问题：</strong>
              <ul>
                {task.questions.map((q) => <li key={q}>{q}</li>)}
              </ul>
            </div>
            <button onClick={handleLoadHints}>查看苏格拉底分层提示</button>
            {hints.length > 0 && (
              <ul>
                {hints.map((hint) => <li key={hint}>{hint}</li>)}
              </ul>
            )}
          </div>
        ) : (
          <div>暂无任务，请先提交兴趣。</div>
        )}
      </section>

      <section style={cardStyle}>
        <h3>第 3 步：提交作业</h3>
        <textarea rows={8} value={answer} onChange={(e) => setAnswer(e.target.value)} style={{ width: '100%' }} />
        <div style={{ marginTop: 12 }}>
          <button onClick={handleSubmitAnswer} disabled={!task}>提交作业</button>
        </div>

        {submitResult && (
          <div style={{ marginTop: 16, background: '#f8fbff', padding: 16, borderRadius: 12 }}>
            <div><strong>得分：</strong>{submitResult.submission.score}</div>
            <div><strong>反馈：</strong>{submitResult.submission.feedback}</div>
          </div>
        )}
      </section>

      {error && <div style={{ color: 'crimson' }}>{error}</div>}
    </div>
  );
}

const cardStyle: CSSProperties = {
  background: '#fff',
  borderRadius: 18,
  padding: 20,
  boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
};
