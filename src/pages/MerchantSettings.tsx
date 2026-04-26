import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function MerchantSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const merchantId = user?.merchantId || 'cafe-mueller';

  const [settings, setSettings] = useState({
    maxDiscount: 20,
    maxRedemptionsPerDay: 50,
    quietHoursEnabled: false,
    quietStart: '22:00',
    quietEnd: '06:00',
    active: true,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      await fetch(`/api/merchant/${merchantId}/rules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxDiscount: settings.maxDiscount,
          maxRedemptionsPerDay: settings.maxRedemptionsPerDay,
          active: settings.active,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl">
            👨🏻‍🍳
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{user?.name || 'Hans Müller'}</h1>
            <p className="text-sm text-gray-500">Café Müller · Merchant Account</p>
            <span className="inline-block mt-1 bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Offer Rules */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-white/40">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Offer Rules</h3>
        </div>

        <div className="p-4 space-y-5">
          {/* Max Discount */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-900">Max Discount</label>
              <span className="text-sm font-bold text-amber-600">{settings.maxDiscount}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={settings.maxDiscount}
              onChange={(e) => setSettings(s => ({ ...s, maxDiscount: parseInt(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>5%</span>
              <span>50%</span>
            </div>
          </div>

          {/* Daily Limit */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-900">Daily Redemption Limit</label>
              <span className="text-sm font-bold text-gray-700">{settings.maxRedemptionsPerDay}</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={settings.maxRedemptionsPerDay}
              onChange={(e) => setSettings(s => ({ ...s, maxRedemptionsPerDay: parseInt(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Accepting Offers Toggle */}
          <div className="flex justify-between items-center py-2">
            <div>
              <p className="text-sm font-medium text-gray-900">Accept Offers</p>
              <p className="text-[10px] text-gray-500">When off, no new offers will be generated</p>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, active: !s.active }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${settings.active ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${settings.active ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          {/* Quiet Hours */}
          <div className="flex justify-between items-center py-2">
            <div>
              <p className="text-sm font-medium text-gray-900">Quiet Hours</p>
              <p className="text-[10px] text-gray-500">{settings.quietStart} – {settings.quietEnd}</p>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, quietHoursEnabled: !s.quietHoursEnabled }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${settings.quietHoursEnabled ? 'bg-amber-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${settings.quietHoursEnabled ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className={`w-full py-3.5 rounded-2xl font-bold text-lg transition-all ${
          saved
            ? 'bg-green-500 text-white'
            : 'bg-amber-500 hover:bg-amber-600 text-white shadow-[0_4px_14px_rgba(232,145,58,0.3)] hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>

      {/* DSV Info */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 p-4 shadow-sm">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Platform</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Revenue Split</span>
            <span className="font-medium text-gray-900">85% Merchant · 10% Platform · 5% Sparkasse</span>
          </div>
          <div className="flex justify-between">
            <span>Merchant ID</span>
            <span className="font-mono text-[10px] text-gray-500">{merchantId}</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-medium hover:bg-red-100 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
