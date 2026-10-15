import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Send,
  RefreshCw,
  ArrowLeft,
  User,
  Phone,
  Check,
  Eye,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Lock,
  ChevronRight
} from 'lucide-react';

export default function AdminTrack() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [applications, setApplications] = useState([]);
  const [selectedRef, setSelectedRef] = useState(searchParams.get('ref') || 'SETU-DEMO-2026');
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [smsPreview, setSmsPreview] = useState(null);

  // Officer inputs
  const [nextStatus, setNextStatus] = useState('under_appraisal');
  const [officerName, setOfficerName] = useState('K. Ramanathan');
  const [officerRole, setOfficerRole] = useState('Senior Credit & Welfare Appraisal Officer');
  const [officerBranch, setOfficerBranch] = useState('TAHDCO District Office, Ariyalur (SCA)');
  const [sanctionRef, setSanctionRef] = useState('');
  const [officialNote, setOfficialNote] = useState('Physical site inspection & caste certification verification completed. Project viability confirmed.');
  const [dispatchSms, setDispatchSms] = useState(true);

  // Load applications list
  const loadList = async () => {
    try {
      const list = await api.listApplications(25);
      if (Array.isArray(list) && list.length > 0) {
        setApplications(list);
        if (!selectedRef) {
          setSelectedRef(list[0].refId || list[0].referenceId);
        }
      }
    } catch (err) {
      console.warn('Failed to load applications list:', err);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  // Load selected application details
  useEffect(() => {
    if (!selectedRef) return;
    setSearchParams({ ref: selectedRef });

    const fetchApp = async () => {
      try {
        setLoading(true);
        const data = await api.getApplication(selectedRef);
        setApplication(data);

        // Pre-fill smart next status
        if (data?.status === 'inquiry_submitted') {
          setNextStatus('documents_pending');
        } else if (data?.status === 'documents_pending') {
          setNextStatus('submitted_to_partner');
        } else if (data?.status === 'submitted_to_partner') {
          setNextStatus('under_appraisal');
        } else if (data?.status === 'under_appraisal') {
          setNextStatus('sanctioned');
          setSanctionRef(`SCA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
        } else if (data?.status === 'sanctioned') {
          setNextStatus('disbursed');
        }
      } catch (err) {
        console.error('Error fetching application:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApp();
  }, [selectedRef]);

  // Handle Partner Milestone Submission
  const handleSubmitMilestone = async (e) => {
    e.preventDefault();
    if (!application) return;

    try {
      setSubmitting(true);
      setToastMessage('');
      setSmsPreview(null);

      const compositeNote = `${officialNote.trim()} | Verified by: ${officerName} (${officerRole}, ${officerBranch})${sanctionRef ? ` | Ref Order: ${sanctionRef}` : ''}`;

      const res = await api.updateApplicationStatus(application.refId || application.referenceId, {
        status: nextStatus,
        note: compositeNote,
        actor: 'partner',
        isPartnerConfirmed: true
      });

      if (res?.application) {
        setApplication(res.application);
      }

      // Generate simulated SMS preview
      const phone = application.contactInfo?.phone || '9876543210';
      const refId = application.refId || application.referenceId;
      const schemeTitle = application.matchedScheme?.schemeName || 'NSFDC Loan';
      const statusTitle = nextStatus.replace(/_/g, ' ').toUpperCase();

      const smsText = `Govt of India / NSFDC Alert: Your loan application ${refId} for ${schemeTitle} has been updated to "${statusTitle}" by ${officerName} (${officerBranch}). Remarks: ${officialNote.substring(0, 80)}...`;

      setSmsPreview({
        phone: `+91 ${phone}`,
        text: smsText,
        gateway: 'MSG91 / National Portal SMS Gateway (Simulated Hook)',
        timestamp: new Date().toLocaleTimeString('en-IN')
      });

      setToastMessage(`Milestone successfully confirmed as Partner Official! Status broadcasted in real time.`);
      loadList();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions = [
    { value: 'inquiry_submitted', label: '1. Inquiry Submitted (Registered)' },
    { value: 'documents_pending', label: '2. Documents Pending / Preparation' },
    { value: 'submitted_to_partner', label: '3. Submitted to Channel Partner (Branch Lodged)' },
    { value: 'under_appraisal', label: '4. Under Technical & Credit Appraisal (Inspection)' },
    { value: 'sanctioned', label: '5. Loan Sanctioned (Formal Letter Issued)' },
    { value: 'disbursed', label: '6. Capital Disbursed (DBT / Vendor Credit)' },
    { value: 'rejected', label: 'X. Application Rejected (Formal Stoppage)' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Officer Session Header */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-saffron-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-600/50">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Official Channel Partner Portal • Authenticated Officer Session</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              SCA & Bank Credit Appraisal Console
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Official administrative console for empanelled State Channelising Agencies (TAHDCO, OSFDC, PSCFC) and public sector banks to inspect SC loan inquiries, record field audits, certify milestones, and broadcast live status updates to beneficiaries.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link
              to={`/track?ref=${encodeURIComponent(selectedRef || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-saffron-600 hover:bg-saffron-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Open Beneficiary Live View</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </Link>

            <Link
              to="/track"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Track</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Application Selector + Detail & Update Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Applications Queue */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-saffron-600" />
                <span>Application Docket</span>
              </h2>
              <button
                onClick={loadList}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                title="Refresh queue"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select an inquiry dossier to review documentation, issue sanctions, or advance disbursals:
            </p>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {applications.map((app) => {
                const ref = app.refId || app.referenceId;
                const isSelected = ref === selectedRef;
                const applicantName = app.contactInfo?.applicantName || 'SC Applicant';
                const schemeName = app.matchedScheme?.schemeName || 'NSFDC Loan';
                const status = app.status || 'inquiry_submitted';

                return (
                  <button
                    key={ref}
                    type="button"
                    onClick={() => setSelectedRef(ref)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-saffron-50/80 border-saffron-500 ring-2 ring-saffron-500/20 shadow-sm'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-900 tracking-wider">
                        {ref}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        status === 'disbursed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : status === 'sanctioned'
                          ? 'bg-blue-100 text-blue-800'
                          : status === 'under_appraisal'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-800 truncate">
                      {applicantName}
                    </div>

                    <div className="text-[11px] text-slate-500 truncate flex items-center justify-between">
                      <span>{schemeName}</span>
                      <span className="font-mono">₹{Number(app.applicantProfile?.projectCost || app.projectCost || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </button>
                );
              })}

              {applications.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  No applications recorded in local or remote database.
                </div>
              )}
            </div>

            {/* Quick manual reference entry */}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                placeholder="Or enter Ref (SETU-...)"
                value={selectedRef}
                onChange={(e) => setSelectedRef(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-saffron-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Appraisal & Milestone Dispatch */}
        <div className="lg:col-span-8 space-y-6">
          {/* Toast / Broadcast Success Banner */}
          {toastMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm flex items-start gap-3 shadow-md animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 flex-grow">
                <strong>{toastMessage}</strong>
                <p className="text-xs text-emerald-800">
                  All active SSE connections for reference <code className="font-mono font-bold">{selectedRef}</code> received instant notification.
                </p>
              </div>
              <Link
                to={`/track?ref=${encodeURIComponent(selectedRef)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>Verify in Track</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Simulated SMS Alert Preview */}
          {smsPreview && (
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-700 shadow-md text-xs space-y-2">
              <div className="flex items-center justify-between text-saffron-400 font-bold border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  <span>Simulated SMS Dispatched to Beneficiary</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400">{smsPreview.timestamp}</span>
              </div>
              <div className="font-mono text-[11px] text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">
                <p className="text-slate-400 font-semibold mb-1">TO: {smsPreview.phone} via {smsPreview.gateway}</p>
                "{smsPreview.text}"
              </div>
            </div>
          )}

          {loading && (
            <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-saffron-600 mb-2" />
              <p className="text-sm font-semibold">Retrieving official application dossier...</p>
            </div>
          )}

          {!loading && !application && (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Application Reference Not Found</h3>
              <p className="text-xs text-slate-500">Please choose an inquiry from the docket on the left, or verify the reference ID.</p>
            </div>
          )}

          {!loading && application && (
            <div className="space-y-6">
              {/* Dossier Summary Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Reference</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-mono font-extrabold text-slate-900">
                        {application.refId || application.referenceId}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        application.status === 'disbursed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : application.status === 'sanctioned'
                          ? 'bg-blue-100 text-blue-800'
                          : application.status === 'under_appraisal'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        Current: {application.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="text-right sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Matched Concession</span>
                    <div className="text-sm font-bold text-saffron-700">
                      {application.matchedScheme?.schemeName || 'NSFDC Loan'}
                    </div>
                  </div>
                </div>

                {/* Beneficiary Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-500 font-semibold">Applicant Name</span>
                    <p className="font-bold text-slate-900">{application.contactInfo?.applicantName || 'SC Beneficiary'}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-500 font-semibold">Contact Mobile</span>
                    <p className="font-bold text-slate-900 font-mono">+91 {application.contactInfo?.phone || '9876543210'}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-500 font-semibold">Annual Family Income</span>
                    <p className="font-bold text-slate-900">₹{Number(application.applicantProfile?.income || 250000).toLocaleString('en-IN')}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-500 font-semibold">Project Cost</span>
                    <p className="font-bold text-slate-900">₹{Number(application.applicantProfile?.projectCost || application.projectCost || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Routing & Verification Status */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-600" />
                    <span className="text-slate-600">Assigned Branch:</span>
                    <strong className="text-slate-900">{application.routedPartner?.partnerName || 'TAHDCO District Office, Ariyalur'}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Caste Verified (SC Category)</span>
                  </div>
                </div>
              </div>

              {/* Official Milestone Transition Form */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-saffron-600" />
                    <span>Partner Milestone Certification & Appraisal Action</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Advancing status from this form will tag updates with <strong className="text-emerald-700">actor: 'partner'</strong> and mark them as <strong className="text-emerald-700">isPartnerConfirmed: true</strong>, instantly reflecting on the public tracking portal.
                  </p>
                </div>

                <form onSubmit={handleSubmitMilestone} className="space-y-4">
                  {/* Next Status Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Advance Milestone To:
                    </label>
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-saffron-500 focus:bg-white"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Officer Identity & Branch */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Officer Name</label>
                      <input
                        type="text"
                        value={officerName}
                        onChange={(e) => setOfficerName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Designation & Role</label>
                      <input
                        type="text"
                        value={officerRole}
                        onChange={(e) => setOfficerRole(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Branch / Office</label>
                      <input
                        type="text"
                        value={officerBranch}
                        onChange={(e) => setOfficerBranch(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Official Sanction Order / File No. (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. SCA/2026/AP-8842"
                        value={sanctionRef}
                        onChange={(e) => setSanctionRef(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Official Inspection Remarks */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Official Inspection & Appraisal Remarks</label>
                    <textarea
                      rows={3}
                      value={officialNote}
                      onChange={(e) => setOfficialNote(e.target.value)}
                      placeholder="Enter field audit observations, viability findings, or sanction terms..."
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-saffron-500 focus:bg-white"
                      required
                    />
                  </div>

                  {/* SMS Dispatch Simulation Toggle */}
                  <div className="flex items-center gap-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <input
                      type="checkbox"
                      id="sms-dispatch-toggle"
                      checked={dispatchSms}
                      onChange={(e) => setDispatchSms(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="sms-dispatch-toggle" className="text-xs text-emerald-900 cursor-pointer">
                      <strong>Dispatch Real-Time SMS Alert:</strong> Notify applicant (+91 {application.contactInfo?.phone || '9876543210'}) via MSG91/Govt SMS Gateway hook upon milestone commitment.
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-saffron-400" />
                        <span>Broadcasting Official Milestone...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5 text-saffron-400" />
                        <span>Commit Official Milestone & Broadcast Live</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Complete Audit History Log */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Audit Trail & Historical Actions</span>
                </h4>

                <div className="space-y-3">
                  {(application.statusHistory || []).map((h, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 uppercase tracking-wider">
                          {h.status?.replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {new Date(h.timestamp).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <p className="text-slate-700 leading-relaxed">{h.note}</p>

                      <div className="flex items-center gap-2 pt-1 text-[11px]">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          h.actor === 'partner'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : h.actor === 'applicant'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          Actor: {h.actor}
                        </span>

                        {h.isPartnerConfirmed && (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Partner-Confirmed</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
