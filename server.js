import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

/* --------------------------------------------------------------------------
 * Configuration
 * -------------------------------------------------------------------------- */
const PORT = process.env.PORT || 3001;
const BOT_TOKEN = process.env.BOT_TO_UI_TOKEN || '';
const UI_ORIGIN = process.env.UI_ORIGIN || '*';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

/* Ensure data directory exists on startup (atomic writes rely on it) */
await fs.mkdir(DATA_DIR, { recursive: true });

/* --------------------------------------------------------------------------
 * App & middleware
 * -------------------------------------------------------------------------- */
const app = express();

// Basic security headers
app.use(helmet());

// Body parser with reasonable size limit for state payloads
app.use(express.json({ limit: '500kb' }));

// HTTP access logs
app.use(morgan('combined'));

// Rate limiting for ingest endpoint to avoid accidental floods
const limiter = rateLimit({ windowMs: 60_000, max: 120 });
app.use('/ingest', limiter);

// CORS — restreint en production via la variable d'env UI_ORIGIN
app.use(cors({ origin: UI_ORIGIN }));

/* --------------------------------------------------------------------------
 * Helpers
 * -------------------------------------------------------------------------- */

/** Simple token check middleware: compare header x-bot-token with env value */
function checkBotToken(req, res, next) {
    const t = req.headers['x-bot-token'];
    if (!t || String(t) !== BOT_TOKEN) return res.sendStatus(401);
    next();
}

// SSE clients set — we store response objects and write events to them
const clients = new Set();

/** Broadcast a JSON payload to all connected SSE clients. */
function broadcast(payload) {
    const s = typeof payload === 'string' ? payload : JSON.stringify(payload);
    for (const res of clients) {
        try {
            res.write(`data: ${s}\n\n`);
        } catch (e) {
            // Ignore write errors — client cleanup happens on 'close'
        }
    }
}

/** Write the state file atomically to avoid partial writes on crash. */
async function writeStateAtomic(obj) {
    const tmp = STATE_FILE + '.tmp';
    const str = JSON.stringify(obj, null, 2);
    await fs.writeFile(tmp, str, { mode: 0o600 });
    await fs.rename(tmp, STATE_FILE);
}

/** Read current state file contents (returns null if none). */
async function readStateFile() {
    return await fs.readFile(STATE_FILE, 'utf8').catch(() => null);
}

/* --------------------------------------------------------------------------
 * Routes
 * -------------------------------------------------------------------------- */

/**
 * POST /ingest
 * Endpoint used by the bot to push the current state. Protected by a shared
 * secret header `x-bot-token`. The posted body is saved atomically and
 * immediately broadcast to any SSE subscribers.
 */
app.post('/ingest', checkBotToken, async (req, res) => {
    try {
        const payload = req.body || {};
        payload.__receivedAt = new Date().toISOString();
        await writeStateAtomic(payload);
        broadcast(payload);
        res.status(204).end();
    } catch (error) {
        console.error('Ingest failed', error);
        res.status(500).json({ error: 'failed' });
    }
});

/**
 * GET /state
 * Returns the last saved JSON state. Used by the UI on initial load.
 */
app.get('/state', async (req, res) => {
    try {
        const txt = await readStateFile();
        if (!txt) return res.status(204).json({});
        res.setHeader('Cache-Control', 'no-store');
        res.type('application/json').send(txt);
    } catch (error) {
        console.error('Read state failed', error);
        res.status(500).json({ error: 'failed' });
    }
});

/**
 * GET /events
 * Server-Sent Events endpoint. The UI subscribes to this to receive live
 * updates pushed from the bot via /ingest.
 */
app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // flushHeaders may not be available in all runtimes — optional chaining
    res.flushHeaders?.();
    // Send an initial newline to establish the stream
    res.write('\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
});

/* --------------------------------------------------------------------------
 * Start server
 * -------------------------------------------------------------------------- */
app.listen(PORT, () => {
    console.log(`Ingest backend listening on port ${PORT}`);
});
