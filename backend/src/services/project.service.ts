import { createId, interests, metrics, submissions, tasks } from '../data/store.js';
import type { AbilityMetrics, Interest, ProjectTask, Submission } from '../types/models.js';

function generateTaskFromInterest(interest: Interest): ProjectTask {
  const content = interest.content;

  let subject = '跨学科探究';
  let title = '兴趣折射任务';
  let description = `围绕“${content}”开展一次跨学科项目学习。`;
  let questions = [
    '这个兴趣背后隐含了哪些科学或数学规律？',
    '你能设计一个小实验或小调查来验证你的想法吗？',
    '请把你的观察结果整理成结论。'
  ];
  let hints = [
    'L1 提示：先从“你看到了什么现象”开始描述。',
    'L2 提示：尝试找出速度、距离、概率、受力、节奏等变量。',
    'L3 提示：把变量之间的关系写成表格或简单公式。'
  ];

  if (content.includes('原神') || content.includes('地图') || content.includes('跑图')) {
    subject = '物理 + 数学';
    title = '开放世界跑图中的路径效率与受力分析';
    description = '请基于你熟悉的开放世界地图探索，分析角色移动路径、地形坡度、体力消耗与最优路线之间的关系。';
    questions = [
      '不同路线会如何影响到达目标点的效率？',
      '坡度、障碍物和体力值分别会带来什么影响？',
      '你能用表格记录 3 条路径的时间差异并得出最优策略吗？'
    ];
  } else if (content.includes('音乐') || content.includes('节拍')) {
    subject = '音乐 + 物理';
    title = '节拍、频率与情绪表达';
    description = '请从你喜欢的音乐中选取一个片段，观察节拍、速度与情绪传达之间的联系。';
  } else if (content.includes('四驱车') || content.includes('赛车')) {
    subject = '工程 + 物理';
    title = '四驱车改装中的摩擦力与速度平衡';
    description = '分析四驱车轮胎、重心和赛道之间的关系，提出一个提升稳定性的改装方案。';
  }

  return {
    id: createId('task'),
    studentId: interest.studentId,
    interestId: interest.id,
    title,
    subject,
    description,
    questions,
    hints,
    createdAt: new Date().toISOString()
  };
}

export function submitInterest(studentId: string, type: Interest['type'], content: string) {
  const interest: Interest = {
    id: createId('int'),
    studentId,
    type,
    content,
    createdAt: new Date().toISOString()
  };

  interests.push(interest);

  const task = generateTaskFromInterest(interest);
  tasks.push(task);

  return { interest, task };
}

export function getLatestProject(studentId: string) {
  return [...tasks].reverse().find((task) => task.studentId === studentId) ?? null;
}

export function submitAnswer(studentId: string, taskId: string, answer: string) {
  const task = tasks.find((item) => item.id === taskId && item.studentId === studentId);
  if (!task) {
    throw new Error('任务不存在');
  }

  const scoreBase = Math.min(95, Math.max(60, Math.floor(answer.length / 6) + 55));
  const feedback =
    answer.length < 50
      ? '你的回答已经有方向了，但还可以再补充实验步骤、数据记录和结论，这样会更像一个完整的项目作品。'
      : '你的作答结构比较完整，已经体现了观察、分析和结论。下一步建议补充对变量变化的解释，让论证更严谨。';

  const submission: Submission = {
    id: createId('sub'),
    taskId,
    studentId,
    answer,
    feedback,
    score: scoreBase,
    createdAt: new Date().toISOString()
  };

  submissions.push(submission);
  updateMetrics(studentId, answer.length, scoreBase);

  return submission;
}

function updateMetrics(studentId: string, answerLength: number, score: number) {
  const current = metrics.find((item) => item.studentId === studentId);
  if (!current) return;

  current.logic = Math.min(100, current.logic + Math.round(score / 20));
  current.expression = Math.min(100, current.expression + Math.round(answerLength / 80));
  current.creativity = Math.min(100, current.creativity + 1);
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
