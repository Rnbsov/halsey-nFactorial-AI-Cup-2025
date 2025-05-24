import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  await supabase.auth.getSession(); // Call to refresh session if needed, but don't assign 'session' if unused
  const { data: { user } } = await supabase.auth.getUser(); // Also refreshes the session cookie if needed

  const { pathname } = request.nextUrl;

  // Auth pages
  const authPages = ['/login', '/signup'];
  const isAuthPage = authPages.includes(pathname);

  // If user is on an auth page and is authenticated, redirect to dashboard
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not on an auth page and is not authenticated, redirect to login
  // Allow access to root, api routes, auth callback, and static assets without auth
  const publicPaths = ['/', '/auth/callback']; // Add any other public paths here like a landing page
  const isApiRoute = pathname.startsWith('/api');
  const isStaticAsset = pathname.startsWith('/_next/') || pathname.startsWith('/favicon.ico');
  
  if (!isAuthPage && !user && !publicPaths.includes(pathname) && !isApiRoute && !isStaticAsset) {
     // Allow landing page (root) to be public. If you want root to be protected, remove it from publicPaths
    if (pathname === '/') {
      // If you want a public landing page at '/', let it pass.
      // Otherwise, if '/' should be protected, this block can be removed or changed.
      return response; 
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback is handled by logic inside now, so removing from negative lookahead
     * It is important to not match api routes here if they are handled differently or are public.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)', // Exclude API routes from matcher if they have own auth
  ],
}; 