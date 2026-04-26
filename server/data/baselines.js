// ═══════════════════════════════════════════════════════════════
// MOMENTO — Payone Transaction Baselines
// Historical average transactions per 15-min window per merchant
// Used by payoneSimulator to detect quiet periods
// ═══════════════════════════════════════════════════════════════

// Key format: `${merchantId}:${dayOfWeek}:${hour}`
// dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
// Values = average transactions per 15-minute window

const BASELINES = {
  // Café Müller — busy mornings, quiet Tuesday-Thursday midday
  'cafe-mueller:1:10': 10, 'cafe-mueller:1:11': 12, 'cafe-mueller:1:12': 8,
  'cafe-mueller:2:10': 11, 'cafe-mueller:2:11': 12, 'cafe-mueller:2:12': 9,
  'cafe-mueller:3:10': 10, 'cafe-mueller:3:11': 11, 'cafe-mueller:3:12': 8,
  'cafe-mueller:4:10': 13, 'cafe-mueller:4:11': 14, 'cafe-mueller:4:12': 11,
  'cafe-mueller:5:10': 15, 'cafe-mueller:5:11': 16, 'cafe-mueller:5:12': 14,
  'cafe-mueller:6:10': 18, 'cafe-mueller:6:11': 20, 'cafe-mueller:6:12': 17,
  'cafe-mueller:0:10': 16, 'cafe-mueller:0:11': 18, 'cafe-mueller:0:12': 15,

  // Bäckerei Schmidt — afternoon quiet
  'bäckerei-schmidt:0:14': 8, 'bäckerei-schmidt:0:15': 6, 'bäckerei-schmidt:0:16': 5,
  'bäckerei-schmidt:1:14': 7, 'bäckerei-schmidt:1:15': 5, 'bäckerei-schmidt:1:16': 4,
  'bäckerei-schmidt:4:14': 9, 'bäckerei-schmidt:4:15': 7, 'bäckerei-schmidt:4:16': 6,

  // Buchhandlung am Berg — weekday midday quiet
  'buchhandlung-berg:1:11': 4, 'buchhandlung-berg:1:12': 5, 'buchhandlung-berg:1:13': 4,
  'buchhandlung-berg:2:11': 5, 'buchhandlung-berg:2:12': 6, 'buchhandlung-berg:2:13': 5,
  'buchhandlung-berg:3:11': 4, 'buchhandlung-berg:3:12': 5, 'buchhandlung-berg:3:13': 4,
  'buchhandlung-berg:4:11': 5, 'buchhandlung-berg:4:12': 6, 'buchhandlung-berg:4:13': 5,
};

const DEFAULT_BASELINE = 8;

export function getBaseline(merchantId, dayOfWeek, hour) {
  const key = `${merchantId}:${dayOfWeek}:${hour}`;
  return BASELINES[key] || DEFAULT_BASELINE;
}

export function getAllBaselines() {
  return { ...BASELINES };
}

export { DEFAULT_BASELINE };
