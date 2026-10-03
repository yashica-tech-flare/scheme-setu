import React from 'react';
import { useTranslation } from 'react-i18next';
import { Landmark, ShieldCheck, ExternalLink, Heart } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-saffron-600 flex items-center justify-center text-white font-bold">
                <Landmark className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                {t('nav.title')}
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-md text-slate-400">
              {t('hero.description')}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              {t('footer.apexCorps')}
            </div>
          </div>

          {/* Col 2: Concessional Schemes */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Core Concessional Schemes
            </h4>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-white transition-colors">Micro Credit Finance (MCF ≤ ₹1.4L)</span></li>
              <li><span className="hover:text-white transition-colors">Mahila Samriddhi Yojana (MSY)</span></li>
              <li><span className="hover:text-white transition-colors">Term Loan Scheme (TLS ≤ ₹50L)</span></li>
              <li><span className="hover:text-white transition-colors">Education Loan (ELS ≤ ₹20L)</span></li>
              <li><span className="hover:text-white transition-colors">Green Business Scheme (GBS)</span></li>
            </ul>
          </div>

          {/* Col 3: Channel Partners */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Channel Partners Network
            </h4>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-white transition-colors">State Channelising Agencies (SCAs)</span></li>
              <li><span className="hover:text-white transition-colors">Public Sector Banks (PSBs)</span></li>
              <li><span className="hover:text-white transition-colors">Regional Rural Banks (RRBs)</span></li>
              <li><span className="hover:text-white transition-colors">Empanelled NBFC-MFIs</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>{t('footer.rights')}</p>
          <p className="text-center sm:text-right">{t('footer.disclaimer')}</p>
        </div>
      </div>
    </footer>
  );
}
