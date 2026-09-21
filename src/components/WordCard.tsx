import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Volume2,
  Heart,
  CheckCircle,
  Star,
  AlertTriangle,
  Info,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { WordItem } from '../types';
import { speakWord } from '../utils/speech';

interface WordCardProps {
  item: WordItem;
  currentIndex: number;
  totalCount: number;
  isLearned: boolean;
  isFavorite: boolean;
  isImportant: boolean;
  isDifficult: boolean;
  onToggleLearned: (id: number) => void;
  onToggleFavorite: (id: number) => void;
  onToggleImportant: (id: number) => void;
  onToggleDifficult: (id: number) => void;
  direction?: 'up' | 'down';
  animationsEnabled?: boolean;
}

export const WordCard: React.FC<WordCardProps> = ({
  item,
  currentIndex,
  totalCount,
  isLearned,
  isFavorite,
  isImportant,
  isDifficult,
  onToggleLearned,
  onToggleFavorite,
  onToggleImportant,
  onToggleDifficult,
  direction = 'up',
  animationsEnabled = true,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handlePronounce = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayingAudio(true);
    speakWord(item.word, () => {
      setIsPlayingAudio(false);
    });
  };

  const variants = {
    initial: (dir: 'up' | 'down') => ({
      opacity: 0,
      y: dir === 'up' ? 35 : -35,
      scale: 0.98,
    }),
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: animationsEnabled ? 0.28 : 0,
        ease: 'easeOut' as const,
      },
    },
    exit: (dir: 'up' | 'down') => ({
      opacity: 0,
      y: dir === 'up' ? -35 : 35,
      scale: 0.98,
      transition: {
        duration: animationsEnabled ? 0.22 : 0,
      },
    }),
  };

  return (
    <motion.div
      key={item.id}
      custom={direction}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full h-full flex flex-col justify-between p-3.5 sm:p-5 select-none overflow-y-auto no-scrollbar"
      style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
    >
      {/* Top Meta info */}
      <div className="flex items-center justify-between shrink-0 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            Word {item.id}
          </span>
          {item.isCustom && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80">
              Admin Added
            </span>
          )}
          {item.pos && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/50">
              {item.pos}
            </span>
          )}
        </div>
        <div className="text-xs font-mono font-semibold text-stone-600 dark:text-stone-300">
          {currentIndex} / {totalCount}
        </div>
      </div>

      {/* Main Dominant Word & Meaning Section */}
      <div className="flex-1 flex flex-col justify-center my-auto py-1 sm:py-2">
        {/* Dominant Word with Pronunciation */}
        <div className="flex items-center justify-between gap-3 mb-1.5 sm:mb-2">
          <h1
            id={`word-heading-${item.id}`}
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 font-['Rozha_One',serif,'Plus_Jakarta_Sans',sans-serif]"
          >
            {item.word}
          </h1>

          <button
            id={`pronounce-btn-${item.id}`}
            onClick={handlePronounce}
            aria-label={`Pronounce ${item.word}`}
            className={`p-2 sm:p-2.5 rounded-full transition-all duration-200 border cursor-pointer ${
              isPlayingAudio
                ? 'bg-amber-500 text-white border-amber-600 scale-105 shadow-md'
                : 'bg-stone-100 dark:bg-stone-800/80 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-stone-700'
            }`}
          >
            <Volume2 className={`w-4 h-4 sm:w-5 sm:h-5 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
          </button>
        </div>

        {/* Hindi Meaning (Prominent, Elegant Devanagari) */}
        <div className="mb-2 sm:mb-3">
          <p className="text-lg sm:text-2xl font-bold text-amber-700 dark:text-amber-400 font-['Noto_Sans_Devanagari',sans-serif] leading-snug">
            {item.meaningHindi}
          </p>
        </div>

        {/* English Meaning */}
        {item.meaningEnglish && (
          <div className="mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-medium leading-relaxed">
              <span className="text-stone-500 dark:text-stone-400 uppercase text-[10px] sm:text-[11px] tracking-wider block font-semibold mb-0.5">
                English Definition
              </span>
              {item.meaningEnglish}
            </p>
          </div>
        )}

        {/* Synonyms & Antonyms Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 my-1.5 sm:my-2 p-2.5 sm:p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800">
          {/* Synonyms */}
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Synonyms
            </span>
            <ul className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-medium">
              {item.synonyms && item.synonyms.length > 0 ? (
                item.synonyms.map((syn, idx) => (
                  <li key={idx} className="flex items-baseline gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{syn}</span>
                  </li>
                ))
              ) : (
                <li className="text-stone-500 dark:text-stone-400 text-xs italic">Not available in source</li>
              )}
            </ul>
          </div>

          {/* Antonyms */}
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-1 flex items-center gap-1">
              <span className="font-mono">≠</span> Antonyms
            </span>
            <ul className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-medium">
              {item.antonyms && item.antonyms.length > 0 ? (
                item.antonyms.map((ant, idx) => (
                  <li key={idx} className="flex items-baseline gap-1.5">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{ant}</span>
                  </li>
                ))
              ) : (
                <li className="text-stone-500 dark:text-stone-400 text-xs italic">Not available in source</li>
              )}
            </ul>
          </div>
        </div>

        {/* Context Example */}
        {item.example && (
          <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1 mb-0.5 sm:mb-1">
              <BookOpen className="w-3 h-3" /> Exam Context Example
            </span>
            <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 italic leading-relaxed">
              "{item.example}"
            </p>
          </div>
        )}

        {/* Collapsible Details / Exam Note */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 sm:mt-3 p-2.5 sm:p-3 rounded-xl bg-stone-100 dark:bg-stone-800/60 text-xs text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 space-y-1"
          >
            <p className="font-semibold text-stone-800 dark:text-stone-200">
              💡 Vocabulary Tip:
            </p>
            <p>
              {item.customTip ? (
                item.customTip
              ) : (
                <>
                  Pay special attention to the prepositions usually paired with <span className="font-bold text-amber-600 dark:text-amber-400">{item.word.toLowerCase()}</span> in Cloze Tests and Sentence Fillers.
                </>
              )}
            </p>
          </motion.div>
        )}
      </div>

      {/* Bottom Actions Bar */}
      <div className="pt-2 sm:pt-3 border-t border-stone-200/80 dark:border-stone-800 shrink-0">
        <div className="flex items-center justify-around gap-1.5 sm:gap-2">
          {/* Favorite */}
          <button
            id={`fav-btn-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item.id);
            }}
            aria-label="Mark as favorite"
            className={`flex-1 flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 rounded-xl transition-all duration-200 border cursor-pointer ${
              isFavorite
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 shadow-sm'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
            }`}
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="text-[10px] sm:text-[11px] font-semibold whitespace-nowrap">
              {isFavorite ? 'Saved' : 'Favorite'}
            </span>
          </button>

          {/* Learned */}
          <button
            id={`learned-btn-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLearned(item.id);
            }}
            aria-label="Mark as learned"
            className={`flex-1 flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 rounded-xl transition-all duration-200 border cursor-pointer ${
              isLearned
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 shadow-sm'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
            }`}
          >
            <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 ${isLearned ? 'fill-emerald-500 text-white' : ''}`} />
            <span className="text-[10px] sm:text-[11px] font-semibold whitespace-nowrap">
              {isLearned ? 'Learned' : 'Learn'}
            </span>
          </button>

          {/* Important */}
          <button
            id={`important-btn-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleImportant(item.id);
            }}
            aria-label="Mark as important"
            className={`flex-1 flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 rounded-xl transition-all duration-200 border cursor-pointer ${
              isImportant
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900 shadow-sm'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
            }`}
          >
            <Star className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 ${isImportant ? 'fill-amber-400 text-amber-500' : ''}`} />
            <span className="text-[10px] sm:text-[11px] font-semibold whitespace-nowrap">
              {isImportant ? 'Starred' : 'Star'}
            </span>
          </button>

          {/* Difficult */}
          <button
            id={`difficult-btn-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleDifficult(item.id);
            }}
            aria-label="Mark as difficult"
            className={`flex-1 flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 rounded-xl transition-all duration-200 border cursor-pointer ${
              isDifficult
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900 shadow-sm'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 ${isDifficult ? 'fill-purple-400 text-purple-600' : ''}`} />
            <span className="text-[10px] sm:text-[11px] font-semibold whitespace-nowrap">
              {isDifficult ? 'Hard' : 'Hard'}
            </span>
          </button>

          {/* Details toggle */}
          <button
            id={`details-btn-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(prev => !prev);
            }}
            aria-label="Toggle details"
            className={`flex-1 flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 rounded-xl transition-all duration-200 border cursor-pointer ${
              showDetails
                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
            }`}
          >
            <Info className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
            <span className="text-[10px] sm:text-[11px] font-semibold whitespace-nowrap">
              {showDetails ? 'Hide' : 'Tips'}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
