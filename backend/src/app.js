/**
 * app.js
 * ---------------------------------------------------------------------------
 * Builds and returns the configured Express application.
 *
 * Kept separate from `server.js` (which owns the listening socket and process
 * lifecycle) so tests can import the app and exercise routes in-process without
 * binding a port.
 */

import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config, redactedConfig } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler, asyncRoute } from './middleware/errorHandler.js';
import { requireApiKey } from './middleware/apiKey.js';
import { historyRouter } from './routes/history.routes.js';
import { graphRouter } from './routes/graph.routes.js';
import { traceRouter } from './routes/trace.routes.js';
import { aiRouter } from './routes/ai.routes.js';
import { complaintsRouter } from './routes/complaints.routes.js';
import { alertRouter } from './services/alertEngine.service.js';
import { checkRpcHealth } from './services/provider.js';
import { verifyGraphConnectivity } from './services/neo4j.service.js';
import { unverifiedExchanges, listKnownExchanges } from './config/knownExchanges.js';

/**
 * @returns {import('express').Express}
 */
export function createApp() {
  const app = express();

  // Behind a reverse proxy (ngrok, Cloudflare Tunnel, a demo box) this makes
  // req.ip and req.protocol reflect the original client rather than the proxy.
  app.set('trust proxy', 1);
  // No need to advertise the framework.
  app.disable('x-powered-by');

  // --- CORS ---------------------------------------------------------------
  // Note: CORS is not an authentication mechanism. It only blocks browsers.
  // See Task 1.1 / apiKey.js middleware for the actual access control.
  // The Phase 4 Vite frontend is a different origin (5173 vs 4000), so this is
  // required, not optional. An explicit allowlist rather than `*` because we
  // want the failure to be obvious if the frontend port changes.
  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header: curl, Postman, server-to-server. Always allow.
        if (!origin) return callback(null, true);
        if (config.corsOrigins.includes(origin)) return callback(null, true);

        logger.warn('Blocked cross-origin request', {
          origin,
          allowed: config.corsOrigins,
          fix: 'Add this origin to CORS_ORIGINS in backend/.env',
        });
        return callback(new Error(`Origin ${origin} is not permitted by CORS_ORIGINS`));
      },
      methods: ['GET', 'OPTIONS'],
    })
  );

  // --- Body parsing --------------------------------------------------------
  // Phase 1 is read-only, but Phase 2 will POST ingestion payloads. A small
  // limit keeps an accidental huge upload from exhausting memory.
  app.use(express.json({ limit: '1mb' }));

  // --- Rate Limiting -------------------------------------------------------
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' } }
  });

  const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Increased for demo/testing purposes
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests to expensive endpoints.' } }
  });

  app.use(globalLimiter);

  // --- Request logging -----------------------------------------------------
  // Route through our logger so output format stays consistent (and becomes JSON
  // in production alongside everything else).
  app.use(
    morgan(config.isProduction ? 'combined' : 'tiny', {
      stream: { write: (line) => logger.info(line.trimEnd()) },
      // Health checks are polled frequently and would drown the useful logs.
      skip: (req) => req.path === '/health',
    })
  );

  // --- Health --------------------------------------------------------------
  /**
   * GET /health
   *
   * Reports on both dependencies separately, and that separation is the whole
   * point. During a demo the three failure modes - my server is down, Alchemy is
   * unreachable, Neo4j is stopped - look identical from the frontend, and you do
   * not want to be working out which one it is in front of judges.
   *
   * Status is 200 only when everything the current configuration needs is up.
   * Neo4j being down while GRAPH_ENABLED=false is not a failure; Neo4j being
   * down while it is enabled is degraded, because traces will not persist.
   */
  app.get(
    '/health',
    asyncRoute(async (req, res) => {
      // Checked in parallel: two sequential timeouts would make a slow health
      // check slower than the poll interval.
      const [rpc, graph] = await Promise.all([
        checkRpcHealth(),
        config.graph.enabled
          ? verifyGraphConnectivity()
          : Promise.resolve({ ok: false, enabled: false, message: 'GRAPH_ENABLED=false' }),
      ]);

      const graphHealthy = config.graph.enabled ? graph.ok : true;
      const healthy = rpc.ok && graphHealthy;

      res.status(healthy ? 200 : 503).json({
        ok: healthy,
        service: 'cryptotrace-backend',
        phase: 3,
        uptimeSeconds: Math.round(process.uptime()),
        rpc,
        graph,
        exchangeRegistry: {
          active: listKnownExchanges().length,
          unverifiedPlaceholders: unverifiedExchanges.length,
          // Nudge so an unverified WazirX entry cannot be forgotten.
          ...(unverifiedExchanges.length > 0
            ? { action: 'Replace placeholder addresses in src/config/knownExchanges.js' }
            : {}),
        },
      });
    })
  );

  // --- API routes ----------------------------------------------------------
  app.use('/api', requireApiKey, historyRouter);
  app.use('/api', graphRouter);
  
  app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/trace/')) {
      const isIngestOff = ['false', '0', 'no', 'off'].includes(String(req.query.ingest).toLowerCase());
      if (!isIngestOff) {
        return requireApiKey(req, res, next);
      }
    }
    next();
  }, traceRouter);

  app.use('/api/ai', strictLimiter, requireApiKey, aiRouter);
  app.use('/api/complaints', strictLimiter, requireApiKey, complaintsRouter);
  app.use('/api', alertRouter);

  // --- Root banner ---------------------------------------------------------
  app.get('/', (req, res) => {
    res.json({
      service: 'cryptotrace-backend',
      description:
        'SIH 2026 / MHA - Real-time identification of fraud-linked cryptocurrency exchanges',
      phase: 3,
      config: redactedConfig(),
      routes: {
        health: 'GET /health',
        config: 'GET /api/config',
        history: 'GET /api/history/:address?depth=3',
        trace: 'GET /api/trace/:address?maxHops=15',
        graphStats: 'GET /api/graph/stats',
        graphSchema: 'GET /api/graph/schema',
      },
    });
  });

  // --- Error handling (must be registered last) ---------------------------
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
