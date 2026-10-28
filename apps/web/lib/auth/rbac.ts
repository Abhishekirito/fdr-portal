import { Profile, UserRole } from '../supabase/types';

export const ROLE_ROUTE_PREFIXES: Record<UserRole, string> = {
  institution: '/institution',
  regional_verification_officer: '/officer',
  regional_finance_officer: '/officer',
  regulation_bureau_head: '/officer',
  central_compliance_officer: '/admin',
  super_admin: '/admin',
};

/**
 * Validates whether a profile with a specific role is authorized to view a target path.
 */
export function canAccessPath(role: UserRole, pathname: string): boolean {
  if (pathname.startsWith('/institution')) {
    return role === 'institution';
  }
  if (pathname.startsWith('/officer')) {
    return [
      'regional_verification_officer',
      'regional_finance_officer',
      'regulation_bureau_head',
    ].includes(role);
  }
  if (pathname.startsWith('/admin')) {
    return ['central_compliance_officer', 'super_admin'].includes(role);
  }
  return true;
}

/**
 * CRITICAL SEPARATION OF DUTIES GUARD:
 * Super Admin accounts are explicitly barred from performing verification or release/refund approvals.
 * Prevents abuse of platform-level administrative privileges.
 */
export function assertOfficerCanVerify(user: Profile): void {
  if (user.role === 'super_admin') {
    throw new Error('403 Forbidden: Super Admin accounts are explicitly barred from verifying FDRs. This action requires a Regional Verification Officer.');
  }
  if (user.role !== 'regional_verification_officer' && user.role !== 'regulation_bureau_head') {
    throw new Error('403 Forbidden: Only designated Verification Officers may verify FDR documents.');
  }
}

export function assertOfficerCanApproveRelease(user: Profile): void {
  if (user.role === 'super_admin') {
    throw new Error('403 Forbidden: Super Admin accounts are explicitly barred from approving release or refund requests (Separation of Duties).');
  }
  if (user.role !== 'regional_finance_officer' && user.role !== 'regulation_bureau_head') {
    throw new Error('403 Forbidden: Only designated Finance Officers or Bureau Head may decide release requests.');
  }
}
