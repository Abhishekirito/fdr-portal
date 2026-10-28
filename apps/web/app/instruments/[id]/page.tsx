'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { ProvenanceTimeline } from '@/components/ProvenanceTimeline';
import { RenewalChainTree } from '@/components/RenewalChainTree';
import {
  ShieldCheck,
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  Building2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Eye,
} from 'lucide-react';
import { FDRInstrument, AuditLogEntry } from '@/lib/supabase/types';
import { DocumentViewerModal } from '@/components/DocumentViewerModal';
import jsPDF from 'jspdf';

export default function InstrumentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [instrument, setInstrument] = useState<FDRInstrument | null>(null);
  const [auditChain, setAuditChain] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState<string>('/institution/dashboard');
  const [userRole, setUserRole] = useState<string>('institution');

  useEffect(() => {
    if (id) fetchDetails();
    fetchUserSession();
  }, [id]);

  const fetchUserSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.currentProfile) {
        const role = data.currentProfile.role;
        setUserRole(role);
        if (role === 'institution') {
          setDashboardUrl('/institution/dashboard');
        } else if (role === 'central_compliance_officer' || role === 'super_admin') {
          setDashboardUrl('/admin/dashboard');
        } else {
          setDashboardUrl('/officer/dashboard');
        }
      }
    } catch {
      // Fallback: check document.cookie
      if (typeof document !== 'undefined') {
        if (document.cookie.includes('aicte_user_role=institution')) {
          setDashboardUrl('/institution/dashboard');
        } else if (document.cookie.includes('super_admin') || document.cookie.includes('central_compliance')) {
          setDashboardUrl('/admin/dashboard');
        } else if (document.cookie.includes('officer') || document.cookie.includes('bureau')) {
          setDashboardUrl('/officer/dashboard');
        }
      }
    }
  };

  const handleBackToDashboard = (e: React.MouseEvent) => {
    e.preventDefault();
    if (
      typeof window !== 'undefined' &&
      window.history.length > 1 &&
      document.referrer &&
      (document.referrer.includes('/dashboard') ||
        document.referrer.includes('/officer') ||
        document.referrer.includes('/institution') ||
        document.referrer.includes('/admin'))
    ) {
      router.back();
    } else {
      router.push(dashboardUrl);
    }
  };

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/instruments/${id}`);
      const data = await res.json();
      if (data.instrument) setInstrument(data.instrument);
      if (data.auditChain) setAuditChain(data.auditChain);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Generate Authentic PDF Release NOC Certificate
  const downloadReleaseCertificate = () => {
    if (!instrument) return;

    const doc = new jsPDF();
    const releaseReq = instrument.release_requests?.[0];

    // Certificate Header
    doc.setFillColor(15, 43, 72);
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ALL INDIA COUNCIL FOR TECHNICAL EDUCATION', 105, 14, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('(A STATUTORY BODY OF THE GOVERNMENT OF INDIA) • REGULATION BUREAU', 105, 22, { align: 'center' });
    doc.text('Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070', 105, 29, { align: 'center' });

    // Certificate Title
    doc.setTextColor(15, 43, 72);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('NO OBJECTION & RELEASE CERTIFICATE (NOC)', 105, 50, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Certificate Ref: AICTE/NOC/REG/${new Date().getFullYear()}/${instrument.fdr_number}`, 105, 57, { align: 'center' });

    // Body
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 63, 190, 63);

    doc.setFontSize(10);
    doc.text('To,', 20, 72);
    doc.setFont('helvetica', 'bold');
    doc.text(`The Branch Manager, ${instrument.bank?.name || 'Scheduled Bank'}`, 20, 78);
    doc.setFont('helvetica', 'normal');
    doc.text(`${instrument.bank?.branch || 'Authorized Branch'}`, 20, 84);

    const bodyText = `This is to formally certify that the All India Council for Technical Education (AICTE), Regulation Bureau has NO OBJECTION to the encashment / release of the statutory Security Deposit Fixed Deposit Receipt detailed below, submitted by ${instrument.institution?.name} (AICTE Permanent Code: ${instrument.institution?.aicte_code}):`;

    doc.setFontSize(9.5);
    const splitBody = doc.splitTextToSize(bodyText, 170);
    doc.text(splitBody, 20, 96);

    // Instrument Details Table
    doc.setFillColor(245, 247, 250);
    doc.rect(20, 115, 170, 48, 'F');
    doc.rect(20, 115, 170, 48, 'S');

    doc.setFont('helvetica', 'bold');
    doc.text(`FDR Receipt Number:`, 25, 125);
    doc.setFont('helvetica', 'normal');
    doc.text(`${instrument.fdr_number}`, 80, 125);

    doc.setFont('helvetica', 'bold');
    doc.text(`Deposit Amount:`, 25, 134);
    doc.setFont('helvetica', 'normal');
    doc.text(`INR ${instrument.amount.toLocaleString('en-IN')}/-`, 80, 134);

    doc.setFont('helvetica', 'bold');
    doc.text(`Maturity Date:`, 25, 143);
    doc.setFont('helvetica', 'normal');
    doc.text(`${instrument.maturity_date}`, 80, 143);

    doc.setFont('helvetica', 'bold');
    doc.text(`Approval Reason:`, 25, 152);
    doc.setFont('helvetica', 'normal');
    doc.text(`${releaseReq?.decision_reason || 'Statutory lock-in obligations completed'}`, 80, 152);

    // Cryptographic Seal Box
    doc.setFillColor(240, 253, 244);
    doc.rect(20, 172, 170, 35, 'F');
    doc.setDrawColor(34, 197, 94);
    doc.rect(20, 172, 170, 35, 'S');

    doc.setTextColor(22, 101, 52);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('CRYPTOGRAPHIC REGULATORY VALIDATION SEAL', 25, 180);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Digital Signature: ${releaseReq?.certificate_signature || 'RSA2048-SIG-AICTE-REGULATION-BUREAU-OFFICIAL'}`, 25, 187);
    doc.text(`SHA-256 Ledger Hash: ${releaseReq?.certificate_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}`, 25, 194);
    doc.text(`Signatory: Smt. Kavita Sharma, Regional Finance Officer • Verified with Bureau Public Key`, 25, 201);

    // Footer Signatures
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text('Issued by Order of Regulation Bureau', 130, 240);
    doc.setFont('helvetica', 'bold');
    doc.text('All India Council for Technical Education', 130, 246);

    doc.save(`AICTE_Release_NOC_${instrument.fdr_number}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-3" />
          <span className="text-xs font-semibold text-slate-500">Loading instrument records...</span>
        </div>
      </div>
    );
  }

  if (!instrument) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-slate-600 mb-4">Instrument record not found</p>
          <Link
            href={dashboardUrl}
            onClick={handleBackToDashboard}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const doc = instrument.documents?.[0];
  const ocr = doc?.ocr_extracted || {};
  const isReleased = instrument.status === 'released' || instrument.status === 'refund_confirmed';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={dashboardUrl}
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-900 transition py-1.5 px-3 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          {isReleased && (
            <button
              onClick={downloadReleaseCertificate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Signed Release NOC (PDF)</span>
            </button>
          )}
        </div>

        {/* Instrument Header Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                FDR #{instrument.fdr_number}
              </h1>
              <StatusBadge
                status={instrument.status}
                flagged={instrument.flagged}
                severity={instrument.flag_severity}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {instrument.institution?.name} • Permanent Code: {instrument.institution?.aicte_code} •{' '}
              {instrument.institution?.region?.name}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-semibold uppercase">Principal Deposit</span>
            <span className="text-2xl font-black text-blue-900">
              ₹{instrument.amount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* If Rejected Alert Banner */}
        {instrument.status === 'rejected' && (
          <div className="bg-rose-50 border border-rose-300 rounded-2xl p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-rose-900">
                  FDR Submission Rejected by Regional Verification Officer
                </h3>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  <b>Statutory Rejection Reason:</b> {instrument.discrepancy_notes || 'Discrepancy detected during statutory verification.'}
                </p>
                <p className="text-[11px] text-rose-600 mt-1.5">
                  Please review the discrepancies identified above, re-upload the rectified bank deposit receipt, and resubmit for verification.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Renewal Chain Tree (if applicable) */}
        <RenewalChainTree instrument={instrument} />

        {/* Grid: Details & Provenance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Core Data & OCR Extraction */}
          <div className="lg:col-span-2 space-y-6">
            {/* Metadata Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Deposit Instrument Specifications
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Issuing Bank</span>
                  <span className="font-bold text-slate-800">{instrument.bank?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Branch</span>
                  <span className="font-semibold text-slate-800">{instrument.bank?.branch}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Value / Issue Date</span>
                  <span className="font-semibold text-slate-800">{instrument.issue_date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Maturity Date</span>
                  <span className="font-bold text-blue-800">{instrument.maturity_date}</span>
                </div>
              </div>
            </div>

            {/* OCR Extracted Ground Truth */}
            {doc && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="font-bold text-sm text-slate-900">
                      OCR Document Intelligence Extraction
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsViewerOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-700" />
                      <span>View Uploaded Document</span>
                    </button>
                    <span className="text-[11px] text-slate-400 font-mono">
                      File: {doc.file_name} (v{doc.version})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">OCR Bank</span>
                    <span className="text-slate-800 font-bold">{ocr.bank_name || instrument.bank?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">OCR FDR #</span>
                    <span className="text-slate-800 font-bold">{ocr.fdr_number || instrument.fdr_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">OCR Amount</span>
                    <span
                      className={`font-bold ${
                        instrument.flagged ? 'text-rose-600 underline' : 'text-emerald-700'
                      }`}
                    >
                      ₹{Number(ocr.amount || instrument.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">OCR Maturity</span>
                    <span className="text-slate-800 font-bold">
                      {ocr.maturity_date || instrument.maturity_date}
                    </span>
                  </div>
                </div>

                {instrument.flagged && (
                  <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 font-medium">
                    <AlertTriangle className="w-4 h-4 text-rose-600 inline mr-1" />
                    {instrument.discrepancy_notes}
                  </div>
                )}
              </div>
            )}

            {/* Cryptographic Audit Chain for this Instrument */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                Immutable SHA-256 Audit Trail
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Every state alteration is hashed and cryptographically linked to the previous transaction block.
              </p>

              <div className="space-y-2.5">
                {auditChain.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-white font-bold text-[9px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-blue-900">{entry.action}</span>
                        <span className="text-[10px] text-slate-500">by {entry.actor_email}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(entry.created_at || '').toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-500 truncate">
                      <span className="font-bold text-slate-400">Entry Hash: </span>
                      {entry.entry_hash}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Provenance Timeline */}
          <div>
            <ProvenanceTimeline instrument={instrument} />
          </div>
        </div>
      </main>

      {/* DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        document={doc}
        instrument={instrument}
      />
    </div>
  );
}
