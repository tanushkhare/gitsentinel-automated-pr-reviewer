import { Worker, Job } from 'bullmq';
import dotenv from 'dotenv';
import { connectDB } from '../../../db/mongo';
import { ReviewModel } from '../../../models/reviews.schema';

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

const startWorker = async () => {
  await connectDB();

  const worker = new Worker(
    'pr-review-queue',
    async (job: Job) => {
      const data = job.data;
      console.log(`[LLM Worker] Processing PR #${data.prNumber} for ${data.owner}/${data.repo}`);

      await ReviewModel.findOneAndUpdate(
        { repoName: data.repo, prNumber: data.prNumber },
        { owner: data.owner, headSha: data.headSha, status: 'pending' },
        { upsert: true, new: true }
      );

      const mockSummary = "Automated review completed. Code structure is clean, but check input sanitization.";
      const mockFlags = [{ ruleId: "SEC-001", severity: "MEDIUM", description: "Validate incoming parameters." }];

      await ReviewModel.findOneAndUpdate(
        { repoName: data.repo, prNumber: data.prNumber },
        { status: 'completed', reviewSummary: mockSummary, securityFlags: mockFlags }
      );

      console.log(`[LLM Worker] Successfully reviewed PR #${data.prNumber}`);
    },
    { connection: { host: REDIS_HOST, port: REDIS_PORT } }
  );

  console.log('GitSentinel LLM Reviewer Worker is running...');
};

startWorker();