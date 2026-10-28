-- ==============================================================================
-- AICTE Security Deposit / FDR Management Portal - Comprehensive Seed Data
-- Seed Script: seed.sql
-- ==============================================================================

-- 1. Insert Regions
insert into regions (id, name, code) values
  ('11111111-1111-1111-1111-111111111111', 'Western Regional Office (Mumbai)', 'WRO'),
  ('22222222-2222-2222-2222-222222222222', 'Northern Regional Office (Delhi)', 'NRO'),
  ('33333333-3333-3333-3333-333333333333', 'Southern Regional Office (Bangalore)', 'SRO'),
  ('44444444-4444-4444-4444-444444444444', 'Eastern Regional Office (Kolkata)', 'ERO')
on conflict (id) do nothing;

-- 2. Insert Banks
insert into banks (id, name, ifsc_code, branch) values
  ('b1111111-1111-1111-1111-111111111111', 'State Bank of India', 'SBIN0000300', 'Nariman Point, Mumbai'),
  ('b2222222-2222-2222-2222-222222222222', 'Punjab National Bank', 'PUNB0014500', 'Parliament Street, New Delhi'),
  ('b3333333-3333-3333-3333-333333333333', 'Canara Bank', 'CNRB0000101', 'Town Hall, Bangalore'),
  ('b4444444-4444-4444-4444-444444444444', 'HDFC Bank', 'HDFC0000060', 'Bandra Kurla Complex, Mumbai'),
  ('b5555555-5555-5555-5555-555555555555', 'ICICI Bank', 'ICIC0000004', 'Connaught Place, New Delhi'),
  ('b6666666-6666-6666-6666-666666666666', 'Bank of Baroda', 'BARB0KOLKAT', 'Park Street, Kolkata')
on conflict (id) do nothing;

-- 3. Insert Institutions
insert into institutions (id, name, aicte_code, region_id, contact_email, contact_phone, address, trust_score, status) values
  ('aaaa1111-1111-1111-1111-111111111111', 'Veermata Jijabai Technological Institute (VJTI)', '1-10023481', '11111111-1111-1111-1111-111111111111', 'accounts@vjti.ac.in', '+91 22 24198100', 'Matunga, Mumbai, Maharashtra 400019', 98, 'active'),
  ('aaaa2222-2222-2222-2222-222222222222', 'College of Engineering Pune (COEP Tech Univ)', '1-10024952', '11111111-1111-1111-1111-111111111111', 'fdr@coep.ac.in', '+91 20 25507000', 'Shivajinagar, Pune, Maharashtra 411005', 95, 'active'),
  ('aaaa3333-3333-3333-3333-333333333333', 'Delhi Technological University (DTU)', '1-20038491', '22222222-2222-2222-2222-222222222222', 'accounts@dtu.ac.in', '+91 11 27871018', 'Shahbad Daulatpur, Bawana Road, Delhi 110042', 96, 'active'),
  ('aaaa4444-4444-4444-4444-444444444444', 'Netaji Subhas University of Technology (NSUT)', '1-20049281', '22222222-2222-2222-2222-222222222222', 'finance@nsut.ac.in', '+91 11 25000268', 'Dwarka Sector 3, New Delhi 110078', 92, 'active'),
  ('aaaa5555-5555-5555-5555-555555555555', 'R.V. College of Engineering (RVCE)', '1-30018471', '33333333-3333-3333-3333-333333333333', 'admin@rvce.edu.in', '+91 80 68188100', 'Mysore Road, Bangalore, Karnataka 560059', 97, 'active'),
  ('aaaa6666-6666-6666-6666-666666666666', 'BMS College of Engineering (BMSCE)', '1-30029381', '33333333-3333-3333-3333-333333333333', 'accounts@bmsce.ac.in', '+91 80 26622130', 'Bull Temple Road, Bangalore, Karnataka 560019', 94, 'active'),
  ('aaaa7777-7777-7777-7777-777777777777', 'Jadavpur University Faculty of Engg', '1-40019482', '44444444-4444-4444-4444-444444444444', 'fo@jadavpuruniversity.in', '+91 33 24146666', '188 Raja S.C. Mallick Road, Kolkata 700032', 95, 'active'),
  ('aaaa8888-8888-8888-8888-888888888888', 'Heritage Institute of Technology (HIT)', '1-40028471', '44444444-4444-4444-4444-444444444444', 'admin@heritageit.edu', '+91 33 66270600', 'Chowbaga Road, Anandapur, Kolkata 700107', 82, 'active'),
  ('aaaa9999-9999-9999-9999-999999999999', 'Pimpri Chinchwad College of Engineering (PCCOE)', '1-10038472', '11111111-1111-1111-1111-111111111111', 'office@pccoepune.org', '+91 20 27653168', 'Sector 26, Nigdi, Pune, Maharashtra 411044', 88, 'active'),
  ('aaaa0000-0000-0000-0000-000000000000', 'Apex National Polytechnic Institute', '1-59928371', '22222222-2222-2222-2222-222222222222', 'deposit@apexpoly.org', '+91 11 29847192', 'Industrial Area, Okhla, New Delhi 110020', 64, 'active')
