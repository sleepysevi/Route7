import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';

export default function Toast({ message, type = 'success' }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
      <div className="flex items-center gap-2.5 rounded-full border border-white/15 bg-[#181b24]/95 px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-200">
        {type === 'success' ? (
          <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
        ) : (
          <Info className="h-4 w-4 text-[#ffbe0b]" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
}
