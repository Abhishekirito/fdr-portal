'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  ArrowLeft,
  FileCheck2,
  Scale,
  Search,
  Sparkles,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071320] via-[#0f2b48] to-[#0a192c] text-white flex flex-col justify-between selection:bg-amber-400 selection:text-slate-900 animate-fade-in">
      {/* 1. Official National Tri-Color Header Strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600 shadow-xs" />

      {/* 2. Top Identity Bar */}
      <div className="bg-black/30 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-bold text-amber-400">भारत सरकार</span>
            <span className="text-white/30">|</span>
            <span className="text-slate-200">Government of India</span>
            <span className="text-white/30">•</span>
            <span className="text-slate-300">Ministry of Education</span>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-blue-200 hover:text-white transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to National Portal Homepage</span>
          </Link>
        </div>
      </div>

      {/* 3. Main Selection Hero & Dual Gateway Cards */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-12 space-y-10 my-auto">
        {/* Title Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AICTE Regulation Bureau • Unified Access Gateway</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Select Your Designated Access Portal
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Please choose the appropriate sign-in gateway according to your institutional or regulatory role under the AICTE Approval Process Handbook (APH).
          </p>
        </div>

        {/* Dual Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Technical Institutions */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 text-slate-900 shadow-2xl border border-slate-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none" />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shadow-xs">
                  <Building2 className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-bold">
                  Colleges & Universities
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Institution Portal</h2>
                <p className="text-xs text-slate-500 mt-1">
                  For authorized representatives, registrars, and finance officers of technical institutions.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Submit FDR security deposits with AI OCR auto-extraction</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Track two-tier regional verification & lien endorsement status</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Process chained maturity rollovers and refund releases</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link
                href="/login/institution"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all cursor-pointer hover:scale-[1.01] btn-press"
              >
                <span>Proceed to Institution Sign-In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[11px] text-center text-slate-400 mt-2.5">
                Standard credentials • Direct email & password access
              </p>
            </div>
          </div>

          {/* Card 2: Regulatory Officers */}
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 sm:p-10 text-white shadow-2xl border border-white/15 flex flex-col justify-between relative overflow-hidden group hover:border-amber-400/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-bl-full pointer-events-none" />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 text-[11px] font-bold">
                  MFA Protected
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">Regulatory Officer Portal</h2>
                <p className="text-xs text-slate-300 mt-1">
                  For AICTE Regional Officers, Finance Officers, Bureau Heads, and Central Administrators.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Two-tier Separation of Duties: Document Authenticity vs Financial Audit</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Lien marking to Member Secretary, AICTE with immutable audit logging</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Mandatory 2-factor TOTP Authenticator code verification</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link
                href="/login/officer"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer hover:scale-[1.01] btn-press"
              >
                <Lock className="w-4 h-4" />
                <span>Proceed to Officer Sign-In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[11px] text-center text-slate-400 mt-2.5">
                Official @aicte.gov.in accounts • Step-2 TOTP MFA required
              </p>
            </div>
          </div>
        </div>

        {/* Public Verification Callout */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <Search className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Looking to verify a Fixed Deposit Receipt certificate without signing in?</span>
          </div>
          <Link
            href="/#public-search"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition"
          >
            <span>Public Deposit Verification Search</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4. Footer */}
      <div className="bg-black/40 border-t border-white/10 py-4 px-4 text-center text-[11px] text-slate-400">
        <p>
          All India Council for Technical Education (AICTE) • Statutory Body Under the Ministry of Education, Govt. of India
        </p>
      </div>
    </div>
  );
}

