export type PricingV2Status = "DRAFT" | "ACTIVE" | "EXPIRED" | "ARCHIVED"
export type PricingV2Type = "GLOBAL" | "CUSTOMER_SPECIFIC"
export type PricingV2RoundingMode = "HALF_UP" | "CEILING" | "FLOOR"
export type PricingV2PercentageBase = "SUBTOTAL" | "BASE_PACKAGE_PRICE" | "DISTANCE_CHARGE" | "PRE_TAX_TOTAL"

export interface PricingV2PackageSlab {
  slabCode: string
  displayName: string
  enabled: boolean
  tierOrder: number
  minChargeableWeightKgExclusive: number | null
  maxChargeableWeightKg: number | null
  minDimensionSumCmExclusive: number | null
  maxDimensionSumCm: number | null
  basePrice: number
}

export interface PricingV2DistanceSlab {
  slabCode: string
  displayName: string
  enabled: boolean
  fromKmExclusive: number | null
  toKmInclusive: number | null
  calculationType: "FLAT" | "PER_KM"
  rate: number
}

export interface PricingV2Surcharge {
  surchargeCode: string
  displayName: string
  description: string | null
  enabled: boolean
  triggerType: "ALWAYS" | "SERVICE_TYPE" | "TIME_WINDOW"
  triggerValue: string | null
  startTime: string | null
  endTime: string | null
  timezone: string | null
  calculationType: "FLAT" | "PERCENTAGE"
  amount: number | null
  percentage: number | null
  percentageBase: PricingV2PercentageBase | null
}

export interface PricingV2Tax {
  taxCode: string
  displayName: string
  enabled: boolean
  calculationType: "PERCENTAGE"
  percentage: number
  percentageBase: PricingV2PercentageBase
}

export interface CreatePricingV2Request {
  name: string
  description: string | null
  status: "DRAFT"
  pricingType: PricingV2Type
  ownerId: string | null
  zoneCode: string
  zoneDisplayName: string | null
  currency: string
  effectiveFrom: string | null
  effectiveTo: string | null
  dimensionalWeight: {
    enabled: boolean
    displayName: string | null
    unit: "CM" | "INCH"
    divisor: number
    roundingScale: number
    roundingMode: PricingV2RoundingMode
  }
  chargeableWeight: {
    enabled: boolean
    displayName: string | null
    calculationType: "MAX_OF_ACTUAL_AND_DIMENSIONAL"
  }
  packageSlabs: PricingV2PackageSlab[]
  distancePricing: {
    enabled: boolean
    displayName: string | null
    includedDistanceKm: number
    distanceSlabs: PricingV2DistanceSlab[]
  }
  surcharges: PricingV2Surcharge[]
  taxes: PricingV2Tax[]
  customQuoteRules: {
    enabled: boolean
    maxStandardDistanceKm: number | null
    distanceExceededMessage: string | null
  } | null
  rounding: {
    moneyScale: number
    moneyRoundingMode: PricingV2RoundingMode
    measurementScale: number
    measurementRoundingMode: PricingV2RoundingMode
  }
}

export interface PricingV2Model extends Omit<CreatePricingV2Request, "status"> {
  id: string
  version: number
  status: PricingV2Status
  isLatest: boolean
  audit?: {
    createdBy?: string | null
    createdAt?: string | null
    updatedBy?: string | null
    updatedAt?: string | null
  } | null
}

export interface PricingV2Page {
  content: PricingV2Model[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface PricingApiError {
  status?: string
  message?: string
  errors?: Array<{ field?: string; message?: string }>
}
