import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow public pages
  if (pathname === '/' || pathname.startsWith('/_next') || pathname.includes('/public')) {
    return NextResponse.next()
  }

  // Allow auth pages without checking session
  if (pathname.startsWith('/auth')) {
    return NextResponse.next()
  }

  // Allow API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // For dashboard routes, check user role from cookies
  if (pathname.startsWith('/dashboard')) {
    // Get user authentication from cookies
    const userId = request.cookies.get('userId')?.value
    const userRole = request.cookies.get('userRole')?.value?.toLowerCase()

    if (!userId || !userRole) {
      // No user session, redirect to login
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Check if user is accessing the correct role-based path
    if ((userRole === 'instructor' || userRole === 'teacher') && !pathname.includes('teacher')) {
      return NextResponse.redirect(new URL('/dashboard/teacher', request.url))
    }

    if (userRole === 'student' && !pathname.includes('student')) {
      return NextResponse.redirect(new URL('/dashboard/student', request.url))
    }

    if (userRole === 'admin' && !pathname.includes('admin')) {
      return NextResponse.redirect(new URL('/dashboard/admin', request.url))
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
