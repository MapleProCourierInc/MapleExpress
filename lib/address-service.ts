import type { Address } from "@/types/address"

type AddressInput = Omit<Address, "addressId" | "isPrimary"> & { isPrimary?: boolean }

async function getErrorMessage(response: Response, fallback: string) {
  const text = await response.text()
  if (!text) {
    return fallback
  }

  try {
    const data = JSON.parse(text)
    return data.message || fallback
  } catch {
    return fallback
  }
}

// Get all addresses for a user
export async function getAddresses(): Promise<Address[]> {
  const response = await fetch("/api/profile/address")

  if (!response.ok) {
    const message = await getErrorMessage(response, "Failed to fetch addresses")
    throw new Error(message)
  }

  return response.json()
}

// Create a new address
export async function createAddress(
  addressData: AddressInput,
): Promise<Address> {
  const response = await fetch("/api/profile/address", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(addressData),
  })

  if (!response.ok) {
    const message = await getErrorMessage(response, "Failed to create address")
    throw new Error(message)
  }

  return response.json()
}

// Update an address
export async function updateAddress(
  addressId: string,
  addressData: AddressInput,
): Promise<Address> {
  const response = await fetch(`/api/profile/address/${addressId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(addressData),
  })

  if (!response.ok) {
    const message = await getErrorMessage(response, "Failed to update address")
    throw new Error(message)
  }

  return response.json()
}

// Delete an address
export async function deleteAddress(
  addressId: string,
): Promise<boolean> {
  const response = await fetch(`/api/profile/address/${addressId}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const message = await getErrorMessage(response, "Failed to delete address")
    throw new Error(message)
  }

  return true
}
