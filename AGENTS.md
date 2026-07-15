# AGENTS.md

Express backend ingest service for receiving bot state and feeding the dashboard.

## What this project is

- Minimal Node ESM Express app.
- Accepts authenticated `POST /ingest` from the bot.
- Serves `GET /state`, `GET /events`, `GET /weather-links`, and `GET /health`.
- Writes `data/state.json` and `data/weather-links.json` atomically.

## Run and dev commands

- Install dependencies: `npm install`
- Run server: `npm start`
- Run dev server with reload: `npm run dev`

## Key files

- `server.js` — app startup, routes, SSE handling, atomic file writes.
- `data/` — persistent JSON state files.

## Agent guidance

- Preserve SSE semantics for `/events`.
- Do not expose `BOT_TO_UI_TOKEN` or other secrets.
- Keep CORS configurable via `UI_ORIGIN` and protect ingest with `x-bot-token`.
- Maintain atomic writes to avoid partial state files.

## References

- `ingest-backend/README.md`
