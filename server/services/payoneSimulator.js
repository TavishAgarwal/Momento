// ═══════════════════════════════════════════════════════════════
// MOMENTO — Payone Transaction Simulator Service
// Extracts velocity per merchant, detects quiet periods, emits SSE
// ═══════════════════════════════════════════════════════════════
import { getBaseline } from '../data/baselines.js';
import { getActiveMerchants } from '../data/merchants.js';

const state = new Map(); // merchantId → { transactions: [], velocity: 0, isQuiet: false }
let simulationInterval = null;

function initMerchant(merchantId) {
  if (!state.has(merchantId)) {
    state.set(merchantId, {
      transactions: [],
      velocity: 0,
      baseline: 0,
      ratio: 1,
      isQuiet: false,
      lastUpdate: Date.now(),
    });
  }
}

function simulateTick() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  for (const merchant of getActiveMerchants()) {
    initMerchant(merchant.id);
    const s = state.get(merchant.id);
    const baseline = getBaseline(merchant.id, day, hour);
    s.baseline = baseline;

    // Simulate transactions: random count influenced by time
    // In demo mode, we reduce this to trigger quiet periods
    const jitter = Math.random();
    const simulated = Math.max(0, Math.floor(baseline * jitter * 0.7));

    s.transactions.push({ count: simulated, time: Date.now() });
    if (s.transactions.length > 12) s.transactions.shift(); // keep 12 windows (3 min)

    const recent = s.transactions.slice(-4);
    const avgRecent = recent.reduce((sum, t) => sum + t.count, 0) / recent.length;
    s.velocity = Math.round(avgRecent);
    s.ratio = baseline > 0 ? avgRecent / baseline : 1;
    s.isQuiet = s.ratio < 0.6; // below 60% = quiet period
    s.lastUpdate = Date.now();
  }
}

export function startSimulation(intervalMs = 5000) {
  if (simulationInterval) return;
  for (const m of getActiveMerchants()) initMerchant(m.id);
  simulationInterval = setInterval(simulateTick, intervalMs);
  simulateTick(); // immediate first tick
  console.log('[Payone Simulator] Started');
}

export function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

export function getStatus(merchantId) {
  initMerchant(merchantId);
  return state.get(merchantId);
}

export function getAllStatuses() {
  const result = {};
  for (const [id, s] of state) {
    result[id] = { ...s, transactions: [...s.transactions] };
  }
  return result;
}

export function forceQuiet(merchantId) {
  initMerchant(merchantId);
  const s = state.get(merchantId);
  s.velocity = 1;
  s.ratio = 0.08;
  s.isQuiet = true;
  s.transactions = [{ count: 1, time: Date.now() }];
  s.lastUpdate = Date.now();
}

export function resetMerchant(merchantId) {
  state.delete(merchantId);
  initMerchant(merchantId);
}

// Auto-start on import
startSimulation();
