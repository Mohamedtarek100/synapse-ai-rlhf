import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/metrics', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const activeWorkers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "worker" AND status = "active"').get().count;
  const quarantinedUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE status = "quarantined"').get().count;
  const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
  const completedTasks = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = "approved"').get().count;
  const totalPaid = db.prepare('SELECT SUM(amount) as sum FROM transactions WHERE type = "withdrawal"').get().sum || 0;
  const pendingReviews = db.prepare('SELECT COUNT(*) as count FROM submissions s LEFT JOIN reviews r ON r.submission_id = s.id WHERE r.id IS NULL').get().count;

  const usersList = db.prepare('SELECT id, name, email, role, tier, hourly_rate, risk_score, status, total_earned FROM users').all();
  const recentAbuse = db.prepare(`
    SELECT a.*, u.name as user_name, u.email as user_email
    FROM abuse_logs a
    JOIN users u ON a.user_id = u.id
    ORDER BY a.timestamp DESC
    LIMIT 10
  `).all();

  res.json({
    metrics: {
      totalUsers,
      activeWorkers,
      quarantinedUsers,
      totalTasks,
      completedTasks,
      totalPaid: Math.abs(totalPaid),
      pendingReviews
    },
    usersList,
    recentAbuse
  });
});

export default router;
