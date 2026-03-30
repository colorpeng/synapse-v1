import { metrics, parentStudentLinks, submissions, tasks, users } from '../data/store.js';

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
    body {
      font-family: Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
      background: #f6f8fc;
      color: #1f2937;
      margin: 0;
      padding: 32px;
    }
    .container {
      max-width: 920px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
    }
    h1, h2 {
      margin-top: 0;
    }
    .meta {
      margin-bottom: 24px;
      color: #475569;
    }
    .section {
      margin-top: 28px;
      padding: 20px;
      border-radius: 16px;
      background: #f8fbff;
      border: 1px solid #dbeafe;
    }
    .grid {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .metric {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 14px;
    }
    .label {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 6px;
    }
    .value {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
    }
    ul {
      margin: 8px 0 0 18px;
    }
    .footer {
      margin-top: 28px;
      color: #64748b;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>星脉 Synapse 学习成果报告</h1>
    <div class="meta">
      <div><strong>学生姓名：</strong>${student.name}</div>
      <div><strong>学生邮箱：</strong>${student.email}</div>
      <div><strong>导出时间：</strong>${new Date().toLocaleString('zh-CN')}</div>
    </div>

    <div class="section">
      <h2>一、能力雷达快照</h2>
      <div class="grid">
        <div class="metric"><div class="label">逻辑推理</div><div class="value">${radar.logic}</div></div>
        <div class="metric"><div class="label">抗挫折力</div><div class="value">${radar.resilience}</div></div>
        <div class="metric"><div class="label">创造力</div><div class="value">${radar.creativity}</div></div>
        <div class="metric"><div class="label">表达力</div><div class="value">${radar.expression}</div></div>
        <div class="metric"><div class="label">协作意识</div><div class="value">${radar.collaboration}</div></div>
      </div>
    </div>

    <div class="section">
      <h2>二、最近探究任务</h2>
      ${
        latestTask
          ? `
        <div><strong>任务标题：</strong>${latestTask.title}</div>
        <div><strong>对应学科：</strong>${latestTask.subject}</div>
        <div><strong>任务描述：</strong>${latestTask.description}</div>
        <div><strong>探究问题：</strong></div>
        <ul>
          ${latestTask.questions.map((q) => `<li>${q}</li>`).join('')}
        </ul>
      `
          : `<div>暂无任务记录</div>`
      }
    </div>

    <div class="section">
      <h2>三、最近一次提交反馈</h2>
      ${
        latestSubmission
          ? `
        <div><strong>得分：</strong>${latestSubmission.score}</div>
        <div><strong>学生作答：</strong>${latestSubmission.answer}</div>
        <div><strong>AI反馈：</strong>${latestSubmission.feedback}</div>
      `
          : `<div>暂无作答记录</div>`
      }
    </div>

    <div class="footer">
      本报告由星脉 Synapse V1 自动生成，可作为项目制学习过程记录与能力成长参考材料。
    </div>
  </div>
</body>
</html>
  `.trim();
}
