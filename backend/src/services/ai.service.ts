import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || '';

const client = apiKey
  ? new OpenAI({ apiKey })
  : null;

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

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('AI 返回中没有可解析 JSON');
  }
  return JSON.parse(match[0]);
}

export function hasOpenAI() {
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

要求：
1. 任务必须具体、可执行
2. 问题数量固定为 3 个
3. 提示数量固定为 3 个
4. 输出必须是合法 JSON
`;

  const response = await client.responses.create({
    model: 'gpt-5',
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

要求：
1. feedback 用中文
2. feedback 120字以内
3. 先肯定，再指出可提升点
4. score 必须是整数
`;

  const response = await client.responses.create({
    model: 'gpt-5',
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
