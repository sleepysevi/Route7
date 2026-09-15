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
      { name: 'Cebu City Emergency', dept: 'General Emergency Line', number: '911' },
      { name: 'Cebu City Disaster Office', dept: 'CDRRMO — Command Center', number: '(032) 261-8888' },
    ],
  },
  {
    group: 'Police & Safety',
    icon: Shield,
    entries: [
      { name: 'Cebu City Police', dept: 'CCPO — Headquarters', number: '(032) 416-0033' },
      { name: 'Police Emergency', dept: 'Philippine National Police', number: '117' },
      { name: 'NBI Cebu', dept: 'National Bureau of Investigation', number: '(032) 231-1600' },
    ],
  },
  {
    group: 'Fire & Rescue',
    icon: Flame,
    entries: [
      { name: 'Bureau of Fire Protection', dept: 'Cebu City BFP — Station 1', number: '(032) 346-3400' },
      { name: 'Fire Emergency', dept: 'BFP National Hotline', number: '160' },
    ],
  },
  {
    group: 'Medical & Hospitals',
    icon: HeartPulse,
    entries: [
      { name: 'Vicente Sotto Memorial', dept: 'VSMMC — Apex Government Hospital', number: '(032) 253-9891' },
      { name: 'Chong Hua Hospital', dept: 'Fuente Osmeña Campus', number: '(032) 255-8000' },
      { name: "Cebu Doctors' University Hospital", dept: 'Gov. M. Roa St.', number: '(032) 253-7511' },
      { name: 'Red Cross Cebu', dept: 'Philippine Red Cross Chapter', number: '(032) 253-0037' },
    ],
  },
  {
    group: 'Transport & Traffic',
    icon: Truck,
    entries: [
      { name: 'CCTO', dept: 'Cebu City Traffic Operations', number: '(032) 255-1400' },
      { name: 'LTO Cebu', dept: 'Land Transportation Office', number: '(032) 239-5719' },
      { name: 'LTFRB Region 7', dept: 'Franchising & Regulatory Board', number: '(032) 412-6100' },
    ],
  },
  {
    group: 'Utilities',
    icon: Zap,
    entries: [
      { name: 'MCWD', dept: 'Metro Cebu Water District', number: '(032) 239-6339' },
      { name: 'VECO / Visayan Electric', dept: 'Electricity Emergency Line', number: '(032) 230-8326' },
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
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary-ink">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Cebu Emergency Hotlines</h2>
              <p className="text-muted">
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
              className="w-full rounded-xl border border-line bg-inset py-2 pl-9 pr-8 text-xs text-ink placeholder:text-dim focus:border-primary focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hotline Categories */}
      {filteredGroups.length === 0 ? (
        <div className="glass-panel rounded-3xl p-8 text-center text-muted">
          <p className="text-sm">No hotlines found for "{searchQuery}"</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => {
            const GroupIcon = group.icon;
            const isEmergencyGroup = group.group === 'Emergency';

            return (
              <div key={group.group} className="space-y-3">
                {/* Category Section Header */}
                <div className="flex items-center gap-2 px-1">
                  <GroupIcon className="h-4 w-4 text-accent-ink" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-soft">
                    {group.group}
                  </h3>
                  <span className="text-[11px] text-dim">
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
                        aria-label={`Call ${entry.name} at ${entry.number}`}
                        className="glass-card group flex items-center justify-between rounded-2xl p-3.5 transition-all hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <div className="flex items-center gap-3">
                          {/* Agency Icon Container */}
                          <div
                            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${
                              isEmergencyGroup ? 'bg-primary/15' : 'bg-chip'
                            }`}
                          >
                            <PhoneCall
                              className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                                isEmergencyGroup ? 'text-primary-ink' : 'text-muted'
                              }`}
                            />
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-bold text-ink group-hover:text-primary-ink">
                              {entry.name}
                            </h4>
                            <p className="truncate text-xs text-muted">
                              {entry.dept}
                            </p>
                          </div>
                        </div>

                        {/* Phone Number */}
                        <div className="ml-2 flex flex-col items-end flex-shrink-0">
                          <span className="text-xs font-bold tabular-nums tracking-tight text-ink transition group-hover:text-primary-ink">
                            {entry.number}
                          </span>
                          <span className="mt-0.5 text-[9px] text-dim group-hover:text-accent-ink">
                            Tap to call
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
