// app.js — Route7 by sleepysevi

let routesData = [];
let dictData   = [];
let spotsData  = [];
let currentTab    = 'routes';
let activeGroup   = 'All';
let activeSpotCat = 'All';
let routeLayout   = 'list';

let map            = null;
let activePolyline = null;
let activeMarkers  = [];
let mapInitialised = false;

let spotMap            = null;
let spotMarkers        = [];
let spotMapInitialised = false;

const MAP_DEFAULT_CENTER = [10.2938, 123.8950];
const MAP_DEFAULT_ZOOM   = 12;

const ALL_TABS = ['routes','dict','spots','hotlines'];

const GROUP_ORDER = [
  'All','Cebu City','Mandaue','Mactan Island','North Cebu',
  'Talisay City','Minglanilla','City of Naga','San Fernando'
];
const GROUP_COLORS = {
  'All':           { active:'#059669', inactive:'#D1FAE5', inactiveText:'#065F46' },
  'Cebu City':     { active:'#DC2626', inactive:'#FEE2E2', inactiveText:'#991B1B' },
  'Mandaue':       { active:'#1D4ED8', inactive:'#DBEAFE', inactiveText:'#1E3A8A' },
  'Mactan Island': { active:'#52525B', inactive:'#F4F4F5', inactiveText:'#3F3F46' },
  'North Cebu':    { active:'#0369A1', inactive:'#E0F2FE', inactiveText:'#0C4A6E' },
  'Talisay City':  { active:'#1E40AF', inactive:'#DBEAFE', inactiveText:'#1E3A8A' },
  'Minglanilla':   { active:'#15803D', inactive:'#DCFCE7', inactiveText:'#14532D' },
  'City of Naga':  { active:'#B45309', inactive:'#FEF9C3', inactiveText:'#92400E' },
  'San Fernando':  { active:'#B91C1C', inactive:'#FEE2E2', inactiveText:'#7F1D1D' },
};

const SPOT_CATEGORIES = ['All','Historical','Nature','Landmark','Culture','Shopping','Urban','Education','Cultural'];
const SPOT_CAT_COLORS = {
  'Historical': { bg:'#FEF3C7', text:'#92400E' },
  'Nature':     { bg:'#D1FAE5', text:'#065F46' },
  'Landmark':   { bg:'#EDE9FE', text:'#4C1D95' },
  'Culture':    { bg:'#FCE7F3', text:'#831843' },
  'Shopping':   { bg:'#DBEAFE', text:'#1E3A8A' },
  'Urban':      { bg:'#F3F4F6', text:'#374151' },
  'Education':  { bg:'#E0E7FF', text:'#312E81' },
  'Cultural':   { bg:'#FFE4E6', text:'#881337' },
};

