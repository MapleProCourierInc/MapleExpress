export type PublicRateAddress = {
  streetAddress: string
  addressLine2?: string | null
  city: string
  province: string
  postalCode: string
  country: string
}

export type PublicRateDimensions = {
  length: number
  width: number
  height: number
}

export type PublicRateEstimateRequest = {
  pickupAddress: PublicRateAddress
  deliveryAddress: PublicRateAddress
  weightKg: number
  dimensionsCm: PublicRateDimensions
  signatureRequired?: boolean | null
}

export type PublicRatePricing = {
  currency?: string
  customQuoteRequired?: boolean
  customQuoteReason?: string | null
  charges?: Record<string, number>
}

export type PublicRateOption = {
  serviceLevel: "STANDARD" | "PRIORITY" | string
  available: boolean
  pricing: PublicRatePricing
}

export type PublicRateEstimateResponse = {
  distanceKm: number
  options: PublicRateOption[]
}

export type PublicRateErrorResponse = {
  message?: string
  detail?: string
  title?: string
}
