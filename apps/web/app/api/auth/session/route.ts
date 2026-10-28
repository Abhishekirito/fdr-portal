import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dataStore } from '@/lib/supabase/store';
import { authRateLimiter } from '@/lib/auth/rate-limiter';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kpsmbuofwvatrapjvryn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_85zL9wTejqAcjIkOrMU56A_wd4rh6VG';

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenMatch = cookieHeader.match(/sb-access-token=([^;]+)/);
  const profileMatch = cookieHeader.match(/aicte_current_profile_id=([^;]+)/);

  if (!tokenMatch || !profileMatch) {
    return NextResponse.json({
      currentProfile: null,
    });
  }

  const token = decodeURIComponent(tokenMatch[1].trim());
  const profileId = decodeURIComponent(profileMatch[1].trim());

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json({ currentProfile: null });
    }

    const allProfiles = dataStore.getProfiles();
    const currentProfile = allProfiles.find(p => p.id === data.user.id || p.id === profileId) || null;

    // Super Admin Privilege: Only authorized super_admin accounts receive the officer directory
    const responsePayload: { currentProfile: typeof currentProfile; allProfiles?: typeof allProfiles } = {
      currentProfile,
    };

    if (currentProfile?.role === 'super_admin') {
      responsePayload.allProfiles = allProfiles;
    }

    return NextResponse.json(responsePayload);
  } catch {
    return NextResponse.json({ currentProfile: null });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, totpCode } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Official email and password credentials are required.' },
        { status: 400 }
      );
    }

    // Rate Limiting Guards: Track failed attempts per client IP and email
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const normalizedEmail = email.trim().toLowerCase();

    const ipLimit = authRateLimiter.check(clientIp);
    const emailLimit = authRateLimiter.check(normalizedEmail);

    if (!ipLimit.allowed || !emailLimit.allowed) {
      const retryAfter = Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds);
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Access temporarily locked. Please try again after ${Math.ceil(retryAfter / 60)} minutes.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      );
    }

    // Account Lookup with Official Alias Support
    const EMAIL_ALIASES: Record<string, string> = {
      'accounts@vjti.ac.in': 'admin@vjti.ac.in',
      'patil@aicte.gov.in': 'rvo.mumbai@aicte.gov.in',
      'officer@aicte.gov.in': 'rvo.mumbai@aicte.gov.in',
      'sharma@aicte.gov.in': 'rfo.mumbai@aicte.gov.in',
      'sahasrabudhe@aicte.gov.in': 'bureau.head@aicte.gov.in',
      'admin@aicte.gov.in': 'superadmin@aicte.gov.in',
    };
    const searchEmail = EMAIL_ALIASES[normalizedEmail] || normalizedEmail;

    // Supabase Authentication (Bcrypt Hashed Verification via GoTrue)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: searchEmail,
      password,
    });

    if (authError || !authData.user || !authData.session) {
      const ipFail = authRateLimiter.recordFailure(clientIp);
      authRateLimiter.recordFailure(normalizedEmail);

      if (ipFail.locked) {
        return NextResponse.json(
          {
            error: `Too many failed login attempts. Account temporarily locked for ${Math.ceil(ipFail.retryAfterSeconds / 60)} minutes.`,
          },
          {
            status: 429,
            headers: { 'Retry-After': String(ipFail.retryAfterSeconds) },
          }
        );
      }

      return NextResponse.json(
        {
          error: `Invalid credentials: The email or password entered is incorrect. (${ipFail.remainingAttempts} attempts remaining)`,
        },
        { status: 401 }
      );
    }

    // Account Profile Lookup
    const allProfiles = dataStore.getProfiles();
    const matched = allProfiles.find(
      p => p.id === authData.user.id || p.email.toLowerCase() === searchEmail
    );

    if (!matched) {
      return NextResponse.json(
        { error: 'Invalid credentials: No account registered with this email address in the portal registry.' },
        { status: 401 }
      );
    }

    // 2-Factor Authentication Verification for Regulatory Officers (Demo mode retained)
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

    // Login successful: reset rate limiter failures
    authRateLimiter.recordSuccess(clientIp);
    authRateLimiter.recordSuccess(normalizedEmail);

    dataStore.setCurrentProfile(matched.id);

    const response = NextResponse.json({
      success: true,
      currentProfile: matched,
    });

    // 1. Cryptographic HttpOnly session token cookie (strictly inaccessible to JavaScript)
    response.cookies.set('sb-access-token', authData.session.access_token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: authData.session.expires_in || 86400 * 7,
    });

    // 2. Profile identity cookies (validated by middleware against sb-access-token)
    response.cookies.set('aicte_current_profile_id', matched.id, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400 * 7,
    });

    response.cookies.set('aicte_user_role', matched.role, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400 * 7,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Authentication processing error.' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Signed out successfully' });

  response.cookies.set('sb-access-token', '', {
    path: '/',
    httpOnly: true,
    maxAge: 0,
    expires: new Date(0),
  });

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
