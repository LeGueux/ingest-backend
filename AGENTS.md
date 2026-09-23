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

## Validation

- Keep validation proportional to the change.
- Prefer syntax checks on modified JavaScript files.
- Do not start `npm start` or `npm run dev` solely for validation unless runtime behavior needs to be verified.
- Do not add or run repository-wide checks that are not defined by this project.
- Do not repeat a successful validation unless relevant code changed afterward.

## References

- `ingest-backend/README.md`
