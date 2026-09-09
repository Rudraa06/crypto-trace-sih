/**
 * routes/complaints.routes.js
 * ---------------------------------------------------------------------------
 * PHASE 7: MOCK NCRP / SAHYOG Ingestion Webhook
 * 
 * CONTEXT (Hackathon Note):
 * This endpoint is a MOCK of the SAHYOG/NCRP integration surface for SIH 2026.
 * Because real API access to India's national cybercrime platforms is restricted
 * and unavailable for the hackathon, we simulate it here. We accept a plausible
 * JSON schema representing a filed complaint, validate it, and automatically
 * trigger the CryptoTrace pipeline. 
 * 
 * In a production deployment, this would be wired to genuine webhook callbacks
 * from I4C with proper mutual TLS / JWT authentication.
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncRoute } from '../middleware/errorHandler.js';
import { isValidAddress, normalizeAddress } from '../lib/addresses.js';
import { config } from '../config/env.js';
import { fetchWalletHistory } from '../services/walletHistory.service.js';
import { ingestToGraph } from '../services/graph.service.js';
import { findCashOutPaths } from '../services/trace.service.js';
import { toForceGraph } from '../lib/forceGraph.js';
import { enrichTraceGraph } from '../services/riskEngine.service.js';
import { runInTransaction } from '../services/neo4j.service.js';
import { evaluateTrace } from '../services/alertEngine.service.js';

export const complaintsRouter = Router();

const VALID_FRAUD_TYPES = [
  "investment_scam", "task_based_fraud", "sextortion", "ransomware",
  "phishing", "darknet_transaction", "other"
];

complaintsRouter.post(
  '/ingest',
  asyncRoute(async (req, res) => {
    const {
      complaintId,
      walletAddress,
      fraudType,
      maxHops,
      chain = 'eth-mainnet'
    } = req.body;

    // 1. Validate Input
    if (!complaintId) {
      return res.status(400).json({ ok: false, error: 'Missing complaintId' });
    }
    if (typeof complaintId !== 'string' || complaintId.length > 128 || !/^[A-Za-z0-9\-]+$/.test(complaintId)) {
      return res.status(400).json({ ok: false, error: 'Invalid complaintId: must be alphanumeric/hyphens and under 128 characters' });
    }
    if (!walletAddress || !isValidAddress(walletAddress)) {
      return res.status(400).json({ ok: false, error: 'Invalid walletAddress' });
    }
    if (!fraudType || !VALID_FRAUD_TYPES.includes(fraudType)) {
      return res.status(400).json({ ok: false, error: 'Invalid or missing fraudType' });
    }

    const address = normalizeAddress(walletAddress);
    const caseId = `CASE-${uuidv4().slice(0, 8).toUpperCase()}`;

    // 2. Trigger the Trace Pipeline (Ingestion + BFS)
    const traceDepth = typeof maxHops !== 'undefined' ? parseInt(maxHops, 10) : config.defaultTraceDepth;
    const history = await fetchWalletHistory(address, traceDepth);
    const allTransactions = [...history.transactions];
    const allWallets = [...history.wallets];
    
    if (Array.isArray(history.crossChain)) {
      for (const cc of history.crossChain) {
        allTransactions.push(...(cc.transactions || []));
        allWallets.push(...(cc.wallets || []));
      }
    }
    
    if (allTransactions.length > 0) {
      await ingestToGraph(allTransactions, allWallets);
    }

    // 3. Mark the fraud type in Neo4j (so it persists with the source wallet)
    if (config.graph.enabled) {
      await runInTransaction('WRITE', async (tx) => {
        const res = await tx.run(
          `MATCH (w:Wallet {address: $address}) 
           SET w.fraudType = $fraudType
           SET w.complaintIds = CASE WHEN $complaintId IN coalesce(w.complaintIds, []) THEN coalesce(w.complaintIds, []) ELSE coalesce(w.complaintIds, []) + [$complaintId] END
           SET w.caseIds = CASE WHEN $caseId IN coalesce(w.caseIds, []) THEN coalesce(w.caseIds, []) ELSE coalesce(w.caseIds, []) + [$caseId] END
           RETURN w`,
          { address, fraudType, complaintId, caseId }
        );
        
        const downstreamAddresses = allWallets.map(w => w.address).filter(a => a !== address);
        if (downstreamAddresses.length > 0) {
          await tx.run(
            `MATCH (intermediary:Wallet)
             WHERE intermediary.address IN $addresses
               AND coalesce(intermediary.isExchange, false) = false
             SET intermediary.crossCaseIds = CASE WHEN $complaintId IN coalesce(intermediary.crossCaseIds, []) THEN coalesce(intermediary.crossCaseIds, []) ELSE coalesce(intermediary.crossCaseIds, []) + [$complaintId] END
             SET intermediary.crossCaseAlert = CASE WHEN size(intermediary.crossCaseIds) > 1 THEN true ELSE false END`,
            { addresses: downstreamAddresses, complaintId }
          );
        }
        
        return res;
      });
    }

    // 4. Run the shortestPath cash-out trace
    let traceResult = await findCashOutPaths(address, { maxHops: traceDepth });
    
    if (traceResult.found) {
      traceResult.forceGraph = enrichTraceGraph(toForceGraph(traceResult));
      evaluateTrace(traceResult, caseId);
    }

    // Pass the fraud type directly back in the payload for AI to consume
    res.json({
      ok: true,
      caseId,
      complaintId,
      fraudType,
      traceResult
    });
  })
);
