import { Worker, Job } from 'bullmq';
import dotenv from 'dotenv';
import { connectDB } from '../../../db/mongo';
import { ReviewModel } from '../../../models/reviews.schema';
import { fetchPrDiff } from './diffExtractor';
import { retrieveRules } from './ragRetriever';
import { buildMessages } from './promptBuilder';
import { validateReview } from './outputValidator';
import { callLLM } from './llmClient';
import { postReviewComment, formatComment } from '../../../services/webhook-handler/src/services/prService';

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

const startWorker = async () => {
  await connectDB();

  const worker = new Worker(
    'pr-review-queue',
    async (job: Job) => {
      const { owner, repo, prNumber, headSha, diffUrl } = job.data;
      const key = { repoName: repo, prNumber };
      console.log(`[worker] PR #${prNumber} ${owner}/${repo}`);

      await ReviewModel.findOneAndUpdate(key, { owner, headSha, status: 'pending' }, { upsert: true });

      const diff = await fetchPrDiff(diffUrl);
      const rules = retrieveRules(diff);
      const result = validateReview(await callLLM(buildMessages(diff, rules)));

      await ReviewModel.findOneAndUpdate(key, {
        status: 'completed',
        reviewSummary: result.summary,
        securityFlags: result.securityFlags,
      });

      try {
        await postReviewComment(owner, repo, prNumber, formatComment(result.summary, result.securityFlags));
      } catch (e) {
        console.warn('[worker] could not post PR comment:', (e as Error).message);
      }
    },
    { connection, concurrency: 2 }
  );

  worker.on('failed', async (job, err) => {
    console.error(`[worker] job ${job?.id} failed:`, err.message);
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      await ReviewModel.findOneAndUpdate(
        { repoName: job.data.repo, prNumber: job.data.prNumber },
        { status: 'failed' }
      );
    }
  });

  console.log('GitSentinel LLM Reviewer Worker is running...');
};

startWorker();