// Cebu City emergency hotlines data
const HOTLINES_DATA = [
  {
    group: 'Emergency',
    entries: [
      { name: 'Cebu City Emergency', dept: 'General Emergency Line', number: '911', color: '#DC2626', bg: '#FEE2E2' },
      { name: 'Cebu City Disaster Office', dept: 'CDRRMO', number: '(032) 261-8888', color: '#DC2626', bg: '#FEE2E2' },
    ]
  },
  {
    group: 'Police & Safety',
    entries: [
      { name: 'Cebu City Police', dept: 'CCPO — Main', number: '(032) 416-0033', color: '#1D4ED8', bg: '#DBEAFE' },
      { name: 'Police Emergency', dept: 'Philippine National Police', number: '117', color: '#1D4ED8', bg: '#DBEAFE' },
      { name: 'NBI Cebu', dept: 'National Bureau of Investigation', number: '(032) 231-1600', color: '#1D4ED8', bg: '#DBEAFE' },
    ]
  },
  {
    group: 'Fire & Rescue',
    entries: [
      { name: 'Bureau of Fire Protection', dept: 'Cebu City BFP', number: '(032) 346-3400', color: '#EA580C', bg: '#FFEDD5' },
      { name: 'Fire Emergency', dept: 'BFP National Hotline', number: '160', color: '#EA580C', bg: '#FFEDD5' },
    ]
  },
  {
    group: 'Medical',
    entries: [
      { name: 'Vicente Sotto Memorial', dept: 'VSMMC — Government Hospital', number: '(032) 253-9891', color: '#059669', bg: '#D1FAE5' },
      { name: 'Chong Hua Hospital', dept: 'Private — Fuente', number: '(032) 255-8000', color: '#059669', bg: '#D1FAE5' },
      { name: 'Cebu Doctors\' University', dept: 'CDU Hospital', number: '(032) 253-7511', color: '#059669', bg: '#D1FAE5' },
      { name: 'Red Cross Cebu', dept: 'Philippine Red Cross', number: '(032) 253-0037', color: '#DC2626', bg: '#FEE2E2' },
    ]
  },
  {
    group: 'Transport & Traffic',
    entries: [
      { name: 'LTO Cebu', dept: 'Land Transportation Office', number: '(032) 239-5719', color: '#7C3AED', bg: '#EDE9FE' },
      { name: 'LTFRB Region 7', dept: 'Land Transportation Franchising', number: '(032) 412-6100', color: '#7C3AED', bg: '#EDE9FE' },
      { name: 'CCTO', dept: 'Cebu City Traffic Operations', number: '(032) 255-1400', color: '#7C3AED', bg: '#EDE9FE' },
    ]
  },
  {
    group: 'Utilities',
    entries: [
      { name: 'MCWD', dept: 'Metro Cebu Water District', number: '(032) 239-6339', color: '#0369A1', bg: '#E0F2FE' },
      { name: 'VECO / Meralco Visayas', dept: 'Visayan Electric Company', number: '(032) 230-8326', color: '#B45309', bg: '#FEF9C3' },
    ]
  },
];

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupSearch();
});

async function loadData() {
  try {
    if (typeof ROUTES_DATA !== 'undefined') {
      routesData = ROUTES_DATA;
      dictData   = DICT_DATA;
      spotsData  = SPOTS_DATA;
    } else {
      const [r, d, s] = await Promise.all([
        fetch('./data/routes.json'),
        fetch('./data/dictionary.json'),
        fetch('./data/spots.json'),
      ]);
      routesData = await r.json();
      dictData   = await d.json();
      spotsData  = await s.json();
    }
    renderGroupTabs(routesData);
    renderRoutes(routesData);
    renderDict(dictData);
    renderSpotCatTabs();
    renderSpots(spotsData);
    renderHotlines();
  } catch (err) {
    console.error('Load error:', err);
    const c = document.getElementById('routes-container');
    if (c) c.innerHTML = `<div class="empty-state"><strong>Could not load data</strong><br>${err.message}</div>`;
  }
}

// ─── Layout toggle ────────────────────────────────────────────────────────────
function setRouteLayout(mode) {
  routeLayout = mode;
  document.getElementById('btn-list-view').classList.toggle('active', mode === 'list');
  document.getElementById('btn-grid-view').classList.toggle('active', mode === 'grid');
  const q = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
  renderRoutes(applyFilters(routesData, q));
}

// ─── Route map ────────────────────────────────────────────────────────────────
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
  if (panel) { panel.style.display = 'block'; setTimeout(() => map.invalidateSize(), 60); }
  clearMapOverlays();

  const routePath = (typeof ROUTE_COORDS !== 'undefined') ? ROUTE_COORDS[code] : null;
  const cap = document.getElementById('map-caption');
  if (!routePath) {
    if (cap) { cap.textContent = `${code} — route path coming soon`; cap.style.borderLeftColor = '#9ca3af'; }
    map.setView(MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM);
    return;
  }
  const { coords, color } = routePath;
  activePolyline = L.polyline(coords, { color, weight: 5, opacity: 0.85, lineJoin: 'round', lineCap: 'round' })
    .bindPopup(`<strong>${code}</strong> — ${name}`, { closeButton: false })
    .addTo(map);

  const mkIcon = (bg, border) => L.divIcon({
    className: '',
    html: `<div style="background:${bg};border:3px solid ${border};width:13px;height:13px;border-radius:50%;box-shadow:0 2px 5px rgba(0,0,0,.4)"></div>`,
    iconSize: [13, 13], iconAnchor: [6, 6],
  });
  activeMarkers = [
    L.marker(coords[0],               { icon: mkIcon(color, '#fff') }).bindTooltip('Start', { direction: 'top' }).addTo(map),
    L.marker(coords[coords.length-1], { icon: mkIcon('#fff', color) }).bindTooltip('End',   { direction: 'top' }).addTo(map),
  ];
  map.fitBounds(L.latLngBounds(coords), { padding: [32, 32], maxZoom: 15 });
  if (cap) { cap.textContent = `${code} — ${name}`; cap.style.borderLeftColor = color; }
}

