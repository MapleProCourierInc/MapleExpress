import { type NextRequest, NextResponse } from "next/server"
import { applyAuthCookies, clearAuthCookies, getAuthTokensFromRequest, maybeRefreshTokens } from "@/lib/server-auth"

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

export async function proxyWithAuthRetry(request: NextRequest, options: ProxyOptions) {
  const tokens = getAuthTokensFromRequest(request)

  const first = await fetch(options.url, {
    method: options.method,
    headers: headersFor(tokens.accessToken, options.includeIdToken ? tokens.idToken : null, options.contentTypeJson),
    ...(options.body ? { body: options.body } : {}),
    cache: "no-store",
  })

  if (first.status !== 401) {
    const data = await first.json().catch(() => ({}))
    return NextResponse.json(data, { status: first.status })
  }

  const refreshed = await maybeRefreshTokens(tokens, request)
  if (!refreshed?.accessToken) {
    const response = NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    clearAuthCookies(response)
    return response
  }

  const second = await fetch(options.url, {
    method: options.method,
    headers: headersFor(refreshed.accessToken, options.includeIdToken ? refreshed.idToken || tokens.idToken : null, options.contentTypeJson),
    ...(options.body ? { body: options.body } : {}),
    cache: "no-store",
  })

  const payload = await second.json().catch(() => ({}))
  const response = NextResponse.json(payload, { status: second.status })
  applyAuthCookies(response, refreshed)

  if (second.status === 401) {
    clearAuthCookies(response)
  }

  return response
}
