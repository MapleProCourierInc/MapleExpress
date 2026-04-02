import type { IndividualProfile, OrganizationProfile } from "@/types/profile"
import { apiFetch } from "@/lib/client-api"

type PaginatedResponse<T> = {
  items?: T[]
}

function getFirstItem<T>(payload: unknown): T | null {
  if (Array.isArray(payload)) {
    return (payload[0] as T | undefined) || null
  }

  if (payload && typeof payload === "object" && "items" in payload) {
    const paginated = payload as PaginatedResponse<T>
    return Array.isArray(paginated.items) ? (paginated.items[0] || null) : null
  }

  return (payload as T) || null
}

// Get individual profile
export async function getIndividualProfile(_userId?: string): Promise<IndividualProfile> {
  const response = await apiFetch("/api/profile/individual")

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to fetch individual profile")
  }

  const data = await response.json()
  const profile = getFirstItem<IndividualProfile>(data)

  if (!profile) {
    throw new Error("Individual profile not found")
  }

  return profile
}

// Get organization profile
export async function getOrganizationProfile(_userId?: string): Promise<OrganizationProfile> {
  const response = await apiFetch("/api/profile/organization")

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to fetch organization profile")
  }

  const data = await response.json()
  const profile = getFirstItem<OrganizationProfile>(data)

  if (!profile) {
    throw new Error("Organization profile not found")
  }

  return profile
}

// Get individual profile by email
export async function getIndividualProfileByEmail(
  _email: string,
): Promise<IndividualProfile> {
  const response = await apiFetch("/api/profile/individual")

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to fetch individual profile")
  }

  const data = await response.json()
  const profile = getFirstItem<IndividualProfile>(data)

  if (!profile) {
    throw new Error("Individual profile not found")
  }

  return profile
}

// Get organization profile by email
export async function getOrganizationProfileByEmail(
  _email: string,
): Promise<OrganizationProfile> {
  const response = await apiFetch("/api/profile/organization")

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to fetch organization profile")
  }

  const data = await response.json()
  const profile = getFirstItem<OrganizationProfile>(data)

  if (!profile) {
    throw new Error("Organization profile not found")
  }

  return profile
}

export async function getIndividualProfileOrNull(_userId?: string): Promise<IndividualProfile | null> {
  const response = await apiFetch("/api/profile/individual")

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to fetch individual profile")
  }

  const data = await response.json()
  return getFirstItem<IndividualProfile>(data)
}

export async function getOrganizationProfileOrNull(_userId?: string): Promise<OrganizationProfile | null> {
  const response = await apiFetch("/api/profile/organization")

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to fetch organization profile")
  }

  const data = await response.json()
  return getFirstItem<OrganizationProfile>(data)
}

// Update individual profile
export async function updateIndividualProfile(
  userId: string,
  profileData: Partial<IndividualProfile>,
): Promise<IndividualProfile> {

  const response = await apiFetch(`/api/profile/individual/update`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      ...profileData,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to update individual profile")
  }

  return response.json()
}

// Update organization profile
export async function updateOrganizationProfile(
  userId: string,
  profileData: Partial<OrganizationProfile>,
): Promise<OrganizationProfile> {

  const response = await apiFetch(`/api/profile/organization/update`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      ...profileData,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to update organization profile")
  }

  return response.json()
}

export async function updateIndividualInformation(
    userId: string,
    phone: string,
): Promise<IndividualProfile> {

  const response = await apiFetch(`/api/profile/individual/updateinformation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, phone }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to update information")
  }

  return data as IndividualProfile
}

export async function updateOrganizationInformation(
    userId: string,
    formData: {
      registrationNumber: string
      taxID: string
      industry: string
      phone: string
      website: string
      pointOfContact: {
        name: string
        position: string
        email: string
        phone: string
      }
    },
): Promise<OrganizationProfile> {

  const payload = {
    userId,
    registrationNumber: formData.registrationNumber || null,
    taxId: formData.taxID || null,
    industry: formData.industry || null,
    phone: formData.phone || null,
    websiteUrl: formData.website || null,
    pointOfContact: {
      name: formData.pointOfContact.name || null,
      position: formData.pointOfContact.position || null,
      email: formData.pointOfContact.email || null,
      phone: formData.pointOfContact.phone || null,
    },
  }

  const response = await apiFetch(`/api/profile/organization/updateinformation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to update organization information")
  }

  return data as OrganizationProfile
}

// Change password
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {

  const response = await apiFetch(`/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to change password")
  }

  return data
}
