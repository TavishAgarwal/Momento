// ═══════════════════════════════════════════════════════════════
// MOMENTO — Demo Command Panel (⌘+D)
// Global overlay for triggering push notifications to all
// connected devices during live demo recording.
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from 'react';

interface Preset {
  label: string;
  emoji: string;
  title: string;
  body: string;
  merchant: string;
  discount: number;
}

const PRESETS: Preset[] = [
  {
    label: 'Cold Weather',
    emoji: '❄️',
    title: 'MOMENTO',
    body: 'Cold outside? Your cappuccino is waiting. Café Müller — 20% off for the next 14 minutes.',
    merchant: 'Café Müller',
    discount: 20,
  },
  {
    label: 'Rain Coming',
    emoji: '🌧️',
    title: 'MOMENTO',
    body: 'Rain is coming. Duck into Bäckerei Schmidt — 15% off warm pastries right now.',
    merchant: 'Bäckerei Schmidt',
    discount: 15,
  },
  {
    label: 'Quiet Period',
    emoji: '🏪',
    title: 'MOMENTO',
    body: "It's quiet at Biergarten am Schloss. 25% off your first round — but only for the next 12 minutes.",
    merchant: 'Biergarten am Schloss',
    discount: 25,
  },
  {
    label: 'Discovery',
    emoji: '✨',
    title: 'MOMENTO',
    body: 'A hidden gem is 2 min away. The locals love it. 10% off to try something new.',
    merchant: 'Local Discovery',
    discount: 10,
  },
  {
    label: 'Lunch Rush',
    emoji: '🍽️',
    title: 'MOMENTO',
    body: 'Beat the lunch rush — Trattoria Roma has 3 empty tables right now. 12% off any main.',
    merchant: 'Trattoria Roma',
    discount: 12,
  },
  {
    label: 'Evening Walk',
    emoji: '🌆',
    title: 'MOMENTO',
    body: 'Beautiful evening? Walk 90 seconds to Eiscafé Venezia — 18% off gelato until sunset.',
    merchant: 'Eiscafé Venezia',
    discount: 18,
  },
];

export default function DemoCommandPanel() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('MOMENTO');
  const [body, setBody] = useState('');
  const [merchant, setMerchant] = useState('Café Müller');
  const [discount, setDiscount] = useState(20);
  const [status, setStatus] = useState<{ type: 'idle' | 'sending' | 'ok' | 'err'; msg: string }>({
    type: 'idle',
    msg: '',
  });
  const [connectedClients, setConnectedClients] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Poll connected client count while panel is open
  useEffect(() => {
    if (!open) return;
    const fetchCount = async () => {
      try {
        const res = await fetch(`/api/push/clients`);
        const data = await res.json();
        setConnectedClients(data.clients ?? null);
      } catch {
        setConnectedClients(null);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 3000);
    return () => clearInterval(interval);
  }, [open]);

  // ─── Keyboard shortcut: ⌘+D / Ctrl+D ─────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      // Escape closes
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    },
    [open]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  };

  // Apply preset
  const applyPreset = (preset: Preset) => {
    setTitle(preset.title);
    setBody(preset.body);
    setMerchant(preset.merchant);
    setDiscount(preset.discount);
    setStatus({ type: 'idle', msg: '' });
  };

  // Fire notification
  const sendNotification = async () => {
    if (!body.trim()) {
      setStatus({ type: 'err', msg: 'Please enter a notification body.' });
      return;
    }
    setStatus({ type: 'sending', msg: 'Broadcasting...' });
    try {
      const res = await fetch(`/api/push/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          merchantName: merchant,
          discount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'ok', msg: `✅ Sent to all connected devices!` });
        setTimeout(() => setStatus({ type: 'idle', msg: '' }), 3000);
      } else {
        setStatus({ type: 'err', msg: `❌ ${data.error || 'Failed to send'}` });
      }
    } catch (err: any) {
      setStatus({ type: 'err', msg: `❌ Network error: ${err.message}` });
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={handleBackdropClick}
      style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-lg mx-4 animate-fade-in"
        style={{ animation: 'demoSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(251,146,60,0.5)]" />
                <h2 className="text-lg font-extrabold tracking-widest text-white uppercase">
                  Demo Control
                </h2>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 tracking-wider uppercase font-semibold">
                ⌘+D to toggle • Push to all devices
              </p>
            </div>
            <div className="flex items-center gap-3">
              {connectedClients !== null && (
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                  <div className={`w-2 h-2 rounded-full ${connectedClients > 0 ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-gray-500'}`} />
                  <span className="text-[11px] font-bold text-gray-300 tracking-wide">
                    {connectedClients} {connectedClients === 1 ? 'device' : 'devices'}
                  </span>
                </div>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Presets */}
          <div className="px-6 pb-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[2px] mb-3">
              Quick Presets
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] hover:border-amber-500/30 transition-all group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">
                    {preset.emoji}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-400 group-hover:text-amber-400 transition-colors text-center leading-tight">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="mx-6 h-px bg-white/5" />

          {/* Form */}
          <div className="px-6 py-5 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[2px] mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium placeholder-gray-600 outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[2px] mb-1.5">
                Notification Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium placeholder-gray-600 outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all resize-none"
                placeholder="Enter the notification message..."
              />
            </div>

            {/* Merchant + Discount row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[2px] mb-1.5">
                  Merchant
                </label>
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium placeholder-gray-600 outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[2px] mb-1.5">
                  Discount
                </label>
                <input
                  type="number"
                  value={discount}
                  min={5}
                  max={50}
                  onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium text-center outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Send button + status */}
          <div className="px-6 pb-6 space-y-3">
            <button
              onClick={sendNotification}
              disabled={status.type === 'sending'}
              className="w-full py-4 rounded-2xl font-extrabold text-base tracking-wider uppercase text-white transition-all disabled:opacity-60"
              style={{
                background: status.type === 'sending'
                  ? '#555'
                  : 'linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)',
                boxShadow: status.type === 'sending'
                  ? 'none'
                  : '0 8px 32px rgba(251,146,60,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              {status.type === 'sending' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Broadcasting...
                </span>
              ) : (
                '🔔  Send Push to All Devices'
              )}
            </button>

            {status.msg && (
              <p
                className={`text-center text-sm font-semibold ${
                  status.type === 'ok'
                    ? 'text-green-400'
                    : status.type === 'err'
                    ? 'text-red-400'
                    : 'text-gray-400'
                }`}
              >
                {status.msg}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 text-center">
            <p className="text-[10px] text-gray-600 font-medium tracking-wider">
              Notifications will appear on all devices running MOMENTO in Chrome.
              <br />
              Ensure notifications are allowed on the target device.
            </p>
          </div>
        </div>
      </div>

      {/* Slide-up animation */}
      <style>{`
        @keyframes demoSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
