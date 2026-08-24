# ingest-backend

Prototype Express backend to receive secure POSTs from the bot and push updates to the dashboard UI.

## Features

- Secure ingest endpoint with shared token (`x-bot-token`).
- Atomic JSON persistence to `data/state.json`.
- Realtime push to clients through SSE (`/events`).
- Weather links persistence to `data/weather-links.json` when provided in payload.
- Health endpoint for monitoring (`/health`).
- Basic protection middleware: `helmet`, CORS, and rate limit on `/ingest`.

## API

- `GET /`
  - Returns an HTML landing page from `templates/index.html` (or a minimal text fallback).

- `POST /ingest`
  - Requires header `x-bot-token` matching `BOT_TO_UI_TOKEN`.
  - Saves posted JSON payload to `data/state.json` (atomic write).
  - Adds `__receivedAt` (ISO date) to saved payload.
  - Broadcasts payload to SSE subscribers (`/events`).
  - If payload contains `weatherLinks` (array), also saves:
    - `data/weather-links.json` as `{ type, airports, updatedAt }`.

- `GET /state`
  - Returns last saved state JSON.
  - Returns `204` if no state exists yet.

- `GET /events`
  - Server-Sent Events stream for realtime updates.

- `GET /weather-links`
  - Returns last saved weather links JSON.
  - Returns `204` with empty structure if none exists yet.

- `GET /health`
  - Returns service health metadata:
    - `status`, `now`, `uptime_seconds`, `sse_clients`, `has_state`, `last_state_received_at`.

## Security notes

- Store `BOT_TO_UI_TOKEN` as a server secret.
- Restrict CORS to your UI domain via `UI_ORIGIN` in production.
- `/ingest` is rate-limited (currently 120 requests/minute).
- Do not include sensitive secrets (wallet private keys, API secrets) in posted JSON.

## Requirements

- Node.js `>=24.0.0`

## Run locally

1. Copy `.env.example` to `.env` and set `BOT_TO_UI_TOKEN` and `UI_ORIGIN`.
2. Install dependencies:

```bash
npm install --ignore-scripts
```

3. Start server:

```bash
npm run dev
```

## Environment variables

- `BOT_TO_UI_TOKEN`: shared secret checked against `x-bot-token`.
- `UI_ORIGIN`: allowed origin for browser clients.
- `PORT`: HTTP port (default `3001`).

## Example bot POST (curl)

```bash
curl -X POST https://ingest.example.com/ingest \
  -H "Content-Type: application/json" \
  -H "x-bot-token: YOUR_TOKEN" \
  --data '{"updatedAt":"2026-04-24T12:00:00Z","some":"value"}'
```