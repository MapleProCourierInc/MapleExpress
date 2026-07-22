import { AlertCircle } from "lucide-react"
import { AdminRefunds } from "@/components/admin/admin-refunds"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  adminListRefunds,
  normalizeAdminRefundPage,
} from "@/lib/admin-refund-service"
import type { AdminRefundFilters, RefundSortBy, RefundSortDirection } from "@/types/admin-refunds"

const DEFAULT_PAGE = 0
const DEFAULT_SIZE = 20

function normalizeNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function getValue(resolved: Record<string, string | string[] | undefined>, key: string) {
  const value = resolved[key]
  if (Array.isArray(value)) return value[0] || ""
  return value || ""
}

export default async function AdminRefundsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolved = (await searchParams) ?? {}
  const size = normalizeNumber(getValue(resolved, "size"), DEFAULT_SIZE)

  const filters: AdminRefundFilters = {
    refundId: getValue(resolved, "refundId").trim(),
    paymentId: getValue(resolved, "paymentId").trim(),
    shippingOrderId: getValue(resolved, "shippingOrderId").trim(),
    trackingNumber: getValue(resolved, "trackingNumber").trim(),
    payerUserId: getValue(resolved, "payerUserId").trim(),
    status: getValue(resolved, "status").trim() || "PENDING_APPROVAL",
    workflowType: getValue(resolved, "workflowType").trim(),
    reasonCode: getValue(resolved, "reasonCode").trim(),
    destination: getValue(resolved, "destination").trim(),
    paymentMethodType: getValue(resolved, "paymentMethodType").trim(),
    paymentProvider: getValue(resolved, "paymentProvider").trim(),
    paymentStatus: getValue(resolved, "paymentStatus").trim(),
    currency: getValue(resolved, "currency").trim(),
    pricingId: getValue(resolved, "pricingId").trim(),
    requestedFrom: getValue(resolved, "requestedFrom").trim(),
    requestedTo: getValue(resolved, "requestedTo").trim(),
    reviewedFrom: getValue(resolved, "reviewedFrom").trim(),
    reviewedTo: getValue(resolved, "reviewedTo").trim(),
    processedFrom: getValue(resolved, "processedFrom").trim(),
    processedTo: getValue(resolved, "processedTo").trim(),
    minProposedAmount: getValue(resolved, "minProposedAmount").trim(),
    maxProposedAmount: getValue(resolved, "maxProposedAmount").trim(),
    minApprovedAmount: getValue(resolved, "minApprovedAmount").trim(),
    maxApprovedAmount: getValue(resolved, "maxApprovedAmount").trim(),
    requestingActorType: getValue(resolved, "requestingActorType").trim(),
    reviewingAdminId: getValue(resolved, "reviewingAdminId").trim(),
    policyCode: getValue(resolved, "policyCode").trim(),
    policyVersion: getValue(resolved, "policyVersion").trim(),
    gatewayExecutionBlocked: getValue(resolved, "gatewayExecutionBlocked").trim(),
    search: getValue(resolved, "search").trim(),
    page: normalizeNumber(getValue(resolved, "page"), DEFAULT_PAGE),
    size: Math.min(100, Math.max(1, size || DEFAULT_SIZE)),
    sortBy: (getValue(resolved, "sortBy").trim() || "requestedAt") as RefundSortBy,
    sortDirection: (getValue(resolved, "sortDirection").trim() === "ASC" ? "ASC" : "DESC") as RefundSortDirection,
  }

  const result = await adminListRefunds(filters)
  const data = normalizeAdminRefundPage(result.data, filters)

  return (
    <div className="space-y-4">
      {result.error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{result.error.message || "Failed to load refunds"}</AlertTitle>
          <AlertDescription>
            Backend returned status {result.error.status || "unknown"}. You can still adjust filters or refresh.
          </AlertDescription>
        </Alert>
      ) : null}

      <AdminRefunds initialData={data} initialError={result.error} initialFilters={filters} />
    </div>
  )
}
