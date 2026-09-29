// Rule-based route finding for the Route7 chatbot.
//
// Everything here works against the stop names in data/routes.json (plus the
// curated spots in data/spots.json) — with conservative whole-word matching,
// curated aliases, and no LLM calls. Each route looks like:
//   { code: "12L", stops: ["Labangon", "V. Rama Ave", ...] }
//
// Matching rules (see buildPlaceCatalog / scanPlaceMatches):
// - Only WHOLE-WORD matches count. "exactly" never matches the stop "ACT".
// - Longest place name first, non-overlapping spans. After "Carbon Market"
//   is claimed, "SM City Cebu" cannot resolve back into the origin text.
// - Fragment stop entries ("jy", "colon", "sm") only resolve from a matching
//   user phrase of the same length — a bare "fuente" is never guessed.
// - Canonical names come from the data; replies never print user text.

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const stopEmbeddingData = require('../data/stop-embeddings.json');
const spotsData = require('../data/spots.json');
const STOP_EMBEDDING_THRESHOLD = 0.7;
let embedderPromise;

async function getEmbedder() {
  if (!embedderPromise) {
    embedderPromise = import('@xenova/transformers').then(({ pipeline }) =>
      pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    );
  }
  return embedderPromise;
}

async function embedText(text) {
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

function cosineSimilarity(a, b) {
  let score = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) score += a[i] * b[i];
  return score;
}

