import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { canAccessPath, ROLE_ROUTE_PREFIXES } from './lib/auth/rbac';
import { UserRole } from './lib/supabase/types';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, api routes, and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Public landing page and authentication routes
  if (pathname === '/' || pathname.startsWith('/login') || pathname === '/register') {
    return NextResponse.next();
  }

  // Guard protected routes against unauthorized access and cross-role violations
  const isProtected =
    pathname.startsWith('/institution') ||
    pathname.startsWith('/officer') ||
    pathname.startsWith('/admin');

  if (isProtected) {
    const profileId = request.cookies.get('aicte_current_profile_id')?.value;
    if (!profileId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const roleCookie = request.cookies.get('aicte_user_role')?.value as UserRole | undefined;
    const userRole: UserRole = roleCookie || 'institution';

    if (!canAccessPath(userRole, pathname)) {
      // Direct access forbidden: redirect to authorized dashboard
      const safeRedirect = `${ROLE_ROUTE_PREFIXES[userRole]}/dashboard`;
      return NextResponse.redirect(new URL(safeRedirect, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
