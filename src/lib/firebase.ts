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
import { WordItem } from '../types';

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
