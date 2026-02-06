import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicRoutes = new Set([
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/confirm",
  "/auth/forgot-password",
  "/auth/reset-password",
])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next()
  }

  const isProtected = pathname.startsWith("/dashboard")
  if (!isProtected || publicRoutes.has(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get("mx_access_token")?.value
  if (!token) {
    const url = new URL("/auth/login", request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/:path*"],
}
