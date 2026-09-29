import { createRequire } from 'node:module';
import { parseRequest, findRoute, formatRouteReply, normalizeStop } from './route-finder.js';
import { detectEmergencyIntent, detectOffTopicIntent, formatHotlinesReply, formatOffTopicReply } from './intent.js';
import { calculateRouteFare, formatFare } from '../lib/fare.js';

const require = createRequire(import.meta.url);
const routesData = require('../data/routes.json'); // route codes, names, ordered stops

const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 5_000;
const GEMINI_RETRIES = 2; // extra attempts after the first failure
const BACKOFF_MS = String(process.env.GEMINI_BACKOFF_MS || '500,1500')
  .split(',')
  .map((ms) => Number(ms) || 0);
const BACKOFF_JITTER_MS = 250;

const systemPrompt = `You are Route7's friendly Cebu jeepney travel assistant.
Speak warmly and casually, with light Cebuano/local flavor only when natural (for example, "Sige" or "Maayo"). Keep replies concise and easy to follow.

You will receive a verified "trip" object in the context. It lists each leg with the jeepney routeId, the exact boarding stop, the exact alighting stop, and "stops" — the ordered stops the rider passes, inclusive of both ends.

Rules:
- Describe ONLY the verified trip. Never invent or mention a jeepney code, stop, fare, travel time, or transfer that is not in the trip.
- For each leg, tell the rider to get on at the boarding stop and get off at the alighting stop, and how many stops the ride is.
- You may name at most one or two stops as landmarks along the way, taken ONLY from that leg's "stops" array. NEVER mention any stop that is not inside a leg's "stops" array — in particular, never mention stops outside the ridden segment.
- Report the verified fare exactly as provided; if none is provided, say Route7 does not have verified fare data for it.
- If no verified trip is provided, say you need better-known stops and suggest naming major stops like "Fuente Osmeña" or "SM City Cebu".`;

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// One Gemini attempt with a hard timeout. Throws Error with a message that
// distinguishes "timeout" from HTTP failures (503, 429, ...).
async function askGeminiOnce(message, context, model) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.Gemini;
  if (!apiKey) throw new Error('Gemini API key is not configured');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
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
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`timeout after ${Date.now() - startedAt}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// Retry on 503/429 (rate limit / unavailable) up to GEMINI_RETRIES extra
// times with exponential backoff + jitter. Other errors fail immediately.
async function askGeminiWithRetries(message, context, model) {
  let lastError;
  for (let attempt = 0; attempt <= GEMINI_RETRIES; attempt += 1) {
    try {
      return await askGeminiOnce(message, context, model);
    } catch (error) {
      lastError = error;
      const retryable = /Gemini (503|429)\b/.test(error.message || '');
      if (!retryable || attempt === GEMINI_RETRIES) break;
      const backoff = BACKOFF_MS[attempt] ?? BACKOFF_MS[BACKOFF_MS.length - 1];
      const jitter = Math.floor(Math.random() * BACKOFF_JITTER_MS);
      console.warn(`[chat] Gemini ${model} attempt ${attempt + 1} failed (${error.message.split(':')[0]}); retrying in ${backoff + jitter}ms`);
      await sleep(backoff + jitter);
    }
  }
  throw lastError;
}

// Gemini may only ever see the sliced segment of each leg — never the full
// route stop list — so it cannot name stops outside the ridden segment.
function tripContext(routeResult) {
  if (!routeResult || !Array.isArray(routeResult.legs)) return null;
  return {
    type: routeResult.type,
    legs: routeResult.legs.map((leg) => ({
      routeId: leg.routeId,
      boardStop: leg.boardStop,
      alightStop: leg.alightStop,
      stopCount: Math.max(1, (leg.stops?.length ?? 2) - 1),
      stops: leg.stops,
    })),
  };
}

// Reject replies that mention a stop not inside any leg's segment stops.
// Whole-word matching on normalized text, matching the place matcher rules.
function replyStaysInSegments(reply, trip) {
  if (!trip) return true;
  const allowed = new Set();
  for (const leg of trip.legs) {
    for (const stop of leg.stops || []) allowed.add(normalizeStop(stop));
  }
  // Pad with spaces so single-word stops match whole words only ("act" can
  // never match inside "exactly"). Multi-word stop names match as phrases.
  const text = ` ${normalizeStop(reply)} `;
  for (const route of routesData) {
    for (const stop of route.stops || []) {
      const stopKey = normalizeStop(stop);
      if (stopKey.length < 4 || allowed.has(stopKey)) continue;
      if (text.includes(` ${stopKey} `)) return false;
    }
  }
  return true;
}

function isGroundedRouteReply(reply) {
  const hasKnownCode = routesData.some(({ code }) =>
    new RegExp(`\\b${String(code).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(reply)
  );
  const isClearNonAnswer = /\b(no route|not in|don't have|do not have|clarif|nearby known stop|couldn'?t find|couldn'?t match)\b/i.test(reply);
  return hasKnownCode || isClearNonAnswer;
}

