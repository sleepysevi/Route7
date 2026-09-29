import { readFileSync } from 'node:fs';

const routes = JSON.parse(readFileSync('./data/routes.json', 'utf-8'));

const report = {};

function addMatch(route, reason, newStops) {
  if (!report[route.code]) {
    report[route.code] = {
      code: route.code,
      name: route.route,
      stops: route.stops,
      reasons: new Set(),
      newStops: new Set()
    };
  }
  report[route.code].reasons.add(reason);
  newStops.forEach(s => report[route.code].newStops.add(s));
}

// 1. Naga, Minglanilla, Talisay
for (const route of routes) {
  const matches = (s) => s && (s.toLowerCase().includes('naga') || s.toLowerCase().includes('minglanilla') || s.toLowerCase().includes('talisay'));
  
  if (matches(route.code) || matches(route.route) || matches(route.via) || (route.stops && route.stops.some(matches))) {
    // "Modern jeepneys serving Naga, Minglanilla, and Talisay pass through all three stops: Fuente, eMall, and Cebu Normal University (CNU)."
    // Wait, the prompt says "Modern jeepneys". I should check if the route is a modern jeepney (usually starts with "MI-" or similar, or just apply to all matching routes for the report).
    addMatch(route, 'Serves Naga/Minglanilla/Talisay', ['Fuente', 'eMall', 'Cebu Normal University']);
  }
}

// 2. 10F and 12S
for (const route of routes) {
  if (route.code === '10F' || route.code === '12S') {
    addMatch(route, 'Explicitly mentioned (10F/12S)', ['eMall']);
  }
}

// 3. "Jones" and "Fuente"
for (const route of routes) {
  if (route.stops) {
    const hasJones = route.stops.some(s => s.toLowerCase().includes('jones'));
    const hasFuente = route.stops.some(s => s.toLowerCase().includes('fuente'));
    if (hasJones && hasFuente) {
      addMatch(route, 'Passes Jones and Fuente', ['Fuente CBRT']);
    }
  }
}

console.log("================= STEP 1 REPORT =================");
for (const code of Object.keys(report).sort()) {
  const r = report[code];
  console.log(`\nRoute ${r.code} (${r.name})`);
  console.log(`Matched because: ${[...r.reasons].join(', ')}`);
  console.log(`New stops to apply: ${[...r.newStops].join(', ')}`);
  console.log(`Current Stops (${r.stops ? r.stops.length : 0}):`);
  if (r.stops) {
    r.stops.forEach((s, i) => console.log(`  ${i}: ${s}`));
  } else {
    console.log("  (None listed)");
  }
}
