import React from 'react';
import { MapPin, Clock, Ticket, Bus, Navigation } from 'lucide-react';

export default function SpotCard({ spot, onFocusOnMap, onSelectJeepneyRoute }) {
  return (
    <div className="glass-card flex min-w-0 flex-col justify-between rounded-3xl p-5 transition-all hover:border-primary/40">
      <div>
        {/* Card Header: Name & Category */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="break-words text-lg font-bold text-ink">{spot.name}</h3>
            <p className="mt-0.5 flex items-start gap-1 break-words text-xs text-muted">
              <MapPin className="h-3.5 w-3.5 text-primary-ink flex-shrink-0" />
              <span>{spot.address}</span>
            </p>
          </div>
          <span
            className="max-w-[45%] shrink-0 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-dim"
          >
            {spot.category}
          </span>
        </div>

        {/* Description */}
        <p className="mt-3 break-words text-xs leading-relaxed text-soft">
          {spot.description}
        </p>

        {/* Meta Info Badges (Hours & Entrance) */}
        <div className="mt-3.5 flex flex-wrap gap-2 text-[11px]">
          {spot.hours && (
            <span className="flex items-center gap-1 rounded-lg border border-line bg-wash px-2.5 py-1 font-medium text-soft">
              <Clock className="h-3 w-3 text-accent-ink" />
              <span>{spot.hours}</span>
            </span>
          )}
          {spot.entrance && (
            <span className="flex items-center gap-1 rounded-lg border border-green/30 bg-green/15 px-2.5 py-1 font-semibold text-green-ink">
              <Ticket className="h-3 w-3" />
              <span>{spot.entrance}</span>
            </span>
          )}
        </div>

        {/* Jeepney Access Section */}
        {spot.jeepney && spot.jeepney.length > 0 && (
          <div className="mt-4 rounded-2xl border border-line bg-inset p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
              <Bus className="h-3 w-3 text-primary-ink" />
              <span>Jeepney Access Routes</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {spot.jeepney.map((code) => (
                <button
                  key={`${spot.id}-${code}`}
                  type="button"
                  onClick={() => onSelectJeepneyRoute && onSelectJeepneyRoute(code)}
                  title={`View route ${code}`}
                  className="rounded-lg bg-gradient-to-r from-[#ff4757] to-[#e84152] px-2 py-0.5 text-[11px] font-extrabold text-white shadow transition hover:scale-105 active:scale-95"
                >
                  {code}
                </button>
              ))}
            </div>
            {spot.jeepney_tip && (
              <p className="mt-2 text-[11px] leading-snug text-muted">
                <span className="italic">{spot.jeepney_tip}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-2">
        <button
          type="button"
          onClick={() => onFocusOnMap(spot)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-chip py-2 text-xs font-semibold text-soft transition hover:border-primary/40 hover:bg-primary/10 hover:text-ink"
        >
          <Navigation className="h-3.5 w-3.5 text-primary-ink" />
          <span>View on map</span>
        </button>
      </div>
    </div>
  );
}
