// ═══════════════════════════════════════════════════════════════
// MOMENTO — TypeScript Type Definitions
// Central schema for all frontend interfaces
// ═══════════════════════════════════════════════════════════════

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'consumer' | 'merchant';
  merchantId?: string;
}

export interface OfferParams {
  discount: number;
  featuredProduct: string;
  headlineTone: string;
  urgencyLevel: 'gentle' | 'moderate' | 'urgent';
  expiryMinutes: number;
  expiresIn?: number;
  visualMood: 'warm_amber' | 'cozy' | 'fresh' | 'energetic' | 'calm';
  colorPrimary: string;
  emotionalHook: string;
  ctaText: string;
  brandedEnding: {
    dismiss: string;
    expire: string;
  };
}

export interface GenerationMetadata {
  model: string;
  tokensUsed: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  generationTimeMs: number;
  temperature: number;
  contextSignals: number;
  isLiveGenerated: boolean;
}

export interface Offer {
  id: string;
  merchantId: string;
  merchantName: string;
  contextPrompt?: string;
  params: OfferParams;
  createdAt: number;
  expiresAt: number;
  status: 'active' | 'accepted' | 'dismissed' | 'expired';
  qrToken: string;
  qrSignature: string;
  generationMetadata: GenerationMetadata;
}

export interface ClockState {
  name: string;
  signal: string;
  value: number;
  threshold: number;
  active: boolean;
  status: 'green' | 'yellow' | 'red';
  detail: string;
  weather?: WeatherData;
}

export interface ContextState {
  ready: boolean;
  activeClocks: number;
  totalClocks: number;
  clocks: ClockState[];
  recommendation: 'GENERATE_OFFER' | 'WAIT_FOR_ALIGNMENT' | 'NOT_READY';
  evaluatedAt: number;
}

export interface WeatherData {
  temp: number;
  feelsLike: number;
  condition: string;
  description?: string;
  humidity?: number;
  windSpeed?: number;
  rainProbability: number;
  icon?: string;
  city?: string;
  source: 'live' | 'mock' | 'mock-fallback';
  fetchedAt?: number;
}

export interface PayoneStatus {
  currentVelocity: number;
  baseline: number;
  ratio: number;
  isQuiet: boolean;
  timestamp: number;
  merchantId: string;
  merchantName: string;
}

export interface MerchantDashboardData {
  merchant: {
    id: string;
    name: string;
    category: string;
    district: string;
  };
  payone: {
    currentVelocity: number;
    baseline: number;
    ratio: number;
    quietRatio: number;
    isQuiet: boolean;
    lastUpdate: number;
  };
  performance: {
    redemptionsToday: number;
    revenueToday: number;
    avgOrderValue: number;
    maxDiscountUsed: number;
  };
  dsvSplit: {
    merchantShare: number;
    platformFee: number;
    sparkassenRebate: number;
  };
  usedTokens: number;
}

export interface IntentState {
  state: 'receptive-browsing' | 'passive' | 'busy' | 'commuting';
  receptivity: number;
  mobility: 'walking' | 'stationary' | 'transit' | 'cycling';
  freeMinutes: number;
  district?: string;
}

export type LocationTier = 1 | 2 | 3 | 4;

export interface LocationData {
  tier: LocationTier;
  district?: string;
  city?: string;
  coordinates?: { lat: number; lon: number };
  source: 'gps' | 'district-only' | 'city-only' | 'none';
  accuracy?: number;
}

export interface DemoPhase {
  id: number;
  name: string;
  duration: number;
  subtitle: string;
  action?: () => Promise<void> | void;
}
