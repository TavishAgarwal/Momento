// ═══════════════════════════════════════════════════════════════
// MOMENTO — Weather Service
// Fetches real weather from OpenWeatherMap with 10-min cache
// Accepts dynamic lat/lon from user GPS — falls back to config
// ═══════════════════════════════════════════════════════════════
import config from '../config/context.config.json' with { type: 'json' };

// Per-coordinate cache: key = "lat,lon" rounded to 2 decimals
const weatherCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const MOCK_WEATHER = {
  temp: 7.2,
  feelsLike: 4.8,
  condition: 'overcast',
  description: 'Overcast clouds',
  humidity: 78,
  windSpeed: 12.4,
  rainProbability: 0.75,
  icon: '04d',
  city: 'Unknown',
};

function cacheKey(lat, lon) {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export async function getWeather(userLat, userLon) {
  // Use user coords if provided, otherwise fall back to config
  const lat = userLat ?? config.coordinates.lat;
  const lon = userLon ?? config.coordinates.lon;
  const key = cacheKey(lat, lon);

  // Return cache if fresh
  const cached = weatherCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached;
  }

  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    console.log('[Weather] No API key — using mock data');
    const mock = { ...MOCK_WEATHER, source: 'mock', fetchedAt: Date.now() };
    weatherCache.set(key, mock);
    return mock;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather API ${res.status}`);
    const data = await res.json();

    const result = {
      temp: data.main.temp,
      feelsLike: data.main.feels_like,
      condition: data.weather[0]?.main?.toLowerCase() || 'unknown',
      description: data.weather[0]?.description || '',
      humidity: data.main.humidity,
      windSpeed: data.wind?.speed || 0,
      rainProbability: data.rain ? 0.9 : data.clouds?.all > 70 ? 0.6 : 0.2,
      icon: data.weather[0]?.icon || '01d',
      city: data.name || config.city,
      source: 'live',
      fetchedAt: Date.now(),
    };
    weatherCache.set(key, result);
    console.log(`[Weather] Live @ ${lat.toFixed(2)},${lon.toFixed(2)}: ${result.temp}°C, ${result.condition}`);
    return result;
  } catch (err) {
    console.warn('[Weather] API failed, using mock:', err.message);
    const fallback = { ...MOCK_WEATHER, source: 'mock-fallback', fetchedAt: Date.now() };
    weatherCache.set(key, fallback);
    return fallback;
  }
}

export function isColdWeather(weather) {
  return weather.feelsLike < (config.thresholds?.weatherCold || 12);
}

export function isRainy(weather) {
  return weather.rainProbability > (config.thresholds?.rainProbability || 0.6);
}
