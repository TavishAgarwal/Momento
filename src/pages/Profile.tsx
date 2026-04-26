import { useAuth } from '../context/AuthContext';
import { useOffer } from '../context/OfferContext';
import { sessionManager } from '../services/sessionManager';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const { offerHistory, clearHistory } = useOffer();
  const navigate = useNavigate();
  const sessionDetails = sessionManager.getSessionDetails();

  const [toggles, setToggles] = useState({
    location: true,
    notifications: true,
    weather: true,
  });

  const handleLogout = () => {
    sessionManager.clearSessionData();
    clearHistory();
    logout();
    navigate('/login');
  };

  const acceptedOffers = offerHistory.filter(o => o.status === 'accepted').length;
  const totalSaved = offerHistory.reduce((sum, o) => {
    if (o.status === 'accepted') return sum + (o.params.discount || 0);
    return sum;
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* User Header */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 p-6 shadow-sm text-center">
        <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center text-3xl mb-3">
          👩🏼
        </div>
        <h1 className="text-xl font-bold text-gray-900">{user?.name || 'Guest User'}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
        <span className="inline-block mt-2 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
          {user?.role === 'merchant' ? 'Merchant' : 'Consumer'}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{offerHistory.length}</p>
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Moments</p>
        </div>
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{acceptedOffers}</p>
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Redeemed</p>
        </div>
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-600">{totalSaved}%</p>
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Saved</p>
        </div>
      </div>

      {/* Privacy & Permissions */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-white/40">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Permissions</h3>
        </div>
        {[
          { key: 'location', label: 'Location', desc: 'Used for nearby places', icon: '📍' },
          { key: 'notifications', label: 'Notifications', desc: 'Offer alerts', icon: '🔔' },
          { key: 'weather', label: 'Weather Context', desc: 'Ambient triggers', icon: '🌤️' },
        ].map((item, i, arr) => (
          <div key={item.key} className={`px-4 py-3.5 flex justify-between items-center ${i < arr.length - 1 ? 'border-b border-white/30' : ''}`}>
            <div className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <div>
                <div className="text-sm text-gray-900 font-medium">{item.label}</div>
                <div className="text-[10px] text-gray-500">{item.desc}</div>
              </div>
            </div>
            <button
              onClick={() => setToggles(t => ({ ...t, [item.key]: !(t as any)[item.key] }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${(toggles as any)[item.key] ? 'bg-amber-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${(toggles as any)[item.key] ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        ))}
      </div>

      {/* Session Info */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Session</p>
            <p className="text-xs font-mono text-gray-700 mt-1">{sessionDetails.id?.substring(0, 16)}...</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Storage</p>
            <p className="text-xs font-medium text-gray-700 mt-1">{sessionDetails.localDataSize}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Privacy Score: A+</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-medium hover:bg-red-100 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
