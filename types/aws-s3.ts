export type S3UploadType =
  | "DRIVER_LICENSE_FRONT"
  | "DRIVER_LICENSE_BACK"
  | "PROOF_OF_WORK_CONTRACT"
  | "PROOF_OF_WORK_PAYSTUB"
  | "PROOF_OF_WORK_DOCUMENT"
  | "PROFILE_PHOTO"
  | "BACKGROUND_CHECK"
  | "DELIVERY_RELATED_IMAGE"
  | "TERMS_AND_CONDITIONS"
  | "PRIVACY_POLICY"
  | "COOKIE_POLICY"
  | "REFUND_POLICY"

export type PresignV2Request = {
  uploadType: S3UploadType
  fulfilmentStatus?: string
  shippingOrderId?: string
  trackingNumber?: string
  count?: number
  defaultContentType?: string
  files?: Array<{ contentType: string }>
}

export type PresignV2Item = {
  key: string
  presignedPutUrl: string
  expiresAt?: string
  expiresInSeconds?: number
  maxSizeBytes?: number | null
  contentType?: string | null
}

export type PresignV2Response = {
  uploadId?: string
  items?: PresignV2Item[]
}

export type PresignViewItem = {
  key: string
  presignedGetUrl: string
  expiresAt?: string
  expiresInSeconds?: number
}

export type PresignViewResponse = {
  items?: PresignViewItem[]
}

export type AwsIntegrationApiError = {
  status?: string
  message?: string
  errors?: Array<{ field?: string; message?: string }>
}
