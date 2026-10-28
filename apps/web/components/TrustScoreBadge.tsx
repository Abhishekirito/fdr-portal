'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface TrustScoreBadgeProps {
  score: number;
  showLabel?: boolean;
}

export function TrustScoreBadge({ score, showLabel = true }: TrustScoreBadgeProps) {
  let colorClasses = 'border-emerald-200 bg-emerald-50 text-emerald-800';
  let Icon = ShieldCheck;
  let label = 'High Trust (Tier 1)';

  if (score < 70) {
    colorClasses = 'border-rose-200 bg-rose-50 text-rose-800';
    Icon = ShieldAlert;
    label = 'Action Required';
  } else if (score < 90) {
    colorClasses = 'border-amber-200 bg-amber-50 text-amber-800';
    Icon = Shield;
    label = 'Moderate Trust';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${colorClasses}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>Score: {score}/100</span>
      {showLabel && <span className="opacity-80 font-normal">({label})</span>}
    </div>
  );
}
