import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  getDoc,
  orderBy,
  getDocFromServer,
  writeBatch,
  increment,
  limit,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  signInAnonymously,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { WordItem, EditorialItem, VisitorRecord, UserAnalyticsStats } from '../types';

// Designated Super Admin Email from project creator
export const SUPER_ADMIN_EMAIL = 'fazalalicontribute@gmail.com';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId if specified
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Test connection on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'config', 'adminPasscode'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client offline, utilizing cached state.');
    }
  }
}

/**
 * Direct fetch of global vocabulary words from Firestore
 */
export async function fetchWordsFromFirestore(): Promise<WordItem[]> {
  try {
    const wordsRef = collection(db, 'words');
    const snapshot = await getDocs(wordsRef);
    const words: WordItem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      words.push({
        id: typeof data.id === 'number' ? data.id : parseInt(data.id || docSnap.id, 10) || 1001,
        firestoreDocId: docSnap.id,
        word: data.word || '',
        pos: data.pos || undefined,
        meaningHindi: data.meaningHindi || '',
        meaningEnglish: data.meaningEnglish || '',
        synonyms: Array.isArray(data.synonyms) ? data.synonyms : [],
        antonyms: Array.isArray(data.antonyms) ? data.antonyms : [],
        example: data.example || '',
        customTip: data.customTip || undefined,
        isCustom: true,
        createdAt: data.createdAt || data.updatedAt || undefined,
        updatedAt: data.updatedAt || undefined,
      });
    });
    return words.sort((a, b) => a.id - b.id);
  } catch (err) {
    console.warn('Direct fetch from Firestore error:', err);
    return [];
  }
}

/**
 * Real-time listener for global vocabulary words added by the Admin
 */
export function subscribeToWords(onWordsUpdated: (words: WordItem[]) => void) {
  const wordsRef = collection(db, 'words');

  return onSnapshot(
    wordsRef,
    (snapshot) => {
      const words: WordItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        words.push({
          id: typeof data.id === 'number' ? data.id : parseInt(data.id || docSnap.id, 10) || 1001,
          firestoreDocId: docSnap.id,
          word: data.word || '',
          pos: data.pos || undefined,
          meaningHindi: data.meaningHindi || '',
          meaningEnglish: data.meaningEnglish || '',
          synonyms: Array.isArray(data.synonyms) ? data.synonyms : [],
          antonyms: Array.isArray(data.antonyms) ? data.antonyms : [],
          example: data.example || '',
          customTip: data.customTip || undefined,
          isCustom: true,
          createdAt: data.createdAt || data.updatedAt || undefined,
          updatedAt: data.updatedAt || undefined,
        });
      });
      words.sort((a, b) => a.id - b.id);
      onWordsUpdated(words);
    },
    (error) => {
      console.error('Error listening to global words from Firestore:', error);
    }
  );
}

/**
 * Save or update a vocabulary word in the global Firestore database
 */
export async function syncWordToFirestore(wordItem: WordItem, authorEmail?: string) {
  const docRef = doc(db, 'words', String(wordItem.id));
  const nowIso = new Date().toISOString();
  await setDoc(
    docRef,
    {
      id: wordItem.id,
      word: wordItem.word.toUpperCase(),
      pos: wordItem.pos || '',
      meaningHindi: wordItem.meaningHindi,
      meaningEnglish: wordItem.meaningEnglish,
      synonyms: wordItem.synonyms || [],
      antonyms: wordItem.antonyms || [],
      example: wordItem.example || '',
      customTip: wordItem.customTip || '',
      isCustom: true,
      createdAt: wordItem.createdAt || nowIso,
      updatedAt: nowIso,
      updatedBy: authorEmail || auth.currentUser?.email || 'admin',
    },
    { merge: true }
  );
}

/**
 * Batch save multiple vocabulary words into Firestore using atomic writeBatch chunks
 */
