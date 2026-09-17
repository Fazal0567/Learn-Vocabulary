import React from 'react';
import { Star, Play, Volume2, ArrowRight } from 'lucide-react';
import { WordItem } from '../types';
import { VOCABULARY_DATA } from '../data/vocabulary';
import { speakWord } from '../utils/speech';

interface ImportantProps {
  importantIds: number[];
  onToggleImportant: (id: number) => void;
  onOpenWordInViewer: (id: number) => void;
  onStartRevision: () => void;
}

export const Important: React.FC<ImportantProps> = ({
  importantIds,
  onToggleImportant,
  onOpenWordInViewer,
  onStartRevision,
}) => {
  const importantWords = VOCABULARY_DATA.filter(w => importantIds.includes(w.id));

  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-amber-500 font-bold text-xs uppercase tracking-wider mb-0.5">
            <Star className="w-4 h-4 fill-amber-400" />
            <span>High-Yield Revision</span>
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 font-['Rozha_One',serif]">
            Important Words
          </h1>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
          {importantWords.length} Saved
        </span>
      </div>

      {importantWords.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm mt-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center mb-3">
            <Star className="w-7 h-7 text-amber-500 fill-amber-400" />
          </div>
          <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">No Important Words Yet</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 max-w-xs mx-auto leading-relaxed">
            While learning vocabulary, tap the ⭐ Star button on any word card to save high-priority words here.
          </p>
        </div>
      ) : (
        <>
          {/* Start vertical reel revision button */}
          <button
            onClick={onStartRevision}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:from-amber-600 hover:to-orange-700 shadow-lg active:scale-[0.99] transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Revise Starred Words in Reel Mode ({importantWords.length})</span>
          </button>

          {/* List of Important Words */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800/80 overflow-hidden shadow-sm">
            {importantWords.map((word) => (
              <div
                key={word.id}
                onClick={() => onOpenWordInViewer(word.id)}
                className="p-3 sm:p-3.5 hover:bg-amber-50/50 dark:hover:bg-stone-800/50 cursor-pointer flex items-center justify-between transition-colors group"
              >
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-600">#{word.id}</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600">
                      {word.word}
                    </span>
                    {word.pos && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-500">
                        {word.pos}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                    {word.meaningHindi}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                    {word.meaningEnglish}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakWord(word.word);
                    }}
                    className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-amber-600"
                    title="Pronounce"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleImportant(word.id);
                    }}
                    className="p-2 rounded-full text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                    title="Remove from important"
                  >
                    <Star className="w-4 h-4 fill-amber-400" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-amber-600" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
