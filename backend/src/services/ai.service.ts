import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || '';
console.log('OPENAI env exists =', !!process.env.OPENAI_API_KEY);

const client = apiKey ? new OpenAI({ apiKey }) : null;

type DifficultyLevels = {
  easy: string[];
  medium: string[];
  hard: string[];
};

type AITaskResult = {
  title: string;
  subject: string;
  description: string;
  difficultyLevels: DifficultyLevels;
  hints: string[];
};

type AIFeedbackResult = {
  feedback: string;
  score: number;
  highlights: string[];
  nextActions: string[];
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

function asStringArray(value: unknown, max = 4) {
  return Array.isArray(value) ? value.map(String).slice(0, max) : [];
}

export function hasAI() {
  return Boolean(client);
}

export async function generateTaskWithAI(content: string): Promise<AITaskResult> {
  if (!client) {
    throw new Error('未配置 OPENAI_API_KEY');
  }

  const prompt = `
你是“星脉 Synapse”的学生任务设计助手。
目标用户是 12-16 岁学生。
请基于学生兴趣，生成一个“容易上手、循序渐进”的跨学科项目任务。

学生兴趣：${content}

请特别注意：
1. 题目不要太抽象，不要像论文题
2. easy 难度必须适合普通学生马上开始
3. medium 难度比 easy 多一步“比较/记录/分析”
4. hard 难度才允许出现较强分析与优化
5. 每个难度固定输出 3 个问题
6. hints 固定输出 3 条，语气友好、具体、像老师在带学生做任务
7. 全部用中文
8. 只输出 JSON，不要输出任何解释

JSON 格式如下：
{
  "title": "任务标题",
  "subject": "对应学科，格式如 数学 + 物理",
  "description": "任务描述，80-140字，学生能看懂",
  "difficultyLevels": {
    "easy": ["问题1", "问题2", "问题3"],
    "medium": ["问题1", "问题2", "问题3"],
    "hard": ["问题1", "问题2", "问题3"]
  },
  "hints": ["提示1", "提示2", "提示3"]
}
`;

  const response = await client.responses.create({
    model: 'gpt-5.2',
    input: prompt
  });

  const text = response.output_text?.trim() || '';
  console.log('🔥 OpenAI 任务原始文本返回 =', text);

  const data = extractJson(text);

  return {
    title: String(data.title || '兴趣折射任务'),
    subject: String(data.subject || '跨学科探究'),
    description: String(data.description || '围绕兴趣完成一次逐步推进的探究任务。'),
    difficultyLevels: {
      easy: asStringArray(data.difficultyLevels?.easy, 3),
      medium: asStringArray(data.difficultyLevels?.medium, 3),
      hard: asStringArray(data.difficultyLevels?.hard, 3)
    },
    hints: asStringArray(data.hints, 3)
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
你是“星脉 Synapse”的学生反馈助手。
请根据学生提交的分步作答，给出适合中学生理解的反馈。

任务标题：${params.title}
对应学科：${params.subject}
学生作答：
${params.answer}

要求：
1. 用中文
2. 语气鼓励、具体，不要空泛
3. 先说优点，再说下一步怎么改
4. 不要太像老师批评，要像学习教练
5. score 为 60-95 的整数
6. highlights 输出 2-3 条
7. nextActions 输出 2-3 条
8. 只输出 JSON

JSON 格式：
{
  "score": 86,
  "feedback": "总体反馈",
  "highlights": ["亮点1", "亮点2"],
  "nextActions": ["建议1", "建议2"]
}
`;

  const response = await client.responses.create({
    model: 'gpt-5.2',
    input: prompt
  });

  const text = response.output_text?.trim() || '';
  console.log('🔥 OpenAI 反馈原始文本返回 =', text);

  const data = extractJson(text);

  let score = Number(data.score || 80);
  if (!Number.isFinite(score)) score = 80;
  score = Math.max(60, Math.min(95, Math.round(score)));

  return {
    score,
    feedback: String(data.feedback || '你已经完成了基础表达，下一步可以把观察过程和结论写得更具体。'),
    highlights: asStringArray(data.highlights, 3),
    nextActions: asStringArray(data.nextActions, 3)
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
请根据以下学生学习信息，生成简洁画像。
兴趣：${params.interests.join('；') || '暂无'}
最近任务：${params.latestTaskTitle || '暂无'}
最近反馈：${params.latestFeedback || '暂无'}

只输出 JSON：
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
    tags: asStringArray(data.tags, 3),
    strengths: asStringArray(data.strengths, 3),
    nextFocus: asStringArray(data.nextFocus, 3)
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
请根据学生兴趣生成一个 4 步连续学习路径。
兴趣：${params.interest}
当前学科：${params.subject}

只输出 JSON：
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
    steps: asStringArray(data.steps, 4)
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
请根据学生最近学习数据，生成一份适合家长阅读的建议，语言清晰、温和、具体。

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
  console.log('🔥 OpenAI 家长建议原始文本返回 =', text);

  const data = extractJson(text);

  return {
    summary: String(data.summary || '孩子当前整体状态积极，适合继续通过兴趣驱动学习。'),
    strengths: asStringArray(data.strengths, 3),
    risks: asStringArray(data.risks, 2),
    advice: asStringArray(data.advice, 3)
  };
}
