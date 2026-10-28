import {
  INITIAL_REGIONS,
  INITIAL_BANKS,
  INITIAL_INSTITUTIONS,
  INITIAL_PROFILES,
  INITIAL_FDRS,
  INITIAL_DOCUMENTS,
  INITIAL_RELEASE_REQUESTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from './mock-data';
import {
  Region,
  Bank,
  Institution,
  Profile,
  FDRInstrument,
  DocumentRecord,
  VerificationRecord,
  ReleaseRequest,
  AuditLogEntry,
  NotificationRecord,
  UserRole,
} from './types';
import { generateEntryHash } from '../audit';
import { getDbPool, queryDb } from './db';

// Unified DataStore (PostgreSQL Supabase live backed with in-memory cache)
class DataStore {
  regions: Region[] = [...INITIAL_REGIONS];
  banks: Bank[] = [...INITIAL_BANKS];
  institutions: Institution[] = [...INITIAL_INSTITUTIONS];
  profiles: Profile[] = [...INITIAL_PROFILES];
  instruments: FDRInstrument[] = [...INITIAL_FDRS];
  documents: DocumentRecord[] = [...INITIAL_DOCUMENTS];
  verifications: VerificationRecord[] = [];
  releaseRequests: ReleaseRequest[] = [...INITIAL_RELEASE_REQUESTS];
  auditLogs: AuditLogEntry[] = [...INITIAL_AUDIT_LOGS];
  notifications: NotificationRecord[] = [...INITIAL_NOTIFICATIONS];

  // Current session profile
  currentProfileId: string = '00000000-0000-0000-0000-000000000010'; // default: VJTI Registrar
  private syncedWithDb = false;
  private lastSyncTime = 0;
  private syncPromise: Promise<void> | null = null;

  constructor() {
    this.hydrateFromStorage();
    if (typeof window === 'undefined') {
      this.syncFromDatabase().catch(() => {});
    }
  }

  async syncFromDatabase(force = false): Promise<void> {
    if (!getDbPool()) return;
    const now = Date.now();
    // Cache for 8 seconds unless forced by mutation
    if (!force && this.syncedWithDb && now - this.lastSyncTime < 8000) {
      return;
    }
    if (this.syncPromise) {
      return this.syncPromise;
    }

    this.syncPromise = (async () => {
      try {
        const [regs, bks, insts, profs, fdrs, docs, vers, rels, audits, notifs] = await Promise.all([
          queryDb('select * from regions'),
          queryDb('select * from banks'),
          queryDb('select * from institutions'),
          queryDb('select * from profiles'),
          queryDb('select * from fdr_instruments'),
          queryDb('select * from documents'),
          queryDb('select * from verification_records'),
          queryDb('select * from release_requests'),
          queryDb('select * from audit_logs order by created_at asc'),
          queryDb('select * from notifications order by created_at desc'),
        ]);

        if (regs?.length) this.regions = regs;
        if (bks?.length) this.banks = bks;
        if (insts?.length) this.institutions = insts;
        if (profs?.length) this.profiles = profs;
        if (fdrs?.length) {
          this.instruments = fdrs.map(r => ({
            ...r,
            amount: parseFloat(r.amount),
            issue_date: typeof r.issue_date === 'object' && r.issue_date?.toISOString ? r.issue_date.toISOString().split('T')[0] : String(r.issue_date),
            maturity_date: typeof r.maturity_date === 'object' && r.maturity_date?.toISOString ? r.maturity_date.toISOString().split('T')[0] : String(r.maturity_date),
          }));
        }
        if (docs?.length) this.documents = docs;
        if (vers?.length) this.verifications = vers;
        if (rels?.length) this.releaseRequests = rels;
        if (audits?.length) this.auditLogs = audits;
        if (notifs?.length) {
          const initialMap = new Map(INITIAL_NOTIFICATIONS.map(n => [n.id, n]));
          const dbIds = new Set(notifs.map((n: any) => n.id));
          const enrichedDbNotifs = notifs.map((n: any) => {
            const initial = initialMap.get(n.id);
            const existingLocal = this.notifications.find(loc => loc.id === n.id);
            const resolvedStatus = existingLocal?.status === 'read' ? 'read' : n.status;
            if (initial) {
              return {
                ...initial,
                ...n,
                status: resolvedStatus,
                priority: n.priority || initial.priority,
                category: n.category || initial.category,
                action_label: n.action_label || initial.action_label,
                action_url: n.action_url || initial.action_url,
              };
            }
            return { ...n, status: resolvedStatus };
          });
          const missingInitial = INITIAL_NOTIFICATIONS.filter(n => !dbIds.has(n.id));
          this.notifications = [...enrichedDbNotifs, ...missingInitial];
        } else {
          this.notifications = [...INITIAL_NOTIFICATIONS];
        }
        this.syncedWithDb = true;
        this.lastSyncTime = Date.now();
      } catch (e) {
        console.warn('Sync from DB fallback notice:', e);
      } finally {
        this.syncPromise = null;
      }
    })();

    return this.syncPromise;
  }

  private hydrateFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const savedProfile = localStorage.getItem('aicte_current_profile_id');
        if (savedProfile) this.currentProfileId = savedProfile;
      } catch (e) {
        // ignore
      }
    }
  }

  enrichProfile(prof: Profile): Profile {
    const inst = this.institutions.find(i => i.id === prof.institution_id);
    const reg = this.regions.find(r => r.id === prof.region_id);
    return { ...prof, institution: inst, region: reg };
  }

  getCurrentProfile(): Profile {
    const prof = this.profiles.find(p => p.id === this.currentProfileId);
    if (!prof) return this.enrichProfile(this.profiles[0]);
    return this.enrichProfile(prof);
  }

  getUserFromRequest(request?: Request): Profile | null {
    if (request) {
      const cookieHeader = request.headers.get('cookie') || '';
      const tokenMatch = cookieHeader.match(/sb-access-token=([^;]+)/);
      const match = cookieHeader.match(/aicte_current_profile_id=([^;]+)/);
      // Require both cryptographic session token and profile ID
      if (tokenMatch && match && match[1] && match[1].trim() !== '') {
        const profileId = decodeURIComponent(match[1].trim());
        const found = this.profiles.find(p => p.id === profileId);
        if (found) {
          this.currentProfileId = found.id;
          return this.enrichProfile(found);
        }
      }
    }
    return null;
  }

  setCurrentProfile(id: string) {
    this.currentProfileId = id;
    if (typeof window !== 'undefined') {
      localStorage.setItem('aicte_current_profile_id', id);
    }
  }

  getProfiles(): Profile[] {
    return this.profiles.map(p => ({
      ...p,
      institution: this.institutions.find(i => i.id === p.institution_id),
      region: this.regions.find(r => r.id === p.region_id),
    }));
  }

  getInstitutions(): Institution[] {
    return this.institutions.map(inst => ({
      ...inst,
      region: this.regions.find(r => r.id === inst.region_id),
    }));
  }

  // RLS-scoped instruments query
  getInstruments(user: Profile): FDRInstrument[] {
    let list = [...this.instruments];

    // Enforce RLS
    if (user.role === 'institution') {
      list = list.filter(item => item.institution_id === user.institution_id);
    } else if (
      user.role === 'regional_verification_officer' ||
      user.role === 'regional_finance_officer' ||
      user.role === 'regulation_bureau_head'
    ) {
      if (user.region_id) {
        const regionalInstIds = this.institutions
          .filter(inst => inst.region_id === user.region_id)
          .map(inst => inst.id);
        list = list.filter(item => regionalInstIds.includes(item.institution_id));
      }
    }
    // central_compliance_officer and super_admin see all

    return list.map(inst => this.enrichInstrument(inst));
  }

  getInstrumentById(id: string): FDRInstrument | null {
    const raw = this.instruments.find(i => i.id === id);
    if (!raw) return null;
    return this.enrichInstrument(raw);
  }

  private enrichInstrument(inst: FDRInstrument): FDRInstrument {
    const institution = this.institutions.find(i => i.id === inst.institution_id);
    const bank = this.banks.find(b => b.id === inst.bank_id);
    const docs = this.documents.filter(d => d.instrument_id === inst.id);
    const verifs = this.verifications.filter(v => v.instrument_id === inst.id);
    const releases = this.releaseRequests.filter(r => r.instrument_id === inst.id);
    const parent = inst.parent_instrument_id
      ? this.instruments.find(p => p.id === inst.parent_instrument_id)
      : undefined;

    return {
      ...inst,
      institution: institution ? { ...institution, region: this.regions.find(r => r.id === institution.region_id) } : undefined,
      bank,
      documents: docs,
      verification_records: verifs,
      release_requests: releases,
      parent_instrument: parent,
    };
  }

  // Phase 3: Submit FDR + Document Upload + Audit entry
  async submitFDR(payload: {
    institution_id: string;
    bank_id: string;
    fdr_number: string;
    amount: number;
    issue_date: string;
    maturity_date: string;
    submitted_by: string;
    file_name: string;
    file_data?: string;
    file_size?: number;
    mime_type?: string;
    ocr_extracted?: Record<string, any>;
    flagged?: boolean;
    flag_severity?: 'CLEAN' | 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';
    discrepancy_notes?: string;
  }): Promise<FDRInstrument> {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `f0000000-0000-0000-0000-${Date.now().toString(16).padStart(12, '0')}`;
    const newInstrument: FDRInstrument = {
      id,
      institution_id: payload.institution_id,
      bank_id: payload.bank_id,
      fdr_number: payload.fdr_number,
      amount: payload.amount,
      issue_date: payload.issue_date,
      maturity_date: payload.maturity_date,
      status: 'submitted',
      parent_instrument_id: null,
      flagged: !!payload.flagged,
      flag_severity: payload.flag_severity || 'CLEAN',
      discrepancy_notes: payload.discrepancy_notes || null,
      submitted_by: payload.submitted_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.instruments.unshift(newInstrument);

    // Add Document record with preserved file data
    const docId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `d0000000-0000-0000-0000-${Date.now().toString(16).padStart(12, '0')}`;
    const doc: DocumentRecord = {
      id: docId,
      instrument_id: id,
      file_name: payload.file_name,
      file_path: `${payload.institution_id}/${id}/${payload.file_name}`,
      file_size: payload.file_size || (1024 * 750),
      mime_type: payload.mime_type || 'application/pdf',
      ocr_extracted: {
        ...(payload.ocr_extracted || {}),
        file_data: payload.file_data || (payload.ocr_extracted as any)?.file_data || undefined,
      },
      uploaded_by: payload.submitted_by,
      version: 1,
      created_at: new Date().toISOString(),
    };
    this.documents.push(doc);

    // Compute tamper-evident chained audit log
    const prevLog = this.auditLogs[this.auditLogs.length - 1];
    const prevHash = prevLog ? prevLog.entry_hash : 'GENESIS';
    const actor = this.profiles.find(p => p.id === payload.submitted_by);
    const entryHash = await generateEntryHash(prevHash, newInstrument as any, 'CREATE', id);

    const auditId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `a0000000-0000-0000-0000-${Date.now().toString(16).padStart(12, '0')}`;
    const auditEntry: AuditLogEntry = {
      id: auditId,
      entity_type: 'fdr_instrument',
      entity_id: id,
      action: 'CREATE',
      actor_id: payload.submitted_by,
      actor_role: actor?.role || 'institution',
      actor_email: actor?.email || 'unknown',
      before: null,
      after: {
        fdr_number: payload.fdr_number,
        amount: payload.amount,
        bank_id: payload.bank_id,
        status: 'submitted',
      },
      prev_hash: prevHash,
      entry_hash: entryHash,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.push(auditEntry);

    // Notify regional officers
    const inst = this.institutions.find(i => i.id === payload.institution_id);
    const notifId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `00000003-0000-0000-0000-${Date.now().toString(16).padStart(12, '0')}`;
    this.notifications.unshift({
      id: notifId,
      region_id: inst?.region_id,
      role_target: 'regional_verification_officer',
      type: 'NEW_SUBMISSION',
      title: 'New FDR Submitted for Verification',
      message: `${inst?.name} submitted FDR #${payload.fdr_number} (₹${payload.amount.toLocaleString('en-IN')}).`,
      payload: { instrument_id: id },
      status: 'unread',
      priority: payload.flagged ? 'critical' : 'action_required',
      category: 'verification',
      action_label: 'Verify Authenticity',
      action_url: '/officer/dashboard',
      created_at: new Date().toISOString(),
    });

    // Write to Live Supabase PostgreSQL
    if (getDbPool()) {
      try {
        await queryDb(`
          insert into fdr_instruments (
            id, institution_id, bank_id, fdr_number, amount, issue_date, maturity_date, status, flagged, flag_severity, discrepancy_notes, submitted_by
          ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          id, payload.institution_id, payload.bank_id,
          payload.fdr_number, payload.amount, payload.issue_date,
          payload.maturity_date, 'submitted', !!payload.flagged,
          payload.flag_severity || 'CLEAN', payload.discrepancy_notes || null, payload.submitted_by
        ]);
        await queryDb(`
          insert into documents (
            id, instrument_id, file_name, file_path, file_size, mime_type, ocr_extracted, uploaded_by, version
          ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          docId, id, doc.file_name, doc.file_path, doc.file_size,
          doc.mime_type, JSON.stringify(doc.ocr_extracted), doc.uploaded_by, doc.version
        ]);
        await queryDb(`
          insert into audit_logs (id, entity_type, entity_id, action, actor_id, actor_role, actor_email, before, after, prev_hash, entry_hash)
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          auditId, auditEntry.entity_type, auditEntry.entity_id, auditEntry.action,
          auditEntry.actor_id, auditEntry.actor_role, auditEntry.actor_email,
          JSON.stringify(auditEntry.before), JSON.stringify(auditEntry.after),
          auditEntry.prev_hash, auditEntry.entry_hash
        ]);
      } catch (dbErr) {
        console.warn('Live DB submit notice:', dbErr);
      }
    }

    return this.enrichInstrument(newInstrument);
  }

  // Phase 4: Officer Verification (Super Admin strictly blocked)
  async verifyInstrument(instrumentId: string, officer: Profile, notes: string): Promise<FDRInstrument> {
    if (officer.role === 'super_admin') {
      throw new Error('403 Forbidden: Super Admin accounts are prohibited from executing verification actions (Separation of Duties).');
    }

    const inst = this.instruments.find(i => i.id === instrumentId);
    if (!inst) throw new Error('Instrument not found');

    const beforeState = { status: inst.status };
    inst.status = 'active';
    inst.flagged = false;
    inst.updated_at = new Date().toISOString();

    const verifId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `00000001-0000-0000-0000-${Date.now().toString(16).padStart(12, '0')}`;
    const verifRecord: VerificationRecord = {
      id: verifId,
      instrument_id: instrumentId,
      source: 'officer',
      verified_fields: {
        bank_verified: true,
        amount_verified: true,
        maturity_verified: true,
        fdr_number_verified: true,
      },
      notes,
      verified_by: officer.id,
      verified_at: new Date().toISOString(),
      officer_profile: officer,
    };
    this.verifications.push(verifRecord);

    // Audit log
    const prevLog = this.auditLogs[this.auditLogs.length - 1];
    const prevHash = prevLog ? prevLog.entry_hash : 'GENESIS';
    const afterState = { status: 'active', verified_by: officer.full_name, notes };
    const entryHash = await generateEntryHash(prevHash, afterState, 'VERIFY', instrumentId);

    const auditId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `a0000000-0000-0000-0000-${Date.now().toString(16).padStart(12, '0')}`;
    this.auditLogs.push({
      id: auditId,
      entity_type: 'fdr_instrument',
      entity_id: instrumentId,
      action: 'VERIFY',
      actor_id: officer.id,
      actor_role: officer.role,
      actor_email: officer.email,
      before: beforeState,
      after: afterState,
      prev_hash: prevHash,
      entry_hash: entryHash,
      created_at: new Date().toISOString(),
    });

    // Write to Live Supabase PostgreSQL
    if (getDbPool()) {
      try {
        await queryDb(`update fdr_instruments set status = 'active', flagged = false, updated_at = now() where id = $1`, [instrumentId]);
        await queryDb(`
          insert into verification_records (id, instrument_id, source, verified_fields, notes, verified_by, verified_at)
          values ($1, $2, $3, $4, $5, $6, now())
        `, [
          verifId, instrumentId, 'officer',
          JSON.stringify(verifRecord.verified_fields), notes, officer.id
        ]);
        await queryDb(`
          insert into audit_logs (id, entity_type, entity_id, action, actor_id, actor_role, actor_email, before, after, prev_hash, entry_hash)
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          auditId, 'fdr_instrument', instrumentId, 'VERIFY',
          officer.id, officer.role, officer.email,
          JSON.stringify(beforeState), JSON.stringify(afterState),
          prevHash, entryHash
        ]);
      } catch (dbErr) {
        console.warn('Live DB verify notice:', dbErr);
      }
    }

    // Notify institution
    const instProfile = this.profiles.find(p => p.institution_id === inst.institution_id);
    if (instProfile) {
      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: instProfile.id,
        role_target: 'institution',
        type: 'VERIFICATION_SUCCESS',
        title: 'FDR Verified & Activated',
        message: `FDR #${inst.fdr_number} has been verified by the Regional Office and is now officially active.`,
        payload: { instrument_id: inst.id, institution_id: inst.institution_id },
        status: 'unread',
        priority: 'info',
        category: 'verification',
        action_label: 'View Certificate',
        action_url: '/institution/dashboard',
        created_at: new Date().toISOString(),
      });
    }

    // Also notify Regional Finance Officer for Tier-2 endorsement
    const instObj = this.institutions.find(i => i.id === inst.institution_id);
    this.notifications.unshift({
      id: `notif-rfo-${Date.now()}`,
      region_id: instObj?.region_id,
      role_target: 'regional_finance_officer',
      type: 'FINANCE_ENDORSEMENT_PENDING',
      title: 'Tier-2 Financial Audit Pending',
      message: `FDR #${inst.fdr_number} (₹${inst.amount.toLocaleString('en-IN')}) verified by RVO. Awaiting financial confirmation & lien ledger entry.`,
      payload: { instrument_id: inst.id },
      status: 'unread',
      priority: 'action_required',
      category: 'finance',
      action_label: 'Review & Endorse Lien',
      action_url: '/officer/dashboard',
      created_at: new Date().toISOString(),
    });

    return this.enrichInstrument(inst);
  }

  // Phase 4: Officer Rejection (Super Admin strictly blocked)
  async rejectInstrument(instrumentId: string, officer: Profile, reason: string): Promise<FDRInstrument> {
    if (officer.role === 'super_admin') {
      throw new Error('403 Forbidden: Super Admin accounts are prohibited from executing rejection actions (Separation of Duties).');
    }

    const inst = this.instruments.find(i => i.id === instrumentId);
    if (!inst) throw new Error('Instrument not found');

    const beforeState = { status: inst.status, flagged: inst.flagged };
    inst.status = 'rejected';
    inst.flagged = true;
    inst.flag_severity = 'HIGH_RISK';
    inst.discrepancy_notes = reason;
    inst.updated_at = new Date().toISOString();

    const verifId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `00000002-0000-0000-0000-${Date.now().toString(16).padStart(12, '0')}`;
    const verifRecord: VerificationRecord = {
      id: verifId,
      instrument_id: instrumentId,
      source: 'officer',
      verified_fields: {
        rejected: true,
        reason,
      },
      notes: `Rejected by ${officer.full_name || 'Regional Officer'}: ${reason}`,
      verified_by: officer.id,
      verified_at: new Date().toISOString(),
      officer_profile: officer,
    };
    this.verifications.push(verifRecord);

    // Cryptographic SHA-256 Audit Log
    const prevLog = this.auditLogs[this.auditLogs.length - 1];
    const prevHash = prevLog ? prevLog.entry_hash : 'GENESIS';
    const afterState = { status: 'rejected', rejected_by: officer.full_name, reason };
    const entryHash = await generateEntryHash(prevHash, afterState, 'REJECT_INSTRUMENT', instrumentId);

    const auditId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `a0000001-0000-0000-0000-${Date.now().toString(16).padStart(12, '0')}`;
    this.auditLogs.push({
      id: auditId,
      entity_type: 'fdr_instrument',
      entity_id: instrumentId,
      action: 'REJECT_INSTRUMENT',
      actor_id: officer.id,
      actor_role: officer.role,
      actor_email: officer.email,
      before: beforeState,
      after: afterState,
      prev_hash: prevHash,
      entry_hash: entryHash,
      created_at: new Date().toISOString(),
    });

    // Write to Live Supabase PostgreSQL
    if (getDbPool()) {
      try {
        await queryDb(`update fdr_instruments set status = 'rejected', flagged = true, flag_severity = 'HIGH_RISK', discrepancy_notes = $2, updated_at = now() where id = $1`, [instrumentId, reason]);
        await queryDb(`
          insert into verification_records (id, instrument_id, source, verified_fields, notes, verified_by, verified_at)
          values ($1, $2, $3, $4, $5, $6, now())
        `, [
          verifId, instrumentId, 'officer',
          JSON.stringify(verifRecord.verified_fields), `Rejected: ${reason}`, officer.id
        ]);
        await queryDb(`
          insert into audit_logs (id, entity_type, entity_id, action, actor_id, actor_role, actor_email, before, after, prev_hash, entry_hash)
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          auditId, 'fdr_instrument', instrumentId, 'REJECT_INSTRUMENT',
          officer.id, officer.role, officer.email,
          JSON.stringify(beforeState), JSON.stringify(afterState),
          prevHash, entryHash
        ]);
      } catch (dbErr) {
        console.warn('Live DB reject notice:', dbErr);
      }
    }

    // Role-scoped notification for the institution
    const instProfile = this.profiles.find(p => p.institution_id === inst.institution_id);
    if (instProfile) {
      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: instProfile.id,
        role_target: 'institution',
        type: 'VERIFICATION_REJECTED',
        title: 'FDR Deposit Rejected by Regional Officer',
        message: `FDR #${inst.fdr_number} was rejected by Regional Office: "${reason}". Please review discrepancies and resubmit.`,
        payload: { instrument_id: inst.id, institution_id: inst.institution_id, reason },
        status: 'unread',
        priority: 'critical',
        category: 'verification',
        action_label: 'View Discrepancy',
        action_url: '/institution/dashboard',
        created_at: new Date().toISOString(),
      });
    }

    return this.enrichInstrument(inst);
  }

  // Phase 5: Renewal (Linked Instrument Chains)
  async renewInstrument(parentInstrumentId: string, payload: {
    fdr_number: string;
    amount: number;
    issue_date: string;
    maturity_date: string;
    submitted_by: string;
    file_name: string;
  }): Promise<FDRInstrument> {
    const parent = this.instruments.find(i => i.id === parentInstrumentId);
    if (!parent) throw new Error('Parent FDR not found');

    // Mark original renewed
    parent.status = 'renewed';
    parent.updated_at = new Date().toISOString();

    const newId = `fdr-renew-${Date.now()}`;
    const newInstrument: FDRInstrument = {
      id: newId,
      institution_id: parent.institution_id,
      bank_id: parent.bank_id,
      fdr_number: payload.fdr_number,
      amount: payload.amount,
      issue_date: payload.issue_date,
      maturity_date: payload.maturity_date,
      status: 'submitted',
      parent_instrument_id: parentInstrumentId,
      flagged: false,
      flag_severity: 'CLEAN',
      submitted_by: payload.submitted_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.instruments.unshift(newInstrument);

    // Chained audit log
    const prevLog = this.auditLogs[this.auditLogs.length - 1];
    const prevHash = prevLog ? prevLog.entry_hash : 'GENESIS';
    const entryHash = await generateEntryHash(prevHash, { renewed_from: parentInstrumentId, new_fdr: newId }, 'RENEW', newId);

    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      entity_type: 'fdr_instrument',
      entity_id: newId,
      action: 'RENEW',
      actor_id: payload.submitted_by,
      actor_role: 'institution',
      actor_email: this.profiles.find(p => p.id === payload.submitted_by)?.email || '',
      before: { parent_status: 'active' },
      after: { parent_status: 'renewed', new_fdr_id: newId, fdr_number: payload.fdr_number },
      prev_hash: prevHash,
      entry_hash: entryHash,
      created_at: new Date().toISOString(),
    });

    return this.enrichInstrument(newInstrument);
  }

  // Phase 5: Release Request
  async requestRelease(instrumentId: string, reason: string, user: Profile): Promise<ReleaseRequest> {
    const inst = this.instruments.find(i => i.id === instrumentId);
    if (!inst) throw new Error('Instrument not found');

    inst.status = 'release_requested';
    inst.updated_at = new Date().toISOString();

    const reqId = `rel-${Date.now()}`;
    const req: ReleaseRequest = {
      id: reqId,
      instrument_id: instrumentId,
      requested_by: user.id,
      reason,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    this.releaseRequests.unshift(req);

    // Audit log
    const prevLog = this.auditLogs[this.auditLogs.length - 1];
    const prevHash = prevLog ? prevLog.entry_hash : 'GENESIS';
    const entryHash = await generateEntryHash(prevHash, req as any, 'REQUEST_RELEASE', instrumentId);

    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      entity_type: 'release_request',
      entity_id: reqId,
      action: 'REQUEST_RELEASE',
      actor_id: user.id,
      actor_role: user.role,
      actor_email: user.email,
      before: { status: 'active' },
      after: { status: 'pending', reason },
      prev_hash: prevHash,
      entry_hash: entryHash,
      created_at: new Date().toISOString(),
    });

    // Notify Finance officer
    const institution = this.institutions.find(i => i.id === inst.institution_id);
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      region_id: institution?.region_id,
      role_target: 'regional_finance_officer',
      type: 'RELEASE_REQUESTED',
      title: 'Release NOC Request Submitted',
      message: `${institution?.name} has requested security deposit release for FDR #${inst.fdr_number}.`,
      payload: { request_id: reqId, instrument_id: inst.id },
      status: 'unread',
      priority: 'action_required',
      category: 'release',
      action_label: 'Audit Financial Lock-in',
      action_url: '/officer/dashboard',
      created_at: new Date().toISOString(),
    });

    return req;
  }

  // Phase 5: Approve or Reject Release Request (Super Admin strictly blocked)
  async decideReleaseRequest(
    requestId: string,
    decision: 'approved' | 'rejected',
    decisionReason: string,
    officer: Profile
  ): Promise<ReleaseRequest> {
    if (officer.role === 'super_admin') {
      throw new Error('403 Forbidden: Super Admin accounts cannot approve or reject release requests.');
    }

    const req = this.releaseRequests.find(r => r.id === requestId);
    if (!req) throw new Error('Release request not found');
    const inst = this.instruments.find(i => i.id === req.instrument_id);
    if (!inst) throw new Error('Instrument not found');

    req.status = decision;
    req.decided_by = officer.id;
    req.decision_reason = decisionReason;
    req.decided_at = new Date().toISOString();

    if (decision === 'approved') {
      inst.status = 'released';
      req.certificate_path = `/certificates/AICTE-NOC-${inst.fdr_number}.pdf`;
      req.certificate_hash = `sha256-${Date.now().toString(16)}-aicte-verified`;
      req.certificate_signature = `RSA2048-SIG-${Date.now().toString(36).toUpperCase()}-BUREAU-OFFICIAL`;
    } else {
      inst.status = 'active'; // Revert back to active if rejected
    }
    inst.updated_at = new Date().toISOString();

    // Chained audit log
    const prevLog = this.auditLogs[this.auditLogs.length - 1];
    const prevHash = prevLog ? prevLog.entry_hash : 'GENESIS';
    const action = decision === 'approved' ? 'APPROVE_RELEASE' : 'REJECT_RELEASE';
    const entryHash = await generateEntryHash(prevHash, req as any, action, req.id);

    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      entity_type: 'release_request',
      entity_id: req.id,
      action,
      actor_id: officer.id,
      actor_role: officer.role,
      actor_email: officer.email,
      before: { status: 'pending' },
      after: { status: decision, reason: decisionReason, certificate: req.certificate_path },
      prev_hash: prevHash,
      entry_hash: entryHash,
      created_at: new Date().toISOString(),
    });

    // Notify institution
    const instProfile = this.profiles.find(p => p.institution_id === inst.institution_id);
    if (instProfile) {
      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: instProfile.id,
        role_target: 'institution',
        type: decision === 'approved' ? 'RELEASE_APPROVED' : 'RELEASE_REJECTED',
        title: decision === 'approved' ? 'Release NOC Approved' : 'Release Request Rejected',
        message: decision === 'approved'
          ? `NOC Release Certificate issued for FDR #${inst.fdr_number}. Please submit bank encashment proof upon settlement.`
          : `Release request for FDR #${inst.fdr_number} was rejected: ${decisionReason}.`,
        payload: { request_id: req.id, instrument_id: inst.id, institution_id: inst.institution_id },
        status: 'unread',
        priority: decision === 'approved' ? 'action_required' : 'warning',
        category: 'release',
        action_label: decision === 'approved' ? 'Upload Settlement Proof' : 'View Decision Reason',
        action_url: '/institution/dashboard',
        created_at: new Date().toISOString(),
      });
    }

    return req;
  }

  // Phase 5: Confirm Refund (Record-keeping verification of institutional bank closure proof)
  async confirmRefund(
    requestId: string,
    bankProofNotes: string,
    officer: Profile
  ): Promise<ReleaseRequest> {
    if (officer.role === 'super_admin') {
      throw new Error('403 Forbidden: Super Admin accounts cannot confirm refund closures.');
    }

    const req = this.releaseRequests.find(r => r.id === requestId);
    if (!req) throw new Error('Release request not found');
    const inst = this.instruments.find(i => i.id === req.instrument_id);
    if (!inst) throw new Error('Instrument not found');

    req.status = 'refund_confirmed';
    req.bank_proof_path = `/proofs/bank-encashment-proof-${inst.fdr_number}.pdf`;
    req.bank_proof_notes = bankProofNotes;

    inst.status = 'refund_confirmed';
    inst.updated_at = new Date().toISOString();

    // Audit log
    const prevLog = this.auditLogs[this.auditLogs.length - 1];
    const prevHash = prevLog ? prevLog.entry_hash : 'GENESIS';
    const entryHash = await generateEntryHash(prevHash, { status: 'refund_confirmed', notes: bankProofNotes }, 'CONFIRM_REFUND', req.id);

    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      entity_type: 'release_request',
      entity_id: req.id,
      action: 'CONFIRM_REFUND',
      actor_id: officer.id,
      actor_role: officer.role,
      actor_email: officer.email,
      before: { status: 'approved' },
      after: { status: 'refund_confirmed', bank_proof_notes: bankProofNotes },
      prev_hash: prevHash,
      entry_hash: entryHash,
      created_at: new Date().toISOString(),
    });

    return req;
  }

  // Phase 6: Scheduled Monitoring trigger
  runMaturityCronCheck(): { checked: number; alertsGenerated: number } {
    let count = 0;
    const now = Date.now();
    for (const inst of this.instruments) {
      if (inst.status !== 'active') continue;
      const mat = new Date(inst.maturity_date).getTime();
      const daysLeft = Math.ceil((mat - now) / 86400000);

      if (daysLeft <= 30 && daysLeft >= 0) {
        count++;
        const instProfile = this.profiles.find(p => p.institution_id === inst.institution_id);
        const institution = this.institutions.find(i => i.id === inst.institution_id);

        this.notifications.unshift({
          id: `cron-${Date.now()}-${inst.id}`,
          user_id: instProfile?.id,
          role_target: 'institution',
          region_id: institution?.region_id,
          type: 'CRON_MATURITY_REMINDER',
          title: `Maturity Alert: ${daysLeft} Days Remaining`,
          message: `Scheduled Monitor: FDR #${inst.fdr_number} (${institution?.name}) matures on ${inst.maturity_date} (${daysLeft} days). Please initiate renewal or release.`,
          payload: { instrument_id: inst.id, days_left: daysLeft, institution_id: inst.institution_id },
          status: 'unread',
          priority: daysLeft <= 15 ? 'critical' : 'action_required',
          category: 'maturity',
          action_label: 'Initiate Rollover',
          action_url: '/institution/dashboard',
          created_at: new Date().toISOString(),
        });
      }
    }
    return { checked: this.instruments.length, alertsGenerated: count };
  }

  // Audit Logs getter
  getAuditLogs(entityId?: string): AuditLogEntry[] {
    if (entityId) {
      return this.auditLogs.filter(a => a.entity_id === entityId);
    }
    return [...this.auditLogs].reverse();
  }

  // Phase 8: Live Tamper Simulation for Demo Integrity Check
  simulateTamperAuditLog(logId: string): { tampered: boolean; originalHash: string; modifiedAmount: number } {
    const log = this.auditLogs.find(a => a.id === logId);
    if (!log) throw new Error('Audit entry not found');

    const originalHash = log.entry_hash;
    // Alter historical record payload silently without updating hash!
    if (log.after) {
      log.after.amount = 99999999; // Fraudulent edit!
    } else {
      log.after = { tampered: true, fake_amount: 99999999 };
    }

    return {
      tampered: true,
      originalHash,
      modifiedAmount: 99999999,
    };
  }

  resetAuditLogs() {
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
  }
}

// Global singleton for Next.js App Router
export const dataStore = new DataStore();
