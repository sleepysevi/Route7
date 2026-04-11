// app.js — Route7

let routesData = [];
let dictData   = [];
let spotsData  = [];
let currentTab    = 'routes';
let activeGroup   = 'All';
let activeSpotCat = 'All';
let routeLayout   = 'list';

// Leaflet
let map            = null;
let activePolyline = null;
let activeMarkers  = [];
let mapInitialised = false;
let spotMap            = null;
let spotMarkers        = [];
let spotMapInitialised = false;

const MAP_DEFAULT_CENTER = [10.2938, 123.8950];
const MAP_DEFAULT_ZOOM   = 12;

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

// ─── Boot ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  lucide.createIcons();
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
    console.log(`Loaded — routes:${routesData.length} phrases:${dictData.length} spots:${spotsData.length}`);
    renderGroupTabs(routesData);
    renderRoutes(routesData);
    renderDict(dictData);
    renderSpotCatTabs();
    renderSpots(spotsData);
    lucide.createIcons();
  } catch (err) {
    console.error(err);
    document.getElementById('routes-container').innerHTML =
      `<div class="empty-state"><strong>Could not load data</strong><br>${err.message}</div>`;
  }
}

// ─── Layout toggle ──────────────────────────────────────────────────────────
function setRouteLayout(mode) {
  routeLayout = mode;
  document.getElementById('btn-list-view').classList.toggle('active', mode === 'list');
  document.getElementById('btn-grid-view').classList.toggle('active', mode === 'grid');
  const q = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
  renderRoutes(applyFilters(routesData, q));
}

// ─── Route map ──────────────────────────────────────────────────────────────
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
  if (panel) { panel.style.display = 'block'; setTimeout(() => map.invalidateSize(), 50); }
  clearMapOverlays();
  const routePath = (typeof ROUTE_COORDS !== 'undefined') ? ROUTE_COORDS[code] : null;
  const cap = document.getElementById('map-caption');
  if (!routePath) {
    if (cap) { cap.textContent = `${code} — route path coming soon`; cap.style.borderLeftColor = '#9ca3af'; }
    map.setView(MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM);
    return;
  }
  const { coords, color } = routePath;
  activePolyline = L.polyline(coords, { color, weight:5, opacity:0.85, lineJoin:'round', lineCap:'round' })
    .bindPopup(`<b>${code}</b> — ${name}`, { closeButton:false }).addTo(map);
  const mkIcon = (bg, border) => L.divIcon({
    className:'',
    html:`<div style="background:${bg};border:3px solid ${border};width:14px;height:14px;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
    iconSize:[14,14], iconAnchor:[7,7],
  });
  activeMarkers = [
    L.marker(coords[0],               { icon: mkIcon(color,'#fff') }).bindTooltip('Start',{direction:'top'}).addTo(map),
    L.marker(coords[coords.length-1], { icon: mkIcon('#fff',color) }).bindTooltip('End',  {direction:'top'}).addTo(map),
  ];
  map.fitBounds(L.latLngBounds(coords), { padding:[32,32], maxZoom:15 });
  if (cap) { cap.textContent = `${code} — ${name}`; cap.style.borderLeftColor = color; }
}

function clearMapOverlays() {
  if (activePolyline) { map.removeLayer(activePolyline); activePolyline = null; }
  activeMarkers.forEach(m => map.removeLayer(m));
  activeMarkers = [];
}

// ─── Spots map ──────────────────────────────────────────────────────────────
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
      html:`<div style="background:#DC2626;border:2px solid #fff;width:24px;height:24px;border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 2px 6px rgba(0,0,0,.35);cursor:pointer;">
              <svg style="width:12px;height:12px;stroke:#fff;fill:none;stroke-width:2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>`,
      iconSize:[24,24], iconAnchor:[12,12],
    });
    const stars = '★'.repeat(Math.round(spot.rating)) + '☆'.repeat(5-Math.round(spot.rating));
    const marker = L.marker(spot.coords, { icon })
      .bindPopup(`
        <div style="min-width:170px;font-family:'DM Sans',sans-serif;font-size:12px">
          <div style="font-weight:700;font-size:13px;margin-bottom:3px;color:#111">${spot.name}</div>
          <div style="color:#6b7280;margin-bottom:4px">${spot.address}</div>
          <div style="color:#F59E0B;margin-bottom:4px">${stars}</div>
          <div style="color:#374151">${spot.description.slice(0,90)}…</div>
          <div style="margin-top:6px;color:#DC2626;font-weight:600">${spot.hours}</div>
          <div style="color:#059669;font-weight:600">${spot.entrance}</div>
        </div>
      `, { maxWidth:210 })
      .addTo(spotMap);
    spotMarkers.push(marker);
  });
  if (spots.length > 1) {
    spotMap.fitBounds(L.latLngBounds(spots.map(s=>s.coords)), { padding:[32,32], maxZoom:15 });
  } else if (spots.length === 1) {
    spotMap.flyTo(spots[0].coords, 15);
  }
}

