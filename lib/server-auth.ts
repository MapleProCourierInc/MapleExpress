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

type ServerAuthHeaderOptions = {
  includeIdToken?: boolean
  includeJsonContentType?: boolean
}

type AuthenticatedServerFetchOptions = {
  includeIdToken?: boolean
}

let refreshPromise: Promise<RefreshedTokens | null> | null = null

const ACCESS_TOKEN_MAX_AGE = 60 * 60
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 5

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  }
}

async function persistCookies(tokens: { accessToken: string; idToken?: string; refreshToken?: string }) {
  try {
    const cookieStore = await cookies()
    cookieStore.set("maplexpress_access_token", tokens.accessToken, getCookieOptions(ACCESS_TOKEN_MAX_AGE))
    cookieStore.set("accessToken", tokens.accessToken, getCookieOptions(ACCESS_TOKEN_MAX_AGE))

    if (tokens.idToken) {
      cookieStore.set("maplexpress_id_token", tokens.idToken, getCookieOptions(ACCESS_TOKEN_MAX_AGE))
    }

    if (tokens.refreshToken) {
      cookieStore.set("maplexpress_refresh_token", tokens.refreshToken, getCookieOptions(REFRESH_TOKEN_MAX_AGE))
    }
  } catch {
    // cookie mutations are not available in all server contexts (e.g. some RSC renders)
  }
}

async function clearCookiesInStore() {
  try {
    const cookieStore = await cookies()
    cookieStore.set("maplexpress_access_token", "", getCookieOptions(0))
    cookieStore.set("accessToken", "", getCookieOptions(0))
    cookieStore.set("maplexpress_refresh_token", "", getCookieOptions(0))
    cookieStore.set("maplexpress_id_token", "", getCookieOptions(0))
  } catch {
    // cookie mutations are not available in all server contexts
  }
}

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

async function refreshWithToken(refreshToken: string, forwardedIp?: string | null): Promise<RefreshedTokens | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(AUTH_REFRESH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Language": "application/json",
          "X-Real-IP": forwardedIp || "127.0.0.1",
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
  return refreshWithToken(tokens.refreshToken, request.headers.get("x-forwarded-for"))
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

export async function authenticatedServerFetch(
  input: string,
  init: RequestInit = {},
  options: AuthenticatedServerFetchOptions = {},
): Promise<Response | null> {
  const { includeIdToken = false } = options
  const tokens = await getAuthTokensFromCookies()

  if (!tokens.accessToken) return null
  if (includeIdToken && !tokens.idToken) return null

  const baseHeaders = new Headers(init.headers || {})
  baseHeaders.set("Authorization", `Bearer ${tokens.accessToken}`)
  if (includeIdToken && tokens.idToken) {
    baseHeaders.set("X-Id-Token", tokens.idToken)
  }

  const first = await fetch(input, { ...init, headers: baseHeaders, cache: init.cache ?? "no-store" })
  if (first.status !== 401) return first

  const refreshed = tokens.refreshToken ? await refreshWithToken(tokens.refreshToken) : null
  if (!refreshed?.accessToken) {
    await clearCookiesInStore()
    return first
  }

  await persistCookies(refreshed)

  const retryHeaders = new Headers(init.headers || {})
  retryHeaders.set("Authorization", `Bearer ${refreshed.accessToken}`)
  if (includeIdToken && (refreshed.idToken || tokens.idToken)) {
    retryHeaders.set("X-Id-Token", refreshed.idToken || tokens.idToken || "")
  }

  const second = await fetch(input, { ...init, headers: retryHeaders, cache: init.cache ?? "no-store" })
  if (second.status === 401) {
    await clearCookiesInStore()
  }

  return second
}

export function applyAuthCookies(response: NextResponse, tokens: RefreshedTokens) {
  response.cookies.set("maplexpress_access_token", tokens.accessToken, getCookieOptions(ACCESS_TOKEN_MAX_AGE))
  response.cookies.set("accessToken", tokens.accessToken, getCookieOptions(ACCESS_TOKEN_MAX_AGE))

  if (tokens.idToken) {
    response.cookies.set("maplexpress_id_token", tokens.idToken, getCookieOptions(ACCESS_TOKEN_MAX_AGE))
  }

  if (tokens.refreshToken) {
    response.cookies.set("maplexpress_refresh_token", tokens.refreshToken, getCookieOptions(REFRESH_TOKEN_MAX_AGE))
  }
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set("maplexpress_access_token", "", getCookieOptions(0))
  response.cookies.set("accessToken", "", getCookieOptions(0))
  response.cookies.set("maplexpress_refresh_token", "", getCookieOptions(0))
  response.cookies.set("maplexpress_id_token", "", getCookieOptions(0))
}
