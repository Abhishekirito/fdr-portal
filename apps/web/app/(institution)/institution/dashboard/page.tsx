'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { CommandPalette } from '@/components/CommandPalette';
import { SkeletonMetricCard, SkeletonTable } from '@/components/Skeleton';
import {
  ShieldCheck,
  Plus,
  FileText,
  Clock,
  RefreshCw,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Building2,
  Calendar,
  Lock,
  Eye,
  Zap,
  X,
} from 'lucide-react';
import { FDRInstrument, Bank, Profile, DocumentRecord } from '@/lib/supabase/types';
import { DocumentViewerModal } from '@/components/DocumentViewerModal';
import confetti from 'canvas-confetti';

export default function InstitutionDashboard() {
  const [instruments, setInstruments] = useState<FDRInstrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(0);

  // Modal states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState<FDRInstrument | null>(null);
  const [showReleaseModal, setShowReleaseModal] = useState<FDRInstrument | null>(null);

  // Submit form state
  const [bankId, setBankId] = useState('b1111111-1111-1111-1111-111111111111');
  const [fdrNumber, setFdrNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string>('');
  const [ocrStatus, setOcrStatus] = useState<{ type: 'success' | 'warning'; message: string } | null>(null);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrExtracted, setOcrExtracted] = useState<any | null>(null);
  const [discrepancy, setDiscrepancy] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [viewingDocument, setViewingDocument] = useState<{
    doc?: DocumentRecord | null;
    instrument?: FDRInstrument | null;
    directFileData?: string | null;
    directFileName?: string | null;
  } | null>(null);

  // Renewal / Release state
  const [renewalFdrNumber, setRenewalFdrNumber] = useState('');
  const [renewalAmount, setRenewalAmount] = useState('');
  const [renewalMaturity, setRenewalMaturity] = useState('');
  const [releaseReason, setReleaseReason] = useState('');

  useEffect(() => {
    setCurrentTimestamp(Date.now());
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [instRes, sessRes] = await Promise.all([
        fetch('/api/instruments'),
        fetch('/api/auth/session'),
      ]);
      const instData = await instRes.json();
      const sessData = await sessRes.json();

      if (instData.instruments) setInstruments(instData.instruments);
      if (sessData.currentProfile) setProfile(sessData.currentProfile);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Real Document Upload Handler with 5MB Limit
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setOcrStatus(null);

    // Enforce 5MB limit
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError(`File "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed 5 MB limit. Please upload a compressed document.`);
      e.target.value = '';
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setFileDataUrl(dataUrl);

      // Trigger Groq AI OCR Extraction
      await triggerGroqOcr(file.name, dataUrl, file.size, file.type);
    };
    reader.onerror = () => {
      setUploadError('Failed to read file from local disk. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  // Groq AI OCR Extraction trigger
  const triggerGroqOcr = async (name: string, dataUrl: string, size: number, type: string) => {
    setOcrRunning(true);
    setOcrStatus(null);
    try {
      const res = await fetch('/api/ai/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: name,
          fileData: dataUrl,
          fileSize: size,
          fileType: type,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setOcrExtracted(data);
        if (data.fdr_number) setFdrNumber(data.fdr_number);
        if (data.amount) setAmount(data.amount.toString());
        if (data.issue_date) setIssueDate(data.issue_date);
        if (data.maturity_date) setMaturityDate(data.maturity_date);

        // Match Bank
        if (data.bank_name) {
          const lower = data.bank_name.toLowerCase();
          if (lower.includes('state bank') || lower.includes('sbi')) setBankId('b1111111-1111-1111-1111-111111111111');
          else if (lower.includes('punjab') || lower.includes('pnb')) setBankId('b2222222-2222-2222-2222-222222222222');
          else if (lower.includes('canara')) setBankId('b3333333-3333-3333-3333-333333333333');
          else if (lower.includes('hdfc')) setBankId('b4444444-4444-4444-4444-444444444444');
          else if (lower.includes('icici')) setBankId('b5555555-5555-5555-5555-555555555555');
        }

        const ocrEngineLabel = data.model ? `Groq OCR (${data.model})` : 'Groq AI OCR';
        setOcrStatus({
          type: 'success',
          message: `✨ ${ocrEngineLabel} Complete: Fields have been auto-populated from "${name}". Please verify the values below before submitting.`,
        });

        // Run discrepancy analysis
        const discRes = await fetch('/api/ai/discrepancy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submitted_fields: {
              bank_name: data.bank_name,
              fdr_number: data.fdr_number,
              amount: data.amount,
              issue_date: data.issue_date,
              maturity_date: data.maturity_date,
            },
            ocr_fields: data,
          }),
        });
        const discData = await discRes.json();
        setDiscrepancy(discData);
      } else {
        // OCR could not extract fields
        setOcrExtracted(null);
        setOcrStatus({
          type: 'warning',
          message: `⚠️ Groq AI OCR Notice: Automatic extraction could not read all fields with certainty from "${name}". Please inspect your document and fill in the details manually below before submitting.`,
        });
      }
    } catch (e) {
      setOcrStatus({
        type: 'warning',
        message: `⚠️ Groq AI OCR service was temporarily unavailable. Please fill in the FDR details manually below.`,
      });
    } finally {
      setOcrRunning(false);
    }
  };

  // OCR Auto-extract simulation for sample buttons
  const handleRunOcr = async (selectedFileName?: string) => {
    const file = selectedFileName || fileName || 'scan_sbi_deposit.pdf';
    setFileName(file);
    await triggerGroqOcr(file, '', 1024 * 750, 'application/pdf');
  };

  // Submit FDR
  const handleSubmitFdr = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/instruments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_id: bankId,
          fdr_number: fdrNumber,
          amount: parseFloat(amount),
          issue_date: issueDate,
          maturity_date: maturityDate,
          file_name: fileName || `scan_${fdrNumber}.pdf`,
          file_data: fileDataUrl,
          file_size: fileSize || 1024 * 750,
          mime_type: fileDataUrl?.startsWith('data:image/') ? 'image/jpeg' : 'application/pdf',
          ocr_extracted: ocrExtracted || { manual_entry: true, file_data: fileDataUrl },
          flagged: discrepancy?.flagged || false,
          flag_severity: discrepancy?.risk_level || 'CLEAN',
          discrepancy_notes: discrepancy?.explanation || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowSubmitModal(false);
        resetSubmitForm();
        setActionSuccessMessage(`FDR #${fdrNumber} submitted successfully! Recorded in cryptographic audit chain and available for regional review.`);
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
        await loadData();
      } else {
        alert(data.error || 'Failed to submit FDR');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Renew FDR
  const handleRenewFdr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRenewModal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/instruments/${showRenewModal.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fdr_number: renewalFdrNumber,
          amount: parseFloat(renewalAmount || showRenewModal.amount.toString()),
          issue_date: new Date().toISOString().split('T')[0],
          maturity_date: renewalMaturity,
          file_name: `renew_scan_${renewalFdrNumber}.pdf`,
        }),
      });
      if (res.ok) {
        setShowRenewModal(null);
        setActionSuccessMessage(`FDR renewed! Linked to original #${showRenewModal.fdr_number}.`);
        confetti({ particleCount: 80, spread: 70 });
        await loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Request Release
  const handleRequestRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReleaseModal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/instruments/${showReleaseModal.id}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: releaseReason }),
      });
      if (res.ok) {
        setShowReleaseModal(null);
        setReleaseReason('');
        setActionSuccessMessage(`Release request submitted for #${showReleaseModal.fdr_number}. Sent to Finance Officer queue.`);
        await loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const resetSubmitForm = () => {
    setFdrNumber('');
    setAmount('');
    setIssueDate('');
    setMaturityDate('');
    setFileName('');
    setFileDataUrl(null);
    setFileSize(0);
    setUploadError('');
    setOcrStatus(null);
    setOcrExtracted(null);
    setDiscrepancy(null);
  };

  // Metrics
  const activeFdrs = instruments.filter(i => i.status === 'active');
  const totalDepositValue = activeFdrs.reduce((sum, i) => sum + i.amount, 0);
  const expiringCount = currentTimestamp
    ? activeFdrs.filter(i => {
        const d = Math.ceil((new Date(i.maturity_date).getTime() - currentTimestamp) / 86400000);
        return d >= 0 && d <= 30;
      }).length
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onOpenCommandPalette={() => setIsCommandOpen(true)} />
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner / Success Alert */}
        {actionSuccessMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between alert-slide-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button onClick={() => setActionSuccessMessage('')} className="text-emerald-700 hover:underline cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Institution Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {profile?.institution?.name || 'Institution Security Deposit Portal'}
              </h1>
              <TrustScoreBadge score={profile?.institution?.trust_score || 98} />
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span className="font-semibold text-slate-700">AICTE Permanent Code:</span>{' '}
              {profile?.institution?.aicte_code || '1-10023481'} •{' '}
              <span className="font-semibold text-slate-700">Assigned Regional Office:</span>{' '}
              {profile?.region?.name || 'Western Regional Office (Mumbai)'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                resetSubmitForm();
                setShowSubmitModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer hover:shadow-lg btn-press"
            >
              <Plus className="w-4 h-4" />
              <span>Submit New FDR Instrument</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
          {loading ? (
            <>
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
            </>
          ) : (
            <>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs card-hover animate-fade-in-up stagger-1">
                <span className="text-xs font-semibold uppercase text-slate-400">Total Active Security Deposit</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  ₹{(totalDepositValue / 100000).toFixed(2)} Lakh
                </div>
                <p className="text-[11px] text-slate-500 mt-1">₹{totalDepositValue.toLocaleString('en-IN')} total locked</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs card-hover animate-fade-in-up stagger-2">
                <span className="text-xs font-semibold uppercase text-slate-400">Active Fixed Deposit Receipts</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{activeFdrs.length}</div>
                <p className="text-[11px] text-emerald-600 font-medium mt-1">Legally verified with issuing banks</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs card-hover animate-fade-in-up stagger-3">
                <span className="text-xs font-semibold uppercase text-slate-400">Expiring in &lt; 30 Days</span>
                <div className="text-2xl font-black text-amber-600 mt-1">{expiringCount}</div>
                <p className="text-[11px] text-slate-500 mt-1">Requires renewal or release action</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs card-hover animate-fade-in-up stagger-4">
                <span className="text-xs font-semibold uppercase text-slate-400">Regulatory Trust Score</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {profile?.institution?.trust_score || 98}/100
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Based on compliance & timely renewals</p>
              </div>
            </>
          )}
        </div>

        {/* FDR Instruments Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Registered Security Deposit Instruments</h3>
              <p className="text-xs text-slate-500">Repository of statutory fixed deposit receipts and renewal chains</p>
            </div>
            <span className="text-xs text-slate-400 font-medium">{instruments.length} Total Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-3.5 px-5">FDR Number</th>
                  <th className="py-3.5 px-5">Issuing Bank</th>
                  <th className="py-3.5 px-5">Principal Amount</th>
                  <th className="py-3.5 px-5">Maturity Date</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <SkeletonTable rows={4} cols={6} />
                ) : instruments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No FDR instruments on record. Click &quot;Submit New FDR&quot; to begin.
                    </td>
                  </tr>
                ) : (
                  instruments.map(item => {
                    const daysToMaturity = currentTimestamp
                      ? Math.ceil((new Date(item.maturity_date).getTime() - currentTimestamp) / 86400000)
                      : 0;
                    const isExpiringSoon = item.status === 'active' && daysToMaturity <= 30 && daysToMaturity >= 0;

                    return (
                      <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900">{item.fdr_number}</div>
                          {item.parent_instrument_id && (
                            <span className="text-[10px] text-purple-700 font-medium">
                              Linked Renewal
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <div className="font-medium text-slate-800">{item.bank?.name || 'Bank'}</div>
                          <div className="text-[10px] text-slate-400">{item.bank?.branch}</div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="font-medium text-slate-800">{item.maturity_date}</div>
                          {isExpiringSoon && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              <Clock className="w-3 h-3" />
                              {daysToMaturity} Days Left
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <StatusBadge
                            status={item.status}
                            flagged={item.flagged}
                            severity={item.flag_severity}
                          />
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                const doc = item.documents?.[0];
                                setViewingDocument({
                                  doc,
                                  instrument: item,
                                  directFileData: (doc?.ocr_extracted as any)?.file_data || null,
                                  directFileName: doc?.file_name || `scan_${item.fdr_number}.pdf`,
                                });
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer flex items-center gap-1 border border-slate-200"
                              title="View Scanned FDR Document"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span>View Scan</span>
                            </button>
                            <Link
                              href={`/instruments/${item.id}`}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                            >
                              Details
                            </Link>

                            {/* Renew Button (for active instruments) */}
                            {item.status === 'active' && (
                              <button
                                onClick={() => {
                                  setShowRenewModal(item);
                                  setRenewalFdrNumber(`RENEW-${item.fdr_number}`);
                                  setRenewalAmount(item.amount.toString());
                                  setRenewalMaturity(
                                    new Date(Date.now() + 3 * 365 * 86400000).toISOString().split('T')[0]
                                  );
                                }}
                                className="px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 rounded-lg transition cursor-pointer"
                              >
                                Renew
                              </button>
                            )}

                            {/* Request Release Button (for active instruments) */}
                            {item.status === 'active' && (
                              <button
                                onClick={() => setShowReleaseModal(item)}
                                className="px-2.5 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100 rounded-lg transition cursor-pointer"
                              >
                                Release NOC
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL 1: Submit New FDR with AI OCR Auto-Fill Demo */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-overlay">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col modal-panel">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  Submit New Security Deposit Fixed Deposit Receipt
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Upload FDR scan with AI OCR metadata extraction and cryptographic tamper-evident logging.
                </p>
              </div>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* DOCUMENT UPLOAD DROPZONE WITH 5MB LIMIT & GROQ AI OCR */}
              <div className="p-5 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 hover:bg-blue-50/70 transition-colors">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-700 mb-2">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Upload Scanned FDR Document (PDF / Images)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    Upload your bank-issued Fixed Deposit Receipt. Groq AI OCR will inspect the document and automatically populate the fields below for your verification.
                  </p>
                  <span className="text-[11px] font-semibold text-blue-700 mt-1.5 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                    Maximum File Size: 5 MB (PDF, PNG, JPG, JPEG)
                  </span>

                  <label className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer">
                    <UploadCloud className="w-4 h-4" />
                    <span>Choose FDR Document</span>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/jpg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Uploaded File Pill & Preview Trigger */}
                {fileName && (
                  <div className="mt-4 pt-3 border-t border-blue-200/60 flex flex-wrap items-center justify-between gap-2 text-xs bg-white p-3 rounded-xl border border-blue-200 shadow-2xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-blue-700 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{fileName}</span>
                      {fileSize > 0 && (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          ({(fileSize / 1024).toFixed(0)} KB)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setViewingDocument({
                            directFileData: fileDataUrl,
                            directFileName: fileName,
                          })
                        }
                        className="px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Document</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFileName('');
                          setFileDataUrl(null);
                          setFileSize(0);
                          setOcrExtracted(null);
                          setOcrStatus(null);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Sample Test Templates */}
                <div className="mt-3.5 pt-2.5 border-t border-blue-100 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1.5">
                    Or select a sample test receipt:
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={ocrRunning}
                      onClick={() => handleRunOcr('vjti_sbi_scan.pdf')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-100 transition cursor-pointer"
                    >
                      Sample SBI Scan
                    </button>
                    <button
                      type="button"
                      disabled={ocrRunning}
                      onClick={() => handleRunOcr('hdfc_fdr_scan.pdf')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-100 transition cursor-pointer"
                    >
                      Sample HDFC Scan
                    </button>
                    <button
                      type="button"
                      disabled={ocrRunning}
                      onClick={() => handleRunOcr('pnb_mismatch_scan.pdf')}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold hover:bg-rose-100 transition cursor-pointer"
                      title="Simulates mismatch to trigger discrepancy detection"
                    >
                      Sample Mismatch Scan
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload Error Banner */}
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* OCR Scanning Animation */}
              {ocrRunning && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex items-center gap-3 animate-pulse">
                  <Zap className="w-5 h-5 text-indigo-600 animate-bounce shrink-0" />
                  <div>
                    <span className="font-bold block">Groq AI OCR Document Intelligence Scanning...</span>
                    <span className="text-[11px] text-indigo-700">Extracting issuing bank, principal, dates, and joint lien title from document.</span>
                  </div>
                </div>
              )}

              {/* OCR Status Banner (Success or Failure Prompt) */}
              {ocrStatus && !ocrRunning && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-medium ${
                    ocrStatus.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {ocrStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <span className="font-bold block">
                        {ocrStatus.type === 'success'
                          ? 'Fields Auto-Populated by Groq AI OCR'
                          : 'Manual Field Input Required'}
                      </span>
                      <p className="leading-relaxed">{ocrStatus.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Discrepancy Alert banner if detected */}
              {discrepancy && (
                <div
                  className={`p-3 rounded-xl border text-xs font-medium ${
                    discrepancy.flagged
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {discrepancy.flagged ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>{discrepancy.flagged ? 'AI Discrepancy Flag' : 'AI Document Match Verified'}</span>
                  </div>
                  <p>{discrepancy.explanation}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmitFdr} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Issuing Scheduled Bank
                    </label>
                    <select
                      value={bankId}
                      onChange={e => setBankId(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                      required
                    >
                      <option value="b1111111-1111-1111-1111-111111111111">State Bank of India (Nariman Point)</option>
                      <option value="b2222222-2222-2222-2222-222222222222">Punjab National Bank (Parliament St)</option>
                      <option value="b3333333-3333-3333-3333-333333333333">Canara Bank (Town Hall, Bangalore)</option>
                      <option value="b4444444-4444-4444-4444-444444444444">HDFC Bank (BKC Mumbai)</option>
                      <option value="b5555555-5555-5555-5555-555555555555">ICICI Bank (Connaught Place)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      FDR Receipt Number
                    </label>
                    <input
                      type="text"
                      value={fdrNumber}
                      onChange={e => setFdrNumber(e.target.value)}
                      placeholder="e.g. FDR-SBI-2026-98124"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Deposit Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="e.g. 2500000"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Issue Date
                    </label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={e => setIssueDate(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Maturity Date
                    </label>
                    <input
                      type="date"
                      value={maturityDate}
                      onChange={e => setMaturityDate(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600 font-medium">
                      Attachment: {fileName || 'scanned_fdr_receipt.pdf'}
                    </span>
                  </div>
                  <span className="text-emerald-700 font-semibold text-[11px]">Storage RLS Scoped</span>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Submitting & Hashing...' : 'Submit FDR for Verification'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Renew FDR Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-overlay">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden modal-panel">
            <div className="p-5 bg-purple-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Renew Fixed Deposit Instrument</h3>
                <p className="text-xs text-purple-200">
                  Links replacement FDR to original #{showRenewModal.fdr_number}
                </p>
              </div>
              <button onClick={() => setShowRenewModal(null)} className="text-purple-300 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleRenewFdr} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Renewal FDR Number
                </label>
                <input
                  type="text"
                  value={renewalFdrNumber}
                  onChange={e => setRenewalFdrNumber(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Principal Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={renewalAmount}
                    onChange={e => setRenewalAmount(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Maturity Date
                  </label>
                  <input
                    type="date"
                    value={renewalMaturity}
                    onChange={e => setRenewalMaturity(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900">
                On confirmation, #{showRenewModal.fdr_number} will be marked as <b>Renewed</b> and the new
                instrument will be linked with a cryptographic audit trail.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRenewModal(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-purple-700 text-white font-bold rounded-lg text-xs hover:bg-purple-800"
                >
                  {submitting ? 'Linking...' : 'Confirm Renewal Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Request Release NOC Modal */}
      {showReleaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-overlay">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden modal-panel">
            <div className="p-5 bg-orange-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Request Security Deposit Release (NOC)</h3>
                <p className="text-xs text-orange-200">Instrument #{showReleaseModal.fdr_number}</p>
              </div>
              <button onClick={() => setShowReleaseModal(null)} className="text-orange-300 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestRelease} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Statutory Justification Reason (Mandatory)
                </label>
                <textarea
                  rows={4}
                  value={releaseReason}
                  onChange={e => setReleaseReason(e.target.value)}
                  placeholder="e.g. Closure of approved academic department, fulfillment of 10-year statutory lock-in period, and clearance of all student obligations."
                  className="w-full text-xs p-3 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-xs text-orange-950 leading-relaxed">
                <b>Regulatory Note:</b> AICTE does not handle funds directly. If approved by the Regional Finance
                Officer, a digitally signed No-Objection Certificate (NOC) will be issued. Actual deposit return
                is processed by your issuing bank upon submitting the certificate.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowReleaseModal(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-orange-700 text-white font-bold rounded-lg text-xs hover:bg-orange-800"
                >
                  {submitting ? 'Submitting...' : 'Submit Release Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
        document={viewingDocument?.doc}
        instrument={viewingDocument?.instrument}
        directFileData={viewingDocument?.directFileData}
        directFileName={viewingDocument?.directFileName}
      />
    </div>
  );
}
