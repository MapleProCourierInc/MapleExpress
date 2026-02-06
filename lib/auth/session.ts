import { cookies } from "next/headers"

type JwtPayload = {
  sub?: string
  email?: string
  ["cognito:groups"]?: string[]
  exp?: number
}

export const COOKIE_NAMES = {
  access: "mx_access_token",
  id: "mx_id_token",
  refresh: "mx_refresh_token",
} as const

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".")
    if (parts.length < 2) return null
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"))
    return payload
  } catch {
    return null
  }
}

export async function getSessionFromCookies() {
  const store = await cookies()
  const accessToken = store.get(COOKIE_NAMES.access)?.value
  const idToken = store.get(COOKIE_NAMES.id)?.value
  const refreshToken = store.get(COOKIE_NAMES.refresh)?.value

  const claims = accessToken ? decodeJwtPayload(accessToken) : null
  const groups = claims?.["cognito:groups"] ?? []

  return {
    authenticated: Boolean(accessToken),
    accessToken,
    idToken,
    refreshToken,
    claims,
    groups,
    email: claims?.email,
    sub: claims?.sub,
  }
}

export function cookieSettings(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  }
}
