import { createId, interests, metrics, submissions, tasks } from '../data/store.js';
import type { AbilityMetrics, Interest, ProjectTask, Submission } from '../types/models.js';
import { generateFeedbackWithAI, generateTaskWithAI, hasOpenAI } from './ai.service.js';

function buildFallbackTask(content: string) {
  const normalized = content.trim();

  let subject = '跨学科探究';
  let title = '兴趣折射任务';
  let description = `围绕“${normalized}”开展一次跨学科项目学习，请你像一个小研究者一样完成观察、分析和结论。`;
  let questions = [
    '这个兴趣背后隐含了哪些科学、数学或社会规律？',
    '你能设计一个小实验、小调查或小对比来验证你的想法吗？',
    '你最终得到的结论是什么？这些结论能帮助你解释什么现象？'
  ];
  let hints = [
    'L1 提示：先说清你观察到了什么现象。',
    'L2 提示：尝试把现象拆成几个可比较的变量。',
    'L3 提示：把你的变量、过程和结论整理成表格或分点表达。'
  ];

  if (normalized.includes('原神') || normalized.includes('地图') || normalized.includes('跑图')) {
    subject = '物理 + 数学';
    title = '开放世界跑图中的路径效率与受力分析';
    description =
      '请基于你熟悉的开放世界地图探索，分析角色移动路径、地形坡度、体力消耗与最优路线之间的关系。你需要设计一个可比较的记录方法，并给出数据支持的结论。';
    questions = [
      '不同路线会如何影响到达目标点的效率？',
      '坡度、障碍物和体力值分别会带来什么影响？',
      '你能用表格记录 3 条路径的时间差异并得出最优策略吗？'
    ];
    hints = [
      'L1 提示：先选出 3 条路线，并写清每条路线的地形特点。',
      'L2 提示：记录“路径长度、是否爬坡、体力消耗、用时”四个变量。',
      'L3 提示：比较结果后，写出“为什么最短路线不一定最快”。'
    ];
  } else if (normalized.includes('音乐') || normalized.includes('节拍') || normalized.includes('说唱')) {
    subject = '音乐 + 物理';
    title = '节拍、频率与情绪表达';
    description =
      '请从你喜欢的音乐中选取一个片段，观察节拍、速度、强弱变化与情绪传达之间的联系，并完成一次简短分析。';
    questions = [
      '节拍快慢会怎样影响听觉感受？',
      '音乐中的强弱变化如何推动情绪表达？',
      '你能比较两段不同风格音乐并总结规律吗？'
    ];
    hints = [
      'L1 提示：先选两段音乐，写出你的直观感受。',
      'L2 提示：记录节拍速度、情绪词、重复片段等要素。',
      'L3 提示：尝试解释“为什么节奏变化会改变情绪体验”。'
    ];
  } else if (normalized.includes('四驱车') || normalized.includes('赛车') || normalized.includes('改装')) {
    subject = '工程 + 物理';
    title = '四驱车改装中的摩擦力与速度平衡';
    description =
      '请分析四驱车轮胎、重心、赛道弯道与速度之间的关系，提出一个提升稳定性的改装方案。';
    questions = [
      '轮胎和赛道材料会怎样影响摩擦力？',
      '重心位置改变后，弯道表现会有什么差异？',
      '你能提出一个“速度与稳定性平衡”的改装建议吗？'
    ];
    hints = [
      'L1 提示：先确定你最想优化的是速度还是稳定性。',
      'L2 提示：从轮胎、重量、弯道表现这三个变量入手。',
      'L3 提示：写出你的改装方案和它背后的物理原因。'
    ];
  }

  return { title, subject, description, questions, hints };
}

