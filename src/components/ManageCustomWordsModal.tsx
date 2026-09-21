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
} from 'lucide-react';
import { WordItem } from '../types';
import { speakWord } from '../utils/speech';

interface ManageCustomWordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customWords: WordItem[];
  onOpenAddModal: () => void;
  onEditWord: (word: WordItem) => void;
  onDeleteWord: (id: number) => void;
  onSelectWordToView: (id: number) => void;
}

export const ManageCustomWordsModal: React.FC<ManageCustomWordsModalProps> = ({
  isOpen,
  onClose,
  customWords,
  onOpenAddModal,
  onEditWord,
  onDeleteWord,
  onSelectWordToView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const filteredWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customWords;
    return customWords.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.meaningHindi.includes(q) ||
        w.meaningEnglish.toLowerCase().includes(q)
    );
  }, [customWords, searchQuery]);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(customWords, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(customWords, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom-vocabulary-words-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>Admin Vocabulary Manager</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono font-bold">
                {customWords.length} added
              </span>
            </h2>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Manage custom words created by admin
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onOpenAddModal();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Word</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-3 border-b border-stone-100 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-900/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search custom words..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500"
            />
          </div>

          {customWords.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyJson}
                title="Copy as JSON"
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[11px] font-medium hover:bg-stone-50 dark:hover:bg-stone-750 flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
              <button
                onClick={handleDownloadJson}
                title="Download JSON file"
                className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Word List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {customWords.length === 0 ? (
            <div className="p-8 text-center text-stone-400 dark:text-stone-500 space-y-3">
              <BookOpen className="w-10 h-10 mx-auto opacity-30 text-amber-500" />
              <div>
                <p className="font-semibold text-stone-700 dark:text-stone-300 text-sm">
                  No custom words added yet
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  As an admin, you can add new vocabulary words with Hindi meanings, synonyms, and examples.
                </p>
              </div>
              <button
                onClick={onOpenAddModal}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Word</span>
              </button>
            </div>
          ) : filteredWords.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-500">
              No custom words match "{searchQuery}".
            </div>
          ) : (
            filteredWords.map((item) => (
              <div
                key={item.id}
                className="p-3 sm:p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-750 hover:border-amber-300 dark:hover:border-amber-900/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
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
                    <button
                      onClick={() => speakWord(item.word)}
                      className="p-1 rounded-md text-stone-400 hover:text-amber-600 dark:hover:text-amber-400"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 font-['Noto_Sans_Devanagari',sans-serif]">
                    {item.meaningHindi}
                  </p>
                  <p className="text-xs text-stone-600 dark:text-stone-400 truncate">
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
                    className="px-2.5 py-1.5 rounded-lg bg-stone-200/80 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-650 text-stone-700 dark:text-stone-200 text-[11px] font-semibold transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEditWord(item)}
                    title="Edit word"
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
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
                        className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-1.5 py-1 rounded-lg text-[10px] text-stone-500"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(item.id)}
                      title="Delete word"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
