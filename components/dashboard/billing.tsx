"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Download,
  Loader2,
  ReceiptText,
  XCircle,
  WalletCards,
} from "lucide-react"
import {
  getClientBillingPayments,
  getClientInvoices,
  getClientUnbilledCharges,
  getBillingDashboard,
  initiateBillingBalancePayment,
  type BillingPageResponse,
  type BillingDashboardResponse,
  type BillingInvoice,
  type BillingPayment,
  type BillingUnbilledCharge,
} from "@/lib/billing-service"
import {
  finalizeMonerisPaymentViaApi,
  loadMonerisScript,
  type FinalizePaymentResponse,
} from "@/lib/moneris/moneris-service"
import { MONERIS_CHECKOUT_MODE } from "@/lib/config"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

type StatusTone = "success" | "warning" | "danger" | "progress" | "neutral"
type BillingTab = "overview" | "invoices" | "payments" | "unbilled"
type BillingView = "dashboard" | "payment"
type PaymentStep = "entry" | "initiating" | "checkout" | "finalizing" | "success" | "failed" | "cancelled" | "unknown"

const HISTORY_PAGE_SIZE = 20
const BILLING_CHECKOUT_DIV_ID = "billingMonerisCheckoutDivId"

const statusStyles: Record<StatusTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-red-200 bg-red-50 text-red-800",
  progress: "border-blue-200 bg-blue-50 text-blue-800",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
}

function humanize(value?: string | null) {
  if (!value) return "N/A"
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function money(value?: number | null, currency = "CAD") {
  if (typeof value !== "number") return "N/A"
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency || "CAD",
    maximumFractionDigits: 2,
  }).format(value)
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
  }).format(date)
}

function invoiceTone(invoice?: BillingInvoice | null): StatusTone {
  const status = (invoice?.status || "").toLowerCase()
  if (invoice?.overdue || status.includes("overdue")) return "danger"
  if (status === "paid") return "success"
  if (status.includes("partial")) return "warning"
  if (status === "generated" || status === "issued") return "progress"
  return "neutral"
}

function paymentTone(payment?: BillingPayment | null): StatusTone {
  const status = (payment?.status || "").toLowerCase()
  if (status === "successful" || status === "success" || status === "paid") return "success"
  if (status === "failed" || status === "declined") return "danger"
  if (status === "pending" || status === "processing") return "warning"
  return "neutral"
}

