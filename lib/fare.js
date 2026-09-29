import { lineString, length as lineLength } from '@turf/turf';
import fareConfig from '../data/fare-config.js';
import ROUTE_COORDS from '../data/route-coords.js';

const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function getRouteCoordinates(routeCode) {
  const entry = ROUTE_COORDS[routeCode];
  const paths = entry?.paths?.length
    ? entry.paths
    : entry?.coords?.length
      ? [{ coords: entry.coords }]
      : [];
  if (!paths.length) return [];
  // A route may have outbound/inbound paths. Use the longest geometry as the
  // reference route so fare estimates cover the complete trip.
  return paths
    .map((path) => path.coords || [])
    .filter((coords) => coords.length >= 2)
    .sort((a, b) => b.length - a.length)[0] || [];
}

export function routePolylineDistanceKm(routeCode) {
  const coordinates = getRouteCoordinates(routeCode).map(([lat, lng]) => [lng, lat]);
  return coordinates.length >= 2 ? lineLength(lineString(coordinates), { units: 'kilometers' }) : 0;
}

export function distanceAlongRouteKm(routeCode, fromStop, toStop, route, boardIndex = null, alightIndex = null) {
  const totalDistance = routePolylineDistanceKm(routeCode);
  if (!totalDistance || !route?.stops?.length) return totalDistance;

  const fromKey = normalize(fromStop);
  const toKey = normalize(toStop);
  const findIndex = (key) => route.stops.findIndex((stop) => {
    return normalize(stop) === key;
  });
  // Leg slices from findRoute carry exact indices; prefer them over fuzzy
  // name lookups so the fare always matches the segment being described.
  const fromIndex = Number.isInteger(boardIndex) && boardIndex >= 0 ? boardIndex : findIndex(fromKey);
  const toIndex = Number.isInteger(alightIndex) && alightIndex >= 0 ? alightIndex : findIndex(toKey);
  if (fromIndex < 0 || toIndex < 0 || route.stops.length < 2) return totalDistance;

  // Travel in the direction the leg resolves to: forward span, reverse span,
  // or a loop wrap-around (board -> end of list -> start -> alight). A one-way
  // route (loop === false) with the alight stop listed before the board stop
  // is not rideable, so there is no traveled distance.
  let stopSpan;
  if (toIndex >= fromIndex) {
    stopSpan = toIndex - fromIndex;
  } else if (route.loop === false) {
    return 0;
  } else if (route.loop === true) {
    stopSpan = (route.stops.length - 1 - fromIndex) + toIndex;
  } else {
    // Unflagged route ridden against its listed order: the jeepney simply
    // returns along the same alignment, so distance is the absolute span.
    stopSpan = fromIndex - toIndex;
  }
  if (stopSpan <= 0) return 0;

  // Stop coordinates are not present in the imported KML data. Until they
  // are added, map the ordered stop positions onto the actual polyline length.
  return totalDistance * stopSpan / (route.stops.length - 1);
}

export function calculateFare(distanceKm) {
  const distance = Math.max(0, Number(distanceKm) || 0);
  const extraKm = Math.max(0, distance - fareConfig.baseFareKm);
  const regularFare = Math.round(fareConfig.baseFare + extraKm * fareConfig.perKmRate);
  const discountedFare = Math.round(regularFare * (1 - fareConfig.discountPercent));
  return { regularFare, discountedFare };
}

export function calculateRouteFare(routeResult, routes) {
  if (!routeResult || !Array.isArray(routeResult.legs) || !routeResult.legs.length) return null;
  // Every result shape now carries sliced legs (board/alight indices + stops),
  // so fare is computed per segment, never across the whole route.
  const fares = routeResult.legs.map((leg) => {
    const route = routes.find((item) => item.code === (leg.routeId ?? leg.route));
    const distanceKm = distanceAlongRouteKm(
      leg.routeId ?? leg.route,
      leg.boardStop ?? leg.boardAt,
      leg.alightStop ?? leg.alightAt,
      route,
      Number.isInteger(leg.boardIndex) ? leg.boardIndex : null,
      Number.isInteger(leg.alightIndex) ? leg.alightIndex : null,
    );
    return {
      route: leg.routeId ?? leg.route,
      boardStop: leg.boardStop ?? leg.boardAt,
      alightStop: leg.alightStop ?? leg.alightAt,
      distanceKm,
      ...calculateFare(distanceKm),
    };
  });
  return {
    regularFare: fares.reduce((sum, fare) => sum + fare.regularFare, 0),
    discountedFare: fares.reduce((sum, fare) => sum + fare.discountedFare, 0),
    legs: fares,
  };
}

export function formatFare(fare) {
  return `Fare: ₱${fare.regularFare} (₱${fare.discountedFare} discounted)`;
}
