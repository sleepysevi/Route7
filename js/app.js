// app.js — Route7  (grid/list layout + customization-friendly)
// ─────────────────────────────────────────────────────────────────────────────

let routesData = [];
let dictData   = [];
let spotsData  = [];
let currentTab      = 'routes';
let activeGroup     = 'All';
let activeSpotCat   = 'All';
let routeLayout     = 'list';   // 'list' | 'grid'

// ── Leaflet state ─────────────────────────────────────────────────────────────
let map            = null;
let activePolyline = null;
let activeMarkers  = [];
let mapInitialised = false;

let spotMap            = null;
let spotMarkers        = [];
let spotMapInitialised = false;

const MAP_DEFAULT_CENTER = [10.2938, 123.8950];
const MAP_DEFAULT_ZOOM   = 12;

// ─────────────────────────────────────────────────────────────────────────────
// GROUP TAB CONFIG
// To add a new group: add an entry to GROUP_ORDER and GROUP_STYLE.
// pill  = active tab colors  (Tailwind classes)
// inactive = default tab colors
// ─────────────────────────────────────────────────────────────────────────────
const GROUP_ORDER = [
  'All','Cebu City','Mandaue','Mactan Island','North Cebu',
  'Talisay City','Minglanilla','City of Naga','San Fernando'
];
const GROUP_STYLE = {
  'All':           { pill:'bg-emerald-700 text-white', inactive:'bg-emerald-50 text-emerald-700' },
  'Cebu City':     { pill:'bg-red-600 text-white',     inactive:'bg-red-50 text-red-700' },
  'Mandaue':       { pill:'bg-blue-700 text-white',    inactive:'bg-blue-50 text-blue-700' },
  'Mactan Island': { pill:'bg-zinc-600 text-white',    inactive:'bg-zinc-100 text-zinc-700' },
  'North Cebu':    { pill:'bg-sky-700 text-white',     inactive:'bg-sky-50 text-sky-700' },
  'Talisay City':  { pill:'bg-blue-800 text-white',    inactive:'bg-blue-50 text-blue-800' },
  'Minglanilla':   { pill:'bg-green-700 text-white',   inactive:'bg-green-50 text-green-700' },
  'City of Naga':  { pill:'bg-yellow-600 text-white',  inactive:'bg-yellow-50 text-yellow-700' },
  'San Fernando':  { pill:'bg-red-700 text-white',     inactive:'bg-red-50 text-red-800' },
};

// ─────────────────────────────────────────────────────────────────────────────
// SPOT CATEGORY CONFIG
// To add a category: add it to SPOT_CATEGORIES, add its colors to SPOT_CAT_COLORS,
// and add spots with that category in spots.json
// ─────────────────────────────────────────────────────────────────────────────
const SPOT_CATEGORIES = ['All','Historical','Nature','Landmark','Culture','Shopping','Urban','Education','Cultural'];
const SPOT_CAT_COLORS = {
  'Historical': 'bg-amber-100 text-amber-800',
  'Nature':     'bg-green-100 text-green-800',
  'Landmark':   'bg-purple-100 text-purple-800',
  'Culture':    'bg-pink-100 text-pink-800',
  'Shopping':   'bg-blue-100 text-blue-800',
  'Urban':      'bg-gray-100 text-gray-700',
  'Education':  'bg-indigo-100 text-indigo-800',
  'Cultural':   'bg-rose-100 text-rose-800',
};

// ─────────────────────────────────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  lucide.createIcons();
  await loadData();
  setupSearch();
});