export async function syncBatchWordsToFirestore(
  words: WordItem[],
  authorEmail?: string,
  onProgress?: (processed: number, total: number) => void
): Promise<void> {
  if (!words || words.length === 0) return;
  const nowIso = new Date().toISOString();
  const author = authorEmail || auth.currentUser?.email || 'admin';
  const BATCH_CHUNK_SIZE = 400; // Well within Firestore's 500 operations per batch limit

  for (let i = 0; i < words.length; i += BATCH_CHUNK_SIZE) {
    const chunk = words.slice(i, i + BATCH_CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const item of chunk) {
      const docRef = doc(db, 'words', String(item.id));
      batch.set(
        docRef,
        {
          id: item.id,
          word: item.word.toUpperCase().trim(),
          pos: item.pos || '',
          meaningHindi: item.meaningHindi || '',
          meaningEnglish: item.meaningEnglish || '',
          synonyms: Array.isArray(item.synonyms) ? item.synonyms : [],
          antonyms: Array.isArray(item.antonyms) ? item.antonyms : [],
          example: item.example || '',
          customTip: item.customTip || '',
          isCustom: true,
          createdAt: item.createdAt || nowIso,
          updatedAt: nowIso,
          updatedBy: author,
        },
        { merge: true }
      );
    }

    await batch.commit();
    if (onProgress) {
      onProgress(Math.min(i + chunk.length, words.length), words.length);
    }
  }
}

/**
 * Delete a vocabulary word from global Firestore (by docId, string ID, and queried ID)
 */
export async function deleteWordFromFirestore(wordId: number, docId?: string): Promise<void> {
  // 1. Delete by direct document ID if known
  if (docId) {
    try {
      await deleteDoc(doc(db, 'words', docId));
    } catch (e) {
      console.warn('Direct docId delete error:', e);
    }
  }

  // 2. Delete by string wordId
  try {
    await deleteDoc(doc(db, 'words', String(wordId)));
  } catch (e) {
    console.warn('Direct stringId delete error:', e);
  }

  // 3. Search and delete any remaining document matching this id
  try {
    const q = query(collection(db, 'words'), where('id', '==', wordId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (e) {
    console.warn('Query-based delete error:', e);
  }
}

/**
 * Wipe all custom words from Firestore (resets back to pristine 1,000 master words)
 */
export async function deleteAllCustomWordsFromFirestore(): Promise<void> {
  const snap = await getDocs(collection(db, 'words'));
  const promises = snap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(promises);
}

/**
 * Check if the currently logged in user is the verified admin
 */
export function isUserAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Sign in with Google Popup (optional alternative)
 */
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Authenticate Admin with secret Passcode
 */
export async function loginAdminWithPasscode(
  enteredPasscode: string,
  validPasscode: string
): Promise<boolean> {
  const entered = enteredPasscode.trim();
  let authoritativePasscode = validPasscode.trim();

  try {
    const configSnap = await getDoc(doc(db, 'config', 'admin'));
    if (configSnap.exists()) {
      const cloudPasscode = configSnap.data()?.passcode;
      if (cloudPasscode && typeof cloudPasscode === 'string') {
        authoritativePasscode = cloudPasscode.trim();
        try {
          localStorage.setItem('vocab_adminPin', JSON.stringify(authoritativePasscode));
        } catch {
          // ignore
        }
      }
    }
  } catch (err) {
    console.warn('Direct Firestore passcode check fallback:', err);
  }

  // Strictly validate ONLY against the authoritative passcode
  if (entered !== authoritativePasscode) {
    throw new Error('Incorrect admin passcode. Please enter the correct passcode.');
  }

  // Ensure an authenticated Firebase session for Firestore writes if supported, without blocking on errors
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.warn('Anonymous sign-in not enabled or skipped:', e);
    }
  }
  return true;
}

/**
 * Listen for admin passcode updates from Firestore so passcode changes
 * sync across all admin devices
 */
export function subscribeToAdminPasscode(onPasscodeUpdated: (passcode: string) => void) {
  const configDocRef = doc(db, 'config', 'admin');
  return onSnapshot(
    configDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.passcode) {
          onPasscodeUpdated(data.passcode);
        }
      }
    },
    (err) => {
      console.warn('Config passcode read note:', err.message);
    }
  );
}

