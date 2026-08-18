import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

const DEFAULT_CENTER = [10.3157, 123.8854];
const DEFAULT_ZOOM = 13;

function createSpotIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="background:#ff4757;border:2px solid #ffffff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.5);cursor:pointer;">
      <svg style="width:12px;height:12px;stroke:#fff;fill:none;stroke-width:2.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

const SpotMap = forwardRef(function SpotMap({ spots }, ref) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useImperativeHandle(ref, () => ({
    flyToSpot(spot) {
      if (!mapInstanceRef.current || !spot?.coords) return;
      const map = mapInstanceRef.current;
      map.flyTo(spot.coords, 16, { duration: 1.2 });
      const targetMarker = markersRef.current.find(
        (m) =>
          m.getLatLng().lat === spot.coords[0] &&
          m.getLatLng().lng === spot.coords[1]
      );
      if (targetMarker) {
        targetMarker.openPopup();
      }
    },
  }));

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
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

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.invalidateSize();

    // Clear existing markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    const icon = createSpotIcon();

    spots.forEach((spot) => {
      if (!spot.coords) return;

      const marker = L.marker(spot.coords, { icon })
        .bindPopup(`
          <div style="min-width:180px;font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.4;">
            <div style="font-weight:700;font-size:13px;margin-bottom:2px;color:#ffffff;">${spot.name}</div>
            <div style="color:#94a3b8;font-size:11px;margin-bottom:6px;">${spot.address}</div>
            <div style="color:#cbd5e1;margin-bottom:6px;">${spot.description ? spot.description.slice(0, 85) + '…' : ''}</div>
            <div style="display:flex;gap:6px;font-size:10px;font-weight:600;">
              <span style="color:#ffbe0b;">${spot.hours || ''}</span>
              <span style="color:#10b981;">${spot.entrance || ''}</span>
            </div>
          </div>
        `, { maxWidth: 220 })
        .addTo(map);

      markersRef.current.push(marker);
    });

    if (spots.length > 1) {
      const validCoords = spots.filter((s) => s.coords).map((s) => s.coords);
      if (validCoords.length > 0) {
        map.fitBounds(L.latLngBounds(validCoords), { padding: [36, 36], maxZoom: 15 });
      }
    } else if (spots.length === 1 && spots[0].coords) {
      map.flyTo(spots[0].coords, 15);
    }
  }, [spots]);

  return (
    <div className="glass-panel overflow-hidden rounded-3xl border border-white/10 shadow-lg">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#14161f]/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#ff4757]" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Cebu Tourist Attractions Map
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Tap any pin to view details
        </span>
      </div>
      <div className="h-[220px] w-full sm:h-[280px]">
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>
    </div>
  );
});

export default SpotMap;
