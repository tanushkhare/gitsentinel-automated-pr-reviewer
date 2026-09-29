FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
# API:    node dist/services/webhook-handler/src/server.js
# Worker: node dist/workers/llm-reviewer/src/worker.js
CMD ["node", "dist/services/webhook-handler/src/server.js"]
