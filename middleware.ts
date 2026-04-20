import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('auth_session')?.value;

  // Protect the dashboard (root route)
  if (request.nextUrl.pathname === '/') {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Prevent logged-in users from accessing the login page
  if (request.nextUrl.pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login'],
};
