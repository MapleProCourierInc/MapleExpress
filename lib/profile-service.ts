import type { IndividualProfile, OrganizationProfile } from "@/types/profile"

// Get individual profile
export async function getIndividualProfile(userId: string): Promise<IndividualProfile> {
  const accessToken = localStorage.getItem("maplexpress_access_token")

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
  const accessToken = localStorage.getItem("maplexpress_access_token")

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
  const accessToken = localStorage.getItem("maplexpress_access_token")

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
  const accessToken = localStorage.getItem("maplexpress_access_token")

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
  const accessToken = localStorage.getItem("maplexpress_access_token")

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
  const accessToken = localStorage.getItem("maplexpress_access_token")

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

// Change password
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  const accessToken = localStorage.getItem("maplexpress_access_token")

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
      userId,
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

