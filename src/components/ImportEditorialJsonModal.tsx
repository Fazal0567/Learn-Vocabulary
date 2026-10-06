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
  Newspaper,
  BookOpen,
  HelpCircle,
  Loader2,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Edit3,
} from 'lucide-react';
import { EditorialItem, EditorialMCQ, EditorialVocabulary } from '../types';

interface ImportEditorialJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportEditorials: (editorials: EditorialItem[]) => Promise<void>;
  onOpenInEditor?: (editorial: EditorialItem) => void;
}

const SAMPLE_EDITORIAL_JSON = {
  title: "A Green Transition Grounded in Energy Justice",
  date: new Date().toISOString().split('T')[0],
  publisher: "The Hindu",
  category: "Environment & Climate",
  content: `The global push towards decarbonisation must not lose sight of equity and energy access. Developing nations require substantial climate finance and technology transfer to phase down fossil fuels without stunting developmental goals.\n\nRenewable energy expansion must go hand-in-hand with resilient grid infrastructure and decentralized community solar systems to ensure affordable power for marginalized households.\n\nWithout inclusive policy frameworks, market-driven clean transitions risk exacerbating economic disparities rather than curing them.`,
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
    },
    {
      word: "RESILIENT",
      meaningHindi: "लचीला / आघात सहने में सक्षम",
      meaningEnglish: "able to withstand or recover quickly from difficult conditions",
      partOfSpeech: "adj.",
      contextSentence: "Building resilient supply chains will prevent frequent power outages."
    }
  ],
  mcqs: [
    {
      question: "According to the passage, what critical factor must accompany the phase-down of fossil fuels in developing nations?",
      options: [
        "Substantial climate finance and technology transfer",
        "A total suspension of industrial manufacturing",
        "An immediate shutdown of conventional power stations",
        "Privatization of all public utility providers"
      ],
      correctOptionIndex: 0,
      explanation: "The text states that developing nations require climate finance and technology transfer to grow sustainably."
    },
    {
      question: "What is recommended to ensure affordable power for marginalized households?",
      options: [
        "Imposing higher carbon tariffs on rural users",
        "Decentralized community solar systems and resilient grids",
        "Importing expensive foreign fuel reserves",
        "Curtailing power consumption during peak seasons"
      ],
      correctOptionIndex: 1,
      explanation: "The author specifically highlights decentralized solar systems and resilient grid infrastructure."
    }
  ]
};

