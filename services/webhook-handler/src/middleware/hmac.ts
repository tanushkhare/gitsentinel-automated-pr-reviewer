import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const verifyGitHubSignature = (req: Request, res: Response, next: NextFunction): void => {
  const signature = req.headers['x-hub-signature-256'] as string;
  const secret = process.env.GITHUB_WEBHOOK_SECRET || 'supersecret123';

  if (!signature) {
    res.status(401).json({ error: 'Missing GitHub signature header' });
    return;
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(JSON.stringify(req.body)).digest('hex')}`;

  try {
    const signatureBuffer = Buffer.from(signature, 'utf8');
    const digestBuffer = Buffer.from(digest, 'utf8');

    if (signatureBuffer.length !== digestBuffer.length || !crypto.timingSafeEqual(signatureBuffer, digestBuffer)) {
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Signature verification failed' });
  }
};