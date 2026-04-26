// ═══════════════════════════════════════════════════════════════
// MOMENTO — Payone Simulation Route
// GET /api/payone/simulate — SSE stream of transaction events
// GET /api/payone/status/:merchantId — current velocity snapshot
// ═══════════════════════════════════════════════════════════════
import { Router } from 'express';
import { getStatus, getAllStatuses, forceQuiet, resetMerchant } from '../services/payoneSimulator.js';
import { getMerchant, getActiveMerchants } from '../data/merchants.js';

const router = Router();

// SSE stream of Payone transaction events
router.get('/simulate', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const merchantId = req.query.merchantId || 'cafe-mueller';

  const interval = setInterval(() => {
    const status = getStatus(merchantId);
    const merchant = getMerchant(merchantId);
    if (!status || !merchant) return;

    const event = {
      merchantId,
      merchantName: merchant.name,
      currentVelocity: status.velocity,
      baseline: status.baseline,
      ratio: Math.round(status.ratio * 100) / 100,
      isQuiet: status.isQuiet,
      timestamp: Date.now(),
      transactions: status.transactions.slice(-5),
    };

    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }, 3000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// Current status snapshot
router.get('/status/:merchantId', (req, res) => {
  const status = getStatus(req.params.merchantId);
  if (!status) {
    return res.status(404).json({ error: 'Merchant not found' });
  }
  res.json(status);
});

// All merchants status
router.get('/status', (_req, res) => {
  res.json(getAllStatuses());
});

// Demo: Force quiet period
router.post('/force-quiet', (req, res) => {
  const { merchantId } = req.body;
  forceQuiet(merchantId || 'cafe-mueller');
  res.json({ success: true, message: 'Quiet period forced' });
});

// Demo: Reset merchant
router.post('/reset', (req, res) => {
  const { merchantId } = req.body;
  resetMerchant(merchantId || 'cafe-mueller');
  res.json({ success: true, message: 'Merchant reset' });
});

export { router as payoneRouter };
