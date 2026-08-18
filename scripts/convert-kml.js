/**
 * Convert KML Routes/*.kml into data/route-coords.js
 * Each route gets full start (outbound) + end (return) paths with distinct colors.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const KML_DIR = path.join(ROOT, 'KML Routes');
const OUT_FILE = path.join(ROOT, 'data', 'route-coords.js');
const EXISTING_FILE = OUT_FILE;

const START_FALLBACK = '#2563eb';
const END_FALLBACK = '#f59e0b';
const EXTRA_FALLBACKS = ['#10b981', '#ec4899', '#8b5cf6', '#06b6d4'];

/** KML aabbggrr → #rrggbb */
function kmlColorToHex(kmlColor) {
  if (!kmlColor || kmlColor.length < 8) return null;
  const b = kmlColor.slice(2, 4);
  const g = kmlColor.slice(4, 6);
  const r = kmlColor.slice(6, 8);
  return `#${r}${g}${b}`.toUpperCase();
}

function stripCdata(text) {
  return (text || '')
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseStyleColors(xml) {
  const styles = {};

  for (const m of xml.matchAll(/<Style\s+id="([^"]+)">([\s\S]*?)<\/Style>/gi)) {
    const id = m[1];
    const body = m[2];
    // Prefer LineStyle color over IconStyle/PolyStyle
    const lineColor = body.match(/<LineStyle>[\s\S]*?<color>([0-9a-fA-F]+)<\/color>/i);
    const anyColor = body.match(/<color>([0-9a-fA-F]+)<\/color>/i);
    const raw = (lineColor || anyColor)?.[1];
    if (raw) styles[id] = kmlColorToHex(raw);
  }

  // StyleMap → normal style
  for (const m of xml.matchAll(/<StyleMap\s+id="([^"]+)">([\s\S]*?)<\/StyleMap>/gi)) {
    const id = m[1];
    const body = m[2];
    const normal = body.match(
      /<key>\s*normal\s*<\/key>\s*<styleUrl>#([^<]+)<\/styleUrl>/i
    );
    if (normal) {
      const ref = normal[1].trim();
      if (styles[ref]) styles[id] = styles[ref];
    }
  }

  return styles;
}

function parseCoordinates(coordText) {
  return coordText
    .trim()
    .split(/\s+/)
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [lng, lat] = pair.split(',').map(Number);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return [lat, lng];
    })
    .filter(Boolean);
}

function extractLinePaths(xml) {
  const styles = parseStyleColors(xml);
  const paths = [];

  for (const m of xml.matchAll(/<Placemark>([\s\S]*?)<\/Placemark>/gi)) {
    const block = m[1];
    const lineMatch = block.match(
      /<LineString>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>[\s\S]*?<\/LineString>/i
    );
    if (!lineMatch) continue;

    const coords = parseCoordinates(lineMatch[1]);
    if (coords.length < 2) continue;

    const name = stripCdata((block.match(/<name>([\s\S]*?)<\/name>/i) || [])[1]);
    const styleUrl = ((block.match(/<styleUrl>#([^<]+)<\/styleUrl>/i) || [])[1] || '').trim();
    let color =
      styles[styleUrl] ||
      styles[`${styleUrl}-normal`] ||
      null;

    // Infer from style id like line-0000FF-5000
    if (!color && styleUrl) {
      const hexMatch = styleUrl.match(/line-([0-9A-Fa-f]{6})/i);
      if (hexMatch) color = `#${hexMatch[1].toUpperCase()}`;
    }

    paths.push({ name: name || `Path ${paths.length + 1}`, color, coords });
  }

  return paths;
}

function assignRolesAndColors(paths) {
  if (paths.length === 0) return [];

  const used = new Set();
  const result = paths.map((p, i) => {
    let role = 'extra';
    if (i === 0) role = 'start';
    else if (i === paths.length - 1) role = 'end';

    let color = p.color ? p.color.toUpperCase() : null;
    if (!color || used.has(color)) {
      if (role === 'start') color = START_FALLBACK;
      else if (role === 'end') color = END_FALLBACK;
      else color = EXTRA_FALLBACKS[(i - 1) % EXTRA_FALLBACKS.length];
    }

    used.add(color);
    return {
      role,
      name: p.name,
      color,
      coords: p.coords,
    };
  });

  if (result.length >= 2) {
    result[0].role = 'start';
    result[result.length - 1].role = 'end';
    if (result[0].color === result[result.length - 1].color) {
      result[result.length - 1].color = END_FALLBACK;
    }
  } else {
    result[0].role = 'start';
  }

  return result;
}

function loadExistingStubs() {
  const stubsFile = path.join(ROOT, 'data', 'route-stubs.json');
  const out = {};

  if (fs.existsSync(stubsFile)) {
    try {
      Object.assign(out, JSON.parse(fs.readFileSync(stubsFile, 'utf8')));
    } catch (err) {
      console.warn('Could not load route-stubs.json:', err.message);
    }
  }

  if (!fs.existsSync(EXISTING_FILE)) return out;
  try {
    const src = fs.readFileSync(EXISTING_FILE, 'utf8');
    const match = src.match(/const ROUTE_COORDS\s*=\s*(\{[\s\S]*\});/);
    if (!match) return out;
    const existing = new Function(`return (${match[1]})`)();
    // Keep any non-KML entries already in route-coords (stubs win from stubs file above)
    for (const [code, entry] of Object.entries(existing)) {
      if (!out[code]) out[code] = entry;
    }
    return out;
  } catch (err) {
    console.warn('Could not load existing route-coords.js:', err.message);
    return out;
  }
}

function stubToPaths(entry) {
  if (entry.paths) return entry;
  if (entry.coords) {
    return {
      color: entry.color || START_FALLBACK,
      paths: [
        {
          role: 'start',
          name: 'Route',
          color: entry.color || START_FALLBACK,
          coords: entry.coords,
        },
      ],
    };
  }
  return entry;
}

function main() {
  const existing = loadExistingStubs();
  const out = {};

  // Preserve non-KML stubs first
  for (const [code, entry] of Object.entries(existing)) {
    out[code] = stubToPaths(entry);
  }

  const files = fs
    .readdirSync(KML_DIR)
    .filter((f) => f.toLowerCase().endsWith('.kml'))
    .sort();

  let converted = 0;
  for (const file of files) {
    const code = path.basename(file, '.kml');
    const xml = fs.readFileSync(path.join(KML_DIR, file), 'utf8');
    const rawPaths = extractLinePaths(xml);
    const paths = assignRolesAndColors(rawPaths);

    if (paths.length === 0) {
      console.warn(`No LineStrings in ${file}, keeping existing if any`);
      continue;
    }

    out[code] = {
      color: paths[0].color,
      paths,
    };
    converted++;
    console.log(
      `${code}: ${paths.length} path(s) — ${paths.map((p) => `${p.role}:${p.color}(${p.coords.length}pts)`).join(', ')}`
    );
  }

  const ordered = {};
  // Stable-ish order: numeric-ish codes then MI then others
  const keys = Object.keys(out).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  for (const k of keys) ordered[k] = out[k];

  const body = JSON.stringify(ordered, null, 2);
  const fileContents = `const ROUTE_COORDS = ${body};

export { ROUTE_COORDS };
export default ROUTE_COORDS;

if (typeof window !== 'undefined') {
  window.ROUTE_COORDS = ROUTE_COORDS;
}
`;

  fs.writeFileSync(OUT_FILE, fileContents, 'utf8');
  console.log(`\nWrote ${OUT_FILE}`);
  console.log(`Converted ${converted} KML files, total routes: ${keys.length}`);
}

main();
