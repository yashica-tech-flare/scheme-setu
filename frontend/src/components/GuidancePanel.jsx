import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileCheck,
  CheckSquare,
  Square,
  Printer,
  FileText,
  AlertCircle,
  HelpCircle,
  Clock,
  Landmark,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';

export default function GuidancePanel({ scheme, partner }) {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';

  const [checkedDocs, setCheckedDocs] = useState({});

  // Reset checked docs state when scheme changes
  useEffect(() => {
    if (scheme) {
      const initial = {};
      const schemeDocs = scheme.requiredDocuments || scheme.documentsRequired || [];
      schemeDocs.forEach((doc, idx) => {
        initial[idx] = idx < 2; // Check first two by default
      });
      setCheckedDocs(initial);
    } else {
      setCheckedDocs({
        caste: true,
        income: true,
        aadhaar: false,
        dpr: false,
        quotation: false,
        admission: false
      });
    }
  }, [scheme]);

  const toggleDoc = (key) => {
    setCheckedDocs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const genericDocs = [
    {
      key: 'caste',
      title: t('guidance.doc1Title'),
      desc: t('guidance.doc1Desc'),
      authority: 'Tehsildar / Sub-Divisional Magistrate (SDM)'
    },
    {
      key: 'income',
      title: t('guidance.doc2Title'),
      desc: t('guidance.doc2Desc'),
      authority: 'Revenue Officer (Must be ≤ ₹5 Lakh/yr)'
    },
    {
      key: 'aadhaar',
      title: t('guidance.doc3Title'),
      desc: t('guidance.doc3Desc'),
      authority: 'UIDAI + Bank Passbook (DBT Linked)'
    },
    {
      key: 'dpr',
      title: t('guidance.doc4Title'),
      desc: t('guidance.doc4Desc'),
      authority: 'Project Profile / Business Cost Estimates'
    },
    {
      key: 'quotation',
      title: t('guidance.doc5Title'),
      desc: t('guidance.doc5Desc'),
      authority: 'Authorized GST Vendor / Dealer Proforma'
    },
    {
      key: 'admission',
      title: t('guidance.doc6Title'),
      desc: t('guidance.doc6Desc'),
      authority: 'College / University (Education Loans only)'
    }
  ];

  const schemeDocsList = (scheme?.requiredDocuments || scheme?.documentsRequired || []).map((doc, idx) => ({
    key: idx,
    title: doc,
    desc: getDocDescription(doc),
    authority: getDocAuthority(doc)
  }));

  function getDocDescription(docName) {
    if (/caste/i.test(docName)) return 'Original certificate verifying Scheduled Caste status with digital barcoded seal.';
    if (/income/i.test(docName)) return 'Current financial year revenue certificate confirming family income ≤ ₹5,00,000.';
    if (/aadhaar/i.test(docName)) return 'Aadhaar linked with mobile and active bank account enabled for direct subsidy credit (DBT).';
    if (/project report|dpr/i.test(docName)) return 'Standard 5-point project report outlining capital expenditure, working funds, and profit margins.';
    if (/quotation|invoice|proforma/i.test(docName)) return 'Official tax invoice estimate with GSTIN number from authorized dealer or machinery manufacturer.';
    if (/admission|marksheet|fee/i.test(docName)) return 'Confirmed institutional admission letter, official course fee schedule, and qualifying marksheets.';
    if (/permit|license/i.test(docName)) return 'Commercial transport badge or municipal shop trade establishment license.';
    return 'Official certified document required for physical sanction verification by the channel partner.';
  }

  function getDocAuthority(docName) {
    if (/caste/i.test(docName)) return 'Tehsildar / Sub-Divisional Magistrate (SDM)';
    if (/income/i.test(docName)) return 'Revenue Officer / District Administration';
    if (/aadhaar/i.test(docName)) return 'UIDAI & NPCI-Mapped Bank Branch';
    if (/project report|dpr/i.test(docName)) return 'Applicant / Chartered Accountant / Technical Consultant';
    if (/quotation/i.test(docName)) return 'Authorized GST Equipment Supplier';
    if (/admission|education/i.test(docName)) return 'Registrar of Recognized University / College';
    return 'Competent Regulatory Authority';
  }

  const activeDocs = scheme ? schemeDocsList : genericDocs;

  const handlePrint = () => {
    window.print();
  };

  const schemeNameDisplay = scheme
    ? (isHindi && scheme.nameHi ? scheme.nameHi : (scheme.schemeName || scheme.name))
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-saffron-400 text-xs font-bold uppercase tracking-wider mb-1">
            <FileCheck className="w-4 h-4" />
            Zero-Rejection Preparation
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
            {scheme ? `${t('guidance.schemeSpecificDocs')}` : t('guidance.title')}
          </h3>
          <p className="text-sm text-slate-300 mt-1">
            {scheme
              ? `${t('guidance.showingForScheme')} ${schemeNameDisplay}`
              : t('guidance.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Printer className="w-4 h-4 text-saffron-400" />
          {t('guidance.printSlip')}
        </button>
      </div>

      {/* Scheme-Specific Provenance & Authorized Agencies Banner */}
      {scheme && (
        <div className="bg-saffron-50/70 border-b border-saffron-200 p-4 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{schemeNameDisplay}</span>
            </div>
            {scheme.eligibility && (
              <p className="text-slate-600 max-w-2xl leading-relaxed">
                <strong>Eligibility Rule:</strong> {scheme.eligibility}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:items-end gap-1.5 flex-shrink-0">
            {scheme.channelizingAgencies && scheme.channelizingAgencies.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 font-medium">Channel Partners:</span>
                <span className="font-bold text-saffron-800">
                  {scheme.channelizingAgencies.join(', ')}
                </span>
              </div>
            )}
            {scheme.sourceUrl && (
              <a
                href={scheme.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-saffron-700 hover:text-saffron-800 font-bold inline-flex items-center gap-1 hover:underline"
              >
                <span>{t('guidance.verifiedSourceLink')}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      <div className="p-6 sm:p-8 space-y-8">
        {/* Document Checklist Items */}
        <div>
          <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-saffron-600"></span>
            {scheme ? `${schemeNameDisplay} — Required Documents (${activeDocs.length})` : t('guidance.essentialDocs')}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDocs.map((d) => {
              const isChecked = checkedDocs[d.key];
              return (
                <div
                  key={d.key}
                  onClick={() => toggleDoc(d.key)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isChecked
                      ? 'bg-emerald-50/50 border-emerald-300 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="mt-0.5 text-emerald-600">
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">
                      {d.title}
                    </span>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {d.desc}
                    </p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-500">
                      Issuer: {d.authority}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5-Step Sanction Roadmap */}
        <div className="pt-6 border-t border-slate-200">
          <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            {t('guidance.stepsTitle')}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center space-y-1 text-xs"
              >
                <div className="w-7 h-7 rounded-full bg-slate-900 text-saffron-400 font-bold flex items-center justify-center mb-1">
                  {step}
                </div>
                <span className="font-semibold text-slate-800 leading-snug">
                  {t(`guidance.step${step}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
