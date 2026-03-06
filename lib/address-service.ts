import type { Address } from "@/types/address"

type AddressInput = Omit<Address, "addressId" | "isPrimary"> & { isPrimary?: boolean }

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)

  if (parts.length === 2) {
    return parts.pop()!.split(";").shift() || null
  }

  return null
}

function getAccessToken() {
  return (
    localStorage.getItem("maplexpress_access_token") ||
    getCookie("accessToken") ||
    getCookie("maplexpress_access_token")
  )
}

// Get all addresses for a user
export async function getAddresses(): Promise<Address[]> {
  const accessToken = getAccessToken()

  if (!accessToken) {
    return []
  }

  const response = await fetch("/api/profile/address", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to fetch addresses")
  }

  return response.json()
}

// Create a new address
export async function createAddress(
  addressData: AddressInput,
): Promise<Address> {
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  const response = await fetch("/api/profile/address", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(addressData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to create address")
  }

  return response.json()
}

// Update an address
export async function updateAddress(
  addressId: string,
  addressData: AddressInput,
): Promise<Address> {
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  const response = await fetch(`/api/profile/address/${addressId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(addressData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to update address")
  }

  return response.json()
}

// Delete an address
export async function deleteAddress(
  addressId: string,
): Promise<boolean> {
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  const response = await fetch(`/api/profile/address/${addressId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to delete address")
  }

  return true
}
