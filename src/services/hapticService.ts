// ═══════════════════════════════════════════════════════════════
// MOMENTO — Haptic Feedback Service
// Provides vibration patterns tied to offer lifecycle events.
// Silently no-ops if Vibration API is unavailable.
// ═══════════════════════════════════════════════════════════════

/**
 * Check if the Vibration API is available.
 */
export function isHapticAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Short pulse — new offer arrives.
 */
export function hapticOfferArrived(): void {
  if (!isHapticAvailable()) return;
  navigator.vibrate([50, 30, 50]); // two quick taps
}

/**
 * Confirmation pulse — user taps Accept.
 */
export function hapticOfferAccepted(): void {
  if (!isHapticAvailable()) return;
  navigator.vibrate([80]); // single firm tap
}

/**
 * Success pattern — QR redemption confirmed.
 */
export function hapticRedemptionSuccess(): void {
  if (!isHapticAvailable()) return;
  navigator.vibrate([40, 30, 40, 30, 80]); // three taps, last one stronger
}

/**
 * Gentle dismiss — user swipes away offer.
 */
export function hapticDismiss(): void {
  if (!isHapticAvailable()) return;
  navigator.vibrate(25); // barely perceptible
}

/**
 * Generic light tap for button interactions.
 */
export function hapticTap(): void {
  if (!isHapticAvailable()) return;
  navigator.vibrate(15);
}

/**
 * Namespace object for convenient imports.
 * Usage: import { hapticFeedback } from './hapticService';
 */
export const hapticFeedback = {
  offerArrived: hapticOfferArrived,
  accepted: hapticOfferAccepted,
  success: hapticRedemptionSuccess,
  dismiss: hapticDismiss,
  light: hapticTap,
  tap: hapticTap,
};
