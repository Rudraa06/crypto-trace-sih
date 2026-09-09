/**
 * api/client.js
 * ---------------------------------------------------------------------------
 * Thin fetch wrapper for the CryptoTrace backend.
 *
 * Every function returns a parsed JSON body on success and throws a typed
 * error on failure so the calling hooks can set state cleanly.
 */

import { API_BASE } from '../utils/constants.js';

/**
 * Custom error carrying the HTTP status and backend error body.
 */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {number} status
   * @param {object|null} body
   */
  constructor(message, status, body = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Internal fetch helper.
 *
 * @param {string} path   Path relative to `API_BASE`, e.g. `/api/trace/0x…`.
 * @param {object} [opts] Fetch options.
 * @returns {Promise<any>} Parsed JSON body.
 */
async function request(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 120_000);

  try {
    const headers = { ...opts.headers };
    const apiKey = import.meta.env.VITE_INTERNAL_API_KEY;
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    const response = await fetch(url, {
      signal: controller.signal,
      ...opts,
      headers,
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        body?.error?.message ?? body?.message ?? `HTTP ${response.status}`;
      throw new ApiError(message, response.status, body);
    }

    return body;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out', 0);
    }
    throw new ApiError(error.message ?? 'Network error', 0);
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Trace a wallet address to find cash-out exchanges.
 *
 * This is the Phase 3 query: `GET /api/trace/:address`.
 *
 * @param {string} address  Ethereum address (any casing).
 * @param {object} [options]
 * @param {number} [options.maxHops=15]
 * @param {number} [options.depth=3]  Only used if auto-ingest triggers.
 * @param {boolean} [options.context=true]
 * @returns {Promise<object>}
 */
export async function traceAddress(address, options = {}) {
  const params = new URLSearchParams();
  if (options.maxHops !== undefined) params.set('maxHops', options.maxHops);
  if (options.depth !== undefined) params.set('depth', options.depth);
  if (options.context !== undefined) params.set('context', options.context);

  const query = params.toString();
  const path = `/api/trace/${encodeURIComponent(address)}${query ? `?${query}` : ''}`;

  return request(path, { timeoutMs: 300_000 });
}

/**
 * Mock NCRP Complaint Ingestion.
 * Phase 7: POST /api/complaints/ingest
 * 
 * @param {object} payload
 * @param {string} payload.walletAddress
 * @param {string} payload.complaintId
 * @param {string} payload.fraudType
 * @param {number} [payload.maxHops]
 */
export async function ingestComplaint(payload) {
  return request('/api/complaints/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    timeoutMs: 300_000
  });
}

/**
 * Fetch backend health status.
 *
 * @returns {Promise<object>}
 */
export async function fetchHealth() {
  return request('/health', { timeoutMs: 5_000 });
}

/**
 * Fetch backend configuration (traversal limits, exchange registry, risk model).
 *
 * @returns {Promise<object>}
 */
export async function fetchConfig() {
  return request('/api/config', { timeoutMs: 5_000 });
}
