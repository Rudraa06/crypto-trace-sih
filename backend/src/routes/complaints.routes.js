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
export const complaintJobs = new Map();
export const inMemoryCrossCaseStore = new Map(); // address -> Set<complaintId>

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
      maxHops
    } = req.body;

    // Validate Input
    if (!complaintId || !walletAddress || !fraudType) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Missing required fields: complaintId, walletAddress, fraudType'
        }
      });
    }

    if (!isValidAddress(walletAddress)) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_ADDRESS',
          message: 'walletAddress must be a valid Ethereum address'
        }
      });
    }

    const address = normalizeAddress(walletAddress);
    const caseId = `CASE-${uuidv4().slice(0, 8).toUpperCase()}`;
    const jobId = `job:complaint:${address}:${Date.now()}`;
    
    complaintJobs.set(jobId, { status: 'processing', result: null, error: null });

    // Respond immediately to the frontend
    res.status(202).json({
      ok: true,
      status: 'processing',
      jobId,
      message: 'Complaint ingestion started in the background.',
    });

    // Run the ingestion and trace processing in the background
    (async () => {
      try {
        const traceDepth = typeof maxHops !== 'undefined' ? parseInt(maxHops, 10) : config.defaultTraceDepth;
        console.log(`[ComplaintIngest] Starting background job ${jobId} for address ${address}`);

        const history = await fetchWalletHistory(address, traceDepth);
        const allTransactions = [...history.transactions];
        const allWallets = [...history.wallets];
        
        if (Array.isArray(history.crossChain)) {
          for (const cc of history.crossChain) {
            allTransactions.push(...(cc.transactions || []));
            allWallets.push(...(cc.wallets || []));
          }
        }
        
        let wroteAnything = false;
        if (allTransactions.length > 0 && config.graph.enabled) {
          await ingestToGraph(allTransactions, allWallets).catch(() => null);
          wroteAnything = true;
        }

        // Always register in inMemoryCrossCaseStore for fallback/mock mode
        const downstreamAddresses = allWallets.map(w => w.address.toLowerCase()).filter(a => a !== address.toLowerCase());
        for (const dw of downstreamAddresses) {
          if (!inMemoryCrossCaseStore.has(dw)) {
            inMemoryCrossCaseStore.set(dw, new Set());
          }
          inMemoryCrossCaseStore.get(dw).add(complaintId);
        }

        console.log('[ComplaintIngest] Step 3: Marking fraud type in Neo4j and memory');
        if (config.graph.enabled) {
          try {
            await runInTransaction('WRITE', async (tx) => {
              await tx.run(
                `MATCH (w:Wallet {address: $address}) 
                 SET w.fraudType = $fraudType
                 SET w.complaintIds = CASE WHEN $complaintId IN coalesce(w.complaintIds, []) THEN coalesce(w.complaintIds, []) ELSE coalesce(w.complaintIds, []) + [$complaintId] END
                 SET w.caseIds = CASE WHEN $caseId IN coalesce(w.caseIds, []) THEN coalesce(w.caseIds, []) ELSE coalesce(w.caseIds, []) + [$caseId] END
                 RETURN w`,
                { address, fraudType, complaintId, caseId }
              );
              
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
            });
          } catch (graphErr) {
            console.log('[ComplaintIngest] Neo4j update skipped (offline/fallback mode):', graphErr.message);
          }
        }

        console.log('[ComplaintIngest] Step 4: Running shortestPath trace');
        let traceResult = await findCashOutPaths(address, { maxHops: traceDepth });
        
        // Emulate the ingestion object expected by the frontend's EmptyState.jsx
        traceResult.ingestion = {
          attempted: true,
          ok: true,
          wroteAnything,
          depth: traceDepth
        };
        
        console.log('[ComplaintIngest] Step 4a: traceResult found:', traceResult.found);
        if (traceResult.found) {
          console.log('[ComplaintIngest] Step 4b: enriching graph');
          let finalForceGraph = await enrichTraceGraph(toForceGraph(traceResult));
          
          // Apply graph pruning if nodes exceed 500
          if (finalForceGraph && finalForceGraph.nodes.length > 500) {
            console.log(`[ComplaintIngest] Pruning massive graph from ${finalForceGraph.nodes.length} nodes`);
            const essentialNodes = new Set();
            finalForceGraph.nodes = finalForceGraph.nodes.filter(n => {
              if (n.onPath || n.isExchange) {
                essentialNodes.add(n.id);
                return true;
              }
              return false;
            });
            finalForceGraph.links = finalForceGraph.links.filter(l => 
              essentialNodes.has(typeof l.source === 'object' ? l.source.id : l.source) && 
              essentialNodes.has(typeof l.target === 'object' ? l.target.id : l.target)
            );
            console.log(`[ComplaintIngest] Graph pruned down to ${finalForceGraph.nodes.length} essential nodes`);
          }
          
          traceResult.forceGraph = finalForceGraph;
          console.log('[ComplaintIngest] Step 4c: evaluating trace');
          evaluateTrace(traceResult, caseId);
        }

        console.log(`[ComplaintIngest] Completed job ${jobId}`);
        complaintJobs.set(jobId, {
          status: 'completed',
          result: {
            ok: true,
            caseId,
            complaintId,
            fraudType,
            traceResult
          }
        });
      } catch (err) {
        console.error('[ComplaintIngest] Complaint ingestion failed:', err);
        complaintJobs.set(jobId, {
          status: 'failed',
          error: err.message || 'Complaint ingestion failed'
        });
      }
    })();
  })
);

complaintsRouter.get(
  '/status/:jobId',
  asyncRoute(async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const { jobId } = req.params;
    const job = complaintJobs.get(jobId);

    if (!job) {
      return res.status(404).json({ ok: false, error: 'Job not found' });
    }

    if (job.status === 'processing') {
      return res.json({ ok: true, status: 'processing' });
    }

    if (job.status === 'failed') {
      return res.json({ ok: false, status: 'failed', error: job.error });
    }

    return res.json({
      status: 'completed',
      ...job.result
    });
  })
);
