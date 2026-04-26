# MOMENTO — The moment finds the user

> **Hack-Nation × World Bank Youth Summit 2026** · Challenge 01: Generative City-Wallet by DSV Gruppe

Traditional loyalty apps are broken. They rely on users actively hunting for deals, or they spam users with irrelevant notifications at the wrong time. MOMENTO flips this model entirely. It is an intelligent, context-aware city wallet that waits in the background. It doesn't send you an offer until the exact moment a local merchant needs you, and you are ready to receive it.

## The Problem
Current apps fail because they lack timing and context.
- **Spam:** Constant push notifications lead to notification fatigue and app uninstalls.
- **Static Offers:** Deals are identical for everyone, regardless of current inventory or store traffic.
- **No Timing:** A coffee discount at 4 PM when you're in a meeting is useless.

## The Solution — The Triple Clock
MOMENTO generates exactly *one* personalized offer only when three independent context signals perfectly align:

```text
[ 🏪 MERCHANT QUIET CLOCK ] — Payone transaction velocity drops below baseline.
             +
[ 👤 USER INTENT CLOCK ] — Device motion and screen behavior show receptivity.
             +
[ 🌆 CITY AMBIENT CLOCK ] — Weather and time of day support the action.
             =
[ ⚡ MOMENT UNLOCKED ] — One highly relevant, AI-generated offer is presented.
```

## Challenge Alignment — DSV Gruppe Requirements

| DSV Requirement | MOMENTO Implementation |
|---|---|
| **Payone Integration** | Real-time transaction velocity simulator with per-merchant baselines and quiet period detection (`payoneSimulator.js`) |
| **Sparkassen Ecosystem** | Revenue split visualization (Merchant / Platform / Sparkasse) in merchant dashboard |
| **Generative UI** | AI-generated offer parameters (discount, mood, color, CTA) assembled on-device into visual cards |
| **City-Wallet Concept** | Context-aware wallet that activates based on location, weather, and merchant need — not a coupon book |
| **Privacy by Design** | Zero PII reaches the server; anonymous rotating sessions; 4-tier location privacy |

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (React 19 + TypeScript + Tailwind CSS v4)         │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌─────────────┐  │
│  │TripleClock│ │OfferCard │ │QRRedemption│ │MerchantDash │  │
│  └────┬─────┘ └────┬─────┘ └─────┬──────┘ └──────┬──────┘  │
│       │ On-Device   │ GenUI       │ HMAC-SHA256   │Socket.io│
│  ┌────┴─────────────┴─────────────┴───────────────┴──────┐  │
│  │           Service Layer (api.ts, hooks/)               │  │
│  │  onDeviceModel │ sessionManager │ locationService      │  │
│  └────────────────┴────────────────┴─────────────────────┘  │
│            PWA Service Worker (Offline + Push)               │
├─────────────────────── /api/ ───────────────────────────────┤
│  BACKEND (Express + Socket.io)                              │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────────────────┐│
│  │ Context  │ │ Offer Engine │ │ Token Generator          ││
│  │ Evaluate │ │ (OpenAI API) │ │ (HMAC-SHA256, single-use)││
│  └────┬─────┘ └──────┬───────┘ └──────────────────────────┘│
│       │              │                                      │
│  ┌────┴──────┐ ┌─────┴────────┐ ┌────────────────────────┐ │
│  │ Weather   │ │ Payone       │ │ Places (Overpass/OSM)  │ │
│  │ Service   │ │ Simulator    │ │ Geocode (Nominatim)    │ │
│  └───────────┘ └──────────────┘ └────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## How It Works
1. **Passive Sensing:** MOMENTO securely monitors local weather, user device motion, and merchant transaction velocity in the background.
2. **Quiet Period Detected:** A local bakery experiences a sudden drop in foot traffic (detected via Payone data).
3. **Intent Matched:** A user is nearby, walking slowly, and it's starting to rain.
4. **AI Generation:** The OpenAI API generates the optimal discount and emotional hook to bring that user into the bakery right now.
5. **On-Device Assembly:** The final human-readable notification is constructed entirely on the user's device based on their private preferences.
6. **Redemption:** The user accepts the offer, generating a secure, single-use QR code for immediate redemption.

