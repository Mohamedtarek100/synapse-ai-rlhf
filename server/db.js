import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'synapse.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT,
    tier TEXT,
    hourly_rate REAL,
    balance_pending REAL DEFAULT 0,
    balance_approved REAL DEFAULT 0,
    total_earned REAL DEFAULT 0,
    risk_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT,
    domain TEXT,
    description TEXT,
    hourly_rate REAL,
    status TEXT,
    required_tier TEXT,
    total_tasks INTEGER,
    completed_tasks INTEGER
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    title TEXT,
    domain TEXT,
    prompt TEXT,
    response_a TEXT,
    response_b TEXT,
    status TEXT DEFAULT 'available',
    assigned_user_id TEXT,
    created_at TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    user_id TEXT,
    preferred_model TEXT,
    ratings_json TEXT,
    justification TEXT,
    time_spent_seconds INTEGER,
    risk_score_at_submit INTEGER,
    submitted_at TEXT,
    FOREIGN KEY(task_id) REFERENCES tasks(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    submission_id TEXT,
    reviewer_id TEXT,
    rating INTEGER,
    feedback TEXT,
    status TEXT,
    reviewed_at TEXT,
    FOREIGN KEY(submission_id) REFERENCES submissions(id),
    FOREIGN KEY(reviewer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS abuse_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    task_id TEXT,
    event_type TEXT,
    risk_delta INTEGER,
    details TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    amount REAL,
    type TEXT,
    description TEXT,
    status TEXT,
    timestamp TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT,
    subject TEXT,
    category TEXT,
    priority TEXT,
    status TEXT,
    created_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ticket_messages (
    id TEXT PRIMARY KEY,
    ticket_id TEXT,
    sender_id TEXT,
    sender_role TEXT,
    message TEXT,
    timestamp TEXT,
    FOREIGN KEY(ticket_id) REFERENCES support_tickets(id)
  );
`);

// Seed Default Data if empty
const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
const userCount = countStmt.get().count;

if (userCount === 0) {
  console.log('Seeding initial enterprise database...');

  // 1. Seed Users (Roles: Worker, Reviewer, Admin, Support)
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password, name, role, tier, hourly_rate, balance_pending, balance_approved, total_earned, risk_score, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'usr_worker',
    'mohamed@synapse.ai',
    'password123',
    'محمد طارق (Senior AI Annotator)',
    'worker',
    'Tier 2 - CS & Code Specialist',
    45.0,
    180.0,
    630.0,
    1850.0,
    8,
    'active',
    new Date().toISOString()
  );

  insertUser.run(
    'usr_reviewer',
    'sarah.reviewer@synapse.ai',
    'password123',
    'سارة خليل (Quality Lead Reviewer)',
    'reviewer',
    'Tier 4 - Red Teaming Elite',
    55.0,
    90.0,
    1240.0,
    4300.0,
    2,
    'active',
    new Date().toISOString()
  );

  insertUser.run(
    'usr_admin',
    'admin@synapse.ai',
    'admin123',
    'Master Ops Admin',
    'admin',
    'System Admin',
    80.0,
    0,
    0,
    0,
    0,
    'active',
    new Date().toISOString()
  );

  insertUser.run(
    'usr_support',
    'support@synapse.ai',
    'support123',
    'مركز خدمة العملاء والدعم',
    'support',
    'Support Specialist',
    35.0,
    0,
    0,
    0,
    0,
    'active',
    new Date().toISOString()
  );

  // 2. Seed Projects (RLHF Queues)
  const insertProject = db.prepare(`
    INSERT INTO projects (id, name, domain, description, hourly_rate, status, required_tier, total_tasks, completed_tasks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertProject.run(
    'prj_codex',
    'Project Bulba: Python & C++ Multi-turn RLHF',
    'Code Generation',
    'تقييم ردود النماذج اللغوية في خوارزميات الـ Concurrency، تصحيح الـ Memory Leaks، وتحسين كفاءة الـ Big-O.',
    48.0,
    'active',
    'Tier 2 - CS & Code Specialist',
    120,
    84
  );

  insertProject.run(
    'prj_reasoning',
    'Project Dolphin: Complex Mathematical Reasoning & Formal Proofs',
    'Reasoning & Math',
    'تقييم خطوات التفكير خطوة بخطوة (Chain of Thought - CoT) في مسائل الجبر، نظرية الأعداد، والـ Discrete Math.',
    52.0,
    'active',
    'Tier 3 - Math & Reasoning',
    95,
    62
  );

  insertProject.run(
    'prj_redteam',
    'Project Chimera: Adversarial Red Teaming & Jailbreak Defense',
    'Safety & Red Teaming',
    'محاولات اختراق أمان النموذج، اختبار مقاومة الـ Prompt Injection، وتصنيف معايير Harmlessness و Bias.',
    60.0,
    'active',
    'Tier 4 - Red Teaming Elite',
    80,
    51
  );

  // 3. Seed Realistic Tasks with Side-by-Side Responses
  const insertTask = db.prepare(`
    INSERT INTO tasks (id, project_id, title, domain, prompt, response_a, response_b, status, assigned_user_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTask.run(
    'tsk_1',
    'prj_codex',
    'Thread-Safe LRU Cache with O(1) Operations in Python',
    'Code Generation',
    'Write a production-grade, thread-safe LRU Cache in Python using a doubly linked list and a hash map. Include a test suite demonstrating thread safety under high concurrency.',
    `# Model A Response
import threading
from typing import Any, Optional

class Node:
    def __init__(self, key: Any = 0, val: Any = 0):
        self.key = key
        self.val = val
        self.prev: Optional['Node'] = None
        self.next: Optional['Node'] = None

class ThreadSafeLRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {}
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head
        self.lock = threading.RLock()

    def _remove(self, node: Node):
        prev_node = node.prev
        next_node = node.next
        prev_node.next = next_node
        next_node.prev = prev_node

    def _add(self, node: Node):
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: Any) -> Any:
        with self.lock:
            if key not in self.cache:
                return -1
            node = self.cache[key]
            self._remove(node)
            self._add(node)
            return node.val

    def put(self, key: Any, val: Any) -> None:
        with self.lock:
            if key in self.cache:
                self._remove(self.cache[key])
            node = Node(key, val)
            self._add(node)
            self.cache[key] = node
            if len(self.cache) > self.cap:
                lru = self.tail.prev
                self._remove(lru)
                del self.cache[lru.key]`,
    `# Model B Response
from collections import OrderedDict
import threading

class ThreadSafeLRUCache:
    """Thread-safe LRU Cache using collections.OrderedDict and Reentrant Lock"""
    def __init__(self, capacity: int):
        if capacity <= 0:
            raise ValueError("Capacity must be positive")
        self.capacity = capacity
        self.cache = OrderedDict()
        self.lock = threading.Lock()

    def get(self, key):
        with self.lock:
            if key not in self.cache:
                return None
            self.cache.move_to_end(key)
            return self.cache[key]

    def put(self, key, value):
        with self.lock:
            if key in self.cache:
                self.cache.move_to_end(key)
            self.cache[key] = value
            if len(self.cache) > self.capacity:
                self.cache.popitem(last=False) # pop oldest`,
    'available',
    null,
    new Date().toISOString()
  );

  insertTask.run(
    'tsk_2',
    'prj_reasoning',
    'Graph Theory: Maximum Flow with Edmonds-Karp Proof',
    'Reasoning & Math',
    'Explain the termination and time complexity bound O(V * E^2) for Edmonds-Karp algorithm. Prove rigorously why the shortest augmenting path distance never decreases.',
    `Model A provides a rigorous mathematical proof using induction on the length of shortest augmenting path in the residual graph G_f. It defines d_f(s, v) as the distance from source s to vertex v in G_f using breadth-first search and shows by contradiction that d_{f'}(s, v) >= d_f(s, v) for all v.`,
    `Model B gives a broad conceptual overview of Edmonds-Karp with a basic pseudocode. It explains that BFS is used instead of DFS, and casually states that edges can be saturated at most V/2 times, but skips the core inductive lemma required for the formal proof.`,
    'available',
    null,
    new Date().toISOString()
  );

  // 4. Seed Support Tickets
  const insertTicket = db.prepare(`
    INSERT INTO support_tickets (id, user_id, user_name, subject, category, priority, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTicket.run(
    'tkt_101',
    'usr_worker',
    'محمد طارق',
    'اعتراض على تقييم مراجعة لمهمة خوارزميات الـ C++',
    'Unfair Review Dispute',
    'high',
    'open',
    new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  );

  const insertMsg = db.prepare(`
    INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_role, message, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertMsg.run(
    'msg_1',
    'tkt_101',
    'usr_worker',
    'worker',
    'مرحباً، تم خصم درجتين في مراجعة مهمة الـ Concurrency بدعوى عدم ذكر الـ Deadlock avoidance مع أنني شرحت الـ Resource Hierarchy بالتفصيل في السطر 45. أرجو إعادة تدقيق المهمة من قِبل Senior Auditor.',
    new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  );

  // 5. Seed Abuse Logs (Sample anti-fraud detection records)
  const insertAbuse = db.prepare(`
    INSERT INTO abuse_logs (id, user_id, task_id, event_type, risk_delta, details, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertAbuse.run(
    'ab_1',
    'usr_worker',
    'tsk_1',
    'clipboard_paste_detected',
    8,
    JSON.stringify({ pastedLength: 320, field: 'justification', detectedCadenceMs: 12 }),
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  );

  // 6. Seed Financial Transactions
  const insertTx = db.prepare(`
    INSERT INTO transactions (id, user_id, amount, type, description, status, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertTx.run('tx_1', 'usr_worker', 144.0, 'task_payout', 'Approved 3 tasks on Project Bulba', 'cleared', '2026-11-18T10:00:00Z');
  insertTx.run('tx_2', 'usr_worker', 192.0, 'task_payout', 'Approved 4 tasks on Project Dolphin', 'cleared', '2026-11-19T14:30:00Z');
  insertTx.run('tx_3', 'usr_worker', -250.0, 'withdrawal', 'Direct Transfer to Bank Account / PayPal', 'paid_out', '2026-11-19T18:00:00Z');
  insertTx.run('tx_4', 'usr_worker', 180.0, 'task_payout', 'Pending QA Review (2 tasks)', 'pending', '2026-11-20T12:00:00Z');

  console.log('Database successfully seeded with enterprise data!');
}

export default db;
