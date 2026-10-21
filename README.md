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
  - Checks authentication before parsing JSON. Compressed request bodies are rejected with `415`; send plain `application/json` (maximum `5mb` by default, configurable with `INGEST_BODY_LIMIT`).
  - Oversized payloads return `413` with `{ error: 'payload_too_large', limitBytes }`; the previous saved state is preserved.
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

- Node.js 24 LTS, version `24.22.1` or later within the 24.x line (`.nvmrc` pins the development version). npm rejects incompatible Node versions.
- npm `12.2.1` or later within 12.x. Dependency install scripts remain blocked by default; this service does not require native dependency builds.

Development reloads use Node's built-in `--watch` mode, without nodemon or its file-watching dependency tree.

The [21 October 2026 Node.js security release](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases) requires updating the runtime itself. Rebuild Docker with `docker build --pull -t ingest-backend .`, redeploy the container, and verify `node --version` inside it. Updating Node locally does not update existing containers. Rejecting compressed ingest requests is additional protection, not a replacement for the runtime update.

## Run locally

1. Copy `.env.example` to `.env` and set `BOT_TO_UI_TOKEN` and `UI_ORIGIN`.
2. Install dependencies:

```bash
npm ci
```

3. Start server:

```bash
npm run dev
```

## Environment variables

- `BOT_TO_UI_TOKEN`: shared secret checked against `x-bot-token`.
- `UI_ORIGIN`: allowed origin for browser clients.
- `PORT`: HTTP port (default `3001`).
- `INGEST_BODY_LIMIT`: maximum ingest JSON body size (default `5mb`). Weather snapshots and market order books can exceed the former `500kb` limit. If the reverse proxy also limits request bodies, configure it to allow at least the same size.

## Missing or stale dashboard data

`/state` and `/weather-links` are populated only after a successful bot `POST /ingest`. Check the bot's sync status: `413` means the payload exceeds a body size limit, `401` indicates a missing or mismatched token. Redeploy after changing `INGEST_BODY_LIMIT`, then wait for the next successful dust report to repopulate both endpoints.

The JSON files live in `data/` under the service working directory (`/data` with the supplied Dockerfile). Mount persistent storage there to retain them across container replacements. Without this volume, a new container returns `204` until the bot sends another state. `/health` exposes `has_state` and `last_state_received_at` to distinguish an empty backend from stale data.

## Example bot POST (curl)

```bash
curl -X POST https://ingest.example.com/ingest \
  -H "Content-Type: application/json" \
  -H "x-bot-token: YOUR_TOKEN" \
  --data '{"updatedAt":"2026-04-24T12:00:00Z","some":"value"}'
```