function clearMapOverlays() {
  if (activePolyline) { map.removeLayer(activePolyline); activePolyline = null; }
  activeMarkers.forEach(m => map.removeLayer(m));
  activeMarkers = [];
}

// ─── Spots map ────────────────────────────────────────────────────────────────
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
      className: '',
      html: `<div style="background:#DC2626;border:2px solid #fff;width:24px;height:24px;border-radius:50%;
               display:flex;align-items:center;justify-content:center;
               box-shadow:0 2px 6px rgba(0,0,0,.35);cursor:pointer;">
               <svg style="width:11px;height:11px;stroke:#fff;fill:none;stroke-width:2.5" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                 <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
               </svg>
             </div>`,
      iconSize: [24, 24], iconAnchor: [12, 12],
    });
    const marker = L.marker(spot.coords, { icon })
      .bindPopup(`
        <div style="min-width:170px;font-family:'DM Sans',sans-serif;font-size:12px;line-height:1.5;">
          <div style="font-weight:700;font-size:13px;margin-bottom:3px;color:#111;">${spot.name}</div>
          <div style="color:#6b7280;margin-bottom:5px;">${spot.address}</div>
          <div style="color:#374151;margin-bottom:5px;">${spot.description.slice(0, 90)}…</div>
          <div style="color:#DC2626;font-weight:600;">${spot.hours}</div>
          <div style="color:#059669;font-weight:600;">${spot.entrance}</div>
        </div>
      `, { maxWidth: 210 })
      .addTo(spotMap);
    spotMarkers.push(marker);
  });
  if (spots.length > 1) {
    spotMap.fitBounds(L.latLngBounds(spots.map(s => s.coords)), { padding: [32, 32], maxZoom: 15 });
  } else if (spots.length === 1) {
    spotMap.flyTo(spots[0].coords, 15);
  }
}

// ─── Group tabs ───────────────────────────────────────────────────────────────
function renderGroupTabs(data) {
  const bar = document.getElementById('group-tab-bar');
  if (!bar) return;
  const present = ['All', ...new Set(data.map(r => r.group).filter(Boolean))];
  const ordered = GROUP_ORDER.filter(g => present.includes(g));
  bar.innerHTML = ordered.map(g => {
    const count = g === 'All' ? routesData.length : routesData.filter(r => r.group === g).length;
    const isActive = g === activeGroup;
    const col = GROUP_COLORS[g] || GROUP_COLORS['All'];
    const bg   = isActive ? col.active : col.inactive;
    const text = isActive ? '#fff' : col.inactiveText;
    return `<button onclick="setGroup('${g}')" data-group="${g}" class="chip"
      style="background:${bg};color:${text};border-color:${isActive ? col.active : col.inactive};">
      ${g} <span style="opacity:.65">${count}</span>
    </button>`;
  }).join('');
}

function setGroup(group) {
  activeGroup = group;
  renderGroupTabs(routesData); // re-render to update styles
  const q = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
  renderRoutes(applyFilters(routesData, q));
}

// ─── Filters ──────────────────────────────────────────────────────────────────
function matchKeywords(kw, q) { return String(kw).toLowerCase().includes(q); }

function applyFilters(data, query) {
  let r = data;
  if (activeGroup !== 'All') r = r.filter(x => x.group === activeGroup);
  if (query) r = r.filter(x =>
    matchKeywords(x.keywords, query) ||
    x.route.toLowerCase().includes(query) ||
    x.via.toLowerCase().includes(query) ||
    x.code.toLowerCase().includes(query) ||
    (x.stops || []).some(s => s.toLowerCase().includes(query))
  );
  return r;
}

