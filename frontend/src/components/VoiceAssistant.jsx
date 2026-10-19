import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Mic, Square, AlertCircle, Info, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { normaliseVoiceLang } from '../config/voiceConfig';
import {
  speak,
  stopSpeech,
  isSpeechSupported,
  checkVoiceAvailability,
  isSpeaking,
  getActivePlaybackSource
} from '../utils/speechHelper';

const UNAVAILABLE_MESSAGES = {
  en: 'Voice is not available in this language yet',
  hi: 'इस भाषा में आवाज अभी उपलब्ध नहीं है',
  ta: 'இந்த மொழியில் குரல் இன்னும் கிடைக்கவில்லை',
  te: 'ఈ భాషలో వాయిస్ ఇంకా అందుబాటులో లేదు',
  bn: 'এই ভাষায় ভয়েস এখনও উপলব্ধ নয়',
  gu: 'આ ભાષામાં અવાજ હજી ઉપલબ્ધ નથી',
  kn: 'ಈ ಭಾಷೆಯಲ್ಲಿ ಧ್ವನಿ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ',
  ml: 'ഈ ഭാഷയിൽ ശബ്ദം ഇതുവരെ ലഭ്യമല്ല',
  pa: 'ਇਸ ਭਾਸ਼ਾ ਵਿੱਚ ਆਵਾਜ਼ ਅਜੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ',
  or: 'ଏହି ଭାଷାରେ ଭଏସ୍ ଏପର୍ଯ୍ୟନ୍ତ ଉପଲବ୍ଧ ନାହିଁ',
  mr: 'या भाषेत आवाज अजून उपलब्ध नाही',
  ur: 'اس زبان میں آواز ابھی دستیاب نہیں ہے'
};

/**
 * VoiceAssistant Component
 * Specially crafted for illiterate, low-literacy, and rural beneficiaries.
 * Server-authoritative Hybrid ElevenLabs Voice Engine with strict Golden Rule enforcement.
 */
