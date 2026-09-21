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
}

export type NavigationTab =
  | 'home'
  | 'learn'
  | 'important'
  | 'favorites'
  | 'revision'
  | 'quiz'
  | 'search'
  | 'progress'
  | 'settings';

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