// ─── Render Routes ────────────────────────────────────────────────────────────
function renderRoutes(data) {
  const container  = document.getElementById('routes-container');
  const countLabel = document.getElementById('routes-count-label');
  if (countLabel) countLabel.textContent = `${data.length} route${data.length !== 1 ? 's' : ''} found`;
  if (!container) return;

  if (!data || data.length === 0) {
    container.innerHTML = `<div class="empty-state">No routes found.<br>Try a different search or filter.</div>`;
    return;
  }

  const hasMap = code => !!(typeof ROUTE_COORDS !== 'undefined' && ROUTE_COORDS[code]);

  if (routeLayout === 'grid') {
    container.className = 'route-grid';
    container.innerHTML = data.map(item => {
      const sc = (item.stops || []).length;
      return `
      <div class="route-card" data-code="${item.code}" onclick="handleRouteClick('${item.code}','${ea(item.route)}')">
        <div class="route-card-grid">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;">
            <span class="code-badge ${item.color}">${item.code}</span>
            ${hasMap(item.code) ? `<span class="has-map-dot" title="Map available"></span>` : ''}
          </div>
          <p class="route-name">${item.route}</p>
        </div>
        <p class="route-via">${item.via}</p>
        <div class="route-card-foot">
          ${sc ? `<button class="stops-btn" onclick="event.stopPropagation();toggleStops('${item.code}')">
            <svg style="width:9px;height:9px;stroke:currentColor;stroke-width:3;fill:none;transition:transform .15s;" class="sc-${item.code}" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
            ${sc} stops
          </button>` : '<span></span>'}
        </div>
        ${sc ? `<div id="stops-${item.code}" class="stops-panel" style="display:none">
          <div class="stops-panel-label">Route path · ${sc} stops</div>
          ${buildTimeline(item.stops)}
        </div>` : ''}
      </div>`;
    }).join('');
  } else {
    container.className = 'route-list';
    container.innerHTML = data.map(item => {
      const sc = (item.stops || []).length;
      return `
      <div class="route-card" data-code="${item.code}" onclick="handleRouteClick('${item.code}','${ea(item.route)}')">
        <div class="route-card-list">
          <span class="code-badge ${item.color}">${item.code}</span>
          <div style="flex:1;min-width:0;">
            <div class="route-name">${item.route}</div>
            <div class="route-via">via ${item.via}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
            ${hasMap(item.code) ? `<span class="has-map-dot" title="Map available"></span>` : ''}
            ${sc ? `<button class="stops-btn" onclick="event.stopPropagation();toggleStops('${item.code}')">
              <svg style="width:9px;height:9px;stroke:currentColor;stroke-width:3;fill:none;transition:transform .15s;" class="sc-${item.code}" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
              ${sc} stops
            </button>` : ''}
          </div>
        </div>
        ${sc ? `<div id="stops-${item.code}" class="stops-panel" style="display:none">
          <div class="stops-panel-label">Route path · ${sc} stops</div>
          ${buildTimeline(item.stops)}
        </div>` : ''}
      </div>`;
    }).join('');
  }
}

function buildTimeline(stops) {
  return stops.map((stop, i) => {
    const isFirst = i === 0;
    const isLast  = i === stops.length - 1;
    const dot     = isFirst ? '#16a34a' : isLast ? '#DC2626' : '#d1d5db';
    const size    = (isFirst || isLast) ? '10px' : '7px';
    const label   = isFirst ? 'START' : isLast ? 'END' : null;
    return `<div style="display:flex;align-items:stretch;gap:8px;min-height:22px;">
      <div style="display:flex;flex-direction:column;align-items:center;width:10px;flex-shrink:0;">
        <div style="width:${size};height:${size};border-radius:50%;background:${dot};flex-shrink:0;margin-top:5px;"></div>
        ${!isLast ? '<div style="width:2px;flex:1;background:#e5e7eb;margin-top:2px;"></div>' : ''}
      </div>
      <div style="padding-bottom:4px;display:flex;align-items:flex-start;gap:6px;flex:1;">
        <span style="font-size:11px;color:#374151;font-weight:${isFirst || isLast ? '600' : '400'};line-height:1.5;margin-top:2px;">${stop}</span>
        ${label ? `<span style="font-size:8px;padding:1px 5px;border-radius:100px;background:${dot};color:#fff;font-weight:800;flex-shrink:0;margin-top:4px;">${label}</span>` : ''}
      </div>
    </div>`;
  }).join('');
}

