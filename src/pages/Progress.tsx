import React from 'react';
import {
  BarChart2,
  CheckCircle,
  Clock,
  Heart,
  Star,
  AlertTriangle,
  Award,
  Flame,
  Target,
} from 'lucide-react';
import { VOCABULARY_DATA } from '../data/vocabulary';
import { NavigationTab } from '../types';

interface ProgressProps {
  learnedCount: number;
  favoriteCount: number;
  importantCount: number;
  difficultCount: number;
  dailyGoal: number;
  todayLearnedCount: number;
  quizStats: {
    totalQuestions: number;
    correctAnswers: number;
  };
  onNavigate: (tab: NavigationTab) => void;
  totalWordsCount?: number;
}

export const Progress: React.FC<ProgressProps> = ({
  learnedCount,
  favoriteCount,
  importantCount,
  difficultCount,
  dailyGoal,
  todayLearnedCount,
  quizStats,
  onNavigate,
  totalWordsCount,
}) => {
  const totalWords = totalWordsCount || VOCABULARY_DATA.length;
  const remainingCount = Math.max(0, totalWords - learnedCount);
  const learnedPercentage = totalWords > 0 ? Math.round((learnedCount / totalWords) * 100) : 0;
  const dailyPercentage = Math.min(100, Math.round((todayLearnedCount / dailyGoal) * 100));
  const quizAccuracy = quizStats.totalQuestions > 0
    ? Math.round((quizStats.correctAnswers / quizStats.totalQuestions) * 100)
    : 0;

  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight font-['Rozha_One',serif]">
          Learning Analytics
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Detailed metrics for your vocabulary preparation.
        </p>
      </div>

      {/* Main Overall Progress Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Vocabulary Progress
              </h2>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {learnedCount} / {totalWords} Learned
              </p>
            </div>
          </div>
          <span className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
            {learnedPercentage}%
          </span>
        </div>

        {/* Large Progress Bar */}
        <div className="w-full h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-full transition-all duration-500"
            style={{ width: `${learnedPercentage}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-1">
          <span>Target: 1,000 Words</span>
          <span>Remaining: {remainingCount}</span>
        </div>
      </div>

      {/* Today's Goal Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-orange-100 uppercase tracking-wider">
                Today's Goal
              </span>
              <h3 className="text-lg font-bold font-mono">
                {todayLearnedCount} / {dailyGoal} Words
              </h3>
            </div>
          </div>
          <span className="text-xl font-mono font-extrabold">{dailyPercentage}%</span>
        </div>

        {/* Goal bar */}
        <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-white transition-all duration-500"
            style={{ width: `${dailyPercentage}%` }}
          />
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Words */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Total Words</span>
          <div className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100 mt-1">
            {totalWords}
          </div>
        </div>

        {/* Learned Words */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-medium">Learned</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {learnedCount}
          </div>
        </div>

        {/* Remaining */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Remaining</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-stone-700 dark:text-stone-300 mt-1">
            {remainingCount}
          </div>
        </div>

        {/* Favorites */}
        <div
          onClick={() => onNavigate('favorites')}
          className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-rose-300 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-medium">Favorites</span>
            <Heart className="w-4 h-4 fill-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
            {favoriteCount}
          </div>
        </div>

        {/* Important */}
        <div
          onClick={() => onNavigate('important')}
          className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-300 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-medium">Starred</span>
            <Star className="w-4 h-4 fill-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {importantCount}
          </div>
        </div>

        {/* Difficult */}
        <div
          onClick={() => onNavigate('revision')}
          className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-purple-300 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-xs font-medium">Difficult</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-600 mt-1">
            {difficultCount}
          </div>
        </div>
      </div>

      {/* Quiz Performance Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
            Quiz Accuracy
          </span>
          <p className="text-lg font-bold text-stone-900 dark:text-stone-100">
            {quizStats.correctAnswers} / {quizStats.totalQuestions} Solved
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-mono font-extrabold text-amber-600 dark:text-amber-400">
            {quizAccuracy}%
          </span>
        </div>
      </div>
    </div>
  );
};
