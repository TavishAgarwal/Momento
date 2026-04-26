// ═══════════════════════════════════════════════════════════════
// MOMENTO — Live Location Service
// Real GPS + server-side reverse geocoding for district/city
// 4-Tier Privacy: GPS → District → City → None
// ═══════════════════════════════════════════════════════════════
import type { LocationTier, LocationData } from '../types';

class LocationService {
  private currentTier: LocationTier = 4;
  private currentLocation: LocationData = {
    tier: 4,
    source: 'none',
  };
  private watchId: number | null = null;
  private listeners: Array<(loc: LocationData) => void> = [];

  constructor() {
    // Restore last known location from localStorage
    try {
      const stored = localStorage.getItem('momento_location');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.coordinates?.lat && parsed.coordinates?.lon) {
          this.currentLocation = parsed;
          this.currentTier = parsed.tier || 1;
          console.log(`[Location] Restored from cache: ${parsed.district}, ${parsed.city}`);
        }
      }
    } catch {}
  }

  async requestPermission(requestedTier: LocationTier): Promise<LocationData> {
    this.currentTier = requestedTier;

    switch (requestedTier) {
      case 1:
        return this.getGPSLocation();
      case 2:
        return this.getDistrictLocation();
      case 3:
        return this.getCityLocation();
      case 4:
      default:
        return this.getNoLocation();
    }
  }

  private async getGPSLocation(): Promise<LocationData> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('[Location] Geolocation not supported — falling back to city');
        resolve(this.getCityLocation());
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lon, accuracy } = pos.coords;
          console.log(`[Location] GPS acquired: ${lat.toFixed(4)}, ${lon.toFixed(4)} (±${accuracy?.toFixed(0)}m)`);

          // Reverse geocode via our server proxy (avoids browser CORS issues)
          const geo = await this.reverseGeocode(lat, lon);

          this.currentLocation = {
            tier: 1,
            coordinates: { lat, lon },
            accuracy,
            district: geo.district,
            city: geo.city,
            source: 'gps',
          };
          this.notifyListeners();
          resolve(this.currentLocation);
        },
        (err) => {
          console.warn('[Location] GPS denied/failed:', err.message);
          resolve(this.getDistrictLocation());
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  /** Start watching position for continuous updates */
  startWatching(): void {
    if (this.watchId !== null || !navigator.geolocation) return;

    this.watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon, accuracy } = pos.coords;
        const prevCoords = this.currentLocation.coordinates;

        // Only update if moved >100m to avoid excessive API calls
        if (prevCoords) {
          const dist = this.haversine(prevCoords.lat, prevCoords.lon, lat, lon);
          if (dist < 100) return;
        }

        console.log(`[Location] Position updated: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        const geo = await this.reverseGeocode(lat, lon);
        this.currentLocation = {
          tier: 1,
          coordinates: { lat, lon },
          accuracy,
          district: geo.district,
          city: geo.city,
          source: 'gps',
        };
        this.notifyListeners();
      },
      () => {}, // Silently ignore watch errors
      { enableHighAccuracy: true, maximumAge: 30000 }
    );
  }

  stopWatching(): void {
    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  onLocationUpdate(listener: (loc: LocationData) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l(this.currentLocation));
  }

  /** Reverse geocode via server proxy (avoids CORS issues with Nominatim) */
  private async reverseGeocode(lat: number, lon: number): Promise<{ city: string; district: string }> {
    try {
      const res = await fetch(`/api/places/geocode?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error(`Geocode API ${res.status}`);
      const data = await res.json();
      console.log(`[Location] Geocoded: ${data.district}, ${data.city}`);
      return {
        city: data.city || 'Unknown',
        district: data.district || data.city || 'Unknown',
      };
    } catch (err) {
      console.warn('[Location] Reverse geocode failed:', err);
      return { city: 'Unknown', district: 'Unknown' };
    }
  }

  private getDistrictLocation(): LocationData {
    this.currentLocation = {
      tier: 2,
      district: 'Unknown',
      city: 'Unknown',
      source: 'district-only',
    };
    return this.currentLocation;
  }

  private getCityLocation(): LocationData {
    this.currentLocation = {
      tier: 3,
      city: 'Unknown',
      source: 'city-only',
    };
    return this.currentLocation;
  }

  private getNoLocation(): LocationData {
    this.currentLocation = {
      tier: 4,
      source: 'none',
    };
    return this.currentLocation;
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /** Manually set location (called from Home.tsx after direct GPS acquisition) */
  setLocationManually(lat: number, lon: number, city?: string, district?: string): void {
    this.currentLocation = {
      tier: 1,
      coordinates: { lat, lon },
      city: city || this.currentLocation.city || 'Unknown',
      district: district || this.currentLocation.district || 'Unknown',
      source: 'gps',
    };
    this.currentTier = 1;
    console.log(`[Location] Manual set: ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
    // Persist to localStorage so refreshes don't lose accurate GPS
    try {
      localStorage.setItem('momento_location', JSON.stringify(this.currentLocation));
    } catch {}
  }

  getCurrentTier(): LocationTier {
    return this.currentTier;
  }

  getCurrentLocation(): LocationData {
    return this.currentLocation;
  }
}

export const locationService = new LocationService();
