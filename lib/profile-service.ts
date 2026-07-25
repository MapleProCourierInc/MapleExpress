import type { IndividualProfile, OrganizationProfile } from "@/types/profile"
import type { ProfileBillingAddress } from "@/types/profile-billing-address"
import { apiFetch } from "@/lib/client-api"

interface ProfilePage<T> {
  items?: T[]
}

async function readProfileResponse<T>(response: Response, message: string): Promise<T> {
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || message)
  }

  const profile = Array.isArray(data?.items)
    ? (data as ProfilePage<T>).items?.[0]
    : Array.isArray(data)
      ? data[0]
      : data

  if (!profile) {
    throw new Error(message)
  }

  return profile as T
}

export async function getIndividualProfile(): Promise<IndividualProfile> {
  const response = await apiFetch("/api/profile/individual", {
    headers: {
      Accept: "application/json",
    },
  })

  return readProfileResponse<IndividualProfile>(response, "Failed to fetch individual profile")
}

export async function getOrganizationProfile(): Promise<OrganizationProfile> {
  const response = await apiFetch("/api/profile/organization", {
    headers: {
      Accept: "application/json",
    },
  })

  return readProfileResponse<OrganizationProfile>(response, "Failed to fetch organization profile")
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
    taxID: formData.taxID || null,
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

export async function updateProfileTaxID(taxID: string): Promise<IndividualProfile | OrganizationProfile> {
  const response = await apiFetch("/api/profile/tax-id", {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ taxID }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || "Failed to update GST registration number")
  }

  return data as IndividualProfile | OrganizationProfile
}

export async function getProfileBillingAddress(): Promise<ProfileBillingAddress | null> {
  const response = await apiFetch("/api/profile/billing-address", {
    headers: {
      Accept: "application/json",
    },
  })

  if (response.status === 404) {
    return null
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || "Failed to load billing address")
  }

  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return null
  }

  return data as ProfileBillingAddress
}

export async function updateProfileBillingAddress(
  billingAddress: ProfileBillingAddress,
): Promise<ProfileBillingAddress> {
  const response = await apiFetch("/api/profile/billing-address", {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(billingAddress),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || "Failed to save billing address")
  }

  return data && typeof data === "object" ? (data as ProfileBillingAddress) : billingAddress
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

