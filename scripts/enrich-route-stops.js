/*
 * Merge the named locations from route-descriptions.json into routes.json.
 * The descriptions contain the detailed map location pairs, while routes.json
 * intentionally started with a compact set of canonical stops.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routesPath = path.join(root, 'data', 'routes.json');
const descriptionsPath = path.join(root, 'data', 'route-descriptions.json');

const routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
const descriptions = JSON.parse(fs.readFileSync(descriptionsPath, 'utf8'));
const byCode = new Map(descriptions.map((item) => [item.code.toUpperCase(), item.description || '']));

const cleanLocation = (value) => value
  .replace(/^[*\-–—\s]+|[*\-–—\s]+$/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const keyFor = (value) => cleanLocation(value)
  .toLowerCase()
  .replace(/[.,()]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

for (const route of routes) {
  const description = byCode.get(String(route.code).toUpperCase());
  if (!description) continue;

  const locations = [];
  for (const line of description.split(/\r?\n/)) {
    const text = cleanLocation(line);
    if (!text || /route\s*(no\.?|number)?\s*\w+/i.test(text)) continue;

    const parts = text.split(/\s+to\s+|\s+[-–—]\s+/i);
    if (parts.length < 2) continue;
    locations.push(cleanLocation(parts[0]), cleanLocation(parts.slice(1).join(' - ')));
  }

  const existingKeys = new Set((route.stops || []).map(keyFor));
  for (const location of locations) {
    const key = keyFor(location);
    if (key && !existingKeys.has(key)) {
      route.stops = [...(route.stops || []), location];
      existingKeys.add(key);
    }
  }
}

fs.writeFileSync(routesPath, `${JSON.stringify(routes, null, 2)}\n`, 'utf8');
console.log(`Enriched ${routes.length} routes with detailed map locations.`);
