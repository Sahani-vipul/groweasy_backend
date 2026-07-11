import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { connectDB } from './lib/mongodb.js';
import { apiLimiter } from './middleware/security.js';
import authRoutes from './routes/auth.js';
import extractRoutes from './routes/extract.js';
import leadsRoutes from './routes/leads.js';

const PORT = parseInt(process.env.PORT || '4000');

const app = express();

app.set('trust proxy', 1);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/extract', extractRoutes);
app.use('/api', leadsRoutes);

async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Only listen when running locally, not on Vercel
if (!process.env.VERCEL) {
  start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
} else {
  // On Vercel, connect once per cold start instead of listen()
  connectDB().catch((err) => console.error('DB connection failed:', err));
}

export default app;