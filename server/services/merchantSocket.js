// ═══════════════════════════════════════════════════════════════
// MOMENTO — Merchant Socket.io Emit Helpers
// Centralised emitters so routes don't need direct io access
// ═══════════════════════════════════════════════════════════════

let ioInstance = null;

export function init(io) {
  ioInstance = io;
  console.log('[MerchantSocket] Initialised');
}

export function emitRedemption(merchantId, data) {
  if (!ioInstance) return;
  ioInstance.to(`merchant:${merchantId}`).emit('redemption', data);
  ioInstance.emit('redemption:global', { merchantId, ...data });
}

export function emitQuietPeriod(merchantId, data) {
  if (!ioInstance) return;
  ioInstance.emit('quiet-period', { merchantId, ...data });
}

export function emitOfferGenerated(merchantId, data) {
  if (!ioInstance) return;
  ioInstance.to(`merchant:${merchantId}`).emit('offer-generated', data);
  ioInstance.emit('offer:global', { merchantId, ...data });
}

export function emitPayoneUpdate(merchantId, data) {
  if (!ioInstance) return;
  ioInstance.emit('payone-update', { merchantId, ...data });
}

export function emitDashboardUpdate(merchantId, data) {
  if (!ioInstance) return;
  ioInstance.to(`merchant:${merchantId}`).emit('dashboard-update', data);
}

export function getIO() {
  return ioInstance;
}
