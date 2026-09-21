import { WordItem } from '../types';

const DB_NAME = 'VocabularyLearnDB';
const DB_VERSION = 1;
const WORDS_STORE = 'words';
const META_STORE = 'meta';

/**
 * Initialize IndexedDB instance for offline vocabulary caching
 */
export function openVocabularyDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create words store with 'id' as primary key
      if (!db.objectStoreNames.contains(WORDS_STORE)) {
        const wordsStore = db.createObjectStore(WORDS_STORE, { keyPath: 'id' });
        wordsStore.createIndex('word', 'word', { unique: false });
      }

      // Create metadata store for tracking cache timestamps
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Cache all vocabulary words into IndexedDB for offline persistence
 */
export async function cacheWordsToIndexedDB(words: WordItem[]): Promise<void> {
  if (!words || words.length === 0) return;

  const db = await openVocabularyDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([WORDS_STORE, META_STORE], 'readwrite');
    const wordsStore = tx.objectStore(WORDS_STORE);
    const metaStore = tx.objectStore(META_STORE);

    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();

    // Clear and put all active words to maintain exact synchronization
    wordsStore.clear();

    // Store each word
    for (const item of words) {
      wordsStore.put(item);
    }

    // Update metadata timestamp
    metaStore.put({
      key: 'lastSyncTimestamp',
      timestamp: new Date().toISOString(),
      count: words.length,
    });
  });
}

/**
 * Retrieve all cached words from IndexedDB
 */
export async function loadWordsFromIndexedDB(): Promise<WordItem[]> {
  try {
    const db = await openVocabularyDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(WORDS_STORE, 'readonly');
      const wordsStore = tx.objectStore(WORDS_STORE);
      const request = wordsStore.getAll();

      request.onsuccess = () => {
        const items = request.result as WordItem[];
        // Sort by id ascending
        items.sort((a, b) => a.id - b.id);
        resolve(items);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to fetch words from IndexedDB'));
      };
    });
  } catch (err) {
    console.warn('IndexedDB read warning:', err);
    return [];
  }
}

/**
 * Cache or update a single word in IndexedDB
 */
export async function saveSingleWordToIndexedDB(word: WordItem): Promise<void> {
  const db = await openVocabularyDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([WORDS_STORE, META_STORE], 'readwrite');
    const wordsStore = tx.objectStore(WORDS_STORE);
    const metaStore = tx.objectStore(META_STORE);

    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();

    wordsStore.put(word);
    metaStore.put({
      key: 'lastSyncTimestamp',
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Delete a word from IndexedDB cache
 */
export async function deleteWordFromIndexedDB(wordId: number): Promise<void> {
  const db = await openVocabularyDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(WORDS_STORE, 'readwrite');
    const wordsStore = tx.objectStore(WORDS_STORE);

    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();

    wordsStore.delete(wordId);
  });
}

/**
 * Get offline cache statistics (total cached words count and last sync date)
 */
export async function getOfflineCacheStats(): Promise<{ count: number; lastSync: string | null }> {
  try {
    const db = await openVocabularyDB();

    return new Promise((resolve) => {
      const tx = db.transaction([WORDS_STORE, META_STORE], 'readonly');
      const wordsStore = tx.objectStore(WORDS_STORE);
      const metaStore = tx.objectStore(META_STORE);

      const countReq = wordsStore.count();
      const metaReq = metaStore.get('lastSyncTimestamp');

      let count = 0;
      let lastSync: string | null = null;

      countReq.onsuccess = () => {
        count = countReq.result || 0;
      };

      metaReq.onsuccess = () => {
        if (metaReq.result && metaReq.result.timestamp) {
          lastSync = metaReq.result.timestamp;
        }
      };

      tx.oncomplete = () => {
        resolve({ count, lastSync });
      };

      tx.onerror = () => {
        resolve({ count: 0, lastSync: null });
      };
    });
  } catch (err) {
    console.warn('Failed to retrieve cache stats:', err);
    return { count: 0, lastSync: null };
  }
}
