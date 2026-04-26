// ═══════════════════════════════════════════════════════════════
// MOMENTO — Context Evaluation Route
// POST /api/context/evaluate — evaluates all 3 clocks
// Returns green/yellow/red per clock + overall readiness
// Accepts user lat/lon for live weather at their location
// ═══════════════════════════════════════════════════════════════
import { Router } from 'express';
import { getWeather, isColdWeather, isRainy } from '../services/weatherService.js';
import { getStatus } from '../services/payoneSimulator.js';
import { getMerchant } from '../data/merchants.js';

const router = Router();

router.post('/evaluate', async (req, res) => {
  try {
    const { merchantId, intent, lat, lon, city, district } = req.body;
    const merchant = getMerchant(merchantId || 'cafe-mueller');
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Use user's live coordinates for weather if provided
    const weather = await getWeather(lat, lon);
    const payoneStatus = getStatus(merchant.id);

    // === CLOCK 1: Merchant Quiet Clock ===
    const quietRatio = 1 - payoneStatus.ratio; // Inverted: high = quiet
    const merchantClock = {
      name: 'Merchant Quiet Clock',
      signal: 'Payone transaction velocity',
      value: quietRatio,
      threshold: 0.4,
      active: quietRatio >= 0.4,
      status: quietRatio >= 0.6 ? 'green' : quietRatio >= 0.4 ? 'yellow' : 'red',
      detail: `${Math.round(quietRatio * 100)}% below baseline (need 40%+)`,
    };

    // === CLOCK 2: User Intent Clock ===
    const userIntent = intent || { state: 'passive', receptivity: 0.5, mobility: 'stationary', freeMinutes: 0 };
    const intentScore = userIntent.receptivity || (userIntent.state === 'receptive-browsing' ? 0.8 : 0.4);
    const userClock = {
      name: 'User Intent Clock',
      signal: 'On-device behavior model',
      value: intentScore,
      threshold: 0.7,
      active: intentScore >= 0.7,
      status: intentScore >= 0.8 ? 'green' : intentScore >= 0.7 ? 'yellow' : 'red',
      detail: `Intent: ${userIntent.state || 'unknown'}, receptivity: ${(intentScore * 100).toFixed(0)}%`,
    };

    // === CLOCK 3: City Ambient Clock ===
    const cold = isColdWeather(weather);
    const rainy = isRainy(weather);
    const now = new Date();
    const hour = now.getHours();
    const isComfortHours = hour >= 10 && hour <= 21;
    const ambientScore = ((cold || rainy ? 0.4 : 0.2) + (isComfortHours ? 0.4 : 0.1) + 0.2) ;
    const cityClock = {
      name: 'City Ambient Clock',
      signal: 'Weather + time-of-day',
      value: ambientScore,
      threshold: 0.5,
      active: ambientScore >= 0.5,
      status: ambientScore >= 0.7 ? 'green' : ambientScore >= 0.5 ? 'yellow' : 'red',
      detail: `${weather.feelsLike}°C, ${weather.condition}, ${cold ? 'cold' : 'mild'}, ${isComfortHours ? 'comfort hours' : 'off-hours'}`,
      weather: {
        temp: weather.temp,
        feelsLike: weather.feelsLike,
        condition: weather.condition,
        rainProbability: weather.rainProbability,
        source: weather.source,
        city: weather.city || city || 'Unknown',
      },
    };

    const allActive = merchantClock.active && userClock.active && cityClock.active;
    const activeCount = [merchantClock, userClock, cityClock].filter(c => c.active).length;

    res.json({
      ready: allActive,
      activeClocks: activeCount,
      totalClocks: 3,
      clocks: [merchantClock, userClock, cityClock],
      recommendation: allActive ? 'GENERATE_OFFER' : activeCount >= 2 ? 'WAIT_FOR_ALIGNMENT' : 'NOT_READY',
      evaluatedAt: Date.now(),
      location: { city: weather.city || city, district: district || 'Unknown' },
    });
  } catch (err) {
    console.error('[Context] Evaluation error:', err);
    res.status(500).json({ error: 'Context evaluation failed' });
  }
});

// GET /api/context/weather — current weather snapshot (supports query params)
router.get('/weather', async (req, res) => {
  const lat = req.query.lat ? parseFloat(req.query.lat) : undefined;
  const lon = req.query.lon ? parseFloat(req.query.lon) : undefined;
  const weather = await getWeather(lat, lon);
  res.json(weather);
});

export { router as contextRouter };
