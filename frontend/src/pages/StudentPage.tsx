import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../api/client';
import type {
  LearningPath,
  ProjectTask,
  StructuredAnswer,
  StudentProfile,
  SubmissionResponse
} from '../types';

type DifficultyKey = 'easy' | 'medium' | 'hard';
type VoiceField = 'interest' | keyof StructuredAnswer;

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    SpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export function StudentPage() {
  const [interestType, setInterestType] = useState<'text' | 'image' | 'link'>('text');
  const [interestContent, setInterestContent] = useState('我喜欢原神跑图和地图探索');
  const [task, setTask] = useState<ProjectTask | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyKey>('easy');
  const [answerMode, setAnswerMode] = useState<'simple' | 'structured'>('structured');
  const [simpleAnswer, setSimpleAnswer] = useState(
    '我观察到不同路线在地形和时间上差别很大。我比较了三条路线后发现，虽然有些路更长，但因为障碍更少，所以整体更快。'
  );
  const [structuredAnswer, setStructuredAnswer] = useState<StructuredAnswer>({
    observation: '',
    comparison: '',
    pattern: '',
    conclusion: ''
  });
  const [submitResult, setSubmitResult] = useState<SubmissionResponse | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [loadingTask, setLoadingTask] = useState(false);
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [loadingHints, setLoadingHints] = useState(false);
  const [recordingField, setRecordingField] = useState<VoiceField | ''>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const currentQuestions = useMemo(() => {
    if (!task?.difficultyLevels) return task?.questions || [];
    return task.difficultyLevels[difficulty] || [];
  }, [task, difficulty]);

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

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  function updateStructuredField(field: keyof StructuredAnswer, value: string) {
    setStructuredAnswer((prev) => ({ ...prev, [field]: value }));
  }

  function isSpeechSupported() {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  function startVoiceInput(field: VoiceField) {
    if (!isSpeechSupported()) {
      setError('当前浏览器不支持语音识别，请使用 Chrome 或 Edge。');
      return;
    }

    setError('');

    if (recordingField) {
      recognitionRef.current?.stop();
      setRecordingField('');
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || '')
        .join('');

      if (field === 'interest') {
        setInterestContent((prev) => (prev ? `${prev}${transcript}` : transcript));
      } else {
        setStructuredAnswer((prev) => ({
          ...prev,
          [field]: prev[field] ? `${prev[field]}${transcript}` : transcript
        }));
      }
    };

    recognition.onerror = () => {
      setError('语音识别失败，请重试。');
      setRecordingField('');
    };

    recognition.onend = () => {
      setRecordingField('');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecordingField(field);
  }

  function stopVoiceInput() {
    recognitionRef.current?.stop();
    setRecordingField('');
  }

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
      setDifficulty('easy');
      setHints([]);
      setSubmitResult(null);
      setStructuredAnswer({
        observation: '',
        comparison: '',
        pattern: '',
        conclusion: ''
      });
      setSimpleAnswer('');
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
      const payload = answerMode === 'simple' ? simpleAnswer : structuredAnswer;

      const result = await apiFetch<SubmissionResponse>('/student/submitAnswer', {
        method: 'POST',
        body: JSON.stringify({
          taskId: task.id,
          answer: payload
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
    <div style={pageWrapStyle}>
      <section style={heroStyle}>
        <div style={heroInnerStyle}>
          <div style={heroBadge}>学生端 V2</div>
          <h2 style={heroTitleStyle}>兴趣 × 难度分层 × 连续成长</h2>
          <p style={heroDescStyle}>
            从兴趣出发，生成更适合学生理解的任务；通过分步作答、语音输入、连续反馈，让学习过程更轻松也更有成就感。
          </p>
        </div>
      </section>

      <div style={responsiveGridStyle}>
        <div style={leftColumnStyle}>
          <section style={cardStyle}>
            <h3 style={sectionTitleStyle}>第 1 步：提交兴趣</h3>

            <div style={formGroupStyle}>
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
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>兴趣内容</label>
              <AutoResizeTextarea
                minRows={4}
                value={interestContent}
                onChange={setInterestContent}
                placeholder="比如：我喜欢英雄联盟的亚索、我喜欢黑洞、我喜欢悬疑小说……"
              />
            </div>

            <div style={buttonRowStyle}>
              {!recordingField || recordingField !== 'interest' ? (
                <button onClick={() => startVoiceInput('interest')} style={ghostButtonStyle}>
                  🎤 语音输入兴趣
                </button>
              ) : (
                <button onClick={stopVoiceInput} style={dangerButtonStyle}>
                  ⏹ 停止录音
                </button>
              )}

              <button onClick={handleSubmitInterest} disabled={submittingInterest} style={primaryButtonStyle}>
                {submittingInterest ? '生成中...' : '生成个性化探究任务'}
              </button>
            </div>
          </section>

          <section style={cardStyle}>
            <div style={sectionHeaderRowStyle}>
              <h3 style={sectionTitleStyle}>第 2 步：查看任务</h3>
              <button onClick={loadTask} disabled={loadingTask} style={ghostButtonStyle}>
                {loadingTask ? '刷新中...' : '刷新任务'}
              </button>
            </div>

            {task ? (
              <div style={stackStyle}>
                <InfoRow label="任务标题" value={task.title} />
                <InfoRow label="对应学科" value={task.subject} />
                <InfoRow label="任务描述" value={task.description} />

                <div>
                  <strong style={strongTitleStyle}>选择难度</strong>
                  <div style={difficultyRowStyle}>
                    <button onClick={() => setDifficulty('easy')} style={difficultyButtonStyle(difficulty === 'easy')}>
                      初级探索
                    </button>
                    <button onClick={() => setDifficulty('medium')} style={difficultyButtonStyle(difficulty === 'medium')}>
                      进阶分析
                    </button>
                    <button onClick={() => setDifficulty('hard')} style={difficultyButtonStyle(difficulty === 'hard')}>
                      挑战模式
                    </button>
                  </div>
                </div>

                <div style={softBoxStyle}>
                  <strong style={strongTitleStyle}>当前难度问题</strong>
                  <ul style={listStyle}>
                    {currentQuestions.map((q) => (
                      <li key={q} style={listItemStyle}>{q}</li>
                    ))}
                  </ul>
                </div>

                <button onClick={handleLoadHints} disabled={loadingHints} style={ghostButtonStyle}>
                  {loadingHints ? '加载中...' : '查看苏格拉底分层提示'}
                </button>

                {hints.length > 0 && (
                  <div style={softBoxStyle}>
                    <strong style={strongTitleStyle}>提示</strong>
                    <ul style={listStyle}>
                      {hints.map((item) => (
                        <li key={item} style={listItemStyle}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div style={emptyTextStyle}>当前还没有任务，请先提交兴趣内容。</div>
            )}
          </section>

          <section style={cardStyle}>
            <div style={sectionHeaderRowStyle}>
              <h3 style={sectionTitleStyle}>第 3 步：提交作答</h3>
              <div style={toggleRowStyle}>
                <button onClick={() => setAnswerMode('structured')} style={answerModeButtonStyle(answerMode === 'structured')}>
                  分步作答
                </button>
                <button onClick={() => setAnswerMode('simple')} style={answerModeButtonStyle(answerMode === 'simple')}>
                  简单作答
                </button>
              </div>
            </div>

            {answerMode === 'structured' ? (
              <div style={stackStyle}>
                <AnswerField
                  title="1. 我观察到了什么"
                  placeholder="先写你看到的现象、场景或最直观的感受。"
                  value={structuredAnswer.observation}
                  onChange={(value) => updateStructuredField('observation', value)}
                  onVoice={() => startVoiceInput('observation')}
                  onStop={stopVoiceInput}
                  recording={recordingField === 'observation'}
                />
                <AnswerField
                  title="2. 我做了什么比较"
                  placeholder="写你比较了哪些例子、路线、角色、情节或数据。"
                  value={structuredAnswer.comparison}
                  onChange={(value) => updateStructuredField('comparison', value)}
                  onVoice={() => startVoiceInput('comparison')}
                  onStop={stopVoiceInput}
                  recording={recordingField === 'comparison'}
                />
                <AnswerField
                  title="3. 我发现了什么规律"
                  placeholder="写出你从比较中发现的共同点或差别。"
                  value={structuredAnswer.pattern}
                  onChange={(value) => updateStructuredField('pattern', value)}
                  onVoice={() => startVoiceInput('pattern')}
                  onStop={stopVoiceInput}
                  recording={recordingField === 'pattern'}
                />
                <AnswerField
                  title="4. 我的最终结论"
                  placeholder="最后回答：我最终发现了什么？这个发现能说明什么？"
                  value={structuredAnswer.conclusion}
                  onChange={(value) => updateStructuredField('conclusion', value)}
                  onVoice={() => startVoiceInput('conclusion')}
                  onStop={stopVoiceInput}
                  recording={recordingField === 'conclusion'}
                />
              </div>
            ) : (
              <AutoResizeTextarea
                minRows={8}
                value={simpleAnswer}
                onChange={setSimpleAnswer}
                placeholder="用自己的话把想法完整写出来。"
              />
            )}

            <div style={{ marginTop: 16 }}>
              <button onClick={handleSubmitAnswer} disabled={!task || submittingAnswer} style={primaryButtonStyle}>
                {submittingAnswer ? '提交中...' : '提交作业'}
              </button>
            </div>

            {submitResult && (
              <div style={resultBoxStyle}>
                <InfoRow label="得分" value={String(submitResult.submission.score)} />
                <InfoRow label="总体反馈" value={submitResult.submission.feedback} />

                {submitResult.submission.highlights?.length ? (
                  <div>
                    <strong style={strongTitleStyle}>你的亮点</strong>
                    <ul style={listStyle}>
                      {submitResult.submission.highlights.map((item) => (
                        <li key={item} style={listItemStyle}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {submitResult.submission.nextActions?.length ? (
                  <div>
                    <strong style={strongTitleStyle}>下一步建议</strong>
                    <ul style={listStyle}>
                      {submitResult.submission.nextActions.map((item) => (
                        <li key={item} style={listItemStyle}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>

        <div style={rightColumnStyle}>
          <section style={cardStyle}>
            <h3 style={sectionTitleStyle}>学习画像</h3>
            {profile ? (
              <div style={stackStyle}>
                <TagGroup title="标签" items={profile.tags} />
                <TagGroup title="优势" items={profile.strengths} />
                <TagGroup title="下一步聚焦" items={profile.nextFocus} />
              </div>
            ) : (
              <div style={emptyTextStyle}>暂无画像数据</div>
            )}
          </section>

          <section style={cardStyle}>
            <h3 style={sectionTitleStyle}>连续学习路径</h3>
            {path ? (
              <div style={stackStyle}>
                <div style={pathTitleStyle}>{path.title}</div>
                {path.steps.map((step, index) => (
                  <div key={step} style={stepStyle}>
                    <div style={stepIndexStyle}>{index + 1}</div>
                    <div style={stepTextStyle}>{step}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={emptyTextStyle}>暂无成长路径</div>
            )}
          </section>
        </div>
      </div>

      {success && <StatusBanner type="success" text={success} />}
      {error && <StatusBanner type="error" text={error} />}
    </div>
  );
}

function AutoResizeTextarea(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  }, [props.value]);

  return (
    <textarea
      ref={ref}
      rows={props.minRows || 4}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      style={textareaStyle}
    />
  );
}

function AnswerField(props: {
  title: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onVoice: () => void;
  onStop: () => void;
  recording: boolean;
}) {
  return (
    <div style={softBoxStyle}>
      <div style={fieldHeaderStyle}>
        <strong style={strongTitleStyle}>{props.title}</strong>
        {!props.recording ? (
          <button onClick={props.onVoice} style={ghostButtonStyle}>🎤 语音输入</button>
        ) : (
          <button onClick={props.onStop} style={dangerButtonStyle}>⏹ 停止录音</button>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <AutoResizeTextarea
          minRows={4}
          value={props.value}
          onChange={props.onChange}
          placeholder={props.placeholder}
        />
      </div>
    </div>
  );
}

function TagGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div style={tagGroupTitleStyle}>{title}</div>
      <div style={tagWrapStyle}>
        {items.map((item) => (
          <span key={item} style={tagStyle}>{item}</span>
        ))}
      </div>
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
  gridTemplateColumns: 'minmax(0, 1.45fr) minmax(280px, 0.9fr)',
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
  background: 'linear-gradient(135deg, #ffffff 0%, #f4f7ff 55%, #eef2ff 100%)',
  borderRadius: 28,
  padding: 28,
  boxShadow: '0 16px 40px rgba(49,86,211,0.08)',
  width: '100%',
  minWidth: 0,
  overflow: 'hidden'
};

const heroInnerStyle: CSSProperties = {
  maxWidth: 760
};

const heroBadge: CSSProperties = {
  display: 'inline-block',
  padding: '8px 12px',
  borderRadius: 999,
  background: '#e8efff',
  color: '#3156d3',
  fontWeight: 700,
  fontSize: 13
};

const heroTitleStyle: CSSProperties = {
  margin: '12px 0 10px',
  fontSize: 34,
  lineHeight: 1.2,
  color: '#102a43',
  wordBreak: 'break-word'
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
  width: '100%',
  minWidth: 0,
  overflow: 'hidden',
  boxSizing: 'border-box'
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
  color: '#102a43',
  lineHeight: 1.25,
  wordBreak: 'break-word'
};

const sectionHeaderRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 16
};

const formGroupStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  marginBottom: 14
};

const labelStyle: CSSProperties = {
  fontWeight: 700,
  color: '#243b53',
  fontSize: 15
};

const inputStyle: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  padding: '12px 14px',
  borderRadius: 14,
  border: '1px solid #d9e2ec',
  fontSize: 15,
  boxSizing: 'border-box',
  minWidth: 0,
  background: '#fff'
};

const textareaStyle: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  padding: '14px',
  borderRadius: 16,
  border: '1px solid #d9e2ec',
  resize: 'none',
  fontSize: 15,
  lineHeight: 1.75,
  boxSizing: 'border-box',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  overflow: 'hidden',
  display: 'block',
  background: '#fff'
};

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'center'
};

const toggleRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap'
};

const difficultyRowStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  marginTop: 10,
  flexWrap: 'wrap'
};

const stackStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
  minWidth: 0
};

const fieldHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap'
};

const primaryButtonStyle: CSSProperties = {
  border: 'none',
  borderRadius: 16,
  padding: '14px 18px',
  background: 'linear-gradient(90deg, #3156d3, #6f4ef6)',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
  minWidth: 180,
  boxShadow: '0 10px 20px rgba(111,78,246,0.18)'
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

const dangerButtonStyle: CSSProperties = {
  border: 'none',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#fee2e2',
  color: '#b91c1c',
  fontWeight: 700,
  cursor: 'pointer'
};

const softBoxStyle: CSSProperties = {
  background: '#f8fbff',
  borderRadius: 18,
  padding: 16,
  border: '1px solid #dbeafe',
  width: '100%',
  minWidth: 0,
  overflow: 'hidden',
  boxSizing: 'border-box'
};

const resultBoxStyle: CSSProperties = {
  marginTop: 16,
  background: '#f6fff8',
  borderRadius: 16,
  padding: 16,
  border: '1px solid #cdebd5',
  display: 'grid',
  gap: 12,
  width: '100%',
  minWidth: 0,
  overflow: 'hidden',
  boxSizing: 'border-box'
};

const tagWrapStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap'
};

const tagGroupTitleStyle: CSSProperties = {
  fontWeight: 700,
  marginBottom: 8,
  color: '#243b53'
};

const tagStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 999,
  background: '#eef4ff',
  color: '#3156d3',
  fontWeight: 700,
  fontSize: 13,
  wordBreak: 'break-word'
};

const pathTitleStyle: CSSProperties = {
  fontWeight: 700,
  color: '#243b53',
  wordBreak: 'break-word'
};

const stepStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '32px minmax(0, 1fr)',
  gap: 12,
  alignItems: 'start',
  background: '#f8fbff',
  borderRadius: 16,
  padding: 12,
  border: '1px solid #dbeafe',
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box'
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
  fontWeight: 800,
  flexShrink: 0
};

const stepTextStyle: CSSProperties = {
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  minWidth: 0,
  lineHeight: 1.7
};

const difficultyButtonStyle = (active: boolean): CSSProperties => ({
  border: 'none',
  borderRadius: 14,
  padding: '10px 14px',
  background: active ? 'linear-gradient(90deg, #3156d3, #6f4ef6)' : '#eef4ff',
  color: active ? '#fff' : '#3156d3',
  fontWeight: 800,
  cursor: 'pointer'
});

const answerModeButtonStyle = (active: boolean): CSSProperties => ({
  border: 'none',
  borderRadius: 12,
  padding: '8px 12px',
  background: active ? '#102a43' : '#eef2f7',
  color: active ? '#fff' : '#486581',
  fontWeight: 700,
  cursor: 'pointer'
});

const infoRowStyle: CSSProperties = {
  width: '100%',
  minWidth: 0,
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

const emptyTextStyle: CSSProperties = {
  color: '#7b8794',
  lineHeight: 1.7
};
