/**
 * routes/trace.routes.js
 * ---------------------------------------------------------------------------
 * PHASE 3 HTTP surface - the analytical answer.
 *
 *   GET /api/trace/:address    shortestPath from the reported wallet to a CEX
 *
 * This is the endpoint the Phase 4 dashboard calls. It differs from
 * `/api/history/:address` in what it asks and where it looks: `/api/history`
 * pulls from the chain and writes to Neo4j (ingestion and diagnostics), while
 * this route reads the graph and answers "where did the money cash out".
 *
 * ---------------------------------------------------------------------------
 * WHY THIS ROUTE INGESTS ON A MISS
 * ---------------------------------------------------------------------------
 * A graph query against a wallet nobody has ingested returns nothing, and
 * "nothing" is exactly what a clean wallet returns too. An investigator pasting
 * a victim-reported address into the dashboard should not have to know that two
 * endpoints exist and that one must be called first.
 *
 * So on `WALLET_NOT_IN_GRAPH` this route runs the Phase 1 on-chain trace, writes
 * it to Neo4j, and re-queries once. Exactly once - if the wallet is still absent
 * after a successful ingest, that is a real answer (the address has no transfers
 * in the tracked asset set) and looping again would only burn RPC quota.
 *
 * `?ingest=false` turns the fallback off, which is what the smoke tests use to
 * assert the three distinct empty cases without needing a chain.
 *
 * ---------------------------------------------------------------------------
 * WHY AN EMPTY RESULT IS 200 AND NOT 404
 * ---------------------------------------------------------------------------
 * "I searched and found no route" is a successful query with a negative finding,
 * not a missing resource. A 404 would tell the dashboard's fetch layer to render
 * an error state, when the correct render is the finding itself plus the hint
 * that explains which of the three causes it was. The body carries `found: false`
 * and a `reason`, and the caller decides how to present it.
 */

import { Router } from 'express';

import { config } from '../config/env.js';
import { asyncRoute } from '../middleware/errorHandler.js';
import { validateAddressParam } from '../middleware/validateAddress.js';
import {
  findCashOutPaths,
  DEFAULT_MAX_HOPS,
  MAX_HOPS_CEILING,
  MAX_CONTEXT_EDGES,
} from '../services/trace.service.js';
import { toForceGraph } from '../lib/forceGraph.js';
import { fetchWalletHistory } from '../services/walletHistory.service.js';
import { ingestToGraph } from '../services/graph.service.js';
import { verifyGraphConnectivity } from '../services/neo4j.service.js';
import { logger } from '../lib/logger.js';
import { enrichTraceGraph } from '../services/riskEngine.service.js';
import { generateCaseBrief } from '../services/aiNarrative.service.js';
import { evaluateTrace } from '../services/alertEngine.service.js';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    // Stop retrying after 3 attempts so it doesn't spam infinitely in local dev
    if (times > 3) return null;
    return Math.min(times * 50, 2000);
  }
});
// Suppress unhandled error events so they don't spam the console when Redis is offline
redis.on('error', (err) => {
  if (err.code !== 'ECONNREFUSED') {
    logger.error('Redis error:', err);
  }
});
const TRACE_CACHE_TTL = 900; // 15 minutes

export const traceRouter = Router();

/**
 * Ceiling for the on-chain fallback fetch. Lower than `/api/history`'s 90s: the
 * user is waiting on a graph query they expected to be instant, and a fallback
 * that silently takes a minute and a half feels broken even when it works.
 */
const FALLBACK_TIMEOUT_MS = 60_000;

/**
 * Parse a boolean query parameter.
 *
 * Absent means the default. Present but unparseable is a 400 rather than a
 * silent fallback, for the same reason `?depth` is: demoing with `?ingest=flase`
 * and believing ingestion is off is worse than being told the parameter is bad.
 *
 * @param {unknown} raw
 * @param {boolean} fallback
 * @param {string} name
 */
function boolParam(raw, fallback, name) {
  if (raw === undefined || raw === '') return fallback;
  const text = String(raw).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(text)) return true;
  if (['false', '0', 'no', 'off'].includes(text)) return false;

  const error = new Error(
    `Invalid "${name}" query parameter: "${raw}". Expected true or false.`
  );
  error.statusCode = 400;
  throw error;
}

