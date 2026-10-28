'use client';

import React from 'react';
import { FDRInstrument } from '@/lib/supabase/types';
import { RefreshCw, ArrowDown, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';
import Link from 'next/link';

interface RenewalChainTreeProps {
  instrument: FDRInstrument;
}

export function RenewalChainTree({ instrument }: RenewalChainTreeProps) {
  const hasParent = !!instrument.parent_instrument;
  const isRenewed = instrument.status === 'renewed';

  if (!hasParent && !isRenewed) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
          <RefreshCw className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-slate-900">Renewal Chain Genealogy</h4>
          <p className="text-xs text-slate-500">Linked instrument history and statutory continuity</p>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-3">
        {/* Parent Instrument (if exists) */}
        {hasParent && (
          <>
            <div className="w-full max-w-md p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-purple-600" />
                <div>
                  <div className="font-semibold text-slate-900">
                    Parent FDR: {instrument.parent_instrument?.fdr_number}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    ₹{instrument.parent_instrument?.amount.toLocaleString('en-IN')} • Matured{' '}
                    {instrument.parent_instrument?.maturity_date}
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 uppercase">
                Renewed
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-purple-600 font-semibold text-xs">
              <ArrowDown className="w-4 h-4 animate-bounce" />
              <span>Renewed into</span>
            </div>
          </>
        )}

        {/* Current Active/Target Instrument */}
        <div className="w-full max-w-md p-4 rounded-xl border-2 border-blue-500 bg-blue-50/60 shadow-xs flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              ₹
            </div>
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>{instrument.fdr_number}</span>
                <span className="text-[10px] font-medium text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                  Current
                </span>
              </div>
              <div className="text-[11px] text-slate-600">
                ₹{instrument.amount.toLocaleString('en-IN')} • Validity: {instrument.issue_date} to{' '}
                {instrument.maturity_date}
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            {instrument.status.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
