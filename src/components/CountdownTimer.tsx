import { useCountdown } from '../hooks/useCountdown';

interface CountdownTimerProps {
  expiresAt: number;
  onExpire?: () => void;
}

export default function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const { formatted, isExpired, progress } = useCountdown(expiresAt);

  if (isExpired) {
    onExpire?.();
    return <span className="text-red-400 text-sm font-mono">Expired</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-[var(--momento-border)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--momento-accent)] rounded-full transition-all duration-1000"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="text-sm font-mono text-[var(--momento-text)]">{formatted}</span>
    </div>
  );
}
