-- ==============================================================================
-- AICTE Security Deposit / FDR Management Portal - Storage Bucket & Policies
-- Migration: 0003_storage_policies.sql
-- ==============================================================================

-- 1. Create storage bucket for FDR documents
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fdr-documents',
  'fdr-documents',
  false,
  52428800, -- 50 MB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 2. Storage Objects RLS Policies
-- Institution upload policy: only to their own institution_id folder
drop policy if exists "Institutions can upload to own directory" on storage.objects;
create policy "Institutions can upload to own directory"
on storage.objects for insert
with check (
  bucket_id = 'fdr-documents'
  and (storage.foldername(name))[1] = (select institution_id::text from profiles where id = auth.uid())
);

-- Institution read policy: only their own files
drop policy if exists "Institutions can view own documents" on storage.objects;
create policy "Institutions can view own documents"
on storage.objects for select
using (
  bucket_id = 'fdr-documents'
  and (
    (select role from profiles where id = auth.uid()) = 'institution'
    and (storage.foldername(name))[1] = (select institution_id::text from profiles where id = auth.uid())
  )
);

-- Regional Officers read policy: view files belonging to institutions in their region
drop policy if exists "Officers can view regional documents" on storage.objects;
create policy "Officers can view regional documents"
on storage.objects for select
using (
  bucket_id = 'fdr-documents'
  and (
    (select role from profiles where id = auth.uid()) in ('regional_verification_officer', 'regional_finance_officer', 'regulation_bureau_head')
    and (storage.foldername(name))[1] in (
      select id::text from institutions
      where region_id = (select region_id from profiles where id = auth.uid())
    )
  )
);

-- Central Compliance & Super Admin read policy: view all documents
drop policy if exists "Central officers can view all documents" on storage.objects;
create policy "Central officers can view all documents"
on storage.objects for select
using (
  bucket_id = 'fdr-documents'
  and (select role from profiles where id = auth.uid()) in ('central_compliance_officer', 'super_admin')
);
