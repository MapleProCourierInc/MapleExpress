import { apiFetch } from "@/lib/client-api"

export interface BillingAccount {
  billingAccountId: string
  billingMode?: string | null
  ownerId?: string | null
  ownerType?: string | null
  status?: string | null
  email?: string | null
  billingCycle?: string | null
  currency?: string | null
  lastBilledDate?: string | null
  nextBillingDate?: string | null
}

export interface BillingSummary {
  balanceDue: number
  currentUnbilledAmount: number
  creditBalance: number
  totalPayableNow: number
  currency: string
  hasOutstandingBalance: boolean
  hasUnbilledCharges: boolean
  hasCredit: boolean
  balanceStatusLabel?: string | null
}

export interface BillingInvoice {
  invoiceId: string
  invoiceNumber?: string | null
  invoiceS3Key?: string | null
  invoiceDocumentUrl?: string | null
  invoiceDocumentStatus?: string | null
  billingPeriodStart?: string | null
  billingPeriodEnd?: string | null
  previousBalance?: number | null
  newChargesAmount?: number | null
  subtotal?: number | null
  taxAmount?: number | null
  totalAmount?: number | null
  creditApplied?: number | null
  amountPaid?: number | null
  amountDue?: number | null
  totalAccountBalanceDue?: number | null
  currency?: string | null
  status?: string | null
  generatedAt?: string | null
  dueDate?: string | null
  sentAt?: string | null
  paidAt?: string | null
  lineItemCount?: number | null
  downloadable?: boolean | null
  payable?: boolean | null
  overdue?: boolean | null
}

export interface BillingUnbilledCharge {
  chargeId: string
  shippingOrderId?: string | null
  paymentId?: string | null
  chargeType?: string | null
  status?: string | null
  amount?: number | null
  taxAmount?: number | null
  totalAmount?: number | null
  currency?: string | null
  orderDateTime?: string | null
  postedAt?: string | null
  description?: string | null
}

export interface BillingPayment {
  billingPaymentId: string
  invoiceId?: string | null
  externalPaymentId?: string | null
  amount?: number | null
  currency?: string | null
  paymentMethod?: string | null
  status?: string | null
  paymentDate?: string | null
  notes?: string | null
  appliedToLabel?: string | null
}

export interface BillingActions {
  canPayBalance: boolean
  canPayLatestInvoice: boolean
  canDownloadLatestInvoice: boolean
  hasBillingAccount: boolean
  payBalanceLabel?: string | null
}

export interface BillingDashboardResponse {
  billingAccount: BillingAccount | null
  summary: BillingSummary
  latestInvoice: BillingInvoice | null
  recentInvoices: BillingInvoice[]
  recentUnbilledCharges: BillingUnbilledCharge[]
  recentPayments: BillingPayment[]
  actions: BillingActions
}

export interface BillingPageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  numberOfElements: number
  sortBy: string
  sortDir: "asc" | "desc"
}

export interface BillingPageParams {
  page?: number
  size?: number
  sortBy?: string
  sortDir?: "asc" | "desc"
  status?: string
  fromDate?: string
  toDate?: string
}

export interface BillingPaymentInitiateRequest {
  billingAccountId: string
  amount: number
  currency: string
  paymentCategory: "BILLING_ACCOUNT_ADJUSTMENT"
  paymentForType: "BILLING_ACCOUNT"
  description?: string | null
}

export interface BillingPaymentInitiateResponse {
  ticketId?: string | null
  paymentId?: string | null
  amount?: number | null
  currency?: string | null
  status?: string | null
  message?: string | null
}

function pageParams(params: BillingPageParams) {
  const search = new URLSearchParams()

  search.set("page", String(params.page ?? 0))
  search.set("size", String(params.size ?? 20))
  if (params.sortBy) search.set("sortBy", params.sortBy)
  if (params.sortDir) search.set("sortDir", params.sortDir)
  if (params.status) search.set("status", params.status)
  if (params.fromDate) search.set("fromDate", params.fromDate)
  if (params.toDate) search.set("toDate", params.toDate)

  return search.toString()
}

