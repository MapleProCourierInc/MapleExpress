import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { AUTH_REFRESH_URL } from "@/lib/config"

export type AuthTokens = {
  accessToken: string | null
  idToken: string | null
  refreshToken: string | null
}

type RefreshedTokens = {
  accessToken: string
  idToken?: string
  refreshToken?: string
}

let refreshPromise: Promise<RefreshedTokens | null> | null = null

export function getAuthTokensFromRequest(request: NextRequest): AuthTokens {
  const authHeader = request.headers.get("authorization")
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null

  return {
    accessToken:
      bearerToken || request.cookies.get("maplexpress_access_token")?.value || request.cookies.get("accessToken")?.value || null,
    idToken: request.cookies.get("maplexpress_id_token")?.value || null,
    refreshToken: request.cookies.get("maplexpress_refresh_token")?.value || null,
  }
}

export async function getAuthTokensFromCookies(): Promise<AuthTokens> {
  const cookieStore = await cookies()
  return {
    accessToken: cookieStore.get("maplexpress_access_token")?.value || cookieStore.get("accessToken")?.value || null,
    idToken: cookieStore.get("maplexpress_id_token")?.value || null,
    refreshToken: cookieStore.get("maplexpress_refresh_token")?.value || null,
  }
}



type ServerAuthHeaderOptions = {
  includeIdToken?: boolean
  includeJsonContentType?: boolean
}

export async function getServerAuthHeaders(options: ServerAuthHeaderOptions = {}): Promise<Record<string, string> | null> {
  const { includeIdToken = false, includeJsonContentType = false } = options
  const tokens = await getAuthTokensFromCookies()

  if (!tokens.accessToken) return null
  if (includeIdToken && !tokens.idToken) return null

  return {
    Authorization: `Bearer ${tokens.accessToken}`,
    ...(includeIdToken && tokens.idToken ? { "X-Id-Token": tokens.idToken } : {}),
    ...(includeJsonContentType ? { "Content-Type": "application/json" } : {}),
  }
}
async function refreshWithToken(refreshToken: string, request: NextRequest): Promise<RefreshedTokens | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(AUTH_REFRESH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Language": "application/json",
          "X-Real-IP": request.headers.get("x-forwarded-for") || "127.0.0.1",
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) return null

      const data = (await response.json()) as { accessToken?: string; refreshToken?: string; idToken?: string }
      if (!data.accessToken) return null

      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        idToken: data.idToken,
      }
    })().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

export async function maybeRefreshTokens(tokens: AuthTokens, request: NextRequest) {
  if (!tokens.refreshToken) return null
  return refreshWithToken(tokens.refreshToken, request)
}

export function applyAuthCookies(response: NextResponse, tokens: RefreshedTokens) {
  const isSecure = process.env.NODE_ENV === "production"
  const accessTokenCookieOptions = {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60,
  }
  const refreshTokenCookieOptions = {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 5,
  }

  response.cookies.set("maplexpress_access_token", tokens.accessToken, accessTokenCookieOptions)
  response.cookies.set("accessToken", tokens.accessToken, accessTokenCookieOptions)

  if (tokens.idToken) {
    response.cookies.set("maplexpress_id_token", tokens.idToken, accessTokenCookieOptions)
  }

  if (tokens.refreshToken) {
    response.cookies.set("maplexpress_refresh_token", tokens.refreshToken, refreshTokenCookieOptions)
  }
}

export function clearAuthCookies(response: NextResponse) {
  const isSecure = process.env.NODE_ENV === "production"
  const cookieOptions = {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  }

  response.cookies.set("maplexpress_access_token", "", cookieOptions)
  response.cookies.set("accessToken", "", cookieOptions)
  response.cookies.set("maplexpress_refresh_token", "", cookieOptions)
  response.cookies.set("maplexpress_id_token", "", cookieOptions)
}
