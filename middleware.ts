import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow auth pages without checking session
  if (pathname.startsWith('/auth') || pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password')) {
    return NextResponse.next()
  }

  // Allow API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // For dashboard routes, check user role (this would come from session/database)
  if (pathname.startsWith('/dashboard')) {
    // Get user role from session/cookie
    const userRole = request.cookies.get('userRole')?.value

    if (!userRole) {
      // No user role, redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user is accessing the correct role-based path
    if (userRole === 'teacher' && !pathname.includes('teacher')) {
      return NextResponse.redirect(new URL('/dashboard/teacher', request.url))
    }

    if (userRole === 'student' && !pathname.includes('student')) {
      return NextResponse.redirect(new URL('/dashboard/student', request.url))
    }

    if (userRole === 'admin' && !pathname.includes('admin')) {
      return NextResponse.redirect(new URL('/dashboard/admin', request.url))
    }

    if (userRole === 'center' && !pathname.includes('center')) {
      return NextResponse.redirect(new URL('/dashboard/center', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
