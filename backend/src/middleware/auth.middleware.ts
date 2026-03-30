import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../services/auth.service.js';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: 'student' | 'parent';
        email: string;
        name: string;
      };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未登录或 token 缺失' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = verifyToken(token);
    req.auth = {
      userId: payload.sub,
      role: payload.role,
      email: payload.email,
      name: payload.name
    };
    next();
  } catch {
    return res.status(401).json({ message: 'token 无效或已过期' });
  }
}

export function requireRole(role: 'student' | 'parent') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ message: '未登录' });
    }
    if (req.auth.role !== role) {
      return res.status(403).json({ message: '无权限访问' });
    }
    next();
  };
}
