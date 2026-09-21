import React from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle,
  Heart,
  Star,
  AlertTriangle,
  Award,
  Sparkles,
  Flame,
  ArrowRight,
  TrendingUp,
  Moon,
  Sun,
  Plus,
  ShieldCheck,
  Lock,
  Cloud,
} from 'lucide-react';
import { WordItem, NavigationTab } from '../types';
import { VOCABULARY_DATA } from '../data/vocabulary';

interface HomeProps {
  currentWordId: number;
  learnedCount: number;
  favoriteCount: number;
  importantCount: number;
  difficultCount: number;
  dailyGoal: number;
  todayLearnedCount: number;
  onNavigate: (tab: NavigationTab) => void;
  onSelectWord: (wordId: number) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  allWords?: WordItem[];
  isAdmin?: boolean;
  onOpenAddWord?: () => void;
  onOpenAdminAuth?: () => void;
  currentUserEmail?: string | null;
  isCloudSynced?: boolean;
}

export const Home: React.FC<HomeProps> = ({
  currentWordId,
  learnedCount,
  favoriteCount,
  importantCount,
  difficultCount,
  dailyGoal,
  todayLearnedCount,
  onNavigate,
  onSelectWord,
  darkMode = false,
  onToggleDarkMode,
  allWords,
  isAdmin = false,
  onOpenAddWord,
  onOpenAdminAuth,
  currentUserEmail,
  isCloudSynced = true,
}) => {
  const wordsList = allWords || VOCABULARY_DATA;
  const currentWord = wordsList.find(w => w.id === currentWordId) || wordsList[0];
  const totalWords = wordsList.length;
  const overallPercentage = Math.round((learnedCount / totalWords) * 100);
  const dailyPercentage = Math.min(100, Math.round((todayLearnedCount / dailyGoal) * 100));

  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 max-w-lg mx-auto space-y-4 sm:space-y-5">
      {/* App Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight font-['Rozha_One',serif]">
            Learn Vocabulary
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {onToggleDarkMode && (
            <button
              id="dark-mode-toggle-btn-home"
              onClick={onToggleDarkMode}
              aria-label="Toggle dark theme"
              className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors shadow-xs"
              title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-stone-700" />
              )}
            </button>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 border border-orange-200 text-orange-700 dark:text-orange-400 text-xs font-bold">
            <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
            <span>{todayLearnedCount} Today</span>
          </div>
        </div>
      </div>

      {/* Continue Learning Card */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
          <Sparkles className="w-36 h-36" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between text-amber-200 text-xs font-semibold uppercase tracking-wider">
            <span>Continue Learning</span>
            <span>Word {currentWord.id} of {totalWords}</span>
          </div>

          <div className="my-3">
            <h2 className="text-3xl font-extrabold tracking-tight font-['Rozha_One',serif]">
              {currentWord.word}
            </h2>
            <p className="text-lg font-bold text-amber-100 mt-0.5 font-['Noto_Sans_Devanagari']">
              {currentWord.meaningHindi}
            </p>
            <p className="text-xs text-amber-100/80 mt-1 line-clamp-1">
              {currentWord.meaningEnglish}
            </p>
          </div>

          <button
            id="continue-learning-btn"
            onClick={() => {
              onSelectWord(currentWord.id);
              onNavigate('learn');
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-amber-900 font-bold text-sm hover:bg-amber-50 active:scale-[0.99] transition-all shadow-md"
          >
            <Play className="w-4 h-4 fill-amber-900" />
            <span>Continue Learning</span>
          </button>
        </div>
      </div>

      {/* Today's Goal Section */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Today's Goal
              </h3>
              <p className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                {todayLearnedCount} / {dailyGoal} completed
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            {dailyPercentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500 ease-out"
            style={{ width: `${dailyPercentage}%` }}
          />
        </div>
      </div>

      {/* Vocabulary Overview Grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Vocabulary Progress
          </h3>
          <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
            {overallPercentage}% Mastered
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Total Words */}
          <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col justify-between">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Total Words</span>
            <span className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100 mt-1">
              {totalWords}
            </span>
          </div>

          {/* Learned */}
          <div
            onClick={() => onNavigate('revision')}
            className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-xs font-medium">Learned</span>
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
            <span className="text-xl font-bold font-mono text-emerald-600 mt-1">
              {learnedCount}
            </span>
          </div>

          {/* Remaining */}
          <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col justify-between">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Remaining</span>
            <span className="text-xl font-bold font-mono text-stone-700 dark:text-stone-300 mt-1">
              {totalWords - learnedCount}
            </span>
          </div>

          {/* Favorites */}
          <div
            onClick={() => onNavigate('favorites')}
            className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-rose-300 dark:hover:border-rose-700 cursor-pointer transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-rose-600">
              <span className="text-xs font-medium">Favorites</span>
              <Heart className="w-3.5 h-3.5 fill-rose-500" />
            </div>
            <span className="text-xl font-bold font-mono text-rose-600 mt-1">
              {favoriteCount}
            </span>
          </div>

          {/* Starred / Important */}
          <div
            onClick={() => onNavigate('important')}
            className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-300 dark:hover:border-amber-700 cursor-pointer transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-xs font-medium">Starred</span>
              <Star className="w-3.5 h-3.5 fill-amber-400" />
            </div>
            <span className="text-xl font-bold font-mono text-amber-600 mt-1">
              {importantCount}
            </span>
          </div>

          {/* Difficult */}
          <div
            onClick={() => onNavigate('revision')}
            className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-purple-300 dark:hover:border-purple-700 cursor-pointer transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-purple-600">
              <span className="text-xs font-medium">Difficult</span>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <span className="text-xl font-bold font-mono text-purple-600 mt-1">
              {difficultCount}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Quick Action (Visible only when Admin mode is unlocked) */}
      {isAdmin && onOpenAddWord && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Admin Active
                </h4>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                All words you add sync live across every learner device
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAddWord}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Word</span>
          </button>
        </div>
      )}

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          id="quick-quiz-btn"
          onClick={() => onNavigate('quiz')}
          className="p-4 rounded-2xl bg-amber-500 text-white font-bold text-left flex flex-col justify-between hover:bg-amber-600 active:scale-[0.98] transition-all shadow-md"
        >
          <div className="flex items-center justify-between">
            <Award className="w-6 h-6" />
            <ArrowRight className="w-4 h-4 opacity-75" />
          </div>
          <div className="mt-3">
            <h4 className="text-base font-extrabold leading-tight">Practice Quiz</h4>
            <p className="text-[11px] font-normal text-amber-100 mt-0.5">Test your vocabulary</p>
          </div>
        </button>

        <button
          id="quick-revise-btn"
          onClick={() => onNavigate('revision')}
          className="p-4 rounded-2xl bg-stone-900 dark:bg-stone-800 text-white font-bold text-left flex flex-col justify-between hover:bg-stone-800 active:scale-[0.98] transition-all shadow-md"
        >
          <div className="flex items-center justify-between">
            <RotateCcw className="w-6 h-6 text-amber-400" />
            <ArrowRight className="w-4 h-4 opacity-75" />
          </div>
          <div className="mt-3">
            <h4 className="text-base font-extrabold leading-tight">Revision Mode</h4>
            <p className="text-[11px] font-normal text-stone-300 mt-0.5">Filter by difficulty</p>
          </div>
        </button>
      </div>
    </div>
  );
};
