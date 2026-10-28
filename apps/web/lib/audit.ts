import { AuditLogEntry } from './supabase/types';

/**
 * Calculates SHA-256 hash of a given string payload using Web Crypto API.
 * Works seamlessly in both Node.js (Edge/App Router) and Browser environments.
 */
export async function calculateSha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates an entry hash for the immutable audit chain:
 * entry_hash = sha256(prev_hash + JSON.stringify(after) + action + entity_id)
 */
export async function generateEntryHash(
  prevHash: string,
  after: Record<string, any> | null,
  action: string,
  entityId: string
): Promise<string> {
  const payload = `${prevHash || 'GENESIS'}:${JSON.stringify(after || {})}:${action}:${entityId}`;
  return calculateSha256(payload);
}

/**
 * Cryptographically verifies the integrity of an audit chain for an entity.
 * Detects any unauthorized retroactive database tampering.
 */
export async function verifyAuditChainIntegrity(entries: AuditLogEntry[]): Promise<{
  isValid: boolean;
  totalVerified: number;
  brokenIndex: number | null;
  brokenEntryId: string | null;
  failureReason: string | null;
}> {
  if (!entries || entries.length === 0) {
    return {
      isValid: true,
      totalVerified: 0,
      brokenIndex: null,
      brokenEntryId: null,
      failureReason: null,
    };
  }

  // Sort chronologically ascending
  const sorted = [...entries].sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeA - timeB;
  });

  let expectedPrevHash = 'GENESIS';

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];

    // Check 1: Does prev_hash link properly?
    if (i === 0) {
      if (entry.prev_hash && entry.prev_hash !== 'GENESIS') {
        // If first entry already links to an older chain, check its entry_hash
        expectedPrevHash = entry.prev_hash;
      }
    } else {
      if (entry.prev_hash !== expectedPrevHash) {
        return {
          isValid: false,
          totalVerified: i,
          brokenIndex: i,
          brokenEntryId: entry.id,
          failureReason: `Broken Hash Linkage at index ${i}: prev_hash '${entry.prev_hash?.slice(0, 10)}...' does not match expected parent hash '${expectedPrevHash.slice(0, 10)}...'.`,
        };
      }
    }

    // Check 2: Recompute entry_hash from data
    const computedHash = await generateEntryHash(
      entry.prev_hash,
      entry.after || null,
      entry.action,
      entry.entity_id
    );

    if (computedHash !== entry.entry_hash) {
      return {
        isValid: false,
        totalVerified: i,
        brokenIndex: i,
        brokenEntryId: entry.id,
        failureReason: `Cryptographic Mismatch at index ${i}: Stored hash '${entry.entry_hash?.slice(0, 10)}...' does not match recomputed SHA-256 '${computedHash.slice(0, 10)}...'. Record contents were modified!`,
      };
    }

    expectedPrevHash = entry.entry_hash;
  }

  return {
    isValid: true,
    totalVerified: sorted.length,
    brokenIndex: null,
    brokenEntryId: null,
    failureReason: null,
  };
}
