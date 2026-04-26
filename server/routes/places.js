// ═══════════════════════════════════════════════════════════════
// MOMENTO — Places & Geocoding Route (Overpass + Nominatim Proxy)
// POST /api/places/nearby — real cafés/restaurants/shops from OSM
// GET  /api/places/geocode — reverse geocode via Nominatim
// No API keys required — fully free
// ═══════════════════════════════════════════════════════════════
import { Router } from 'express';

const router = Router();

// In-memory caches
const placesCache = new Map();
const geocodeCache = new Map();
const PLACES_CACHE_TTL = 5 * 60 * 1000;  // 5 minutes
const GEOCODE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function cacheKey(lat, lon, precision = 3) {
  return `${lat.toFixed(precision)},${lon.toFixed(precision)}`;
}

// ─── POST /api/places/nearby ─────────────────────────────────
// Queries Overpass API for real venues. Auto-expands radius if
// initial query returns too few results.
router.post('/nearby', async (req, res) => {
  try {
    const { lat, lon, radius = 1000 } = req.body;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon are required' });
    }

    const key = cacheKey(lat, lon);
    const cached = placesCache.get(key);
    if (cached && Date.now() - cached.fetchedAt < PLACES_CACHE_TTL) {
      console.log(`[Places] Cache hit for ${key} (${cached.data.length} places)`);
      return res.json(cached.data);
    }

    // Try progressively wider radii: 1000m → 2000m → 3000m
    const radii = [Math.max(radius, 1000), 2000, 3000];
    let places = [];

    for (const r of radii) {
      places = await queryOverpass(lat, lon, r);
      if (places.length >= 3) break;
      console.log(`[Places] Only ${places.length} results at ${r}m, expanding...`);
    }

    // Calculate distances and sort
    const result = places
      .filter((el) => el.tags?.name)
      .map((el) => {
        const distance = haversineDistance(lat, lon, el.lat, el.lon);
        const category = el.tags.amenity || el.tags.shop || 'place';
        return {
          id: `osm-${el.id}`,
          name: el.tags.name,
          category,
          lat: el.lat,
          lon: el.lon,
          distance: Math.round(distance),
          address: el.tags['addr:street']
            ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}`.trim()
            : null,
          cuisine: el.tags.cuisine || null,
          openingHours: el.tags.opening_hours || null,
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 25);

    placesCache.set(key, { data: result, fetchedAt: Date.now() });
    console.log(`[Places] Found ${result.length} venues near ${lat.toFixed(4)},${lon.toFixed(4)}`);

    res.json(result);
  } catch (err) {
    console.error('[Places] Overpass query failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch nearby places', message: err.message });
  }
});

// ─── GET /api/places/geocode?lat=X&lon=Y ─────────────────────
// Reverse geocode via Nominatim (proxied to avoid browser CORS)
router.get('/geocode', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'lat and lon query params are required' });
    }

    const key = cacheKey(lat, lon, 4);
    const cached = geocodeCache.get(key);
    if (cached && Date.now() - cached.fetchedAt < GEOCODE_CACHE_TTL) {
      return res.json(cached.data);
    }

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=16`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'MomentoPWA/1.0 (hackathon demo)' },
    });

    if (!response.ok) {
      throw new Error(`Nominatim returned ${response.status}`);
    }

    const data = await response.json();
    const addr = data.address || {};

    const result = {
      city: addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.state_district || 'Unknown',
      district: addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || addr.town || addr.city || 'Unknown',
      state: addr.state || null,
      country: addr.country || null,
      postcode: addr.postcode || null,
      displayName: data.display_name || null,
    };

    geocodeCache.set(key, { data: result, fetchedAt: Date.now() });
    console.log(`[Geocode] ${lat.toFixed(4)},${lon.toFixed(4)} → ${result.district}, ${result.city}`);

    res.json(result);
  } catch (err) {
    console.error('[Geocode] Nominatim failed:', err.message);
    res.json({ city: 'Unknown', district: 'Unknown', error: err.message });
  }
});

// ─── Overpass Query Helper ───────────────────────────────────
async function queryOverpass(lat, lon, radius) {
  // CRITICAL: Overpass API rejects queries with leading/trailing whitespace
  const query = `[out:json][timeout:15];(node["amenity"~"cafe|restaurant|bakery|bar|fast_food|ice_cream|pub|biergarten"](around:${radius},${lat},${lon});node["shop"~"coffee|bakery|chocolate|pastry|tea|convenience"](around:${radius},${lat},${lon});way["amenity"~"cafe|restaurant|bakery"](around:${radius},${lat},${lon}););out body center;`;

  const overpassUrl = 'https://overpass-api.de/api/interpreter';
  const body = `data=${encodeURIComponent(query)}`;
  
  console.log(`[Places] Querying Overpass: radius=${radius}m, lat=${lat.toFixed(4)}, lon=${lon.toFixed(4)}`);
  
  const response = await fetch(overpassUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'MomentoPWA/1.0',
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`[Places] Overpass HTTP ${response.status}: ${text.slice(0, 200)}`);
    throw new Error(`Overpass API returned ${response.status}`);
  }

  const data = await response.json();
  console.log(`[Places] Overpass returned ${(data.elements || []).length} raw elements at radius ${radius}m`);
  return data.elements || [];
}

// ─── GET /api/places/ip-locate ───────────────────────────────
// Fallback: detect user's approximate location from their IP
router.get('/ip-locate', async (req, res) => {
  try {
    // Get the real client IP (forwarded headers or direct connection)
    const clientIp = req.headers['x-forwarded-for']?.toString().split(',')[0].trim()
      || req.socket.remoteAddress
      || '';

    // Skip private/localhost IPs — use empty (auto-detect) for those
    const isPrivate = !clientIp || clientIp === '::1' || clientIp.startsWith('127.') || clientIp.startsWith('192.168.') || clientIp.startsWith('10.');
    
    // Try ip-api.com first (pass client IP if public, else auto)
    const ipParam = isPrivate ? '' : `/${clientIp}`;
    const response = await fetch(`http://ip-api.com/json${ipParam}?fields=status,lat,lon,city,regionName,country`);
    const data = await response.json();
    
    if (data.status === 'success' && data.lat && data.lon) {
      const result = {
        lat: data.lat,
        lon: data.lon,
        city: data.city || 'Unknown',
        region: data.regionName || '',
        country: data.country || '',
      };
      console.log(`[IP-Locate] ${result.city}, ${result.region} (${result.lat.toFixed(4)}, ${result.lon.toFixed(4)}) [IP: ${isPrivate ? 'auto' : clientIp}]`);
      return res.json(result);
    }
    
    throw new Error('IP geolocation returned no data');
  } catch (err) {
    console.error('[IP-Locate] Failed:', err.message);
    res.status(500).json({ error: 'IP geolocation failed' });
  }
});

export { router as placesRouter };
