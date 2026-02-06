import { cookies } from "next/headers"
import { COOKIE_NAMES } from "@/lib/auth/session"

export async function authedFetch(input: string, init?: RequestInit) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(COOKIE_NAMES.access)?.value

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  const headers = new Headers(init?.headers)
  headers.set("Authorization", `Bearer ${accessToken}`)

  return fetch(input, {
    ...init,
    headers,
    cache: "no-store",
  })
}
