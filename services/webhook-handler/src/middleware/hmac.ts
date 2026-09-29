import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export type RawBodyRequest = Request & { rawBody?: Buffer };

/** Captures the exact bytes GitHub signed. Pass to express.json({ verify }). */
export const captureRawBody = (req: Request, _res: Response, buf: Buffer): void => {
  (req as RawBodyRequest).rawBody = buf;
};

export const verifyGitHubSignature = (req: Request, res: Response, next: NextFunction): void => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Webhook secret not configured' });
    return;
  }

  const signature = req.headers['x-hub-signature-256'];
  const raw = (req as RawBodyRequest).rawBody;
  if (typeof signature !== 'string' || !raw) {
    res.status(401).json({ error: 'Missing GitHub signature header' });
    return;
  }

  const digest = `sha256=${crypto.createHmac('sha256', secret).update(raw).digest('hex')}`;
  const a = Buffer.from(signature, 'utf8');
  const b = Buffer.from(digest, 'utf8');

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }
  next();
};