on conflict (id) do nothing;

-- 4. Insert Seed Profiles
insert into profiles (id, email, full_name, role, region_id, institution_id, phone, mfa_enabled, status) values
  ('00000000-0000-0000-0000-000000000001', 'superadmin@aicte.gov.in', 'Dr. Ramesh Kumar (Super Admin)', 'super_admin', null, null, '+91 9811001100', true, 'active'),
  ('00000000-0000-0000-0000-000000000002', 'compliance@aicte.gov.in', 'Smt. Preeti Deshmukh (Central Compliance)', 'central_compliance_officer', null, null, '+91 9811002200', true, 'active'),
  ('00000000-0000-0000-0000-000000000003', 'bureau.head@aicte.gov.in', 'Prof. Anil Sahasrabudhe (Bureau Head)', 'regulation_bureau_head', '11111111-1111-1111-1111-111111111111', null, '+91 9811003300', true, 'active'),
  ('00000000-0000-0000-0000-000000000004', 'rvo.mumbai@aicte.gov.in', 'Shri Rajesh Patil (Verification Officer)', 'regional_verification_officer', '11111111-1111-1111-1111-111111111111', null, '+91 9820004400', true, 'active'),
  ('00000000-0000-0000-0000-000000000005', 'rfo.mumbai@aicte.gov.in', 'Smt. Kavita Sharma (Finance Officer)', 'regional_finance_officer', '11111111-1111-1111-1111-111111111111', null, '+91 9820005500', true, 'active'),
  ('00000000-0000-0000-0000-000000000006', 'rvo.delhi@aicte.gov.in', 'Shri Vikram Malhotra (Verification Officer)', 'regional_verification_officer', '22222222-2222-2222-2222-222222222222', null, '+91 9810006600', true, 'active'),
  ('00000000-0000-0000-0000-000000000007', 'rfo.delhi@aicte.gov.in', 'Shri Alok Verma (Finance Officer)', 'regional_finance_officer', '22222222-2222-2222-2222-222222222222', null, '+91 9810007700', true, 'active'),
  ('00000000-0000-0000-0000-000000000010', 'admin@vjti.ac.in', 'Dr. Sachin Joshi (VJTI Registrar)', 'institution', '11111111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', '+91 9820011111', false, 'active'),
  ('00000000-0000-0000-0000-000000000011', 'fdr@coep.ac.in', 'Prof. Mukul Sutaone (COEP Accounts)', 'institution', '11111111-1111-1111-1111-111111111111', 'aaaa2222-2222-2222-2222-222222222222', '+91 9820022222', false, 'active'),
  ('00000000-0000-0000-0000-000000000012', 'accounts@dtu.ac.in', 'Shri Manoj Kumar (DTU Finance)', 'institution', '22222222-2222-2222-2222-222222222222', 'aaaa3333-3333-3333-3333-333333333333', '+91 9810033333', false, 'active'),
  ('00000000-0000-0000-0000-000000000013', 'admin@rvce.edu.in', 'Dr. K.N. Subramanya (RVCE Principal)', 'institution', '33333333-3333-3333-3333-333333333333', 'aaaa5555-5555-5555-5555-555555555555', '+91 9845044444', false, 'active')
on conflict (id) do nothing;

