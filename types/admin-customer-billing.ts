export type OwnerType = "INDIVIDUAL" | "ORGANIZATION"

export type ProfileAddress = {
  street?: string
  city?: string
  province?: string
  postalCode?: string
  country?: string
  [key: string]: unknown
}

export type BillingAccount = {
  billingAccountId?: string | null
}

export type RelatedParty = {
  relatedPartyId?: string
  type?: string
}

export type PointOfContact = {
  name?: string
  position?: string
  email?: string
  phone?: string
}

export type PayLaterConfigurationEntity = {
  paymentTerms?: "PREPAID" | "MONTHLY_INVOICE"
  activationStatus?: "DISABLED" | "PENDING_BILLING_ACCOUNT" | "ACTIVE" | "FAILED"
  billingAccountId?: string | null
  enabledByAdminUserId?: string
  enabledAt?: string
  reason?: string
  notes?: string
  lastUpdatedAt?: string
}

export type ProfileBillingConfigurationResponse = {
  ownerType: OwnerType
  ownerId: string
  paymentTerms: "PREPAID" | "MONTHLY_INVOICE"
  activationStatus: "DISABLED" | "PENDING_BILLING_ACCOUNT" | "ACTIVE" | "FAILED"
  billingAccountId?: string | null
  payLaterEligible?: boolean
  message?: string
}

export type IndividualProfile = {
  id: string
  userId: string
  status?: string
  email?: string
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  type?: string
  address?: ProfileAddress[]
  phone?: string
  phoneNumberVerified?: boolean
  createdAt?: string
  updatedAt?: string
  relatedParty?: RelatedParty
  billingAccount?: BillingAccount
  discounts?: Array<Record<string, unknown>>
  extensions?: Record<string, unknown>
  billingConfiguration?: ProfileBillingConfigurationResponse | null
  payLaterConfiguration?: PayLaterConfigurationEntity | null
}

export type OrganizationProfile = {
  id: string
  userId: string
  status?: string
  name?: string
  registrationNumber?: string
  taxID?: string
  industry?: string
  address?: ProfileAddress[]
  phone?: string
  email?: string
  website?: string
  createdAt?: string
  updatedAt?: string
  pointOfContact?: PointOfContact
  billingAccount?: BillingAccount
  discounts?: Array<Record<string, unknown>>
  extensions?: Record<string, unknown>
  billingConfiguration?: ProfileBillingConfigurationResponse | null
  payLaterConfiguration?: PayLaterConfigurationEntity | null
}

export type PageResponse<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type AdminEnablePayLaterRequest = {
  ownerType: OwnerType
  ownerId: string
  reason: string
  notes?: string
}

export type AdminUpdatePostpayStatusRequest = {
  ownerType: OwnerType
  ownerId: string
  action: "ENABLE" | "DISABLE"
  reason: string
  notes?: string
}

export type AdminCustomerBillingRow = {
  id: string
  userId: string
  ownerType: OwnerType
  displayName: string
  email: string
  phone: string
  status: string
  postpayStatus: "DISABLED" | "PENDING_BILLING_ACCOUNT" | "ACTIVE" | "FAILED"
  updatedAt?: string
}

export type AdminCustomerProfileListFilters = {
  ownerType: Lowercase<OwnerType>
  email?: string
  userId?: string
  type?: string
  name?: string
  industry?: string
  page: number
  size: number
}

export type ApiErrorResponse = {
  status?: string
  message?: string
  errors?: Array<{ field?: string; message?: string }>
  errorDetails?: {
    errorCode?: number
    errorType?: string
    characteristics?: Record<string, string>
  }
}
