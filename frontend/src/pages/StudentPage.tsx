import { CSSProperties, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import type { ProjectTask, SubmissionResponse } from '../types/index';

export function StudentPage() {
  const [interestType, setInterestType] = useState<'text' | 'image' | 'link'>('text');
  const [interestContent, setInterestContent] = useState('我喜欢原神跑图和地图探索');
  const [task, setTask] = useState<ProjectTask | null>(null);
  const [answer, setAnswer] = useState(
    '我选择了三条不同路线进行对比，记录每条路线的用时、坡度变化和体力损耗。最后发现绕开高坡区域虽然路径更长，但整体效率更高。'
  );
  const [submitResult, setSubmitResult] = useState<SubmissionResponse | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [loadingTask, setLoadingTask] = useState(false);
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [loadingHints, setLoadingHints] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadTask() {
    setLoadingTask(true);
    setError('');
    try {
      const result = await apiFetch<ProjectTask>('/student/getProject');
      setTask(result);
    } catch (err) {
      setTask(null);
      const message = err instanceof Error ? err.message : '获取任务失败';
      if (message !== '暂无任务') {
        setError(message);
      }
    } finally {
      setLoadingTask(false);
    }
  }

  useEffect(() => {
    loadTask();
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
      const result = await apiFetch<{ task: ProjectTask; message: string }>('/student/submitInterest', {
        method: 'POST',
        body: JSON.stringify({
          type: interestType,
          content: interestContent
        })
      });

      setTask(result.task);
      setHints([]);
      setSubmitResult(null);
      setSuccess('兴趣提交成功，新的探究任务已经生成。');
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

    if (!answer.trim()) {
      setError('请输入你的作答内容');
      return;
    }

    setError('');
    setSuccess('');
    setSubmittingAnswer(true);

    try {
      const result = await apiFetch<SubmissionResponse>('/student/submitAnswer', {
        method: 'POST',
        body: JSON.stringify({
          taskId: task.id,
          answer
        })
      });

      setSubmitResult(result);
      setSuccess('作业提交成功，你已经收到 AI 初步反馈。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交作业失败');
    } finally {
      setSubmittingAnswer(false);
    }
  }

  async function handleLoadHints() {
    if (!task) {
      setError('当前没有任务可查看提示');
      return;
    }

    setError('');
    setSuccess('');
    setLoadingHints(true);

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
      <section style={cardStyle}>
        <h2>学生端 V1 · 第一阶段</h2>
        <p>已打通：兴趣提交 → 任务生成 → 分层提示 → 作业提交 → AI反馈。</p>
      </section>

      <section style={cardStyle}>
        <h3>第 1 步：提交兴趣</h3>
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
            placeholder="例如：我喜欢原神跑图和地图探索"
          />

          <button onClick={handleSubmitInterest} disabled={submittingInterest} style={buttonStyle}>
            {submittingInterest ? '生成中...' : '生成探究任务'}
          </button>
        </div>
      </section>

      <section style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>第 2 步：查看任务</h3>
          <button onClick={loadTask} disabled={loadingTask} style={secondaryButtonStyle}>
            {loadingTask ? '刷新中...' : '刷新任务'}
          </button>
        </div>

        {task ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <div><strong>任务标题：</strong>{task.title}</div>
            <div><strong>对应学科：</strong>{task.subject}</div>
            <div><strong>任务描述：</strong>{task.description}</div>

            <div>
              <strong>探究问题：</strong>
              <ul>
                {task.questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={handleLoadHints} disabled={loadingHints} style={secondaryButtonStyle}>
                {loadingHints ? '加载提示中...' : '查看苏格拉底分层提示'}
              </button>
            </div>

            {hints.length > 0 && (
              <div style={hintBoxStyle}>
                <strong>分层提示：</strong>
                <ul>
                  {hints.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div>当前还没有任务，请先提交兴趣内容。</div>
        )}
      </section>

      <section style={cardStyle}>
        <h3>第 3 步：提交作业</h3>
        <textarea
          rows={8}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          style={textareaStyle}
          placeholder="请写下你的实验过程、数据记录和结论"
        />

        <div style={{ marginTop: 12 }}>
          <button onClick={handleSubmitAnswer} disabled={!task || submittingAnswer} style={buttonStyle}>
            {submittingAnswer ? '提交中...' : '提交作业'}
          </button>
        </div>

        {submitResult && (
          <div style={resultBoxStyle}>
            <div><strong>提交结果：</strong>{submitResult.message}</div>
            <div><strong>得分：</strong>{submitResult.submission.score}</div>
            <div><strong>反馈：</strong>{submitResult.submission.feedback}</div>
          </div>
        )}
      </section>

      {success && <div style={{ color: '#157347', fontWeight: 600 }}>{success}</div>}
      {error && <div style={{ color: 'crimson', fontWeight: 600 }}>{error}</div>}
    </div>
  );
}

const cardStyle: CSSProperties = {
  background: '#fff',
  borderRadius: 18,
  padding: 20,
  boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #d7dce5'
};

const textareaStyle: CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: 12,
  border: '1px solid #d7dce5',
  resize: 'vertical'
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

const hintBoxStyle: CSSProperties = {
  background: '#f8fbff',
  borderRadius: 12,
  padding: 16,
  border: '1px solid #d8e8ff'
};

const resultBoxStyle: CSSProperties = {
  marginTop: 16,
  background: '#f6fff8',
  borderRadius: 12,
  padding: 16,
  border: '1px solid #cdebd5',
  display: 'grid',
  gap: 8
};

const labelStyle: CSSProperties = {
  fontWeight: 600
};
