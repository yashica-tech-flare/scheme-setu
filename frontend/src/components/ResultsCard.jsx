import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  BookmarkCheck
} from 'lucide-react';

export default function ResultsCard({ scheme, onSelectForEMI }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showDocs, setShowDocs] = useState(false);
  const [showReasons, setShowReasons] = useState(true); // Open by default to highlight match explanation

  const isHindi = i18n.language === 'hi';
  const displayName = isHindi && scheme.nameHi ? scheme.nameHi : (scheme.schemeName || scheme.name);
  const displayDesc = isHindi && scheme.descriptionHi ? scheme.descriptionHi : (scheme.purpose || scheme.description);

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

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
      {/* Top Banner with Scheme Title, Verified Badge, and Match Score */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-saffron-100 text-saffron-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                NSFDC Concessional Scheme
              </span>

              {scheme.category && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  {scheme.category}
                </span>
              )}

              {scheme.genderSpecific === 'women' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-pink-100 text-pink-700 border border-pink-200">
                  Women Only (MSY)
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-slate-900 leading-snug">
              {displayName}
            </h3>
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
            {t('results.officialSource')}: <strong className="text-slate-700">NSFDC Portal</strong>
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
                <span>Verify Source</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </>
          )}
        </div>
      </div>

      {/* Metric Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 bg-slate-50/70 border-b border-slate-100 text-sm">
        {/* Interest Rate */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-saffron-600" />
            {t('results.interestRate')}
          </span>
          <p className="text-lg font-bold text-slate-900">
            {scheme.interestRate}% <span className="text-xs font-normal text-slate-500">p.a.</span>
          </p>
        </div>

        {/* Max Loan Amount */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5 text-saffron-600" />
            {t('results.maxLoan')}
          </span>
          <p className="text-lg font-bold text-slate-900">
            {formatRupee(scheme.maxLoanAmount)}
          </p>
        </div>

        {/* Moratorium Grace */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            {t('results.moratorium')}
          </span>
          <p className="text-lg font-bold text-emerald-700">
            {scheme.moratoriumMonths || 0} {t('results.months')}
          </p>
        </div>

        {/* Tenure Months */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            {t('results.tenure')}
          </span>
          <p className="text-lg font-bold text-slate-900">
            {scheme.repaymentPeriodMonths || scheme.tenureMonthsMax || 60} {t('results.months')}
          </p>
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
                  <span className="leading-snug">{reason}</span>
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
                  <span>{doc}</span>
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

      {/* Action Buttons */}
      <div className="p-4 sm:p-6 bg-white flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => onSelectForEMI && onSelectForEMI(scheme)}
          className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Calculator className="w-4 h-4 text-saffron-600" />
          {t('results.exploreEmi')}
        </button>

        <button
          type="button"
          onClick={handleLocatePartners}
          className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-saffron-600 hover:bg-saffron-700 shadow-md shadow-saffron-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <MapPin className="w-4 h-4" />
          {t('results.locatePartners')}
        </button>
      </div>
    </div>
  );
}
