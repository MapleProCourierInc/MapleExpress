export type DriverProfileStatus =
  | "DRIVER_LICENSE_MISSING"
  | "PROOF_OF_WORK_ELIGIBILITY_MISSING"
  | "BACKGROUND_CHECK_MISSING"
  | "PROFILE_COMPLETE"
  | "PENDING_PROFILE_COMPLETION"
  | "SUSPENDED"
  | "LICENSE_EXPIRED"
  | "PENDING_ADMIN_VERIFICATION"
  | "TERMINATED"
  | "ACTIVE"

export type DriverDocumentImage = {
  imageUrl?: string
  imageName?: string
  imageType?: string
}

export type DriverLicense = {
  licenseNumber?: string
  licenseClass?: string
  issuingCountry?: string
  issuingRegion?: string
  issuedAt?: string
  expiresAt?: string
  frontImageUrl?: string
  backImageUrl?: string
  verificationStatus?: string
}

export type WorkEligibilityDocument = {
  documentType?: string
  documentNumber?: string
  issuedAt?: string
  expiresAt?: string
  issuingCountry?: string
  issuingRegion?: string
  imageUrls?: string[]
  verificationStatus?: string
}

export type WeeklyAvailability = Record<string, Array<{ start?: string; end?: string }>>

export type DriverRatingSummary = {
  averageRating?: number
  totalRatings?: number
  onTimeScore?: number
  safetyScore?: number
  customerSatisfaction?: number
}

export type DriverAnalytics = {
  completedTrips?: number
  cancelledTrips?: number
  totalDistanceKm?: number
  activeDays?: number
  [key: string]: string | number | boolean | null | undefined
}

export type AdminDriverItem = {
  driverId: string
  userId: string
  email: string
  firstName: string
  lastName: string
  phone: string
  station: string
  companyName: string
  profileStatus: DriverProfileStatus | string
  createdAt: string
  updatedAt: string
  isVerified: boolean
  backgroundCheckStatus: string
}

export type DriverDetailsDto = AdminDriverItem & {
  middleName?: string
  gender?: string
  dob?: string
  lastLoginAt?: string
  driverImages?: string[]
  licenses?: DriverLicense[]
  workEligibilityDocuments?: WorkEligibilityDocument[]
  weeklyAvailability?: WeeklyAvailability
  ratingSummary?: DriverRatingSummary
  analytics?: DriverAnalytics
  adminNotes?: string
  address?: Array<{
    streetAddress?: string
    city?: string
    province?: string
    postalCode?: string
    country?: string
  }>
}

export type DriverActionRequestDto = {
  reason: string
  notes?: string
}

export type DriverActionResponseDto = {
  driverId: string
  profileStatus: DriverProfileStatus | string
  updatedAt: string
  message?: string
}

export type AdminDriversResponse = {
  items: AdminDriverItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type ApiErrorResponse = {
  status?: string
  message?: string
  errors?: Array<{
    field?: string
    message?: string
  }>
  errorDetails?: {
    errorCode?: number
    errorType?: string
    characteristics?: Record<string, string>
  }
}

export type AdminDriversQuery = {
  email?: string
  name?: string
  station?: string
  companyName?: string
  profileStatus?: string
  page: number
  size: number
}
