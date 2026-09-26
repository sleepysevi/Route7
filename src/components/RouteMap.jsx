import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { animate, svg } from 'animejs';
import { X, Navigation } from 'lucide-react';
import { ROUTE_COORDS } from '../../data/route-coords.js';

const DEFAULT_CENTER = [10.2938, 123.895];
const DEFAULT_ZOOM = 12;
const ROUTE_COLOR = '#FF5722';

function savePathDrawState(pathElement) {
  return {
    dashArray: pathElement.getAttribute('stroke-dasharray'),
    dashOffset: pathElement.getAttribute('stroke-dashoffset'),
    pathLength: pathElement.getAttribute('pathLength'),
    strokeLinecap: pathElement.style.strokeLinecap,
  };
}

function restorePathDrawState(pathElement, state) {
  const restoreAttribute = (name, value) => {
    if (value === null) pathElement.removeAttribute(name);
    else pathElement.setAttribute(name, value);
  };

  restoreAttribute('stroke-dasharray', state.dashArray);
  restoreAttribute('stroke-dashoffset', state.dashOffset);
  restoreAttribute('pathLength', state.pathLength);
  pathElement.style.strokeLinecap = state.strokeLinecap;
}

function createStartMarkerIcon(color = '#2563eb') {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};border:2px solid #ffffff;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:9px;font-weight:900;font-family:system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.6)">A</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function createEndMarkerIcon(color = '#f59e0b') {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};border:2px solid #ffffff;width:18px;height:18px;border-radius:3px;display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:9px;font-weight:900;font-family:system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.6)">B</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/** Normalize legacy {coords,color} and new {paths:[{role,name,color,coords}]} shapes. */
function getRoutePaths(routeEntry) {
  if (!routeEntry) return [];
  if (Array.isArray(routeEntry.paths) && routeEntry.paths.length > 0) {
    return routeEntry.paths.filter((p) => p?.coords?.length >= 2);
  }
  if (routeEntry.coords?.length >= 2) {
    return [
      {
        role: 'start',
        name: 'Route',
        color: routeEntry.color || '#ff4757',
        coords: routeEntry.coords,
      },
    ];
  }
  return [];
}

