export const PUBLIC_CONTACT_EMAIL_TYPES = [
  "SUPPORT_INQUIRIES",
  "GENERAL_INQUIRIES",
  "SALES_INQUIRIES",
  "BILLING_INQUIRIES",
  "CAREERS",
  "PARTNERSHIP_INQUIRIES",
  "PRIVACY_REQUESTS",
  "LEGAL_NOTICES",
] as const

export const PUBLIC_CONTACT_PHONE_TYPES = [
  "CUSTOMER_SUPPORT",
  "GENERAL_INQUIRIES",
  "SALES_INQUIRIES",
  "BILLING_INQUIRIES",
  "DISPATCH",
  "AFTER_HOURS_SUPPORT",
] as const

export const PUBLIC_SOCIAL_MEDIA_PLATFORMS = [
  "FACEBOOK",
  "INSTAGRAM",
  "LINKEDIN",
  "X",
  "YOUTUBE",
  "TIKTOK",
  "WHATSAPP",
  "INDEED",
] as const

export const PUBLIC_LEGAL_DOCUMENT_TYPES = [
  "TERMS_AND_CONDITIONS",
  "PRIVACY_POLICY",
  "COOKIE_POLICY",
  "REFUND_POLICY",
] as const

export type PublicContactEmailType = (typeof PUBLIC_CONTACT_EMAIL_TYPES)[number]
export type PublicContactPhoneType = (typeof PUBLIC_CONTACT_PHONE_TYPES)[number]
export type PublicSocialMediaPlatform = (typeof PUBLIC_SOCIAL_MEDIA_PLATFORMS)[number]
export type PublicLegalDocumentType = (typeof PUBLIC_LEGAL_DOCUMENT_TYPES)[number]

export type PublicPlatformAddress = {
  locationName?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  provinceOrState?: string | null
  postalCode?: string | null
  countryCode?: string | null
  mapUrl?: string | null
  latitude?: number | null
  longitude?: number | null
}

export type PublicContactEmail = {
  type: PublicContactEmailType
  displayName?: string | null
  value?: string | null
}

export type PublicContactPhone = {
  type: PublicContactPhoneType
  displayName?: string | null
  value?: string | null
}

export type PublicContactConfiguration = {
  emails?: PublicContactEmail[] | null
  phones?: PublicContactPhone[] | null
  location?: PublicPlatformAddress | null
}

export type PublicSocialMediaProfile = {
  platform: PublicSocialMediaPlatform
  displayName?: string | null
  profileUrl?: string | null
  handle?: string | null
  displayOrder?: number | null
}

export type PublicLegalDocument = {
  legalDocumentId: string
  documentType: PublicLegalDocumentType
  displayName?: string | null
  title?: string | null
  documentUrl?: string | null
  policyVersion?: number | null
  activeFrom?: string | null
  activeUntil?: string | null
}

export type PublicPlatformConfiguration = {
  contact?: PublicContactConfiguration | null
  socialMediaProfiles?: PublicSocialMediaProfile[] | null
  legalDocuments?: PublicLegalDocument[] | null
}

export type PublicPlatformConfigurationApiError = {
  status?: string
  message?: string
  errors?: Array<{ field?: string; message?: string }>
  errorDetails?: Record<string, unknown> | null
}
