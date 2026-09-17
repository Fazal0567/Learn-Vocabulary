import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  ChevronUp,
  ChevronDown,
  Sparkles,
  Heart,
  Star,
  Search,
  Moon,
  Sun,
} from 'lucide-react';
import { WordItem, RevisionFilter } from '../types';
import { WordCard } from '../components/WordCard';
import { ProgressBar } from '../components/ProgressBar';
import { useSwipe } from '../hooks/useSwipe';
import { filterVocabulary } from '../utils/vocabularyUtils';
import { speakWord } from '../utils/speech';

interface LearnProps {
  currentWordId: number;
  onWordChange: (id: number) => void;
  learnedIds: number[];
  favoriteIds: number[];
  importantIds: number[];
  difficultIds: number[];
  onToggleLearned: (id: number) => void;
  onToggleFavorite: (id: number) => void;
  onToggleImportant: (id: number) => void;
  onToggleDifficult: (id: number) => void;
  filterMode?: RevisionFilter;
  onOpenSearch: () => void;
  autoPronounce?: boolean;
  animationsEnabled?: boolean;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Learn: React.FC<LearnProps> = ({
  currentWordId,
  onWordChange,
  learnedIds,
  favoriteIds,
  importantIds,
  difficultIds,
  onToggleLearned,
  onToggleFavorite,
  onToggleImportant,
  onToggleDifficult,
  filterMode = 'all',
  onOpenSearch,
  autoPronounce = false,
  animationsEnabled = true,
  darkMode = false,
  onToggleDarkMode,
}) => {
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const learnWrapperRef = useRef<HTMLDivElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  // Active word list based on filter
  const activeWordList = useMemo(() => {
    return filterVocabulary(filterMode, learnedIds, favoriteIds, importantIds, difficultIds);
  }, [filterMode, learnedIds, favoriteIds, importantIds, difficultIds]);

  // Current word index inside current filtered list
  const currentIndex = useMemo(() => {
    const idx = activeWordList.findIndex(w => w.id === currentWordId);
    return idx !== -1 ? idx : 0;
  }, [activeWordList, currentWordId]);

  const currentWord: WordItem | undefined = activeWordList[currentIndex];

  // Auto pronunciation when word changes
  useEffect(() => {
    if (autoPronounce && currentWord) {
      const timer = setTimeout(() => {
        speakWord(currentWord.word);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [currentWord?.id, autoPronounce]);

  // Navigation handlers
  const handleNext = () => {
    if (activeWordList.length === 0) return;
    setDirection('up');
    if (currentIndex < activeWordList.length - 1) {
      onWordChange(activeWordList[currentIndex + 1].id);
    } else {
      // Loop back to start for endless practice
      onWordChange(activeWordList[0].id);
    }
  };

  const handlePrev = () => {
    if (activeWordList.length === 0) return;
    setDirection('down');
    if (currentIndex > 0) {
      onWordChange(activeWordList[currentIndex - 1].id);
    } else {
      // Loop to end
      onWordChange(activeWordList[activeWordList.length - 1].id);
    }
  };

  const swipeHandlers = useSwipe({
    onNext: handleNext,
    onPrev: handlePrev,
    enabled: activeWordList.length > 0,
    threshold: 35,
    cooldownMs: 280,
  });

  // Attach non-passive wheel listener on entire Learn viewport
  useEffect(() => {
    const el = learnWrapperRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      swipeHandlers.onWheel(e);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [swipeHandlers]);

  const filterLabels: Record<RevisionFilter, string> = {
    all: 'All 1000 Words',
    unlearned: 'Unlearned',
    important: 'Starred Words',
    favorites: 'Favorites',
    difficult: 'Difficult Words',
  };

  return (
    <div
      ref={learnWrapperRef}
      className="w-full h-full flex flex-col bg-stone-100 dark:bg-stone-950 overflow-hidden relative select-none"
    >
      {/* Top Header & Thin Progress Bar */}
      <ProgressBar
        current={activeWordList.length > 0 ? currentIndex + 1 : 0}
        total={activeWordList.length}
        categoryLabel={filterMode !== 'all' ? filterLabels[filterMode] : undefined}
      />

      {/* Floating Header Actions: Dark Mode Toggle & Search */}
      <div className="absolute top-2 right-3 z-30 flex items-center gap-1.5">
        {onToggleDarkMode && (
          <button
            id="dark-mode-toggle-btn-learn"
            onClick={onToggleDarkMode}
            aria-label="Toggle dark theme"
            className="p-1.5 rounded-lg bg-stone-200/90 dark:bg-stone-800/90 text-stone-700 dark:text-stone-200 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors shadow-xs"
            title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-700" />
            )}
          </button>
        )}
        <button
          id="search-btn-learn"
          onClick={onOpenSearch}
          aria-label="Search Vocabulary"
          className="p-1.5 rounded-lg bg-stone-200/90 dark:bg-stone-800/90 text-stone-700 dark:text-stone-200 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors shadow-xs"
          title="Search words"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Main Flashcard Viewport Area with Touch Swipe */}
      <div
        ref={cardContainerRef}
        onTouchStart={swipeHandlers.onTouchStart}
        onTouchEnd={swipeHandlers.onTouchEnd}
        className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center p-2 sm:p-4 touch-pan-y"
      >
        {activeWordList.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center text-center p-8 max-w-xs mx-auto bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl">
            {filterMode === 'favorites' ? (
              <>
                <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center mb-3">
                  <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
                </div>
                <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">No favorites yet</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                  Tap the heart icon on any word card to add it to your favorite bank for quick revision.
                </p>
              </>
            ) : filterMode === 'important' ? (
              <>
                <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center mb-3">
                  <Star className="w-8 h-8 text-amber-500 fill-amber-400" />
                </div>
                <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">No Starred words</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                  Mark high-yield words with ⭐ Star while studying to compile a special revision list.
                </p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mb-3">
                  <Sparkles className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">All caught up!</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                  You've reviewed or cleared words in this filter. Switch to All Words or start a Quiz!
                </p>
              </>
            )}
          </div>
        ) : (
          /* Card Container */
          <div className="w-full h-full max-w-md bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-stone-200/90 dark:border-stone-800/90 flex flex-col overflow-hidden relative">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              {currentWord && (
                <WordCard
                  key={currentWord.id}
                  item={currentWord}
                  currentIndex={currentIndex + 1}
                  totalCount={activeWordList.length}
                  isLearned={learnedIds.includes(currentWord.id)}
                  isFavorite={favoriteIds.includes(currentWord.id)}
                  isImportant={importantIds.includes(currentWord.id)}
                  isDifficult={difficultIds.includes(currentWord.id)}
                  onToggleLearned={onToggleLearned}
                  onToggleFavorite={onToggleFavorite}
                  onToggleImportant={onToggleImportant}
                  onToggleDifficult={onToggleDifficult}
                  direction={direction}
                  animationsEnabled={animationsEnabled}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Floating Quick Navigation Controls (Visible on mobile & desktop) */}
        {activeWordList.length > 0 && (
          <div className="flex flex-col items-center gap-2 absolute right-2.5 sm:right-5 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl z-20">
            <button
              id="reel-nav-prev-btn"
              onClick={handlePrev}
              aria-label="Previous Word"
              className="p-2 sm:p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 active:scale-90 transition-all"
              title="Previous Word (Swipe Down or ↑ Key)"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <div className="text-[10px] font-mono font-bold text-stone-500 dark:text-stone-400 text-center px-1">
              {currentIndex + 1}
            </div>
            <button
              id="reel-nav-next-btn"
              onClick={handleNext}
              aria-label="Next Word"
              className="p-2 sm:p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 active:scale-90 transition-all"
              title="Next Word (Swipe Up or ↓ Key)"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Desktop Helper Banner */}
      <div className="hidden md:flex items-center justify-center gap-4 py-1.5 px-4 bg-stone-200/40 dark:bg-stone-900/40 border-t border-stone-200 dark:border-stone-800/60 text-[11px] font-mono text-stone-500 dark:text-stone-400 shrink-0">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 shadow-xs">↓</kbd>
          or
          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 shadow-xs">Space</kbd>
          Next Word
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 shadow-xs">↑</kbd>
          Previous Word
        </span>
        <span className="text-[10px] text-stone-400">
          (Swipe up / Scroll down for next word)
        </span>
      </div>
    </div>
  );
};
