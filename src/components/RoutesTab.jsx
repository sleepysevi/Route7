import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import RouteCard from './RouteCard';
import RouteMap from './RouteMap';

const GROUP_ORDER = [
  'All',
  'Cebu City',
  'Mandaue',
  'Mactan Island',
  'North Cebu',
  'Talisay City',
  'Minglanilla',
  'City of Naga',
  'San Fernando',
];

const GROUP_COLORS = {
  All: { active: 'bg-[#ffbe0b] text-[#0b0c10]', inactive: 'bg-[#ffbe0b]/10 text-[#ffcf45] border-[#ffbe0b]/30' },
  'Cebu City': { active: 'bg-[#ffbe0b] text-[#0b0c10]', inactive: 'bg-[#ffbe0b]/10 text-[#ffcf45] border-[#ffbe0b]/30' },
  Mandaue: { active: 'bg-[#ffbe0b] text-[#0b0c10]', inactive: 'bg-[#ffbe0b]/10 text-[#ffcf45] border-[#ffbe0b]/30' },
  'Mactan Island': { active: 'bg-[#ffbe0b] text-[#0b0c10]', inactive: 'bg-[#ffbe0b]/10 text-[#ffcf45] border-[#ffbe0b]/30' },
  'North Cebu': { active: 'bg-[#ffbe0b] text-[#0b0c10]', inactive: 'bg-[#ffbe0b]/10 text-[#ffcf45] border-[#ffbe0b]/30' },
  'Talisay City': { active: 'bg-[#ffbe0b] text-[#0b0c10]', inactive: 'bg-[#ffbe0b]/10 text-[#ffcf45] border-[#ffbe0b]/30' },
  Minglanilla: { active: 'bg-[#ffbe0b] text-[#0b0c10]', inactive: 'bg-[#ffbe0b]/10 text-[#ffcf45] border-[#ffbe0b]/30' },
  'City of Naga': { active: 'bg-[#ffbe0b] text-[#0b0c10]', inactive: 'bg-[#ffbe0b]/10 text-[#ffcf45] border-[#ffbe0b]/30' },
  'San Fernando': { active: 'bg-[#ffbe0b] text-[#0b0c10]', inactive: 'bg-[#ffbe0b]/10 text-[#ffcf45] border-[#ffbe0b]/30' },
};

function matchKeywords(kw, query) {
  return String(kw || '').toLowerCase().includes(query);
}

