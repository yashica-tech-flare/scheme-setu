import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Mic, Square, AlertCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { speak, stopSpeech, isSpeechSupported, checkVoiceAvailability, isSpeaking } from '../utils/speechHelper';

/**
 * VoiceAssistant Component
 * Specially crafted for illiterate, low-literacy, and rural beneficiaries.
 * Reads out loan details, document checklists, and application status in spoken regional dialects.
 *
 * @param {string} textToRead - The full narrative text to speak aloud
 * @param {string} label - Optional button label override
 * @param {string} subtitle - Optional explanatory subtitle
 * @param {string} variant - 'banner' | 'button' | 'mini'
 * @param {string} customLang - Optional language code override (defaults to current i18n language)
 */
export default function VoiceAssistant({
  textToRead,
  label,
  subtitle,
  variant = 'banner',
  customLang,
  className = ''
}) {
  const { t, i18n } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [supported, setSupported] = useState(true);
  const [voiceStatus, setVoiceStatus] = useState({ available: true, status: 'loading' });

  const activeLang = customLang || i18n.language || 'en';

  // Synchronize voice availability on mount and when voices are loaded asynchronously
  const updateVoiceStatus = () => {
    if (!isSpeechSupported()) {
      setSupported(false);
      setVoiceStatus({ available: false, status: 'unsupported' });
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

  // Stop if active language changes while speaking
  useEffect(() => {
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
    }
  }, [i18n.language, textToRead]);

  // Keep isPlaying synchronized with browser's speechSynthesis state
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && !isSpeaking()) {
        setIsPlaying(false);
      }
    }, 400);
    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!supported) return null;

  const handleTogglePlay = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isDebouncing) return;

    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
      return;
    }

    if (!voiceStatus.available) {
      return;
    }

    setIsDebouncing(true);
    setTimeout(() => setIsDebouncing(false), 300);

    setIsPlaying(true);
    speak({
      text: textToRead,
      langCode: activeLang,
      rate: 0.88, // calm, slower pace for high comprehension
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: (err) => {
        console.warn('Voice playback note:', err);
        setIsPlaying(false);
      }
    });
  };

  const listenLabel = label || t('voice_assistant.listen_button', t('common.audioGuideBtn', 'Listen Aloud'));
  const stopLabel = t('voice_assistant.stop_button', t('common.stopAudio', 'Stop Audio'));
  const unavailableTooltip = t('voice_assistant.voice_unavailable', 'Voice not available in this language on your device');

  // 1. Mini icon-only button (e.g. for individual document checklist items)
  if (variant === 'mini') {
    if (!voiceStatus.available) {
      return (
        <button
          type="button"
          disabled
          title={unavailableTooltip}
          className={`p-1.5 rounded-lg opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200 ${className}`}
          aria-label={unavailableTooltip}
        >
          <VolumeX className="w-3.5 h-3.5" />
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handleTogglePlay}
        title={isPlaying ? stopLabel : (voiceStatus.isFallback ? `${listenLabel} (${voiceStatus.message})` : listenLabel)}
        className={`p-1.5 rounded-lg transition-all focus:outline-none cursor-pointer ${
          isPlaying
            ? 'bg-amber-600 text-white animate-pulse shadow-md scale-105'
            : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 hover:shadow-xs'
        } ${className}`}
        aria-label={isPlaying ? stopLabel : listenLabel}
      >
        {isPlaying ? (
          <Square className="w-3.5 h-3.5 fill-current" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
      </button>
    );
  }

  // 2. Compact button variant (e.g. for header or card action)
  if (variant === 'button') {
    if (!voiceStatus.available) {
      return (
        <button
          type="button"
          disabled
          title={unavailableTooltip}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/60 text-slate-400 border border-slate-700/60 opacity-60 cursor-not-allowed transition-all ${className}`}
          aria-label={unavailableTooltip}
        >
          <VolumeX className="w-3.5 h-3.5 text-slate-400" />
          <span>{listenLabel}</span>
          <span className="text-[10px] text-slate-400 hidden lg:inline">({t('voice_assistant.voice_unavailable_short', 'Voice N/A')})</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handleTogglePlay}
        title={voiceStatus.isFallback ? `${voiceStatus.message}` : undefined}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm focus:outline-none cursor-pointer ${
          isPlaying
            ? 'bg-amber-600 text-white ring-2 ring-amber-300 animate-pulse'
            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:shadow-md'
        } ${className}`}
        aria-label={isPlaying ? stopLabel : listenLabel}
      >
        {isPlaying ? (
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
          </>
        )}
      </button>
    );
  }

  // 3. Full prominent banner variant (Ideal for illiterate / rural applicants on /track)
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${
        isPlaying
          ? 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-amber-300 shadow-md ring-2 ring-amber-400/40'
          : 'bg-gradient-to-r from-amber-50/80 via-yellow-50/50 to-amber-50/80 border-amber-200/90'
      } p-4 sm:p-5 transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left info column */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              isPlaying
                ? 'bg-amber-600 text-white animate-pulse'
                : voiceStatus.available
                ? 'bg-amber-500 text-white'
                : 'bg-slate-300 text-slate-600'
            }`}
          >
            {isPlaying ? (
              <Volume2 className="w-6 h-6 animate-pulse" />
            ) : voiceStatus.available ? (
              <Mic className="w-6 h-6" />
            ) : (
              <VolumeX className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 border border-amber-300/60 px-2 py-0.5 rounded-md">
                {t('voice_assistant.voice_tag', t('common.voiceAssistantTag', 'Voice Guide'))}
              </span>
              {isPlaying && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-800"></span>
                  {t('common.speakingNow', 'Playing voice readout...')}
                </span>
              )}
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              {t('common.voiceAssistantTitle', 'Difficulty Reading? Listen to your application aloud')}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              {subtitle || t('common.voiceAssistantDesc', 'Specially designed for low-literacy and rural applicants: Tap this button to hear your loan status, amount, and required documents spoken aloud in your language.')}
            </p>
            {!voiceStatus.available && (
              <div className="mt-2 text-[11px] font-semibold text-amber-900 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>{unavailableTooltip}</span>
              </div>
            )}
            {voiceStatus.isFallback && (
              <div className="mt-1 text-[10px] text-amber-700 flex items-center gap-1">
                <Info className="w-3 h-3" />
                <span>{voiceStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Action Button */}
        <div className="flex-shrink-0 self-end sm:self-center">
          <button
            type="button"
            disabled={!voiceStatus.available}
            onClick={handleTogglePlay}
            className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-md focus:outline-none ${
              !voiceStatus.available
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : isPlaying
                ? 'bg-amber-600 hover:bg-amber-700 text-white ring-4 ring-amber-300/50 cursor-pointer'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:shadow-lg cursor-pointer'
            }`}
          >
            {isPlaying ? (
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
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
