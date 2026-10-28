'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/** Base skeleton block with pulse animation */
export function Skeleton({ className = '', style, children }: SkeletonProps) {
  return (
    <div style={style} className={`skeleton-pulse rounded-lg bg-slate-200/70 ${className}`}>
      {children}
    </div>
  );
}

/** Skeleton placeholder for a single metric card */
export function SkeletonMetricCard() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 animate-fade-in">
      <Skeleton className="h-3 w-28 rounded" />
      <Skeleton className="h-7 w-36 rounded" />
      <Skeleton className="h-2.5 w-44 rounded" />
    </div>
  );
}

/** Skeleton row for a table (e.g., FDR instruments table) */
export function SkeletonTableRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="animate-fade-in">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-5">
          <Skeleton className={`h-4 rounded ${i === 0 ? 'w-32' : i === 2 ? 'w-24' : 'w-20'}`} />
          {i === 0 && <Skeleton className="h-2.5 w-16 rounded mt-1.5" />}
        </td>
      ))}
    </tr>
  );
}

/** Skeleton for table rows (safe to render inside tbody) */
export function SkeletonTable({ rows = 4, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} cols={cols} />
      ))}
    </>
  );
}

/** Skeleton for officer queue items (verification/release cards) */
export function SkeletonQueueCard() {
  return (
    <div className="p-6 animate-fade-in space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-72 rounded" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton for chart containers */
export function SkeletonChart({ height = 'h-56' }: { height?: string }) {
  return (
    <div className={`${height} w-full rounded-2xl animate-fade-in flex items-end justify-center gap-2 p-6`}>
      {[40, 65, 50, 80, 35, 70].map((h, i) => (
        <Skeleton key={i} className="rounded-t-md" style={{ height: `${h}%`, width: '12%' }} />
      ))}
    </div>
  );
}

/** Skeleton for the officer/admin hero banner */
export function SkeletonHeroBanner() {
  return (
    <div className="p-6 rounded-2xl bg-slate-200/50 border border-slate-200 animate-fade-in space-y-3">
      <Skeleton className="h-4 w-64 rounded-full" />
      <Skeleton className="h-7 w-96 rounded" />
      <Skeleton className="h-3 w-full max-w-xl rounded" />
    </div>
  );
}
