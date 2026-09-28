import React, { useState, useMemo } from 'react';
import {
  Newspaper,
  Calendar,
  Clock,
  BookOpen,
  HelpCircle,
  Search,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Volume2,
  Share2,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { EditorialItem, EditorialMCQ } from '../types';

interface EditorialProps {
  editorials: EditorialItem[];
  isAdmin: boolean;
  onOpenAddEditorial: () => void;
  onOpenEditEditorial: (editorial: EditorialItem) => void;
  onDeleteEditorial: (editorialId: string) => Promise<void>;
  onNavigateHome?: () => void;
}

export const Editorial: React.FC<EditorialProps> = ({
  editorials,
  isAdmin,
  onOpenAddEditorial,
  onOpenEditEditorial,
  onDeleteEditorial,
  onNavigateHome,
}) => {
  // Navigation & selection
  const [selectedEditorialId, setSelectedEditorialId] = useState<string | null>(null);
  const [readerTab, setReaderTab] = useState<'article' | 'vocab' | 'mcq'>('article');
  
  // Search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Reader settings
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');

  // Interactive MCQ Quiz state for active editorial
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [editorialToDelete, setEditorialToDelete] = useState<EditorialItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Available publishers for filtering
  const availablePublishers = useMemo(() => {
    const set = new Set<string>();
    editorials.forEach((e) => {
      if (e.publisher) set.add(e.publisher);
    });
    return Array.from(set);
  }, [editorials]);

  // Filtered editorials
  const filteredEditorials = useMemo(() => {
    return editorials.filter((item) => {
      // Publisher filter
      if (selectedPublisher !== 'all' && item.publisher !== selectedPublisher) {
        return false;
      }
      // Date filter
      if (selectedDate && item.date !== selectedDate) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchContent = item.content.toLowerCase().includes(q);
        const matchPublisher = item.publisher.toLowerCase().includes(q);
        const matchVocab = item.vocabulary?.some(
          (v) =>
            v.word.toLowerCase().includes(q) ||
            v.meaningHindi.toLowerCase().includes(q) ||
            v.meaningEnglish.toLowerCase().includes(q)
        );
        return matchTitle || matchContent || matchPublisher || matchVocab;
      }
      return true;
    });
  }, [editorials, selectedPublisher, selectedDate, searchQuery]);

  // Active editorial item
  const activeEditorial = useMemo(() => {
    if (!selectedEditorialId) return null;
    return editorials.find((e) => e.id === selectedEditorialId) || null;
  }, [editorials, selectedEditorialId]);

  // Pronounce word
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSelectOption = (mcqId: string, optionIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [mcqId]: optionIndex,
    }));
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setQuizSubmitted(false);
  };

  const handleDeleteConfirm = async () => {
    if (!editorialToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteEditorial(editorialToDelete.id);
      if (selectedEditorialId === editorialToDelete.id) {
        setSelectedEditorialId(null);
      }
      setEditorialToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for publisher colors
  const getPublisherBadgeClass = (pub: string) => {
    const lower = pub.toLowerCase();
    if (lower.includes('hindu')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-900';
    }
    if (lower.includes('express')) {
      return 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border-red-200 dark:border-red-900';
    }
    if (lower.includes('economic') || lower.includes('et')) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-900';
    }
    if (lower.includes('mint')) {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border-orange-200 dark:border-orange-900';
    }
    if (lower.includes('standard')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-900';
    }
    return 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700';
  };

  // Format readable date (e.g. 24 Sep 2026)
  const formatReadableDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      if (!year || !month || !day) return dateStr;
      const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      return dateObj.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // ==========================================
  // VIEW: EDITORIAL READER & STUDY VIEW
  // ==========================================
  if (activeEditorial) {
    const mcqs = activeEditorial.mcqs || [];
    const vocabList = activeEditorial.vocabulary || [];
    const answeredCount = Object.keys(userAnswers).length;
    
    // Calculate Quiz Score
    let correctCount = 0;
    mcqs.forEach((q) => {
      if (userAnswers[q.id] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    return (
      <div className="w-full h-full flex flex-col bg-stone-50 dark:bg-stone-950 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Reader Top Navigation Bar */}
        <div className="px-4 py-3 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedEditorialId(null);
                handleResetQuiz();
              }}
              className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">All Editorials</span>
            </button>
            <span className="h-4 w-px bg-stone-200 dark:bg-stone-800 hidden sm:block" />
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getPublisherBadgeClass(
                activeEditorial.publisher
              )}`}
            >
              {activeEditorial.publisher}
            </span>
          </div>

          {/* Right actions: Font size & Admin controls */}
          <div className="flex items-center gap-2">
            {/* Font size toggles (in article view) */}
            {readerTab === 'article' && (
              <div className="hidden sm:flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-mono">
                <button
                  onClick={() => setFontSize('sm')}
                  className={`px-2 py-0.5 rounded-lg ${
                    fontSize === 'sm'
                      ? 'bg-white dark:bg-stone-700 shadow-xs font-bold text-amber-600'
                      : 'text-stone-500'
                  }`}
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize('base')}
                  className={`px-2 py-0.5 rounded-lg ${
                    fontSize === 'base'
                      ? 'bg-white dark:bg-stone-700 shadow-xs font-bold text-amber-600'
                      : 'text-stone-500'
                  }`}
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('lg')}
                  className={`px-2 py-0.5 rounded-lg ${
                    fontSize === 'lg'
                      ? 'bg-white dark:bg-stone-700 shadow-xs font-bold text-amber-600'
                      : 'text-stone-500'
                  }`}
                >
                  A+
                </button>
              </div>
            )}

            {/* Admin Edit/Delete */}
            {isAdmin && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onOpenEditEditorial(activeEditorial)}
                  className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors text-xs flex items-center gap-1"
                  title="Edit Editorial"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline font-bold">Edit</span>
                </button>
                <button
                  onClick={() => setEditorialToDelete(activeEditorial)}
                  className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors text-xs flex items-center gap-1"
                  title="Delete Editorial"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline font-bold">Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section Tabs: Article, Vocabulary, MCQs */}
        <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 shrink-0 flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setReaderTab('article')}
            className={`flex items-center gap-2 py-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              readerTab === 'article'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Editorial Article</span>
          </button>

          <button
            onClick={() => setReaderTab('vocab')}
            className={`flex items-center gap-2 py-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              readerTab === 'vocab'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Key Vocabulary ({vocabList.length})</span>
          </button>

          <button
            onClick={() => setReaderTab('mcq')}
            className={`flex items-center gap-2 py-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              readerTab === 'mcq'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Comprehension MCQs ({mcqs.length})</span>
          </button>
        </div>

        {/* Reader Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl w-full mx-auto">
          {/* TAB 1: ARTICLE */}
          {readerTab === 'article' && (
            <article className="space-y-6">
              {/* Meta header */}
              <div className="space-y-2.5 pb-4 border-b border-stone-200 dark:border-stone-800">
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-medium">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>{formatReadableDate(activeEditorial.date)}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>~{activeEditorial.readingTimeMinutes || 4} min read</span>
                  </span>
                  {activeEditorial.category && (
                    <>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] font-semibold text-stone-600 dark:text-stone-300">
                        {activeEditorial.category}
                      </span>
                    </>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 leading-snug">
                  {activeEditorial.title}
                </h1>

                {activeEditorial.summary && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-serif italic">
                    <span className="font-bold font-sans not-italic text-amber-700 dark:text-amber-400 mr-1.5 uppercase text-[10px] tracking-wider">
                      Key Takeaway:
                    </span>
                    {activeEditorial.summary}
                  </div>
                )}
              </div>

              {/* Editorial Text Paragraphs */}
              <div
                className={`prose dark:prose-invert max-w-none text-stone-800 dark:text-stone-200 leading-relaxed font-serif space-y-4 ${
                  fontSize === 'sm'
                    ? 'text-sm'
                    : fontSize === 'base'
                    ? 'text-base sm:text-[17px]'
                    : fontSize === 'lg'
                    ? 'text-lg sm:text-xl'
                    : 'text-xl sm:text-2xl'
                }`}
              >
                {activeEditorial.content.split('\n\n').map((paragraph, pIdx) => {
                  if (!paragraph.trim()) return null;
                  return (
                    <p key={pIdx} className="leading-relaxed tracking-normal">
                      {paragraph.trim()}
                    </p>
                  );
                })}
              </div>

              {/* Bottom Quick-actions bar */}
              <div className="pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {vocabList.length > 0 && (
                    <button
                      onClick={() => setReaderTab('vocab')}
                      className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Explore Key Vocabulary ({vocabList.length})</span>
                    </button>
                  )}
                  {mcqs.length > 0 && (
                    <button
                      onClick={() => setReaderTab('mcq')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Take MCQ Quiz ({mcqs.length})</span>
                    </button>
                  )}
                </div>
              </div>
            </article>
          )}

          {/* TAB 2: KEY VOCABULARY */}
          {readerTab === 'vocab' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                    Key Vocabulary from this Editorial
                  </h3>
                  <p className="text-xs text-stone-500">
                    Master these high-frequency words for competitive exams
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  {vocabList.length} Words
                </span>
              </div>

              {vocabList.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
                  <BookOpen className="w-8 h-8 text-stone-400 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                    No vocabulary items highlighted yet.
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => onOpenEditEditorial(activeEditorial)}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold"
                    >
                      + Add Vocabulary Words
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {vocabList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs hover:border-amber-400/80 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                              {item.word}
                            </h4>
                            {item.partOfSpeech && (
                              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500">
                                {item.partOfSpeech}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleSpeak(item.word)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                            title="Listen pronunciation"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Hindi Meaning */}
                        <div className="mb-1.5">
                          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                            {item.meaningHindi}
                          </span>
                        </div>

                        {/* English Meaning */}
                        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mb-2">
                          {item.meaningEnglish}
                        </p>
                      </div>

                      {item.contextSentence && (
                        <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-700/60 text-[11px] text-stone-500 dark:text-stone-400 italic">
                          "{item.contextSentence}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MCQS PRACTICE QUIZ */}
          {readerTab === 'mcq' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                    Comprehension & Vocabulary Practice
                  </h3>
                  <p className="text-xs text-stone-500">
                    Solve questions based directly on this editorial
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                    {answeredCount} / {mcqs.length} Answered
                  </span>
                  {answeredCount > 0 && (
                    <button
                      onClick={handleResetQuiz}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                      title="Reset Quiz"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {mcqs.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
                  <HelpCircle className="w-8 h-8 text-stone-400 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                    No MCQs questions added for this editorial yet.
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => onOpenEditEditorial(activeEditorial)}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                    >
                      + Add MCQs
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  {mcqs.map((mcq, qIdx) => {
                    const selectedOpt = userAnswers[mcq.id];
                    const isAnswered = selectedOpt !== undefined;
                    const isCorrect = isAnswered && selectedOpt === mcq.correctOptionIndex;

                    return (
                      <div
                        key={mcq.id || qIdx}
                        className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border transition-all ${
                          isAnswered
                            ? isCorrect
                              ? 'border-emerald-300 dark:border-emerald-800 shadow-sm'
                              : 'border-rose-300 dark:border-rose-800 shadow-sm'
                            : 'border-stone-200 dark:border-stone-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <span className="text-xs font-mono font-extrabold text-amber-600 dark:text-amber-400 shrink-0">
                            Q{qIdx + 1}.
                          </span>
                          <p className="flex-1 text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 leading-snug">
                            {mcq.question}
                          </p>
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          {mcq.options.map((option, optIdx) => {
                            const isThisSelected = selectedOpt === optIdx;
                            const isThisCorrect = optIdx === mcq.correctOptionIndex;

                            let optClasses =
                              'border-stone-200 dark:border-stone-700 hover:border-amber-400 dark:hover:border-amber-600 bg-stone-50/50 dark:bg-stone-800/40 text-stone-800 dark:text-stone-200';

                            if (isAnswered) {
                              if (isThisCorrect) {
                                optClasses =
                                  'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold';
                              } else if (isThisSelected && !isThisCorrect) {
                                optClasses =
                                  'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                              } else {
                                optClasses =
                                  'border-stone-200 dark:border-stone-800 opacity-60 text-stone-500';
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleSelectOption(mcq.id, optIdx)}
                                className={`w-full p-3 rounded-xl border text-left flex items-start gap-2.5 text-xs sm:text-sm transition-all cursor-pointer ${optClasses}`}
                              >
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                                    isAnswered && isThisCorrect
                                      ? 'bg-emerald-500 text-white'
                                      : isAnswered && isThisSelected
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="flex-1 leading-snug">{option}</span>
                                {isAnswered && isThisCorrect && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                )}
                                {isAnswered && isThisSelected && !isThisCorrect && (
                                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation block */}
                        {isAnswered && mcq.explanation && (
                          <div className="mt-3.5 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-stone-700 dark:text-stone-300 leading-relaxed animate-fade-in">
                            <span className="font-bold text-amber-700 dark:text-amber-400 block mb-0.5">
                              Explanation:
                            </span>
                            {mcq.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Summary Score Card */}
                  {answeredCount === mcqs.length && mcqs.length > 0 && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-extrabold">Editorial Quiz Completed!</h4>
                        <p className="text-xs text-amber-100">
                          You scored {correctCount} out of {mcqs.length} correct (
                          {Math.round((correctCount / mcqs.length) * 100)}%)
                        </p>
                      </div>
                      <button
                        onClick={handleResetQuiz}
                        className="px-3.5 py-2 rounded-xl bg-white text-stone-900 font-bold text-xs shadow-sm hover:bg-stone-100 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: EDITORIALS LIST
  // ==========================================
  return (
    <div className="w-full h-full flex flex-col bg-stone-50 dark:bg-stone-950 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <div className="px-4 py-3.5 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shrink-0 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 leading-tight flex items-center gap-2">
                <span>Daily Editorials</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
                  {editorials.length}
                </span>
              </h1>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Newspaper editorials, exam vocabulary & comprehension MCQs
              </p>
            </div>
          </div>

          {/* Admin Action: Add Editorial */}
          {isAdmin && (
            <button
              onClick={onOpenAddEditorial}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Editorial</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 py-2.5 shrink-0">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search editorial headline, publisher, or vocabulary..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono text-stone-700 dark:text-stone-300 focus:outline-none"
                  title="Filter by specific date"
                />
              </div>
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>

          {/* Publisher filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <span className="text-[10px] uppercase font-bold text-stone-400 shrink-0">Source:</span>
            <button
              onClick={() => setSelectedPublisher('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                selectedPublisher === 'all'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
              }`}
            >
              All Publishers
            </button>
            {availablePublishers.map((pub) => (
              <button
                key={pub}
                onClick={() => setSelectedPublisher(pub)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                  selectedPublisher === pub
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                }`}
              >
                {pub}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editorial List Body */}
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl w-full mx-auto space-y-3.5">
        {filteredEditorials.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm mt-4">
            <Newspaper className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 mb-1">
              No Editorials Found
            </h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto mb-4">
              {searchQuery || selectedPublisher !== 'all' || selectedDate
                ? 'Try adjusting your search query, source publisher, or date filter.'
                : 'No editorials published yet.'}
            </p>
            {isAdmin && (
              <button
                onClick={onOpenAddEditorial}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Editorial</span>
              </button>
            )}
          </div>
        ) : (
          filteredEditorials.map((item) => {
            const vocabCount = item.vocabulary?.length || 0;
            const mcqCount = item.mcqs?.length || 0;

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-400/80 transition-all shadow-xs hover:shadow-md flex flex-col justify-between gap-3 group"
              >
                {/* Header row: Publisher, Date, Category */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getPublisherBadgeClass(
                        item.publisher
                      )}`}
                    >
                      {item.publisher}
                    </span>

                    <span className="flex items-center gap-1 text-[11px] font-mono text-stone-500 dark:text-stone-400">
                      <Calendar className="w-3 h-3 text-amber-500" />
                      <span>{formatReadableDate(item.date)}</span>
                    </span>

                    {item.category && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                        {item.category}
                      </span>
                    )}
                  </div>

                  {/* Admin Edit/Delete buttons */}
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenEditEditorial(item)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title="Edit editorial"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditorialToDelete(item)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete editorial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <h2
                    onClick={() => {
                      setSelectedEditorialId(item.id);
                      setReaderTab('article');
                    }}
                    className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer leading-snug"
                  >
                    {item.title}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                    {item.summary || item.content.substring(0, 180) + '...'}
                  </p>
                </div>

                {/* Footer Badges & Read Action */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>~{item.readingTimeMinutes || 4} min</span>
                    </span>
                    {vocabCount > 0 && (
                      <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                        <Sparkles className="w-3 h-3" />
                        <span>{vocabCount} Vocab</span>
                      </span>
                    )}
                    {mcqCount > 0 && (
                      <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <HelpCircle className="w-3 h-3" />
                        <span>{mcqCount} MCQs</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedEditorialId(item.id);
                      setReaderTab('article');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                  >
                    <span>Read & Quiz</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {editorialToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 w-full max-w-sm">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 mb-1">
              Delete Editorial?
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed mb-4">
              Are you sure you want to permanently delete "{editorialToDelete.title}"? This will remove the editorial, its key vocabulary, and its MCQs from the cloud for all users.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditorialToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
