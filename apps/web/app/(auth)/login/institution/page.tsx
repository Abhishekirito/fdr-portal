'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Lock,
  ArrowRight,
  ArrowLeft,
  FileCheck2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function InstitutionLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.currentProfile) {
        setError(data.error || 'Authentication failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      // Check if logged in user is actually an institution
      if (data.currentProfile.role !== 'institution') {
        setError(
          'This account has regulatory officer privileges. Please use the Regulatory Officer Sign-In gateway.'
        );
        setLoading(false);
        return;
      }

      window.location.href = '/institution/dashboard';
    } catch (err: any) {
      setError(err.message || 'An unexpected connection error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071728] via-[#0f2b48] to-[#091522] text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Top Identity Stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600 shadow-sm" />

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero / Guidance Column */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-semibold text-blue-300">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Affiliated Institutions Gateway</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                AICTE Institution Portal
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Dedicated security deposit and FDR lifecycle system for AICTE-approved universities, colleges, and polytechnics.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 card-hover">
                <div className="p-2 rounded-lg bg-blue-600/30 text-blue-300 shrink-0">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">AI OCR Intake Diff</h4>
                  <p className="text-[11px] text-slate-400">
                    Upload scanned deposit receipts with instant OCR field auto-extraction and discrepancy validation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 card-hover">
                <div className="p-2 rounded-lg bg-amber-600/30 text-amber-300 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Automated Maturity Alerts</h4>
                  <p className="text-[11px] text-slate-400">
                    Proactive 30-day renewal notifications before deposit expiry to safeguard institutional accreditation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 card-hover">
                <div className="p-2 rounded-lg bg-emerald-600/30 text-emerald-300 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Digital Release NOCs</h4>
                  <p className="text-[11px] text-slate-400">
                    Verifiable cryptographic release certificates upon completing regulatory endowment tenure.
                  </p>
                </div>
              </div>
            </div>

            {/* Switch to Officer */}
            <div className="pt-2">
              <Link
                href="/login/officer"
                className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 hover:text-amber-200 transition group"
              >
                <span>Regulatory Officer or Bureau Head? Sign In Here</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="lg:col-span-7">
            <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-white/20 text-slate-900 animate-fade-in-up">
              
              {/* Header */}
              <div className="flex items-center gap-3.5 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Sign In to Institution Account</h2>
                  <p className="text-xs text-slate-500">Enter registered registrar or finance credentials</p>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2.5 alert-slide-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Official Registered Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. accounts@vjti.ac.in or fdr@coep.ac.in"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:outline-blue-600 input-focus font-medium"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Use the official authorized email address linked to your AICTE institution permanent code.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Account Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:outline-blue-600 input-focus font-medium"
                    required
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px]">
                    Direct 1-step sign-in for institutions. Two-Factor TOTP is only required for AICTE regulatory officers.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 btn-press"
                >
                  {loading ? (
                    'Verifying Credentials...'
                  ) : (
                    <>
                      <span>Sign In to Institution Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Card Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <Link
                  href="/"
                  className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 font-bold transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Portal Home</span>
                </Link>

                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>256-bit Encrypted Session</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Strip */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-white/10 bg-slate-950/40">
        All India Council for Technical Education • Nelson Mandela Marg, Vasant Kunj, New Delhi-110070
      </footer>
    </div>
  );
}
