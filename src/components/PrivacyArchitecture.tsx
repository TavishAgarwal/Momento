import { locationService } from '../services/locationService';

export default function PrivacyArchitecture() {
  const location = locationService.getCurrentLocation();
  const tier = locationService.getCurrentTier();

  const tiers = [
    { level: 1, name: 'GPS', desc: 'Full coordinates', icon: '📍', networkCalls: 'Yes' },
    { level: 2, name: 'District', desc: 'Manual selection', icon: '🏘️', networkCalls: 'No' },
    { level: 3, name: 'City Only', desc: 'No inference', icon: '🏙️', networkCalls: 'Zero' },
    { level: 4, name: 'None', desc: 'Complete privacy', icon: '🔒', networkCalls: 'Zero' },
  ];

  return (
    <div className="glass-card p-4 space-y-4">
      <h3 className="text-sm font-semibold text-[var(--momento-text-muted)] uppercase tracking-wider">
        Privacy Architecture
      </h3>

      <div className="space-y-2">
        {tiers.map(t => (
          <div
            key={t.level}
            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
              tier === t.level ? 'bg-[var(--momento-accent)]/10 border border-[var(--momento-accent)]/30' : ''
            }`}
          >
            <span className="text-lg">{t.icon}</span>
            <div className="flex-1">
              <p className="text-sm text-[var(--momento-text)]">Tier {t.level}: {t.name}</p>
              <p className="text-xs text-[var(--momento-text-muted)]">{t.desc}</p>
            </div>
            <span className={`text-xs ${t.networkCalls === 'Zero' ? 'text-green-400' : 'text-yellow-400'}`}>
              Network: {t.networkCalls}
            </span>
          </div>
        ))}
      </div>

      <div className="text-xs text-[var(--momento-text-muted)] border-t border-[var(--momento-border)] pt-3">
        <p>Current: Tier {tier} · Source: {location.source}</p>
        <p className="mt-1 text-green-400">✓ Tiers 3/4: Zero network-based inference (no IP, no SSID)</p>
      </div>
    </div>
  );
}
