import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect /chat route
  if (req.nextUrl.pathname.startsWith('/chat')) {
    if (!session) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Redirect to /chat if already logged in
  if (req.nextUrl.pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/chat', req.url));
    }
  }

  return res;
}