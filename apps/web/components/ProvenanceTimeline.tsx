'use client';

import React from 'react';
import { FDRInstrument } from '@/lib/supabase/types';
import { CheckCircle2, Clock, FileText, ShieldCheck, Building2, UserCheck, AlertTriangle } from 'lucide-react';

interface ProvenanceTimelineProps {
  instrument: FDRInstrument;
}

export function ProvenanceTimeline({ instrument }: ProvenanceTimelineProps) {
  const steps = [
    {
      title: 'Institution Submission',
      subtitle: `Declared by ${instrument.institution?.name}`,
      status: 'completed',
      date: instrument.created_at,
      icon: FileText,
      color: 'blue',
      details: `Declared Principal: ₹${instrument.amount.toLocaleString('en-IN')} (${instrument.bank?.name || 'Bank'}) • Instrument #${instrument.fdr_number}`,
    },
    {
      title: 'OCR Scan Extraction & AI Diff',
      subtitle: instrument.flagged ? 'Discrepancy Flagged' : 'Auto-extracted from scanned receipt',
      status: instrument.documents && instrument.documents.length > 0 ? 'completed' : 'pending',
      date: instrument.created_at,
      icon: instrument.flagged ? AlertTriangle : ShieldCheck,
      color: instrument.flagged ? 'red' : 'emerald',
      details: instrument.flagged
        ? instrument.discrepancy_notes || 'AI discrepancy flag generated'
        : 'Bank Name, Maturity Date, and Principal match document scan with 95%+ confidence.',
    },
    {
      title: 'Regional Officer Verification',
      subtitle: 'Verification Officer Review & Cross-check',
      status: instrument.status !== 'submitted' && instrument.status !== 'under_verification' ? 'completed' : 'pending',
      date: instrument.verification_records?.[0]?.verified_at || null,
      icon: UserCheck,
      color: 'indigo',
      details: instrument.verification_records?.[0]?.notes || 'Awaiting officer cross-check against bank branch confirmation.',
    },
    {
      title: 'Competent Authority Release NOC',
      subtitle: 'Regional Finance Officer Sign-off',
      status: ['released', 'refund_confirmed'].includes(instrument.status) ? 'completed' : 'pending',
      date: instrument.release_requests?.[0]?.decided_at || null,
      icon: ShieldCheck,
      color: 'cyan',
      details: instrument.release_requests?.[0]?.decision_reason || 'Release certificate generated upon statutory lock-in completion.',
    },
    {
      title: 'Institutional Encashment Closure',
      subtitle: 'Bank Proof of Refund Verified',
      status: instrument.status === 'refund_confirmed' ? 'completed' : 'pending',
      date: instrument.release_requests?.[0]?.decided_at || null,
      icon: Building2,
      color: 'emerald',
      details: 'Bank refund confirmation letter verified. Financial lifecycle closed.',
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
      <h4 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-blue-600" />
        Verification Provenance & Audit Lifecycle
      </h4>
      <p className="text-xs text-slate-500 mb-6">
        Distinguishes institution-submitted data from official bank-confirmed and officer-verified stages.
      </p>

      <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
        {steps.map((step, idx) => {
          const isDone = step.status === 'completed';
          const Icon = step.icon;

          return (
            <div key={idx} className="relative group">
              {/* Timeline marker */}
              <div
                className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${
                  isDone
                    ? step.color === 'red'
                      ? 'bg-rose-500 text-white'
                      : 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {isDone ? <Icon className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              </div>

              {/* Step Content */}
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-xs text-slate-900">{step.title}</h5>
                  {step.date && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(step.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-medium text-slate-600 mt-0.5">{step.subtitle}</p>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed bg-white p-2 rounded-lg border border-slate-100">
                  {step.details}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
