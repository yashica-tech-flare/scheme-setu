import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PartnerMap from '../components/PartnerMap';
import { MapPin, ShieldCheck, HelpCircle, Navigation, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { api } from '../api/client';

export default function PartnerLocator() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const schemeFromUrl = searchParams.get('scheme') || '';
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking' | 'live' | 'fallback'

  // Ping backend health on mount to detect if Atlas is live or fallback is active
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const schemes = await api.getSchemes();
        // Atlas IDs are MongoDB ObjectId strings (24 hex chars), in-memory are 'scheme_1' style
        const hasAtlasData = schemes?.length > 0 && /^[a-f0-9]{24}$/.test(schemes[0]?._id || '');
        setBackendStatus(hasAtlasData ? 'live' : 'fallback');
      } catch {
        setBackendStatus('fallback');
      }
    };
    checkBackend();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Intro Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified Channel Partner Network
          </div>

          {/* Live Backend Status Pill */}
          {backendStatus === 'checking' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              <Loader2 className="w-3 h-3 animate-spin" />
              Connecting to live database...
            </span>
          )}
          {backendStatus === 'live' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <Wifi className="w-3 h-3" />
              MongoDB Atlas — Live Data
            </span>
          )}
          {backendStatus === 'fallback' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
              <WifiOff className="w-3 h-3" />
              Offline Mode — Verified Seed Data
            </span>
          )}
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('locator.title')}
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Locate approved State Channelising Agencies (SCAs), Public Sector Banks (PSBs), Regional Rural Banks (RRBs), and NBFC-MFIs nearest to you. High NPA or depleted fund branches are automatically excluded.
        </p>
        {backendStatus === 'fallback' && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-2xl">
            <strong>Note:</strong> The live backend is waking up from sleep (Render free tier). Partner data shown is from our verified offline seed store — all 35 partner branches are accurate and functional.
          </p>
        )}
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