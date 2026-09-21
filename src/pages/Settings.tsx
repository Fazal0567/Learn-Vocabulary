import React, { useState } from 'react';
import {
  Moon,
  Sun,
  Volume2,
  Zap,
  RotateCcw,
  Target,
  Info,
  ShieldCheck,
  Plus,
  Lock,
  KeyRound,
  BookPlus,
  Cloud,
} from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onRequestReset: () => void;
  isAdmin?: boolean;
  customWordsCount?: number;
  onOpenAdminAuth?: () => void;
  onOpenAddWord?: () => void;
  onOpenManageCustomWords?: () => void;
  onOpenChangePin?: () => void;
  onLockAdmin?: () => void;
  currentUserEmail?: string | null;
  isCloudSynced?: boolean;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onUpdateSettings,
  onRequestReset,
  isAdmin = false,
  customWordsCount = 0,
  onOpenAdminAuth,
  onOpenAddWord,
  onOpenManageCustomWords,
  onOpenChangePin,
  onLockAdmin,
  currentUserEmail,
  isCloudSynced = true,
}) => {
  const [customGoalInput, setCustomGoalInput] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const goalOptions = [10, 20, 30, 50];

  const handleCustomGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customGoalInput, 10);
    if (!isNaN(val) && val > 0 && val <= 500) {
      onUpdateSettings({ dailyGoal: val });
      setIsCustomMode(false);
      setCustomGoalInput('');
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 max-w-lg mx-auto space-y-4 sm:space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight font-['Rozha_One',serif]">
          Settings
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Customize your study experience, theme, and preferences.
        </p>
      </div>

      {/* Daily Goal Settings */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
          <Target className="w-4 h-4" />
          <span>Daily Vocabulary Goal</span>
        </div>

        <p className="text-xs text-stone-500 dark:text-stone-400">
          Target number of new words to learn every day:
        </p>

        <div className="grid grid-cols-4 gap-2">
          {goalOptions.map((goal) => {
            const isSelected = settings.dailyGoal === goal && !isCustomMode;
            return (
              <button
                key={goal}
                id={`goal-option-${goal}`}
                onClick={() => {
                  setIsCustomMode(false);
                  onUpdateSettings({ dailyGoal: goal });
                }}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-750'
                }`}
              >
                {goal}/day
              </button>
            );
          })}
        </div>

        {/* Custom Goal */}
        <div className="pt-2">
          {isCustomMode ? (
            <form onSubmit={handleCustomGoalSubmit} className="flex gap-2">
              <input
                type="number"
                min="1"
                max="500"
                value={customGoalInput}
                onChange={(e) => setCustomGoalInput(e.target.value)}
                placeholder="Enter words count..."
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 outline-none text-stone-900 dark:text-stone-100"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-2 text-xs font-bold bg-amber-500 text-white rounded-xl hover:bg-amber-600 cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className="px-3 py-2 text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              id="custom-goal-btn"
              onClick={() => setIsCustomMode(true)}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Custom Goal (Currently: {settings.dailyGoal} words/day)</span>
            </button>
          )}
        </div>
      </div>

      {/* Preferences Section */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Appearance & Sound
        </h3>

        {/* Dark Mode Toggle */}
        <div
          id="dark-theme-toggle-row"
          onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })}
          className="flex items-center justify-between p-2.5 -mx-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/60 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50">
              {settings.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">Dark Theme</h4>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  settings.darkMode
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    : 'bg-stone-100 text-stone-600'
                }`}>
                  {settings.darkMode ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">Eye comfort for night study sessions</p>
            </div>
          </div>
          <button
            id="dark-theme-toggle-btn"
            role="switch"
            aria-checked={settings.darkMode}
            onClick={(e) => {
              e.stopPropagation();
              onUpdateSettings({ darkMode: !settings.darkMode });
            }}
            aria-label="Toggle dark theme"
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              settings.darkMode ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
            }`}
          >
            <span
              className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                settings.darkMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Auto Pronounce */}
        <div
          id="auto-pronounce-toggle-row"
          onClick={() => onUpdateSettings({ autoPronounce: !settings.autoPronounce })}
          className="flex items-center justify-between p-2.5 -mx-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/60 cursor-pointer transition-colors border-t border-stone-100 dark:border-stone-800/80 pt-3"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">Auto Pronunciation</h4>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  settings.autoPronounce
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'bg-stone-100 text-stone-600'
                }`}>
                  {settings.autoPronounce ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">Speak each word automatically when swiped</p>
            </div>
          </div>
          <button
            id="auto-pronounce-toggle-btn"
            role="switch"
            aria-checked={settings.autoPronounce}
            onClick={(e) => {
              e.stopPropagation();
              onUpdateSettings({ autoPronounce: !settings.autoPronounce });
            }}
            aria-label="Toggle auto pronunciation"
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              settings.autoPronounce ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
            }`}
          >
            <span
              className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                settings.autoPronounce ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Animations */}
        <div
          id="animations-toggle-row"
          onClick={() => onUpdateSettings({ animations: !settings.animations })}
          className="flex items-center justify-between p-2.5 -mx-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/60 cursor-pointer transition-colors border-t border-stone-100 dark:border-stone-800/80 pt-3"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">Card Transitions</h4>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  settings.animations
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    : 'bg-stone-100 text-stone-600'
                }`}>
                  {settings.animations ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">Smooth vertical reel animations</p>
            </div>
          </div>
          <button
            id="animations-toggle-btn"
            role="switch"
            aria-checked={settings.animations}
            onClick={(e) => {
              e.stopPropagation();
              onUpdateSettings({ animations: !settings.animations });
            }}
            aria-label="Toggle animations"
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              settings.animations ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-700'
            }`}
          >
            <span
              className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                settings.animations ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Admin Privilege & Word Management Section */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Word Management</span>
          </div>
          {isAdmin ? (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Admin Mode Active
            </span>
          ) : (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
              Restricted Access
            </span>
          )}
        </div>

        {isAdmin ? (
          <div className="space-y-3 pt-1">
            <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-900 dark:text-emerald-200">Admin Status:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-[11px]">
                  Verified & Active
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-800/80 dark:text-emerald-300/80">Cloud Sync:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                  <Cloud className="w-3 h-3" /> Live (Broadcasts to all devices)
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Any word you add or edit is stored in Google Cloud Firestore and instantly updates for all users across the world.
            </p>

            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700 dark:text-stone-300">Custom Words Added:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{customWordsCount} words</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                id="admin-add-new-word-btn"
                onClick={onOpenAddWord}
                className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Word</span>
              </button>

              <button
                id="admin-manage-words-btn"
                onClick={onOpenManageCustomWords}
                className="py-2.5 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 text-xs font-bold border border-stone-200 dark:border-stone-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <BookPlus className="w-4 h-4 text-amber-600" />
                <span>Manage Words ({customWordsCount})</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs border-t border-stone-100 dark:border-stone-800/80">
              <button
                onClick={onOpenChangePin}
                className="text-stone-600 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Admin Passcode</span>
              </button>

              <button
                onClick={onLockAdmin}
                className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Admin Mode</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-700 dark:text-stone-300">Access Level:</span>
                <span className="text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                  Restricted to Admin
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                To prevent spam and protect data, only the verified administrator can add words. All words published by the admin are automatically synced to this device.
              </p>
            </div>
            <button
              id="unlock-admin-mode-btn"
              onClick={onOpenAdminAuth}
              className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span>Verify Admin Access</span>
            </button>
          </div>
        )}
      </div>

      {/* Reset Progress Section */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
          <RotateCcw className="w-4 h-4" />
          <span>Reset Progress</span>
        </div>

        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          Clear all learned, favorite, and starred markers. This cannot be undone.
        </p>

        <button
          id="reset-all-progress-btn"
          onClick={onRequestReset}
          className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-900/60 cursor-pointer transition-colors"
        >
          Reset All Progress
        </button>
      </div>

      {/* About Box */}
      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-stone-600 dark:text-stone-400 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
          <Info className="w-4 h-4" />
          <span>Source Information</span>
        </div>
        <p>
          Curated comprehensive vocabulary material featuring 1,000 high-yield words with Hindi meanings, definitions, synonyms, and antonyms.
        </p>
      </div>
    </div>
  );
};
