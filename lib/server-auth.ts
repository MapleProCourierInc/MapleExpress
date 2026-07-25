import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { cognitoRequest, decodeJwtPayload, getCognitoClientId } from "@/lib/cognito"

export type AuthTokens = {
  accessToken: string | null
  idToken: string | null
  refreshToken: string | null
}

export type RefreshedTokens = {
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

const refreshPromises = new Map<string, Promise<RefreshedTokens | null>>()

const ACCESS_TOKEN_MAX_AGE = 60 * 60
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 5
const TOKEN_REFRESH_SKEW_MS = 60 * 1000

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

function tokenExpiresWithin(token: string | null, skewMs: number) {
  if (!token) return true

  const expiration = decodeJwtPayload(token)?.exp
  return typeof expiration === "number" && expiration * 1000 <= Date.now() + skewMs
}

export function shouldRefreshTokens(
  tokens: AuthTokens,
  options: { includeIdToken?: boolean; skewMs?: number } = {},
) {
  if (!tokens.refreshToken) return false

  const { includeIdToken = false, skewMs = TOKEN_REFRESH_SKEW_MS } = options
  return (
    !tokens.accessToken ||
    tokenExpiresWithin(tokens.accessToken, skewMs) ||
    (includeIdToken && (!tokens.idToken || tokenExpiresWithin(tokens.idToken, skewMs)))
  )
}

export function isRetryableAuthenticationResponse(
  status: number,
  tokens: AuthTokens,
  includeIdToken = false,
) {
  if (status === 401) return true
  if (status !== 403) return false

  return (
    tokenExpiresWithin(tokens.accessToken, 0) ||
    (includeIdToken && tokenExpiresWithin(tokens.idToken, 0))
  )
}

export function mergeRefreshedTokens(tokens: AuthTokens, refreshed: RefreshedTokens): AuthTokens {
  return {
    accessToken: refreshed.accessToken,
    idToken: refreshed.idToken || tokens.idToken,
    refreshToken: refreshed.refreshToken || tokens.refreshToken,
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

async function refreshWithToken(refreshToken: string, _forwardedIp?: string | null): Promise<RefreshedTokens | null> {
  let refreshPromise = refreshPromises.get(refreshToken)

  if (!refreshPromise) {
    const request = (async () => {
      const cognitoResponse = await cognitoRequest<{ AuthenticationResult?: { AccessToken?: string; IdToken?: string } }>(
        "AWSCognitoIdentityProviderService.InitiateAuth",
        {
          AuthFlow: "REFRESH_TOKEN_AUTH",
          ClientId: getCognitoClientId(),
          AuthParameters: {
            REFRESH_TOKEN: refreshToken,
          },
        },
      )

      if (!cognitoResponse.ok) return null

      const authResult = cognitoResponse.data.AuthenticationResult
      if (!authResult?.AccessToken) return null

      return {
        accessToken: authResult.AccessToken,
        idToken: authResult.IdToken,
        refreshToken,
      }
    })()

    refreshPromise = request.finally(() => {
      refreshPromises.delete(refreshToken)
    })
    refreshPromises.set(refreshToken, refreshPromise)
  }

  return refreshPromise
}

export async function maybeRefreshTokens(tokens: AuthTokens, request?: NextRequest) {
  if (!tokens.refreshToken) return null
  return refreshWithToken(tokens.refreshToken, request?.headers.get("x-forwarded-for"))
}

export async function getServerAuthHeaders(options: ServerAuthHeaderOptions = {}): Promise<Record<string, string> | null> {
  const { includeIdToken = false, includeJsonContentType = false } = options
  let tokens = await getAuthTokensFromCookies()

  if (shouldRefreshTokens(tokens, { includeIdToken })) {
    const refreshed = await maybeRefreshTokens(tokens)
    if (refreshed) {
      tokens = mergeRefreshedTokens(tokens, refreshed)
      await persistCookies(refreshed)
    }
  }

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
  let tokens = await getAuthTokensFromCookies()
  let refreshedBeforeRequest: RefreshedTokens | null = null

  if (shouldRefreshTokens(tokens, { includeIdToken })) {
    refreshedBeforeRequest = await maybeRefreshTokens(tokens)
    if (refreshedBeforeRequest) {
      tokens = mergeRefreshedTokens(tokens, refreshedBeforeRequest)
      await persistCookies(refreshedBeforeRequest)
    }
  }

  if (!tokens.accessToken) return null
  if (includeIdToken && !tokens.idToken) return null

  const baseHeaders = new Headers(init.headers || {})
  baseHeaders.set("Authorization", `Bearer ${tokens.accessToken}`)
  if (includeIdToken && tokens.idToken) {
    baseHeaders.set("X-Id-Token", tokens.idToken)
  }

  const first = await fetch(input, { ...init, headers: baseHeaders, cache: init.cache ?? "no-store" })
  if (
    refreshedBeforeRequest ||
    !isRetryableAuthenticationResponse(first.status, tokens, includeIdToken)
  ) {
    if (first.status === 401) {
      await clearCookiesInStore()
    }
    return first
  }

  const refreshed = await maybeRefreshTokens(tokens)
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
