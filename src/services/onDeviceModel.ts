// ═══════════════════════════════════════════════════════════════
// MOMENTO — On-Device Preference Model
// Runs ONLY in localStorage — never sends data to server
// Tracks interaction patterns to infer user receptivity
// Uses DeviceMotion API for REAL mobility detection on mobile
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
  private motionSamples: number[] = [];
  private currentMobility: IntentState['mobility'] = 'stationary';
  private motionListenerActive = false;
  private lastPageVisibility: number = Date.now();
  private sessionStartTime: number = Date.now();

  constructor() {
    this.state = this.load();
    this.startMotionDetection();
    this.trackFreeTime();
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

  // ─── REAL Device Motion Detection ──────────────────────────
  private startMotionDetection(): void {
    if (this.motionListenerActive) return;
    if (typeof window === 'undefined') return;

    // Use DeviceMotion API (available on mobile browsers)
    if ('DeviceMotionEvent' in window) {
      const handleMotion = (event: DeviceMotionEvent) => {
        const acc = event.accelerationIncludingGravity;
        if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

        // Calculate total acceleration magnitude (minus gravity ~9.8)
        const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
        const netAccel = Math.abs(magnitude - 9.81);

        this.motionSamples.push(netAccel);
        // Keep last 30 samples (~3 seconds at 100ms intervals)
        if (this.motionSamples.length > 30) {
          this.motionSamples = this.motionSamples.slice(-30);
        }

        // Classify mobility from acceleration pattern
        this.classifyMobility();
      };

      // Request permission on iOS 13+
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        (DeviceMotionEvent as any).requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              window.addEventListener('devicemotion', handleMotion);
              this.motionListenerActive = true;
            }
          })
          .catch(() => {
            // Permission denied — fallback to time-based
          });
      } else {
        window.addEventListener('devicemotion', handleMotion);
        this.motionListenerActive = true;
      }
    }
  }

  private classifyMobility(): void {
    if (this.motionSamples.length < 10) return;

    const recent = this.motionSamples.slice(-20);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const variance = recent.reduce((sum, v) => sum + (v - avg) ** 2, 0) / recent.length;

    // Classification thresholds based on accelerometer research:
    // Stationary: avg < 0.5, low variance
    // Walking: avg 0.5-3.0, moderate variance
    // Transit (vehicle): avg > 1.0, high variance with periodic peaks
    if (avg < 0.4 && variance < 0.2) {
      this.currentMobility = 'stationary';
    } else if (avg >= 0.4 && avg < 3.0 && variance < 4.0) {
      this.currentMobility = 'walking';
    } else if (avg >= 2.0 || variance >= 4.0) {
      this.currentMobility = 'transit';
    } else {
      this.currentMobility = 'walking';
    }
  }

  // ─── Free Time Estimation ─────────────────────────────────
  private estimatedFreeMinutes: number = 15;

  private trackFreeTime(): void {
    if (typeof document === 'undefined') return;

    this.sessionStartTime = Date.now();
    this.lastPageVisibility = Date.now();

    // Track page visibility — if user keeps app open, they likely have free time
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.lastPageVisibility = Date.now();
      }
    });

    // Update free time estimate every 30 seconds
    setInterval(() => {
      const sessionMinutes = (Date.now() - this.sessionStartTime) / 60000;
      const timeSinceVisible = (Date.now() - this.lastPageVisibility) / 60000;

      if (document.visibilityState !== 'visible') {
        // App in background — user is busy
        this.estimatedFreeMinutes = Math.max(5, Math.round(15 - timeSinceVisible * 2));
      } else if (sessionMinutes < 2) {
        // Just opened — assume moderate free time
        this.estimatedFreeMinutes = 15;
      } else if (sessionMinutes < 10) {
        // Browsing actively — user has free time
        this.estimatedFreeMinutes = Math.round(20 + sessionMinutes);
      } else {
        // Long session — user clearly has time
        this.estimatedFreeMinutes = Math.min(60, Math.round(25 + sessionMinutes * 0.5));
      }

      // Mobility affects free time — transit means less free time
      if (this.currentMobility === 'transit') {
        this.estimatedFreeMinutes = Math.min(this.estimatedFreeMinutes, 10);
      }
    }, 30000);
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

    // Use REAL sensor-based mobility if available, else fall back to time-based
    let mobility = this.currentMobility;
    if (!this.motionListenerActive) {
      // Fallback: time-based heuristic
      const hour = new Date().getHours();
      if (hour >= 7 && hour <= 9) mobility = 'transit';
      else if (hour >= 10 && hour <= 20) mobility = 'walking';
      else mobility = 'stationary';
    }

    // Use REAL free time estimation
    const freeMinutes = this.estimatedFreeMinutes;

    const state: IntentState['state'] = receptivity >= 0.7 ? 'receptive-browsing' : receptivity >= 0.4 ? 'passive' : 'busy';

    return { state, receptivity, mobility, freeMinutes };
  }

  /** Get the raw mobility source for UI display */
  getMobilitySource(): 'sensor' | 'estimated' {
    return this.motionListenerActive ? 'sensor' : 'estimated';
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
      mobilitySource: this.getMobilitySource(),
      currentMobility: this.currentMobility,
    };
  }

  reset(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.load();
  }
}

export const onDeviceModel = new OnDeviceModel();
