import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PartnerMap from '../components/PartnerMap';
import { MapPin, ShieldCheck, HelpCircle, Navigation } from 'lucide-react';

export default function PartnerLocator() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const schemeFromUrl = searchParams.get('scheme') || '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Intro Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Verified Channel Partner Network
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('locator.title')}
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Locate approved State Channelising Agencies (SCAs), Public Sector Banks (PSBs), Regional Rural Banks (RRBs), and NBFC-MFIs nearest to you. High NPA or depleted fund branches are automatically excluded.
        </p>
      </div>

      {/* Main Interactive Partner Map */}
      <PartnerMap selectedSchemeName={schemeFromUrl} />

      {/* Partner Legend / Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
        <div className="p-4 bg-white rounded-xl border border-amber-200 shadow-sm flex items-start gap-3">
          <div className="w-4 h-4 rounded-full bg-saffron-600 flex-shrink-0 mt-0.5"></div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase">State Channelising Agencies (SCAs)</h4>
            <p className="text-[11px] text-slate-600 mt-0.5">State SC/ST corporations handling direct loans and government capital subsidies.</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-blue-200 shadow-sm flex items-start gap-3">
          <div className="w-4 h-4 rounded-full bg-blue-600 flex-shrink-0 mt-0.5"></div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase">Public Sector Banks (PSBs)</h4>
            <p className="text-[11px] text-slate-600 mt-0.5">Nationalized banks (PNB, SBI, Canara, BoB) with specialized priority credit wings.</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-sm flex items-start gap-3">
          <div className="w-4 h-4 rounded-full bg-emerald-600 flex-shrink-0 mt-0.5"></div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase">Regional Rural Banks (RRBs)</h4>
            <p className="text-[11px] text-slate-600 mt-0.5">Rural and semi-urban cooperative hubs providing doorstep farmer and artisan lending.</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-purple-200 shadow-sm flex items-start gap-3">
          <div className="w-4 h-4 rounded-full bg-purple-600 flex-shrink-0 mt-0.5"></div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase">Empanelled NBFC-MFIs</h4>
            <p className="text-[11px] text-slate-600 mt-0.5">Fast-track micro-finance institutions supporting women SHGs and micro trades.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
