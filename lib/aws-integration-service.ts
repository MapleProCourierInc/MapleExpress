import "server-only"

import { AWS_INTEGRATION_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { authenticatedServerFetch } from "@/lib/server-auth"

type PresignViewItem = {
  key: string
  presignedGetUrl: string
  expiresAt?: string
  expiresInSeconds?: number
}

type PresignViewResponse = {
  items?: PresignViewItem[]
}

export async function presignView(keys: string[]): Promise<Record<string, PresignViewItem>> {
  const uniqueKeys = Array.from(new Set(keys.filter(Boolean)))
  if (!uniqueKeys.length) return {}

  const response = await authenticatedServerFetch(
    getEndpointUrl(AWS_INTEGRATION_SERVICE_URL, "/v2/s3/presign/view"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keys: uniqueKeys }),
    },
  )

  if (!response || !response.ok) return {}

  const payload = (await response.json().catch(() => ({}))) as PresignViewResponse
  const map: Record<string, PresignViewItem> = {}

  for (const item of payload.items || []) {
    if (item?.key && item?.presignedGetUrl) {
      map[item.key] = item
    }
  }

  return map
}

export type { PresignViewItem }
