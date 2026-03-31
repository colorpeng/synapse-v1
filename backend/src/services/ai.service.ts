import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || '';
console.log('OPENAI env exists =', !!process.env.OPENAI_API_KEY);

const client = apiKey ? new OpenAI({ apiKey }) : null;

type AITaskResult = {
  title: string;
  subject: string;
  description: string;
  questions: string[];
  hints: string[];
};

type AIFeedbackResult = {
  feedback: string;
  score: number;
};

type AIProfileResult = {
  tags: string[];
  strengths: string[];
  nextFocus: string[];
};

type AIPathResult = {
  title: string;
  steps: string[];
};

type AIParentAdviceResult = {
  summary: string;
  strengths: string[];
  risks: string[];
  advice: string[];
};

function extractJson(text: string) {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error(`AI 返回中没有可解析 JSON。原文: ${text}`);
  }

  return JSON.parse(match[0]);
}

export function hasAI() {
  return Boolean(client);
}

export async function generateTaskWithAI(content: string): Promise<AITaskResult> {
  if (!client) {
    throw new Error('未配置 OPENAI_API_KEY');
  }

  const prompt = `
你是“星脉 Synapse”的学习任务设计助手。
请根据学生兴趣，生成一个适合 12-16 岁学生的跨学科 PBL 微型任务。

学生兴趣：${content}

请只输出 JSON，不要输出任何解释。
JSON 格式如下：
{
  "title": "任务标题",
  "subject": "对应学科，格式如 物理 + 数学",
  "description": "任务描述，80-150字",
  "questions": ["问题1", "问题2", "问题3"],
  "hints": ["L1 提示...", "L2 提示...", "L3 提示..."]
}
`;

  const response = await client.responses.create({
    model: 'gpt-5.2',
    input: prompt
  });

  const text = response.output_text?.trim() || '';
  const data = extractJson(text);

  return {
    title: String(data.title || '兴趣折射任务'),
    subject: String(data.subject || '跨学科探究'),
    description: String(data.description || '围绕兴趣完成一次跨学科探究任务。'),
    questions: Array.isArray(data.questions) ? data.questions.map(String).slice(0, 3) : [],
    hints: Array.isArray(data.hints) ? data.hints.map(String).slice(0, 3) : []
  };
}

export async function generateFeedbackWithAI(params: {
  title: string;
  subject: string;
  answer: string;
}): Promise<AIFeedbackResult> {
  if (!client) {
    throw new Error('未配置 OPENAI_API_KEY');
  }

  const prompt = `
你是“星脉 Synapse”的学生作业反馈助手。
请根据学生作答，给出鼓励式、具体的反馈，并给出 60-95 分之间的分数。

任务标题：${params.title}
对应学科：${params.subject}
学生作答：
${params.answer}

请只输出 JSON，不要输出任何解释。
JSON 格式如下：
{
  "score": 88,
  "feedback": "这里写反馈"
}
`;

  const response = await client.responses.create({
    model: 'gpt-5.2',
    input: prompt
  });

  const text = response.output_text?.trim() || '';
  const data = extractJson(text);

  let score = Number(data.score || 80);
  if (!Number.isFinite(score)) score = 80;
  score = Math.max(60, Math.min(95, Math.round(score)));

  return {
    score,
    feedback: String(data.feedback || '你的作答已经有清晰思路，建议补充更多过程和变量分析。')
  };
}

export async function generateStudentProfileWithAI(params: {
  interests: string[];
  latestTaskTitle?: string;
  latestFeedback?: string;
}): Promise<AIProfileResult> {
  if (!client) {
    throw new Error('未配置 OPENAI_API_KEY');
  }

  const prompt = `
你是教育产品“星脉 Synapse”的学习画像助手。
请根据学生最近的兴趣和学习表现，生成简洁画像。

兴趣列表：${params.interests.join('；') || '暂无'}
最近任务标题：${params.latestTaskTitle || '暂无'}
最近反馈：${params.latestFeedback || '暂无'}

请只输出 JSON：
{
  "tags": ["标签1", "标签2", "标签3"],
  "strengths": ["优势1", "优势2", "优势3"],
  "nextFocus": ["下一步1", "下一步2", "下一步3"]
}
`;

  const response = await client.responses.create({
    model: 'gpt-5.2',
    input: prompt
  });

  const text = response.output_text?.trim() || '';
  const data = extractJson(text);

  return {
    tags: Array.isArray(data.tags) ? data.tags.map(String).slice(0, 3) : [],
    strengths: Array.isArray(data.strengths) ? data.strengths.map(String).slice(0, 3) : [],
    nextFocus: Array.isArray(data.nextFocus) ? data.nextFocus.map(String).slice(0, 3) : []
  };
}

export async function generateLearningPathWithAI(params: {
  interest: string;
  subject: string;
}): Promise<AIPathResult> {
  if (!client) {
    throw new Error('未配置 OPENAI_API_KEY');
  }

  const prompt = `
你是“星脉 Synapse”的学习路径设计助手。
请基于学生兴趣，给出一个 4 步连续学习路径。

兴趣：${params.interest}
当前学科：${params.subject}

请只输出 JSON：
{
  "title": "路径标题",
  "steps": ["第1步", "第2步", "第3步", "第4步"]
}
`;

  const response = await client.responses.create({
    model: 'gpt-5.2',
    input: prompt
  });

  const text = response.output_text?.trim() || '';
  const data = extractJson(text);

  return {
    title: String(data.title || '个性化成长路径'),
    steps: Array.isArray(data.steps) ? data.steps.map(String).slice(0, 4) : []
  };
}

export async function generateParentAdviceWithAI(params: {
  studentName: string;
  taskTitle?: string;
  latestFeedback?: string;
  metrics: {
    logic: number;
    resilience: number;
    creativity: number;
    expression: number;
    collaboration: number;
  };
}): Promise<AIParentAdviceResult> {
  if (!client) {
    throw new Error('未配置 OPENAI_API_KEY');
  }

  const prompt = `
你是“星脉 Synapse”的家长沟通助手。
请根据学生最近学习数据，生成一份家长建议。

学生姓名：${params.studentName}
最近任务：${params.taskTitle || '暂无'}
最近反馈：${params.latestFeedback || '暂无'}
能力数据：
逻辑 ${params.metrics.logic}
抗挫 ${params.metrics.resilience}
创造 ${params.metrics.creativity}
表达 ${params.metrics.expression}
协作 ${params.metrics.collaboration}

请只输出 JSON：
{
  "summary": "总体总结",
  "strengths": ["优势1", "优势2", "优势3"],
  "risks": ["关注点1", "关注点2"],
  "advice": ["建议1", "建议2", "建议3"]
}
`;

  const response = await client.responses.create({
    model: 'gpt-5.2',
    input: prompt
  });

  const text = response.output_text?.trim() || '';
  const data = extractJson(text);

  return {
    summary: String(data.summary || '孩子当前整体表现稳定，具备继续深挖兴趣的潜力。'),
    strengths: Array.isArray(data.strengths) ? data.strengths.map(String).slice(0, 3) : [],
    risks: Array.isArray(data.risks) ? data.risks.map(String).slice(0, 2) : [],
    advice: Array.isArray(data.advice) ? data.advice.map(String).slice(0, 3) : []
  };
}
