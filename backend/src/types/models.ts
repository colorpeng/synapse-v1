export type UserRole = 'student' | 'parent';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface Interest {
  id: string;
  studentId: string;
  type: 'text' | 'image' | 'link';
  content: string;
  createdAt: string;
}

export type DifficultyLevels = {
  easy: string[];
  medium: string[];
  hard: string[];
};

export type VisualStep = {
  key: 'observe' | 'compare' | 'pattern' | 'conclusion';
  title: string;
  shortText: string;
  icon: string;
};

export interface ProjectTask {
  id: string;
  studentId: string;
  interestId: string;
  title: string;
  subject: string;
  description: string;
  questions: string[];
  hints: string[];
  difficultyLevels?: DifficultyLevels;
  visualGuideImage?: string;
  visualGuidePrompt?: string;
  visualSteps?: VisualStep[];
  createdAt: string;
}

export interface Submission {
  id: string;
  taskId: string;
  studentId: string;
  answer: string;
  feedback: string;
  score: number;
  createdAt: string;
  highlights?: string[];
  nextActions?: string[];
}

export interface AbilityMetrics {
  studentId: string;
  logic: number;
  resilience: number;
  creativity: number;
  expression: number;
  collaboration: number;
  updatedAt: string;
}

export interface ParentStudentLink {
  parentId: string;
  studentId: string;
}
