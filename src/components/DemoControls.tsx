import { api } from '../services/api';

interface DemoControlsProps {
  merchantId: string;
}

export default function DemoControls({ merchantId }: DemoControlsProps) {
  return (
    <div className="glass-card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-[var(--momento-text-muted)] uppercase tracking-wider">
        Demo Controls
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => api.forceQuiet(merchantId)}
          className="py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors"
        >
          ⚡ Force Quiet
        </button>
        <button
          onClick={() => api.resetPayone(merchantId)}
          className="py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-400 hover:bg-blue-500/20 transition-colors"
        >
          🔄 Reset
        </button>
      </div>
    </div>
  );
}