/**
 * Update the Admin Passcode in Firestore (syncs across all your devices)
 */
export async function updateAdminPasscodeInFirestore(newPasscode: string) {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.warn('Anonymous sign-in not enabled or skipped:', e);
    }
  }
  const configDocRef = doc(db, 'config', 'admin');
  await setDoc(
    configDocRef,
    {
      passcode: newPasscode.trim(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/**
 * Sign in as guest learner
 */
export async function loginAsGuest(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

/**
 * Sign out
 */
export async function logoutUser() {
  await signOut(auth);
}

/**
 * Direct fetch of all editorials from Firestore
 */
export async function fetchEditorialsFromFirestore(): Promise<EditorialItem[]> {
  try {
    const edRef = collection(db, 'editorials');
    const snapshot = await getDocs(edRef);
    const editorials: EditorialItem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      editorials.push({
        id: docSnap.id,
        title: data.title || 'Untitled Editorial',
        date: data.date || new Date().toISOString().split('T')[0],
        publisher: data.publisher || 'Unknown Publisher',
        category: data.category || 'General',
        content: data.content || '',
        summary: data.summary || '',
        vocabulary: Array.isArray(data.vocabulary) ? data.vocabulary : [],
        mcqs: Array.isArray(data.mcqs) ? data.mcqs : [],
        readingTimeMinutes: typeof data.readingTimeMinutes === 'number' ? data.readingTimeMinutes : 4,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || undefined,
        createdBy: data.createdBy || undefined,
      });
    });
    return editorials.sort((a, b) => b.date.localeCompare(a.date));
  } catch (err) {
    console.warn('Direct fetch editorials error:', err);
    return [];
  }
}

/**
 * Real-time listener for editorials collection
 */
export function subscribeToEditorials(onUpdated: (editorials: EditorialItem[]) => void) {
  const edRef = collection(db, 'editorials');
  return onSnapshot(
    edRef,
    (snapshot) => {
      const editorials: EditorialItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        editorials.push({
          id: docSnap.id,
          title: data.title || 'Untitled Editorial',
          date: data.date || new Date().toISOString().split('T')[0],
          publisher: data.publisher || 'Unknown Publisher',
          category: data.category || 'General',
          content: data.content || '',
          summary: data.summary || '',
          vocabulary: Array.isArray(data.vocabulary) ? data.vocabulary : [],
          mcqs: Array.isArray(data.mcqs) ? data.mcqs : [],
          readingTimeMinutes: typeof data.readingTimeMinutes === 'number' ? data.readingTimeMinutes : 4,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || undefined,
          createdBy: data.createdBy || undefined,
        });
      });
      editorials.sort((a, b) => b.date.localeCompare(a.date));
      onUpdated(editorials);
    },
    (err) => {
      console.warn('Subscription error for editorials:', err);
    }
  );
}

/**
 * Sync or create an editorial in Firestore
 */
export async function syncEditorialToFirestore(editorial: EditorialItem, authorEmail?: string) {
  const docRef = doc(db, 'editorials', editorial.id);
  const nowIso = new Date().toISOString();
  await setDoc(
    docRef,
    {
      id: editorial.id,
      title: editorial.title.trim(),
      date: editorial.date.trim(),
      publisher: editorial.publisher.trim(),
      category: (editorial.category || 'General').trim(),
      content: editorial.content.trim(),
      summary: (editorial.summary || '').trim(),
      vocabulary: editorial.vocabulary || [],
      mcqs: editorial.mcqs || [],
      readingTimeMinutes: editorial.readingTimeMinutes || Math.max(1, Math.ceil(editorial.content.split(/\s+/).length / 200)),
      createdAt: editorial.createdAt || nowIso,
      updatedAt: nowIso,
      createdBy: authorEmail || auth.currentUser?.email || 'admin',
    },
    { merge: true }
  );
}

