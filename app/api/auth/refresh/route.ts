import { type NextRequest, NextResponse } from "next/server"
import { maybeRefreshTokens, getAuthTokensFromRequest, applyAuthCookies, clearAuthCookies } from "@/lib/server-auth"

export async function POST(request: NextRequest) {
  try {
    const tokens = getAuthTokensFromRequest(request)

    if (!tokens.refreshToken) {
      const response = NextResponse.json({ message: "Refresh token is required" }, { status: 400 })
      clearAuthCookies(response)
      return response
    }

    const refreshedTokens = await maybeRefreshTokens(tokens, request)

    if (!refreshedTokens) {
      const response = NextResponse.json({ message: "Failed to refresh token" }, { status: 401 })
      clearAuthCookies(response)
      return response
    }

    const response = NextResponse.json({ success: true }, { status: 200 })
    applyAuthCookies(response, refreshedTokens)
    return response
  } catch (error) {
    console.error("Token refresh error:", error)
    const response = NextResponse.json({ message: "Internal server error" }, { status: 500 })
    clearAuthCookies(response)
    return response
  }
}
