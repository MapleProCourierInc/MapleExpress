import "server-only"

import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"

export type ServiceabilityResponse = {
  serviceable: boolean
  matchedZoneId?: string | null
  matchedZoneName?: string | null
  city?: string | null
  station?: string | null
  reasonCode?: string
  message?: string
}

export async function checkAuthenticatedServiceability(
  latitude: number,
  longitude: number,
  token: string,
): Promise<ServiceabilityResponse> {
  const response = await fetch(getEndpointUrl(ORDER_SERVICE_URL, "/service-zones/check-serviceability"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ latitude, longitude }),
    cache: "no-store",
  })

  const data = (await response.json().catch(() => null)) as ServiceabilityResponse | { message?: string } | null

  if (!response.ok) {
    throw new Error((data as { message?: string } | null)?.message || "Failed to check address serviceability")
  }

  return (data || { serviceable: false }) as ServiceabilityResponse
}

