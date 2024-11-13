import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  const protectedRoutes = ['/chat', '/imagine', '/profile', '/settings'];
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  // If accessing protected route without session, redirect to login
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If accessing auth pages (login/register) with active session, redirect to chat
  if ((req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register') && session) {
    return NextResponse.redirect(new URL('/chat', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/chat/:path*',
    '/imagine/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/login',
    '/register'
  ],
};