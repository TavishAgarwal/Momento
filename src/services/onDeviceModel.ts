// ═══════════════════════════════════════════════════════════════
// MOMENTO — On-Device Preference Model
// Runs ONLY in localStorage — never sends data to server
// Tracks interaction patterns to infer user receptivity
// ═══════════════════════════════════════════════════════════════
import type { IntentState } from '../types';

const STORAGE_KEY = 'momento_intent_model';
const HEADLINE_TEMPLATES: Record<string, string[]> = {
  cold_weather_warmth: [
    'A warm pause from the cold',
    'Step inside — warmth awaits',
    'The perfect moment to warm up',
  ],
  rain_incoming: [
    'Shelter from the coming rain',
    'Duck inside before the downpour',
    'A cozy escape from the clouds',
  ],
  cozy_invitation: [
    'A quiet corner is waiting',
    'Take a moment to breathe',
    'The perfect pause in your day',
  ],
  discovery: [
    'Something local, something new',
    'Discover your neighborhood gem',
    'A hidden find, just for now',
  ],
  time_escape: [
    'Steal a moment for yourself',
    'You have time — use it well',
    'A brief escape from the routine',
  ],
  local_gem: [
    'Your neighborhood has a secret',
    'A local gem, steps away',
    'The spot the locals love',
  ],
};

interface ModelState {
  interactions: Array<{ type: string; timestamp: number }>;
  acceptRate: number;
  avgEngagementMs: number;
  preferredCategories: string[];
  lastUpdate: number;
}

class OnDeviceModel {
  private state: ModelState;

  constructor() {
    this.state = this.load();
  }

  private load(): ModelState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {
      interactions: [],
      acceptRate: 0.5,
      avgEngagementMs: 5000,
      preferredCategories: [],
      lastUpdate: Date.now(),
    };
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch { /* ignore */ }
  }

  recordInteraction(type: 'view' | 'accept' | 'dismiss' | 'expire', durationMs?: number): void {
    this.state.interactions.push({ type, timestamp: Date.now() });
    if (this.state.interactions.length > 100) {
      this.state.interactions = this.state.interactions.slice(-50);
    }

    const recent = this.state.interactions.slice(-20);
    const accepts = recent.filter(i => i.type === 'accept').length;
    this.state.acceptRate = accepts / recent.length;

    if (durationMs) {
      this.state.avgEngagementMs = Math.round(
        this.state.avgEngagementMs * 0.8 + durationMs * 0.2
      );
    }

    this.state.lastUpdate = Date.now();
    this.save();
  }

  getIntent(): IntentState {
    const receptivity = Math.min(1, Math.max(0, this.state.acceptRate + 0.3));
    const now = new Date();
    const hour = now.getHours();

    let mobility: IntentState['mobility'] = 'stationary';
    if (hour >= 7 && hour <= 9) mobility = 'transit';
    else if (hour >= 10 && hour <= 18) mobility = 'walking';
    else if (hour >= 17 && hour <= 20) mobility = 'walking';

    let freeMinutes = 15;
    if (mobility === 'transit') freeMinutes = 5;
    else if (mobility === 'walking') freeMinutes = 20;

    const state: IntentState['state'] = receptivity >= 0.7 ? 'receptive-browsing' : receptivity >= 0.4 ? 'passive' : 'busy';

    return { state, receptivity, mobility, freeMinutes };
  }

  generateHeadline(tone: string): string {
    const templates = HEADLINE_TEMPLATES[tone] || HEADLINE_TEMPLATES['cozy_invitation'];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  getModelStats() {
    return {
      totalInteractions: this.state.interactions.length,
      acceptRate: this.state.acceptRate,
      avgEngagementMs: this.state.avgEngagementMs,
      preferredCategories: this.state.preferredCategories,
      lastUpdate: this.state.lastUpdate,
    };
  }

  reset(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.load();
  }
}

export const onDeviceModel = new OnDeviceModel();
