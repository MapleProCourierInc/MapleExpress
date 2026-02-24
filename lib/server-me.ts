import "server-only"

import { cookies } from "next/headers"
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import type { MeResponse } from "@/lib/me-service"

export async function getServerMe(): Promise<MeResponse | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("maplexpress_access_token")?.value || cookieStore.get("accessToken")?.value
  const idToken = cookieStore.get("maplexpress_id_token")?.value

  if (!accessToken || !idToken) {
    return null
  }

  const response = await fetch(getEndpointUrl(PROFILE_SERVICE_URL, "/me"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Id-Token": idToken,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    return null
  }

  return (await response.json()) as MeResponse
}

export function isSuperAdmin(me: MeResponse | null): boolean {
  return Boolean(me?.authenticated && me.groups?.includes("admin_super"))
}