// ─── Group tabs ─────────────────────────────────────────────────────────────
function renderGroupTabs(data) {
  const bar = document.getElementById('group-tab-bar');
  if (!bar) return;
  const present = ['All', ...new Set(data.map(r=>r.group).filter(Boolean))];
  const ordered = GROUP_ORDER.filter(g => present.includes(g));
  bar.innerHTML = ordered.map(g => {
    const count = g==='All' ? routesData.length : routesData.filter(r=>r.group===g).length;
    const isActive = g === activeGroup;
    return `<button onclick="setGroup('${g}')" data-group="${g}"
      class="chip ${isActive?'active':''}">${g} <span style="opacity:.6">${count}</span></button>`;
  }).join('');
}

function setGroup(group) {
  activeGroup = group;
  const q = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
  // Update chip styles
  document.querySelectorAll('#group-tab-bar .chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.group === group);
  });
  renderRoutes(applyFilters(routesData, q));
}

// ─── Filters ────────────────────────────────────────────────────────────────
function matchKeywords(kw, q) { return String(kw).toLowerCase().includes(q); }

function applyFilters(data, query) {
  let r = data;
  if (activeGroup !== 'All') r = r.filter(x => x.group === activeGroup);
  if (query) r = r.filter(x =>
    matchKeywords(x.keywords, query) ||
    x.route.toLowerCase().includes(query) ||
    x.via.toLowerCase().includes(query) ||
    x.code.toLowerCase().includes(query) ||
    (x.stops||[]).some(s => s.toLowerCase().includes(query))
  );
  return r;
}

