import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Allow access to API routes
    if (path.startsWith('/api')) {
      return NextResponse.next()
    }

    // Redirect authenticated users from landing page to dashboard
    if (path === '/' && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Platform admin routes
    if (path.startsWith('/admin')) {
      if (token?.platformRole !== 'PLATFORM_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // Public routes
        if (path === '/' || path.startsWith('/api/auth')) {
          return true
        }

        // All other routes require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox.*|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico|.*\\.webmanifest).*)',
  ],
}
