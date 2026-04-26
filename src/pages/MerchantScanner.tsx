import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface ScannedOffer {
  offerId: string;
  merchantName: string;
  discount: number;
  product: string;
  customerName: string;
  timestamp: number;
}

export default function MerchantScanner() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<ScannedOffer | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');
  const [recentScans, setRecentScans] = useState<ScannedOffer[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      setScanning(true); // render <video> first, useEffect below attaches stream
    } catch (err) {
      setError('Camera access denied. Use manual code entry instead.');
    }
  };

  // Attach camera stream to <video> once it's mounted in the DOM
  useEffect(() => {
    if (scanning && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [scanning]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const simulateAcceptOffer = (code?: string) => {
    const offer: ScannedOffer = {
      offerId: code || `MOMENTO-${Date.now().toString(36).toUpperCase()}`,
      merchantName: user?.name || 'Café Müller',
      discount: Math.floor(Math.random() * 15) + 5,
      product: ['Cappuccino', 'Latte', 'Croissant', 'Breakfast Set'][Math.floor(Math.random() * 4)],
      customerName: 'Mia Weber',
      timestamp: Date.now(),
    };
    setScannedResult(offer);
    setRecentScans(prev => [offer, ...prev].slice(0, 10));
    stopCamera();
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    simulateAcceptOffer(manualCode.trim());
    setManualCode('');
  };

  const clearResult = () => {
    setScannedResult(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Scan & Accept</h1>
        <p className="text-sm text-gray-500 mt-1">Scan a customer's QR code to redeem their offer</p>
      </div>

      {/* Success overlay */}
      {scannedResult && (
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 space-y-4 animate-fade-in">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-green-800">Order Accepted!</h2>
          </div>
          <div className="bg-white/80 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 font-medium">Customer</span>
              <span className="text-sm font-semibold text-gray-900">{scannedResult.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 font-medium">Product</span>
              <span className="text-sm font-semibold text-gray-900">{scannedResult.product}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 font-medium">Discount</span>
              <span className="text-sm font-bold text-amber-600">{scannedResult.discount}% OFF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 font-medium">Code</span>
              <span className="text-[10px] font-mono text-gray-600">{scannedResult.offerId.slice(0, 24)}...</span>
            </div>
          </div>
          <button
            onClick={clearResult}
            className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-semibold transition-colors"
          >
            Scan Next
          </button>
        </div>
      )}

      {/* Scanner */}
      {!scannedResult && (
        <>
          <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-sm">
            {scanning ? (
              <div className="relative">
                <video ref={videoRef} className="w-full aspect-square object-cover" autoPlay playsInline muted />
                {/* Scan overlay frame */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-amber-400 rounded-2xl relative">
                    <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-3 border-l-3 border-amber-500 rounded-tl-lg" />
                    <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-3 border-r-3 border-amber-500 rounded-tr-lg" />
                    <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-3 border-l-3 border-amber-500 rounded-bl-lg" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-3 border-r-3 border-amber-500 rounded-br-lg" />
                    {/* Scanning line animation */}
                    <div className="absolute left-2 right-2 h-0.5 bg-amber-500/60 animate-pulse top-1/2" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-black/60 text-white text-xs px-4 py-2 rounded-full backdrop-blur-sm">
                    Point at customer's QR code
                  </span>
                </div>
                <div className="absolute bottom-4 right-4">
                  <button onClick={() => simulateAcceptOffer()} className="bg-amber-500 text-white text-xs px-4 py-2 rounded-full font-semibold shadow-lg">
                    Simulate Scan
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 mb-6">Open camera to scan customer QR codes</p>
                <button
                  onClick={startCamera}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 rounded-2xl text-white font-bold text-lg shadow-[0_4px_14px_rgba(232,145,58,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Open Scanner
                </button>
              </div>
            )}
          </div>

          {scanning && (
            <button onClick={stopCamera} className="w-full py-3 bg-gray-200 hover:bg-gray-300 rounded-xl text-gray-700 font-medium transition-colors text-sm">
              Close Camera
            </button>
          )}

          {error && <p className="text-sm text-red-500 text-center font-medium">{error}</p>}

          {/* Manual code entry */}
          <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Manual Code Entry</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter offer code..."
                className="flex-1 px-4 py-2.5 bg-white/60 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500"
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              <button
                onClick={handleManualSubmit}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </>
      )}

      {/* Recent Scans */}
      {recentScans.length > 0 && !scannedResult && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Recent Scans</h3>
          <div className="space-y-2">
            {recentScans.map((scan, i) => (
              <div key={i} className="bg-white/70 backdrop-blur-md border border-white/60 rounded-xl p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{scan.customerName}</p>
                    <p className="text-[10px] text-gray-500">{scan.product} · {scan.discount}% off</p>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
