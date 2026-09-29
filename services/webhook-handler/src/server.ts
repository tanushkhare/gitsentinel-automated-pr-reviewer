import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import webhookRouter from './routes/githubWebhook';
import { verifyGitHubSignature } from './middleware/hmac';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Mount Webhook endpoint with HMAC security
app.use('/webhook/github', verifyGitHubSignature, webhookRouter);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'GitSentinel Webhook Handler Online' });
});

app.listen(PORT, () => {
  console.log(`GitSentinel Webhook Server running on port ${PORT}`);
});
