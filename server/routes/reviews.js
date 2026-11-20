import express from 'express';
import db from '../db.js';

const router = express.Router();

// List pending submissions awaiting review
router.get('/pending', (req, res) => {
  const submissions = db.prepare(`
    SELECT s.*, t.title as task_title, t.prompt, t.response_a, t.response_b, u.name as worker_name, u.email as worker_email, u.risk_score
    FROM submissions s
    JOIN tasks t ON s.task_id = t.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN reviews r ON r.submission_id = s.id
    WHERE r.id IS NULL
    ORDER BY s.submitted_at DESC
  `).all();

  res.json({ submissions });
});

// Submit QA review
router.post('/grade', (req, res) => {
  const reviewerId = req.headers['x-user-id'] || 'usr_reviewer';
  const { submissionId, rating, feedback, status } = req.body;

  const reviewId = 'rev_' + Date.now();
  db.prepare(`
    INSERT INTO reviews (id, submission_id, reviewer_id, rating, feedback, status, reviewed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(reviewId, submissionId, reviewerId, rating || 5, feedback || '', status || 'approved', new Date().toISOString());

  // Find submission and worker
  const sub = db.prepare('SELECT user_id, task_id FROM submissions WHERE id = ?').get(submissionId);
  if (sub) {
    if (status === 'approved') {
      db.prepare('UPDATE tasks SET status = "approved" WHERE id = ?').run(sub.task_id);
      // Move money from pending to approved
      const tx = db.prepare('SELECT amount FROM transactions WHERE user_id = ? AND description LIKE ? AND status = "pending" LIMIT 1')
        .get(sub.user_id, `%${sub.task_id}%`);
      const amt = tx ? tx.amount : 25.0;
      db.prepare(`
        UPDATE users 
        SET balance_pending = MAX(0, balance_pending - ?),
            balance_approved = balance_approved + ?,
            total_earned = total_earned + ?
        WHERE id = ?
      `).run(amt, amt, amt, sub.user_id);

      db.prepare('UPDATE transactions SET status = "cleared" WHERE user_id = ? AND description LIKE ?').run(sub.user_id, `%${sub.task_id}%`);
    } else {
      db.prepare('UPDATE tasks SET status = "rejected" WHERE id = ?').run(sub.task_id);
    }
  }

  res.json({ success: true, reviewId });
});

export default router;
