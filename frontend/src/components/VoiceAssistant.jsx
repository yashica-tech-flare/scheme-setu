import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Mic, Square, AlertCircle, Info, Loader2, Sparkles, RefreshCw, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { normaliseVoiceLang } from '../config/voiceConfig';
import {
  speak,
  stopSpeech,
  isSpeechSupported,
  checkVoiceAvailability,
  isSpeaking,
  getActivePlaybackSource,
  loadAudioManifest,
  isClipAvailable,
  isRuntimeVoiceHealthy
} from '../utils/speechHelper';

export const ITEM_NOT_READY_MESSAGES = {
  en: 'Voice for this item is not ready yet',
  hi: 'इस आइटम के लिए आवाज़ अभी तैयार नहीं है',
  ta: 'இந்த உருப்படிக்கான குரல் இன்னும் தயாராகவில்லை',
  te: 'ఈ అంశానికి వాయిస్ ఇంకా సిద్ధంగా లేదు',
  bn: 'এই আইটেমের জন্য ভয়েস এখনও প্রস্তুত নয়',
  gu: 'આ આઇટમ માટે અવાજ હજી તૈયાર નથી',
  kn: 'ಈ ಅಂಶಕ್ಕೆ ಧ್ವನಿ ಇನ್ನೂ ಸಿದ್ಧವಾಗಿಲ್ಲ',
  ml: 'ഈ ഇനത്തിനായുള്ള ശബ്ദം ഇതുവരെ തയ്യാറായിട്ടില്ല',
  mr: 'या घटकासाठी आवाज अद्याप तयार नाही',
  or: 'ଏହି ଆଇଟମ୍ ପାଇଁ ଭଏସ୍ ଏପର୍ଯ୍ୟନ୍ତ ପ୍ରସ୍ତୁତ ନୁହେଁ',
  pa: 'ਇਸ ਆਈਟਮ ਲਈ ਆਵਾਜ਼ ਅਜੇ ਤਿਆਰ ਨਹੀਂ ਹੈ',
  ur: 'اس آئٹم کے لیے آواز ابھی تیار نہیں ہے'
};

const UNAVAILABLE_MESSAGES = {
  en: 'Voice is not available in this language yet',
  hi: 'इस भाषा में अभी आवाज़ उपलब्ध नहीं है',
  ta: 'இந்த மொழியில் குரல் இன்னும் கிடைக்கவில்லை',
  te: 'ఈ భాషలో వాయిస్ ఇంకా అందుబాటులో లేదు',
  bn: 'এই ভাষায় এখনও ভয়েস উপলব্ধ নয়',
  gu: 'આ ભાષામાં હજી અવાજ ઉપલબ્ધ નથી',
  kn: 'ಈ ಭಾಷೆಯಲ್ಲಿ ಧ್ವನಿ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ',
  ml: 'ഈ ഭാഷയിൽ ശബ്ദം ഇതുവരെ ലഭ്യമല്ല',
  mr: 'या भाषेत आवाज अद्याप उपलब्ध नाही',
  or: 'ଏହି ଭାଷାରେ ଭଏସ୍ ଏପର୍ଯ୍ୟନ୍ତ ଉପଲବ୍ଧ ନାହିଁ',
  pa: 'ਇਸ ਭਾਸ਼ਾ ਵਿੱਚ ਆਵਾਜ਼ ਅਜੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ',
  ur: 'اس زبان میں آواز ابھی دستیاب نہیں ہے'
};

const TEMPORARILY_UNAVAILABLE_MESSAGES = {
  en: 'Voice is temporarily unavailable. Please try again.',
  hi: 'आवाज़ अस्थायी रूप से अनुपलब्ध है। कृपया पुनः प्रयास करें।',
  ta: 'குரல் தற்காலிகமாக கிடைக்கவில்லை. மீண்டும் முயற்சிக்கவும்.',
  te: 'వాయిస్ తాత్కాలికంగా అందుబాటులో లేదు. దయచేసి మళ్లీ ప్రయత్నించండి.',
  bn: 'ভয়েস সাময়িকভাবে অনুপলব্ধ। অনুগ্রহ করে আবার চেষ্টা করুন।',
  gu: 'અવાજ અસ્થાયી રૂપે અનુપલબ્ધ છે. કૃપા કરીને ફરી પ્રયાસ કરો.',
  kn: 'ಧ್ವನಿ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
  ml: 'ശബ്ദം താൽക്കാലികമായി ലഭ്യമല്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.',
  mr: 'आवाज तात्पुरता अनुपलब्ध आहे. कृपया पुन्हा प्रयत्न करा.',
  or: 'ଭଏସ୍ ଅସ୍ଥାୟୀ ଭାବରେ ଅନୁପଲବ୍ଧ। ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ।',
  pa: 'ਆਵਾਜ਼ ਅਸਥਾਈ ਤੌਰ ਤੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
  ur: 'آواز عارضی طور پر دستیاب نہیں ہے۔ براہ کرم دوبارہ کوشش کریں۔'
};

