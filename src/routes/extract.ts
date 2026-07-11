import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { extractRateLimiter, enforceRowLimit } from '../middleware/security.js';
import { processCSVExtract, createImportBatch } from '../services/aiMapper.js';

const router = Router();

router.post('/', requireAuth, extractRateLimiter, enforceRowLimit, async (req: Request, res: Response) => {
  try {
    const { headers, rows, fileName } = req.body;

    if (!Array.isArray(headers) || !Array.isArray(rows)) {
      res.status(400).json({ message: 'headers and rows must be arrays' });
      return;
    }

    if (headers.length === 0 || rows.length === 0) {
      res.status(400).json({ message: 'headers and rows must not be empty' });
      return;
    }

    const batch = await createImportBatch(fileName || 'uploaded.csv', rows.length, 0, 0);

    const result = await processCSVExtract(headers, rows, batch._id);

    batch.totalImported = result.summary.importedCount;
    batch.totalSkipped = result.summary.skippedCount;
    await batch.save();

    res.json(result);
  } catch (err) {
    console.error('Extract error:', err);
    const message = err instanceof Error ? err.message : 'Processing failed';
    res.status(500).json({ message });
  }
});

export default router;
