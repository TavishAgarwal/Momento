import { useState, useEffect } from 'react';
import type { Offer } from '../types';
import { useCountdown } from '../hooks/useCountdown';
import { getMoodGradient, formatCurrency } from '../utils/helpers';
import { onDeviceModel } from '../services/onDeviceModel';
import { hapticFeedback } from '../services/hapticService';
import { motion, AnimatePresence } from 'framer-motion';

// Typewriter effect component
function TypewriterText({ text, speed = 40 }: { text: string; speed?: number }) {
  const [displayText, setDisplayText] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayText('');
    setDone(false);
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < text.length) {
        setDisplayText(text.slice(0, idx + 1));
        idx++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayText}
      {!done && <span className="animate-pulse">|</span>}
    </span>
  );
}

interface OfferCardProps {
  offer: Offer;
  onAccept: () => void;
  onDismiss: () => void;
}

export default function OfferCard({ offer, onAccept, onDismiss }: OfferCardProps) {
  const { formatted, isExpired, progress } = useCountdown(offer.expiresAt);
  const [showMeta, setShowMeta] = useState(false);
  const [headline, setHeadline] = useState('');
  const [isDismissing, setIsDismissing] = useState(false);
  const { params, generationMetadata } = offer;

  // Generate headline on-device
  useEffect(() => {
    const h = onDeviceModel.generateHeadline(params.headlineTone);
    setHeadline(h);
  }, [params.headlineTone]);

  const handleAccept = () => {
    hapticFeedback.success();
    onDeviceModel.recordInteraction('accept');
    onAccept();
  };

  const handleDismiss = () => {
    hapticFeedback.light();
    onDeviceModel.recordInteraction('dismiss');
    setIsDismissing(true);
    setTimeout(() => {
      onDismiss();
    }, 400); // Wait for animation
  };

  if (isExpired) {
    return (
      <div className="glass-card p-6 text-center animate-fade-in border-gray-800 bg-gray-900/50">
        <p className="text-[var(--momento-text-muted)] italic font-light tracking-wide">
          {params.brandedEnding?.expire || 'This moment has passed.'}
        </p>
      </div>
    );
  }

  const gradient = params.colorPrimary 
    ? `linear-gradient(135deg, ${params.colorPrimary}80 0%, #000000 100%)` 
    : getMoodGradient(params.visualMood);

  return (
    <AnimatePresence>
      {!isDismissing && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="space-y-6 relative z-10 w-full pb-10"
        >
          {/* Offer Card (Light Premium Glassmorphism) */}
          <div className="bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[32px] p-8 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.1)] relative overflow-visible">
            {/* Subtle inner warm glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--momento-accent)]/10 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="relative z-10">
              {/* Header section */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl leading-tight font-bold text-gray-900 mb-2 drop-shadow-sm">
                    <TypewriterText text={headline} speed={30} />
                  </h2>
                  <p className="text-gray-700 text-lg font-medium pr-2">
                    Enjoy {params.discount}% OFF at<br/>{offer.merchantName}
                  </p>
                </div>
                
                {/* Discount Badge */}
                <div className="bg-white/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/40 shadow-sm shrink-0">
                  <span className="text-[var(--momento-accent)] text-2xl font-extrabold tracking-tight drop-shadow-sm">
                    {params.discount}%
                  </span>
                </div>
              </div>

              {/* Details section */}
              <div className="space-y-4 pt-2 border-t border-gray-200">
                <div className="flex items-center gap-3 text-gray-800">
                  <svg className="w-5 h-5 text-[var(--momento-accent)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-semibold text-lg truncate">{offer.merchantName}</span>
                    <span className="text-sm text-gray-500 truncate">~{(Math.random() * 300 + 50).toFixed(0)}m away • {params.featuredProduct}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-gray-800 bg-white/50 rounded-xl p-3 border border-white/40 shadow-sm">
                  <svg className="w-5 h-5 text-[var(--momento-green)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="font-medium text-gray-600">Ends in:</span>
                      <span className="font-bold text-gray-900 tracking-widest">{formatted}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                       <div 
                         className="bg-[var(--momento-green)] h-1.5 rounded-full transition-all duration-1000 shadow-sm" 
                         style={{ width: `${Math.max(0, progress * 100)}%` }}
                       ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Dismiss Button */}
              <div className="mt-8 text-center pb-2">
                <button
                  onClick={handleDismiss}
                  className="py-2 text-gray-500 hover:text-gray-800 text-xs transition-colors uppercase tracking-widest font-medium"
                >
                  {params.brandedEnding?.dismiss || 'Dismiss Moment'}
                </button>
              </div>

            </div>
            
            {/* Primary Action FAB overlapping the bottom border */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 z-30">
              <button
                onClick={handleAccept}
                className="w-16 h-16 bg-[var(--momento-accent)] text-white rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(232,145,58,0.4)] hover:scale-105 transition-transform border-[4px] border-white"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* AI Transparency Panel */}
          <div className="pt-4">
            <button
              onClick={() => setShowMeta(!showMeta)}
              className="mx-auto block px-4 py-2 rounded-full border border-gray-200 bg-white/50 backdrop-blur-sm text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-800 transition-colors hover:border-gray-300"
            >
              <span className="flex items-center gap-2 justify-center">
                <span className={`w-1.5 h-1.5 rounded-full ${generationMetadata.isLiveGenerated ? 'bg-[var(--momento-green)] shadow-[0_0_8px_var(--momento-green)]' : 'bg-[var(--momento-yellow)] shadow-[0_0_8px_var(--momento-yellow)]'}`} />
                {generationMetadata.isLiveGenerated ? 'AI Generated' : 'Fallback'} · {generationMetadata.model}
                <span className="ml-1 opacity-50">{showMeta ? '▲' : '▼'}</span>
              </span>
            </button>

            {showMeta && (
              <div className="bg-white/70 backdrop-blur-xl rounded-[24px] mt-4 p-5 space-y-3 text-xs text-gray-600 animate-fade-in border border-white/60 shadow-lg">
                <h4 className="font-semibold text-gray-900 uppercase tracking-widest text-[10px] flex items-center gap-2">
                  <span className="text-[var(--momento-blue)]">✦</span> Generation Metadata
                </h4>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  <div className="flex flex-col gap-0.5"><span className="text-[10px] uppercase opacity-60">Model</span><span className="text-gray-900 font-mono">{generationMetadata.model}</span></div>
                  <div className="flex flex-col gap-0.5"><span className="text-[10px] uppercase opacity-60">Tokens</span><span className="text-gray-900 font-mono">{generationMetadata.tokensUsed ?? 'N/A'}</span></div>
                  <div className="flex flex-col gap-0.5"><span className="text-[10px] uppercase opacity-60">Latency</span><span className="text-gray-900 font-mono">{generationMetadata.generationTimeMs}ms</span></div>
                  <div className="flex flex-col gap-0.5"><span className="text-[10px] uppercase opacity-60">Temp</span><span className="text-gray-900 font-mono">{generationMetadata.temperature}</span></div>
                  <div className="flex flex-col gap-0.5"><span className="text-[10px] uppercase opacity-60">Signals</span><span className="text-gray-900 font-mono">{generationMetadata.contextSignals}</span></div>
                  <div className="flex flex-col gap-0.5"><span className="text-[10px] uppercase opacity-60">Live</span><span className={generationMetadata.isLiveGenerated ? 'text-[var(--momento-green)]' : 'text-[var(--momento-yellow)]'}>{generationMetadata.isLiveGenerated ? 'Yes' : 'No'}</span></div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-[10px] opacity-60 leading-relaxed">
                    This offer was generated using {generationMetadata.contextSignals} context signals.
                    Zero personal data was sent to the AI model.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
