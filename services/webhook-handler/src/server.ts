import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import webhookRouter from './routes/githubWebhook';
import reviewRouter from '../../../api/reviews';
import { verifyGitHubSignature, captureRawBody } from './middleware/hmac';
import { connectDB } from '../../../db/mongo';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb', verify: captureRawBody }));

app.use('/webhook/github', verifyGitHubSignature, webhookRouter);
app.use('/api/reviews', reviewRouter);

app.get('/health', (_req, res) => {
  const mongo = mongoose.connection.readyState === 1 ? 'up' : 'down';
  res.status(mongo === 'up' ? 200 : 503).json({ status: 'GitSentinel Webhook Handler Online', mongo });
});

// Serve the dashboard from the same origin so it can call /api/*
app.use(express.static(path.join(__dirname, '../../../frontend/gitsentinel')));

if (require.main === module) {
  connectDB().then(() =>
    app.listen(PORT, () => console.log(`GitSentinel Webhook Server running on port ${PORT}`))
  );
}
