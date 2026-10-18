/**
 * SchemeBridge — Hybrid Multilingual Voice Assistant Engine
 * 
 * Playback Order:
 * 1. Pre-generated static clips (frontend/public/audio/<lang>/<clipId>.mp3 via audio-manifest.json)
 * 2. Dynamic runtime synthesis via backend ElevenLabs proxy (POST /api/voice/speak)
 * 3. Client Web Speech API (window.speechSynthesis) with Indic fallback
 * 4. Graceful disabled state for 8 unsupported languages with engine: "none"
 *
 * Lifecycle & Resource Guarantees:
 * - Single HTMLAudioElement singleton across entire session (zero overlapping audio)
 * - Immediate stop & reset on language change
 * - Zero PII transmission
 */

import { api } from '../api/client';
import { isVoiceSupported, getVoiceEngine, DISABLED_VOICE_LANGUAGES } from '../config/voiceConfig';

// BCP-47 Language mapping for browser Web Speech API fallback
export const LANG_VOICE_MAP = {
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
  as: ['as-IN', 'as'],
  bho: ['hi-IN', 'hi'],
  raj: ['hi-IN', 'hi'],
  mag: ['hi-IN', 'hi'],
  hne: ['hi-IN', 'hi'],
  bgc: ['hi-IN', 'hi']
};

// Global audio element singleton
let globalAudio = null;
let currentBlobUrl = null;
let currentPlaybackSource = null; // 'manifest' | 'elevenlabs' | 'browser' | null
let manifestCache = null;
let isManifestLoading = false;

function getGlobalAudio() {
  if (typeof window === 'undefined') return null;
  if (!globalAudio) {
    globalAudio = new Audio();
    globalAudio.preload = 'auto';
  }
  return globalAudio;
}

/**
 * Loads pre-generated audio manifest from public directory.
 */
async function loadAudioManifest() {
  if (manifestCache) return manifestCache;
  if (isManifestLoading) return null;
  isManifestLoading = true;
  try {
    const res = await fetch('/audio/audio-manifest.json');
    if (res.ok) {
      manifestCache = await res.json();
    }
  } catch (e) {
    console.warn('[Voice Assistant] Audio manifest not found, using live proxy.');
  } finally {
    isManifestLoading = false;
  }
  return manifestCache;
}

export const isSpeechSupported = () => {
  return typeof window !== 'undefined' && ('speechSynthesis' in window || 'Audio' in window);
};

/**
 * Checks voice availability for a target language on this device & engine.
 */
export const checkVoiceAvailability = (langCode = 'en') => {
  const code = String(langCode || 'en').toLowerCase().trim();

  // If language is in the explicit unsupported list
  if (DISABLED_VOICE_LANGUAGES.includes(code)) {
    return {
      available: false,
      status: 'disabled',
      engine: 'none',
      message: 'Voice readout is not available in this language'
    };
  }

  // If supported by ElevenLabs
  if (isVoiceSupported(code)) {
    return {
      available: true,
      status: 'elevenlabs',
      engine: 'elevenlabs',
      message: 'High-Fidelity Neural Voice (ElevenLabs Multilingual)'
    };
  }

  // Check browser synthesis voices
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
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
    // Hindi fallback for Indic
    if (code !== 'en') {
      const hi = voices.find(v => v.lang.toLowerCase().startsWith('hi'));
      if (hi) {
        return {
          available: true,
          voice: hi,
          status: 'fallback',
          engine: 'browser',
          message: 'Indic fallback voice (hi-IN)'
        };
      }
    }
  }

  return {
    available: false,
    status: 'unavailable',
    engine: 'none',
    message: 'Voice readout not available in this language on this device'
  };
};

/**
 * Stop currently active speech across all engines (Audio + SpeechSynthesis).
 */
export const stopSpeech = () => {
  if (typeof window === 'undefined') return;

  // 1. Stop HTMLAudioElement
  if (globalAudio) {
    try {
      globalAudio.pause();
      globalAudio.currentTime = 0;
      globalAudio.onended = null;
      globalAudio.onerror = null;
      globalAudio.src = '';
    } catch (_) {}
  }

  // 2. Revoke active blob URL to prevent memory leaks
  if (currentBlobUrl) {
    try {
      URL.revokeObjectURL(currentBlobUrl);
    } catch (_) {}
    currentBlobUrl = null;
  }

  // 3. Cancel browser SpeechSynthesis
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
  }

  currentPlaybackSource = null;
};

