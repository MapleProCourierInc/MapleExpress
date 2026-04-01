import type { IndividualProfile, OrganizationProfile } from "@/types/profile"
import { apiFetch } from "@/lib/client-api"

// Get individual profile
export async function getIndividualProfile(userId: string): Promise<IndividualProfile> {

  const response = await apiFetch(`/api/profile/individual?userId=${userId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to fetch individual profile")
  }

  return response.json()
}

// Get organization profile
export async function getOrganizationProfile(userId: string): Promise<OrganizationProfile> {

  const response = await apiFetch(`/api/profile/organization?userId=${userId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to fetch organization profile")
  }

  return response.json()
}

// Get individual profile by email
export async function getIndividualProfileByEmail(
  email: string,
): Promise<IndividualProfile> {

  const response = await apiFetch(
    `/api/profile/individual?email=${encodeURIComponent(email)}`,
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to fetch individual profile")
  }

  const data = await response.json()
  return Array.isArray(data) ? data[0] : data
}

// Get organization profile by email
export async function getOrganizationProfileByEmail(
  email: string,
): Promise<OrganizationProfile> {

  const response = await apiFetch(
    `/api/profile/organization?email=${encodeURIComponent(email)}`,
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to fetch organization profile")
  }

  const data = await response.json()
  return Array.isArray(data) ? data[0] : data
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

