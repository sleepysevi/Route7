// Rule-based route finding for the Route7 chatbot.
//
// Everything here works against the stop names in data/routes.json — with
// conservative substring and alias matching, and no LLM calls. Each route
// looks like: { code: "12L", stops: ["Labangon", "V. Rama Ave", ...] }
//
// EXTENDING LATER (see buildTransferGraph / findRoute comments):
// - More place aliases: extend COMMON_ALIASES after checking ambiguity.
// - 2+ transfers: raise MAX_TRANSFERS; the BFS already tracks leg counts.
// - Distance weighting: prefer paths whose legs span fewer stops.

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const stopEmbeddingData = require('../data/stop-embeddings.json');
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

// Stop names vary in case/punctuation ("E-Mall", "Pit-os", "Sto. Niño").
function normalizeStop(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Treat terminal suffixes and terminal parentheticals as the same physical
// stop for matching (for example, "SM City Cebu" and "SM City Cebu Terminal").
function stopGroupKey(name) {
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
    .replace(/\s*\(?terminal\)?$/i, '')
    .trim();

  // These labels refer to the same Ayala interchange in the route data and
  // descriptions, even though some routes call it "Ayala Terminal".
  return key;
}

function sameStop(a, b) {
  return stopGroupKey(a) === stopGroupKey(b);
}

const COMMON_ALIASES = new Map([
  ['sm', 'SM City Cebu'],
  ['sm city', 'SM City Cebu'],
  ['ayala', 'Ayala Center Cebu'],
  ['naga', 'Naga City'],
]);

// Find every known stop name mentioned in a user message.
// Returns canonical stop strings (as written in routes.json) in message order.
export function extractStops(message, routes) {
  const norm = normalizeStop(message);

  // Group terminal variants together, while retaining a canonical spelling.
  const groups = new Map();
  for (const route of routes) {
    for (const stop of route.stops || []) {
      const key = stopGroupKey(stop);
      if (!groups.has(key)) groups.set(key, { key, stops: [], canonical: stop });
      const group = groups.get(key);
      if (!group.stops.includes(stop)) group.stops.push(stop);
      // Prefer the non-terminal spelling as the user-facing canonical name.
      if (!/terminal$/i.test(stop)) group.canonical = stop;
    }
  }

  const matches = new Map();
  const addMatch = (group, phrase, index) => {
    const current = matches.get(group.key);
    if (!current || phrase.length > current.phrase.length) {
      matches.set(group.key, { group, phrase, index });
    }
  };

  // Full known names still win first, longest match first.
  for (const group of groups.values()) {
    for (const stop of group.stops.sort((a, b) => normalizeStop(b).length - normalizeStop(a).length)) {
      const phrase = normalizeStop(stop);
      const index = norm.indexOf(phrase);
      if (index >= 0) addMatch(group, phrase, index);
    }
  }

  // Match meaningful contiguous phrases contained in a stop name. This is
  // deliberately conservative: ambiguous groups are suggestions, not guesses.
  const words = norm.split(' ').filter(Boolean);
  const ignored = new Set(['a', 'an', 'and', 'from', 'go', 'how', 'i', 'in', 'is', 'me', 'of', 'the', 'to', 'want']);
  for (let start = 0; start < words.length; start += 1) {
    for (let end = words.length; end > start; end -= 1) {
      const phrase = words.slice(start, end).join(' ');
      if (ignored.has(phrase) || phrase.length < 3) continue;
      const index = norm.indexOf(phrase);
      const candidates = [...groups.values()].filter(
        (group) => group.key.includes(phrase)
      );
      if (candidates.length === 1) {
        addMatch(candidates[0], phrase, index);
      }
    }
  }

  // Apply an alias only when all stops containing that alias collapse to one
  // semantic group. "Naga" and "SM City" are safe; ambiguous shorthand is not.
  for (const [alias, target] of COMMON_ALIASES) {
    const aliasIndex = norm.indexOf(alias);
    if (aliasIndex < 0) continue;
    const candidateGroups = [...groups.values()].filter((group) => group.key.includes(alias));
    const targetGroup = groups.get(stopGroupKey(target));
    if (targetGroup && candidateGroups.length === 1 && candidateGroups[0].key === targetGroup.key) {
      addMatch(targetGroup, alias, aliasIndex);
    }
  }

  return [...matches.values()]
    .sort((a, b) => a.index - b.index || b.phrase.length - a.phrase.length)
    .map(({ group }) => group.canonical);
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
    // Prefer the user's complete place phrase. Only fall back to a single
    // token when the user actually supplied a single-token place name; this
    // prevents generic fragments such as "center" or "cebu" from becoming
    // unrelated semantic matches.
    if (words.length) {
      candidates.push({ phrase: words.join(' '), index: norm.indexOf(words.join(' ')) });
    }
  }
  return [...new Map(candidates.map((candidate) => [candidate.phrase, candidate])).values()];
}

