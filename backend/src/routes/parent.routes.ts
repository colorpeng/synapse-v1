import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import {
  exportStudentReport,
  getChildrenByParentId,
  getParentAdvice,
  getRadarByStudentIdForParent,
  getStudentOverviewForParent
} from '../services/parent.service.js';

export const parentRouter = Router();

parentRouter.use(requireAuth, requireRole('parent'));

parentRouter.get('/getChildren', (req, res) => {
  try {
    const parentId = req.auth!.userId;
    const children = getChildrenByParentId(parentId);
    res.json({ children });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : '获取孩子列表失败' });
  }
});

parentRouter.get('/getRadar', (req, res) => {
  try {
    const parentId = req.auth!.userId;
    const studentId = String(req.query.studentId || '');
    if (!studentId) return res.status(400).json({ message: '缺少 studentId' });

    const radar = getRadarByStudentIdForParent(parentId, studentId);
    res.json(radar);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : '获取雷达图失败' });
  }
});

parentRouter.get('/getOverview', (req, res) => {
  try {
    const parentId = req.auth!.userId;
    const studentId = String(req.query.studentId || '');
    if (!studentId) return res.status(400).json({ message: '缺少 studentId' });

    const overview = getStudentOverviewForParent(parentId, studentId);
    res.json(overview);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : '获取成长看板失败' });
  }
});

parentRouter.get('/getAdvice', async (req, res) => {
  try {
    const parentId = req.auth!.userId;
    const studentId = String(req.query.studentId || '');
    if (!studentId) return res.status(400).json({ message: '缺少 studentId' });

    const advice = await getParentAdvice(parentId, studentId);
    res.json(advice);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : '获取AI建议失败' });
  }
});

parentRouter.get('/exportReport', (req, res) => {
  try {
    const parentId = req.auth!.userId;
    const studentId = String(req.query.studentId || '');
    if (!studentId) return res.status(400).json({ message: '缺少 studentId' });

    const html = exportStudentReport(parentId, studentId);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : '导出报告失败' });
  }
});
