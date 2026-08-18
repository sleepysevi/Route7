import React from 'react';
import { Bus, MessageSquareText, MapPin, PhoneCall, HelpCircle } from 'lucide-react';

const TABS = [
  { id: 'routes', label: 'Routes', icon: Bus },
  { id: 'dict', label: 'Phrases', icon: MessageSquareText },
  { id: 'spots', label: 'Spots', icon: MapPin },
  { id: 'hotlines', label: 'Hotlines', icon: PhoneCall },
];

export default function Navbar({ currentTab, onTabChange, onOpenAbout }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0c0e14]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Header */}
        <div
          onClick={() => onTabChange('routes')}
          className="flex cursor-pointer items-center gap-2.5 transition hover:opacity-90"
        >
          <div>
            <div className="font-['Syne',sans-serif] text-lg font-extrabold tracking-tight text-white sm:text-xl">
              Route<span className="text-[#ffbe0b]">7</span>
            </div>
            <div className="hidden text-[10px] font-semibold uppercase tracking-[1.5px] text-slate-400 sm:block">
              Sugbu Buddy
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1 shadow-inner">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all sm:px-4 sm:text-sm ${
                  isActive
                    ? 'bg-[#ff4757] text-white shadow-[0_4px_12px_rgba(255,71,87,0.35)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Help / Guide Trigger */}
        <button
          type="button"
          onClick={onOpenAbout}
          title="Guide & About"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-[#ff4757]/40 hover:bg-[#ff4757]/15 hover:text-white"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