/**
 * Batch save multiple editorials to Firestore in chunks
 */
export async function syncBatchEditorialsToFirestore(
  editorials: EditorialItem[],
  authorEmail?: string
): Promise<void> {
  if (!editorials || editorials.length === 0) return;
  const nowIso = new Date().toISOString();
  const author = authorEmail || auth.currentUser?.email || 'admin';
  const BATCH_CHUNK_SIZE = 400;

  for (let i = 0; i < editorials.length; i += BATCH_CHUNK_SIZE) {
    const chunk = editorials.slice(i, i + BATCH_CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const item of chunk) {
      const docRef = doc(db, 'editorials', item.id);
      batch.set(
        docRef,
        {
          id: item.id,
          title: item.title.trim(),
          date: item.date.trim(),
          publisher: item.publisher.trim(),
          category: (item.category || 'General').trim(),
          content: item.content.trim(),
          summary: (item.summary || '').trim(),
          vocabulary: Array.isArray(item.vocabulary) ? item.vocabulary : [],
          mcqs: Array.isArray(item.mcqs) ? item.mcqs : [],
          readingTimeMinutes: item.readingTimeMinutes || Math.max(1, Math.ceil(item.content.split(/\s+/).length / 200)),
          createdAt: item.createdAt || nowIso,
          updatedAt: nowIso,
          createdBy: author,
        },
        { merge: true }
      );
    }

    await batch.commit();
  }
}

/**
 * Delete an editorial from Firestore
 */
export async function deleteEditorialFromFirestore(editorialId: string): Promise<void> {
  const docRef = doc(db, 'editorials', editorialId);
  await deleteDoc(docRef);
}

/**
 * Automatically log an anonymous visitor / device session in Firestore.
 * Lightweight, privacy-safe, and runs once per session/visit.
 */
export async function trackUserVisit(wordsLearnedCount?: number): Promise<void> {
  try {
    let visitorId = localStorage.getItem('vocab_visitor_id');
    let isNewVisitor = false;
    if (!visitorId) {
      isNewVisitor = true;
      visitorId = 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
      localStorage.setItem('vocab_visitor_id', visitorId);
    }

    const todayDate = new Date().toISOString().slice(0, 10);
    const sessionKey = 'vocab_session_' + todayDate;
    const isNewSession = !sessionStorage.getItem(sessionKey);
    if (isNewSession) {
      sessionStorage.setItem(sessionKey, '1');
    }

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    let deviceType: 'Mobile' | 'Tablet' | 'Desktop' = 'Desktop';
    if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
      deviceType = 'Tablet';
    } else if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
      deviceType = 'Mobile';
    }

    let platform = 'Web';
    if (/android/i.test(ua)) platform = 'Android';
    else if (/iphone|ipad|ipod/i.test(ua)) platform = 'iOS';
    else if (/windows/i.test(ua)) platform = 'Windows';
    else if (/macintosh|mac os x/i.test(ua)) platform = 'macOS';
    else if (/linux/i.test(ua)) platform = 'Linux';

    const nowIso = new Date().toISOString();
    let firstSeen = localStorage.getItem('vocab_visitor_first_seen');
    if (!firstSeen) {
      firstSeen = nowIso;
      localStorage.setItem('vocab_visitor_first_seen', firstSeen);
    }

    const visitorDocRef = doc(db, 'visitors', visitorId);
    await setDoc(
      visitorDocRef,
      {
        id: visitorId,
        firstSeenAt: firstSeen,
        lastActiveAt: nowIso,
        lastActiveDate: todayDate,
        visitCount: increment(isNewSession ? 1 : 0),
        deviceType,
        platform,
        wordsLearnedCount: typeof wordsLearnedCount === 'number' ? wordsLearnedCount : 0,
      },
      { merge: true }
    );

    // Global aggregated counts in analytics/overview
    const overviewRef = doc(db, 'analytics', 'overview');
    await setDoc(
      overviewRef,
      {
        id: 'overview',
        totalVisitors: increment(isNewVisitor ? 1 : 0),
        totalSessions: increment(isNewSession ? 1 : 0),
        lastUpdated: nowIso,
      },
      { merge: true }
    );
  } catch (err) {
    // Graceful offline fallback - never interrupt user experience
    console.debug('Visitor tracking note:', err);
  }
}

