/**
 * SchemeBridge — Voice Assistant & Speech Synthesis Utility
 * Designed specifically for illiterate and low-literacy beneficiaries across India.
 * Utilizes Web Speech API (SpeechSynthesis) with tailored rate, pitch, and BCP-47 language matching.
 */

const LANG_VOICE_MAP = {
  // Core & Scheduled
  hi: ['hi-IN', 'hi'],
  en: ['en-IN', 'en-GB', 'en-US'],
  ta: ['ta-IN', 'ta-LK', 'ta'],
  te: ['te-IN', 'te'],
  bn: ['bn-IN', 'bn-BD', 'bn'],
  mr: ['mr-IN', 'mr'],
  gu: ['gu-IN', 'gu'],
  kn: ['kn-IN', 'kn'],
  ml: ['ml-IN', 'ml'],
  pa: ['pa-IN', 'pa'],
  ur: ['ur-IN', 'ur-PK', 'ur'],
  or: ['or-IN', 'od-IN', 'hi-IN'],
  as: ['as-IN', 'bn-IN', 'hi-IN'],
  sa: ['sa-IN', 'hi-IN'],
  kok: ['kok-IN', 'mr-IN', 'hi-IN'],
  mai: ['mai-IN', 'hi-IN'],
  ne: ['ne-NP', 'ne-IN', 'hi-IN'],
  doi: ['doi-IN', 'hi-IN', 'pa-IN'],
  ks: ['ks-IN', 'ur-IN', 'hi-IN'],
  sd: ['sd-IN', 'ur-IN', 'hi-IN'],
  mni: ['mni-IN', 'bn-IN', 'hi-IN'],
  brx: ['brx-IN', 'as-IN', 'hi-IN'],
  sat: ['sat-IN', 'or-IN', 'hi-IN'],

  // Grassroots Regional Mother Tongues (Spoken dialects)
  // Synthesized using clear Hindi or Regional Indian English phonetic engines
  bho: ['hi-IN', 'hi'],
  raj: ['hi-IN', 'hi'],
  hne: ['hi-IN', 'hi'],
  bgc: ['hi-IN', 'hi'],
  mag: ['hi-IN', 'hi'],
  tcy: ['kn-IN', 'kn', 'hi-IN'],
  lus: ['en-IN', 'en-GB', 'hi-IN'],
  kha: ['en-IN', 'en-GB', 'hi-IN'],
  gon: ['hi-IN', 'mr-IN', 'hi']
};

export const isSpeechSupported = () => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

/**
 * Finds the best available SpeechSynthesisVoice for a given app language code
 */
export const findBestVoice = (langCode) => {
  if (!isSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const targetCodes = LANG_VOICE_MAP[langCode] || ['hi-IN', 'en-IN'];

  for (const code of targetCodes) {
    const directMatch = voices.find(v => v.lang.toLowerCase() === code.toLowerCase());
    if (directMatch) return directMatch;
  }

  for (const code of targetCodes) {
    const prefix = code.split('-')[0].toLowerCase();
    const prefixMatch = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
    if (prefixMatch) return prefixMatch;
  }

  // Fallback to any Indian accent voice or default
  const indianVoice = voices.find(v => v.lang.toLowerCase().includes('-in'));
  return indianVoice || voices[0] || null;
};

/**
 * Speak text with clear, steady pacing for illiterate / rural listeners
 */
export const speak = ({
  text,
  langCode = 'hi',
  rate = 0.88,
  pitch = 1.0,
  onStart,
  onEnd,
  onError
}) => {
  if (!isSpeechSupported() || !text) {
    if (onError) onError(new Error('Speech synthesis not supported or empty text'));
    return;
  }

  try {
    // Cancel any previous speech
    window.speechSynthesis.cancel();

    // Clean up text of markdown/brackets
    const cleanText = text
      .replace(/[*_#`[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate; // Gentle, slower speed for comprehension
    utterance.pitch = pitch;

    const voice = findBestVoice(langCode);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      const preferredTag = LANG_VOICE_MAP[langCode]?.[0] || 'hi-IN';
      utterance.lang = preferredTag;
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    utterance.onerror = (e) => {
      // Ignore user-initiated cancellation
      if (e.error !== 'canceled' && onError) {
        onError(e);
      }
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Speech synthesis error:', err);
    if (onError) onError(err);
    if (onEnd) onEnd();
  }
};

/**
 * Stop currently active speech
 */
export const stopSpeech = () => {
  if (isSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
};

/**
 * Check if browser is currently actively speaking
 */
export const isSpeaking = () => {
  return isSpeechSupported() && window.speechSynthesis.speaking;
};
