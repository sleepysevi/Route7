import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  findRoute,
  formatRouteReply,
  scanPlaceMatches,
  parseRequest,
  suggestStops,
  normalizeStop,
  sameStop,
} from '../api/route-finder.js';
import { detectEmergencyIntent, detectOffTopicIntent } from '../api/intent.js';

const require = createRequire(import.meta.url);
const routes = require('../data/routes.json');

const route12L = routes.find((r) => r.code === '12L');

test('same-direction direct trip slices the segment between board and alight', () => {
  const result = findRoute('Labangon', 'Ayala Center Cebu', routes);
  assert.ok(result, 'expected a direct result');
  assert.equal(result.type, 'direct');
  assert.equal(result.legs.length, 1);

  const leg = result.legs[0];
  assert.equal(leg.routeId, '12L');
  assert.equal(leg.boardStop, 'Labangon');
  assert.equal(leg.boardIndex, 0);
  assert.ok(leg.alightStop.startsWith('Ayala Center Cebu'));
  assert.equal(leg.alightIndex, 9);
  assert.equal(leg.direction, 'forward');

  // Sliced stops are inclusive of both ends and contiguous.
  assert.equal(leg.stops[0], leg.boardStop);
  assert.equal(leg.stops[leg.stops.length - 1], leg.alightStop);
  assert.equal(leg.stops.length, leg.alightIndex - leg.boardIndex + 1);
  assert.deepEqual(leg.stops, route12L.stops.slice(leg.boardIndex, leg.alightIndex + 1));
});

