import { WordItem, QuizQuestion, RevisionFilter } from '../types';
import { VOCABULARY_DATA } from '../data/vocabulary';

/**
 * Filter words based on revision criteria
 */
export function filterVocabulary(
  filter: RevisionFilter,
  learnedIds: number[],
  favoriteIds: number[],
  importantIds: number[],
  difficultIds: number[],
  vocabularyList: WordItem[] = VOCABULARY_DATA
): WordItem[] {
  const learnedSet = new Set(learnedIds);
  const favoriteSet = new Set(favoriteIds);
  const importantSet = new Set(importantIds);
  const difficultSet = new Set(difficultIds);

  switch (filter) {
    case 'unlearned':
      return vocabularyList.filter(w => !learnedSet.has(w.id));
    case 'important':
      return vocabularyList.filter(w => importantSet.has(w.id));
    case 'favorites':
      return vocabularyList.filter(w => favoriteSet.has(w.id));
    case 'difficult':
      return vocabularyList.filter(w => difficultSet.has(w.id));
    case 'all':
    default:
      return vocabularyList;
  }
}

/**
 * Full-text search across word, hindi, english, synonyms, antonyms
 */
export function searchVocabulary(query: string, vocabularyList: WordItem[] = VOCABULARY_DATA): WordItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return vocabularyList.filter(item => {
    if (item.word.toLowerCase().includes(q)) return true;
    if (item.meaningHindi.includes(q)) return true;
    if (item.meaningEnglish.toLowerCase().includes(q)) return true;
    if (item.synonyms.some(s => s.toLowerCase().includes(q))) return true;
    if (item.antonyms.some(a => a.toLowerCase().includes(q))) return true;
    return false;
  }).slice(0, 50); // Limit to 50 for quick display
}

/**
 * Generate randomized Quiz questions from vocabulary database
 */
export function generateQuizQuestions(count: number = 10, vocabularyList: WordItem[] = VOCABULARY_DATA): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const total = vocabularyList.length;
  if (total === 0) return [];
  const usedWordIds = new Set<number>();

  const types: ('meaning' | 'synonym' | 'antonym' | 'hindi')[] = [
    'meaning',
    'synonym',
    'antonym',
    'hindi'
  ];

  for (let i = 0; i < count; i++) {
    // Pick unique target word
    let target: WordItem;
    let attempts = 0;
    do {
      const randIndex = Math.floor(Math.random() * total);
      target = vocabularyList[randIndex];
      attempts++;
    } while (usedWordIds.has(target.id) && attempts < 50);

    usedWordIds.add(target.id);
    const qType = types[i % types.length];

    // Pick 3 distractors
    const distractors: WordItem[] = [];
    while (distractors.length < Math.min(3, total - 1)) {
      const idx = Math.floor(Math.random() * total);
      const d = vocabularyList[idx];
      if (d.id !== target.id && !distractors.some(x => x.id === d.id)) {
        distractors.push(d);
      }
    }

    let prompt = '';
    let correctAnswer = '';
    let wrongOptions: string[] = [];
    let explanation = '';

    if (qType === 'meaning') {
      prompt = `What is the meaning of ${target.word}?`;
      correctAnswer = target.meaningEnglish;
      wrongOptions = distractors.map(d => d.meaningEnglish);
      explanation = `${target.word} (${target.pos || ''}) means "${target.meaningEnglish}" (${target.meaningHindi}).`;
    } else if (qType === 'synonym') {
      prompt = `Choose the closest SYNONYM of ${target.word}:`;
      correctAnswer = target.synonyms[0] || target.meaningEnglish;
      wrongOptions = distractors.map(d => d.synonyms[0] || d.meaningEnglish);
      explanation = `Synonyms of ${target.word}: ${target.synonyms.join(', ')}.`;
    } else if (qType === 'antonym') {
      prompt = `Choose the ANTONYM (opposite) of ${target.word}:`;
      correctAnswer = target.antonyms[0] || 'Unrelated';
      wrongOptions = distractors.map(d => d.antonyms[0] || 'Unrelated');
      explanation = `Antonyms of ${target.word}: ${target.antonyms.join(', ')}.`;
    } else {
      // Hindi to English meaning
      prompt = `"${target.meaningHindi}" का सही English word क्या है?`;
      correctAnswer = target.word;
      wrongOptions = distractors.map(d => d.word);
      explanation = `"${target.meaningHindi}" is the Hindi translation for ${target.word} (${target.meaningEnglish}).`;
    }

    // Shuffle options
    const options = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);
    const correctIndex = options.indexOf(correctAnswer);

    questions.push({
      id: i + 1,
      type: qType,
      prompt,
      questionWord: target.word,
      options,
      correctIndex,
      explanation
    });
  }

  return questions;
}
