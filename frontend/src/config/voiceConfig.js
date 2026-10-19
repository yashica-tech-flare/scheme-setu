/**
 * Frontend Voice Configuration for SchemeBridge
 * Authoritative client mapping synchronized with backend/src/config/voiceConfig.json
 * NOTE: Contains ZERO API keys. API keys are strictly backend-only.
 */

export const FROZEN_LANGUAGES = ['en', 'hi', 'ta', 'mr', 'ur'];
export const BROKEN_LANGUAGES = ['te', 'bn', 'gu', 'kn', 'ml', 'pa', 'or', 'as'];

export const LANGUAGE_VOICE_MAP = {
  // Frozen verified languages (ElevenLabs Multilingual v2)
  en: { name: 'English', engine: 'elevenlabs', model: 'eleven_multilingual_v2', status: 'verified' },
  hi: { name: 'Hindi (हिन्दी)', engine: 'elevenlabs', model: 'eleven_multilingual_v2', status: 'verified' },
  ta: { name: 'Tamil (தமிழ்)', engine: 'elevenlabs', model: 'eleven_multilingual_v2', status: 'verified' },
  mr: { name: 'Marathi (मराठी)', engine: 'elevenlabs', model: 'eleven_multilingual_v2', status: 'verified' },
  ur: { name: 'Urdu (اردو)', engine: 'elevenlabs', model: 'eleven_multilingual_v2', status: 'verified' },

  // 8 Target regional languages (ElevenLabs v3 / Sarvam)
  // Status is "unavailable" unless valid audio clips exist or server reports active beta
  te: { name: 'Telugu (తెలుగు)', engine: 'none', model: 'eleven_v3', status: 'unavailable' },
  bn: { name: 'Bengali (বাংলা)', engine: 'none', model: 'eleven_v3', status: 'unavailable' },
  gu: { name: 'Gujarati (ગુજરાતી)', engine: 'none', model: 'eleven_v3', status: 'unavailable' },
  kn: { name: 'Kannada (ಕನ್ನಡ)', engine: 'none', model: 'eleven_v3', status: 'unavailable' },
  ml: { name: 'Malayalam (മലയാളം)', engine: 'none', model: 'eleven_v3', status: 'unavailable' },
  pa: { name: 'Punjabi (ਪੰਜਾਬੀ)', engine: 'none', model: 'eleven_v3', status: 'unavailable' },
  or: { name: 'Odia (ଓଡ଼ିଆ)', engine: 'none', model: 'none', status: 'unavailable' },
  as: { name: 'Assamese (অসমীয়া)', engine: 'none', model: 'eleven_v3', status: 'unavailable' },

  // Dialects and unsupported languages
  bho: { name: 'Bhojpuri', engine: 'none', model: 'none', status: 'unavailable' },
  raj: { name: 'Rajasthani', engine: 'none', model: 'none', status: 'unavailable' },
  mag: { name: 'Magahi', engine: 'none', model: 'none', status: 'unavailable' },
  hne: { name: 'Chhattisgarhi', engine: 'none', model: 'none', status: 'unavailable' },
  bgc: { name: 'Haryanvi', engine: 'none', model: 'none', status: 'unavailable' }
};

/**
 * Normalises language input (e.g., 'te-IN' -> 'te', 'en-US' -> 'en').
 * Returns null for unsupported language codes.
 * @param {string} lang
 * @returns {string|null}
 */
export function normaliseVoiceLang(lang) {
  if (!lang || typeof lang !== 'string') return null;
  const clean = lang.trim().toLowerCase().split(/[-_]/)[0];
  if (LANGUAGE_VOICE_MAP[clean]) {
    return clean;
  }
  return null;
}

/**
 * Checks if a language has active voice availability (verified or beta).
 * @param {string} langCode
 * @returns {boolean}
 */
export function isVoiceSupported(langCode) {
  const code = normaliseVoiceLang(langCode);
  if (!code) return false;
  const cfg = LANGUAGE_VOICE_MAP[code];
  return cfg && (cfg.status === 'verified' || cfg.status === 'beta') && cfg.engine !== 'none';
}

/**
 * Returns voice status for a language ('verified' | 'beta' | 'unavailable').
 * @param {string} langCode
 * @returns {string}
 */
export function getVoiceStatus(langCode) {
  const code = normaliseVoiceLang(langCode);
  if (!code) return 'unavailable';
  return LANGUAGE_VOICE_MAP[code]?.status || 'unavailable';
}

export function getVoiceEngine(langCode) {
  const code = normaliseVoiceLang(langCode);
  return LANGUAGE_VOICE_MAP[code]?.engine || 'none';
}
