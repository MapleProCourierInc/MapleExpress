export const REFUND_STATUSES = [
  "PENDING_APPROVAL",
  "SCHEDULED",
  "PROCESSING",
  "SUCCEEDED",
  "DECLINED",
  "FAILED",
  "UNKNOWN",
  "REJECTED",
  "CANCELLED",
] as const

export const REFUND_WORKFLOW_TYPES = [
  "SYSTEM_REVIEW_REQUIRED",
  "ADMIN_IMMEDIATE",
  "EXTERNAL_RECONCILIATION",
] as const

export const REFUND_DESTINATIONS = ["MONERIS_ORIGINAL_CARD", "BILLING_ACCOUNT_CREDIT"] as const

export const REFUND_REASON_CODES = [
  "PRIORITY_DELIVERY_SLA_BREACH",
  "ORDER_CANCELLED",
  "SERVICE_NOT_PROVIDED",
  "DUPLICATE_CHARGE",
  "OVERCHARGE",
  "CUSTOMER_SERVICE_ADJUSTMENT",
  "ADMIN_ADJUSTMENT",
  "OTHER",
] as const

export const REFUND_PAYMENT_METHOD_TYPES = [
  "CARD_ONLINE",
  "POSTPAY_BILLING_ACCOUNT",
  "PAYMENT_LINK",
  "MANUAL_SETTLEMENT",
] as const

export const REFUND_PAYMENT_STATUSES = [
  "PENDING_USER_ACTION",
  "SUCCESSFUL",
  "FAILED",
  "POSTED_TO_BILLING_ACCOUNT",
  "PARTIALLY_PAID",
  "SETTLED",
  "CANCELLED",
  "EXPIRED",
] as const

export const REFUND_PAYMENT_PROVIDERS = ["MONERIS"] as const

export type RefundStatus = (typeof REFUND_STATUSES)[number]
export type RefundWorkflowType = (typeof REFUND_WORKFLOW_TYPES)[number]
export type RefundDestination = (typeof REFUND_DESTINATIONS)[number]
export type RefundReasonCode = (typeof REFUND_REASON_CODES)[number]
export type RefundPaymentMethodType = (typeof REFUND_PAYMENT_METHOD_TYPES)[number]
export type RefundPaymentStatus = (typeof REFUND_PAYMENT_STATUSES)[number]
export type RefundPaymentProvider = (typeof REFUND_PAYMENT_PROVIDERS)[number]
export type RefundSortDirection = "ASC" | "DESC"
export type RefundSortBy =
  | "requestedAt"
  | "reviewedAt"
  | "completedAt"
  | "proposedAmount"
  | "approvedAmount"
  | "processedAmount"
  | "status"
  | "trackingNumber"
  | "shippingOrderId"
  | "paymentMethodType"

export interface AdminRefundApiError {
  status?: string | number
  message?: string
  errors?: Array<{ field?: string; message?: string }>
}

export interface AdminRefundFilters {
  refundId?: string
  paymentId?: string
  shippingOrderId?: string
  trackingNumber?: string
  payerUserId?: string
  status?: string
  workflowType?: string
  reasonCode?: string
  destination?: string
  paymentMethodType?: string
  paymentProvider?: string
  paymentStatus?: string
  currency?: string
  pricingId?: string
  requestedFrom?: string
  requestedTo?: string
  reviewedFrom?: string
  reviewedTo?: string
  processedFrom?: string
  processedTo?: string
  minProposedAmount?: string
  maxProposedAmount?: string
  minApprovedAmount?: string
  maxApprovedAmount?: string
  requestingActorType?: string
  reviewingAdminId?: string
  policyCode?: string
  policyVersion?: string
  gatewayExecutionBlocked?: string
  search?: string
  page: number
  size: number
  sortBy: RefundSortBy
  sortDirection: RefundSortDirection
}

export interface RefundListItemResponse {
  paymentId: string
  refundId: string
  shippingOrderId?: string | null
  trackingNumber?: string | null
  payerUserId?: string | null
  reasonCode?: RefundReasonCode | string | null
  status?: RefundStatus | string | null
  workflowType?: RefundWorkflowType | string | null
  destination?: RefundDestination | string | null
  paymentMethodType?: RefundPaymentMethodType | string | null
  paymentProvider?: RefundPaymentProvider | string | null
  paymentStatus?: RefundPaymentStatus | string | null
  proposedAmount?: number | null
  approvedAmount?: number | null
  processedAmount?: number | null
  currency?: string | null
  pricingId?: string | null
  requestedAt?: string | null
  reviewedAt?: string | null
  reviewingAdminId?: string | null
  completedAt?: string | null
  monerisResponseCode?: string | null
  monerisMessage?: string | null
  policyCode?: string | null
  policyVersion?: string | null
  approvalAllowed?: boolean | null
  rejectionAllowed?: boolean | null
  refundBranchImplemented?: boolean | null
  gatewayExecutionBlocked?: boolean | null
}

