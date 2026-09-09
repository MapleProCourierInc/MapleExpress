import "server-only"

import { ORDER_SERVICE_URL, getEndpointUrl } from "@/lib/config.server"
import type { PublicRateEstimateRequest } from "@/types/public-rates"

export function estimatePublicRates(body: PublicRateEstimateRequest) {
  if (!ORDER_SERVICE_URL) {
    throw new Error("ORDER_MANAGEMENT_SERVICE_BASE_URL is not configured")
  }

  return fetch(getEndpointUrl(ORDER_SERVICE_URL, "/public/rates/estimate"), {
    method: "POST",
    headers: {
      Accept: "application/json, application/problem+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })
}
