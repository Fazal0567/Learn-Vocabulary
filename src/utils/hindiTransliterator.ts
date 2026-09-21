/**
 * Utility for converting Hinglish (Latin script) to Hindi (Devanagari script)
 * Supports real-time transliteration via Google Input Tools (JSONP) with robust offline phonetic fallback
 * and English-to-Hindi contextual translation.
 */

// Offline phonetic map for basic transliteration fallback
const VOWEL_MAP: Record<string, string> = {
  a: 'अ',
  aa: 'आ',
  i: 'इ',
  ee: 'ई',
  ii: 'ई',
  u: 'उ',
  oo: 'ऊ',
  uu: 'ऊ',
  e: 'ए',
  ai: 'ऐ',
  o: 'ओ',
  au: 'औ',
  an: 'अं',
  ah: 'अः',
};

const MATRA_MAP: Record<string, string> = {
  aa: 'ा',
  a: '',
  i: 'ि',
  ee: 'ी',
  ii: 'ी',
  u: 'ु',
  oo: 'ू',
  uu: 'ू',
  e: 'े',
  ai: 'ै',
  o: 'ो',
  au: 'ौ',
};

const CONSONANT_MAP: Record<string, string> = {
  k: 'क',
  kh: 'ख',
  g: 'ग',
  gh: 'घ',
  ch: 'च',
  chh: 'छ',
  j: 'ज',
  jh: 'झ',
  t: 'ट',
  th: 'ठ',
  d: 'ड',
  dh: 'ढ',
  n: 'न',
  p: 'प',
  ph: 'फ',
  f: 'फ़',
  b: 'ब',
  bh: 'भ',
  m: 'म',
  y: 'य',
  r: 'र',
  l: 'ल',
  v: 'व',
  w: 'व',
  sh: 'श',
  shh: 'ष',
  s: 'स',
  h: 'ह',
  gy: 'ज्ञ',
  tr: 'त्र',
  ksh: 'क्ष',
  z: 'ज़',
};

/**
 * Offline phonetic fallback if network is unreachable
 */
export function offlinePhoneticHinglish(input: string): string {
  if (!input) return '';

  const words = input.split(/(\s+|[.,/!?;:()]+)/);
  return words
    .map((word) => {
      if (/^(\s+|[.,/!?;:()]+)$/.test(word)) return word;

      let lower = word.toLowerCase();
      let result = '';
      let i = 0;

      while (i < lower.length) {
        // Check 3-char consonant clusters
        const threeChar = lower.substring(i, i + 3);
        if (CONSONANT_MAP[threeChar]) {
          const cons = CONSONANT_MAP[threeChar];
          i += 3;
          // check following vowel/matra
          const matraTwo = lower.substring(i, i + 2);
          if (MATRA_MAP[matraTwo] !== undefined) {
            result += cons + MATRA_MAP[matraTwo];
            i += 2;
          } else if (MATRA_MAP[lower[i]] !== undefined) {
            result += cons + MATRA_MAP[lower[i]];
            i += 1;
          } else {
            result += cons;
          }
          continue;
        }

        // Check 2-char consonant clusters
        const twoChar = lower.substring(i, i + 2);
        if (CONSONANT_MAP[twoChar]) {
          const cons = CONSONANT_MAP[twoChar];
          i += 2;
          const matraTwo = lower.substring(i, i + 2);
          if (MATRA_MAP[matraTwo] !== undefined) {
            result += cons + MATRA_MAP[matraTwo];
            i += 2;
          } else if (MATRA_MAP[lower[i]] !== undefined) {
            result += cons + MATRA_MAP[lower[i]];
            i += 1;
          } else {
            result += cons;
          }
          continue;
        }

        // Check 1-char consonant
        const oneChar = lower[i];
        if (CONSONANT_MAP[oneChar]) {
          const cons = CONSONANT_MAP[oneChar];
          i += 1;
          const matraTwo = lower.substring(i, i + 2);
          if (MATRA_MAP[matraTwo] !== undefined) {
            result += cons + MATRA_MAP[matraTwo];
            i += 2;
          } else if (MATRA_MAP[lower[i]] !== undefined) {
            result += cons + MATRA_MAP[lower[i]];
            i += 1;
          } else {
            result += cons;
          }
          continue;
        }

        // Check independent vowels
        const vowelTwo = lower.substring(i, i + 2);
        if (VOWEL_MAP[vowelTwo]) {
          result += VOWEL_MAP[vowelTwo];
          i += 2;
          continue;
        }
        if (VOWEL_MAP[oneChar]) {
          result += VOWEL_MAP[oneChar];
          i += 1;
          continue;
        }

        // Any other character
        result += word[i];
        i += 1;
      }

      return result || word;
    })
    .join('');
}

/**
 * Transliterates Hinglish text to Hindi using Google Input Tools API via JSONP
 * Guaranteed to bypass CORS issues on all browsers and environments.
 */
export function transliterateHinglishToHindi(text: string): Promise<string> {
  return new Promise((resolve) => {
    const trimmed = text.trim();
    if (!trimmed) {
      resolve(text);
      return;
    }

    // If string is already predominantly Devanagari Hindi, return as is
    const hindiCharCount = (trimmed.match(/[\u0900-\u097F]/g) || []).length;
    const latinCharCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
    if (latinCharCount === 0 && hindiCharCount > 0) {
      resolve(text);
      return;
    }

    const callbackName = 'googleInputToolsCallback_' + Math.floor(Math.random() * 10000000);
    const script = document.createElement('script');
    script.src = `https://inputtools.google.com/request?text=${encodeURIComponent(
      trimmed
    )}&itc=hi-t-i0-und&num=1&cb=${callbackName}`;

    let completed = false;

    const cleanup = () => {
      try {
        delete (window as unknown as Record<string, unknown>)[callbackName];
      } catch {
        // ignore
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    const timeout = setTimeout(() => {
      if (!completed) {
        completed = true;
        cleanup();
        resolve(offlinePhoneticHinglish(text));
      }
    }, 2800);

    (window as unknown as Record<string, (data: unknown) => void>)[callbackName] = (data: unknown) => {
      if (!completed) {
        completed = true;
        clearTimeout(timeout);
        cleanup();
        try {
          // Format: ["SUCCESS",[["query",["हिंदी"],[],...]]]
          const payload = data as [string, [string, string[]][]];
          if (
            payload &&
            payload[0] === 'SUCCESS' &&
            Array.isArray(payload[1]) &&
            payload[1].length > 0 &&
            Array.isArray(payload[1][0][1]) &&
            payload[1][0][1].length > 0
          ) {
            resolve(payload[1][0][1][0]);
          } else {
            resolve(offlinePhoneticHinglish(text));
          }
        } catch {
          resolve(offlinePhoneticHinglish(text));
        }
      }
    };

    script.onerror = () => {
      if (!completed) {
        completed = true;
        clearTimeout(timeout);
        cleanup();
        resolve(offlinePhoneticHinglish(text));
      }
    };

    document.head.appendChild(script);
  });
}

/**
 * Translates an English word or definition directly to Hindi using MyMemory Translation API
 */
export async function translateEnglishToHindi(englishText: string): Promise<string> {
  const clean = englishText.trim();
  if (!clean) return '';

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|hi`
    );
    if (!res.ok) throw new Error('Translation failed');
    const data = await res.json();
    if (data?.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
  } catch (err) {
    console.warn('English to Hindi translation fallback:', err);
  }

  // If translation fails, try transliterating
  return transliterateHinglishToHindi(clean);
}
