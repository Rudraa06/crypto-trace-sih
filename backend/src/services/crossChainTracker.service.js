/**
 * services/crossChainTracker.service.js
 * ---------------------------------------------------------------------------
 * MODULE 1: Zero-Cost Cross-Chain Correlation Engine
 * 
 * Tracks bridge deposits on EVM chains, caches them in a local Redis instance
 * (avoiding paid messaging queues), and reconciles them against non-EVM withdrawals
 * (e.g. Solana or Bitcoin) using public free-tier REST APIs.
 */

import { Redis } from 'ioredis';
import { runInTransaction } from './neo4j.service.js';
import { logger } from '../lib/logger.js';
import { config } from '../config/env.js';
import { createLimiter } from '../lib/concurrency.js';

// Fetch is natively available in Node > 18
const crossChainLimiter = createLimiter(config.rpcConcurrency);

// Use local Redis Docker container by default
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 50, 2000);
  }
});
redis.on('error', (err) => {
  if (err.code !== 'ECONNREFUSED') {
    logger.error('Redis error (CrossChain):', err);
  }
});

// 3600 seconds = 1 hour maximum bridge reconciliation window
const BRIDGE_CACHE_TTL = 3600; 

/**
 * 1. Cache a pending bridge deposit detected on Chain A.
 * 
 * @param {string} sourceChain - e.g., 'ETH'
 * @param {string} sourceTxHash - The transaction hash of the deposit
 * @param {string} walletAddress - The depositor
 * @param {string} bridgeProtocol - e.g., 'Thorchain'
 * @param {number} usdValue - The calculated USD value at time of deposit
 */
export async function cachePendingBridgeDeposit(sourceChain, sourceTxHash, walletAddress, bridgeProtocol, usdValue) {
  try {
    const key = `bridge:pending:${bridgeProtocol}:${sourceTxHash}`;
    const payload = JSON.stringify({
      sourceChain,
      walletAddress,
      usdValue,
      timestamp: Math.floor(Date.now() / 1000)
    });

    // Cache with TTL to prevent memory leaks and bound our temporal heuristic
    await redis.setex(key, BRIDGE_CACHE_TTL, payload);
    logger.info(`[CrossChain] Cached pending deposit: ${walletAddress} on ${bridgeProtocol} for $${usdValue}`);
  } catch (error) {
    logger.error(`[CrossChain] Redis cache error: ${error.message}`);
  }
}

/**
 * 2. Reconcile a detected withdrawal on Chain B against the pending cache.
 * Uses the temporal-value heuristic.
 * 
 * @param {string} targetChain - e.g., 'BTC' or 'SOL'
 * @param {string} targetTxHash - The withdrawal transaction hash
 * @param {string} recipientAddress - The receiving wallet on Chain B
 * @param {string} bridgeProtocol - The bridge used
 * @param {number} targetUsdValue - Calculated USD value of the withdrawal
 */
export async function reconcileCrossChainWithdrawal(targetChain, targetTxHash, recipientAddress, bridgeProtocol, targetUsdValue) {
  try {
    // Scan pending deposits for this protocol
    const keys = await redis.keys(`bridge:pending:${bridgeProtocol}:*`);
    const now = Math.floor(Date.now() / 1000);

    for (const key of keys) {
      const dataStr = await redis.get(key);
      if (!dataStr) continue;

      const deposit = JSON.parse(dataStr);
      
      // Temporal Heuristic: Must be > 0 and <= 3600s
      const timeDelta = now - deposit.timestamp;
      if (timeDelta <= 0 || timeDelta > BRIDGE_CACHE_TTL) continue;

      // Value Heuristic: 0.98 <= (V_B / V_A) <= 1.00
      // Accounting for up to 2% bridge fee slippage
      const valueRatio = targetUsdValue / deposit.usdValue;
      if (valueRatio >= 0.98 && valueRatio <= 1.00) {
        
        logger.warn(`[CrossChain] Match Found! ${deposit.walletAddress} bridged to ${recipientAddress}`);
        
        // Match found! Write to Neo4j
        const confidence = 1 - Math.abs(1 - valueRatio);
        await linkBridgedWallets(deposit.walletAddress, recipientAddress, bridgeProtocol, timeDelta, confidence, deposit.usdValue, targetUsdValue);
        
        // Remove from cache so it doesn't double-match
        await redis.del(key);
        return true;
      }
    }
    return false;
  } catch (error) {
    logger.error(`[CrossChain] Reconciliation error: ${error.message}`);
    return false;
  }
}

/**
 * 3. Write the multi-chain [BRIDGED_TO] relationship to Neo4j
 */
async function linkBridgedWallets(sourceWallet, targetWallet, bridge, timeDelta, confidence, usdIn, usdOut) {
  const query = `
    MERGE (a:Wallet {address: $sourceWallet})
    MERGE (b:Wallet {address: $targetWallet})
    MERGE (a)-[r:BRIDGED_TO {
      bridge: $bridge,
      timeDelta: $timeDelta
    }]->(b)
    SET r.confidence = $confidence,
        r.usdIn = $usdIn,
        r.usdOut = $usdOut,
        b.riskScore = CASE WHEN b.riskScore IS NULL THEN a.riskScore ELSE b.riskScore END,
        b.tags = coalesce(b.tags, []) + ['CROSS_CHAIN_FLIGHT']
  `;

  await runInTransaction('WRITE', async (tx) => {
    await tx.run(query, {
      sourceWallet,
      targetWallet,
      bridge,
      timeDelta,
      confidence,
      usdIn,
      usdOut
    });
  });
}

/**
 * Helper: Zero-cost price conversion utility using CoinGecko Free API.
 * In a real loop, you'd rate-limit this to ~10-30 req/min.
 */
export async function fetchPriceUsd(coinId = 'ethereum') {
  return crossChainLimiter(async () => {
    try {
      // Example: https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
      const data = await response.json();
      return data[coinId]?.usd || 0;
    } catch (err) {
      logger.error(`[CrossChain] Price fetch failed: ${err.message}`);
      return 0;
    }
  });
}
