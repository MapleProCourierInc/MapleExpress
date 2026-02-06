import { NextRequest, NextResponse } from "next/server"
import { cognitoInitiateAuth } from "@/lib/auth/cognito-server"
import { cookieSettings, COOKIE_NAMES } from "@/lib/auth/session"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    const result = await cognitoInitiateAuth(email, password)
    const authResult = result.AuthenticationResult

    if (!authResult?.AccessToken || !authResult?.IdToken || !authResult?.RefreshToken) {
      return NextResponse.json({ message: "Authentication failed" }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(COOKIE_NAMES.access, authResult.AccessToken, cookieSettings(authResult.ExpiresIn ?? 3600))
    response.cookies.set(COOKIE_NAMES.id, authResult.IdToken, cookieSettings(authResult.ExpiresIn ?? 3600))
    response.cookies.set(COOKIE_NAMES.refresh, authResult.RefreshToken, cookieSettings(60 * 60 * 24 * 30))

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed"
    return NextResponse.json({ message }, { status: 401 })
  }
}
