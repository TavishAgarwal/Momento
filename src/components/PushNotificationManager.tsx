// ═══════════════════════════════════════════════════════════════
// MOMENTO — Push Notification Manager (BULLETPROOF)
// Uses HTTP polling + in-app toast (always works, no deps)
// Also attempts native notification as bonus
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react';

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  tag: string;
  data?: any;
}

export default function PushNotificationManager() {
  const [toast, setToast] = useState<PushPayload | null>(null);
  const lastPollRef = useRef<number>(Date.now() - 5000);
  const shownTagsRef = useRef<Set<string>>(new Set());
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Try to register SW (best effort)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Try to request notification permission (best effort)
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    // ── Poll for notifications every 2 seconds ──
    const poll = async () => {
      try {
        const since = lastPollRef.current;
        const res = await fetch(`/api/push/poll?since=${since}`);
        const data = await res.json();
        lastPollRef.current = data.serverTime || Date.now();

        if (data.notifications?.length > 0) {
          for (const notif of data.notifications) {
            if (shownTagsRef.current.has(notif.tag)) continue;
            shownTagsRef.current.add(notif.tag);
            handleNotification(notif);
          }
        }
      } catch {
        // retry next cycle
      }
    };

    const interval = setInterval(poll, 2000);
    poll();
    return () => clearInterval(interval);
  }, []);

  const handleNotification = (payload: PushPayload) => {
    console.log('[Push] 📱 Showing notification:', payload.title);

    // ── PRIMARY: In-app toast (ALWAYS works) ──
    setToast(payload);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 8000);

    // ── BONUS: Try native notification (best effort, don't await) ──
    tryNativeNotification(payload);
  };

  const tryNativeNotification = (payload: PushPayload) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const opts = {
      body: payload.body,
      icon: '/icon-192.png',
      tag: payload.tag,
      vibrate: [200, 100, 200],
      requireInteraction: true,
    };

    // Try SW method with 2s timeout
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const timeout = setTimeout(() => {
        // SW didn't respond, try direct API
        try { new Notification(payload.title, opts); } catch {}
      }, 2000);

      navigator.serviceWorker.ready.then(reg => {
        clearTimeout(timeout);
        reg.showNotification(payload.title, opts as any).catch(() => {
          try { new Notification(payload.title, opts); } catch {}
        });
      }).catch(() => {
        clearTimeout(timeout);
        try { new Notification(payload.title, opts); } catch {}
      });
    } else {
      try { new Notification(payload.title, opts); } catch {}
    }
  };

  // ═══════════════════════════════════════════════════════
  // TOAST UI — slides in from top, always visible
  // ═══════════════════════════════════════════════════════
  if (!toast) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] p-3 pointer-events-none"
      style={{ animation: 'pushSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <div
        className="max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl pointer-events-auto cursor-pointer"
        onClick={() => setToast(null)}
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '1px solid rgba(251,146,60,0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(251,146,60,0.15)',
        }}
      >
        {/* App header bar */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <div className="w-5 h-5 rounded-md bg-amber-500 flex items-center justify-center">
            <span className="text-[10px] font-black text-white">M</span>
          </div>
          <span className="text-[11px] font-bold text-amber-400 tracking-widest uppercase">
            MOMENTO
          </span>
          <span className="text-[10px] text-gray-500 ml-auto">now</span>
        </div>

        {/* Content */}
        <div className="px-4 pb-4 pt-1">
          <h3 className="text-white font-bold text-sm mb-1">{toast.title}</h3>
          <p className="text-gray-300 text-xs leading-relaxed">{toast.body}</p>
        </div>

        {/* Action bar */}
        <div className="flex border-t border-white/10">
          <button
            className="flex-1 py-2.5 text-amber-400 text-xs font-bold tracking-wide hover:bg-white/5 transition-colors"
            onClick={(e) => { e.stopPropagation(); setToast(null); }}
          >
            🎯 Claim Offer
          </button>
          <div className="w-px bg-white/10" />
          <button
            className="flex-1 py-2.5 text-gray-500 text-xs font-bold tracking-wide hover:bg-white/5 transition-colors"
            onClick={(e) => { e.stopPropagation(); setToast(null); }}
          >
            Dismiss
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pushSlideDown {
          from { opacity: 0; transform: translateY(-100%); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
