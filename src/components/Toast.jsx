import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';

export default function Toast({ message, type = 'success' }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
      <div className="flex items-center gap-2.5 rounded-full border border-line-strong bg-raised px-4 py-2.5 text-sm font-medium text-ink shadow-toast backdrop-blur-md transition-all duration-200">
        {type === 'success' ? (
          <CheckCircle2 className="h-4 w-4 text-green-ink" />
        ) : (
          <Info className="h-4 w-4 text-accent-ink" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
}
