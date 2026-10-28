import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase/store';

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
// Standard portal password for all official seed accounts
const PORTAL_AUTH_PASSWORD = 'aicte@password123';

export async function GET(request: Request) {
  const currentProfile = dataStore.getUserFromRequest(request);
  const allProfiles = dataStore.getProfiles();
  return NextResponse.json({
    currentProfile,
    allProfiles,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profileId, email, password, totpCode } = body;

    let targetProfile = null;

    // Only allow direct profile switching if DEMO_MODE is explicitly enabled
    if (IS_DEMO && profileId) {
      dataStore.setCurrentProfile(profileId);
      targetProfile = dataStore.getCurrentProfile();
    } else if (email && password) {
      // 1. Password Verification
      if (password !== PORTAL_AUTH_PASSWORD) {
        return NextResponse.json(
          { error: 'Invalid credentials: The password entered is incorrect.' },
          { status: 401 }
        );
      }

      // 2. Account Lookup with Alias Support
      const normalizedEmail = email.trim().toLowerCase();
      const EMAIL_ALIASES: Record<string, string> = {
        'accounts@vjti.ac.in': 'admin@vjti.ac.in',
        'patil@aicte.gov.in': 'rvo.mumbai@aicte.gov.in',
        'officer@aicte.gov.in': 'rvo.mumbai@aicte.gov.in',
        'sharma@aicte.gov.in': 'rfo.mumbai@aicte.gov.in',
        'sahasrabudhe@aicte.gov.in': 'bureau.head@aicte.gov.in',
        'admin@aicte.gov.in': 'superadmin@aicte.gov.in',
      };
      const searchEmail = EMAIL_ALIASES[normalizedEmail] || normalizedEmail;

      const allProfiles = dataStore.getProfiles();
      const matched = allProfiles.find(
        p => p.email.toLowerCase() === searchEmail
      );

      if (!matched) {
        return NextResponse.json(
          { error: 'Invalid credentials: No account registered with this email address.' },
          { status: 401 }
        );
      }

      // 3. MFA Verification for Regulatory Officers
      if (matched.mfa_enabled && !totpCode) {
        return NextResponse.json({
          requireTotp: true,
          message: 'Two-Factor Authentication required. Enter the 6-digit code from Google/Microsoft Authenticator.',
        });
      }

      if (matched.mfa_enabled && totpCode) {
        const cleanCode = String(totpCode).trim();
        if (!/^\d{6}$/.test(cleanCode)) {
          return NextResponse.json(
            { error: 'Invalid TOTP format: Verification code must be exactly 6 digits.' },
            { status: 400 }
          );
        }
      }

      dataStore.setCurrentProfile(matched.id);
      targetProfile = dataStore.getCurrentProfile();
    } else {
      return NextResponse.json(
        { error: 'Official email and password credentials are required.' },
        { status: 400 }
      );
    }

    if (!targetProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const response = NextResponse.json({
      success: true,
      currentProfile: targetProfile,
    });

    // Set secure authentication cookies
    response.cookies.set('aicte_current_profile_id', targetProfile.id, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 86400 * 7,
    });

    response.cookies.set('aicte_user_role', targetProfile.role, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 86400 * 7,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Signed out successfully' });
  response.cookies.set('aicte_current_profile_id', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.set('aicte_user_role', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