async function readPage<T>(response: Response, fallbackSortBy: string): Promise<BillingPageResponse<T>> {
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const backendMessage =
      data && typeof data === "object" && "message" in data
        ? (data as { message?: string }).message
        : null

    throw new Error(backendMessage || `Failed to fetch billing history: ${response.statusText}`)
  }

  const data = await response.json()

  return {
    content: Array.isArray(data?.content) ? data.content : [],
    page: data?.page ?? 0,
    size: data?.size ?? 20,
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
    first: Boolean(data?.first),
    last: Boolean(data?.last),
    numberOfElements: data?.numberOfElements ?? 0,
    sortBy: data?.sortBy ?? fallbackSortBy,
    sortDir: data?.sortDir === "asc" ? "asc" : "desc",
  }
}

export async function getBillingDashboard(): Promise<BillingDashboardResponse> {
  const response = await apiFetch("/api/billing/dashboard", {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const backendMessage =
      data && typeof data === "object" && "message" in data
        ? (data as { message?: string }).message
        : null

    throw new Error(backendMessage || `Failed to fetch billing dashboard: ${response.statusText}`)
  }

  const data = await response.json()

  return {
    billingAccount: data?.billingAccount ?? null,
    summary: {
      balanceDue: data?.summary?.balanceDue ?? 0,
      currentUnbilledAmount: data?.summary?.currentUnbilledAmount ?? 0,
      creditBalance: data?.summary?.creditBalance ?? 0,
      totalPayableNow: data?.summary?.totalPayableNow ?? 0,
      currency: data?.summary?.currency ?? "CAD",
      hasOutstandingBalance: Boolean(data?.summary?.hasOutstandingBalance),
      hasUnbilledCharges: Boolean(data?.summary?.hasUnbilledCharges),
      hasCredit: Boolean(data?.summary?.hasCredit),
      balanceStatusLabel: data?.summary?.balanceStatusLabel ?? null,
    },
    latestInvoice: data?.latestInvoice ?? null,
    recentInvoices: Array.isArray(data?.recentInvoices) ? data.recentInvoices : [],
    recentUnbilledCharges: Array.isArray(data?.recentUnbilledCharges) ? data.recentUnbilledCharges : [],
    recentPayments: Array.isArray(data?.recentPayments) ? data.recentPayments : [],
    actions: {
      canPayBalance: Boolean(data?.actions?.canPayBalance),
      canPayLatestInvoice: Boolean(data?.actions?.canPayLatestInvoice),
      canDownloadLatestInvoice: Boolean(data?.actions?.canDownloadLatestInvoice),
      hasBillingAccount: Boolean(data?.actions?.hasBillingAccount),
      payBalanceLabel: data?.actions?.payBalanceLabel ?? null,
    },
  }
}

export async function getClientInvoices(params: BillingPageParams = {}): Promise<BillingPageResponse<BillingInvoice>> {
  const response = await apiFetch(
    `/api/billing/invoices?${pageParams({ sortBy: "generatedAt", sortDir: "desc", ...params })}`,
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  )

  return readPage<BillingInvoice>(response, "generatedAt")
}

export async function getClientUnbilledCharges(
  params: BillingPageParams = {},
): Promise<BillingPageResponse<BillingUnbilledCharge>> {
  const response = await apiFetch(
    `/api/billing/unbilled-charges?${pageParams({ sortBy: "postedAt", sortDir: "desc", ...params })}`,
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  )

  return readPage<BillingUnbilledCharge>(response, "postedAt")
}

export async function getClientBillingPayments(
  params: BillingPageParams = {},
): Promise<BillingPageResponse<BillingPayment>> {
  const response = await apiFetch(
    `/api/billing/payments?${pageParams({ sortBy: "paymentDate", sortDir: "desc", ...params })}`,
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  )

  return readPage<BillingPayment>(response, "paymentDate")
}

export async function initiateBillingBalancePayment(
  payload: BillingPaymentInitiateRequest,
): Promise<BillingPaymentInitiateResponse> {
  const response = await apiFetch("/api/billing/payments/initiate", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const responseBody = await response.json().catch(() => null)

  if (!response.ok) {
    const backendMessage =
      responseBody && typeof responseBody === "object" && "message" in responseBody
        ? (responseBody as { message?: string }).message
        : null

    throw new Error(backendMessage || "Failed to start billing payment.")
  }

  return responseBody as BillingPaymentInitiateResponse
}
