import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { getFeedback, getLatestProject, submitAnswer, submitInterest } from '../services/project.service.js';

export const studentRouter = Router();

studentRouter.use(requireAuth, requireRole('student'));

studentRouter.post('/submitInterest', (req, res) => {
  try {
    const studentId = req.auth!.userId;
    const { type, content } = req.body;
    const result = submitInterest(studentId, type, content);
    res.json({ message: '兴趣提交成功', ...result });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : '提交失败' });
  }
});

studentRouter.get('/getProject', (req, res) => {
  const studentId = req.auth!.userId;
  const task = getLatestProject(studentId);
  if (!task) {
    return res.status(404).json({ message: '暂无任务' });
  }
  res.json(task);
});

studentRouter.post('/submitAnswer', (req, res) => {
  try {
    const studentId = req.auth!.userId;
    const { taskId, answer } = req.body;
    const result = submitAnswer(studentId, taskId, answer);
    res.json({ message: '作业提交成功', submission: result });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : '提交失败' });
  }
});

studentRouter.get('/getFeedback', (req, res) => {
  try {
    const studentId = req.auth!.userId;
    const taskId = String(req.query.taskId || '');
    const hints = getFeedback(studentId, taskId);
    res.json({ hints });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : '获取失败' });
  }
});
