import React, { useState, useMemo } from 'react';
import { Search, Copy, Check, Sparkles, MessageSquareText, X } from 'lucide-react';

function matchKeywords(kw, query) {
  return String(kw || '').toLowerCase().includes(query);
}

export default function DictTab({ dictionary, onToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPhrase, setCopiedPhrase] = useState(null);

  const filteredDictionary = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return dictionary;
    return dictionary.filter(
      (item) =>
        item.phrase.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        matchKeywords(item.keywords, q)
    );
  }, [dictionary, searchQuery]);

  const handleCopy = async (phrase) => {
    try {
      await navigator.clipboard.writeText(phrase);
      setCopiedPhrase(phrase);
      onToast(`Copied "${phrase}" to clipboard!`);
      setTimeout(() => setCopiedPhrase(null), 2000);
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Info Banner */}
      <div className="glass-panel rounded-3xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-base font-bold text-white">Bisaya Commuter Phrases</h2>
            <p className="text-xs text-slate-400">
              Essential everyday Cebuano words & phrases for riding public transport
            </p>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ff4757]" />
          <input
            type="text"
            placeholder="Search phrases (e.g. Lugar lang, plete, asa, pila)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#12141c] py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-[#ff4757] focus:outline-none focus:ring-1 focus:ring-[#ff4757]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Phrases Count */}
      <div className="px-1 text-xs text-slate-400">
        Found <strong className="text-white">{filteredDictionary.length}</strong> phrases
      </div>

      {/* Phrase Cards Grid */}
      {filteredDictionary.length === 0 ? (
        <div className="glass-panel rounded-3xl p-8 text-center text-slate-400">
          <p className="text-sm">No phrases matching "{searchQuery}"</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-3 text-xs font-semibold text-[#ff4757] hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDictionary.map((item, idx) => {
            const isCopied = copiedPhrase === item.phrase;

            return (
              <div
                key={`${item.phrase}-${idx}`}
                onClick={() => handleCopy(item.phrase)}
                className="glass-card group flex cursor-pointer flex-col justify-between rounded-2xl p-4 transition-all hover:border-[#ff4757]/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-white transition group-hover:text-[#ff4757]">
                      "{item.phrase}"
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(item.phrase);
                      }}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                        isCopied
                          ? 'border-[#10b981] bg-[#10b981]/20 text-[#10b981]'
                          : 'border-white/10 bg-white/[0.04] text-slate-400 group-hover:border-[#ff4757]/40 group-hover:text-white'
                      }`}
                      title="Copy phrase"
                    >
                      {isCopied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    {item.meaning}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-slate-400">
                  <span>{item.category || 'Commute'}</span>
                  <span className={isCopied ? 'font-bold text-[#10b981]' : 'group-hover:text-[#ff4757]'}>
                    {isCopied ? 'Copied!' : 'Tap to copy'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
