-- ==============================================================================
-- AICTE Security Deposit / FDR Management Portal - Row Level Security Policies
-- Migration: 0002_rls_policies.sql
-- ==============================================================================

-- 1. Enable RLS on all tables
alter table institutions enable row level security;
alter table profiles enable row level security;
alter table fdr_instruments enable row level security;
alter table documents enable row level security;
alter table verification_records enable row level security;
alter table release_requests enable row level security;
alter table audit_logs enable row level security;
alter table notifications enable row level security;
alter table banks enable row level security;
alter table regions enable row level security;

-- 2. Helper Functions
create or replace function current_profile()
returns profiles as $$
  select * from profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function current_user_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function current_user_region()
returns uuid as $$
  select region_id from profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function current_user_institution()
returns uuid as $$
  select institution_id from profiles where id = auth.uid();
$$ language sql stable security definer;

-- 3. Regions & Banks: Read accessible to authenticated users
drop policy if exists regions_read_authenticated on regions;
create policy regions_read_authenticated on regions
  for select using (auth.role() = 'authenticated');

drop policy if exists banks_read_authenticated on banks;
create policy banks_read_authenticated on banks
  for select using (auth.role() = 'authenticated');

-- 4. Profiles RLS
drop policy if exists profiles_read_self_and_officers on profiles;
create policy profiles_read_self_and_officers on profiles
  for select using (
    id = auth.uid()
    or current_user_role() in ('regional_verification_officer', 'regional_finance_officer', 'regulation_bureau_head', 'central_compliance_officer', 'super_admin')
  );

drop policy if exists profiles_superadmin_manage on profiles;
create policy profiles_superadmin_manage on profiles
  for all using (
    current_user_role() = 'super_admin'
  );

-- 5. Institutions RLS
drop policy if exists institutions_select_policy on institutions;
create policy institutions_select_policy on institutions
  for select using (
    -- Institution user sees only their own institution
    (current_user_role() = 'institution' and id = current_user_institution())
    -- Regional officers see institutions in their region
    or (current_user_role() in ('regional_verification_officer', 'regional_finance_officer', 'regulation_bureau_head') and region_id = current_user_region())
    -- Central officers and super admin see all
    or (current_user_role() in ('central_compliance_officer', 'super_admin'))
  );

drop policy if exists institutions_superadmin_manage on institutions;
create policy institutions_superadmin_manage on institutions
  for all using (
    current_user_role() = 'super_admin'
  );

-- 6. FDR Instruments RLS
drop policy if exists fdr_select_policy on fdr_instruments;
create policy fdr_select_policy on fdr_instruments
  for select using (
    -- Institution sees only own FDRs
    (current_user_role() = 'institution' and institution_id = current_user_institution())
    -- Regional officers see FDRs from institutions in their assigned region
    or (
      current_user_role() in ('regional_verification_officer', 'regional_finance_officer', 'regulation_bureau_head')
      and institution_id in (select id from institutions where region_id = current_user_region())
    )
    -- Central compliance and super admin see all
    or (current_user_role() in ('central_compliance_officer', 'super_admin'))
  );

drop policy if exists fdr_insert_institution on fdr_instruments;
create policy fdr_insert_institution on fdr_instruments
  for insert with check (
    current_user_role() = 'institution'
    and institution_id = current_user_institution()
  );

drop policy if exists fdr_update_officers on fdr_instruments;
create policy fdr_update_officers on fdr_instruments
  for update using (
    -- Super Admin is explicitly barred from verifying / updating FDR lifecycle
    current_user_role() != 'super_admin'
    and (
      (current_user_role() in ('regional_verification_officer', 'regional_finance_officer', 'regulation_bureau_head')
       and institution_id in (select id from institutions where region_id = current_user_region()))
      or (current_user_role() = 'institution' and institution_id = current_user_institution() and status in ('submitted', 'release_requested'))
    )
  );

