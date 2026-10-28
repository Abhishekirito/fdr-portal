'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Scale,
  Database,
  Building2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function OfficerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [requireTotp, setRequireTotp] = useState(false);
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
        body: JSON.stringify({
          email: email.trim(),
          password,
          totpCode: totpCode ? totpCode.trim() : undefined,
        }),
      });

      const data = await res.json();

      // Check if TOTP MFA is required (Step 2)
      if (data.requireTotp) {
        setRequireTotp(true);
        setLoading(false);
        return;
      }

      if (!res.ok || !data.currentProfile) {
        setError(data.error || 'Authentication failed. Please verify credentials.');
        setLoading(false);
        return;
      }

      // Check if user is an officer role
      const role = data.currentProfile.role;
      if (role === 'institution') {
        setError(
          'This account has technical institution credentials. Please use the Institution Login Portal.'
        );
        setLoading(false);
        return;
      }

      // Destination based on officer persona
      let destination = '/officer/dashboard';
      if (['central_compliance_officer', 'super_admin'].includes(role)) {
        destination = '/admin/dashboard';
      }

      window.location.href = destination;
    } catch (err: any) {
      setError(err.message || 'An unexpected connection error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05111e] via-[#0b2038] to-[#040d18] text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-slate-900">
      {/* Top Identity Stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600 shadow-sm" />

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero / Governance Column */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-xs font-semibold text-amber-300">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>AICTE Regulation Directorate</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                Regulatory Officer Gateway
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Central & Regional officer sign-in with mandatory TOTP MFA and cryptographically signed audit trail.
              </p>
            </div>

            {/* Regulatory Pillars */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 card-hover">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Separation of Duties (SoD)</h4>
                  <p className="text-[11px] text-slate-400">
                    Two-tier verification protocol: regional officers verify documents, finance heads audit release requests.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 card-hover">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Mandatory TOTP MFA Enforcement</h4>
                  <p className="text-[11px] text-slate-400">
                    Time-based One-Time Password via Google or Microsoft Authenticator required on every sign-in.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 card-hover">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Cryptographic Audit Chain</h4>
                  <p className="text-[11px] text-slate-400">
                    Every verification, rejection, and release approval is sealed into a tamper-evident SHA-256 block ledger.
                  </p>
                </div>
              </div>
            </div>

            {/* Switch to Institution */}
            <div className="pt-2">
              <Link
                href="/login/institution"
                className="inline-flex items-center gap-2 text-xs font-bold text-blue-300 hover:text-blue-200 transition group"
              >
                <span>Technical Institution Registrar? Sign In Here</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="lg:col-span-7">
            <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-white/20 text-slate-900 animate-fade-in-up">
              
              {/* Header */}
              <div className="flex items-center gap-3.5 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Regulatory Officer Sign-In</h2>
                  <p className="text-xs text-slate-500">Official AICTE credentials with TOTP 2FA verification</p>
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
                    Official Email (@aicte.gov.in)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. patil@aicte.gov.in or superadmin@aicte.gov.in"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:outline-blue-600 input-focus font-medium"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Designated official email provided by the AICTE IT & Governance Directorate.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Officer Password
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

                {/* Step 2: TOTP Input */}
                {requireTotp && (
                  <div className="animate-fade-in-up space-y-2 pt-2 pb-1">
                    <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                        <span>TOTP MFA Authenticator Code (6-Digits)</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        MFA Required
                      </span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={totpCode}
                      onChange={e => setTotpCode(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full text-xs p-3 rounded-xl border border-blue-400 bg-blue-50/50 font-mono tracking-widest text-center font-bold text-sm input-focus"
                      required
                      autoFocus
                    />
                    <p className="text-[10px] text-slate-500">
                      Enter the 6-digit one-time code from your Google/Microsoft Authenticator app.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 btn-press"
                >
                  {loading ? (
                    'Authenticating with Security Vault...'
                  ) : requireTotp ? (
                    <>
                      <span>Verify TOTP & Enter Officer Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Sign In with Officer Credentials</span>
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
                  <Lock className="w-3 h-3 text-amber-500" />
                  <span>MFA Protected Directorate</span>
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
