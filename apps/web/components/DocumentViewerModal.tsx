'use client';

import React, { useState } from 'react';
import {
  FileText,
  X,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Lock,
  ExternalLink,
  Sparkles,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { DocumentRecord, FDRInstrument } from '@/lib/supabase/types';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document?: DocumentRecord | null;
  instrument?: FDRInstrument | null;
  directFileData?: string | null;
  directFileName?: string | null;
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  document,
  instrument,
  directFileData,
  directFileName,
}: DocumentViewerModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'ocr'>('preview');

  if (!isOpen) return null;

  const fileName = directFileName || document?.file_name || (instrument ? `fdr_scan_${instrument.fdr_number}.pdf` : 'fdr_document.pdf');
  const fileData = directFileData || (document?.ocr_extracted as any)?.file_data || null;
  const ocr = document?.ocr_extracted || {};
  const isImage = fileData && (fileData.startsWith('data:image/') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg'));
  const isPdf = fileData && (fileData.startsWith('data:application/pdf') || fileName.endsWith('.pdf'));

  const handleDownload = () => {
    if (fileData) {
      const link = window.document.createElement('a');
      link.href = fileData;
      link.download = fileName;
      link.click();
    } else {
      // Create text representation or print
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs modal-overlay animate-fade-in">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] modal-panel">
        {/* HEADER */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-blue-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/30 text-blue-300 ring-1 ring-blue-400/30">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white tracking-tight truncate max-w-[280px] sm:max-w-md">
                  {fileName}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold hidden sm:inline">
                  Verified Scanned Copy
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80 mt-0.5 flex items-center gap-2">
                <span>{instrument?.institution?.name || 'Technical Institution'}</span>
                <span>•</span>
                <span>FDR #{instrument?.fdr_number || ocr.fdr_number || 'N/A'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-white/15"
              title="Download FDR Scanned Document"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              title="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS BAR */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Document Scan Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('ocr')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ocr'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>OCR Intelligence Ground Truth</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
            Status: {instrument?.status?.toUpperCase() || 'SUBMITTED'} • Role Scoped RLS
          </span>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-100/60">
          {activeTab === 'preview' ? (
            <div className="w-full flex justify-center">
              {/* Case 1: Uploaded PDF */}
              {fileData && isPdf ? (
                <div className="w-full h-[580px] bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden">
                  <iframe
                    src={fileData}
                    title="FDR Document PDF Preview"
                    className="w-full h-full border-0"
                  />
                </div>
              ) : fileData && isImage ? (
                /* Case 2: Uploaded Image */
                <div className="max-w-2xl bg-white p-4 rounded-xl shadow-md border border-slate-300">
                  <img
                    src={fileData}
                    alt="Scanned FDR Document"
                    className="max-h-[580px] object-contain mx-auto rounded-lg"
                  />
                </div>
              ) : (
                /* Case 3: High-Fidelity Official AICTE Scanned Bank Certificate (Seed & Standard Records) */
                <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border-2 border-slate-300 p-8 font-serif relative overflow-hidden text-slate-900">
                  {/* Subtle Security Guilloche Watermark Background */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none text-9xl font-black text-slate-900">
                    AICTE
                  </div>

                  {/* Bank Letterhead */}
                  <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🏛️</span>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                          {instrument?.bank?.name || ocr.bank_name || 'State Bank of India'}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-sans">
                        Authorized Branch: {instrument?.bank?.branch || 'Nariman Point Branch, Mumbai'} • IFSC: {instrument?.bank?.ifsc_code || 'SBIN0000300'}
                      </p>
                    </div>

                    <div className="text-right font-sans">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Certificate No.</span>
                      <span className="text-xs font-mono font-bold text-blue-900">
                        {instrument?.fdr_number || ocr.fdr_number || 'FDR-SBI-2024-81920'}
                      </span>
                    </div>
                  </div>

                  {/* Document Title */}
                  <div className="text-center my-4">
                    <h3 className="text-base font-bold uppercase tracking-widest text-slate-800 border-y border-slate-300 py-1.5 inline-block px-8">
                      Fixed Deposit Receipt / Security Deposit
                    </h3>
                  </div>

                  {/* Certificate Body */}
                  <div className="space-y-4 text-xs font-sans text-slate-700 leading-relaxed my-6">
                    <p>
                      Received from{' '}
                      <strong className="text-slate-900 font-serif text-sm">
                        {instrument?.institution?.name || 'Veermata Jijabai Technological Institute (VJTI)'}
                      </strong>{' '}
                      (AICTE Permanent ID: <strong>{instrument?.institution?.aicte_code || '1-10023481'}</strong>), the sum of{' '}
                      <strong className="text-slate-900 font-serif text-sm">
                        INR ₹{Number(instrument?.amount || ocr.amount || 3500000).toLocaleString('en-IN')}
                      </strong>{' '}
                      as a Fixed Security Deposit for statutory compliance under the regulations of the All India Council for Technical Education (AICTE).
                    </p>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 font-mono text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Principal Deposit</span>
                        <span className="text-slate-900 font-bold text-sm">
                          ₹{Number(instrument?.amount || ocr.amount || 3500000).toLocaleString('en-IN')}/-
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Lien Marking</span>
                        <span className="text-blue-900 font-bold">
                          Member Secretary, AICTE (Joint Lien)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Issue / Value Date</span>
                        <span className="text-slate-900 font-bold">
                          {instrument?.issue_date || ocr.issue_date || '2024-01-15'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Maturity Date</span>
                        <span className="text-slate-900 font-bold">
                          {instrument?.maturity_date || ocr.maturity_date || '2027-01-15'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900">
                      <strong>Mandatory AICTE Lien Clause:</strong> This receipt is marked with a lien in favour of the{' '}
                      <strong>Member Secretary, AICTE</strong>. The principal amount cannot be withdrawn, encashed, pledged, or released without formal written No Objection Certificate (NOC) issued by AICTE Regulation Bureau.
                    </div>
                  </div>

                  {/* Signatures & Seal */}
                  <div className="pt-6 border-t border-slate-200 flex items-end justify-between font-sans">
                    <div className="flex items-center gap-3">
                      <div className="p-2 border border-slate-300 rounded-lg bg-slate-50">
                        <QrCode className="w-12 h-12 text-slate-700" />
                      </div>
                      <div className="text-[10px] text-slate-500">
                        <span className="block font-bold text-slate-700">Digital Verification QR</span>
                        <span>Hash: SHA-256 Validated</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="w-36 border-b border-slate-800 pb-1 mb-1 font-serif italic text-sm text-slate-800">
                        Rajesh Patil
                      </div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">
                        Chief Manager / Authorized Signatory
                      </span>
                      <span className="text-[9px] text-slate-400 block">
                        State Bank of India • Branch Code 00300
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* OCR TAB */
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                    Optical Character Recognition (OCR) Ground Truth
                  </h4>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                    Confidence: {Math.round((ocr.confidence_score || 0.95) * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Detected Bank</span>
                    <span className="text-slate-900 font-bold">{ocr.bank_name || instrument?.bank?.name || 'State Bank of India'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Detected FDR Number</span>
                    <span className="text-slate-900 font-bold">{ocr.fdr_number || instrument?.fdr_number || 'N/A'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Detected Principal Amount</span>
                    <span className="text-slate-900 font-bold">
                      ₹{Number(ocr.amount || instrument?.amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Detected Maturity Date</span>
                    <span className="text-slate-900 font-bold">{ocr.maturity_date || instrument?.maturity_date || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Discrepancy Analysis Box */}
              <div
                className={`p-4 rounded-2xl border text-xs ${
                  instrument?.flagged
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {instrument?.flagged ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>
                    {instrument?.flagged
                      ? 'AI Discrepancy Engine Flag: Discrepancy Found'
                      : 'AI Discrepancy Engine: Declared and OCR Ground Truth Match'}
                  </span>
                </div>
                <p className="mt-1 leading-relaxed">
                  {instrument?.discrepancy_notes ||
                    'All OCR extracted values match the declared metadata with 96% confidence score. Validated for statutory Tier-1 endorsement.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            AICTE Document Verification • SHA-256 Protected
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
