import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import {
  Calculator,
  IndianRupee,
  Clock,
  Percent,
  TrendingDown,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function EMISlider({ initialScheme }) {
  const { t } = useTranslation();

  const [principal, setPrincipal] = useState(initialScheme?.maxLoanAmount || 140000);
  const [annualRate, setAnnualRate] = useState(initialScheme?.interestRate || 6.5);
  const [tenureMonths, setTenureMonths] = useState(36);
  const [moratoriumMonths, setMoratoriumMonths] = useState(initialScheme?.moratoriumMonths || 3);

  const [emiData, setEmiData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync if initialScheme changes
  useEffect(() => {
    if (initialScheme) {
      if (initialScheme.maxLoanAmount) setPrincipal(initialScheme.maxLoanAmount);
      if (initialScheme.interestRate) setAnnualRate(initialScheme.interestRate);
      if (initialScheme.moratoriumMonths !== undefined) setMoratoriumMonths(initialScheme.moratoriumMonths);
    }
  }, [initialScheme]);

  // Recalculate EMI whenever parameters change
  useEffect(() => {
    let isCancelled = false;

    const fetchEMI = async () => {
      try {
        setLoading(true);
        const data = await api.calculateEMI({
          principal: Number(principal),
          annualRate: Number(annualRate),
          tenureMonths: Number(tenureMonths),
          moratoriumMonths: Number(moratoriumMonths)
        });
        if (!isCancelled) {
          setEmiData(data);
        }
      } catch (err) {
        console.error('Failed to calculate EMI:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchEMI, 150);
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [principal, annualRate, tenureMonths, moratoriumMonths]);

  const formatRupee = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const principalRatio = emiData?.totalPayment
    ? Math.round((principal / emiData.totalPayment) * 100)
    : 80;
  const interestRatio = Math.max(0, 100 - principalRatio);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white border-b border-slate-700">
        <div className="flex items-center gap-2 text-saffron-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Calculator className="w-4 h-4" />
          Concessional Repayment Simulator
        </div>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
          {t('emi.title')}
        </h3>
        <p className="text-sm text-slate-300 mt-1">
          {t('emi.subtitle')}
        </p>
      </div>

      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Sliders */}
        <div className="lg:col-span-7 space-y-6">
          {/* Principal Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label htmlFor="emi-principal" className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-saffron-600" />
                {t('emi.loanAmount')}
              </label>
              <span className="text-base font-bold text-saffron-700 bg-saffron-50 px-2.5 py-0.5 rounded-lg border border-saffron-200">
                {formatRupee(principal)}
              </span>
            </div>
            <input
              id="emi-principal"
              type="range"
              min="20000"
              max="5000000"
              step="10000"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-saffron-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>₹20,000</span>
              <span>₹25 Lakh</span>
              <span>₹50 Lakh</span>
            </div>
          </div>

          {/* Annual Interest Rate Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label htmlFor="emi-rate" className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-saffron-600" />
                {t('emi.annualRate')}
              </label>
              <span className="text-base font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                {annualRate}% p.a.
              </span>
            </div>
            <input
              id="emi-rate"
              type="range"
              min="4.0"
              max="15.0"
              step="0.5"
              value={annualRate}
              onChange={(e) => setAnnualRate(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>4% (Mahila Samriddhi)</span>
              <span>6.5% (MCF)</span>
              <span>9% (Term Loan)</span>
              <span>15%</span>
            </div>
          </div>

          {/* Tenure Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label htmlFor="emi-tenure" className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                {t('emi.tenure')}
              </label>
              <span className="text-base font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                {tenureMonths} {t('results.months')} ({Math.round((tenureMonths / 12) * 10) / 10} yrs)
              </span>
            </div>
            <input
              id="emi-tenure"
              type="range"
              min="12"
              max="120"
              step="6"
              value={tenureMonths}
              onChange={(e) => setTenureMonths(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>12 Mos</span>
              <span>36 Mos</span>
              <span>60 Mos</span>
              <span>120 Mos (10 yrs)</span>
            </div>
          </div>

          {/* Moratorium Grace Period Slider */}
          <div className="space-y-2 p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
            <div className="flex justify-between items-baseline">
              <label htmlFor="emi-moratorium" className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {t('emi.moratorium')}
              </label>
              <span className="text-base font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300">
                {moratoriumMonths} {t('results.months')} grace
              </span>
            </div>
            <input
              id="emi-moratorium"
              type="range"
              min="0"
              max={Math.min(24, tenureMonths - 6)}
              step="1"
              value={moratoriumMonths}
              onChange={(e) => setMoratoriumMonths(Number(e.target.value))}
              className="w-full h-2.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <p className="text-xs text-emerald-700 font-medium">
              💡 {t('emi.moratoriumNote')}
            </p>
          </div>
        </div>

        {/* Right Col: Live Computation Card */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 bg-slate-900 text-white rounded-xl shadow-inner">
          <div className="space-y-6">
            {/* Monthly Installment */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                {t('emi.monthlyEmi')}
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-saffron-400">
                {formatRupee(emiData?.monthlyEMI || 0)}
                <span className="text-sm font-normal text-slate-400"> /month</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {t('emi.effectiveTenure')}: {emiData?.effectiveTenure || 0} {t('results.months')}
              </p>
            </div>

            {/* Payment Summary */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">{t('emi.totalInterest')}</span>
                <span className="text-base font-bold text-emerald-400">
                  {formatRupee(emiData?.totalInterest || 0)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">{t('emi.totalPayment')}</span>
                <span className="text-base font-bold text-white">
                  {formatRupee(emiData?.totalPayment || 0)}
                </span>
              </div>
            </div>

            {/* Visual Ratio Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Principal ({principalRatio}%)</span>
                <span>Interest ({interestRatio}%)</span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div style={{ width: `${principalRatio}%` }} className="bg-saffron-500 h-full"></div>
                <div style={{ width: `${interestRatio}%` }} className="bg-emerald-500 h-full"></div>
              </div>
            </div>

            {/* Commercial Savings Showcase */}
            {emiData?.commercialComparison?.totalSavings > 0 && (
              <div className="p-3.5 bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-400">
                  <TrendingDown className="w-4 h-4" />
                  {t('emi.youSave')}
                </div>
                <div className="text-2xl font-extrabold text-emerald-300">
                  {formatRupee(emiData.commercialComparison.totalSavings)}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Compared to paying ~15% at a commercial bank or non-concessional NBFC.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