-- 5. Insert FDR Instruments (Representing full lifecycle spectrum)
insert into fdr_instruments (id, institution_id, bank_id, fdr_number, amount, issue_date, maturity_date, status, parent_instrument_id, flagged, flag_severity, discrepancy_notes, submitted_by) values
  -- Active FDRs
  ('f0000000-0000-0000-0000-000000000001', 'aaaa1111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'FDR-SBI-2024-81920', 3500000.00, '2024-01-15', '2027-01-15', 'active', null, false, 'CLEAN', null, '00000000-0000-0000-0000-000000000010'),
  ('f0000000-0000-0000-0000-000000000002', 'aaaa2222-2222-2222-2222-222222222222', 'b4444444-4444-4444-4444-444444444444', 'FDR-HDFC-2023-92811', 2500000.00, '2023-06-10', '2026-06-10', 'active', null, false, 'CLEAN', null, '00000000-0000-0000-0000-000000000011'),
  
  -- Expiring Soon FDR (within 20 days - triggers scheduled reminder demo)
  ('f0000000-0000-0000-0000-000000000003', 'aaaa1111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'FDR-SBI-2021-39481', 1500000.00, '2021-11-15', (current_date + interval '20 days'), 'active', null, false, 'CLEAN', null, '00000000-0000-0000-0000-000000000010'),
  ('f0000000-0000-0000-0000-000000000004', 'aaaa3333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', 'FDR-PNB-2021-99281', 2000000.00, '2021-11-05', (current_date + interval '8 days'), 'active', null, false, 'CLEAN', null, '00000000-0000-0000-0000-000000000012'),

  -- Pending Verification (Freshly submitted by Institution)
  ('f0000000-0000-0000-0000-000000000005', 'aaaa1111-1111-1111-1111-111111111111', 'b4444444-4444-4444-4444-444444444444', 'FDR-HDFC-2026-11223', 5000000.00, '2026-02-01', '2029-02-01', 'submitted', null, false, 'CLEAN', null, '00000000-0000-0000-0000-000000000010'),

  -- Flagged with Discrepancy (Wrong amount: Institution claimed ₹25,00,000 but OCR extracted ₹20,00,000)
  ('f0000000-0000-0000-0000-000000000006', 'aaaa0000-0000-0000-0000-000000000000', 'b2222222-2222-2222-2222-222222222222', 'FDR-PNB-2026-DISC1', 2500000.00, '2026-01-10', '2029-01-10', 'under_verification', null, true, 'HIGH_RISK', 'Discrepancy: Declared principal ₹25,00,000.00 mismatches scanned document amount ₹20,00,000.00.', '00000000-0000-0000-0000-000000000001'),

  -- Renewal Linked Instruments: Original (Renewed) and Child (Active)
  ('f0000000-0000-0000-0000-000000000007', 'aaaa5555-5555-5555-5555-555555555555', 'b3333333-3333-3333-3333-333333333333', 'FDR-CAN-2020-00192', 1800000.00, '2020-08-01', '2023-08-01', 'renewed', null, false, 'CLEAN', null, '00000000-0000-0000-0000-000000000013'),
  ('f0000000-0000-0000-0000-000000000008', 'aaaa5555-5555-5555-5555-555555555555', 'b3333333-3333-3333-3333-333333333333', 'FDR-CAN-2023-00847', 1800000.00, '2023-08-01', '2026-08-01', 'active', 'f0000000-0000-0000-0000-000000000007', false, 'CLEAN', null, '00000000-0000-0000-0000-000000000013'),

  -- Release Workflow States
  -- Pending Release Request
  ('f0000000-0000-0000-0000-000000000009', 'aaaa2222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'FDR-SBI-2022-RELEASE', 3000000.00, '2022-03-01', '2025-03-01', 'release_requested', null, false, 'CLEAN', null, '00000000-0000-0000-0000-000000000011'),
  -- Approved & Released (Certificate issued)
  ('f0000000-0000-0000-0000-000000000010', 'aaaa7777-7777-7777-7777-777777777777', 'b6666666-6666-6666-6666-666666666666', 'FDR-BOB-2021-REL77', 1200000.00, '2021-02-14', '2024-02-14', 'released', null, false, 'CLEAN', null, '00000000-0000-0000-0000-000000000002'),
  -- Refund Confirmed (Closed Lifecycle with Bank encashment proof)
  ('f0000000-0000-0000-0000-000000000011', 'aaaa4444-4444-4444-4444-444444444444', 'b5555555-5555-5555-5555-555555555555', 'FDR-ICICI-2020-REF99', 1500000.00, '2020-05-10', '2023-05-10', 'refund_confirmed', null, false, 'CLEAN', null, '00000000-0000-0000-0000-000000000002')
on conflict (id) do nothing;

-- 6. Insert Documents
insert into documents (id, instrument_id, file_name, file_path, file_size, mime_type, ocr_extracted, uploaded_by, version) values
  ('d0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'vjti_sbi_fdr_35lakh.pdf', 'aaaa1111-1111-1111-1111-111111111111/f0000000-0000-0000-0000-000000000001/vjti_sbi_fdr_35lakh.pdf', 1048576, 'application/pdf', '{"bank_name": "State Bank of India", "fdr_number": "FDR-SBI-2024-81920", "amount": 3500000.00, "issue_date": "2024-01-15", "maturity_date": "2027-01-15"}'::jsonb, '00000000-0000-0000-0000-000000000010', 1),
  ('d0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000006', 'apex_pnb_scan_mismatch.pdf', 'aaaa0000-0000-0000-0000-000000000000/f0000000-0000-0000-0000-000000000006/apex_pnb_scan_mismatch.pdf', 524288, 'application/pdf', '{"bank_name": "Punjab National Bank", "fdr_number": "FDR-PNB-2026-DISC1", "amount": 2000000.00, "issue_date": "2026-01-10", "maturity_date": "2029-01-10"}'::jsonb, '00000000-0000-0000-0000-000000000001', 1)
on conflict (id) do nothing;

-- 7. Insert Verification Records
insert into verification_records (id, instrument_id, source, verified_fields, notes, verified_by, verified_at) values
  ('00000001-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'officer', '{"bank_verified": true, "amount_verified": true, "maturity_verified": true, "fdr_number_verified": true}'::jsonb, 'Verified with SBI Nariman Point branch confirmation letter dated 20-Jan-2024.', '00000000-0000-0000-0000-000000000004', now() - interval '60 days')
on conflict (id) do nothing;

-- 8. Insert Release Requests
insert into release_requests (id, instrument_id, requested_by, reason, status, decided_by, decision_reason, certificate_path, certificate_hash, certificate_signature, bank_proof_path, decided_at) values
  ('00000002-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000011', 'Closure of outdated PG Diploma program and completion of 10-year statutory lock-in period.', 'pending', null, null, null, null, null, null, null),
  ('00000002-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 'Autonomous university status conversion and fulfillment of AICTE compliance norms.', 'approved', '00000000-0000-0000-0000-000000000005', 'Approved as per AICTE Regulation Bureau circular 2024/SEC-09. All student obligations settled.', '/certificates/NOC-2024-REL77.pdf', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'DIGITAL_SIG_AICTE_REG_BUREAU_RSA2048_20240220', null, now() - interval '30 days'),
  ('00000002-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002', 'Course closure compliance refund.', 'refund_confirmed', '00000000-0000-0000-0000-000000000007', 'Bank encashment certificate verified against ICICI CP branch statement.', '/certificates/NOC-2023-REF99.pdf', 'd41d8cd98f00b204e9800998ecf8427e', 'DIGITAL_SIG_AICTE_REG_BUREAU_RSA2048_20230615', '/proofs/icici_encashment_closure_cert.pdf', now() - interval '90 days')
on conflict (id) do nothing;

-- 9. Insert Tamper-Evident Chained Audit Logs
insert into audit_logs (id, entity_type, entity_id, action, actor_id, actor_role, actor_email, before, after, prev_hash, entry_hash, created_at) values
  ('a0000000-0000-0000-0000-000000000001', 'fdr_instrument', 'f0000000-0000-0000-0000-000000000001', 'CREATE', '00000000-0000-0000-0000-000000000010', 'institution', 'admin@vjti.ac.in', null, '{"fdr_number": "FDR-SBI-2024-81920", "amount": 3500000, "status": "submitted"}'::jsonb, 'GENESIS', '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', now() - interval '70 days'),
  ('a0000000-0000-0000-0000-000000000002', 'fdr_instrument', 'f0000000-0000-0000-0000-000000000001', 'VERIFY', '00000000-0000-0000-0000-000000000004', 'regional_verification_officer', 'rvo.mumbai@aicte.gov.in', '{"status": "submitted"}'::jsonb, '{"status": "active", "verified_by": "Rajesh Patil"}'::jsonb, '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', now() - interval '60 days'),
  ('a0000000-0000-0000-0000-000000000003', 'release_request', 'f0000000-0000-0000-0000-000000000010', 'APPROVE_RELEASE', '00000000-0000-0000-0000-000000000005', 'regional_finance_officer', 'rfo.mumbai@aicte.gov.in', '{"status": "pending"}'::jsonb, '{"status": "approved", "certificate": "NOC-2024-REL77.pdf"}'::jsonb, '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a', now() - interval '30 days')
on conflict (id) do nothing;

-- 10. Insert Notifications
insert into notifications (id, user_id, region_id, type, title, message, payload, status) values
  ('00000003-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'MATURITY_REMINDER', 'Upcoming FDR Maturity (20 Days)', 'Instrument #FDR-SBI-2021-39481 matures soon. Initiate renewal or release.', '{"instrument_id": "f0000000-0000-0000-0000-000000000003", "days_left": 20}'::jsonb, 'unread'),
  ('00000003-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'DISCREPANCY_ALERT', 'High Risk Discrepancy Flagged', 'Instrument #FDR-PNB-2026-DISC1 submitted by Apex Polytechnic has a 5,00,000 INR discrepancy.', '{"instrument_id": "f0000000-0000-0000-0000-000000000006", "severity": "HIGH_RISK"}'::jsonb, 'unread')
on conflict (id) do nothing;
