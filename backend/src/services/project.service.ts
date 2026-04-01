import { createId, interests, metrics, submissions, tasks } from '../data/store.js';
import type {
  AbilityMetrics,
  DifficultyLevels,
  Interest,
  ProjectTask,
  Submission,
  StructuredAnswer,
  VisualStep
} from '../types/models.js';
import {
  buildDefaultVisualSteps,
  buildFallbackVisualGuide,
  generateFeedbackWithAI,
  generateLearningPathWithAI,
  generateStudentProfileWithAI,
  generateTaskVisualWithAI,
  generateTaskWithAI,
  hasAI
} from './ai.service.js';

function buildFallbackTask(content: string) {
  const normalized = content.trim();

  let subject = '跨学科探究';
  let title = '兴趣折射任务';
  let description = `围绕“${normalized}”开展一次学生友好的项目学习，请从观察、比较、规律和结论四个步骤逐步完成。`;

  const difficultyLevels: DifficultyLevels = {
    easy: [
      '你最喜欢这个主题的哪个地方？先用自己的话说一说。',
      '你能举出 2 个和这个主题有关的具体例子吗？',
      '看完或体验后，你最直观的感受是什么？'
    ],
    medium: [
      '你能选出 2-3 个场景做比较吗？',
      '比较时，你观察到了哪些明显差别？',
      '你能总结出一个初步规律吗？'
    ],
    hard: [
      '哪些因素会影响这个主题的结果或表现？',
      '你能设计一个简单记录表来比较这些因素吗？',
      '根据你的分析，你能提出一个优化建议吗？'
    ]
  };

  const hints = [
    '先不要急着写结论，先把你看到的现象写清楚。',
    '如果不知道怎么比较，可以从“时间、次数、强弱、顺序、结果”里选一个角度。',
    '结论不需要很复杂，只要能回答“我发现了什么”就可以。'
  ];

  let visualPrompt = `为“${normalized}”生成一张适合12-16岁学生的学习任务引导图，教育信息图海报风格，清晰展示观察、比较、规律、结论四个步骤，图文结合，易懂，不要复杂背景。`;

  if (normalized.includes('原神') || normalized.includes('地图') || normalized.includes('跑图')) {
    subject = '物理 + 数学';
    title = '开放世界跑图中的路线效率观察';
    description = '请从你熟悉的地图探索出发，比较不同路线在时间、体力和地形上的差别，找出更适合自己的跑图方式。';

    difficultyLevels.easy = [
      '你最常走的路线是哪一条？它有什么特点？',
      '你能说出这条路线最方便或最麻烦的地方吗？',
      '你觉得什么地形最影响跑图体验？'
    ];
    difficultyLevels.medium = [
      '请比较 2 条不同路线的用时和体力消耗。',
      '哪一条路线虽然更长，但走起来更顺？为什么？',
      '你能总结出“高效路线”的一个共同特点吗？'
    ];
    difficultyLevels.hard = [
      '坡度、障碍物、转弯次数会如何影响路线效率？',
      '你能做一个 3 条路线的简易数据记录表吗？',
      '请提出一个“更省时间或更省体力”的路线优化方案。'
    ];

    visualPrompt =
      '为12-16岁学生生成一张“原神跑图路线效率观察”学习任务引导图，教育信息图海报风格，包含地图探索、路线比较、时间记录、体力消耗、最终结论四部分，配清晰分区和简洁图示，易懂，不要复杂背景，不要成人商业广告风格。';
  }

  return {
    title,
    subject,
    description,
    difficultyLevels,
    hints,
    visualPrompt,
    visualSteps: buildDefaultVisualSteps()
  };
}

function normalizeTaskForStorage(taskData: {
  title: string;
  subject: string;
  description: string;
  difficultyLevels: DifficultyLevels;
  hints: string[];
  visualPrompt: string;
  visualGuideImage?: string;
  visualSteps: VisualStep[];
}) {
  return {
    title: taskData.title,
    subject: taskData.subject,
    description: taskData.description,
    questions: taskData.difficultyLevels.easy,
    hints: taskData.hints,
    difficultyLevels: taskData.difficultyLevels,
    visualPrompt: taskData.visualPrompt,
    visualGuideImage: taskData.visualGuideImage,
    visualSteps: taskData.visualSteps
  };
}

