import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });

  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ['/', '/login', '/auth', '/api/auth'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If user is not authenticated and trying to access protected route
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated but hasn't completed KYC, redirect to onboarding
  // Allow access to profile page even without KYC
  if (token && !token.hasCompletedKYC && pathname !== '/onboarding' && pathname !== '/profile' && !isPublicRoute) {
    const onboardingUrl = new URL('/onboarding', request.url);
    return NextResponse.redirect(onboardingUrl);
  }

  // If user completed KYC and tries to access onboarding, redirect to dashboard
  if (token && token.hasCompletedKYC && pathname === '/onboarding') {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // If authenticated user tries to access login/auth, redirect to dashboard
  if (token && (pathname === '/login' || pathname === '/auth')) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