const OFFLINE_MESSAGES = {
  en: 'Check your internet connection',
  hi: 'अपना इंटरनेट कनेक्शन जांचें',
  ta: 'உங்கள் இணைய இணைப்பைச் சரிபார்க்கவும்',
  te: 'మీ ఇంటర్నెట్ కనెక్షన్‌ను తనిఖీ చేయండి',
  bn: 'আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন',
  gu: 'તમારું ઇન્ટરનેટ કનેક્શન તપાસો',
  kn: 'ನಿಮ್ಮ ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ',
  ml: 'നിങ്ങളുടെ ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിക്കുക',
  mr: 'तुमचे इंटरनेट कनेक्शन तपासा',
  or: 'ଆପଣଙ୍କର ଇଣ୍ଟରନେଟ୍ ସଂଯୋଗ ଯାଞ୍ଚ କରନ୍ତୁ',
  pa: 'ਆਪਣਾ ਇੰਟਰਨੈੱਟ ਕਨੈਕਸ਼ਨ ਚੈੱਕ ਕਰੋ',
  ur: 'اپنا انٹرنیٹ کنکشن چیک کریں'
};

const TAP_TO_RETRY_MESSAGES = {
  en: 'Tap to retry',
  hi: 'पुनः प्रयास करें',
  ta: 'மீண்டும் முயற்சிக்கவும்',
  te: 'మళ్లీ ప్రయత్నించండి',
  bn: 'আবার চেষ্টা করুন',
  gu: 'ફરી પ્રયાસ કરો',
  kn: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
  ml: 'വീണ്ടും ശ്രമിക്കുക',
  mr: 'पुन्हा प्रयत्न करा',
  or: 'ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ',
  pa: 'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ',
  ur: 'دوبارہ کوشش کریں'
};

