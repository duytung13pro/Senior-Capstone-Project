import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || "dev-nextauth-secret-change-me"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname === "/" || pathname.startsWith("/_next") || pathname.includes("/public")) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/auth") || pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request, secret: AUTH_SECRET })
  const userRole = (token?.role as string | undefined)?.toLowerCase()

  if (!token || !userRole) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  if ((userRole === "instructor" || userRole === "teacher") && !pathname.includes("teacher")) {
    return NextResponse.redirect(new URL("/dashboard/teacher", request.url))
  }

  if (userRole === "student" && !pathname.includes("student")) {
    return NextResponse.redirect(new URL("/dashboard/student", request.url))
  }

  if (userRole === "admin" && !pathname.includes("admin")) {
    return NextResponse.redirect(new URL("/dashboard/admin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