// Distinct deterministic messages for every unresolvable case.
function fallbackMessages() {
  return {
    unknownPlace: (stops, suggestions) =>
      suggestions.length
        ? `I couldn't find "${stops[0] || 'that place'}" in Route7's stop data. Did you mean one of these: ${suggestions.join(', ')}?`
        : `I couldn't find that place in Route7's stop data. Try naming a major stop like "Fuente Osmeña", "SM City Cebu", or "Colon St".`,
    samePlace: (place) =>
      `"${place}" looks like both your start and destination. Where would you like to go from ${place}?`,
    missingOrigin: (destination, suggestions) =>
      suggestions.length
        ? `Where are you starting from? For ${destination}, riders usually start at places like ${suggestions.join(', ')}.`
        : `Where are you starting from? I have ${destination} as your destination.`,
    missingDestination: (origin) =>
      `Where do you want to go from ${origin}? Tell me your destination and I'll find the jeep.`,
    noRoute: (origin, destination) =>
      `No route found from ${origin} to ${destination} with at most one transfer. Try naming nearby major stops instead, like "Fuente Osmeña" or "Colon St".`,
    routeCode: (code) =>
      `Route ${code} is one of Cebu's jeepney lines. I give trip directions between two places — tell me where you are and where you're going, and I'll check if ${code} (or a transfer) gets you there.`,
    unmatched: () =>
      `I couldn't match that to a route — try naming stops like "SM City Cebu" or "Ayala Center Cebu".`,
  };
}

// Deterministic reply pipeline used when Gemini is unavailable or rejected.
async function fallbackRouteReply(message, context) {
  const messages = fallbackMessages();
  const request = await parseRequest(message, routesData, context);

  switch (request.kind) {
    case 'query': {
      const result = findRoute(request.origin, request.destination, routesData);
      if (result) {
        const fare = calculateRouteFare(result, routesData);
        return { reply: `${formatRouteReply(result, routesData)}\n${formatFare(fare)}`, result, fare };
      }
      return { reply: messages.noRoute(request.origin, request.destination), result: null };
    }
    case 'same-place':
      return { reply: messages.samePlace(request.place), result: null };
    case 'missing-origin':
      return {
        reply: messages.missingOrigin(request.destination, suggestFor(request.destination)),
        result: null,
        context: { suggestedStops: suggestFor(request.destination), destination: request.destination },
      };
    case 'missing-destination':
      return { reply: messages.missingDestination(request.origin), result: null };
    case 'route-code':
      return { reply: messages.routeCode(request.code), result: null };
    case 'unknown':
    default: {
      const suggestions = request.suggestions?.length ? request.suggestions : [];
      const attempted = request.stops?.length ? request.stops : [text.slice(0, 48)];
      return {
        reply: messages.unknownPlace(attempted, suggestions),
        result: null,
        ...(suggestions.length ? { suggestions, context: { suggestedStops: suggestions, destination: null } } : {}),
      };
    }
  }
}

