// ═══════════════════════════════════════════════════════════════
// MOMENTO — Offer Engine (OpenAI Service)
// Isolated service for generating offer parameters via AI
// Strict JSON schema enforcement with discount validation
// ═══════════════════════════════════════════════════════════════
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are MOMENTO's offer parameter engine. You generate structured JSON parameters for hyper-personalized, time-limited merchant offers.

RULES:
- Return ONLY valid JSON — no markdown, no explanation
- discount: integer 5-{maxDiscount} — use MINIMUM effective discount (less = better)
- featuredProduct: specific item from merchant category
- headlineTone: one of [warm_comfort, cold_weather_warmth, rain_incoming, cozy_invitation, discovery, urgency_gentle]
- urgencyLevel: one of [gentle, moderate, urgent]
- expiryMinutes: 8-18 (higher urgency = shorter)
- visualMood: one of [warm_amber, cozy, fresh, energetic, calm]
- colorPrimary: hex color matching the mood
- emotionalHook: one of [cold_weather_warmth, rain_incoming, cozy_invitation, discovery, time_escape, local_gem]
- ctaText: max 3 words, action-oriented
- brandedEnding.dismiss: always "Another moment is coming."
- brandedEnding.expire: always "This moment has passed."

CONTEXT & DISCOUNT RULES:
- Discount Formula: START at minimum (5%), ADD +5% if weather is bad, ADD +5% if merchant is quiet (>50% below baseline), ADD +5% if user mobility is 'walking' and free time < 15m.
- Never exceed the merchant's maxDiscount.
- High user receptivity implies they are already likely to buy -> keep discount low.
- ZERO personal data in response — no names, no locations, no identifiers.`;

export async function generateOffer(context) {
  const { weather, merchant, intent } = context;

  const userPrompt = `Generate offer parameters for:
- Weather: ${weather.feelsLike}°C feels-like, ${weather.condition}, rain probability ${(weather.rainProbability * 100).toFixed(0)}%
- Merchant: ${merchant.name} (${merchant.category}), quiet score: ${((1 - (context.quietRatio || 0.3)) * 100).toFixed(0)}% below baseline
- Merchant rules: max discount ${merchant.maxDiscount}%, offers: ${merchant.offerTypes.join(', ')}
- User intent: ${intent?.state || 'receptive-browsing'}, mobility: ${intent?.mobility || 'walking'}, free minutes: ${intent?.freeMinutes || 15}
- District: ${intent?.district || merchant.district}
- Time: ${new Date().toLocaleTimeString('de-DE')}

Return JSON only.`;

  const startTime = Date.now();

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content || '{}';
    const params = JSON.parse(raw);

    // Enforce discount cap
    if (params.discount > merchant.maxDiscount) {
      params.discount = merchant.maxDiscount;
    }
    if (params.discount < 5) params.discount = 5;

    // Ensure branded endings
    if (!params.brandedEnding) params.brandedEnding = {};
    params.brandedEnding.dismiss = 'Another moment is coming.';
    params.brandedEnding.expire = 'This moment has passed.';

    const generationTimeMs = Date.now() - startTime;

    return {
      params,
      metadata: {
        model: response.model || 'gpt-4o-mini',
        tokensUsed: response.usage?.total_tokens || null,
        promptTokens: response.usage?.prompt_tokens || null,
        completionTokens: response.usage?.completion_tokens || null,
        generationTimeMs,
        temperature: 0.7,
        contextSignals: 3,
        isLiveGenerated: true,
      },
    };
  } catch (err) {
    console.error('[OfferEngine] AI generation failed:', err.message);
    return getFallbackOffer(merchant, weather);
  }
}

function getFallbackOffer(merchant, weather) {
  const isCold = weather.feelsLike < 12;
  return {
    params: {
      discount: Math.min(15, merchant.maxDiscount),
      featuredProduct: merchant.offerTypes[0] === 'hot_drinks' ? 'Cappuccino + Croissant' : merchant.offerTypes[0],
      headlineTone: isCold ? 'cold_weather_warmth' : 'cozy_invitation',
      urgencyLevel: 'gentle',
      expiryMinutes: 14,
      visualMood: isCold ? 'warm_amber' : 'cozy',
      colorPrimary: isCold ? '#C4783A' : '#8B7355',
      emotionalHook: isCold ? 'cold_weather_warmth' : 'cozy_invitation',
      ctaText: isCold ? 'Warm me up' : 'Take a break',
      brandedEnding: {
        dismiss: 'Another moment is coming.',
        expire: 'This moment has passed.',
      },
    },
    metadata: {
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
}
