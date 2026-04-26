// ═══════════════════════════════════════════════════════════════
// MOMENTO — Push Notification Route
// POST /api/push/register — stores push subscription
// POST /api/push/trigger  — trigger a notification to all connected clients (demo mode)
// GET  /api/push/panel    — serves a simple HTML panel to trigger from desktop
// ═══════════════════════════════════════════════════════════════
import { Router } from 'express';

const router = Router();
const subscriptions = new Map();

// Import merchantSocket to get io instance for broadcasting
let ioInstance = null;
export function initPushIO(io) {
  ioInstance = io;
}

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

// ─── GET /api/push/clients ───────────────────────────────────
// Returns the number of currently connected Socket.io clients
router.get('/clients', (_req, res) => {
  if (ioInstance) {
    const count = ioInstance.engine?.clientsCount ?? ioInstance.sockets?.sockets?.size ?? 0;
    res.json({ clients: count });
  } else {
    res.json({ clients: 0 });
  }
});

// ─── Pending notifications queue for polling fallback ────────
let pendingNotifications = [];

// ─── POST /api/push/trigger ──────────────────────────────────
router.post('/trigger', (req, res) => {
  const { title, body, image, merchantName, discount } = req.body;

  const payload = {
    title: title || 'MOMENTO',
    body: body || `${merchantName || 'A local café'}: ${discount || 15}% off — only for the next 14 minutes`,
    icon: '/icon-192.png',
    image: image || null,
    tag: `momento-push-${Date.now()}`,
    data: {
      merchantName: merchantName || 'Nearby Merchant',
      discount: discount || 15,
      triggeredAt: Date.now(),
      isDemoTrigger: true,
    }
  };

  // Store for polling clients
  pendingNotifications.push({ ...payload, createdAt: Date.now() });
  // Keep only last 30 seconds of notifications
  const cutoff = Date.now() - 30000;
  pendingNotifications = pendingNotifications.filter(n => n.createdAt > cutoff);

  if (ioInstance) {
    ioInstance.emit('push-notification', payload);
    console.log(`[Push] ✅ Broadcast + queued notification: "${payload.body}"`);
    res.json({ success: true, payload, clients: 'broadcast' });
  } else {
    console.log(`[Push] ✅ Queued notification (no socket): "${payload.body}"`);
    res.json({ success: true, payload, clients: 'poll-only' });
  }
});

// ─── GET /api/push/poll?since=<timestamp> ────────────────────
// Mobile clients poll this every 2s to pick up notifications
router.get('/poll', (req, res) => {
  const since = parseInt(req.query.since) || (Date.now() - 5000);
  const notifications = pendingNotifications.filter(n => n.createdAt > since);
  res.json({ notifications, serverTime: Date.now() });
});

