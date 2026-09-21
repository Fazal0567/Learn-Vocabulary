import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, X, Check, AlertTriangle, Sparkles, Volume2, Languages, Loader2 } from 'lucide-react';
import { WordItem } from '../types';
import { speakWord } from '../utils/speech';
import { transliterateHinglishToHindi, translateEnglishToHindi } from '../utils/hindiTransliterator';

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveWord: (wordData: Omit<WordItem, 'id'>, editId?: number) => void;
  existingWords: WordItem[];
  editWord?: WordItem | null;
}

export const AddWordModal: React.FC<AddWordModalProps> = ({
  isOpen,
  onClose,
  onSaveWord,
  existingWords,
  editWord = null,
}) => {
  const [word, setWord] = useState('');
  const [pos, setPos] = useState('adj.');
  const [customPos, setCustomPos] = useState('');
  const [meaningHindi, setMeaningHindi] = useState('');
  const [meaningEnglish, setMeaningEnglish] = useState('');
  const [synonymsInput, setSynonymsInput] = useState('');
  const [antonymsInput, setAntonymsInput] = useState('');
  const [example, setExample] = useState('');
  const [customTip, setCustomTip] = useState('');
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Hinglish to Hindi Transliteration & Translation states
  const [hinglishMode, setHinglishMode] = useState(true);
  const [isConvertingHindi, setIsConvertingHindi] = useState(false);
  const [transliterateSuccess, setTransliterateSuccess] = useState(false);
  const hindiInputRef = useRef<HTMLInputElement>(null);

  const posPresets = ['n.', 'v.', 'adj.', 'adv.', 'idiom', 'phr.'];

  useEffect(() => {
    if (editWord) {
      setWord(editWord.word);
      if (posPresets.includes(editWord.pos || '')) {
        setPos(editWord.pos || 'adj.');
        setCustomPos('');
      } else {
        setPos('custom');
        setCustomPos(editWord.pos || '');
      }
      setMeaningHindi(editWord.meaningHindi);
      setMeaningEnglish(editWord.meaningEnglish);
      setSynonymsInput(editWord.synonyms.join(', '));
      setAntonymsInput(editWord.antonyms.join(', '));
      setExample(editWord.example);
      setCustomTip(editWord.customTip || '');
    } else {
      setWord('');
      setPos('adj.');
      setCustomPos('');
      setMeaningHindi('');
      setMeaningEnglish('');
      setSynonymsInput('');
      setAntonymsInput('');
      setExample('');
      setCustomTip('');
    }
    setError('');
    setDuplicateWarning(null);
  }, [editWord, isOpen]);

  // Check duplicate when word changes
  useEffect(() => {
    const cleanWord = word.trim().toUpperCase();
    if (!cleanWord) {
      setDuplicateWarning(null);
      return;
    }
    const found = existingWords.find(
      (w) => w.word.toUpperCase() === cleanWord && (!editWord || w.id !== editWord.id)
    );
    if (found) {
      setDuplicateWarning(`"${found.word}" already exists in dictionary (Word #${found.id}: ${found.meaningHindi})`);
    } else {
      setDuplicateWarning(null);
    }
  }, [word, existingWords, editWord]);

  const handleConvertHinglish = async () => {
    if (!meaningHindi.trim() || isConvertingHindi) return;
    setIsConvertingHindi(true);
    try {
      const converted = await transliterateHinglishToHindi(meaningHindi);
      if (converted && converted.trim()) {
        setMeaningHindi(converted);
        setTransliterateSuccess(true);
        setTimeout(() => setTransliterateSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to convert Hinglish:', err);
    } finally {
      setIsConvertingHindi(false);
    }
  };

  const handleAutoTranslateFromEnglish = async () => {
    const query = meaningEnglish.trim() || word.trim();
    if (!query || isConvertingHindi) return;
    setIsConvertingHindi(true);
    try {
      const translated = await translateEnglishToHindi(query);
      if (translated && translated.trim()) {
        setMeaningHindi(translated);
        setTransliterateSuccess(true);
        setTimeout(() => setTransliterateSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to translate:', err);
    } finally {
      setIsConvertingHindi(false);
    }
  };

  // Live spacebar transliteration: as soon as user finishes a word and presses Space or Enter
  const handleHindiKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!hinglishMode) return;

    if (e.key === ' ' || e.key === 'Enter') {
      const input = e.currentTarget;
      const cursorPos = input.selectionStart ?? meaningHindi.length;
      const textBefore = meaningHindi.slice(0, cursorPos);
      const textAfter = meaningHindi.slice(cursorPos);

      // Check if last token before cursor contains Latin characters
      const match = textBefore.match(/([a-zA-Z]+)$/);
      if (match) {
        const latinToken = match[1];
        const startIndex = cursorPos - latinToken.length;

        // Prevent immediate raw space so we substitute seamlessly
        e.preventDefault();
        setIsConvertingHindi(true);

        try {
          const hindiToken = await transliterateHinglishToHindi(latinToken);
          const newText = textBefore.slice(0, startIndex) + hindiToken + ' ' + textAfter;
          setMeaningHindi(newText);

          // Restore cursor right after the newly inserted Hindi word and space
          setTimeout(() => {
            if (hindiInputRef.current) {
              const newPos = startIndex + hindiToken.length + 1;
              hindiInputRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        } catch {
          setMeaningHindi(textBefore + ' ' + textAfter);
        } finally {
          setIsConvertingHindi(false);
        }
      }
    }
  };

  // When Hindi field loses focus, auto-transliterate any remaining Latin characters
  const handleHindiBlur = async () => {
    if (!hinglishMode || !meaningHindi.trim()) return;
    if (/[a-zA-Z]/.test(meaningHindi)) {
      setIsConvertingHindi(true);
      try {
        const converted = await transliterateHinglishToHindi(meaningHindi);
        if (converted && converted.trim()) {
          setMeaningHindi(converted);
        }
      } catch (err) {
        console.error('Error on blur conversion:', err);
      } finally {
        setIsConvertingHindi(false);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedWord = word.trim();
    const trimmedHindi = meaningHindi.trim();
    const trimmedEnglish = meaningEnglish.trim();

    if (!trimmedWord) {
      setError('Please enter the English word.');
      return;
    }

    if (!trimmedHindi) {
      setError('Please enter the Hindi meaning.');
      return;
    }

    if (!trimmedEnglish) {
      setError('Please enter the English definition.');
      return;
    }

    const finalPos = pos === 'custom' ? customPos.trim() : pos;

    const synonyms = synonymsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const antonyms = antonymsInput
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const finalExample =
      example.trim() || `Mastery of "${trimmedWord}" strengthens comprehension in competitive English exams.`;

    onSaveWord(
      {
        word: trimmedWord.toUpperCase(),
        pos: finalPos || undefined,
        meaningHindi: trimmedHindi,
        meaningEnglish: trimmedEnglish,
        synonyms: synonyms.length > 0 ? synonyms : ['Equivalent'],
        antonyms: antonyms.length > 0 ? antonyms : ['Opposite'],
        example: finalExample,
        isCustom: true,
        customTip: customTip.trim() || undefined,
      },
      editWord ? editWord.id : undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-stone-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                {editWord ? 'Edit Vocabulary Word' : 'Add New Vocabulary Word'}
              </h2>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                👑 Admin Privilege
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {duplicateWarning && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          {/* Word & Pronounce Test */}
          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
              English Word <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="e.g. SERENDIPITY, PERSISTENT..."
                className="flex-1 px-3 py-2 text-sm font-bold uppercase rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                autoFocus
              />
              {word.trim() && (
                <button
                  type="button"
                  onClick={() => speakWord(word.trim())}
                  title="Test Audio Pronunciation"
                  className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 flex items-center gap-1.5 font-medium transition-colors"
                >
                  <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Test</span>
                </button>
              )}
            </div>
          </div>

          {/* Part of Speech */}
          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Part of Speech
            </label>
            <div className="flex flex-wrap gap-1.5">
              {posPresets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPos(p)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    pos === p
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-750'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPos('custom')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  pos === 'custom'
                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                }`}
              >
                Other
              </button>
            </div>
            {pos === 'custom' && (
              <input
                type="text"
                value={customPos}
                onChange={(e) => setCustomPos(e.target.value)}
                placeholder="e.g. prep., conj."
                className="mt-2 w-full px-3 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none"
              />
            )}
          </div>

          {/* Hindi Meaning */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <span>Hindi Meaning</span>
                <span className="text-rose-500">*</span>
              </label>

              {/* Hinglish to Hindi Toggle Switch */}
              <button
                type="button"
                onClick={() => setHinglishMode(!hinglishMode)}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all border ${
                  hinglishMode
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-stone-100 text-stone-500 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700'
                }`}
                title="When ON: Typing in Hinglish and pressing Space converts word to Hindi"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>Hinglish → हिंदी: {hinglishMode ? 'Auto ON' : 'OFF'}</span>
              </button>
            </div>

            <div className="relative flex items-center">
              <input
                ref={hindiInputRef}
                type="text"
                value={meaningHindi}
                onChange={(e) => setMeaningHindi(e.target.value)}
                onKeyDown={handleHindiKeyDown}
                onBlur={handleHindiBlur}
                placeholder={
                  hinglishMode
                    ? 'Type in Hinglish (e.g. achanak aur sukhad khoj)...'
                    : 'e.g. अचानक और सुखद खोज / दृढ़'
                }
                className="w-full pl-3 pr-24 py-2.5 text-sm rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-['Noto_Sans_Devanagari',sans-serif] outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />

              <div className="absolute right-1.5 flex items-center gap-1">
                {isConvertingHindi ? (
                  <span className="px-2.5 py-1 text-[11px] rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Converting...</span>
                  </span>
                ) : transliterateSuccess ? (
                  <span className="px-2.5 py-1 text-[11px] rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Converted!</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleConvertHinglish}
                    disabled={!meaningHindi.trim()}
                    title="Convert current Hinglish to Hindi Devanagari"
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1 transition-colors disabled:opacity-40"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Convert</span>
                  </button>
                )}
              </div>
            </div>

            {/* Practical instructions & translation helper */}
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                <span>
                  💡 <span className="font-semibold text-stone-700 dark:text-stone-300">Hinglish Typing:</span> Type word in English letters and hit <kbd className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-750 font-mono text-[10px] text-stone-700 dark:text-stone-300 font-semibold">Space</kbd> (e.g. <span className="font-mono text-amber-600 dark:text-amber-400">"achanak"</span> → <span className="font-semibold text-stone-800 dark:text-stone-200">"अचानक"</span>).
                </span>
              </div>

              {(meaningEnglish.trim() || word.trim()) && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAutoTranslateFromEnglish}
                    disabled={isConvertingHindi}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors py-0.5"
                  >
                    <Languages className="w-3 h-3" />
                    <span>
                      Auto-translate meaning from English "{meaningEnglish.trim() ? 'Definition' : word.trim()}"
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* English Meaning / Definition */}
          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
              English Definition <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={meaningEnglish}
              onChange={(e) => setMeaningEnglish(e.target.value)}
              placeholder="e.g. finding pleasant things by chance"
              className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Synonyms & Antonyms Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Synonyms <span className="text-stone-400 font-normal">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={synonymsInput}
                onChange={(e) => setSynonymsInput(e.target.value)}
                placeholder="e.g. Fluke, Chance, Luck"
                className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Antonyms <span className="text-stone-400 font-normal">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={antonymsInput}
                onChange={(e) => setAntonymsInput(e.target.value)}
                placeholder="e.g. Misfortune, Design, Plan"
                className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Example Sentence */}
          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Contextual Example Sentence
            </label>
            <textarea
              rows={2}
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="e.g. Finding the rare book in a small village was pure serendipity."
              className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none"
            />
          </div>

          {/* Custom Vocabulary Tip (Optional) */}
          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Vocabulary / Usage Tip <span className="text-stone-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={customTip}
              onChange={(e) => setCustomTip(e.target.value)}
              placeholder="e.g. Frequently asked in reading comprehension and cloze tests."
              className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md active:scale-[0.98] transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{editWord ? 'Update Word' : 'Save & Add Word'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
