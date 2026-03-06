import type { Address } from "@/types/address"

type AddressInput = Omit<Address, "addressId" | "isPrimary"> & { isPrimary?: boolean }

// Get all addresses for a user
export async function getAddresses(): Promise<Address[]> {
  const accessToken = localStorage.getItem("maplexpress_access_token")

  if (!accessToken) {
    throw new Error("Not authenticated")
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
  const accessToken = localStorage.getItem("maplexpress_access_token")

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
  const accessToken = localStorage.getItem("maplexpress_access_token")

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
  const accessToken = localStorage.getItem("maplexpress_access_token")

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
