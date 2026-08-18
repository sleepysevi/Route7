import React, { useEffect } from 'react';
import { X, HelpCircle, Bus, Heart, Sparkles, BookOpen, CreditCard } from 'lucide-react';

export default function AboutModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/15 bg-[#14161f] p-6 text-white shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff4757]/15 text-[#ff4757]">
            <Bus className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-['Syne',sans-serif] text-xl font-bold">
              About Route<span className="text-[#ffbe0b]">7</span>
            </h2>
            <p className="text-xs text-slate-400">Sugbu Buddy • Cebu Transit & Commuter Guide</p>
          </div>
        </div>

        {/* Modal Sections */}
        <div className="mt-6 space-y-5 text-sm text-slate-300">
          {/* Section 1: Intro */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="leading-relaxed">
              <strong className="text-white">Route7</strong> is a modern, fast, and interactive transit companion designed to help locals, students, and tourists navigate Cebu City and Metro Cebu’s jeepney routes with confidence.
            </p>
          </div>

          {/* Section 2: Commuter Etiquette */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-white">
              <BookOpen className="h-4 w-4 text-[#ffbe0b]" />
              <h3>Cebu Jeepney Commuter Tips</h3>
            </div>
            <ul className="space-y-2 text-xs leading-relaxed text-slate-300">
              <li className="flex items-start gap-2">
                <span className="rounded bg-[#ff4757]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#ff4757]">1</span>
                <span><strong>Paying your fare:</strong> Pass your money to the passenger next to you saying <em>"Palihug ko sa plete"</em> (Please pass my fare). Mention your destination and if you're a student/senior/PWD.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="rounded bg-[#ff4757]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#ff4757]">2</span>
                <span><strong>Getting off:</strong> When approaching your stop, announce <em>"Lugar lang!"</em> or <em>"Sa eskina lang palihug"</em> clearly so the driver can pull over safely.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="rounded bg-[#ff4757]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#ff4757]">3</span>
                <span><strong>Route Codes:</strong> Cebu jeepneys use 2 to 4 character route codes on their windshields and sides (e.g. <code>04L</code>, <code>13C</code>, <code>62B</code>). Check the map and stops list to confirm your route.</span>
              </li>
            </ul>
          </div>

          {/* Section 3: Credits */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4 text-xs">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Heart className="h-4 w-4 text-[#ff4757]" />
              <span>Created with care</span>
            </div>
            <p className="mt-1 text-slate-400">
              Developed by <strong className="text-white">sleepysevi</strong> as a community transit guide for Sugbuanons and visitors of the Queen City of the South.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#ff4757] py-2.5 text-center text-sm font-semibold text-white shadow-lg transition hover:bg-[#ff2e43]"
          >
            Got it, let's explore!
          </button>
        </div>
      </div>
    </div>
  );
}
