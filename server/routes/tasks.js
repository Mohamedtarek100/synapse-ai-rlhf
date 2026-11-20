import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get next available task in a project or general queue
router.get('/next', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_worker';
  const { projectId } = req.query;

  // Check if user is quarantined due to abuse
  const user = db.prepare('SELECT status, risk_score FROM users WHERE id = ?').get(userId);
  if (user && user.status === 'quarantined') {
    return res.status(403).json({ 
      error: 'Account Quarantined',
      message: 'تم تعليق وصولك لطوابير المهام بسبب ارتفاع مقياس الخطورة الأمنية (Risk Score). يرجى مراجعة الدعم الفني.',
      risk_score: user.risk_score
    });
  }

  let stmt;
  if (projectId) {
    stmt = db.prepare('SELECT * FROM tasks WHERE project_id = ? AND status = "available" LIMIT 1');
    const task = stmt.get(projectId);
    if (task) return res.json({ task });
  }

  // Fallback to any available task
  const task = db.prepare('SELECT * FROM tasks WHERE status = "available" LIMIT 1').get();
  res.json({ task: task || null });
});

// Submit task evaluation
router.post('/submit', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_worker';
  const { taskId, preferredModel, ratings, justification, timeSpentSeconds, riskScore } = req.body;

  const subId = 'sub_' + Date.now();
  
  // 1. Insert submission
  const insertSub = db.prepare(`
    INSERT INTO submissions (id, task_id, user_id, preferred_model, ratings_json, justification, time_spent_seconds, risk_score_at_submit, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertSub.run(
    subId, 
    taskId, 
    userId, 
    preferredModel, 
    JSON.stringify(ratings || {}), 
    justification || '', 
    timeSpentSeconds || 300, 
    riskScore || 0,
    new Date().toISOString()
  );

  // 2. Update task status to submitted
  db.prepare('UPDATE tasks SET status = "submitted", assigned_user_id = ? WHERE id = ?').run(userId, taskId);

  // 3. Compute pay (e.g. rate $48/hr * (time/3600) or minimum flat reward $12)
  const user = db.prepare('SELECT hourly_rate, balance_pending FROM users WHERE id = ?').get(userId);
  const earned = Math.max(12.0, Number(((user?.hourly_rate || 45) * (timeSpentSeconds / 3600)).toFixed(2)));

  db.prepare('UPDATE users SET balance_pending = balance_pending + ? WHERE id = ?').run(earned, userId);

  // 4. Record transaction
  db.prepare(`
    INSERT INTO transactions (id, user_id, amount, type, description, status, timestamp)
    VALUES (?, ?, ?, 'task_payout', ?, 'pending', ?)
  `).run('tx_' + Date.now(), userId, earned, `Completed task ${taskId}`, new Date().toISOString());

  res.json({ success: true, submissionId: subId, earned });
});

export default router;
