# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two equal primary audiences:

1. **Local Cebuano commuters** — daily riders who know the general system but need to confirm which route to take, check stops, or look up a code fast — often on the street, mid-trip, phone in hand.
2. **Visitors and tourists** — people unfamiliar with the jeepney system who need orientation, landmarks, and confidence that the information is trustworthy.

Both groups reach for the app under time pressure and in mobile conditions.

## Product Purpose

Route7 (Sugbu Buddy) is a single-app Cebu City transit companion covering jeepney routes, tourist spots, and emergency hotlines. Its purpose is to reduce the friction of moving around Cebu — both for people who ride every day and for those navigating the city for the first time.

Success: a user figures out which jeepney to take (or which spot to visit, or who to call) without needing to ask a stranger or leave the app.

## Positioning

Route7 is the only place where Cebu jeepney routes, tourist destinations, and emergency contacts live together in one curated, mobile-ready guide. The data is maintained by a fellow commuter who actually rides these routes — which makes it more credible than a generic mapping service or a forum thread.

## Operating Context

- Primary device: mobile phone, used outdoors in bright light, one hand, often while standing or walking.
- Connectivity: variable — the app should feel fast and usable on a weak signal.
- Use moment: point-of-decision (standing at a stop, arriving in the city, or in an emergency).

## Capabilities and Constraints

- **Routes tab:** Jeepney route directory with search, route codes, and an interactive Leaflet map showing route paths.
- **Dictionary tab:** Bisaya/Cebuano phrases and transit terms useful for commuters.
- **Spots tab:** Curated tourist and landmark locations with associated jeepney routes.
- **Hotlines tab:** Emergency and public service contacts for Cebu City.
- **Stack:** React 19 + Vite + Tailwind CSS v4, deployed on Vercel. Leaflet for maps.
- **Splash screen** with route search entry and animated intro.
- No login, no user accounts, no user-generated content.

## Brand Commitments

- **Name:** Route7 — the "7" rendered in yellow (`#FFBE0B`) against the dark background; this is a visual identity anchor.
- **Alias:** "Sugbu Buddy" — used in the page title and meta description.
- **Dark theme:** Deliberate identity choice, not a default. The dark base (`#0b0c10`) is the product's world.
- **Mobile-first:** The primary usage scenario is a phone screen on the street. Every surface must work at 375px before it works at 1280px.
- **Voice:** Made by a fellow commuter. Warm, local, no corporate tone. The footer credit "Made by a fellow commuter sleepysevi" is part of the personality.

## Evidence on Hand

- Route coordinate data in `data/route-coords.js` and `data/routes.json` — curated, real Cebu routes.
- Spots data in `data/spots.json`.
- Dictionary data in `data/dictionary.json`.
- No testimonials, press, or benchmark data on hand.

## Product Principles

1. **Legibility under pressure.** Everything must be scannable in two seconds on a bright street. Clarity beats decoration.
2. **One app for the whole trip.** Routes, spots, hotlines — no bouncing between tabs or external apps.
3. **Local credibility.** Data and tone come from someone who actually knows Cebu. Authenticity is the product's trust signal.
4. **Mobile-first, always.** Designed for a hand, not a desk. Responsive is a floor, not a feature.
5. **Fast and unobtrusive.** No loaders, no sign-ins, no friction between the user and the answer they need.
