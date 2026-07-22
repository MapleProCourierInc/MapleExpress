"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  AlertCircle,
  Ban,
  Banknote,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Eye,
  FileWarning,
  FilterX,
  History,
  Inbox,
  Landmark,
  Loader2,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { apiFetch } from "@/lib/client-api"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  REFUND_DESTINATIONS,
  REFUND_PAYMENT_METHOD_TYPES,
  REFUND_REASON_CODES,
  REFUND_STATUSES,
  REFUND_WORKFLOW_TYPES,
  type AdminRefundApiError,
  type AdminRefundFilters,
  type BatchActionResponse,
  type ManualRefundRequest,
  type RefundActionResult,
  type RefundDetailResponse,
  type RefundListItemResponse,
  type RefundSearchResponse,
  type RefundSortBy,
  type RefundSortDirection,
} from "@/types/admin-refunds"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

const ALL_FILTER = "ALL"
const DEFAULT_SIZE = 20
const SHOW_MANUAL_REFUND_BUTTON = false

type BatchDialogType = "approve" | "reject" | null
type MultiFilterOption = { value: string; label: string }

const refundStatusStyles: Record<string, string> = {
  PENDING_APPROVAL: "border-amber-200 bg-amber-50 text-amber-900",
  SCHEDULED: "border-blue-200 bg-blue-50 text-blue-800",
  PROCESSING: "border-violet-200 bg-violet-50 text-violet-800",
  SUCCEEDED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  DECLINED: "border-red-200 bg-red-50 text-red-800",
  FAILED: "border-red-200 bg-red-50 text-red-800",
  UNKNOWN: "border-slate-300 bg-slate-100 text-slate-800",
  REJECTED: "border-slate-300 bg-slate-50 text-slate-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-800",
}

const outcomeStyles: Record<string, string> = {
  REFUNDED_SUCCESSFULLY: "border-emerald-200 bg-emerald-50 text-emerald-800",
  BILLING_REFUND_CREDIT_EVENT_PUBLISHED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-slate-300 bg-slate-50 text-slate-700",
  MONERIS_DECLINED: "border-red-200 bg-red-50 text-red-800",
  MONERIS_RESULT_UNKNOWN: "border-amber-200 bg-amber-50 text-amber-900",
  PROCESSING_FAILED: "border-red-200 bg-red-50 text-red-800",
  VALIDATION_FAILURE: "border-amber-200 bg-amber-50 text-amber-900",
}

const sortOptions: Array<{ value: RefundSortBy; label: string }> = [
  { value: "requestedAt", label: "Requested" },
  { value: "reviewedAt", label: "Reviewed" },
  { value: "completedAt", label: "Completed" },
  { value: "proposedAmount", label: "Proposed amount" },
  { value: "approvedAmount", label: "Approved amount" },
  { value: "processedAmount", label: "Processed amount" },
  { value: "status", label: "Status" },
  { value: "trackingNumber", label: "Tracking" },
  { value: "shippingOrderId", label: "Shipping order" },
  { value: "paymentMethodType", label: "Payment method" },
]

const friendlyLabels: Record<string, string> = {
  actualCompletedAt: "Actual Delivery Time",
  actorId: "Actor ID",
  actorType: "Actor Type",
  approvedAmount: "Approved Amount",
  attemptedAt: "Attempt Time",
  authorizationCode: "Authorization Code",
  billingAccountId: "Billing Account ID",
  billingAdjustmentId: "Billing Adjustment ID",
  breachSeconds: "Delay",
  calculationSource: "Calculation Source",
  committedDeliveryAt: "Committed Delivery Time",
  completedAt: "Completed Time",
  creditNoteDocumentId: "Credit Note Document ID",
  customerFacingReason: "Customer Message",
  detectedAt: "Detected Time",
  displayNameSnapshot: "Display Name",
  ecommerceIndicator: "E-commerce Indicator",
  eventType: "Event Type",
  expectedDeliveryAt: "Expected Delivery Time",
  idempotencyKey: "Idempotency Key",
  internalReason: "Internal Note",
  isoResponseCode: "ISO Response Code",
  newAmount: "New Amount",
  newStatus: "New Status",
  originalTransactionNumber: "Original Transaction Number",
  payerUserId: "Payer User ID",
  paymentId: "Payment ID",
  policyCode: "Refund Policy",
  policyVersion: "Policy Version",
  previousAmount: "Previous Amount",
  previousStatus: "Previous Status",
  pricingId: "Pricing ID",
  pricingModelId: "Pricing Model ID",
  processedAmount: "Processed Amount",
  processingStartedAt: "Processing Started",
  proposedAmount: "Proposed Amount",
  referenceNumber: "Reference Number",
  refundId: "Refund ID",
  refundReceiptDocumentId: "Refund Receipt Document ID",
  refundTransactionNumber: "Refund Transaction Number",
  rejectionReason: "Rejection Reason",
  requestedAt: "Requested Time",
  reviewedAt: "Reviewed Time",
  reviewNotes: "Review Notes",
  scheduledReleaseAt: "Scheduled Release Time",
  shippingOrderId: "Shipping Order ID",
  sourceEventId: "Source Event ID",
  sourcePanLast4: "Card Last 4",
  sourceReferenceId: "Related Reference ID",
  sourceType: "Source",
  statusCheck: "Status Check",
  taxAmount: "Tax Amount",
  totalAmount: "Total Amount",
  trackingNumber: "Tracking Number",
  transportErrorMessage: "Connection Error",
  transportErrorType: "Connection Error Type",
}

const normalizedFriendlyLabels = Object.fromEntries(
  Object.entries(friendlyLabels).map(([key, value]) => [key.toLowerCase(), value]),
)

const acronyms = new Set(["api", "avs", "cad", "cvd", "eci", "id", "iso", "qa", "sla", "url"])

