import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to auth pages, API routes, static files, and onboarding
  const publicPaths = ['/auth/signin', '/onboarding', '/api'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check for authentication cookie
  const accessToken = request.cookies.get('sb-access-token')?.value;

  if (!accessToken) {
    console.log(`🔒 Middleware: No access token for ${pathname}, redirecting to sign-in`);
    // Redirect to signin if no auth token
    const signInUrl = new URL('/auth/signin', request.url);
    return NextResponse.redirect(signInUrl);
  }

  console.log(`✅ Middleware: Access granted to ${pathname}`);
  return NextResponse.next();
}

// Protect all routes except public ones
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
