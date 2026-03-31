// app.js — Route7  (with Leaflet map integration)
// ─────────────────────────────────────────────────────────────────────────────
// Dependencies loaded in index.html:
//   • Leaflet CSS + JS  (CDN)
//   • /data/route-coords.js  → exposes ROUTE_COORDS and getBounds()
// ─────────────────────────────────────────────────────────────────────────────

let routesData = [];
let dictData   = [];
let currentTab      = 'routes';
let activeGroup     = 'All';

// ── Leaflet map state ─────────────────────────────────────────────────────────
let map              = null;   // the Leaflet map instance
let activePolyline   = null;   // the currently displayed route line
let activeMarkers    = [];     // start / end markers
let mapInitialised   = false;

const MAP_DEFAULT_CENTER = [10.2938, 123.8950]; // Carbon, Cebu
const MAP_DEFAULT_ZOOM   = 12;

// ── Route group styling ───────────────────────────────────────────────────────
const GROUP_ORDER = ['All', 'Cebu City', 'Mandaue', 'Mactan Island', 'North Cebu',
                     'Talisay City', 'Minglanilla', 'City of Naga', 'San Fernando'];

const GROUP_STYLE = {
  'All':           { pill: 'bg-emerald-700 text-white',  inactive: 'bg-emerald-50 text-emerald-700' },
  'Cebu City':     { pill: 'bg-red-600 text-white',      inactive: 'bg-red-50 text-red-700' },
  'Mandaue':       { pill: 'bg-blue-700 text-white',     inactive: 'bg-blue-50 text-blue-700' },
  'Mactan Island': { pill: 'bg-zinc-600 text-white',     inactive: 'bg-zinc-100 text-zinc-700' },
  'North Cebu':    { pill: 'bg-sky-700 text-white',      inactive: 'bg-sky-50 text-sky-700' },
  'Talisay City':  { pill: 'bg-blue-800 text-white',     inactive: 'bg-blue-50 text-blue-800' },
  'Minglanilla':   { pill: 'bg-green-700 text-white',    inactive: 'bg-green-50 text-green-700' },
  'City of Naga':  { pill: 'bg-yellow-600 text-white',   inactive: 'bg-yellow-50 text-yellow-700' },
  'San Fernando':  { pill: 'bg-red-700 text-white',      inactive: 'bg-red-50 text-red-800' },
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
    const [routesRes, dictRes] = await Promise.all([
      fetch('./data/routes.json'),
      fetch('./data/dictionary.json'),
    ]);
    routesData = await routesRes.json();
    dictData   = await dictRes.json();
    renderGroupTabs(routesData);
    renderRoutes(routesData);
    renderDict(dictData);
  } catch (error) {
    console.error('Error loading JSON. Run with Live Server.', error);
    const container = document.getElementById('routes-container');
    if (container) container.innerHTML = `
      <div class="text-center py-10 text-red-400 text-sm">
        Could not load data. Please use Live Server.
      </div>`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Leaflet map helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialise the Leaflet map inside #map-container.
 * Called lazily the first time a user taps a route card.
 */
function initMap() {
  if (mapInitialised) return;
  mapInitialised = true;

  map = L.map('map-container', {
    center: MAP_DEFAULT_CENTER,
    zoom:   MAP_DEFAULT_ZOOM,
    zoomControl: true,
    attributionControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);
}

/**
 * Draw a polyline for the given route code and fitBounds to it.
 * @param {string} code  – e.g. "41D"
 * @param {string} name  – display name shown on the popup
 */
function showRouteOnMap(code, name, colorClass) {
  // Ensure map exists
  initMap();

  // Reveal the map panel (it starts hidden)
  const mapPanel = document.getElementById('map-panel');
  if (mapPanel) {
    mapPanel.classList.remove('hidden');
    // Force Leaflet to recalculate size after CSS display change
    setTimeout(() => map.invalidateSize(), 50);
  }

  // Remove previous polyline + markers
  clearMapOverlays();

  // Look up coordinates
  const routeData = ROUTE_COORDS[code];
  if (!routeData) {
    showMapPlaceholder(code, name);
    return;
  }

  const { coords, color } = routeData;

  // ── Draw polyline ──────────────────────────────────────────
  activePolyline = L.polyline(coords, {
    color,
    weight:    5,
    opacity:   0.85,
    lineJoin:  'round',
    lineCap:   'round',
  }).addTo(map);

  // Popup on click
  activePolyline.bindPopup(
    `<b>${code}</b> — ${name}`,
    { closeButton: false }
  );

  // ── Start marker (green) ───────────────────────────────────
  const startIcon = L.divIcon({
    className: '',
    html: `<div style="
      background:${color};border:3px solid white;
      width:14px;height:14px;border-radius:50%;
      box-shadow:0 2px 6px rgba(0,0,0,0.4)">
    </div>`,
    iconSize:   [14, 14],
    iconAnchor: [7, 7],
  });

  // ── End marker (larger) ────────────────────────────────────
  const endIcon = L.divIcon({
    className: '',
    html: `<div style="
      background:#fff;border:3px solid ${color};
      width:14px;height:14px;border-radius:50%;
      box-shadow:0 2px 6px rgba(0,0,0,0.4)">
    </div>`,
    iconSize:   [14, 14],
    iconAnchor: [7, 7],
  });

  const startMarker = L.marker(coords[0],               { icon: startIcon })
    .bindTooltip('Start', { permanent: false, direction: 'top' })
    .addTo(map);

  const endMarker   = L.marker(coords[coords.length - 1], { icon: endIcon })
    .bindTooltip('End',   { permanent: false, direction: 'top' })
    .addTo(map);

  activeMarkers = [startMarker, endMarker];

  // ── fitBounds with padding ─────────────────────────────────
  const bounds = getBounds(coords);   // from route-coords.js
  map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });

  // Update the map caption
  const mapCaption = document.getElementById('map-caption');
  if (mapCaption) {
    mapCaption.textContent = `${code} — ${name}`;
    mapCaption.style.borderLeftColor = color;
  }
}

