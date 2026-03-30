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
    id: 'int_1',
    studentId: 'stu_1',
    type: 'text',
    content: '我喜欢原神跑图和地图探索',
    createdAt: now()
  }
];

export const tasks: ProjectTask[] = [];
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
