import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOffer } from '../context/OfferContext';
import { sessionManager } from '../services/sessionManager';

export default function MyData() {
  const { user, logout } = useAuth();
  const { clearHistory } = useOffer();
  
  const [toggles, setToggles] = useState({
    location: true,
    purchase: true,
    weather: true
  });

  const sessionDetails = sessionManager.getSessionDetails();
  const [sessionInfo, setSessionInfo] = useState(sessionDetails);

  const handleExport = () => {
    alert(`Exporting Session ID: ${sessionInfo.id}\nSize: ${sessionInfo.localDataSize}`);
  };

  const forceRotate = () => {
    sessionManager.rotateSession();
    setSessionInfo(sessionManager.getSessionDetails());
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Your Data, Your Rules</h1>
        <p className="text-sm text-gray-500">
          MOMENTO runs on your device. We don't store your data on our servers.
        </p>
      </div>

      {/* Permissions Toggles */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 overflow-hidden shadow-sm">
        {[
          { key: 'location', label: 'Location Awareness', desc: 'Used for merchant proximity' },
          { key: 'purchase', label: 'Purchase Patterns', desc: 'Local spending analysis' },
          { key: 'weather', label: 'Weather Context', desc: 'For ambient triggers' },
        ].map((item, i, arr) => (
          <div key={item.key} className={`p-4 flex justify-between items-center ${i < arr.length - 1 ? 'border-b border-white/40' : ''}`}>
            <div>
              <div className="text-gray-900 font-medium">{item.label}</div>
              <div className="text-xs text-gray-500">{item.desc}</div>
            </div>
            <button 
              onClick={() => setToggles(t => ({...t, [item.key]: !(t as any)[item.key]}))}
              className={`w-12 h-6 rounded-full transition-colors relative ${(toggles as any)[item.key] ? 'bg-amber-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${(toggles as any)[item.key] ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        ))}
      </div>

      {/* Data Dashboard */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">Data Dashboard</h3>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/60 flex justify-between items-center shadow-sm">
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Session ID</div>
              <div className="text-sm font-mono text-gray-900 mt-1">{sessionInfo.id?.substring(0, 12)}...</div>
            </div>
            <button onClick={forceRotate} className="text-2xl hover:rotate-180 transition-transform cursor-pointer">🔄</button>
          </div>
          
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/60 flex justify-between items-center shadow-sm">
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Storage Footprint</div>
              <div className="text-lg font-medium text-gray-900 mt-1">{sessionInfo.localDataSize}</div>
            </div>
            <div className="text-2xl">💾</div>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/60 flex justify-between items-center shadow-sm">
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Privacy Score</div>
              <div className="text-lg font-medium text-green-600">Excellent (A+)</div>
            </div>
            <div className="text-2xl">🛡️</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-6 space-y-3">
        <button 
          onClick={handleExport}
          className="w-full py-4 rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md text-gray-900 font-medium hover:bg-white/90 transition-colors shadow-sm"
        >
          Export My Data
        </button>
        <button 
          onClick={() => {
            sessionManager.clearSessionData();
            clearHistory();
            logout();
          }}
          className="w-full py-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-medium hover:bg-red-100 transition-colors"
        >
          Delete All Data & Logout
        </button>
      </div>

    </div>
  );
}
