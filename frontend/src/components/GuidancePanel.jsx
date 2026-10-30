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
  Landmark,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { localizeSchemeName, localizeDocumentName } from '../utils/localizationHelper';
import VoiceAssistant from './VoiceAssistant';
import fallbackSchemes from '../data/fallbackSchemes.json';

export default function GuidancePanel({ scheme, partner, inGuidePage = false }) {
  const { t, i18n } = useTranslation();

  const [selectedSchemeName, setSelectedSchemeName] = useState(
    scheme?.schemeName || scheme?.name || ''
  );

  useEffect(() => {
    if (scheme) {
      setSelectedSchemeName(scheme.schemeName || scheme.name || '');
    }
  }, [scheme]);

  // Load ticks from localStorage keyed by document ID with safe try/catch
  const [checkedDocs, setCheckedDocs] = useState(() => {
    try {
      const stored = localStorage.getItem('schemebridge_checklist');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const toggleDoc = (key) => {
    setCheckedDocs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('schemebridge_checklist', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const getSchemeClipId = (s) => {
    if (!s) return null;
    const raw = (s.schemeName || s.name || s.id || '').toLowerCase();
    if (raw.includes('mahila') || raw.includes('msy') || raw.includes('samriddhi')) return 'scheme_msy';
    if (raw.includes('micro') || raw.includes('mcf')) return 'scheme_mcf';
    if (raw.includes('term loan') || raw.includes('tls')) return 'scheme_tls';
    if (raw.includes('laghu') || raw.includes('lvy') || raw.includes('vyavasay') || raw.includes('vyavsay')) return 'scheme_lvy';
    if (raw.includes('green') || raw.includes('gbs')) return 'scheme_gbs';
    if (raw.includes('education') || raw.includes('els')) return 'scheme_els';
    if (raw.includes('vocational') || raw.includes('voctech') || raw.includes('technical') || raw.includes('vtls') || raw.includes('skill')) return 'scheme_voctech';
    return null;
  };

  const genericDocs = [
    {
      id: 'doc_caste',
      key: 'doc_caste',
      title: t('guidance.doc1Title', 'Caste Certificate (SC)'),
      desc: t('guidance.doc1Desc', 'Valid Scheduled Caste certificate issued by competent authority.'),
      authority: 'Tehsildar / Sub-Divisional Magistrate (SDM)',
      mandatory: true,
      condition: null
    },
    {
      id: 'doc_income',
      key: 'doc_income',
      title: t('guidance.doc2Title', 'Family Income Certificate (≤ ₹5L/yr)'),
      desc: t('guidance.doc2Desc', 'Annual family income certificate confirming family income is ≤ ₹5,00,000 per annum.'),
      authority: 'Revenue Officer / Tehsildar',
      mandatory: true,
      condition: null
    },
    {
      id: 'doc_aadhaar',
      key: 'doc_aadhaar',
      title: t('guidance.doc3Title', 'Aadhaar Card (DBT-Linked)'),
      desc: t('guidance.doc3Desc', 'Aadhaar linked to direct benefit transfer enabled bank account.'),
      authority: 'UIDAI',
      mandatory: true,
      condition: null
    },
    {
      id: 'doc_bank_passbook',
      key: 'doc_bank_passbook',
      title: t('guidance.docBankPassbook', 'Active Bank Passbook with IFSC'),
      desc: t('guidance.docBankPassbookDesc', 'Active bank account passbook or statement with account number and IFSC code.'),
      authority: 'Scheduled Commercial Bank / RRB',
      mandatory: true,
      condition: null
    },
    {
      id: 'doc_dpr',
      key: 'doc_dpr',
      title: t('guidance.doc4Title', 'Detailed Project Report (DPR)'),
      desc: t('guidance.doc4Desc', 'Bankable project profile with three year cash flow estimates.'),
      authority: 'Technical Consultant / Chartered Accountant',
      mandatory: true,
      condition: null
    },
    {
      id: 'doc_quotation',
      key: 'doc_quotation',
      title: t('guidance.doc5Title', 'Equipment / Machinery Quotation'),
      desc: t('guidance.doc5Desc', 'Official price quotation for machinery or equipment from GST registered supplier.'),
      authority: 'Authorized Equipment Supplier',
      mandatory: true,
      condition: null
    }
  ];

  // Active scheme determination
  const activeScheme = (scheme && (scheme.schemeName === selectedSchemeName || scheme.name === selectedSchemeName))
    ? scheme
    : (fallbackSchemes.find(s => (s.schemeName || s.name) === selectedSchemeName) || scheme);

  const schemeNameDisplay = activeScheme
    ? localizeSchemeName(activeScheme, i18n.language)
    : t('guidance.allSchemesOption', 'All Schemes / General Document Checklist');

  const rawDocs = activeScheme?.requiredDocuments || activeScheme?.documentsRequired || null;

  const activeDocs = rawDocs
    ? rawDocs.map((doc, idx) => {
        if (typeof doc === 'object') {
          return {
            id: doc.id || `doc_${idx}`,
            key: doc.id || `doc_${idx}`,
            title: localizeDocumentName(doc, t),
            desc: doc.description || doc.desc || '',
            authority: doc.issuer || doc.authority || 'Competent Regulatory Authority',
            mandatory: doc.mandatory !== false,
            condition: doc.condition || null
          };
        }
        return {
          id: `doc_${idx}`,
          key: `doc_${idx}`,
          title: localizeDocumentName(doc, t),
          desc: String(doc),
          authority: 'Competent Regulatory Authority',
          mandatory: true,
          condition: null
        };
      })
    : genericDocs;

  // Progress computation
  const mandatoryDocs = activeDocs.filter((d) => d.mandatory);
  const readyMandatoryCount = mandatoryDocs.filter((d) => Boolean(checkedDocs[d.id || d.key])).length;
  const totalMandatoryCount = mandatoryDocs.length;
  const progressPercent = totalMandatoryCount > 0 ? Math.round((readyMandatoryCount / totalMandatoryCount) * 100) : 0;

  const readyDocs = activeDocs.filter((d) => Boolean(checkedDocs[d.id || d.key]));
  const pendingDocs = activeDocs.filter((d) => !checkedDocs[d.id || d.key]);

  const handlePrint = () => {
    window.print();
  };

  const schemeClipId = getSchemeClipId(activeScheme);

  const guideVoiceText = t('voice_assistant.guide_summary', {
    schemeName: schemeNameDisplay,
    docCount: activeDocs.length,
    docList: activeDocs.slice(0, 4).map((d, i) => `${i + 1}. ${d.title}`).join('. ')
  });

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Printable Verification Slip (Visible ONLY when printing) */}
      <div className="hidden print:block p-8 font-sans text-black bg-white" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                SchemeBridge
              </h1>
              <p className="text-xs uppercase font-bold tracking-wider text-slate-600">
                NSFDC Concessional Loan — Document Readiness Verification Slip
              </p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold text-slate-900">{t('guidance.slipDate', 'Verification Date')}:</p>
              <p className="text-slate-700">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-300 p-4 rounded-lg mb-6">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-1">
            {t('guidance.selectedSchemeHeading', 'Target Scheme')}: {schemeNameDisplay}
          </h2>
          <p className="text-xs text-slate-700">
            <strong>{t('guidance.readinessStatus', 'Document Readiness Status')}:</strong> {readyMandatoryCount} of {totalMandatoryCount} {t('guidance.mandatoryDocsReady', 'mandatory documents confirmed ready')} ({progressPercent}%)
          </p>
        </div>

        <div className="space-y-5 mb-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-300 pb-1 mb-2">
              ✓ {t('guidance.readyDocs', 'Confirmed Ready Documents')} ({readyDocs.length})
            </h3>
            {readyDocs.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No documents marked ready yet.</p>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-1 font-bold w-1/3">Document Name</th>
                    <th className="py-1 font-bold w-1/3">Requirement Type</th>
                    <th className="py-1 font-bold w-1/3">Issuing Authority</th>
                  </tr>
                </thead>
                <tbody>
                  {readyDocs.map((doc, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-900">[✓] {doc.title}</td>
                      <td className="py-1.5 text-slate-600">{doc.mandatory ? 'Mandatory' : 'Conditional'}</td>
                      <td className="py-1.5 text-slate-600">{doc.authority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-800 border-b border-amber-300 pb-1 mb-2">
              ⚠️ {t('guidance.pendingDocs', 'Missing / Pending Documents to Collect')} ({pendingDocs.length})
            </h3>
            {pendingDocs.length === 0 ? (
              <p className="text-xs text-emerald-700 font-bold">All documents confirmed ready! Keep original certificates and 2 photocopies ready for physical verification.</p>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-1 font-bold w-1/3">Document Name</th>
                    <th className="py-1 font-bold w-1/3">Requirement</th>
                    <th className="py-1 font-bold w-1/3">Issuing Authority</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDocs.map((doc, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-900">[ ] {doc.title}</td>
                      <td className="py-1.5 text-slate-600">
                        {doc.mandatory ? 'Mandatory' : (doc.condition || 'Conditional')}
                      </td>
                      <td className="py-1.5 text-slate-600">{doc.authority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="border-t border-slate-300 pt-4 text-[10px] text-slate-600 space-y-1 leading-relaxed">
          <p>
            <strong>{t('guidance.disclaimerTitle', 'Official Notice & Non-Retention Notice')}:</strong>{' '}
            {t('guidance.slipNote', 'This self-check verification slip is generated for the applicant\'s personal preparation. Final eligibility, original document verification, and loan sanction are governed solely by the designated Channelising Agency (SCA/Bank). SchemeBridge does not store, transmit, or record any personal identification data or Aadhaar numbers.')}
          </p>
          <p className="text-slate-500">
            National SC Grievance & Helpdesk Toll-Free: 1800-11-2001 | Portal: nsfdc.nic.in / pmsuraj.dosje.gov.in
          </p>
        </div>
      </div>

      {/* Screen Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-saffron-400 text-xs font-bold uppercase tracking-wider mb-1">
            <FileCheck className="w-4 h-4" />
            {t('guidance.zeroRejectionPrep', 'Zero-Rejection Preparation')}
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
            {activeScheme
              ? `${t('guidance.schemeSpecificDocs', 'Scheme-Specific Document Requirements')}: ${schemeNameDisplay}`
              : t('guidance.essentialDocs', 'Mandatory Documents Checklist')}
          </h3>
          <p className="text-sm text-slate-300 mt-1">
            {activeScheme
              ? `${t('guidance.showingForScheme', 'Showing verified checklist for:')} ${schemeNameDisplay}`
              : t('guidance.selectSchemePrompt', 'Select a scheme below to view its tailored mandatory document checklist and verification rules.')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <VoiceAssistant
            variant="button"
            clipId={schemeClipId || 'doc_guidance_intro'}
            textToRead={guideVoiceText}
          />
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
          >
            <Printer className="w-4 h-4 text-saffron-400" />
            {t('guidance.printSlip', 'Print Verification Slip')}
          </button>
        </div>
      </div>

      {/* Interactive Scheme Switcher Bar */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 sm:px-8 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1">
          <Layers className="w-4 h-4 text-saffron-600 flex-shrink-0" />
          <label htmlFor="guidance-scheme-select" className="font-bold text-slate-700 whitespace-nowrap">
            {t('guidance.selectScheme', 'Select Scheme to View Documents')}:
          </label>
          <select
            id="guidance-scheme-select"
            value={selectedSchemeName}
            onChange={(e) => setSelectedSchemeName(e.target.value)}
            className="w-full max-w-md p-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-saffron-500 shadow-2xs"
          >
            <option value="">{t('guidance.allSchemesOption', 'All Schemes / General Document Checklist')}</option>
            {fallbackSchemes.map((s) => {
              const sName = s.schemeName || s.name;
              const sDisplay = localizeSchemeName(s, i18n.language);
              return (
                <option key={sName} value={sName}>
                  {sDisplay}
                </option>
              );
            })}
          </select>
        </div>

        {activeScheme && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">{t('guidance.channelPartners', 'Channel Partners')}:</span>
            <span className="font-bold text-saffron-800">
              {(activeScheme.channelizingAgencies || ['SCA', 'PSB', 'RRB']).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Mandatory Readiness Progress Bar */}
      <div className="p-4 sm:px-8 bg-slate-50/60 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {t('guidance.readinessProgress', 'Mandatory Document Readiness')}:
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {readyMandatoryCount} / {totalMandatoryCount} {t('guidance.readyBadge', 'Ready')} ({progressPercent}%)
            </span>
          </div>
          <span className="text-xs text-slate-500">
            {readyMandatoryCount === totalMandatoryCount
              ? `✓ ${t('guidance.allMandatoryReady', 'All mandatory documents confirmed ready!')}`
              : `${totalMandatoryCount - readyMandatoryCount} ${t('guidance.pendingMandatory', 'mandatory document(s) remaining')}`}
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* Document Checklist Items Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-saffron-600"></span>
              <span>
                {schemeNameDisplay} — {t('results.viewDocs', 'Documents')} ({activeDocs.length})
              </span>
            </h4>
            <span className="text-xs text-slate-500 italic">
              {t('guidance.tapToToggle', 'Tap any document to toggle your preparation status')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDocs.map((d) => {
              const isChecked = Boolean(checkedDocs[d.id || d.key]);
              return (
                <div
                  key={d.id || d.key}
                  onClick={() => toggleDoc(d.id || d.key)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isChecked
                      ? 'bg-emerald-50/60 border-emerald-300 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="mt-0.5 text-emerald-600 flex-shrink-0">
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`text-sm font-bold block ${isChecked ? 'text-emerald-950' : 'text-slate-900'}`}>
                            {d.title}
                          </span>
                          {d.mandatory ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              {t('guidance.mandatoryBadge', 'Mandatory')}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              {t('guidance.conditionalBadge', 'Conditional')}
                            </span>
                          )}
                        </div>
                        {d.condition && (
                          <p className="text-[11px] text-amber-800 font-medium">
                            {d.condition}
                          </p>
                        )}
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <VoiceAssistant
                          variant="mini"
                          clipId={d.id}
                          textToRead={`${d.title}. ${d.desc}. ${t('guidance.issuer', 'Issuer')}: ${d.authority}`}
                        />
                      </div>
                    </div>
                    {d.desc && (
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {d.desc}
                      </p>
                    )}
                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-500">
                      {t('guidance.issuer', 'Issuer')}: {d.authority}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5-Step Official Sanction Roadmap */}
        <div className="pt-6 border-t border-slate-200">
          <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            {t('guidance.stepsTitle', '5-Step Official Sanction Roadmap')}
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
