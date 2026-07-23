import "server-only"

import { BILLING_MANAGEMENT_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import type {
  PublicContactConfiguration,
  PublicLegalDocument,
  PublicLegalDocumentType,
  PublicPlatformConfiguration,
  PublicPlatformConfigurationApiError,
  PublicSocialMediaProfile,
} from "@/types/platform-configuration"

type ServiceResult<T> = {
  data: T | null
  error: PublicPlatformConfigurationApiError | null
  textError?: string | null
}

function isDirtyTextResponse(text: string) {
  return /<!doctype|<html|<head|<body|<\/|nginx|temporarily unavailable/i.test(text)
}

function friendlyError(response: Response, text?: string): PublicPlatformConfigurationApiError {
  if ([502, 503, 504].includes(response.status) || (text && isDirtyTextResponse(text))) {
    return {
      status: String(response.status),
      message: "Billing management service is temporarily unavailable",
    }
  }

  return { status: String(response.status), message: "Request failed" }
}

async function parseError(response: Response): Promise<{ error: PublicPlatformConfigurationApiError | null; textError: string | null }> {
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as PublicPlatformConfigurationApiError | null
    return {
      error: payload ?? { status: String(response.status), message: "Request failed" },
      textError: null,
    }
  }

  const text = await response.text().catch(() => "")
  const dirty = isDirtyTextResponse(text)
  return {
    error: friendlyError(response, text),
    textError: text && !dirty ? text : null,
  }
}

async function publicPlatformFetch<T>(endpoint: string): Promise<ServiceResult<T>> {
  const response = await fetch(getEndpointUrl(BILLING_MANAGEMENT_SERVICE_URL, endpoint), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  })

  if (!response.ok) {
    return { data: null, ...(await parseError(response)) }
  }

  return { data: (await response.json()) as T, error: null, textError: null }
}

export function getPublicPlatformConfiguration() {
  return publicPlatformFetch<PublicPlatformConfiguration>("/api/v1/public/platform-configuration")
}

export function getPublicPlatformContactConfiguration() {
  return publicPlatformFetch<PublicContactConfiguration>("/api/v1/public/platform-configuration/contact")
}

export function getPublicPlatformSocialMediaProfiles() {
  return publicPlatformFetch<PublicSocialMediaProfile[]>("/api/v1/public/platform-configuration/social-media")
}

export function getPublicPlatformLegalDocuments() {
  return publicPlatformFetch<PublicLegalDocument[]>("/api/v1/public/platform-configuration/legal-documents")
}

export function getPublicPlatformLegalDocumentByType(documentType: PublicLegalDocumentType) {
  return publicPlatformFetch<PublicLegalDocument>(
    `/api/v1/public/platform-configuration/legal-documents/${encodeURIComponent(documentType)}`,
  )
}
