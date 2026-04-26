// ═══════════════════════════════════════════════════════════════
// MOMENTO — QR Redemption Validation Route
// POST /api/redemption/validate — validates single-use QR tokens
// ═══════════════════════════════════════════════════════════════
import { Router } from 'express';
import { validateToken, getUsedTokenCount } from '../services/tokenGenerator.js';
import * as merchantSocket from '../services/merchantSocket.js';

const router = Router();

// POST /api/redemption/validate
router.post('/validate', (req, res) => {
  const { token, signature } = req.body;

  if (!token || !signature) {
    return res.status(400).json({ valid: false, reason: 'Missing token or signature' });
  }

  const result = validateToken(token, signature);

  if (result.valid) {
    // Emit redemption event to merchant dashboard
    merchantSocket.emitRedemption(result.data.merchantId, {
      offerId: result.data.offerId,
      discount: result.data.discount,
      redeemedAt: Date.now(),
      tokenId: result.data.tokenId,
    });
  }

  res.json({
    valid: result.valid,
    reason: result.reason || null,
    merchant: result.data?.merchantId || null,
    discount: result.data?.discount || null,
    redeemedAt: result.valid ? Date.now() : null,
  });
});

// GET /api/redemption/stats
router.get('/stats', (_req, res) => {
  res.json({ usedTokens: getUsedTokenCount() });
});

export { router as redemptionRouter };
