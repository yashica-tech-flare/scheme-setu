/**
 * SchemeBridge — Server-Side Voice Configuration (Single Source of Truth)
 * 
 * Rules:
 * - en, hi, ta, mr, ur: FROZEN in ElevenLabs Multilingual v2 with verified status.
 * - te, bn, gu, kn, ml, pa, as: Configured for ElevenLabs eleven_v3. Status is "beta" when clips exist, or "unavailable" if quota exhausted.
 * - or: Not supported by eleven_v3; status "unavailable" unless SARVAM_API_KEY is configured.
 * - Zero API keys are ever stored in this file or returned to the client.
 */

const fs = require('fs');
const path = require('path');

const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true
};

const DEFAULT_MODEL = 'eleven_multilingual_v2';
const DEFAULT_FEMALE_VOICE = 'EXAVITQu4vr4xnSDxMaL'; // Sarah
const DEFAULT_MALE_VOICE = 'IKne3meq5aSn9XLyUdCD';   // Charlie

const FROZEN_LANGUAGES = ['en', 'hi', 'ta', 'mr', 'ur'];
const BROKEN_LANGUAGES = ['te', 'bn', 'gu', 'kn', 'ml', 'pa', 'or', 'as'];

// Load authoritative configuration from voiceConfig.json
const rawConfig = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, './voiceConfig.json'), 'utf8')
);

// Format into runtime LANGUAGE_CONFIG with backward compatibility fields
const LANGUAGE_CONFIG = {};

for (const [code, cfg] of Object.entries(rawConfig)) {
  const engine = cfg.provider === 'elevenlabs' ? 'elevenlabs' : (cfg.provider === 'sarvam' ? 'sarvam' : 'none');
  LANGUAGE_CONFIG[code] = {
    ...cfg,
    engine,
    modelId: cfg.model,
    quality: cfg.status,
    settings: VOICE_SETTINGS
  };
}

// 8 explicitly unsupported dialect/classical languages
const UNSUPPORTED_CODES = ['sa', 'ks', 'kok', 'brx', 'sat', 'mai', 'doi', 'mni', 'lus', 'kha', 'gon', 'tcy', 'sd', 'ne', 'bho', 'raj', 'mag', 'hne', 'bgc'];
for (const code of UNSUPPORTED_CODES) {
  if (!LANGUAGE_CONFIG[code]) {
    LANGUAGE_CONFIG[code] = {
      name: code,
      provider: 'none',
      model: 'none',
      modelId: 'none',
      voiceId: '',
      languageCode: code,
      status: 'unavailable',
      engine: 'none',
      quality: 'unsupported',
      reason: 'Voice readout is not available in this language yet.'
    };
  }
}

/**
 * Returns voice configuration for a given language code.
 * @param {string} langCode
 * @returns {Object}
 */
function getVoiceConfig(langCode = 'en') {
  if (!langCode || typeof langCode !== 'string') {
    return LANGUAGE_CONFIG['en'];
  }
  const code = langCode.trim().toLowerCase().split(/[-_]/)[0];
  return LANGUAGE_CONFIG[code] || {
    name: 'Unknown',
    provider: 'none',
    model: 'none',
    modelId: 'none',
    voiceId: '',
    languageCode: code,
    status: 'unavailable',
    engine: 'none',
    quality: 'unsupported',
    reason: 'Voice readout is not available in this language yet.'
  };
}

/**
 * Checks if a language is supported for active voice readout.
 * Only returns true for verified or beta languages with an active engine.
 * @param {string} langCode
 * @returns {boolean}
 */
function isVoiceSupported(langCode) {
  const config = getVoiceConfig(langCode);
  return (config.status === 'verified' || config.status === 'beta') && config.engine !== 'none';
}

module.exports = {
  rawConfig,
  LANGUAGE_CONFIG,
  DEFAULT_MODEL,
  VOICE_SETTINGS,
  FROZEN_LANGUAGES,
  BROKEN_LANGUAGES,
  getVoiceConfig,
  isVoiceSupported
};
