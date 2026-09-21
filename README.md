# Learn Vocabulary

A modern, mobile-first, reels-style vocabulary learning web application designed for fast, focused, and intuitive English language mastery. Featuring 1,000 high-yield curated words with English definitions, Hindi meanings, synonyms, antonyms, contextual examples, native text-to-speech pronunciation, interactive quizzes, and in-depth learning analytics.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Application Views](#-application-views)
- [Gesture & Interaction Engine](#-gesture--interaction-engine)
- [Data Structure & Types](#-data-structure--types)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Local Storage & State Persistence](#-local-storage--state-persistence)
- [Getting Started](#-getting-started)
- [Keyboard Shortcuts](#-keyboard-shortcuts)

---

## ✨ Key Features

### 1. Vertical Reels-Style Learning Feed
- **Full-Viewport Flashcards**: Distraction-free single-word display reminiscent of short-form video reels.
- **Vertical Swipe & Scroll**: Navigate seamlessly between words using touch swipes, trackpad/mouse wheel gestures, or arrow keys.
- **Micro-Animations**: Smooth vertical entering and exiting card transitions powered by Motion (`motion/react`).
- **On-Screen Navigation Buttons**: Accessible floating chevrons on both mobile and desktop for one-tap forward/backward stepping.

### 2. Comprehensive Word Content
- **Bilingual Meanings**: Bold primary English word pairing with prominent Devanagari Hindi translation (`Noto Sans Devanagari`).
- **English Definitions**: Concise grammatical definitions and usage context.
- **Synonyms & Antonyms**: Two-column color-coded comparison grid for rapid vocabulary association.
- **Contextual Example Sentences**: Practical exam-grade sentences demonstrating real-world word application.
- **Vocabulary Tips**: Expandable tips highlighting common collocations, prepositions, and cloze test strategies.

### 3. Audio & Pronunciation
- **Instant Speech Synthesis**: Crystal-clear native pronunciation powered by the Web Speech API (`speechSynthesis`).
- **Auto-Pronounce Mode**: Configurable setting to automatically vocalize each word upon swiping into view.

### 4. Interactive Quiz Engine
- **Multiple Question Archetypes**:
  - Word to Hindi Meaning identification
  - Hindi Meaning to English Word matching
  - Synonym identification
  - Antonym identification
- **Instant Feedback**: Real-time answer validation with color-coded success/error states and detailed explanations.
- **Performance Summary**: Comprehensive post-quiz score cards with accuracy percentage, question counts, and adaptive recommendations.

### 5. Multi-Criteria Filtering & Organization
- **Learned Marker**: Check off words you have mastered to filter them out of subsequent study feeds.
- **Favorite Bank**: Bookmark terms with the heart icon for quick access.
- **Star (Important)**: Flag high-priority words for focused review.
- **Difficult Words**: Tag challenging words with the alert icon to revisit before exams.
- **Revision View**: Dedicated hub for focused drills on custom lists (e.g., Starred, Hard, Favorites, or Unlearned).

### 6. Search & Quick Lookup
- **Bilingual Search**: Instant search modal supporting queries in both English and Devanagari Hindi.
- **One-Tap Jump**: Directly jump from search results to that exact word in the study feed.

### 7. Learning Analytics & Daily Streaks
- **Daily Target Tracking**: Set custom daily goals (10, 20, 30, 50, or custom count) with automated streak counters.
- **Visual Progress Metrics**: Real-time progress bars calculating overall percentage mastered out of the 1,000-word bank.
- **Categorical Breakdown**: Counters for Learned, Starred, Favorited, and Difficult vocabulary.

### 8. Theming & Customization
- **Dark Mode**: Complete high-contrast dark theme optimized for eye comfort during night study sessions.
- **Quick Header Toggles**: Switch themes directly from the header on both the Home and Learn screens, or via Settings.
- **Performance Settings**: Ability to toggle transition animations for lower-power devices.

### 9. Admin Word Management (Restricted Access)
- **Role-Based Protection**: Only authenticated administrators can add, edit, or delete custom vocabulary words.
- **Secure Passcode Authentication**: Protected by an administrative passcode (default: `admin123`, customizable in Settings).
- **Comprehensive Word Authoring**:
  - English word with automated audio pronunciation tester
  - Hindi translation in Devanagari script
  - English definition
  - Part of speech selector (`n.`, `v.`, `adj.`, `adv.`, `phr.`, `idiom`, or custom)
  - Synonyms and antonyms tagging
  - Contextual example sentence
  - Custom vocabulary and usage tips
- **Duplicate Word Prevention**: Real-time checking alerts the admin if a word already exists in the dictionary.
- **Word Manager Portal**: Dedicated admin modal to search, view, edit, delete, or export custom-added words as JSON.
- **Seamless Integration**: Newly added words automatically appear across the Reels feed, Search index, Revision decks, and Practice quizzes.

---

## 📱 Application Views

| View | Description | Key Components |
|---|---|---|
| **Home** (`/`) | Main dashboard displaying daily streak, quick resume card, study stats, quick navigation shortcuts, and topic banks. | `Home.tsx`, `ProgressBar.tsx` |
| **Learn** (`/learn`) | Vertical reels-style card feed for continuous flashcard study with floating controls and pronunciation. | `Learn.tsx`, `WordCard.tsx`, `ProgressBar.tsx` |
| **Important** (`/important`) | Dedicated repository of starred words with quick review actions and jump-to-word capability. | `Important.tsx` |
| **Favorites** (`/favorites`) | Saved favorite words repository with pronunciation and removal controls. | `Favorites.tsx` |
| **Revision** (`/revision`) | Targeted study room filtered by category (Unlearned, Starred, Favorites, Difficult). | `Revision.tsx` |
| **Quiz** (`/quiz`) | 10-question timed practice quizzes with diverse questions, explanations, and results. | `Quiz.tsx` |
| **Search** | Modal dialog with real-time bilingual indexing and instant word selection. | `SearchModal.tsx` |
| **Progress** (`/progress`) | Comprehensive analytics, completion percentages, breakdown stats, and accuracy rates. | `Progress.tsx` |
| **Settings** (`/settings`) | Theme configuration, daily goal slider, auto-pronunciation, transitions, and data reset. | `Settings.tsx`, `ConfirmModal.tsx` |

---

## 👆 Gesture & Interaction Engine

The navigation experience is driven by the custom `useSwipe` hook (`src/hooks/useSwipe.ts`):

- **Touch Events (`touchstart`, `touchend`)**: Measures vertical displacement (`deltaY`) vs horizontal (`deltaX`). If vertical displacement exceeds the 35px threshold (or a high-velocity flick is registered), triggers `onNext()` or `onPrev()`.
- **Wheel / Trackpad Events (`wheel`)**: Captures non-passive wheel events across the flashcard viewport, mapping downward scrolls (`deltaY > 0`) to forward navigation and upward scrolls to previous words.
- **Gesture Debounce & Cooldown**: Enforces a 280ms navigation lock preventing accidental double-skips during momentum scrolling.
- **Overscroll Containment**: Card body uses `overscroll-behavior: contain` to isolate internal scroll containers from page-level gestures.

---

## 🗄️ Data Structure & Types

### Word Item (`WordItem`)
```typescript
export interface WordItem {
  id: number;              // Unique identifier (1 to 1000)
  word: string;            // English word (e.g. "Abstain")
  pos?: string;            // Part of speech (e.g. "v.", "n.", "adj.")
  meaningHindi: string;    // Devanagari Hindi translation (e.g. "बचना, परहेज करना")
  meaningEnglish: string;  // English definition
  synonyms: string[];      // Array of synonyms
  antonyms: string[];      // Array of antonyms
  example: string;         // Contextual usage sentence
}
```

### User Settings (`UserSettings`)
```typescript
export interface UserSettings {
  darkMode: boolean;       // Active theme state
  autoPronounce: boolean;  // Automatically speak words on swipe
  animations: boolean;     // Enable/disable motion card transitions
  dailyGoal: number;       // Target words to learn per day (default: 20)
}
```

### Quiz Question (`QuizQuestion`)
```typescript
export interface QuizQuestion {
  id: number;
  type: 'meaning' | 'synonym' | 'antonym' | 'hindi';
  prompt: string;
  questionWord?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
```

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/) with `@tailwindcss/vite`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with CSS custom dark variant (`@custom-variant dark (&:where(.dark, .dark *));`)
- **Animation**: [Motion](https://motion.dev/) (`motion/react`)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Audio**: Web Speech API (`window.speechSynthesis`)
- **Typography**: 
  - *Rozha One* & *Cinzel* for headings and typography contrast
  - *Plus Jakarta Sans* for clean, modern body copy
  - *Noto Sans Devanagari* for authentic Hindi script rendering

---

## 📂 Project Architecture

```
├── index.html                  # HTML entry point with metadata and Google Fonts
├── metadata.json               # Application metadata and capabilities
├── package.json                # Dependencies and npm scripts
├── vite.config.ts              # Vite configuration with Tailwind CSS v4 plugin
└── src/
    ├── main.tsx                # React DOM root mounting
    ├── App.tsx                 # Core application state, tabs routing, and storage
    ├── index.css               # Tailwind imports, dark mode variant, utility classes
    ├── types.ts                # TypeScript interfaces and navigation types
    ├── components/             # Reusable UI components
    │   ├── BottomNavigation.tsx# 5-item mobile bottom navigation bar
    │   ├── ConfirmModal.tsx    # Dialog confirmation for irreversible actions (e.g. reset)
    │   ├── ProgressBar.tsx     # Progress indicator with category chips
    │   ├── SearchModal.tsx     # Bilingual instant search overlay
    │   └── WordCard.tsx        # Main animated flashcard with actions and audio
    ├── data/
    │   └── vocabulary.ts       # Curated 1,000-word dataset with Hindi translations
    ├── hooks/
    │   ├── useLocalStorage.ts  # Generic synchronized localStorage hook with fallback
    │   └── useSwipe.ts         # Gesture, wheel, and keyboard navigation engine
    ├── pages/                  # Primary view modules
    │   ├── Favorites.tsx       # Saved words repository
    │   ├── Home.tsx            # Main dashboard and overview
    │   ├── Important.tsx       # Starred words hub
    │   ├── Learn.tsx           # Reels-style vertical flashcard interface
    │   ├── Progress.tsx        # Analytics and performance graphs
    │   ├── Quiz.tsx            # Interactive multiple-choice vocabulary quiz
    │   ├── Revision.tsx        # Filtered study sets
    │   └── Settings.tsx        # Preferences, goal customizer, and dark theme
    └── utils/
        ├── speech.ts           # Speech synthesis pronunciation helper
        └── vocabularyUtils.ts  # Filter, search, and quiz question generator utilities
```

---

## 💾 Local Storage & State Persistence

All user data is stored on the client side via the `useLocalStorage` hook:

- `vocab_currentWord`: ID of the last active word viewed in the reels.
- `vocab_learnedWords`: Array of IDs marked as learned.
- `vocab_favoriteWords`: Array of favorited word IDs.
- `vocab_importantWords`: Array of starred word IDs.
- `vocab_difficultWords`: Array of difficult word IDs.
- `vocab_todayLearned`: Count of words learned within the current calendar day.
- `vocab_lastStudyDate`: ISO date tracking daily streak resets.
- `vocab_quizStats`: Aggregated questions answered and accuracy metrics.
- `vocab_settings`: User theme, pronunciation, and daily goal preferences.

---

## ⌨️ Keyboard Shortcuts

When in the **Learn** or **Revision** views:

| Key | Action |
|---|---|
| <kbd>↓</kbd> (Down Arrow) | Next Word |
| <kbd>Space</kbd> | Next Word |
| <kbd>Page Down</kbd> | Next Word |
| <kbd>j</kbd> / <kbd>J</kbd> | Next Word (Vim navigation) |
| <kbd>↑</kbd> (Up Arrow) | Previous Word |
| <kbd>Page Up</kbd> | Previous Word |
| <kbd>k</kbd> / <kbd>K</kbd> | Previous Word (Vim navigation) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation
```bash
# Clone or download repository
cd learn-vocabulary

# Install dependencies
npm install
```

### Development Server
```bash
# Start Vite development server on port 3000
npm run dev
```
Open `http://localhost:3000` in your browser.

### Typecheck & Lint
```bash
npm run lint
```

### Production Build
```bash
npm run build
```
Outputs optimized static assets to the `dist/` directory.

---

## 📄 License
MIT License. Built for vocabulary learners worldwide.
