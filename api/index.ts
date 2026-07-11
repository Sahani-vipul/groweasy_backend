import express from 'express';
import cors from 'cors';
import { connectDB } from '../src/lib/mongodb.js';
import { apiLimiter } from '../src/middleware/security.js';
import authRoutes from '../src/routes/auth.js';
import extractRoutes from '../src/routes/extract.js';
import leadsRoutes from '../src/routes/leads.js';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/extract', extractRoutes);
app.use('/api', leadsRoutes);

let isConnected = false;

async function ensureDB() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

export default async function handler(req: any, res: any) {
  await ensureDB();
  return app(req, res);
}
