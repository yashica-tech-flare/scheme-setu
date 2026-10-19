/**
 * SchemeBridge — Resilient Multilingual Voice Assistant Engine
 * 
 * Strict Pipeline:
 * 1. Pre-generated static clips (frontend/public/audio/<lang>/<clipId>.mp3 via audio-manifest.json)
 *    - Never trusts stubs: strictly checks sizeBytes >= 2048 and audio duration >= 0.5s.
 * 2. Dynamic runtime synthesis via backend ElevenLabs proxy (POST /api/voice/speak)
 *    - Real-time proxy with response verification and automatic blob lifecycle cleanup.
 * 3. Client Web Speech API (window.speechSynthesis) with Indic fallback
 *    - Disabled when &nofallback=1 query flag is present to allow pure ElevenLabs verification.
 * 4. User-visible feedback:
 *    - If all paths fail, returns actionable error message instead of failing silently.
 * 5. Debug Mode:
 *    - ?voicedebug=1 prints pipeline stages, HTTP statuses, and active playback sources to console.
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

// Global audio element singleton across entire app session
let globalAudio = null;
let currentBlobUrl = null;
let currentPlaybackSource = null; // 'manifest' | 'elevenlabs' | 'browser' | null
let manifestCache = null;
let isManifestLoading = false;

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
 * Loads pre-generated audio manifest from public directory.
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

    const voiceCheck = checkVoiceAvailability(langCode);
    if (voiceCheck.voice) {
      utterance.voice = voiceCheck.voice;
      utterance.lang = voiceCheck.voice.lang;
    } else {
      utterance.lang = LANG_VOICE_MAP[langCode]?.[0] || 'hi-IN';
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
 * Manifest Clip -> ElevenLabs Backend Proxy -> Browser SpeechSynthesis -> Visible Error
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
  const { isVoiceDebug, isNoFallback } = getQueryParams();

  debugLog(`speak() requested for [${code}] clipId: ${clipId || 'none'}, text length: ${text?.length || 0}`);

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
  if (audio) {
    // Prime audio inside synchronous user gesture context to prevent mobile autoplay restrictions
    try {
      audio.load();
    } catch (_) {}
  }

  // 1. Pipeline Stage 1: Pre-generated Audio Manifest Clip
  if (clipId) {
    const manifest = await loadAudioManifest();
    const clipEntry = manifest?.clips?.[clipId]?.[code];

    // Strictly verify clip size > 2048 bytes (never play 48-byte stubs)
    if (clipEntry && clipEntry.path && clipEntry.sizeBytes >= 2048) {
      debugLog(`Attempting manifest clip: ${clipEntry.path} (${clipEntry.sizeBytes} bytes)`);
      try {
        currentPlaybackSource = 'manifest';
        audio.src = clipEntry.path;

        let playbackStarted = false;

        const playPromise = new Promise((resolve, reject) => {
          audio.onloadedmetadata = () => {
            // If duration is suspiciously short (< 0.5s), reject stub
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
              playbackStarted = true;
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
        // Fall through to Stage 2
      }
    } else if (clipEntry) {
      debugLog(`Manifest clip rejected: sizeBytes (${clipEntry.sizeBytes}) is under 2048 byte threshold.`);
    }
  }

  // Helper for Stage 2 (Proxy) and Stage 3 (Browser)
  async function attemptBackendOrBrowser() {
    // 2. Pipeline Stage 2: ElevenLabs Backend Proxy
    if (isVoiceSupported(code)) {
      debugLog(`Calling live backend voice proxy POST /api/voice/speak for [${code}]...`);
      try {
        const result = await api.speakText(text, code);
        if (result && result.blobUrl) {
          currentBlobUrl = result.blobUrl;
          currentPlaybackSource = 'elevenlabs';
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

    // 3. Pipeline Stage 3: Browser SpeechSynthesis Fallback
    if (isNoFallback) {
      debugLog('Pipeline stopped: &nofallback=1 is set, skipping device voice fallback.');
      if (onLoading) onLoading(false);
      if (onError) {
        onError({
          code: 'elevenlabs_failed',
          message: 'Voice could not be synthesized via ElevenLabs (&nofallback=1 active).'
        });
      }
      if (onEnd) onEnd();
      return;
    }

    const browserCheck = checkVoiceAvailability(code);
    if (browserCheck.available && browserCheck.engine === 'browser') {
      debugLog('Attempting browser speech synthesis fallback...');
      if (onLoading) onLoading(false);
      playViaBrowserSpeech({ text, langCode: code, onStart, onEnd, onError });
      return;
    }

    // 4. Pipeline Stage 4: Visible Failure Notice (Never fail silently)
    debugLog(`All voice pipelines exhausted for [${code}]. Showing visible error notice.`);
    if (onLoading) onLoading(false);
    if (onError) {
      onError({
        code: 'voice_unavailable',
        message: 'Voice could not be played. Tap to try again.'
      });
    }
    if (onEnd) onEnd();
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
