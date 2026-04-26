import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePayoneFeed } from '../hooks/usePayoneFeed';
import { api } from '../services/api';
import type { MerchantDashboardData } from '../types';
import { io, Socket } from 'socket.io-client';

export default function Dashboard() {
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
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            {dashboard?.merchant.name || 'Café Müller'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Merchant Dashboard — MOMENTO PAYONE × Sparkassen
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex gap-2 mb-6">
        <button className="px-6 py-2 bg-amber-500 text-black text-sm font-semibold rounded-full">Now</button>
        <button className="px-6 py-2 border border-gray-600 text-gray-300 text-sm font-semibold rounded-full hover:bg-gray-800">Today</button>
        <button className="px-6 py-2 border border-gray-600 text-gray-300 text-sm font-semibold rounded-full hover:bg-gray-800">This Week</button>
      </div>

      {/* Payone Live Feed */}
      <div className="bg-gray-800/80 rounded-2xl p-5 space-y-4 border border-gray-700/50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">
            Transaction Velocity (PAYONE)
          </h3>
          <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
            QUIET PERIOD
          </span>
        </div>

        {payoneStatus && (
          <div className="space-y-4 pt-2">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white leading-none">
                {payoneStatus.currentVelocity}
              </span>
              <span className="text-sm text-gray-400 mb-1">/ hr</span>
            </div>

            {/* Velocity bar */}
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden mt-4">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, payoneStatus.ratio * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Performance stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-800/80 rounded-xl p-4 border border-gray-700/50 flex flex-col justify-center">
          <p className="text-3xl font-bold text-white">
            {dashboard?.usedTokens || 0}
          </p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Offers Generated</p>
        </div>
        <div className="bg-gray-800/80 rounded-xl p-4 border border-gray-700/50 flex flex-col justify-center">
          <p className="text-3xl font-bold text-white">
            {dashboard?.performance.redemptionsToday || 0}
          </p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Redeemed Today</p>
        </div>
        <div className="bg-gray-800/80 rounded-xl p-4 border border-gray-700/50 flex flex-col justify-center">
          <p className="text-3xl font-bold text-white">
            €{dashboard?.performance.revenueToday.toFixed(2) || '0.00'}
          </p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Total Revenue</p>
        </div>
        <div className="bg-gray-800/80 rounded-xl p-4 border border-gray-700/50 flex flex-col justify-center">
          <p className="text-3xl font-bold text-white">
            {dashboard?.performance.maxDiscountUsed || 0}%
          </p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Max Discount</p>
        </div>
      </div>

      {/* DSV Split Visualisation */}
      <div className="bg-gray-800/80 rounded-2xl p-5 space-y-4 border border-gray-700/50 mt-6">
        <h3 className="text-sm font-medium text-white mb-2">
          Revenue Split (MOMENTO × DSV)
        </h3>
        
        <div className="flex w-full h-4 rounded-full overflow-hidden">
          <div className="bg-green-500 transition-all duration-500 flex items-center justify-center text-[10px] font-bold" style={{ width: `${dashboard?.dsvSplit.merchantShare || 0}%` }}>
            {(dashboard?.dsvSplit.merchantShare || 0) > 10 && `${dashboard?.dsvSplit.merchantShare}%`}
          </div>
          <div className="bg-blue-500 transition-all duration-500 flex items-center justify-center text-[10px] font-bold" style={{ width: `${dashboard?.dsvSplit.platformFee || 0}%` }}>
            {(dashboard?.dsvSplit.platformFee || 0) > 10 && `${dashboard?.dsvSplit.platformFee}%`}
          </div>
          <div className="bg-red-500 transition-all duration-500 flex items-center justify-center text-[10px] font-bold" style={{ width: `${dashboard?.dsvSplit.sparkassenRebate || 0}%` }}>
            {(dashboard?.dsvSplit.sparkassenRebate || 0) > 10 && `${dashboard?.dsvSplit.sparkassenRebate}%`}
          </div>
        </div>
        
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mt-2">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>Merchant</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Platform</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>Sparkasse</div>
        </div>
      </div>

    </div>
  );
}