/** Remove the active polyline and all markers from the map. */
function clearMapOverlays() {
  if (activePolyline) { map.removeLayer(activePolyline); activePolyline = null; }
  activeMarkers.forEach(m => map.removeLayer(m));
  activeMarkers = [];
}

/** Show a "no coordinates yet" notice inside the map area. */
function showMapPlaceholder(code, name) {
  const mapCaption = document.getElementById('map-caption');
  if (mapCaption) {
    mapCaption.textContent = `${code} — route path coming soon`;
    mapCaption.style.borderLeftColor = '#9ca3af';
  }
  // Reset map view
  map.setView(MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM);
}

// ─────────────────────────────────────────────────────────────────────────────
// Group Tab Bar
// ─────────────────────────────────────────────────────────────────────────────

function renderGroupTabs(data) {
  const bar = document.getElementById('group-tab-bar');
  if (!bar) return;

  const presentGroups = ['All', ...new Set(data.map(r => r.group).filter(Boolean))];
  const orderedGroups = GROUP_ORDER.filter(g => presentGroups.includes(g));

  bar.innerHTML = orderedGroups.map(g => {
    const count  = g === 'All' ? routesData.length : routesData.filter(r => r.group === g).length;
    const style  = GROUP_STYLE[g] || GROUP_STYLE['All'];
    const active = g === activeGroup;
    const cls    = active ? style.pill : style.inactive;
    return `
      <button
        onclick="setGroup('${g}')"
        class="group-tab flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${cls}"
        data-group="${g}">
        ${g} <span class="opacity-70">${count}</span>
      </button>`;
  }).join('');
}

function setGroup(group) {
  activeGroup = group;
  const query    = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
  const filtered = applyFilters(routesData, query);
  renderGroupTabs(routesData);
  updateTabStyles();
  renderRoutes(filtered);
}