function humanize(value?: string | null) {
  if (!value) return "N/A"

  const mapped = normalizedFriendlyLabels[value.toLowerCase()]
  if (mapped) return mapped

  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase()
      if (acronyms.has(lower)) return lower.toUpperCase()
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(" ")
}

function money(value?: number | null, currency = "CAD") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A"
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency || "CAD",
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDateTime(value?: string | null) {
  if (!value) return "N/A"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "N/A"
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date)
}

function formatDate(value?: string | null) {
  if (!value) return "N/A"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "N/A"
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function formatTime(value?: string | null) {
  if (!value) return "N/A"
  const [hours, minutes] = value.split(":")
  const date = new Date()
  date.setHours(Number(hours), Number(minutes || 0), 0, 0)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-CA", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date)
}

function looksLikeDateTime(value: string) {
  return /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}/.test(value)
}

function looksLikeDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function looksLikeTime(value: string) {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(value)
}

function formatDurationSeconds(value: number) {
  const absolute = Math.abs(Math.round(value))
  const hours = Math.floor(absolute / 3600)
  const minutes = Math.floor((absolute % 3600) / 60)
  const seconds = absolute % 60
  const parts: string[] = []

  if (hours) parts.push(`${hours} hr`)
  if (minutes) parts.push(`${minutes} min`)
  if (seconds || !parts.length) parts.push(`${seconds} sec`)

  return `${value < 0 ? "-" : ""}${parts.join(" ")}`
}

function isDurationField(fieldName?: string | null) {
  const key = (fieldName || "").toLowerCase()
  return key.includes("seconds") || key.includes("duration") || key.includes("delay") || key.includes("breach")
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 16)
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function fromDateTimeLocal(value: string) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

function rowKey(row: Pick<RefundListItemResponse, "paymentId" | "refundId">) {
  return `${row.paymentId}::${row.refundId}`
}

function errorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = String((payload as { message?: unknown }).message || "").trim()
    if (message) return message
  }
  return fallback
}

async function readApi<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(errorMessage(payload, fallback))
  return payload as T
}

