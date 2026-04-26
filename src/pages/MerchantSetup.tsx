import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function MerchantSetup() {
  const { user } = useAuth();
  const merchantId = user?.merchantId || 'cafe-mueller';
  const [merchant, setMerchant] = useState<any>(null);
  const [maxDiscount, setMaxDiscount] = useState(20);
  const [quietTimeTrigger, setQuietTimeTrigger] = useState(30); // minutes quiet to trigger
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    api.getMerchant(merchantId).then((data: any) => {
      setMerchant(data);
      setMaxDiscount(data.maxDiscount || 20);
    }).catch(() => {});
  }, [merchantId]);

  const handleSave = async () => {
    setIsSaving(true);
    await api.updateMerchantRules(merchantId, { maxDiscount, quietTimeTrigger });
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-bold text-[var(--momento-text)]">Merchant Setup</h1>

      {merchant && (
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-4 border-b border-gray-700/50 pb-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--momento-accent)]/20 flex items-center justify-center text-[var(--momento-accent)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--momento-text)]">{merchant.name}</p>
              <p className="text-sm text-[var(--momento-text-muted)] capitalize">{merchant.category} · {merchant.district}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--momento-text-muted)]">Generation Rules</h3>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-[var(--momento-text)]">Maximum Discount</label>
                <span className="text-sm font-bold text-[var(--momento-accent)]">{maxDiscount}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(Number(e.target.value))}
                className="w-full accent-[var(--momento-accent)] h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-[var(--momento-text-muted)] mt-1">Maximum allowed discount for generative offers.</p>
            </div>

            <div className="pt-2">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-[var(--momento-text)]">Quiet Period Trigger</label>
                <span className="text-sm font-bold text-[var(--momento-blue)]">{quietTimeTrigger} mins</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={quietTimeTrigger}
                onChange={(e) => setQuietTimeTrigger(Number(e.target.value))}
                className="w-full accent-[var(--momento-blue)] h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-[var(--momento-text-muted)] mt-1">Generate offers when velocity drops below baseline for this long.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700/50">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full py-3 rounded-xl text-white font-bold transition-all ${
                saveSuccess ? 'bg-green-500' : 'bg-[var(--momento-accent)] hover:bg-[var(--momento-accent-hover)] active:scale-[0.98]'
              }`}
            >
              {isSaving ? 'Saving...' : saveSuccess ? '✓ Saved Successfully' : 'Update Rules'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
