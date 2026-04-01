import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../api/client';
import type {
  LearningPath,
  ProjectTask,
  StructuredAnswer,
  StudentProfile,
  SubmissionResponse,
  VisualStep
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

const difficultyMeta: Record<
  DifficultyKey,
  { icon: string; title: string; desc: string }
> = {
  easy: {
    icon: '🌱',
    title: '初级探索',
    desc: '先看现象、说感受、找例子'
  },
  medium: {
    icon: '🔍',
    title: '进阶分析',
    desc: '开始比较、记录、归纳'
  },
  hard: {
    icon: '🚀',
    title: '挑战模式',
    desc: '提出解释、优化和更深分析'
  }
};

const defaultVisualSteps: VisualStep[] = [
  { key: 'observe', title: '先观察', shortText: '看一看你最熟悉的现象或场景。', icon: '👀' },
  { key: 'compare', title: '做比较', shortText: '把两个或三个例子放在一起比较。', icon: '⚖️' },
  { key: 'pattern', title: '找规律', shortText: '从比较结果里找共同点和变化。', icon: '🧠' },
  { key: 'conclusion', title: '下结论', shortText: '说出你最终发现了什么。', icon: '✅' }
];

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

  const visualSteps = task?.visualSteps?.length ? task.visualSteps : defaultVisualSteps;

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
      setSuccess('新的个性化图文探究任务已生成。');
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
      <section style={heroStyle} className="synapse-card">
        <div style={heroInnerStyle}>
          <div style={heroBadge}>学生端 V3 · 图文引导版</div>
          <h2 style={heroTitleStyle}>不只读题，而是看着图一步一步做出来</h2>
          <p style={heroDescStyle}>
            任务会自动生成视觉引导图，你可以先看图理解任务，再根据图标步骤完成观察、比较、规律和结论。
          </p>
        </div>
      </section>

      <div style={responsiveGridStyle} className="synapse-responsive-grid">
        <div style={leftColumnStyle}>
          <section style={cardStyle} className="synapse-card">
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
                <button onClick={() => startVoiceInput('interest')} style={ghostButtonStyle} className="synapse-secondary-btn">
                  🎤 语音输入兴趣
                </button>
              ) : (
                <button onClick={stopVoiceInput} style={dangerButtonStyle} className="synapse-danger-btn">
                  ⏹ 停止录音
                </button>
              )}

              <button
                onClick={handleSubmitInterest}
                disabled={submittingInterest}
                style={primaryButtonStyle}
                className="synapse-primary-btn"
              >
                {submittingInterest ? '生成中...' : '生成图文探究任务'}
              </button>
            </div>
          </section>

          <section style={cardStyle} className="synapse-card">
            <div style={sectionHeaderRowStyle}>
              <h3 style={sectionTitleStyle}>第 2 步：图文查看任务</h3>
              <button onClick={loadTask} disabled={loadingTask} style={ghostButtonStyle} className="synapse-secondary-btn">
                {loadingTask ? '刷新中...' : '刷新任务'}
              </button>
            </div>

            {task ? (
              <div style={stackStyle}>
                {task.visualGuideImage ? (
                  <div style={imageWrapStyle}>
                    <img
                      src={task.visualGuideImage}
                      alt="任务引导图"
                      style={guideImageStyle}
                    />
                  </div>
                ) : null}

                <InfoRow label="任务标题" value={task.title} />
                <InfoRow label="对应学科" value={task.subject} />
                <InfoRow label="任务描述" value={task.description} />

                <div>
                  <strong style={strongTitleStyle}>选择难度</strong>
                  <div style={difficultyCardGridStyle}>
                    {(['easy', 'medium', 'hard'] as DifficultyKey[]).map((key) => {
                      const meta = difficultyMeta[key];
                      const active = difficulty === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setDifficulty(key)}
                          style={difficultyCardStyle(active)}
                        >
                          <div style={difficultyIconStyle}>{meta.icon}</div>
                          <div style={difficultyTitleStyle}>{meta.title}</div>
                          <div style={difficultyDescStyle}>{meta.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <strong style={strongTitleStyle}>当前难度问题</strong>
                  <div style={questionCardGridStyle}>
                    {currentQuestions.map((q, index) => (
                      <div key={q} style={questionCardStyle}>
                        <div style={questionBadgeStyle}>{index + 1}</div>
                        <div style={questionTextStyle}>{q}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handleLoadHints} disabled={loadingHints} style={ghostButtonStyle} className="synapse-secondary-btn">
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

                <div>
                  <strong style={strongTitleStyle}>建议你这样完成任务</strong>
                  <div style={visualStepGridStyle}>
                    {visualSteps.map((step) => (
                      <div key={step.key} style={visualStepCardStyle}>
                        <div style={visualStepIconStyle}>{step.icon}</div>
                        <div style={visualStepTitleStyle}>{step.title}</div>
                        <div style={visualStepTextStyle}>{step.shortText}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={emptyTextStyle}>当前还没有任务，请先提交兴趣内容。</div>
            )}
          </section>

          <section style={cardStyle} className="synapse-card">
            <div style={sectionHeaderRowStyle}>
              <h3 style={sectionTitleStyle}>第 3 步：图文引导作答</h3>
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
                  icon="👀"
                  title="1. 我观察到了什么"
                  helper="先看现象、看场景、看你最直接的感受。"
                  placeholder="先写你看到的现象、场景或最直观的感受。"
                  value={structuredAnswer.observation}
                  onChange={(value) => updateStructuredField('observation', value)}
                  onVoice={() => startVoiceInput('observation')}
                  onStop={stopVoiceInput}
                  recording={recordingField === 'observation'}
                />
                <AnswerField
                  icon="⚖️"
                  title="2. 我做了什么比较"
                  helper="把两个或三个例子放在一起看差别。"
                  placeholder="写你比较了哪些例子、路线、角色、情节或数据。"
                  value={structuredAnswer.comparison}
                  onChange={(value) => updateStructuredField('comparison', value)}
                  onVoice={() => startVoiceInput('comparison')}
                  onStop={stopVoiceInput}
                  recording={recordingField === 'comparison'}
                />
                <AnswerField
                  icon="🧠"
                  title="3. 我发现了什么规律"
                  helper="想一想：有没有重复出现的特点？"
                  placeholder="写出你从比较中发现的共同点或差别。"
                  value={structuredAnswer.pattern}
                  onChange={(value) => updateStructuredField('pattern', value)}
                  onVoice={() => startVoiceInput('pattern')}
                  onStop={stopVoiceInput}
                  recording={recordingField === 'pattern'}
                />
                <AnswerField
                  icon="✅"
                  title="4. 我的最终结论"
                  helper="最后用自己的话说出你真正发现了什么。"
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
              <button
                onClick={handleSubmitAnswer}
                disabled={!task || submittingAnswer}
                style={primaryButtonStyle}
                className="synapse-primary-btn"
              >
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
          <section style={cardStyle} className="synapse-card">
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

          <section style={cardStyle} className="synapse-card">
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
  icon: string;
  title: string;
  helper: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onVoice: () => void;
  onStop: () => void;
  recording: boolean;
}) {
  return (
    <div style={answerGuideCardStyle}>
      <div style={answerGuideHeaderStyle}>
        <div style={answerGuideTitleWrapStyle}>
          <div style={answerGuideIconStyle}>{props.icon}</div>
          <div>
            <div style={answerGuideTitleStyle}>{props.title}</div>
            <div style={answerGuideHelperStyle}>{props.helper}</div>
          </div>
        </div>

        {!props.recording ? (
          <button onClick={props.onVoice} style={ghostButtonStyle} className="synapse-secondary-btn">
            🎤 语音输入
          </button>
        ) : (
          <button onClick={props.onStop} style={dangerButtonStyle} className="synapse-danger-btn">
            ⏹ 停止录音
          </button>
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
          <span key={item} style={tagStyle} className="synapse-tag">{item}</span>
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
      style={statusBannerStyle}
      className={type === 'success' ? 'synapse-status-success' : 'synapse-status-error'}
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
  borderRadius: 28,
  padding: 28,
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
  background: 'rgba(109,124,255,0.16)',
  border: '1px solid rgba(109,124,255,0.24)',
  color: '#e7efff',
  fontWeight: 800,
  fontSize: 13,
  marginBottom: 10
};

const heroTitleStyle: CSSProperties = {
  margin: '12px 0 10px',
  fontSize: 34,
  lineHeight: 1.2,
  color: '#ffffff',
  wordBreak: 'break-word'
};

const heroDescStyle: CSSProperties = {
  margin: 0,
  color: '#d7e3f4',
  lineHeight: 1.8,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflowWrap: 'break-word'
};

const cardStyle: CSSProperties = {
  borderRadius: 24,
  padding: 22,
  width: '100%',
  minWidth: 0,
  overflow: 'hidden',
  boxSizing: 'border-box'
};

const imageWrapStyle: CSSProperties = {
  width: '100%',
  borderRadius: 20,
  overflow: 'hidden',
  border: '1px solid rgba(148,163,184,0.18)',
  background: 'rgba(255,255,255,0.03)'
};

const guideImageStyle: CSSProperties = {
  width: '100%',
  display: 'block',
  objectFit: 'cover'
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
  color: '#ffffff',
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
  color: '#f8fbff',
  fontSize: 15
};

const inputStyle: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  padding: '12px 14px',
  borderRadius: 14,
  fontSize: 15,
  boxSizing: 'border-box',
  minWidth: 0
};

const textareaStyle: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  padding: '14px',
  borderRadius: 16,
  resize: 'none',
  fontSize: 15,
  lineHeight: 1.75,
  boxSizing: 'border-box',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  overflow: 'hidden',
  display: 'block'
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

const stackStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
  minWidth: 0
};

const primaryButtonStyle: CSSProperties = {
  borderRadius: 16,
  padding: '14px 18px',
  minWidth: 180
};

const ghostButtonStyle: CSSProperties = {
  borderRadius: 14,
  padding: '10px 14px'
};

const dangerButtonStyle: CSSProperties = {
  borderRadius: 14,
  padding: '10px 14px'
};

const softBoxStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  borderRadius: 18,
  padding: 16,
  border: '1px solid rgba(148,163,184,0.18)',
  width: '100%',
  minWidth: 0,
  overflow: 'hidden',
  boxSizing: 'border-box'
};

const difficultyCardGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
  marginTop: 12
};

const difficultyCardStyle = (active: boolean): CSSProperties => ({
  border: active ? '1px solid rgba(109,124,255,0.5)' : '1px solid rgba(148,163,184,0.16)',
  borderRadius: 18,
  background: active
    ? 'linear-gradient(180deg, rgba(109,124,255,0.18), rgba(139,92,246,0.14))'
    : 'rgba(255,255,255,0.05)',
  padding: 16,
  textAlign: 'left',
  cursor: 'pointer'
});

const difficultyIconStyle: CSSProperties = {
  fontSize: 26,
  marginBottom: 8
};

const difficultyTitleStyle: CSSProperties = {
  fontWeight: 800,
  color: '#ffffff',
  marginBottom: 6
};

const difficultyDescStyle: CSSProperties = {
  color: '#d7e3f4',
  fontSize: 13,
  lineHeight: 1.6
};

const questionCardGridStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  marginTop: 12
};

const questionCardStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '40px minmax(0, 1fr)',
  gap: 12,
  alignItems: 'start',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 18,
  padding: 14
};

const questionBadgeStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 999,
  background: 'linear-gradient(90deg, #6d7cff, #8b5cf6)',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900
};

const questionTextStyle: CSSProperties = {
  color: '#eef4ff',
  lineHeight: 1.8,
  wordBreak: 'break-word',
  overflowWrap: 'break-word'
};

const visualStepGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
  marginTop: 12
};

const visualStepCardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 18,
  padding: 16
};