export default function RoutesTab({
  routes,
  searchQuery,
  onSearchChange,
  selectedRoute,
  onSelectRoute,
}) {
  const [activeGroup, setActiveGroup] = useState('All');
  const [layout, setLayout] = useState('list');
  const [isMapExpanded, setIsMapExpanded] = useState(true);
  const [isMapHighlighting, setIsMapHighlighting] = useState(false);
  const mapSectionRef = useRef(null);
  const highlightTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  // Filter routes by group and search query
  const filteredRoutes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = routes;

    if (activeGroup !== 'All') {
      result = result.filter((item) => item.group === activeGroup);
    }

    if (q) {
      result = result.filter(
        (item) =>
          item.code.toLowerCase().includes(q) ||
          item.route.toLowerCase().includes(q) ||
          item.via.toLowerCase().includes(q) ||
          matchKeywords(item.keywords, q) ||
          (item.stops || []).some((s) => s.toLowerCase().includes(q))
      );
    }

    return result;
  }, [routes, activeGroup, searchQuery]);

  const focusMapPanel = () => {
    setIsMapExpanded(true);

    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }

    setIsMapHighlighting(true);
    highlightTimerRef.current = setTimeout(() => {
      setIsMapHighlighting(false);
    }, 600);

    window.setTimeout(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleRouteSelect = (route) => {
    onSelectRoute(route);
    focusMapPanel();
  };

  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <div className="w-full min-w-0 space-y-5">
      {/* Search & Layout Toggle Control Bar */}
      <div className="glass-panel rounded-2xl p-3 shadow-lg sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ff4757]" />
            <input
              type="text"
              placeholder="Search by code (04L, 13C), destination, via, or stop..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#12141c] py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-[#ff4757] focus:outline-none focus:ring-1 focus:ring-[#ff4757]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Controls: Map Toggle & Layout Switcher (Grid / List) */}
          <div className="flex w-full items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 sm:w-auto sm:self-auto">
            <button
              type="button"
              onClick={() => setIsMapExpanded((prev) => !prev)}
              title={isMapExpanded ? 'Hide Map' : 'Show Map'}
              aria-label={isMapExpanded ? 'Hide Map' : 'Show Map'}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition sm:flex-none ${
                isMapExpanded
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Map</span>
            </button>
            <div className="h-3 w-[1px] bg-white/10 mx-0.5" />
            <button
              type="button"
              onClick={() => setLayout('list')}
              title="List View"
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition sm:flex-none ${
                layout === 'list'
                  ? 'bg-[#ff4757] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setLayout('grid')}
              title="Grid View"
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition sm:flex-none ${
                layout === 'grid'
                  ? 'bg-[#ff4757] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Grid</span>
            </button>
          </div>
        </div>

        {/* Group Filter Chips with visual horizontal scroll cues */}
        <div className="relative mt-3">
          {/* Subtle gradient scroll hints for mobile */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-1 z-10 w-4 bg-gradient-to-r from-[#14161f] to-transparent sm:hidden" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-1 z-10 w-6 bg-gradient-to-l from-[#14161f] to-transparent sm:hidden" />

          <div
            className="overflow-x-auto pb-1.5 scrollbar-none"
            role="tablist"
            aria-label="Filter routes by city area"
          >
            <div className="flex min-w-max gap-1.5 px-0.5">
              {GROUP_ORDER.map((group) => {
                const isActive = activeGroup === group;
                const count =
                  group === 'All'
                    ? routes.length
                    : routes.filter((r) => r.group === group).length;

                const styleConf = GROUP_COLORS[group] || GROUP_COLORS.All;

                return (
                  <button
                    key={group}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveGroup(group)}
                    className={`flex min-h-[34px] items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? `${styleConf.active} shadow-[0_2px_10px_rgba(0,0,0,0.3)]`
                        : `${styleConf.inactive} hover:bg-white/10`
                    }`}
                  >
                    <span>{group}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map Panel (Always ready / Selected route viewer) */}
      <div
        ref={mapSectionRef}
        className={`rounded-3xl transition-all duration-300 ${
          isMapHighlighting
            ? 'route-focus-pulse ring-2 ring-[#ffbe0b]/80'
            : ''
        }`}
      >
        {isMapExpanded ? (
          <RouteMap
            selectedRoute={selectedRoute}
            onClose={() => {
              setIsMapExpanded(false);
              onSelectRoute(null);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsMapExpanded(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] py-3 text-xs font-semibold text-slate-400 transition hover:border-[#ff4757]/40 hover:bg-white/[0.05] hover:text-white"
          >
            <span>Show Route Map & Selected Paths</span>
          </button>
        )}
      </div>

      {/* Result Status Count */}
      <div className="flex items-center justify-between px-1 text-xs font-medium text-slate-400">
        <span>
          Showing <strong className="text-white">{filteredRoutes.length}</strong>{' '}
          {filteredRoutes.length === 1 ? 'route' : 'routes'}
        </span>
        {activeGroup !== 'All' && (
          <span className="text-slate-500">Filtered by {activeGroup}</span>
        )}
      </div>

      {/* Routes Grid / List */}
      {filteredRoutes.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center rounded-3xl p-10 text-center text-slate-400">
          <h4 className="text-base font-bold text-white">No routes found</h4>
          <p className="mt-1 text-xs text-slate-400">
            No jeepneys match "{searchQuery}". Try searching by area name, mall, or route code.
          </p>
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              setActiveGroup('All');
            }}
            className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div
          className={
            isSearchActive
              ? 'hiking-rail flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4'
              : layout === 'grid'
              ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
              : 'space-y-3'
          }
        >
          {filteredRoutes.map((route) => (
            <div
              key={route.code}
              className={
                isSearchActive
                  ? 'min-w-[min(86vw,360px)] snap-start transition-transform duration-300 hover:-translate-y-1 sm:min-w-[330px] lg:min-w-[360px]'
                  : ''
              }
            >
              <RouteCard
                route={route}
                isSelected={selectedRoute?.code === route.code}
                onSelectRoute={handleRouteSelect}
                layout={layout}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
