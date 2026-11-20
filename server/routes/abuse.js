import express from 'express';
import db from '../db.js';

const router = express.Router();

// Record telemetry event and adjust risk score
router.post('/log', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_worker';
  const { eventType, details, taskId } = req.body;

  let riskDelta = 0;

  switch (eventType) {
    case 'clipboard_paste_detected':
      riskDelta = 12; // external text pasted into justification field
      break;
    case 'rapid_cadence_burst':
      riskDelta = 15; // inhuman typing speed > 180 wpm / macro
      break;
    case 'tab_blur_idle':
      riskDelta = 5;  // window blur / external distraction during active task
      break;
    case 'llm_suspicion_signature':
      riskDelta = 25; // detected ChatGPT / AI generated text patterns
      break;
    default:
      riskDelta = 2;
  }

  // Record into abuse_logs
  const logId = 'ab_' + Date.now();
  db.prepare(`
    INSERT INTO abuse_logs (id, user_id, task_id, event_type, risk_delta, details, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(logId, userId, taskId || 'none', eventType, riskDelta, JSON.stringify(details || {}), new Date().toISOString());

  // Update user risk score
  db.prepare('UPDATE users SET risk_score = MIN(100, risk_score + ?) WHERE id = ?').run(riskDelta, userId);

  const updatedUser = db.prepare('SELECT id, name, risk_score, status FROM users WHERE id = ?').get(userId);

  // Auto-quarantine trigger if score >= 75
  let quarantined = false;
  if (updatedUser && updatedUser.risk_score >= 75 && updatedUser.status !== 'quarantined') {
    db.prepare('UPDATE users SET status = "quarantined" WHERE id = ?').run(userId);
    quarantined = true;
  }

  res.json({
    success: true,
    riskScore: updatedUser?.risk_score || 0,
    riskDelta,
    status: quarantined ? 'quarantined' : updatedUser?.status,
    quarantined
  });
});

// Get abuse log feed and statistics
router.get('/feed', (req, res) => {
  const logs = db.prepare(`
    SELECT a.*, u.name as user_name, u.email as user_email, u.risk_score as current_user_risk, u.status as user_status
    FROM abuse_logs a
    JOIN users u ON a.user_id = u.id
    ORDER BY a.timestamp DESC
    LIMIT 50
  `).all();

  const totalLogs = db.prepare('SELECT COUNT(*) as count FROM abuse_logs').get().count;
  const quarantinedCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE status = "quarantined"').get().count;

  res.json({
    logs,
    totalLogs,
    quarantinedCount
  });
});

// Admin reset risk score / release from quarantine
router.post('/resolve-user', (req, res) => {
  const { targetUserId, newStatus, newRiskScore } = req.body;
  db.prepare('UPDATE users SET status = ?, risk_score = ? WHERE id = ?').run(newStatus || 'active', Number(newRiskScore) || 10, targetUserId);
  res.json({ success: true });
});

export default router;
