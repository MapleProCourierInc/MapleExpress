export const CONTACT_EMAIL_TYPE_OPTIONS = [
  { value: "SUPPORT_INQUIRIES", label: "Support Inquiries" },
  { value: "GENERAL_INQUIRIES", label: "General Inquiries" },
  { value: "SALES_INQUIRIES", label: "Sales Inquiries" },
  { value: "BILLING_INQUIRIES", label: "Billing Inquiries" },
  { value: "CAREERS", label: "Careers" },
  { value: "PARTNERSHIP_INQUIRIES", label: "Partnership Inquiries" },
  { value: "PRIVACY_REQUESTS", label: "Privacy Requests" },
  { value: "LEGAL_NOTICES", label: "Legal Notices" },
] as const

export const CONTACT_PHONE_TYPE_OPTIONS = [
  { value: "CUSTOMER_SUPPORT", label: "Customer Support" },
  { value: "GENERAL_INQUIRIES", label: "General Inquiries" },
  { value: "SALES_INQUIRIES", label: "Sales Inquiries" },
  { value: "BILLING_INQUIRIES", label: "Billing Inquiries" },
  { value: "DISPATCH", label: "Dispatch" },
  { value: "AFTER_HOURS_SUPPORT", label: "After Hours Support" },
] as const

export const SOCIAL_MEDIA_PLATFORM_OPTIONS = [
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "X", label: "X" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "INDEED", label: "Indeed" },
] as const

export const LEGAL_DOCUMENT_TYPE_OPTIONS = [
  { value: "TERMS_AND_CONDITIONS", label: "Terms and Conditions" },
  { value: "PRIVACY_POLICY", label: "Privacy Policy" },
  { value: "COOKIE_POLICY", label: "Cookie Policy" },
  { value: "REFUND_POLICY", label: "Refund Policy" },
] as const

export const LEGAL_DOCUMENT_STATUSES = ["DRAFT", "SCHEDULED", "ACTIVE", "EXPIRED", "ARCHIVED"] as const

export type ContactEmailType = (typeof CONTACT_EMAIL_TYPE_OPTIONS)[number]["value"]
export type ContactPhoneType = (typeof CONTACT_PHONE_TYPE_OPTIONS)[number]["value"]
export type SocialMediaPlatform = (typeof SOCIAL_MEDIA_PLATFORM_OPTIONS)[number]["value"]
export type LegalDocumentType = (typeof LEGAL_DOCUMENT_TYPE_OPTIONS)[number]["value"]
export type LegalDocumentStatus = (typeof LEGAL_DOCUMENT_STATUSES)[number]

export type PlatformAddress = {
  locationName?: string | null
  addressLine1: string
  addressLine2?: string | null
  city: string
  provinceOrState: string
  postalCode: string
  countryCode: string
  mapUrl?: string | null
  latitude?: number | null
  longitude?: number | null
}

export type ContactEmailResponse = {
  type: ContactEmailType
  displayName?: string | null
  value?: string | null
}

export type ContactPhoneResponse = {
  type: ContactPhoneType
  displayName?: string | null
  value?: string | null
}

export type ContactConfigurationResponse = {
  emails?: ContactEmailResponse[] | null
  phones?: ContactPhoneResponse[] | null
  location?: PlatformAddress | null
}

export type SocialMediaProfileRequest = {
  profileUrl: string
  handle?: string | null
  enabled?: boolean | null
  displayOrder?: number | null
}

export type AdminSocialMediaProfileResponse = SocialMediaProfileRequest & {
  platform: SocialMediaPlatform
  displayName?: string | null
}

export type AdminLegalDocumentResponse = {
  legalDocumentId: string
  documentType: LegalDocumentType
  displayName?: string | null
  title?: string | null
  documentUrl?: string | null
  policyVersion?: number | null
  status?: LegalDocumentStatus | null
  activeFrom?: string | null
  activeUntil?: string | null
  current?: boolean | null
  changeSummary?: string | null
  createdAt?: string | null
  createdBy?: string | null
  updatedAt?: string | null
  updatedBy?: string | null
  activatedAt?: string | null
  activatedBy?: string | null
  archivedAt?: string | null
  archivedBy?: string | null
}

export type AdminPlatformConfigurationResponse = {
  id?: string | null
  mongoVersion?: number | null
  createdAt?: string | null
  updatedAt?: string | null
  updatedBy?: string | null
  contact?: ContactConfigurationResponse | null
  socialMediaProfiles?: AdminSocialMediaProfileResponse[] | null
  legalDocuments?: AdminLegalDocumentResponse[] | null
}

export type UpdateContactConfigurationRequest = {
  emails?: Partial<Record<ContactEmailType, string>>
  phones?: Partial<Record<ContactPhoneType, string>>
  location: PlatformAddress
}

export type UpdateSocialMediaConfigurationRequest = {
  profiles?: Partial<Record<SocialMediaPlatform, SocialMediaProfileRequest>>
}

export type CreateLegalDocumentVersionRequest = {
  documentType: LegalDocumentType
  title: string
  documentUrl: string
  changeSummary?: string | null
}

export type UpdateLegalDocumentDraftRequest = {
  title?: string
  documentUrl?: string
  changeSummary?: string | null
}

export type ActivateLegalDocumentRequest = {
  activeFrom?: string | null
  activeUntil?: string | null
}

export type PlatformConfigurationApiError = {
  status?: string
  message?: string
  errors?: Array<{ field?: string; message?: string }>
  errorDetails?: Record<string, unknown> | null
}
