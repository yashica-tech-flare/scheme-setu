import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import {
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  AlertCircle,
  FileCheck,
  FileText,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Phone,
  MapPin,
  Info,
  Award,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  UserCheck
} from 'lucide-react';
import VoiceAssistant from '../components/VoiceAssistant';
import { localizeSchemeName } from '../utils/localizationHelper';

export default function Track() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search state
  const [searchRef, setSearchRef] = useState(searchParams.get('ref') || '');
  const [activeRef, setActiveRef] = useState(searchParams.get('ref') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Application data state
  const [application, setApplication] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [liveFlash, setLiveFlash] = useState(false);

  // Partner simulation mode toggle (to showcase partner-confirmed vs applicant-reported)
  const [isPartnerMode, setIsPartnerMode] = useState(false);
  const [partnerNote, setPartnerNote] = useState('');
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');

  // Check recent local references
  const [recentRefs, setRecentRefs] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('scheme_setu_apps') || '[]');
      if (Array.isArray(stored)) {
        setRecentRefs(stored.map(a => a.refId || a.referenceId).filter(Boolean));
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch application if activeRef changes
  useEffect(() => {
    if (!activeRef) {
      // Check if there was a last viewed ref in localStorage
      const lastRef = localStorage.getItem('scheme_setu_last_ref');
      if (lastRef && !searchParams.get('ref')) {
        setSearchRef(lastRef);
        setActiveRef(lastRef);
      }
      return;
    }

    const loadApplication = async () => {
      try {
        setLoading(true);
        setError('');
        setActionMessage('');
        const data = await api.getApplication(activeRef);
        if (!data) {
          setError(`No application found matching reference "${activeRef}". Please check the ID or try the demo reference below.`);
          setApplication(null);
        } else {
          setApplication(data);
          setSearchParams({ ref: activeRef });
        }
      } catch (err) {
        setError(`Unable to retrieve application: ${err.message}`);
        setApplication(null);
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [activeRef]);

  // Real-time synchronization via SSE, BroadcastChannel, and fallback polling
  useEffect(() => {
    if (!activeRef) {
      setIsLiveConnected(false);
      return;
    }

    let isMounted = true;
    let eventSource = null;
    let channel = null;

    const applyRealtimeUpdate = (updatedApp) => {
      if (!isMounted || !updatedApp) return;
      const refMatches = (updatedApp.refId && updatedApp.refId.toUpperCase() === activeRef.toUpperCase()) ||
                         (updatedApp.referenceId && updatedApp.referenceId.toUpperCase() === activeRef.toUpperCase());
      if (refMatches) {
        setApplication((prev) => {
          if (!prev) return updatedApp;
          if (prev.status !== updatedApp.status || (prev.documentsSubmitted?.length !== updatedApp.documentsSubmitted?.length)) {
            const latestHistory = updatedApp.statusHistory?.[updatedApp.statusHistory.length - 1];
            const actorLabel = latestHistory?.actor === 'partner' ? t('track.partnerConfirmedPill', 'Partner-confirmed') : (latestHistory?.actor || 'System');
            setActionMessage(`⚡ Real-Time Update: Status changed to "${getStatusLabel(updatedApp.status)}" (${actorLabel})`);
            setLiveFlash(true);
            setTimeout(() => { if (isMounted) setLiveFlash(false); }, 3500);
          }
          return updatedApp;
        });
        setIsLiveConnected(true);
      }
    };

    // 1. Establish SSE Connection to backend
    try {
      const streamUrl = api.getSseStreamUrl(activeRef);
      eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        if (isMounted) setIsLiveConnected(true);
      };

      eventSource.addEventListener('application_update', (event) => {
        try {
          const parsed = JSON.parse(event.data);
          applyRealtimeUpdate(parsed);
        } catch (err) {
          console.error('[Track SSE] Parse error:', err);
        }
      });

      eventSource.onerror = () => {
        if (isMounted) setIsLiveConnected(false);
      };
    } catch (err) {
      console.warn('[Track SSE] EventSource unavailable:', err);
    }

    // 2. BroadcastChannel cross-tab listener (instant sync between open tabs)
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('scheme_bridge_realtime');
        channel.onmessage = (event) => {
          if (event.data?.type === 'APPLICATION_UPDATED' && event.data?.application) {
            applyRealtimeUpdate(event.data.application);
          }
        };
      }
    } catch {
      // ignore
    }

    // 3. Fallback polling every 15 seconds
    const interval = setInterval(async () => {
      try {
        const refreshed = await api.getApplication(activeRef);
        if (refreshed && isMounted) {
          applyRealtimeUpdate(refreshed);
        }
      } catch {
        // ignore
      }
    }, 15000);

    return () => {
      isMounted = false;
      if (eventSource) eventSource.close();
      if (channel) channel.close();
      clearInterval(interval);
    };
  }, [activeRef, t]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchRef.trim()) return;
    setActiveRef(searchRef.trim().toUpperCase());
  };

  const loadDemo = (demoId = 'SETU-DEMO-2026') => {
    setSearchRef(demoId);
    setActiveRef(demoId);
  };

  // Toggle checklist item
  const handleToggleDocument = async (docTitle) => {
    if (!application) return;
    const currentList = application.documentsSubmitted || [];
    const exists = currentList.includes(docTitle);
    const updatedList = exists
      ? currentList.filter(d => d !== docTitle)
      : [...currentList, docTitle];

    try {
      setActionLoading(true);
      const res = await api.updateApplicationDocuments(application.refId, {
        documentsSubmitted: updatedList,
        advanceStatus: true
      });
      if (res?.application) {
        setApplication(res.application);
      } else {
        setApplication(prev => ({ ...prev, documentsSubmitted: updatedList }));
      }
    } catch (err) {
      console.error('Failed to update documents:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // State Transition Action
  const handleTransition = async (nextStatus, customNote = '') => {
    if (!application) return;
    try {
      setActionLoading(true);
      setError('');
      setActionMessage('');

      const noteToUse = customNote || partnerNote || (isPartnerMode ? 'Partner-confirmed milestone update' : 'Applicant self-reported milestone');

      const res = await api.updateApplicationStatus(application.refId, {
        status: nextStatus,
        note: noteToUse,
        actor: isPartnerMode ? 'partner' : 'applicant',
        isPartnerConfirmed: isPartnerMode
      });

      if (res?.application) {
        setApplication(res.application);
        setActionMessage(`Status successfully updated to ${getStatusLabel(nextStatus)}.`);
        setPartnerNote('');
        setShowWithdrawConfirm(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Status transition rejected');
    } finally {
      setActionLoading(false);
    }
  };

  // Status mapping and styling helpers
  function getStatusLabel(statusKey) {
    const fallbackMap = {
      inquiry_submitted: 'Inquiry Submitted',
      documents_pending: 'Documents Preparation',
      submitted_to_partner: 'Submitted to Channel Partner',
      under_appraisal: 'Under Technical Appraisal',
      sanctioned: 'Loan Sanctioned',
      disbursed: 'Capital Disbursed',
      rejected: 'Application Rejected',
      withdrawn: 'Withdrawn by Applicant'
    };
    return t(`track.status.${statusKey}`, fallbackMap[statusKey] || statusKey);
  }

  const standardStages = [
    { key: 'inquiry_submitted', label: `1. ${getStatusLabel('inquiry_submitted')}`, desc: t('track.stages.inquiry_submitted_desc', 'Online inquiry registered with matched NSFDC scheme') },
    { key: 'documents_pending', label: `2. ${getStatusLabel('documents_pending')}`, desc: t('track.stages.documents_pending_desc', 'Beneficiary assembling KYC, caste & income certificates') },
    { key: 'submitted_to_partner', label: `3. ${getStatusLabel('submitted_to_partner')}`, desc: t('track.stages.submitted_to_partner_desc', 'Application dossier lodged at authorized SCA/Bank branch') },
    { key: 'under_appraisal', label: `4. ${getStatusLabel('under_appraisal')}`, desc: t('track.stages.under_appraisal_desc', 'Technical & financial viability inspection by credit officer') },
    { key: 'sanctioned', label: `5. ${getStatusLabel('sanctioned')}`, desc: t('track.stages.sanctioned_desc', 'Official sanction letter issued with concessional rate') },
    { key: 'disbursed', label: `6. ${getStatusLabel('disbursed')}`, desc: t('track.stages.disbursed_desc', 'Funds released directly to DBT bank account / machinery vendor') }
  ];

  const currentStatus = application?.status || 'inquiry_submitted';
  const stageKeys = standardStages.map(s => s.key);
  const currentStageIndex = stageKeys.indexOf(currentStatus);
  const isTerminalException = ['rejected', 'withdrawn'].includes(currentStatus);

  // Document checklist candidates
  const defaultDocs = [
    'Caste Certificate (Verified SC status with digital seal)',
    'Income Certificate (Annual family revenue ≤ ₹5 Lakh)',
    'Aadhaar Card (UIDAI mobile & DBT bank account linked)',
    'Detailed Project Report (DPR / 3-Point Business Cost Sheet)',
    'Equipment / Machinery Quotation (Authorized GST Vendor)',
    'Bank Passbook / Cancelled Cheque (Direct Subsidy Credit)'
  ];

  function getDocTitle(doc) {
    if (!doc) return '';
    if (doc.includes('Caste Certificate') || doc.includes('जाति')) return t('track.docs.caste', doc);
    if (doc.includes('Income Certificate') || doc.includes('आय')) return t('track.docs.income', doc);
    if (doc.includes('Aadhaar Card') || doc.includes('आधार')) return t('track.docs.aadhaar', doc);
    if (doc.includes('Detailed Project Report') || doc.includes('DPR') || doc.includes('डीपीआर') || doc.includes('Project Report')) return t('track.docs.dpr', doc);
    if (doc.includes('Equipment') || doc.includes('Machinery') || doc.includes('कोटेशन') || doc.includes('उपकरण') || doc.includes('Quotation')) return t('track.docs.quotation', doc);
    if (doc.includes('Bank Passbook') || doc.includes('Cheque') || doc.includes('पासबुक') || doc.includes('बैंक')) return t('track.docs.bankPassbook', doc);
    return doc;
  }

  const availableDocs = application?.matchedScheme?.requiredDocuments?.length
    ? application.matchedScheme.requiredDocuments
    : defaultDocs;

  // Spoken narrative specifically structured for illiterate/semi-literate applicants in all 13 languages
  const getSpokenSummary = () => {
    if (!application) return '';
    const ref = application.refId || application.referenceId || '';
    const rawScheme = application.matchedScheme;
    const scheme = rawScheme ? localizeSchemeName(rawScheme, i18n.language) : t('track.schemeDefault', 'NSFDC Concessional Loan Scheme');
    const status = getStatusLabel(currentStatus);
    const submittedCount = (application.documentsSubmitted || []).length;
    const totalCount = availableDocs.length;
    const pendingCount = Math.max(0, totalCount - submittedCount);

    const pendingText = pendingCount > 0
      ? t('voice_assistant.pending_remaining', { count: pendingCount })
      : t('voice_assistant.all_docs_ready');

    return t('voice_assistant.track_summary', {
      ref,
      schemeName: scheme,
      stage: status,
      submittedCount,
      totalCount,
      pendingText
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title & Search Header */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-saffron-50 text-saffron-800 border border-saffron-200 mb-2">
              <Clock className="w-3.5 h-3.5 text-saffron-600" />
              {t('track.realTimeTracking', 'Real-Time Beneficiary Tracking')}
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('track.title', 'Track Loan Application Lifecycle')}
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl mt-1">
              {t('track.subtitle', 'Transparent, audit-logged tracking from initial inquiry to final concessional disbursal. Look up your application using your unique SETU-XXXX-XXXX reference.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/#recommender"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5"
            >
              <span>{t('track.newLoanInquiry', 'New Loan Inquiry')} &rarr;</span>
            </Link>
            <Link
              to="/guide"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4 text-saffron-400" />
              <span>{t('track.documentGuide', 'Document Guide')}</span>
            </Link>
          </div>
        </div>

        {/* Reference Lookup Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="track-ref-input"
                type="text"
                placeholder={t('track.searchPlaceholder', 'Enter Reference ID (e.g. SETU-DEMO-2026 or SETU-XXXX-XXXX)')}
                value={searchRef}
                onChange={(e) => setSearchRef(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-saffron-500 focus:bg-white uppercase tracking-wider"
              />
            </div>
            <button
              id="track-lookup-btn"
              type="submit"
              disabled={loading || !searchRef.trim()}
              className="px-6 py-3 bg-saffron-600 hover:bg-saffron-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-saffron-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('track.lookingUp', 'Looking up...')}</span>
                </>
              ) : (
                <span>{t('track.lookupBtn', 'Lookup Application')}</span>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill & Recents */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            <span className="text-slate-500 font-semibold">{t('track.quickTest', 'Quick Test:')}</span>
            <button
              type="button"
              onClick={() => loadDemo('SETU-DEMO-2026')}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold hover:bg-emerald-100 transition-colors"
            >
              {t('track.loadDemo', 'Load Verified Demo Application (SETU-DEMO-2026)')}
            </button>
            {recentRefs.length > 0 && recentRefs[0] !== 'SETU-DEMO-2026' && (
              <button
                type="button"
                onClick={() => loadDemo(recentRefs[0])}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-medium hover:bg-slate-200 transition-colors"
              >
                {t('track.recent', 'Recent:')} {recentRefs[0]}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Persistent Legal Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <strong>{t('track.disclaimerTitle', 'Official Transparency Notice:')}</strong>{' '}
          {t('track.disclaimerP1', 'Status updates reflect applicant-reported progress unless marked')}{' '}
          <span className="font-bold text-emerald-800 bg-emerald-100/80 px-1 py-0.5 rounded">
            {t('track.partnerConfirmedPill', 'Partner-confirmed')}
          </span>
          .{' '}
          {t('track.disclaimerP2', 'SchemeBridge does not process or guarantee loan approvals. Statutory credit appraisal, loan sanction, and fund disbursement remain strictly within the statutory jurisdiction of the respective empanelled Channel Partner (State SC Corporation or Bank).')}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Action Success Alert */}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>{actionMessage}</div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-saffron-600" />
          <p className="text-sm font-semibold">{t('track.retrievingApp', 'Retrieving official application lifecycle & audit history...')}</p>
        </div>
      )}

      {/* Empty State when no application loaded */}
      {!loading && !application && !error && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-saffron-50 border border-saffron-200 mx-auto flex items-center justify-center text-saffron-600">
            <Search className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              {t('track.noAppTitle', 'No Application Reference Entered')}
            </h3>
            <p className="text-xs text-slate-600">
              {t('track.noAppDesc', 'Enter your reference number in the search bar above, or click below to inspect a sample verified inquiry.')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadDemo('SETU-DEMO-2026')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
          >
            <span>{t('track.loadSampleBtn', 'Load Sample Demo Case (SETU-DEMO-2026)')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Tracked Application Content */}
      {!loading && application && (
        <div className="space-y-6 animate-fadeIn">
          {/* Prominent Voice Assistant Banner for Illiterate & Low-Literacy Applicants */}
          <VoiceAssistant
            textToRead={getSpokenSummary()}
            className="shadow-sm"
          />

          {/* Application Header Card */}
          <div className={`bg-white rounded-2xl p-6 sm:p-8 border transition-all duration-500 ${
            liveFlash ? 'border-emerald-500 shadow-xl ring-4 ring-emerald-400/30' : 'border-slate-200 shadow-md'
          } flex flex-col md:flex-row md:items-center justify-between gap-6`}>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm sm:text-base font-extrabold px-3 py-1 bg-slate-900 text-saffron-400 rounded-lg tracking-wider">
                  {application.refId || application.referenceId}
                </span>

                {/* Status Badge */}
                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                  currentStatus === 'disbursed'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : currentStatus === 'sanctioned'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : currentStatus === 'rejected'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : currentStatus === 'withdrawn'
                    ? 'bg-slate-200 text-slate-700 border border-slate-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {getStatusLabel(currentStatus)}
                </span>

                {/* Real-time SSE indicator */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isLiveConnected
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`} />
                  <span>{isLiveConnected ? t('track.liveActive', 'Live Stream Active') : t('track.syncing', 'Syncing')}</span>
                </span>

                {/* Link to Officer Portal */}
                <Link
                  to={`/admin/track?ref=${encodeURIComponent(application.refId || application.referenceId)}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-saffron-50 text-saffron-800 border border-saffron-200 hover:bg-saffron-100 transition-colors"
                  title="Open Partner/Bank Officer interface to advance application status in real-time"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-saffron-600" />
                  <span>{t('track.officerPortalLink', 'Officer Portal')} &rarr;</span>
                </Link>

                {application.isOffline && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    {t('track.savedLocally', 'Saved Locally')}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {application.matchedScheme?.schemeName || 'NSFDC Concessional Loan'}
              </h2>

              <p className="text-xs text-slate-500">
                {t('track.routedTo', 'Routed to:')} <strong className="text-slate-800">{application.routedPartner?.partnerName || t('track.pendingPartner', 'Pending Channel Partner')}</strong>
                {' '}• {t('track.created', 'Created')} {new Date(application.createdAt).toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 flex-shrink-0">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500">{t('track.projectNeed', 'Project Need')}</span>
                <p className="text-base font-bold text-slate-900">
                  ₹{Number(application.applicantProfile?.projectCost || application.projectCost || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500">{t('track.documentsMarked', 'Documents Marked')}</span>
                <p className="text-base font-bold text-emerald-700">
                  {(application.documentsSubmitted || []).length} / {availableDocs.length}
                </p>
              </div>
            </div>
          </div>

          {/* Stepper Timeline Visualizer */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-saffron-600" />
                  {t('track.stepperTitle', 'Loan Lifecycle Stepper')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('track.stepperSubtitle', 'Progress tracking according to official NSFDC processing milestones')}
                </p>
              </div>

              {isTerminalException && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                  {t('track.appTerminated', 'Application Terminated')} ({getStatusLabel(currentStatus)})
                </span>
              )}
            </div>

            {/* Responsive Stepper: Horizontal on desktop, Vertical on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {standardStages.map((stage, idx) => {
                const isCompleted = currentStageIndex > idx || (currentStageIndex === idx && currentStatus === 'disbursed');
                const isCurrent = currentStageIndex === idx && !isTerminalException;
                const isPending = currentStageIndex < idx;

                const historyItem = (application.statusHistory || []).find(h => h.status === stage.key);

                return (
                  <div
                    key={stage.key}
                    className={`relative p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isCompleted
                        ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 shadow-2xs'
                        : isCurrent
                        ? 'bg-white border-saffron-500 shadow-md ring-2 ring-saffron-400/40'
                        : 'bg-slate-50/60 border-slate-200 text-slate-400'
                    }`}
                  >
                    {/* Top Step Number & Status Indicator */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-saffron-600 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isCompleted ? '✓' : idx + 1}
                      </span>

                      {/* Trust Model Pill if recorded */}
                      {historyItem && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          historyItem.isPartnerConfirmed
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {historyItem.isPartnerConfirmed ? t('track.partnerVerified', 'Partner-Verified') : t('track.selfReported', 'Self-Reported')}
                        </span>
                      )}
                    </div>

                    {/* Step Title & Description */}
                    <div className="space-y-1 mb-2">
                      <span className={`text-xs font-bold block ${isCurrent ? 'text-saffron-900' : isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                        {stage.label}
                      </span>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {stage.desc}
                      </p>
                    </div>

                    {/* Audit Date / Note */}
                    {historyItem?.timestamp ? (
                      <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 space-y-0.5">
                        <span className="font-semibold text-slate-700 block">
                          {new Date(historyItem.timestamp).toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                        {historyItem.note && (
                          <p className="italic line-clamp-2 text-slate-600">
                            "{historyItem.note}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-200/40 text-[10px] text-slate-400">
                        {t('track.pending', 'Pending')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Document Checklist Linked to Guide */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-saffron-600" />
                  {t('track.checklistTitle', 'Beneficiary Document Submission Checklist')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('track.checklistSubtitle', 'Mark items you have physically prepared or submitted. Connected to our official zero-rejection guidelines.')}
                </p>
              </div>

              <Link
                to={`/guide?scheme=${encodeURIComponent(application.matchedScheme?.schemeName || '')}`}
                className="text-xs font-bold text-saffron-600 hover:text-saffron-700 flex items-center gap-1 hover:underline"
              >
                <span>{t('track.viewAuthorities', 'View Issuing Authorities in Guide')} &rarr;</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableDocs.map((doc, idx) => {
                const isChecked = (application.documentsSubmitted || []).includes(doc);
                return (
                  <div
                    key={idx}
                    onClick={() => handleToggleDocument(doc)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isChecked
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by div click
                      className="w-4 h-4 mt-0.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 pointer-events-none"
                    />
                    <div className="flex-grow">
                      <span className="text-xs font-bold text-slate-900 block leading-snug">
                        {getDocTitle(doc)}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {isChecked ? t('track.docCompleted', 'Marked complete by applicant') : t('track.docPending', 'Pending applicant compilation')}
                      </span>
                    </div>

                    {/* Voice Read-Aloud for Illiterate Applicants */}
                    <VoiceAssistant
                      variant="mini"
                      textToRead={`${getDocTitle(doc)}। यह सरकारी रियायती ऋण के लिए आवश्यक वैधानिक कागजात है।`}
                      className="shrink-0"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Milestone Action & Progress Controls */}
          {!isTerminalException && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-saffron-600" />
                    {t('track.progressActions', 'Applicant Progress Actions & Status Reporting')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('track.actionsSubtitle', 'Self-report physical progress or switch to partner verification mode to test institutional milestone confirmation.')}
                  </p>
                </div>

                {/* Partner Testing Mode Switch */}
                <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-700">{t('track.partnerModeLabel', 'Channel Partner Mode:')}</span>
                  <button
                    type="button"
                    onClick={() => setIsPartnerMode(!isPartnerMode)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      isPartnerMode
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-300'
                    }`}
                  >
                    {isPartnerMode ? t('track.partnerModeActive', 'Active (Partner-Verified)') : t('track.partnerModeOff', 'Off (Applicant-Reported)')}
                  </button>
                </div>
              </div>

              {/* Action Buttons dependent on current state */}
              <div className="space-y-4">
                {isPartnerMode && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      {t('track.partnerRemarksTitle', 'Channel Partner Verification Remarks (Mandatory for Institutional Milestones):')}
                    </span>
                    <input
                      type="text"
                      placeholder={t('track.partnerRemarksPlaceholder', 'e.g. Verified by TAHDCO District Officer / Sanction Order #TAHDCO-2026-8812')}
                      value={partnerNote}
                      onChange={(e) => setPartnerNote(e.target.value)}
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-slate-900"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {currentStatus === 'inquiry_submitted' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleTransition('documents_pending', 'Applicant actively assembling required documents per checklist')}
                      className="px-5 py-2.5 bg-saffron-600 hover:bg-saffron-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{t('track.btnStartDocs', '1. Start Documents Preparation')} &rarr;</span>
                    </button>
                  )}

                  {(currentStatus === 'inquiry_submitted' || currentStatus === 'documents_pending') && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleTransition('submitted_to_partner', 'Dossier physically submitted at authorized Channel Partner branch')}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{t('track.btnSubmitPartner', '2. Self-Report: Submitted to Partner Counter')} &rarr;</span>
                    </button>
                  )}

                  {currentStatus === 'submitted_to_partner' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleTransition('under_appraisal', partnerNote || 'Dossier received by credit officer; technical appraisal underway')}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{t('track.btnAdvanceAppraisal', '3. Advance to Technical Appraisal')} &rarr;</span>
                    </button>
                  )}

                  {currentStatus === 'under_appraisal' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleTransition('sanctioned', partnerNote || (isPartnerMode ? 'Official Sanction Letter Approved' : 'Applicant self-reported sanction letter receipt'))}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{t('track.btnMarkSanctioned', '4. Mark Loan Sanctioned')} &rarr;</span>
                    </button>
                  )}

                  {currentStatus === 'sanctioned' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleTransition('disbursed', partnerNote || (isPartnerMode ? 'Funds successfully credited to DBT account / dealer' : 'Applicant self-reported fund receipt'))}
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{t('track.btnMarkDisbursed', '5. Mark Capital Disbursed (Terminal Success)')} &rarr;</span>
                    </button>
                  )}

                  {/* Terminal Withdrawal Action */}
                  <button
                    type="button"
                    onClick={() => setShowWithdrawConfirm(true)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer ml-auto"
                  >
                    {t('track.withdrawApplication', 'Withdraw Application')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal / Dialog for Withdrawal Confirmation */}
          {showWithdrawConfirm && (
            <div className="p-5 rounded-2xl bg-red-50 border border-red-200 space-y-3">
              <h4 className="text-sm font-bold text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                {t('track.confirmWithdrawTitle', 'Confirm Application Withdrawal')}
              </h4>
              <p className="text-xs text-red-800">
                {t('track.confirmWithdrawDesc', 'Withdrawing is a terminal action. Please provide a reason for records:')}
              </p>
              <input
                type="text"
                placeholder={t('track.withdrawReasonPlaceholder', 'Reason for withdrawal (e.g. secured alternative finance / project deferred)')}
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                className="w-full p-2.5 bg-white border border-red-300 rounded-lg text-xs font-semibold text-slate-900"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!withdrawReason.trim() || actionLoading}
                  onClick={() => handleTransition('withdrawn', withdrawReason)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {t('track.confirmWithdrawBtn', 'Confirm Withdrawal')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdrawConfirm(false)}
                  className="px-4 py-2 bg-white text-slate-700 rounded-lg text-xs font-bold border border-slate-300 cursor-pointer"
                >
                  {t('track.cancelBtn', 'Cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Scheme & Channel Partner Metadata Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Scheme Details */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-saffron-600 font-bold text-xs uppercase tracking-wider">
                <Award className="w-4 h-4" />
                {t('track.matchedSchemeBadge', 'Matched NSFDC Scheme')}
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                {application.matchedScheme?.schemeName || 'Concessional Scheme'}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-medium block">{t('track.interestRateLabel', 'Interest Rate:')}</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {application.matchedScheme?.interestRate || 4}% {t('track.perAnnum', 'p.a.')}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-medium block">{t('track.moratoriumLabel', 'Moratorium Grace:')}</span>
                  <span className="font-extrabold text-emerald-700 text-sm">
                    {application.matchedScheme?.moratoriumMonths || 6} {t('track.months', 'Months')}
                  </span>
                </div>
              </div>
            </div>

            {/* Routed Partner Details */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                <Building2 className="w-4 h-4" />
                {t('track.assignedPartnerBadge', 'Assigned Channel Partner')}
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                {application.routedPartner?.partnerName || 'District SC Corporation'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {application.routedPartner?.address || 'Official district channelizing headquarters'}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                {application.routedPartner?.contact && (
                  <a
                    href={`tel:${application.routedPartner.contact}`}
                    className="font-bold text-slate-800 hover:text-slate-900 inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"
                  >
                    <Phone className="w-3.5 h-3.5 text-saffron-600" />
                    <span>{application.routedPartner.contact}</span>
                  </a>
                )}
                <Link
                  to="/partners"
                  className="font-bold text-saffron-600 hover:text-saffron-700 inline-flex items-center gap-1 hover:underline"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{t('track.viewMapBtn', 'View on Interactive Map')} &rarr;</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Full Audit Trail Log */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              {t('track.auditHistoryTitle', 'Append-Only Audit History')} ({application.statusHistory?.length || 0} {t('track.eventsCount', 'Events')})
            </h4>

            <div className="space-y-3">
              {(application.statusHistory || []).map((event, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {getStatusLabel(event.status)}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        event.isPartnerConfirmed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {event.isPartnerConfirmed ? t('track.partnerConfirmedPill', 'Partner-Confirmed') : t('track.selfReportedPill', 'Applicant-Reported')}
                      </span>
                    </div>
                    {event.note && (
                      <p className="text-slate-600">
                        "{event.note}"
                      </p>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">
                    {new Date(event.timestamp).toLocaleString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
