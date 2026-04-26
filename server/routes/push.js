// ═══════════════════════════════════════════════════════════════
// MOMENTO — Push Registration Route (PWA stub)
// POST /api/push/register — stores push subscription
// ═══════════════════════════════════════════════════════════════
import { Router } from 'express';

const router = Router();
const subscriptions = new Map();

router.post('/register', (req, res) => {
  const { userId, subscription } = req.body;
  if (!userId || !subscription) {
    return res.status(400).json({ error: 'Missing userId or subscription' });
  }
  subscriptions.set(userId, subscription);
  console.log(`[Push] Registered subscription for ${userId}`);
  res.json({ success: true });
});

router.delete('/unregister', (req, res) => {
  const { userId } = req.body;
  subscriptions.delete(userId);
  res.json({ success: true });
});

router.get('/count', (_req, res) => {
  res.json({ subscriptions: subscriptions.size });
});

export { router as pushRouter };
