import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SchemeForm from '../components/SchemeForm';
import EMISlider from '../components/EMISlider';
import {
  Landmark,
  ShieldCheck,
  TrendingDown,
  Compass,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  Award
} from 'lucide-react';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 text-white pt-4 sm:pt-6 pb-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        {/* Subtle Decorative Background Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-saffron-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start relative z-10">
          {/* Hero Content (Left) */}
          <div className="lg:col-span-6 space-y-4 lg:space-y-5 lg:pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-saffron-500/10 border border-saffron-500/30 text-saffron-400">
              <Sparkles className="w-3.5 h-3.5" />
              {t('hero.badge')}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              {t('hero.title')} via{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron-400 via-amber-300 to-emerald-400">
                {t('hero.highlight')}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
              {t('hero.description')}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="#recommender"
                className="px-6 py-3.5 rounded-xl font-bold text-white bg-saffron-600 hover:bg-saffron-700 shadow-lg shadow-saffron-600/25 transition-all flex items-center gap-2 text-sm"
              >
                <span>{t('hero.ctaPrimary')}</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link
                to="/partners"
                className="px-6 py-3.5 rounded-xl font-bold text-slate-200 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700 transition-all flex items-center gap-2 text-sm"
              >
                <MapPin className="w-4 h-4 text-saffron-400" />
                <span>{t('hero.ctaSecondary')}</span>
              </Link>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-800 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400">{t('hero.stats.incomeLimit')}</span>
                <p className="text-base font-bold text-emerald-400">{t('hero.stats.incomeValue')}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">{t('hero.stats.interestRate')}</span>
                <p className="text-base font-bold text-saffron-400">{t('hero.stats.interestValue')}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">{t('hero.stats.partners')}</span>
                <p className="text-base font-bold text-white">{t('hero.stats.partnersValue')}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400">{t('hero.stats.coverage')}</span>
                <p className="text-base font-bold text-blue-400">{t('hero.stats.coverageValue')}</p>
              </div>
            </div>

            {/* Official AI Governance Disclaimer */}
            <div className="pt-4 text-[11px] text-slate-400 border-t border-slate-800/80 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 flex-shrink-0"></span>
              <p className="leading-relaxed">
                The AI-assisted matching engine interprets your requirements and compares them against structured official NSFDC eligibility rules to identify potentially suitable schemes. Final eligibility is determined by the relevant channelizing agency.
              </p>
            </div>
          </div>

          {/* Scheme Form Screener (Right) */}
          <div className="lg:col-span-6">
            <SchemeForm />
          </div>
        </div>
      </section>

      {/* Problem & Solution Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-saffron-600 bg-saffron-50 px-3 py-1 rounded-full border border-saffron-200">
            Bridging the SC Credit Gap
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Why Do SC Concessional Applications Fail Today?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Beneficiaries with family income under ₹5L/year are legally entitled to subsidized capital, but face hurdles:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Scheme Mismatch
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Applicants apply for Term Loans when their project fits Micro Finance (&le; ₹1.4L), or miss out on women schemes like Mahila Samriddhi at 5% rate.
            </p>
            <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Solved: Automated rule engine ranks by exact eligibility.
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Wrong Channel Partner Routing
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Submitting files to bank branches that don't handle NSFDC or have exhausted their annual allocation causes months of rejection delays.
            </p>
            <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Solved: Geo-spatial locator filters healthy partners with fund capacity.
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Moratorium & EMI Misunderstanding
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Borrowers are unaware that concessional loans include 3-12 months grace periods where no principal is due while their business takes off.
            </p>
            <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Solved: Dynamic simulator shows exact savings vs commercial loans.
            </div>
          </div>
        </div>
      </section>

      {/* Embedded EMI Simulator Demo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Interactive Concessional EMI Simulator
          </h2>
          <p className="text-slate-600 text-sm">
            Simulate your monthly installment with genuine NSFDC subsidized rates and moratorium relief:
          </p>
        </div>

        <EMISlider />
      </section>
    </div>
  );
}
