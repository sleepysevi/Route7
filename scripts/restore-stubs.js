import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { ROUTE_COORDS } from '../data/route-coords.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stubCodes = ['15', '06F', '43', '44', '45', '41D', '42B', 'MI-23A', 'CIBUS'];
const START = '#2563eb';

const src = execSync('git show HEAD:data/route-coords.js', {
  cwd: root,
  encoding: 'buffer',
  maxBuffer: 50 * 1024 * 1024,
}).toString('utf8');

const match = src.match(/const ROUTE_COORDS\s*=\s*(\{[\s\S]*\});/);
if (!match) {
  console.error('Could not parse HEAD route-coords.js');
  process.exit(1);
}

const old = new Function(`return (${match[1]})`)();
const stubs = {};

for (const code of stubCodes) {
  const entry = old[code];
  if (!entry) {
    console.warn('Missing stub in HEAD:', code);
    continue;
  }
  stubs[code] = entry.paths
    ? entry
    : {
        color: entry.color || START,
        paths: [
          {
            role: 'start',
            name: 'Route',
            color: entry.color || START,
            coords: entry.coords,
          },
        ],
      };
  ROUTE_COORDS[code] = stubs[code];
  console.log('Restored', code, stubs[code].paths[0].coords.length, 'pts');
}

fs.writeFileSync(
  path.join(root, 'data', 'route-stubs.json'),
  JSON.stringify(stubs, null, 2),
  'utf8'
);

const keys = Object.keys(ROUTE_COORDS).sort((a, b) =>
  a.localeCompare(b, undefined, { numeric: true })
);
const ordered = {};
for (const k of keys) ordered[k] = ROUTE_COORDS[k];

fs.writeFileSync(
  path.join(root, 'data', 'route-coords.js'),
  `const ROUTE_COORDS = ${JSON.stringify(ordered, null, 2)};

export { ROUTE_COORDS };
export default ROUTE_COORDS;

if (typeof window !== 'undefined') {
  window.ROUTE_COORDS = ROUTE_COORDS;
}
`,
  'utf8'
);

console.log('Wrote stubs + coords. Total routes:', keys.length);
