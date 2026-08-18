import React from 'react';
import { MapPin, Clock, Ticket, Bus, Navigation } from 'lucide-react';

const CATEGORY_COLORS = {
  Historical: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  Nature: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Landmark: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  Culture: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  Shopping: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Urban: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  Education: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  Cultural: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

export default function SpotCard({ spot, onFocusOnMap, onSelectJeepneyRoute }) {
  const catColor = CATEGORY_COLORS[spot.category] || 'bg-white/10 text-slate-300 border-white/20';

  return (
    <div className="glass-card flex flex-col justify-between rounded-3xl p-5 transition-all hover:border-[#ff4757]/40">
      <div>
        {/* Card Header: Name & Category */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">{spot.name}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-[#ff4757] flex-shrink-0" />
              <span>{spot.address}</span>
            </p>
          </div>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${catColor}`}
          >
            {spot.category}
          </span>
        </div>

        {/* Description */}
        <p className="mt-3 text-xs leading-relaxed text-slate-300">
          {spot.description}
        </p>

        {/* Meta Info Badges (Hours & Entrance) */}
        <div className="mt-3.5 flex flex-wrap gap-2 text-[11px]">
          {spot.hours && (
            <span className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 font-medium text-slate-300">
              <Clock className="h-3 w-3 text-[#ffbe0b]" />
              <span>{spot.hours}</span>
            </span>
          )}
          {spot.entrance && (
            <span className="flex items-center gap-1 rounded-lg border border-[#10b981]/30 bg-[#10b981]/15 px-2.5 py-1 font-semibold text-[#10b981]">
              <Ticket className="h-3 w-3" />
              <span>{spot.entrance}</span>
            </span>
          )}
        </div>

        {/* Jeepney Access Section */}
        {spot.jeepney && spot.jeepney.length > 0 && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#12141c] p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <Bus className="h-3 w-3 text-[#ff4757]" />
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
              <p className="mt-2 text-[11px] leading-snug text-slate-400">
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
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-xs font-semibold text-slate-200 transition hover:border-[#ff4757]/40 hover:bg-[#ff4757]/15 hover:text-white"
        >
          <Navigation className="h-3.5 w-3.5 text-[#ff4757]" />
          <span>View on map</span>
        </button>
      </div>
    </div>
  );
}
