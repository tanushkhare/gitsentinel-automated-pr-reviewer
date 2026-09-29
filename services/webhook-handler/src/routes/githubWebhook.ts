import { Router, Request, Response } from 'express';
import { Queue } from 'bullmq';

const router = Router();

// Initialize BullMQ Queue connected to Redis
const reviewQueue = new Queue('pr-review-queue', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  // We only care about Pull Request events (opened, synchronize, reopened)
  if (event === 'pull_request') {
    const action = payload.action;
    if (['opened', 'synchronize', 'reopened'].includes(action)) {
      const prData = {
        action,
        prNumber: payload.pull_request.number,
        repoUrl: payload.repository.html_url,
        diffUrl: payload.pull_request.diff_url,
        cloneUrl: payload.repository.clone_url,
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        headSha: payload.pull_request.head.sha,
      };

      // Enqueue job for background LLM review worker
      await reviewQueue.add('review-pr', prData, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });

      res.status(200).json({ status: 'queued', pr: prData.prNumber });
      return;
    }
  }

  res.status(200).json({ status: 'ignored_event' });
});

export default router;