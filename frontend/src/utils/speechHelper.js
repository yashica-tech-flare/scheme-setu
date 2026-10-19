/**
 * SchemeBridge — Resilient Multilingual Voice Assistant Engine
 * 
 * Strict Golden Rule:
 * For the selected language, the voice must speak THAT language, in THAT script's words,
 * or it must say nothing and show "Voice is not available in this language yet".
 * Never fall back to English/Hindi audio or browser speechSynthesis for the 8 regional languages.
 * 
 * Pipeline:
 * 1. Pre-generated static clips (frontend/public/audio/<lang>/<clipId>.mp3 via audio-manifest.json)
 *    - Strictly checks sizeBytes >= 2048 and audio duration >= 0.5s.
 * 2. Dynamic runtime synthesis via backend proxy (POST /api/voice/speak)
 * 3. Browser speechSynthesis ONLY for frozen languages (en, hi) when requested and available.
 *    - Strictly BLOCKED for te, bn, gu, kn, ml, pa, or, as.
 * 4. Debug Mode: ?voicedebug=1
 */

import { api } from '../api/client';
import {
  normaliseVoiceLang,
  isVoiceSupported,
  getVoiceStatus,
  FROZEN_LANGUAGES,
  BROKEN_LANGUAGES,
  LANGUAGE_VOICE_MAP
} from '../config/voiceConfig';

// BCP-47 Language mapping for browser Web Speech API fallback (frozen English/Hindi only)
export const LANG_VOICE_MAP = {
  en: ['en-IN', 'en-GB', 'en-US', 'en'],
  hi: ['hi-IN', 'hi'],
  ta: ['ta-IN', 'ta'],
  mr: ['mr-IN', 'mr'],
  ur: ['ur-IN', 'ur']
};

// Global audio element singleton across entire app session
let globalAudio = null;
let currentBlobUrl = null;
let currentPlaybackSource = null; // 'manifest' | 'elevenlabs' | 'browser' | null
let manifestCache = null;
let isManifestLoading = false;

// Last debug metrics for ?voicedebug=1 inspection
let lastVoiceDebugInfo = {
  i18nLang: 'en',
  normLang: 'en',
  clipUrlOrBody: 'idle',
  text40: '',
  serverVoice: 'none'
};

export const getLastVoiceDebugInfo = () => lastVoiceDebugInfo;

function getQueryParams() {
  if (typeof window === 'undefined') return { isVoiceDebug: false, isNoFallback: false };
  const params = new URLSearchParams(window.location.search);
  return {
    isVoiceDebug: params.get('voicedebug') === '1',
    isNoFallback: params.get('nofallback') === '1'
  };
}

function debugLog(...args) {
  const { isVoiceDebug } = getQueryParams();
  if (isVoiceDebug) {
    console.info('[VoiceDebug]', ...args);
  }
}

function getGlobalAudio() {
  if (typeof window === 'undefined') return null;
  if (!globalAudio) {
    globalAudio = new Audio();
    globalAudio.preload = 'auto';
  }
  return globalAudio;
}

/**
 * Loads pre-generated audio manifest from public directory with no-cache header.
 */
async function loadAudioManifest() {
  if (manifestCache) return manifestCache;
  if (isManifestLoading) return null;
  isManifestLoading = true;
  try {
    const res = await fetch('/audio/audio-manifest.json', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.clips) {
        manifestCache = data;
        debugLog('Loaded audio manifest with clips:', Object.keys(data.clips));
      }
    }
  } catch (e) {
    debugLog('Audio manifest fetch failed:', e.message);
  } finally {
    isManifestLoading = false;
  }
  return manifestCache;
}

export const isSpeechSupported = () => {
  return typeof window !== 'undefined' && ('speechSynthesis' in window || 'Audio' in window);
};

/**
 * Checks voice availability for a target language.
 */
export const checkVoiceAvailability = (langCode = 'en') => {
  const code = normaliseVoiceLang(langCode);

  if (!code) {
    return {
      available: false,
      status: 'unavailable',
      engine: 'none',
      message: 'Voice is not available in this language yet'
    };
  }

  const voiceStatus = getVoiceStatus(code);

  // If status is unavailable
  if (voiceStatus === 'unavailable') {
    return {
      available: false,
      status: 'unavailable',
      engine: 'none',
      message: 'Voice is not available in this language yet'
    };
  }

  // If verified or beta
  if (voiceStatus === 'verified' || voiceStatus === 'beta') {
    const langEntry = LANGUAGE_VOICE_MAP[code] || {};
    return {
      available: true,
      status: voiceStatus,
      engine: langEntry.engine || (voiceStatus === 'beta' ? 'sarvam' : 'elevenlabs'),
      model: langEntry.model || (voiceStatus === 'beta' ? 'bulbul:v3' : 'eleven_multilingual_v2'),
      speaker: langEntry.speaker || (voiceStatus === 'beta' ? 'shubh' : 'Sarah'),
      message: voiceStatus === 'beta'
        ? 'Sarvam Bulbul v3 Neural Voice (Beta)'
        : 'High-Fidelity Neural Voice (Verified)'
    };
  }

  // Device voice check strictly for frozen en/hi
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && FROZEN_LANGUAGES.includes(code)) {
    const voices = window.speechSynthesis.getVoices() || [];
    const targetCodes = LANG_VOICE_MAP[code] || ['en-IN', 'en-US'];
    for (const c of targetCodes) {
      const match = voices.find(v => v.lang.toLowerCase() === c.toLowerCase());
      if (match) {
        return {
          available: true,
          voice: match,
          status: 'exact',
          engine: 'browser',
          message: `Device voice: ${match.name}`
        };
      }
    }
  }

  return {
    available: false,
    status: 'unavailable',
    engine: 'none',
    message: 'Voice is not available in this language yet'
  };
};

