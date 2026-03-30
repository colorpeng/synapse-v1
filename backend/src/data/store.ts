import type { AbilityMetrics, Interest, ParentStudentLink, ProjectTask, Submission, User } from '../types/models.js';

const now = () => new Date().toISOString();

export const users: User[] = [
  {
    id: 'stu_1',
    name: '小宇',
    email: 'student@synapse.ai',
    password: '123456',
    role: 'student'
  },
  {
    id: 'par_1',
    name: '小宇妈妈',
    email: 'parent@synapse.ai',
    password: '123456',
    role: 'parent'
  }
];

export const parentStudentLinks: ParentStudentLink[] = [
  { parentId: 'par_1', studentId: 'stu_1' }
];

export const interests: Interest[] = [
  {
    id: 'int_seed_1',
    studentId: 'stu_1',
    type: 'text',
    content: '我喜欢原神跑图和地图探索',
    createdAt: now()
  }
];

export const tasks: ProjectTask[] = [
  {
    id: 'task_seed_1',
    studentId: 'stu_1',
    interestId: 'int_seed_1',
    title: '开放世界跑图中的路径效率与受力分析',
    subject: '物理 + 数学',
    description:
      '请基于你熟悉的开放世界地图探索，分析角色移动路径、地形坡度、体力消耗与最优路线之间的关系。',
    questions: [
      '不同路线会如何影响到达目标点的效率？',
      '坡度、障碍物和体力值分别会带来什么影响？',
      '你能用表格记录 3 条路径的时间差异并得出最优策略吗？'
    ],
    hints: [
      'L1 提示：先描述你选择了哪三条路线，以及每条路线最明显的特点。',
      'L2 提示：记录路径长度、地形坡度、体力消耗、到达时间这几个变量。',
      'L3 提示：尝试把“路径长度更短 ≠ 一定更快”写成你的结论，并解释原因。'
    ],
    createdAt: now()
  }
];

export const submissions: Submission[] = [];

export const metrics: AbilityMetrics[] = [
  {
    studentId: 'stu_1',
    logic: 72,
    resilience: 68,
    creativity: 88,
    expression: 74,
    collaboration: 65,
    updatedAt: now()
  }
];

export const createId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
