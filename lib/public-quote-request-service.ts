import "server-only"

import { NOTIFICATION_SERVICE_URL, getEndpointUrl } from "@/lib/config.server"

export type PublicQuoteRequest = {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  serviceType: string
  additionalInformation?: string | null
}

export function submitPublicQuoteRequest(body: PublicQuoteRequest, forwardedFor?: string | null) {
  if (!NOTIFICATION_SERVICE_URL) {
    throw new Error("NOTIFICATION_SERVICE_BASE_URL is not configured")
  }

  return fetch(getEndpointUrl(NOTIFICATION_SERVICE_URL, "/public/api/v1/quote-requests"), {
    method: "POST",
    headers: {
      Accept: "application/json, application/problem+json",
      "Content-Type": "application/json",
      ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })
}