function updateTabStyles() {
  document.querySelectorAll('.group-tab').forEach(btn => {
    const g     = btn.getAttribute('data-group');
    const style = GROUP_STYLE[g] || GROUP_STYLE['All'];
    const active = g === activeGroup;
    // Strip old colour classes then re-add
    btn.className = btn.className.replace(/bg-\S+|text-\S+/g, '').trim();
    (active ? style.pill : style.inactive).split(' ').forEach(c => btn.classList.add(c));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter helpers
// ─────────────────────────────────────────────────────────────────────────────

function matchKeywords(keywords, query) {
  return String(keywords).toLowerCase().includes(query);
}

function applyFilters(data, query) {
  let result = data;
  if (activeGroup !== 'All') {
    result = result.filter(r => r.group === activeGroup);
  }
  if (query) {
    result = result.filter(r =>
      matchKeywords(r.keywords, query) ||
      r.route.toLowerCase().includes(query) ||
      r.via.toLowerCase().includes(query)   ||
      r.code.toLowerCase().includes(query)  ||
      (r.group || '').toLowerCase().includes(query)
    );
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Render Routes
// ─────────────────────────────────────────────────────────────────────────────

function renderRoutes(data) {
  const container = document.getElementById('routes-container');
  if (!container) return;

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-400 text-sm">
        No routes found. Try a different search.
      </div>`;
    return;
  }

  // Does this route have map data?
  const hasMap = code => !!ROUTE_COORDS[code];

  container.innerHTML = data.map(item => `
    <div
      class="route-card bg-white rounded-xl border border-gray-100 flex items-center gap-3 p-3 shadow-sm
             hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer"
      onclick="handleRouteClick('${item.code}', '${escapeAttr(item.route)}', '${item.color}')"
      data-code="${item.code}"
    >
      <span class="${item.color} text-white text-xs font-bold px-2 py-1 rounded-lg
                   flex-shrink-0 min-w-[48px] text-center leading-tight">
        ${item.code}
      </span>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-gray-800 text-sm leading-tight">${item.route}</p>
        <p class="text-xs text-gray-400 truncate mt-0.5">via ${item.via}</p>
      </div>
      ${hasMap(item.code)
        ? `<span title="Map available" class="flex-shrink-0">
             <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-green-500" fill="none"
               viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
               <path stroke-linecap="round" stroke-linejoin="round"
                 d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
             </svg>
           </span>`
        : `<i data-lucide="chevron-right" class="text-gray-300 w-4 h-4 flex-shrink-0"></i>`
      }
    </div>
  `).join('');

  lucide.createIcons();
}

/** Called when a route card is tapped */
function handleRouteClick(code, name, colorClass) {
  // Highlight the tapped card
  document.querySelectorAll('.route-card').forEach(card => {
    card.classList.remove('ring-2', 'ring-red-400', 'border-red-200');
  });
  const tapped = document.querySelector(`.route-card[data-code="${code}"]`);
  if (tapped) tapped.classList.add('ring-2', 'ring-red-400', 'border-red-200');

  // Show map with the route
  showRouteOnMap(code, name, colorClass);

  // Scroll the map into view smoothly
  setTimeout(() => {
    document.getElementById('map-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}

/** Escape single-quotes in HTML attributes */
function escapeAttr(str) {
  return str.replace(/'/g, "\\'");
}

// ─────────────────────────────────────────────────────────────────────────────
// Render Dictionary
// ─────────────────────────────────────────────────────────────────────────────

function renderDict(data) {
  const container = document.getElementById('dict-container');
  if (!container) return;

  if (!data || data.length === 0) {
    container.innerHTML = `<div class="text-center py-10 text-gray-400 text-sm">No phrases found.</div>`;
    return;
  }

  container.innerHTML = data.map(item => `
    <div class="bg-white p-3 rounded-xl border-l-4 border-red-500 shadow-sm hover:shadow-md transition-all duration-200">
      <p class="font-bold text-red-600 text-sm">"${item.phrase}"</p>
      <p class="text-sm text-gray-600 mt-0.5">${item.meaning}</p>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab switching
// ─────────────────────────────────────────────────────────────────────────────

function switchTab(tab) {
  currentTab = tab;

  document.getElementById('routes-section').classList.toggle('hidden', tab !== 'routes');
  document.getElementById('dict-section').classList.toggle('hidden',   tab !== 'dict');

  const btnRoutes = document.getElementById('btn-routes');
  const btnDict   = document.getElementById('btn-dict');

  btnRoutes.classList.toggle('text-red-600',  tab === 'routes');
  btnRoutes.classList.toggle('font-semibold', tab === 'routes');
  btnRoutes.classList.toggle('text-gray-400', tab !== 'routes');

  btnDict.classList.toggle('text-red-600',  tab === 'dict');
  btnDict.classList.toggle('font-semibold', tab === 'dict');
  btnDict.classList.toggle('text-gray-400', tab !== 'dict');

  // Reset search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';

  activeGroup = 'All';
  renderGroupTabs(routesData);
  updateTabStyles();
  renderRoutes(routesData);
  renderDict(dictData);
}

// ─────────────────────────────────────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────────────────────────────────────

function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    if (currentTab === 'routes') {
      const filtered = applyFilters(routesData, query);
      renderGroupTabs(routesData);
      updateTabStyles();
      renderRoutes(filtered);
    } else {
      const filtered = query
        ? dictData.filter(d =>
            matchKeywords(d.keywords, query) ||
            d.phrase.toLowerCase().includes(query) ||
            d.meaning.toLowerCase().includes(query)
          )
        : dictData;
      renderDict(filtered);
    }
  });
}
