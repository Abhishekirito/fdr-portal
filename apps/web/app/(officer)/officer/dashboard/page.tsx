'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { CommandPalette } from '@/components/CommandPalette';
import { SkeletonMetricCard, SkeletonQueueCard, SkeletonHeroBanner } from '@/components/Skeleton';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  FileText,
  FileCheck,
  Building2,
  Calendar,
  Sparkles,
  ExternalLink,
  Lock,
  Bell,
  Eye,
  Gavel,
  ShieldAlert,
  Award,
  Scale,
} from 'lucide-react';
import { FDRInstrument, Profile, ReleaseRequest, DocumentRecord } from '@/lib/supabase/types';
import { DocumentViewerModal } from '@/components/DocumentViewerModal';
import confetti from 'canvas-confetti';

export default function OfficerDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [instruments, setInstruments] = useState<FDRInstrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [cronRunning, setCronRunning] = useState(false);
  const [cronMessage, setCronMessage] = useState('');
  const [viewingDocument, setViewingDocument] = useState<{
    doc?: DocumentRecord | null;
    instrument?: FDRInstrument | null;
    directFileData?: string | null;
    directFileName?: string | null;
  } | null>(null);

  // Role-specific Active Tab
  const [activeTab, setActiveTab] = useState<string>('verification');

  // Verify modal state
  const [verifyingItem, setVerifyingItem] = useState<FDRInstrument | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('All parameters verified against bank confirmation.');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reject modal state
  const [rejectingItem, setRejectingItem] = useState<FDRInstrument | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Discrepancy detected: Parameters do not match bank verified records.');

  // Release decision modal state
  const [decisionItem, setDecisionItem] = useState<ReleaseRequest | null>(null);
  const [decisionType, setDecisionType] = useState<'approved' | 'rejected'>('approved');
  const [decisionReason, setDecisionReason] = useState('Meets statutory lock-in criteria. Approved by Regulation Bureau.');

  // Refund confirm modal state
  const [refundItem, setRefundItem] = useState<ReleaseRequest | null>(null);
  const [refundNotes, setRefundNotes] = useState('Bank statement and official closure letter verified.');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [instRes, sessRes] = await Promise.all([
        fetch('/api/instruments'),
        fetch('/api/auth/session'),
      ]);
      const instData = await instRes.json();
      const sessData = await sessRes.json();

      if (instData.instruments) setInstruments(instData.instruments);
      if (sessData.currentProfile) {
        setProfile(sessData.currentProfile);
        // Set smart default tab based on the specific officer role
        if (sessData.currentProfile.role === 'regional_finance_officer') {
          setActiveTab('releases');
        } else if (sessData.currentProfile.role === 'regulation_bureau_head') {
          setActiveTab('appeals');
        } else {
          setActiveTab('verification');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Run Scheduled Maturity Cron Check
  const handleRunMaturityCron = async () => {
    setCronRunning(true);
    setCronMessage('');
    try {
      const res = await fetch('/api/cron/maturity', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCronMessage(`✓ ${data.message}`);
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
        await loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCronRunning(false);
    }
  };

  // Execute Verification
  const handleVerify = async () => {
    if (!verifyingItem) return;
    setActionLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/instruments/${verifyingItem.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: verificationNotes }),
      });
      const data = await res.json();
      if (res.ok) {
        setVerifyingItem(null);
        confetti({ particleCount: 80, spread: 70 });
        await loadData();
      } else {
        setErrorMessage(data.error || 'Verification failed');
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Execute FDR Rejection
  const handleReject = async () => {
    if (!rejectingItem) return;
    if (!rejectionReason.trim()) {
      setErrorMessage('Please provide a statutory discrepancy or rejection reason.');
      return;
    }
    setActionLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/instruments/${rejectingItem.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setRejectingItem(null);
        confetti({ particleCount: 60, spread: 60, colors: ['#e11d48', '#f43f5e'] });
        await loadData();
      } else {
        setErrorMessage(data.error || 'Rejection failed');
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Release Decision (Approve or Reject)
  const handleDecideRelease = async () => {
    if (!decisionItem) return;
    setActionLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/release/${decisionItem.id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: decisionType, reason: decisionReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setDecisionItem(null);
        confetti({ particleCount: 80, spread: 70 });
        await loadData();
      } else {
        setErrorMessage(data.error || 'Decision failed');
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Refund Confirmation
  const handleConfirmRefund = async () => {
    if (!refundItem) return;
    setActionLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/release/${refundItem.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: refundNotes }),
      });
      const data = await res.json();
      if (res.ok) {
        setRefundItem(null);
        confetti({ particleCount: 80, spread: 70 });
        await loadData();
      } else {
        setErrorMessage(data.error || 'Refund confirmation failed');
      }
    } catch (e: any) {
      setErrorMessage(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Queues
  const pendingVerification = instruments.filter(
    i => i.status === 'submitted' || i.status === 'under_verification'
  );
  const discrepancyFlagged = instruments.filter(i => i.flagged || i.flag_severity === 'HIGH_RISK');

  // Find release requests across instruments
  const allReleases: ReleaseRequest[] = [];
  instruments.forEach(i => {
    if (i.release_requests) {
      i.release_requests.forEach(r => {
        allReleases.push({ ...r, instrument: i });
      });
    }
  });

  const pendingReleases = allReleases.filter(r => r.status === 'pending');
  const pendingRefunds = allReleases.filter(r => r.status === 'approved');
  const appealsList = allReleases.filter(r => r.status === 'rejected');

  const role = profile?.role || 'regional_verification_officer';
  const isVerificationOfficer = role === 'regional_verification_officer';
  const isFinanceOfficer = role === 'regional_finance_officer';
  const isBureauHead = role === 'regulation_bureau_head';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onOpenCommandPalette={() => setIsCommandOpen(true)} />
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ROLE-CUSTOMIZED HERO HEADER */}
        <div
          className={`p-6 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
            isVerificationOfficer
              ? 'bg-gradient-to-r from-blue-900 to-indigo-950 text-white border-blue-800'
              : isFinanceOfficer
              ? 'bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white border-emerald-800'
              : 'bg-gradient-to-r from-slate-900 via-purple-950 to-slate-950 text-white border-purple-800'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                  isVerificationOfficer
                    ? 'bg-blue-400/20 text-blue-200 border border-blue-400/30'
                    : isFinanceOfficer
                    ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                    : 'bg-purple-400/20 text-purple-200 border border-purple-400/30'
                }`}
              >
                {isVerificationOfficer && 'Level 1: Intake & Document Verification Authority'}
                {isFinanceOfficer && 'Level 2: Financial Release & NOC Granting Authority'}
                {isBureauHead && 'Level 3: Regulation Bureau Head Executive Console'}
              </span>
              <span className="text-xs text-white/40">•</span>
              <span className="text-xs font-semibold text-white/80">
                {profile?.full_name}
              </span>
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight mt-1.5 flex items-center gap-2.5">
              {isVerificationOfficer && <ShieldCheck className="w-7 h-7 text-blue-400" />}
              {isFinanceOfficer && <FileCheck className="w-7 h-7 text-emerald-400" />}
              {isBureauHead && <Scale className="w-7 h-7 text-amber-400" />}
              <span>
                {isVerificationOfficer && 'Regional FDR Verification Workspace'}
                {isFinanceOfficer && 'Regional Financial Release & NOC Workspace'}
                {isBureauHead && 'Regulation Bureau Appeals & Supervisory Console'}
              </span>
            </h1>

            <p className="text-xs text-white/70 mt-1 max-w-2xl leading-relaxed">
              {isVerificationOfficer &&
                `Assigned to ${profile?.region?.name || 'Western Region (Mumbai)'}. You are authorized to review submitted FDRs, cross-check AI OCR diffs against bank certificates, and activate verified instruments.`}
              {isFinanceOfficer &&
                `Assigned to ${profile?.region?.name || 'Western Region (Mumbai)'}. You hold legal authority to review release justifications, digitally sign release NOC certificates with RSA-2048 keys, and verify bank refund encashments.`}
              {isBureauHead &&
                `Executive Regulatory Oversight. You handle contested case appeals, statutory lock-in exemptions, resolve escalated institutional discrepancies, and oversee cross-regional compliance.`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunMaturityCron}
              disabled={cronRunning}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              title="Runs daily automated check for instruments maturing in 30, 15, and 7 days"
            >
              {cronRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
              <span>Trigger 30/15/7-Day Expiry Check</span>
            </button>
          </div>
        </div>

        {cronMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between alert-slide-in">
            <span>{cronMessage}</span>
            <button onClick={() => setCronMessage('')} className="text-emerald-700 hover:underline cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* ROLE-CUSTOMIZED METRIC CARDS */}
        {isVerificationOfficer && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                <SkeletonMetricCard />
                <SkeletonMetricCard />
                <SkeletonMetricCard />
                <SkeletonMetricCard />
              </>
            ) : (
              <>
                <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs card-hover animate-fade-in-up stagger-1">
                  <span className="text-xs font-semibold uppercase text-slate-400">Pending Intake Review</span>
                  <div className="text-2xl font-black text-blue-700 mt-1">{pendingVerification.length} Cases</div>
                  <p className="text-[11px] text-slate-500 mt-1">Awaiting OCR cross-check</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs card-hover animate-fade-in-up stagger-2">
                  <span className="text-xs font-semibold uppercase text-slate-400">AI Discrepancy Mismatches</span>
                  <div className="text-2xl font-black text-rose-600 mt-1">{discrepancyFlagged.length} High Risk</div>
                  <p className="text-[11px] text-rose-600 font-medium mt-1">Shortfall & bank mismatch alerts</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs card-hover animate-fade-in-up stagger-3">
                  <span className="text-xs font-semibold uppercase text-slate-400">Verified Regional Volume</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    ₹{(instruments.filter(i => i.status === 'active').reduce((s, i) => s + i.amount, 0) / 100000).toFixed(1)} Lakh
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Active verified deposits in region</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs card-hover animate-fade-in-up stagger-4">
                  <span className="text-xs font-semibold uppercase text-slate-400">Verification SLA Turnaround</span>
                  <div className="text-2xl font-black text-indigo-700 mt-1">&lt; 24 Hours</div>
                  <p className="text-[11px] text-slate-500 mt-1">Target AICTE benchmark</p>
                </div>
              </>
            )}
          </div>
        )}

        {isFinanceOfficer && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                <SkeletonMetricCard />
                <SkeletonMetricCard />
                <SkeletonMetricCard />
                <SkeletonMetricCard />
              </>
            ) : (
              <>
                <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs card-hover animate-fade-in-up stagger-1">
                  <span className="text-xs font-semibold uppercase text-slate-400">Pending Release NOCs</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">{pendingReleases.length} Request(s)</div>
                  <p className="text-[11px] text-slate-500 mt-1">Statutory lock-in review queue</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs card-hover animate-fade-in-up stagger-2">
                  <span className="text-xs font-semibold uppercase text-slate-400">Deposit Value Under Review</span>
                  <div className="text-2xl font-black text-amber-600 mt-1">
                    ₹{(pendingReleases.reduce((s, r) => s + (r.instrument?.amount || 0), 0) / 100000).toFixed(1)} Lakh
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Requested for exit/closure</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs card-hover animate-fade-in-up stagger-3">
                  <span className="text-xs font-semibold uppercase text-slate-400">Awaiting Encashment Proof</span>
                  <div className="text-2xl font-black text-purple-700 mt-1">{pendingRefunds.length} Approved</div>
                  <p className="text-[11px] text-slate-500 mt-1">NOC issued, awaiting bank letter</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs card-hover animate-fade-in-up stagger-4">
                  <span className="text-xs font-semibold uppercase text-slate-400">Completed Closures</span>
                  <div className="text-2xl font-black text-slate-800 mt-1">
                    {instruments.filter(i => i.status === 'refund_confirmed').length} Closed
                  </div>
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">Bank confirmed encashment</p>
                </div>
              </>
            )}
          </div>
        )}

        {isBureauHead && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                <SkeletonMetricCard />
                <SkeletonMetricCard />
                <SkeletonMetricCard />
                <SkeletonMetricCard />
              </>
            ) : (
              <>
                <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs card-hover animate-fade-in-up stagger-1">
                  <span className="text-xs font-semibold uppercase text-slate-400">Contested Appeals & Disputes</span>
                  <div className="text-2xl font-black text-purple-700 mt-1">{appealsList.length} Case(s)</div>
                  <p className="text-[11px] text-purple-700 font-medium mt-1">Requiring Bureau Head decision</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs card-hover animate-fade-in-up stagger-2">
                  <span className="text-xs font-semibold uppercase text-slate-400">Regional Portfolio</span>
                  <div className="text-2xl font-black text-blue-900 mt-1">
                    ₹{(instruments.reduce((s, i) => s + i.amount, 0) / 10000000).toFixed(2)} Cr
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Total security deposits managed</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs card-hover animate-fade-in-up stagger-3">
                  <span className="text-xs font-semibold uppercase text-slate-400">Regional Trust Average</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">94.6 / 100</div>
                  <p className="text-[11px] text-slate-500 mt-1">High Institutional Compliance</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs card-hover animate-fade-in-up stagger-4">
                  <span className="text-xs font-semibold uppercase text-slate-400">Supervisory Discrepancies</span>
                  <div className="text-2xl font-black text-amber-600 mt-1">{discrepancyFlagged.length} Flagged</div>
                  <p className="text-[11px] text-slate-500 mt-1">Cross-checked with bank records</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ROLE-SPECIFIC TAB NAVIGATION BAR */}
        <div className="border-b border-slate-200 flex flex-wrap items-center gap-6 text-xs font-bold">
          {/* BUREAU HEAD EXCLUSIVE TAB */}
          {isBureauHead && (
            <button
              onClick={() => setActiveTab('appeals')}
              className={`pb-3 flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'appeals'
                  ? 'border-b-2 border-purple-600 text-purple-700'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Gavel className="w-4 h-4 text-purple-600" />
              <span>Bureau Appeals & Exemption Console ({appealsList.length})</span>
            </button>
          )}

          {/* VERIFICATION QUEUE TAB */}
          <button
            onClick={() => setActiveTab('verification')}
            className={`pb-3 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'verification'
                ? 'border-b-2 border-blue-600 text-blue-700'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isVerificationOfficer ? 'Primary Intake & Verification Queue' : 'Verification Queue (Supervisory)'} ({pendingVerification.length})
            </span>
          </button>

          {/* RELEASE NOC TAB */}
          <button
            onClick={() => setActiveTab('releases')}
            className={`pb-3 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'releases'
                ? 'border-b-2 border-emerald-600 text-emerald-700'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>
              {isFinanceOfficer ? 'Release NOC Decision Queue' : 'Release NOC Queue'} ({pendingReleases.length})
            </span>
          </button>

          {/* REFUND CONFIRMATION TAB */}
          <button
            onClick={() => setActiveTab('refunds')}
            className={`pb-3 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'refunds'
                ? 'border-b-2 border-purple-600 text-purple-700'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>
              {isFinanceOfficer ? 'Bank Encashment Closures' : 'Encashment Closures'} ({pendingRefunds.length})
            </span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 0: BUREAU HEAD EXCLUSIVE APPEALS & EXEMPTIONS CONSOLE       */}
        {/* ============================================================== */}
        {activeTab === 'appeals' && isBureauHead && (
          <div className="bg-white rounded-2xl border border-purple-200 shadow-xs overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-purple-950 flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-purple-700" />
                  Bureau Head Appeals & Exemption Adjudication Matrix
                </h3>
                <p className="text-xs text-purple-800">
                  Institutions appealing rejected release decisions or contesting early course-closure lock-in exemptions.
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-200 text-purple-900 border border-purple-300">
                Exclusive L3 Bureau Jurisdiction
              </span>
            </div>

            <div className="divide-y divide-purple-100 text-xs">
              {appealsList.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  ✓ No contested appeals currently pending Bureau Head review.
                </div>
              ) : (
                appealsList.map(appeal => (
                  <div key={appeal.id} className="p-6 hover:bg-purple-50/40 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">
                            {appeal.instrument?.institution?.name}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                            Rejected by Finance Officer (Appealed)
                          </span>
                        </div>

                        <p className="text-slate-500 mt-1">
                          FDR #{appeal.instrument?.fdr_number} • Principal Amount: ₹
                          {appeal.instrument?.amount.toLocaleString('en-IN')}
                        </p>

                        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 space-y-1.5">
                          <div>
                            <span className="font-bold text-rose-700">L2 Rejection Reason: </span>
                            {appeal.decision_reason}
                          </div>
                          <div>
                            <span className="font-bold text-purple-800">Institution Appeal Petition: </span>
                            {appeal.reason}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setDecisionItem(appeal);
                            setDecisionType('rejected');
                            setDecisionReason('Bureau Head affirms statutory 10-year lock-in requirement. Appeal dismissed.');
                            setErrorMessage('');
                          }}
                          className="px-3.5 py-2 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 transition cursor-pointer"
                        >
                          Uphold Rejection
                        </button>

                        <button
                          onClick={() => {
                            setDecisionItem(appeal);
                            setDecisionType('approved');
                            setDecisionReason('Exemption granted by Regulation Bureau Head under Circular 2024/SEC-09 upon verification of full student clearance.');
                            setErrorMessage('');
                          }}
                          className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md transition cursor-pointer"
                        >
                          Overrule & Grant Bureau NOC
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: VERIFICATION QUEUE (TAILORED BY ROLE)                    */}
        {/* ============================================================== */}
        {activeTab === 'verification' && (
          <div className="space-y-4">
            {/* If Finance Officer views this tab, show clear role separation banner */}
            {isFinanceOfficer && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-5 h-5 text-amber-600" />
                  <div>
                    <span className="font-bold block">Separation of Duties (Read-Only View)</span>
                    <span>
                      Intake verification and OCR inspection is delegated solely to the <b>Regional Verification Officer</b>.
                      Finance Officers hold jurisdiction over Release NOCs and Encashment Closures.
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {isVerificationOfficer ? 'FDR Intake & Document Verification Queue' : 'Regional FDR Verification Queue (Supervisory View)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Side-by-side comparison of declared metadata vs OCR-extracted ground truth
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {pendingVerification.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    ✓ All regional FDR submissions have been verified and activated.
                  </div>
                ) : (
                  pendingVerification.map(item => {
                    const doc = item.documents?.[0];
                    const ocr = doc?.ocr_extracted || {};

                    return (
                      <div key={item.id} className="p-6 hover:bg-slate-50/60 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900">{item.institution?.name}</h4>
                              <span className="text-[11px] text-slate-400">• {item.institution?.aicte_code}</span>
                              <StatusBadge status={item.status} flagged={item.flagged} severity={item.flag_severity} />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              FDR #{item.fdr_number} • Issuing Bank: {item.bank?.name} • Submitted{' '}
                              {new Date(item.created_at || '').toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setViewingDocument({
                                  doc,
                                  instrument: item,
                                  directFileData: (doc?.ocr_extracted as any)?.file_data || null,
                                  directFileName: doc?.file_name || `scan_${item.fdr_number}.pdf`,
                                });
                              }}
                              className="px-3 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                              title="Inspect uploaded scanned document"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-700" />
                              <span>Inspect FDR Scan</span>
                            </button>

                            <Link
                              href={`/instruments/${item.id}`}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                            >
                              Full Inspection
                            </Link>

                            {/* Verification & Rejection Buttons: Active for Verification Officer & Bureau Head, Locked for Finance Officer */}
                            {isFinanceOfficer ? (
                              <button
                                disabled
                                className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 bg-slate-100 rounded-lg border border-slate-200 cursor-not-allowed flex items-center gap-1.5"
                                title="Finance Officers are not permitted to verify or reject incoming FDRs"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Restricted to L1 Officer</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setRejectingItem(item);
                                    setRejectionReason(
                                      item.discrepancy_notes ||
                                        (item.flagged
                                          ? 'Discrepancy mismatch detected between declared FDR and scanned bank instrument.'
                                          : 'Discrepancy detected: Parameters do not match bank verified records.')
                                    );
                                    setErrorMessage('');
                                  }}
                                  className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                                  title="Reject FDR submission with discrepancy notice"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Reject FDR</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setVerifyingItem(item);
                                    setErrorMessage('');
                                  }}
                                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-100" />
                                  <span>{isBureauHead ? 'Supervisory Verify' : 'Verify & Activate'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Side-by-Side OCR Diff Viewer */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                          {/* Declared */}
                          <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                              Institution-Declared Values
                            </span>
                            <div className="space-y-1 text-slate-700">
                              <div>Bank: {item.bank?.name}</div>
                              <div>FDR #: {item.fdr_number}</div>
                              <div className="font-bold text-blue-900">
                                Amount: ₹{item.amount.toLocaleString('en-IN')}
                              </div>
                              <div>Maturity: {item.maturity_date}</div>
                            </div>
                          </div>

                          {/* OCR Extracted */}
                          <div
                            className={`p-3.5 rounded-xl border shadow-2xs ${
                              item.flagged
                                ? 'border-rose-200 bg-rose-50/50'
                                : 'border-emerald-200 bg-emerald-50/50'
                            }`}
                          >
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 flex items-center justify-between">
                              <span>OCR Extracted Ground Truth</span>
                              {item.flagged && (
                                <span className="text-rose-700 font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Discrepancy Mismatch
                                </span>
                              )}
                            </span>
                            <div className="space-y-1 text-slate-800">
                              <div>Bank: {ocr.bank_name || 'State Bank of India'}</div>
                              <div>FDR #: {ocr.fdr_number || item.fdr_number}</div>
                              <div
                                className={`font-bold ${
                                  item.flagged ? 'text-rose-700 underline' : 'text-emerald-900'
                                }`}
                              >
                                Amount: ₹{Number(ocr.amount || item.amount).toLocaleString('en-IN')}
                              </div>
                              <div>Maturity: {ocr.maturity_date || item.maturity_date}</div>
                            </div>
                          </div>
                        </div>

                        {item.discrepancy_notes && (
                          <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 font-medium">
                            <span className="font-bold">AI Discrepancy Alert: </span>
                            {item.discrepancy_notes}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: RELEASE NOC QUEUE (TAILORED BY ROLE)                     */}
        {/* ============================================================== */}
        {activeTab === 'releases' && (
          <div className="space-y-4">
            {/* If Verification Officer views this tab, show separation of duties banner */}
            {isVerificationOfficer && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="font-bold block">Separation of Duties (Read-Only Queue)</span>
                    <span>
                      Authority to issue Release NOCs is legally restricted to the <b>Regional Finance Officer</b> and <b>Bureau Head</b>.
                      Verification Officers cannot authorize deposit releases.
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <h3 className="font-bold text-sm text-slate-900">Security Deposit Release Requests</h3>
                <p className="text-xs text-slate-500">
                  Statutory lock-in completion and program closure NOC approvals
                </p>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {pendingReleases.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    No release requests pending review in this region.
                  </div>
                ) : (
                  pendingReleases.map(req => (
                    <div key={req.id} className="p-6 hover:bg-slate-50/60 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                            <span>{req.instrument?.institution?.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              Pending Decision
                            </span>
                          </div>
                          <p className="text-slate-500 mt-1">
                            FDR #{req.instrument?.fdr_number} • ₹{req.instrument?.amount.toLocaleString('en-IN')} •
                            Requested on {new Date(req.created_at || '').toLocaleDateString()}
                          </p>
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
                            <span className="font-bold block text-slate-900 mb-0.5">Statutory Reason:</span>
                            {req.reason}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isVerificationOfficer ? (
                            <span className="text-[11px] font-semibold text-slate-400 italic px-2 py-1 bg-slate-100 rounded-md">
                              🔒 Requires Finance Officer Sign-Off
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setDecisionItem(req);
                                  setDecisionType('rejected');
                                  setDecisionReason('Additional compliance documentation required.');
                                  setErrorMessage('');
                                }}
                                className="px-3.5 py-1.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 transition cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => {
                                  setDecisionItem(req);
                                  setDecisionType('approved');
                                  setDecisionReason('Complies with statutory lock-in period.');
                                  setErrorMessage('');
                                }}
                                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs transition cursor-pointer"
                              >
                                Approve Release NOC
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: REFUND CONFIRMATIONS QUEUE                               */}
        {/* ============================================================== */}
        {activeTab === 'refunds' && (
          <div className="space-y-4">
            {isVerificationOfficer && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <span>
                    Bank encashment confirmation is performed by the <b>Regional Finance Officer</b> to complete the financial audit trail.
                  </span>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <h3 className="font-bold text-sm text-slate-900">Bank Encashment Confirmation & Closure</h3>
                <p className="text-xs text-slate-500">
                  Confirm institutional bank closure proof to officially complete the regulatory lifecycle
                </p>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {pendingRefunds.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    No approved NOCs currently awaiting bank proof confirmation.
                  </div>
                ) : (
                  pendingRefunds.map(req => (
                    <div key={req.id} className="p-6 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">
                            {req.instrument?.institution?.name}
                          </h4>
                          <p className="text-slate-500 mt-1">
                            Instrument #{req.instrument?.fdr_number} • ₹
                            {req.instrument?.amount.toLocaleString('en-IN')}
                          </p>
                          <p className="text-emerald-700 font-medium text-[11px] mt-1">
                            NOC Certificate issued on {new Date(req.decided_at || '').toLocaleDateString()}
                          </p>
                        </div>

                        {isVerificationOfficer ? (
                          <span className="text-[11px] font-semibold text-slate-400 italic px-2 py-1 bg-slate-100 rounded-md">
                            🔒 L2 Finance Role
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setRefundItem(req);
                              setErrorMessage('');
                            }}
                            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs"
                          >
                            Confirm Bank Refund
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: Verify & Activate */}
      {verifyingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-overlay">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden modal-panel">
            <div className="p-5 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Execute FDR Verification</h3>
                <p className="text-xs text-emerald-200">
                  Instrument #{verifyingItem.fdr_number} • {verifyingItem.institution?.name}
                </p>
              </div>
              <button onClick={() => setVerifyingItem(null)} className="text-emerald-300 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Verification Notes
                </label>
                <textarea
                  rows={3}
                  value={verificationNotes}
                  onChange={e => setVerificationNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                This will record a verified state in <b>verification_records</b>, transition instrument to{' '}
                <b>Active</b>, and write a cryptographically signed SHA-256 entry in the audit ledger.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setVerifyingItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleVerify}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Verifying...' : 'Confirm Verification & Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1B: Reject FDR */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-overlay">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden modal-panel animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-rose-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-300" />
                  <h3 className="font-bold text-sm text-white">Reject FDR Submission</h3>
                </div>
                <p className="text-xs text-rose-200 mt-0.5">
                  Instrument #{rejectingItem.fdr_number} • {rejectingItem.institution?.name}
                </p>
              </div>
              <button
                onClick={() => setRejectingItem(null)}
                className="text-rose-300 hover:text-white p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Common Discrepancy Reasons (Click to apply)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    'Amount mismatch between declared values and scanned document',
                    'Maturity date does not satisfy AICTE mandatory lock-in period',
                    'FDR not issued in joint favor of AICTE as required by regulations',
                    'Scanned document is illegible or missing bank stamp/signature',
                    'Invalid bank branch or unrecognized scheduled commercial bank',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectionReason(preset)}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 text-slate-700 transition cursor-pointer text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Statutory Rejection Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Detail the exact statutory grounds or document discrepancies..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans"
                  required
                />
              </div>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-800">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Statutory Consequences of Rejection:
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-rose-800">
                  <li>Instrument status marked as <b>Rejected</b> and flagged as <b>High Risk</b>.</li>
                  <li>Discrepancy notes recorded in official verification history.</li>
                  <li>Cryptographic SHA-256 audit ledger entry generated.</li>
                  <li>Institution immediately alerted via role-targeted notification to rectify.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading || !rejectionReason.trim()}
                  onClick={handleReject}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{actionLoading ? 'Rejecting...' : 'Confirm FDR Rejection'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Release Decision */}
      {decisionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-overlay">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden modal-panel">
            <div
              className={`p-5 text-white flex items-center justify-between ${
                decisionType === 'approved' ? 'bg-blue-900' : 'bg-rose-900'
              }`}
            >
              <div>
                <h3 className="font-bold text-sm text-white">
                  {decisionType === 'approved' ? 'Approve Release NOC Certificate' : 'Reject Release Request'}
                </h3>
                <p className="text-xs opacity-80">{decisionItem.instrument?.institution?.name}</p>
              </div>
              <button onClick={() => setDecisionItem(null)} className="opacity-80 hover:opacity-100">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Decision Reason (Mandatory)
                </label>
                <textarea
                  rows={3}
                  value={decisionReason}
                  onChange={e => setDecisionReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300"
                  required
                />
              </div>

              {decisionType === 'approved' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                  Approving will automatically issue a digitally signed Release / NOC Certificate with a
                  verifiable RSA-2048 cryptographic seal.
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDecisionItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDecideRelease}
                  className={`px-5 py-2 font-bold text-xs text-white rounded-lg shadow-md cursor-pointer disabled:opacity-50 ${
                    decisionType === 'approved' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {actionLoading ? 'Processing...' : `Confirm ${decisionType.toUpperCase()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Confirm Refund */}
      {refundItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-overlay">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden modal-panel">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Confirm Bank Encashment & Final Closure</h3>
                <p className="text-xs text-slate-300">{refundItem.instrument?.institution?.name}</p>
              </div>
              <button onClick={() => setRefundItem(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Proof Verification Notes
                </label>
                <textarea
                  rows={3}
                  value={refundNotes}
                  onChange={e => setRefundNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300"
                />
              </div>

              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <b>Record-keeping verification:</b> This marks the FDR status as <b>Refund Confirmed</b>,
                signaling complete fulfillment of the institution&apos;s security deposit lifecycle.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setRefundItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleConfirmRefund}
                  className="px-5 py-2 bg-blue-700 text-white font-bold text-xs rounded-lg hover:bg-blue-800 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Closing...' : 'Confirm Encashment & Close Lifecycle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
        document={viewingDocument?.doc}
        instrument={viewingDocument?.instrument}
        directFileData={viewingDocument?.directFileData}
        directFileName={viewingDocument?.directFileName}
      />
    </div>
  );
}
