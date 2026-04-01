export type UserRole = 'student' | 'parent';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  message: string;
}

export interface DifficultyLevels {
  easy: string[];
  medium: string[];
  hard: string[];
}

export interface VisualStep {
  key: 'observe' | 'compare' | 'pattern' | 'conclusion';
  title: string;
  shortText: string;
  icon: string;
}

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

export interface StructuredAnswer {
  observation: string;
  comparison: string;
  pattern: string;
  conclusion: string;
}

export interface SubmissionResponse {
  message: string;
  submission: {
    id: string;
    taskId: string;
    studentId: string;
    answer: string;
    feedback: string;
    score: number;
    createdAt: string;
    highlights?: string[];
    nextActions?: string[];
  };
}

export interface Child {
  id: string;
  name: string;
  email: string;
}

export interface RadarData {
  studentId: string;
  logic: number;
  resilience: number;
  creativity: number;
  expression: number;
  collaboration: number;
  updatedAt: string;
}

export interface StudentProfile {
  tags: string[];
  strengths: string[];
  nextFocus: string[];
}

export interface LearningPath {
  title: string;
  steps: string[];
}

export interface ParentAdvice {
  summary: string;
  strengths: string[];
  risks: string[];
  advice: string[];
}
