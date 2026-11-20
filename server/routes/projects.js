import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const projects = db.prepare('SELECT * FROM projects').all();
  res.json({ projects });
});

router.post('/create', (req, res) => {
  const { name, domain, description, hourly_rate, required_tier } = req.body;
  const id = 'prj_' + Date.now();
  const stmt = db.prepare(`
    INSERT INTO projects (id, name, domain, description, hourly_rate, status, required_tier, total_tasks, completed_tasks)
    VALUES (?, ?, ?, ?, ?, 'active', ?, 50, 0)
  `);
  stmt.run(id, name, domain, description, Number(hourly_rate) || 45, required_tier || 'Tier 2 - CS & Code Specialist');
  res.json({ success: true, id });
});

export default router;
