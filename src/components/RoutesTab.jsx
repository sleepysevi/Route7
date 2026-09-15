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
  'Tuburan',
  'Talisay City',
  'Minglanilla',
  'City of Naga',
  'San Fernando',
];


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
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-ink" />
            <input
              type="text"
              placeholder="Search by code (04L, 13C), destination, via, or stop..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-xl border border-line bg-inset py-2.5 pl-10 pr-10 text-sm text-ink placeholder:text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Controls: Map Toggle & Layout Switcher (Grid / List) */}
          <div className="flex w-full items-center gap-1 rounded-xl border border-line bg-wash p-1 sm:w-auto sm:self-auto">
            <button
              type="button"
              onClick={() => setIsMapExpanded((prev) => !prev)}
              title={isMapExpanded ? 'Hide Map' : 'Show Map'}
              aria-label={isMapExpanded ? 'Hide Map' : 'Show Map'}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition sm:flex-none ${
                isMapExpanded
                  ? 'bg-hover text-ink'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <span>Map</span>
            </button>
            <div className="h-3 w-[1px] bg-line mx-0.5" />
            <button
              type="button"
              onClick={() => setLayout('list')}
              title="List View"
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition sm:flex-none ${
                layout === 'list'
                  ? 'bg-primary text-white shadow'
                  : 'text-muted hover:text-ink'
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
                  ? 'bg-primary text-white shadow'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <span>Grid</span>
            </button>
          </div>
        </div>

        {/* Group Filter Chips with visual horizontal scroll cues */}
        <div className="relative mt-3">
          {/* Subtle gradient scroll hints for mobile */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-1 z-10 w-4 bg-gradient-to-r from-solid to-transparent sm:hidden" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-1 z-10 w-6 bg-gradient-to-l from-solid to-transparent sm:hidden" />

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

                return (
                  <button
                    key={group}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveGroup(group)}
                    className={`flex min-h-[34px] items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'rounded-lg bg-active-plate text-active-ink'
                        : 'rounded-lg text-dim hover:bg-hover-soft hover:text-soft'
                    }`}
                  >
                    <span>{group}</span>
                    <span className="text-[10px] tabular-nums opacity-75">({count})</span>
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong bg-wash py-3 text-xs font-semibold text-muted transition hover:border-primary/40 hover:bg-hover-soft hover:text-ink"
          >
            <span>Show Route Map & Selected Paths</span>
          </button>
        )}
      </div>

      {/* Result Status Count */}
      <div className="flex items-center justify-between px-1 text-xs font-medium text-muted">
        <span>
          Showing <strong className="text-ink">{filteredRoutes.length}</strong>{' '}
          {filteredRoutes.length === 1 ? 'route' : 'routes'}
        </span>
        {activeGroup !== 'All' && (
          <span className="text-dim">Filtered by {activeGroup}</span>
        )}
      </div>

      {/* Routes Grid / List */}
      {filteredRoutes.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center rounded-3xl p-10 text-center text-muted">
          <h4 className="text-base font-bold text-ink">No routes found</h4>
          <p className="mt-1 text-xs text-muted">
            No jeepneys match "{searchQuery}". Try searching by area name, mall, or route code.
          </p>
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              setActiveGroup('All');
            }}
            className="mt-4 rounded-xl border border-line bg-chip px-4 py-2 text-xs font-semibold text-ink hover:bg-hover"
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
