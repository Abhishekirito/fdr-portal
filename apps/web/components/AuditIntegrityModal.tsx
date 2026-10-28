'use client';

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, AlertOctagon, RefreshCw, Lock, Terminal, X } from 'lucide-react';
import { AuditLogEntry } from '@/lib/supabase/types';

interface AuditIntegrityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId?: string;
  initialEntries?: AuditLogEntry[];
}

export function AuditIntegrityModal({
  isOpen,
  onClose,
  entityId,
  initialEntries = [],
}: AuditIntegrityModalProps) {
  const [entries, setEntries] = useState<AuditLogEntry[]>(initialEntries);
  const [verifying, setVerifying] = useState(false);
  const [tampering, setTampering] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const runVerification = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId }),
      });
      const data = await res.json();
      setVerificationResult(data.result);

      // Refresh entries
      const logsRes = await fetch(`/api/audit${entityId ? `?entityId=${entityId}` : ''}`);
      const logsData = await logsRes.json();
      if (logsData.logs) setEntries(logsData.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setVerifying(false);
    }
  };

  const simulateTampering = async () => {
    setTampering(true);
    try {
      await fetch('/api/audit/tamper', { method: 'POST' });
      // Re-run verification to show judges the failure!
      await runVerification();
    } catch (e) {
      console.error(e);
    } finally {
      setTampering(false);
    }
  };

  const resetChain = async () => {
    setTampering(true);
    try {
      await fetch('/api/audit/tamper', { method: 'DELETE' });
      await runVerification();
    } catch (e) {
      console.error(e);
    } finally {
      setTampering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl ring-1 ring-blue-400/30">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Cryptographic Audit Chain Integrity Verifier</h3>
              <p className="text-xs text-slate-300">
                SHA-256 Tamper-Evident Hash Chain • Verifies Mathematical Immutability
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Status Banner */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {verificationResult === null ? (
              <span className="text-xs text-slate-500 font-medium">
                Click below to cryptographically walk the SHA-256 chain.
              </span>
            ) : verificationResult.isValid ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Chain Verified: 100% Cryptographically Sound (0 Tampering Detected)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-300 text-xs font-bold animate-pulse">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>INTEGRITY BREACH: Retroactive Database Modification Detected!</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runVerification}
              disabled={verifying}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {verifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>Verify Integrity</span>
            </button>

            <button
              onClick={simulateTampering}
              disabled={tampering}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Alters a database value behind the scenes to prove the audit chain flags it"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
              <span>Simulate Tampering (Demo)</span>
            </button>

            <button
              onClick={resetChain}
              disabled={tampering}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Failure Reason details if broken */}
        {verificationResult && !verificationResult.isValid && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-xs text-rose-900 font-mono">
            <p className="font-bold flex items-center gap-1.5 text-rose-700 mb-1">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Cryptographic Hash Mismatch Found:
            </p>
            <p className="bg-white p-2.5 rounded-md border border-rose-200 text-[11px] leading-relaxed">
              {verificationResult.failureReason}
            </p>
          </div>
        )}

        {/* Audit Chain Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Immutable Chronological Ledger ({entries.length} chained events)
          </p>

          <div className="space-y-3">
            {entries.map((entry, index) => {
              const isGenesis = entry.prev_hash === 'GENESIS';
              return (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all font-mono text-xs shadow-2xs"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {entry.action}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Actor: {entry.actor_email} ({entry.actor_role})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(entry.created_at || '').toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Previous Chained Hash:
                      </span>
                      <span className="text-slate-600 truncate block font-mono bg-slate-50 p-1 rounded border border-slate-100">
                        {entry.prev_hash}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-600 block text-[10px] uppercase font-bold">
                        Computed Entry Hash (SHA-256):
                      </span>
                      <span className="text-blue-900 font-bold truncate block font-mono bg-blue-50/50 p-1 rounded border border-blue-200">
                        {entry.entry_hash}
                      </span>
                    </div>
                  </div>

                  {entry.after && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                        State Payload Snapshot:
                      </span>
                      <pre className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg overflow-x-auto text-[10px]">
                        {JSON.stringify(entry.after, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            Close Verifier
          </button>
        </div>
      </div>
    </div>
  );
}