const visualStepIconStyle: CSSProperties = {
  fontSize: 28,
  marginBottom: 10
};

const visualStepTitleStyle: CSSProperties = {
  color: '#ffffff',
  fontWeight: 800,
  marginBottom: 6
};

const visualStepTextStyle: CSSProperties = {
  color: '#d7e3f4',
  lineHeight: 1.7,
  fontSize: 14
};

const answerGuideCardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 18,
  padding: 16
};

const answerGuideHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap'
};

const answerGuideTitleWrapStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start'
};

const answerGuideIconStyle: CSSProperties = {
  fontSize: 26,
  lineHeight: 1
};

const answerGuideTitleStyle: CSSProperties = {
  color: '#ffffff',
  fontWeight: 800,
  marginBottom: 4
};

const answerGuideHelperStyle: CSSProperties = {
  color: '#c9d7ea',
  fontSize: 14,
  lineHeight: 1.6
};

const resultBoxStyle: CSSProperties = {
  marginTop: 16,
  background: 'rgba(34,197,94,0.08)',
  borderRadius: 16,
  padding: 16,
  border: '1px solid rgba(34,197,94,0.18)',
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
  color: '#ffffff'
};

const tagStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 999,
  fontWeight: 700,
  fontSize: 13,
  wordBreak: 'break-word'
};