/**
 * Browser SpeechSynthesis fallback player
 */
function playViaBrowserSpeech({ text, langCode, onStart, onEnd, onError }) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError(new Error('Speech synthesis not supported'));
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

    const voiceCheck = checkVoiceAvailability(langCode);
    if (voiceCheck.voice) {
      utterance.voice = voiceCheck.voice;
      utterance.lang = voiceCheck.voice.lang;
    } else {
      utterance.lang = LANG_VOICE_MAP[langCode]?.[0] || 'hi-IN';
    }

    currentPlaybackSource = 'browser';
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
 * Hybrid Voice Speak:
 * Pipeline: Manifest Clip -> ElevenLabs Backend Proxy -> Browser SpeechSynthesis -> Disabled
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
  const code = String(langCode || 'en').toLowerCase().trim();

  // 0. Language check: If disabled language, trigger error immediately
  if (DISABLED_VOICE_LANGUAGES.includes(code)) {
    if (onError) {
      onError({
        code: 'unsupported_language',
        message: 'Voice readout is not available in this language'
      });
    }
    if (onEnd) onEnd();
    return;
  }

  // Stop any ongoing playback
  stopSpeech();

  if (onLoading) onLoading(true);

  const audio = getGlobalAudio();

  // 1. Check pre-generated audio manifest
  if (clipId) {
    const manifest = await loadAudioManifest();
    const clipEntry = manifest?.clips?.[clipId]?.[code];
    if (clipEntry && clipEntry.path) {
      try {
        currentPlaybackSource = 'manifest';
        audio.src = clipEntry.path;
        audio.onended = () => {
          currentPlaybackSource = null;
          if (onEnd) onEnd();
        };
        audio.onerror = () => {
          // If manifest clip fails to load (e.g. stub), proceed to next pipeline step
          attemptBackendOrBrowser();
        };

        await audio.play();
        if (onLoading) onLoading(false);
        if (onStart) onStart();
        return;
      } catch (_) {
        // Fall through to live synthesis
      }
    }
  }

  // Helper for Steps 2 & 3
  async function attemptBackendOrBrowser() {
    // 2. Try ElevenLabs Backend Proxy
    if (isVoiceSupported(code)) {
      try {
        const blobUrl = await api.speakText(text, code);
        if (blobUrl) {
          currentBlobUrl = blobUrl;
          currentPlaybackSource = 'elevenlabs';
          audio.src = blobUrl;

          audio.onended = () => {
            currentPlaybackSource = null;
            if (currentBlobUrl) {
              URL.revokeObjectURL(currentBlobUrl);
              currentBlobUrl = null;
            }
            if (onEnd) onEnd();
          };

          audio.onerror = () => {
            if (currentBlobUrl) {
              URL.revokeObjectURL(currentBlobUrl);
              currentBlobUrl = null;
            }
            playViaBrowserSpeech({ text, langCode: code, onStart, onEnd, onError });
          };

          await audio.play();
          if (onLoading) onLoading(false);
          if (onStart) onStart();
          return;
        }
      } catch (err) {
        console.warn('[Voice Assistant] Proxy failed, falling back to browser:', err.message);
      }
    }

    // 3. Browser SpeechSynthesis fallback
    if (onLoading) onLoading(false);
    playViaBrowserSpeech({ text, langCode: code, onStart, onEnd, onError });
  }

  await attemptBackendOrBrowser();
};

/**
 * Returns true if any audio is actively playing or speaking
 */
export const isSpeaking = () => {
  const isAudioPlaying = Boolean(globalAudio && !globalAudio.paused && !globalAudio.ended);
  const isSynthSpeaking = typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;
  return isAudioPlaying || isSynthSpeaking;
};

/**
 * Returns current playback source: 'manifest' | 'elevenlabs' | 'browser' | null
 */
export const getActivePlaybackSource = () => {
  return currentPlaybackSource;
};
