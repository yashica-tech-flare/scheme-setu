/**
 * Frontend Voice Configuration for ElevenLabs Multilingual Voice Assistant
 * 13 Indian languages supported via ElevenLabs; 8 unsupported languages disabled with engine: "none".
 * NOTE: Contains ZERO API keys. API keys are strictly backend-only.
 */

export const SUPPORTED_VOICE_LANGUAGES = [
  'en', 'hi', 'ta', 'te', 'bn', 'mr', 'ur', 'gu', 'kn', 'ml', 'pa', 'or', 'as',
  'bho', 'raj', 'mag', 'hne', 'bgc'
];

export const DISABLED_VOICE_LANGUAGES = [
  'sa', 'ks', 'kok', 'brx', 'sat', 'mai', 'doi', 'mni', 'lus', 'kha', 'gon', 'tcy', 'sd', 'ne'
];

export const LANGUAGE_VOICE_MAP = {
  en: { name: 'English', engine: 'elevenlabs', quality: 'verified' },
  hi: { name: 'Hindi (हिन्दी)', engine: 'elevenlabs', quality: 'verified' },
  ta: { name: 'Tamil (தமிழ்)', engine: 'elevenlabs', quality: 'verified' },
  te: { name: 'Telugu (తెలుగు)', engine: 'elevenlabs', quality: 'verified' },
  bn: { name: 'Bengali (বাংলা)', engine: 'elevenlabs', quality: 'verified' },
  mr: { name: 'Marathi (मराठी)', engine: 'elevenlabs', quality: 'verified' },
  ur: { name: 'Urdu (اردو)', engine: 'elevenlabs', quality: 'verified' },
  gu: { name: 'Gujarati (ગુજરાતી)', engine: 'elevenlabs', quality: 'verified' },
  kn: { name: 'Kannada (ಕನ್ನಡ)', engine: 'elevenlabs', quality: 'verified' },
  ml: { name: 'Malayalam (മലയാളം)', engine: 'elevenlabs', quality: 'verified' },
  pa: { name: 'Punjabi (ਪੰਜਾਬੀ)', engine: 'elevenlabs', quality: 'verified' },
  or: { name: 'Odia (ଓଡ଼ିଆ)', engine: 'elevenlabs', quality: 'verified' },
  as: { name: 'Assamese (অসমীয়া)', engine: 'elevenlabs', quality: 'verified' },

  bho: { name: 'Bhojpuri (भोजपुरी)', engine: 'elevenlabs', quality: 'verified' },
  raj: { name: 'Rajasthani (राजस्थानी)', engine: 'elevenlabs', quality: 'verified' },
  mag: { name: 'Magahi (मगही)', engine: 'elevenlabs', quality: 'verified' },
  hne: { name: 'Chhattisgarhi (छत्तीसगढ़ी)', engine: 'elevenlabs', quality: 'verified' },
  bgc: { name: 'Haryanvi (हरियाणवी)', engine: 'elevenlabs', quality: 'verified' },

  sa: { name: 'Sanskrit', engine: 'none', quality: 'unsupported' },
  ks: { name: 'Kashmiri', engine: 'none', quality: 'unsupported' },
  kok: { name: 'Konkani', engine: 'none', quality: 'unsupported' },
  brx: { name: 'Bodo', engine: 'none', quality: 'unsupported' },
  sat: { name: 'Santali', engine: 'none', quality: 'unsupported' },
  mai: { name: 'Maithili', engine: 'none', quality: 'unsupported' },
  doi: { name: 'Dogri', engine: 'none', quality: 'unsupported' },
  mni: { name: 'Manipuri', engine: 'none', quality: 'unsupported' }
};

export function isVoiceSupported(langCode) {
  const code = String(langCode || 'en').toLowerCase().trim();
  const cfg = LANGUAGE_VOICE_MAP[code];
  return cfg && cfg.engine !== 'none';
}

export function getVoiceEngine(langCode) {
  const code = String(langCode || 'en').toLowerCase().trim();
  return LANGUAGE_VOICE_MAP[code]?.engine || 'none';
}
