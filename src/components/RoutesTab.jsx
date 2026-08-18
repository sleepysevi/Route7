import React, { useState, useMemo, useRef } from 'react';
import { Search, X, LayoutGrid, List, MapPin, Compass, AlertCircle } from 'lucide-react';
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
  All: { active: 'bg-[#10b981] text-white', inactive: 'bg-[#10b981]/15 text-[#34d399] border-[#10b981]/30' },
  'Cebu City': { active: 'bg-[#ff4757] text-white', inactive: 'bg-[#ff4757]/15 text-[#ff6b81] border-[#ff4757]/30' },
  Mandaue: { active: 'bg-[#3b82f6] text-white', inactive: 'bg-[#3b82f6]/15 text-[#60a5fa] border-[#3b82f6]/30' },
  'Mactan Island': { active: 'bg-[#64748b] text-white', inactive: 'bg-[#64748b]/15 text-[#94a3b8] border-[#64748b]/30' },
  'North Cebu': { active: 'bg-[#0ea5e9] text-white', inactive: 'bg-[#0ea5e9]/15 text-[#38bdf8] border-[#0ea5e9]/30' },
  'Talisay City': { active: 'bg-[#6366f1] text-white', inactive: 'bg-[#6366f1]/15 text-[#818cf8] border-[#6366f1]/30' },
  Minglanilla: { active: 'bg-[#22c55e] text-white', inactive: 'bg-[#22c55e]/15 text-[#4ade80] border-[#22c55e]/30' },
  'City of Naga': { active: 'bg-[#f59e0b] text-white', inactive: 'bg-[#f59e0b]/15 text-[#fbbf24] border-[#f59e0b]/30' },
  'San Fernando': { active: 'bg-[#ef4444] text-white', inactive: 'bg-[#ef4444]/15 text-[#f87171] border-[#ef4444]/30' },
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
  const mapSectionRef = useRef(null);

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

  const handleRouteSelect = (route) => {
    onSelectRoute(route);
    // Smooth scroll to map if in mobile
    if (window.innerWidth < 768 && mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-5">
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

          {/* Layout Switcher (Grid / List) */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setLayout('list')}
              title="List View"
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                layout === 'list'
                  ? 'bg-[#ff4757] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              type="button"
              onClick={() => setLayout('grid')}
              title="Grid View"
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                layout === 'grid'
                  ? 'bg-[#ff4757] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>

        {/* Group Filter Chips */}
        <div className="mt-3 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-1.5">
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
                  onClick={() => setActiveGroup(group)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                    isActive
                      ? `${styleConf.active} shadow-[0_2px_10px_rgba(0,0,0,0.3)]`
                      : `${styleConf.inactive} hover:bg-white/10`
                  }`}
                >
                  <span>{group}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Map Panel (Always ready / Selected route viewer) */}
      <div ref={mapSectionRef}>
        <RouteMap
          selectedRoute={selectedRoute}
          onClose={() => onSelectRoute(null)}
        />
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
          <AlertCircle className="h-10 w-10 text-slate-500 mb-2" />
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
            layout === 'grid'
              ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
              : 'space-y-3'
          }
        >
          {filteredRoutes.map((route) => (
            <RouteCard
              key={route.code}
              route={route}
              isSelected={selectedRoute?.code === route.code}
              onSelectRoute={handleRouteSelect}
              layout={layout}
            />
          ))}
        </div>
      )}
    </div>
  );
}