function statusBadge(label?: string | null, tone: StatusTone = "neutral") {
  return (
    <Badge
      variant="outline"
      className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-normal ${statusStyles[tone]}`}
    >
      {humanize(label)}
    </Badge>
  )
}

function StatCard({
  label,
  value,
  helper,
  icon,
  emphasized,
  action,
}: {
  label: string
  value: string
  helper?: string
  icon: ReactNode
  emphasized?: boolean
  action?: ReactNode
}) {
  return (
    <div
      className={`relative flex min-h-[172px] flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm ${
        emphasized ? "overflow-hidden" : ""
      }`}
    >
      {emphasized ? <div className="absolute left-0 top-0 h-full w-1 bg-red-700" /> : null}
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className={`${emphasized ? "text-red-700" : "text-slate-500"}`}>
          {icon}
        </div>
      </div>
      <p className="mt-2 font-mono text-2xl font-bold text-slate-950">{value}</p>
      <div className="mt-auto pt-5">
        {action || (helper ? <p className="text-xs font-medium text-slate-500">{helper}</p> : null)}
      </div>
    </div>
  )
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
      {message}
    </div>
  )
}

function TableLoading() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-16 rounded-lg" />
      ))}
    </div>
  )
}

function HistoryError({ message }: { message: string }) {
  return (
    <div className="p-4">
      <Alert variant="destructive" className="py-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">{message}</AlertDescription>
      </Alert>
    </div>
  )
}

function PaginationFooter({
  page,
  totalPages,
  totalElements,
  isLoading,
  onPrevious,
  onNext,
}: {
  page: number
  totalPages: number
  totalElements: number
  isLoading: boolean
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">
        Page {totalPages === 0 ? 0 : page + 1} / {totalPages || 0}
        <span className="ml-2">({totalElements} total)</span>
      </p>
      <div className="flex gap-2">
        <button
          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50"
          disabled={isLoading || page <= 0}
          onClick={onPrevious}
          type="button"
        >
          Prev
        </button>
        <button
          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50"
          disabled={isLoading || totalPages === 0 || page + 1 >= totalPages}
          onClick={onNext}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  )
}

function CompactInvoiceRow({
  invoice,
  selected,
  onSelect,
}: {
  invoice: BillingInvoice
  selected: boolean
  onSelect: () => void
}) {
  const currency = invoice.currency || "CAD"

  return (
    <button
      className={`grid w-full grid-cols-[minmax(0,1.2fr)_0.8fr_0.8fr] gap-3 border-b border-slate-200 px-4 py-4 text-left transition-colors hover:bg-white ${
        selected ? "border-l-2 border-l-red-700 bg-white shadow-[inset_0_1px_0_rgba(226,232,240,1)]" : "bg-slate-50"
      }`}
      onClick={onSelect}
      type="button"
    >
      <div className="min-w-0">
        <p className="truncate font-mono text-xs font-bold text-slate-950">{invoice.invoiceNumber || invoice.invoiceId}</p>
        <p className="mt-1 text-xs text-slate-500">{formatDate(invoice.generatedAt || invoice.billingPeriodEnd)}</p>
      </div>
      <div className="text-right font-mono text-sm font-bold text-slate-950">{money(invoice.amountDue, currency)}</div>
      <div className="flex justify-end">{statusBadge(invoice.status, invoiceTone(invoice))}</div>
    </button>
  )
}

function ChargeRow({ charge }: { charge: BillingUnbilledCharge }) {
  const currency = charge.currency || "CAD"

  return (
    <div className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1.6fr)_1fr_1fr_1fr] md:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-950">{charge.description || humanize(charge.chargeType)}</p>
        <p className="mt-1 font-mono text-xs text-slate-500">{charge.shippingOrderId || charge.chargeId}</p>
      </div>
      <div>{statusBadge(charge.status, "progress")}</div>
      <div className="text-sm text-slate-600">{formatDateTime(charge.postedAt || charge.orderDateTime)}</div>
      <div className="text-sm font-bold text-slate-950">{money(charge.totalAmount, currency)}</div>
    </div>
  )
}

function PaymentRow({ payment }: { payment: BillingPayment }) {
  const currency = payment.currency || "CAD"

  return (
    <div className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1.6fr)_1fr_1fr_1fr] md:items-center">
      <div className="min-w-0">
        <p className="truncate font-mono text-sm font-bold text-slate-950">{payment.billingPaymentId}</p>
        <p className="mt-1 text-xs text-slate-500">{payment.appliedToLabel || payment.invoiceId || "Account payment"}</p>
      </div>
      <div>{statusBadge(payment.status, paymentTone(payment))}</div>
      <div className="text-sm text-slate-600">{formatDateTime(payment.paymentDate)}</div>
      <div className="text-sm font-bold text-slate-950">{money(payment.amount, currency)}</div>
    </div>
  )
}

function OverviewPanel({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string
  actionLabel: string
  onAction: () => void
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
        <button
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-950"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </section>
  )
}

function OverviewInvoiceRow({ invoice }: { invoice: BillingInvoice }) {
  const currency = invoice.currency || "CAD"

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-mono text-xs font-bold text-slate-950">{invoice.invoiceNumber || invoice.invoiceId}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Due {formatDate(invoice.dueDate)}</span>
          {statusBadge(invoice.status, invoiceTone(invoice))}
        </div>
      </div>
      <span className="whitespace-nowrap font-mono text-sm font-bold text-slate-950">
        {money(invoice.amountDue, currency)}
      </span>
    </div>
  )
}

function OverviewChargeRow({ charge }: { charge: BillingUnbilledCharge }) {
  const currency = charge.currency || "CAD"

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-950">{charge.description || humanize(charge.chargeType)}</p>
        <p className="mt-1 truncate font-mono text-xs text-slate-500">{charge.shippingOrderId || charge.chargeId}</p>
      </div>
      <span className="whitespace-nowrap font-mono text-sm font-bold text-slate-950">
        {money(charge.totalAmount, currency)}
      </span>
    </div>
  )
}

function OverviewPaymentRow({ payment }: { payment: BillingPayment }) {
  const currency = payment.currency || "CAD"

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-mono text-xs font-bold text-slate-950">{payment.billingPaymentId}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">{formatDate(payment.paymentDate)}</span>
          {statusBadge(payment.status, paymentTone(payment))}
        </div>
      </div>
      <span className="whitespace-nowrap font-mono text-sm font-bold text-slate-950">
        {money(payment.amount, currency)}
      </span>
    </div>
  )
}

function OverviewEmptyRow({ message }: { message: string }) {
  return <div className="px-4 py-8 text-center text-sm text-slate-500">{message}</div>
}

function TabButton({
  active,
  children,
  hasAlert,
  onClick,
}: {
  active: boolean
  children: ReactNode
  hasAlert?: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`relative whitespace-nowrap pb-3 text-sm transition-colors ${
        active
          ? "-mb-px border-b-2 border-slate-950 font-semibold text-slate-950"
          : "text-slate-500 hover:text-slate-950"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
      {hasAlert ? <span className="absolute -right-3 top-0 h-2 w-2 rounded-full bg-red-700" /> : null}
    </button>
  )
}

function InvoiceDetail({
  invoice,
  currency,
  canDownload,
}: {
  invoice: BillingInvoice | null
  currency: string
  canDownload: boolean
}) {
  if (!invoice) {
    return <EmptyPanel message="Select an invoice to view details." />
  }

  const invoiceCurrency = invoice.currency || currency

  return (
    <div className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-white p-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h2 className="truncate font-mono text-xl font-bold text-slate-950">
              Invoice #{invoice.invoiceNumber || invoice.invoiceId}
            </h2>
            {statusBadge(invoice.status, invoiceTone(invoice))}
          </div>
          <p className="text-xs font-medium uppercase text-slate-500">
            Billing Period: {formatDate(invoice.billingPeriodStart)} - {formatDate(invoice.billingPeriodEnd)}
          </p>
        </div>
        {canDownload && invoice.downloadable && invoice.invoiceDocumentUrl ? (
          <a
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            href={invoice.invoiceDocumentUrl}
            rel="noreferrer"
            target="_blank"
          >
            <Download className="h-4 w-4" />
            PDF
          </a>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase text-slate-500">Invoice Start Date</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{formatDate(invoice.billingPeriodStart)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase text-slate-500">Invoice End Date</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{formatDate(invoice.billingPeriodEnd)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase text-slate-500">Generated</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{formatDateTime(invoice.generatedAt)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase text-slate-500">Due Date</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{formatDate(invoice.dueDate)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-950">
              <ReceiptText className="h-5 w-5 text-red-700" />
              Invoice Breakdown
            </h3>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-[1fr_120px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                <span>Item</span>
                <span className="text-right">Amount</span>
              </div>
              {[
                ["Previous Balance", invoice.previousBalance],
                ["New Charges", invoice.newChargesAmount],
                ["Subtotal", invoice.subtotal],
                ["Tax", invoice.taxAmount],
                ["Credit Applied", invoice.creditApplied ? -invoice.creditApplied : invoice.creditApplied],
                ["Amount Paid", invoice.amountPaid ? -invoice.amountPaid : invoice.amountPaid],
              ].map(([label, value]) => (
                <div key={label as string} className="grid grid-cols-[1fr_120px] border-b border-slate-100 px-4 py-4 text-sm last:border-b-0">
                  <span className="font-medium text-slate-950">{label}</span>
                  <span className="text-right font-mono font-semibold text-slate-950">
                    {money(value as number | null | undefined, invoiceCurrency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
            <p className="text-[10px] font-bold uppercase text-slate-500">Total Amount Due</p>
            <p className="mt-3 font-mono text-3xl font-bold text-red-700">
              {money(invoice.amountDue, invoiceCurrency)}
            </p>
            <div className="mt-5 border-t border-slate-200 pt-4">
              <p className="text-xs text-slate-500">Account balance after this invoice</p>
              <p className="mt-1 font-mono text-lg font-bold text-slate-950">
                {money(invoice.totalAccountBalanceDue, invoiceCurrency)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function parseMonerisCallback(raw: unknown): { ticket?: string; response_code?: string; message?: string } | null {
  try {
    return typeof raw === "string" ? JSON.parse(raw) : (raw as { ticket?: string; response_code?: string; message?: string })
  } catch {
    return null
  }
}

function isFinalizeSuccess(result: FinalizePaymentResponse) {
  return result.success === true && result.status === "SUCCESSFUL"
}

function finalizeMessage(result: FinalizePaymentResponse) {
  return (
    result.message ||
    result.failureReason ||
    result.monerisResponseMessage ||
    "Payment could not be completed. Please try again."
  )
}

function BillingPaymentView({
  dashboard,
  onBack,
  onSuccess,
}: {
  dashboard: BillingDashboardResponse
  onBack: () => void
  onSuccess: () => Promise<void>
}) {
  const balanceDue = dashboard.summary.balanceDue
  const currency = dashboard.summary.currency || dashboard.billingAccount?.currency || "CAD"
  const billingAccountId = dashboard.billingAccount?.billingAccountId
  const [amountInput, setAmountInput] = useState(() => (balanceDue > 0 ? balanceDue.toFixed(2) : ""))
  const [step, setStep] = useState<PaymentStep>("entry")
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [result, setResult] = useState<FinalizePaymentResponse | null>(null)
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [isMonerisScriptLoaded, setIsMonerisScriptLoaded] = useState(false)
  const [pendingTicketId, setPendingTicketId] = useState<string | null>(null)
  const monerisCheckoutRef = useRef<any>(null)
  const finalizedTicketsRef = useRef<Set<string>>(new Set())
  const ticketIdRef = useRef<string | null>(null)

  const amount = Number(amountInput)
  const amountError = useMemo(() => {
    if (!amountInput.trim()) return "Enter a payment amount."
    if (!Number.isFinite(amount)) return "Enter a valid payment amount."
    if (amount <= 0) return "Payment amount must be greater than 0."
    if (amount > balanceDue) return "Payment amount cannot be greater than the total balance due."
    return null
  }, [amount, amountInput, balanceDue])

  const formatCurrency = (value?: number | null) => money(value, currency)

  const closeCheckout = (ticket?: string | null) => {
    if (ticket && monerisCheckoutRef.current) {
      try {
        monerisCheckoutRef.current.closeCheckout(ticket)
      } catch (error) {
        console.warn("Moneris checkout was already closed or unavailable.", error)
      }
    }
  }

  useEffect(() => {
    ticketIdRef.current = ticketId
  }, [ticketId])

  useEffect(() => {
    return () => {
      closeCheckout(ticketIdRef.current)
    }
  }, [])

  const startMonerisCheckout = (nextTicketId: string) => {
    if (!isMonerisScriptLoaded || !monerisCheckoutRef.current) {
      setPendingTicketId(nextTicketId)
      return
    }

    setStep("checkout")
    monerisCheckoutRef.current.startCheckout(nextTicketId)
    setPendingTicketId(null)
    setTimeout(() => {
      const frame = document.querySelector(`#${BILLING_CHECKOUT_DIV_ID} iframe`) as HTMLIFrameElement | null
      if (frame) frame.style.height = "760px"
    }, 100)
  }

  const finalizeTicket = async (nextTicketId: string) => {
    if (finalizedTicketsRef.current.has(nextTicketId)) return
    finalizedTicketsRef.current.add(nextTicketId)

    setStep("finalizing")
    setPaymentError(null)

    try {
      const finalizeResult = await finalizeMonerisPaymentViaApi({ ticketId: nextTicketId })
      setResult(finalizeResult)

      if (isFinalizeSuccess(finalizeResult)) {
        setStep("success")
        await onSuccess()
      } else if (finalizeResult.finalized === false || finalizeResult.status === "CANCELLED") {
        setStep("cancelled")
        setPaymentError(finalizeMessage(finalizeResult))
      } else if (finalizeResult.status) {
        setStep("failed")
        setPaymentError(finalizeMessage(finalizeResult))
      } else {
        setStep("unknown")
        setPaymentError(finalizeMessage(finalizeResult))
      }
    } catch (error) {
      console.error("Finalize billing payment error:", error)
      setStep("unknown")
      setPaymentError(
        error instanceof Error
          ? error.message
          : "We could not confirm the payment result. Please return to billing and check again.",
      )
    } finally {
      closeCheckout(nextTicketId)
    }
  }

  useEffect(() => {
    loadMonerisScript()
      .then(() => setIsMonerisScriptLoaded(true))
      .catch((error) => {
        console.error("Failed to load Moneris script:", error)
        setPaymentError("Payment checkout could not be loaded. Please try again.")
      })
  }, [])

  useEffect(() => {
    if (!isMonerisScriptLoaded || !window.monerisCheckout) return

    try {
      const mc = new window.monerisCheckout()
      mc.setMode(MONERIS_CHECKOUT_MODE)
      mc.setCheckoutDiv(BILLING_CHECKOUT_DIV_ID)

      mc.setCallback("page_loaded", () => {
        setStep("checkout")
      })

      mc.setCallback("payment_complete", (raw: unknown) => {
        const data = parseMonerisCallback(raw)
        if (data?.ticket) {
          void finalizeTicket(data.ticket)
          return
        }

        setStep("unknown")
        setPaymentError("Payment status could not be confirmed. Please return to billing and check again.")
      })

      mc.setCallback("cancel_transaction", (raw: unknown) => {
        const data = parseMonerisCallback(raw)
        if (data?.ticket) {
          void finalizeTicket(data.ticket)
          return
        }

        setStep("cancelled")
        setPaymentError("Payment cancelled.")
      })

      mc.setCallback("error_event", (raw: unknown) => {
        const data = parseMonerisCallback(raw)
        if (data?.ticket) {
          void finalizeTicket(data.ticket)
          return
        }

        setStep("failed")
        setPaymentError(data?.message || "Payment checkout returned an error. Please try again.")
      })

      monerisCheckoutRef.current = mc
    } catch (error) {
      console.error("Error during billing Moneris initialization:", error)
      setPaymentError("Failed to initialize payment checkout.")
    }
  }, [isMonerisScriptLoaded])

  useEffect(() => {
    if (!pendingTicketId || !isMonerisScriptLoaded || !monerisCheckoutRef.current) return
    startMonerisCheckout(pendingTicketId)
  }, [pendingTicketId, isMonerisScriptLoaded])

  const resetForRetry = () => {
    if (ticketId) closeCheckout(ticketId)
    setTicketId(null)
    setResult(null)
    setPaymentError(null)
    setStep("entry")
    finalizedTicketsRef.current.clear()
  }

  const handleStartPayment = async () => {
    if (!billingAccountId) {
      setPaymentError("Billing account is not available.")
      return
    }

    if (amountError) {
      setPaymentError(amountError)
      return
    }

    setStep("initiating")
    setPaymentError(null)
    setResult(null)

    try {
      const initiateResponse = await initiateBillingBalancePayment({
        billingAccountId,
        amount,
        currency,
        paymentCategory: "BILLING_ACCOUNT_ADJUSTMENT",
        paymentForType: "BILLING_ACCOUNT",
        description: `Billing account payment for ${billingAccountId}`,
      })

      if (!initiateResponse.ticketId) {
        throw new Error(initiateResponse.message || "Checkout did not return a Moneris ticket.")
      }

      setTicketId(initiateResponse.ticketId)
      startMonerisCheckout(initiateResponse.ticketId)
    } catch (error) {
      console.error("Initiate billing payment error:", error)
      setStep("entry")
      setPaymentError(error instanceof Error ? error.message : "Failed to initiate payment. Please try again.")
    }
  }

  if (!billingAccountId || balanceDue <= 0) {
    return (
      <div className="space-y-6">
        <button className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950" onClick={onBack} type="button">
          <ArrowLeft className="h-4 w-4" />
          Back to billing
        </button>
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-950">No payment due</h1>
          <p className="mt-2 text-sm text-slate-500">There is no outstanding balance on this billing account.</p>
        </div>
      </div>
    )
  }

  const isBusy = step === "initiating" || step === "finalizing"
  const showCheckout = step === "checkout" || step === "finalizing"

  return (
    <div className="space-y-6">
      <button className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950" onClick={onBack} type="button">
        <ArrowLeft className="h-4 w-4" />
        Back to billing
      </button>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Pay Balance</h1>
            <p className="mt-2 text-sm text-slate-500">Payments are applied to your oldest unpaid invoices first.</p>
          </div>

          {(step === "entry" || step === "initiating") && (
            <div className="mt-6 space-y-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-medium text-slate-500">Current total balance due</p>
                <p className="mt-2 font-mono text-3xl font-bold text-slate-950">{formatCurrency(balanceDue)}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-950" htmlFor="billing-payment-amount">
                  Payment amount
                </label>
                <div className="mt-2 flex overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-slate-950">
                  <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500">
                    {currency}
                  </span>
                  <input
                    className="min-w-0 flex-1 border-0 px-3 py-2.5 font-mono text-sm font-semibold outline-none focus:ring-0"
                    disabled={isBusy}
                    id="billing-payment-amount"
                    inputMode="decimal"
                    min="0.01"
                    onChange={(event) => setAmountInput(event.target.value)}
                    step="0.01"
                    type="number"
                    value={amountInput}
                  />
                </div>
                {amountError ? <p className="mt-2 text-sm text-red-700">{amountError}</p> : null}
              </div>

              {paymentError ? (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{paymentError}</AlertDescription>
                </Alert>
              ) : null}

              <button
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-60"
                disabled={isBusy || Boolean(amountError)}
                onClick={handleStartPayment}
                type="button"
              >
                {step === "initiating" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting checkout...
                  </>
                ) : (
                  <>Continue to payment</>
                )}
              </button>
            </div>
          )}

          <div className={`${showCheckout ? "mt-6 block" : "hidden"}`}>
            <div className="rounded-lg border border-slate-200">
              <div id={BILLING_CHECKOUT_DIV_ID} style={{ minHeight: "650px", width: "100%" }} />
            </div>
            {step === "finalizing" ? (
              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirming payment result...
              </div>
            ) : null}
          </div>

          {step === "success" ? (
            <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-700" />
                <div>
                  <h2 className="text-lg font-bold text-emerald-900">Payment successful</h2>
                  <p className="mt-1 text-sm text-emerald-800">Your balance may take a few moments to update.</p>
                  <div className="mt-4 space-y-1 text-sm text-emerald-900">
                    <p>
                      Amount paid: <span className="font-mono font-bold">{formatCurrency(result?.amount ?? amount)}</span>
                    </p>
                    {result?.paymentId ? (
                      <p>
                        Reference: <span className="font-mono font-bold">{result.paymentId}</span>
                      </p>
                    ) : null}
                  </div>
                  <button
                    className="mt-5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    onClick={onBack}
                    type="button"
                  >
                    Back to billing
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {(step === "failed" || step === "cancelled" || step === "unknown") ? (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-6">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-6 w-6 text-red-700" />
                <div>
                  <h2 className="text-lg font-bold text-red-900">
                    {step === "cancelled"
                      ? "Payment cancelled"
                      : step === "unknown"
                        ? "Payment status could not be confirmed"
                        : "Payment failed"}
                  </h2>
                  <p className="mt-1 text-sm text-red-800">
                    {paymentError || "Please try again or return to billing and refresh later."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                      onClick={resetForRetry}
                      type="button"
                    >
                      Try again
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={onBack}
                      type="button"
                    >
                      Back to billing
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Billing account</p>
          <p className="mt-1 truncate font-mono text-sm font-bold text-slate-950">{billingAccountId}</p>
          <div className="mt-5 space-y-3 border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Balance due</span>
              <span className="font-mono font-bold text-slate-950">{formatCurrency(balanceDue)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Currency</span>
              <span className="font-semibold text-slate-950">{currency}</span>
            </div>
          </div>
          <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            Secure checkout is processed by Moneris. Final payment status is confirmed after checkout completes.
          </div>
        </aside>
      </div>
    </div>
  )
}

export function Billing() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [dashboard, setDashboard] = useState<BillingDashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<BillingTab>("overview")
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [invoicePage, setInvoicePage] = useState(0)
  const [invoicePageData, setInvoicePageData] = useState<BillingPageResponse<BillingInvoice> | null>(null)
  const [isInvoicesLoading, setIsInvoicesLoading] = useState(false)
  const [invoicesError, setInvoicesError] = useState<string | null>(null)
  const [unbilledPage, setUnbilledPage] = useState(0)
  const [unbilledPageData, setUnbilledPageData] = useState<BillingPageResponse<BillingUnbilledCharge> | null>(null)
  const [isUnbilledLoading, setIsUnbilledLoading] = useState(false)
  const [unbilledError, setUnbilledError] = useState<string | null>(null)
  const [paymentsPage, setPaymentsPage] = useState(0)
  const [paymentsPageData, setPaymentsPageData] = useState<BillingPageResponse<BillingPayment> | null>(null)
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false)
  const [paymentsError, setPaymentsError] = useState<string | null>(null)
  const billingView: BillingView = searchParams.get("billingView") === "payment" ? "payment" : "dashboard"

  const navigateBillingView = (view: BillingView) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("section", "billing")

    if (view === "payment") {
      params.set("billingView", "payment")
    } else {
      params.delete("billingView")
    }

    router.push(`/dashboard?${params.toString()}`)
  }

  const refreshBillingDashboard = async () => {
    const data = await getBillingDashboard()
    setDashboard(data)
  }

  useEffect(() => {
    let cancelled = false

    async function loadBillingDashboard() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getBillingDashboard()
        if (!cancelled) setDashboard(data)
      } catch (err) {
        if (!cancelled) {
          setDashboard(null)
          setError(err instanceof Error ? err.message : "Failed to load billing dashboard.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadBillingDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (activeTab !== "invoices" || !dashboard?.actions.hasBillingAccount) return

    let cancelled = false

    async function loadInvoices() {
      setIsInvoicesLoading(true)
      setInvoicesError(null)

      try {
        const data = await getClientInvoices({ page: invoicePage, size: HISTORY_PAGE_SIZE })
        if (!cancelled) setInvoicePageData(data)
      } catch (err) {
        if (!cancelled) setInvoicesError(err instanceof Error ? err.message : "Failed to load invoices.")
      } finally {
        if (!cancelled) setIsInvoicesLoading(false)
      }
    }

    loadInvoices()

    return () => {
      cancelled = true
    }
  }, [activeTab, dashboard?.actions.hasBillingAccount, invoicePage])

  useEffect(() => {
    if (activeTab !== "unbilled" || !dashboard?.actions.hasBillingAccount) return

    let cancelled = false

    async function loadUnbilledCharges() {
      setIsUnbilledLoading(true)
      setUnbilledError(null)

      try {
        const data = await getClientUnbilledCharges({ page: unbilledPage, size: HISTORY_PAGE_SIZE })
        if (!cancelled) setUnbilledPageData(data)
      } catch (err) {
        if (!cancelled) setUnbilledError(err instanceof Error ? err.message : "Failed to load unbilled charges.")
      } finally {
        if (!cancelled) setIsUnbilledLoading(false)
      }
    }

    loadUnbilledCharges()

    return () => {
      cancelled = true
    }
  }, [activeTab, dashboard?.actions.hasBillingAccount, unbilledPage])

  useEffect(() => {
    if (activeTab !== "payments" || !dashboard?.actions.hasBillingAccount) return

    let cancelled = false

    async function loadPayments() {
      setIsPaymentsLoading(true)
      setPaymentsError(null)

      try {
        const data = await getClientBillingPayments({ page: paymentsPage, size: HISTORY_PAGE_SIZE })
        if (!cancelled) setPaymentsPageData(data)
      } catch (err) {
        if (!cancelled) setPaymentsError(err instanceof Error ? err.message : "Failed to load payments.")
      } finally {
        if (!cancelled) setIsPaymentsLoading(false)
      }
    }

    loadPayments()

    return () => {
      cancelled = true
    }
  }, [activeTab, dashboard?.actions.hasBillingAccount, paymentsPage])

  const currency = dashboard?.summary.currency || dashboard?.billingAccount?.currency || "CAD"
  const latestInvoice = dashboard?.latestInvoice ?? null
  const invoiceHistory = invoicePageData?.content ?? dashboard?.recentInvoices ?? []
  const unbilledHistory = unbilledPageData?.content ?? dashboard?.recentUnbilledCharges ?? []
  const paymentHistory = paymentsPageData?.content ?? dashboard?.recentPayments ?? []
  const selectedInvoice =
    invoiceHistory.find((invoice) => invoice.invoiceId === selectedInvoiceId) ||
    invoiceHistory[0] ||
    latestInvoice ||
    null

  const accountMeta = useMemo(() => {
    if (!dashboard?.billingAccount) return []

    return [
      ["Billing Mode", humanize(dashboard.billingAccount.billingMode)],
      ["Cycle", humanize(dashboard.billingAccount.billingCycle)],
      ["Status", humanize(dashboard.billingAccount.status)],
      ["Next Billing", formatDate(dashboard.billingAccount.nextBillingDate)],
    ]
  }, [dashboard?.billingAccount])

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="py-3">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!dashboard?.actions.hasBillingAccount || !dashboard.billingAccount) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <div className="flex max-w-2xl flex-col gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white">
            <ReceiptText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Postpay is not enabled</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your account is not Postpay enabled. If you need Postpay billing for regular shipments,
              reach out to us at{" "}
              <a className="font-semibold text-red-700 hover:underline" href="mailto:billing@maplexpress.com">
                billing@maplexpress.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (billingView === "payment") {
    return (
      <BillingPaymentView
        dashboard={dashboard}
        onBack={() => navigateBillingView("dashboard")}
        onSuccess={refreshBillingDashboard}
      />
    )
  }

  const tabs: Array<{ value: BillingTab; label: string; count?: number }> = [
    { value: "overview", label: "Overview" },
    { value: "invoices", label: "Invoices", count: invoicePageData?.totalElements ?? dashboard.recentInvoices.length },
    {
      value: "unbilled",
      label: "Unbilled",
      count: unbilledPageData?.totalElements ?? dashboard.recentUnbilledCharges.length,
    },
    { value: "payments", label: "Payments", count: paymentsPageData?.totalElements ?? dashboard.recentPayments.length },
  ]
  const overviewInvoices = dashboard.recentInvoices.slice(0, 5)
  const overviewUnbilledCharges = dashboard.recentUnbilledCharges.slice(0, 5)
  const overviewPayments = dashboard.recentPayments.slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 bg-white px-1 pt-1">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-950">Billing & Payments</h1>
              {statusBadge(dashboard.summary.balanceStatusLabel, dashboard.summary.hasOutstandingBalance ? "warning" : "success")}
            </div>
          </div>

        </div>

        <div className="mt-6 flex gap-8 overflow-x-auto">
          {tabs.map((tab) => (
            <TabButton
              key={tab.value}
              active={activeTab === tab.value}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
              {typeof tab.count === "number" ? <span className="ml-1 text-slate-400">{tab.count}</span> : null}
            </TabButton>
          ))}
        </div>
      </div>

      <div>
        {activeTab === "overview" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                action={
                  dashboard.actions.canPayBalance && dashboard.summary.balanceDue > 0 ? (
                    <button
                      className="inline-flex w-full items-center justify-center rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-800"
                      onClick={() => navigateBillingView("payment")}
                      type="button"
                    >
                      Pay Balance
                    </button>
                  ) : undefined
                }
                emphasized={dashboard.summary.hasOutstandingBalance}
                helper={dashboard.summary.balanceStatusLabel || undefined}
                icon={<WalletCards className="h-5 w-5" />}
                label="Total Balance Due"
                value={money(dashboard.summary.balanceDue, currency)}
              />
              <StatCard
                action={
                  <button
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 transition-colors hover:text-red-800"
                    onClick={() => setActiveTab("unbilled")}
                    type="button"
                  >
                    View Details <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                }
                icon={<ReceiptText className="h-5 w-5" />}
                label="Unbilled Charges"
                value={money(dashboard.summary.currentUnbilledAmount, currency)}
              />
              <StatCard
                helper={dashboard.summary.hasCredit ? "Available to apply" : "Ready to apply"}
                icon={<Banknote className="h-5 w-5" />}
                label="Available Credit"
                value={money(dashboard.summary.creditBalance, currency)}
              />
              <StatCard
                helper="Scheduled"
                icon={<CalendarClock className="h-5 w-5" />}
                label="Next Invoice"
                value={formatDate(dashboard.billingAccount.nextBillingDate)}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Billing Account</h2>
                    <p className="mt-1 font-mono text-xs text-slate-500">{dashboard.billingAccount.billingAccountId}</p>
                  </div>
                  {statusBadge(dashboard.billingAccount.status, dashboard.billingAccount.status === "ACTIVE" ? "success" : "neutral")}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {accountMeta.map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-950">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-slate-950">Last Invoice</h2>
                    {latestInvoice ? statusBadge(latestInvoice.status, invoiceTone(latestInvoice)) : null}
                  </div>
                </div>
                {latestInvoice ? (
                  <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="space-y-5 p-5">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-500">Invoice Number</p>
                        <p className="mt-1 truncate font-mono text-sm font-bold text-slate-950">
                          {latestInvoice.invoiceNumber || latestInvoice.invoiceId}
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-slate-500">Billing Period</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">
                            {formatDate(latestInvoice.billingPeriodStart)} - {formatDate(latestInvoice.billingPeriodEnd)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-slate-500">Due Date</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">{formatDate(latestInvoice.dueDate)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between border-t border-slate-200 bg-slate-50 p-5 md:border-l md:border-t-0">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-500">Invoice Amount Due</p>
                        <p className="mt-2 font-mono text-2xl font-bold text-red-700">
                          {money(latestInvoice.amountDue, latestInvoice.currency || currency)}
                        </p>
                      </div>
                      {dashboard.actions.canDownloadLatestInvoice && latestInvoice.invoiceDocumentUrl ? (
                        <a
                          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                          href={latestInvoice.invoiceDocumentUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="p-5">
                    <EmptyPanel message="No invoice has been generated yet." />
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <OverviewPanel actionLabel="All invoices" onAction={() => setActiveTab("invoices")} title="Last 5 Invoices">
                {overviewInvoices.length ? (
                  overviewInvoices.map((invoice) => <OverviewInvoiceRow key={invoice.invoiceId} invoice={invoice} />)
                ) : (
                  <OverviewEmptyRow message="No invoices available." />
                )}
              </OverviewPanel>

              <OverviewPanel actionLabel="All unbilled" onAction={() => setActiveTab("unbilled")} title="Last 5 Unbilled Charges">
                {overviewUnbilledCharges.length ? (
                  overviewUnbilledCharges.map((charge) => <OverviewChargeRow key={charge.chargeId} charge={charge} />)
                ) : (
                  <OverviewEmptyRow message="No unbilled charges right now." />
                )}
              </OverviewPanel>

              <OverviewPanel actionLabel="All payments" onAction={() => setActiveTab("payments")} title="Last 5 Payments">
                {overviewPayments.length ? (
                  overviewPayments.map((payment) => <OverviewPaymentRow key={payment.billingPaymentId} payment={payment} />)
                ) : (
                  <OverviewEmptyRow message="No payments available." />
                )}
              </OverviewPanel>
            </div>
          </div>
        ) : null}

        {activeTab === "invoices" ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(320px,35%)_minmax(0,1fr)]">
            <div className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4">
                <h2 className="text-base font-semibold text-slate-950">History</h2>
                <span className="text-xs font-medium text-slate-500">
                  {invoicePageData?.totalElements ?? invoiceHistory.length} total
                </span>
              </div>
              <div className="flex-1 overflow-y-auto bg-slate-50">
                {isInvoicesLoading ? (
                  <TableLoading />
                ) : invoicesError ? (
                  <HistoryError message={invoicesError} />
                ) : invoiceHistory.length ? (
                  invoiceHistory.map((invoice) => (
                    <CompactInvoiceRow
                      key={invoice.invoiceId}
                      invoice={invoice}
                      onSelect={() => setSelectedInvoiceId(invoice.invoiceId)}
                      selected={selectedInvoice?.invoiceId === invoice.invoiceId}
                    />
                  ))
                ) : (
                  <div className="p-4">
                    <EmptyPanel message="No recent invoices available." />
                  </div>
                )}
              </div>
              <PaginationFooter
                isLoading={isInvoicesLoading}
                onNext={() => setInvoicePage((prev) => prev + 1)}
                onPrevious={() => setInvoicePage((prev) => Math.max(0, prev - 1))}
                page={invoicePageData?.page ?? invoicePage}
                totalElements={invoicePageData?.totalElements ?? invoiceHistory.length}
                totalPages={invoicePageData?.totalPages ?? (invoiceHistory.length ? 1 : 0)}
              />
            </div>
            <InvoiceDetail
              canDownload={dashboard.actions.canDownloadLatestInvoice}
              currency={currency}
              invoice={selectedInvoice}
            />
          </div>
        ) : null}

        {activeTab === "unbilled" ? (
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white p-5">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
                <CalendarClock className="h-5 w-5 text-red-700" />
                Unbilled Charges
              </h2>
              <span className="font-mono text-sm font-bold text-slate-950">
                {money(dashboard.summary.currentUnbilledAmount, currency)}
              </span>
            </div>
            {isUnbilledLoading ? (
              <TableLoading />
            ) : unbilledError ? (
              <HistoryError message={unbilledError} />
            ) : unbilledHistory.length ? (
              <div className="divide-y divide-slate-200">
                {unbilledHistory.map((charge) => <ChargeRow key={charge.chargeId} charge={charge} />)}
              </div>
            ) : (
              <div className="p-5">
                <EmptyPanel message="No unbilled charges right now." />
              </div>
            )}
            <PaginationFooter
              isLoading={isUnbilledLoading}
              onNext={() => setUnbilledPage((prev) => prev + 1)}
              onPrevious={() => setUnbilledPage((prev) => Math.max(0, prev - 1))}
              page={unbilledPageData?.page ?? unbilledPage}
              totalElements={unbilledPageData?.totalElements ?? unbilledHistory.length}
              totalPages={unbilledPageData?.totalPages ?? (unbilledHistory.length ? 1 : 0)}
            />
          </section>
        ) : null}

        {activeTab === "payments" ? (
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white p-5">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                Payments
              </h2>
              <span className="text-xs font-medium text-slate-500">
                {paymentsPageData?.totalElements ?? paymentHistory.length} total
              </span>
            </div>
            {isPaymentsLoading ? (
              <TableLoading />
            ) : paymentsError ? (
              <HistoryError message={paymentsError} />
            ) : paymentHistory.length ? (
              <div className="divide-y divide-slate-200">
                {paymentHistory.map((payment) => <PaymentRow key={payment.billingPaymentId} payment={payment} />)}
              </div>
            ) : (
              <div className="p-5">
                <EmptyPanel message="No recent payments available." />
              </div>
            )}
            <PaginationFooter
              isLoading={isPaymentsLoading}
              onNext={() => setPaymentsPage((prev) => prev + 1)}
              onPrevious={() => setPaymentsPage((prev) => Math.max(0, prev - 1))}
              page={paymentsPageData?.page ?? paymentsPage}
              totalElements={paymentsPageData?.totalElements ?? paymentHistory.length}
              totalPages={paymentsPageData?.totalPages ?? (paymentHistory.length ? 1 : 0)}
            />
          </section>
        ) : null}
      </div>
    </div>
  )
}
