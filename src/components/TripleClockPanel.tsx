import TripleClock from './TripleClock';
import type { ClockState } from '../types';

interface TripleClockPanelProps {
  clocks: ClockState[];
  allActive: boolean;
  onGenerate?: () => void;
}

export default function TripleClockPanel({ clocks, allActive, onGenerate }: TripleClockPanelProps) {
  return (
    <div className="space-y-4">
      <TripleClock clocks={clocks} allActive={allActive} />
      {!allActive && onGenerate && (
        <button
          onClick={onGenerate}
          className="w-full py-3 glass-card glass-card-hover text-xs font-bold uppercase tracking-widest text-[var(--momento-accent)] hover:bg-[var(--momento-accent)]/10 transition-colors border-[var(--momento-border)] hover:border-[var(--momento-accent)]/50 mt-4 shadow-[0_0_15px_rgba(232,90,58,0.1)] hover:shadow-[0_0_25px_rgba(232,90,58,0.2)]"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="text-[14px]">⚡</span> Force Generate (Demo)
          </span>
        </button>
      )}
    </div>
  );
}
