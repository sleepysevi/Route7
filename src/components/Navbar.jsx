import React from 'react';
import { Bus, MessageSquareText, MapPin, PhoneCall } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const TABS = [
  { id: 'routes', label: 'Routes', icon: Bus },
  { id: 'dict', label: 'Phrases', icon: MessageSquareText },
  { id: 'spots', label: 'Spots', icon: MapPin },
  { id: 'hotlines', label: 'Hotlines', icon: PhoneCall },
];

export default function Navbar({ currentTab, onTabChange }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur-md dark:bg-[#0c0e14]/90">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl justify-center px-2 py-3 sm:px-6">
        <div className="flex w-full min-w-0 items-center gap-1 rounded-2xl border border-line bg-chip p-1 shadow-inner sm:w-auto">
          <nav className="flex min-w-0 flex-1 items-center gap-1 sm:flex-none">
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
                      ? 'bg-active-plate text-active-ink'
                      : 'text-muted hover:bg-hover-soft hover:text-ink'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
          <div aria-hidden="true" className="mx-0.5 h-4 w-px bg-line" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