/**
 * Stop currently active speech across all engines (Audio + SpeechSynthesis).
 */
export const stopSpeech = () => {
  if (typeof window === 'undefined') return;

  if (globalAudio) {
    try {
      globalAudio.pause();
      globalAudio.currentTime = 0;
      globalAudio.onended = null;
      globalAudio.onerror = null;
      globalAudio.src = '';
    } catch (_) {}
  }

  if (currentBlobUrl) {
    try {
      URL.revokeObjectURL(currentBlobUrl);
    } catch (_) {}
    currentBlobUrl = null;
  }

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
  }

  currentPlaybackSource = null;
};

/**
 * Browser SpeechSynthesis player — ONLY for frozen languages (en/hi).
 */
function playViaBrowserSpeech({ text, langCode, onStart, onEnd, onError }) {
  const code = normaliseVoiceLang(langCode);

  // Enforce Golden Rule
  if (BROKEN_LANGUAGES.includes(code)) {
    if (onError) onError(new Error('Voice is not available in this language yet'));
    if (onEnd) onEnd();
    return;
  }

  const { isNoFallback } = getQueryParams();
  if (isNoFallback) {
    debugLog('Browser speech skipped because &nofallback=1 is active.');
    if (onError) onError(new Error('Browser fallback disabled via &nofallback=1'));
    if (onEnd) onEnd();
    return;
  }

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError(new Error('Speech synthesis not supported on this device'));
    if (onEnd) onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/[*_#`[\]()]/g, ' ')
      .replace(/₹\s*([\d,]+)/g, '$1 rupees')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.88;
    utterance.pitch = 1.0;

    const voiceCheck = checkVoiceAvailability(code);
    if (voiceCheck.voice) {
      utterance.voice = voiceCheck.voice;
      utterance.lang = voiceCheck.voice.lang;
    } else {
      utterance.lang = LANG_VOICE_MAP[code]?.[0] || 'en-IN';
    }

    currentPlaybackSource = 'browser';
    debugLog(`Speaking via browser SpeechSynthesis (${utterance.lang})`);

    if (onStart) utterance.onstart = onStart;
    utterance.onend = () => {
      currentPlaybackSource = null;
      if (onEnd) onEnd();
    };
    utterance.onerror = (e) => {
      currentPlaybackSource = null;
      if (e.error !== 'canceled' && onError) {
        onError(e);
      }
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    currentPlaybackSource = null;
    if (onError) onError(err);
    if (onEnd) onEnd();
  }
}

/**
 * Hybrid Voice Speak Pipeline:
 * Manifest Clip -> ElevenLabs/Sarvam Backend Proxy -> Browser SpeechSynthesis (Frozen only) -> Visible Notice
 */
export const speak = async ({
  text,
  clipId,
  langCode = 'en',
  onStart,
  onEnd,
  onError,
  onLoading
}) => {
  const rawLang = String(langCode || 'en');
  const code = normaliseVoiceLang(rawLang);

  lastVoiceDebugInfo = {
    i18nLang: rawLang,
    normLang: code || 'unsupported',
    clipUrlOrBody: clipId ? `/audio/${code}/${clipId}.mp3` : `POST /api/voice/speak { lang: ${code} }`,
    text40: (text || '').slice(0, 40),
    serverVoice: 'pending'
  };

  debugLog(`speak() requested for [${code}] (raw: ${rawLang}) clipId: ${clipId || 'none'}, text length: ${text?.length || 0}`);

  // Stop any ongoing playback immediately (prevents overlapping)
  stopSpeech();

  if (!code) {
    if (onError) {
      onError({
        code: 'voice_unavailable',
        message: 'Voice is not available in this language yet'
      });
    }
    if (onEnd) onEnd();
    return;
  }

  if (onLoading) onLoading(true);

  const audio = getGlobalAudio();
  if (audio) {
    try {
      audio.load();
    } catch (_) {}
  }

  // 1. Pipeline Stage 1: Pre-generated Audio Manifest Clip
  if (clipId) {
    const manifest = await loadAudioManifest();
    const clipEntry = manifest?.clips?.[clipId]?.[code];

    if (clipEntry && clipEntry.path && clipEntry.sizeBytes >= 2048) {
      debugLog(`Attempting manifest clip: ${clipEntry.path} (${clipEntry.sizeBytes} bytes)`);
      try {
        currentPlaybackSource = 'clip';
        lastVoiceDebugInfo.clipUrlOrBody = clipEntry.path;
        lastVoiceDebugInfo.serverVoice = `${clipEntry.modelId || 'manifest'} / ${clipEntry.voiceId || 'clip'}`;

        audio.src = clipEntry.path;

        const playPromise = new Promise((resolve, reject) => {
          audio.onloadedmetadata = () => {
            if (audio.duration > 0 && audio.duration < 0.5) {
              debugLog(`Manifest clip duration too short (${audio.duration}s); rejecting stub.`);
              return reject(new Error('Audio clip duration too short'));
            }
          };

          audio.onended = () => {
            currentPlaybackSource = null;
            if (onEnd) onEnd();
          };

          audio.onerror = (e) => {
            debugLog('Audio element error during manifest clip playback:', e);
            reject(new Error('Manifest audio playback error'));
          };

          audio.play()
            .then(() => {
              debugLog(`Playing manifest clip successfully (${clipEntry.path})`);
              if (onLoading) onLoading(false);
              if (onStart) onStart();
              resolve(true);
            })
            .catch(err => reject(err));
        });

        await playPromise;
        return;
      } catch (manifestErr) {
        debugLog('Manifest playback failed, falling over to live proxy:', manifestErr.message);
      }
    }
  }

  // 2. Pipeline Stage 2: Backend Voice Proxy (POST /api/voice/speak)
  if (isVoiceSupported(code)) {
    debugLog(`Calling live backend voice proxy POST /api/voice/speak for [${code}]...`);
    try {
      const result = await api.speakText(text, code);
      if (result && result.blobUrl) {
        currentBlobUrl = result.blobUrl;
        currentPlaybackSource = 'proxy';
        lastVoiceDebugInfo.serverVoice = `${result.headers['x-voice-provider'] || 'sarvam'} / ${result.headers['x-voice-model'] || 'bulbul:v3'}`;

        audio.src = result.blobUrl;

        const proxyPlayPromise = new Promise((resolve, reject) => {
          audio.onended = () => {
            currentPlaybackSource = null;
            if (currentBlobUrl) {
              URL.revokeObjectURL(currentBlobUrl);
              currentBlobUrl = null;
            }
            if (onEnd) onEnd();
          };

          audio.onerror = (e) => {
            if (currentBlobUrl) {
              URL.revokeObjectURL(currentBlobUrl);
              currentBlobUrl = null;
            }
            reject(new Error('Audio element error playing proxy stream'));
          };

          audio.play()
            .then(() => {
              debugLog(`Playing live proxy audio stream successfully (${result.sizeBytes} bytes)`);
              if (onLoading) onLoading(false);
              if (onStart) onStart();
              resolve(true);
            })
            .catch(err => reject(err));
        });

        await proxyPlayPromise;
        return;
      }
    } catch (err) {
      debugLog('Backend proxy synthesis failed:', err.code || err.message);
    }
  }

  // 3. Pipeline Stage 3: Browser Fallback (STRICTLY BLOCKED FOR 8 REGIONAL LANGUAGES)
  if (BROKEN_LANGUAGES.includes(code)) {
    debugLog(`Golden Rule enforced: Browser fallback blocked for [${code}].`);
    if (onLoading) onLoading(false);
    if (onError) {
      onError({
        code: 'voice_unavailable',
        message: 'Voice is not available in this language yet'
      });
    }
    if (onEnd) onEnd();
    return;
  }

  // For frozen languages (en, hi) ONLY
  const { isNoFallback } = getQueryParams();
  if (!isNoFallback) {
    const browserCheck = checkVoiceAvailability(code);
    if (browserCheck.available && browserCheck.engine === 'browser') {
      debugLog('Attempting browser speech synthesis fallback for frozen language...');
      if (onLoading) onLoading(false);
      playViaBrowserSpeech({ text, langCode: code, onStart, onEnd, onError });
      return;
    }
  }

  // 4. Pipeline Stage 4: Visible Failure Notice
  debugLog(`All voice pipelines exhausted for [${code}].`);
  if (onLoading) onLoading(false);
  if (onError) {
    onError({
      code: 'voice_unavailable',
      message: 'Voice is not available in this language yet'
    });
  }
  if (onEnd) onEnd();
};

export const isSpeaking = () => {
  const isAudioPlaying = Boolean(globalAudio && !globalAudio.paused && !globalAudio.ended);
  const isSynthSpeaking = typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;
  return isAudioPlaying || isSynthSpeaking;
};

export const getActivePlaybackSource = () => {
  return currentPlaybackSource;
};
