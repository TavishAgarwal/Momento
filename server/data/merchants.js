// ═══════════════════════════════════════════════════════════════
// MOMENTO — Demo Merchant Seed Data
// Single source of truth for all merchant info used by services and routes
// ═══════════════════════════════════════════════════════════════

export const MERCHANTS = [
  {
    id: 'cafe-mueller',
    name: 'Café Müller',
    category: 'cafe',
    district: 'Stuttgart-Mitte',
    avgTransaction: 8.50,
    maxDiscount: 20,
    offerTypes: ['hot_drinks', 'pastries'],
    quietHours: { days: [1, 2, 3], startHour: 10, endHour: 13 },
    maxRedemptionsPerDay: 15,
    active: true,
  },
  {
    id: 'bäckerei-schmidt',
    name: 'Bäckerei Schmidt',
    category: 'bakery',
    district: 'Stuttgart-West',
    avgTransaction: 6.20,
    maxDiscount: 15,
    offerTypes: ['bread', 'pastries', 'coffee'],
    quietHours: { days: [0, 1, 4], startHour: 14, endHour: 17 },
    maxRedemptionsPerDay: 20,
    active: true,
  },
  {
    id: 'buchhandlung-berg',
    name: 'Buchhandlung am Berg',
    category: 'bookstore',
    district: 'Stuttgart-Ost',
    avgTransaction: 18.90,
    maxDiscount: 10,
    offerTypes: ['books', 'stationery', 'gifts'],
    quietHours: { days: [1, 2, 3, 4], startHour: 11, endHour: 15 },
    maxRedemptionsPerDay: 8,
    active: true,
  },
];

export function getMerchant(id) {
  return MERCHANTS.find(m => m.id === id) || null;
}

export function getActiveMerchants() {
  return MERCHANTS.filter(m => m.active);
}
