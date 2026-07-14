export type DriverProfileStatus =
  | "DRIVER_LICENSE_MISSING"
  | "DRIVER_LICENSE_EXPIRED"
  | "PROOF_OF_WORK_ELIGIBILITY_MISSING"
  | "PROOF_OF_WORK_ELIGIBILITY_EXPIRED"
  | "BACKGROUND_CHECK_MISSING"
  | "RCMP_BACKGROUND_CHECK_MISSING"
  | "PROFILE_COMPLETE"
  | "PENDING_PROFILE_COMPLETION"
  | "PENDING_DRIVER_HEADSHOT"
  | "SUSPENDED"
  | "LICENSE_EXPIRED"
  | "PENDING_ACTIVE_DRIVING_LICENSE_ADMIN_APPROVAL"
  | "PENDING_ADMIN_VERIFICATION"
  | "TERMINATED"
  | "ACTIVE"

export type DriverDocumentImage = {
  imageUrl?: string | null
  imageName?: string | null
  imageType?: string | null
}

export type DocumentVerification = {
  status?: string | null
  method?: string | null
  verifiedBy?: string | null
  verifiedAt?: string | null
  notes?: string | null
}

export type DriverLicense = {
  licenseImageFront?: string | null
  licenseImageBack?: string | null
  licenseNumber?: string | null
  issueDate?: string | null
  expiryDate?: string | null
  issuingProvince?: string | null
  licenseClass?: string | null
  restrictions?: string | null
  status?: string | null
  verification?: DocumentVerification | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type WorkEligibilityVerification = DocumentVerification

export type WorkEligibilityDocImage = {
  imageType?: string | null
  imageUrl?: string | null
  timestamp?: string | null
}

export type WorkEligibilityDocument = {
  documentId?: string | null
  documentType?: string | null
  documentNumber?: string | null
  holderFullName?: string | null
  issuingCountry?: string | null
  issuingAuthority?: string | null
  issueDate?: string | null
  expiryDate?: string | null
  status?: string | null
  attributes?: Record<string, string> | null
  images?: WorkEligibilityDocImage[] | null
  verification?: WorkEligibilityVerification | null
  isPrimary?: boolean | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type BackgroundCheckDocument = {
  documentId?: string | null
  documentType?: string | null
  documentNumber?: string | null
  holderFullName?: string | null
  issuingAuthority?: string | null
  issueDate?: string | null
  expiryDate?: string | null
  status?: string | null
  attributes?: Record<string, string> | null
  images?: WorkEligibilityDocImage[] | null
  verification?: DocumentVerification | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type AvailabilitySlot = {
  dayOfWeek?: string | null
  startTime?: string | null
  endTime?: string | null
  note?: string | null
}

export type WeeklyAvailability = {
  isoYear?: number | null
  isoWeek?: number | null
  weekStartDate?: string | null
  weekEndDate?: string | null
  source?: string | null
  slots?: AvailabilitySlot[] | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type DriverReview = {
  reviewText?: string | null
  rating?: number | null
  reviewerName?: string | null
  timestamp?: string | null
}

export type DriverRatingSummary = {
  averageRating?: number | null
  totalRatings?: number | null
  reviews?: DriverReview[] | null
}

export type DriverAnalytics = {
  totalDeliveries?: number | null
  totalDistanceTravelledKm?: number | null
  lastOrderCompletedAt?: string | null
  firstOrderCompletedAt?: string | null
}

export type DriverImageEntity = {
  imageType?: string | null
  imageUrl?: string | null
  timestamp?: string | null
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
  gender?: string | null
  dob?: string | null
  lastLoginAt?: string | null
  backgroundCheck?: BackgroundCheckDocument | null
  driverLicenses?: DriverLicense[] | null
  workEligibilityDocuments?: WorkEligibilityDocument[] | null
  driverImages?: DriverImageEntity[] | null
  weeklyAvailability?: WeeklyAvailability[] | null
  ratingSummary?: DriverRatingSummary | null
  analytics?: DriverAnalytics | null
  adminNotes?: string | null
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

export type AdminDocumentReviewAction = "APPROVED" | "REJECTED"

export type DriverLicenseApprovalRequestDto = {
  licenseNumber: string
  action: AdminDocumentReviewAction
  reason: string
  notes?: string
}

export type DriverWorkEligibilityApprovalRequestDto = {
  documentId: string
  action: AdminDocumentReviewAction
  reason: string
  notes?: string
}

export type DriverBackgroundCheckApprovalRequestDto = {
  documentId: string
  action: AdminDocumentReviewAction
  reason: string
  notes?: string
}

export type AdminDocumentApprovalResponseDto = {
  driverId?: string
  identifier?: string
  status?: string
  updatedAt?: string
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

export type AdminInviteDriverRequest = {
  email: string
  firstName: string
  lastName: string
  phone: string
  dob: string
  companyName: string
  station: string
}

export type AdminInviteDriverResponse = {
  driverId: string
  email: string
  profileStatus: DriverProfileStatus | string
  message?: string
  createdAt: string
}
