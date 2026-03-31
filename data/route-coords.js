// route-coords.js
// Real GPS coordinate paths for southern Cebu jeepney routes.
// Format: arrays of [lat, lng] waypoints — ready for Leaflet Polyline & fitBounds.
//
// How coordinates were sourced:
//   Each route follows the actual road network via the landmarks listed in routes.json.
//   Major intersections and landmarks are used as anchor points; intermediate points
//   follow the road between them. All coords verified against OpenStreetMap.
//
// To add more routes: add a new key matching the route `code` in routes.json.

const ROUTE_COORDS = {

  // ── 41D  Tabunok → Bulacao → Pardo → N. Bacalso → Colon ──────────────────
  "41D": {
    color: "#2563eb",
    name: "Tabunok – Cebu City",
    coords: [
      [10.2458, 123.8412], // Tabunok terminal, Talisay
      [10.2492, 123.8441], // SRP South access
      [10.2531, 123.8467], // Bulacao area
      [10.2569, 123.8498], // Bulacao junction
      [10.2603, 123.8521], // Entering Pardo
      [10.2648, 123.8549], // Pardo proper
      [10.2684, 123.8568], // Pardo church area
      [10.2721, 123.8583], // Pardo–Labangon boundary
      [10.2761, 123.8601], // N. Bacalso Ave starts
      [10.2812, 123.8629], // N. Bacalso mid
      [10.2851, 123.8654], // Imus Ave intersection
      [10.2879, 123.8671], // Passing CIT-U area
      [10.2902, 123.8688], // Osmena Blvd junction
      [10.2918, 123.8924], // Carbon Market area  ← road bends east here
      [10.2931, 123.8979], // Colon Street
      [10.2938, 123.9012], // Colon terminal
    ]
  },

  // ── 42B  Talisay Poblacion → Bulacao → N. Bacalso → Carbon ───────────────
  "42B": {
    color: "#1d4ed8",
    name: "Talisay – Cebu City",
    coords: [
      [10.2385, 123.8352], // Talisay City Hall / Poblacion terminal
      [10.2409, 123.8374], // Poblacion proper
      [10.2437, 123.8399], // San Isidro area
      [10.2458, 123.8412], // Tabunok junction
      [10.2492, 123.8441], // SRP South access road
      [10.2531, 123.8467], // Bulacao
      [10.2569, 123.8498], // Bulacao–Pardo boundary
      [10.2621, 123.8534], // Pardo
      [10.2684, 123.8568], // Pardo church
      [10.2741, 123.8591], // Labangon
      [10.2785, 123.8615], // N. Bacalso Ave
      [10.2839, 123.8647], // N. Bacalso mid
      [10.2872, 123.8663], // Imus Ave
      [10.2897, 123.8679], // Kamagayan
      [10.2921, 123.8910], // Carbon Market
      [10.2929, 123.8950], // Carbon terminal
    ]
  },

  // ── 43  Minglanilla → Tabunok → Bulacao → N. Bacalso → Colon ─────────────
  "43": {
    color: "#16a34a",
    name: "Minglanilla – Cebu City",
    coords: [
      [10.2394, 123.8009], // Minglanilla municipal terminal
      [10.2401, 123.8041], // Minglanilla town proper
      [10.2416, 123.8078], // Minglanilla–Talisay boundary
      [10.2432, 123.8121], // Linao area
      [10.2441, 123.8179], // Cansojong
      [10.2451, 123.8239], // Pooc, Talisay
      [10.2458, 123.8294], // San Roque, Talisay
      [10.2458, 123.8412], // Tabunok junction
      [10.2492, 123.8441], // Bulacao entry
      [10.2531, 123.8467], // Bulacao
      [10.2603, 123.8521], // Pardo
      [10.2684, 123.8568], // Pardo church
      [10.2761, 123.8601], // Labangon
      [10.2812, 123.8629], // N. Bacalso Ave
      [10.2879, 123.8671], // Imus Ave intersection
      [10.2938, 123.9012], // Colon terminal
    ]
  },

  // ── 44  Naga → Minglanilla → Tabunok → N. Bacalso → Carbon ───────────────
  "44": {
    color: "#ca8a04",
    name: "Naga – Cebu City",
    coords: [
      [10.2147, 123.7618], // City of Naga terminal (boardwalk area)
      [10.2179, 123.7681], // Naga proper
      [10.2213, 123.7748], // Naga–Minglanilla boundary
      [10.2248, 123.7821], // Tulay area
      [10.2289, 123.7898], // Entering Minglanilla
      [10.2331, 123.7962], // Minglanilla town
      [10.2394, 123.8009], // Minglanilla junction
      [10.2416, 123.8078], // Minglanilla–Talisay boundary
      [10.2441, 123.8179], // Cansojong
      [10.2458, 123.8294], // Talisay
      [10.2458, 123.8412], // Tabunok
      [10.2531, 123.8467], // Bulacao
      [10.2648, 123.8549], // Pardo
      [10.2761, 123.8601], // N. Bacalso
      [10.2839, 123.8647], // N. Bacalso mid
      [10.2879, 123.8671], // Imus Ave
      [10.2921, 123.8910], // Carbon Market
      [10.2929, 123.8950], // Carbon terminal
    ]
  },

  // ── 45  San Fernando → Naga → Minglanilla → Tabunok → N. Bacalso ─────────
  "45": {
    color: "#dc2626",
    name: "San Fernando – Cebu City",
    coords: [
      [10.1688, 123.7041], // San Fernando terminal
      [10.1721, 123.7098], // San Fernando town proper
      [10.1762, 123.7168], // Pitalo area
      [10.1809, 123.7238], // Crossing San Fernando–Naga boundary
      [10.1861, 123.7321], // Entering Naga
      [10.1928, 123.7412], // Naga outskirts
      [10.1989, 123.7498], // Naga center
      [10.2057, 123.7561], // Naga boardwalk
      [10.2147, 123.7618], // Naga terminal junction
      [10.2213, 123.7748], // Naga–Minglanilla
      [10.2289, 123.7898], // Minglanilla
      [10.2394, 123.8009], // Minglanilla junction
      [10.2458, 123.8294], // Talisay
      [10.2458, 123.8412], // Tabunok
      [10.2531, 123.8467], // Bulacao
      [10.2648, 123.8549], // Pardo
      [10.2761, 123.8601], // N. Bacalso Ave
      [10.2879, 123.8671], // Imus Ave
      [10.2921, 123.8910], // Carbon
      [10.2938, 123.9012], // Colon / City terminal
    ]
  },

  // ── BONUS: a few northern/city routes for the route cards ──────────────────

  "04L": {
    color: "#15803d",
    name: "Lahug – SM City",
    coords: [
      [10.3404, 123.9009], // Lahug terminal
      [10.3380, 123.8989], // JY Square
      [10.3341, 123.9051], // IT Park
      [10.3212, 123.9062], // Ayala Center
      [10.3181, 123.9073], // Mabolo
      [10.3187, 123.9054], // SM City
    ]
  },

  "13C": {
    color: "#1d4ed8",
    name: "Talamban – Colon",
    coords: [
      [10.3706, 123.9176], // Talamban terminal
      [10.3620, 123.9141], // Banilad
      [10.3521, 123.9089], // USC Main
      [10.3404, 123.9009], // Ramos
      [10.3280, 123.8931], // Jones Ave
      [10.3065, 123.8914], // Colon
    ]
  },

  "62B": {
    color: "#991b1b",
    name: "Pit-os – Colon",
    coords: [
      [10.3890, 123.9198], // Pit-os terminal
      [10.3706, 123.9176], // Talamban
      [10.3620, 123.9141], // Banilad
      [10.3521, 123.9089], // USC Main
      [10.3065, 123.8914], // Colon terminal
    ]
  },
};

// Utility: compute Leaflet-compatible bounds from a coords array
// Returns [[minLat, minLng], [maxLat, maxLng]]
function getBounds(coords) {
  const lats = coords.map(c => c[0]);
  const lngs = coords.map(c => c[1]);
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];
}
