/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Check, CloudCheck, Cloud } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { NavigationTab, RevisionFilter, UserSettings, WordItem } from './types';
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
import { AdminAuthModal } from './components/AdminAuthModal';
import { AddWordModal } from './components/AddWordModal';
import { ManageCustomWordsModal } from './components/ManageCustomWordsModal';
import { ChangeAdminPasscodeModal } from './components/ChangeAdminPasscodeModal';
import {
  subscribeToWords,
  syncWordToFirestore,
  deleteWordFromFirestore,
  testFirestoreConnection,
  auth,
  logoutUser,
  subscribeToAdminPasscode,
  updateAdminPasscodeInFirestore,
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [revisionFilter, setRevisionFilter] = useState<RevisionFilter>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Dynamic Vocabulary: Custom Admin Words + Master Dictionary
  const [customWords, setCustomWords] = useLocalStorage<WordItem[]>('vocab_customWords', []);

  // Admin Access & Controls (Restricted: Only Admin can add words)
  const [isAdmin, setIsAdmin] = useLocalStorage<boolean>('vocab_isAdmin', false);
  const [adminPin, setAdminPin] = useLocalStorage<string>('vocab_adminPin', 'admin123');

  // Admin Modal States
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isAddWordOpen, setIsAddWordOpen] = useState(false);
  const [isManageWordsOpen, setIsManageWordsOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [wordToEdit, setWordToEdit] = useState<WordItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Firebase Initialization, Real-time Cloud Word Sync & Auth Tracking
  useEffect(() => {
    testFirestoreConnection();

    // 1. Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserEmail(user.email || 'Admin');
      } else {
        setCurrentUserEmail(null);
      }
    });

    // 2. Real-time subscription to global vocabulary words in Firestore
    const unsubscribeWords = subscribeToWords((firestoreWords) => {
      setIsCloudSynced(true);
      if (firestoreWords && firestoreWords.length > 0) {
        setCustomWords((localWords) => {
          const wordsMap = new Map<number, WordItem>();
          // Existing local words
          localWords.forEach((w) => wordsMap.set(w.id, w));
          // Firestore words are the universal source of truth
          firestoreWords.forEach((w) => wordsMap.set(w.id, w));
          return Array.from(wordsMap.values()).sort((a, b) => a.id - b.id);
        });
      }
    });

    // 3. Real-time subscription to admin passcode configuration from Firestore
    const unsubscribePasscode = subscribeToAdminPasscode((remotePasscode) => {
      if (remotePasscode && remotePasscode.trim()) {
        setAdminPin(remotePasscode.trim());
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeWords();
      unsubscribePasscode();
    };
  }, []);

  // Combined Reactive Vocabulary
  const allWords = useMemo(() => {
    return [...VOCABULARY_DATA, ...customWords];
  }, [customWords]);

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

  // Admin Actions (Strictly restricted to Admin mode)
  const handleSaveWord = async (wordData: Omit<WordItem, 'id'>, editId?: number) => {
    if (editId) {
      const updatedWord: WordItem = {
        ...wordData,
        id: editId,
        isCustom: true,
      };
      setCustomWords((prev) =>
        prev.map((w) => (w.id === editId ? updatedWord : w))
      );
      showToast(`Word "${wordData.word}" updated! Syncing to cloud...`);
      try {
        await syncWordToFirestore(updatedWord, currentUserEmail || 'admin');
        showToast(`Word "${wordData.word}" updated & synced for all users!`);
      } catch (err) {
        console.error('Failed to sync updated word to Firestore:', err);
      }
    } else {
      const maxId = allWords.reduce((max, w) => Math.max(max, w.id), 0);
      const newId = maxId + 1;
      const newWord: WordItem = {
        ...wordData,
        id: newId,
        isCustom: true,
      };
      setCustomWords((prev) => [...prev, newWord]);
      showToast(`Word "${newWord.word}" added! Syncing to cloud...`);
      try {
        await syncWordToFirestore(newWord, currentUserEmail || 'admin');
        showToast(`Word "${newWord.word}" synced live across all devices!`);
      } catch (err) {
        console.error('Failed to sync new word to Firestore:', err);
      }
      // Note: User's current reading position (currentWordId) and tab remain strictly untouched
    }
  };

  const handleDeleteCustomWord = async (id: number) => {
    const deletedWord = customWords.find((w) => w.id === id);
    setCustomWords((prev) => prev.filter((w) => w.id !== id));
    setLearnedIds((prev) => prev.filter((itemId) => itemId !== id));
    setFavoriteIds((prev) => prev.filter((itemId) => itemId !== id));
    setImportantIds((prev) => prev.filter((itemId) => itemId !== id));
    setDifficultIds((prev) => prev.filter((itemId) => itemId !== id));
    if (currentWordId === id) {
      setCurrentWordId(1);
    }
    showToast(`Word "${deletedWord?.word || id}" deleted.`);
    try {
      await deleteWordFromFirestore(id);
    } catch (err) {
      console.error('Failed to delete word from Firestore:', err);
    }
  };

  const handleEditWord = (word: WordItem) => {
    setWordToEdit(word);
    setIsAddWordOpen(true);
  };

  const handleLockAdmin = async () => {
    setIsAdmin(false);
    try {
      await logoutUser();
    } catch {
      // Ignore
    }
    showToast('Admin mode locked. Returned to student view.');
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
            allWords={allWords}
            isAdmin={isAdmin}
            onOpenAddWord={() => {
              setWordToEdit(null);
              setIsAddWordOpen(true);
            }}
            onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
            currentUserEmail={currentUserEmail}
            isCloudSynced={isCloudSynced}
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
            allWords={allWords}
            isAdmin={isAdmin}
            onOpenAddWord={() => {
              setWordToEdit(null);
              setIsAddWordOpen(true);
            }}
          />
        )}

        {activeTab === 'important' && (
          <Important
            importantIds={importantIds}
            onToggleImportant={handleToggleImportant}
            onOpenWordInViewer={handleJumpToWord}
            onStartRevision={() => handleStartRevision('important')}
            allWords={allWords}
          />
        )}

        {activeTab === 'favorites' && (
          <Favorites
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onOpenWordInViewer={handleJumpToWord}
            onStartRevision={() => handleStartRevision('favorites')}
            allWords={allWords}
          />
        )}

        {activeTab === 'revision' && (
          <Revision
            learnedIds={learnedIds}
            favoriteIds={favoriteIds}
            importantIds={importantIds}
            difficultIds={difficultIds}
            onStartRevision={handleStartRevision}
            allWords={allWords}
          />
        )}

        {activeTab === 'quiz' && (
          <Quiz
            onUpdateQuizStats={handleUpdateQuizStats}
            allWords={allWords}
          />
        )}

        {activeTab === 'search' && (
          <SearchModal
            isInline={true}
            onSelectWord={handleJumpToWord}
            allWords={allWords}
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
            totalWordsCount={allWords.length}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onRequestReset={() => setIsResetModalOpen(true)}
            isAdmin={isAdmin}
            customWordsCount={customWords.length}
            onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
            onOpenAddWord={() => {
              setWordToEdit(null);
              setIsAddWordOpen(true);
            }}
            onOpenManageCustomWords={() => setIsManageWordsOpen(true)}
            onOpenChangePin={() => setIsChangePinOpen(true)}
            onLockAdmin={handleLockAdmin}
            currentUserEmail={currentUserEmail}
            isCloudSynced={isCloudSynced}
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
        allWords={allWords}
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

      {/* Admin Authentication Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={(email) => {
          setIsAdmin(true);
          if (email) setCurrentUserEmail(email);
          showToast('Admin privileges unlocked successfully!');
        }}
        currentPin={adminPin}
      />

      {/* Admin Add / Edit Word Modal */}
      <AddWordModal
        isOpen={isAddWordOpen}
        onClose={() => {
          setIsAddWordOpen(false);
          setWordToEdit(null);
        }}
        onSaveWord={handleSaveWord}
        existingWords={allWords}
        editWord={wordToEdit}
      />

      {/* Admin Manage Custom Words Modal */}
      <ManageCustomWordsModal
        isOpen={isManageWordsOpen}
        onClose={() => setIsManageWordsOpen(false)}
        customWords={customWords}
        onOpenAddModal={() => {
          setWordToEdit(null);
          setIsAddWordOpen(true);
        }}
        onEditWord={handleEditWord}
        onDeleteWord={handleDeleteCustomWord}
        onSelectWordToView={handleJumpToWord}
      />

      {/* Change Admin Passcode Modal */}
      <ChangeAdminPasscodeModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
        currentPin={adminPin}
        onUpdatePin={async (newPin) => {
          setAdminPin(newPin);
          showToast('Passcode updated and synced to cloud!');
          try {
            await updateAdminPasscodeInFirestore(newPin);
          } catch (err) {
            console.error('Failed to sync passcode to Firestore:', err);
          }
        }}
      />

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-stone-900/95 dark:bg-stone-100/95 text-white dark:text-stone-900 text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 border border-stone-700/60 dark:border-stone-300/60 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
