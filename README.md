# ingest-backend

Prototype Express backend to receive secure POSTs from the bot and push updates to the dashboard UI.

Features
- `POST /ingest` : bot posts JSON payload with header `x-bot-token` (must match `BOT_TO_UI_TOKEN`).
- `GET /state` : returns last saved JSON state.
- `GET /events` : Server-Sent Events (SSE) stream for realtime updates.

Security notes
- Store `BOT_TO_UI_TOKEN` as a secret on server.
- Restrict CORS to your UI domain using `UI_ORIGIN`.
- Do not include sensitive secrets (wallet private keys) in the posted JSON.

Run locally

1. Copy `.env.example` to `.env` and set `BOT_TO_UI_TOKEN` and `UI_ORIGIN`.
2. Install dependencies:

```bash
npm install
```

3. Start server:

```bash
npm run dev
```

Example bot POST (curl):

```bash
curl -X POST https://ingest.example.com/ingest \
  -H "Content-Type: application/json" \
  -H "x-bot-token: YOUR_TOKEN" \
  --data '{"updatedAt":"2026-04-24T12:00:00Z","some":"value"}'
```
# ingest-backend