async function generateTaskFromInterest(interest: Interest): Promise<ProjectTask> {
  const content = interest.content.trim();

  let taskData = buildFallbackTask(content);

 if (hasOpenAI()) {
  try {
    console.log('✅ 开始调用 Gemini 生成任务');
    const aiTask = await generateTaskWithAI(content);
    console.log('✅ Gemini 返回结果:', aiTask);

    if (
      aiTask.title &&
      aiTask.subject &&
      aiTask.description &&
      aiTask.questions.length === 3 &&
      aiTask.hints.length === 3
    ) {
      taskData = aiTask;
      console.log('✅ 已使用 Gemini 生成结果');
    } else {
      throw new Error(`Gemini 返回格式不完整: ${JSON.stringify(aiTask)}`);
    }
  } catch (error) {
    console.error('❌ Gemini 生成任务失败:', error);
    throw error;
  }
} else {
  console.log('⚠️ 未检测到 GEMINI_API_KEY，直接使用模板');
}

  return {
    id: createId('task'),
    studentId: interest.studentId,
    interestId: interest.id,
    title: taskData.title,
    subject: taskData.subject,
    description: taskData.description,
    questions: taskData.questions,
    hints: taskData.hints,
    createdAt: new Date().toISOString()
  };
}

export async function submitInterest(studentId: string, type: Interest['type'], content: string) {
  if (!content || !content.trim()) {
    throw new Error('兴趣内容不能为空');
  }

  const interest: Interest = {
    id: createId('int'),
    studentId,
    type,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };

  interests.push(interest);

  const task = await generateTaskFromInterest(interest);
  tasks.push(task);

  return { interest, task };
}

export function getLatestProject(studentId: string) {
  return [...tasks].reverse().find((task) => task.studentId === studentId) ?? null;
}

export function getTaskById(studentId: string, taskId: string) {
  return tasks.find((task) => task.id === taskId && task.studentId === studentId) ?? null;
}

export async function submitAnswer(studentId: string, taskId: string, answer: string) {
  const task = tasks.find((item) => item.id === taskId && item.studentId === studentId);
  if (!task) {
    throw new Error('任务不存在');
  }

  if (!answer || !answer.trim()) {
    throw new Error('作答内容不能为空');
  }

  const cleanedAnswer = answer.trim();

  let score = Math.min(95, Math.max(60, Math.floor(cleanedAnswer.length / 6) + 55));
  let feedback =
    cleanedAnswer.length < 50
      ? '你的回答已经有方向了，但还可以再补充实验步骤、数据记录和结论，这样会更像一个完整的项目作品。'
      : '你的作答结构比较完整，已经体现了观察、分析和结论。下一步建议补充对变量变化的解释，让论证更严谨。';

  if (hasOpenAI()) {
    try {
      const aiResult = await generateFeedbackWithAI({
        title: task.title,
        subject: task.subject,
        answer: cleanedAnswer
      });
      score = aiResult.score;
      feedback = aiResult.feedback;
    } catch (error) {
      console.error('AI 反馈失败，已回退规则反馈:', error);
    }
  }

  const submission: Submission = {
    id: createId('sub'),
    taskId,
    studentId,
    answer: cleanedAnswer,
    feedback,
    score,
    createdAt: new Date().toISOString()
  };

  submissions.push(submission);
  updateMetrics(studentId, cleanedAnswer.length, score);

  return submission;
}

function updateMetrics(studentId: string, answerLength: number, score: number) {
  let current = metrics.find((item) => item.studentId === studentId);

  if (!current) {
    current = {
      studentId,
      logic: 60,
      resilience: 60,
      creativity: 60,
      expression: 60,
      collaboration: 60,
      updatedAt: new Date().toISOString()
    };
    metrics.push(current);
  }

  current.logic = Math.min(100, current.logic + Math.round(score / 18));
  current.expression = Math.min(100, current.expression + Math.max(1, Math.round(answerLength / 80)));
  current.creativity = Math.min(100, current.creativity + (answerLength > 100 ? 2 : 1));
  current.resilience = Math.min(100, current.resilience + 1);
  current.updatedAt = new Date().toISOString();
}

export function getFeedback(studentId: string, taskId: string) {
  const task = tasks.find((item) => item.id === taskId && item.studentId === studentId);
  if (!task) {
    throw new Error('任务不存在');
  }
  return task.hints;
}

export function getMetrics(studentId: string): AbilityMetrics | null {
  return metrics.find((item) => item.studentId === studentId) ?? null;
}

export function getLatestSubmission(studentId: string) {
  return [...submissions].reverse().find((item) => item.studentId === studentId) ?? null;
}
