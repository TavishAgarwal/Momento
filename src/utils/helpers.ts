// ═══════════════════════════════════════════════════════════════
// MOMENTO — Utility Functions
// ═══════════════════════════════════════════════════════════════

export function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function getMoodGradient(mood: string): string {
  const gradients: Record<string, string> = {
    warm_amber: 'linear-gradient(135deg, #C4783A 0%, #8B4513 50%, #D4884A 100%)',
    cozy: 'linear-gradient(135deg, #8B7355 0%, #654321 50%, #A0855C 100%)',
    fresh: 'linear-gradient(135deg, #22C55E 0%, #16A34A 50%, #4ADE80 100%)',
    energetic: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #FBBF24 100%)',
    calm: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #60A5FA 100%)',
  };
  return gradients[mood] || gradients.warm_amber;
}

export function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
}
