import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/summary', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_worker';
  const user = db.prepare('SELECT balance_pending, balance_approved, total_earned, hourly_rate FROM users WHERE id = ?').get(userId);
  const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20').all(userId);
  res.json({
    wallet: user,
    transactions
  });
});

router.post('/withdraw', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_worker';
  const { amount, method, destination } = req.body;
  const numAmount = Number(amount);

  const user = db.prepare('SELECT balance_approved FROM users WHERE id = ?').get(userId);
  if (!user || user.balance_approved < numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Insufficient approved funds' });
  }

  // Deduct approved balance
  db.prepare('UPDATE users SET balance_approved = balance_approved - ? WHERE id = ?').run(numAmount, userId);

  // Add withdrawal transaction
  db.prepare(`
    INSERT INTO transactions (id, user_id, amount, type, description, status, timestamp)
    VALUES (?, ?, ?, 'withdrawal', ?, 'paid_out', ?)
  `).run('tx_' + Date.now(), userId, -numAmount, `Withdrawal to ${method} (${destination})`, new Date().toISOString());

  res.json({ success: true, message: `Withdrawal of $${numAmount.toFixed(2)} processed successfully.` });
});

export default router;
