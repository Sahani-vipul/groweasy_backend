import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { Lead } from '../models/Lead.js';
import { ImportBatch } from '../models/ImportBatch.js';

const router = Router();

router.get('/leads', requireAuth, async (req: Request, res: Response) => {
  try {
    const search = (req.query.search as string) || '';
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 50;

    const filter: Record<string, any> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { mobile_without_country_code: { $regex: search, $options: 'i' } },
      ];
    }

    const [leads, total] = await Promise.all([
      Lead.find(filter).sort({ insertedAt: -1 }).skip(offset).limit(limit).lean(),
      Lead.countDocuments(filter),
    ]);

    res.json({ leads, total, offset, limit });
  } catch (err) {
    console.error('Fetch leads error:', err);
    res.status(500).json({ message: 'Failed to fetch leads' });
  }
});

router.get('/batches', requireAuth, async (_req: Request, res: Response) => {
  try {
    const batches = await ImportBatch.find().sort({ createdAt: -1 }).lean();
    res.json({ batches });
  } catch (err) {
    console.error('Fetch batches error:', err);
    res.status(500).json({ message: 'Failed to fetch batches' });
  }
});

export default router;
