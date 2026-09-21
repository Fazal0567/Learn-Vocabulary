import React, { useState, useMemo } from 'react';
import {
  Layers,
  CheckCircle,
  Star,
  Heart,
  AlertTriangle,
  Play,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { RevisionFilter, WordItem } from '../types';
import { filterVocabulary } from '../utils/vocabularyUtils';

interface RevisionProps {
  learnedIds: number[];
  favoriteIds: number[];
  importantIds: number[];
  difficultIds: number[];
  onStartRevision: (filter: RevisionFilter, wordId?: number) => void;
  allWords?: WordItem[];
}

export const Revision: React.FC<RevisionProps> = ({
  learnedIds,
  favoriteIds,
  importantIds,
  difficultIds,
  onStartRevision,
  allWords,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<RevisionFilter>('unlearned');

  const total = allWords?.length || 1000;
  const counts = {
    all: total,
    unlearned: Math.max(0, total - learnedIds.length),
    important: importantIds.length,
    favorites: favoriteIds.length,
    difficult: difficultIds.length,
  };

  const previewWords = useMemo(() => {
    return filterVocabulary(selectedFilter, learnedIds, favoriteIds, importantIds, difficultIds, allWords);
  }, [selectedFilter, learnedIds, favoriteIds, importantIds, difficultIds, allWords]);

  const filterCards = [
    {
      id: 'all' as RevisionFilter,
      label: `All ${total} Words`,
      desc: 'Full vocabulary repository with meanings and synonyms',
      count: counts.all,
      icon: Layers,
      color: 'text-stone-600 bg-stone-100 dark:bg-stone-800 dark:text-stone-300',
    },
    {
      id: 'unlearned' as RevisionFilter,
      label: 'Unlearned Words',
      desc: 'Words waiting to be studied and committed to memory',
      count: counts.unlearned,
      icon: BookOpen,
      color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/50 dark:text-sky-400',
    },
    {
      id: 'important' as RevisionFilter,
      label: 'Important (Starred)',
      desc: 'Crucial words marked with ⭐ for high-priority exam revision',
      count: counts.important,
      icon: Star,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400',
    },
    {
      id: 'favorites' as RevisionFilter,
      label: 'Favorite Words',
      desc: 'Words saved with ❤️ for frequent review',
      count: counts.favorites,
      icon: Heart,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400',
    },
    {
      id: 'difficult' as RevisionFilter,
      label: 'Difficult Words',
      desc: 'Words tagged as challenging requiring targeted repetition',
      count: counts.difficult,
      icon: AlertTriangle,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400',
    },
  ];

  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 max-w-lg mx-auto space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight font-['Rozha_One',serif]">
          Revision Mode
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Select a targeted category to revise in the vertical reels player.
        </p>
      </div>

      {/* Category Selection Cards */}
      <div className="space-y-2.5">
        {filterCards.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedFilter === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => setSelectedFilter(cat.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-white dark:bg-stone-900 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                  : 'bg-white/70 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${cat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {cat.label}
                    </h3>
                    <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      {cat.count}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                    {cat.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                {isSelected ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (cat.count > 0) onStartRevision(cat.id);
                    }}
                    disabled={cat.count === 0}
                    className="p-2 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center gap-1 hover:bg-amber-600 shadow-sm disabled:opacity-40"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Start</span>
                  </button>
                ) : (
                  <ArrowRight className="w-4 h-4 text-stone-300 dark:text-stone-600" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Start Button for Selected Filter */}
      {previewWords.length > 0 && (
        <button
          onClick={() => onStartRevision(selectedFilter)}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:from-amber-600 hover:to-orange-700 shadow-lg active:scale-[0.99] transition-all"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Launch Vertical Revision Feed ({previewWords.length} Words)</span>
        </button>
      )}

      {/* Quick Word List Preview */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Preview Words in this Filter ({previewWords.length})
          </h3>
        </div>

        {previewWords.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 text-xs text-stone-500">
            No words found in this category. Mark words as {selectedFilter} while learning!
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800 max-h-64 overflow-y-auto">
            {previewWords.slice(0, 30).map((w) => (
              <div
                key={w.id}
                onClick={() => onStartRevision(selectedFilter, w.id)}
                className="p-2.5 px-3 flex items-center justify-between hover:bg-amber-50/50 dark:hover:bg-stone-800/50 cursor-pointer text-xs"
              >
                <div>
                  <span className="font-bold text-stone-900 dark:text-stone-100 mr-2">
                    {w.word}
                  </span>
                  <span className="text-amber-700 dark:text-amber-400 font-medium">
                    {w.meaningHindi}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">#{w.id}</span>
              </div>
            ))}
            {previewWords.length > 30 && (
              <div className="p-2 text-center text-[11px] text-stone-400">
                + {previewWords.length - 30} more words in this revision set
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
