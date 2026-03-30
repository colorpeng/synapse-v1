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
