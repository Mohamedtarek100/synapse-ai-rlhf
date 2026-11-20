import express from 'express';
import db from '../db.js';

const router = express.Router();

// List tickets (all for support agent, or user's tickets)
router.get('/tickets', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_worker';
  const role = req.headers['x-user-role'] || 'worker';

  let tickets;
  if (role === 'support' || role === 'admin') {
    tickets = db.prepare(`
      SELECT t.*, COUNT(m.id) as message_count
      FROM support_tickets t
      LEFT JOIN ticket_messages m ON m.ticket_id = t.id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `).all();
  } else {
    tickets = db.prepare(`
      SELECT t.*, COUNT(m.id) as message_count
      FROM support_tickets t
      LEFT JOIN ticket_messages m ON m.ticket_id = t.id
      WHERE t.user_id = ?
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `).all(userId);
  }

  res.json({ tickets });
});

// Get ticket details with messages
router.get('/tickets/:id', (req, res) => {
  const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const messages = db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY timestamp ASC').all(req.params.id);
  res.json({ ticket, messages });
});

// Create new ticket
router.post('/tickets', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_worker';
  const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId);
  const { subject, category, priority, initialMessage } = req.body;

  const ticketId = 'tkt_' + Date.now();
  db.prepare(`
    INSERT INTO support_tickets (id, user_id, user_name, subject, category, priority, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'open', ?)
  `).run(ticketId, userId, user?.name || 'Worker', subject, category || 'General Inquiry', priority || 'medium', new Date().toISOString());

  if (initialMessage) {
    db.prepare(`
      INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_role, message, timestamp)
      VALUES (?, ?, ?, 'worker', ?, ?)
    `).run('msg_' + Date.now(), ticketId, userId, initialMessage, new Date().toISOString());
  }

  res.json({ success: true, ticketId });
});

// Reply to ticket
router.post('/tickets/:id/reply', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_worker';
  const role = req.headers['x-user-role'] || 'worker';
  const { message } = req.body;

  const msgId = 'msg_' + Date.now();
  db.prepare(`
    INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_role, message, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(msgId, req.params.id, userId, role, message, new Date().toISOString());

  // Update ticket status
  if (role === 'support' || role === 'admin') {
    db.prepare('UPDATE support_tickets SET status = "in_review" WHERE id = ?').run(req.params.id);
  }

  res.json({ success: true, messageId: msgId });
});

// Resolve ticket
router.post('/tickets/:id/resolve', (req, res) => {
  db.prepare('UPDATE support_tickets SET status = "resolved" WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
