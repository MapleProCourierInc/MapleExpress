export type PriorityCalculationMethod = "percentage" | "flat" | "Percentage" | "Flat"

export interface PricingDistanceCharge {
  ratePerKm: number
}

export interface PricingWeightCharge {
  ratePerKg: number
}

export interface PricingDimensionalWeightCharge {
  ratePerKg: number
  conversionFactor: number
  unit: string
}

export interface PricingPrioritySurcharge {
  calculationMethod: PriorityCalculationMethod
  surcharge: number
}

export interface PricingTax {
  taxType: string
  taxRate: number
}

export interface PricingModel {
  pricingId: string
  basePrice: number
  distanceCharge: PricingDistanceCharge
  weightCharge: PricingWeightCharge
  dimensionalWeightCharge: PricingDimensionalWeightCharge
  prioritySurcharge: PricingPrioritySurcharge
  taxes: PricingTax[]
  isLatest: boolean
  createdOn: string
  expiredOn?: string | null
}

export interface CreatePricingModelRequest {
  basePrice: number
  distanceCharge: PricingDistanceCharge
  weightCharge: PricingWeightCharge
  dimensionalWeightCharge: PricingDimensionalWeightCharge
  prioritySurcharge: PricingPrioritySurcharge
  taxes: PricingTax[]
  isLatest: boolean
}

export interface PricingApiError {
  status?: string
  message?: string
  errors?: Array<{
    field?: string
    message?: string
  }>
  errorDetails?: {
    errorType?: string
    errorCode?: number
  }
}
