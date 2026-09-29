import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ReviewModel } from '../models/reviews.schema';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { repo, status } = req.query;
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '20'), 10) || 20, 1), 100);
    const query: Record<string, unknown> = {};
    if (typeof repo === 'string') query.repoName = repo;
    if (typeof status === 'string') query.status = status;
    const reviews = await ReviewModel.find(query).sort({ createdAt: -1 }).limit(limit);
    res.status(200).json(reviews);
  } catch {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Aggregated numbers for the dashboard (must be declared before '/:id')
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [repos, byStatus, bySeverity] = await Promise.all([
      ReviewModel.distinct('repoName'),
      ReviewModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      ReviewModel.aggregate([
        { $unwind: '$securityFlags' },
        { $group: { _id: { $toUpper: '$securityFlags.severity' }, count: { $sum: 1 } } },
      ]),
    ]);
    res.status(200).json({
      repositories: repos.length,
      byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      bySeverity: Object.fromEntries(bySeverity.map((s) => [s._id, s.count])),
    });
  } catch {
    res.status(500).json({ error: 'Failed to compute stats' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ error: 'Invalid review id' });
      return;
    }
    const review = await ReviewModel.findById(req.params.id);
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    res.status(200).json(review);
  } catch {
    res.status(500).json({ error: 'Failed to fetch review details' });
  }
});

export default router;