/**
 * VoiceAssistant Component
 * Specially crafted for illiterate, low-literacy, and rural beneficiaries.
 * Hybrid Voice Engine with honest error classification and strict Golden Rule enforcement.
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
  const [errorState, setErrorState] = useState(null); // { type: 'unavailable' | 'temporary' | 'offline' | 'not_ready', message: string, retries: number }
  const [activeSource, setActiveSource] = useState(null);
  const [manifestReady, setManifestReady] = useState(false);
  const [tooltipAlign, setTooltipAlign] = useState('center');
  const retryCountRef = useRef(0);

  // Eager load audio manifest on mount to check clip availability
  useEffect(() => {
    loadAudioManifest().then(() => setManifestReady(true));
  }, []);

  const handleTooltipAlign = (e) => {
    if (!e || !e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.left < 130) {
      setTooltipAlign('left');
    } else if (window.innerWidth - rect.right < 130) {
      setTooltipAlign('right');
    } else {
      setTooltipAlign('center');
    }
  };

  const tooltipPosClass = tooltipAlign === 'left'
    ? 'left-0'
    : tooltipAlign === 'right'
    ? 'right-0'
    : 'left-1/2 -translate-x-1/2';

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
    setErrorState(null);
    retryCountRef.current = 0;
  }, [i18n.language, textToRead, clipId]);

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

  if (!supported) return null;

  const isElevenLabs = voiceStatus.engine === 'elevenlabs';
  const isSarvam = voiceStatus.engine === 'sarvam';
  const isBeta = voiceStatus.status === 'beta';
  const isAvailable = voiceStatus.available && voiceStatus.status !== 'unavailable';

  // Missing clip check: if clipId is specified, check manifest availability
  // If missing and runtime voice route is down or out of credit -> item not ready
  const hasClip = clipId ? isClipAvailable(clipId, activeLang) : false;
  const isRuntimeHealthy = isRuntimeVoiceHealthy(activeLang);
  const isItemNotReady = Boolean(clipId && !hasClip && !isRuntimeHealthy);

  const listenLabel = label || t('voice_assistant.listen_button', t('common.audioGuideBtn', 'Listen Aloud'));
  const stopLabel = t('voice_assistant.stop_button', t('common.stopAudio', 'Stop Audio'));

  const unavailableMsg = UNAVAILABLE_MESSAGES[activeLang] || t('voice_assistant.voice_unavailable', 'Voice is not available in this language yet');
  const itemNotReadyMsg = ITEM_NOT_READY_MESSAGES[activeLang] || t('voice_assistant.item_not_ready', 'Voice for this item is not ready yet');
  const tempUnavailableMsg = TEMPORARILY_UNAVAILABLE_MESSAGES[activeLang] || t('voice_assistant.voice_temporarily_unavailable', 'Voice is temporarily unavailable. Please try again.');
  const offlineMsg = OFFLINE_MESSAGES[activeLang] || t('voice_assistant.network_offline', 'Check your internet connection');
  const tapToRetryMsg = TAP_TO_RETRY_MESSAGES[activeLang] || t('voice_assistant.tapToRetry', 'Tap to retry');

  const executeSpeech = (clickLang) => {
    speak({
      text: textToRead,
      clipId: clipId,
      langCode: clickLang,
      onLoading: (loading) => setIsLoading(loading),
      onStart: () => {
        setIsLoading(false);
        setIsPlaying(true);
        setActiveSource(getActivePlaybackSource());
        setErrorState(null);
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

        // Honest error classification (Part 2A)
        if (err?.code === 'item_not_ready') {
          setErrorState({
            type: 'not_ready',
            message: itemNotReadyMsg
          });
        } else if (err?.code === 'network_offline' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
          setErrorState({
            type: 'offline',
            message: offlineMsg
          });
        } else if (err?.code === 'voice_unavailable' || !isAvailable) {
          setErrorState({
            type: 'unavailable',
            message: unavailableMsg
          });
        } else {
          // Temporary error (quota, 5xx, timeout, busy)
          const currentRetries = retryCountRef.current;
          if (currentRetries < 2) {
            // Automatic retry (max 2 automatic retries per Part 2A)
            retryCountRef.current = currentRetries + 1;
            setTimeout(() => {
              if (!isPlaying) {
                executeSpeech(clickLang);
              }
            }, 1000);
          } else {
            setErrorState({
              type: 'temporary',
              message: tempUnavailableMsg
            });
          }
        }
      }
    });
  };

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

    // Read selected language directly at click time
    const clickLang = normaliseVoiceLang(customLang || i18n.language) || 'en';
    const clickStatus = checkVoiceAvailability(clickLang);

    if (!clickStatus.available || clickStatus.status === 'unavailable') {
      setErrorState({
        type: 'unavailable',
        message: unavailableMsg
      });
      return;
    }

    if (clipId && !isClipAvailable(clipId, clickLang) && !isRuntimeVoiceHealthy(clickLang)) {
      setErrorState({
        type: 'not_ready',
        message: itemNotReadyMsg
      });
      return;
    }

    setErrorState(null);
    setIsDebouncing(true);
    setTimeout(() => setIsDebouncing(false), 300);

    executeSpeech(clickLang);
  };

  // ---------------------------------------------------------------------------
  // Variant 1: Mini icon-only button (Results scheme cards, document cards)
  // ---------------------------------------------------------------------------
  if (variant === 'mini') {
    if (!isAvailable) {
      return (
        <div className="relative inline-block group" onMouseEnter={handleTooltipAlign}>
          <button
            type="button"
            disabled
            title={unavailableMsg}
            className={`p-1.5 rounded-lg opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200 ${className}`}
            aria-label={unavailableMsg}
          >
            <VolumeX className="w-3.5 h-3.5" />
          </button>
          {/* Responsive Tooltip that never overflows screen edges on 390px or desktop */}
          <div className={`absolute z-50 bottom-full ${tooltipPosClass} mb-1.5 hidden group-hover:block w-48 sm:w-56 max-w-[calc(100vw-32px)] p-2 bg-slate-900 text-white text-[11px] leading-relaxed rounded-lg shadow-xl border border-slate-700 pointer-events-none whitespace-normal break-words`}>
            {unavailableMsg}
          </div>
        </div>
      );
    }

    if (isItemNotReady) {
      return (
        <div className="relative inline-block group" onMouseEnter={handleTooltipAlign}>
          <button
            type="button"
            disabled
            title={itemNotReadyMsg}
            className={`p-1.5 rounded-lg opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200 ${className}`}
            aria-label={itemNotReadyMsg}
          >
            <VolumeX className="w-3.5 h-3.5" />
          </button>
          {/* Disabled missing clip tooltip: no red retry loop */}
          <div className={`absolute z-50 bottom-full ${tooltipPosClass} mb-1.5 hidden group-hover:block w-48 sm:w-56 max-w-[calc(100vw-32px)] p-2 bg-slate-900 text-white text-[11px] leading-relaxed rounded-lg shadow-xl border border-slate-700 pointer-events-none whitespace-normal break-words`}>
            {itemNotReadyMsg}
          </div>
        </div>
      );
    }

    const hasTemporaryError = errorState?.type === 'temporary' || errorState?.type === 'offline';
    const errorTooltip = errorState?.type === 'offline'
      ? offlineMsg
      : `${tempUnavailableMsg} (${tapToRetryMsg})`;

    const buttonTitle = hasTemporaryError
      ? errorTooltip
      : isPlaying
      ? stopLabel
      : `${listenLabel} (${voiceStatus.status === 'beta' ? 'Beta' : 'Voice'})`;

    return (
      <div className="relative inline-flex items-center gap-1.5 group" onMouseEnter={handleTooltipAlign}>
        <button
          type="button"
          onClick={handleTogglePlay}
          title={buttonTitle}
          className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-all focus:outline-none cursor-pointer ${
            hasTemporaryError
              ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
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
          ) : hasTemporaryError ? (
            <div className="inline-flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-amber-800" />
              <RefreshCw className="w-2.5 h-2.5 text-amber-600" />
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

        {/* Bounded, Wrapping Tooltip for Temporary Errors */}
        {hasTemporaryError && (
          <div className={`absolute z-50 bottom-full ${tooltipPosClass} mb-1.5 hidden group-hover:block w-48 sm:w-56 max-w-[calc(100vw-32px)] p-2 bg-slate-900 text-white text-[11px] leading-relaxed rounded-lg shadow-xl border border-slate-700 pointer-events-none whitespace-normal break-words`}>
            {errorTooltip}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Variant 2: Compact button (Headers, Guide Header, Guidance Panel Header)
  // ---------------------------------------------------------------------------
  if (variant === 'button') {
    if (!isAvailable) {
      return (
        <button
          type="button"
          disabled
          title={unavailableMsg}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/60 text-slate-400 border border-slate-700/60 opacity-60 cursor-not-allowed transition-all ${className}`}
          aria-label={unavailableMsg}
        >
          <VolumeX className="w-3.5 h-3.5 text-slate-400" />
          <span>{listenLabel}</span>
          <span className="text-[10px] text-slate-400 hidden lg:inline">({unavailableMsg})</span>
        </button>
      );
    }

    if (isItemNotReady) {
      return (
        <button
          type="button"
          disabled
          title={itemNotReadyMsg}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/60 text-slate-400 border border-slate-700/60 opacity-60 cursor-not-allowed transition-all ${className}`}
          aria-label={itemNotReadyMsg}
        >
          <VolumeX className="w-3.5 h-3.5 text-slate-400" />
          <span>{listenLabel}</span>
          <span className="text-[10px] text-slate-400 hidden lg:inline">({itemNotReadyMsg})</span>
        </button>
      );
    }

    if (!errorState) {
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

    // Temporary error state with Retry button (Part 2A)
    return (
      <div className="inline-flex flex-col items-start gap-1 max-w-[240px] sm:max-w-xs">
        <button
          type="button"
          onClick={handleTogglePlay}
          title={`${errorState.message} (${tapToRetryMsg})`}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm focus:outline-none cursor-pointer bg-amber-600 hover:bg-amber-700 text-white ${className}`}
          aria-label={isPlaying ? stopLabel : listenLabel}
        >
          <RefreshCw className="w-4 h-4 text-white" />
          <span>{tapToRetryMsg}</span>
        </button>
        <span className="text-[11px] text-amber-800 font-medium leading-tight whitespace-normal break-words">
          {errorState.message}
        </span>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Variant 3: Banner variant (Home page, full-width section)
  // ---------------------------------------------------------------------------
  const hasBannerError = Boolean(errorState);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${
        hasBannerError
          ? 'bg-amber-50 border-amber-300'
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
              hasBannerError
                ? 'bg-amber-600 text-white'
                : isPlaying
                ? 'bg-amber-600 text-white animate-pulse'
                : isAvailable
                ? 'bg-amber-500 text-white'
                : 'bg-slate-300 text-slate-600'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : hasBannerError ? (
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

            {hasBannerError && (
              <div className="mt-2 text-xs font-semibold text-amber-900 flex items-center gap-1.5 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 max-w-lg leading-relaxed whitespace-normal break-words">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{errorState.message}</span>
              </div>
            )}

            {isItemNotReady && (
              <div className="mt-2 text-[11px] font-semibold text-slate-600 flex items-center gap-1 leading-relaxed whitespace-normal break-words">
                <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{itemNotReadyMsg}</span>
              </div>
            )}

            {!isAvailable && (
              <div className="mt-2 text-[11px] font-semibold text-slate-600 flex items-center gap-1 leading-relaxed whitespace-normal break-words">
                <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{unavailableMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Action Button */}
        <div className="flex-shrink-0 self-end sm:self-center">
          <button
            type="button"
            disabled={!isAvailable || isItemNotReady || isLoading}
            onClick={handleTogglePlay}
            title={!isAvailable ? unavailableMsg : isItemNotReady ? itemNotReadyMsg : ''}
            className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-md focus:outline-none ${
              !isAvailable || isItemNotReady
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : hasBannerError
                ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
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
            ) : hasBannerError ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>{tapToRetryMsg}</span>
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
