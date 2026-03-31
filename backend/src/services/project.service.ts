import { createId, interests, metrics, submissions, tasks } from '../data/store.js';
import type { AbilityMetrics, Interest, ProjectTask, Submission } from '../types/models.js';
import {
  generateFeedbackWithAI,
  generateLearningPathWithAI,
  generateStudentProfileWithAI,
  generateTaskWithAI,
  hasAI
} from './ai.service.js';

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
    description = '请基于你熟悉的开放世界地图探索，分析角色移动路径、地形坡度、体力消耗与最优路线之间的关系。';
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
  }

  return { title, subject, description, questions, hints };
}

async function generateTaskFromInterest(interest: Interest): Promise<ProjectTask> {
  const content = interest.content.trim();
  let taskData = buildFallbackTask(content);

  if (hasAI()) {
    try {
      const aiTask = await generateTaskWithAI(content);
      const isValid =
        Boolean(aiTask.title) &&
        Boolean(aiTask.subject) &&
        Boolean(aiTask.description) &&
        Array.isArray(aiTask.questions) &&
        Array.isArray(aiTask.hints) &&
        aiTask.questions.length === 3 &&
        aiTask.hints.length === 3;

      if (isValid) {
        taskData = aiTask;
      }
    } catch (error) {
      console.error('❌ OpenAI 生成任务失败:', error);
    }
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

  if (hasAI()) {
    try {
      const aiResult = await generateFeedbackWithAI({
        title: task.title,
        subject: task.subject,
        answer: cleanedAnswer
      });
      score = aiResult.score;
      feedback = aiResult.feedback;
    } catch (error) {
      console.error('❌ OpenAI 反馈失败:', error);
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

export async function getStudentProfile(studentId: string) {
  const studentInterests = interests.filter((item) => item.studentId === studentId);
  const latestTask = [...tasks].reverse().find((item) => item.studentId === studentId);
  const latestSubmission = [...submissions].reverse().find((item) => item.studentId === studentId);

  if (hasAI()) {
    try {
      return await generateStudentProfileWithAI({
        interests: studentInterests.map((item) => item.content),
        latestTaskTitle: latestTask?.title,
        latestFeedback: latestSubmission?.feedback
      });
    } catch (error) {
      console.error('❌ 画像生成失败:', error);
    }
  }

  return {
    tags: ['兴趣驱动型', '项目探索者', '表达成长中'],
    strengths: ['愿意主动尝试新主题', '具备一定观察与归纳能力', '能够形成初步结论'],
    nextFocus: ['补充数据记录', '强化逻辑表达', '形成连续项目产出']
  };
}

export async function getLearningPath(studentId: string) {
  const latestTask = [...tasks].reverse().find((item) => item.studentId === studentId);
  const latestInterest = [...interests].reverse().find((item) => item.studentId === studentId);

  if (!latestInterest || !latestTask) {
    return {
      title: '个性化成长路径',
      steps: ['先提交一个兴趣主题', '生成任务并完成探究', '提交作业获取反馈', '根据反馈进入下一轮优化']
    };
  }

  if (hasAI()) {
    try {
      return await generateLearningPathWithAI({
        interest: latestInterest.content,
        subject: latestTask.subject
      });
    } catch (error) {
      console.error('❌ 学习路径生成失败:', error);
    }
  }

  return {
    title: '连续学习路径',
    steps: [
      '先完成一次兴趣主题的基础观察',
      '补充数据记录与变量比较',
      '形成结构化结论',
      '把本次成果升级为展示型作品'
    ]
  };
}