// ─── GET /api/push/panel ─────────────────────────────────────
// Serves a simple HTML control panel you open on your desktop browser
// to fire push notifications to your connected mobile phone
router.get('/panel', (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MOMENTO — Push Control Panel</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; background: #1a1a2e; color: #e0e0e0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .panel { background: #16213e; border-radius: 24px; padding: 40px; max-width: 480px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
    h1 { font-size: 24px; font-weight: 800; letter-spacing: 3px; text-align: center; margin-bottom: 8px; color: #fb923c; }
    .subtitle { text-align: center; font-size: 12px; color: #888; margin-bottom: 32px; text-transform: uppercase; letter-spacing: 2px; }
    label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 6px; margin-top: 16px; }
    input, textarea { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #2a2a4a; background: #0f1629; color: #fff; font-size: 14px; outline: none; transition: border 0.2s; }
    input:focus, textarea:focus { border-color: #fb923c; }
    textarea { resize: vertical; min-height: 80px; font-family: inherit; }
    .presets { display: flex; gap: 8px; margin: 20px 0; flex-wrap: wrap; }
    .preset { padding: 8px 16px; border-radius: 20px; border: 1px solid #333; background: transparent; color: #ccc; font-size: 12px; cursor: pointer; transition: all 0.2s; font-weight: 600; }
    .preset:hover { border-color: #fb923c; color: #fb923c; }
    .btn { display: block; width: 100%; padding: 16px; border: none; border-radius: 16px; background: linear-gradient(135deg, #fb923c, #f97316); color: #fff; font-size: 16px; font-weight: 800; cursor: pointer; margin-top: 24px; letter-spacing: 1px; text-transform: uppercase; transition: transform 0.15s, box-shadow 0.2s; }
    .btn:hover { transform: scale(1.02); box-shadow: 0 8px 24px rgba(251,146,60,0.3); }
    .btn:active { transform: scale(0.98); }
    .status { text-align: center; margin-top: 16px; font-size: 13px; min-height: 20px; }
    .status.ok { color: #10b981; }
    .status.err { color: #ef4444; }
    .divider { height: 1px; background: #2a2a4a; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="panel">
    <h1>✦ MOMENTO</h1>
    <p class="subtitle">Push Notification Control Panel</p>
    
    <p class="subtitle" style="color:#fb923c;margin-bottom:16px;">Open the app on your phone first, then fire notifications from here.</p>

    <div class="presets">
      <button class="preset" onclick="usePreset('cold')">❄️ Cold Weather</button>
      <button class="preset" onclick="usePreset('rain')">🌧️ Rain Coming</button>
      <button class="preset" onclick="usePreset('quiet')">🏪 Quiet Period</button>
      <button class="preset" onclick="usePreset('discovery')">✨ Discovery</button>
    </div>

    <label>Notification Title</label>
    <input id="title" value="MOMENTO" />

    <label>Notification Body</label>
    <textarea id="body">Cold outside? Your cappuccino is waiting. Café Müller — 20% off for the next 14 minutes.</textarea>

    <label>Merchant Name</label>
    <input id="merchant" value="Café Müller" />

    <label>Discount %</label>
    <input id="discount" type="number" value="20" min="5" max="50" />

    <button class="btn" onclick="sendPush()">🔔 Send Push to Phone</button>
    <div id="status" class="status"></div>

    <div class="divider"></div>
    <p style="text-align:center;font-size:11px;color:#555;">Notifications will appear on any device with MOMENTO open in Chrome.</p>
  </div>

  <script>
    const presets = {
      cold: { title: 'MOMENTO', body: 'Cold outside? Your cappuccino is waiting. Café Müller — 20% off for the next 14 minutes.', merchant: 'Café Müller', discount: 20 },
      rain: { title: 'MOMENTO', body: 'Rain is coming. Duck into Bäckerei Schmidt — 15% off warm pastries right now.', merchant: 'Bäckerei Schmidt', discount: 15 },
      quiet: { title: 'MOMENTO', body: 'It\\'s quiet at Biergarten am Schloss. 25% off your first round — but only for the next 12 minutes.', merchant: 'Biergarten am Schloss', discount: 25 },
      discovery: { title: 'MOMENTO', body: 'A hidden gem is 2 min away. The locals love it. 10% off to try something new.', merchant: 'Local Discovery', discount: 10 },
    };

    function usePreset(key) {
      const p = presets[key];
      document.getElementById('title').value = p.title;
      document.getElementById('body').value = p.body;
      document.getElementById('merchant').value = p.merchant;
      document.getElementById('discount').value = p.discount;
    }

    async function sendPush() {
      const status = document.getElementById('status');
      status.textContent = 'Sending...';
      status.className = 'status';
      try {
        const res = await fetch('/api/push/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: document.getElementById('title').value,
            body: document.getElementById('body').value,
            merchantName: document.getElementById('merchant').value,
            discount: parseInt(document.getElementById('discount').value),
          })
        });
        const data = await res.json();
        if (data.success) {
          status.textContent = '✅ Notification sent to phone!';
          status.className = 'status ok';
        } else {
          status.textContent = '❌ ' + (data.error || 'Failed');
          status.className = 'status err';
        }
      } catch (err) {
        status.textContent = '❌ Network error: ' + err.message;
        status.className = 'status err';
      }
    }
  </script>
</body>
</html>`);
});

export { router as pushRouter };
