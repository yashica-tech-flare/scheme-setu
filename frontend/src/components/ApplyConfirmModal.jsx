import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  X,
  Lock,
  ArrowRight
} from 'lucide-react';
import { isValidGovernmentUrl, getDomainDisplay } from '../utils/urlValidator';
import { localizeSchemeName, localizeDocumentName } from '../utils/localizationHelper';
import VoiceAssistant from './VoiceAssistant';
import { api } from '../api/client';

export default function ApplyConfirmModal({ isOpen, onClose, scheme, targetPortal }) {
  const { t, i18n } = useTranslation();
  const modalRef = useRef(null);

  const isRtl = i18n.language === 'ur';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !scheme) return null;

  const activePortal = targetPortal || {
    url: scheme.applyUrl,
    portalName: scheme.applyPortalName || t('applyModal.defaultPortalName', 'PM-SURAJ Official Portal')
  };
  const targetUrl = activePortal.url;
  const isUrlValid = isValidGovernmentUrl(targetUrl);
  const domainDisplay = getDomainDisplay(targetUrl);
  const schemeNameDisplay = localizeSchemeName(scheme, i18n.language);
  const portalName = activePortal.portalName || t('applyModal.defaultPortalName', 'PM-SURAJ Official Portal');

  const docs = scheme.requiredDocuments || scheme.documentsRequired || [
    'Aadhaar Card (DBT-linked mobile)',
    'SC Caste Certificate',
    'Income Certificate (<= ₹5 Lakh)',
    'Active Bank Passbook with IFSC'
  ];

  const handleContinue = () => {
    if (!isUrlValid || !targetUrl) {
      alert(t('applyModal.invalidUrlAlert', 'Security error: Invalid government portal URL.'));
      return;
    }

    // Fire anonymous telemetry (Part A step 9)
    try {
      api.logApplyClick({
        schemeId: scheme._id || scheme.schemeName || scheme.name,
        languageCode: i18n.language
      });
    } catch (_) {}

    // Open target portal in a secure new tab
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const voiceSummary = t('voice_assistant.apply_summary', {
    portalName,
    docsList: docs.slice(0, 4).map(d => localizeDocumentName(d, t)).join(', ')
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-modal-title"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-y-auto flex flex-col transition-all transform scale-100"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white rounded-t-3xl border-b border-slate-700 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-saffron-400 text-xs font-bold uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" />
                <span>{t('applyModal.securityVerified', 'Official Government Redirect')}</span>
              </div>
              <h3 id="apply-modal-title" className="text-xl font-bold tracking-tight text-white">
                {t('applyModal.leavingNotice', 'You are leaving SchemeBridge and going to an official government portal.')}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/60 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <VoiceAssistant
              variant="mini"
              clipId="apply_modal_warning"
              textToRead={voiceSummary}
              className="bg-slate-800 text-saffron-400 border border-slate-600"
            />
            <span className="text-[11px] text-slate-300 font-medium">
              {t('applyModal.listenBriefing', 'Listen to pre-application checklist')}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-sm text-slate-700 flex-1">
          {/* Destination Portal Details Card */}
          <div className="p-4 rounded-2xl bg-saffron-50/70 border border-saffron-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-saffron-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t('applyModal.destinationHeading', 'Official Government Application Portal')}</span>
            </div>
            <div className="text-base font-extrabold text-slate-900">
              {portalName}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono bg-white px-3 py-1.5 rounded-xl border border-saffron-200/80 text-slate-700 break-all">
              <Lock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold text-emerald-700">{targetUrl}</span>
            </div>
            <p className="text-xs text-slate-600">
              {t('applyModal.forSchemeLabel', 'Scheme')}: <strong>{schemeNameDisplay}</strong>
            </p>
          </div>

          {/* Dynamic Documents Checklist to Have Ready */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-saffron-600" />
              {t('applyModal.docsReadyTitle', 'Checklist of Documents to Keep Ready')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {docs.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                  <span className="font-semibold text-slate-800 leading-snug">
                    {localizeDocumentName(doc, t)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Prominent Free Application & Middlemen Warning */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3 text-xs leading-relaxed">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-amber-900 mb-0.5">
                {t('applyModal.freeWarningTitle', 'Zero Fee Guarantee — Beware of Fraud')}
              </strong>
              <span>
                {t('applyModal.freeWarning', 'Applying through the official government portal is 100% free. Never pay money to agents, brokers, or middlemen.')}
              </span>
            </div>
          </div>

          {/* Official Governance & Non-Scraping Disclaimer */}
          <div className="text-[11px] text-slate-500 leading-relaxed p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong>{t('applyModal.disclaimerTitle', 'Official Disclaimer')}:</strong>{' '}
            {t(
              'applyModal.disclaimer',
              'SchemeBridge is an informational enablement platform. It does not submit your application or view credentials you enter on government portals. Final credit assessment and sanction are governed solely by the respective Channelising Agency.'
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 rounded-b-3xl flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            {t('applyModal.cancel', 'Cancel')}
          </button>

          <button
            type="button"
            onClick={handleContinue}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t('applyModal.continueToPortal', 'Continue to Official Portal')}</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