export const ImportEditorialJsonModal: React.FC<ImportEditorialJsonModalProps> = ({
  isOpen,
  onClose,
  onImportEditorials,
  onOpenInEditor,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('paste');
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedEditorials, setParsedEditorials] = useState<EditorialItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [previewExpandedIndex, setPreviewExpandedIndex] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Statistics calculation hook
  const stats = useMemo(() => {
    let totalVocab = 0;
    let totalMcqs = 0;
    let totalWords = 0;

    parsedEditorials.forEach((ed) => {
      totalVocab += ed.vocabulary?.length || 0;
      totalMcqs += ed.mcqs?.length || 0;
      totalWords += ed.content ? ed.content.trim().split(/\s+/).length : 0;
    });

    return {
      count: parsedEditorials.length,
      totalVocab,
      totalMcqs,
      totalWords,
    };
  }, [parsedEditorials]);

  const parseRawJson = (rawContent: string, sourceName?: string) => {
    setParseError(null);
    if (!rawContent.trim()) {
      setParsedEditorials([]);
      return;
    }

    try {
      let data = JSON.parse(rawContent);

      // Support wrappers: { editorials: [...] } or { data: [...] }
      if (!Array.isArray(data) && typeof data === 'object' && data !== null) {
        if (Array.isArray(data.editorials)) {
          data = data.editorials;
        } else if (Array.isArray(data.data)) {
          data = data.data;
        } else if (Array.isArray(data.articles)) {
          data = data.articles;
        } else {
          // Single editorial object
          data = [data];
        }
      }

      if (!Array.isArray(data) || data.length === 0) {
        setParseError('The JSON content does not contain a valid editorial item or array.');
        setParsedEditorials([]);
        return;
      }

      const results: EditorialItem[] = [];

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (!item || typeof item !== 'object') continue;

        const title = String(item.title || item.headline || item.name || '').trim();
        const content = String(item.content || item.article || item.text || item.body || '').trim();

        if (!title && !content) {
          continue;
        }

        const date = String(item.date || item.publishedDate || item.publishDate || new Date().toISOString().split('T')[0]).trim();
        const publisher = String(item.publisher || item.source || item.newspaper || 'The Hindu').trim();
        const category = String(item.category || item.topic || item.section || 'General').trim();
        const summary = String(item.summary || item.takeaways || item.notes || '').trim();

        // Parse Vocabulary
        const rawVocab = item.vocabulary || item.vocab || item.words || item.keyVocabulary;
        const vocabulary: EditorialVocabulary[] = [];
        if (Array.isArray(rawVocab)) {
          rawVocab.forEach((v: any) => {
            if (!v || typeof v !== 'object') return;
            const word = String(v.word || v.term || '').trim();
            const meaningHindi = String(v.meaningHindi || v.hindi || v.hindiMeaning || '').trim();
            const meaningEnglish = String(v.meaningEnglish || v.english || v.meaning || v.definition || '').trim();
            const partOfSpeech = String(v.partOfSpeech || v.pos || 'noun').trim();
            const contextSentence = String(v.contextSentence || v.example || v.sentence || '').trim();

            if (word) {
              vocabulary.push({
                word: word.toUpperCase(),
                meaningHindi: meaningHindi || meaningEnglish,
                meaningEnglish: meaningEnglish || meaningHindi,
                partOfSpeech,
                contextSentence: contextSentence || undefined,
              });
            }
          });
        }

        // Parse MCQs
        const rawMcqs = item.mcqs || item.questions || item.quiz;
        const mcqs: EditorialMCQ[] = [];
        if (Array.isArray(rawMcqs)) {
          rawMcqs.forEach((q: any, qIdx: number) => {
            if (!q || typeof q !== 'object') return;
            const question = String(q.question || q.prompt || q.statement || '').trim();
            if (!question) return;

            let options: string[] = [];
            if (Array.isArray(q.options)) {
              options = q.options.map((opt: any) => String(opt || '').trim());
            } else if (typeof q.options === 'object' && q.options !== null) {
              options = Object.values(q.options).map((opt: any) => String(opt || '').trim());
            }

            // Ensure 4 options or pad if fewer
            while (options.length < 4) {
              options.push(`Option ${String.fromCharCode(65 + options.length)}`);
            }

            // Resolve correct option index
            let correctOptionIndex = 0;
            const rawAns = q.correctOptionIndex ?? q.correctIndex ?? q.answer ?? q.correctOption;
            if (typeof rawAns === 'number') {
              if (rawAns >= 0 && rawAns < 4) {
                correctOptionIndex = rawAns;
              } else if (rawAns >= 1 && rawAns <= 4) {
                correctOptionIndex = rawAns - 1; // 1-indexed conversion
              }
            } else if (typeof rawAns === 'string') {
              const upperAns = rawAns.trim().toUpperCase();
              if (['A', 'B', 'C', 'D'].includes(upperAns)) {
                correctOptionIndex = upperAns.charCodeAt(0) - 65;
              } else {
                const matchIdx = options.findIndex((opt) => opt.toLowerCase() === rawAns.trim().toLowerCase());
                if (matchIdx >= 0) {
                  correctOptionIndex = matchIdx;
                }
              }
            }

            const explanation = String(q.explanation || q.solution || q.reason || '').trim();

            mcqs.push({
              id: q.id || `mcq_${Date.now()}_${qIdx}_${Math.random().toString(36).substring(2, 6)}`,
              question,
              options: options.slice(0, 4),
              correctOptionIndex,
              explanation,
            });
          });
        }

        const wordCount = content.split(/\s+/).length;
        const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

        results.push({
          id: item.id || `ed_${Date.now()}_${i}`,
          title: title || 'Untitled Editorial',
          date,
          publisher,
          category,
          content,
          summary: summary || undefined,
          vocabulary: vocabulary.length > 0 ? vocabulary : undefined,
          mcqs,
          readingTimeMinutes,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      if (results.length === 0) {
        setParseError('Could not find any editorial with valid title or content.');
        setParsedEditorials([]);
        return;
      }

      setParsedEditorials(results);
      setPreviewExpandedIndex(0);
      if (sourceName) setFileName(sourceName);
    } catch (err: any) {
      setParseError(`JSON Syntax Error: ${err.message || 'Invalid JSON syntax'}`);
      setParsedEditorials([]);
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
      setParseError('Failed to read the file.');
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
    const formatted = JSON.stringify(SAMPLE_EDITORIAL_JSON, null, 2);
    setJsonText(formatted);
    setActiveTab('paste');
    parseRawJson(formatted, 'sample-editorial.json');
  };

  const handleDownloadTemplate = () => {
    const sampleString = JSON.stringify(SAMPLE_EDITORIAL_JSON, null, 2);
    const blob = new Blob([sampleString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `editorial-template-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyTemplate = () => {
    const sampleString = JSON.stringify(SAMPLE_EDITORIAL_JSON, null, 2);
    navigator.clipboard.writeText(sampleString);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleImportSubmit = async () => {
    if (parsedEditorials.length === 0) return;
    setIsSubmitting(true);
    try {
      await onImportEditorials(parsedEditorials);
      onClose();
    } catch (err: any) {
      setParseError(`Upload failed: ${err.message || 'Error saving to database'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe early exit check after all hooks
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0 bg-stone-50/70 dark:bg-stone-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Upload Editorial via JSON
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3" /> Admin Exclusive
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Directly upload full editorial articles, vocabulary definitions, and comprehension MCQs with instant cloud sync.
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

        {/* Action Tabs & Template Tools */}
        <div className="px-4 sm:px-5 pt-3 pb-2.5 border-b border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-white dark:bg-stone-900">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800">
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
              <span>Paste JSON Text</span>
            </button>
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
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleLoadSample}
              title="Pre-fill with a sample Hindu editorial, 3 vocab words, and 2 MCQs"
              className="px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Load Sample</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              title="Download starter editorial template JSON"
              className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium hover:bg-stone-50 dark:hover:bg-stone-750 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Template</span>
            </button>

            <button
              type="button"
              onClick={handleCopyTemplate}
              title="Copy starter editorial JSON template to clipboard"
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Error Message */}
          {parseError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">
                <p className="font-bold">JSON Processing Error</p>
                <p className="text-[11px] mt-0.5 opacity-90">{parseError}</p>
              </div>
            </div>
          )}

          {/* Mode 1: Paste Text */}
          {activeTab === 'paste' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span className="font-semibold text-stone-700 dark:text-stone-300">
                  Paste Editorial JSON (Title, Content, Vocab & MCQs):
                </span>
                {jsonText && (
                  <button
                    type="button"
                    onClick={() => {
                      setJsonText('');
                      setParsedEditorials([]);
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
                rows={8}
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  parseRawJson(e.target.value, 'pasted-editorial.json');
                }}
                placeholder='{
  "title": "Editorial Headline...",
  "publisher": "The Hindu",
  "category": "Economy",
  "content": "Full article text paragraph 1...\n\nParagraph 2...",
  "vocabulary": [
    { "word": "UBIQUITOUS", "meaningHindi": "सर्वव्यापी", "meaningEnglish": "omnipresent" }
  ],
  "mcqs": [
    {
      "question": "Comprehension question statement?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 0,
      "explanation": "Detailed explanation..."
    }
  ]
}'
                className="w-full p-3 font-mono text-xs rounded-xl bg-stone-900 text-amber-200 border border-stone-700 focus:border-amber-500 outline-none resize-y leading-relaxed"
                spellCheck={false}
              />
            </div>
          )}

          {/* Mode 2: Upload File */}
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
                  'Click to upload or drag & drop your Editorial .json file'
                )}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Supports single editorial object or an array of daily editorials
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200/60 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[11px] font-medium">
                <span>Accepts .json files</span>
              </div>
            </div>
          )}

          {/* Parsed Live Preview Section */}
          {parsedEditorials.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
              {/* Summary Stats Bar */}
              <div className="p-3 sm:p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-750 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  <span className="font-bold text-stone-700 dark:text-stone-200">
                    Parsed: <span className="font-mono text-stone-900 dark:text-stone-100">{stats.count}</span> {stats.count === 1 ? 'Editorial' : 'Editorials'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold text-[11px] flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> {stats.totalVocab} Vocab Words
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px] flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" /> {stats.totalMcqs} MCQs
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-stone-200/70 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-[11px]">
                    ~{stats.totalWords} Words
                  </span>
                </div>
              </div>

              {/* Editorials Preview Accordion / Cards */}
              <div className="space-y-3">
                {parsedEditorials.map((editorial, idx) => {
                  const isExpanded = previewExpandedIndex === idx;
                  return (
                    <div
                      key={editorial.id || idx}
                      className="rounded-xl border border-stone-200 dark:border-stone-750 bg-white dark:bg-stone-850 overflow-hidden shadow-xs"
                    >
                      {/* Card Header */}
                      <div
                        onClick={() => setPreviewExpandedIndex(isExpanded ? -1 : idx)}
                        className="p-3.5 bg-stone-50/80 dark:bg-stone-800/60 hover:bg-stone-100/80 dark:hover:bg-stone-800 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                              {editorial.publisher}
                            </span>
                            <span className="text-[11px] font-mono text-stone-400">
                              {editorial.date}
                            </span>
                            <span className="text-[11px] font-medium text-stone-500">
                              • {editorial.category}
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 truncate mt-0.5">
                            {editorial.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            {isExpanded ? 'Collapse' : 'Preview Details'}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="p-4 space-y-4 text-xs border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900">
                          {/* Article Content Excerpt */}
                          <div>
                            <h5 className="font-bold text-stone-800 dark:text-stone-200 mb-1 flex items-center gap-1.5">
                              <Newspaper className="w-3.5 h-3.5 text-amber-600" />
                              <span>Editorial Article Excerpt</span>
                            </h5>
                            <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-3 italic bg-stone-50 dark:bg-stone-800/40 p-2.5 rounded-lg border border-stone-200/60 dark:border-stone-800">
                              "{editorial.content}"
                            </p>
                          </div>

                          {/* Key Vocabulary Highlights */}
                          {editorial.vocabulary && editorial.vocabulary.length > 0 && (
                            <div>
                              <h5 className="font-bold text-stone-800 dark:text-stone-200 mb-1.5 flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                                <span>Vocabulary Words ({editorial.vocabulary.length})</span>
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {editorial.vocabulary.map((v, vIdx) => (
                                  <div
                                    key={vIdx}
                                    className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-750"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-black text-stone-900 dark:text-stone-100">
                                        {v.word}
                                      </span>
                                      {v.partOfSpeech && (
                                        <span className="text-[10px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                                          {v.partOfSpeech}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-amber-700 dark:text-amber-400 font-bold text-[11px] font-['Noto_Sans_Devanagari',sans-serif]">
                                      {v.meaningHindi}
                                    </p>
                                    <p className="text-stone-500 dark:text-stone-400 text-[11px] truncate">
                                      {v.meaningEnglish}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Comprehension MCQs Highlights */}
                          {editorial.mcqs && editorial.mcqs.length > 0 && (
                            <div>
                              <h5 className="font-bold text-stone-800 dark:text-stone-200 mb-1.5 flex items-center gap-1.5">
                                <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Comprehension MCQs ({editorial.mcqs.length})</span>
                              </h5>
                              <div className="space-y-2">
                                {editorial.mcqs.map((q, qIdx) => (
                                  <div
                                    key={q.id || qIdx}
                                    className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-750 space-y-1.5"
                                  >
                                    <p className="font-bold text-stone-900 dark:text-stone-100">
                                      Q{qIdx + 1}. {q.question}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                                      {q.options.map((opt, oIdx) => (
                                        <div
                                          key={oIdx}
                                          className={`px-2 py-1 rounded-md flex items-center gap-1.5 ${
                                            oIdx === q.correctOptionIndex
                                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800'
                                              : 'text-stone-600 dark:text-stone-400'
                                          }`}
                                        >
                                          <span className="font-mono font-bold text-[10px]">
                                            {String.fromCharCode(65 + oIdx)}.
                                          </span>
                                          <span className="truncate">{opt}</span>
                                          {oIdx === q.correctOptionIndex && (
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 ml-auto" />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                    {q.explanation && (
                                      <p className="text-[10px] text-stone-500 italic mt-0.5">
                                        Explanation: {q.explanation}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Quick Edit in Manual Form option */}
                          {onOpenInEditor && (
                            <div className="pt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenInEditor(editorial);
                                  onClose();
                                }}
                                className="text-amber-600 dark:text-amber-400 hover:text-amber-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Open this Editorial in Visual Editor to Tweak</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-500 dark:text-stone-400">
            {parsedEditorials.length > 0 ? (
              <span>
                Ready to publish <strong className="text-stone-900 dark:text-stone-100 font-bold">{parsedEditorials.length}</strong> editorial(s) with {stats.totalVocab} vocabulary & {stats.totalMcqs} MCQs.
              </span>
            ) : (
              <span>Paste JSON code or upload a file to parse and preview.</span>
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
              onClick={handleImportSubmit}
              disabled={parsedEditorials.length === 0 || isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Syncing to Cloud...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    Upload & Publish {parsedEditorials.length > 0 ? `(${parsedEditorials.length})` : ''}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
