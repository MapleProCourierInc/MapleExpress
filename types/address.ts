export type Address = {
  addressId: string
  fullName: string
  company?: string
  streetAddress: string
  addressLine2?: string
  city: string
  province: string
  postalCode: string
  country: string
  phoneNumber: string
  deliveryInstructions?: string
  addressType: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  isPrimary: boolean
}