async function loadData() {
  try {
    // Use inline globals from data-bundle.js — works without Live Server
    if (typeof ROUTES_DATA !== 'undefined') {
      routesData = ROUTES_DATA;
      dictData   = DICT_DATA;
      spotsData  = SPOTS_DATA;
    } else {
      // Fallback: fetch JSON (requires Live Server)
      const responses = await Promise.all([
        fetch('./data/routes.json'),
        fetch('./data/dictionary.json'),
        fetch('./data/spots.json'),
      ]);
      for (const res of responses) {
        if (!res.ok) throw new Error(`Could not load ${res.url}`);
      }
      [routesData, dictData, spotsData] = await Promise.all(responses.map(r => r.json()));
    }

    console.log(`Routes: ${routesData.length}, Phrases: ${dictData.length}, Spots: ${spotsData.length}`);
    renderGroupTabs(routesData);
    renderRoutes(routesData);
    renderDict(dictData);
    renderSpotCatTabs();
    renderSpots(spotsData);
    lucide.createIcons();

  } catch (err) {
    console.error('Data Load Error:', err);
    document.getElementById('routes-container').innerHTML =
      `<div class="text-center py-10 text-red-400 text-sm">
        <p class="font-bold">Could not load route data</p>
        <p class="mt-2 opacity-80">${err.message}</p>
        <p class="mt-3 text-xs bg-red-50 rounded-lg p-3 text-red-500">
          Make sure data-bundle.js is in /data/ and loaded in index.html
        </p>
      </div>`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout toggle  (list ↔ grid)
// ─────────────────────────────────────────────────────────────────────────────
function setRouteLayout(mode) {
  routeLayout = mode;

  // Update toggle button styles
  const listBtn = document.getElementById('btn-list-view');
  const gridBtn = document.getElementById('btn-grid-view');
  if (listBtn && gridBtn) {
    const active   = 'bg-white shadow-sm text-red-600 rounded-md';
    const inactive = 'text-gray-400 rounded-md';
    listBtn.className = `p-1.5 transition-all ${mode==='list' ? active : inactive}`;
    gridBtn.className = `p-1.5 transition-all ${mode==='grid' ? active : inactive}`;
  }

  // Re-render with current filters
  const q = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
  renderRoutes(applyFilters(routesData, q));
}

// ─────────────────────────────────────────────────────────────────────────────
// Route map helpers
// ─────────────────────────────────────────────────────────────────────────────
function initMap() {
  if (mapInitialised) return;
  mapInitialised = true;
  map = L.map('map-container', { center: MAP_DEFAULT_CENTER, zoom: MAP_DEFAULT_ZOOM });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);
}

function showRouteOnMap(code, name) {
  initMap();
  const panel = document.getElementById('map-panel');
  if (panel) {
    panel.classList.remove('hidden');
    setTimeout(() => map.invalidateSize(), 50);
  }
  clearMapOverlays();

  const coordsMap = (typeof ROUTE_COORDS !== 'undefined') ? ROUTE_COORDS : {};
  const routePath = coordsMap[code];
  const cap = document.getElementById('map-caption');

  if (!routePath) {
    if (cap) { cap.textContent = `${code} — route path coming soon`; cap.style.borderLeftColor = '#9ca3af'; }
    map.setView(MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM);
    return;
  }
  const { coords, color } = routePath;

  activePolyline = L.polyline(coords, { color, weight:5, opacity:0.85, lineJoin:'round', lineCap:'round' })
    .bindPopup(`<b>${code}</b> — ${name}`, { closeButton:false })
    .addTo(map);

  const mkIcon = (bg, border) => L.divIcon({
    className:'',
    html:`<div style="background:${bg};border:3px solid ${border};width:14px;height:14px;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
    iconSize:[14,14], iconAnchor:[7,7],
  });
  activeMarkers = [
    L.marker(coords[0],               { icon: mkIcon(color,'white') }).bindTooltip('Start',{direction:'top'}).addTo(map),
    L.marker(coords[coords.length-1], { icon: mkIcon('#fff',color)  }).bindTooltip('End',  {direction:'top'}).addTo(map),
  ];
  map.fitBounds(L.latLngBounds(coords), { padding:[32,32], maxZoom:15 });

  if (cap) { cap.textContent = `${code} — ${name}`; cap.style.borderLeftColor = color; }
}

function clearMapOverlays() {
  if (activePolyline) { map.removeLayer(activePolyline); activePolyline = null; }
  activeMarkers.forEach(m => map.removeLayer(m));
  activeMarkers = [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Spots map helpers
// ─────────────────────────────────────────────────────────────────────────────
function initSpotMap() {
  if (spotMapInitialised) return;
  spotMapInitialised = true;
  spotMap = L.map('spot-map-container', { center: [10.3157, 123.8854], zoom: 13 });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(spotMap);
}

function renderSpotMarkers(spots) {
  if (!spotMapInitialised) return;
  spotMarkers.forEach(m => spotMap.removeLayer(m));
  spotMarkers = [];
  spots.forEach(spot => {
    const icon = L.divIcon({
      className:'',
      html:`<div style="background:#DC2626;border:2px solid white;width:28px;height:28px;border-radius:50%;
              display:flex;align-items:center;justify-content:center;font-size:14px;
              box-shadow:0 2px 8px rgba(0,0,0,0.35);cursor:pointer;">${spot.emoji}</div>`,
      iconSize:[28,28], iconAnchor:[14,14],
    });
    const stars = '★'.repeat(Math.round(spot.rating)) + '☆'.repeat(5-Math.round(spot.rating));
    const marker = L.marker(spot.coords, { icon })
      .bindPopup(`
        <div style="min-width:180px;font-family:sans-serif">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px">${spot.emoji} ${spot.name}</div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:6px">${spot.address}</div>
          <div style="font-size:12px;color:#F59E0B;margin-bottom:4px">${stars} ${spot.rating}</div>
          <div style="font-size:11px;color:#374151">${spot.description.slice(0,80)}…</div>
          <div style="margin-top:6px;font-size:11px;color:#DC2626;font-weight:600">🕐 ${spot.hours}</div>
          <div style="font-size:11px;color:#059669;font-weight:600">🎫 ${spot.entrance}</div>
        </div>
      `, { maxWidth:220 })
      .addTo(spotMap);
    spotMarkers.push(marker);
  });
  if (spots.length > 1) {
    spotMap.fitBounds(L.latLngBounds(spots.map(s=>s.coords)), { padding:[32,32], maxZoom:15 });
  } else if (spots.length === 1) {
    spotMap.flyTo(spots[0].coords, 15);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Group tabs
// ─────────────────────────────────────────────────────────────────────────────
function renderGroupTabs(data) {
  const bar = document.getElementById('group-tab-bar');
  if (!bar) return;
  const present = ['All', ...new Set(data.map(r=>r.group).filter(Boolean))];
  const ordered = GROUP_ORDER.filter(g => present.includes(g));
  bar.innerHTML = ordered.map(g => {
    const count = g==='All' ? routesData.length : routesData.filter(r=>r.group===g).length;
    const style = GROUP_STYLE[g] || GROUP_STYLE['All'];
    const cls   = g===activeGroup ? style.pill : style.inactive;
    return `<button onclick="setGroup('${g}')"
      class="group-tab flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${cls}"
      data-group="${g}">${g} <span class="opacity-60">${count}</span></button>`;
  }).join('');
}

function setGroup(group) {
  activeGroup = group;
  const q = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
  renderGroupTabs(routesData);
  updateTabStyles();
  renderRoutes(applyFilters(routesData, q));
}

function updateTabStyles() {
  document.querySelectorAll('.group-tab').forEach(btn => {
    const g = btn.getAttribute('data-group');
    const style = GROUP_STYLE[g] || GROUP_STYLE['All'];
    btn.className = btn.className.replace(/bg-\S+|text-\S+/g,'').trim();
    (g===activeGroup ? style.pill : style.inactive).split(' ').forEach(c=>btn.classList.add(c));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter helpers
// ─────────────────────────────────────────────────────────────────────────────
function matchKeywords(kw, q) { return String(kw).toLowerCase().includes(q); }

function applyFilters(data, query) {
  let r = data;
  if (activeGroup !== 'All') r = r.filter(x=>x.group===activeGroup);
  if (query) r = r.filter(x =>
    matchKeywords(x.keywords, query) ||
    x.route.toLowerCase().includes(query) ||
    x.via.toLowerCase().includes(query) ||
    x.code.toLowerCase().includes(query) ||
    (x.stops||[]).some(s=>s.toLowerCase().includes(query))
  );
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
// Render Routes  — supports list and grid layout
// ─────────────────────────────────────────────────────────────────────────────
function renderRoutes(data) {
  const container = document.getElementById('routes-container');
  const countLabel = document.getElementById('routes-count-label');
  const headerBadge = document.getElementById('header-badge');
  const headerCount = document.getElementById('header-count');

  if (countLabel) countLabel.textContent = `${data.length} route${data.length!==1?'s':''} found`;
  if (headerBadge) headerBadge.classList.toggle('hidden', false);
  if (headerCount) headerCount.textContent = data.length;

  if (!container) return;

  if (!data || data.length === 0) {
    container.innerHTML = `<div class="text-center py-12 text-gray-400 text-sm">No routes found. Try a different search or group.</div>`;
    return;
  }

  const hasMap = code => !!(typeof ROUTE_COORDS !== 'undefined' && ROUTE_COORDS[code]);

  if (routeLayout === 'grid') {
    // ── GRID LAYOUT (2 columns) ──────────────────────────────────
    container.className = 'routes-grid';
    container.innerHTML = data.map(item => {
      const stopCount = (item.stops||[]).length;
      return `
      <div class="route-card" data-code="${item.code}"
        onclick="handleRouteClick('${item.code}','${escapeAttr(item.route)}')">

        <!-- Code badge + map icon -->
        <div class="route-card-head">
          <div class="flex items-center justify-between">
            <span class="route-code-badge ${item.color}">${item.code}</span>
            ${hasMap(item.code) ? `<svg class="map-icon w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
            </svg>` : ''}
          </div>
          <p class="route-name">${item.route}</p>
        </div>

        <p class="route-via">${item.via}</p>

        <!-- Footer -->
        <div class="route-card-foot">
          ${stopCount ? `<button class="stops-btn"
            onclick="event.stopPropagation();toggleStops('${item.code}')">
            <svg class="w-2.5 h-2.5 stops-chevron-${item.code} transition-transform" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
            ${stopCount} stops
          </button>` : '<span></span>'}
        </div>

        <!-- Stops panel -->
        ${stopCount ? `<div id="stops-${item.code}" class="stops-panel hidden">
          <p class="stops-panel-label">Route path · ${stopCount} stops</p>
          ${buildStopsTimeline(item.stops)}
        </div>` : ''}
      </div>`;
    }).join('');

  } else {
    // ── LIST LAYOUT (full width) ─────────────────────────────────
    container.className = 'space-y-2';
    container.innerHTML = data.map(item => {
      const stopCount = (item.stops||[]).length;
      return `
      <div class="route-card" data-code="${item.code}"
        onclick="handleRouteClick('${item.code}','${escapeAttr(item.route)}')">

        <div class="flex items-center gap-3 px-3 py-2.5">
          <span class="route-code-badge ${item.color} text-xs">${item.code}</span>

          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm text-gray-800 leading-tight">${item.route}</p>
            <p class="text-xs text-gray-400 truncate mt-0.5">via ${item.via}</p>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            ${hasMap(item.code) ? `<svg class="map-icon w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
            </svg>` : ''}
            ${stopCount ? `<button class="stops-btn"
              onclick="event.stopPropagation();toggleStops('${item.code}')">
              <svg class="w-2.5 h-2.5 stops-chevron-${item.code} transition-transform" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
              ${stopCount} stops
            </button>` : ''}
          </div>
        </div>

        <!-- Stops panel -->
        ${stopCount ? `<div id="stops-${item.code}" class="stops-panel hidden">
          <p class="stops-panel-label">Route path · ${stopCount} stops</p>
          ${buildStopsTimeline(item.stops)}
        </div>` : ''}
      </div>`;
    }).join('');
  }

  lucide.createIcons();
}

/** Build the vertical stop timeline HTML */
function buildStopsTimeline(stops) {
  return stops.map((stop, i) => {
    const isFirst = i === 0;
    const isLast  = i === stops.length - 1;
    const dot     = isFirst ? '#16a34a' : isLast ? '#DC2626' : '#d1d5db';
    const size    = (isFirst || isLast) ? '10px' : '7px';
    const label   = isFirst ? 'START' : isLast ? 'END' : null;
    return `<div class="flex items-stretch gap-2" style="min-height:22px">
      <div class="flex flex-col items-center flex-shrink-0 w-2.5">
        <div style="width:${size};height:${size};border-radius:50%;background:${dot};flex-shrink:0;margin-top:5px"></div>
        ${!isLast ? '<div style="width:2px;flex:1;background:#e5e7eb;margin-top:2px"></div>' : ''}
      </div>
      <div class="pb-1 flex items-center gap-1.5 flex-1">
        <span class="text-xs text-gray-700 leading-snug ${isFirst||isLast?'font-semibold':''}">${stop}</span>
        ${label ? `<span style="font-size:8px;padding:1px 5px;border-radius:10px;background:${dot};color:white;font-weight:800;flex-shrink:0">${label}</span>` : ''}
      </div>
    </div>`;
  }).join('');
}

function toggleStops(code) {
  const panel = document.getElementById(`stops-${code}`);
  if (!panel) return;
  const open = !panel.classList.contains('hidden');
  panel.classList.toggle('hidden', open);
  // Rotate the chevron
  document.querySelectorAll(`.stops-chevron-${code}`).forEach(el => {
    el.style.transform = open ? '' : 'rotate(180deg)';
  });
}

function handleRouteClick(code, name) {
  // Highlight active card
  document.querySelectorAll('.route-card').forEach(c => c.classList.remove('active-card'));
  document.querySelector(`.route-card[data-code="${code}"]`)?.classList.add('active-card');
  // Show map
  showRouteOnMap(code, name);
  setTimeout(() => document.getElementById('map-panel')?.scrollIntoView({ behavior:'smooth', block:'start' }), 80);
}

function escapeAttr(str) { return str.replace(/'/g,"\\'").replace(/"/g,'&quot;'); }

// ─────────────────────────────────────────────────────────────────────────────
// Render Dictionary  (with copy-on-tap)
// ─────────────────────────────────────────────────────────────────────────────
function renderDict(data) {
  const c = document.getElementById('dict-container');
  if (!c) return;
  if (!data || data.length === 0) {
    c.innerHTML = `<div class="text-center py-10 text-gray-400 text-sm">No phrases found.</div>`;
    return;
  }
  c.innerHTML = data.map(item => `
    <div class="bg-white rounded-xl border-l-4 border-red-500 shadow-sm px-4 py-3
                hover:shadow-md transition-all duration-150 cursor-pointer select-none"
      onclick="copyPhrase('${escapeAttr(item.phrase)}', this)">
      <p class="font-bold text-red-600 text-sm">"${item.phrase}"</p>
      <p class="text-sm text-gray-600 mt-0.5">${item.meaning}</p>
      <p class="text-xs text-gray-300 mt-1.5">Tap to copy</p>
    </div>
  `).join('');
}

function copyPhrase(phrase, el) {
  navigator.clipboard?.writeText(phrase).catch(()=>{});
  const hint = el.querySelector('.text-gray-300');
  if (hint) {
    hint.textContent = '✓ Copied!';
    hint.classList.replace('text-gray-300','text-green-500');
    setTimeout(() => { hint.textContent = 'Tap to copy'; hint.classList.replace('text-green-500','text-gray-300'); }, 1800);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Spot category tabs
// ─────────────────────────────────────────────────────────────────────────────
function renderSpotCatTabs() {
  const bar = document.getElementById('spot-cat-bar');
  if (!bar) return;
  bar.innerHTML = SPOT_CATEGORIES.map(cat => {
    const count = cat==='All' ? spotsData.length : spotsData.filter(s=>s.category===cat).length;
    if (cat!=='All' && count===0) return '';
    const active = cat===activeSpotCat;
    return `<button onclick="setSpotCat('${cat}')"
      class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
             ${active ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
      ${cat} <span class="opacity-60">${count}</span>
    </button>`;
  }).join('');
}

function setSpotCat(cat) {
  activeSpotCat = cat;
  renderSpotCatTabs();
  const q = document.getElementById('spot-search')?.value.toLowerCase().trim() || '';
  const filtered = filterSpots(spotsData, cat, q);
  renderSpots(filtered);
  renderSpotMarkers(filtered);
}

function filterSpots(data, cat, q) {
  let r = data;
  if (cat !== 'All') r = r.filter(s=>s.category===cat);
  if (q) r = r.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.address.toLowerCase().includes(q) ||
    matchKeywords(s.keywords, q)
  );
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
// Render Spots
// ─────────────────────────────────────────────────────────────────────────────
function renderSpots(data) {
  const c = document.getElementById('spots-container');
  if (!c) return;
  if (!data || data.length === 0) {
    c.innerHTML = `<div class="text-center py-12 text-gray-400 text-sm">No spots found.</div>`;
    return;
  }
  c.innerHTML = data.map(spot => {
    const catCls = SPOT_CAT_COLORS[spot.category] || 'bg-gray-100 text-gray-700';
    const stars  = Array.from({length:5},(_,i)=>
      i < Math.round(spot.rating)
        ? `<span style="color:#F59E0B">★</span>`
        : `<span style="color:#d1d5db">★</span>`).join('');
    const jeepBadges = spot.jeepney.map(j=>
      `<span class="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">${j}</span>`
    ).join('');

    return `
    <div class="spot-card bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="flex gap-3 p-3">
        <div class="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0 border border-gray-100">
          ${spot.emoji}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <p class="font-bold text-gray-800 text-sm leading-tight">${spot.name}</p>
            <span class="${catCls} text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">${spot.category}</span>
          </div>
          <div class="flex items-center gap-1 mt-0.5">
            <div class="flex text-xs">${stars}</div>
            <span class="text-xs text-gray-400 font-semibold">${spot.rating}</span>
          </div>
          <p class="text-xs text-gray-400 mt-0.5 truncate">📍 ${spot.address}</p>
        </div>
      </div>
      <div class="px-3 pb-2">
        <p class="text-xs text-gray-600 leading-relaxed">${spot.description}</p>
      </div>
      <div class="px-3 pb-3 flex flex-wrap gap-1.5">
        <span class="text-[10px] bg-gray-50 text-gray-600 px-2 py-1 rounded-full border border-gray-100">🕐 ${spot.hours}</span>
        <span class="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100 font-semibold">🎫 ${spot.entrance}</span>
      </div>
      <div class="border-t border-gray-50 px-3 py-2.5 bg-red-50">
        <p class="text-[10px] font-bold text-red-600 tracking-widest uppercase mb-1.5">🚌 Jeepney Access</p>
        <div class="flex flex-wrap gap-1 mb-1.5">${jeepBadges}</div>
        <p class="text-xs text-gray-600 leading-snug">${spot.jeepney_tip}</p>
      </div>
      <div class="px-3 py-2 border-t border-gray-50">
        <button onclick="focusSpotOnMap(${spot.id})"
          class="w-full text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-lg py-1.5
                 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          View on map
        </button>
      </div>
    </div>`;
  }).join('');
}

function focusSpotOnMap(spotId) {
  const spot = spotsData.find(s=>s.id===spotId);
  if (!spot) return;
  if (!spotMapInitialised) { initSpotMap(); renderSpotMarkers(spotsData); }
  spotMap.flyTo(spot.coords, 16, { duration:1 });
  spotMarkers.forEach(m => {
    if (m.getLatLng().lat===spot.coords[0] && m.getLatLng().lng===spot.coords[1]) m.openPopup();
  });
  document.getElementById('spot-map-container')?.scrollIntoView({ behavior:'smooth', block:'start' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab switching
// ─────────────────────────────────────────────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;
  ['routes','dict','spots'].forEach(t => {
    document.getElementById(`${t}-section`)?.classList.toggle('hidden', t!==tab);
  });
  Object.entries({ routes:'btn-routes', dict:'btn-dict', spots:'btn-spots' }).forEach(([t,id]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.toggle('text-red-600',  t===tab);
    btn.classList.toggle('font-semibold', t===tab);
    btn.classList.toggle('text-gray-400', t!==tab);
  });

  if (tab==='spots' && !spotMapInitialised) {
    setTimeout(() => { initSpotMap(); renderSpotMarkers(spotsData); }, 100);
  }

  // Reset search inputs
  ['searchInput','dictSearchInput','spot-search'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  activeGroup = 'All';
  renderGroupTabs(routesData);
  updateTabStyles();
  renderRoutes(routesData);
}

// ─────────────────────────────────────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────────────────────────────────────
function setupSearch() {
  document.getElementById('searchInput')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = applyFilters(routesData, q);
    renderGroupTabs(routesData);
    updateTabStyles();
    renderRoutes(filtered);
  });

  document.getElementById('dictSearchInput')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = q ? dictData.filter(d =>
      matchKeywords(d.keywords,q) || d.phrase.toLowerCase().includes(q) || d.meaning.toLowerCase().includes(q)
    ) : dictData;
    renderDict(filtered);
  });

  document.getElementById('spot-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = filterSpots(spotsData, activeSpotCat, q);
    renderSpots(filtered);
    if (spotMapInitialised) renderSpotMarkers(filtered);
  });
}
