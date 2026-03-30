export type UserRole = 'student' | 'parent';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface ParentStudentLink {
  parentId: string;
  studentId: string;
}

export type InterestType = 'text' | 'image' | 'link';

export interface Interest {
  id: string;
  studentId: string;
  type: InterestType;
  content: string;
  createdAt: string;
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
