// ═══════════════════════════════════════════════════════════════
// MOMENTO — Offer Generation Route
// POST /api/offer/generate — Triple Clock → AI → Offer
// GDPR: Zero personal data reaches Claude API
// ═══════════════════════════════════════════════════════════════
import { Router } from 'express';
import { generateOffer } from '../services/offerEngine.js';
import { getWeather } from '../services/weatherService.js';
import { getMerchant } from '../data/merchants.js';
import { getStatus } from '../services/payoneSimulator.js';
import { generateToken } from '../services/tokenGenerator.js';
import { emitOfferGenerated } from '../services/merchantSocket.js';
import crypto from 'crypto';

const router = Router();

// Env validation
if (!process.env.OPENAI_API_KEY) {
  console.warn('[Offer] ⚠ OPENAI_API_KEY not set — will use context-aware fallback offers');
}

// POST /api/offer/generate
router.post('/generate', async (req, res) => {
  try {
    const { merchantId, intent, district, lat, lon, nearbyPlace } = req.body;

    // Use a real nearby place if provided, otherwise fall back to hardcoded merchants
    let merchant;
    let merchantName;
    let merchantCategory;
    let merchantDistrict;
    let maxDiscount;
    let offerTypes;

    if (nearbyPlace && nearbyPlace.name) {
      // Real nearby place from Overpass API
      merchantName = nearbyPlace.name;
      merchantCategory = nearbyPlace.category || 'cafe';
      merchantDistrict = district || 'Nearby';
      maxDiscount = 20; // Default cap for real places
      offerTypes = categoryToOfferTypes(merchantCategory);
      merchant = {
        id: nearbyPlace.id || 'live-place',
        name: merchantName,
        category: merchantCategory,
        district: merchantDistrict,
        maxDiscount,
        offerTypes,
        avgTransaction: 8.50,
      };
    } else {
      merchant = getMerchant(merchantId || 'cafe-mueller');
      if (!merchant) {
        return res.status(404).json({ error: 'Merchant not found' });
      }
      merchantName = merchant.name;
      merchantCategory = merchant.category;
      merchantDistrict = merchant.district;
      maxDiscount = merchant.maxDiscount;
      offerTypes = merchant.offerTypes;
    }

    // Use user's live coordinates for weather
    const weather = await getWeather(lat, lon);
    const payoneStatus = getStatus(merchant.id);

    const context = {
      weather,
      merchant,
      intent: intent || { state: 'receptive-browsing', mobility: 'walking', freeMinutes: 15, district: merchantDistrict },
      quietRatio: payoneStatus?.ratio || 0.3,
    };

    const { params, metadata } = await generateOffer(context);

    // Generate offer ID and headline on server (params only — headline template)
    const offerId = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + (params.expiryMinutes || 14) * 60 * 1000;

    // Generate QR token
    const qrToken = generateToken({
      merchantId: merchant.id,
      offerId,
      discount: params.discount,
      expiryMinutes: params.expiryMinutes || 14,
    });

    const offer = {
      id: offerId,
      merchantId: merchant.id,
      merchantName: merchantName,
      params,
      createdAt: now,
      expiresAt,
      status: 'active',
      qrToken: qrToken.token,
      qrSignature: qrToken.signature,
      generationMetadata: metadata,
      nearbyPlace: nearbyPlace || null,
    };

    // Emit event to merchant dashboard
    emitOfferGenerated(merchant.id, offer);

    res.json(offer);
  } catch (err) {
    console.error('[Offer] Generation error:', err);
    res.status(500).json({ error: 'Offer generation failed', message: err.message });
  }
});

// Map OSM categories to offer types
function categoryToOfferTypes(category) {
  const map = {
    cafe: ['hot_drinks', 'pastries', 'coffee'],
    coffee: ['hot_drinks', 'coffee'],
    restaurant: ['meals', 'drinks', 'desserts'],
    bakery: ['bread', 'pastries', 'coffee'],
    bar: ['drinks', 'cocktails'],
    fast_food: ['meals', 'snacks', 'drinks'],
    ice_cream: ['ice_cream', 'desserts'],
    chocolate: ['chocolate', 'gifts'],
    pastry: ['pastries', 'desserts'],
    tea: ['hot_drinks', 'tea'],
  };
  return map[category] || ['food', 'drinks'];
}

// GET /api/offer/fallback — pre-built offer for offline/demo
router.get('/fallback', async (_req, res) => {
  const merchant = getMerchant('cafe-mueller');
  const weather = await getWeather();
  const offerId = crypto.randomUUID();
  const now = Date.now();

  const fallbackParams = {
    discount: 15,
    featuredProduct: 'Cappuccino + Croissant',
    headlineTone: 'cold_weather_warmth',
    urgencyLevel: 'gentle',
    expiryMinutes: 14,
    visualMood: 'warm_amber',
    colorPrimary: '#C4783A',
    emotionalHook: 'cold_weather_warmth',
    ctaText: 'Warm me up',
    brandedEnding: {
      dismiss: 'Another moment is coming.',
      expire: 'This moment has passed.',
    },
  };

  const qrToken = generateToken({
    merchantId: merchant.id,
    offerId,
    discount: fallbackParams.discount,
    expiryMinutes: 14,
  });

  const offer = {
    id: offerId,
    merchantId: merchant.id,
    merchantName: merchant.name,
    params: fallbackParams,
    createdAt: now,
    expiresAt: now + 14 * 60 * 1000,
    status: 'active',
    qrToken: qrToken.token,
    qrSignature: qrToken.signature,
    generationMetadata: {
      model: 'fallback',
      tokensUsed: null,
      promptTokens: null,
      completionTokens: null,
      generationTimeMs: 0,
      temperature: 0,
      contextSignals: 3,
      isLiveGenerated: false,
    },
  };

  emitOfferGenerated(merchant.id, offer);
  res.json(offer);
});

export { router as offerRouter };