const pathTitleStyle: CSSProperties = {
  fontWeight: 700,
  color: '#ffffff',
  wordBreak: 'break-word'
};

const stepStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '32px minmax(0, 1fr)',
  gap: 12,
  alignItems: 'start',
  background: 'rgba(255,255,255,0.05)',
  borderRadius: 16,
  padding: 12,
  border: '1px solid rgba(148,163,184,0.18)',
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box'
};

const stepIndexStyle: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 999,
  background: 'linear-gradient(90deg, #6d7cff, #8b5cf6)',
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
  lineHeight: 1.7,
  color: '#d7e3f4'
};

const answerModeButtonStyle = (active: boolean): CSSProperties => ({
  border: 'none',
  borderRadius: 12,
  padding: '8px 12px',
  background: active ? '#f8fbff' : 'rgba(255,255,255,0.08)',
  color: active ? '#0f172a' : '#d7e3f4',
  fontWeight: 700,
  cursor: 'pointer'
});

const infoRowStyle: CSSProperties = {
  width: '100%',
  minWidth: 0,
  lineHeight: 1.7
};

const infoLabelStyle: CSSProperties = {
  color: '#ffffff'
};

const infoValueStyle: CSSProperties = {
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  color: '#d7e3f4'
};

const listStyle: CSSProperties = {
  margin: '10px 0 0',
  paddingLeft: 20
};

const listItemStyle: CSSProperties = {
  marginBottom: 8,
  lineHeight: 1.7,
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  color: '#d7e3f4'
};

const strongTitleStyle: CSSProperties = {
  color: '#ffffff'
};

const emptyTextStyle: CSSProperties = {
  color: '#a9b8cc',
  lineHeight: 1.7
};

const statusBannerStyle: CSSProperties = {
  borderRadius: 16,
  padding: '14px 16px',
  fontWeight: 700,
  lineHeight: 1.6
};
