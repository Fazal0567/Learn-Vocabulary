import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  FileCode,
  Check,
  AlertTriangle,
  Download,
  Copy,
  Sparkles,
  FileText,
  Search,
  CheckSquare,
  Square,
  ArrowRight,
  Loader2,
  Trash2,
  Info,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { WordItem } from '../types';

interface ParsedWordCandidate {
  tempId: string;
  word: string;
  pos: string;
  meaningHindi: string;
  meaningEnglish: string;
  synonyms: string[];
  antonyms: string[];
  example: string;
  customTip?: string;
  status: 'valid' | 'duplicate' | 'invalid';
  validationMessage?: string;
  existingMatch?: WordItem;
  selected: boolean;
}

interface ImportWordsJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportWords: (
    wordsToAdd: Omit<WordItem, 'id'>[],
    wordsToUpdate?: WordItem[]
  ) => Promise<void>;
  existingWords: WordItem[];
}

const SAMPLE_JSON_DATA = [
  {
    word: 'EPHEMERAL',
    pos: 'adj.',
    meaningHindi: 'क्षणभंगुर / अल्पकालिक',
    meaningEnglish: 'lasting for a very short time',
    synonyms: ['transient', 'fleeting', 'short-lived'],
    antonyms: ['enduring', 'permanent', 'perpetual'],
    example: 'Social media fame is often ephemeral, fading in just a few days.',
    customTip: 'Root: Greek "ephemeros" = lasting a day. Frequently asked in Cloze tests.',
  },
  {
    word: 'UBIQUITOUS',
    pos: 'adj.',
    meaningHindi: 'सर्वव्यापी / सब जगह मौजूद',
    meaningEnglish: 'present, appearing, or found everywhere',
    synonyms: ['omnipresent', 'pervasive', 'universal'],
    antonyms: ['rare', 'scarce', 'seldom'],
    example: 'Smartphones have become ubiquitous across all parts of modern society.',
    customTip: 'Think "ubique" = everywhere. High-frequency word in reading comprehension.',
  },
  {
    word: 'ACRIMONIOUS',
    pos: 'adj.',
    meaningHindi: 'कटुतापूर्ण / उग्र',
    meaningEnglish: 'angry and bitter in speech, tone, or debate',
    synonyms: ['rancorous', 'bitter', 'spiteful'],
    antonyms: ['harmonious', 'cordial', 'amicable'],
    example: 'The dispute concluded after several days of acrimonious negotiations.',
    customTip: 'Latin "acer" = sharp or sour. Note contrast with amicable.',
  },
];