// Semantic fallback for names that exact/substring matching cannot resolve.
// This intentionally does not alter route graph or transfer selection.
export async function extractStopsSemantic(message, routes, exactMatches = []) {
  const embeddings = stopEmbeddingData.embeddings || {};
  if (!Object.keys(embeddings).length) return exactMatches;

  const groups = new Map();
  for (const route of routes) {
    for (const stop of route.stops || []) {
      const key = stopGroupKey(stop);
      if (!groups.has(key)) groups.set(key, stop);
    }
  }
  const embeddingEntries = Object.entries(embeddings)
    .map(([name, vector]) => ({ name, vector, key: stopGroupKey(name), canonical: groups.get(stopGroupKey(name)) || name }))
    .filter((entry) => groups.has(entry.key));
  const foundKeys = new Set(exactMatches.map(stopGroupKey));
  const semanticMatches = [];

  for (const candidate of semanticCandidates(message)) {
    // Do not reinterpret a phrase that already participated in an exact
    // match; this avoids turning a canonical "Ayala" hit into a nearby
    // description fragment such as "SM via Ayala".
    if (exactMatches.some((stop) => {
      const stopText = normalizeStop(stop);
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
    // Similar scores indicate an ambiguous nickname (for example, "Punta").
    if (second && best.score - second.score < 0.03) {
      console.info(`[semantic-stop] ambiguous "${candidate.phrase}": ${best.name}=${best.score.toFixed(3)}, ${second.name}=${second.score.toFixed(3)}`);
      continue;
    }
    console.info(`[semantic-stop] "${candidate.phrase}" -> "${best.canonical}" (score=${best.score.toFixed(3)})`);
    semanticMatches.push({ stop: best.canonical, index: candidate.index });
    foundKeys.add(best.key);
  }

  return [...exactMatches.map((stop) => ({ stop, index: normalizeStop(message).indexOf(normalizeStop(stop)) })), ...semanticMatches]
    .sort((a, b) => a.index - b.index)
    .map(({ stop }) => stop);
}

export function suggestStops(message, routes, alreadyFound = []) {
  const norm = normalizeStop(message);
  const foundKeys = new Set(alreadyFound.map(stopGroupKey));
  const suggestions = new Map();
  const ignoredSuggestionWords = new Set([
    'a', 'an', 'and', 'center', 'cebu', 'city', 'from', 'go', 'how', 'i',
    'in', 'is', 'me', 'of', 'the', 'to', 'want',
  ]);
  const words = norm
    .split(' ')
    .filter((word) => word.length >= 3 && !ignoredSuggestionWords.has(word));

  for (const route of routes) {
    for (const stop of route.stops || []) {
      const key = stopGroupKey(stop);
      if (foundKeys.has(key) || suggestions.has(key)) continue;
      const stopKey = normalizeStop(stop);
      if (words.some((word) => stopKey.includes(word))) {
        suggestions.set(key, stop);
      }
    }
  }

  return [...suggestions.values()].slice(0, 4);
}

// Interpret a user message as a routing request.
// The first two distinct stops mentioned are origin and destination.
export async function parseRequest(message, routes, context = {}) {
  // A new chat sends a null context; normalize it before reading follow-up state.
  const safeContext = context || {};
  const suggestedStops = safeContext.suggestedStops || [];
  const exactSuggested = suggestedStops.find(
    (stop) => normalizeStop(stop) === normalizeStop(message)
  );
  if (exactSuggested && safeContext.destination) {
    return { kind: 'query', origin: exactSuggested, destination: safeContext.destination, fromSuggestion: true };
  }

  const exactStops = extractStops(message, routes);
  const stops = exactStops.length >= 2
    ? exactStops
    : await extractStopsSemantic(message, routes, exactStops);
  if (stops.length < 2) return { kind: 'unknown', stops, suggestions: suggestStops(message, routes, stops) };

  // In natural phrasing, the origin follows "from" even when the destination
  // is mentioned first: "go to SM City from Naga".
  const norm = normalizeStop(message);
  const fromIndex = norm.indexOf(' from ');
  if (fromIndex >= 0) {
    const fromText = norm.slice(fromIndex + 6);
    const fromStop = (await extractStopsSemantic(
      fromText,
      routes,
      extractStops(fromText, routes),
    ))[0];
    if (fromStop) {
      const destination = stops.find((stop) => !sameStop(stop, fromStop));
      if (destination) return { kind: 'query', origin: fromStop, destination };
    }
  }

  return { kind: 'query', origin: stops[0], destination: stops[1] };
}

/**
 * Precompute which stops are shared between which routes.
 *
 * Returns a Map: normalized stop name -> { stop, routes: [...] }.
 * Any stop served by 2+ routes is a valid transfer point.
 *
 * EXTENDING LATER:
 * - Prefer major terminals as transfer points: store per-stop metadata
 *   here (e.g. isTerminal) and sort each entry's routes by preference.
 * - Walking transfers between similarly-named stops (e.g. "E-Mall" vs
 *   "E-Mall (ACT)"): merge keys in a second pass here; findRoute and the
 *   BFS would work unchanged because they only read this Map.
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

/**
 * Find how to get from origin to destination.
 *
 * Strategy:
 *   1. DIRECT: any single route serving both stops. First hit in routes.json
 *      order wins (the file order is our priority).
 *   2. TRANSFER: BFS over ROUTES (not stops). Start from every route serving
 *      the origin; expand to routes sharing a stop with them; succeed as soon
 *      as an expanded route serves the destination. MAX_TRANSFERS caps the
 *      search so we never suggest 3+ jeepneys.
 *   3. null when neither works — the caller sends a "no route found" reply.
 *
 * EXTENDING LATER:
 * - 2 transfers: set MAX_TRANSFERS = 2. The queue items already carry a
 *   parent pointer and depth, so longer chains fall out naturally.
 * - Weight by distance: today any shared stop is an equally good transfer
 *   point. To prefer fewer stops ridden, record indexOf() positions of
 *   boardAt/alightAt per leg and turn the queue into a priority queue
 *   ordered by total stops ridden instead of plain FIFO.
 * - Direction: stop order is ignored for now (jeepneys run both ways);
 *   to respect it, only accept alightAt stops that appear after boardAt
 *   in the route's stops array.
 */
export function findRoute(origin, destination, routes) {
  const MAX_TRANSFERS = 1; // one transfer = at most 2 jeeps

  const graph = buildTransferGraph(routes);
  const originKey = stopGroupKey(origin);
  const destKey = stopGroupKey(destination);
  if (originKey === destKey) return null; // same stop: nothing to find

  // --- Step 1: direct route -------------------------------------------
  // Prefer a route whose named endpoints match the request. This avoids
  // returning a route that merely passes both stops when a route actually
  // runs between them (for example, 14D for Colon ↔ Ayala).
  const directCandidates = [];
  for (const [routeIndex, route] of routes.entries()) {
    const stops = route.stops || [];
    const originIndex = stops.findIndex((s) => stopGroupKey(s) === originKey);
    const destinationIndex = stops.findIndex((s) => stopGroupKey(s) === destKey);
    const hasOrigin = originIndex >= 0;
    const hasDest = destinationIndex >= 0;
    if (hasOrigin && hasDest) {
      const lastIndex = stops.length - 1;
      const endpointScore =
        (originIndex === 0 || originIndex === lastIndex ? 2 : 0) +
        (destinationIndex === 0 || destinationIndex === lastIndex ? 2 : 0);
      const routeText = normalizeStop(route.route);
      const namedEndpointScore =
        (routeText.includes(originKey) ? 1 : 0) + (routeText.includes(destKey) ? 1 : 0);
      directCandidates.push({ route, score: endpointScore + namedEndpointScore, routeIndex });
    }
  }
  if (directCandidates.length) {
    directCandidates.sort((a, b) => b.score - a.score || a.routeIndex - b.routeIndex);
    const route = directCandidates[0].route;
    return { type: 'direct', route: route.code, from: origin, to: destination, routeName: route.route };
  }

  // --- Step 2: one-transfer search (BFS over routes) -------------------
  // Queue items form a chain via .parent: each item is "board this route at
  // boardAt". depth = number of jeeps boarded so far, so a depth-2 node is
  // a 1-transfer itinerary. FIFO order guarantees the shortest chain wins.
  const startRoutes = graph.get(originKey)?.routes ?? [];
  const visited = new Set(startRoutes.map((r) => r.code)); // never re-expand a route
  const queue = startRoutes.map((route) => ({
    route,
    boardAt: origin, // first leg boards where the rider is
    depth: 1,
    parent: null,
  }));

  while (queue.length > 0) {
    const node = queue.shift();

    // Does this route reach the destination?
    if ((node.route.stops ?? []).some((s) => stopGroupKey(s) === destKey)) {
      // Walk parent pointers back to the first leg, then name each leg's
      // board/alight stops: every leg alights where the next leg boards.
      const chain = [];
      for (let leg = node; leg; leg = leg.parent) chain.unshift(leg);
      const legs = chain.map((leg, i) => ({
        route: leg.route.code,
        boardAt: leg.boardAt,
        alightAt: i < chain.length - 1 ? chain[i + 1].boardAt : destination,
      }));
      // Step 1 already handled direct hits, so a chain this short can only
      // be a transfer (but keep it correct for any MAX_TRANSFERS value).
      return legs.length === 1
        ? { type: 'direct', route: legs[0].route, from: origin, to: destination, routeName: node.route.route }
        : { type: 'transfer', legs };
    }

    // Cap the search: expanding a node that already used up the transfer
    // budget would create a longer chain than allowed.
    if (node.depth > MAX_TRANSFERS) continue;

    // Expand to every route sharing any stop with the current one.
    for (const stop of node.route.stops ?? []) {
      const stopKey = stopGroupKey(stop);
      if (stopKey === originKey) continue; // transferring at the origin is meaningless
      for (const next of graph.get(stopKey)?.routes ?? []) {
        if (visited.has(next.code)) continue;
        visited.add(next.code);
        queue.push({ route: next, boardAt: stop, depth: node.depth + 1, parent: node });
      }
    }
  }

  return null; // nothing reachable within MAX_TRANSFERS
}

/**
 * Turn a findRoute() result into a plain chat reply (no markdown — the
 * chat panel renders plain text).
 *   Direct:   "Ride Route 03Q (Ayala - SM City) from Ayala Center Cebu to SM City Cebu Terminal."
 *   Transfer: "Ride Route 03B from Mabolo (Sindulan) to Mango Ave, then transfer to Route 04C to reach Carbon Market."
 *   null:     null (caller supplies its own "no route" wording).
 */
export function formatRouteReply(result) {
  if (!result) return null;

  if (result.type === 'direct') {
    const name = result.routeName ? ` (${result.routeName})` : '';
    return `Ride Route ${result.route}${name} from ${result.from} to ${result.to}.`;
  }

  if (result.type === 'transfer') {
    const legs = result.legs
      .map((leg, i) =>
        i === 0
          ? `Ride Route ${leg.route} from ${leg.boardAt} to ${leg.alightAt}`
          : `then transfer to Route ${leg.route} to reach ${leg.alightAt}`
      )
      .join(', ');
    return `${legs}.`;
  }

  return null;
}