function toggleStops(code) {
  const panel = document.getElementById(`stops-${code}`);
  if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  document.querySelectorAll(`.sc-${code}`).forEach(svg => {
    svg.style.transform = isOpen ? '' : 'rotate(180deg)';
  });
}

function handleRouteClick(code, name) {
  document.querySelectorAll('.route-card').forEach(c => c.classList.remove('active-card'));
  document.querySelector(`.route-card[data-code="${code}"]`)?.classList.add('active-card');
  showRouteOnMap(code, name);
  setTimeout(() => document.getElementById('map-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
}

function ea(str) { return str.replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

// ─── Dictionary ───────────────────────────────────────────────────────────────
function renderDict(data) {
  const c = document.getElementById('dict-container');
  if (!c) return;
  if (!data || data.length === 0) {
    c.innerHTML = `<div class="empty-state">No phrases found.</div>`;
    return;
  }
  c.innerHTML = data.map(item => `
    <div class="dict-card" onclick="copyPhrase('${ea(item.phrase)}', this)">
      <div class="dict-phrase">${item.phrase}</div>
      <div class="dict-meaning">${item.meaning}</div>
      <div class="dict-copy">Tap to copy</div>
    </div>
  `).join('');
}

function copyPhrase(phrase, el) {
  navigator.clipboard?.writeText(phrase).catch(() => {});
  const hint = el.querySelector('.dict-copy');
  if (!hint) return;
  hint.textContent = 'Copied!';
  hint.style.color = '#16a34a';
  setTimeout(() => { hint.textContent = 'Tap to copy'; hint.style.color = ''; }, 1800);
}

// ─── Spots ────────────────────────────────────────────────────────────────────
function renderSpotCatTabs() {
  const bar = document.getElementById('spot-cat-bar');
  if (!bar) return;
  bar.innerHTML = SPOT_CATEGORIES.map(cat => {
    const count = cat === 'All' ? spotsData.length : spotsData.filter(s => s.category === cat).length;
    if (cat !== 'All' && count === 0) return '';
    const isActive = cat === activeSpotCat;
    return `<button onclick="setSpotCat('${cat}')" data-cat="${cat}" class="chip ${isActive ? 'active' : ''}">
      ${cat} <span style="opacity:.6">${count}</span>
    </button>`;
  }).join('');
}

function setSpotCat(cat) {
  activeSpotCat = cat;
  document.querySelectorAll('#spot-cat-bar .chip').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === cat);
  });
  const q = document.getElementById('spot-search')?.value.toLowerCase().trim() || '';
  const filtered = filterSpots(spotsData, cat, q);
  renderSpots(filtered);
  renderSpotMarkers(filtered);
}

function filterSpots(data, cat, q) {
  let r = data;
  if (cat !== 'All') r = r.filter(s => s.category === cat);
  if (q) r = r.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.address.toLowerCase().includes(q) ||
    matchKeywords(s.keywords, q)
  );
  return r;
}

