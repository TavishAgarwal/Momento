// ═══════════════════════════════════════════════════════════════
// MOMENTO — Merchant Management Route
// CRUD for merchant rules + dashboard data aggregation
// ═══════════════════════════════════════════════════════════════
import { Router } from 'express';
import { getMerchant, getActiveMerchants, MERCHANTS } from '../data/merchants.js';
import { getStatus, getAllStatuses } from '../services/payoneSimulator.js';
import { getUsedTokenCount } from '../services/tokenGenerator.js';

const router = Router();

// GET /api/merchant/list — all active merchants
router.get('/list', (_req, res) => {
  res.json(getActiveMerchants());
});

// GET /api/merchant/:id — single merchant
router.get('/:id', (req, res) => {
  const merchant = getMerchant(req.params.id);
  if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

  const status = getStatus(merchant.id);
  res.json({ ...merchant, payoneStatus: status });
});

// PUT /api/merchant/:id/rules — update merchant rules
router.put('/:id/rules', (req, res) => {
  const merchant = getMerchant(req.params.id);
  if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

  const { maxDiscount, maxRedemptionsPerDay, offerTypes, quietHours, active } = req.body;
  if (maxDiscount !== undefined) merchant.maxDiscount = Math.min(50, Math.max(5, maxDiscount));
  if (maxRedemptionsPerDay !== undefined) merchant.maxRedemptionsPerDay = maxRedemptionsPerDay;
  if (offerTypes !== undefined) merchant.offerTypes = offerTypes;
  if (quietHours !== undefined) merchant.quietHours = quietHours;
  if (active !== undefined) merchant.active = active;

  res.json({ success: true, merchant });
});

// GET /api/merchant/:id/dashboard — aggregated dashboard data
router.get('/:id/dashboard', (req, res) => {
  const merchant = getMerchant(req.params.id);
  if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

  const status = getStatus(merchant.id);
  const allStatuses = getAllStatuses();

  const quietRatio = 1 - status.ratio;
  const avgTransaction = merchant.avgTransaction;
  const simulatedRedemptions = Math.floor(Math.random() * 5 + 3);
  const simulatedRevenue = simulatedRedemptions * avgTransaction * (1 - merchant.maxDiscount / 100);

  res.json({
    merchant: {
      id: merchant.id,
      name: merchant.name,
      category: merchant.category,
      district: merchant.district,
    },
    payone: {
      currentVelocity: status.velocity,
      baseline: status.baseline,
      ratio: status.ratio,
      quietRatio: quietRatio,
      isQuiet: status.isQuiet,
      lastUpdate: status.lastUpdate,
    },
    performance: {
      redemptionsToday: simulatedRedemptions,
      revenueToday: Math.round(simulatedRevenue * 100) / 100,
      avgOrderValue: avgTransaction,
      maxDiscountUsed: merchant.maxDiscount,
    },
    dsvSplit: {
      merchantShare: 0.85,
      platformFee: 0.10,
      sparkassenRebate: 0.05,
    },
    usedTokens: getUsedTokenCount(),
  });
});

export { router as merchantRouter };
