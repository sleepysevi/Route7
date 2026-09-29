import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { findRoute } from '../api/route-finder.js';
import { calculateFare, calculateRouteFare, formatFare } from '../lib/fare.js';

const require = createRequire(import.meta.url);
const routes = require('../data/routes.json');

// ₱14 first 4 km + ₱2.00/km after; 20% discount tier.
test('calculateFare follows the fare config tiers', () => {
  assert.deepEqual(calculateFare(0), { regularFare: 14, discountedFare: 11 });
  assert.deepEqual(calculateFare(4), { regularFare: 14, discountedFare: 11 });
  assert.deepEqual(calculateFare(5), { regularFare: 16, discountedFare: 13 });
  assert.deepEqual(calculateFare(10), { regularFare: 26, discountedFare: 21 });
});

test('fare is computed from the segment distance, not the full route', () => {
  const result = findRoute('Labangon', 'Fuente Osmeña', routes);
  assert.ok(result);
  const fare = calculateRouteFare(result, routes);

  // 12L has 30 listed stops spanning its full polyline; the ride spans only
  // 3 of those stop steps, so the segment fare must be well under the full
  // route fare for the same jeepney code.
  const fullRouteFare = calculateFare(
    require('../lib/fare.js').routePolylineDistanceKm('12L'),
  );
  assert.ok(fare.regularFare < fullRouteFare.regularFare, `segment fare ${fare.regularFare} should be less than full-route fare ${fullRouteFare.regularFare}`);
  assert.ok(fare.regularFare >= 14, 'minimum fare is the ₱14 base');

  // One fare entry per leg, with the segment endpoints named.
  assert.equal(fare.legs.length, result.legs.length);
  assert.equal(fare.legs[0].route, '12L');
  assert.equal(fare.legs[0].boardStop, 'Labangon');
  assert.equal(fare.legs[0].alightStop, 'Fuente Osmeña');
});

test('discounted fare is 20% below regular fare on every leg', () => {
  const result = findRoute('Consolacion', 'Carbon Market', routes);
  assert.ok(result);
  const fare = calculateRouteFare(result, routes);
  assert.equal(fare.legs.length, 2);
  for (const leg of fare.legs) {
    assert.ok(leg.regularFare >= 14);
    assert.equal(leg.discountedFare, Math.round(leg.regularFare * 0.8));
  }
  assert.equal(fare.regularFare, fare.legs.reduce((sum, leg) => sum + leg.regularFare, 0));
  assert.equal(fare.discountedFare, fare.legs.reduce((sum, leg) => sum + leg.discountedFare, 0));
});

test('formatFare renders both tiers with the peso sign', () => {
  assert.equal(formatFare({ regularFare: 26, discountedFare: 21 }), 'Fare: ₱26 (₱21 discounted)');
});
