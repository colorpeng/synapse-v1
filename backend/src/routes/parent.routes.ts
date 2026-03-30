import { Router } from 'express';
import { metrics, parentStudentLinks, submissions, tasks, users } from '../data/store.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { getLatestSubmission, getMetrics } from '../services/project.service.js';

export const parentRouter = Router();

parentRouter.use(requireAuth, requireRole('parent'));

parentRouter.get('/getChildren', (req, res) => {
  const parentId = req.auth!.userId;
  const links = parentStudentLinks.filter((item) => item.parentId === parentId);
  const children = links
    .map((link) => users.find((u) => u.id === link.studentId))
    .filter(Boolean)
    .map((child) => ({
      id: child!.id,
      name: child!.name,
      email: child!.email
    }));

  res.json({ children });
});

parentRouter.get('/getRadar', (req, res) => {
  const parentId = req.auth!.userId;
  const studentId = String(req.query.studentId || '');
  const canAccess = parentStudentLinks.some((item) => item.parentId === parentId && item.studentId === studentId);
  if (!canAccess) {
    return res.status(403).json({ message: '无权限访问该学生数据' });
  }

  const result = getMetrics(studentId);
  if (!result) {
    return res.status(404).json({ message: '暂无能力数据' });
  }

  res.json(result);
});

parentRouter.get('/exportReport', (req, res) => {
  const parentId = req.auth!.userId;
  const studentId = String(req.query.studentId || '');
  const canAccess = parentStudentLinks.some((item) => item.parentId === parentId && item.studentId === studentId);
  if (!canAccess) {
    return res.status(403).json({ message: '无权限访问该学生报告' });
  }

  const student = users.find((u) => u.id === studentId);
  const metric = metrics.find((item) => item.studentId === studentId);
  const latestTask = [...tasks].reverse().find((item) => item.studentId === studentId);
  const latestSubmission = getLatestSubmission(studentId);

  const html = `
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>Synapse 学习报告</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #222; }
      h1, h2 { color: #3b5cff; }
      .card { border: 1px solid #ddd; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    </style>
  </head>
  <body>
    <h1>星脉 Synapse 双语学习成果报告</h1>
    <div class="card">
      <h2>学生信息 / Student</h2>
      <p><strong>姓名：</strong>${student?.name ?? '-'}</p>
      <p><strong>报告生成时间：</strong>${new Date().toLocaleString()}</p>
    </div>

    <div class="card">
      <h2>项目主题 / Project Topic</h2>
      <p><strong>${latestTask?.title ?? '暂无任务'}</strong></p>
      <p>${latestTask?.description ?? '暂无描述'}</p>
    </div>

    <div class="card">
      <h2>学生成果 / Student Output</h2>
      <p>${latestSubmission?.answer ?? '暂无提交内容'}</p>
      <p><strong>AI 反馈：</strong>${latestSubmission?.feedback ?? '暂无反馈'}</p>
      <p><strong>评分：</strong>${latestSubmission?.score ?? '-'} / 100</p>
    </div>

    <div class="card">
      <h2>认知能力 / Cognitive Metrics</h2>
      <div class="grid">
        <div>逻辑推理 Logic: ${metric?.logic ?? '-'}</div>
        <div>抗挫折力 Resilience: ${metric?.resilience ?? '-'}</div>
        <div>创造力 Creativity: ${metric?.creativity ?? '-'}</div>
        <div>表达力 Expression: ${metric?.expression ?? '-'}</div>
        <div>协作意识 Collaboration: ${metric?.collaboration ?? '-'}</div>
      </div>
    </div>
  </body>
  </html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="synapse-report-${studentId}.html"`);
  res.send(html);
});
