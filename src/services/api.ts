// ═══════════════════════════════════════════════════════════════
// MOMENTO — API Client
// Centralised fetch wrapper for all backend calls
// Now passes live user coordinates for location-aware responses
// ═══════════════════════════════════════════════════════════════

const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `API Error: ${res.status}`);
  }

  return res.json();
}

export interface NearbyPlace {
  id: string;
  name: string;
  category: string;
  lat: number;
  lon: number;
  distance: number;
  address?: string | null;
  cuisine?: string | null;
  openingHours?: string | null;
}

export const api = {
  // Offer endpoints
  generateOffer: (body: {
    merchantId: string;
    intent?: unknown;
    district?: string;
    lat?: number;
    lon?: number;
    nearbyPlace?: NearbyPlace | null;
  }) =>
    request('/offer/generate', { method: 'POST', body: JSON.stringify(body) }),

  getFallbackOffer: () => request('/offer/fallback'),

  // Context endpoints
  evaluateContext: (body: {
    merchantId: string;
    intent?: unknown;
    lat?: number;
    lon?: number;
    city?: string;
    district?: string;
  }) =>
    request('/context/evaluate', { method: 'POST', body: JSON.stringify(body) }),

  getWeather: (lat?: number, lon?: number) => {
    const params = new URLSearchParams();
    if (lat !== undefined) params.set('lat', String(lat));
    if (lon !== undefined) params.set('lon', String(lon));
    const qs = params.toString();
    return request(`/context/weather${qs ? `?${qs}` : ''}`);
  },

  // Places endpoints (Overpass proxy)
  getNearbyPlaces: (lat: number, lon: number, radius: number = 1500) =>
    request<NearbyPlace[]>('/places/nearby', {
      method: 'POST',
      body: JSON.stringify({ lat, lon, radius }),
    }),

  // Payone endpoints
  getPayoneStatus: (merchantId: string) => request(`/payone/status/${merchantId}`),
  getAllPayoneStatus: () => request('/payone/status'),
  forceQuiet: (merchantId: string) =>
    request('/payone/force-quiet', { method: 'POST', body: JSON.stringify({ merchantId }) }),
  resetPayone: (merchantId: string) =>
    request('/payone/reset', { method: 'POST', body: JSON.stringify({ merchantId }) }),

  // Merchant endpoints
  getMerchantList: () => request('/merchant/list'),
  getMerchant: (id: string) => request(`/merchant/${id}`),
  getMerchantDashboard: (id: string) => request(`/merchant/${id}/dashboard`),
  updateMerchantRules: (id: string, rules: Record<string, unknown>) =>
    request(`/merchant/${id}/rules`, { method: 'PUT', body: JSON.stringify(rules) }),

  // Redemption endpoints
  validateRedemption: (body: { token: string; signature: string }) =>
    request('/redemption/validate', { method: 'POST', body: JSON.stringify(body) }),
  getRedemptionStats: () => request('/redemption/stats'),

  // Push endpoints
  registerPush: (body: { userId: string; subscription: unknown }) =>
    request('/push/register', { method: 'POST', body: JSON.stringify(body) }),

  // Health
  health: () => request('/health'),
};
