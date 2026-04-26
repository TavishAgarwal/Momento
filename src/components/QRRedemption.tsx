import type { Offer } from '../types';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useCountdown } from '../hooks/useCountdown';
import { hapticFeedback } from '../services/hapticService';

interface QRRedemptionProps {
  offer: Offer;
  onClose: () => void;
}

export default function QRRedemption({ offer, onClose }: QRRedemptionProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const { formatted } = useCountdown(offer.expiresAt);

  useEffect(() => {
    hapticFeedback.success();
    QRCode.toDataURL(offer.qrToken, {
      width: 256,
      margin: 1,
      color: {
        dark: '#1B2A4A',
        light: '#FFFFFF'
      }
    })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error(err));
  }, [offer.qrToken]);

  return (
    <div className="fixed inset-0 bg-white/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[32px] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.1)] p-8 w-full max-w-sm space-y-6 animate-unfoldQR relative overflow-visible">
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900">
            Show this to {offer.merchantName}
          </h3>
          <p className="text-sm text-gray-600 font-medium mt-1">
            {offer.params.discount}% off · {offer.params.featuredProduct}
          </p>
        </div>

        {/* QR Visual */}
        <div className="flex justify-center">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 object-contain" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-[var(--momento-accent)] animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500 font-mono break-all">
            {offer.qrToken.slice(0, 32)}...
          </p>
          <p className="text-xs text-green-600 font-medium flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            Single-use · HMAC-SHA256 secured
          </p>
          <p className="text-sm font-medium text-gray-800 mt-2">
            Expires in <span className="font-mono font-bold text-[var(--momento-accent)]">{formatted}</span>
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-[var(--momento-accent)] hover:bg-[#d88231] rounded-2xl text-white font-bold text-lg shadow-[0_4px_14px_rgba(232,145,58,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Done
        </button>
      </div>
    </div>
  );
}
