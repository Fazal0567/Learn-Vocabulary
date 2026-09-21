import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Copy,
  Check,
  BookOpen,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import { WordItem } from '../types';
import { speakWord } from '../utils/speech';

interface ManageCustomWordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allWords: WordItem[];
  customWords: WordItem[];
  onOpenAddModal: () => void;
  onEditWord: (word: WordItem) => void;
  onDeleteWord: (id: number) => void;
  onDeleteAllCustomWords?: () => void;
  onSelectWordToView: (id: number) => void;
}

const ITEMS_PER_PAGE = 25;

export const ManageCustomWordsModal: React.FC<ManageCustomWordsModalProps> = ({
  isOpen,
  onClose,
  allWords,
  customWords,
  onOpenAddModal,
  onEditWord,
  onDeleteWord,
  onDeleteAllCustomWords,
  onSelectWordToView,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Base list depending on tab
  const baseList = useMemo(() => {
    if (activeTab === 'custom') {
      return customWords;
    }
    return allWords;
  }, [activeTab, customWords, allWords]);

  // Filtered words based on search
  const filteredWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return baseList;

    return baseList.filter((w) => {
      const matchWord = w.word.toLowerCase().includes(q);
      const matchHindi = w.meaningHindi.includes(q);
      const matchEnglish = w.meaningEnglish?.toLowerCase().includes(q);
      const matchId = String(w.id) === q || `#${w.id}` === q;
      return matchWord || matchHindi || matchEnglish || matchId;
    });
  }, [baseList, searchQuery]);

  // Reset page when tab or search changes
  React.useEffect(() => {
    setCurrentPage(1);
    setConfirmDeleteId(null);
  }, [activeTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredWords.length / ITEMS_PER_PAGE));
  const paginatedWords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredWords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredWords, currentPage]);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    const dataToExport = activeTab === 'custom' ? customWords : filteredWords;
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataToExport = activeTab === 'custom' ? customWords : filteredWords;
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocabulary-${activeTab}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl h-[88vh] flex flex-col rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0 bg-stone-50/50 dark:bg-stone-900/80">
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>Admin Vocabulary Manager</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono font-bold">
                {filteredWords.length} words
              </span>
            </h2>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Create, search, edit, or delete vocabulary words across the dictionary
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'custom' && customWords.length > 0 && (
              confirmDeleteAll ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteAllCustomWords?.();
                      setConfirmDeleteAll(false);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    Confirm Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAll(false)}
                    className="px-2 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[11px] font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteAll(true)}
                  title="Clear all custom added words and restore clean 1,000 dictionary words"
                  className="px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear All Custom</span>
                  <span>({customWords.length})</span>
                </button>
              )
            )}
            <button
              onClick={onOpenAddModal}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Word</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="px-4 pt-3 pb-2 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2 shrink-0 bg-white dark:bg-stone-900">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 dark:bg-stone-800">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Dictionary Words ({allWords.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'custom'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Custom Added ({customWords.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyJson}
              title="Copy as JSON"
              className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[11px] font-medium hover:bg-stone-50 dark:hover:bg-stone-750 flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
            <button
              onClick={handleDownloadJson}
              title="Download JSON file"
              className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-stone-100 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-900/50 shrink-0">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by English word, Hindi meaning, definition, or ID (e.g., #45)..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500 placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Word List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {filteredWords.length === 0 ? (
            <div className="p-8 text-center text-stone-400 dark:text-stone-500 space-y-3">
              <BookOpen className="w-10 h-10 mx-auto opacity-30 text-amber-500" />
              <div>
                <p className="font-semibold text-stone-700 dark:text-stone-300 text-sm">
                  {searchQuery ? `No words match "${searchQuery}"` : 'No words found in this view'}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Click the button below to add a new vocabulary word.
                </p>
              </div>
              <button
                onClick={onOpenAddModal}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Word</span>
              </button>
            </div>
          ) : (
            paginatedWords.map((item) => (
              <div
                key={item.id}
                className="p-3 sm:p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-750 hover:border-amber-300 dark:hover:border-amber-900/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-sm font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                      {item.word}
                    </span>
                    {item.pos && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        {item.pos}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-stone-400">
                      #{item.id}
                    </span>
                    {item.isCustom ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        Admin Custom
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-stone-200/60 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                        Master Word
                      </span>
                    )}
                    <button
                      onClick={() => speakWord(item.word)}
                      title="Pronounce word"
                      className="p-1 rounded-md text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 font-['Noto_Sans_Devanagari',sans-serif]">
                    {item.meaningHindi}
                  </p>
                  <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-1">
                    {item.meaningEnglish}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => {
                      onSelectWordToView(item.id);
                      onClose();
                    }}
                    title="View in Reels feed"
                    className="px-2.5 py-1.5 rounded-lg bg-stone-200/80 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-650 text-stone-700 dark:text-stone-200 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEditWord(item)}
                    title="Edit word"
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:text-amber-600 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {confirmDeleteId === item.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onDeleteWord(item.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-1.5 py-1 rounded-lg text-[10px] text-stone-500 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(item.id)}
                      title="Delete word"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs bg-stone-50/70 dark:bg-stone-900/80 shrink-0">
            <span className="text-stone-500 dark:text-stone-400">
              Page <span className="font-bold text-stone-900 dark:text-stone-100">{currentPage}</span> of {totalPages} ({filteredWords.length} words)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 dark:hover:bg-stone-750 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 dark:hover:bg-stone-750 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
