import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import GuidancePanel from '../components/GuidancePanel';
import { api } from '../api/client';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  PhoneCall,
  Download,
  Printer,
  FileCheck2,
  Briefcase,
  ExternalLink,
  Layers
} from 'lucide-react';

export default function Guide() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isHindi = i18n.language === 'hi';

  const [schemes, setSchemes] = useState([]);
  const [selectedSchemeName, setSelectedSchemeName] = useState('');
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [loading, setLoading] = useState(true);

  // Parse URL query parameter for ?scheme=...
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const schemeParam = params.get('scheme');
    if (schemeParam) {
      setSelectedSchemeName(schemeParam);
    }
  }, [location.search]);

  // Load all schemes to power the dropdown and get details
  useEffect(() => {
    const fetchAllSchemes = async () => {
      try {
        setLoading(true);
        const data = await api.getSchemes();
        setSchemes(data || []);

        // If schemeParam was provided, find it
        const params = new URLSearchParams(location.search);
        const schemeParam = params.get('scheme');

        if (schemeParam && data && data.length > 0) {
          const matched = data.find(
            (s) => (s.schemeName || s.name) === schemeParam || s._id === schemeParam
          );
          if (matched) {
            setSelectedScheme(matched);
            setSelectedSchemeName(matched.schemeName || matched.name);
          }
        }
      } catch (err) {
        console.error('Failed to load schemes for guide:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllSchemes();
  }, [location.search]);

  const handleSchemeChange = (schemeName) => {
    setSelectedSchemeName(schemeName);
    if (!schemeName) {
      setSelectedScheme(null);
      navigate('/guide', { replace: true });
      return;
    }

    const found = schemes.find((s) => (s.schemeName || s.name) === schemeName || s._id === schemeName);
    setSelectedScheme(found || null);
    navigate(`/guide?scheme=${encodeURIComponent(schemeName)}`, { replace: true });
  };

  const isTermLoanOrHighValue = selectedScheme
    ? (selectedScheme.maxLoanAmount > 200000 || selectedScheme.category === 'business')
    : true;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Intro Header */}
      <div className="space-y-4 border-b border-slate-200 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-saffron-50 text-saffron-800 border border-saffron-200 mb-2">
              <FileText className="w-3.5 h-3.5 text-saffron-600" />
              Official NSFDC Beneficiary Handbook
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('guidance.title')}
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl mt-1">
              Everything you need to navigate the concessional loan lifecycle—from qualifying criteria and document readiness to physical loan sanction without intermediaries.
            </p>
          </div>

          {/* Scheme Quick Selector Dropdown */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 flex flex-col gap-1 sm:w-72">
            <label htmlFor="scheme-guide-select" className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-saffron-600" />
              {t('guidance.selectScheme')}:
            </label>
            <select
              id="scheme-guide-select"
              value={selectedSchemeName}
              onChange={(e) => handleSchemeChange(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-saffron-500"
            >
              <option value="">{t('guidance.allSchemesOption')}</option>
              {schemes.map((s) => {
                const sName = s.schemeName || s.name;
                const sDisplay = isHindi && s.nameHi ? s.nameHi : sName;
                return (
                  <option key={s._id || sName} value={sName}>
                    {sDisplay}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Main Interactive Checklist Panel (Scheme-Specific or Generic) */}
      <GuidancePanel scheme={selectedScheme} />

      {/* DPR (Detailed Project Report) Advisory Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-saffron-50 text-saffron-600 flex-shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Detailed Project Report (DPR) Guidance
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {isTermLoanOrHighValue
                ? 'For Term Loans & Capital Projects (> ₹2 Lakh), banks and State Channelising Agencies require a bankable DPR. Scheme Setu provides the standard 3-pillar template:'
                : 'For Micro Credit & MSY (≤ ₹1.4 Lakh), a complex DPR is waived! A simple self-declaration and vendor invoice quotation suffices for instant sanction.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-900 block">1. Business Profile & Promoter KYC</span>
            <p className="text-slate-600">
              Background of applicant, artisanal or technical skill proof, SC caste certificate, and Aadhaar DBT linkage.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-900 block">2. Fixed Capital & Machinery Cost</span>
            <p className="text-slate-600">
              Verified tax invoice quotations from GST-registered vendors for equipment, furniture, electricals, or commercial vehicle.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-900 block">3. Working Capital & Cashflow Forecast</span>
            <p className="text-slate-600">
              Projected monthly sales turnover, raw material expenditure, utility costs, and net monthly surplus for installment repayments.
            </p>
          </div>
        </div>
      </div>

      {/* Helpline and Grievance Redressal Card */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-saffron-400 text-xs font-bold uppercase">
            <PhoneCall className="w-4 h-4" />
            National SC Grievance & Helpdesk
          </div>
          <h4 className="text-xl font-bold">Need assistance with channel partner branches?</h4>
          <p className="text-xs text-slate-300">
            Toll-Free National Helpline: 1800-11-2001 | Email: helpdesk@nsfdc.nic.in | Portal: nsfdc.nic.in
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-6 py-3 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer flex-shrink-0"
        >
          <Printer className="w-4 h-4" />
          Print Document Checklist
        </button>
      </div>
    </div>
  );
}
