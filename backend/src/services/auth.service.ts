import jwt from 'jsonwebtoken';
import { createId, users } from '../data/store.js';
import type { User, UserRole } from '../types/models.js';

const JWT_SECRET = 'synapse-dev-secret';

export function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): User {
  const exists = users.find((u) => u.email === payload.email);
  if (exists) {
    throw new Error('该邮箱已注册');
  }

  const user: User = {
    id: createId(payload.role === 'student' ? 'stu' : 'par'),
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role
  };

  users.push(user);
  return user;
}

export function loginUser(email: string, password: string) {
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    throw new Error('邮箱或密码错误');
  }

  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as {
    sub: string;
    role: UserRole;
    email: string;
    name: string;
  };
}
