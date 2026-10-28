'use client';

import React from 'react';
import { FDRStatus } from '@/lib/supabase/types';
import { CheckCircle2, Clock, AlertTriangle, RefreshCw, FileCheck, ShieldCheck, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: FDRStatus | string;
  flagged?: boolean;
  severity?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, flagged, severity, size = 'md' }: StatusBadgeProps) {
  const isSmall = size === 'sm';

  if (flagged || severity === 'HIGH_RISK') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-red-200 bg-red-50 text-red-700 ${isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-pulse" />
        Discrepancy Flagged
      </span>
    );
  }

  switch (status) {
    case 'active':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 ${isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Active & Verified
        </span>
      );
    case 'submitted':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-amber-200 bg-amber-50 text-amber-700 ${isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Pending Verification
        </span>
      );
    case 'under_verification':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-blue-200 bg-blue-50 text-blue-700 ${isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          Under Review
        </span>
      );
    case 'renewed':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-purple-200 bg-purple-50 text-purple-700 ${isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
          Renewed (Archived)
        </span>
      );
    case 'release_requested':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-orange-200 bg-orange-50 text-orange-700 ${isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <FileCheck className="w-3.5 h-3.5 text-orange-600" />
          Release Requested
        </span>
      );
    case 'released':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-cyan-200 bg-cyan-50 text-cyan-800 ${isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-700" />
          NOC Released
        </span>
      );
    case 'refund_confirmed':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-slate-200 bg-slate-100 text-slate-800 ${isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
          Refund Confirmed (Closed)
        </span>
      );
    case 'rejected':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-rose-200 bg-rose-50 text-rose-700 ${isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Rejected
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-gray-200 bg-gray-50 text-gray-700 ${isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}>
          {status}
        </span>
      );
  }
}
