import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import projectsRoutes from './routes/projects.js';
import tasksRoutes from './routes/tasks.js';
import reviewsRoutes from './routes/reviews.js';
import abuseRoutes from './routes/abuse.js';
import earningsRoutes from './routes/earnings.js';
import supportRoutes from './routes/support.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/abuse', abuseRoutes);
app.use('/api/earnings', earningsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'SynapseAI Core Engine',
    version: '3.0.0-enterprise',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  SYNAPSE-AI ENTERPRISE RLHF PLATFORM SERVER RUNNING  `);
  console.log(`  PORT: ${PORT} | DATABASE: SQLite (Native Node.js)   `);
  console.log(`  HEALTH: http://localhost:${PORT}/api/health         `);
  console.log(`=======================================================`);
});
