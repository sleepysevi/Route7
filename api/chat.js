import { createRequire } from 'node:module';
import { parseRequest, findRoute, formatRouteReply } from './route-finder.js';

const require = createRequire(import.meta.url);
const routesData = require('../data/routes.json'); // route codes, names, ordered stops

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

export default async function handler(req, res) {
  // Make the handler work both as a Vercel function and as a connect-style
  // middleware (Vite dev server), where res lacks .status()/.json().
  if (typeof res.status !== 'function') {
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
  }
  if (typeof res.json !== 'function') {
    res.json = (obj) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(obj));
    };
  }

  if (req.method !== 'POST') return res.status(405).end();

  // Vercel pre-parses req.body; connect-style middleware (Vite dev) does not.
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  } else if (body == null) {
    body = await readBody(req);
  }

  const { message } = body;

  // Fully rule-based matching — no LLM involved.
  // 1. Pull confidently matched stop names from the user's message.
  // 2. Find a direct route; if none, a one-transfer combination.
  // 3. Format the result into a plain-text chat reply.
  const request = parseRequest(message ?? '', routesData);

  if (request.kind === 'query') {
    const result = findRoute(request.origin, request.destination, routesData);
    if (result) {
      return res.status(200).json({ reply: formatRouteReply(result), result });
    }
    return res.status(200).json({
      reply: `No route found from ${request.origin} to ${request.destination} with at most one transfer. Try naming nearby major stops instead, like "Fuente Osmeña" or "Colon St".`,
      result: null,
    });
  }

  if (request.suggestions?.length) {
    return res.status(200).json({
      reply: `I found a few possible matches: ${request.suggestions.join(', ')}. Try naming one of these exactly.`,
      suggestions: request.suggestions,
      result: null,
    });
  }

  return res.status(200).json({
    reply: 'I couldn\'t match that to a route — try naming stops like "SM City Cebu" or "Ayala Center Cebu".',
    result: null,
  });
}
