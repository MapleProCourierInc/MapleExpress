import "server-only"

import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"

export type PublicServiceabilityResponse = {
  serviceable: boolean
  matchedZoneName?: string
  city?: string
  station?: string
}

export async function checkPublicServiceability(latitude: number, longitude: number): Promise<PublicServiceabilityResponse> {
  const response = await fetch(getEndpointUrl(ORDER_SERVICE_URL, "/public/service-zones/check-serviceability"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ latitude, longitude }),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Failed to check service availability")
  }

  return (await response.json()) as PublicServiceabilityResponse
}
