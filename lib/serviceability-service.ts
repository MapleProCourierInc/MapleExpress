import { apiFetch } from "@/lib/client-api"
import type { ServiceabilityResponse } from "@/lib/serviceability-server"

export async function checkAddressServiceability(latitude: number, longitude: number): Promise<ServiceabilityResponse> {
  const response = await apiFetch("/api/serviceability", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ latitude, longitude }),
  })

  const data = (await response.json().catch(() => null)) as ServiceabilityResponse | { message?: string } | null

  if (!response.ok) {
    throw new Error((data as { message?: string } | null)?.message || "Unable to check serviceability")
  }

  return (data || { serviceable: false }) as ServiceabilityResponse
}

