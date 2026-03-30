import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import {
  getFeedback,
  getLatestProject,
  getTaskById,
  submitAnswer,
  submitInterest
} from '../services/project.service.js';

export const studentRouter = Router();

studentRouter.use(requireAuth, requireRole('student'));

studentRouter.post('/submitInterest', (req, res) => {
  try {
    const studentId = req.auth!.userId;
    const { type, content } = req.body;

    if (!type || !content) {
      return res.status(400).json({ message: '请填写兴趣类型和兴趣内容' });
    }

    const result = submitInterest(studentId, type, content);
    res.json({
      message: '兴趣提交成功',
      interest: result.interest,
      task: result.task
    });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : '提交失败' });
  }
});

studentRouter.get('/getProject', (req, res) => {
  try {
    const studentId = req.auth!.userId;
    const taskId = req.query.taskId ? String(req.query.taskId) : '';

    if (taskId) {
      const task = getTaskById(studentId, taskId);
      if (!task) {
        return res.status(404).json({ message: '任务不存在' });
      }
      return res.json(task);
    }

    const task = getLatestProject(studentId);
    if (!task) {
      return res.status(404).json({ message: '暂无任务' });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : '获取任务失败' });
  }
});

studentRouter.post('/submitAnswer', (req, res) => {
  try {
    const studentId = req.auth!.userId;
    const { taskId, answer } = req.body;

    if (!taskId || !answer) {
      return res.status(400).json({ message: '请填写任务 ID 和作答内容' });
    }

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

    if (!taskId) {
      return res.status(400).json({ message: '缺少 taskId' });
    }

    const hints = getFeedback(studentId, taskId);
    res.json({ hints });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : '获取失败' });
  }
});
