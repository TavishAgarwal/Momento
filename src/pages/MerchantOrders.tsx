import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface RedemptionOrder {
  id: string;
  customerName: string;
  product: string;
  discount: number;
  originalPrice: number;
  finalPrice: number;
  timestamp: number;
  status: 'completed' | 'pending';
}

export default function MerchantOrders() {
  const { user } = useAuth();
  const merchantId = user?.merchantId || 'cafe-mueller';

  // Generate simulated order data
  const [orders] = useState<RedemptionOrder[]>(() => {
    const products = ['Cappuccino', 'Flat White', 'Croissant', 'Breakfast Set', 'Latte Macchiato', 'Espresso'];
    const names = ['Demo Consumer', 'Luca Schneider', 'Sophie Bauer', 'Max Fischer', 'Anna Hoffmann', 'Tom Klein'];
    const now = Date.now();
    return Array.from({ length: 8 }, (_, i) => ({
      id: `ORD-${(now - i * 3600000).toString(36).toUpperCase().slice(-6)}`,
      customerName: names[i % names.length],
      product: products[i % products.length],
      discount: [5, 10, 15, 8, 12, 20][i % 6],
      originalPrice: [4.50, 4.80, 3.20, 12.90, 5.20, 2.80][i % 6],
      finalPrice: [4.50, 4.80, 3.20, 12.90, 5.20, 2.80][i % 6] * (1 - [5, 10, 15, 8, 12, 20][i % 6] / 100),
      timestamp: now - i * 3600000 - Math.random() * 1800000,
      status: i < 6 ? 'completed' as const : 'pending' as const,
    }));
  });

  const todayOrders = orders.filter(o => {
    const today = new Date();
    const orderDate = new Date(o.timestamp);
    return orderDate.toDateString() === today.toDateString();
  });

  const totalRevenue = todayOrders.reduce((sum, o) => sum + o.finalPrice, 0);
  const totalSaved = todayOrders.reduce((sum, o) => sum + (o.originalPrice - o.finalPrice), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Today's redeemed offers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{todayOrders.length}</p>
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Orders</p>
        </div>
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 p-4 text-center shadow-sm">
          <p className="text-xl font-bold text-gray-900">€{totalRevenue.toFixed(0)}</p>
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Revenue</p>
        </div>
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/60 p-4 text-center shadow-sm">
          <p className="text-xl font-bold text-amber-600">€{totalSaved.toFixed(0)}</p>
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Discounts</p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-2">
        {orders.map(order => (
          <div key={order.id} className="bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${order.status === 'completed' ? 'bg-green-100' : 'bg-amber-100'}`}>
                  {order.status === 'completed' ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{order.customerName}</p>
                  <p className="text-xs text-gray-500">{order.product}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">€{order.finalPrice.toFixed(2)}</p>
                <p className="text-[10px] text-amber-600 font-medium">-{order.discount}%</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
              <span className="text-[10px] text-gray-400 font-mono">{order.id}</span>
              <span className="text-[10px] text-gray-400">
                {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
