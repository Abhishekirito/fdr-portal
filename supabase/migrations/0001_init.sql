-- ==============================================================================
-- AICTE Security Deposit / FDR Management Portal - Database Schema
-- Migration: 0001_init.sql
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- 1. Regions
create table if not exists regions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,          -- e.g. 'Western Region (Mumbai)', 'Northern Region (Delhi)'
  code text not null unique,          -- e.g. 'WRO', 'NRO', 'SRO', 'ERO'
  created_at timestamptz default now()
);

-- 2. Institutions
create table if not exists institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  aicte_code text unique not null,    -- e.g. '1-3324567891'
  region_id uuid references regions(id) on delete restrict not null,
  contact_email text,
  contact_phone text,
  address text,
  trust_score int default 100 check (trust_score between 0 and 100),
  status text default 'active' check (status in ('active', 'pending_approval', 'suspended')),
  created_at timestamptz default now()
);

-- 3. User Roles Enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum (
      'institution',
      'regional_verification_officer',
      'regional_finance_officer',
      'regulation_bureau_head',
      'central_compliance_officer',
      'super_admin'
    );
  end if;
end$$;

-- 4. Profiles (extends Supabase auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null,
  role user_role not null,
  region_id uuid references regions(id) on delete set null,   -- null for central_compliance_officer / super_admin
  institution_id uuid references institutions(id) on delete set null, -- set only when role = 'institution'
  phone text,
  mfa_enabled boolean default false,
  status text default 'active' check (status in ('active', 'invited', 'deactivated')),
  created_at timestamptz default now()
);

-- 5. Banks
create table if not exists banks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ifsc_code text,
  branch text,
  created_at timestamptz default now()
);

-- 6. FDR Instrument Status Enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'fdr_status') then
    create type fdr_status as enum (
      'submitted',
      'under_verification',
      'active',
      'renewed',
      'release_requested',
      'released',
      'refund_confirmed',
      'rejected'
    );
  end if;
end$$;

-- 7. FDR Instruments
create table if not exists fdr_instruments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references institutions(id) on delete restrict not null,
  bank_id uuid references banks(id) on delete restrict not null,
  fdr_number text not null,
  amount numeric(14,2) not null check (amount > 0),
  issue_date date not null,
  maturity_date date not null check (maturity_date >= issue_date),
  status fdr_status default 'submitted' not null,
  parent_instrument_id uuid references fdr_instruments(id) on delete set null, -- links renewals
  flagged boolean default false,                                              -- AI/rule discrepancy flag
  flag_severity text default 'CLEAN' check (flag_severity in ('CLEAN', 'LOW_RISK', 'MEDIUM_RISK', 'HIGH_RISK')),
  discrepancy_notes text,
  submitted_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. Documents
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid references fdr_instruments(id) on delete cascade not null,
  file_name text not null,
  file_path text not null,              -- Supabase Storage path e.g. institution_id/instrument_id/file.pdf
  file_size int,
  mime_type text,
  ocr_extracted jsonb default '{}'::jsonb,
  uploaded_by uuid references profiles(id) on delete set null,
  version int default 1,
  created_at timestamptz default now()
);

-- 9. Verification Records
do $$
begin
  if not exists (select 1 from pg_type where typname = 'verification_source') then
    create type verification_source as enum ('institution', 'officer', 'bank_proof');
  end if;
end$$;

create table if not exists verification_records (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid references fdr_instruments(id) on delete cascade not null,
  source verification_source not null,
  verified_fields jsonb not null default '{}'::jsonb,
  notes text,
  verified_by uuid references profiles(id) on delete set null,
  verified_at timestamptz default now()
);

-- 10. Release Requests
do $$
begin
  if not exists (select 1 from pg_type where typname = 'release_status') then
    create type release_status as enum ('pending', 'approved', 'rejected', 'refund_confirmed');
  end if;
end$$;

create table if not exists release_requests (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid references fdr_instruments(id) on delete cascade not null,
  requested_by uuid references profiles(id) on delete set null,
  reason text not null,
  status release_status default 'pending' not null,
  decided_by uuid references profiles(id) on delete set null,
  decision_reason text,
  certificate_path text,                -- signed release certificate PDF
  certificate_hash text,                -- sha256 hash of the generated certificate
  certificate_signature text,           -- cryptographic signature
  bank_proof_path text,                 -- institution-uploaded proof of encashment
  bank_proof_notes text,
  created_at timestamptz default now(),
  decided_at timestamptz
);

-- 11. Audit Logs (Tamper-evident, hash-chained, append-only)
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,            -- e.g. 'fdr_instrument', 'verification_record', 'release_request'
  entity_id uuid not null,
  action text not null,                 -- e.g. 'CREATE', 'VERIFY', 'RENEW', 'APPROVE_RELEASE', 'CONFIRM_REFUND'
  actor_id uuid references profiles(id) on delete set null,
  actor_role text,
  actor_email text,
  before jsonb,
  after jsonb,
  prev_hash text,                       -- hash of previous entry in chain
  entry_hash text not null,             -- sha256(prev_hash + JSON.stringify(after) + action + entity_id)
  created_at timestamptz default now()
);

-- 12. Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  role_target text,                     -- optional broadcast to roles e.g. 'regional_finance_officer'
  region_id uuid references regions(id) on delete set null,
  type text not null,                   -- e.g. 'MATURITY_REMINDER_30D', 'DISCREPANCY_ALERT', 'RELEASE_DECIDED'
  title text not null,
  message text not null,
  payload jsonb default '{}'::jsonb,
  status text default 'unread' check (status in ('unread', 'read', 'sent', 'pending')),
  scheduled_for timestamptz,
  created_at timestamptz default now()
);

-- Performance Indexes
create index if not exists idx_fdr_institution on fdr_instruments(institution_id);
create index if not exists idx_fdr_status on fdr_instruments(status);
create index if not exists idx_fdr_maturity on fdr_instruments(maturity_date);
create index if not exists idx_fdr_flagged on fdr_instruments(flagged);
create index if not exists idx_documents_instrument on documents(instrument_id);
create index if not exists idx_verification_instrument on verification_records(instrument_id);
create index if not exists idx_release_instrument on release_requests(instrument_id);
create index if not exists idx_audit_entity on audit_logs(entity_type, entity_id);
create index if not exists idx_audit_created on audit_logs(created_at);
create index if not exists idx_notifications_user on notifications(user_id, status);
