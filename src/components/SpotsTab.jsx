import React, { useState, useMemo, useRef } from 'react';
import { Search, X, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import SpotCard from './SpotCard';
import SpotMap from './SpotMap';

const SPOT_CATEGORIES = [
  'All',
  'Historical',
  'Nature',
  'Landmark',
  'Culture',
  'Shopping',
  'Urban',
  'Education',
  'Cultural',
];

function matchKeywords(kw, query) {
  return String(kw || '').toLowerCase().includes(query);
}

export default function SpotsTab({ spots, onSelectJeepneyRoute }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const spotMapRef = useRef(null);
  const mapContainerRef = useRef(null);

  const filteredSpots = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = spots;

    if (activeCategory !== 'All') {
      result = result.filter((s) => s.category === activeCategory);
    }

    if (q) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          matchKeywords(s.keywords, q) ||
          (s.jeepney || []).some((j) => j.toLowerCase().includes(q))
      );
    }

    return result;
  }, [spots, activeCategory, searchQuery]);

  const handleFocusSpot = (spot) => {
    if (spotMapRef.current) {
      spotMapRef.current.flyToSpot(spot);
    }
    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-5">
      {/* Search & Category Filter Bar */}
      <div className="glass-panel rounded-3xl p-4 shadow-lg sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff4757]/15 text-[#ff4757]">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cebu Attractions & Spots</h2>
              <p className="text-xs text-slate-400">
                Discover tourist landmarks, malls, and nature spots with jeepney access guides
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ff4757]" />
            <input
              type="text"
              placeholder="Search spots, malls, areas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#12141c] py-2 pl-9 pr-8 text-xs text-white placeholder:text-slate-500 focus:border-[#ff4757] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Chips */}
        <div className="mt-4 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-1.5">
            {SPOT_CATEGORIES.map((cat) => {
              const count =
                cat === 'All'
                  ? spots.length
                  : spots.filter((s) => s.category === cat).length;
              if (cat !== 'All' && count === 0) return null;

              const isActive = activeCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    isActive
                      ? 'border-[#ff4757] bg-[#ff4757] text-white shadow-[0_2px_10px_rgba(255,71,87,0.3)]'
                      : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Spots Leaflet Map */}
      <div ref={mapContainerRef}>
        <SpotMap ref={spotMapRef} spots={filteredSpots} />
      </div>

      {/* Spot Count Summary */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <span>
          Showing <strong className="text-white">{filteredSpots.length}</strong> spots
        </span>
        {activeCategory !== 'All' && (
          <span className="text-slate-500">Category: {activeCategory}</span>
        )}
      </div>

      {/* Spot Cards Grid */}
      {filteredSpots.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center rounded-3xl p-10 text-center text-slate-400">
          <AlertCircle className="h-10 w-10 text-slate-500 mb-2" />
          <h4 className="text-base font-bold text-white">No spots found</h4>
          <p className="mt-1 text-xs text-slate-400">
            No attractions match "{searchQuery}". Try searching for historical spots, mountains, or malls.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSpots.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              onFocusOnMap={handleFocusSpot}
              onSelectJeepneyRoute={onSelectJeepneyRoute}
            />
          ))}
        </div>
      )}
    </div>
  );
}