-- 7. Documents RLS
drop policy if exists documents_select_policy on documents;
create policy documents_select_policy on documents
  for select using (
    instrument_id in (
      select id from fdr_instruments
      where (current_user_role() = 'institution' and institution_id = current_user_institution())
      or (current_user_role() in ('regional_verification_officer', 'regional_finance_officer', 'regulation_bureau_head')
          and institution_id in (select id from institutions where region_id = current_user_region()))
      or (current_user_role() in ('central_compliance_officer', 'super_admin'))
    )
  );

drop policy if exists documents_insert_policy on documents;
create policy documents_insert_policy on documents
  for insert with check (
    instrument_id in (
      select id from fdr_instruments
      where (current_user_role() = 'institution' and institution_id = current_user_institution())
      or (current_user_role() in ('regional_verification_officer', 'regional_finance_officer'))
    )
  );

-- 8. Verification Records RLS
drop policy if exists verification_select_policy on verification_records;
create policy verification_select_policy on verification_records
  for select using (
    instrument_id in (
      select id from fdr_instruments
      where (current_user_role() = 'institution' and institution_id = current_user_institution())
      or (current_user_role() in ('regional_verification_officer', 'regional_finance_officer', 'regulation_bureau_head')
          and institution_id in (select id from institutions where region_id = current_user_region()))
      or (current_user_role() in ('central_compliance_officer', 'super_admin'))
    )
  );

-- Super admin is explicitly forbidden from inserting verification records
drop policy if exists verification_insert_officer on verification_records;
create policy verification_insert_officer on verification_records
  for insert with check (
    current_user_role() = 'regional_verification_officer'
    and instrument_id in (
      select id from fdr_instruments
      where institution_id in (select id from institutions where region_id = current_user_region())
    )
  );

-- 9. Release Requests RLS
drop policy if exists release_select_policy on release_requests;
create policy release_select_policy on release_requests
  for select using (
    instrument_id in (
      select id from fdr_instruments
      where (current_user_role() = 'institution' and institution_id = current_user_institution())
      or (current_user_role() in ('regional_verification_officer', 'regional_finance_officer', 'regulation_bureau_head')
          and institution_id in (select id from institutions where region_id = current_user_region()))
      or (current_user_role() in ('central_compliance_officer', 'super_admin'))
    )
  );

drop policy if exists release_insert_institution on release_requests;
create policy release_insert_institution on release_requests
  for insert with check (
    current_user_role() = 'institution'
    and instrument_id in (select id from fdr_instruments where institution_id = current_user_institution())
  );

-- Finance officer can update release decision (Super Admin forbidden)
drop policy if exists release_update_finance on release_requests;
create policy release_update_finance on release_requests
  for update using (
    current_user_role() in ('regional_finance_officer', 'regulation_bureau_head')
    and instrument_id in (
      select id from fdr_instruments
      where institution_id in (select id from institutions where region_id = current_user_region())
    )
  );

-- 10. Audit Logs RLS (Append-only, strictly immutable)
drop policy if exists audit_select_officers on audit_logs;
create policy audit_select_officers on audit_logs
  for select using (
    current_user_role() in ('central_compliance_officer', 'super_admin', 'regulation_bureau_head')
    or (
      current_user_role() in ('regional_verification_officer', 'regional_finance_officer')
    )
  );

drop policy if exists audit_insert_system on audit_logs;
create policy audit_insert_system on audit_logs
  for insert with check (auth.role() = 'authenticated');

-- Disallow UPDATE and DELETE on audit_logs to preserve tamper-evidence
-- (No update/delete policies created = denied by default)

-- 11. Notifications RLS
drop policy if exists notifications_user_policy on notifications;
create policy notifications_user_policy on notifications
  for select using (
    user_id = auth.uid()
    or (region_id = current_user_region() and role_target = current_user_role()::text)
    or current_user_role() in ('super_admin', 'central_compliance_officer')
  );

drop policy if exists notifications_update_status on notifications;
create policy notifications_update_status on notifications
  for update using (user_id = auth.uid());