// ─── Render Routes ───────────────────────────────────────────────────────────
function renderRoutes(data) {
  const container  = document.getElementById('routes-container');
  const countLabel = document.getElementById('routes-count-label');
  const hBadge     = document.getElementById('header-badge');
  const hCount     = document.getElementById('header-count');

  if (countLabel) countLabel.textContent = `${data.length} route${data.length!==1?'s':''} found`;
  if (hBadge)  hBadge.style.display = 'block';
  if (hCount)  hCount.textContent    = data.length;
  if (!container) return;

  if (!data || data.length === 0) {
    container.innerHTML = `<div class="empty-state">No routes found.<br>Try a different search or group.</div>`;
    return;
  }

  const hasMap = code => !!(typeof ROUTE_COORDS !== 'undefined' && ROUTE_COORDS[code]);

  if (routeLayout === 'grid') {
    container.className = 'route-grid';
    container.innerHTML = data.map(item => {
      const sc = (item.stops||[]).length;
      return `
      <div class="route-card" data-code="${item.code}" onclick="handleRouteClick('${item.code}','${ea(item.route)}')">
        <div class="route-card-grid">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <span class="code-badge ${item.color}">${item.code}</span>
            ${hasMap(item.code) ? `<span class="has-map-dot" title="Map available"></span>` : ''}
          </div>
          <p class="route-name">${item.route}</p>
        </div>
        <p class="route-via">${item.via}</p>
        <div class="route-card-foot">
          ${sc ? `<button class="stops-btn" onclick="event.stopPropagation();toggleStops('${item.code}')">
            <svg style="width:9px;height:9px;stroke:currentColor;stroke-width:3;fill:none;transition:transform .15s" class="sc-${item.code}" viewBox="0 0 24 24">
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
      const sc = (item.stops||[]).length;
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
              <svg style="width:9px;height:9px;stroke:currentColor;stroke-width:3;fill:none;transition:transform .15s" class="sc-${item.code}" viewBox="0 0 24 24">
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
    const dotColor = isFirst ? '#16a34a' : isLast ? '#DC2626' : '#d1d5db';
    const dotSize  = (isFirst || isLast) ? '10px' : '7px';
    const label    = isFirst ? 'START' : isLast ? 'END' : null;
    return `<div style="display:flex;align-items:stretch;gap:8px;min-height:22px;">
      <div style="display:flex;flex-direction:column;align-items:center;width:10px;flex-shrink:0;">
        <div style="width:${dotSize};height:${dotSize};border-radius:50%;background:${dotColor};flex-shrink:0;margin-top:5px;"></div>
        ${!isLast ? '<div style="width:2px;flex:1;background:#e5e7eb;margin-top:2px;"></div>' : ''}
      </div>
      <div style="padding-bottom:4px;display:flex;align-items:flex-start;gap:6px;flex:1;">
        <span style="font-size:11px;color:#374151;font-weight:${isFirst||isLast?'600':'400'};line-height:1.5;margin-top:2px;">${stop}</span>
        ${label ? `<span style="font-size:8px;padding:1px 5px;border-radius:100px;background:${dotColor};color:#fff;font-weight:800;flex-shrink:0;margin-top:4px;">${label}</span>` : ''}
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
  setTimeout(() => document.getElementById('map-panel')?.scrollIntoView({ behavior:'smooth', block:'start' }), 80);
}

function ea(str) { return str.replace(/'/g,"\\'").replace(/"/g,'&quot;'); }

// ─── Render Dictionary ───────────────────────────────────────────────────────
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

// ─── Spot categories ─────────────────────────────────────────────────────────
function renderSpotCatTabs() {
  const bar = document.getElementById('spot-cat-bar');
  if (!bar) return;
  bar.innerHTML = SPOT_CATEGORIES.map(cat => {
    const count = cat==='All' ? spotsData.length : spotsData.filter(s=>s.category===cat).length;
    if (cat !== 'All' && count === 0) return '';
    return `<button onclick="setSpotCat('${cat}')" data-cat="${cat}"
      class="chip ${cat===activeSpotCat?'active':''}">${cat} <span style="opacity:.6">${count}</span></button>`;
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

// ─── Render Spots ────────────────────────────────────────────────────────────
function renderSpots(data) {
  const c = document.getElementById('spots-container');
  if (!c) return;
  if (!data || data.length === 0) {
    c.innerHTML = `<div class="empty-state">No spots found.</div>`;
    return;
  }
  c.innerHTML = data.map(spot => {
    const col    = SPOT_CAT_COLORS[spot.category] || { bg:'#F3F4F6', text:'#374151' };
    const stars  = '★'.repeat(Math.round(spot.rating)) + '☆'.repeat(5 - Math.round(spot.rating));
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
            <span class="spot-cat-badge" style="background:${col.bg};color:${col.text}">${spot.category}</span>
          </div>
          <div class="spot-stars">${stars} <span style="font-size:10px;color:var(--text-faint);font-family:'DM Sans',sans-serif;">${spot.rating}</span></div>
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
  spotMap.flyTo(spot.coords, 16, { duration:1 });
  spotMarkers.forEach(m => {
    if (m.getLatLng().lat === spot.coords[0] && m.getLatLng().lng === spot.coords[1]) m.openPopup();
  });
  document.getElementById('spot-map-container')?.scrollIntoView({ behavior:'smooth', block:'start' });
}

// ─── Tab switching ────────────────────────────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;

  // Show/hide panes
  ['routes','dict','spots'].forEach(t => {
    document.getElementById(`pane-${t}`)?.classList.toggle('active', t === tab);
  });

  // Nav button states
  ['routes','dict','spots'].forEach(t => {
    document.getElementById(`btn-${t}`)?.classList.toggle('active', t === tab);
  });

  // Lazy-init spot map
  if (tab === 'spots' && !spotMapInitialised) {
    setTimeout(() => { initSpotMap(); renderSpotMarkers(spotsData); }, 120);
  }

  // Clear search inputs on tab switch
  ['searchInput','dictSearchInput','spot-search'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });

  // Reset group on routes tab
  if (tab === 'routes') {
    activeGroup = 'All';
    renderGroupTabs(routesData);
    renderRoutes(routesData);
  }
}

// ─── Search ──────────────────────────────────────────────────────────────────
function setupSearch() {
  document.getElementById('searchInput')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    renderRoutes(applyFilters(routesData, q));
  });

  document.getElementById('dictSearchInput')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    renderDict(q ? dictData.filter(d =>
      matchKeywords(d.keywords,q) || d.phrase.toLowerCase().includes(q) || d.meaning.toLowerCase().includes(q)
    ) : dictData);
  });

  document.getElementById('spot-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = filterSpots(spotsData, activeSpotCat, q);
    renderSpots(filtered);
    if (spotMapInitialised) renderSpotMarkers(filtered);
  });
}