## Demo Flow (90-Second Walkthrough)
When running the local `/demo`, judges will experience the complete lifecycle:
- **Phase 1 – Context Sensing:** See the merchant dashboard as Payone detects Café Müller is 75% below its Tuesday transaction baseline.
- **Phase 2 – Clock Alignment:** Watch the Triple Clock align as the system detects a receptive user walking nearby as rain approaches.
- **Phase 3 – AI Generation:** View the backend AI engine instantly generating a mood-adaptive offer (e.g., "Warm up from the rain with 20% off").
- **Phase 4 – Offer Delivery:** Experience the GenUI presentation—colors, glows, and typewriter-text animations adapt to the "cozy" mood.
- **Phase 5 – QR Redemption:** Generate a secure, HMAC-signed QR code entirely offline.
- **Phase 6 – Analytics:** Review the revenue analytics, DSV split, and merchant dashboard update in real-time.

## What Makes It Different
- **vs. Coupon Apps:** No hunting, no scrolling. You only get an offer when the moment is right.
- **vs. Super Apps:** Focused entirely on serendipity and timing, not overwhelming utility.
- **vs. Discovery Apps:** MOMENTO doesn't just show you what's around; it creates a financial incentive based on real-time merchant need.

## Privacy By Design
MOMENTO enforces privacy at the architectural level:
- **Zero PII on the Server:** No personal data, GPS coordinates, or preferences ever leave the device.
- **On-Device Generation:** The server sends abstract parameters (e.g., `discount: 20`, `mood: cozy`); the device writes the copy.
- **4-Tier Location Privacy:** Users can disable GPS entirely and still receive offers based on district-level approximations or manual city selection.
- **Anonymous Sessions:** Identifiers rotate every 24 hours.

## Business Model
MOMENTO aligns incentives perfectly. Merchants pay **no subscription fees**. They only pay a performance-based 3-5% fee on *successful redemptions* generated during their quiet periods. It's risk-free yield management for Main Street.

## Tech Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4
- **Backend:** Node.js, Express, Socket.io (real-time merchant dashboard)
- **AI Engine:** OpenAI API (`gpt-4o-mini`, structured JSON output with `response_format`)
- **Location:** OpenStreetMap Overpass API + Nominatim (zero API key required)
- **Security:** HMAC-SHA256 single-use QR tokens with `timingSafeEqual` validation
- **Architecture:** Progressive Web App (PWA) with Service Worker + Push Notifications

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```
2. **Environment Setup**
   Copy `.env.example` to `.env` and add your API keys.
   ```bash
   cp .env.example .env
   ```
3. **Run Development Environment**
   Start both the React frontend and Express backend concurrently.
   ```bash
   npm run dev
   ```
4. **View the App**
   - Consumer experience: [https://localhost:5173/login](https://localhost:5173/login) → Quick Demo login as **Demo Consumer**
   - Merchant dashboard: Login as **Demo Merchant**
   - Automated 90-second demo: [https://localhost:5173/demo](https://localhost:5173/demo)

## Project Structure
```
├── server/              # Express backend (ES modules)
│   ├── routes/          # API endpoints (offer, context, places, redemption)
│   ├── services/        # Business logic (offerEngine, payoneSimulator, tokenGenerator)
│   ├── data/            # Merchant fixtures & baselines
│   └── config/          # Context configuration
├── src/                 # React 19 frontend (TypeScript)
│   ├── pages/           # Route pages (Home, Demo, MerchantDashboard, MyData)
│   ├── components/      # Reusable UI (TripleClock, OfferCard, QRRedemption)
│   ├── hooks/           # Custom hooks (useTripleClock, usePayoneFeed, useCountdown)
│   ├── services/        # Client services (api, onDeviceModel, sessionManager)
│   └── context/         # React context providers (Auth, Offer)
├── public/              # PWA assets (manifest.json, sw.js, icons)
└── .env.example         # Environment template
```

## License
MIT — See [LICENSE](./LICENSE)

---

*The moment finds the user.*
