import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get current user by ID (or default worker)
router.get('/me', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_worker';
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = stmt.get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

// Switch persona / Login mock
router.post('/login', (req, res) => {
  const { role } = req.body;
  const targetId = role === 'admin' ? 'usr_admin' : role === 'reviewer' ? 'usr_reviewer' : role === 'support' ? 'usr_support' : 'usr_worker';
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = stmt.get(targetId);
  res.json({ token: `mock_jwt_${user.id}`, user });
});

// List all personas for instant switching in demo
router.get('/personas', (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, tier, hourly_rate, risk_score, status FROM users').all();
  res.json({ users });
});

export default router;
