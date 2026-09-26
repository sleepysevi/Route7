import { createRequire } from 'node:module';
import { parseRequest, findRoute, formatRouteReply } from './route-finder.js';
import { calculateRouteFare, formatFare } from '../lib/fare.js';

const require = createRequire(import.meta.url);
const routesData = require('../data/routes.json'); // route codes, names, ordered stops
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const GEMINI_TIMEOUT_MS = 8_000;
const routeReference = routesData.map(({ code, route, via, stops }) => ({ code, route, via, stops }));
const systemPrompt = `You are Route7's friendly Cebu jeepney travel assistant.
Speak warmly and casually, with light Cebuano/local flavor only when natural (for example, "Sige" or "Maayo"). Keep replies concise and easy to follow.

Use only the route, stop, and fare information in the Route7 reference below. Never invent a jeepney code, stop, fare, travel time, or transfer. If a fare is not present in the reference, say Route7 does not have verified fare data for it. If a place is missing, ask for a nearby known stop. If a place is ambiguous, ask the rider to clarify.

Route7 reference data:
${JSON.stringify(routeReference)}`;

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

async function askGemini(message, context) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.Gemini;
  if (!apiKey) throw new Error('Gemini API key is not configured');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: context ? `${message}\n\nContext: ${JSON.stringify(context)}` : message }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
        }),
        signal: controller.signal,
      },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Gemini ${response.status}: ${payload.error?.message || 'request failed'}`);
    const reply = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!reply) throw new Error(`Gemini returned no text: ${JSON.stringify(payload).slice(0, 500)}`);
    return reply;
  } finally {
    clearTimeout(timeout);
  }
}

async function fallbackRouteReply(message, context) {
  const request = await parseRequest(message, routesData, context);
  if (request.kind === 'query') {
    const result = findRoute(request.origin, request.destination, routesData);
    if (result) {
      const fare = calculateRouteFare(result, routesData);
      return { reply: `${formatRouteReply(result)}\n${formatFare(fare)}`, result, fare };
    }
    return {
      reply: `No route found from ${request.origin} to ${request.destination} with at most one transfer. Try naming nearby major stops instead, like "Fuente Osmeña" or "Colon St".`,
      result: null,
    };
  }
  if (request.suggestions?.length) {
    return {
      reply: `I found a few possible matches: ${request.suggestions.join(', ')}. Try naming one of these exactly.`,
      suggestions: request.suggestions,
      context: { suggestedStops: request.suggestions, destination: request.stops?.[0] || null },
      result: null,
    };
  }
  return {
    reply: 'I couldn\'t match that to a route — try naming stops like "SM City Cebu" or "Ayala Center Cebu".',
    result: null,
  };
}

function isGroundedRouteReply(message, reply) {
  const routeQuestion = /\b(route|jeepney|sakay|ride|from|to|get me|get to|how do i)\b/i.test(message);
  if (!routeQuestion) return true;
  const hasKnownCode = routesData.some(({ code }) =>
    new RegExp(`\\b${String(code).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(reply)
  );
  const isClearNonAnswer = /\b(no route|not in|don't have|do not have|clarif|nearby known stop)\b/i.test(reply);
  return hasKnownCode || isClearNonAnswer;
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

  const { message, context } = body;

  try {
    const resolvedRequest = await parseRequest(message ?? '', routesData, context);
    const verifiedResult = resolvedRequest.kind === 'query'
      ? findRoute(resolvedRequest.origin, resolvedRequest.destination, routesData)
      : null;
    const fare = calculateRouteFare(verifiedResult, routesData);
    const geminiContext = {
      ...context,
      verifiedRoute: verifiedResult,
      verifiedFare: fare,
    };
    let reply = await askGemini(message ?? '', geminiContext);
    if (!isGroundedRouteReply(message ?? '', reply)) {
      throw new Error('Gemini response did not include a verified Route7 code');
    }
    if (fare && !reply.includes('₱')) reply = `${reply}\n\n${formatFare(fare)}`;
    return res.status(200).json({ reply, result: verifiedResult, fare, engine: 'gemini' });
  } catch (error) {
    console.warn(`[chat] Gemini unavailable; using Route7 fallback: ${error.message}`);
    const fallback = await fallbackRouteReply(message ?? '', context);
    return res.status(200).json({ ...fallback, engine: 'fallback' });
  }
}
