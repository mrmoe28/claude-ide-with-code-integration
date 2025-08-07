import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Middleware optimized for Vercel Edge Runtime
export default withAuth(
  function middleware(req: NextRequest) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl
    
    // Check if user is authenticated
    const isAuthenticated = !!token
    const hasActiveSubscription = token?.hasActiveSubscription === true

    // Define route patterns
    const isPublicRoute = 
      pathname === '/' ||
      pathname === '/pricing' ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/stripe/webhooks') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname.includes('.')

    const isProtectedRoute = 
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/editor') ||
      pathname.startsWith('/projects') ||
      pathname.startsWith('/api/claude-code') ||
      pathname.startsWith('/api/chat') ||
      pathname.startsWith('/api/terminal')

    // Allow public routes
    if (isPublicRoute) {
      // Redirect authenticated users away from auth pages
      if (isAuthenticated && pathname.startsWith('/auth')) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      return NextResponse.next()
    }

    // Require authentication for protected routes
    if (isProtectedRoute && !isAuthenticated) {
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }

    // Require subscription for premium features
    if (isProtectedRoute && isAuthenticated && !hasActiveSubscription) {
      // Allow access to basic dashboard but redirect premium features to pricing
      if (pathname === '/dashboard') {
        return NextResponse.next()
      }
      
      const pricingUrl = new URL('/pricing', req.url)
      pricingUrl.searchParams.set('required', 'true')
      return NextResponse.redirect(pricingUrl)
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // Let middleware handle the logic
    },
  }
)

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}