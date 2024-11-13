import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If there's no session and the user is trying to access a protected route
  if (!session && isProtectedRoute(req.nextUrl.pathname)) {
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If there's a session and the user is trying to access auth routes (login)
  if (session && isAuthRoute(req.nextUrl.pathname)) {
    const redirectUrl = new URL('/chat', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Protected routes that require authentication
function isProtectedRoute(pathname: string) {
  const protectedRoutes = ['/chat', '/settings', '/profile'];
  return protectedRoutes.some(route => pathname.startsWith(route));
}

// Auth routes that shouldn't be accessed when logged in
function isAuthRoute(pathname: string) {
  const authRoutes = ['/login'];
  return authRoutes.includes(pathname);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico).*)'],
};