import { type NextRequest, NextResponse } from "next/server"
import {
  applyAuthCookies,
  clearAuthCookies,
  getAuthTokensFromRequest,
  isRetryableAuthenticationResponse,
  maybeRefreshTokens,
  mergeRefreshedTokens,
  shouldRefreshTokens,
  type RefreshedTokens,
} from "@/lib/server-auth"

type ProxyOptions = {
  url: string
  method: string
  body?: string
  includeIdToken?: boolean
  contentTypeJson?: boolean
}

function headersFor(accessToken: string | null, idToken?: string | null, contentTypeJson?: boolean): HeadersInit {
  return {
    accept: "application/json",
    ...(contentTypeJson ? { "Content-Type": "application/json" } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(idToken ? { "X-Id-Token": idToken } : {}),
  }
}

async function upstreamResponse(response: Response, refreshed?: RefreshedTokens | null) {
  const data = await response.json().catch(() => ({}))
  const result = NextResponse.json(data, { status: response.status })

  if (refreshed) {
    applyAuthCookies(result, refreshed)
  }

  if (response.status === 401) {
    clearAuthCookies(result)
  }

  return result
}

export async function proxyWithAuthRetry(request: NextRequest, options: ProxyOptions) {
  const originalTokens = getAuthTokensFromRequest(request)
  let tokens = originalTokens
  let refreshedBeforeRequest: RefreshedTokens | null = null

  if (shouldRefreshTokens(tokens, { includeIdToken: options.includeIdToken })) {
    refreshedBeforeRequest = await maybeRefreshTokens(tokens, request)
    if (refreshedBeforeRequest) {
      tokens = mergeRefreshedTokens(tokens, refreshedBeforeRequest)
    }
  }

  if (!tokens.accessToken || (options.includeIdToken && !tokens.idToken)) {
    const response = NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    clearAuthCookies(response)
    return response
  }

  const first = await fetch(options.url, {
    method: options.method,
    headers: headersFor(tokens.accessToken, options.includeIdToken ? tokens.idToken : null, options.contentTypeJson),
    ...(options.body ? { body: options.body } : {}),
    cache: "no-store",
  })

  if (
    refreshedBeforeRequest ||
    !isRetryableAuthenticationResponse(first.status, tokens, Boolean(options.includeIdToken))
  ) {
    return upstreamResponse(first, refreshedBeforeRequest)
  }

  const refreshed = await maybeRefreshTokens(tokens, request)
  if (!refreshed?.accessToken) {
    const response = NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    clearAuthCookies(response)
    return response
  }

  tokens = mergeRefreshedTokens(originalTokens, refreshed)
  const second = await fetch(options.url, {
    method: options.method,
    headers: headersFor(tokens.accessToken, options.includeIdToken ? tokens.idToken : null, options.contentTypeJson),
    ...(options.body ? { body: options.body } : {}),
    cache: "no-store",
  })

  return upstreamResponse(second, refreshed)
}