/**
 * Parse `?maxHops`.
 *
 * The service's `assertHopBound` is the real gate - it has to be, because it is
 * the value interpolated into Cypher. This is a friendlier pre-check that names
 * the parameter, so the caller gets "maxHops must be..." rather than a message
 * about an internal argument.
 *
 * @param {unknown} raw
 */
function parseMaxHops(raw) {
  if (raw === undefined || raw === '') return DEFAULT_MAX_HOPS;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_HOPS_CEILING) {
    const error = new Error(
      `Invalid "maxHops" query parameter: "${raw}". Expected an integer between 1 and ${MAX_HOPS_CEILING}.`
    );
    error.statusCode = 400;
    throw error;
  }
  return parsed;
}

/**
 * Run the Phase 1 on-chain trace and write it to Neo4j.
 *
 * Returns a report rather than throwing: a failed fallback still leaves us with
 * a legitimate answer to return (the original "not in graph" result), and that
 * answer plus an explanation of why the fallback did not help is more useful
 * than a 500.
 *
 * @param {string} address
 * @param {number} depth
 */
async function ingestFromChain(address, depth) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FALLBACK_TIMEOUT_MS);

  try {
    const history = await fetchWalletHistory(address, depth, { signal: controller.signal });
    // Cleared before ingestion so a slow-but-successful chain fetch is not
    // misreported as a timeout while the database write is still running.
    clearTimeout(timer);

    if (history.transactions.length === 0) {
      return {
        attempted: true,
        ok: true,
        wroteAnything: false,
        depth,
        reason:
          'The on-chain trace found no transfers in the tracked asset set for this address, ' +
          'so there was nothing to ingest.',
      };
    }

    const allTransactions = [...history.transactions];
    const allWallets = [...history.wallets];

    if (Array.isArray(history.crossChain)) {
      for (const cc of history.crossChain) {
        allTransactions.push(...(cc.transactions || []));
        allWallets.push(...(cc.wallets || []));
      }
    }

    const summary = await ingestToGraph(allTransactions, allWallets);
    return {
      attempted: true,
      ok: summary.ok,
      wroteAnything: summary.batchesSucceeded > 0,
      depth,
      walletsWritten: summary.walletsWritten,
      transactionsWritten: summary.transactionsWritten,
      batchesAttempted: summary.batchesAttempted,
      batchesSucceeded: summary.batchesSucceeded,
      nodesCreated: summary.nodesCreated,
      relationshipsCreated: summary.relationshipsCreated,
      durationMs: summary.durationMs,
    };
  } catch (error) {
    clearTimeout(timer);
    logger.warn('On-chain fallback for /api/trace failed', {
      address,
      message: error?.message,
    });
    return {
      attempted: true,
      ok: false,
      wroteAnything: false,
      depth,
      error: error?.message ?? String(error),
      ...(error?.hint ? { hint: error.hint } : {}),
    };
  }
}

/**
 * GET /api/trace/:address
 *
 * Query params:
 *   maxHops   1..25       (default 15) length bound on shortestPath
 *   depth     1..MAX      (default config) depth used only if the fallback runs
 *   ingest    true|false  (default true) fetch from chain when not in the graph
 *   context   true|false  (default true) include one hop of surrounding fan-out
 *   graph     true|false  (default true) include the {nodes, links} payload
 *
 * Response (200), whether or not a route was found:
 *   {
 *     ok: true,
 *     found: boolean,
 *     query: { address, addressDisplay, maxHops, includeContext },
 *     topExchange, shortestHops, paths[], contextEdges[],
 *     forceGraph: { nodes, links, legend, meta },
 *     ingestion?: { ... },     // only when the fallback ran
 *     stats, warnings[]
 *   }
 */
