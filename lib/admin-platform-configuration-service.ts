import "server-only"

import { BILLING_MANAGEMENT_SERVICE_URL, getEndpointUrl } from "@/lib/config"
import { authenticatedServerFetch } from "@/lib/server-auth"
import type {
  ActivateLegalDocumentRequest,
  AdminLegalDocumentResponse,
  AdminPlatformConfigurationResponse,
  CreateLegalDocumentVersionRequest,
  PlatformConfigurationApiError,
  UpdateContactConfigurationRequest,
  UpdateLegalDocumentDraftRequest,
  UpdateSocialMediaConfigurationRequest,
} from "@/types/admin-platform-configuration"

type ServiceResult<T> = {
  data: T | null
  error: PlatformConfigurationApiError | null
  textError?: string | null
}

function withJsonHeaders(headers?: HeadersInit) {
  return {
    ...(headers || {}),
    Accept: "application/json",
    "Content-Type": "application/json",
  }
}

function isDirtyTextResponse(text: string) {
  return /<!doctype|<html|<head|<body|<\/|nginx|temporarily unavailable/i.test(text)
}

function friendlyError(response: Response, text?: string): PlatformConfigurationApiError {
  if ([502, 503, 504].includes(response.status) || (text && isDirtyTextResponse(text))) {
    return {
      status: String(response.status),
      message: "Billing management service is temporarily unavailable",
    }
  }

  return { status: String(response.status), message: "Request failed" }
}

async function parseError(response: Response): Promise<{ error: PlatformConfigurationApiError | null; textError: string | null }> {
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const errorPayload = (await response.json().catch(() => null)) as PlatformConfigurationApiError | null
    return {
      error: errorPayload ?? { status: String(response.status), message: "Request failed" },
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

async function platformConfigurationFetch<T>(endpoint: string, init: RequestInit): Promise<ServiceResult<T>> {
  const response = await authenticatedServerFetch(
    getEndpointUrl(BILLING_MANAGEMENT_SERVICE_URL, endpoint),
    init,
    { includeIdToken: true },
  )

  if (!response) {
    return { data: null, error: { status: "401", message: "Unauthorized" }, textError: null }
  }

  if (!response.ok) {
    const parsed = await parseError(response)
    return { data: null, ...parsed }
  }

  if (response.status === 204) {
    return { data: null as T, error: null, textError: null }
  }

  return { data: (await response.json()) as T, error: null, textError: null }
}

export async function getAdminPlatformConfiguration(): Promise<ServiceResult<AdminPlatformConfigurationResponse>> {
  return platformConfigurationFetch<AdminPlatformConfigurationResponse>("/api/v1/admin/platform-configuration", {
    method: "GET",
    headers: withJsonHeaders(),
  })
}

export async function updateAdminPlatformContactConfiguration(
  payload: UpdateContactConfigurationRequest,
): Promise<ServiceResult<AdminPlatformConfigurationResponse>> {
  return platformConfigurationFetch<AdminPlatformConfigurationResponse>("/api/v1/admin/platform-configuration/contact", {
    method: "PUT",
    headers: withJsonHeaders(),
    body: JSON.stringify(payload),
  })
}

export async function updateAdminPlatformSocialMediaConfiguration(
  payload: UpdateSocialMediaConfigurationRequest,
): Promise<ServiceResult<AdminPlatformConfigurationResponse>> {
  return platformConfigurationFetch<AdminPlatformConfigurationResponse>("/api/v1/admin/platform-configuration/social-media", {
    method: "PUT",
    headers: withJsonHeaders(),
    body: JSON.stringify(payload),
  })
}

export async function createAdminPlatformLegalDocumentVersion(
  payload: CreateLegalDocumentVersionRequest,
): Promise<ServiceResult<AdminLegalDocumentResponse>> {
  return platformConfigurationFetch<AdminLegalDocumentResponse>("/api/v1/admin/platform-configuration/legal-documents", {
    method: "POST",
    headers: withJsonHeaders(),
    body: JSON.stringify(payload),
  })
}

export async function updateAdminPlatformLegalDocumentDraft(
  legalDocumentId: string,
  payload: UpdateLegalDocumentDraftRequest,
): Promise<ServiceResult<AdminLegalDocumentResponse>> {
  return platformConfigurationFetch<AdminLegalDocumentResponse>(
    `/api/v1/admin/platform-configuration/legal-documents/${encodeURIComponent(legalDocumentId)}`,
    {
      method: "PATCH",
      headers: withJsonHeaders(),
      body: JSON.stringify(payload),
    },
  )
}

export async function deleteAdminPlatformLegalDocumentDraft(legalDocumentId: string): Promise<ServiceResult<null>> {
  return platformConfigurationFetch<null>(
    `/api/v1/admin/platform-configuration/legal-documents/${encodeURIComponent(legalDocumentId)}`,
    {
      method: "DELETE",
      headers: withJsonHeaders(),
    },
  )
}

export async function activateAdminPlatformLegalDocument(
  legalDocumentId: string,
  payload: ActivateLegalDocumentRequest,
): Promise<ServiceResult<AdminLegalDocumentResponse>> {
  return platformConfigurationFetch<AdminLegalDocumentResponse>(
    `/api/v1/admin/platform-configuration/legal-documents/${encodeURIComponent(legalDocumentId)}/activate`,
    {
      method: "POST",
      headers: withJsonHeaders(),
      body: JSON.stringify(payload),
    },
  )
}

export async function archiveAdminPlatformLegalDocument(
  legalDocumentId: string,
): Promise<ServiceResult<AdminLegalDocumentResponse>> {
  return platformConfigurationFetch<AdminLegalDocumentResponse>(
    `/api/v1/admin/platform-configuration/legal-documents/${encodeURIComponent(legalDocumentId)}/archive`,
    {
      method: "POST",
      headers: withJsonHeaders(),
    },
  )
}
