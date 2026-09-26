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

export function distanceAlongRouteKm(routeCode, fromStop, toStop, route) {
  const totalDistance = routePolylineDistanceKm(routeCode);
  if (!totalDistance || !route?.stops?.length) return totalDistance;

  const fromKey = normalize(fromStop);
  const toKey = normalize(toStop);
  const routeLabel = normalize(route.route);
  if (fromKey && toKey && routeLabel.includes(fromKey) && routeLabel.includes(toKey)) {
    return totalDistance;
  }
  const findIndex = (key) => route.stops.findIndex((stop) => {
    const stopKey = normalize(stop);
    return stopKey === key || stopKey.includes(key) || key.includes(stopKey);
  });
  const fromIndex = findIndex(fromKey);
  const toIndex = findIndex(toKey);
  if (fromIndex < 0 || toIndex < 0 || route.stops.length < 2) return totalDistance;

  // Stop coordinates are not present in the imported KML data. Until they
  // are added, map the ordered stop positions onto the actual polyline length.
  return totalDistance * Math.abs(toIndex - fromIndex) / (route.stops.length - 1);
}

export function calculateFare(distanceKm) {
  const distance = Math.max(0, Number(distanceKm) || 0);
  const extraKm = Math.max(0, distance - fareConfig.baseFareKm);
  const regularFare = Math.round(fareConfig.baseFare + extraKm * fareConfig.perKmRate);
  const discountedFare = Math.round(regularFare * (1 - fareConfig.discountPercent));
  return { regularFare, discountedFare };
}

export function calculateRouteFare(routeResult, routes) {
  if (!routeResult) return null;
  const legs = routeResult.type === 'direct'
    ? [{ route: routeResult.route, boardAt: routeResult.from, alightAt: routeResult.to }]
    : routeResult.legs || [];
  const fares = legs.map((leg) => {
    const route = routes.find((item) => item.code === leg.route);
    const distanceKm = distanceAlongRouteKm(leg.route, leg.boardAt, leg.alightAt, route);
    return { route: leg.route, distanceKm, ...calculateFare(distanceKm) };
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