export const ImportWordsJsonModal: React.FC<ImportWordsJsonModalProps> = ({
  isOpen,
  onClose,
  onImportWords,
  existingWords,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ParsedWordCandidate[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update' | 'all'>('skip');
  const [previewSearch, setPreviewSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process raw text or parsed object into validated candidates
  const parseRawJson = (rawContent: string, sourceName?: string) => {
    setParseError(null);
    if (!rawContent.trim()) {
      setCandidates([]);
      return;
    }

    try {
      let parsed = JSON.parse(rawContent);

      // Support wrapping keys like { "words": [...] } or { "data": [...] }
      if (!Array.isArray(parsed) && typeof parsed === 'object' && parsed !== null) {
        if (Array.isArray(parsed.words)) {
          parsed = parsed.words;
        } else if (Array.isArray(parsed.data)) {
          parsed = parsed.data;
        } else if (Array.isArray(parsed.vocabulary)) {
          parsed = parsed.vocabulary;
        } else {
          // Single word object passed
          parsed = [parsed];
        }
      }

      if (!Array.isArray(parsed)) {
        setParseError('The JSON content must be an array of words or an object containing an array.');
        setCandidates([]);
        return;
      }

      if (parsed.length === 0) {
        setParseError('The provided JSON array is empty.');
        setCandidates([]);
        return;
      }

      // Existing words map (lowercase for duplicate check)
      const existingMap = new Map<string, WordItem>();
      existingWords.forEach((w) => {
        existingMap.set(w.word.trim().toUpperCase(), w);
      });

      const processed: ParsedWordCandidate[] = parsed.map((item: any, idx: number) => {
        const tempId = `parsed-${idx}-${Date.now()}`;
        if (!item || typeof item !== 'object') {
          return {
            tempId,
            word: `Item #${idx + 1}`,
            pos: 'n.',
            meaningHindi: '',
            meaningEnglish: '',
            synonyms: [],
            antonyms: [],
            example: '',
            status: 'invalid',
            validationMessage: 'Entry is not a valid JSON object.',
            selected: false,
          };
        }

        // Lenient key mapping
        const rawWord = String(
          item.word || item.englishWord || item.term || item.name || item.english || ''
        ).trim();
        const wordUpper = rawWord.toUpperCase();

        const rawHindi = String(
          item.meaningHindi ||
            item.hindiMeaning ||
            item.hindi ||
            item.meaning_hindi ||
            item.hindi_meaning ||
            item.arth ||
            ''
        ).trim();

        const rawEnglish = String(
          item.meaningEnglish ||
            item.englishMeaning ||
            item.meaning ||
            item.definition ||
            item.meaning_english ||
            item.english_definition ||
            ''
        ).trim();

        const pos = String(item.pos || item.partOfSpeech || item.part_of_speech || item.type || 'adj.').trim();

        // Synonyms handling (array or comma string)
        let synonyms: string[] = [];
        if (Array.isArray(item.synonyms)) {
          synonyms = item.synonyms.map((s: any) => String(s).trim()).filter(Boolean);
        } else if (typeof item.synonyms === 'string') {
          synonyms = item.synonyms
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);
        }

        // Antonyms handling (array or comma string)
        let antonyms: string[] = [];
        if (Array.isArray(item.antonyms)) {
          antonyms = item.antonyms.map((a: any) => String(a).trim()).filter(Boolean);
        } else if (typeof item.antonyms === 'string') {
          antonyms = item.antonyms
            .split(',')
            .map((a: string) => a.trim())
            .filter(Boolean);
        }

        const example = String(
          item.example ||
            item.exampleSentence ||
            item.sentence ||
            item.context ||
            (rawWord ? `Mastery of "${rawWord}" enhances comprehension and exam accuracy.` : '')
        ).trim();

        const customTip = item.customTip || item.tip || item.mnemonic || item.note || undefined;

        // Validation
        if (!rawWord) {
          return {
            tempId,
            word: `[Row #${idx + 1}]`,
            pos,
            meaningHindi: rawHindi,
            meaningEnglish: rawEnglish,
            synonyms,
            antonyms,
            example,
            customTip,
            status: 'invalid',
            validationMessage: 'Missing "word" field.',
            selected: false,
          };
        }

        if (!rawHindi && !rawEnglish) {
          return {
            tempId,
            word: wordUpper,
            pos,
            meaningHindi: '',
            meaningEnglish: '',
            synonyms,
            antonyms,
            example,
            customTip,
            status: 'invalid',
            validationMessage: 'Missing both Hindi meaning and English definition.',
            selected: false,
          };
        }

        const existingMatch = existingMap.get(wordUpper);
        const isDuplicate = Boolean(existingMatch);

        return {
          tempId,
          word: wordUpper,
          pos: pos || 'adj.',
          meaningHindi: rawHindi || rawEnglish, // Fallback if one is present
          meaningEnglish: rawEnglish || rawHindi,
          synonyms: synonyms.length > 0 ? synonyms : ['Equivalent'],
          antonyms: antonyms.length > 0 ? antonyms : ['Opposite'],
          example,
          customTip: customTip ? String(customTip).trim() : undefined,
          status: isDuplicate ? 'duplicate' : 'valid',
          validationMessage: isDuplicate
            ? `Word #${existingMatch?.id} already exists in dictionary (${existingMatch?.meaningHindi})`
            : undefined,
          existingMatch,
          selected: !isDuplicate, // Auto-select new valid words by default
        };
      });

      setCandidates(processed);
      if (sourceName) setFileName(sourceName);
    } catch (err: any) {
      setParseError(`JSON Syntax Error: ${err.message || 'Invalid JSON format'}`);
      setCandidates([]);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      setParseError('Please upload a valid .json file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
      parseRawJson(content, file.name);
    };
    reader.onerror = () => {
      setParseError('Failed to read the uploaded file.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleLoadSample = () => {
    const formatted = JSON.stringify(SAMPLE_JSON_DATA, null, 2);
    setJsonText(formatted);
    setActiveTab('paste');
    parseRawJson(formatted, 'sample-template.json');
  };

  const handleDownloadTemplate = () => {
    const sampleString = JSON.stringify(SAMPLE_JSON_DATA, null, 2);
    const blob = new Blob([sampleString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vocabulary-template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyTemplate = () => {
    const sampleString = JSON.stringify(SAMPLE_JSON_DATA, null, 2);
    navigator.clipboard.writeText(sampleString);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  // Toggle selection
  const handleToggleSelect = (tempId: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.tempId === tempId ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.status === 'invalid') return { ...c, selected: false };
        if (c.status === 'duplicate' && duplicateStrategy === 'skip' && select) {
          return { ...c, selected: false };
        }
        return { ...c, selected: select };
      })
    );
  };

  // Adjust selections when duplicate strategy changes
  const handleStrategyChange = (newStrategy: 'skip' | 'update' | 'all') => {
    setDuplicateStrategy(newStrategy);
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.status === 'duplicate') {
          return { ...c, selected: newStrategy !== 'skip' };
        }
        return c;
      })
    );
  };

  // Counts
  const validCount = candidates.filter((c) => c.status === 'valid').length;
  const duplicateCount = candidates.filter((c) => c.status === 'duplicate').length;
  const invalidCount = candidates.filter((c) => c.status === 'invalid').length;
  const selectedCount = candidates.filter((c) => c.selected && c.status !== 'invalid').length;

  // Filtered preview
  const filteredCandidates = useMemo(() => {
    const q = previewSearch.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) =>
        c.word.toLowerCase().includes(q) ||
        c.meaningHindi.includes(q) ||
        c.meaningEnglish.toLowerCase().includes(q) ||
        c.pos.toLowerCase().includes(q)
    );
  }, [candidates, previewSearch]);

  // Execute Import
  const handleExecuteImport = async () => {
    const itemsToProcess = candidates.filter((c) => c.selected && c.status !== 'invalid');
    if (itemsToProcess.length === 0) return;

    setIsSubmitting(true);
    setImportProgress({ current: 0, total: itemsToProcess.length });

    try {
      const wordsToAdd: Omit<WordItem, 'id'>[] = [];
      const wordsToUpdate: WordItem[] = [];

      for (const item of itemsToProcess) {
        if (item.status === 'duplicate' && item.existingMatch && duplicateStrategy === 'update') {
          // Update existing
          wordsToUpdate.push({
            ...item.existingMatch,
            word: item.word,
            pos: item.pos || item.existingMatch.pos,
            meaningHindi: item.meaningHindi || item.existingMatch.meaningHindi,
            meaningEnglish: item.meaningEnglish || item.existingMatch.meaningEnglish,
            synonyms: item.synonyms.length > 0 ? item.synonyms : item.existingMatch.synonyms,
            antonyms: item.antonyms.length > 0 ? item.antonyms : item.existingMatch.antonyms,
            example: item.example || item.existingMatch.example,
            customTip: item.customTip || item.existingMatch.customTip,
            isCustom: true,
            updatedAt: new Date().toISOString(),
          });
        } else {
          // Add as new custom word
          wordsToAdd.push({
            word: item.word,
            pos: item.pos,
            meaningHindi: item.meaningHindi,
            meaningEnglish: item.meaningEnglish,
            synonyms: item.synonyms,
            antonyms: item.antonyms,
            example: item.example,
            customTip: item.customTip,
            isCustom: true,
          });
        }
      }

      await onImportWords(wordsToAdd, wordsToUpdate);
      onClose();
    } catch (err: any) {
      console.error('Import error:', err);
      setParseError(`Import failed: ${err.message || 'Error saving to database'}`);
    } finally {
      setIsSubmitting(false);
      setImportProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0 bg-stone-50/50 dark:bg-stone-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Bulk Add Words via JSON
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3" /> Admin Exclusive
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Easily import dozens or hundreds of vocabulary words into the dictionary from a JSON file.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Tabs & Template Helpers */}
        <div className="px-4 sm:px-5 pt-3 pb-2.5 border-b border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-white dark:bg-stone-900">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload .JSON File</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste JSON Code</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleLoadSample}
              title="Fill with 3 sample high-yield exam words"
              className="px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Load Sample</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              title="Download clean starter JSON template"
              className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium hover:bg-stone-50 dark:hover:bg-stone-750 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Template</span>
            </button>

            <button
              type="button"
              onClick={handleCopyTemplate}
              title="Copy starter JSON template to clipboard"
              className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors cursor-pointer"
            >
              {copiedTemplate ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Parse or Syntax Error Warning */}
          {parseError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">
                <p className="font-bold">Invalid JSON Format</p>
                <p className="text-[11px] mt-0.5 opacity-90">{parseError}</p>
              </div>
            </div>
          )}

          {/* Tab 1: File Upload Dropzone */}
          {activeTab === 'upload' && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-stone-300 dark:border-stone-700 hover:border-amber-400 bg-stone-50/50 dark:bg-stone-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 shadow-inner">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                {fileName ? (
                  <span className="text-amber-600 dark:text-amber-400">{fileName}</span>
                ) : (
                  'Click to upload or drag & drop your JSON file'
                )}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Supports single word object or arrays of hundreds of vocabulary items
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200/60 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[11px] font-medium">
                <span>Accepts .json files</span>
              </div>
            </div>
          )}

          {/* Tab 2: Raw JSON Text Area */}
          {activeTab === 'paste' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span className="font-semibold text-stone-700 dark:text-stone-300">
                  Paste JSON Array or Object:
                </span>
                {jsonText && (
                  <button
                    type="button"
                    onClick={() => {
                      setJsonText('');
                      setCandidates([]);
                      setParseError(null);
                      setFileName(null);
                    }}
                    className="text-stone-400 hover:text-rose-500 text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
              <textarea
                rows={7}
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  parseRawJson(e.target.value, 'pasted-input.json');
                }}
                placeholder='[
  {
    "word": "SERENDIPITY",
    "pos": "n.",
    "meaningHindi": "अचानक और सुखद खोज",
    "meaningEnglish": "finding valuable things unexpectedly",
    "synonyms": ["fluke", "chance", "luck"],
    "antonyms": ["misfortune"],
    "example": "Finding the rare book was pure serendipity."
  }
]'
                className="w-full p-3 font-mono text-xs rounded-xl bg-stone-900 text-amber-200 border border-stone-700 focus:border-amber-500 outline-none resize-y leading-relaxed"
                spellCheck={false}
              />
            </div>
          )}

          {/* Parsed Candidates Preview & Options */}
          {candidates.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
              {/* Stats Bar & Strategy Selector */}
              <div className="p-3 sm:p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  <span className="font-bold text-stone-700 dark:text-stone-200">
                    Parsed: <span className="font-mono text-stone-900 dark:text-stone-100">{candidates.length}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
                    ✓ {validCount} New
                  </span>
                  {duplicateCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold text-[11px]">
                      ⚠ {duplicateCount} Existing
                    </span>
                  )}
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-semibold text-[11px]">
                      ✕ {invalidCount} Invalid
                    </span>
                  )}
                </div>

                {duplicateCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-stone-500 dark:text-stone-400 text-[11px] font-medium">
                      Duplicate Handling:
                    </span>
                    <select
                      value={duplicateStrategy}
                      onChange={(e) => handleStrategyChange(e.target.value as any)}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs font-semibold outline-none cursor-pointer"
                    >
                      <option value="skip">Skip duplicates (Safe)</option>
                      <option value="update">Overwrite / Update existing</option>
                      <option value="all">Import all as new words</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Preview Search & Bulk Select Controls */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Select All</span>
                  </button>
                  <span className="text-stone-300 dark:text-stone-700">•</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Deselect All</span>
                  </button>
                </div>

                <div className="relative w-48 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    placeholder="Search parsed preview..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none"
                  />
                </div>
              </div>

              {/* Candidate Cards List */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 border border-stone-200 dark:border-stone-800 rounded-xl p-2 bg-stone-50/50 dark:bg-stone-900/50">
                {filteredCandidates.length === 0 ? (
                  <p className="text-center py-6 text-xs text-stone-400">
                    No words match "{previewSearch}"
                  </p>
                ) : (
                  filteredCandidates.map((candidate) => {
                    const isSelectable = candidate.status !== 'invalid';
                    return (
                      <div
                        key={candidate.tempId}
                        onClick={() => isSelectable && handleToggleSelect(candidate.tempId)}
                        className={`p-2.5 rounded-lg border transition-all flex items-start gap-3 cursor-pointer ${
                          candidate.selected
                            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 shadow-xs'
                            : candidate.status === 'invalid'
                            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 opacity-70 cursor-not-allowed'
                            : 'bg-white dark:bg-stone-800/70 border-stone-200 dark:border-stone-750 opacity-80'
                        }`}
                      >
                        <div className="pt-0.5 shrink-0">
                          {isSelectable ? (
                            <input
                              type="checkbox"
                              checked={candidate.selected}
                              onChange={() => handleToggleSelect(candidate.tempId)}
                              className="w-4 h-4 rounded text-amber-500 border-stone-300 dark:border-stone-700 focus:ring-amber-400 cursor-pointer"
                            />
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-700 dark:text-rose-300 flex items-center justify-center text-[10px] font-bold">
                              ✕
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center flex-wrap gap-1.5">
                            <span className="text-xs font-black tracking-tight text-stone-900 dark:text-stone-100">
                              {candidate.word}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                              {candidate.pos}
                            </span>
                            {candidate.status === 'duplicate' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                Duplicate #{candidate.existingMatch?.id}
                              </span>
                            )}
                            {candidate.status === 'valid' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                New Word
                              </span>
                            )}
                            {candidate.status === 'invalid' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                                Invalid
                              </span>
                            )}
                          </div>

                          <div className="text-xs flex items-baseline gap-2">
                            <span className="font-bold text-amber-700 dark:text-amber-400 font-['Noto_Sans_Devanagari',sans-serif]">
                              {candidate.meaningHindi || '—'}
                            </span>
                            <span className="text-stone-500 dark:text-stone-400 text-[11px] truncate">
                              {candidate.meaningEnglish || '—'}
                            </span>
                          </div>

                          {candidate.validationMessage && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              {candidate.validationMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Progress Bar & Import Trigger */}
        <div className="p-3 sm:p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-500 dark:text-stone-400">
            {selectedCount > 0 ? (
              <span>
                Ready to import <strong className="text-stone-900 dark:text-stone-100 font-mono font-bold">{selectedCount}</strong> words into the live database.
              </span>
            ) : (
              <span>Upload or paste a JSON file to inspect words.</span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={selectedCount === 0 || isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    Syncing {importProgress ? `${importProgress.current}/${importProgress.total}` : '...'}
                  </span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Import {selectedCount} Words</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