// Stop names vary in case/punctuation/accent ("E-Mall", "Pit-os", "Sto. Niño",
// "fuente osmena" vs "Fuente Osmeña"). Lowercase, strip diacritics (ñ -> n),
// and collapse punctuation so spellings collapse into one group.
export function normalizeStop(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Spellings that must collapse into one physical place even though the raw
// data lists them as separate stop entries (data sanity fixes).
const GROUP_MERGES = [
  [/^colon( st)?( terminal)?$/, 'colon street'],
  [/^sm$/, 'sm city cebu'],
  [/^emall$/, 'e mall'],
  [/^jy$/, 'jy square mall'],
  [/^carbon$/, 'carbon market'],
  [/^it park$/, 'cebu it park'],
  [/^country mall$/, 'gaisano country mall'],
  [/^vicente soto hospital$/, 'vicente sotto hospital'],
];

// Treat terminal suffixes and terminal parentheticals as the same physical
// stop for matching (for example, "SM City Cebu" and "SM City Cebu Terminal").
export function stopGroupKey(name) {
  const normalized = normalizeStop(name);
  if (
    normalized === 'ayala' ||
    normalized === 'metro ayala' ||
    normalized === 'ayala terminal' ||
    normalized.startsWith('ayala center')
  ) {
    return 'ayala center cebu';
  }

  const key = normalized
    .replace(/\s*\(?(terminal|puj terminal)\)?$/i, '')
    .trim();

  for (const [pattern, target] of GROUP_MERGES) {
    if (pattern.test(key)) return target;
  }
  return key;
}

export function sameStop(a, b) {
  return stopGroupKey(a) === stopGroupKey(b);
}

// ---------------------------------------------------------------------------
// Place catalog -------------------------------------------------------------
// ---------------------------------------------------------------------------

// Short names riders actually say. Aliases with a canonical target map into
// that place group; aliases without one ("mall") are category-level and are
// deliberately ambiguous. Keys are normalized text.
const PLACE_ALIASES = [
  { alias: 'sm', canonical: 'SM City Cebu', category: 'Shopping' },
  { alias: 'sm city', canonical: 'SM City Cebu', category: 'Shopping' },
  { alias: 'ayala', canonical: 'Ayala Center Cebu', category: 'Shopping' },
  { alias: 'parkmall', canonical: 'Parkmall (Mandaue)', category: 'Shopping' },
  { alias: 'mall', category: 'Shopping' }, // category-level: ambiguous on purpose
  { alias: 'usc', canonical: 'University of San Carlos', category: 'Education' },
  { alias: 'usjr', canonical: 'USJ-R', category: 'Education' },
  { alias: 'it park', canonical: 'Cebu IT Park', category: 'Urban' },
  { alias: 'airport', canonical: 'Mactan Airport', category: 'Transport' },
  { alias: 'mactan airport', canonical: 'Mactan Airport', category: 'Transport' },
  { alias: 'carbon', canonical: 'Carbon Market', category: 'Culture' },
  { alias: 'fuente', canonical: 'Fuente Osmeña', category: 'Landmark' },
  { alias: 'colon', canonical: 'Colon Street', category: 'Historical' },
  { alias: 'emall', canonical: 'E-Mall', category: 'Shopping' },
  { alias: 'e mall', canonical: 'E-Mall', category: 'Shopping' },
  { alias: 'naga', canonical: 'Naga City', category: 'Transport' },
  { alias: 'jy', canonical: 'JY Square Mall', category: 'Shopping' },
  { alias: 'jy square', canonical: 'JY Square Mall', category: 'Shopping' },
];

// Canonical display name -> the text variants that may resolve to it.
const CANONICAL_PLACE_VARIANTS = {
  'SM City Cebu': ['sm city cebu', 'sm city', 'sm'],
  'Ayala Center Cebu': ['ayala center cebu', 'ayala center', 'ayala'],
  'Parkmall (Mandaue)': ['parkmall'],
  'University of San Carlos': ['university of san carlos', 'usc', 'san carlos'],
  'USJ-R': ['usj r', 'usjr'],
  'Cebu IT Park': ['cebu it park', 'it park'],
  'Mactan Airport': ['mactan airport', 'airport'],
  'Carbon Market': ['carbon market', 'carbon'],
  'Fuente Osmeña': ['fuente osmena', 'fuente osmena circle', 'fuente'],
  'Colon Street': ['colon street', 'colon'],
  'E-Mall': ['e mall', 'emall', 'elizabeth mall'],
  'Naga City': ['naga city', 'naga'],
  'JY Square Mall': ['jy square mall', 'jy square', 'jy'],
  'SM Seaside City': ['sm seaside city', 'sm seaside'],
  'Robinsons Fuente': ['robinsons fuente'],
  'Vicente Sotto Hospital': ['vicente sotto hospital', 'vicente soto hospital'],
  'Cebu Doctors University Hospital': ['cebu doctors university hospital', 'cebu doc hospital', 'cebu doctors hospital'],
  'South Bus Terminal': ['south bus terminal', 'south terminal'],
  'North Bus Terminal': ['north bus terminal', 'north bus'],
  'Mandaue Public Market': ['mandaue public market'],
  'Lapu-Lapu City Hall': ['lapu lapu city hall', 'lapulapu city hall'],
  'SM Consolacion': ['sm consolacion', 'sm city consolacion'],
  'Gaisano Country Mall': ['gaisano country mall', 'country mall'],
  'J Centre Mall': ['j centre mall', 'j mall'],
  'Marina Mall': ['marina mall'],
  'Pacific Mall': ['pacific mall'],
};

// Categories used for deliberately ambiguous phrases ("the mall") and for
// group-level suggestions.
const CATEGORY_PLACES = {
  Shopping: ['SM City Cebu', 'Ayala Center Cebu', 'Parkmall (Mandaue)', 'SM Seaside City', 'Gaisano Country Mall', 'J Centre Mall', 'E-Mall', 'JY Square Mall', 'SM Consolacion', 'Pacific Mall', 'Marina Mall'],
  Education: ['University of San Carlos', 'USJ-R', 'Cebu Doctors University Hospital'],
  Transport: ['Mactan Airport', 'South Bus Terminal', 'North Bus Terminal', 'Naga City'],
  Historical: ['Colon Street', "Magellan's Cross", 'Fort San Pedro', 'Plaza Independencia'],
  Culture: ['Carbon Market'],
  Landmark: ['Fuente Osmeña', 'Cebu Ocean Park', 'Temple of Leah'],
  Urban: ['Cebu IT Park', 'NUSTAR Resort Cebu'],
};

// Places riders name that are not necessarily route stops themselves
// (airports, malls) mapped onto the nearest jeepney stop group when one
// exists. The placeId keeps them distinct from raw stop groups.
const EXTRA_PLACES = [
  {
    canonical: 'Mactan Airport',
    category: 'Transport',
    placeId: 'place:Mactan Airport',
    stopGroupKey: 'mactan airport', // not a stop; resolvable via alias only
  },
];

// Which stop group each canonical place rides on. Stops in route data use
// varied spellings; the catalog picks the best display name per group.
function buildPlaceCatalog(routes) {
  const catalog = new Map(); // groupKey -> { key, canonical, stops: Set, placeId, category, isStop }
  const byGroup = (key) => {
    if (!catalog.has(key)) {
      catalog.set(key, {
        key,
        placeId: `stop:${key}`,
        canonical: null,
        stops: new Set(),
        category: null,
        isStop: true,
      });
    }
    return catalog.get(key);
  };

  // Prefer display spellings a rider would recognize.
  const canonicality = (stop) => {
    let score = 0;
    if (!/\(/.test(stop)) score += 2;
    if (!/terminal$/i.test(stop)) score += 2;
    if (stop === normalizeStop(stop)) score += 1; // already normalized
    if (stop.length >= 4) score += 1;
    if (stop === stop.toLowerCase() || stop === stop.toUpperCase()) score -= 2;
    return score;
  };

  for (const route of routes) {
    for (const stop of route.stops || []) {
      const key = stopGroupKey(stop);
      const group = byGroup(key);
      group.stops.add(stop);
      if (!group.canonical || canonicality(stop) > canonicality(group.canonical)) {
        group.canonical = stop;
      }
    }
  }

  // Curated spots (data/spots.json) contribute canonical POI names.
  for (const spot of spotsData) {
    const key = stopGroupKey(spot.name);
    const group = byGroup(key);
    group.canonical = spot.name;
    group.category = spot.category || group.category;
    group.placeId = `spot:${spot.id}`;
    group.isStop = false; // not necessarily a jeepney stop
  }

  // Curated canonical places (aliases resolve into these groups).
  for (const [canonical] of Object.entries(CANONICAL_PLACE_VARIANTS)) {
    const key = stopGroupKey(canonical);
    const group = byGroup(key);
    if (!group.canonical || canonicality(canonical) > canonicality(group.canonical)) {
      group.canonical = canonical;
      if (!group.placeId.startsWith('spot:')) {
        group.placeId = `place:${canonical}`;
      }
    }
  }
  for (const [category, places] of Object.entries(CATEGORY_PLACES)) {
    for (const place of places) {
      const group = byGroup(stopGroupKey(place));
      group.category = group.category || category;
      if (!group.canonical) group.canonical = place;
    }
  }

  // Places that exist only in the curated list (no route stop).
  for (const extra of EXTRA_PLACES) {
    if (!catalog.has(extra.stopGroupKey)) {
      catalog.set(extra.stopGroupKey, {
        key: extra.stopGroupKey,
        placeId: extra.placeId,
        canonical: extra.canonical,
        stops: new Set(),
        category: extra.category,
        isStop: false,
      });
    }
  }

  // Attach categories from aliases where the group has none.
  for (const { canonical, category } of PLACE_ALIASES) {
    if (!canonical || !category) continue;
    const group = catalog.get(stopGroupKey(canonical));
    if (group && !group.category) group.category = category;
  }

  return catalog;
}

// Build the searchable phrases for the catalog: stop spellings, canonical
// variants, aliases, and category-level aliases.
function buildPhrases(catalog) {
  const phrases = [];
  const seen = new Set();
  const push = (text, group, flags = {}) => {
    if (!text || text.length < 2) return;
    const dedupeKey = `${text}|${group.key}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    phrases.push({ text, group, ...flags });
  };

  for (const group of catalog.values()) {
    const texts = new Set();
    for (const stop of group.stops) texts.add(normalizeStop(stop));
    if (group.canonical) texts.add(normalizeStop(group.canonical));
    for (const [canonical, variants] of Object.entries(CANONICAL_PLACE_VARIANTS)) {
      if (stopGroupKey(canonical) === group.key) {
        for (const variant of variants) texts.add(normalizeStop(variant));
      }
    }
    for (const { alias, canonical } of PLACE_ALIASES) {
      if (canonical && stopGroupKey(canonical) === group.key) {
        texts.add(normalizeStop(alias));
      }
    }

    const isCanonicalPlace = !group.placeId.startsWith('stop:');
    for (const text of texts) {
      if (isCanonicalPlace) {
        // Curated places and their aliases match at full strength.
        push(text, group, { curated: true });
      } else {
        // Route stops: only match a phrase as long as the stop's full
        // normalized name (so "exactly" cannot match "ACT"), and only a
        // multi-word phrase at full strength. Short fragments are weak.
        const fullNames = [...group.stops].map(normalizeStop);
        const isFullName = fullNames.some((name) => name === text);
        push(text, group, { stopFullName: isFullName, multiWord: text.includes(' ') });
      }
      // Category-level aliases ("mall") attach to every group in category.
      if (group.category && CATEGORY_ALIAS_TEXTS.has(group.category)) {
        for (const aliasText of CATEGORY_ALIAS_TEXTS.get(group.category)) {
          push(aliasText, group, { categoryAlias: true, curated: true });
        }
      }
    }
  }
  return phrases;
}

// Category-level alias texts per category (deliberately ambiguous).
const CATEGORY_ALIAS_TEXTS = new Map([
  ['Shopping', ['mall', 'the mall']],
]);

let cachedCatalog = null;
let cachedRoutesRef = null;
function getCatalog(routes) {
  if (cachedCatalog && cachedRoutesRef === routes) return cachedCatalog;
  cachedCatalog = buildPlaceCatalog(routes);
  cachedRoutesRef = routes;
  return cachedCatalog;
}

let cachedPhrases = null;
let cachedPhraseRoutesRef = null;
function getPhrases(routes) {
  if (cachedPhrases && cachedPhraseRoutesRef === routes) return cachedPhrases;
  cachedPhrases = buildPhrases(getCatalog(routes));
  cachedPhraseRoutesRef = routes;
  return cachedPhrases;
}

// ---------------------------------------------------------------------------
// Whole-word span matching --------------------------------------------------
// ---------------------------------------------------------------------------

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// All whole-word occurrences of `text` in `norm` (normalized message text).
function findWholeWordSpans(norm, text) {
  if (!text) return [];
  const pattern = new RegExp(`(?<![a-z0-9])${escapeRegExp(text)}(?![a-z0-9])`, 'g');
  const spans = [];
  for (const match of norm.matchAll(pattern)) {
    spans.push({ start: match.index, end: match.index + text.length });
  }
  return spans;
}

function spansOverlap(a, b) {
  return a.start < b.end && b.start < a.end;
}

/**
 * Scan normalized text for whole-word place matches, longest phrase first,
 * claiming non-overlapping spans only. Returns match objects in message
 * order:
 *   { group, phrase, start, end, strength, categoryAlias }
 * strength: 'strong' | 'weak'. Weak matches (short fragments like "fuente"
 * typed alone when the stop name is longer) are flagged, never guessed.
 */
export function scanPlaceMatches(norm, routes) {
  const phrases = getPhrases(routes);
  const claimed = [];
  const matches = [];

  const ordered = [...phrases].sort(
    (a, b) => b.text.length - a.text.length || a.text.localeCompare(b.text)
  );
  for (const phrase of ordered) {
    const spans = findWholeWordSpans(norm, phrase.text);
    if (!spans.length) continue;
    for (const span of spans) {
      if (claimed.some((taken) => spansOverlap(taken, span))) continue;
      // Longest-first ordering means the first claim of a span wins, so a
      // shorter alias never steals text from a longer stop name.
      claimed.push(span);
      let strength = 'weak';
      if (phrase.curated || phrase.categoryAlias) strength = 'strong';
      else if (phrase.multiWord) strength = 'strong';
      else if (phrase.stopFullName && phrase.text.length >= 4) strength = 'strong';
      matches.push({
        group: phrase.group,
        phrase: phrase.text,
        start: span.start,
        end: span.end,
        strength,
        categoryAlias: Boolean(phrase.categoryAlias),
      });
    }
  }

  // One match per place group: keep the longest phrase.
  const byGroup = new Map();
  for (const match of matches) {
    const existing = byGroup.get(match.group.key);
    if (!existing || match.end - match.start > existing.end - existing.start) {
      byGroup.set(match.group.key, match);
    }
  }
  return [...byGroup.values()].sort((a, b) => a.start - b.start);
}

// Split a normalized message into clauses by sentence punctuation and
// common conjunctions. "I'm at X. How do I get to Y?" -> two questions.
function splitClauses(norm) {
  return norm
    .split(/[.!?;]|\n|, then |, and | then | and then | and | also | which /g)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

// Classify a clause as the rider's origin or destination when the wording
// makes that clear ("I'm at X", "how do I get to Y").
function clauseRole(normClause) {
  if (/\b(i'?m|im|i am|starting|starting from|from|at|near|around)\b/.test(normClause) &&
      !/\bhow do i get|how to get|which jeep|what jeep\b/.test(normClause)) {
    return 'origin';
  }
  if (/\b(to|get to|go to|going to|heading|reach|toward|towards|for)\b/.test(normClause)) {
    return 'destination';
  }
  return null;
}

// Is this text a bare place name the user is asking about ("mactan airport")?
function isBarePlaceClause(normClause) {
  const filler = new Set(['how', 'do', 'i', 'get', 'to', 'from', 'the', 'a', 'go', 'going', 'im', "i'm", 'am', 'at', 'near', 'lost', 'want']);
  const words = normClause.split(' ').filter(Boolean);
  return words.length <= 3 && words.every((word) => !filler.has(word) || word === 'the');
}

/**
 * Interpret a user message as a routing request.
 *
 * Returns one of:
 *   { kind: 'query', origin, destination }
 *   { kind: 'missing-origin', destination }      // destination known, no start
 *   { kind: 'missing-destination', origin }      // start known, no destination
 *   { kind: 'same-place', place }                // origin == destination
 *   { kind: 'unknown', stops, suggestions }      // nothing (or only weak text)
 *   { kind: 'route-code', code }                 // asked about a jeepney code
 */
export async function parseRequest(message, routes, context = {}) {
  const safeContext = context || {};
  const norm = normalizeStop(message);

  // Follow-up: a suggestion was offered and the user picked it verbatim.
  const suggestedStops = safeContext.suggestedStops || [];
  const exactSuggested = suggestedStops.find(
    (stop) => normalizeStop(stop) === norm
  );
  if (exactSuggested && safeContext.destination) {
    return { kind: 'query', origin: exactSuggested, destination: safeContext.destination, fromSuggestion: true };
  }

  // Route-code questions ("Where does 12L go after Colon?"). The code itself
  // must never run through place matching.
  const codeMatch = norm.match(/\b(mi-)?\d{1,2}[a-z]\b/);
  if (codeMatch && /\b(where|route|go|goes|pass|passing|after|before|from|to)\b/.test(norm)) {
    return { kind: 'route-code', code: codeMatch[0].toUpperCase() };
  }

  // Last question wins: split into clauses and use the last clause that
  // mentions a place. Earlier questions are ignored consistently.
  const clauses = splitClauses(norm);
  const clauseMatches = clauses.map((clause) => ({ clause, matches: scanPlaceMatches(clause, routes) }));
  const withMatches = clauseMatches.filter((entry) => entry.matches.length > 0);
  const activeClause = withMatches.length ? withMatches[withMatches.length - 1] : clauseMatches[clauseMatches.length - 1] || { clause: norm, matches: [] };

  let matches = activeClause.matches;
  const clause = activeClause.clause;

  // Fall back to whole-message scanning if the active clause found little —
  // e.g. "from IT Park to Fuente Osmeña ... I'm at Carbon Market" where the
  // final clause has one place but the trip needs both.
  if (matches.length < 2) {
    const whole = scanPlaceMatches(norm, routes);
    const seen = new Set(matches.map((m) => m.group.key));
    for (const match of whole) {
      if (!seen.has(match.group.key)) matches = matches.concat(match);
    }
  }

  if (matches.length === 0) {
    return { kind: 'unknown', stops: [], suggestions: suggestStops(norm, routes, []) };
  }

  if (matches.length === 1) {
    const [only] = matches;
    if (only.strength === 'weak') {
      // Not confident: offer distinct canonical suggestions instead of guessing.
      return { kind: 'unknown', stops: [], suggestions: suggestStops(clause || norm, routes, []) };
    }
    // Same-place check: "Ayala to Ayala" dedupes to one match, but the user
    // mentioned the same place twice (as both origin and destination).
    // Detect this by counting whole-word occurrences of the phrase in the text.
    const phraseOccurrences = findWholeWordSpans(norm, only.phrase);
    if (phraseOccurrences.length >= 2) {
      return { kind: 'same-place', place: only.group.canonical };
    }
    // One confident place: ask for the missing half of the trip. Location
    // wording ("I'm at X", "near X") means X is the origin.
    const wantsOrigin = /\b(i'?m|im|i am|near|lost|at|from)\b/.test(clause);
    if (wantsOrigin) {
      return { kind: 'missing-destination', origin: only.group.canonical, place: only };
    }
    return { kind: 'missing-origin', destination: only.group.canonical, place: only };
  }

  // Two or more places: first = origin, second = destination unless "from"
  // reorders them ("go to SM from Naga").
  const [first, second] = matches;
  const fromMatch = clause.match(/\bfrom\s+([a-z0-9 ]+)$/);
  if (fromMatch) {
    const fromText = fromMatch[1];
    const fromMatches = scanPlaceMatches(fromText, routes);
    if (fromMatches.length) {
      const fromGroup = fromMatches[0].group;
      const destinationMatch = matches.find((m) => m.group.key !== fromGroup.key);
      if (destinationMatch) {
        if (fromGroup.key === destinationMatch.group.key) {
          return { kind: 'same-place', place: fromGroup.canonical };
        }
        return { kind: 'query', origin: fromGroup.canonical, destination: destinationMatch.group.canonical };
      }
    }
  }

  if (first.group.key === second.group.key) {
    return { kind: 'same-place', place: first.group.canonical };
  }

  return { kind: 'query', origin: first.group.canonical, destination: second.group.canonical };
}

/**
 * Fuzzy suggestions, deduped by place ID, canonical names only.
 * Returns up to `limit` distinct canonical names.
 */
export function suggestStops(message, routes, alreadyFound = [], limit = 3) {
  const norm = normalizeStop(message);
  const catalog = getCatalog(routes);
  const foundKeys = new Set((alreadyFound || []).map((found) => stopGroupKey(found)));
  const suggestions = new Map(); // placeId -> canonical name
  const words = norm
    .split(' ')
    .filter((word) => word.length >= 3 && !SUGGESTION_STOPWORDS.has(word));

  for (const group of catalog.values()) {
    if (foundKeys.has(group.key) || suggestions.has(group.placeId)) continue;
    if (!group.canonical) continue;
    const canonicalKey = normalizeStop(group.canonical);
    const hit = words.some(
      (word) =>
        canonicalKey.includes(word) ||
        [...group.stops].some((stop) => normalizeStop(stop).includes(word))
    );
    if (hit) suggestions.set(group.placeId, group.canonical);
  }

  return [...suggestions.values()].slice(0, limit);
}

const SUGGESTION_STOPWORDS = new Set([
  'a', 'an', 'and', 'center', 'cebu', 'city', 'from', 'go', 'how', 'i',
  'in', 'is', 'me', 'of', 'the', 'to', 'want', 'get', 'university',
]);

// ---------------------------------------------------------------------------
// Semantic fallback (runs at most once per message) -------------------------
// ---------------------------------------------------------------------------

// Score candidate phrases against stop-name embeddings. Exported for tests.
export async function resolvePlacesSemantic(message, routes, exactMatches = []) {
  const embeddings = stopEmbeddingData.embeddings || {};
  if (!Object.keys(embeddings).length) return exactMatches;

  const catalog = getCatalog(routes);
  const embeddingEntries = Object.entries(embeddings)
    .map(([name, vector]) => {
      const key = stopGroupKey(name);
      const group = catalog.get(key);
      return group ? { name, vector, key, canonical: group.canonical || name, group } : null;
    })
    .filter(Boolean);
  const foundKeys = new Set((exactMatches || []).map((match) => match.group?.key ?? stopGroupKey(match)));
  const semanticMatches = [];

  for (const candidate of semanticCandidates(normalizeStop(message))) {
    // Do not reinterpret a phrase that already matched exactly.
    if ((exactMatches || []).some((match) => {
      const stopText = normalizeStop(match.phrase || match);
      return stopText.includes(candidate.phrase) || candidate.phrase.includes(stopText);
    })) continue;
    const queryVector = await embedText(candidate.phrase);
    const ranked = embeddingEntries
      .filter((entry) => !foundKeys.has(entry.key))
      .map((entry) => ({ ...entry, score: cosineSimilarity(queryVector, entry.vector) }))
      .sort((a, b) => b.score - a.score);
    const best = ranked[0];
    const second = ranked[1];
    if (!best || best.score < STOP_EMBEDDING_THRESHOLD) {
      if (best) console.info(`[semantic-stop] no confident match for "${candidate.phrase}": ${best.name}=${best.score.toFixed(3)}`);
      continue;
    }
    // Near-tied top scores mean an ambiguous nickname — never guess.
    if (second && best.score - second.score < 0.03) {
      console.info(`[semantic-stop] ambiguous "${candidate.phrase}": ${best.name}=${best.score.toFixed(3)}, ${second.name}=${second.score.toFixed(3)}`);
      continue;
    }
    console.info(`[semantic-stop] "${candidate.phrase}" -> "${best.canonical}" (score=${best.score.toFixed(3)})`);
    semanticMatches.push({
      group: best.group,
      phrase: candidate.phrase,
      start: candidate.index,
      end: candidate.index + candidate.phrase.length,
      strength: 'strong',
    });
    foundKeys.add(best.key);
  }

  return [...(exactMatches || []), ...semanticMatches].sort((a, b) => a.start - b.start);
}

function semanticCandidates(message) {
  const norm = normalizeStop(message);
  const ignored = new Set([
    'a', 'an', 'and', 'from', 'go', 'how', 'i', 'in', 'is', 'me', 'of',
    'the', 'to', 'want', 'get', 'take', 'ride', 'please', 'can', 'you',
    'center', 'city', 'cebu',
  ]);
  const segments = [];
  const fromMatch = norm.match(/\bfrom\s+(.+)$/);
  const toMatch = norm.match(/\bto\s+(.+?)(?:\s+from\s+|$)/);
  if (toMatch) segments.push(toMatch[1]);
  if (fromMatch) segments.push(fromMatch[1]);
  if (!segments.length) segments.push(norm);

  const candidates = [];
  for (const segment of segments) {
    const words = segment.split(' ').filter((word) => word.length >= 3 && !ignored.has(word));
    if (words.length) {
      candidates.push({ phrase: words.join(' '), index: norm.indexOf(words.join(' ')) });
    }
  }
  return [...new Map(candidates.map((candidate) => [candidate.phrase, candidate])).values()];
}

// ---------------------------------------------------------------------------
// Route graph and segment slicing ------------------------------------------
// ---------------------------------------------------------------------------

/**
 * Precompute which stops are shared between which routes.
 *
 * Returns a Map: normalized stop name -> { stop, routes: [...] }.
 * Any stop served by 2+ routes is a valid transfer point.
 */
export function buildTransferGraph(routes) {
  const graph = new Map();
  for (const route of routes) {
    for (const stop of route.stops || []) {
      const key = stopGroupKey(stop);
      if (!graph.has(key)) graph.set(key, { stop, routes: [] });
      const entry = graph.get(key);
      if (!entry.routes.includes(route)) entry.routes.push(route);
    }
  }
  return graph;
}

// Direction helpers --------------------------------------------------------

function occurrencesOf(stops, key) {
  const indexes = [];
  (stops ?? []).forEach((stop, index) => {
    if (stopGroupKey(stop) === key) indexes.push(index);
  });
  return indexes;
}

// A route is circular when flagged, or when its first and last stops are the
// same physical terminal ("North Terminal" ... "North").
function isLoopRoute(route, stops) {
  if (route?.loop === true) return true;
  if (route?.loop === false) return false;
  const list = stops ?? route?.stops ?? [];
  if (list.length < 2) return false;
  const first = stopGroupKey(list[0]);
  const last = stopGroupKey(list[list.length - 1]);
  return Boolean(first) && first === last;
}

// Loops keep circulating one way (wrap, never reverse); routes flagged
// oneWay never ride against the listed stop order.
function reversalAllowed(route, stops) {
  if (route?.oneWay === true) return false;
  return !isLoopRoute(route, stops);
}

function legHops(leg) {
  return Math.max(1, (leg.stops?.length ?? 2) - 1);
}

/**
 * Slice one leg of a journey out of a single route.
 *
 * Returns a leg with routeId/routeName, the exact boarding and alighting
 * stops with their indices in route.stops, and `stops` — the ordered stops
 * the rider passes through, inclusive of both ends. Direction handling when
 * the alighting stop comes before the boarding stop in the list:
 *   - reverse: the route runs both ways, so ride the slice backwards
 *   - loop:    circular route, so continue around the wrap
 *              (board -> end of list -> start of list -> alight)
 *   - oneWay routes with no wrap: null, i.e. findRoute skips that route.
 * Returns null too when the stops are not on the route together at all.
 */
function resolveLeg(route, boardStop, alightStop) {
  const stops = route?.stops ?? [];
  if (stops.length < 2) return null;
  const boardKey = stopGroupKey(boardStop);
  const alightKey = stopGroupKey(alightStop);
  if (!boardKey || !alightKey || boardKey === alightKey) return null;

  const boardIndexes = occurrencesOf(stops, boardKey);
  const alightIndexes = occurrencesOf(stops, alightKey);
  if (!boardIndexes.length || !alightIndexes.length) return null;

  const reversible = reversalAllowed(route, stops);
  const loop = isLoopRoute(route, stops);

  let best = null;
  let bestRank = Infinity;
  for (const boardIndex of boardIndexes) {
    for (const alightIndex of alightIndexes) {
      let direction = null;
      if (alightIndex > boardIndex) direction = 'forward';
      else if (alightIndex < boardIndex) {
        if (reversible) direction = 'reverse';
        else if (loop) direction = 'loop';
      }
      if (!direction) continue;

      const slice =
        direction === 'loop'
          ? stops.slice(boardIndex).concat(stops.slice(0, alightIndex + 1))
          : stops.slice(Math.min(boardIndex, alightIndex), Math.max(boardIndex, alightIndex) + 1);
      // Loop routes often re-list the start terminal as the last entry (the
      // wrap marker). Collapse the seam so the rider sees each stop once.
      if (direction === 'loop' && slice.length > 1) {
        const seamStart = slice.length - alightIndex - 1; // where the wrap part begins
        if (
          seamStart > 0 &&
          seamStart < slice.length &&
          stopGroupKey(slice[seamStart]) === stopGroupKey(slice[seamStart - 1])
        ) {
          slice.splice(seamStart, 1);
        }
      }
      const leg = {
        routeId: route.code,
        routeName: route.route,
        boardStop: stops[boardIndex],
        alightStop: stops[alightIndex],
        boardIndex,
        alightIndex,
        direction,
        stops: direction === 'reverse' ? [...slice].reverse() : slice,
      };
      // Prefer the shortest ride; break ties toward the listed direction.
      const rank = legHops(leg) + (direction === 'forward' ? 0 : 0.5);
      if (rank < bestRank) {
        best = leg;
        bestRank = rank;
      }
    }
  }
  return best;
}

// Is the stop at toIndex reachable from fromIndex on this route, and how?
function reachableSpan(route, fromIndex, toIndex) {
  if (toIndex === fromIndex) return null;
  if (toIndex > fromIndex) return 'forward';
  if (reversalAllowed(route)) return 'reverse';
  if (isLoopRoute(route)) return 'loop';
  return null;
}

/**
 * Find how to get from origin to destination.
 *
 * Strategy:
 *   1. DIRECT: any single route serving both stops in a rideable direction.
 *      Candidates are scored (endpoint/named-endpoint preference, routes.json
 *      order as tie-break) and the winner's leg is sliced to the segment
 *      between the boarding and alighting stops (inclusive).
 *   2. TRANSFER: BFS over ROUTES (not stops). Start from every route serving
 *      the origin; expand only to stops reachable from the boarding point in
 *      an allowed direction; succeed as soon as an expanded route serves the
 *      destination the same way. MAX_TRANSFERS caps the search so we never
 *      suggest 3+ jeepneys.
 *   3. null when neither works — the caller sends a "no route found" reply.
 *
 * Every returned leg carries: routeId, boardStop, alightStop, boardIndex,
 * alightIndex, and stops — the sliced stop list between board and alight
 * (inclusive). Callers must only ever describe stops inside that slice.
 */
export function findRoute(origin, destination, routes) {
  const MAX_TRANSFERS = 1; // one transfer = at most 2 jeeps

  const graph = buildTransferGraph(routes);
  const originKey = stopGroupKey(origin);
  const destKey = stopGroupKey(destination);
  if (!originKey || !destKey || originKey === destKey) return null; // same stop: nothing to find

  // --- Step 1: direct route -------------------------------------------
  const directCandidates = [];
  for (const [routeIndex, route] of routes.entries()) {
    const stops = route.stops || [];
    if (!occurrencesOf(stops, originKey).length) continue;
    if (!occurrencesOf(stops, destKey).length) continue;
    const leg = resolveLeg(route, origin, destination);
    if (!leg) continue; // both stops present, but not rideable in any direction
    const lastIndex = stops.length - 1;
    const endpointScore =
      (leg.boardIndex === 0 || leg.boardIndex === lastIndex ? 2 : 0) +
      (leg.alightIndex === 0 || leg.alightIndex === lastIndex ? 2 : 0);
    const routeText = normalizeStop(route.route);
    const namedEndpointScore =
      (routeText.includes(originKey) ? 1 : 0) + (routeText.includes(destKey) ? 1 : 0);
    directCandidates.push({ route, leg, score: endpointScore + namedEndpointScore, routeIndex });
  }
  if (directCandidates.length) {
    directCandidates.sort((a, b) => b.score - a.score || a.routeIndex - b.routeIndex);
    const { leg } = directCandidates[0];
    return { type: 'direct', from: origin, to: destination, legs: [leg] };
  }

  // --- Step 2: one-transfer search (BFS over routes) -------------------
  const startRoutes = graph.get(originKey)?.routes ?? [];
  const visited = new Set(startRoutes.map((r) => r.code)); // never re-expand a route
  const queue = [];
  for (const route of startRoutes) {
    const boardIndexes = occurrencesOf(route.stops, originKey);
    if (boardIndexes.length) {
      queue.push({ route, boardAt: origin, boardIndex: boardIndexes[0], depth: 1, parent: null });
    }
  }

  while (queue.length > 0) {
    const node = queue.shift();

    // Does this route reach the destination in a rideable direction?
    const finalLeg = resolveLeg(node.route, node.boardAt, destination);
    if (finalLeg) {
      const chain = [];
      for (let item = node; item; item = item.parent) chain.unshift(item);
      const legs = [];
      let rideable = true;
      for (let i = 0; i < chain.length; i += 1) {
        const alightAt = i < chain.length - 1 ? chain[i + 1].boardAt : destination;
        const leg = resolveLeg(chain[i].route, chain[i].boardAt, alightAt);
        if (!leg) {
          rideable = false;
          break;
        }
        legs.push(leg);
      }
      if (rideable) {
        return legs.length === 1
          ? { type: 'direct', from: origin, to: destination, legs }
          : { type: 'transfer', from: origin, to: destination, legs };
      }
      // This chain is not rideable end-to-end; keep searching.
    }

    // Cap the search: expanding a node that already used up the transfer
    // budget would create a longer chain than allowed.
    if (node.depth > MAX_TRANSFERS) continue;

    // Expand to every route sharing a stop we can actually reach from here.
    const stops = node.route.stops ?? [];
    for (let index = 0; index < stops.length; index += 1) {
      const stopKey = stopGroupKey(stops[index]);
      if (stopKey === originKey) continue; // transferring at the origin is meaningless
      if (!reachableSpan(node.route, node.boardIndex, index)) continue;
      for (const next of graph.get(stopKey)?.routes ?? []) {
        if (visited.has(next.code)) continue;
        visited.add(next.code);
        const nextBoardIndexes = occurrencesOf(next.stops, stopKey);
        if (!nextBoardIndexes.length) continue;
        queue.push({
          route: next,
          boardAt: stops[index],
          boardIndex: nextBoardIndexes[0],
          depth: node.depth + 1,
          parent: node,
        });
      }
    }
  }

  return null; // nothing reachable within MAX_TRANSFERS
}

/**
 * Turn a findRoute() result into a plain chat reply (no markdown — the
 * chat panel renders plain text). Every line describes only the sliced
 * segment of its leg — never stops outside it.
 *   Direct:   "Route 03Q: get on at Ayala Center Cebu, get off at Mabolo (1 stop)."
 *   Transfer: "Route 03B: get on at Mabolo (Sindulan), get off at Mango Ave (3 stops, passing Fuente Osmeña).\nTransfer at Mango Ave: Route 04C: get on at Mango Ave, get off at Carbon Market (5 stops)."
 *   null:     null (caller supplies its own "no route" wording).
 */
export function formatRouteReply(result, routes) {
  if (!result || !Array.isArray(result.legs) || !result.legs.length) return null;

  // Resolve a raw stop name to its canonical display name using the catalog.
  // Falls back to the raw name if the catalog is not available.
  const catalog = routes ? getCatalog(routes) : null;
  const canonicalName = (stop) => {
    if (!catalog || !stop) return stop;
    const group = catalog.get(stopGroupKey(stop));
    return group?.canonical || stop;
  };

  const describeLeg = (leg, index) => {
    const boardName = canonicalName(leg.boardStop);
    const alightName = canonicalName(leg.alightStop);
    const hopCount = Math.max(1, (leg.stops?.length ?? 2) - 1);
    // Landmarks come only from inside the sliced segment, never outside it.
    // Names are canonical data spellings (correct casing), never user text.
    const seen = new Set([stopGroupKey(leg.boardStop), stopGroupKey(leg.alightStop)]);
    const landmarks = [];
    for (const stop of (leg.stops ?? []).slice(1, -1)) {
      const key = stopGroupKey(stop);
      if (!seen.has(key)) {
        seen.add(key);
        landmarks.push(canonicalName(stop));
      }
    }
    const chosen = landmarks.length > 2
      ? [landmarks[Math.floor((landmarks.length - 1) / 3)], landmarks[Math.floor((2 * (landmarks.length - 1)) / 3)]].filter((stop, i, arr) => arr.indexOf(stop) === i)
      : landmarks;
    const via = chosen.length ? `, passing ${chosen.join(' and ')}` : '';
    const stopsText = `about ${hopCount} ${hopCount === 1 ? 'stop' : 'stops'}`;
    
    if (index === 0) {
      return `Take jeepney ${leg.routeId} — board at ${boardName}, get off at ${alightName} (${stopsText}${via}).`;
    }
    return `At ${boardName}, transfer to jeepney ${leg.routeId} toward ${alightName} (${stopsText}${via}).`;
  };

  return result.legs.map(describeLeg).join('\n');
}
