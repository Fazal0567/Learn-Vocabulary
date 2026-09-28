/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Check, CloudCheck, Cloud } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { NavigationTab, RevisionFilter, UserSettings, WordItem, EditorialItem } from './types';
import { VOCABULARY_DATA } from './data/vocabulary';
import { DEFAULT_EDITORIALS, DUMMY_EDITORIAL_IDS } from './data/defaultEditorials';
import { Home } from './pages/Home';
import { Learn } from './pages/Learn';
import { Editorial } from './pages/Editorial';
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
import { ImportWordsJsonModal } from './components/ImportWordsJsonModal';
import { AddEditorialModal } from './components/AddEditorialModal';
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
  syncBatchWordsToFirestore,
  deleteWordFromFirestore,
  deleteAllCustomWordsFromFirestore,
  testFirestoreConnection,
  auth,
  logoutUser,
  subscribeToAdminPasscode,
  updateAdminPasscodeInFirestore,
  fetchEditorialsFromFirestore,
  subscribeToEditorials,
  syncEditorialToFirestore,
  deleteEditorialFromFirestore,
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

  // Editorial Section State (synced with Firestore)
  const [editorials, setEditorials] = useLocalStorage<EditorialItem[]>('vocab_editorials', []);
  const [isAddEditorialOpen, setIsAddEditorialOpen] = useState(false);
  const [editorialToEdit, setEditorialToEdit] = useState<EditorialItem | null>(null);

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
  const [isImportWordsOpen, setIsImportWordsOpen] = useState(false);
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

    // 4. Fetch + subscription to real Editorials in Firestore (without dummy data)
    fetchEditorialsFromFirestore().then((initialEditorials) => {
      if (initialEditorials && initialEditorials.length > 0) {
        // Automatically delete any dummy items from Firestore if previously synced
        initialEditorials.forEach((item) => {
          if (DUMMY_EDITORIAL_IDS.includes(item.id)) {
            deleteEditorialFromFirestore(item.id).catch(() => {});
          }
        });
        const clean = initialEditorials.filter((item) => !DUMMY_EDITORIAL_IDS.includes(item.id));
        setEditorials(clean);
      } else {
        setEditorials([]);
      }
    });

    const unsubscribeEditorials = subscribeToEditorials((remoteEditorials) => {
      if (remoteEditorials) {
        const clean = remoteEditorials.filter((item) => !DUMMY_EDITORIAL_IDS.includes(item.id));
        setEditorials(clean);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeWords();
      unsubscribePasscode();
      unsubscribeEditorials();
    };
  }, []);

  // Auto-prune any custom word IDs (> 1000) that might be lingering in local deletedWordIds
  useEffect(() => {
    setDeletedWordIds((prev) => {
      const filtered = prev.filter((id) => id <= 1000);
      return filtered.length !== prev.length ? filtered : prev;
    });
  }, []);

  // Auto-prune any dummy editorial IDs from local state
  useEffect(() => {
    setEditorials((prev) => {
      const clean = prev.filter((item) => !DUMMY_EDITORIAL_IDS.includes(item.id));
      return clean.length !== prev.length ? clean : prev;
    });
  }, []);

  // Combined Reactive Vocabulary: master dictionary + custom words overrides - deleted words
  const allWords = useMemo(() => {
    // deletedWordIds ONLY applies to the static 1,000 master words (IDs 1-1000)
    // Custom words (from Firestore & Admin) are authoritative from customWords
    const deletedStaticIds = new Set(deletedWordIds.filter((id) => id <= 1000));
    const customMap = new Map<number, WordItem>();
    customWords.forEach((w) => customMap.set(w.id, w));

    const list: WordItem[] = [];
    // 1. Master words (with admin edits taking precedence, unless static word was deleted)
    for (const item of VOCABULARY_DATA) {
      if (deletedStaticIds.has(item.id)) continue;
      if (customMap.has(item.id)) {
        list.push(customMap.get(item.id)!);
        customMap.delete(item.id);
      } else {
        list.push(item);
      }
    }
    // 2. All active custom words (All valid custom words from cloud/admin are included)
    for (const item of customMap.values()) {
      list.push(item);
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
      const nowIso = new Date().toISOString();
      const existingWord = customWords.find((w) => w.id === editId);
      const updatedWord: WordItem = {
        ...wordData,
        id: editId,
        isCustom: true,
        createdAt: existingWord?.createdAt || nowIso,
        updatedAt: nowIso,
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
      const nowIso = new Date().toISOString();
      const newWord: WordItem = {
        ...wordData,
        id: newId,
        isCustom: true,
        createdAt: nowIso,
        updatedAt: nowIso,
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

  // Batch Import Words from JSON (Admin Exclusive)
  const handleImportWords = async (
    wordsToAdd: Omit<WordItem, 'id'>[],
    wordsToUpdate?: WordItem[]
  ) => {
    let currentCustomList = [...customWords];
    const updatedCustomIds = new Set<number>();

    // 1. Process updates first if any
    if (wordsToUpdate && wordsToUpdate.length > 0) {
      for (const updated of wordsToUpdate) {
        updatedCustomIds.add(updated.id);
        const idx = currentCustomList.findIndex((w) => w.id === updated.id);
        if (idx >= 0) {
          currentCustomList[idx] = updated;
        } else {
          currentCustomList.push(updated);
        }
      }
    }

    // 2. Process additions
    const currentMaxId = allWords.reduce((max, w) => Math.max(max, w.id), 0);
    let nextId = Math.max(currentMaxId + 1, 1001);
    const nowIso = new Date().toISOString();
    const newItems: WordItem[] = [];

    for (const item of wordsToAdd) {
      const newWord: WordItem = {
        ...item,
        id: nextId++,
        isCustom: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      newItems.push(newWord);
      currentCustomList.push(newWord);
    }

    // 3. Update local state
    setCustomWords(currentCustomList);
    const allAffectedIds = new Set([...updatedCustomIds, ...newItems.map((n) => n.id)]);
    setDeletedWordIds((prev) => prev.filter((id) => !allAffectedIds.has(id)));

    // 4. Update IndexedDB cache for offline persistence
    const combinedForCache = allWords
      .filter((w) => !allAffectedIds.has(w.id))
      .concat(wordsToUpdate || [], newItems);
    cacheWordsToIndexedDB(combinedForCache).catch(console.warn);
    setOfflineCacheCount(combinedForCache.length);
    setLastCacheTime(nowIso);

    const totalCount = (wordsToUpdate?.length || 0) + newItems.length;
    showToast(`Syncing ${totalCount} words to cloud database...`);

    // 5. Batch sync to Firestore
    try {
      const allToSync = [...(wordsToUpdate || []), ...newItems];
      await syncBatchWordsToFirestore(allToSync, currentUserEmail || 'admin');
      showToast(`Successfully imported ${totalCount} words via JSON!`);
    } catch (err) {
      console.error('Batch sync to Firestore failed:', err);
      showToast(`Imported ${totalCount} words locally.`);
    }
  };

  const handleDeleteWord = async (id: number) => {
    const deletedWord = allWords.find((w) => w.id === id);
    const wordTitle = deletedWord?.word || `#${id}`;

    // 1. Remove from customWords and mark in deletedWordIds (only for static words <= 1000)
    setCustomWords((prev) => prev.filter((w) => w.id !== id));
    if (id <= 1000) {
      setDeletedWordIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    } else {
      setDeletedWordIds((prev) => prev.filter((dId) => dId !== id));
    }

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
    // 1. Immediately wipe local custom words and ensure custom IDs are cleared from deletedWordIds
    setCustomWords([]);
    setDeletedWordIds((prev) => prev.filter((id) => id <= 1000));

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

  // Editorial Save & Delete Handlers (Admin CRUD with Cloud Sync)
  const handleSaveEditorial = async (editorial: EditorialItem) => {
    try {
      await syncEditorialToFirestore(editorial, currentUserEmail || 'admin');
      setEditorials((prev) => {
        const index = prev.findIndex((e) => e.id === editorial.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = editorial;
          return updated;
        }
        return [editorial, ...prev];
      });
      showToast(`Editorial "${editorial.title}" saved to cloud!`);
    } catch (err: any) {
      console.error('Failed to sync editorial to Firestore:', err);
      setEditorials((prev) => {
        const index = prev.findIndex((e) => e.id === editorial.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = editorial;
          return updated;
        }
        return [editorial, ...prev];
      });
      showToast('Saved locally in offline mode.');
    }
  };

  const handleDeleteEditorial = async (editorialId: string) => {
    try {
      await deleteEditorialFromFirestore(editorialId);
      setEditorials((prev) => prev.filter((e) => e.id !== editorialId));
      showToast('Editorial deleted successfully from cloud.');
    } catch (err) {
      console.error('Failed to delete editorial from cloud:', err);
      setEditorials((prev) => prev.filter((e) => e.id !== editorialId));
      showToast('Deleted locally.');
    }
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
            onOpenImportJson={() => setIsImportWordsOpen(true)}
            onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
            currentUserEmail={currentUserEmail}
            isCloudSynced={isCloudSynced}
            editorialsCount={editorials.length}
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
            onOpenImportJson={() => setIsImportWordsOpen(true)}
          />
        )}

        {activeTab === 'editorial' && (
          <Editorial
            editorials={editorials}
            isAdmin={isAdmin}
            onOpenAddEditorial={() => {
              setEditorialToEdit(null);
              setIsAddEditorialOpen(true);
            }}
            onOpenEditEditorial={(item) => {
              setEditorialToEdit(item);
              setIsAddEditorialOpen(true);
            }}
            onDeleteEditorial={handleDeleteEditorial}
            onNavigateHome={() => setActiveTab('home')}
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
            onOpenImportJson={() => setIsImportWordsOpen(true)}
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
        editorialsCount={editorials.length}
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
        onOpenImportJson={() => setIsImportWordsOpen(true)}
      />

      {/* Admin Import Words via JSON Modal */}
      <ImportWordsJsonModal
        isOpen={isImportWordsOpen}
        onClose={() => setIsImportWordsOpen(false)}
        onImportWords={handleImportWords}
        existingWords={allWords}
      />

      {/* Admin Add / Edit Editorial Modal */}
      <AddEditorialModal
        isOpen={isAddEditorialOpen}
        onClose={() => {
          setIsAddEditorialOpen(false);
          setEditorialToEdit(null);
        }}
        onSave={handleSaveEditorial}
        editorialToEdit={editorialToEdit}
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
        onOpenImportJson={() => setIsImportWordsOpen(true)}
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