test('reply for a direct trip names only stops inside the segment', () => {
  const result = findRoute('Labangon', 'Ayala Center Cebu', routes);
  const reply = formatRouteReply(result, routes);

  assert.match(reply, /Take jeepney 12L — board at Labangon, get off at Ayala Center Cebu/);
  assert.match(reply, /\(about 9 stops/);
  assert.match(reply, /Fuente Osmeña/); // landmark inside the segment
  // Stops outside the sliced segment must never appear.
  assert.doesNotMatch(reply, /tisa|banawa|punta princesa|escario|capitol/i);
  assert.equal(reply.split('\n').length, 1);
});

test('reverse-direction trip rides the segment backwards', () => {
  const result = findRoute('Ayala Center Cebu', 'Labangon', routes);
  assert.ok(result, 'expected a direct result');
  assert.equal(result.type, 'direct');
  assert.equal(result.legs.length, 1);

  const leg = result.legs[0];
  assert.equal(leg.routeId, '12L');
  assert.equal(leg.direction, 'reverse');
  assert.ok(leg.boardIndex > leg.alightIndex);
  assert.equal(leg.boardStop, route12L.stops[leg.boardIndex]);
  assert.equal(leg.alightStop, 'Labangon');

  // Slice is reversed: board first, then the stop just before it forward-wise.
  assert.equal(leg.stops[0], leg.boardStop);
  assert.equal(leg.stops[leg.stops.length - 1], leg.alightStop);
  assert.equal(leg.stops[1], 'Cebu Business Park');
  assert.equal(leg.stops.length, leg.boardIndex - leg.alightIndex + 1);

  const reply = formatRouteReply(result, routes);
  assert.match(reply, /board at Ayala Center Cebu/);
  assert.match(reply, /get off at Labangon/);
  assert.doesNotMatch(reply, /tisa|banawa|escario|capitol/i);
});

const loopRoute = {
  code: 'TST-LOOP',
  route: 'Terminal A - Terminal A (loop)',
  stops: ['Terminal A', 'Stop B', 'Stop C', 'Stop D', 'Stop E', 'Terminal A'],
};

test('loop route wraps around instead of reversing', () => {
  const result = findRoute('Stop D', 'Stop B', [loopRoute]);
  assert.ok(result, 'expected a direct result on the loop');
  assert.equal(result.type, 'direct');

  const leg = result.legs[0];
  assert.equal(leg.routeId, 'TST-LOOP');
  assert.equal(leg.direction, 'loop');
  assert.equal(leg.boardStop, 'Stop D');
  assert.equal(leg.alightStop, 'Stop B');
  // Wrap-around: board -> end of list -> start of list -> alight (inclusive).
  assert.deepEqual(leg.stops, ['Stop D', 'Stop E', 'Terminal A', 'Stop B']);
});

test('one-way route with alight before board is skipped', () => {
  const oneWay = {
    code: 'TST-OW',
    route: 'A - D (one way)',
    oneWay: true,
    stops: ['Alpha Stop', 'Bravo Stop', 'Charlie Stop', 'Delta Stop'],
  };
  assert.equal(findRoute('Delta Stop', 'Bravo Stop', [oneWay]), null);
  // Forward direction on the same route still works.
  const forward = findRoute('Bravo Stop', 'Delta Stop', [oneWay]);
  assert.ok(forward);
  assert.equal(forward.legs[0].direction, 'forward');
  assert.deepEqual(forward.legs[0].stops, ['Bravo Stop', 'Charlie Stop', 'Delta Stop']);
});

test('one-transfer trip produces one line per leg with the transfer stop named', () => {
  const result = findRoute('Consolacion', 'Carbon Market', routes);
  assert.ok(result, 'expected a transfer result');
  assert.equal(result.type, 'transfer');
  assert.equal(result.legs.length, 2);

  const [first, second] = result.legs;
  assert.equal(first.routeId, '24');
  assert.equal(first.boardStop, 'Consolacion');
  assert.equal(second.routeId, '03A');
  // Every leg alights exactly where the next leg boards (same physical stop).
  assert.ok(sameStop(first.alightStop, second.boardStop));
  for (const leg of result.legs) {
    assert.equal(leg.stops[0], leg.boardStop);
    assert.equal(leg.stops[leg.stops.length - 1], leg.alightStop);
  }

  const reply = formatRouteReply(result, routes);
  const lines = reply.split('\n');
  assert.equal(lines.length, 2);
  assert.match(lines[0], /^Take jeepney 24 — board at Consolacion/);
  assert.match(lines[1], /^At .+, transfer to jeepney 03A/);
  // Canonical name resolution: raw stop "Carbon" prints as "Carbon Market".
  assert.match(lines[1], /toward Carbon Market/);
});

test('reply for a trip on a much longer route covers only the short segment', () => {
  // 12L lists 30+ stops; Labangon -> Fuente Osmeña is just the first 4.
  const result = findRoute('Labangon', 'Fuente Osmeña', routes);
  assert.ok(result);
  const leg = result.legs[0];
  assert.equal(leg.routeId, '12L');
  assert.ok(route12L.stops.length >= 30);
  assert.ok(leg.stops.length < route12L.stops.length / 3);
  assert.deepEqual(leg.stops, ['Labangon', 'V. Rama Ave', 'B. Rodriguez St', 'Fuente Osmeña']);

  const reply = formatRouteReply(result, routes);
  assert.match(reply, /\(about 3 stops/);
  assert.doesNotMatch(reply, /tisa|banawa|mango square|ayala/i); // later stops excluded
});

test('route with no rideable direction or connection returns null', () => {
  assert.equal(findRoute('Labangon', 'Labangon', routes), null); // same stop
  assert.equal(findRoute('Nowhere XYZ', 'Labangon', routes), null); // unknown stop
});

// ---------------------------------------------------------------------------
// Regression tests for reported bugs ----------------------------------------
// ---------------------------------------------------------------------------

test('Bug 1: "exactly" does not match stop "ACT" — whole-word matching only', () => {
  const matches = scanPlaceMatches(normalizeStop('Where exactly do I get off for Colon?'), routes);
  const names = matches.map((m) => m.group.canonical);
  // "Colon" should match, but "ACT" from "exactly" must not.
  assert.ok(names.some((n) => /colon/i.test(n)), 'expected Colon to match');
  assert.ok(!names.some((n) => /\bact\b/i.test(n)), '"ACT" must not match inside "exactly"');
});

test('Bug 2: origin removal — "Carbon Market" origin does not steal destination match', async () => {
  const result = await parseRequest("I'm at Carbon Market. How do I get to SM City Cebu?", routes);
  assert.equal(result.kind, 'query');
  assert.match(result.origin, /Carbon Market/i);
  assert.match(result.destination, /SM City Cebu/i);
  // Destination must NOT resolve to "Carbon" (a substring of the origin).
  assert.doesNotMatch(result.destination, /^Carbon$/i);
});

test('Bug 3: unresolved place "University of San Carlos" does not fall back to a partial match', async () => {
  const result = await parseRequest('How do I get to the University of San Carlos?', routes);
  // Should be missing-origin (destination recognized) or unknown — never a full trip to "fuente".
  assert.notEqual(result.kind, 'query', 'must not silently route to a guessed stop');
  if (result.kind === 'missing-origin') {
    assert.match(result.destination, /University of San Carlos|USC/i);
  }
});

test('Bug 4: single place "Mactan airport" asks for missing origin/destination', async () => {
  const result = await parseRequest('Mactan airport', routes);
  assert.ok(
    result.kind === 'missing-origin' || result.kind === 'missing-destination',
    `expected missing-origin or missing-destination, got ${result.kind}`
  );
});

test('Bug 5: "Ayala to Ayala" returns same-place, not a route', async () => {
  const result = await parseRequest('Ayala to Ayala', routes);
  assert.equal(result.kind, 'same-place', 'origin and destination are the same');
  assert.match(result.place, /Ayala/i);
});

test('Bug 6: fuzzy suggestions are deduped by place ID — canonical names only', () => {
  const suggestions = suggestStops('vicente soto', routes);
  // Only canonical names, no alias duplicates.
  const unique = new Set(suggestions);
  assert.equal(suggestions.length, unique.size, 'suggestions must not contain duplicates');
  // The canonical form should be "Vicente Sotto Hospital", not the alias.
  if (suggestions.length) {
    assert.ok(
      suggestions.every((s) => s === s.charAt(0).toUpperCase() + s.slice(1) || /[A-Z]/.test(s[0])),
      'suggestions should use canonical casing'
    );
  }
});

test('Bug 7a: "best lechon in Cebu" is detected as off-topic, not a route query', () => {
  assert.ok(detectOffTopicIntent('best lechon in Cebu'), '"best lechon in Cebu" should be off-topic');
});

test('Bug 7b: "nearest hospital" is detected as emergency intent', () => {
  assert.ok(detectEmergencyIntent('nearest hospital'), '"nearest hospital" should trigger emergency');
});

test('Bug 8: "Where does 12L go after Colon?" is recognized as a route-code question', async () => {
  const result = await parseRequest('Where does 12L go after Colon?', routes);
  assert.equal(result.kind, 'route-code');
  assert.equal(result.code, '12L');
});

test('formatRouteReply without routes param still works (backward compat)', () => {
  const result = findRoute('Labangon', 'Fuente Osmeña', routes);
  // Calling without the second arg must not throw.
  const reply = formatRouteReply(result);
  assert.ok(reply, 'reply must be non-empty');
  assert.match(reply, /Take jeepney 12L/);
});

test('reply for a direct trip includes the route code', () => {
  const result = findRoute('Labangon', 'Ayala Center Cebu', routes);
  const reply = formatRouteReply(result, routes);
  assert.match(reply, /12L/, 'reply must contain the route code');
});
