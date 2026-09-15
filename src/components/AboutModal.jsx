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
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-solid p-6 text-ink shadow-float">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-line bg-chip p-2 text-muted transition hover:bg-hover hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary-ink">
            <Bus className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-['Syne',sans-serif] text-xl font-bold">
              About Route<span className="text-[#ffbe0b]">7</span> 
            </h2>
            <p className="text-xs text-muted">Sugbu Buddy • Cebu Commuting & Spots Guide</p>
          </div>
        </div>

        {/* Modal Sections */}
        <div className="mt-6 space-y-5 text-sm text-soft">
          {/* Section 1: Intro */}
          <div className="rounded-2xl border border-line bg-wash p-4">
            <p className="leading-relaxed">
              <strong className="text-ink">Route7</strong> is a modern, fast, and interactive transit companion designed to help locals, students, and tourists navigate Cebu City and Metro Cebu’s jeepney routes with ease.
            </p>
          </div>

          {/* Section 2: Commuter Etiquette */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <h3>Cebu Commuting Tips</h3>
            </div>
            <ul className="space-y-2 text-xs leading-relaxed text-soft">
              <li className="flex items-start gap-2">
                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary-ink">1</span>
                <span><strong>Paying your fare:</strong> Pass your money to the passenger next to you saying <em>"Palihug ko sa plete"</em>  (Please pass my fare). Mention your destination and if you're a student/senior/PWD.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary-ink">2</span>
                <span><strong>Getting off:</strong> When approaching your stop, announce <em>"Lugar lang!"</em> or <em>"Sa eskina lang palihug"</em> clearly so the driver can pull over safely.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary-ink">3</span>
                <span><strong>Route Codes:</strong> Cebu jeepneys use 2 to 4 character route codes on their windshields and sides (e.g. <code>04L</code>, <code>13C</code>, <code>62B</code>). Check the map and stops list to confirm your route.</span>
              </li>
            </ul>
          </div>

          {/* Section 3: Credits */}
          <div className="rounded-2xl border border-line bg-chip p-4 text-xs">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <span>Created by a commuter, for commuters</span>
            </div>
            <p className="mt-1 text-muted">
              Developed by <strong className="text-ink">sleepysevi</strong> as a community transit guide for Sugbuanons and visitors of the Queen City of the South.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-white shadow-lg transition hover:bg-primary-hover"
          >
            Tara, Laag!
          </button>
        </div>
      </div>
    </div>
  );
}
