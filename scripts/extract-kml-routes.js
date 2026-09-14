/**
 * Extract route metadata (name + description) from KML Routes/*.kml
 * using fast-xml-parser. Geometry (coordinates) is intentionally ignored —
 * we only need the text used by the chatbot's system prompt.
 *
 * Description sourcing per route (in order):
 *   1. Document-level <description> when it contains real leg/stop lines
 *      (i.e. more than just a title/marketing copy).
 *   2. Otherwise: combine whatever usable Document-level lines remain with
 *      the individual <Placemark> <description> tags, converting their
 *      dash-separated stop chains into the same leg-by-leg "X to Y" format.
 *   3. If neither level yields usable stop/route text (geometry-only KML),
 *      the route's "description" is left empty and the route is listed in
 *      the console output on every run.
 *
 * Output: data/route-descriptions.json -> [{ code, name, description }, ...]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { XMLParser } from 'fast-xml-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const KML_DIR = path.join(ROOT, 'KML Routes');
const OUT_FILE = path.join(ROOT, 'data', 'route-descriptions.json');

const parser = new XMLParser({
  ignoreAttributes: true,
  trimValues: false,
  parseTagValue: false, // keep text as strings, don't coerce numbers
});

/** Convert a fast-xml-parser node to plain text. */
function nodeToText(node) {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join('\n');
  // Object: prefer #text / #cdata, otherwise join nested values
  if (typeof node === 'object') {
    if (node['#text'] != null) return String(node['#text']);
    const parts = [];
    for (const val of Object.values(node)) {
      const t = nodeToText(val);
      if (t) parts.push(t);
    }
    return parts.join('\n');
  }
  return '';
}

const MARKETING = /more cebu jeepney/i; // "more cebu jeepney route maps...", "More Cebu Jeepney Routes @..."
const SEE_WEBSITE = /see (the )?(website|continuation)|more at the website|visit cebujeepneys/i;
const FACEBOOK = /like us on (our )?facebook/i; // "Like us on our Facebook Page..."

/** Non-route filler text that should never make it into the output. */
function isNoise(line) {
  return MARKETING.test(line) || SEE_WEBSITE.test(line) || FACEBOOK.test(line);
}

/** Clean a raw KML description string into an array of readable lines. */
function cleanLines(text) {
  let s = nodeToText(text);
  if (!s) return [];

  // <br> / <br/> -> newline
  s = s.replace(/<br\s*\/?>/gi, '\n');
  // Strip any other HTML-ish tags
  s = s.replace(/<\/?[a-zA-Z][^>]*>/g, ' ');
  // Decode common entities
  s = s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  return s
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 0 && !isNoise(l));
}

/**
 * Convert one cleaned line into leg-by-leg "X to Y" lines.
 * Dash-separated stop chains ("A - B - C") become pairwise legs
 * ("A to B", "B to C"); plain lines pass through unchanged.
 */
function toLegs(line) {
  if (!/\s-\s/.test(line)) return [line];
  const stops = line
    .split(/\s+-\s+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (stops.length < 2) return [line];
  const legs = [];
  for (let i = 0; i < stops.length - 1; i++) {
    legs.push(`${stops[i]} to ${stops[i + 1]}`);
  }
  return legs;
}

/** Collect every <Placemark> in the document, at any Folder nesting depth. */
function collectPlacemarks(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    node.forEach((n) => collectPlacemarks(n, out));
    return out;
  }
  if (node.Placemark) {
    (Array.isArray(node.Placemark) ? node.Placemark : [node.Placemark]).forEach((p) =>
      out.push(p)
    );
  }
  for (const [key, val] of Object.entries(node)) {
    if (key === 'Placemark') continue;
    if (val && typeof val === 'object') collectPlacemarks(val, out);
  }
  return out;
}

function main() {
  const files = fs
    .readdirSync(KML_DIR)
    .filter((f) => f.toLowerCase().endsWith('.kml'))
    .sort();

  const routes = [];
  const noData = [];

  for (const file of files) {
    const code = path.basename(file, '.kml');
    const xml = fs.readFileSync(path.join(KML_DIR, file), 'utf8');

    let parsed;
    try {
      parsed = parser.parse(xml);
    } catch (err) {
      console.warn(`Parse failed for ${file}: ${err.message}`);
      continue;
    }

    const doc = parsed?.kml?.Document ?? parsed?.kml ?? {};

    const name = cleanLines(doc.name).join(' ') || code;
    const docLines = cleanLines(doc.description);

    let description;
    if (docLines.length >= 2) {
      // Document-level description carries the leg-by-leg route text.
      description = docLines.join('\n');
    } else {
      // Document description is missing/title-only: fall back to the
      // individual <Placemark> descriptions, deduped against the doc lines.
      const seen = new Set(docLines.map((l) => l.toLowerCase()));
      const legs = [];
      for (const pm of collectPlacemarks(doc)) {
        for (const line of cleanLines(pm.description)) {
          for (const leg of toLegs(line)) {
            const key = leg.toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              legs.push(leg);
            }
          }
        }
      }

      if (docLines.length + legs.length > 0) {
        if (legs.length > 0) {
          console.log(
            `${code}: Document description insufficient — merged ${legs.length} placemark leg(s)`
          );
        }
        description = [...docLines, ...legs].join('\n');
      } else {
        // Geometry-only KML: no route/stop text anywhere.
        description = '';
        noData.push(code);
      }
    }

    routes.push({ code, name, description });
  }

  routes.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  fs.writeFileSync(OUT_FILE, JSON.stringify(routes, null, 2), 'utf8');
  console.log(`Wrote ${OUT_FILE} with ${routes.length} routes`);

  if (noData.length > 0) {
    console.log(
      `No usable route/stop text in KML, description left empty (${noData.length}): ${noData.join(', ')}`
    );
  } else {
    console.log('No usable route/stop text in KML, description left empty: none');
  }

  for (const r of routes) {
    console.log(`${r.code}: ${r.description ? r.description.split('\n').length + ' line(s)' : 'no description'}`);
  }
}

main();
