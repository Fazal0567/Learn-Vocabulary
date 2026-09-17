/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { NavigationTab, RevisionFilter, UserSettings } from './types';
import { VOCABULARY_DATA } from './data/vocabulary';
import { Home } from './pages/Home';
import { Learn } from './pages/Learn';
import { Important } from './pages/Important';
import { Favorites } from './pages/Favorites';
import { Revision } from './pages/Revision';
import { Quiz } from './pages/Quiz';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';
import { SearchModal } from './components/SearchModal';
import { BottomNavigation } from './components/BottomNavigation';
import { ConfirmModal } from './components/ConfirmModal';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [revisionFilter, setRevisionFilter] = useState<RevisionFilter>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Persistent User Data (LocalStorage)
  const [currentWordId, setCurrentWordId] = useLocalStorage<number>('vocab_currentWord', 1);
  const [learnedIds, setLearnedIds] = useLocalStorage<number[]>('vocab_learnedWords', []);
  const [favoriteIds, setFavoriteIds] = useLocalStorage<number[]>('vocab_favoriteWords', []);
  const [importantIds, setImportantIds] = useLocalStorage<number[]>('vocab_importantWords', []);
  const [difficultIds, setDifficultIds] = useLocalStorage<number[]>('vocab_difficultWords', []);

  // Daily Progress & Date Tracking
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [lastStudyDate, setLastStudyDate] = useLocalStorage<string>('vocab_lastStudyDate', todayDateStr);
  const [todayLearnedCount, setTodayLearnedCount] = useLocalStorage<number>('vocab_todayLearned', 0);

  // Quiz Performance
  const [quizStats, setQuizStats] = useLocalStorage<{ totalQuestions: number; correctAnswers: number }>(
    'vocab_quizStats',
    { totalQuestions: 0, correctAnswers: 0 }
  );

  // Settings
  const [settings, setSettings] = useLocalStorage<UserSettings>('vocab_settings', {
    darkMode: false,
    dailyGoal: 20,
    autoPronounce: false,
    animations: true,
  });

  // Date Check: Reset daily goal if new day
  useEffect(() => {
    if (lastStudyDate !== todayDateStr) {
      setTodayLearnedCount(0);
      setLastStudyDate(todayDateStr);
    }
  }, [lastStudyDate, todayDateStr, setTodayLearnedCount, setLastStudyDate]);

  // Dark Mode Class Sync
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Toggle Handlers
  const handleToggleLearned = (id: number) => {
    setLearnedIds((prev) => {
      const isAlready = prev.includes(id);
      if (isAlready) {
        return prev.filter((item) => item !== id);
      } else {
        // Increment today's count
        setTodayLearnedCount((c) => c + 1);
        return [...prev, id];
      }
    });
  };

  const handleToggleFavorite = (id: number) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleImportant = (id: number) => {
    setImportantIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleDifficult = (id: number) => {
    setDifficultIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleUpdateQuizStats = (isCorrect: boolean) => {
    setQuizStats((prev) => ({
      totalQuestions: prev.totalQuestions + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
    }));
  };

  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleToggleDarkMode = () => {
    setSettings((prev) => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const handleResetProgress = () => {
    setLearnedIds([]);
    setFavoriteIds([]);
    setImportantIds([]);
    setDifficultIds([]);
    setTodayLearnedCount(0);
    setQuizStats({ totalQuestions: 0, correctAnswers: 0 });
    setCurrentWordId(1);
    setIsResetModalOpen(false);
  };

  // Revision Quick Launch
  const handleStartRevision = (filter: RevisionFilter, wordId?: number) => {
    setRevisionFilter(filter);
    if (wordId) {
      setCurrentWordId(wordId);
    }
    setActiveTab('learn');
  };

  const handleJumpToWord = (wordId: number) => {
    setCurrentWordId(wordId);
    setRevisionFilter('all');
    setActiveTab('learn');
    setIsSearchOpen(false);
  };

  return (
    <div className="w-screen h-[100dvh] flex flex-col bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-hidden relative">
        {activeTab === 'home' && (
          <Home
            currentWordId={currentWordId}
            learnedCount={learnedIds.length}
            favoriteCount={favoriteIds.length}
            importantCount={importantIds.length}
            difficultCount={difficultIds.length}
            dailyGoal={settings.dailyGoal}
            todayLearnedCount={todayLearnedCount}
            onNavigate={(tab) => {
              if (tab === 'learn') setRevisionFilter('all');
              setActiveTab(tab);
            }}
            onSelectWord={handleJumpToWord}
            darkMode={settings.darkMode}
            onToggleDarkMode={handleToggleDarkMode}
          />
        )}

        {activeTab === 'learn' && (
          <Learn
            currentWordId={currentWordId}
            onWordChange={setCurrentWordId}
            learnedIds={learnedIds}
            favoriteIds={favoriteIds}
            importantIds={importantIds}
            difficultIds={difficultIds}
            onToggleLearned={handleToggleLearned}
            onToggleFavorite={handleToggleFavorite}
            onToggleImportant={handleToggleImportant}
            onToggleDifficult={handleToggleDifficult}
            filterMode={revisionFilter}
            onOpenSearch={() => setIsSearchOpen(true)}
            autoPronounce={settings.autoPronounce}
            animationsEnabled={settings.animations}
            darkMode={settings.darkMode}
            onToggleDarkMode={handleToggleDarkMode}
          />
        )}

        {activeTab === 'important' && (
          <Important
            importantIds={importantIds}
            onToggleImportant={handleToggleImportant}
            onOpenWordInViewer={handleJumpToWord}
            onStartRevision={() => handleStartRevision('important')}
          />
        )}

        {activeTab === 'favorites' && (
          <Favorites
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onOpenWordInViewer={handleJumpToWord}
            onStartRevision={() => handleStartRevision('favorites')}
          />
        )}

        {activeTab === 'revision' && (
          <Revision
            learnedIds={learnedIds}
            favoriteIds={favoriteIds}
            importantIds={importantIds}
            difficultIds={difficultIds}
            onStartRevision={handleStartRevision}
          />
        )}

        {activeTab === 'quiz' && <Quiz onUpdateQuizStats={handleUpdateQuizStats} />}

        {activeTab === 'search' && (
          <SearchModal
            isInline={true}
            onSelectWord={handleJumpToWord}
          />
        )}

        {activeTab === 'progress' && (
          <Progress
            learnedCount={learnedIds.length}
            favoriteCount={favoriteIds.length}
            importantCount={importantIds.length}
            difficultCount={difficultIds.length}
            dailyGoal={settings.dailyGoal}
            todayLearnedCount={todayLearnedCount}
            quizStats={quizStats}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onRequestReset={() => setIsResetModalOpen(true)}
          />
        )}
      </main>

      {/* Persistent Mobile-First Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'learn' && activeTab !== 'learn') {
            setRevisionFilter('all');
          }
          setActiveTab(tab);
        }}
        favoritesCount={favoriteIds.length}
        importantCount={importantIds.length}
      />

      {/* Global Search Dialog (if opened as modal) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectWord={handleJumpToWord}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Reset All Progress?"
        message="This will clear all your learned words, saved favorites, starred marks, difficult tags, and quiz accuracy statistics. This action cannot be undone."
        confirmLabel="Yes, Reset All"
        cancelLabel="Cancel"
        onConfirm={handleResetProgress}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
}
