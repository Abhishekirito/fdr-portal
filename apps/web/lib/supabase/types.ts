export type UserRole =
  | 'institution'
  | 'regional_verification_officer'
  | 'regional_finance_officer'
  | 'regulation_bureau_head'
  | 'central_compliance_officer'
  | 'super_admin';

export type FDRStatus =
  | 'submitted'
  | 'under_verification'
  | 'active'
  | 'renewed'
  | 'release_requested'
  | 'released'
  | 'refund_confirmed'
  | 'rejected';

export type ReleaseStatus = 'pending' | 'approved' | 'rejected' | 'refund_confirmed';

export type VerificationSource = 'institution' | 'officer' | 'bank_proof';

export interface Region {
  id: string;
  name: string;
  code: string;
  created_at?: string;
}

export interface Bank {
  id: string;
  name: string;
  ifsc_code: string;
  branch: string;
  created_at?: string;
}

export interface Institution {
  id: string;
  name: string;
  aicte_code: string;
  region_id: string;
  contact_email: string;
  contact_phone: string;
  address?: string;
  trust_score: number;
  status: 'active' | 'pending_approval' | 'suspended';
  created_at?: string;
  region?: Region;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  region_id?: string | null;
  institution_id?: string | null;
  phone?: string;
  mfa_enabled: boolean;
  status: 'active' | 'invited' | 'deactivated';
  created_at?: string;
  region?: Region;
  institution?: Institution;
}

export interface FDRInstrument {
  id: string;
  institution_id: string;
  bank_id: string;
  fdr_number: string;
  amount: number;
  issue_date: string;
  maturity_date: string;
  status: FDRStatus;
  parent_instrument_id?: string | null;
  flagged: boolean;
  flag_severity: 'CLEAN' | 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';
  discrepancy_notes?: string | null;
  submitted_by?: string | null;
  created_at?: string;
  updated_at?: string;
  institution?: Institution;
  bank?: Bank;
  documents?: DocumentRecord[];
  verification_records?: VerificationRecord[];
  release_requests?: ReleaseRequest[];
  parent_instrument?: FDRInstrument;
}

export interface DocumentRecord {
  id: string;
  instrument_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  ocr_extracted?: Record<string, any>;
  uploaded_by?: string;
  version: number;
  created_at?: string;
}

export interface VerificationRecord {
  id: string;
  instrument_id: string;
  source: VerificationSource;
  verified_fields: Record<string, any>;
  notes?: string;
  verified_by?: string;
  verified_at?: string;
  officer_profile?: Profile;
}

export interface ReleaseRequest {
  id: string;
  instrument_id: string;
  requested_by?: string;
  reason: string;
  status: ReleaseStatus;
  decided_by?: string;
  decision_reason?: string;
  certificate_path?: string;
  certificate_hash?: string;
  certificate_signature?: string;
  bank_proof_path?: string;
  bank_proof_notes?: string;
  created_at?: string;
  decided_at?: string;
  instrument?: FDRInstrument;
}

export interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id?: string;
  actor_role?: string;
  actor_email?: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  prev_hash: string;
  entry_hash: string;
  created_at?: string;
}

export interface NotificationRecord {
  id: string;
  user_id?: string;
  role_target?: string;
  region_id?: string;
  type: string;
  title: string;
  message: string;
  payload?: Record<string, any>;
  status: 'unread' | 'read' | 'sent' | 'pending';
  priority?: 'critical' | 'action_required' | 'warning' | 'info';
  category?: 'verification' | 'finance' | 'maturity' | 'compliance' | 'security' | 'release';
  action_url?: string;
  action_label?: string;
  scheduled_for?: string;
  created_at?: string;
}