traceRouter.get(
  '/trace/:address',
  validateAddressParam,
  asyncRoute(async (req, res) => {
    const { address, addressDisplay, depth, depthWasClamped } = req.trace;

    const maxHops = parseMaxHops(req.query.maxHops);
    const allowIngest = boolParam(req.query.ingest, true, 'ingest');
    const includeContext = boolParam(req.query.context, true, 'context');
    const includeForceGraph = boolParam(req.query.graph, true, 'graph');

    // --- Guards, in the order a failure actually occurs -----------------------
    // Same shape as graph.routes.js: an explicitly disabled graph and an
    // unreachable one are different problems with different fixes, and both are
    // 503 with a named code rather than a stack trace.

    if (!config.graph.enabled) {
      res.status(503).json({
        ok: false,
        error: {
          code: 'GRAPH_DISABLED',
          message:
            'Path tracing reads from Neo4j, and the graph subsystem is turned off.',
          hint: 'Set GRAPH_ENABLED=true in backend/.env and restart the server.',
        },
      });
      return;
    }

    const connectivity = await verifyGraphConnectivity();
    if (!connectivity.ok) {
      res.status(503).json({
        ok: false,
        error: {
          code: 'GRAPH_UNAVAILABLE',
          message: connectivity.message ?? 'Neo4j is not reachable.',
          ...(connectivity.hint ? { hint: connectivity.hint } : {}),
          uri: connectivity.uri,
        },
      });
      return;
    }

    const cacheKey = `trace:result:${address}:${maxHops}:${includeContext}:${includeForceGraph}`;
    const cachedData = await redis.get(cacheKey).catch(() => null);

    if (cachedData) {
      logger.info('Served trace result from Redis cache', { address: addressDisplay });
      const parsedData = JSON.parse(cachedData);
      // We must append a header or similar to indicate cache hit, but adding it to the JSON body is safer.
      parsedData.cached = true;
      res.json(parsedData);
      return;
    }

    // --- Query, then ingest-and-retry once on a miss -------------------------

    const options = { maxHops, includeContext, contextLimit: MAX_CONTEXT_EDGES };

    let result = await findCashOutPaths(address, options);
    let ingestion = null;

    if (!result.found && result.reason === 'WALLET_NOT_IN_GRAPH' && allowIngest) {
      logger.info('Wallet absent from the graph; falling back to an on-chain trace', {
        address: addressDisplay,
        depth,
      });

      ingestion = await ingestFromChain(address, depth);

      // Re-query only if something was actually written. Re-running the same
      // query against an unchanged graph would just spend a round trip to
      // produce the identical answer.
      if (ingestion.ok && ingestion.wroteAnything) {
        result = await findCashOutPaths(address, options);
      }
    }

    // --- Assemble ------------------------------------------------------------

    const warnings = [...(result.warnings ?? [])];

    if (depthWasClamped) {
      warnings.push(
        `The requested depth was above the configured maximum and was clamped to ${depth}.`
      );
    }

    if (ingestion?.attempted && !ingestion.ok) {
      warnings.push(
        'This wallet was not in the graph, and the on-chain fallback that would have added it ' +
          `failed: ${ingestion.error} The result below reflects only what was already ingested.`
      );
    }

    if (ingestion?.ok && !ingestion.wroteAnything) {
      warnings.push(
        'This wallet was not in the graph, and an on-chain trace found no transfers in the ' +
          'tracked asset set (native coin and stablecoins). An address that has only ever ' +
          'moved other tokens will look empty here.'
      );
    }

    // ── Phase 4: risk engine + AI narrative ─────────────────────────────────
    // Risk enrichment runs synchronously because the forceGraph depends on it.
    // AI brief generation is async but fails open: a Gemini timeout does not
    // degrade the graph response.

    const finalForceGraph = includeForceGraph ? enrichTraceGraph(toForceGraph(result)) : null;

    // Only request an AI brief when there is something to brief about.
    let aiNarrative = null;
    if (result.found && finalForceGraph) {
      const tracePayload = {
        query: { address, addressDisplay },
        paths: result.paths,
        shortestHops: result.shortestHops,
        topExchange: result.topExchange,
        forceGraph: finalForceGraph,
      };

      const narrativeResult = await generateCaseBrief(tracePayload);
      aiNarrative = narrativeResult;

      if (!narrativeResult.ok && !narrativeResult.skipped) {
        warnings.push(
          'AI case brief generation failed; the graph result is complete and unaffected.'
        );
      }
    }

    const finalResponse = {
      ok: true,
      ...result,
      ...(finalForceGraph ? { forceGraph: finalForceGraph } : {}),
      ...(aiNarrative ? { aiNarrative } : {}),
      ...(ingestion ? { ingestion } : {}),
      warnings,
    };

    // Cache the fully enriched response
    await redis.setex(cacheKey, TRACE_CACHE_TTL, JSON.stringify(finalResponse)).catch(err => {
      logger.warn('Failed to cache trace result', { error: err.message });
    });

    res.json(finalResponse);
  })
);
