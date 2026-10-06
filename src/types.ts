export interface WordItem {
  id: number;
  word: string;
  pos?: string; // 'v.', 'n.', 'adj.', 'adv.'
  meaningHindi: string;
  meaningEnglish: string;
  synonyms: string[];
  antonyms: string[];
  example: string;
  isCustom?: boolean;
  customTip?: string;
  firestoreDocId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type NavigationTab =
  | 'home'
  | 'learn'
  | 'editorial'
  | 'important'
  | 'favorites'
  | 'revision'
  | 'quiz'
  | 'search'
  | 'progress'
  | 'settings';

export interface EditorialMCQ {
  id: string;
  question: string;
  options: string[]; // 4 options
  correctOptionIndex: number; // 0, 1, 2, 3
  explanation: string;
}

export interface EditorialVocabulary {
  word: string;
  meaningHindi: string;
  meaningEnglish: string;
  partOfSpeech?: string;
  contextSentence?: string;
}

export interface EditorialItem {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD" e.g. "2026-09-24"
  publisher: string; // e.g. "The Hindu", "The Indian Express", etc.
  category?: string; // e.g. "Economy", "Polity & Governance", "International", etc.
  content: string; // Main editorial article text
  summary?: string; // Key takeaways
  vocabulary?: EditorialVocabulary[];
  mcqs: EditorialMCQ[];
  readingTimeMinutes?: number;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export type RevisionFilter = 'all' | 'unlearned' | 'important' | 'favorites' | 'difficult' | 'custom';

export interface UserSettings {
  darkMode: boolean;
  autoPronounce: boolean;
  animations: boolean;
  dailyGoal: number;
}

export interface AppState {
  learnedIds: number[];
  favoriteIds: number[];
  importantIds: number[];
  difficultIds: number[];
  currentWordId: number;
  lastStudyDate: string;
  todayLearnedIds: number[];
  dailyGoal: number;
  settings: UserSettings;
}

export interface QuizQuestion {
  id: number;
  type: 'meaning' | 'synonym' | 'antonym' | 'hindi';
  prompt: string;
  questionWord?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface VisitorRecord {
  id: string;
  firstSeenAt: string;
  lastActiveAt: string;
  lastActiveDate: string;
  visitCount: number;
  deviceType: 'Mobile' | 'Tablet' | 'Desktop';
  platform?: string;
  wordsLearnedCount?: number;
}

export interface UserAnalyticsStats {
  totalUniqueUsers: number;
  activeToday: number;
  totalAppOpens: number;
  mobileUsersCount: number;
  desktopUsersCount: number;
  tabletUsersCount: number;
  recentVisitors: VisitorRecord[];
  lastUpdated?: string;
}
