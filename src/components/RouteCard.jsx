import React, { useState } from 'react';
import { ChevronDown, Navigation, CheckCircle } from 'lucide-react';

export default function RouteCard({
  route,
  isSelected,
  onSelectRoute,
  layout = 'list',
}) {
  const [isExpanded, setIsExpanded] = useState(false);

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
          ? 'border-primary bg-selected shadow-[0_0_20px_rgba(255,71,87,0.25)] ring-1 ring-primary'
          : 'border-line hover:border-line-strong'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Route Code Badge */}
          <span
            className={`inline-flex items-center justify-center rounded-xl px-3 py-1 text-xs font-extrabold uppercase tracking-wider transition-colors duration-200 ${
              isSelected
                ? 'bg-[#ffbe0b] text-[#0b0c10]'
                : 'bg-gradient-to-r from-[#ff4757] to-[#e84152] text-white'
            }`}
          >
            {route.code}
          </span>
          <span className="text-[11px] font-medium text-muted">
            {route.group || 'Cebu'}
          </span>
        </div>

      </div>

      {/* Route Name & Destination */}
      <div className="mt-3">
        <h3 className="text-base font-bold text-ink group-hover:text-primary-ink">
          {route.route}
        </h3>
        <p className="mt-1 text-xs text-muted">
          <span className="font-semibold text-soft">via</span> {route.via}
        </p>
      </div>

      {/* Action Footer: Stops trigger & Map View trigger */}
      <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-3">
        {stopCount > 0 ? (
          <button
            type="button"
            onClick={handleToggleStops}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-chip px-2.5 py-1 text-xs font-medium text-soft transition hover:bg-hover hover:text-ink"
          >
            <span>{stopCount} stops</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isExpanded ? 'rotate-180 text-primary-ink' : ''
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
              ? 'bg-primary/15 text-primary-ink'
              : 'text-muted hover:bg-hover-soft hover:text-soft'
          }`}
        >
          <Navigation className="h-3 w-3" />
          <span>{isSelected ? 'Viewing' : 'View map'}</span>
        </button>
      </div>

      {/* Collapsible Stops Timeline */}
      {isExpanded && stopCount > 0 && (
        <div className="mt-3 rounded-xl border border-line bg-wash p-3 text-xs">
          <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-muted">
            Route Stops Timeline ({stopCount} stations)
          </div>
          <div className="space-y-1.5">
            {stops.map((stop, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === stopCount - 1;
              const dotColor = isFirst
                ? 'bg-green'
                : isLast
                ? 'bg-primary'
                : 'bg-timeline-dot';

              return (
                <div key={`${route.code}-${stop}-${idx}`} className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center pt-1">
                    <div className={`h-2.5 w-2.5 rounded-full ${dotColor} flex-shrink-0`} />
                    {!isLast && <div className="h-4 w-[2px] bg-connector" />}
                  </div>
                  <div className="flex flex-1 items-center justify-between pb-1">
                    <span
                      className={`text-xs ${
                        isFirst || isLast ? 'font-bold text-ink' : 'text-soft'
                      }`}
                    >
                      {stop}
                    </span>
                    {isFirst && (
                      <span className="rounded bg-green/20 px-1.5 py-0.5 text-[9px] font-extrabold text-green-ink">
                        START
                      </span>
                    )}
                    {isLast && (
                      <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-extrabold text-primary-ink">
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
