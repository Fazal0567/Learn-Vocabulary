import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Newspaper,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  FileCode,
  Copy,
  Check,
} from 'lucide-react';
import { EditorialItem, EditorialMCQ, EditorialVocabulary } from '../types';

interface AddEditorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (editorial: EditorialItem) => Promise<void>;
  editorialToEdit?: EditorialItem | null;
  onOpenImportJson?: () => void;
}

const PUBLISHER_PRESETS = [
  'The Hindu',
  'The Indian Express',
  'The Economic Times',
  'LiveMint',
  'Business Standard',
  'Times of India',
  'Hindustan Times',
  'Dawn',
  'Financial Times',
  'Other / Custom',
];

const CATEGORY_PRESETS = [
  'Economy & Business',
  'Polity & Governance',
  'International Relations',
  'Environment & Climate',
  'Science & Technology',
  'Social Issues',
  'Judiciary & Law',
  'General',
];

export const AddEditorialModal: React.FC<AddEditorialModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editorialToEdit,
  onOpenImportJson,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [publisherSelect, setPublisherSelect] = useState('The Hindu');
  const [customPublisher, setCustomPublisher] = useState('');
  const [category, setCategory] = useState('Economy & Business');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  
  // Vocabulary items
  const [vocabulary, setVocabulary] = useState<EditorialVocabulary[]>([]);
  const [newVocabWord, setNewVocabWord] = useState('');
  const [newVocabHindi, setNewVocabHindi] = useState('');
  const [newVocabEnglish, setNewVocabEnglish] = useState('');
  const [newVocabPos, setNewVocabPos] = useState('noun');

  // MCQs
  const [mcqs, setMcqs] = useState<EditorialMCQ[]>([]);

  // State
  const [activeTab, setActiveTab] = useState<'content' | 'vocab' | 'mcqs' | 'json'>('content');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [jsonQuickInput, setJsonQuickInput] = useState('');
  const [jsonSuccessBanner, setJsonSuccessBanner] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Sync state when editing
  useEffect(() => {
    if (editorialToEdit) {
      setTitle(editorialToEdit.title || '');
      setDate(editorialToEdit.date || new Date().toISOString().split('T')[0]);
      if (PUBLISHER_PRESETS.includes(editorialToEdit.publisher)) {
        setPublisherSelect(editorialToEdit.publisher);
        setCustomPublisher('');
      } else {
        setPublisherSelect('Other / Custom');
        setCustomPublisher(editorialToEdit.publisher);
      }
      setCategory(editorialToEdit.category || 'General');
      setContent(editorialToEdit.content || '');
      setSummary(editorialToEdit.summary || '');
      setVocabulary(editorialToEdit.vocabulary || []);
      setMcqs(editorialToEdit.mcqs || []);
    } else {
      // Default new state
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setPublisherSelect('The Hindu');
      setCustomPublisher('');
      setCategory('Economy & Business');
      setContent('');
      setSummary('');
      setVocabulary([]);
      setMcqs([]);
    }
    setErrorMessage(null);
    setJsonSuccessBanner(null);
    setActiveTab('content');
  }, [editorialToEdit, isOpen]);

  const handleApplyJsonQuickFill = () => {
    if (!jsonQuickInput.trim()) {
      setErrorMessage('Please paste valid JSON text into the box.');
      return;
    }
    try {
      let data = JSON.parse(jsonQuickInput);
      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
      } else if (data && typeof data === 'object' && Array.isArray(data.editorials)) {
        data = data.editorials[0];
      }

      if (!data || typeof data !== 'object') {
        throw new Error('JSON is not a valid editorial object.');
      }

      const pTitle = String(data.title || data.headline || '').trim();
      const pContent = String(data.content || data.article || data.text || '').trim();
      if (!pTitle && !pContent) {
        throw new Error('JSON must include at least "title" or "content".');
      }

      if (pTitle) setTitle(pTitle);
      if (pContent) setContent(pContent);
      if (data.date) setDate(String(data.date).trim());
      if (data.publisher) {
        const pub = String(data.publisher).trim();
        if (PUBLISHER_PRESETS.includes(pub)) {
          setPublisherSelect(pub);
          setCustomPublisher('');
        } else {
          setPublisherSelect('Other / Custom');
          setCustomPublisher(pub);
        }
      }
      if (data.category) setCategory(String(data.category).trim());
      if (data.summary) setSummary(String(data.summary).trim());

      // Parse vocab
      const rawVocab = data.vocabulary || data.vocab || data.words || data.keyVocabulary;
      if (Array.isArray(rawVocab)) {
        const parsedV: EditorialVocabulary[] = [];
        rawVocab.forEach((v: any) => {
          if (!v || typeof v !== 'object') return;
          const w = String(v.word || v.term || '').trim();
          const mh = String(v.meaningHindi || v.hindi || '').trim();
          const me = String(v.meaningEnglish || v.english || v.meaning || '').trim();
          const pos = String(v.partOfSpeech || v.pos || 'noun').trim();
          const cs = String(v.contextSentence || v.example || '').trim();
          if (w) {
            parsedV.push({
              word: w.toUpperCase(),
              meaningHindi: mh || me,
              meaningEnglish: me || mh,
              partOfSpeech: pos,
              contextSentence: cs || undefined,
            });
          }
        });
        setVocabulary(parsedV);
      }

      // Parse MCQs
      const rawMcqs = data.mcqs || data.questions || data.quiz;
      if (Array.isArray(rawMcqs)) {
        const parsedM: EditorialMCQ[] = [];
        rawMcqs.forEach((q: any, idx: number) => {
          if (!q || typeof q !== 'object') return;
          const quest = String(q.question || q.prompt || '').trim();
          if (!quest) return;
          let options: string[] = [];
          if (Array.isArray(q.options)) {
            options = q.options.map((o: any) => String(o || '').trim());
          }
          while (options.length < 4) {
            options.push(`Option ${String.fromCharCode(65 + options.length)}`);
          }
          let ansIdx = 0;
          const ans = q.correctOptionIndex ?? q.correctIndex ?? q.answer;
          if (typeof ans === 'number' && ans >= 0 && ans < 4) {
            ansIdx = ans;
          } else if (typeof ans === 'string') {
            const up = ans.toUpperCase().trim();
            if (['A', 'B', 'C', 'D'].includes(up)) {
              ansIdx = up.charCodeAt(0) - 65;
            } else {
              const matched = options.findIndex((opt) => opt.toLowerCase() === ans.toLowerCase());
              if (matched >= 0) ansIdx = matched;
            }
          }
          parsedM.push({
            id: q.id || `mcq_${Date.now()}_${idx}`,
            question: quest,
            options: options.slice(0, 4),
            correctOptionIndex: ansIdx,
            explanation: String(q.explanation || '').trim(),
          });
        });
        setMcqs(parsedM);
      }

      setErrorMessage(null);
      setJsonSuccessBanner(
        `Successfully loaded "${pTitle || 'Editorial'}" with ${rawVocab?.length || 0} vocabulary words and ${rawMcqs?.length || 0} MCQs into the form! Review in Tabs 1, 2, and 3.`
      );
      setActiveTab('content');
      setTimeout(() => setJsonSuccessBanner(null), 7000);
    } catch (err: any) {
      setErrorMessage(`JSON Parse Error: ${err.message || 'Invalid format'}`);
    }
  };

  if (!isOpen) return null;

  const currentPublisher =
    publisherSelect === 'Other / Custom' ? customPublisher.trim() || 'Custom Publisher' : publisherSelect;

  const handleAddVocabWord = () => {
    if (!newVocabWord.trim() || !newVocabHindi.trim() || !newVocabEnglish.trim()) {
      setErrorMessage('Please fill Word, Hindi Meaning, and English Meaning to add vocabulary.');
      return;
    }
    setVocabulary((prev) => [
      ...prev,
      {
        word: newVocabWord.trim(),
        meaningHindi: newVocabHindi.trim(),
        meaningEnglish: newVocabEnglish.trim(),
        partOfSpeech: newVocabPos,
      },
    ]);
    setNewVocabWord('');
    setNewVocabHindi('');
    setNewVocabEnglish('');
    setErrorMessage(null);
  };

  const handleRemoveVocabWord = (index: number) => {
    setVocabulary((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddMCQ = () => {
    const newMcq: EditorialMCQ = {
      id: `mcq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      question: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      explanation: '',
    };
    setMcqs((prev) => [...prev, newMcq]);
  };

  const handleUpdateMCQ = (index: number, updated: Partial<EditorialMCQ>) => {
    setMcqs((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updated };
      return copy;
    });
  };

  const handleUpdateMCQOption = (mcqIndex: number, optionIndex: number, value: string) => {
    setMcqs((prev) => {
      const copy = [...prev];
      const newOptions = [...copy[mcqIndex].options];
      newOptions[optionIndex] = value;
      copy[mcqIndex] = { ...copy[mcqIndex], options: newOptions };
      return copy;
    });
  };

  const handleRemoveMCQ = (index: number) => {
    setMcqs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Editorial Name / Title is required.');
      setActiveTab('content');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('Editorial text content is required.');
      setActiveTab('content');
      return;
    }
    if (!date.trim()) {
      setErrorMessage('Publication date is required.');
      return;
    }
    if (publisherSelect === 'Other / Custom' && !customPublisher.trim()) {
      setErrorMessage('Please specify the custom publisher name.');
      return;
    }

    // Validate MCQs if any are added
    for (let i = 0; i < mcqs.length; i++) {
      const q = mcqs[i];
      if (!q.question.trim()) {
        setErrorMessage(`MCQ #${i + 1} has an empty question statement.`);
        setActiveTab('mcqs');
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j] || !q.options[j].trim()) {
          setErrorMessage(`MCQ #${i + 1} Option ${String.fromCharCode(65 + j)} is empty.`);
          setActiveTab('mcqs');
          return;
        }
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const wordCount = content.trim().split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const itemToSave: EditorialItem = {
      id: editorialToEdit ? editorialToEdit.id : `ed_${Date.now()}`,
      title: title.trim(),
      date: date.trim(),
      publisher: currentPublisher,
      category: category.trim(),
      content: content.trim(),
      summary: summary.trim() || undefined,
      vocabulary: vocabulary.length > 0 ? vocabulary : undefined,
      mcqs: mcqs,
      readingTimeMinutes: readingTime,
      createdAt: editorialToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSave(itemToSave);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save editorial to Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0 bg-stone-50/70 dark:bg-stone-900/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-stone-100 leading-tight">
                {editorialToEdit ? 'Edit Editorial' : 'Create New Editorial'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Publish date-wise editorial with reading content, vocabulary and MCQs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenImportJson && !editorialToEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenImportJson();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/60 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Upload full editorial via JSON file"
              >
                <FileCode className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Import JSON</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-950/40 px-5 pt-2 gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'content'
                ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 border-t border-x border-stone-200 dark:border-stone-800'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Article Details</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vocab')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'vocab'
                ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 border-t border-x border-stone-200 dark:border-stone-800'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>2. Key Vocabulary ({vocabulary.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mcqs')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'mcqs'
                ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 border-t border-x border-stone-200 dark:border-stone-800'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>3. MCQs Quiz ({mcqs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'json'
                ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 border-t border-x border-stone-200 dark:border-stone-800'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-amber-600" />
            <span>4. Paste JSON</span>
          </button>
        </div>

        {/* Success Alert */}
        {jsonSuccessBanner && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <p className="flex-1 font-semibold">{jsonSuccessBanner}</p>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <p className="flex-1 font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'content' && (
            <div className="space-y-4">
              {/* Name / Title */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Editorial Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Resilience of Federalism: Balancing Revenue & Autonomy"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Date & Publisher Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>Editorial Date <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                {/* Publisher */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                    <Newspaper className="w-3.5 h-3.5 text-amber-500" />
                    <span>Publisher / Newspaper <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    value={publisherSelect}
                    onChange={(e) => setPublisherSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {PUBLISHER_PRESETS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Publisher Input (if Other selected) */}
              {publisherSelect === 'Other / Custom' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Enter Custom Publisher Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customPublisher}
                    onChange={(e) => setCustomPublisher(e.target.value)}
                    placeholder="e.g. Project Syndicate, Guardian, The Tribune"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Category / Domain
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {CATEGORY_PRESETS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Summary / Key Takeaways */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Brief Takeaways / Summary (Optional)
                </label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="One or two sentences summarizing the primary thesis of the article..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Full Content */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Editorial Article Content <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-stone-500">
                    {wordCount} words • ~{Math.max(1, Math.ceil(wordCount / 200))} min read
                  </span>
                </div>
                <textarea
                  rows={9}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste or write the full editorial article paragraphs here..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>
          )}

          {activeTab === 'vocab' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
                <span className="font-bold">Highlight Key Words:</span> Add important vocabulary words extracted from this editorial with their Hindi & English definitions.
              </div>

              {/* Add New Word Form Box */}
              <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2.5">
                <h4 className="text-xs font-extrabold uppercase text-stone-600 dark:text-stone-300 tracking-wider">
                  + Add Vocabulary Word
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newVocabWord}
                    onChange={(e) => setNewVocabWord(e.target.value)}
                    placeholder="Word (e.g. Asymmetric)"
                    className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={newVocabHindi}
                    onChange={(e) => setNewVocabHindi(e.target.value)}
                    placeholder="Hindi meaning (e.g. असमान)"
                    className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-xs"
                  />
                  <select
                    value={newVocabPos}
                    onChange={(e) => setNewVocabPos(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-xs"
                  >
                    <option value="noun">Noun (संज्ञा)</option>
                    <option value="verb">Verb (क्रिया)</option>
                    <option value="adjective">Adjective (विशेषण)</option>
                    <option value="adverb">Adverb (क्रिया विशेषण)</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVocabEnglish}
                    onChange={(e) => setNewVocabEnglish(e.target.value)}
                    placeholder="English definition (e.g. Having two unequal sides)"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddVocabWord}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shrink-0 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Current Vocabulary List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-500">
                  Added Words ({vocabulary.length})
                </h4>
                {vocabulary.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">No vocabulary words added yet.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {vocabulary.map((v, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 dark:text-stone-100">
                              {v.word}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-[10px] text-stone-500">
                              {v.partOfSpeech}
                            </span>
                          </div>
                          <p className="text-stone-600 dark:text-stone-300 text-[11px] truncate">
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              {v.meaningHindi}
                            </span>{' '}
                            • {v.meaningEnglish}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVocabWord(i)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Remove word"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'mcqs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    Comprehension & Vocabulary MCQs
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Add multiple-choice questions for students to test reading comprehension
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMCQ}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>

              {mcqs.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl">
                  <HelpCircle className="w-8 h-8 text-stone-400 mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                    No questions added for this editorial yet.
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Click "Add Question" above to create comprehension questions with 4 options.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mcqs.map((mcq, idx) => (
                    <div
                      key={mcq.id || idx}
                      className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/80 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                          Question #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMCQ(idx)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>

                      {/* Question prompt */}
                      <div>
                        <input
                          type="text"
                          value={mcq.question}
                          onChange={(e) => handleUpdateMCQ(idx, { question: e.target.value })}
                          placeholder="Enter question statement..."
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-xs font-semibold"
                        />
                      </div>

                      {/* 4 Options */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-stone-500">
                          Select the Radio Button corresponding to the CORRECT Option:
                        </label>
                        {[0, 1, 2, 3].map((optIdx) => {
                          const isCorrect = mcq.correctOptionIndex === optIdx;
                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900'
                              }`}
                            >
                              <label className="flex items-center gap-1.5 px-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`correct_${mcq.id || idx}`}
                                  checked={isCorrect}
                                  onChange={() =>
                                    handleUpdateMCQ(idx, { correctOptionIndex: optIdx })
                                  }
                                  className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span
                                  className={`text-xs font-bold ${
                                    isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-500'
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                              </label>

                              <input
                                type="text"
                                value={mcq.options[optIdx] || ''}
                                onChange={(e) =>
                                  handleUpdateMCQOption(idx, optIdx, e.target.value)
                                }
                                placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                className="flex-1 px-2.5 py-1.5 rounded-lg border-0 bg-transparent text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                              />

                              {isCorrect && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-2 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Correct Answer</span>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      <div>
                        <textarea
                          rows={2}
                          value={mcq.explanation || ''}
                          onChange={(e) => handleUpdateMCQ(idx, { explanation: e.target.value })}
                          placeholder="Explanation: why this answer is correct based on the text..."
                          className="w-full px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-700 dark:text-stone-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PASTE JSON QUICK FILL */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                    Quick JSON Filler
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Paste editorial JSON text containing article content, vocabulary list, and MCQs to auto-populate the form
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setJsonQuickInput(
                        JSON.stringify(
                          {
                            title: "A Green Transition Grounded in Energy Justice",
                            date: new Date().toISOString().split('T')[0],
                            publisher: "The Hindu",
                            category: "Environment & Climate",
                            content: "The global push towards decarbonisation must not lose sight of equity and energy access. Developing nations require substantial climate finance and technology transfer to phase down fossil fuels without stunting developmental goals.\n\nRenewable energy expansion must go hand-in-hand with resilient grid infrastructure and decentralized community solar systems to ensure affordable power for marginalized households.",
                            summary: "Decarbonisation policies must balance ecological imperatives with developmental equities and targeted climate financing.",
                            vocabulary: [
                              {
                                word: "DECARBONISATION",
                                meaningHindi: "कार्बन उत्सर्जन में कमी / कार्बन मुक्ति",
                                meaningEnglish: "the reduction or removal of carbon dioxide emissions",
                                partOfSpeech: "noun",
                                contextSentence: "The pace of global decarbonisation hinges on technological accessibility."
                              },
                              {
                                word: "IMPERATIVE",
                                meaningHindi: "अनिवार्य / अत्यंत आवश्यक",
                                meaningEnglish: "of vital importance; crucial or an essential requirement",
                                partOfSpeech: "adj.",
                                contextSentence: "Securing renewable grids has become an economic imperative."
                              }
                            ],
                            mcqs: [
                              {
                                question: "What critical factor must accompany the phase-down of fossil fuels in developing nations?",
                                options: [
                                  "Substantial climate finance and technology transfer",
                                  "A total suspension of industrial manufacturing",
                                  "An immediate shutdown of conventional power stations",
                                  "Privatization of all public utility providers"
                                ],
                                correctOptionIndex: 0,
                                explanation: "The text states that developing nations require climate finance and technology transfer to grow sustainably."
                              }
                            ]
                          },
                          null,
                          2
                        )
                      );
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold hover:bg-amber-100 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Load Sample</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const sampleStr = JSON.stringify(
                        {
                          title: "Editorial Headline...",
                          date: "YYYY-MM-DD",
                          publisher: "The Hindu",
                          category: "Economy",
                          content: "Full editorial article text...",
                          summary: "Summary takeaways...",
                          vocabulary: [
                            { word: "WORD", meaningHindi: "हिंदी अर्थ", meaningEnglish: "English definition", partOfSpeech: "adj." }
                          ],
                          mcqs: [
                            {
                              question: "Comprehension Question Statement?",
                              options: ["Option A", "Option B", "Option C", "Option D"],
                              correctOptionIndex: 0,
                              explanation: "Why A is correct..."
                            }
                          ]
                        },
                        null,
                        2
                      );
                      navigator.clipboard.writeText(sampleStr);
                      setCopiedTemplate(true);
                      setTimeout(() => setCopiedTemplate(false), 2000);
                    }}
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] hover:bg-stone-50 transition-colors cursor-pointer"
                    title="Copy sample JSON structure"
                  >
                    {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <textarea
                  rows={10}
                  value={jsonQuickInput}
                  onChange={(e) => setJsonQuickInput(e.target.value)}
                  placeholder='{
  "title": "Editorial Title",
  "publisher": "The Hindu",
  "category": "Economy & Business",
  "content": "Full editorial paragraph 1...\n\nParagraph 2...",
  "vocabulary": [
    { "word": "PERSISTENT", "meaningHindi": "दृढ़ / निरंतर", "meaningEnglish": "continuing firmly in an opinion or course of action" }
  ],
  "mcqs": [
    {
      "question": "What is the primary thesis of the author?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex: 0,
      "explanation": "Detailed explanation..."
    }
  ]
}'
                  className="w-full p-3 font-mono text-xs rounded-xl bg-stone-900 text-amber-200 border border-stone-700 focus:border-amber-500 outline-none leading-relaxed"
                  spellCheck={false}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-stone-500">
                  Clicking below will parse and fill Tabs 1, 2, and 3 instantly so you can review before publishing.
                </span>
                <button
                  type="button"
                  onClick={handleApplyJsonQuickFill}
                  disabled={!jsonQuickInput.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply JSON to Form</span>
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Saving to Cloud...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{editorialToEdit ? 'Save Changes' : 'Publish Editorial'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
