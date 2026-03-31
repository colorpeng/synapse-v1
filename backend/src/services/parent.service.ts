import { metrics, parentStudentLinks, submissions, tasks, users } from '../data/store.js';
import { generateParentAdviceWithAI, hasAI } from './ai.service.js';

function ensureParentOwnsStudent(parentId: string, studentId: string) {
  const linked = parentStudentLinks.find((item) => item.parentId === parentId && item.studentId === studentId);
  if (!linked) {
    throw new Error('你无权查看该学生数据');
  }
}

export function getChildrenByParentId(parentId: string) {
  const studentIds = parentStudentLinks
    .filter((item) => item.parentId === parentId)
    .map((item) => item.studentId);

  return users
    .filter((user) => user.role === 'student' && studentIds.includes(user.id))
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email
    }));
}

export function getRadarByStudentIdForParent(parentId: string, studentId: string) {
  ensureParentOwnsStudent(parentId, studentId);

  const radar = metrics.find((item) => item.studentId === studentId);
  if (!radar) {
    return {
      studentId,
      logic: 60,
      resilience: 60,
      creativity: 60,
      expression: 60,
      collaboration: 60,
      updatedAt: new Date().toISOString()
    };
  }

  return radar;
}

export function getStudentOverviewForParent(parentId: string, studentId: string) {
  ensureParentOwnsStudent(parentId, studentId);

  const student = users.find((user) => user.id === studentId && user.role === 'student');
  if (!student) {
    throw new Error('学生不存在');
  }

  const latestTask = [...tasks].reverse().find((task) => task.studentId === studentId) ?? null;
  const latestSubmission = [...submissions].reverse().find((submission) => submission.studentId === studentId) ?? null;

  return {
    student: {
      id: student.id,
      name: student.name,
      email: student.email
    },
    latestTask,
    latestSubmission
  };
}

export async function getParentAdvice(parentId: string, studentId: string) {
  ensureParentOwnsStudent(parentId, studentId);

  const student = users.find((user) => user.id === studentId && user.role === 'student');
  if (!student) {
    throw new Error('学生不存在');
  }

  const latestTask = [...tasks].reverse().find((task) => task.studentId === studentId) ?? null;
  const latestSubmission = [...submissions].reverse().find((submission) => submission.studentId === studentId) ?? null;
  const radar = getRadarByStudentIdForParent(parentId, studentId);

  if (hasAI()) {
    try {
      return await generateParentAdviceWithAI({
        studentName: student.name,
        taskTitle: latestTask?.title,
        latestFeedback: latestSubmission?.feedback,
        metrics: {
          logic: radar.logic,
          resilience: radar.resilience,
          creativity: radar.creativity,
          expression: radar.expression,
          collaboration: radar.collaboration
        }
      });
    } catch (error) {
      console.error('❌ 家长建议生成失败:', error);
    }
  }

  return {
    summary: '孩子当前处在兴趣驱动学习阶段，整体状态积极，适合继续推进项目制探究。',
    strengths: ['对兴趣主题有主动投入', '能够完成基础分析', '具备一定表达潜力'],
    risks: ['数据支撑还不够强', '结论深度还有提升空间'],
    advice: ['鼓励孩子继续记录过程', '帮助孩子把想法整理成结构', '少催结果，多肯定探索过程']
  };
}

export function exportStudentReport(parentId: string, studentId: string) {
  ensureParentOwnsStudent(parentId, studentId);

  const student = users.find((user) => user.id === studentId && user.role === 'student');
  if (!student) {
    throw new Error('学生不存在');
  }

  const radar = getRadarByStudentIdForParent(parentId, studentId);
  const latestTask = [...tasks].reverse().find((task) => task.studentId === studentId) ?? null;
  const latestSubmission = [...submissions].reverse().find((submission) => submission.studentId === studentId) ?? null;

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>星脉学习成果报告</title>
  <style>
    body { font-family: Arial, "PingFang SC", "Microsoft YaHei", sans-serif; background:#f6f8fc; color:#1f2937; margin:0; padding:32px; }
    .container { max-width:920px; margin:0 auto; background:#fff; border-radius:24px; padding:32px; box-shadow:0 12px 32px rgba(15,23,42,0.08); }
    .section { margin-top:24px; padding:20px; border-radius:18px; background:#f8fbff; border:1px solid #dbeafe; }
    .grid { display:grid; gap:12px; grid-template-columns: repeat(2,minmax(0,1fr)); }
    .metric { background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:14px; }
    .label { font-size:14px; color:#64748b; margin-bottom:6px; }
    .value { font-size:24px; font-weight:700; color:#0f172a; }
  </style>
</head>
<body>
  <div class="container">
    <h1>星脉 Synapse 学习成果报告</h1>
    <div><strong>学生姓名：</strong>${student.name}</div>
    <div><strong>学生邮箱：</strong>${student.email}</div>
    <div><strong>导出时间：</strong>${new Date().toLocaleString('zh-CN')}</div>

    <div class="section">
      <h2>能力雷达快照</h2>
      <div class="grid">
        <div class="metric"><div class="label">逻辑推理</div><div class="value">${radar.logic}</div></div>
        <div class="metric"><div class="label">抗挫折力</div><div class="value">${radar.resilience}</div></div>
        <div class="metric"><div class="label">创造力</div><div class="value">${radar.creativity}</div></div>
        <div class="metric"><div class="label">表达力</div><div class="value">${radar.expression}</div></div>
        <div class="metric"><div class="label">协作意识</div><div class="value">${radar.collaboration}</div></div>
      </div>
    </div>

    <div class="section">
      <h2>最近任务</h2>
      ${latestTask ? `
        <div><strong>标题：</strong>${latestTask.title}</div>
        <div><strong>学科：</strong>${latestTask.subject}</div>
        <div><strong>描述：</strong>${latestTask.description}</div>
      ` : '<div>暂无任务记录</div>'}
    </div>

    <div class="section">
      <h2>最近作答</h2>
      ${latestSubmission ? `
        <div><strong>得分：</strong>${latestSubmission.score}</div>
        <div><strong>学生作答：</strong>${latestSubmission.answer}</div>
        <div><strong>AI反馈：</strong>${latestSubmission.feedback}</div>
      ` : '<div>暂无作答记录</div>'}
    </div>
  </div>
</body>
</html>
  `.trim();
}
