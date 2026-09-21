/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Check, CloudCheck, Cloud, Wifi, WifiOff } from 'lucide-react';
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
  cacheWordsToIndexedDB,
  loadWordsFromIndexedDB,
  saveSingleWordToIndexedDB,
  deleteWordFromIndexedDB,
  getOfflineCacheStats,
} from './lib/indexedDb';
import {
  subscribeToWords,
  fetchWordsFromFirestore,
  syncWordToFirestore,
  deleteWordFromFirestore,
  deleteAllCustomWordsFromFirestore,
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
  const [deletedWordIds, setDeletedWordIds] = useLocalStorage<number[]>('vocab_deletedWordIds', []);

  // Offline Caching & Connection State
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineCacheCount, setOfflineCacheCount] = useState<number>(0);
  const [lastCacheTime, setLastCacheTime] = useState<string | null>(null);

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

  // Online / Offline Connection Listener with Auto-Caching
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Online: Live cloud sync active.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline Mode: Auto-cached in IndexedDB.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize IndexedDB offline cache on startup
  useEffect(() => {
    const initOfflineStorage = async () => {
      try {
        const cachedWords = await loadWordsFromIndexedDB();
        if (!cachedWords || cachedWords.length === 0) {
          // Prime IndexedDB with full 1,000 master vocabulary words for 100% offline access
          await cacheWordsToIndexedDB(VOCABULARY_DATA);
        }

        // Fetch cache stats
        const stats = await getOfflineCacheStats();
        setOfflineCacheCount(stats.count > 0 ? stats.count : VOCABULARY_DATA.length);
        setLastCacheTime(stats.lastSync);
      } catch (err) {
        console.warn('IndexedDB initial setup note:', err);
      }
    };

    initOfflineStorage();
  }, []);

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

    // 2. Immediate direct fetch + real-time subscription to global vocabulary words in Firestore
    fetchWordsFromFirestore().then((initialWords) => {
      if (initialWords && initialWords.length > 0) {
        setCustomWords(initialWords);
        setIsCloudSynced(true);
      }
    });

    const unsubscribeWords = subscribeToWords((firestoreWords) => {
      setIsCloudSynced(true);
      // Directly sync custom words with Firestore truth (removes deleted words automatically)
      setCustomWords(firestoreWords || []);
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

  // Combined Reactive Vocabulary: master dictionary + custom words overrides - deleted words
  const allWords = useMemo(() => {
    const deletedSet = new Set(deletedWordIds);
    const customMap = new Map<number, WordItem>();
    customWords.forEach((w) => customMap.set(w.id, w));

    const list: WordItem[] = [];
    // 1. Master words (with admin edits taking precedence)
    for (const item of VOCABULARY_DATA) {
      if (deletedSet.has(item.id)) continue;
      if (customMap.has(item.id)) {
        list.push(customMap.get(item.id)!);
        customMap.delete(item.id);
      } else {
        list.push(item);
      }
    }
    // 2. Any additional custom words
    for (const item of customMap.values()) {
      if (!deletedSet.has(item.id)) {
        list.push(item);
      }
    }
    return list.sort((a, b) => a.id - b.id);
  }, [customWords, deletedWordIds]);

  // Automatic IndexedDB Cache: Runs automatically in background whenever vocabulary updates
  useEffect(() => {
    if (allWords.length === 0) return;
    const timer = setTimeout(() => {
      cacheWordsToIndexedDB(allWords)
        .then(() => {
          setOfflineCacheCount(allWords.length);
          setLastCacheTime(new Date().toISOString());
        })
        .catch((e) => console.warn('Auto cache to IndexedDB:', e));
    }, 400);

    return () => clearTimeout(timer);
  }, [allWords]);

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
      setCustomWords((prev) => {
        const idx = prev.findIndex((w) => w.id === editId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedWord;
          return next;
        }
        return [...prev, updatedWord];
      });
      setDeletedWordIds((prev) => prev.filter((id) => id !== editId));

      // Immediately cache to local IndexedDB
      saveSingleWordToIndexedDB(updatedWord).catch(console.warn);
      setLastCacheTime(new Date().toISOString());

      showToast(`Word "${wordData.word}" updated! Syncing to cloud...`);
      try {
        await syncWordToFirestore(updatedWord, currentUserEmail || 'admin');
        showToast(`Word "${wordData.word}" updated & synced for all users!`);
      } catch (err) {
        console.error('Failed to sync updated word to Firestore:', err);
      }
    } else {
      const maxId = allWords.reduce((max, w) => Math.max(max, w.id), 0);
      const newId = Math.max(maxId + 1, 1001);
      const newWord: WordItem = {
        ...wordData,
        id: newId,
        isCustom: true,
      };
      setCustomWords((prev) => [...prev, newWord]);
      setDeletedWordIds((prev) => prev.filter((id) => id !== newId));

      // Immediately cache to local IndexedDB
      saveSingleWordToIndexedDB(newWord).catch(console.warn);
      setOfflineCacheCount((c) => c + 1);
      setLastCacheTime(new Date().toISOString());

      showToast(`Word "${newWord.word}" added! Syncing to cloud...`);
      try {
        await syncWordToFirestore(newWord, currentUserEmail || 'admin');
        showToast(`Word "${newWord.word}" synced live across all devices!`);
      } catch (err) {
        console.error('Failed to sync new word to Firestore:', err);
      }
    }
  };

  const handleDeleteWord = async (id: number) => {
    const deletedWord = allWords.find((w) => w.id === id);
    const wordTitle = deletedWord?.word || `#${id}`;

    // 1. Remove from customWords and mark in deletedWordIds
    setCustomWords((prev) => prev.filter((w) => w.id !== id));
    setDeletedWordIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    // 2. Clean up user progress markers
    setLearnedIds((prev) => prev.filter((itemId) => itemId !== id));
    setFavoriteIds((prev) => prev.filter((itemId) => itemId !== id));
    setImportantIds((prev) => prev.filter((itemId) => itemId !== id));
    setDifficultIds((prev) => prev.filter((itemId) => itemId !== id));
    if (currentWordId === id) {
      setCurrentWordId(1);
    }

    // 3. Delete from local IndexedDB cache
    deleteWordFromIndexedDB(id).catch(console.warn);
    setOfflineCacheCount((c) => Math.max(0, c - 1));

    showToast(`Word "${wordTitle}" deleted.`);
    try {
      await deleteWordFromFirestore(id, deletedWord?.firestoreDocId);
    } catch (err) {
      console.error('Failed to delete word from Firestore:', err);
    }
  };

  const handleDeleteAllCustomWords = async () => {
    // 1. Immediately wipe local custom words
    setCustomWords([]);

    // 2. Refresh local IndexedDB cache with clean 1,000 master words
    try {
      await cacheWordsToIndexedDB(VOCABULARY_DATA);
      setOfflineCacheCount(VOCABULARY_DATA.length);
      setLastCacheTime(new Date().toISOString());
    } catch (e) {
      console.warn('Cache re-seed note:', e);
    }

    showToast('Deleting all custom words from cloud...');
    try {
      await deleteAllCustomWordsFromFirestore();
      showToast('All custom words cleared! Pristine 1,000 dictionary active.');
    } catch (err) {
      console.error('Failed to delete all custom words from Firestore:', err);
      showToast('Local custom words cleared.');
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
      {/* Network Status Corner Icon (Shows Online / Offline logo) */}
      <div
        title={isOnline ? 'Online (Auto-synced)' : 'Offline (Auto-cached in IndexedDB)'}
        className="absolute top-2.5 left-3 z-40 px-2 py-1 rounded-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex items-center gap-1.5 text-[11px] font-semibold text-stone-700 dark:text-stone-300 pointer-events-auto transition-all"
      >
        {isOnline ? (
          <>
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          </>
        )}
      </div>

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
            isOnline={isOnline}
            offlineCacheCount={offlineCacheCount || allWords.length}
            lastCacheTime={lastCacheTime}
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
        allWords={allWords}
        customWords={customWords}
        onOpenAddModal={() => {
          setWordToEdit(null);
          setIsAddWordOpen(true);
        }}
        onEditWord={handleEditWord}
        onDeleteWord={handleDeleteWord}
        onDeleteAllCustomWords={handleDeleteAllCustomWords}
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
