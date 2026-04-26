// ═══════════════════════════════════════════════════════════════
// MOMENTO — HMAC-SHA256 QR Redemption Token Generator
// Single-use tokens with timing-safe validation
// ═══════════════════════════════════════════════════════════════
import crypto from 'crypto';

const SECRET = process.env.TOKEN_SECRET || 'momento-dev-secret';
const usedTokens = new Set();

export function generateToken(payload) {
  const tokenId = crypto.randomUUID();
  const data = {
    tokenId,
    merchantId: payload.merchantId,
    offerId: payload.offerId,
    discount: payload.discount,
    createdAt: Date.now(),
    expiresAt: Date.now() + (payload.expiryMinutes || 14) * 60 * 1000,
  };

  const dataStr = JSON.stringify(data);
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(dataStr)
    .digest('hex');

  return {
    token: Buffer.from(dataStr).toString('base64'),
    signature,
    tokenId,
    expiresAt: data.expiresAt,
  };
}

export function validateToken(token, signature) {
  try {
    const dataStr = Buffer.from(token, 'base64').toString('utf-8');
    const data = JSON.parse(dataStr);

    // Check expiry
    if (Date.now() > data.expiresAt) {
      return { valid: false, reason: 'Token expired', data };
    }

    // Check single-use
    if (usedTokens.has(data.tokenId)) {
      return { valid: false, reason: 'Token already used', data };
    }

    // Timing-safe HMAC comparison
    const expectedSig = crypto
      .createHmac('sha256', SECRET)
      .update(dataStr)
      .digest('hex');

    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');

    if (sigBuffer.length !== expectedBuffer.length) {
      return { valid: false, reason: 'Invalid signature length', data };
    }

    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return { valid: false, reason: 'Invalid signature', data };
    }

    // Mark as used
    usedTokens.add(data.tokenId);

    return { valid: true, data };
  } catch (err) {
    return { valid: false, reason: 'Malformed token: ' + err.message };
  }
}

export function getUsedTokenCount() {
  return usedTokens.size;
}
