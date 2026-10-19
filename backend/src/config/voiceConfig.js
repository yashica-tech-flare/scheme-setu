/**
 * Voice Configuration for ElevenLabs Multilingual Voice Assistant
 * Supports 13 official Indian languages via ElevenLabs Multilingual v2 / Flash v2.5 models.
 * Explicitly disables unsupported languages with engine: "none".
 */

const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true
};

const DEFAULT_MODEL = 'eleven_multilingual_v2';

// Verified pre-made voice identifiers on ElevenLabs (accessible on all subscription tiers)
// Sarah (mature, reassuring, confident, multilingual): EXAVITQu4vr4xnSDxMaL
// Charlie (deep, confident, clear, energetic): IKne3meq5aSn9XLyUdCD
// Alice (clear, engaging educator): Xb7hH8MSUJpSbSDYk0k2
const DEFAULT_FEMALE_VOICE = 'EXAVITQu4vr4xnSDxMaL';
const DEFAULT_MALE_VOICE = 'IKne3meq5aSn9XLyUdCD';

const LANGUAGE_CONFIG = {
  // 13 Supported Languages
  en: {
    name: 'English (Indian)',
    engine: 'elevenlabs',
    modelId: DEFAULT_MODEL,
    voiceId: DEFAULT_FEMALE_VOICE,
    quality: 'verified',
    settings: VOICE_SETTINGS
  },
  hi: {
    name: 'Hindi (हिन्दी)',
    engine: 'elevenlabs',
    modelId: DEFAULT_MODEL,
    voiceId: DEFAULT_FEMALE_VOICE,
    quality: 'verified',
    settings: VOICE_SETTINGS
  },
  ta: {
    name: 'Tamil (தமிழ்)',
    engine: 'elevenlabs',
    modelId: DEFAULT_MODEL,
    voiceId: DEFAULT_FEMALE_VOICE,
    quality: 'verified',
    settings: VOICE_SETTINGS
  },
  te: {
    name: 'Telugu (తెలుగు)',
    engine: 'elevenlabs',
    modelId: DEFAULT_MODEL,
    voiceId: DEFAULT_FEMALE_VOICE,
    quality: 'verified',
    settings: VOICE_SETTINGS
  },
  bn: {
    name: 'Bengali (বাংলা)',
    engine: 'elevenlabs',
    modelId: DEFAULT_MODEL,
    voiceId: DEFAULT_FEMALE_VOICE,
    quality: 'verified',
    settings: VOICE_SETTINGS
  },
  mr: {
    name: 'Marathi (मराठी)',
    engine: 'elevenlabs',
    modelId: DEFAULT_MODEL,
    voiceId: DEFAULT_FEMALE_VOICE,
    quality: 'verified',
    settings: VOICE_SETTINGS
  },
  ur: {
    name: 'Urdu (اردو)',
    engine: 'elevenlabs',
    modelId: DEFAULT_MODEL,
    voiceId: DEFAULT_MALE_VOICE,
    quality: 'verified',
    settings: VOICE_SETTINGS
  },
  gu: {
    name: 'Gujarati (ગુજરાતી)',
    engine: 'elevenlabs',
    modelId: DEFAULT_MODEL,
    voiceId: DEFAULT_FEMALE_VOICE,
    quality: 'verified',
    settings: VOICE_SETTINGS
  },
  kn: {
    name: 'Kannada (ಕನ್ನಡ)',
    engine: 'elevenlabs',
    modelId: DEFAULT_MODEL,
    voiceId: DEFAULT_FEMALE_VOICE,
    quality: 'verified',
    settings: VOICE_SETTINGS
  },
  ml: {
    name: 'Malayalam (മലയാളം)',
    engine: 'elevenlabs',
    modelId: DEFAULT_MODEL,
    voiceId: DEFAULT_FEMALE_VOICE,
    quality: 'verified',
    settings: VOICE_SETTINGS
  },
  pa: {
    name: 'Punjabi (ਪੰਜਾਬੀ)',
    engine: 'elevenlabs',
    modelId: DEFAULT_MODEL,
    voiceId: DEFAULT_FEMALE_VOICE,
    quality: 'verified',
    settings: VOICE_SETTINGS
  },
  or: {
    name: 'Odia (ଓଡ଼ିଆ)',
    engine: 'elevenlabs',
    modelId: DEFAULT_MODEL,
    voiceId: DEFAULT_FEMALE_VOICE,
    quality: 'verified',
    settings: VOICE_SETTINGS
  },
  as: {
    name: 'Assamese (অসমীয়া)',
    engine: 'elevenlabs',
    modelId: DEFAULT_MODEL,
    voiceId: DEFAULT_FEMALE_VOICE,
    quality: 'verified',
    settings: VOICE_SETTINGS
  },

  // Regional Hindi-belt dialects (route through Hindi ElevenLabs model)
  bho: {
    name: 'Bhojpuri (भोजपुरी)',
    engine: 'elevenlabs',
    modelId: DEFAULT_MODEL,
    voiceId: DEFAULT_FEMALE_VOICE,
    quality: 'verified',
    settings: VOICE_SETTINGS
  },
  raj: {
    name: 'Rajasthani (राजस्थानी)',
    engine: 'elevenlabs',
    modelId: DEFAULT_MODEL,
    voiceId: DEFAULT_FEMALE_VOICE,
    quality: 'verified',
    settings: VOICE_SETTINGS
  },
  mag: {
    name: 'Magahi (मगही)',
    engine: 'elevenlabs',
    modelId: DEFAULT_MODEL,
    voiceId: DEFAULT_FEMALE_VOICE,
    quality: 'verified',
    settings: VOICE_SETTINGS
  },
  hne: {
    name: 'Chhattisgarhi (छत्तीसगढ़ी)',
    engine: 'elevenlabs',
    modelId: DEFAULT_MODEL,
    voiceId: DEFAULT_FEMALE_VOICE,
    quality: 'verified',
    settings: VOICE_SETTINGS
  },
  bgc: {
    name: 'Haryanvi (हरियाणवी)',
    engine: 'elevenlabs',
    modelId: DEFAULT_MODEL,
    voiceId: DEFAULT_FEMALE_VOICE,
    quality: 'verified',
    settings: VOICE_SETTINGS
  },

  // 8 Unsupported Languages: Explicitly disabled with engine: "none"
  sa: {
    name: 'Sanskrit (संस्कृतम्)',
    engine: 'none',
    quality: 'unsupported',
    reason: 'Not supported by ElevenLabs or standard browser speech synthesis.'
  },
  ks: {
    name: 'Kashmiri (कॉशुर / کٲشُر)',
    engine: 'none',
    quality: 'unsupported',
    reason: 'Not supported by ElevenLabs speech synthesis.'
  },
  kok: {
    name: 'Konkani (कोंकणी)',
    engine: 'none',
    quality: 'unsupported',
    reason: 'Not supported by ElevenLabs speech synthesis.'
  },
  brx: {
    name: 'Bodo (बड़ो)',
    engine: 'none',
    quality: 'unsupported',
    reason: 'Not supported by ElevenLabs speech synthesis.'
  },
  sat: {
    name: 'Santali (ᱥᱟᱱᱛᱟᱲᱤ)',
    engine: 'none',
    quality: 'unsupported',
    reason: 'Not supported by ElevenLabs speech synthesis.'
  },
  mai: {
    name: 'Maithili (मैथिली)',
    engine: 'none',
    quality: 'unsupported',
    reason: 'Not supported by ElevenLabs speech synthesis.'
  },
  doi: {
    name: 'Dogri (डोगरी)',
    engine: 'none',
    quality: 'unsupported',
    reason: 'Not supported by ElevenLabs speech synthesis.'
  },
  mni: {
    name: 'Manipuri / Meitei (মৈতৈলোন্)',
    engine: 'none',
    quality: 'unsupported',
    reason: 'Not supported by ElevenLabs speech synthesis.'
  },
  lus: {
    name: 'Mizo (Lushai)',
    engine: 'none',
    quality: 'unsupported',
    reason: 'Not supported by ElevenLabs speech synthesis.'
  },
  kha: {
    name: 'Khasi',
    engine: 'none',
    quality: 'unsupported',
    reason: 'Not supported by ElevenLabs speech synthesis.'
  },
  gon: {
    name: 'Gondi',
    engine: 'none',
    quality: 'unsupported',
    reason: 'Not supported by ElevenLabs speech synthesis.'
  },
  tcy: {
    name: 'Tulu',
    engine: 'none',
    quality: 'unsupported',
    reason: 'Not supported by ElevenLabs speech synthesis.'
  },
  sd: {
    name: 'Sindhi',
    engine: 'none',
    quality: 'unsupported',
    reason: 'Not supported by ElevenLabs speech synthesis.'
  },
  ne: {
    name: 'Nepali',
    engine: 'none',
    quality: 'unsupported',
    reason: 'Not supported by ElevenLabs speech synthesis.'
  }
};

/**
 * Returns voice configuration for a given language code.
 * @param {string} langCode
 * @returns {Object}
 */
function getVoiceConfig(langCode = 'en') {
  const code = String(langCode || 'en').toLowerCase().trim();
  return LANGUAGE_CONFIG[code] || {
    name: 'Unknown',
    engine: 'none',
    quality: 'unsupported',
    reason: 'Unknown language code'
  };
}

/**
 * Checks if a language is supported for voice readout.
 * @param {string} langCode
 * @returns {boolean}
 */
function isVoiceSupported(langCode) {
  const config = getVoiceConfig(langCode);
  return config.engine === 'elevenlabs';
}

module.exports = {
  LANGUAGE_CONFIG,
  DEFAULT_MODEL,
  VOICE_SETTINGS,
  getVoiceConfig,
  isVoiceSupported
};
