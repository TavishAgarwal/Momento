import { usePayoneFeed } from '../hooks/usePayoneFeed';

interface PayoneFeedProps {
  merchantId: string;
}

export default function PayoneFeed({ merchantId }: PayoneFeedProps) {
  const { status, isConnected } = usePayoneFeed(merchantId);

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--momento-text-muted)] uppercase tracking-wider">
          Payone Feed
        </h3>
        <div className={`flex items-center gap-1 text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          {isConnected ? 'Live' : 'Disconnected'}
        </div>
      </div>

      {status ? (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--momento-text-muted)]">Velocity</span>
            <span className="text-[var(--momento-text)] font-mono">{status.currentVelocity} txn/15min</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--momento-text-muted)]">Baseline Ratio</span>
            <span className={`font-mono ${status.ratio < 0.6 ? 'text-red-400' : 'text-green-400'}`}>
              {Math.round(status.ratio * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-[var(--momento-bg)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${status.isQuiet ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(100, status.ratio * 100)}%` }}
            />
          </div>
          {status.isQuiet && (
            <p className="text-xs text-red-400 text-center animate-pulse">⚡ Quiet Period Active</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-[var(--momento-text-muted)]">Connecting to Payone...</p>
      )}
    </div>
  );
}