/**
 * Fetch detailed user and visitor analytics (Strictly for Admin view)
 */
export async function fetchUserAnalyticsStats(): Promise<UserAnalyticsStats> {
  try {
    const todayDate = new Date().toISOString().slice(0, 10);
    const visitorsRef = collection(db, 'visitors');
    const snap = await getDocs(visitorsRef);

    let totalUniqueUsers = 0;
    let activeToday = 0;
    let totalAppOpens = 0;
    let mobileUsersCount = 0;
    let desktopUsersCount = 0;
    let tabletUsersCount = 0;
    const visitors: VisitorRecord[] = [];

    snap.forEach((docSnap) => {
      totalUniqueUsers++;
      const d = docSnap.data();
      const vCount = typeof d.visitCount === 'number' ? d.visitCount : 1;
      totalAppOpens += Math.max(1, vCount);

      if (d.lastActiveDate === todayDate) {
        activeToday++;
      }

      const dType = d.deviceType === 'Mobile' ? 'Mobile' : d.deviceType === 'Tablet' ? 'Tablet' : 'Desktop';
      if (dType === 'Mobile') mobileUsersCount++;
      else if (dType === 'Tablet') tabletUsersCount++;
      else desktopUsersCount++;

      visitors.push({
        id: docSnap.id,
        firstSeenAt: d.firstSeenAt || d.lastActiveAt || '',
        lastActiveAt: d.lastActiveAt || '',
        lastActiveDate: d.lastActiveDate || '',
        visitCount: Math.max(1, vCount),
        deviceType: dType,
        platform: d.platform || 'Unknown',
        wordsLearnedCount: typeof d.wordsLearnedCount === 'number' ? d.wordsLearnedCount : 0,
      });
    });

    // Sort recent visitors by lastActiveAt descending
    visitors.sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt));

    // Fallback or augment with analytics/overview counters
    try {
      const overviewSnap = await getDoc(doc(db, 'analytics', 'overview'));
      if (overviewSnap.exists()) {
        const ovData = overviewSnap.data();
        if (typeof ovData.totalSessions === 'number' && ovData.totalSessions > totalAppOpens) {
          totalAppOpens = ovData.totalSessions;
        }
        if (typeof ovData.totalVisitors === 'number' && ovData.totalVisitors > totalUniqueUsers) {
          totalUniqueUsers = ovData.totalVisitors;
        }
      }
    } catch {
      // ignore
    }

    return {
      totalUniqueUsers: Math.max(totalUniqueUsers, 1),
      activeToday: Math.max(activeToday, 1),
      totalAppOpens: Math.max(totalAppOpens, 1),
      mobileUsersCount,
      desktopUsersCount: Math.max(desktopUsersCount, 1),
      tabletUsersCount,
      recentVisitors: visitors.slice(0, 50),
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Error fetching analytics stats:', err);
    return {
      totalUniqueUsers: 1,
      activeToday: 1,
      totalAppOpens: 1,
      mobileUsersCount: 0,
      desktopUsersCount: 1,
      tabletUsersCount: 0,
      recentVisitors: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Real-time subscription to visitors collection for live admin analytics updates
 */
export function subscribeToUserAnalytics(onStatsUpdated: (stats: UserAnalyticsStats) => void) {
  const visitorsRef = collection(db, 'visitors');
  return onSnapshot(
    visitorsRef,
    () => {
      fetchUserAnalyticsStats().then((stats) => {
        onStatsUpdated(stats);
      });
    },
    (err) => {
      console.warn('Subscription error for visitors analytics:', err);
    }
  );
}