async function generateTaskFromInterest(
  interest: Interest
): Promise<ProjectTask> {
  const content = interest.content.trim();

  let taskData = buildFallbackTask(content);

  if (hasAI()) {
    try {
      const aiTask = await generateTaskWithAI(content);

      const isValid =
        Boolean(aiTask.title) &&
        Boolean(aiTask.subject) &&
        Boolean(aiTask.description) &&
        Array.isArray(aiTask.difficultyLevels?.easy) &&
        Array.isArray(aiTask.difficultyLevels?.medium) &&
        Array.isArray(aiTask.difficultyLevels?.hard) &&
        aiTask.difficultyLevels.easy.length === 3 &&
        aiTask.difficultyLevels.medium.length === 3 &&
        aiTask.difficultyLevels.hard.length === 3 &&
        Array.isArray(aiTask.hints) &&
        aiTask.hints.length === 3;

      if (isValid) {
        taskData = {
          ...taskData,
          ...aiTask,
          visualSteps: buildDefaultVisualSteps()
        };
      }
    } catch (error) {
      console.error('❌ OpenAI 生成任务失败:', error);
    }
  }

  let visualGuideImage = buildFallbackVisualGuide(
    taskData.title,
    taskData.subject,
    taskData.description
  );

  if (hasAI()) {
    try {
      visualGuideImage = await generateTaskVisualWithAI(taskData.visualPrompt);
    } catch (error) {
      console.error('❌ OpenAI 生成任务引导图失败，已回退 SVG:', error);
    }
  }

  const normalized = normalizeTaskForStorage({
    ...taskData,
    visualGuideImage
  });

  return {
    id: createId('task'),
    studentId: interest.studentId,
    interestId: interest.id,
    title: normalized.title,
    subject: normalized.subject,
    description: normalized.description,
    questions: normalized.questions,
    hints: normalized.hints,
    difficultyLevels: normalized.difficultyLevels,
    visualGuideImage: normalized.visualGuideImage,
    visualGuidePrompt: normalized.visualPrompt,
    visualSteps: normalized.visualSteps,
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

function formatStructuredAnswer(answer: string | StructuredAnswer) {
  if (typeof answer === 'string') {
    return {
      plain: answer,
      merged: answer
    };
  }

  const observation = answer.observation?.trim() || '';
  const comparison = answer.comparison?.trim() || '';
  const pattern = answer.pattern?.trim() || '';
  const conclusion = answer.conclusion?.trim() || '';

  const merged = [
    `观察：${observation || '未填写'}`,
    `比较：${comparison || '未填写'}`,
    `规律：${pattern || '未填写'}`,
    `结论：${conclusion || '未填写'}`
  ].join('\n');

  return {
    plain: merged,
    merged
  };
}

export async function submitAnswer(studentId: string, taskId: string, answer: string | StructuredAnswer) {
  const task = tasks.find((item) => item.id === taskId && item.studentId === studentId);
  if (!task) {
    throw new Error('任务不存在');
  }

  const formatted = formatStructuredAnswer(answer);

  if (!formatted.merged.trim()) {
    throw new Error('作答内容不能为空');
  }

  let score = Math.min(95, Math.max(60, Math.floor(formatted.merged.length / 8) + 55));
  let feedback =
    formatted.merged.length < 80
      ? '你已经开始表达自己的想法了，下一步可以把“观察”和“比较”写得更具体一些，这样结论会更有说服力。'
      : '你的作答已经有比较清晰的结构，说明你在认真思考。下一步建议把规律和结论之间的联系写得更明确。';

  let highlights: string[] = ['能完成基础表达', '已经开始形成结论'];
  let nextActions: string[] = ['补充更多具体例子', '把比较过程写得更清楚'];

  if (hasAI()) {
    try {
      const aiResult = await generateFeedbackWithAI({
        title: task.title,
        subject: task.subject,
        answer: formatted.merged
      });
      score = aiResult.score;
      feedback = aiResult.feedback;
      highlights = aiResult.highlights.length > 0 ? aiResult.highlights : highlights;
      nextActions = aiResult.nextActions.length > 0 ? aiResult.nextActions : nextActions;
    } catch (error) {
      console.error('❌ OpenAI 反馈失败:', error);
    }
  }

  const submission: Submission = {
    id: createId('sub'),
    taskId,
    studentId,
    answer: formatted.plain,
    feedback,
    score,
    createdAt: new Date().toISOString(),
    highlights,
    nextActions
  };

  submissions.push(submission);
  updateMetrics(studentId, formatted.merged.length, score);

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
  current.expression = Math.min(100, current.expression + Math.max(1, Math.round(answerLength / 90)));
  current.creativity = Math.min(100, current.creativity + (answerLength > 120 ? 2 : 1));
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
    tags: ['兴趣驱动型', '逐步成长型', '愿意表达'],
    strengths: ['能围绕兴趣持续投入', '具备基础观察能力', '愿意形成自己的结论'],
    nextFocus: ['比较过程更具体', '规律表达更清晰', '结论更有依据']
  };
}

export async function getLearningPath(studentId: string) {
  const latestTask = [...tasks].reverse().find((item) => item.studentId === studentId);
  const latestInterest = [...interests].reverse().find((item) => item.studentId === studentId);

  if (!latestInterest || !latestTask) {
    return {
      title: '个性化成长路径',
      steps: ['先提交一个兴趣主题', '完成基础观察', '补充比较与规律', '升级为展示型成果']
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
      '先观察你最熟悉的兴趣现象',
      '再做 2-3 个例子的比较',
      '总结出一个小规律',
      '把规律整理成展示型成果'
    ]
  };
}
