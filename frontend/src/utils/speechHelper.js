/**
 * SchemeBridge — Voice Assistant & Speech Synthesis Utility
 * Designed specifically for illiterate and low-literacy beneficiaries across India.
 * Utilizes Web Speech API (SpeechSynthesis) with tailored rate, pitch, and BCP-47 language matching.
 */

export const LANG_VOICE_MAP = {
  // 13 Verified Constitutional Languages
  en: ['en-IN', 'en-GB', 'en-US', 'en'],
  hi: ['hi-IN', 'hi'],
  ta: ['ta-IN', 'ta-LK', 'ta'],
  te: ['te-IN', 'te'],
  bn: ['bn-IN', 'bn-BD', 'bn'],
  mr: ['mr-IN', 'mr'],
  ur: ['ur-IN', 'ur-PK', 'ur'],
  gu: ['gu-IN', 'gu'],
  kn: ['kn-IN', 'kn'],
  ml: ['ml-IN', 'ml'],
  pa: ['pa-IN', 'pa'],
  or: ['or-IN', 'od-IN', 'or'],
  as: ['as-IN', 'as']
};

export const isSpeechSupported = () => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

/**
 * Checks voice availability for a target language on the user's specific device/OS.
 * Provides explicit degradation:
 * 1. Exact locale match (e.g. ta-IN)
 * 2. Close regional variant (e.g. ur-PK for ur-IN)
 * 3. Pan-India fallback (hi-IN) if acceptable for Indic dialects
 * 4. Graceful unavailable state (disables button with clear device limitation message)
 */
export const checkVoiceAvailability = (langCode = 'en') => {
  if (!isSpeechSupported()) {
    return {
      available: false,
      voice: null,
      status: 'unsupported',
      isFallback: false,
      message: 'Browser does not support Web Speech API'
    };
  }

  const voices = window.speechSynthesis.getVoices() || [];
  if (voices.length === 0) {
    // Voices might load asynchronously; caller should retry on onvoiceschanged
    return {
      available: false,
      voice: null,
      status: 'loading',
      isFallback: false,
      message: 'Loading system voices...'
    };
  }

  const targetCodes = LANG_VOICE_MAP[langCode] || ['en-IN', 'en-US'];

  // 1. Exact BCP-47 match
  for (const code of targetCodes) {
    const directMatch = voices.find(v => v.lang.toLowerCase() === code.toLowerCase());
    if (directMatch) {
      return {
        available: true,
        voice: directMatch,
        status: 'exact',
        isFallback: false,
        message: `Native ${directMatch.name} (${directMatch.lang})`
      };
    }
  }

  // 2. Prefix / language family match
  for (const code of targetCodes) {
    const prefix = code.split('-')[0].toLowerCase();
    const prefixMatch = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
    if (prefixMatch) {
      return {
        available: true,
        voice: prefixMatch,
        status: 'variant',
        isFallback: false,
        message: `Regional variant ${prefixMatch.name} (${prefixMatch.lang})`
      };
    }
  }

  // 3. Pan-India Indic fallback: Hindi is the most broadly available Indic TTS engine on Android/Windows
  if (langCode !== 'en') {
    const hindiVoice = voices.find(v => v.lang.toLowerCase().startsWith('hi'));
    if (hindiVoice) {
      return {
        available: true,
        voice: hindiVoice,
        status: 'fallback',
        isFallback: true,
        message: `Closest available Indic voice: ${hindiVoice.name} (hi-IN fallback)`
      };
    }
  }

  // 4. Any English voice for English requests
  if (langCode === 'en') {
    const anyEn = voices.find(v => v.lang.toLowerCase().startsWith('en'));
    if (anyEn) {
      return {
        available: true,
        voice: anyEn,
        status: 'variant',
        isFallback: false,
        message: `English voice: ${anyEn.name}`
      };
    }
  }

  // 5. Unavailable on device
  return {
    available: false,
    voice: null,
    status: 'unavailable',
    isFallback: false,
    message: 'Voice not available in this language on your device'
  };
};

/**
 * Finds the best available SpeechSynthesisVoice for a given app language code
 */
export const findBestVoice = (langCode) => {
  const result = checkVoiceAvailability(langCode);
  return result.voice || null;
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
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean up text of markdown/brackets/bullets
    const cleanText = text
      .replace(/[*_#`[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate; // Gentle, slower speed for high auditory comprehension
    utterance.pitch = pitch;

    const voiceCheck = checkVoiceAvailability(langCode);
    if (voiceCheck.voice) {
      utterance.voice = voiceCheck.voice;
      utterance.lang = voiceCheck.voice.lang;
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
