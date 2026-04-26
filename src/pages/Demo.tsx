import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import type { DemoPhase, Offer, ContextState, PayoneStatus } from '../types';
import TripleClock from '../components/TripleClock';
import OfferCard from '../components/OfferCard';
import QRRedemption from '../components/QRRedemption';

const DEMO_PHASES: DemoPhase[] = [
  { id: 1, name: 'Context Sensing', duration: 15000, subtitle: 'Phase 1: Detecting merchant quiet period via Payone transaction feed...' },
  { id: 2, name: 'Clock Alignment', duration: 15000, subtitle: 'Phase 2: All three clocks evaluating — merchant quiet, user receptive, cold weather...' },
  { id: 3, name: 'AI Generation', duration: 15000, subtitle: 'Phase 3: Generating context-aware offer with AI — zero personal data sent...' },
  { id: 4, name: 'Offer Delivery', duration: 15000, subtitle: 'Phase 4: Offer card appears with on-device headline, haptic feedback, countdown timer...' },
  { id: 5, name: 'QR Redemption', duration: 15000, subtitle: 'Phase 5: Single-use HMAC-SHA256 QR token generated for secure redemption...' },
  { id: 6, name: 'Analytics', duration: 15000, subtitle: 'Phase 6: Revenue analytics, DSV split, and merchant dashboard update...' },
];

export default function Demo() {
  const [phase, setPhase] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [context, setContext] = useState<ContextState | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [subtitle, setSubtitle] = useState('Press Start to begin the 90-second demo');
  const [showQR, setShowQR] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startDemo = async () => {
    setIsRunning(true);
    setPhase(0);
    setOffer(null);
    setContext(null);

    // Force quiet period first
    try { await api.forceQuiet('cafe-mueller'); } catch {}

    runPhase(0);
  };

  const runPhase = (idx: number) => {
    if (idx >= DEMO_PHASES.length) {
      setIsRunning(false);
      setSubtitle('Demo complete! All 6 phases demonstrated.');
      return;
    }

    const p = DEMO_PHASES[idx];
    setPhase(idx);
    setSubtitle(p.subtitle);

    // Phase-specific actions
    if (idx === 0 || idx === 1) {
      // Fetch context
      api.evaluateContext({
        merchantId: 'cafe-mueller',
        intent: { state: 'receptive-browsing', receptivity: 0.85, mobility: 'walking', freeMinutes: 20 },
      }).then(data => setContext(data as ContextState)).catch(() => {});
    }

    if (idx === 2) {
      // Generate offer
      api.generateOffer({
        merchantId: 'cafe-mueller',
        intent: { state: 'receptive-browsing', receptivity: 0.85, mobility: 'walking', freeMinutes: 20 },
      }).then(data => setOffer(data as Offer)).catch(() => {});
    }

    if (idx === 4) {
      // Auto accept offer to show QR
      setShowQR(true);
      setSubtitle('Offer auto-accepted. Generating QR code...');
    }

    intervalRef.current = setTimeout(() => runPhase(idx + 1), p.duration);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--momento-bg)] p-4 max-w-lg mx-auto">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-[var(--momento-text)]">MOMENTO Demo</h1>
          <p className="text-xs text-[var(--momento-text-muted)]">
            6-phase, 90-second automated walkthrough
          </p>
        </div>

        {/* Phase progress */}
        <div className="flex items-center gap-1">
          {DEMO_PHASES.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                i < phase ? 'bg-green-500' : i === phase && isRunning ? 'bg-[var(--momento-accent)] animate-pulse' : 'bg-[var(--momento-border)]'
              }`}
            />
          ))}
        </div>

        {/* Current phase label */}
        {isRunning && (
          <div className="text-center">
            <span className="text-xs font-medium text-[var(--momento-accent)] uppercase tracking-wider">
              {DEMO_PHASES[phase]?.name || 'Complete'}
            </span>
          </div>
        )}

        {/* Subtitle narration */}
        <div className="glass-card p-3 text-center">
          <p className="text-sm text-[var(--momento-text-muted)] italic">{subtitle}</p>
        </div>

        {/* Context display */}
        {context && (phase <= 2) && (
          <TripleClock clocks={context.clocks} allActive={context.ready} />
        )}

        {/* Offer Card */}
        {offer && phase === 3 && !showQR && (
          <OfferCard
            offer={offer}
            onAccept={() => {
              setShowQR(true);
              setSubtitle('✓ Offer accepted! QR code generated.');
            }}
            onDismiss={() => setSubtitle('Offer dismissed. Another moment is coming.')}
          />
        )}

        {/* QR Redemption */}
        {offer && showQR && phase === 4 && (
          <div className="transform scale-90">
            <QRRedemption
              offer={offer}
              onClose={() => setShowQR(false)}
            />
          </div>
        )}

        {/* Analytics */}
        {phase === 5 && (
          <div className="glass-card p-6 animate-fade-in space-y-6">
            <h3 className="text-lg font-bold text-[var(--momento-text)] text-center">Platform Revenue Split</h3>
            <div className="h-6 w-full rounded-full overflow-hidden flex shadow-inner border border-gray-700/50">
              <div className="bg-[var(--momento-accent)] h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-1000" style={{ width: '85%' }}>
                Merchant 85%
              </div>
              <div className="bg-blue-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-1000" style={{ width: '5%' }}>
                M 5%
              </div>
              <div className="bg-red-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-1000" style={{ width: '10%' }}>
                DSV 10%
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <div className="text-sm text-[var(--momento-text-muted)]">Generated Revenue</div>
                <div className="text-xl font-bold text-green-400">€ 4.25</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <div className="text-sm text-[var(--momento-text-muted)]">Data Dividend</div>
                <div className="text-xl font-bold text-blue-400">€ 0.21</div>
              </div>
            </div>
          </div>
        )}

        {/* Start / Reset */}
        <div className="text-center space-y-3">
          {!isRunning ? (
            <button
              onClick={startDemo}
              className="px-8 py-3 bg-[var(--momento-accent)] hover:bg-[var(--momento-accent-hover)] rounded-xl text-white font-semibold transition-all"
            >
              {phase > 0 ? 'Restart Demo' : '▶ Start Demo'}
            </button>
          ) : (
            <button
              onClick={() => {
                if (intervalRef.current) clearTimeout(intervalRef.current);
                setIsRunning(false);
                setSubtitle('Demo paused.');
              }}
              className="px-8 py-3 glass-card text-[var(--momento-text)] font-medium"
            >
              ⏸ Pause
            </button>
          )}
        </div>

        {/* Back to login */}
        <div className="text-center">
          <a href="/login" className="text-xs text-[var(--momento-text-muted)] hover:text-[var(--momento-accent)]">
            ← Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
