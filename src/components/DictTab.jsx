import React, { useState, useMemo } from 'react';
import { Search, Copy, Check, Sparkles, MessageSquareText, X } from 'lucide-react';

function matchKeywords(kw, query) {
  return String(kw || '').toLowerCase().includes(query);
}

function inferCategory(phrase, meaning, kw) {
  const text = `${phrase} ${meaning} ${kw}`.toLowerCase();
  if (text.includes('stop') || text.includes('pull over') || text.includes('lugar') || text.includes('getting off') || text.includes('turn')) {
    return { name: 'Alighting' };
  }
  if (text.includes('fare') || text.includes('pay') || text.includes('plete') || text.includes('change') || text.includes('sukli')) {
    return { name: 'Fare & Pay' };
  }
  if (text.includes('where') || text.includes('asa') || text.includes('route') || text.includes('go') || text.includes('pass')) {
    return { name: 'Directions' };
  }
  return { name: 'Everyday' };
}

const CATEGORIES = ['All', 'Alighting', 'Fare & Pay', 'Directions', 'Everyday'];

export default function DictTab({ dictionary, onToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedPhrase, setCopiedPhrase] = useState(null);

  const filteredDictionary = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return dictionary.filter((item) => {
      const cat = inferCategory(item.phrase, item.meaning, item.keywords).name;
      if (selectedCategory !== 'All' && cat !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.phrase.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q) ||
        matchKeywords(item.keywords, q)
      );
    });
  }, [dictionary, searchQuery, selectedCategory]);

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
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent-ink">
            <MessageSquareText className="h-5 w-5" />
          </div>
          <div>
          <h2 className="text-base font-bold text-ink">Bisaya Commuter Phrases</h2>
          <p className="text-xs text-muted">
              Essential everyday Cebuano words & phrases for riding public transport like a local
            </p>
          </div>
        </div>

        {/* Local Commuter Culture Callout */}
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-accent/25 bg-accent/5 p-3 text-xs text-soft">
          <Sparkles className="h-4 w-4 flex-shrink-0 text-accent-ink mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-accent-ink">Commuter Tip:</strong> When approaching your stop, shout{' '}
            <strong className="text-ink">"Lugar lang!"</strong> or{' '}
            <strong className="text-ink">"Diri lang!"</strong> loudly, or tap a coin on the ceiling stainless grab rail so the driver can hear above traffic.
          </p>
        </div>

        {/* Search Box */}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ff4757]" />
          <input
            type="text"
            placeholder="Search phrases (e.g. Lugar lang, plete, asa, pila)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-line bg-inset py-2.5 pl-10 pr-10 text-sm text-ink placeholder:text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="mt-3 flex flex-wrap gap-1.5 pt-1">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors rounded-lg ${
                  isActive
                    ? 'bg-active-plate text-active-ink'
                    : 'text-dim hover:bg-hover-soft hover:text-soft'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Phrases Count */}
      <div className="flex items-center justify-between px-1 text-xs text-muted">
        <span>
          Found <strong className="text-ink">{filteredDictionary.length}</strong> phrases
        </span>
        {selectedCategory !== 'All' && (
          <span className="text-dim">Filtered by {selectedCategory}</span>
        )}
      </div>

      {/* Phrase Cards Grid */}
      {filteredDictionary.length === 0 ? (
        <div className="glass-panel rounded-3xl p-8 text-center text-muted">
          <p className="text-sm">No phrases matching "{searchQuery}"</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-3 text-xs font-semibold text-primary-ink hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDictionary.map((item, idx) => {
            const isCopied = copiedPhrase === item.phrase;
            const categoryInfo = inferCategory(item.phrase, item.meaning, item.keywords);

            return (
              <div
                key={`${item.phrase}-${idx}`}
                onClick={() => handleCopy(item.phrase)}
                className="glass-card group flex cursor-pointer flex-col justify-between rounded-2xl p-4 transition-all hover:border-[#ff4757]/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-ink transition group-hover:text-primary-ink">
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
                          ? 'border-green bg-green/20 text-green-ink'
                          : 'border-line bg-chip text-muted group-hover:border-primary/40 group-hover:text-ink'
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
                  <p className="mt-2 text-xs leading-relaxed text-soft">
                    {item.meaning}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-line-soft pt-2 text-[10px] text-muted">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                    {categoryInfo.name}
                  </span>
                  <span className={isCopied ? 'font-bold text-green-ink' : 'group-hover:text-primary-ink'}>
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
