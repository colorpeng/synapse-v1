import { Router } from 'express';
import { loginUser, registerUser } from '../services/auth.service.js';

export const authRouter = Router();

authRouter.post('/register', (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = registerUser({ name, email, password, role });
    const login = loginUser(email, password);
    res.json({ message: '注册成功', user, ...login });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : '注册失败' });
  }
});

authRouter.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const result = loginUser(email, password);
    res.json({ message: '登录成功', ...result });
  } catch (error) {
    res.status(401).json({ message: error instanceof Error ? error.message : '登录失败' });
  }
});
