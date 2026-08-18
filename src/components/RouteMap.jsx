import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Navigation } from 'lucide-react';
import { ROUTE_COORDS } from '../../data/route-coords.js';

const DEFAULT_CENTER = [10.2938, 123.895];
const DEFAULT_ZOOM = 12;

function createMarkerIcon(bg, border) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${bg};border:3px solid ${border};width:14px;height:14px;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
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

  const routeCode = selectedRoute?.code;
  const routeName = selectedRoute?.route;
  const routeEntry = routeCode ? ROUTE_COORDS[routeCode] : null;
  const paths = useMemo(() => getRoutePaths(routeEntry), [routeEntry]);
  const startPath = paths.find((p) => p.role === 'start') || paths[0];
  const endPath = paths.find((p) => p.role === 'end');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

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

    layersRef.current.forEach((layer) => map.removeLayer(layer));
    layersRef.current = [];
    markersRef.current.forEach((marker) => map.removeLayer(marker));
    markersRef.current = [];

    if (paths.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    const allBounds = [];

    paths.forEach((path) => {
      const color = path.color || '#ff4757';
      const label =
        path.role === 'start'
          ? 'Start'
          : path.role === 'end'
            ? 'End'
            : path.name || 'Extra';

      const polyline = L.polyline(path.coords, {
        color,
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
      path.coords.forEach((c) => allBounds.push(c));
    });

    if (startPath) {
      const startColor = startPath.color || '#2563eb';
      const startMarker = L.marker(startPath.coords[0], {
        icon: createMarkerIcon(startColor, '#ffffff'),
      })
        .bindTooltip('Start', { permanent: false, direction: 'top' })
        .addTo(map);
      markersRef.current.push(startMarker);
    }

    if (endPath) {
      const endColor = endPath.color || '#f59e0b';
      const endCoords = endPath.coords[endPath.coords.length - 1];
      const endMarker = L.marker(endCoords, {
        icon: createMarkerIcon(endColor, '#ffffff'),
      })
        .bindTooltip('End', { permanent: false, direction: 'top' })
        .addTo(map);
      markersRef.current.push(endMarker);
    } else if (startPath) {
      // Single-path stub: mark last point as end with contrasting style
      const color = startPath.color || '#ff4757';
      const endMarker = L.marker(startPath.coords[startPath.coords.length - 1], {
        icon: createMarkerIcon('#ffffff', color),
      })
        .bindTooltip('End', { permanent: false, direction: 'top' })
        .addTo(map);
      markersRef.current.push(endMarker);
    }

    if (allBounds.length > 0) {
      map.fitBounds(L.latLngBounds(allBounds), {
        padding: [36, 36],
        maxZoom: 15,
      });
    }
  }, [routeCode, routeName, paths, startPath, endPath]);

  return (
    <div className="glass-panel overflow-hidden rounded-3xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#14161f]/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-[#ff4757]" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Interactive Route Map
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            title="Hide Map"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="relative h-[240px] w-full sm:h-[300px]">
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      <div className="flex flex-col gap-2 border-t border-white/10 bg-[#12141c] px-4 py-2.5 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        {selectedRoute ? (
          <>
            <div className="flex min-w-0 items-center gap-2">
              <span className="font-bold text-white">{selectedRoute.code}</span>
              <span className="truncate text-slate-400">{selectedRoute.route}</span>
              {paths.length === 0 && (
                <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] text-yellow-400">
                  Coordinates coming soon
                </span>
              )}
            </div>
            {paths.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {startPath && (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-4 rounded-sm"
                      style={{ backgroundColor: startPath.color }}
                    />
                    <span className="text-slate-400">Start</span>
                  </span>
                )}
                {endPath && (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-4 rounded-sm"
                      style={{ backgroundColor: endPath.color }}
                    />
                    <span className="text-slate-400">End</span>
                  </span>
                )}
                {paths
                  .filter((p) => p.role === 'extra')
                  .map((p, i) => (
                    <span key={`${p.name}-${i}`} className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-4 rounded-sm"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="max-w-[100px] truncate text-slate-400">
                        {p.name || 'Extra'}
                      </span>
                    </span>
                  ))}
              </div>
            )}
          </>
        ) : (
          <span className="text-slate-400">Select any route below to preview its path</span>
        )}
      </div>
    </div>
  );
}
