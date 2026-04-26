import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePayoneFeed } from '../hooks/usePayoneFeed';
import { api } from '../services/api';
import type { MerchantDashboardData } from '../types';
import { io, Socket } from 'socket.io-client';

export default function MerchantDashboard() {
  const { user } = useAuth();
  const merchantId = user?.merchantId || 'cafe-mueller';
  const { status: payoneStatus, isConnected } = usePayoneFeed(merchantId);
  const [dashboard, setDashboard] = useState<MerchantDashboardData | null>(null);

  useEffect(() => {
    let socket: Socket;
    
    const fetchDashboard = async () => {
      try {
        const data = await api.getMerchantDashboard(merchantId) as MerchantDashboardData;
        setDashboard(data);
      } catch (err) {
        console.error('[Dashboard] Error fetching initial data:', err);
      }
    };

    fetchDashboard();

    // Initialise Socket.io
    const apiUrl = import.meta.env.VITE_API_URL || '';
    socket = io(apiUrl, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      socket.emit('join-merchant', merchantId);
    });

    socket.on('dashboard-update', (data: MerchantDashboardData) => {
      setDashboard(data);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [merchantId]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {dashboard?.merchant.name || 'Café Müller'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Merchant Dashboard — MOMENTO PAYONE × Sparkassen
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex gap-2 mb-6">
        <button className="px-6 py-2 bg-amber-500 text-white text-sm font-semibold rounded-full shadow-md">Now</button>
        <button className="px-6 py-2 border border-gray-300 text-gray-600 text-sm font-semibold rounded-full hover:bg-gray-50 transition-colors">Today</button>
        <button className="px-6 py-2 border border-gray-300 text-gray-600 text-sm font-semibold rounded-full hover:bg-gray-50 transition-colors">This Week</button>
      </div>

      {/* Payone Live Feed */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] p-6 space-y-4 border border-white/60 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.1)] relative overflow-visible">
        <div className="flex items-center justify-between relative z-10">
          <h3 className="text-sm font-medium text-gray-800">
            Transaction Velocity (PAYONE)
          </h3>
          <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
            QUIET PERIOD
          </span>
        </div>

        {payoneStatus && (
          <div className="space-y-4 pt-2 relative z-10">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-gray-900 leading-none tracking-tight">
                {payoneStatus.currentVelocity}
              </span>
              <span className="text-sm text-gray-500 mb-1 font-medium">/ hr</span>
            </div>

            {/* Velocity bar */}
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-4 shadow-inner">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.min(100, payoneStatus.ratio * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Performance stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/70 backdrop-blur-2xl rounded-[24px] p-5 border border-white/60 shadow-sm flex flex-col justify-center">
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            {dashboard?.usedTokens || 0}
          </p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Offers Generated</p>
        </div>
        <div className="bg-white/70 backdrop-blur-2xl rounded-[24px] p-5 border border-white/60 shadow-sm flex flex-col justify-center">
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            {dashboard?.performance.redemptionsToday || 0}
          </p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Redeemed Today</p>
        </div>
        <div className="bg-white/70 backdrop-blur-2xl rounded-[24px] p-5 border border-white/60 shadow-sm flex flex-col justify-center">
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            €{dashboard?.performance.revenueToday.toFixed(2) || '0.00'}
          </p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Total Revenue</p>
        </div>
        <div className="bg-white/70 backdrop-blur-2xl rounded-[24px] p-5 border border-white/60 shadow-sm flex flex-col justify-center">
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            {dashboard?.performance.maxDiscountUsed || 0}%
          </p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Max Discount</p>
        </div>
      </div>

      {/* DSV Split Visualisation */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] p-6 space-y-4 border border-white/60 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.1)] mt-6">
        <h3 className="text-sm font-medium text-gray-800 mb-2">
          Revenue Split (MOMENTO × DSV)
        </h3>
        
        <div className="flex w-full h-4 rounded-full overflow-hidden shadow-inner">
          <div className="bg-green-500 transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${dashboard?.dsvSplit.merchantShare || 0}%` }}>
            {(dashboard?.dsvSplit.merchantShare || 0) > 10 && `${dashboard?.dsvSplit.merchantShare}%`}
          </div>
          <div className="bg-blue-500 transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${dashboard?.dsvSplit.platformFee || 0}%` }}>
            {(dashboard?.dsvSplit.platformFee || 0) > 10 && `${dashboard?.dsvSplit.platformFee}%`}
          </div>
          <div className="bg-red-500 transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${dashboard?.dsvSplit.sparkassenRebate || 0}%` }}>
            {(dashboard?.dsvSplit.sparkassenRebate || 0) > 10 && `${dashboard?.dsvSplit.sparkassenRebate}%`}
          </div>
        </div>
        
        <div className="flex justify-between text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-2">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm"></span>Merchant</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></span>Platform</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></span>Sparkasse</div>
        </div>
      </div>

    </div>
  );
}
