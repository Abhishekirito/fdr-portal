'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { AuditIntegrityModal } from '@/components/AuditIntegrityModal';
import { CommandPalette } from '@/components/CommandPalette';
import { SkeletonMetricCard, SkeletonTable, SkeletonChart, SkeletonHeroBanner, SkeletonQueueCard } from '@/components/Skeleton';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Building2,
  Users,
  FileText,
  BarChart2,
  PieChart as PieChartIcon,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  UserPlus,
  Scale,
  Shield,
  AlertOctagon,
  Download,
  Eye,
  Send,
  FileWarning,
  Search,
  Filter,
  Server,
  Key,
  Activity,
  Layers,
  Database,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { FDRInstrument, Profile, AuditLogEntry, Institution } from '@/lib/supabase/types';

const COLORS = ['#0f2b48', '#059669', '#d97706', '#dc2626', '#8b5cf6', '#3b82f6'];

export default function AdminDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [instruments, setInstruments] = useState<FDRInstrument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Super Admin view switch: IT & Security console vs Read-Only Compliance Observer
  const [superAdminTab, setSuperAdminTab] = useState<'it_security' | 'compliance_observer'>('it_security');

  // Central Compliance filters & actions
  const [complianceRegionFilter, setComplianceRegionFilter] = useState('ALL');
  const [complianceSeverityFilter, setComplianceSeverityFilter] = useState('ALL');
  const [complianceSearch, setComplianceSearch] = useState('');
  const [complianceActionSuccess, setComplianceActionSuccess] = useState('');

  // Show-Cause Notice Modal state (active only for Central Compliance)
  const [showCauseModal, setShowCauseModal] = useState<{
    open: boolean;
    instrument: FDRInstrument | null;
    reference: string;
    message: string;
  }>({
    open: false,
    instrument: null,
    reference: '',
    message: '',
  });

  // Officer invite state (Super Admin only)
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('regional_verification_officer');
  const [inviteRegion, setInviteRegion] = useState('11111111-1111-1111-1111-111111111111');
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [instRes, sessRes, auditRes, orgsRes] = await Promise.all([
        fetch('/api/instruments'),
        fetch('/api/auth/session'),
        fetch('/api/audit'),
        fetch('/api/institutions').catch(() => null),
      ]);

      const instData = await instRes.json();
      const sessData = await sessRes.json();
      const auditData = await auditRes.json();
      const orgsData = orgsRes ? await orgsRes.json() : null;

      if (instData.instruments) setInstruments(instData.instruments);
      if (sessData.currentProfile) {
        setProfile(sessData.currentProfile);
      }
      if (sessData.allProfiles) setAllProfiles(sessData.allProfiles);
      if (auditData.logs) setAuditLogs(auditData.logs);
      if (orgsData?.institutions) setInstitutions(orgsData.institutions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteOfficer = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSuccess(`Provisioned officer invitation for ${inviteEmail} with mandatory TOTP MFA enforcement on initial sign-in.`);
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteName('');
  };

  const handleDispatchShowCause = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCauseModal.instrument) return;
    setComplianceActionSuccess(
      `Dispatched Statutory Show-Cause Notice ${showCauseModal.reference} to ${showCauseModal.instrument.institution?.name}. Response mandatory within 7 business days.`
    );
    setShowCauseModal({ open: false, instrument: null, reference: '', message: '' });
  };

  const handleTriggerAudit = (inst: Institution) => {
    setComplianceActionSuccess(
      `Ordered Special Compliance Vigilance Audit for ${inst.name} (AICTE Code: ${inst.aicte_code}). Regional Bureau Head notified.`
    );
  };

  const handleExportDossier = () => {
    const csvContent = [
      ['FDR Number', 'Institution', 'AICTE Code', 'Region', 'Bank', 'Amount', 'Status', 'Flag Severity', 'Discrepancy Notes'],
      ...instruments.map(i => [
        `"${i.fdr_number}"`,
        `"${i.institution?.name || ''}"`,
        `"${i.institution?.aicte_code || ''}"`,
        `"${i.institution?.region?.name || ''}"`,
        `"${i.bank?.name || ''}"`,
        i.amount,
        i.status,
        i.flag_severity,
        `"${(i.discrepancy_notes || '').replace(/"/g, '""')}"`,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AICTE_National_Compliance_Dossier_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics
  const totalDepositAmount = instruments
    .filter(i => i.status === 'active')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalInstruments = instruments.length;
  const flaggedInstruments = instruments.filter(i => i.flagged || i.flag_severity === 'HIGH_RISK');
  const flaggedCount = flaggedInstruments.length;

  // Filtered Discrepancies for Compliance Queue
  const filteredDiscrepancies = useMemo(() => {
    return instruments.filter(i => {
      const isRelevant = i.flagged || i.flag_severity === 'HIGH_RISK' || i.discrepancy_notes;
      if (!isRelevant) return false;

      if (complianceRegionFilter !== 'ALL' && i.institution?.region_id !== complianceRegionFilter) {
        return false;
      }
      if (complianceSeverityFilter !== 'ALL' && i.flag_severity !== complianceSeverityFilter) {
        return false;
      }
      if (complianceSearch.trim()) {
        const q = complianceSearch.toLowerCase();
        const instName = (i.institution?.name || '').toLowerCase();
        const fdrNum = i.fdr_number.toLowerCase();
        const bankName = (i.bank?.name || '').toLowerCase();
        if (!instName.includes(q) && !fdrNum.includes(q) && !bankName.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [instruments, complianceRegionFilter, complianceSeverityFilter, complianceSearch]);

  // Chart 1: Deposit Distribution by Bank
  const bankMap: Record<string, number> = {};
  instruments.forEach(i => {
    const bName = i.bank?.name || 'Other Bank';
    bankMap[bName] = (bankMap[bName] || 0) + i.amount;
  });
  const bankChartData = Object.entries(bankMap).map(([name, amount]) => ({
    name,
    amount,
  }));

  // Chart 2: Status Breakdown
  const statusMap: Record<string, number> = {};
  instruments.forEach(i => {
    statusMap[i.status] = (statusMap[i.status] || 0) + 1;
  });
  const statusChartData = Object.entries(statusMap).map(([status, count]) => ({
    status: status.replace(/_/g, ' ').toUpperCase(),
    count,
  }));

  // Renders National Compliance View (either full authority for Compliance Officer, or Read-Only Observer for Super Admin)
  const renderComplianceView = (isReadOnly: boolean) => (
    <div className="space-y-6 animate-in fade-in">
      {/* Notice & Export Bar */}
      {isReadOnly ? (
        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-400/30">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Read-Only Compliance Observer Mode</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Separation of Duties Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Viewing national compliance & discrepancy telemetry as Super Admin for technical & system audit. Operational actions (Show-Cause notices, appeals, audits) are restricted to the Central Compliance Officer.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDossier}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer btn-press"
            >
              <Download className="w-4 h-4" />
              <span>Export National Compliance Dossier</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-blue-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">National Regulatory Scope Active</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-400/20 text-blue-300 border border-blue-400/30">
                  Cross-Regional Ombudsman
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Unlike Regional Officers whose access is partitioned by region, Central Compliance monitors cross-regional anomalies, recurring institutional shortfall patterns, and systemic bank guarantee risks across India.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDossier}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer btn-press"
            >
              <Download className="w-4 h-4" />
              <span>Export National Compliance Dossier</span>
            </button>
          </div>
        </div>
      )}

      {complianceActionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between alert-slide-in">
          <span>{complianceActionSuccess}</span>
          <button onClick={() => setComplianceActionSuccess('')} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* National Compliance Metrics */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonMetricCard />
          <SkeletonMetricCard />
          <SkeletonMetricCard />
          <SkeletonMetricCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs card-hover">
            <span className="text-xs font-semibold uppercase text-slate-400">National Total Active Deposit</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              ₹{(totalDepositAmount / 10000000).toFixed(2)} Cr
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Across 4 AICTE Regional Offices</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs card-hover">
            <span className="text-xs font-semibold uppercase text-slate-400">Flagged Fraud & Discrepancies</span>
            <div className="text-2xl font-black text-rose-600 mt-1">{flaggedCount} Cases</div>
            <p className="text-[11px] text-rose-600 font-medium mt-1">Active regulatory investigations</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs card-hover">
            <span className="text-xs font-semibold uppercase text-slate-400">At-Risk Institutions</span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {institutions.filter(i => (i.trust_score || 100) < 80).length || 1}
            </div>
            <p className="text-[11px] text-amber-600 font-medium mt-1">Trust Score &lt; 80% (Watchlist)</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs card-hover">
            <span className="text-xs font-semibold uppercase text-slate-400">Scheduled Issuing Banks</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{bankChartData.length} Banks</div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">PSU & Private Scheduled Mix</p>
          </div>
        </div>
      )}

      {/* National Discrepancy & Anti-Fraud Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900">
                National Discrepancy & Fraud Investigation Queue
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                {filteredDiscrepancies.length} Active Matters
              </span>
            </div>
            <p className="text-xs text-slate-500">
              High-risk anomalies flagged across all 4 regional offices requiring national compliance action
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search institution / FDR..."
                value={complianceSearch}
                onChange={e => setComplianceSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-blue-500"
              />
            </div>

            <select
              value={complianceRegionFilter}
              onChange={e => setComplianceRegionFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-xl border border-slate-300 bg-white"
            >
              <option value="ALL">All Regions (Pan-India)</option>
              <option value="11111111-1111-1111-1111-111111111111">Western (Mumbai)</option>
              <option value="22222222-2222-2222-2222-222222222222">Northern (Delhi)</option>
              <option value="33333333-3333-3333-3333-333333333333">Southern (Bangalore)</option>
              <option value="44444444-4444-4444-4444-444444444444">Eastern (Kolkata)</option>
            </select>

            <select
              value={complianceSeverityFilter}
              onChange={e => setComplianceSeverityFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-xl border border-slate-300 bg-white"
            >
              <option value="ALL">All Severities</option>
              <option value="HIGH_RISK">High Risk</option>
              <option value="MEDIUM_RISK">Medium Risk</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100">
            <SkeletonQueueCard />
            <SkeletonQueueCard />
            <SkeletonQueueCard />
          </div>
        ) : filteredDiscrepancies.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No active discrepancies matching current filters. All national instruments verified or clean.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDiscrepancies.map(inst => (
              <div key={inst.id} className="p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4 card-hover">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">{inst.institution?.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {inst.institution?.aicte_code}
                    </span>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {inst.institution?.region?.name || 'Regional Office'}
                    </span>
                    {inst.flag_severity === 'HIGH_RISK' && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3" /> High Risk Violation
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                    <span>
                      <strong>FDR:</strong> {inst.fdr_number}
                    </span>
                    <span>•</span>
                    <span>
                      <strong>Issuing Bank:</strong> {inst.bank?.name} ({inst.bank?.branch})
                    </span>
                    <span>•</span>
                    <span>
                      <strong>Declared Amount:</strong> ₹{inst.amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                    <FileWarning className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Detected Discrepancy: </span>
                      {inst.discrepancy_notes || 'OCR Verification mismatch identified against issuing bank records.'}
                    </div>
                  </div>
                </div>

                {/* Regulatory Action Buttons (Active for Compliance Officer, Disabled/Hidden for Super Admin) */}
                <div className="flex items-center gap-2 shrink-0">
                  {isReadOnly ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-semibold border border-slate-200">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Read-Only: Actions Restricted to Compliance Officer</span>
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() =>
                          setShowCauseModal({
                            open: true,
                            instrument: inst,
                            reference: `AICTE/VIG/${new Date().getFullYear()}/${inst.fdr_number.slice(-4)}`,
                            message: `You are hereby directed to explain the discrepancy in deposit instrument ${inst.fdr_number} (${inst.discrepancy_notes}) within 7 business days.`,
                          })
                        }
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer btn-press"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Issue Show-Cause Notice</span>
                      </button>

                      <button
                        onClick={() => {
                          setComplianceActionSuccess(
                            `Matter ${inst.fdr_number} escalated to Regulation Bureau Head (Prof. Anil Sahasrabudhe) for statutory hearing.`
                          );
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition cursor-pointer btn-press"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Escalate to Bureau Head</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Institutional Trust Score Watchlist & Bank Exposure Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Institutional Trust Watchlist */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Institutional Trust & Risk Watchlist</h3>
              <p className="text-xs text-slate-500">Ranked by algorithmic compliance score (1-100)</p>
            </div>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>

          <div className="divide-y divide-slate-100 overflow-hidden text-xs">
            {institutions.slice(0, 5).map(inst => (
              <div key={inst.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900">{inst.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {inst.aicte_code} • {inst.region?.name || 'Regional Office'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <TrustScoreBadge score={inst.trust_score} showLabel={false} />
                  {isReadOnly ? (
                    <span className="text-[10px] font-semibold text-slate-400 px-2 py-1 bg-slate-50 rounded border border-slate-200">
                      Audit Restricted (SoD)
                    </span>
                  ) : (
                    <button
                      onClick={() => handleTriggerAudit(inst)}
                      className="px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                    >
                      Order Audit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bank Risk & Exposure Monitor */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Bank Holding Concentration & Exposure</h3>
              <p className="text-xs text-slate-500">Distribution of locked institutional funds across banks</p>
            </div>
            <PieChartIcon className="w-4 h-4 text-blue-600" />
          </div>

          <div className="h-56 w-full">
            {loading ? (
              <SkeletonChart height="h-56" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bankChartData}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    label={entry => (entry?.name ? String(entry.name).split(' ')[0] : '')}
                  >
                    {bankChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onOpenCommandPalette={() => setIsCommandOpen(true)} />
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      <AuditIntegrityModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        initialEntries={auditLogs}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Role Banner */}
        {loading ? (
          <SkeletonHeroBanner />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 card-hover animate-fade-in">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  AICTE Central Headquarters • New Delhi
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  <Shield className="w-3 h-3 text-blue-600" />
                  Active Session: {profile?.role.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-900 mt-1">
                {profile?.role === 'central_compliance_officer'
                  ? 'National Regulatory Compliance & Vigilance Workbench'
                  : superAdminTab === 'compliance_observer'
                  ? 'National Compliance Telemetry (Super Admin Observer)'
                  : 'Central System Administration & Cryptographic Governance'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {profile?.role === 'central_compliance_officer'
                  ? 'Pan-India oversight of institutional compliance, systemic bank exposure, fraud investigation, and cross-regional ombudsman escalations.'
                  : superAdminTab === 'compliance_observer'
                  ? 'Read-only technical audit of cross-regional discrepancies, institutional trust scores, and bank guarantee exposure across AICTE.'
                  : 'Global IT operations: officer role provisioning with mandatory MFA, cryptographic SHA-256 audit ledger verification, and system security posture.'}
              </p>
            </div>

            {/* Role Scope Controls: Strict fixed scope for Compliance, Tab Switcher for Super Admin */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              {profile?.role === 'central_compliance_officer' ? (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold shadow-xs">
                  <Scale className="w-4 h-4 text-blue-700" />
                  <span>Jurisdiction: Central Compliance Ombudsman (National Scope)</span>
                </div>
              ) : (
                <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
                  <button
                    onClick={() => setSuperAdminTab('it_security')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer btn-press ${
                      superAdminTab === 'it_security'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>IT & Security Console</span>
                  </button>
                  <button
                    onClick={() => setSuperAdminTab('compliance_observer')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer btn-press ${
                      superAdminTab === 'compliance_observer'
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>Compliance Observer (Read-Only)</span>
                    {flaggedCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-extrabold">
                        {flaggedCount}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: CENTRAL COMPLIANCE OFFICER DASHBOARD (Strict Access)              */}
        {/* ========================================================================= */}
        {profile?.role === 'central_compliance_officer' && renderComplianceView(false)}

        {/* ========================================================================= */}
        {/* VIEW 2: SUPER ADMIN DASHBOARD                                             */}
        {/* ========================================================================= */}
        {profile?.role === 'super_admin' && (
          <>
            {/* Sub-view A: Super Admin IT & Security Console */}
            {superAdminTab === 'it_security' && (
              <div className="space-y-6 animate-in fade-in">
                {/* Separation of Duties & Cryptographic Ledger Notice */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-400/30">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">Central System Administration</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          Separation of Duties Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Super Admin accounts hold global system configuration, cryptographic ledger verification, and user provisioning, but are{' '}
                        <span className="text-amber-300 font-bold underline">barred in code (HTTP 403)</span> from executing FDR verifications or release approvals.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsAuditModalOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-300" />
                      <span>Verify Cryptographic Audit Integrity</span>
                    </button>
                  </div>
                </div>

                {inviteSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between alert-slide-in">
                    <span>{inviteSuccess}</span>
                    <button onClick={() => setInviteSuccess('')} className="text-emerald-700 hover:underline">
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Super Admin System Stats */}
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SkeletonMetricCard />
                    <SkeletonMetricCard />
                    <SkeletonMetricCard />
                    <SkeletonMetricCard />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs card-hover">
                      <span className="text-xs font-semibold uppercase text-slate-400">Total Registered Personnel</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">{allProfiles.length} Users</div>
                      <p className="text-[11px] text-slate-500 mt-1">Officers & institution registrars</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs card-hover">
                      <span className="text-xs font-semibold uppercase text-slate-400">Cryptographic Audit Ledger</span>
                      <div className="text-2xl font-black text-emerald-600 mt-1">{auditLogs.length} Blocks</div>
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">100% SHA-256 Tamper-Evident</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs card-hover">
                      <span className="text-xs font-semibold uppercase text-slate-400">MFA Enforcement Status</span>
                      <div className="text-2xl font-black text-blue-700 mt-1">100% TOTP</div>
                      <p className="text-[11px] text-slate-500 mt-1">Mandatory for all officer roles</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs card-hover">
                      <span className="text-xs font-semibold uppercase text-slate-400">System Microservices</span>
                      <div className="text-2xl font-black text-emerald-600 mt-1">4 / 4 Online</div>
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">DB RLS, S3 Vault, AI OCR, Cron</p>
                    </div>
                  </div>
                )}

                {/* Officer Provisioning Workbench (Super Admin ONLY) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900">Regulatory Personnel & Role Provisioning</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                          Super Admin Privilege
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Invite-only officer accounts with strict regional scoping and mandatory TOTP MFA
                      </p>
                    </div>

                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="flex items-center gap-2 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Provision Officer Account</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                          <th className="py-3 px-5">Officer Name</th>
                          <th className="py-3 px-5">Official Email</th>
                          <th className="py-3 px-5">Assigned Role</th>
                          <th className="py-3 px-5">Regional Scope</th>
                          <th className="py-3 px-5">MFA Status</th>
                          <th className="py-3 px-5">Account Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loading ? (
                          <SkeletonTable rows={4} cols={6} />
                        ) : (
                          allProfiles.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3.5 px-5 font-bold text-slate-900">{p.full_name}</td>
                              <td className="py-3.5 px-5 text-slate-600">{p.email}</td>
                              <td className="py-3.5 px-5">
                                <span className="capitalize font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  {p.role.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="py-3.5 px-5 text-slate-600">{p.region?.name || 'Central / All Regions'}</td>
                              <td className="py-3.5 px-5">
                                {p.mfa_enabled ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> TOTP Enabled
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400">Pending Setup</span>
                                )}
                              </td>
                              <td className="py-3.5 px-5">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cryptographic Audit Chain Block Explorer */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Cryptographic Audit Chain Block Explorer</h3>
                      <p className="text-xs text-slate-500">Live SHA-256 tamper-evident hash chaining across system events</p>
                    </div>
                    <button
                      onClick={() => setIsAuditModalOpen(true)}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Launch Deep Verifier</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 font-mono text-[11px]">
                    {auditLogs.slice(0, 5).map((log, idx) => (
                      <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px]">
                              Block #{auditLogs.length - idx}
                            </span>
                            <span className="text-blue-800 font-semibold">{log.action}</span>
                            <span className="text-[10px] text-slate-400">Entity: {log.entity_type}</span>
                          </div>
                          <div className="text-slate-500 text-[10px] truncate max-w-xl">
                            Hash: <span className="text-emerald-700">{log.entry_hash}</span>
                          </div>
                        </div>

                        <div className="text-right text-[10px] text-slate-400 shrink-0">
                          {new Date(log.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Infrastructure Telemetry */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
                    <Database className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">PostgreSQL + RLS Policies</div>
                      <div className="text-[11px] text-slate-500">Enforced on all 7 core tables</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
                    <Server className="w-8 h-8 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Python FastAPI AI Engine</div>
                      <div className="text-[11px] text-slate-500">Port 8000 (OCR & Discrepancy)</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
                    <Key className="w-8 h-8 text-amber-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Cryptographic Signing Key</div>
                      <div className="text-[11px] text-slate-500">RSA-2048 Release Certificate Signer</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view B: Super Admin Compliance Observer (Read-Only) */}
            {superAdminTab === 'compliance_observer' && renderComplianceView(true)}
          </>
        )}
      </main>

      {/* Provision Officer Modal (Super Admin) */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden modal-panel">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Provision New Regulatory Officer</h3>
                <p className="text-xs text-slate-300">Invite-only flow with mandatory TOTP MFA</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-white cursor-pointer btn-press">
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteOfficer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Officer Full Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="e.g. Shri Amit Sharma"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 input-focus"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email Address (@aicte.gov.in)
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="e.g. amit.sharma@aicte.gov.in"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 input-focus"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white input-focus"
                  >
                    <option value="regional_verification_officer">Regional Verification Officer</option>
                    <option value="regional_finance_officer">Regional Finance Officer</option>
                    <option value="regulation_bureau_head">Regulation Bureau Head</option>
                    <option value="central_compliance_officer">Central Compliance Officer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Region</label>
                  <select
                    value={inviteRegion}
                    onChange={e => setInviteRegion(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white input-focus"
                  >
                    <option value="11111111-1111-1111-1111-111111111111">Western (Mumbai)</option>
                    <option value="22222222-2222-2222-2222-222222222222">Northern (Delhi)</option>
                    <option value="33333333-3333-3333-3333-333333333333">Southern (Bangalore)</option>
                    <option value="44444444-4444-4444-4444-444444444444">Eastern (Kolkata)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed">
                The officer will receive an invitation link to set up their password. Mandatory Google/Microsoft
                Authenticator TOTP MFA is enforced on first sign-in.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer btn-press"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 text-white font-bold text-xs rounded-lg hover:bg-blue-800 shadow-md cursor-pointer btn-press"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Show-Cause Notice Modal (Central Compliance Only) */}
      {showCauseModal.open && showCauseModal.instrument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden modal-panel">
            <div className="p-5 bg-rose-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Issue Statutory Show-Cause Notice</h3>
                <p className="text-xs text-rose-200">
                  {showCauseModal.instrument.institution?.name} • FDR #{showCauseModal.instrument.fdr_number}
                </p>
              </div>
              <button
                onClick={() => setShowCauseModal({ open: false, instrument: null, reference: '', message: '' })}
                className="text-rose-200 hover:text-white cursor-pointer btn-press"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchShowCause} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Reference Number</label>
                <input
                  type="text"
                  value={showCauseModal.reference}
                  onChange={e => setShowCauseModal({ ...showCauseModal, reference: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Discrepancy Details & Directive</label>
                <textarea
                  rows={4}
                  value={showCauseModal.message}
                  onChange={e => setShowCauseModal({ ...showCauseModal, message: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                This notice will be recorded in the SHA-256 cryptographic audit ledger and dispatched via email and portal notification to the Head of Institution. Response is mandated within 7 business days.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCauseModal({ open: false, instrument: null, reference: '', message: '' })}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-700 text-white font-bold text-xs rounded-lg hover:bg-rose-800 shadow-md cursor-pointer"
                >
                  Dispatch Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