function renderSpots(data) {
  const c = document.getElementById('spots-container');
  if (!c) return;
  if (!data || data.length === 0) {
    c.innerHTML = `<div class="empty-state">No spots found.</div>`;
    return;
  }
  c.innerHTML = data.map(spot => {
    const col    = SPOT_CAT_COLORS[spot.category] || { bg: '#F3F4F6', text: '#374151' };
    const badges = spot.jeepney.map(j => `<span class="jeep-badge">${j}</span>`).join('');
    return `
    <div class="spot-card">
      <div class="spot-card-head">
        <div class="spot-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
            <div class="spot-name">${spot.name}</div>
            <span class="spot-cat-badge" style="background:${col.bg};color:${col.text};">${spot.category}</span>
          </div>
          <div class="spot-addr">${spot.address}</div>
        </div>
      </div>
      <p class="spot-desc">${spot.description}</p>
      <div class="spot-meta">
        <span class="spot-meta-pill">${spot.hours}</span>
        <span class="spot-meta-pill" style="background:#D1FAE5;color:#065F46;border-color:#A7F3D0;">${spot.entrance}</span>
      </div>
      <div class="spot-jeep">
        <div class="spot-jeep-label">Jeepney Access</div>
        <div class="spot-jeep-badges">${badges}</div>
        <div class="spot-jeep-tip">${spot.jeepney_tip}</div>
      </div>
      <button class="spot-map-btn" onclick="focusSpotOnMap(${spot.id})">
        <svg viewBox="0 0 24 24" fill="none">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
        </svg>
        View on map
      </button>
    </div>`;
  }).join('');
}

function focusSpotOnMap(id) {
  const spot = spotsData.find(s => s.id === id);
  if (!spot) return;
  if (!spotMapInitialised) { initSpotMap(); renderSpotMarkers(spotsData); }
  spotMap.flyTo(spot.coords, 16, { duration: 1 });
  spotMarkers.forEach(m => {
    if (m.getLatLng().lat === spot.coords[0] && m.getLatLng().lng === spot.coords[1]) m.openPopup();
  });
  document.getElementById('spot-map-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Hotlines ─────────────────────────────────────────────────────────────────
function renderHotlines() {
  const c = document.getElementById('hotlines-container');
  if (!c) return;
  c.innerHTML = HOTLINES_DATA.map(group => {
    const cards = group.entries.map(e => `
      <a class="hotline-card" href="tel:${e.number.replace(/[^0-9+]/g,'')}" onclick="return true;">
        <div class="hotline-icon" style="background:${e.bg};">
          <svg viewBox="0 0 24 24" fill="none" style="stroke:${e.color};width:20px;height:20px;stroke-width:2;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
          </svg>
        </div>
        <div style="flex:1;min-width:0;">
          <div class="hotline-name">${e.name}</div>
          <div class="hotline-dept">${e.dept}</div>
        </div>
        <div class="hotline-number">${e.number}</div>
      </a>
    `).join('');
    return `
      <div class="hotline-group-label">${group.group}</div>
      ${cards}
    `;
  }).join('');
}

// ─── Tab switching ────────────────────────────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;

  ALL_TABS.forEach(t => {
    document.getElementById(`pane-${t}`)?.classList.toggle('active', t === tab);
    const btn = document.getElementById(`btn-${t}`);
    if (btn) btn.classList.toggle('active', t === tab);
  });

  // Lazy-init spot map
  if (tab === 'spots' && !spotMapInitialised) {
    setTimeout(() => { initSpotMap(); renderSpotMarkers(spotsData); }, 120);
  }

  // Clear search inputs
  ['searchInput', 'dictSearchInput', 'spot-search'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Reset route filters when returning to routes tab
  if (tab === 'routes') {
    activeGroup = 'All';
    renderGroupTabs(routesData);
    renderRoutes(routesData);
  }

  // Scroll content area back to top
  const tc = document.querySelector('.tab-content');
  if (tc) tc.scrollTop = 0;
}

// ─── Search ───────────────────────────────────────────────────────────────────
function setupSearch() {
  document.getElementById('searchInput')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    renderRoutes(applyFilters(routesData, q));
  });

  document.getElementById('dictSearchInput')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    renderDict(q ? dictData.filter(d =>
      matchKeywords(d.keywords, q) || d.phrase.toLowerCase().includes(q) || d.meaning.toLowerCase().includes(q)
    ) : dictData);
  });

  document.getElementById('spot-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = filterSpots(spotsData, activeSpotCat, q);
    renderSpots(filtered);
    if (spotMapInitialised) renderSpotMarkers(filtered);
  });
}
