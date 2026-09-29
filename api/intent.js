import { HOTLINES } from '../data/hotlines.js';

// ---------------------------------------------------------------------------
// Intent detection. Runs BEFORE any stop matching so messages like "nearest
// hospital" or "best lechon in Cebu" never hit the stop matcher.
// ---------------------------------------------------------------------------

const EMERGENCY_WORDS = [
  'hospital', 'hotline', 'hotlines', 'emergency', 'police', 'fire',
  'ambulance', 'rescue', '911', '117', '160',
];

const OFF_TOPIC_WORDS = [
  'lechon', 'food', 'restaurant', 'eat', 'hotel', 'resort', 'weather',
  'news', 'joke', 'song', 'movie', 'recipe', 'hotel', 'beach resort',
];

export function detectEmergencyIntent(text) {
  const norm = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const words = new Set(norm.split(' ').filter(Boolean));
  return EMERGENCY_WORDS.some((word) => words.has(word));
}

export function detectOffTopicIntent(text) {
  const norm = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const words = new Set(norm.split(' ').filter(Boolean));
  // Route/stop vocabulary means the message is on-topic even if it contains a
  // stray off-topic word ("food" in "jeep to the food market").
  const onTopicWords = new Set(['route', 'routes', 'jeepney', 'jeep', 'sakay', 'fare', 'stop', 'stops', 'terminal', 'transfer', 'get', 'ride', 'from', 'to']);
  if ([...onTopicWords].some((word) => words.has(word))) return false;
  return OFF_TOPIC_WORDS.some((word) => words.has(word));
}

// A route-code question asks about a jeepney code ("Where does 12L go after
// Colon?") instead of a trip between two places. Do not run place matching.
export function detectRouteCodeIntent(text) {
  return /\b[0-9]{1,2}[a-z]{0,2}\b|\bmi-[0-9]{2}[a-z]\b/i.test(String(text || ''));
}

// Hotlines reply mirrors the Hotlines tab data (plain text, no markdown).
export function formatHotlinesReply() {
  const lines = [
    'Emergency hotlines:',
    '• 911 — Cebu City Emergency',
    '• 117 — Police Emergency',
    '• (032) 253-9891 — Vicente Sotto Memorial Hospital',
    '',
    '(Let me know if you need fire, utilities, or other specific numbers!)'
  ];
  return lines.join('\n');
}

export function formatOffTopicReply() {
  return 'I\'m Route7\'s jeepney assistant, so I can help with routes, fares, and transfers around Cebu. Try asking something like "How do I get from IT Park to Fuente Osmeña?"';
}
