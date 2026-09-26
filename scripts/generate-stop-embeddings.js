/* Generate the offline stop embedding index used by the chatbot. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from '@xenova/transformers';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routes = JSON.parse(fs.readFileSync(path.join(root, 'data', 'routes.json'), 'utf8'));
const descriptions = JSON.parse(fs.readFileSync(path.join(root, 'data', 'route-descriptions.json'), 'utf8'));

const names = new Map();
const add = (value) => {
  const name = String(value || '').replace(/\s+/g, ' ').trim();
  if (name && name.length >= 2) names.set(name.toLowerCase(), name);
};

for (const route of routes) for (const stop of route.stops || []) add(stop);
for (const item of descriptions) {
  for (const line of String(item.description || '').split(/\r?\n/)) {
    const parts = line.trim().split(/\s+to\s+|\s+[-–—]\s+/i);
    if (parts.length > 1) {
      add(parts[0]);
      add(parts.slice(1).join(' - '));
    }
  }
}

console.log(`Embedding ${names.size} unique stop names...`);
const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
const embeddings = {};
let index = 0;
for (const name of names.values()) {
  const output = await extractor(name, { pooling: 'mean', normalize: true });
  embeddings[name] = Array.from(output.data);
  index += 1;
  if (index % 100 === 0) console.log(`${index}/${names.size}`);
}

fs.writeFileSync(
  path.join(root, 'data', 'stop-embeddings.json'),
  `${JSON.stringify({ model: 'Xenova/all-MiniLM-L6-v2', embeddings }, null, 2)}\n`,
  'utf8',
);
console.log(`Wrote data/stop-embeddings.json (${index} embeddings).`);
