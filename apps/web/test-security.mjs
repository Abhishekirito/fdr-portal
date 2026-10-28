/**
 * Automated Security & Separation of Duties Acceptance Test
 * Tests RBAC guards and SHA-256 Tamper-Evident Hash Chain
 */

import { assertOfficerCanVerify, assertOfficerCanApproveRelease } from './lib/auth/rbac.ts';
import { generateEntryHash, verifyAuditChainIntegrity } from './lib/audit.ts';

console.log('====================================================');
console.log('AICTE FDR Portal - Security & Compliance Test Suite');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${message}`);
    process.exitCode = 1;
  }
}

async function runTests() {
  // Test 1: Super Admin blocked from Verification
  const superAdminProfile = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'superadmin@aicte.gov.in',
    full_name: 'Dr. Ramesh Kumar',
    role: 'super_admin',
    mfa_enabled: true,
    status: 'active',
  };

  let verifyBlocked = false;
  try {
    assertOfficerCanVerify(superAdminProfile);
  } catch (err) {
    if (err.message.includes('403 Forbidden')) {
      verifyBlocked = true;
    }
  }
  assert(verifyBlocked, 'Test 1: Super Admin is strictly barred from verifying FDRs (Separation of Duties).');

  // Test 2: Super Admin blocked from Approving Release
  let releaseBlocked = false;
  try {
    assertOfficerCanApproveRelease(superAdminProfile);
  } catch (err) {
    if (err.message.includes('403 Forbidden')) {
      releaseBlocked = true;
    }
  }
  assert(releaseBlocked, 'Test 2: Super Admin is strictly barred from approving release requests (Separation of Duties).');

  // Test 3: Regional Verification Officer allowed to verify
  const officerProfile = {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'rvo.mumbai@aicte.gov.in',
    full_name: 'Rajesh Patil',
    role: 'regional_verification_officer',
    mfa_enabled: true,
    status: 'active',
  };

  let officerAllowed = false;
  try {
    assertOfficerCanVerify(officerProfile);
    officerAllowed = true;
  } catch (err) {
    officerAllowed = false;
  }
  assert(officerAllowed, 'Test 3: Authorized Regional Verification Officer is permitted to verify.');

  // Test 4: Cryptographic SHA-256 Tamper-Evident Audit Chain Integrity
  const genesisHash = 'GENESIS';
  const entityId = 'fdr-test-100';

  const entry1Hash = await generateEntryHash(genesisHash, { amount: 2500000, status: 'submitted' }, 'CREATE', entityId);
  const entry2Hash = await generateEntryHash(entry1Hash, { amount: 2500000, status: 'active' }, 'VERIFY', entityId);

  const validChain = [
    {
      id: 'log-1',
      entity_type: 'fdr_instrument',
      entity_id: entityId,
      action: 'CREATE',
      actor_email: 'inst@test.ac.in',
      prev_hash: genesisHash,
      entry_hash: entry1Hash,
      after: { amount: 2500000, status: 'submitted' },
      created_at: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'log-2',
      entity_type: 'fdr_instrument',
      entity_id: entityId,
      action: 'VERIFY',
      actor_email: 'officer@aicte.gov.in',
      prev_hash: entry1Hash,
      entry_hash: entry2Hash,
      after: { amount: 2500000, status: 'active' },
      created_at: new Date('2026-01-02').toISOString(),
    },
  ];

  const verifyClean = await verifyAuditChainIntegrity(validChain);
  assert(verifyClean.isValid === true, 'Test 4: Intact SHA-256 audit chain successfully verified with 0 errors.');

  // Test 5: Detect Retroactive Database Tampering
  const tamperedChain = JSON.parse(JSON.stringify(validChain));
  // Malicious attacker altered the historical amount in the database from 25,00,000 to 50,00,000!
  tamperedChain[0].after.amount = 5000000;

  const verifyTampered = await verifyAuditChainIntegrity(tamperedChain);
  assert(
    verifyTampered.isValid === false && verifyTampered.brokenIndex === 0,
    'Test 5: Retroactive database alteration was immediately detected and flagged by SHA-256 chain recomputation.'
  );

  console.log(`\nResults: ${passedTests}/${totalTests} tests passed successfully.`);
}

runTests().catch(console.error);
