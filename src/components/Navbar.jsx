import React from 'react';
import { Bus, MessageSquareText, MapPin, PhoneCall } from 'lucide-react';

const TABS = [
  { id: 'routes', label: 'Routes', icon: Bus },
  { id: 'dict', label: 'Phrases', icon: MessageSquareText },
  { id: 'spots', label: 'Spots', icon: MapPin },
  { id: 'hotlines', label: 'Hotlines', icon: PhoneCall },
];

export default function Navbar({ currentTab, onTabChange }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0c0e14]/90 backdrop-blur-md">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl justify-center px-2 py-3 sm:px-6">
        <nav className="flex w-full min-w-0 items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1 shadow-inner sm:w-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-semibold transition-all sm:px-4 sm:text-sm ${
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

      </div>
    </header>
  );
}
