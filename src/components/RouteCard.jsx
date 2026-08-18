import React, { useState } from 'react';
import { ChevronDown, Map, Navigation, CheckCircle } from 'lucide-react';
import { ROUTE_COORDS } from '../../data/route-coords.js';

export default function RouteCard({
  route,
  isSelected,
  onSelectRoute,
  layout = 'list',
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasMapCoords = !!ROUTE_COORDS[route.code];
  const stops = route.stops || [];
  const stopCount = stops.length;

  const handleCardClick = () => {
    onSelectRoute(route);
  };

  const handleToggleStops = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`glass-card cursor-pointer rounded-2xl p-4 transition-all duration-200 ${
        isSelected
          ? 'border-[#ff4757] bg-[#1d212d] shadow-[0_0_20px_rgba(255,71,87,0.25)] ring-1 ring-[#ff4757]'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Route Code Badge */}
          <span className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#ff4757] to-[#e84152] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_2px_10px_rgba(255,71,87,0.3)]">
            {route.code}
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            {route.group || 'Cebu'}
          </span>
        </div>

        {/* Map availability pill */}
        {hasMapCoords && (
          <span
            title="Interactive map available"
            className="flex items-center gap-1 rounded-full bg-[#10b981]/15 px-2 py-0.5 text-[10px] font-semibold text-[#10b981]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
            Map
          </span>
        )}
      </div>

      {/* Route Name & Destination */}
      <div className="mt-3">
        <h3 className="text-base font-bold text-white group-hover:text-[#ff4757]">
          {route.route}
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">via</span> {route.via}
        </p>
      </div>

      {/* Action Footer: Stops trigger & Map View trigger */}
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        {stopCount > 0 ? (
          <button
            type="button"
            onClick={handleToggleStops}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <span>{stopCount} stops</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isExpanded ? 'rotate-180 text-[#ff4757]' : ''
              }`}
            />
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={handleCardClick}
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
            isSelected
              ? 'bg-[#ff4757]/20 text-[#ff4757]'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
          }`}
        >
          <Navigation className="h-3 w-3" />
          <span>{isSelected ? 'Viewing' : 'View map'}</span>
        </button>
      </div>

      {/* Collapsible Stops Timeline */}
      {isExpanded && stopCount > 0 && (
        <div className="mt-3 rounded-xl border border-white/10 bg-[#10121a] p-3 text-xs">
          <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Route Stops Timeline ({stopCount} stations)
          </div>
          <div className="space-y-1.5">
            {stops.map((stop, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === stopCount - 1;
              const dotColor = isFirst
                ? 'bg-[#10b981]'
                : isLast
                ? 'bg-[#ff4757]'
                : 'bg-slate-600';

              return (
                <div key={`${route.code}-${stop}-${idx}`} className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center pt-1">
                    <div className={`h-2.5 w-2.5 rounded-full ${dotColor} flex-shrink-0`} />
                    {!isLast && <div className="h-4 w-[2px] bg-slate-700/60" />}
                  </div>
                  <div className="flex flex-1 items-center justify-between pb-1">
                    <span
                      className={`text-xs ${
                        isFirst || isLast ? 'font-bold text-white' : 'text-slate-300'
                      }`}
                    >
                      {stop}
                    </span>
                    {isFirst && (
                      <span className="rounded bg-[#10b981]/20 px-1.5 py-0.5 text-[9px] font-extrabold text-[#10b981]">
                        START
                      </span>
                    )}
                    {isLast && (
                      <span className="rounded bg-[#ff4757]/20 px-1.5 py-0.5 text-[9px] font-extrabold text-[#ff4757]">
                        END
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
