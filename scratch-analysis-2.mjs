import { readFileSync } from 'node:fs';

const routes = JSON.parse(readFileSync('./data/routes.json', 'utf-8'));

function printRouteStops(r) {
  if (!r) return 'Not found';
  let out = `Route ${r.code} (${r.route})\n`;
  if (r.via) out += `  Via: ${r.via}\n`;
  if (r.keywords) out += `  Keywords: ${r.keywords}\n`;
  out += `  Stops (${r.stops ? r.stops.length : 0}):\n`;
  (r.stops || []).forEach((s, i) => out += `    ${i}: ${s}\n`);
  return out;
}

// 12-series routes
console.log('=== 12-SERIES ROUTES ===');
['12D', '12I', '12L', '12G'].forEach(code => {
  const r = routes.find(x => x.code === code);
  console.log(printRouteStops(r));
});

// Step A: CIBUS
console.log('\n=== STEP A: CIBUS ===');
const cibus = routes.find(x => x.code === 'CIBUS');
console.log(printRouteStops(cibus));

// Step B: Town routes
console.log('\n=== STEP B: TOWN ROUTES CORRIDOR ===');
['42B', '43', '44A', '45'].forEach(code => {
  const r = routes.find(x => x.code === code);
  console.log(printRouteStops(r));
});

// Step C & D Data for manual review
console.log('\n=== STEP C & D: ALIAS NOISE AND INSERTION CANDIDATES ===');
['03B', '04B', '04H', '06B', '07B', '17D'].forEach(code => {
  const r = routes.find(x => x.code === code);
  console.log(printRouteStops(r));
});