export default function RouteMap({ selectedRoute, onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef([]);
  const markersRef = useRef([]);
  const routeAnimationRef = useRef(null);

  const stopRouteAnimation = () => {
    const activeAnimation = routeAnimationRef.current;
    if (!activeAnimation) return;

    activeAnimation.frameIds.forEach((frameId) => cancelAnimationFrame(frameId));
    activeAnimation.pathStates.forEach(({ animation, pathElement, drawState }) => {
      animation?.cancel();
      restorePathDrawState(pathElement, drawState);
    });
    routeAnimationRef.current = null;
  };

  const routeCode = selectedRoute?.code;
  const routeName = selectedRoute?.route;
  const routeEntry = routeCode ? ROUTE_COORDS[routeCode] : null;
  const paths = useMemo(() => getRoutePaths(routeEntry), [routeEntry]);
  const startPath = paths.find((p) => p.role === 'start') || paths[0];
  const endPath = paths.find((p) => p.role === 'end');
  const endLegendPath = endPath || startPath;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    });
    tileLayer.addTo(map);

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Route Polylines & Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.invalidateSize();

    // Leaflet owns these paths, so leave a clean SVG state whenever a route changes.
    stopRouteAnimation();

    layersRef.current.forEach((layer) => map.removeLayer(layer));
    layersRef.current = [];
    markersRef.current.forEach((marker) => map.removeLayer(marker));
    markersRef.current = [];

    if (paths.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    const allBounds = [];
    const routePolylines = [];

    paths.forEach((path) => {
      const label =
        path.role === 'start'
          ? 'Start'
          : path.role === 'end'
            ? 'End'
            : path.name || 'Extra';

      const polyline = L.polyline(path.coords, {
        color: ROUTE_COLOR,
        weight: path.role === 'extra' ? 4 : 5,
        opacity: path.role === 'extra' ? 0.7 : 0.9,
        lineJoin: 'round',
        lineCap: 'round',
        dashArray: path.role === 'extra' ? '6 8' : null,
      })
        .bindPopup(
          `<strong>${routeCode}</strong> — ${label}<br/><span style="opacity:.85">${path.name || routeName || ''}</span>`,
          { closeButton: false }
        )
        .addTo(map);

      layersRef.current.push(polyline);
      routePolylines.push(polyline);
      path.coords.forEach((c) => allBounds.push(c));
    });

    if (startPath) {
      const startMarker = L.marker(startPath.coords[0], {
        icon: createStartMarkerIcon(ROUTE_COLOR),
      })
        .bindTooltip('Start (A)', { permanent: false, direction: 'top' })
        .addTo(map);
      markersRef.current.push(startMarker);
    }

    if (endPath) {
      const endCoords = endPath.coords[endPath.coords.length - 1];
      const endMarker = L.marker(endCoords, {
        icon: createEndMarkerIcon(ROUTE_COLOR),
      })
        .bindTooltip('End (B)', { permanent: false, direction: 'top' })
        .addTo(map);
      markersRef.current.push(endMarker);
    } else if (startPath) {
      // Single-path stub: mark last point as end with contrasting style
      const endMarker = L.marker(startPath.coords[startPath.coords.length - 1], {
        icon: createEndMarkerIcon(ROUTE_COLOR),
      })
        .bindTooltip('End (B)', { permanent: false, direction: 'top' })
        .addTo(map);
      markersRef.current.push(endMarker);
    }

    if (allBounds.length > 0) {
      map.fitBounds(L.latLngBounds(allBounds), {
        padding: [36, 36],
        maxZoom: 15,
        // Keep Leaflet's camera transition from cancelling the draw-in on route selection.
        animate: false,
      });
    }

    const activeAnimation = { frameIds: new Set(), pathStates: [] };
    routeAnimationRef.current = activeAnimation;

    const animatePolyline = (polyline, attempts = 0) => {
      const frameId = requestAnimationFrame(() => {
        activeAnimation.frameIds.delete(frameId);
        if (routeAnimationRef.current !== activeAnimation) return;

        // addTo() has fired by now; wait until Leaflet has also written its SVG path data.
        const pathElement = polyline.getElement?.() || polyline._path;
        if (!pathElement?.getAttribute('d')) {
          if (attempts < 2) animatePolyline(polyline, attempts + 1);
          return;
        }

        const drawState = savePathDrawState(pathElement);
        const pathState = { pathElement, drawState, animation: null };
        activeAnimation.pathStates.push(pathState);
        pathState.animation = animate(svg.createDrawable(pathElement), {
          draw: ['0 0', '0 1'],
          duration: 800,
          ease: 'outQuad',
          onComplete: () => {
            // Return control of the path attributes fully to Leaflet once it is drawn.
            if (routeAnimationRef.current === activeAnimation) {
              restorePathDrawState(pathElement, drawState);
            }
          },
        });
      });
      activeAnimation.frameIds.add(frameId);
    };

    routePolylines.forEach((polyline) => animatePolyline(polyline));

    // A Leaflet redraw can replace path geometry during a pan or zoom. Finish cleanly
    // instead of letting the one-shot animation continue against stale geometry.
    const handleMapViewChange = () => stopRouteAnimation();
    map.on('movestart zoomstart', handleMapViewChange);

    return () => {
      map.off('movestart zoomstart', handleMapViewChange);
      stopRouteAnimation();
    };
  }, [routeCode, routeName, paths, startPath, endPath]);

  return (
    <div className="glass-panel overflow-hidden rounded-3xl border border-line shadow-panel">
      <div className="flex items-center justify-between border-b border-line bg-solid/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-primary-ink" />
          <span className="text-xs font-bold uppercase tracking-wider text-soft">
            Interactive Route Map
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-hover hover:text-ink"
            title="Hide Map"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="relative h-[240px] w-full sm:h-[300px]">
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      <div className="flex flex-col gap-2 border-t border-line bg-inset px-4 py-2.5 text-xs text-soft sm:flex-row sm:items-center sm:justify-between">
        {selectedRoute ? (
          <>
            <div className="flex min-w-0 items-center gap-2">
              <span className="font-bold text-ink">{selectedRoute.code}</span>
              <span className="truncate text-muted">{selectedRoute.route}</span>
              {paths.length === 0 && (
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                  Coordinates coming soon
                </span>
              )}
            </div>
            {paths.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-dim">
                  Route markers
                </span>
                {startPath && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-chip px-2 py-1 font-medium">
                    <span
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-extrabold text-white shadow-sm"
                      style={{ backgroundColor: ROUTE_COLOR }}
                    >
                      A
                    </span>
                    <span className="text-soft">Start</span>
                  </span>
                )}
                {endLegendPath && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-chip px-2 py-1 font-medium">
                    <span
                      className="inline-flex h-4 w-4 items-center justify-center rounded-[3px] text-[9px] font-extrabold text-white shadow-sm"
                      style={{ backgroundColor: ROUTE_COLOR }}
                    >
                      B
                    </span>
                    <span className="text-soft">End</span>
                  </span>
                )}
                {paths
                  .filter((p) => p.role === 'extra')
                  .map((p, i) => (
                    <span
                      key={`${p.name}-${i}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-chip px-2 py-1"
                    >
                      <span
                        className="inline-block h-2 w-4 rounded-sm"
                        style={{ backgroundColor: ROUTE_COLOR }}
                      />
                      <span className="max-w-[100px] truncate text-muted">
                        {p.name || 'Extra'}
                      </span>
                    </span>
                  ))}
              </div>
            )}
          </>
        ) : (
          <span className="text-muted">Select any route below to preview its path</span>
        )}
      </div>
    </div>
  );
}
