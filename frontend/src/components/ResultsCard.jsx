import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import { localizeSchemeName, localizeSchemeDesc, localizeMatchReason, localizeDocumentName } from '../utils/localizationHelper';
import { isValidGovernmentUrl } from '../utils/urlValidator';
import ApplyConfirmModal from './ApplyConfirmModal';
import fallbackPartners from '../data/fallbackPartners.json';
import {
  Award,
  Percent,
  IndianRupee,
  Clock,
  ShieldCheck,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calculator,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Building2,
  BookmarkCheck,
  Send,
  Info,
  Phone,
  Navigation,
  Printer
} from 'lucide-react';
import VoiceAssistant from './VoiceAssistant';

export default function ResultsCard({ scheme, selectedState = 'ALL', onSelectForEMI }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showDocs, setShowDocs] = useState(false);
  const [showReasons, setShowReasons] = useState(true); // Open by default to highlight match explanation
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [activeModalPortal, setActiveModalPortal] = useState(null);

  const displayName = localizeSchemeName(scheme, i18n.language);
  const displayDesc = localizeSchemeDesc(scheme, i18n.language);

  const formatRupee = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const schemeIdentifier = scheme.schemeName || scheme.name;

  const handleLocatePartners = () => {
    navigate(`/partners?scheme=${encodeURIComponent(schemeIdentifier)}`);
  };

  const handleOpenGuide = () => {
    navigate(`/guide?scheme=${encodeURIComponent(schemeIdentifier)}`);
  };

  const formattedDate = scheme.lastVerified
    ? new Date(scheme.lastVerified).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Oct 2026';

  const docs = scheme.requiredDocuments || scheme.documentsRequired || [];
  const agencies = scheme.channelizingAgencies || [];

  const schemeVoiceText = t('voice_assistant.scheme_summary', {
    schemeName: displayName,
    maxAmount: (scheme.maxLoanAmount || 0).toLocaleString('en-IN'),
    rate: scheme.interestRate || '4–9',
    moratorium: scheme.moratoriumMonths || scheme.moratoriumPeriodMonths || 6
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
      {/* Top Banner with Scheme Title, Verified Badge, and Match Score */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-saffron-100 text-saffron-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t('results.badgeConcessional', 'NSFDC Concessional Scheme')}
              </span>

              {scheme.category && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  {scheme.category}
                </span>
              )}

              {scheme.genderSpecific === 'women' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-pink-100 text-pink-700 border border-pink-200">
                  {t('results.badgeWomenOnly', 'Women Only (MSY)')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900 leading-snug">
                {displayName}
              </h3>
              <VoiceAssistant
                variant="mini"
                textToRead={schemeVoiceText}
                className="flex-shrink-0"
              />
            </div>
          </div>

          {/* Match Score Badge */}
          {scheme.matchScore !== undefined && (
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center min-w-[76px] flex-shrink-0">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                {t('results.matchScore')}
              </span>
              <span className="text-2xl font-extrabold text-emerald-600">
                {scheme.matchScore}%
              </span>
            </div>
          )}
        </div>

        {displayDesc && (
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            {displayDesc}
          </p>
        )}

        {/* Source & Verified Metadata Attribution Line */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {t('results.officialSource')}: <strong className="text-slate-700">{t('results.sourcePortal', 'NSFDC Portal')}</strong>
          </span>
          <span>&bull;</span>
          <span>
            {t('results.verifiedDate')}: <strong className="text-slate-700">{formattedDate}</strong>
          </span>
          {scheme.sourceUrl && (
            <>
              <span>&bull;</span>
              <a
                href={scheme.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-saffron-600 hover:text-saffron-700 font-semibold inline-flex items-center gap-1 hover:underline"
              >
                <span>{t('results.verifySource', 'Verify Source')}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </>
          )}
        </div>
      </div>

      {/* Metric Highlights Grid */}
      <div className="grid grid-cols-2 gap-4 p-5 sm:p-6 bg-slate-50/70 border-b border-slate-100 text-sm">
        {/* Interest Rate */}
        <div className="flex flex-col justify-start min-w-0 space-y-1">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 leading-normal break-words">
            <Percent className="w-3.5 h-3.5 text-saffron-600 flex-shrink-0" />
            <span className="break-words">{t('results.interestRate')}</span>
          </span>
          <div className="flex items-baseline flex-wrap gap-1 text-slate-900">
            <span className="text-lg font-bold leading-tight">{scheme.interestRate}%</span>
            <span className="text-xs font-normal text-slate-500">{t('results.pa', 'p.a.')}</span>
          </div>
        </div>

        {/* Max Loan Amount */}
        <div className="flex flex-col justify-start min-w-0 space-y-1">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 leading-normal break-words">
            <IndianRupee className="w-3.5 h-3.5 text-saffron-600 flex-shrink-0" />
            <span className="break-words">{t('results.maxLoan')}</span>
          </span>
          <div className="flex items-baseline flex-wrap gap-1 text-slate-900">
            <span className="text-lg font-bold leading-tight">{formatRupee(scheme.maxLoanAmount)}</span>
          </div>
        </div>

        {/* Moratorium Grace */}
        <div className="flex flex-col justify-start min-w-0 space-y-1">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 leading-normal break-words">
            <Clock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="break-words">{t('results.moratorium')}</span>
          </span>
          <div className="flex items-baseline flex-wrap gap-1 text-emerald-700">
            <span className="text-lg font-bold leading-tight">{scheme.moratoriumMonths || 0}</span>
            <span className="text-xs font-medium text-emerald-600">{t('results.months')}</span>
          </div>
        </div>

        {/* Tenure Months */}
        <div className="flex flex-col justify-start min-w-0 space-y-1">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 leading-normal break-words">
            <Calendar className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span className="break-words">{t('results.tenure')}</span>
          </span>
          <div className="flex items-baseline flex-wrap gap-1 text-slate-900">
            <span className="text-lg font-bold leading-tight">{scheme.repaymentPeriodMonths || scheme.tenureMonthsMax || 60}</span>
            <span className="text-xs font-normal text-slate-500">{t('results.months')}</span>
          </div>
        </div>
      </div>

      {/* Authorized Channelizing Agencies Badge Line */}
      {agencies.length > 0 && (
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            {t('results.channelAgencies')}:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {agencies.map((agency) => (
              <span
                key={agency}
                className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-white border border-slate-300 text-slate-800 shadow-2xs"
              >
                {agency}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Subsidy Highlight */}
      {scheme.subsidyDetails && (
        <div className="px-6 py-3 bg-amber-50/60 border-b border-amber-100 text-xs text-amber-900 flex items-start gap-2">
          <Award className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>{t('results.subsidyInfo')}:</strong> {scheme.subsidyDetails}
          </span>
        </div>
      )}

      {/* Collapsible: "Why this scheme?" Match Explanations */}
      {scheme.matchReasons && scheme.matchReasons.length > 0 && (
        <div className="border-b border-slate-100 bg-emerald-50/30">
          <button
            type="button"
            onClick={() => setShowReasons(!showReasons)}
            className="w-full px-6 py-2.5 text-xs font-bold text-emerald-900 hover:bg-emerald-50/60 flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{t('results.whyThisScheme')} ({scheme.matchReasons.length} {t('results.matchReasonsTitle')})</span>
            </span>
            {showReasons ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showReasons && (
            <div className="px-6 py-3 space-y-2 text-xs text-slate-700 bg-white/80 border-t border-emerald-100/60 animate-fadeIn">
              {scheme.matchReasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{localizeMatchReason(reason, t, i18n.language)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Document Toggle Section */}
      {docs.length > 0 && (
        <div className="border-b border-slate-100">
          <button
            type="button"
            onClick={() => setShowDocs(!showDocs)}
            className="w-full px-6 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-between bg-slate-50/30 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              {t('results.viewDocs')} ({docs.length})
            </span>
            {showDocs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDocs && (
            <div className="px-6 py-3 bg-slate-50 text-xs text-slate-700 space-y-2 animate-fadeIn">
              {docs.map((doc, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <BookmarkCheck className="w-3.5 h-3.5 text-saffron-600 flex-shrink-0" />
                  <span>{localizeDocumentName(doc, t)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleOpenGuide}
                  className="text-xs font-bold text-saffron-600 hover:text-saffron-700 underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{t('results.viewInGuide')} &rarr;</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons & Official Application Route */}
      <div className="p-4 sm:p-6 bg-white space-y-3 border-t border-slate-100">
        {(() => {
          const rawApplyMode = scheme.applyMode || 'offline';
          const hasValidApplyUrl = scheme.applyUrl && isValidGovernmentUrl(scheme.applyUrl);
          const effectiveApplyMode = (rawApplyMode === 'online' && !hasValidApplyUrl) ? 'offline' : rawApplyMode;
          const canApplyOnline = (effectiveApplyMode === 'online' || effectiveApplyMode === 'both') && hasValidApplyUrl;
          const canApplyBranch = effectiveApplyMode === 'offline' || effectiveApplyMode === 'both';

          const verifiedApplyDate = scheme.applyUrlVerified
            ? new Date(scheme.applyUrlVerified).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : formattedDate;

          const stateLinks = (scheme.stateApplyLinks || []).filter(l => isValidGovernmentUrl(l.url));

          // Find state-specific link if state filter is active
          const matchingStateLink = (selectedState && selectedState !== 'ALL')
            ? stateLinks.find(l =>
                l.stateCode === selectedState ||
                l.state?.toLowerCase() === selectedState?.toLowerCase() ||
                (selectedState === 'GJ' && l.state === 'Gujarat') ||
                (selectedState === 'DL' && l.state === 'Delhi') ||
                (selectedState === 'OD' && l.state === 'Odisha')
              )
            : null;

          // Find nearest/relevant partner branch for offline block
          const relevantPartner = (() => {
            const sName = scheme.schemeName || scheme.name;
            if (selectedState && selectedState !== 'ALL') {
              const stateMatch = fallbackPartners.find(p =>
                (p.state?.toLowerCase().includes(selectedState.toLowerCase()) ||
                 p.city?.toLowerCase().includes(selectedState.toLowerCase())) &&
                (p.schemesHandled?.includes(sName) || p.type === 'SCA')
              ) || fallbackPartners.find(p =>
                p.state?.toLowerCase().includes(selectedState.toLowerCase()) ||
                p.city?.toLowerCase().includes(selectedState.toLowerCase())
              );
              if (stateMatch) return stateMatch;
            }
            return fallbackPartners.find(p => p.schemesHandled?.includes(sName) && p.type === 'SCA')
              || fallbackPartners.find(p => p.schemesHandled?.includes(sName))
              || fallbackPartners[0];
          })();

          const mapsUrl = relevantPartner
            ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(relevantPartner.address || relevantPartner.name)}`
            : null;

          return (
            <div className="space-y-3">
              {canApplyOnline ? (
                /* Online Route(s) */
                <div className="space-y-2">
                  {matchingStateLink ? (
                    /* Specific State Portal Available for Selected State */
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModalPortal(matchingStateLink);
                          setIsApplyModalOpen(true);
                        }}
                        className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{t('results.applyOnlineState', { state: matchingStateLink.state })}</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 px-1">
                        <span className="font-semibold text-emerald-800">
                          {matchingStateLink.portalName}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveModalPortal({ url: scheme.applyUrl, portalName: scheme.applyPortalName });
                            setIsApplyModalOpen(true);
                          }}
                          className="text-saffron-700 hover:text-saffron-800 font-bold underline cursor-pointer"
                        >
                          {t('results.applyOnlineNational', 'Or apply on National PM-SURAJ')} &rarr;
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* National PM-SURAJ Route */
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModalPortal({ url: scheme.applyUrl, portalName: scheme.applyPortalName });
                          setIsApplyModalOpen(true);
                        }}
                        className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <span>{t('results.applyOnline', 'Apply Online')}</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      {/* Under the button: Portal name, verification date, and notes */}
                      <div className="mt-2 text-[11px] text-slate-500 space-y-1 px-1">
                        <div className="flex flex-wrap items-center justify-between gap-1 text-slate-700">
                          <span className="font-semibold text-emerald-800 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            {scheme.applyPortalName || t('results.pmSurajPortal', 'PM-SURAJ Official Portal')}
                          </span>
                          <span className="text-slate-500">
                            {t('results.linkVerifiedOn', 'Link last verified on')} <strong>{verifiedApplyDate}</strong>
                          </span>
                        </div>
                        {scheme.applyNotes && (
                          <p className="text-slate-600 italic">
                            {scheme.applyNotes}
                          </p>
                        )}
                        {/* State Portals Available Chips */}
                        {stateLinks.length > 0 && selectedState === 'ALL' && (
                          <div className="pt-1 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-500">
                              {t('results.statePortalsAvailable', 'State Portals')}:
                            </span>
                            {stateLinks.map((sl, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => {
                                  setActiveModalPortal(sl);
                                  setIsApplyModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                              >
                                <span>{sl.state}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Secondary Branch and EMI Buttons for Online Schemes */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    {canApplyBranch && (
                      <button
                        type="button"
                        onClick={handleLocatePartners}
                        className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-saffron-800 bg-saffron-50 hover:bg-saffron-100 border border-saffron-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MapPin className="w-4 h-4 text-saffron-600" />
                        {t('results.applyAtBranch', 'Apply at a Branch')}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectForEMI && onSelectForEMI(scheme)}
                      className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Calculator className="w-4 h-4 text-saffron-600" />
                      {t('results.exploreEmi', 'Simulate Live EMI')}
                    </button>
                  </div>
                </div>
              ) : (
                /* Rich Offline Branch Action Block */
                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-br from-amber-50/80 via-slate-50 to-orange-50/50 rounded-2xl border border-amber-200/90 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-amber-200/60 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                        <Building2 className="w-4 h-4 text-saffron-600 flex-shrink-0" />
                        <span>{t('results.offlineOnlyTitle', 'Branch Application Route')}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        In-Person Route
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {scheme.applyNotes || t('results.offlineBranchExplanation', 'This scheme is applied for in person at the agency branch with course admission proof.')}
                    </p>

                    {/* Nearest Partner Branch Card */}
                    {relevantPartner && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-slate-900 leading-snug">
                              {relevantPartner.name}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {relevantPartner.address}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 flex-shrink-0">
                            {relevantPartner.type || 'SCA'}
                          </span>
                        </div>

                        {/* Partner Contact & Directions */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
                          {relevantPartner.contact && (
                            <a
                              href={`tel:${relevantPartner.contact.replace(/[^\d+]/g, '')}`}
                              className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{relevantPartner.contact}</span>
                            </a>
                          )}

                          {mapsUrl && (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
                            >
                              <Navigation className="w-3.5 h-3.5 text-blue-600" />
                              <span>{t('results.getDirections', 'Directions')}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Required Documents Checklist Chips */}
                    {docs.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                          {t('applyModal.docsReadyTitle', 'Carry these documents to the branch')}:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {docs.slice(0, 4).map((d, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md shadow-2xs"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                              {localizeDocumentName(d, t)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Primary & Secondary Buttons for Offline Route */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleLocatePartners}
                      className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-saffron-500 via-saffron-600 to-amber-600 hover:from-saffron-600 hover:to-amber-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{t('results.findNearestBranch', 'Find Nearest Branch')}</span>
                    </button>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>{t('results.printSlip', 'Print Verification Slip')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectForEMI && onSelectForEMI(scheme)}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Calculator className="w-3.5 h-3.5 text-saffron-600" />
                        <span>{t('results.exploreEmi', 'Simulate Live EMI')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Confirmation Modal before leaving SchemeBridge */}
      <ApplyConfirmModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        scheme={scheme}
        targetPortal={activeModalPortal}
      />
    </div>
  );
}
