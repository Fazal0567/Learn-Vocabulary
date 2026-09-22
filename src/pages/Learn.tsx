import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Heart,
  Star,
  Search,
  Moon,
  Sun,
  Plus,
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
  allWords?: WordItem[];
  isAdmin?: boolean;
  onOpenAddWord?: () => void;
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
  allWords,
  isAdmin = false,
  onOpenAddWord,
}) => {
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const learnWrapperRef = useRef<HTMLDivElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  // Active word list based on filter
  const activeWordList = useMemo(() => {
    return filterVocabulary(filterMode, learnedIds, favoriteIds, importantIds, difficultIds, allWords);
  }, [filterMode, learnedIds, favoriteIds, importantIds, difficultIds, allWords]);

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
    all: `All ${allWords?.length || 1000} Words`,
    custom: 'Newly Added',
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

      {/* Floating Header Actions: Admin Add, Dark Mode Toggle & Search */}
      <div className="absolute top-2 right-3 z-30 flex items-center gap-1.5">
        {isAdmin && onOpenAddWord && (
          <button
            id="admin-add-word-btn-learn"
            onClick={onOpenAddWord}
            aria-label="Admin Add Word"
            className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
            title="Add New Word (Admin)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Word</span>
          </button>
        )}
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
        className="flex-1 w-full min-h-0 relative overflow-hidden flex flex-col items-center justify-center p-2 sm:p-4 touch-pan-y"
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
          <div className="w-full flex-1 min-h-0 max-w-md bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-stone-200/90 dark:border-stone-800/90 flex flex-col overflow-hidden relative">
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

        {/* Dedicated Next & Previous Navigation Bar */}
        {activeWordList.length > 0 && (
          <div className="w-full max-w-md flex items-center justify-between gap-2.5 pt-2.5 px-1 shrink-0 z-20">
            <button
              id="learn-prev-btn"
              onClick={handlePrev}
              aria-label="Previous Word"
              className="flex-1 min-h-[42px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-amber-600 dark:hover:text-amber-400 font-bold text-xs sm:text-sm shadow-xs active:scale-95 transition-all cursor-pointer select-none"
              title="Previous Word (← Arrow or Swipe Right)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="text-[11px] sm:text-xs font-mono font-bold text-stone-600 dark:text-stone-300 shrink-0 px-2.5 py-1.5 rounded-lg bg-stone-200/70 dark:bg-stone-800/70 border border-stone-300/40 dark:border-stone-700/40">
              {currentIndex + 1} of {activeWordList.length}
            </div>

            <button
              id="learn-next-btn"
              onClick={handleNext}
              aria-label="Next Word"
              className="flex-1 min-h-[42px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-xs active:scale-95 transition-all cursor-pointer select-none"
              title="Next Word (→ Arrow, Space, or Swipe Left)"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Desktop Side Arrows for wide-screen navigation */}
        {activeWordList.length > 0 && (
          <>
            <button
              id="learn-desktop-prev-btn"
              onClick={handlePrev}
              aria-label="Previous Word"
              className="hidden lg:flex absolute left-4 xl:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-stone-800 shadow-lg active:scale-90 transition-all z-20 cursor-pointer"
              title="Previous Word (← Arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              id="learn-desktop-next-btn"
              onClick={handleNext}
              aria-label="Next Word"
              className="hidden lg:flex absolute right-4 xl:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg active:scale-90 transition-all z-20 cursor-pointer"
              title="Next Word (→ Arrow or Space)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Desktop Helper Banner */}
      <div className="hidden md:flex items-center justify-center gap-4 py-1.5 px-4 bg-stone-200/40 dark:bg-stone-900/40 border-t border-stone-200 dark:border-stone-800/60 text-[11px] font-mono text-stone-500 dark:text-stone-400 shrink-0">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 shadow-xs">←</kbd>
          Previous Word
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 shadow-xs">→</kbd>
          or
          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 shadow-xs">Space</kbd>
          Next Word
        </span>
      </div>
    </div>
  );
};
