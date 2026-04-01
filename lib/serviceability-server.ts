import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { authenticatedServerFetch } from "@/lib/server-auth"

export type ServiceabilityResponse = {
  serviceable: boolean
  message?: string
  station?: string
  city?: string
}

export async function checkAuthenticatedServiceability(
  latitude: number,
  longitude: number,
): Promise<ServiceabilityResponse> {
  const response = await authenticatedServerFetch(
    getEndpointUrl(ORDER_SERVICE_URL, "/service-zones/check-serviceability"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ latitude, longitude }),
    },
  )

  if (!response) {
    return {
      serviceable: false,
      message: "Unauthorized",
    }
  }

  const data = (await response.json().catch(() => null)) as ServiceabilityResponse | { message?: string } | null

  if (!response.ok) {
    return {
      serviceable: false,
      message: (data as { message?: string } | null)?.message || "Unable to verify serviceability.",
    }
  }

  return (data || { serviceable: false }) as ServiceabilityResponse
}
