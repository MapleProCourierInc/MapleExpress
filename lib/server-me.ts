import "server-only"

import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { authenticatedServerFetch } from "@/lib/server-auth"
import type { MeResponse } from "@/lib/me-service"

export async function getServerMe(): Promise<MeResponse | null> {
  const response = await authenticatedServerFetch(
    getEndpointUrl(PROFILE_SERVICE_URL, "/me"),
    { method: "GET" },
    { includeIdToken: true },
  )

  if (!response || !response.ok) {
    return null
  }

  return (await response.json()) as MeResponse
}

export function isSuperAdmin(me: MeResponse | null): boolean {
  return Boolean(me?.authenticated && me.groups?.includes("admin_super"))
}
