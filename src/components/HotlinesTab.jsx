import React, { useState, useMemo } from 'react';
import {
  PhoneCall,
  Search,
  X,
  ShieldAlert,
  Shield,
  Flame,
  HeartPulse,
  Truck,
  Zap,
} from 'lucide-react';

const HOTLINES_DATA = [
  {
    group: 'Emergency',
    icon: ShieldAlert,
    entries: [
      { name: 'Cebu City Emergency', dept: 'General Emergency Line', number: '911', color: '#ff4757', bg: 'rgba(255, 71, 87, 0.15)' },
      { name: 'Cebu City Disaster Office', dept: 'CDRRMO — Command Center', number: '(032) 261-8888', color: '#ff4757', bg: 'rgba(255, 71, 87, 0.15)' },
    ],
  },
  {
    group: 'Police & Safety',
    icon: Shield,
    entries: [
      { name: 'Cebu City Police', dept: 'CCPO — Headquarters', number: '(032) 416-0033', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
      { name: 'Police Emergency', dept: 'Philippine National Police', number: '117', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
      { name: 'NBI Cebu', dept: 'National Bureau of Investigation', number: '(032) 231-1600', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
    ],
  },
  {
    group: 'Fire & Rescue',
    icon: Flame,
    entries: [
      { name: 'Bureau of Fire Protection', dept: 'Cebu City BFP — Station 1', number: '(032) 346-3400', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
      { name: 'Fire Emergency', dept: 'BFP National Hotline', number: '160', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
    ],
  },
  {
    group: 'Medical & Hospitals',
    icon: HeartPulse,
    entries: [
      { name: 'Vicente Sotto Memorial', dept: 'VSMMC — Apex Government Hospital', number: '(032) 253-9891', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
      { name: 'Chong Hua Hospital', dept: 'Fuente Osmeña Campus', number: '(032) 255-8000', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
      { name: "Cebu Doctors' University Hospital", dept: 'Gov. M. Roa St.', number: '(032) 253-7511', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
      { name: 'Red Cross Cebu', dept: 'Philippine Red Cross Chapter', number: '(032) 253-0037', color: '#ff4757', bg: 'rgba(255, 71, 87, 0.15)' },
    ],
  },
  {
    group: 'Transport & Traffic',
    icon: Truck,
    entries: [
      { name: 'CCTO', dept: 'Cebu City Traffic Operations', number: '(032) 255-1400', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
      { name: 'LTO Cebu', dept: 'Land Transportation Office', number: '(032) 239-5719', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
      { name: 'LTFRB Region 7', dept: 'Franchising & Regulatory Board', number: '(032) 412-6100', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
    ],
  },
  {
    group: 'Utilities',
    icon: Zap,
    entries: [
      { name: 'MCWD', dept: 'Metro Cebu Water District', number: '(032) 239-6339', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)' },
      { name: 'VECO / Visayan Electric', dept: 'Electricity Emergency Line', number: '(032) 230-8326', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    ],
  },
];

export default function HotlinesTab() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return HOTLINES_DATA;

    return HOTLINES_DATA.map((group) => {
      const matchingEntries = group.entries.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.dept.toLowerCase().includes(q) ||
          e.number.toLowerCase().includes(q) ||
          group.group.toLowerCase().includes(q)
      );
      return { ...group, entries: matchingEntries };
    }).filter((group) => group.entries.length > 0);
  }, [searchQuery]);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-5 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff4757]/15 text-[#ff4757]">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cebu Emergency Hotlines</h2>
              <p className="text-xs text-slate-400">
                Direct one-tap contact lines for emergency response, police, rescue, hospitals & traffic
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ff4757]" />
            <input
              type="text"
              placeholder="Search hotlines, hospital, police..."
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
      </div>

      {/* Hotline Categories */}
      {filteredGroups.length === 0 ? (
        <div className="glass-panel rounded-3xl p-8 text-center text-slate-400">
          <p className="text-sm">No hotlines found for "{searchQuery}"</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => {
            const GroupIcon = group.icon;

            return (
              <div key={group.group} className="space-y-3">
                {/* Category Section Header */}
                <div className="flex items-center gap-2 px-1">
                  <GroupIcon className="h-4 w-4 text-[#ffbe0b]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {group.group}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    ({group.entries.length})
                  </span>
                </div>

                {/* Hotline Contact Cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.entries.map((entry) => {
                    const cleanPhone = entry.number.replace(/[^0-9+]/g, '');

                    return (
                      <a
                        key={`${entry.name}-${entry.number}`}
                        href={`tel:${cleanPhone}`}
                        className="glass-card group flex items-center justify-between rounded-2xl p-3.5 transition-all hover:border-[#ff4757]/40"
                      >
                        <div className="flex items-center gap-3">
                          {/* Agency Icon Container */}
                          <div
                            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
                            style={{ backgroundColor: entry.bg }}
                          >
                            <PhoneCall
                              className="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
                              style={{ color: entry.color }}
                            />
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-bold text-white group-hover:text-[#ff4757]">
                              {entry.name}
                            </h4>
                            <p className="truncate text-xs text-slate-400">
                              {entry.dept}
                            </p>
                          </div>
                        </div>

                        {/* Phone Number Badge */}
                        <div className="ml-2 flex-shrink-0 text-right">
                          <span className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-extrabold text-white transition group-hover:border-[#ff4757]/40 group-hover:bg-[#ff4757]/15 group-hover:text-[#ff4757]">
                            {entry.number}
                          </span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
