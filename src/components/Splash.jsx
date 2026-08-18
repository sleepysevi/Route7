import React, { useEffect, useRef, useState } from 'react';
import { Search, Compass, Sparkles } from 'lucide-react';

const QUICK_TAGS = [
  'SM City',
  'Ayala',
  'IT Park',
  'Colon',
  'Carbon',
  'Lahug',
  'Talamban',
  'Mandaue',
  'Bulacao',
  'Naga',
];

export default function Splash({ onEnter }) {
  const [query, setQuery] = useState('');
  const [isExiting, setIsExiting] = useState(false);
  const inputRef = useRef(null);

  const handleStart = (searchQuery = '') => {
    setIsExiting(true);
    setTimeout(() => {
      onEnter(searchQuery);
    }, 400);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        e.key.length === 1 &&
        document.activeElement !== inputRef.current
      ) {
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      id="splash"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#0a0c10] px-4 text-white transition-opacity duration-300 ${
        isExiting ? 'splash-exit-anim' : ''
      }`}
    >
      {/* Dynamic ambient background glow rings */}
      <div className="deco-pulse pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full border border-[#ff4757]/20 bg-[radial-gradient(circle,_rgba(255,71,87,0.15),_transparent_70%)] blur-2xl" />
      <div
        className="deco-pulse pointer-events-none absolute -left-20 top-20 h-[300px] w-[300px] rounded-full border border-[#ffbe0b]/15 bg-[radial-gradient(circle,_rgba(255,190,11,0.1),_transparent_70%)] blur-2xl"
        style={{ animationDelay: '0.8s' }}
      />
      <div
        className="deco-pulse pointer-events-none absolute bottom-24 right-10 h-[240px] w-[240px] rounded-full border border-[#ff4757]/15 bg-[radial-gradient(circle,_rgba(255,71,87,0.1),_transparent_70%)] blur-2xl"
        style={{ animationDelay: '1.4s' }}
      />

      {/* Floating Jeepney Icon Illustration */}
      <div className="jeep-float relative z-10 mb-6 drop-shadow-[0_15px_25px_rgba(255,71,87,0.25)]">
        <svg width="200" height="110" viewBox="0 0 160 90" fill="none" className="splash-enter-down">
          {/* Jeepney Body */}
          <rect x="10" y="28" width="140" height="42" rx="10" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <rect x="10" y="28" width="38" height="42" rx="10" fill="rgba(255,71,87,0.4)" />
          {/* Front Windshield */}
          <rect x="14" y="32" width="30" height="24" rx="6" fill="rgba(255,255,255,0.6)" />
          {/* Passenger Windows */}
          <rect x="54" y="33" width="20" height="18" rx="4" fill="rgba(255,255,255,0.45)" />
          <rect x="78" y="33" width="20" height="18" rx="4" fill="rgba(255,255,255,0.45)" />
          <rect x="102" y="33" width="20" height="18" rx="4" fill="rgba(255,255,255,0.45)" />
          <rect x="126" y="33" width="18" height="18" rx="4" fill="rgba(255,255,255,0.45)" />
          {/* Racing Stripe */}
          <rect x="10" y="55" width="140" height="6" rx="1" fill="#ffbe0b" />
          {/* Roof Rail */}
          <rect x="24" y="18" width="116" height="10" rx="5" fill="rgba(255,255,255,0.18)" />
          <rect x="38" y="12" width="10" height="8" rx="3" fill="rgba(255,255,255,0.3)" />
          <rect x="58" y="12" width="10" height="8" rx="3" fill="rgba(255,255,255,0.3)" />
          {/* Front & Rear Wheels */}
          <circle cx="36" cy="70" r="12" fill="#12141a" stroke="#475569" strokeWidth="2.5" />
          <circle cx="36" cy="70" r="6" fill="#94a3b8" />
          <circle cx="124" cy="70" r="12" fill="#12141a" stroke="#475569" strokeWidth="2.5" />
          <circle cx="124" cy="70" r="6" fill="#94a3b8" />
          {/* Headlight Glow */}
          <circle cx="12" cy="44" r="5" fill="#ffbe0b" />
        </svg>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex w-full max-w-[460px] flex-col items-center gap-4 text-center">
        {/* Sugbu Buddy Tag */}
        <div className="splash-enter-down inline-flex items-center gap-1.5 rounded-full border border-[#ff4757]/30 bg-[#ff4757]/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[2.5px] text-[#ff4757] shadow-[0_0_15px_rgba(255,71,87,0.2)]">
          <Sparkles className="h-3 w-3" />
          Sugbu Buddy
        </div>

        {/* Title */}
        <h1 className="splash-enter-up font-['Syne',sans-serif] text-[clamp(52px,14vw,84px)] font-extrabold leading-[0.9] tracking-[-3px] text-white">
          Route<span className="text-[#ffbe0b] drop-shadow-[0_0_20px_rgba(255,190,11,0.5)]">7</span>
        </h1>

        <p className="splash-enter-up text-[15px] font-medium text-[#94a3b8]">
          Find your way around Cebu City with ease
        </p>
        <p className="splash-enter-up text-[12px] text-slate-500">
          A passion project by <span className="font-semibold text-slate-400">sleepysevi</span>
        </p>

        {/* Search Input Box */}
        <div className="splash-enter-up relative mt-2 w-full">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#ff4757]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Where to? Try SM, Ayala, IT Park, Colon..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleStart(query.trim());
            }}
            className="w-full rounded-2xl border border-white/10 bg-[#14161f]/90 py-3.5 pl-12 pr-4 text-sm font-medium text-white shadow-[0_10px_35px_rgba(0,0,0,0.5)] backdrop-blur-md transition placeholder:text-slate-500 focus:border-[#ff4757] focus:bg-[#181b26] focus:shadow-[0_0_0_3px_rgba(255,71,87,0.25)] focus:outline-none"
          />
        </div>

        {/* Quick Tag Pills */}
        <div className="splash-enter-up flex flex-wrap justify-center gap-1.5 pt-1">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleStart(tag)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur-sm transition hover:border-[#ff4757]/40 hover:bg-[#ff4757]/15 hover:text-white active:scale-95"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Explore All Routes CTA Button */}
        <button
          type="button"
          onClick={() => handleStart(query.trim())}
          className="splash-enter-up mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff4757] to-[#e84152] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(255,71,87,0.35)] transition-all hover:scale-105 hover:shadow-[0_12px_30px_rgba(255,71,87,0.5)] active:scale-95"
        >
          <Compass className="h-4 w-4" />
          Explore all routes
        </button>
      </div>

      {/* Moving road dash footer */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-0 flex justify-center opacity-60">
        <div className="relative h-2 w-[75%] max-w-[500px] overflow-hidden rounded-full bg-[#181b24]">
          <div className="road-scroll flex items-center gap-3">
            {[...Array(24)].map((_, i) => (
              <div
                key={i}
                className="h-1 w-6 flex-shrink-0 rounded-full bg-[#ffbe0b]/80"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
