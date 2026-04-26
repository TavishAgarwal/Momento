import React from 'react';
import type { ClockState } from '../types';

interface Props {
  clocks: ClockState[];
  allActive: boolean;
}

export default function TripleClock({ clocks, allActive }: Props) {
  const getClockActive = (name: string) => {
    const clock = clocks.find(c => c.name.toUpperCase().includes(name));
    return clock?.active || false;
  };

  const renderCard = (title: string, active: boolean, color: string) => {
    return (
      <div className="flex-1 bg-gray-800/80 rounded-xl p-3 border border-gray-700/50 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
        {/* Activity Indicator Dot */}
        <div 
          className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${
            active ? color : 'bg-gray-600'
          }`} 
        />
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
          {title}
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full max-w-sm mx-auto my-6 ${allActive ? 'animate-momentUnlocked' : ''}`}>
      <div className="flex gap-2">
        {renderCard('MERCHANT', getClockActive('MERCHANT'), 'bg-amber-500')}
        {renderCard('USER', getClockActive('USER') || getClockActive('INTENT'), 'bg-blue-500')}
        {renderCard('CITY', getClockActive('CITY') || getClockActive('AMBIENT'), 'bg-green-500')}
      </div>
    </div>
  );
}
