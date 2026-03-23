import { NextResponse } from 'next/server';

const PROTECTED = ['/dashboard', '/plans', '/login-history', '/audio-tweets', '/profile'];
const PUBLIC_ONLY = ['/', '/forgot-password'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
