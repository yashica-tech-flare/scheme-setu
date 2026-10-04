import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import { recommendLocally } from '../utils/localRuleEngine';
import {
  Sparkles,
  AlertTriangle,
  IndianRupee,
  Briefcase,
  GraduationCap,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';

export default function SchemeForm({ onRecommendationComplete }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Form State
  const [isSC, setIsSC] = useState(true);
  const [income, setIncome] = useState(250000);
  const [isEducation, setIsEducation] = useState(false);
  const [projectType, setProjectType] = useState('small_business');
  const [projectCost, setProjectCost] = useState(140000);
  const [gender, setGender] = useState('female'); // defaults to female to showcase Mahila Samriddhi

  // UI State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Quick preset buttons
  const incomePresets = [
    { label: '₹1.5 Lakh', value: 150000 },
    { label: '₹2.5 Lakh', value: 250000 },
    { label: '₹3.5 Lakh', value: 350000 },
    { label: '₹4.8 Lakh', value: 480000 }
  ];

  const costPresets = isEducation
    ? [
        { label: '₹2 Lakh', value: 200000 },
        { label: '₹5 Lakh', value: 500000 },
        { label: '₹10 Lakh', value: 1000000 },
        { label: '₹20 Lakh', value: 2000000 }
      ]
    : [
        { label: '₹80,000 (Micro)', value: 80000 },
        { label: '₹1.4 Lakh (MSY/MCF)', value: 140000 },
        { label: '₹5 Lakh (Small Biz)', value: 500000 },
        { label: '₹25 Lakh (Term Loan)', value: 2500000 }
      ];

  const formatRupee = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handlePurposeChange = (edu) => {
    setIsEducation(edu);
    if (edu) {
      setProjectType('education');
      if (projectCost < 100000) setProjectCost(500000);
    } else {
      setProjectType('small_business');
      if (projectCost > 2000000) setProjectCost(500000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isSC) {
      setErrorMessage(t('form.categoryHelp'));
      return;
    }

    if (income > 500000) {
      setErrorMessage(t('form.incomeExceeded'));
      return;
    }

    setLoading(true);

    try {
      const payload = {
        income: Number(income),
        projectCost: Number(projectCost),
        projectType: isEducation ? 'education' : projectType,
        isEducation: Boolean(isEducation),
        gender
      };

      const results = await api.getRecommendations(payload);

      // Save to sessionStorage for refresh tolerance
      sessionStorage.setItem('scheme_setu_results', JSON.stringify(results));
      sessionStorage.setItem('scheme_setu_input', JSON.stringify(payload));

      if (onRecommendationComplete) {
        onRecommendationComplete(results, payload);
      } else {
        navigate('/results', { state: { results, input: payload } });
      }
    } catch (err) {
      console.warn('Network recommendation issue, executing local rule engine fallback:', err);
      try {
        const localResults = recommendLocally(payload);
        sessionStorage.setItem('scheme_setu_results', JSON.stringify(localResults));
        sessionStorage.setItem('scheme_setu_input', JSON.stringify(payload));
        if (onRecommendationComplete) {
          onRecommendationComplete(localResults, payload);
        } else {
          navigate('/results', { state: { results: localResults, input: payload } });
        }
      } catch (localErr) {
        console.error('Local fallback failed:', localErr);
        setErrorMessage('Unable to process recommendations right now. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="recommender" className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transition-all">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 px-5 py-4 text-white border-b border-slate-800">
        <div className="flex items-center gap-2 text-saffron-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          Rule-Based Matching Engine
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
          {t('form.title')}
        </h3>
        <p className="text-xs text-slate-300 mt-0.5">
          {t('form.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs sm:text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* 1. SC Category Confirmation */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              id="sc-checkbox"
              type="checkbox"
              checked={isSC}
              onChange={(e) => setIsSC(e.target.checked)}
              className="w-5 h-5 mt-0.5 text-saffron-600 rounded border-slate-300 focus:ring-saffron-500"
            />
            <div>
              <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                {t('form.isSC')}
                <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
              </span>
              <p className="text-xs text-slate-600 mt-0.5">
                {t('form.categoryHelp')}
              </p>
            </div>
          </label>
        </div>

        {/* 2. Annual Family Income */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <label htmlFor="income-range" className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              {t('form.incomeLabel')}
              <span className="text-[11px] font-normal text-slate-500">(&le; ₹5,00,000)</span>
            </label>
            <span className={`text-base sm:text-lg font-bold px-3 py-1 rounded-lg border ${
              income > 500000
                ? 'bg-red-50 text-red-700 border-red-300'
                : 'bg-emerald-50 text-emerald-700 border-emerald-300'
            }`}>
              {formatRupee(income)} /yr
            </span>
          </div>

          <input
            id="income-range"
            type="range"
            min="30000"
            max="600000"
            step="10000"
            value={income}
            onChange={(e) => setIncome(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-saffron-600"
          />

          <div className="flex flex-wrap gap-2 pt-1">
            {incomePresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setIncome(preset.value)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                  income === preset.value
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {income > 500000 && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              {t('form.incomeExceeded')}
            </p>
          )}
        </div>

        {/* 3. Loan Purpose: Business vs Education */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-semibold text-slate-900 block">
            {t('form.purposeType')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              id="purpose-business-btn"
              type="button"
              onClick={() => handlePurposeChange(false)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                !isEducation
                  ? 'border-saffron-600 bg-saffron-50/50 shadow-sm ring-1 ring-saffron-600 text-slate-900'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className={`p-2 rounded-lg ${!isEducation ? 'bg-saffron-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-xs sm:text-sm">{t('form.business')}</div>
                <div className="text-[11px] text-slate-500">Retail, trade, transport, MSME</div>
              </div>
            </button>

            <button
              id="purpose-education-btn"
              type="button"
              onClick={() => handlePurposeChange(true)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                isEducation
                  ? 'border-saffron-600 bg-saffron-50/50 shadow-sm ring-1 ring-saffron-600 text-slate-900'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className={`p-2 rounded-lg ${isEducation ? 'bg-saffron-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-xs sm:text-sm">{t('form.education')}</div>
                <div className="text-[11px] text-slate-500">Degree, technical, vocational</div>
              </div>
            </button>
          </div>
        </div>

        {/* 4. Enterprise Type (If Business selected) */}
        {!isEducation && (
          <div className="space-y-2">
            <label htmlFor="project-type-select" className="text-sm font-semibold text-slate-900 block">
              {t('form.projectTypeLabel')}
            </label>
            <select
              id="project-type-select"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-saffron-500 focus:border-transparent"
            >
              <option value="micro_project">{t('form.types.micro_project')}</option>
              <option value="small_business">{t('form.types.small_business')}</option>
              <option value="retail_services">{t('form.types.retail_services')}</option>
              <option value="manufacturing">{t('form.types.manufacturing')}</option>
              <option value="transport">{t('form.types.transport')}</option>
              <option value="agriculture">{t('form.types.agriculture')}</option>
              <option value="green_energy">{t('form.types.green_energy')}</option>
              <option value="vocational">{t('form.types.vocational')}</option>
            </select>
          </div>
        )}

        {/* 5. Beneficiary Gender (for Mahila Samriddhi and female rebates) */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-900 block">
            {t('form.genderLabel')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['female', 'male', 'other'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  gender === g
                    ? 'bg-saffron-600 text-white border-saffron-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t(`form.${g}`)}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Capital Need / Project Cost */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <label htmlFor="cost-range" className="text-xs sm:text-sm font-semibold text-slate-900">
              {t('form.costLabel')}
            </label>
            <span className="text-sm sm:text-base font-bold px-2.5 py-0.5 bg-saffron-50 text-saffron-700 rounded-lg border border-saffron-200">
              {formatRupee(projectCost)}
            </span>
          </div>

          <input
            id="cost-range"
            type="range"
            min={isEducation ? 50000 : 20000}
            max={isEducation ? 3000000 : 5000000}
            step={isEducation ? 50000 : 10000}
            value={projectCost}
            onChange={(e) => setProjectCost(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-saffron-600"
          />

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {costPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setProjectCost(preset.value)}
                className={`px-2.5 py-0.5 text-xs rounded-lg font-medium transition-all ${
                  projectCost === preset.value
                    ? 'bg-saffron-700 text-white font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          id="submit-recommend-btn"
          type="submit"
          disabled={loading || income > 500000 || !isSC}
          className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-saffron-600 via-saffron-500 to-amber-600 hover:from-saffron-700 hover:to-amber-700 shadow-md shadow-saffron-500/25 transition-all flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <span>{t('form.submitting')}</span>
          ) : (
            <>
              <span>{t('form.submit')}</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
