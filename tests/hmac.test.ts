import express from 'express';
import request from 'supertest';
import crypto from 'crypto';
import { verifyGitHubSignature, captureRawBody } from '../services/webhook-handler/src/middleware/hmac';

const build = () => {
  const app = express();
  app.use(express.json({ verify: captureRawBody }));
  app.post('/hook', verifyGitHubSignature, (_req, res) => res.json({ ok: true }));
  return app;
};
const sign = (body: string, secret: string) => 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');

describe('GitHub HMAC middleware', () => {
  beforeEach(() => { process.env.GITHUB_WEBHOOK_SECRET = 's3cret'; });

  it('accepts a valid signature (even with odd whitespace in the JSON)', async () => {
    const body = '{ "a":1,  "b": [1, 2] }';
    const res = await request(build()).post('/hook').set('Content-Type', 'application/json')
      .set('x-hub-signature-256', sign(body, 's3cret')).send(body);
    expect(res.status).toBe(200);
  });
  it('rejects a bad signature', async () => {
    const res = await request(build()).post('/hook').set('Content-Type', 'application/json')
      .set('x-hub-signature-256', sign('{}', 'wrong')).send('{}');
    expect(res.status).toBe(401);
  });
  it('rejects a missing signature', async () => {
    expect((await request(build()).post('/hook').send({})).status).toBe(401);
  });
  it('fails closed when no secret is configured', async () => {
    delete process.env.GITHUB_WEBHOOK_SECRET;
    expect((await request(build()).post('/hook').send({})).status).toBe(500);
  });
});