// Suggest up to 3 well-known places for "where do I start?" prompts.
function suggestFor(destination) {
  const known = ['SM City Cebu', 'Ayala Center Cebu', 'Colon Street', 'Carbon Market', 'Cebu IT Park'];
  return known.filter((place) => normalizeStop(place) !== normalizeStop(destination)).slice(0, 3);
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
  const text = message ?? '';
  const startedAt = Date.now();
  const requestLog = { path: 'fallback', attempts: 0, origin: null, destination: null, reason: null };

  // --- Intent step: runs BEFORE any stop matching ----------------------
  if (detectEmergencyIntent(text)) {
    requestLog.reason = 'emergency-intent';
    console.log(`[chat] path=fallback attempts=0 latency=${Date.now() - startedAt}ms reason=emergency-intent`);
    return res.status(200).json({
      reply: formatHotlinesReply(),
      result: null,
      intent: 'emergency',
      engine: 'fallback',
    });
  }
  if (detectOffTopicIntent(text)) {
    requestLog.reason = 'off-topic';
    console.log(`[chat] path=fallback attempts=0 latency=${Date.now() - startedAt}ms reason=off-topic`);
    return res.status(200).json({
      reply: formatOffTopicReply(),
      result: null,
      intent: 'off-topic',
      engine: 'fallback',
    });
  }

  // Resolve the trip once; both Gemini and the fallback reuse it (the
  // semantic-stop step therefore runs exactly once per request).
  let resolvedRequest = null;
  let verifiedResult = null;
  let fare = null;
  try {
    resolvedRequest = await parseRequest(text, routesData, context);
    if (resolvedRequest.kind === 'query') {
      verifiedResult = findRoute(resolvedRequest.origin, resolvedRequest.destination, routesData);
      fare = calculateRouteFare(verifiedResult, routesData);
      requestLog.origin = resolvedRequest.origin;
      requestLog.destination = resolvedRequest.destination;
    } else {
      requestLog.reason = resolvedRequest.kind;
    }
  } catch (error) {
    requestLog.reason = `parse-error: ${error.message}`;
  }

  const trip = tripContext(verifiedResult);
  const geminiContext = {
    ...context,
    trip,
    fare,
  };

  const forceFallback = process.env.FORCE_FALLBACK === '1';
  const forceGemini = process.env.FORCE_GEMINI === '1';

  // Model config is read per-request so tests and deploys can override it.
  const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const backupModel = process.env.GEMINI_FALLBACK_MODEL || '';

  if (!forceFallback && (trip || !forceGemini)) {
    const models = backupModel ? [primaryModel, backupModel] : [primaryModel];

    for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
      const model = models[modelIndex];
      const attemptStart = Date.now();
      try {
        let reply = await askGeminiWithRetries(text, geminiContext, model);
        requestLog.attempts += GEMINI_RETRIES + 1;
        requestLog.path = modelIndex === 0 ? 'gemini' : 'gemini-backup';

        // Grounding: the reply must carry a verified code (or be a clear
        // non-answer) AND never mention a stop outside the trip segments.
        if (trip) {
          if (!replyStaysInSegments(reply, trip)) {
            throw new Error('Gemini reply mentioned a stop outside the trip segments');
          }
          if (!isGroundedRouteReply(reply)) {
            throw new Error('Gemini response did not include a verified Route7 code');
          }
        }
        if (fare && !reply.includes('₱')) reply = `${reply}\n\n${formatFare(fare)}`;

        console.log(`[chat] path=${requestLog.path} attempts=${requestLog.attempts} latency=${Date.now() - startedAt}ms origin=${requestLog.origin ?? '-'} destination=${requestLog.destination ?? requestLog.reason ?? '-'} model=${model} attemptLatency=${Date.now() - attemptStart}ms`);
        return res.status(200).json({ reply, result: verifiedResult, fare, engine: requestLog.path });
      } catch (error) {
        requestLog.attempts += GEMINI_RETRIES + 1;
        const kind = /timeout/.test(error.message) ? 'timeout' : /503/.test(error.message) ? '503' : /429/.test(error.message) ? '429' : 'error';
        console.warn(`[chat] Gemini ${model} unavailable (${kind}): ${error.message}`);
        requestLog.reason = `${model}:${kind}`;
        if (forceGemini) {
          console.log(`[chat] path=none attempts=${requestLog.attempts} latency=${Date.now() - startedAt}ms reason=${requestLog.reason} (FORCE_GEMINI)`);
          return res.status(502).json({ error: `Gemini unavailable: ${error.message}`, engine: 'gemini' });
        }
        // try the next model / fall through to the deterministic reply
      }
    }
  }

  const fallback = await fallbackRouteReply(text, context);
  console.log(`[chat] path=fallback attempts=${requestLog.attempts} latency=${Date.now() - startedAt}ms origin=${requestLog.origin ?? '-'} destination=${requestLog.destination ?? requestLog.reason ?? '-'}`);
  return res.status(200).json({ ...fallback, engine: 'fallback' });
}
