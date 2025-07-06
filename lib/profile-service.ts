import type { IndividualProfile, OrganizationProfile } from "@/types/profile"
import { PROFILE_SERVICE_URL, getEndpointUrl } from "@/lib/config"   // ← updated path


function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()!.split(";").shift() || null
  }
  return null
}

// Get individual profile
export async function getIndividualProfile(userId: string): Promise<IndividualProfile> {
  const accessToken =
    getCookie("accessToken") ||
    getCookie("maplexpress_access_token") ||
    localStorage.getItem("maplexpress_access_token")

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  const response = await fetch(`/api/profile/individual?userId=${userId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to fetch individual profile")
  }

  return response.json()
}

// Get organization profile
export async function getOrganizationProfile(userId: string): Promise<OrganizationProfile> {
  const accessToken =
    getCookie("accessToken") ||
    getCookie("maplexpress_access_token") ||
    localStorage.getItem("maplexpress_access_token")

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  const response = await fetch(`/api/profile/organization?userId=${userId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

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
  const accessToken =
    getCookie("accessToken") ||
    getCookie("maplexpress_access_token") ||
    localStorage.getItem("maplexpress_access_token")

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  const response = await fetch(
    `/api/profile/individual?email=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
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
  const accessToken =
    getCookie("accessToken") ||
    getCookie("maplexpress_access_token") ||
    localStorage.getItem("maplexpress_access_token")

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  const response = await fetch(
    `/api/profile/organization?email=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
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
  const accessToken =
    getCookie("accessToken") ||
    getCookie("maplexpress_access_token") ||
    localStorage.getItem("maplexpress_access_token")

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  const response = await fetch(`/api/profile/individual/update`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
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
  const accessToken =
    getCookie("accessToken") ||
    getCookie("maplexpress_access_token") ||
    localStorage.getItem("maplexpress_access_token")

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  const response = await fetch(`/api/profile/organization/update`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
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
  const accessToken =
      getCookie("accessToken") ||
      getCookie("maplexpress_access_token") ||
      localStorage.getItem("maplexpress_access_token")

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  /** ------------------------------------------------------
   * Build the full endpoint:
   *   {PROFILE_SERVICE_URL}/profile/individual/user/{userId}
   * ----------------------------------------------------- */
  const endpoint = getEndpointUrl(
      PROFILE_SERVICE_URL,
      `/profile/individual/user/${encodeURIComponent(userId)}`,
  )

  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ phone }),
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
  const accessToken =
      getCookie("accessToken") ||
      getCookie("maplexpress_access_token") ||
      localStorage.getItem("maplexpress_access_token")

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  /* Build full endpoint URL */
  const endpoint = getEndpointUrl(
      PROFILE_SERVICE_URL,
      `/profile/organization/user/${encodeURIComponent(userId)}`,
  )

  const payload = {
    registrationNumber: formData.registrationNumber || null,
    taxId: formData.taxID || null,
    industry: formData.industry || null,
    phone: formData.phone || null,
    websiteUrl: formData.website || null,
    pointOfContactName: formData.pointOfContact.name || null,
    pointOfContactPosition: formData.pointOfContact.position || null,
    pointOfContactEmail: formData.pointOfContact.email || null,
    pointOfContactPhone: formData.pointOfContact.phone || null,
  }

  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
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
  const accessToken =
    getCookie("accessToken") ||
    getCookie("maplexpress_access_token") ||
    localStorage.getItem("maplexpress_access_token")

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  const response = await fetch(`/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
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

