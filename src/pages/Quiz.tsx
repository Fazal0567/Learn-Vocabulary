import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Volume2,
} from 'lucide-react';
import { QuizQuestion } from '../types';
import { generateQuizQuestions } from '../utils/vocabularyUtils';
import { speakWord } from '../utils/speech';

interface QuizProps {
  onUpdateQuizStats?: (correct: boolean) => void;
}

export const Quiz: React.FC<QuizProps> = ({ onUpdateQuizStats }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const startNewQuiz = () => {
    const qList = generateQuizQuestions(10);
    setQuestions(qList);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setWrongCount(0);
    setIsCompleted(false);
  };

  useEffect(() => {
    startNewQuiz();
  }, []);

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-stone-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;

    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQ.correctIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
    } else {
      setWrongCount(prev => prev + 1);
    }

    if (onUpdateQuizStats) {
      onUpdateQuizStats(isCorrect);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
    }
  };

  const totalQuestions = questions.length;
  const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  // Question type badge details
  const typeBadge: Record<string, { label: string; color: string }> = {
    meaning: { label: 'English Meaning', color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800' },
    synonym: { label: 'Synonym Identification', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' },
    antonym: { label: 'Antonym (Opposite)', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800' },
    hindi: { label: 'Hindi to English', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' },
  };

  if (isCompleted) {
    return (
      <div className="w-full h-full overflow-y-auto p-4 sm:p-6 max-w-md mx-auto flex flex-col items-center justify-center text-center space-y-5">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xl mb-1">
          <Award className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Quiz Completed!
          </span>
          <h2 className="text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-['Rozha_One',serif]">
            Your Score: {score} / {totalQuestions}
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-3 gap-2.5 p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
          <div>
            <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block">Correct</span>
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{score}</span>
          </div>
          <div>
            <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block">Wrong</span>
            <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">{wrongCount}</span>
          </div>
          <div>
            <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block">Accuracy</span>
            <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{accuracy}%</span>
          </div>
        </div>

        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs leading-relaxed">
          {accuracy >= 80
            ? 'Excellent! You have solid command over high-yield vocabulary.'
            : accuracy >= 50
            ? 'Good attempt! Revise the unlearned words and retake the quiz to boost speed.'
            : 'Keep practicing! Review flashcards in reels mode to strengthen word recall.'}
        </p>

        <button
          onClick={startNewQuiz}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:from-amber-600 hover:to-orange-700 shadow-lg active:scale-[0.99] transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restart Quiz (New 10 Questions)</span>
        </button>
      </div>
    );
  }

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 max-w-lg mx-auto flex flex-col justify-between space-y-4">
      {/* Quiz Top Progress */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeBadge[currentQ.type]?.color || ''}`}>
              {typeBadge[currentQ.type]?.label}
            </span>
          </div>
          <span className="font-mono font-bold text-stone-700 dark:text-stone-300">
            Question {currentIndex + 1} / {totalQuestions}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 font-['Rozha_One',serif] leading-snug">
            {currentQ.prompt}
          </h2>
          {currentQ.questionWord && (
            <button
              onClick={() => speakWord(currentQ.questionWord!)}
              className="p-2 rounded-full text-stone-400 hover:text-amber-600 shrink-0"
              title="Pronounce"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2.5 mt-5">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQ.correctIndex;

            let optionStyle = 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-amber-50 dark:hover:bg-stone-800';

            if (isAnswered) {
              if (isCorrect) {
                optionStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
              } else if (isSelected) {
                optionStyle = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200 font-bold';
              } else {
                optionStyle = 'opacity-50 border-stone-200 dark:border-stone-800';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered}
                className={`w-full p-3 sm:p-3.5 rounded-xl border text-left text-sm flex items-center justify-between transition-all duration-150 ${optionStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {optionLetters[idx]}
                  </span>
                  <span className="font-medium">{option}</span>
                </div>

                {isAnswered && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation Card */}
        {isAnswered && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-stone-700 dark:text-stone-300 animate-in fade-in duration-200">
            <span className="font-bold text-amber-800 dark:text-amber-400 block mb-0.5">
              Explanation:
            </span>
            {currentQ.explanation}
          </div>
        )}
      </div>

      {/* Next Question / Submit Button */}
      <div className="pt-2">
        {isAnswered ? (
          <button
            onClick={handleNextQuestion}
            className="w-full py-3.5 px-4 rounded-xl bg-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-600 shadow-md active:scale-[0.99] transition-all"
          >
            <span>{currentIndex < totalQuestions - 1 ? 'Next Question' : 'View Results'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="text-center text-xs text-stone-400 py-2">
            Select the best option from above
          </div>
        )}
      </div>
    </div>
  );
};