export default function VoiceAssistant({
  textToRead,
  clipId,
  label,
  subtitle,
  variant = 'banner',
  customLang,
  className = ''
}) {
  const { t, i18n } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [supported, setSupported] = useState(true);
  const [voiceStatus, setVoiceStatus] = useState({ available: true, status: 'loading' });
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeSource, setActiveSource] = useState(null);

  // Normalize selected language code (e.g., 'te-IN' -> 'te')
  const activeLang = normaliseVoiceLang(customLang || i18n.language) || 'en';

  const isVoiceDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('voicedebug') === '1';

  // Synchronize voice availability on mount and when selected language changes
  const updateVoiceStatus = () => {
    if (!isSpeechSupported()) {
      setSupported(false);
      setVoiceStatus({ available: false, status: 'unavailable', message: 'Speech not supported' });
      return;
    }
    setSupported(true);
    const status = checkVoiceAvailability(activeLang);
    setVoiceStatus(status);
  };

  useEffect(() => {
    updateVoiceStatus();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        updateVoiceStatus();
      };
    }

    return () => {
      stopSpeech();
    };
  }, [activeLang]);

  // Stop immediately if selected language or text changes while speaking
  useEffect(() => {
    if (isPlaying || isLoading) {
      stopSpeech();
      setIsPlaying(false);
      setIsLoading(false);
    }
    setErrorMessage(null);
  }, [i18n.language, textToRead]);

  // Keep isPlaying and activeSource synchronized with active audio playback
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && !isSpeaking()) {
        setIsPlaying(false);
        setActiveSource(null);
      } else if (isPlaying) {
        setActiveSource(getActivePlaybackSource());
      }
    }, 400);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Console-only debug logging when ?voicedebug=1
  useEffect(() => {
    if (isVoiceDebug) {
      console.debug('[VoiceDebug]', {
        activeLang,
        engine: voiceStatus.engine,
        model: voiceStatus.model,
        speaker: voiceStatus.speaker,
        source: activeSource || (isLoading ? 'loading' : 'idle'),
        status: voiceStatus.status,
        error: errorMessage
      });
    }
  }, [isVoiceDebug, activeLang, voiceStatus, activeSource, isLoading, errorMessage]);

  if (!supported) return null;

  const handleTogglePlay = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isDebouncing) return;

    if (isPlaying || isLoading) {
      stopSpeech();
      setIsPlaying(false);
      setIsLoading(false);
      setActiveSource(null);
      return;
    }

    // Read selected language directly at click time to prevent stale closures
    const clickLang = normaliseVoiceLang(customLang || i18n.language) || 'en';
    const clickStatus = checkVoiceAvailability(clickLang);

    if (!clickStatus.available || clickStatus.status === 'unavailable') {
      return;
    }

    setErrorMessage(null);
    setIsDebouncing(true);
    setTimeout(() => setIsDebouncing(false), 300);

    speak({
      text: textToRead,
      clipId: clipId,
      langCode: clickLang,
      onLoading: (loading) => setIsLoading(loading),
      onStart: () => {
        setIsLoading(false);
        setIsPlaying(true);
        setActiveSource(getActivePlaybackSource());
      },
      onEnd: () => {
        setIsLoading(false);
        setIsPlaying(false);
        setActiveSource(null);
      },
      onError: (err) => {
        setIsLoading(false);
        setIsPlaying(false);
        setActiveSource(null);
        const localizedFail = UNAVAILABLE_MESSAGES[clickLang] || t('voice_assistant.playback_failed', 'Voice is not available in this language yet');
        setErrorMessage(err?.message || localizedFail);
      }
    });
  };

  const listenLabel = label || t('voice_assistant.listen_button', t('common.audioGuideBtn', 'Listen Aloud'));
  const stopLabel = t('voice_assistant.stop_button', t('common.stopAudio', 'Stop Audio'));
  const unavailableMessage = UNAVAILABLE_MESSAGES[activeLang] || t('voice_assistant.voice_unavailable', 'Voice is not available in this language yet');

  const isElevenLabs = voiceStatus.engine === 'elevenlabs';
  const isSarvam = voiceStatus.engine === 'sarvam';
  const isBeta = voiceStatus.status === 'beta';
  const isAvailable = voiceStatus.available && voiceStatus.status !== 'unavailable';

  // 1. Mini icon-only button (e.g. for individual document checklist items or cards)
  if (variant === 'mini') {
    if (!isAvailable) {
      return (
        <button
          type="button"
          disabled
          title={unavailableMessage}
          className={`p-1.5 rounded-lg opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200 ${className}`}
          aria-label={unavailableMessage}
        >
          <VolumeX className="w-3.5 h-3.5" />
        </button>
      );
    }

    const buttonTitle = errorMessage
      ? `${errorMessage} (${t('voice_assistant.tapToRetry', 'Tap to retry')})`
      : isPlaying
      ? stopLabel
      : `${listenLabel} (${voiceStatus.status === 'beta' ? 'Beta' : 'Voice'})`;

    return (
      <div className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleTogglePlay}
          title={buttonTitle}
          className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-all focus:outline-none cursor-pointer ${
            errorMessage
              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300'
              : isLoading
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : isPlaying
              ? 'bg-amber-600 text-white animate-pulse shadow-md scale-105'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 hover:shadow-xs'
          } ${className}`}
          aria-label={isPlaying ? stopLabel : `${listenLabel}: ${buttonTitle}`}
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
          ) : isPlaying ? (
            <Square className="w-3.5 h-3.5 fill-current" />
          ) : errorMessage ? (
            <div className="inline-flex items-center gap-1" title={buttonTitle}>
              <Volume2 className="w-3.5 h-3.5 text-rose-600" />
              <RefreshCw className="w-2.5 h-2.5 text-rose-500" />
            </div>
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-amber-700" />
          )}
        </button>
        {isBeta && (
          <span className="text-[9px] font-bold px-1 rounded bg-amber-200 text-amber-900 border border-amber-300 select-none">
            Beta
          </span>
        )}
      </div>
    );
  }

  // 2. Compact button variant (e.g. for header or card action)
  if (variant === 'button') {
    if (!isAvailable) {
      return (
        <button
          type="button"
          disabled
          title={unavailableMessage}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/60 text-slate-400 border border-slate-700/60 opacity-60 cursor-not-allowed transition-all ${className}`}
          aria-label={unavailableMessage}
        >
          <VolumeX className="w-3.5 h-3.5 text-slate-400" />
          <span>{listenLabel}</span>
          <span className="text-[10px] text-slate-400 hidden lg:inline">({unavailableMessage})</span>
        </button>
      );
    }

    if (!errorMessage) {
      return (
        <button
          type="button"
          onClick={handleTogglePlay}
          title={voiceStatus.message}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm focus:outline-none cursor-pointer ${
            isPlaying
              ? 'bg-amber-600 text-white ring-2 ring-amber-300 animate-pulse'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:shadow-md'
          } ${className}`}
          aria-label={isPlaying ? stopLabel : listenLabel}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>{t('voice_assistant.preparing', 'Preparing voice...')}</span>
            </>
          ) : isPlaying ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>{stopLabel}</span>
              <span className="flex items-center gap-0.5 ml-1">
                <span className="w-1 h-3 bg-white rounded-full animate-bounce"></span>
                <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:150ms]"></span>
                <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:300ms]"></span>
              </span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span>{listenLabel}</span>
              {isBeta && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 ml-1">
                  Beta
                </span>
              )}
            </>
          )}
        </button>
      );
    }

    return (
      <div className="inline-flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={handleTogglePlay}
          title={`${errorMessage} (Tap to retry)`}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm focus:outline-none cursor-pointer bg-rose-600 hover:bg-rose-700 text-white ${className}`}
          aria-label={isPlaying ? stopLabel : listenLabel}
        >
          <RefreshCw className="w-4 h-4 text-white" />
          <span>{t('voice_assistant.retry', 'Tap to Retry')}</span>
        </button>
        <span className="text-[10px] text-rose-600 font-medium">
          {errorMessage}
        </span>
      </div>
    );
  }

  // 3. Full prominent banner variant
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${
        errorMessage
          ? 'bg-rose-50 border-rose-300'
          : isPlaying
          ? 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-amber-300 shadow-md ring-2 ring-amber-400/40'
          : 'bg-gradient-to-r from-amber-50/80 via-yellow-50/50 to-amber-50/80 border-amber-200/90'
      } p-4 sm:p-5 transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left info column */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              errorMessage
                ? 'bg-rose-600 text-white'
                : isPlaying
                ? 'bg-amber-600 text-white animate-pulse'
                : isAvailable
                ? 'bg-amber-500 text-white'
                : 'bg-slate-300 text-slate-600'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : errorMessage ? (
              <RefreshCw className="w-6 h-6" />
            ) : isPlaying ? (
              <Volume2 className="w-6 h-6 animate-pulse" />
            ) : isAvailable ? (
              <Mic className="w-6 h-6" />
            ) : (
              <VolumeX className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 border border-amber-300/60 px-2 py-0.5 rounded-md">
                {t('voice_assistant.voice_tag', t('common.voiceAssistantTag', 'Voice Guide'))}
              </span>

              {isElevenLabs && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300/60 px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  ElevenLabs Voice
                </span>
              )}

              {isSarvam && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-800 bg-orange-100/90 border border-orange-300/60 px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3 text-orange-600" />
                  Sarvam AI
                </span>
              )}

              {isBeta && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300/60 px-2 py-0.5 rounded-md">
                  Beta
                </span>
              )}

              {isPlaying && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-800"></span>
                  {t('common.speakingNow', 'Playing voice readout...')}
                </span>
              )}
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              {t('common.voiceAssistantTitle', 'Difficulty Reading? Listen aloud')}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              {subtitle || t('common.voiceAssistantDesc', 'Specially designed for low-literacy and rural applicants: Tap this button to hear scheme benefits and required documents spoken aloud in your language.')}
            </p>

            {errorMessage && (
              <div className="mt-2 text-xs font-semibold text-rose-700 flex items-center gap-1.5 bg-rose-100/80 px-2.5 py-1 rounded-lg border border-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {!isAvailable && (
              <div className="mt-2 text-[11px] font-semibold text-amber-900 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>{unavailableMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Action Button */}
        <div className="flex-shrink-0 self-end sm:self-center">
          <button
            type="button"
            disabled={!isAvailable || isLoading}
            onClick={handleTogglePlay}
            className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-md focus:outline-none ${
              !isAvailable
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : errorMessage
                ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                : isPlaying
                ? 'bg-amber-600 hover:bg-amber-700 text-white ring-4 ring-amber-300/50 cursor-pointer'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:shadow-lg cursor-pointer'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('voice_assistant.preparing', 'Preparing voice...')}</span>
              </>
            ) : errorMessage ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>{t('voice_assistant.retry', 'Tap to Retry')}</span>
              </>
            ) : isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>{stopLabel}</span>
                <span className="flex items-center gap-0.5 ml-1">
                  <span className="w-1.5 h-3 bg-white rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-5 bg-white rounded-full animate-bounce [animation-delay:150ms]"></span>
                  <span className="w-1.5 h-3 bg-white rounded-full animate-bounce [animation-delay:300ms]"></span>
                </span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                <span>{listenLabel}</span>
                {isBeta && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300 ml-1.5">
                    Beta
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
