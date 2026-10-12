import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Mic, Play, Square, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { speak, stopSpeech, isSpeechSupported } from '../utils/speechHelper';

/**
 * VoiceAssistant Component
 * Specially crafted for illiterate, low-literacy, and rural beneficiaries.
 * Reads out loan details, document checklists, and application status in spoken regional dialects.
 *
 * @param {string} textToRead - The full narrative text to speak aloud
 * @param {string} label - Optional button label (fallback to default localized label)
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
  const [supported, setSupported] = useState(true);

  const activeLang = customLang || i18n.language || 'hi';

  useEffect(() => {
    setSupported(isSpeechSupported());
    return () => {
      // Stop speech when component unmounts
      stopSpeech();
    };
  }, []);

  // Stop if active language changes while speaking
  useEffect(() => {
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
    }
  }, [i18n.language]);

  if (!supported) return null;

  const handleTogglePlay = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speak({
        text: textToRead,
        langCode: activeLang,
        rate: 0.88, // calm, slower pace for illiterate/elderly comprehension
        onStart: () => setIsPlaying(true),
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false)
      });
    }
  };

  // 1. Mini icon-only button (e.g. for individual document checklist items)
  if (variant === 'mini') {
    return (
      <button
        type="button"
        onClick={handleTogglePlay}
        title={isPlaying ? t('common.stopAudio', 'आवाज़ रोकें / Stop') : t('common.listenAudio', 'बोलकर सुनें / Listen')}
        className={`p-1.5 rounded-lg transition-all focus:outline-none ${
          isPlaying
            ? 'bg-amber-600 text-white animate-pulse shadow-md scale-105'
            : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
        } ${className}`}
        aria-label="Listen aloud"
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
    return (
      <button
        type="button"
        onClick={handleTogglePlay}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm focus:outline-none ${
          isPlaying
            ? 'bg-amber-600 text-white ring-2 ring-amber-300 animate-pulse'
            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
        } ${className}`}
      >
        {isPlaying ? (
          <>
            <Square className="w-4 h-4 fill-current" />
            <span>{t('common.stopAudio', 'आवाज़ रोकें (Stop)')}</span>
            <span className="flex items-center gap-0.5 ml-1">
              <span className="w-1 h-3 bg-white rounded-full animate-bounce"></span>
              <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:150ms]"></span>
              <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:300ms]"></span>
            </span>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4" />
            <span>{label || t('common.listenAudio', 'बोल के सुनें (आवाज़ में)')}</span>
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
                : 'bg-amber-500 text-white'
            }`}
          >
            {isPlaying ? (
              <Volume2 className="w-6 h-6 animate-pulse" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 border border-amber-300/60 px-2 py-0.5 rounded-md">
                {t('common.voiceAssistantTag', 'आवाज़ सहायता / Voice Guide')}
              </span>
              {isPlaying && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-800"></span>
                  {t('common.speakingNow', 'आवाज़ सुनाई जा रही है...')}
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
              {label || t('common.voiceAssistantTitle', 'पढ़ने में कठिनाई? अपनी पूरी अर्जी आवाज़ में सुनें')}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {subtitle ||
                t(
                  'common.voiceAssistantDesc',
                  'निरक्षर व ग्रामीण आवेदकों के लिए: यह बटन दबाने पर आपकी अर्जी की स्थिति, ऋण राशि और आवश्यक कागजात बोलकर सुनाए जाएंगे।'
                )}
            </p>
          </div>
        </div>

        {/* Right audio trigger button */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-md transition-all focus:outline-none ${
              isPlaying
                ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-300 shadow-rose-200'
                : 'bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white shadow-amber-200 hover:shadow-lg scale-[1.02]'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>{t('common.stopAudio', 'रोकें (Stop Audio)')}</span>
                <span className="flex items-center gap-1 ml-1.5">
                  <span className="w-1 h-3 bg-white rounded-full animate-bounce"></span>
                  <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:150ms]"></span>
                  <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:300ms]"></span>
                </span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5 text-amber-200" />
                <span>{t('common.listenNowBtn', '🔊 बोल के सुनाएँ (अभी सुनें)')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
