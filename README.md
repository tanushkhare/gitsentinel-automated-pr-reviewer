# GitSentinel — Automated PR Reviewer

Node.js + BullMQ + Redis + MongoDB + Llama-3 (any OpenAI-compatible endpoint) with rule-based RAG.

## Flow
GitHub webhook → HMAC check (raw body) → BullMQ queue → worker fetches diff → retrieves matching security rules → LLM review → validated JSON → MongoDB + PR comment → dashboard (`/api/reviews`).

## Run
```bash
cp .env.example .env      # set GITHUB_WEBHOOK_SECRET, LLM_* vars
docker compose up -d mongodb redis
npm install
npm run index-rules
npm start                 # API + dashboard on http://localhost:3000
npm run worker            # in a second terminal
npm test
```
Point the GitHub webhook (event: Pull requests, content type `application/json`) at `POST /webhook/github`.

## API
- `GET /health`
- `POST /webhook/github`
- `GET /api/reviews?repo=&status=&limit=`
- `GET /api/reviews/stats`
- `GET /api/reviews/:id`
