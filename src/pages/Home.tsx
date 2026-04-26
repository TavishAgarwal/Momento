import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOffer } from '../context/OfferContext';
import { useTripleClock } from '../hooks/useTripleClock';
import TripleClock from '../components/TripleClock';
import OfferCard from '../components/OfferCard';
import QRRedemption from '../components/QRRedemption';
import DemoControls from '../components/DemoControls';
import PayoneFeed from '../components/PayoneFeed';
import { api } from '../services/api';
import type { NearbyPlace } from '../services/api';
import { onDeviceModel } from '../services/onDeviceModel';
import { locationService } from '../services/locationService';
import { useLocation } from 'react-router-dom';
import type { Offer } from '../types';

export default function Home() {
  const { user } = useAuth();
  const { currentOffer, setCurrentOffer, addToHistory, isGenerating, setIsGenerating } = useOffer();
  const { context, isLoading } = useTripleClock(
    user?.role === 'merchant' ? user.merchantId : 'cafe-mueller'
  );
  const [showQR, setShowQR] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnlocked, setShowUnlocked] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [locationReady, setLocationReady] = useState(false);
  const [greeting, setGreeting] = useState({ city: '', district: '' });
  const [placesLoading, setPlacesLoading] = useState(false);
  const [liveWeather, setLiveWeather] = useState<any>(null);
  const locationAcquiredRef = useRef(false);
  const routeLocation = useLocation();
  const isDemo = new URLSearchParams(routeLocation.search).get('demo') === 'true';

  // Once we have coords, fetch everything
  const onCoordsAcquired = async (lat: number, lon: number) => {
    if (locationAcquiredRef.current) return;
    locationAcquiredRef.current = true;
    console.log(`[Home] 📍 Coordinates acquired: ${lat.toFixed(5)}, ${lon.toFixed(5)}`);

    // Store in location service for other consumers
    locationService.setLocationManually(lat, lon);
    setLocationReady(true);

    // Fire all 3 requests in parallel: geocode, places, weather
    const [geoResult, placesResult, weatherResult] = await Promise.allSettled([
      // 1. Geocode
      fetch(`/api/places/geocode?lat=${lat}&lon=${lon}`).then(r => r.json()),
      // 2. Places
      api.getNearbyPlaces(lat, lon, 1500),
      // 3. Weather at user location
      api.getWeather(lat, lon) as Promise<any>,
    ]);

    // Handle geocode
    if (geoResult.status === 'fulfilled' && geoResult.value) {
      const geo = geoResult.value;
      console.log(`[Home] ✅ Geocoded: ${geo.district}, ${geo.city}`);
      setGreeting({ city: geo.city || '', district: geo.district || geo.city || '' });
      locationService.setLocationManually(lat, lon, geo.city, geo.district);
    } else {
      console.warn('[Home] ❌ Geocode failed:', geoResult);
    }

    // Handle places
    if (placesResult.status === 'fulfilled' && Array.isArray(placesResult.value)) {
      console.log(`[Home] ✅ Found ${placesResult.value.length} nearby places`);
      setNearbyPlaces(placesResult.value);
    } else {
      console.warn('[Home] ❌ Places failed:', placesResult);
    }

    // Handle weather
    if (weatherResult.status === 'fulfilled' && weatherResult.value) {
      console.log(`[Home] ✅ Weather: ${weatherResult.value.temp}°C, ${weatherResult.value.condition}`);
      setLiveWeather(weatherResult.value);
    } else {
      console.warn('[Home] ❌ Weather failed:', weatherResult);
    }
  };

  // Request GPS with IP fallback on mount — but skip if we already have valid coords
  useEffect(() => {
    let cancelled = false;

    async function acquireLocation() {
      // Check if we already have location from a previous mount (tab switch)
      const existing = locationService.getCurrentLocation();
      if (existing.coordinates?.lat && existing.coordinates?.lon) {
        console.log('[Home] 📍 Reusing existing location:', existing.district || existing.city);
        locationAcquiredRef.current = true;
        setLocationReady(true);
        setGreeting({ city: existing.city || '', district: existing.district || existing.city || '' });
        // Still fetch places/weather if not loaded
        if (nearbyPlaces.length === 0) {
          try {
            const places = await api.getNearbyPlaces(existing.coordinates.lat, existing.coordinates.lon, 1500);
            if (Array.isArray(places)) setNearbyPlaces(places);
          } catch {}
        }
        if (!liveWeather) {
          try {
            const w = await api.getWeather(existing.coordinates.lat, existing.coordinates.lon);
            if (w) setLiveWeather(w);
          } catch {}
        }
        return;
      }

      // Strategy 1: Try browser GPS
      const gpsPromise = new Promise<{lat: number; lon: number} | null>((resolve) => {
        if (!navigator.geolocation) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return;
            resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          },
          (err) => {
            console.warn(`[Home] GPS failed: ${err.message} (code ${err.code})`);
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
      });

      // Strategy 2: IP-based geolocation
      const ipGeoPromise = fetch('/api/places/ip-locate')
        .then(r => r.json())
        .then(d => (d.lat && d.lon ? { lat: d.lat, lon: d.lon } : null))
        .catch(() => null);

      const gpsResult = await gpsPromise;
      if (gpsResult && !cancelled) {
        console.log('[Home] 🛰️ Using GPS location');
        await onCoordsAcquired(gpsResult.lat, gpsResult.lon);
        return;
      }

      console.log('[Home] 🌐 GPS unavailable, trying IP geolocation...');
      const ipResult = await ipGeoPromise;
      if (ipResult && !cancelled) {
        console.log('[Home] 🌐 Using IP-based location');
        await onCoordsAcquired(ipResult.lat, ipResult.lon);
        return;
      }

      console.warn('[Home] ❌ All location methods failed');
      setLocationReady(true);
    }

    acquireLocation();

    // Service Worker: unregister stale workers, then register fresh
    if ('serviceWorker' in navigator) {
      // First, clear any old service workers that may be serving cached content
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().then(() => console.log('[Home] 🧹 Unregistered old SW'));
        }
        // Then register the new one
        navigator.serviceWorker.register('/sw.js').then((reg) => {
          console.log('[Home] ✅ Service Worker registered:', reg.scope);
          // Force the new service worker to take over immediately
          if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }).catch((err) => {
          console.warn('[Home] ❌ SW registration failed:', err);
        });
      });
    }
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        console.log('[Home] 🔔 Notification permission:', perm);
      });
    }

    return () => { cancelled = true; };
  }, []);

  // Auto-generate only after user has been on the page for a while (not on first login)
  const hasBeenOnPageRef = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => { hasBeenOnPageRef.current = true; }, 10000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (context?.ready && !currentOffer && !isGenerating && !showUnlocked && hasBeenOnPageRef.current) {
      setShowUnlocked(true);
      setTimeout(() => {
        setShowUnlocked(false);
        generateOffer();
      }, 2000);
    }
  }, [context?.ready]);

  // Use live weather if available, else fall back to context clock weather
  const contextWeather = context?.clocks?.[2]?.weather;
  const weather = liveWeather || contextWeather || { feelsLike: 0, temp: 0, condition: 'clear', rainProbability: 0 };
  const displayTemp = liveWeather?.temp ?? weather.feelsLike ?? 0;
  const intent = onDeviceModel.getIntent();

  // Pick a moody background image based on weather condition
  const getMoodyImage = () => {
    const cond = (weather.condition || '').toLowerCase();
    if (cond.includes('rain') || cond.includes('drizzle')) return 'https://images.unsplash.com/photo-1515688594390-b649af70d282?q=80&w=800&auto=format&fit=crop';
    if (cond.includes('cloud')) return 'https://images.unsplash.com/photo-1444419988131-046ed4e508c7?q=80&w=800&auto=format&fit=crop';
    if (displayTemp > 25) return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&auto=format&fit=crop';
  };

  const generateOffer = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const offerIntent = onDeviceModel.getIntent();
      const loc = locationService.getCurrentLocation();

      const nearestPlace = nearbyPlaces.find(
        (p) => p.category === 'cafe' || p.category === 'restaurant' || p.category === 'bakery'
      ) || nearbyPlaces[0] || null;

      const offer = await api.generateOffer({
        merchantId: user?.merchantId || 'cafe-mueller',
        intent: offerIntent,
        district: loc.district || greeting.district || offerIntent.district,
        lat: loc.coordinates?.lat,
        lon: loc.coordinates?.lon,
        nearbyPlace: nearestPlace,
      }) as Offer;
      setCurrentOffer(offer);
      addToHistory(offer);
      onDeviceModel.recordInteraction('view');

      // Push notification via Service Worker → appears in phone notification panel
      if ('Notification' in window && Notification.permission === 'granted' && navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: {
            title: 'MOMENTO',
            body: offer.contextPrompt || `${offer.merchantName}: ${offer.params?.discount}% off your next order`,
            icon: '/icon-192.png',
            image: getMoodyImage(),
            tag: `momento-offer-${offer.id}`,
            data: { offerId: offer.id, merchantName: offer.merchantName }
          }
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = () => setShowQR(true);
  const handleDismiss = () => setCurrentOffer(null);

  // Dynamic greeting
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetingText = greeting.district && greeting.district !== 'Unknown' && greeting.district !== ''
    ? `${timeOfDay}, ${greeting.district}`
    : timeOfDay;

  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen pb-20">
      
      {/* 🔴 IN-APP CUSTOM NOTIFICATION OVERLAY */}
      {currentOffer && !showQR && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pointer-events-none animate-slide-down">
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl pointer-events-auto cursor-pointer" onClick={handleAccept}>
            {/* Catchy Background Image */}
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${getMoodyImage()})` }} />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            
            {/* Notification Content matching requested design */}
            <div className="relative p-5 border-l-2 border-t-2 border-b-2 border-white/20 rounded-l-2xl ml-2 my-2 text-white font-sans">
              {/* Header */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF4500] shadow-[0_0_8px_#FF4500]"></div>
                  <span className="text-[13px] font-bold tracking-widest uppercase">MOMENTO</span>
                </div>
                <span className="text-xs text-white/60">now</span>
              </div>
              
              {/* Body */}
              <div className="mb-4">
                <p className="text-[17px] font-medium leading-snug text-white/90">
                  {currentOffer.contextPrompt || `Cold outside? Your cappuccino is waiting.`}
                </p>
              </div>
              
              {/* Footer */}
              <div className="space-y-2">
                <div className="text-[13px] text-white/70 font-medium">
                  {currentOffer.merchantName} • 3 min walk • {currentOffer.params?.expiresIn} min left
                </div>
                <div className="text-[13px] font-bold tracking-wide text-white/90 uppercase">
                  [CLAIM — {currentOffer.params?.discount}% OFF]
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header and Weather */}
      <div className="flex justify-between items-start pt-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {greetingText}
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            {greeting.city && greeting.city !== 'Unknown' ? greeting.city : 'The moment finds the user.'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">{Math.round(displayTemp)}°C</div>
          <div className="text-xs text-gray-500 font-medium capitalize">{weather.condition}</div>
          <div className="text-xs text-amber-600 font-medium">{Math.round((weather.rainProbability || 0) * 100)}% rain</div>
        </div>
      </div>

      {/* Premium Pill Filters */}
      <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar pt-2">
        {['Nearby', 'Coffee', 'Offers', 'Dining'].map((label, i) => (
          <button key={label} className={`px-5 py-2.5 backdrop-blur-md border rounded-full text-sm shadow-sm whitespace-nowrap transition-colors ${
            i === 0
              ? 'bg-white/80 border-white/60 text-gray-900 font-semibold'
              : 'bg-white/40 border-white/30 text-gray-600 hover:text-gray-900 hover:bg-white/60 font-medium'
          }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Triple Clock */}
      {context && !currentOffer && (
        <div className="mt-4">
          <TripleClock clocks={context.clocks} allActive={context.ready} />
        </div>
      )}

      {/* Activity Context */}
      {!currentOffer && !isLoading && !isGenerating && !showUnlocked && (
        <div className="bg-white/70 backdrop-blur-md rounded-[24px] p-4 flex items-center justify-between border border-white/60 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-gray-900 capitalize">{intent.mobility || 'Walking'}</div>
              <div className="text-xs text-gray-500 font-medium">Free: {intent.freeMinutes || 20}m</div>
            </div>
          </div>
          {nearbyPlaces.length > 0 && (
            <div className="text-right">
              <div className="text-xs text-gray-700 font-semibold">{nearbyPlaces[0]?.name}</div>
              <div className="text-[10px] text-gray-400 font-medium">{nearbyPlaces[0]?.distance}m away · {nearbyPlaces.length} spots</div>
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white/70 backdrop-blur-md rounded-[24px] p-10 text-center border border-white/60 shadow-sm flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
            {!locationReady ? 'Getting your location...' : 'Sensing Context'}
          </div>
        </div>
      )}

      {/* Unlocked state */}
      {showUnlocked && (
        <div className="bg-white/70 backdrop-blur-md rounded-[24px] p-10 text-center border border-green-300 flex flex-col items-center justify-center gap-4 animate-fade-in animate-pulseGlow shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="text-4xl">⚡</div>
          <div className="text-sm font-bold uppercase tracking-widest text-green-600 animate-pulse">
            MOMENT UNLOCKED
          </div>
        </div>
      )}

      {/* Generating state */}
      {isGenerating && !showUnlocked && (
        <div className="bg-white/70 backdrop-blur-md rounded-[24px] p-10 text-center border border-amber-300 flex flex-col items-center justify-center gap-4 animate-fade-in shadow-sm">
          <div className="w-8 h-8 rounded-full border-2 border-amber-200 border-t-amber-500 animate-spin" />
          <div className="text-xs font-bold uppercase tracking-widest text-amber-600">
            Generating Moment
          </div>
        </div>
      )}

      {/* Waiting Area */}
      {!currentOffer && !isGenerating && !isLoading && !showUnlocked && context && !context.ready && (
        <div className="text-center py-6">
          <div className="mb-2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 font-medium">Waiting for the right moment.</p>
        </div>
      )}

      {/* Offer Card */}
      {currentOffer && !showQR && (
        <div className="animate-fade-in">
          <OfferCard offer={currentOffer} onAccept={handleAccept} onDismiss={handleDismiss} />
        </div>
      )}

      {/* QR Redemption */}
      {currentOffer && showQR && (
        <div className="animate-fade-in">
          <QRRedemption offer={currentOffer} onClose={() => { setShowQR(false); setCurrentOffer(null); }} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 text-center shadow-sm">
          <span className="font-bold mr-2">ERR_</span>{error}
        </div>
      )}

      {/* Nearby Places — REAL DATA */}
      {!currentOffer && (
        <div className="pt-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
            {nearbyPlaces.length > 0 ? `Discover Nearby (${nearbyPlaces.length})` : 'Discover'}
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
            {nearbyPlaces.length > 0 ? nearbyPlaces.slice(0, 10).map(place => (
              <div key={place.id} className="min-w-[160px] bg-white/60 backdrop-blur-md border border-white/60 rounded-[24px] p-4 flex-shrink-0 hover:bg-white/80 transition-colors shadow-sm">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm">{categoryEmoji(place.category)}</span>
                  <div className="font-medium text-gray-900 truncate text-sm">{place.name}</div>
                </div>
                <div className="text-xs text-gray-500 font-medium">{place.distance}m away</div>
                {place.cuisine && (
                  <div className="text-[10px] text-gray-400 mt-1 capitalize truncate">{place.cuisine}</div>
                )}
              </div>
            )) : (
              <div className="min-w-[200px] bg-white/60 backdrop-blur-md border border-white/60 rounded-[24px] p-4 flex-shrink-0 shadow-sm">
                <div className="font-medium text-gray-500 mb-1 text-sm">
                  {!locationReady ? '📡 Locating you...' : 'No places found nearby'}
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  {!locationReady ? 'Please allow GPS access' : 'Try refreshing the page'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Demo Controls */}
      {isDemo && !currentOffer && (
        <div className="pt-4 space-y-4">
          <DemoControls merchantId={user?.merchantId || 'cafe-mueller'} />
          <PayoneFeed merchantId={user?.merchantId || 'cafe-mueller'} />
        </div>
      )}


    </div>
  );
}

function categoryEmoji(category: string): string {
  const map: Record<string, string> = {
    cafe: '☕', coffee: '☕', restaurant: '🍽️', bakery: '🥐', bar: '🍸',
    fast_food: '🍔', ice_cream: '🍦', chocolate: '🍫', pastry: '🥧',
    tea: '🍵', convenience: '🏪', pub: '🍺',
  };
  return map[category] || '📍';
}
