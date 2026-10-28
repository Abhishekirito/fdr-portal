'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  Lock,
  Search,
  FileText,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Phone,
  Mail,
  Award,
  Clock,
  AlertTriangle,
  Key,
  Users,
  Scale,
  FileCheck,
  RefreshCw,
  X,
  Sparkles,
  HelpCircle,
  AlertOctagon,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';

export default function HomePage() {
  const router = useRouter();

  // Public Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<any>(null);

  React.useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.currentProfile && data.currentProfile.id) {
        const hasValidCookie =
          typeof document !== 'undefined' &&
          document.cookie.includes('aicte_current_profile_id=') &&
          !document.cookie.match(/aicte_current_profile_id=(;|(?=\s*$))/);
        if (hasValidCookie) {
          setCurrentProfile(data.currentProfile);
        } else {
          setCurrentProfile(null);
        }
      } else {
        setCurrentProfile(null);
      }
    } catch {
      setCurrentProfile(null);
    }
  };

  const getDashboardUrl = () => {
    if (!currentProfile) return '/login';
    if (currentProfile.role === 'institution') return '/institution/dashboard';
    if (currentProfile.role === 'central_compliance_officer' || currentProfile.role === 'super_admin') {
      return '/admin/dashboard';
    }
    return '/officer/dashboard';
  };

  // Search execution
  const handlePublicSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/instruments/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-amber-200 selection:text-slate-900 animate-fade-in">
      {/* 1. Official National Tri-Color Header Strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600 shadow-xs" />

      {/* 2. Top Government Identity Bar */}
      <div className="bg-slate-900 text-white text-[11px] py-1.5 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wider text-amber-400">भारत सरकार</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">Government of India</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">शिक्षा मंत्रालय • Ministry of Education</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[10px]">
            <span>Screen Reader Access</span>
            <span>A- A A+</span>
            <span className="text-amber-400 font-semibold cursor-pointer">English / हिन्दी</span>
          </div>
        </div>
      </div>

      {/* 3. Main Navigation & Council Brand Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* AICTE Emblem & Brand */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0f2b48] to-blue-900 text-white flex items-center justify-center font-serif text-2xl font-bold shadow-md border-2 border-amber-400">
                🏛️
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Regulation Bureau
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Statutory Apex Body</span>
                </div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  All India Council for Technical Education
                </h1>
                <p className="text-[11px] text-slate-500">
                  National Security Deposit & Fixed Deposit Receipt (FDR) Portal
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3">
              <a
                href="#public-search"
                className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-900 px-3 py-2 rounded-lg transition"
              >
                <Search className="w-3.5 h-3.5 text-blue-700" />
                <span>Verify Deposit</span>
              </a>

              {currentProfile ? (
                <div className="flex items-center gap-2.5">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-900">{currentProfile.full_name || 'Authorized Official'}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Session ({currentProfile.role === 'institution' ? 'Institution' : 'Officer'})
                    </span>
                  </div>
                  <Link
                    href={getDashboardUrl()}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-md transition cursor-pointer"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <>
                  <Link
                    href="/login/institution"
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 rounded-xl transition cursor-pointer shadow-xs"
                  >
                    <Building2 className="w-3.5 h-3.5 text-blue-700" />
                    <span>Institution Login</span>
                  </Link>

                  <Link
                    href="/login/officer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-[#0f2b48] text-white hover:bg-blue-950 rounded-xl transition cursor-pointer shadow-md"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Officer Login</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 4. Statutory Notification Ticker */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 py-2 px-4 text-xs text-amber-950 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center gap-3">
          <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-900 font-black text-[10px] uppercase tracking-wider shrink-0">
            Official Circular
          </span>
          <p className="truncate text-[11px] text-slate-800 font-medium">
            <strong>Mandatory Joint FDR Directive 2024–27:</strong> All affiliated technical institutions must maintain joint Fixed Deposit Receipts in Scheduled Commercial Banks. Non-renewed instruments approaching maturity face automatic compliance review under AICTE Approval Process Handbook.
          </p>
        </div>
      </div>

      {/* 5. Hero Section */}
      <section className="bg-gradient-to-br from-[#0a1b2d] via-[#0f2b48] to-[#122238] text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Decorative Rings */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Problem Statement 26265 • Smart Governance Automation</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Securing Technical Education Endowments Across India.
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              A unified national portal for the AICTE Regulation Bureau to manage institution security deposits and Fixed Deposit Receipts (FDRs): AI OCR auto-extraction, two-tier regional verification, automated maturity tracking, chained renewals, and tamper-evident cryptographic settlement.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {currentProfile ? (
                <Link
                  href={getDashboardUrl()}
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-xl transition-all cursor-pointer hover:scale-[1.02] btn-press"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Resume Session → Open {currentProfile.role === 'institution' ? 'Institution' : 'Officer'} Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login/institution"
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-xl transition-all cursor-pointer hover:scale-[1.02] btn-press"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Institution Portal (Colleges)</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>

                  <Link
                    href="/login/officer"
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white border border-slate-600 font-bold text-xs sm:text-sm transition-all cursor-pointer btn-press"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Regulatory Officer Sign-In</span>
                  </Link>
                </>
              )}
            </div>

            {/* Micro Pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AI OCR Intake Diff</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>SHA-256 Hash Chain</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>pg_cron Maturity Alert</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Card */}
          <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  National Deposit Ledger
                </span>
                <div className="text-3xl font-black text-white mt-1">₹14.80+ Cr</div>
                <p className="text-xs text-slate-400">Total Secured Deposits under AICTE Lien</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="w-8 h-8" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Institutions</span>
                <div className="text-xl font-bold text-white mt-0.5">10+ Technical Univs</div>
                <p className="text-[10px] text-slate-400 mt-0.5">VJTI, COEP, DTU, NSUT</p>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Jurisdictions</span>
                <div className="text-xl font-bold text-white mt-0.5">4 Regional Offices</div>
                <p className="text-[10px] text-slate-400 mt-0.5">WRO, NRO, SRO, ERO</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-900/40 border border-blue-400/30 text-xs text-slate-300 flex items-start gap-3">
              <Scale className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Strict Separation of Duties Active:</strong>
                <p className="text-[11px] mt-0.5 text-slate-300">
                  Platform Administrators are strictly prevented in code from approving financial payouts. Operational releases require multi-party concurrence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Public FDR Verification & Certificate Lookup */}
      <section id="public-search" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 w-full animate-fade-in-up">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
          <div className="max-w-3xl mx-auto text-center space-y-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              Public Verification Portal
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Verify Institutional Fixed Deposit Receipt (FDR)
            </h3>
            <p className="text-xs text-slate-500">
              Verify statutory compliance, active lien status, and issuing bank records by entering the AICTE Permanent Institution Code or FDR Reference Number.
            </p>
          </div>

          <form onSubmit={handlePublicSearch} className="max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter AICTE Code (e.g. 1-10023481) or FDR # (e.g. FDR-SBI-2024-81920)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-blue-600 bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={searching}
                className="w-full sm:w-auto px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer shrink-0 disabled:opacity-50"
              >
                {searching ? 'Verifying...' : 'Verify Deposit'}
              </button>
            </div>
          </form>

          {/* Search Results Display */}
          {hasSearched && (
            <div className="mt-8 border-t border-slate-100 pt-6 max-w-4xl mx-auto">
              {searchResults && searchResults.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Found {searchResults.length} Verified Statutory Deposit(s)</span>
                    <span className="text-emerald-700 text-[11px]">✓ Records Authenticated from AICTE Vault</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map(res => (
                      <div
                        key={res.id}
                        className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white transition shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded">
                              AICTE: {res.aicte_code}
                            </span>
                            <h4 className="font-bold text-sm text-slate-900 mt-1">{res.institution_name}</h4>
                            <p className="text-[11px] text-slate-500">{res.region_name}</p>
                          </div>
                          <TrustScoreBadge score={res.trust_score} showLabel={false} />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
                          <div>
                            <span className="text-[10px] text-slate-400">FDR Reference</span>
                            <div className="font-mono font-bold text-slate-800 text-[11px]">{res.fdr_number}</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400">Issuing Bank</span>
                            <div className="font-semibold text-slate-800 text-[11px]">{res.bank_name}</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400">Principal Deposit</span>
                            <div className="font-bold text-slate-900">₹{res.amount.toLocaleString('en-IN')}</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400">Deposit Status</span>
                            <div>
                              <StatusBadge status={res.status} />
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                          <span>Matures: {res.maturity_date}</span>
                          <span className="text-emerald-600 font-bold">Lien Marked to Member Secretary, AICTE</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs space-y-1">
                  <AlertOctagon className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">No matching security deposit record found.</p>
                  <p className="text-slate-400">
                    Please ensure the AICTE Permanent Institute ID (e.g. 1-10023481) or FDR Reference number is accurate.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 7. Key Portal Pillars / Architecture Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            System Pillars
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
            Engineered for Transparency, Compliance & Zero Fraud
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Replacing cumbersome manual paper registries with an integrated, multi-tier digital regulatory workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 card-hover animate-fade-in-up stagger-1">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">AI OCR Document Extraction</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Auto-extracts principal amount, bank branch, and maturity dates from scanned receipts. Detects discrepancies against declared values in under 2 seconds.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 card-hover animate-fade-in-up stagger-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Separation of Duties (SoD)</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verification Officers (L1) and Finance Officers (L2) hold non-overlapping roles. Super Admins are hard-coded to prevent operational approvals.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 card-hover animate-fade-in-up stagger-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Automated Maturity Monitoring</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Background cron triggers send 30, 15, and 7-day countdown reminders to ensure statutory endowments never lapse or default.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 card-hover animate-fade-in-up stagger-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Digitally Signed PDF Release NOC</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Release approvals automatically generate verifiable PDF NOCs with embedded SHA-256 ledger hashes, ensuring genuine bank refunds.
            </p>
          </div>
        </div>
      </section>

      {/* 8. Regional Coverage Map / Jurisdiction Section */}
      <section className="bg-slate-100 py-12 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              National Infrastructure
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              Active Regional Jurisdictions & Banking Network
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Institutions are automatically partitioned to their regional office while Central Headquarters maintains national vigilance.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-xs">
              <span className="text-xs font-bold text-slate-900">WRO Mumbai</span>
              <p className="text-[10px] text-slate-400">Maharashtra, Goa</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-xs">
              <span className="text-xs font-bold text-slate-900">NRO Delhi</span>
              <p className="text-[10px] text-slate-400">Delhi, Haryana, UP</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-xs">
              <span className="text-xs font-bold text-slate-900">SRO Bangalore</span>
              <p className="text-[10px] text-slate-400">Karnataka, AP, TS</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-xs">
              <span className="text-xs font-bold text-slate-900">ERO Kolkata</span>
              <p className="text-[10px] text-slate-400">WB, Odisha, NE</p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Official Government Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <span>🏛️ AICTE Regulation Bureau</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All India Council for Technical Education, Nelson Mandela Marg, Vasant Kunj, New Delhi-110070.
              </p>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div><strong>Helpline:</strong> 1800-11-2026 (Toll-Free)</div>
                <div><strong>Email:</strong> regulation@aicte-india.org</div>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Statutory Framework</h5>
              <ul className="space-y-2 text-[11px]">
                <li><a href="#" className="hover:text-white">AICTE Act 1987</a></li>
                <li><a href="#" className="hover:text-white">Approval Process Handbook (APH 2024-27)</a></li>
                <li><a href="#" className="hover:text-white">Mandatory Joint FDR Regulations</a></li>
                <li><a href="#" className="hover:text-white">Scheduled Commercial Banks List</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Quick Navigation</h5>
              <ul className="space-y-2 text-[11px]">
                <li><Link href="/login/institution" className="hover:text-white cursor-pointer">Institution Portal Sign-In</Link></li>
                <li><Link href="/login/officer" className="hover:text-white cursor-pointer">Regulatory Officer Sign-In</Link></li>
                <li><a href="#public-search" className="hover:text-white">Verify Certificate by FDR #</a></li>
                <li><a href="#" className="hover:text-white">Public Grievance Portal</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Security & Standards</h5>
              <p className="text-[11px] text-slate-400">
                This portal adheres to Government of India Guidelines for Indian Government Websites (GIGW) and ISO 27001 data protection standards.
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-emerald-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SHA-256 Ledger Authenticated</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              © {new Date().getFullYear()} All India Council for Technical Education (AICTE). All Rights Reserved.
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-slate-300">Privacy Policy</a>
              <a href="#" className="hover:text-slate-300">Hyperlinking Policy</a>
              <a href="#" className="hover:text-slate-300">Terms & Conditions</a>
              <a href="#" className="hover:text-slate-300">Disclaimer</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
