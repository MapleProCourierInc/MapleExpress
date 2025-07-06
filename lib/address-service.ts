import type { Address } from "@/types/address"

// Get all addresses for a user
export async function getAddresses(
  userId: string,
  userType: string,
): Promise<Address[]> {
  const accessToken = localStorage.getItem("maplexpress_access_token")

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  const response = await fetch(
    `/api/profile/address?userId=${userId}&userType=${userType}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to fetch addresses")
  }

  return response.json()
}

// Create a new address
export async function createAddress(
  userId: string,
  addressData: Omit<Address, "addressId">,
  userType: string,
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
      body: JSON.stringify({
        userId,
        userType,
        ...addressData,
      }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to create address")
  }

  return response.json()
}

// Update an address
export async function updateAddress(
  userId: string,
  addressData: Address,
  userType: string,
): Promise<Address> {
  const accessToken = localStorage.getItem("maplexpress_access_token")

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  const response = await fetch("/api/profile/address", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        userId,
        userType,
        ...addressData,
      }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to update address")
  }

  return response.json()
}

// Delete an address
export async function deleteAddress(
  userId: string,
  addressId: string,
  userType: string,
): Promise<boolean> {
  const accessToken = localStorage.getItem("maplexpress_access_token")

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  const response = await fetch(
    `/api/profile/address?userId=${userId}&addressId=${addressId}&userType=${userType}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to delete address")
  }

  return true
}