function splitFilterValues(value?: string | null, fallback: string[] = []) {
  const values = (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

  return values.length ? values : fallback
}

function joinFilterValues(values: string[]) {
  return values
    .map((item) => item.trim())
    .filter(Boolean)
    .join(",")
}

function orderedFilterValues(options: MultiFilterOption[], values: string[]) {
  const selected = new Set(values)
  return options.map((option) => option.value).filter((value) => selected.has(value))
}

function MultiFilterSelect({
  id,
  options,
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string
  options: MultiFilterOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
  required?: boolean
}) {
  const selected = orderedFilterValues(options, value)
  const selectedLabels = selected.map((item) => options.find((option) => option.value === item)?.label || humanize(item))
  const buttonLabel =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels[0]} +${selectedLabels.length - 1}`

  const setValues = (next: string[]) => {
    const ordered = orderedFilterValues(options, next)
    if (required && !ordered.length) return
    onChange(ordered)
  }

  const toggleValue = (optionValue: string) => {
    setValues(
      selected.includes(optionValue)
        ? selected.filter((item) => item !== optionValue)
        : [...selected, optionValue],
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="h-10 w-full justify-between px-3 font-normal">
          <span className="truncate">{buttonLabel}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[280px] space-y-3 p-3">
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {options.map((option) => {
            const checkboxId = `${id}-${option.value}`
            return (
              <div key={option.value} className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/60">
                <Checkbox
                  id={checkboxId}
                  checked={selected.includes(option.value)}
                  onCheckedChange={() => toggleValue(option.value)}
                />
                <Label htmlFor={checkboxId} className="min-w-0 flex-1 cursor-pointer truncate text-sm font-normal">
                  {option.label}
                </Label>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between border-t pt-3">
          <Button type="button" variant="ghost" size="sm" disabled={required || !selected.length} onClick={() => setValues([])}>
            Any
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setValues(options.map((option) => option.value))}>
            All
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function StatusBadge({ status }: { status?: string | null }) {
  const key = status || "UNKNOWN"
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-normal",
        refundStatusStyles[key] || "border-slate-200 bg-slate-50 text-slate-700",
      )}
    >
      {humanize(status)}
    </Badge>
  )
}

function OutcomeBadge({ outcome }: { outcome?: string | null }) {
  const key = outcome || "UNKNOWN"
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-normal",
        outcomeStyles[key] || "border-slate-200 bg-slate-50 text-slate-700",
      )}
    >
      {humanize(outcome)}
    </Badge>
  )
}

function destinationIcon(destination?: string | null) {
  return destination === "BILLING_ACCOUNT_CREDIT" ? (
    <Landmark className="h-4 w-4 text-emerald-700" />
  ) : (
    <CreditCard className="h-4 w-4 text-blue-700" />
  )
}

function SummaryCard({
  label,
  value,
  helper,
  icon,
  className,
}: {
  label: string
  value: string | number
  helper: string
  icon: ReactNode
  className?: string
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 truncate font-mono text-2xl font-bold">{value}</p>
          </div>
          <div className="rounded-md bg-muted p-2.5 text-foreground">{icon}</div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  )
}

function MetadataItem({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className={cn("mt-1 break-words text-sm font-medium", mono ? "font-mono" : "")}>{value || "N/A"}</div>
    </div>
  )
}

function ListLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-16 rounded-md" />
      ))}
    </div>
  )
}

function DetailLoading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

function AmountPanel({
  title,
  amount,
  currency,
}: {
  title: string
  amount?: RefundDetailResponse["proposedAmount"] | null
  currency: string
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{amount?.calculationSource ? humanize(amount.calculationSource) : "Amount details"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <MetadataItem label="Subtotal" value={money(amount?.subtotal, currency)} />
          <MetadataItem label="Tax" value={money(amount?.taxAmount, currency)} />
          <MetadataItem label="Total" value={money(amount?.totalAmount, currency)} />
        </div>
        {amount?.lineItems?.length ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Line</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {amount.lineItems.map((item, index) => (
                  <TableRow key={`${item.code || "line"}-${index}`}>
                    <TableCell>
                      <p className="font-medium">{humanize(item.code)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.description || "No description"}</p>
                    </TableCell>
                    <TableCell className="text-right font-mono">{money(item.amount, currency)}</TableCell>
                    <TableCell className="text-right font-mono">{money(item.taxAmount, currency)}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">{money(item.totalAmount, currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function EvidenceValue({ value, fieldName }: { value: unknown; fieldName?: string }) {
  if (value === null || value === undefined || value === "") return <span>N/A</span>
  if (typeof value === "number") {
    return <span>{isDurationField(fieldName) ? formatDurationSeconds(value) : String(value)}</span>
  }
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>
  if (typeof value === "string") {
    if (looksLikeDateTime(value)) return <span>{formatDateTime(value)}</span>
    if (looksLikeDate(value)) return <span>{formatDate(value)}</span>
    if (looksLikeTime(value)) return <span>{formatTime(value)}</span>
    return <span>{String(value)}</span>
  }
  if (Array.isArray(value)) {
    if (!value.length) return <span>N/A</span>
    return (
      <div className="space-y-1">
        {value.map((item, index) => (
          <div key={index} className="rounded-md bg-background/80 px-2 py-1">
            <EvidenceValue value={item} fieldName={fieldName} />
          </div>
        ))}
      </div>
    )
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
    if (!entries.length) return <span>N/A</span>
    return (
      <div className="space-y-2">
        {entries.map(([key, nestedValue]) => (
          <div key={key} className="grid gap-1 rounded-md bg-background/80 px-2 py-1.5 sm:grid-cols-[150px_minmax(0,1fr)]">
            <span className="text-xs font-semibold text-muted-foreground">{humanize(key)}</span>
            <span className="min-w-0">
              <EvidenceValue value={nestedValue} fieldName={key} />
            </span>
          </div>
        ))}
      </div>
    )
  }
  return <span className="font-mono text-xs">{JSON.stringify(value)}</span>
}

function ResultsPanel({ results }: { results: RefundActionResult[] }) {
  if (!results.length) return null

  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="mb-2 text-sm font-semibold">Latest action results</p>
      <div className="space-y-2">
        {results.map((result, index) => (
          <div key={`${result.paymentId || "payment"}-${result.refundId || "refund"}-${index}`} className="rounded-md border bg-background p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-mono text-xs text-muted-foreground">{result.paymentId || "N/A"} / {result.refundId || "N/A"}</p>
                <p className="mt-1">{result.message || humanize(result.status)}</p>
              </div>
              <OutcomeBadge outcome={result.outcome} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActionabilityBadge({ row }: { row: RefundListItemResponse }) {
  if (row.gatewayExecutionBlocked) {
    return <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800">Needs reconciliation</Badge>
  }
  if (row.approvalAllowed || row.rejectionAllowed) {
    return <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">Reviewable</Badge>
  }
  if (row.refundBranchImplemented === false) {
    return <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">Not supported yet</Badge>
  }
  return <span className="text-xs text-muted-foreground">No action</span>
}

export function AdminRefunds({
  initialData,
  initialError,
  initialFilters,
}: {
  initialData: RefundSearchResponse
  initialError: AdminRefundApiError | null
  initialFilters: AdminRefundFilters
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const [data, setData] = useState(initialData)
  const [listError, setListError] = useState(initialError?.message || "")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [statusValues, setStatusValues] = useState(() => splitFilterValues(initialFilters.status, ["PENDING_APPROVAL"]))
  const [reasonCodes, setReasonCodes] = useState(() => splitFilterValues(initialFilters.reasonCode))
  const [destinations, setDestinations] = useState(() => splitFilterValues(initialFilters.destination))
  const [paymentMethodTypes, setPaymentMethodTypes] = useState(() => splitFilterValues(initialFilters.paymentMethodType))
  const [workflowTypes, setWorkflowTypes] = useState(() => splitFilterValues(initialFilters.workflowType))
  const [gatewayExecutionBlocked, setGatewayExecutionBlocked] = useState<typeof ALL_FILTER | "true" | "false">(
    initialFilters.gatewayExecutionBlocked === "true"
      ? "true"
      : initialFilters.gatewayExecutionBlocked === "false"
        ? "false"
        : ALL_FILTER,
  )
  const [search, setSearch] = useState(initialFilters.search || "")
  const [paymentId, setPaymentId] = useState(initialFilters.paymentId || "")
  const [refundId, setRefundId] = useState(initialFilters.refundId || "")
  const [trackingNumber, setTrackingNumber] = useState(initialFilters.trackingNumber || "")
  const [shippingOrderId, setShippingOrderId] = useState(initialFilters.shippingOrderId || "")
  const [payerUserId, setPayerUserId] = useState(initialFilters.payerUserId || "")
  const [requestedFrom, setRequestedFrom] = useState(toDateTimeLocal(initialFilters.requestedFrom))
  const [requestedTo, setRequestedTo] = useState(toDateTimeLocal(initialFilters.requestedTo))
  const [sortBy, setSortBy] = useState<RefundSortBy>(initialFilters.sortBy || "requestedAt")
  const [sortDirection, setSortDirection] = useState<RefundSortDirection>(initialFilters.sortDirection || "DESC")

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<RefundDetailResponse | null>(null)
  const [detailError, setDetailError] = useState("")
  const [detailLoading, setDetailLoading] = useState(false)

  const [batchDialog, setBatchDialog] = useState<BatchDialogType>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [approvedOverride, setApprovedOverride] = useState("")
  const [batchSubmitting, setBatchSubmitting] = useState(false)
  const [actionResults, setActionResults] = useState<RefundActionResult[]>([])

  const [manualOpen, setManualOpen] = useState(false)
  const [manualForm, setManualForm] = useState({
    paymentId: "",
    amount: "",
    currency: "CAD",
    reasonCode: "ADMIN_ADJUSTMENT",
    customerFacingReason: "",
    internalReason: "",
    trackingNumber: "",
    shippingOrderId: "",
    idempotencyKey: "",
  })
  const [manualSubmitting, setManualSubmitting] = useState(false)
  const [manualError, setManualError] = useState("")
  const [manualResult, setManualResult] = useState<RefundActionResult | null>(null)

  useEffect(() => {
    setData(initialData)
    setListError(initialError?.message || "")
    setIsRefreshing(false)
    setSelectedKeys(new Set())
  }, [initialData, initialError])

  const selectedRows = useMemo(
    () => data.content.filter((row) => selectedKeys.has(rowKey(row))),
    [data.content, selectedKeys],
  )
  const approvalRows = selectedRows.filter((row) => row.approvalAllowed)
  const rejectionRows = selectedRows.filter((row) => row.rejectionAllowed)
  const selectableRows = data.content.filter((row) => row.approvalAllowed || row.rejectionAllowed)
  const allSelectableChecked = selectableRows.length > 0 && selectableRows.every((row) => selectedKeys.has(rowKey(row)))
  const currentPage = data.page
  const totalPages = data.totalPages

  const summary = useMemo(() => {
    return data.content.reduce(
      (acc, row) => {
        if (row.status === "PENDING_APPROVAL") acc.pending += 1
        if (row.status === "PROCESSING" || row.status === "SCHEDULED") acc.inFlight += 1
        if (row.status === "SUCCEEDED") acc.succeeded += 1
        if (row.gatewayExecutionBlocked) acc.blocked += 1
        acc.proposed += row.proposedAmount || 0
        acc.processed += row.processedAmount || 0
        return acc
      },
      { pending: 0, inFlight: 0, succeeded: 0, blocked: 0, proposed: 0, processed: 0 },
    )
  }, [data.content])

  const buildQuery = (page: number) => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("size", String(initialFilters.size || DEFAULT_SIZE))
    params.set("status", joinFilterValues(statusValues) || "PENDING_APPROVAL")
    params.set("sortBy", sortBy)
    params.set("sortDirection", sortDirection)

    const pairs: Array<[keyof AdminRefundFilters, string]> = [
      ["reasonCode", joinFilterValues(reasonCodes)],
      ["destination", joinFilterValues(destinations)],
      ["paymentMethodType", joinFilterValues(paymentMethodTypes)],
      ["workflowType", joinFilterValues(workflowTypes)],
      ["gatewayExecutionBlocked", gatewayExecutionBlocked === ALL_FILTER ? "" : gatewayExecutionBlocked],
      ["search", search],
      ["paymentId", paymentId],
      ["refundId", refundId],
      ["trackingNumber", trackingNumber],
      ["shippingOrderId", shippingOrderId],
      ["payerUserId", payerUserId],
      ["requestedFrom", fromDateTimeLocal(requestedFrom)],
      ["requestedTo", fromDateTimeLocal(requestedTo)],
    ]

    pairs.forEach(([key, value]) => {
      const clean = value.trim()
      if (clean) params.set(key, clean)
    })

    return params.toString()
  }

  const applyFilters = () => {
    setIsRefreshing(true)
    router.push(`${pathname}?${buildQuery(0)}`)
  }

  const pageHref = (page: number) => `${pathname}?${buildQuery(page)}`

  const refresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 800)
  }

  const clearFilters = () => {
    setStatusValues(["PENDING_APPROVAL"])
    setReasonCodes([])
    setDestinations([])
    setPaymentMethodTypes([])
    setWorkflowTypes([])
    setGatewayExecutionBlocked(ALL_FILTER)
    setSearch("")
    setPaymentId("")
    setRefundId("")
    setTrackingNumber("")
    setShippingOrderId("")
    setPayerUserId("")
    setRequestedFrom("")
    setRequestedTo("")
    setSortBy("requestedAt")
    setSortDirection("DESC")
    setIsRefreshing(true)
    router.push(`${pathname}?page=0&size=${initialFilters.size || DEFAULT_SIZE}&status=PENDING_APPROVAL&sortBy=requestedAt&sortDirection=DESC`)
  }

  const toggleSelected = (key: string, checked: boolean) => {
    setSelectedKeys((current) => {
      const next = new Set(current)
      if (checked) next.add(key)
      else next.delete(key)
      return next
    })
  }

  const toggleAllSelectable = (checked: boolean) => {
    setSelectedKeys((current) => {
      const next = new Set(current)
      selectableRows.forEach((row) => {
        if (checked) next.add(rowKey(row))
        else next.delete(rowKey(row))
      })
      return next
    })
  }

  const openRefund = async (row: RefundListItemResponse) => {
    setDetailOpen(true)
    setDetail(null)
    setDetailError("")
    setDetailLoading(true)

    try {
      const response = await apiFetch(
        `/api/admin/refunds/${encodeURIComponent(row.paymentId)}/${encodeURIComponent(row.refundId)}`,
      )
      setDetail(await readApi<RefundDetailResponse>(response, "Failed to load refund detail."))
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Failed to load refund detail.")
    } finally {
      setDetailLoading(false)
    }
  }

  const openBatchDialog = (type: Exclude<BatchDialogType, null>) => {
    setBatchDialog(type)
    setReviewNotes("")
    setRejectionReason("")
    setApprovedOverride("")
    setActionResults([])
  }

  const submitBatchAction = async () => {
    const actionType = batchDialog
    const rows = actionType === "approve" ? approvalRows : rejectionRows
    if (!actionType || !rows.length) return
    if (actionType === "reject" && !rejectionReason.trim()) {
      toast({ variant: "destructive", title: "Rejection reason required" })
      return
    }

    setBatchSubmitting(true)
    setActionResults([])

    try {
      const endpoint = actionType === "approve" ? "/api/admin/refunds/approvals" : "/api/admin/refunds/rejections"
      const body =
        actionType === "approve"
          ? {
              items: rows.map((row) => ({
                paymentId: row.paymentId,
                refundId: row.refundId,
                approvedTotalAmount:
                  rows.length === 1 && approvedOverride.trim() ? Number(approvedOverride) : undefined,
                reviewNotes: reviewNotes.trim() || undefined,
              })),
            }
          : {
              items: rows.map((row) => ({ paymentId: row.paymentId, refundId: row.refundId })),
              rejectionReason: rejectionReason.trim(),
              reviewNotes: reviewNotes.trim() || undefined,
            }

      const response = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const payload = await readApi<BatchActionResponse>(response, "Refund action failed.")
      const results = payload.results || []
      toast({
        title: actionType === "approve" ? "Approval request complete" : "Rejection request complete",
        description: `${results.length || rows.length} result${(results.length || rows.length) === 1 ? "" : "s"} returned.`,
      })
      setBatchDialog(null)
      setActionResults([])
      setSelectedKeys(new Set())
      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: actionType === "approve" ? "Approval failed" : "Rejection failed",
        description: error instanceof Error ? error.message : "Refund action failed.",
      })
    } finally {
      setBatchSubmitting(false)
    }
  }

  const updateManualForm = (key: keyof typeof manualForm, value: string) => {
    setManualForm((current) => ({ ...current, [key]: value }))
    setManualError("")
    setManualResult(null)
  }

  const openManualDialog = () => {
    setManualOpen(true)
    setManualError("")
    setManualResult(null)
    setManualForm({
      paymentId: "",
      amount: "",
      currency: "CAD",
      reasonCode: "ADMIN_ADJUSTMENT",
      customerFacingReason: "",
      internalReason: "",
      trackingNumber: "",
      shippingOrderId: "",
      idempotencyKey: "",
    })
  }

  const submitManualRefund = async () => {
    const amount = Number(manualForm.amount)
    if (!manualForm.paymentId.trim() || !Number.isFinite(amount) || amount <= 0) {
      setManualError("Payment ID and a refund amount greater than zero are required.")
      return
    }

    const payload: ManualRefundRequest = {
      paymentId: manualForm.paymentId.trim(),
      amount,
      currency: manualForm.currency.trim() || undefined,
      reasonCode: manualForm.reasonCode,
      customerFacingReason: manualForm.customerFacingReason.trim() || undefined,
      internalReason: manualForm.internalReason.trim() || undefined,
      trackingNumber: manualForm.trackingNumber.trim() || undefined,
      shippingOrderId: manualForm.shippingOrderId.trim() || undefined,
      idempotencyKey: manualForm.idempotencyKey.trim() || undefined,
    }

    setManualSubmitting(true)
    setManualError("")
    setManualResult(null)

    try {
      const response = await apiFetch("/api/admin/refunds/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(manualForm.idempotencyKey.trim() ? { "Idempotency-Key": manualForm.idempotencyKey.trim() } : {}),
        },
        body: JSON.stringify(payload),
      })
      const result = await readApi<RefundActionResult>(response, "Manual refund failed.")
      setManualResult(result)
      toast({ title: "Manual refund submitted", description: result.message || humanize(result.outcome) })
      router.refresh()
    } catch (error) {
      setManualError(error instanceof Error ? error.message : "Manual refund failed.")
    } finally {
      setManualSubmitting(false)
    }
  }

  const detailCurrency = detail?.summary?.currency || "CAD"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">Refunds</h1>
            <Badge variant="outline" className="rounded-md">
              {data.totalElements} matching
            </Badge>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Review refund candidates, process card refunds or postpay credits, reject invalid claims, and create manual adjustments.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={refresh} disabled={isRefreshing}>
            <RefreshCw className={cn("h-4 w-4", isRefreshing ? "animate-spin" : "")} />
            Refresh
          </Button>
          {SHOW_MANUAL_REFUND_BUTTON ? (
            <Button type="button" onClick={openManualDialog}>
              <Plus className="h-4 w-4" />
              Manual Refund
            </Button>
          ) : null}
        </div>
      </div>

      {listError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Refund list could not be loaded</AlertTitle>
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Pending review" value={summary.pending} helper="Current page candidates" icon={<Clock3 className="h-5 w-5" />} />
        <SummaryCard label="In flight" value={summary.inFlight} helper="Scheduled or processing" icon={<RefreshCw className="h-5 w-5" />} />
        <SummaryCard label="Succeeded" value={summary.succeeded} helper="Processed on this page" icon={<CheckCircle2 className="h-5 w-5" />} />
        <SummaryCard label="Blocked" value={summary.blocked} helper="Needs reconciliation" icon={<FileWarning className="h-5 w-5" />} />
        <SummaryCard label="Proposed total" value={money(summary.proposed, data.content[0]?.currency || "CAD")} helper="Current page amount" icon={<Banknote className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg">Work Queue</CardTitle>
              <CardDescription>Default queue is pending approval. Use identifiers or filters to narrow the list.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={isRefreshing} onClick={clearFilters}>
                <FilterX className="h-4 w-4" />
                Reset
              </Button>
              <Button type="button" disabled={isRefreshing} onClick={applyFilters}>
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_180px_190px_180px_180px]">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Search</Label>
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Payment, refund, tracking, customer..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <MultiFilterSelect
                id="refund-status-filter"
                options={REFUND_STATUSES.map((item) => ({ value: item, label: humanize(item) }))}
                value={statusValues}
                onChange={setStatusValues}
                placeholder="Pending approval"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Reason</Label>
              <MultiFilterSelect
                id="refund-reason-filter"
                options={REFUND_REASON_CODES.map((item) => ({ value: item, label: humanize(item) }))}
                value={reasonCodes}
                onChange={setReasonCodes}
                placeholder="Any reason"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Destination</Label>
              <MultiFilterSelect
                id="refund-destination-filter"
                options={REFUND_DESTINATIONS.map((item) => ({ value: item, label: humanize(item) }))}
                value={destinations}
                onChange={setDestinations}
                placeholder="Any destination"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Payment method</Label>
              <MultiFilterSelect
                id="refund-payment-method-filter"
                options={REFUND_PAYMENT_METHOD_TYPES.map((item) => ({ value: item, label: humanize(item) }))}
                value={paymentMethodTypes}
                onChange={setPaymentMethodTypes}
                placeholder="Any method"
              />
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-5">
            <Input value={paymentId} onChange={(event) => setPaymentId(event.target.value)} placeholder="Payment ID" />
            <Input value={refundId} onChange={(event) => setRefundId(event.target.value)} placeholder="Refund ID" />
            <Input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Tracking number" />
            <Input value={shippingOrderId} onChange={(event) => setShippingOrderId(event.target.value)} placeholder="Shipping order ID" />
            <Input value={payerUserId} onChange={(event) => setPayerUserId(event.target.value)} placeholder="Payer user ID" />
          </div>

          <div className="grid gap-3 lg:grid-cols-[180px_180px_180px_180px_180px]">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Workflow</Label>
              <MultiFilterSelect
                id="refund-workflow-filter"
                options={REFUND_WORKFLOW_TYPES.map((item) => ({ value: item, label: humanize(item) }))}
                value={workflowTypes}
                onChange={setWorkflowTypes}
                placeholder="Any workflow"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Reconciliation</Label>
              <Select value={gatewayExecutionBlocked} onValueChange={(value) => setGatewayExecutionBlocked(value as typeof gatewayExecutionBlocked)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>Any</SelectItem>
                  <SelectItem value="true">Needs reconciliation</SelectItem>
                  <SelectItem value="false">Ready</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Requested from</Label>
              <Input type="datetime-local" value={requestedFrom} onChange={(event) => setRequestedFrom(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Requested to</Label>
              <Input type="datetime-local" value={requestedTo} onChange={(event) => setRequestedTo(event.target.value)} />
            </div>
            <div className="grid grid-cols-[1fr_92px] gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Sort by</Label>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as RefundSortBy)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{sortOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Dir</Label>
                <Select value={sortDirection} onValueChange={(value) => setSortDirection(value as RefundSortDirection)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DESC">DESC</SelectItem>
                    <SelectItem value="ASC">ASC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg">Refund Candidates</CardTitle>
              <CardDescription>Showing {data.content.length} of {data.totalElements} matching refunds.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="h-9 rounded-md px-3">
                {selectedRows.length} selected
              </Badge>
              <Button type="button" variant="outline" disabled={!approvalRows.length || batchSubmitting} onClick={() => openBatchDialog("approve")}>
                <ShieldCheck className="h-4 w-4" />
                Approve
              </Button>
              <Button type="button" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" disabled={!rejectionRows.length || batchSubmitting} onClick={() => openBatchDialog("reject")}>
                <Ban className="h-4 w-4" />
                Reject
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isRefreshing ? <ListLoading /> : null}
          {!isRefreshing && data.content.length === 0 ? (
            <div className="rounded-lg border bg-muted/20 p-10 text-center">
              <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
              <h2 className="mt-3 text-lg font-semibold">No refunds found</h2>
              <p className="mt-1 text-sm text-muted-foreground">Try another status, identifier, or date range.</p>
            </div>
          ) : null}
          {!isRefreshing && data.content.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelectableChecked}
                        disabled={!selectableRows.length}
                        onCheckedChange={(value) => toggleAllSelectable(value === true)}
                        aria-label="Select all reviewable refunds"
                      />
                    </TableHead>
                    <TableHead>Refund</TableHead>
                    <TableHead>Customer / shipment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead className="text-right">Amounts</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Review status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.content.map((row) => {
                    const key = rowKey(row)
                    const selectable = Boolean(row.approvalAllowed || row.rejectionAllowed)
                    return (
                      <TableRow key={key} data-state={selectedKeys.has(key) ? "selected" : undefined}>
                        <TableCell>
                          <Checkbox
                            checked={selectedKeys.has(key)}
                            disabled={!selectable}
                            onCheckedChange={(value) => toggleSelected(key, value === true)}
                            aria-label={`Select refund ${row.refundId}`}
                          />
                        </TableCell>
                        <TableCell className="min-w-[240px]">
                          <div className="min-w-0">
                            <p className="truncate font-mono text-xs text-muted-foreground">{row.refundId}</p>
                            <p className="mt-1 truncate font-mono text-sm font-semibold">{row.paymentId}</p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">{humanize(row.reasonCode)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[220px]">
                          <p className="truncate font-medium">{row.trackingNumber || row.shippingOrderId || "Payment-level refund"}</p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">{row.payerUserId || "Unknown payer"}</p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <StatusBadge status={row.status} />
                            <Badge variant="outline" className="whitespace-nowrap rounded-md text-[11px]">
                              {humanize(row.workflowType)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[190px]">
                          <div className="flex items-center gap-2">
                            {destinationIcon(row.destination)}
                            <div>
                              <p className="font-medium">{humanize(row.destination)}</p>
                              <p className="text-xs text-muted-foreground">{humanize(row.paymentMethodType)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[170px] text-right">
                          <p className="font-mono font-semibold">{money(row.proposedAmount, row.currency || "CAD")}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Approved {money(row.approvedAmount, row.currency || "CAD")}</p>
                          <p className="text-xs text-muted-foreground">Processed {money(row.processedAmount, row.currency || "CAD")}</p>
                        </TableCell>
                        <TableCell className="min-w-[190px]">
                          <p className="text-sm">Requested {formatDateTime(row.requestedAt)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Reviewed {formatDateTime(row.reviewedAt)}</p>
                        </TableCell>
                        <TableCell><ActionabilityBadge row={row} /></TableCell>
                        <TableCell className="text-right">
                          <Button type="button" variant="outline" size="sm" onClick={() => openRefund(row)}>
                            <Eye className="h-4 w-4" />
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}

          {totalPages > 1 ? (
            <div className="mt-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
              <span className="text-sm text-muted-foreground">Page {currentPage + 1} of {totalPages}</span>
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    {currentPage > 0 ? (
                      <PaginationPrevious href={pageHref(currentPage - 1)} />
                    ) : (
                      <span className="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground">Previous</span>
                    )}
                  </PaginationItem>
                  <PaginationItem>
                    {currentPage + 1 < totalPages ? (
                      <PaginationNext href={pageHref(currentPage + 1)} />
                    ) : (
                      <span className="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground">Next</span>
                    )}
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="flex w-full flex-col overflow-hidden p-0 sm:max-w-5xl xl:max-w-[1500px]">
          <SheetHeader className="border-b p-6 pr-12">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <SheetTitle className="truncate text-2xl">
                  Refund {detail?.summary?.refundId || "detail"}
                </SheetTitle>
                <SheetDescription className="mt-1">
                  {detail?.summary?.paymentId || "Loading payment and refund context"}
                </SheetDescription>
              </div>
              {detail?.summary ? (
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={detail.summary.status} />
                  <Badge variant="outline" className="rounded-md">{humanize(detail.summary.destination)}</Badge>
                  {detail.summary.gatewayExecutionBlocked ? <Badge variant="destructive">Needs reconciliation</Badge> : null}
                </div>
              ) : null}
            </div>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {detailLoading && !detail ? <DetailLoading /> : null}
            {detailError ? (
              <div className="p-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Unable to load refund</AlertTitle>
                  <AlertDescription>{detailError}</AlertDescription>
                </Alert>
              </div>
            ) : null}
            {detail ? (
              <div className="grid gap-4 p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="min-w-0 space-y-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <MetadataItem label="Proposed" value={money(detail.summary?.proposedAmount, detailCurrency)} />
                    <MetadataItem label="Approved" value={money(detail.summary?.approvedAmount, detailCurrency)} />
                    <MetadataItem label="Processed" value={money(detail.summary?.processedAmount, detailCurrency)} />
                    <MetadataItem label="Completed" value={formatDateTime(detail.summary?.completedAt)} />
                  </div>

                  <AmountPanel title="Proposed Amount" amount={detail.proposedAmount} currency={detailCurrency} />

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Refund Explanation</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2">
                      <MetadataItem label="Customer Message" value={detail.customerFacingReason || humanize(detail.summary?.reasonCode)} />
                      <MetadataItem label="Internal Note" value={detail.internalReason || "N/A"} />
                      <MetadataItem label="Review notes" value={detail.reviewNotes || "N/A"} />
                      <MetadataItem label="Rejection reason" value={detail.rejectionReason || "N/A"} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Why This Refund Exists</CardTitle>
                      <CardDescription>{humanize(detail.trigger?.sourceType)}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-3">
                        <MetadataItem label="Detected Time" value={formatDateTime(detail.trigger?.detectedAt)} />
                        <MetadataItem label="Refund Policy" value={[humanize(detail.trigger?.policyCode), detail.trigger?.policyVersion].filter((item) => item && item !== "N/A").join(" / ") || "N/A"} />
                        <MetadataItem label="Related Shipment or Payment" value={detail.trigger?.sourceReferenceId || detail.trigger?.shippingOrderId || "N/A"} mono />
                      </div>
                      {detail.trigger?.evidence ? (
                        <div className="grid gap-2 md:grid-cols-2">
                          {Object.entries(detail.trigger.evidence).map(([key, value]) => (
                            <MetadataItem key={key} label={humanize(key)} value={<EvidenceValue value={value} fieldName={key} />} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No supporting details were returned.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <History className="h-5 w-5" />
                        History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {detail.auditTrail?.length ? (
                        <div className="space-y-3">
                          {detail.auditTrail.map((event, index) => (
                            <div key={event.auditEventId || index} className="rounded-lg border bg-muted/20 p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold">{humanize(event.eventType)}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {humanize(event.previousStatus)} to {humanize(event.newStatus)}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground">{formatDateTime(event.occurredAt)}</span>
                              </div>
                              <p className="mt-2 text-sm">{event.notes || "No notes"}</p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                {event.actor?.displayNameSnapshot || event.actor?.actorId || humanize(event.actor?.actorType)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No audit events returned.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <aside className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Payment and Shipment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <MetadataItem label="Payment ID" value={detail.summary?.paymentId || "N/A"} mono />
                      <MetadataItem label="Refund ID" value={detail.summary?.refundId || "N/A"} mono />
                      <MetadataItem label="Payer user" value={detail.summary?.payerUserId || "N/A"} mono />
                      <MetadataItem label="Tracking" value={detail.summary?.trackingNumber || "N/A"} mono />
                      <MetadataItem label="Shipping order" value={detail.summary?.shippingOrderId || "N/A"} mono />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Card Refund Processing</CardTitle>
                      <CardDescription>{detail.moneris?.environment || humanize(detail.summary?.paymentProvider)}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <MetadataItem label="Original Transaction Number" value={detail.moneris?.originalTransactionNumber || "N/A"} mono />
                      <MetadataItem label="E-commerce Indicator" value={detail.moneris?.ecommerceIndicator || "N/A"} />
                      <MetadataItem label="Processing Country" value={detail.moneris?.processingCountryCode || "N/A"} />
                      <Separator />
                      {detail.moneris?.attempts?.length ? (
                        <div className="space-y-2">
                          {detail.moneris.attempts.map((attempt, index) => (
                            <div key={attempt.attemptId || index} className="rounded-md border bg-muted/20 p-3 text-sm">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold">{humanize(attempt.attemptType)}</p>
                                <OutcomeBadge outcome={attempt.outcome} />
                              </div>
                              <p className="mt-2 text-xs text-muted-foreground">
                                {formatDateTime(attempt.startedAt)} - {formatDateTime(attempt.completedAt)}
                              </p>
                              {attempt.receipt ? (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  <p>Reference number: {attempt.receipt.referenceNumber || "N/A"}</p>
                                  <p>Response: {attempt.receipt.responseCode || "N/A"} - {attempt.receipt.message || "No message"}</p>
                                  <p>Refund transaction: {attempt.receipt.refundTransactionNumber || "N/A"}</p>
                                </div>
                              ) : null}
                              {attempt.transportErrorMessage ? <p className="mt-2 text-xs text-red-700">{attempt.transportErrorMessage}</p> : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No card refund attempts were returned.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Billing Account Credit</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <MetadataItem label="Billing Account ID" value={detail.billingCredit?.billingAccountId || "N/A"} mono />
                      <MetadataItem label="Billing Adjustment ID" value={detail.billingCredit?.billingAdjustmentId || "N/A"} mono />
                      <MetadataItem label="Credit Amount" value={money(detail.billingCredit?.creditedAmount, detailCurrency)} />
                      <MetadataItem label="Credit Created" value={formatDateTime(detail.billingCredit?.creditedAt)} />
                    </CardContent>
                  </Card>
                </aside>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(batchDialog)} onOpenChange={(open) => !open && setBatchDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{batchDialog === "approve" ? "Approve refunds" : "Reject refunds"}</DialogTitle>
            <DialogDescription>
              {batchDialog === "approve"
                ? "Approvals are processed independently. Card refunds are sent to the card processor immediately; postpay refunds create billing account credits."
                : "Rejections release the reserved refund amounts and do not contact the card processor."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              {batchDialog === "approve" ? <ShieldCheck className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <AlertTitle>{batchDialog === "approve" ? `${approvalRows.length} eligible approvals` : `${rejectionRows.length} eligible rejections`}</AlertTitle>
              <AlertDescription>
                {selectedRows.length - (batchDialog === "approve" ? approvalRows.length : rejectionRows.length)} selected rows are not eligible for this action.
              </AlertDescription>
            </Alert>

            {batchDialog === "approve" && approvalRows.length === 1 ? (
              <div className="space-y-1">
                <Label>Approved amount override optional</Label>
                <Input type="number" min="0" step="0.01" value={approvedOverride} onChange={(event) => setApprovedOverride(event.target.value)} placeholder="Leave blank to approve proposed amount" />
              </div>
            ) : null}

            {batchDialog === "reject" ? (
              <div className="space-y-1">
                <Label>Rejection reason</Label>
                <Textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Explain why these refund candidates should not be processed." />
              </div>
            ) : null}

            <div className="space-y-1">
              <Label>Review notes optional</Label>
              <Textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} placeholder="Notes for the refund history." />
            </div>

            <ResultsPanel results={actionResults} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={batchSubmitting} onClick={() => setBatchDialog(null)}>
              Close
            </Button>
            <Button
              type="button"
              disabled={batchSubmitting || (batchDialog === "approve" ? !approvalRows.length : !rejectionRows.length)}
              onClick={submitBatchAction}
            >
              {batchSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create manual refund</DialogTitle>
            <DialogDescription>
              Manual refunds are approved by the authenticated admin and processed immediately against the original payment method or billing account.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Payment ID</Label>
              <Input value={manualForm.paymentId} onChange={(event) => updateManualForm("paymentId", event.target.value)} placeholder="Payment_1" />
            </div>
            <div className="grid grid-cols-[1fr_110px] gap-2">
              <div className="space-y-1">
                <Label>Amount</Label>
                <Input type="number" min="0" step="0.01" value={manualForm.amount} onChange={(event) => updateManualForm("amount", event.target.value)} placeholder="5.00" />
              </div>
              <div className="space-y-1">
                <Label>Currency</Label>
                <Input value={manualForm.currency} onChange={(event) => updateManualForm("currency", event.target.value.toUpperCase())} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Reason</Label>
              <Select value={manualForm.reasonCode} onValueChange={(value) => updateManualForm("reasonCode", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REFUND_REASON_CODES.map((item) => <SelectItem key={item} value={item}>{humanize(item)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Idempotency key optional</Label>
              <Input value={manualForm.idempotencyKey} onChange={(event) => updateManualForm("idempotencyKey", event.target.value)} placeholder="manual-refund:Payment_1:case-123" />
            </div>
            <div className="space-y-1">
              <Label>Tracking number optional</Label>
              <Input value={manualForm.trackingNumber} onChange={(event) => updateManualForm("trackingNumber", event.target.value)} placeholder="MAPLEX..." />
            </div>
            <div className="space-y-1">
              <Label>Shipping order optional</Label>
              <Input value={manualForm.shippingOrderId} onChange={(event) => updateManualForm("shippingOrderId", event.target.value)} placeholder="ShippingOrder_1" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Customer-facing reason optional</Label>
              <Textarea value={manualForm.customerFacingReason} onChange={(event) => updateManualForm("customerFacingReason", event.target.value)} placeholder="Courtesy refund for a service issue." />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Internal reason optional</Label>
              <Textarea value={manualForm.internalReason} onChange={(event) => updateManualForm("internalReason", event.target.value)} placeholder="Admin adjustment approved by support." />
            </div>
          </div>

          {manualError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Manual refund failed</AlertTitle>
              <AlertDescription>{manualError}</AlertDescription>
            </Alert>
          ) : null}

          {manualResult ? (
            <Alert>
              <ReceiptText className="h-4 w-4" />
              <AlertTitle>{humanize(manualResult.outcome)}</AlertTitle>
              <AlertDescription>{manualResult.message || "Manual refund response returned."}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={manualSubmitting} onClick={() => setManualOpen(false)}>
              Close
            </Button>
            <Button type="button" disabled={manualSubmitting} onClick={submitManualRefund}>
              {manualSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