export interface RefundSearchResponse {
  content: RefundListItemResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  sortBy: string
  sortDirection: RefundSortDirection
}

export interface RefundLineItem {
  code?: string | null
  description?: string | null
  amount?: number | null
  taxAmount?: number | null
  totalAmount?: number | null
}

export interface RefundAmountResponse {
  subtotal?: number | null
  taxAmount?: number | null
  totalAmount?: number | null
  lineItems?: RefundLineItem[]
  pricingModelId?: string | null
  pricingModelVersion?: number | null
  calculationSource?: string | null
}

export interface RefundActorResponse {
  actorType?: string | null
  actorId?: string | null
  displayNameSnapshot?: string | null
}

export interface RefundTriggerResponse {
  sourceEventId?: string | null
  sourceType?: string | null
  sourceReferenceId?: string | null
  shippingOrderId?: string | null
  trackingNumber?: string | null
  policyCode?: string | null
  policyVersion?: string | null
  detectedAt?: string | null
  evidence?: Record<string, unknown> | null
}

export interface RefundAuditEventResponse {
  auditEventId?: string | null
  eventType?: string | null
  previousStatus?: string | null
  newStatus?: string | null
  actor?: RefundActorResponse | null
  occurredAt?: string | null
  previousAmount?: number | null
  newAmount?: number | null
  notes?: string | null
  metadata?: Record<string, unknown> | null
}

export interface MonerisRefundRequestSnapshot {
  orderId?: string | null
  originalTransactionNumber?: string | null
  amount?: number | null
  ecommerceIndicator?: string | null
  statusCheck?: boolean | null
}

export interface MonerisRefundReceiptResponse {
  cardType?: string | null
  transactionAmount?: number | null
  refundTransactionNumber?: string | null
  receiptId?: string | null
  transactionType?: string | null
  referenceNumber?: string | null
  responseCode?: string | null
  isoResponseCode?: string | null
  bankTotals?: string | null
  message?: string | null
  authorizationCode?: string | null
  complete?: string | null
  timedOut?: string | null
  transactionDate?: string | null
  transactionTime?: string | null
  ticket?: string | null
  sourcePanLast4?: string | null
}

export interface MonerisRefundAttemptResponse {
  attemptId?: string | null
  sequence?: number | null
  attemptType?: string | null
  outcome?: string | null
  startedAt?: string | null
  completedAt?: string | null
  request?: MonerisRefundRequestSnapshot | null
  receipt?: MonerisRefundReceiptResponse | null
  transportErrorType?: string | null
  transportErrorMessage?: string | null
}

export interface MonerisRefundDetailsResponse {
  originalOrderId?: string | null
  originalTransactionNumber?: string | null
  ecommerceIndicator?: string | null
  processingCountryCode?: string | null
  environment?: string | null
  attempts?: MonerisRefundAttemptResponse[]
}

export interface BillingCreditDetailsResponse {
  billingAccountId?: string | null
  billingAdjustmentId?: string | null
  creditedAmount?: number | null
  creditedAt?: string | null
}

export interface RefundDetailResponse {
  summary?: RefundListItemResponse | null
  customerFacingReason?: string | null
  internalReason?: string | null
  rejectionReason?: string | null
  reviewNotes?: string | null
  proposedAmount?: RefundAmountResponse | null
  approvedAmount?: RefundAmountResponse | null
  trigger?: RefundTriggerResponse | null
  requestedBy?: RefundActorResponse | null
  reviewedBy?: RefundActorResponse | null
  processingStartedAt?: string | null
  moneris?: MonerisRefundDetailsResponse | null
  billingCredit?: BillingCreditDetailsResponse | null
  refundReceiptDocumentId?: string | null
  creditNoteDocumentId?: string | null
  auditTrail?: RefundAuditEventResponse[]
  metadata?: Record<string, unknown> | null
}

export interface ApprovalItem {
  paymentId: string
  refundId: string
  approvedTotalAmount?: number | null
  reviewNotes?: string | null
}

export interface BatchApprovalRequest {
  items: ApprovalItem[]
}

export interface RejectionItem {
  paymentId: string
  refundId: string
  rejectionReason?: string | null
  reviewNotes?: string | null
}

export interface BatchRejectionRequest {
  items: RejectionItem[]
  rejectionReason?: string | null
  reviewNotes?: string | null
}

export interface ManualRefundRequest {
  paymentId: string
  amount: number
  currency?: string | null
  reasonCode?: RefundReasonCode | string | null
  customerFacingReason?: string | null
  internalReason?: string | null
  trackingNumber?: string | null
  shippingOrderId?: string | null
  idempotencyKey?: string | null
  metadata?: Record<string, unknown> | null
}

export interface RefundActionResult {
  paymentId?: string | null
  refundId?: string | null
  outcome?: string | null
  status?: RefundStatus | string | null
  message?: string | null
  approvedAmount?: number | null
  processedAmount?: number | null
  monerisResponseCode?: string | null
  monerisReferenceNumber?: string | null
}

export interface BatchActionResponse {
  results?: RefundActionResult[]
}
