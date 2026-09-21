import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Volume2, ArrowRight } from 'lucide-react';
import { WordItem } from '../types';
import { searchVocabulary } from '../utils/vocabularyUtils';
import { speakWord } from '../utils/speech';

interface SearchModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelectWord: (wordId: number) => void;
  isInline?: boolean;
  allWords?: WordItem[];
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen = true,
  onClose,
  onSelectWord,
  isInline = false,
  allWords,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const results = useMemo(() => {
    return searchVocabulary(query, allWords);
  }, [query, allWords]);

  if (!isOpen && !isInline) return null;

  const content = (
    <div className="flex flex-col h-full max-h-[85vh] w-full bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
      {/* Search Header */}
      <div className="p-3 sm:p-4 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3">
        <Search className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Word, Hindi, English, Synonyms..."
          className="flex-1 bg-transparent text-sm sm:text-base text-stone-900 dark:text-stone-100 placeholder-stone-400 outline-none font-medium"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {!isInline && onClose && (
          <button
            onClick={onClose}
            className="text-xs font-semibold px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200"
          >
            Close
          </button>
        )}
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-stone-100 dark:divide-stone-800/60">
        {query.trim() === '' ? (
          <div className="p-8 text-center text-stone-400 text-sm">
            <Search className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-500" />
            <p className="font-semibold text-stone-600 dark:text-stone-300">
              Instant Vocabulary Search
            </p>
            <p className="text-xs mt-1">
              Type in English or Hindi (e.g., "abandon", "त्याग", "abate", "scarce")
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-sm">
            <p className="font-semibold text-stone-700 dark:text-stone-300">No words found</p>
            <p className="text-xs text-stone-400 mt-1">Try another search term or spelling.</p>
          </div>
        ) : (
          results.map((word) => (
            <div
              key={word.id}
              onClick={() => {
                onSelectWord(word.id);
                if (onClose) onClose();
              }}
              className="p-3 hover:bg-amber-50/60 dark:hover:bg-stone-800/50 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
            >
              <div className="flex-1 pr-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                    #{word.id}
                  </span>
                  <span className="font-bold text-stone-900 dark:text-stone-100 text-base group-hover:text-amber-600 dark:group-hover:text-amber-400">
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
                  className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 hover:text-amber-600"
                  title="Pronounce"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (isInline) {
    return <div className="h-full w-full p-2">{content}</div>;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg">{content}</div>
    </div>
  );
};
