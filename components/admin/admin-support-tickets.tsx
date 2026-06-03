"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  AlertCircle,
  Archive,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  FilterX,
  Inbox,
  Loader2,
  MessageSquare,
  NotebookPen,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Users,
  XCircle,
} from "lucide-react"
import { apiFetch } from "@/lib/client-api"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  RELATED_RESOURCE_TYPES,
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_PRIORITIES,
  SUPPORT_TICKET_STATUSES,
  type AdminSupportTicketFilters,
  type GenericSupportTicketActionResponse,
  type PagedSupportTicketSummaryResponse,
  type RelatedResourceRef,
  type RelatedResourceType,
  type SupportMessageSenderType,
  type SupportTicketApiError,
  type SupportTicketAttachment,
  type SupportTicketCategory,
  type SupportTicketDetail,
  type SupportTicketMessage,
  type SupportTicketPriority,
  type SupportTicketStatus,
  type SupportTicketSummary,
} from "@/types/admin-support-tickets"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

const ALL_FILTER = "ALL"
const DEFAULT_SIZE = 20

type FilterValue<T extends string> = T | typeof ALL_FILTER
type ActionDialogType = "resolve" | "close" | "archive" | null

const statusLabels: Record<SupportTicketStatus, string> = {
  OPEN: "Open",
  WAITING_FOR_ADMIN: "Waiting for admin",
  WAITING_FOR_CUSTOMER: "Waiting for customer",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
}

const categoryLabels: Record<SupportTicketCategory, string> = {
  GENERAL_QUERY: "General query",
  ORDER_QUERY: "Order query",
  DELIVERY_ISSUE: "Delivery issue",
  DRIVER_COMPLAINT: "Driver complaint",
  DAMAGED_PACKAGE: "Damaged package",
  MISSED_PICKUP: "Missed pickup",
  LATE_DELIVERY: "Late delivery",
  BILLING_QUERY: "Billing query",
  PAYMENT_QUERY: "Payment query",
  INVOICE_DISPUTE: "Invoice dispute",
  ACCOUNT_QUERY: "Account query",
  TECHNICAL_ISSUE: "Technical issue",
  OTHER: "Other",
}

const priorityLabels: Record<SupportTicketPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
}

const relatedTypeLabels: Record<RelatedResourceType, string> = {
  NONE: "None",
  SHIPPING_ORDER: "Shipping order",
  ORDER_ITEM: "Order item",
  FULFILMENT: "Fulfilment",
  DRIVER: "Driver",
  BILLING_ACCOUNT: "Billing account",
  INVOICE: "Invoice",
  PAYMENT: "Payment",
}

const statusStyles: Record<SupportTicketStatus | "UNKNOWN", string> = {
  OPEN: "border-slate-200 bg-slate-100 text-slate-800",
  WAITING_FOR_ADMIN: "border-red-200 bg-red-50 text-red-800",
  WAITING_FOR_CUSTOMER: "border-amber-200 bg-amber-50 text-amber-900",
  IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-800",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CLOSED: "border-slate-200 bg-slate-50 text-slate-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-800",
  UNKNOWN: "border-slate-200 bg-slate-50 text-slate-700",
}

const priorityStyles: Record<SupportTicketPriority | "UNKNOWN", string> = {
  LOW: "border-slate-200 bg-slate-50 text-slate-700",
  NORMAL: "border-emerald-200 bg-emerald-50 text-emerald-800",
  HIGH: "border-amber-200 bg-amber-50 text-amber-900",
  URGENT: "border-red-200 bg-red-50 text-red-800",
  UNKNOWN: "border-slate-200 bg-slate-50 text-slate-700",
}

function isKnownStatus(status?: string | null): status is SupportTicketStatus {
  return SUPPORT_TICKET_STATUSES.includes(status as SupportTicketStatus)
}

function isKnownPriority(priority?: string | null): priority is SupportTicketPriority {
  return SUPPORT_TICKET_PRIORITIES.includes(priority as SupportTicketPriority)
}

function formatStatus(status?: string | null) {
  return isKnownStatus(status) ? statusLabels[status] : "Unknown"
}

function formatCategory(category?: string | null) {
  return SUPPORT_TICKET_CATEGORIES.includes(category as SupportTicketCategory)
    ? categoryLabels[category as SupportTicketCategory]
    : "Other"
}

function formatPriority(priority?: string | null) {
  return isKnownPriority(priority) ? priorityLabels[priority] : "Unknown"
}

function formatRelatedType(type?: string | null) {
  return RELATED_RESOURCE_TYPES.includes(type as RelatedResourceType)
    ? relatedTypeLabels[type as RelatedResourceType]
    : "None"
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

function formatBytes(size?: number | null) {
  if (typeof size !== "number" || !Number.isFinite(size)) return "Size unavailable"
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
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

function relatedResourceLabel(resource?: RelatedResourceRef | null) {
  if (!resource || !resource.type || resource.type === "NONE") return "General support"
  return (
    resource.displayLabel ||
    resource.shippingOrderId ||
    resource.orderItemId ||
    resource.fulfilmentId ||
    resource.driverUserId ||
    resource.billingAccountId ||
    resource.invoiceId ||
    resource.paymentId ||
    formatRelatedType(resource.type)
  )
}

function customerDisplay(ticket?: SupportTicketSummary | SupportTicketDetail | null) {
  const snapshot = ticket?.clientSnapshot
  return (
    snapshot?.organizationName ||
    snapshot?.fullName ||
    snapshot?.email ||
    ticket?.organizationId ||
    ticket?.clientUserId ||
    "Unknown customer"
  )
}

function canReplyToCustomer(ticket?: SupportTicketDetail | null) {
  if (!ticket || ticket.archived) return false
  return ticket.status !== "CLOSED" && ticket.status !== "CANCELLED"
}

function canMutate(ticket?: SupportTicketDetail | null) {
  return Boolean(ticket && !ticket.archived)
}

function canResolve(ticket?: SupportTicketDetail | null) {
  return Boolean(ticket && !ticket.archived && !["RESOLVED", "CLOSED", "CANCELLED"].includes(ticket.status || ""))
}

function canClose(ticket?: SupportTicketDetail | null) {
  return Boolean(ticket && !ticket.archived && !["CLOSED", "CANCELLED"].includes(ticket.status || ""))
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
  if (!response.ok) {
    throw new Error(errorMessage(payload, fallback))
  }
  return payload as T
}

function StatusBadge({ status }: { status?: string | null }) {
  const key = isKnownStatus(status) ? status : "UNKNOWN"

  return (
    <Badge variant="outline" className={cn("whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold uppercase", statusStyles[key])}>
      {formatStatus(status)}
    </Badge>
  )
}

function PriorityBadge({ priority }: { priority?: string | null }) {
  const key = isKnownPriority(priority) ? priority : "UNKNOWN"

  return (
    <Badge variant="outline" className={cn("whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold uppercase", priorityStyles[key])}>
      {formatPriority(priority)}
    </Badge>
  )
}

function SummaryCard({ label, value, helper, icon }: { label: string; value: number; helper: string; icon: ReactNode }) {
  return (
    <Card className="bg-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 font-mono text-2xl font-bold">{value}</p>
          </div>
          <div className="rounded-full bg-primary/10 p-2.5 text-primary">{icon}</div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  )
}

function MetadataItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium">{value || "N/A"}</div>
    </div>
  )
}

function TicketAttachments({ attachments }: { attachments?: SupportTicketAttachment[] }) {
  const files = attachments || []
  if (!files.length) return null

  return (
    <div className="mt-3 grid gap-2">
      {files.map((attachment, index) => {
        const key = attachment.attachmentId || attachment.storageKey || `${attachment.fileName}-${index}`
        const content = (
          <>
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{attachment.fileName || "Attachment"}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(attachment.sizeBytes)}</span>
          </>
        )

        if (attachment.downloadUrl) {
          return (
            <a
              key={key}
              href={attachment.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs hover:bg-muted"
            >
              {content}
            </a>
          )
        }

        return (
          <div
            key={key}
            title={attachment.storageKey || undefined}
            className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs"
          >
            {content}
          </div>
        )
      })}
    </div>
  )
}

function MessageBubble({ message }: { message: SupportTicketMessage }) {
  const senderType: SupportMessageSenderType = message.senderType || "SYSTEM"
  const internal = Boolean(message.internalNote)
  const customer = senderType === "CUSTOMER"
  const system = senderType === "SYSTEM"

  if (system && !internal) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[90%] rounded-full border bg-muted/30 px-4 py-2 text-center text-xs text-muted-foreground">
          <span>{message.message || "System update"}</span>
          <span className="ml-2">{formatDateTime(message.createdAt)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex", customer ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[92%] rounded-2xl px-4 py-3 text-sm shadow-sm md:max-w-[78%]",
          internal
            ? "border border-amber-300 bg-amber-50 text-amber-950"
            : customer
              ? "border bg-background text-foreground"
              : "bg-primary text-primary-foreground",
        )}
      >
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold">{message.senderDisplayName || (customer ? "Customer" : "Admin")}</span>
          <span className={internal || customer ? "text-muted-foreground" : "text-primary-foreground/80"}>
            {senderType}
          </span>
          {internal ? (
            <Badge variant="outline" className="border-amber-400 bg-amber-100 text-amber-950">
              Internal note - admin only
            </Badge>
          ) : null}
          <span className={internal || customer ? "text-muted-foreground" : "text-primary-foreground/80"}>
            {formatDateTime(message.createdAt)}
          </span>
        </div>
        <p className="whitespace-pre-wrap leading-6">{message.message || ""}</p>
        <TicketAttachments attachments={message.attachments} />
      </div>
    </div>
  )
}

function DetailLoading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  )
}

function ListLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-14 rounded-md" />
      ))}
    </div>
  )
}

export function AdminSupportTickets({
  initialData,
  initialError,
  initialFilters,
}: {
  initialData: PagedSupportTicketSummaryResponse
  initialError: SupportTicketApiError | null
  initialFilters: AdminSupportTicketFilters
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [data, setData] = useState(initialData)
  const [listError, setListError] = useState(initialError?.message || "")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [status, setStatus] = useState<FilterValue<SupportTicketStatus>>(
    initialFilters.status ? (initialFilters.status as SupportTicketStatus) : ALL_FILTER,
  )
  const [category, setCategory] = useState<FilterValue<SupportTicketCategory>>(
    initialFilters.category ? (initialFilters.category as SupportTicketCategory) : ALL_FILTER,
  )
  const [priority, setPriority] = useState<FilterValue<SupportTicketPriority>>(
    initialFilters.priority ? (initialFilters.priority as SupportTicketPriority) : ALL_FILTER,
  )
  const [assignedAdminUserId, setAssignedAdminUserId] = useState(initialFilters.assignedAdminUserId || "")
  const [clientUserId, setClientUserId] = useState(initialFilters.clientUserId || "")
  const [organizationId, setOrganizationId] = useState(initialFilters.organizationId || "")
  const [shippingOrderId, setShippingOrderId] = useState(initialFilters.shippingOrderId || "")
  const [orderItemId, setOrderItemId] = useState(initialFilters.orderItemId || "")
  const [fulfilmentId, setFulfilmentId] = useState(initialFilters.fulfilmentId || "")
  const [driverUserId, setDriverUserId] = useState(initialFilters.driverUserId || "")
  const [billingAccountId, setBillingAccountId] = useState(initialFilters.billingAccountId || "")
  const [invoiceId, setInvoiceId] = useState(initialFilters.invoiceId || "")
  const [paymentId, setPaymentId] = useState(initialFilters.paymentId || "")
  const [fromDate, setFromDate] = useState(toDateTimeLocal(initialFilters.fromDate))
  const [toDate, setToDate] = useState(toDateTimeLocal(initialFilters.toDate))
  const [archived, setArchived] = useState(initialFilters.archived === "true")

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<SupportTicketDetail | null>(null)
  const [detailError, setDetailError] = useState("")
  const [detailLoading, setDetailLoading] = useState(false)

  const [replyMessage, setReplyMessage] = useState("")
  const [internalNote, setInternalNote] = useState("")
  const [replyError, setReplyError] = useState("")
  const [noteError, setNoteError] = useState("")
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [noteSubmitting, setNoteSubmitting] = useState(false)

  const [metadataStatus, setMetadataStatus] = useState<SupportTicketStatus>("OPEN")
  const [metadataPriority, setMetadataPriority] = useState<SupportTicketPriority>("NORMAL")
  const [metadataCategory, setMetadataCategory] = useState<SupportTicketCategory>("GENERAL_QUERY")
  const [metadataAssignedAdmin, setMetadataAssignedAdmin] = useState("")
  const [metadataSubmitting, setMetadataSubmitting] = useState(false)
  const [assignSubmitting, setAssignSubmitting] = useState(false)

  const [actionDialog, setActionDialog] = useState<ActionDialogType>(null)
  const [actionReason, setActionReason] = useState("")
  const [resolutionSummary, setResolutionSummary] = useState("")
  const [messageToCustomer, setMessageToCustomer] = useState("")
  const [actionSubmitting, setActionSubmitting] = useState(false)

  useEffect(() => {
    setData(initialData)
    setListError(initialError?.message || "")
  }, [initialData, initialError])

  const currentPage = data.pagination.page
  const totalPages = data.pagination.totalPages

  const summary = useMemo(() => {
    return data.tickets.reduce(
      (acc, ticket) => {
        if (ticket.status === "WAITING_FOR_ADMIN") acc.waitingForAdmin += 1
        if (ticket.status === "IN_PROGRESS") acc.inProgress += 1
        if (ticket.status === "WAITING_FOR_CUSTOMER") acc.waitingForCustomer += 1
        if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") acc.resolvedClosed += 1
        if (ticket.priority === "HIGH" || ticket.priority === "URGENT") acc.highUrgent += 1
        return acc
      },
      { waitingForAdmin: 0, inProgress: 0, waitingForCustomer: 0, resolvedClosed: 0, highUrgent: 0 },
    )
  }, [data.tickets])

  const hasActiveFilters = Boolean(
    initialFilters.status ||
      initialFilters.category ||
      initialFilters.priority ||
      initialFilters.clientUserId ||
      initialFilters.organizationId ||
      initialFilters.assignedAdminUserId ||
      initialFilters.shippingOrderId ||
      initialFilters.orderItemId ||
      initialFilters.fulfilmentId ||
      initialFilters.driverUserId ||
      initialFilters.billingAccountId ||
      initialFilters.invoiceId ||
      initialFilters.paymentId ||
      initialFilters.fromDate ||
      initialFilters.toDate ||
      initialFilters.archived === "true",
  )

  const buildQuery = (page: number) => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("size", String(initialFilters.size || DEFAULT_SIZE))
    params.set("sort", initialFilters.sort || "updatedAt,desc")

    const pairs: Record<string, string> = {
      status: status === ALL_FILTER ? "" : status,
      category: category === ALL_FILTER ? "" : category,
      priority: priority === ALL_FILTER ? "" : priority,
      assignedAdminUserId,
      clientUserId,
      organizationId,
      shippingOrderId,
      orderItemId,
      fulfilmentId,
      driverUserId,
      billingAccountId,
      invoiceId,
      paymentId,
      fromDate: fromDateTimeLocal(fromDate),
      toDate: fromDateTimeLocal(toDate),
      archived: archived ? "true" : "",
    }

    for (const [key, value] of Object.entries(pairs)) {
      const trimmed = value.trim()
      if (trimmed) params.set(key, trimmed)
    }

    return params.toString()
  }

  const pageHref = (page: number) => `/admin/support?${buildQuery(page)}`

  const applyFilters = () => {
    router.push(`${pathname}?${buildQuery(0)}`)
  }

  const clearFilters = () => {
    router.push(`${pathname}?page=0&size=${initialFilters.size || DEFAULT_SIZE}&sort=updatedAt%2Cdesc`)
  }

  const refreshList = async () => {
    setIsRefreshing(true)
    setListError("")
    try {
      const response = await apiFetch(`/api/admin/support-tickets?${searchParams.toString()}`, {
        headers: { Accept: "application/json" },
      })
      const nextData = await readApi<PagedSupportTicketSummaryResponse>(response, "Failed to refresh support tickets")
      setData(nextData)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to refresh support tickets"
      setListError(message)
      toast({ variant: "destructive", title: "Refresh failed", description: message })
    } finally {
      setIsRefreshing(false)
    }
  }

  const syncDetailForms = (ticket: SupportTicketDetail) => {
    setMetadataStatus((isKnownStatus(ticket.status) ? ticket.status : "OPEN") as SupportTicketStatus)
    setMetadataPriority((isKnownPriority(ticket.priority) ? ticket.priority : "NORMAL") as SupportTicketPriority)
    setMetadataCategory(
      (SUPPORT_TICKET_CATEGORIES.includes(ticket.category as SupportTicketCategory)
        ? ticket.category
        : "GENERAL_QUERY") as SupportTicketCategory,
    )
    setMetadataAssignedAdmin(ticket.assignedAdminUserId || "")
  }

  const loadDetail = async (ticketId: string) => {
    setDetailLoading(true)
    setDetailError("")
    try {
      const response = await apiFetch(`/api/admin/support-tickets/${encodeURIComponent(ticketId)}`, {
        headers: { Accept: "application/json" },
      })
      const ticket = await readApi<SupportTicketDetail>(response, "Failed to load support ticket")
      setDetail(ticket)
      syncDetailForms(ticket)
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Failed to load support ticket")
    } finally {
      setDetailLoading(false)
    }
  }

  const openTicket = (ticket: SupportTicketSummary) => {
    setDetail(ticket as SupportTicketDetail)
    setDetailOpen(true)
    setReplyMessage("")
    setInternalNote("")
    setReplyError("")
    setNoteError("")
    loadDetail(ticket.ticketId)
  }

  const refreshCurrentDetail = async () => {
    if (!detail?.ticketId) return
    await loadDetail(detail.ticketId)
  }

  const updateListTicket = (ticketId: string, patch: Partial<SupportTicketSummary>) => {
    setData((current) => ({
      ...current,
      tickets: current.tickets.map((ticket) => (ticket.ticketId === ticketId ? { ...ticket, ...patch } : ticket)),
    }))
  }

  const sendReply = async () => {
    if (!detail?.ticketId) return
    const message = replyMessage.trim()
    if (!message) {
      setReplyError("Reply message is required.")
      return
    }

    setReplySubmitting(true)
    setReplyError("")
    try {
      const response = await apiFetch(`/api/admin/support-tickets/${encodeURIComponent(detail.ticketId)}/messages`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ message, attachments: [] }),
      })
      const updated = await readApi<SupportTicketDetail>(response, "Failed to send customer reply")
      setDetail(updated)
      syncDetailForms(updated)
      updateListTicket(updated.ticketId, updated)
      setReplyMessage("")
      toast({ title: "Reply sent", description: "The customer-visible response was added." })
      refreshList()
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : "Failed to send customer reply")
    } finally {
      setReplySubmitting(false)
    }
  }

  const addInternalNote = async () => {
    if (!detail?.ticketId) return
    const message = internalNote.trim()
    if (!message) {
      setNoteError("Internal note is required.")
      return
    }

    setNoteSubmitting(true)
    setNoteError("")
    try {
      const response = await apiFetch(`/api/admin/support-tickets/${encodeURIComponent(detail.ticketId)}/internal-notes`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ message, attachments: [] }),
      })
      const updated = await readApi<SupportTicketDetail>(response, "Failed to add internal note")
      setDetail(updated)
      syncDetailForms(updated)
      setInternalNote("")
      toast({ title: "Internal note added", description: "This note is only visible to admins." })
    } catch (error) {
      setNoteError(error instanceof Error ? error.message : "Failed to add internal note")
    } finally {
      setNoteSubmitting(false)
    }
  }

  const assignTicket = async () => {
    if (!detail?.ticketId) return
    setAssignSubmitting(true)
    try {
      const response = await apiFetch(`/api/admin/support-tickets/${encodeURIComponent(detail.ticketId)}/assign`, {
        method: "PATCH",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ assignedAdminUserId: metadataAssignedAdmin.trim() || null }),
      })
      const action = await readApi<GenericSupportTicketActionResponse>(response, "Failed to assign ticket")
      updateListTicket(detail.ticketId, { assignedAdminUserId: metadataAssignedAdmin.trim() || null })
      toast({ title: "Assignment updated", description: action.message || "Ticket assignment was updated." })
      await refreshCurrentDetail()
      refreshList()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Assignment failed",
        description: error instanceof Error ? error.message : "Failed to assign ticket",
      })
    } finally {
      setAssignSubmitting(false)
    }
  }

  const saveMetadata = async () => {
    if (!detail?.ticketId) return
    setMetadataSubmitting(true)
    try {
      const response = await apiFetch(`/api/admin/support-tickets/${encodeURIComponent(detail.ticketId)}`, {
        method: "PATCH",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          status: metadataStatus,
          priority: metadataPriority,
          category: metadataCategory,
          assignedAdminUserId: metadataAssignedAdmin.trim() || null,
        }),
      })
      const action = await readApi<GenericSupportTicketActionResponse>(response, "Failed to update metadata")
      updateListTicket(detail.ticketId, {
        status: action.status || metadataStatus,
        priority: metadataPriority,
        category: metadataCategory,
        assignedAdminUserId: metadataAssignedAdmin.trim() || null,
      })
      toast({ title: "Ticket updated", description: action.message || "Metadata changes were saved." })
      await refreshCurrentDetail()
      refreshList()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update metadata",
      })
    } finally {
      setMetadataSubmitting(false)
    }
  }

  const submitAction = async () => {
    if (!detail?.ticketId || !actionDialog) return

    if (actionDialog === "resolve" && !resolutionSummary.trim()) {
      toast({
        variant: "destructive",
        title: "Resolution summary required",
        description: "Add a resolution summary before resolving the ticket.",
      })
      return
    }

    const endpoint = `/api/admin/support-tickets/${encodeURIComponent(detail.ticketId)}/${actionDialog}`
    const body =
      actionDialog === "resolve"
        ? { resolutionSummary: resolutionSummary.trim(), messageToCustomer: messageToCustomer.trim() || null }
        : { reason: actionReason.trim() || null }

    setActionSubmitting(true)
    try {
      const response = await apiFetch(endpoint, {
        method: "PATCH",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const action = await readApi<GenericSupportTicketActionResponse>(response, `Failed to ${actionDialog} ticket`)
      updateListTicket(detail.ticketId, {
        status: action.status || detail.status,
        archived: actionDialog === "archive" ? true : detail.archived,
      })
      toast({
        title:
          actionDialog === "resolve"
            ? "Ticket resolved"
            : actionDialog === "close"
              ? "Ticket closed"
              : "Ticket archived",
        description: action.message || "Ticket action completed.",
      })
      setActionDialog(null)
      setActionReason("")
      setResolutionSummary("")
      setMessageToCustomer("")
      await refreshCurrentDetail()
      refreshList()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setActionSubmitting(false)
    }
  }

  const actionDialogTitle =
    actionDialog === "resolve" ? "Resolve ticket" : actionDialog === "close" ? "Close ticket" : "Archive ticket"

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">
            Manage customer questions, complaints, delivery issues, billing queries, and account support.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={refreshList} disabled={isRefreshing}>
          <RefreshCw className={cn("h-4 w-4", isRefreshing ? "animate-spin" : "")} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Waiting for admin" value={summary.waitingForAdmin} helper="Current page count" icon={<CircleAlert className="h-5 w-5" />} />
        <SummaryCard label="In progress" value={summary.inProgress} helper="Current page count" icon={<Clock3 className="h-5 w-5" />} />
        <SummaryCard label="Waiting for customer" value={summary.waitingForCustomer} helper="Current page count" icon={<MessageSquare className="h-5 w-5" />} />
        <SummaryCard label="Resolved/closed" value={summary.resolvedClosed} helper="Current page count" icon={<CheckCircle2 className="h-5 w-5" />} />
        <SummaryCard label="High/urgent priority" value={summary.highUrgent} helper="Current page count" icon={<AlertCircle className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Default view excludes archived tickets. Enable archived to inspect old resolved tickets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as FilterValue<SupportTicketStatus>)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
                  {SUPPORT_TICKET_STATUSES.map((item) => <SelectItem key={item} value={item}>{formatStatus(item)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as FilterValue<SupportTicketCategory>)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>All categories</SelectItem>
                  {SUPPORT_TICKET_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{formatCategory(item)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as FilterValue<SupportTicketPriority>)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>All priorities</SelectItem>
                  {SUPPORT_TICKET_PRIORITIES.map((item) => <SelectItem key={item} value={item}>{formatPriority(item)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="shippingOrderId" className="text-xs text-muted-foreground">Shipping order ID</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="shippingOrderId" className="h-9 pl-9" value={shippingOrderId} onChange={(event) => setShippingOrderId(event.target.value)} placeholder="Shipping order" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
              <Switch id="archived-filter" checked={archived} onCheckedChange={setArchived} />
              <Label htmlFor="archived-filter" className="text-sm">Archived</Label>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4" />
                  More filters
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[min(92vw,680px)] space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Assigned admin user ID</Label>
                    <Input className="h-9" value={assignedAdminUserId} onChange={(event) => setAssignedAdminUserId(event.target.value)} placeholder="admin-user-sub-123" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Client user ID</Label>
                    <Input className="h-9" value={clientUserId} onChange={(event) => setClientUserId(event.target.value)} placeholder="Client user ID" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Organization ID</Label>
                    <Input className="h-9" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} placeholder="Organization ID" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Order item ID</Label>
                    <Input className="h-9" value={orderItemId} onChange={(event) => setOrderItemId(event.target.value)} placeholder="Order item ID" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Fulfilment ID</Label>
                    <Input className="h-9" value={fulfilmentId} onChange={(event) => setFulfilmentId(event.target.value)} placeholder="Fulfilment ID" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Driver user ID</Label>
                    <Input className="h-9" value={driverUserId} onChange={(event) => setDriverUserId(event.target.value)} placeholder="Driver user ID" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Billing account ID</Label>
                    <Input className="h-9" value={billingAccountId} onChange={(event) => setBillingAccountId(event.target.value)} placeholder="Billing account ID" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Invoice ID</Label>
                    <Input className="h-9" value={invoiceId} onChange={(event) => setInvoiceId(event.target.value)} placeholder="Invoice ID" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Payment ID</Label>
                    <Input className="h-9" value={paymentId} onChange={(event) => setPaymentId(event.target.value)} placeholder="Payment ID" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">From date</Label>
                    <Input type="datetime-local" className="h-9" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">To date</Label>
                    <Input type="datetime-local" className="h-9" value={toDate} onChange={(event) => setToDate(event.target.value)} />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button type="button" size="sm" onClick={applyFilters}>Apply filters</Button>
            <Button type="button" size="sm" variant="outline" onClick={clearFilters} disabled={!hasActiveFilters}>
              <FilterX className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {listError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>We could not load support tickets</AlertTitle>
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Tickets</CardTitle>
            <CardDescription>
              Showing {data.tickets.length} of {data.pagination.totalElements} matching tickets.
            </CardDescription>
          </div>
          {initialFilters.archived === "true" ? <Badge variant="outline">Archived view</Badge> : null}
        </CardHeader>
        <CardContent>
          {isRefreshing ? <ListLoading /> : null}
          {!isRefreshing && data.tickets.length === 0 ? (
            <div className="rounded-lg border bg-muted/20 p-10 text-center">
              <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
              <h2 className="mt-3 text-lg font-semibold">No support tickets found</h2>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting filters or refreshing the list.</p>
            </div>
          ) : null}
          {!isRefreshing && data.tickets.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Related resource</TableHead>
                    <TableHead>Assigned admin</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Attention</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.tickets.map((ticket) => (
                    <TableRow key={ticket.ticketId}>
                      <TableCell className="min-w-[240px]">
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">{ticket.ticketNumber || ticket.ticketId}</p>
                          <p className="mt-1 max-w-[280px] truncate font-medium">{ticket.subject || "Support ticket"}</p>
                          <p className="mt-1 max-w-[280px] truncate text-xs text-muted-foreground">{ticket.latestMessagePreview || "No preview"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[180px]">
                        <p className="font-medium">{customerDisplay(ticket)}</p>
                        <p className="max-w-[180px] truncate text-xs text-muted-foreground">{ticket.clientSnapshot?.email || ticket.clientUserId || "N/A"}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="whitespace-nowrap">{formatCategory(ticket.category)}</Badge></TableCell>
                      <TableCell><StatusBadge status={ticket.status} /></TableCell>
                      <TableCell><PriorityBadge priority={ticket.priority} /></TableCell>
                      <TableCell className="max-w-[220px] truncate">{relatedResourceLabel(ticket.relatedResource)}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{ticket.assignedAdminUserId || "Unassigned"}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDateTime(ticket.updatedAt)}</TableCell>
                      <TableCell>
                        {ticket.adminUnread ? (
                          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800">Unread</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button type="button" size="sm" variant="outline" onClick={() => openTicket(ticket)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
        <SheetContent side="right" className="flex w-full flex-col overflow-hidden p-0 sm:max-w-3xl xl:max-w-5xl">
          <SheetHeader className="border-b p-6 pr-12">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <SheetTitle className="truncate text-2xl">{detail?.subject || "Support ticket"}</SheetTitle>
                <SheetDescription className="mt-1">{detail?.ticketNumber || detail?.ticketId || "Loading details"}</SheetDescription>
              </div>
              {detail ? (
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={detail.status} />
                  <PriorityBadge priority={detail.priority} />
                  {detail.archived ? <Badge variant="outline"><Archive className="mr-1 h-3.5 w-3.5" /> Archived</Badge> : null}
                </div>
              ) : null}
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            {detailLoading && !detail ? <DetailLoading /> : null}
            {detailError ? (
              <div className="p-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Unable to load ticket</AlertTitle>
                  <AlertDescription>{detailError}</AlertDescription>
                </Alert>
              </div>
            ) : null}
            {detail ? (
              <div className="space-y-6 p-6">
                <div className="grid gap-4 lg:grid-cols-[1fr,360px]">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Customer</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-3 sm:grid-cols-2">
                        <MetadataItem label="Name" value={detail.clientSnapshot?.fullName || "N/A"} />
                        <MetadataItem label="Organization" value={detail.clientSnapshot?.organizationName || "N/A"} />
                        <MetadataItem label="Email" value={detail.clientSnapshot?.email || "N/A"} />
                        <MetadataItem label="Phone" value={detail.clientSnapshot?.phoneNumber || "N/A"} />
                        <MetadataItem label="Client user ID" value={detail.clientUserId || "N/A"} />
                        <MetadataItem label="Organization ID" value={detail.organizationId || "N/A"} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Conversation</CardTitle>
                        <CardDescription>Full admin view, including internal notes.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {detail.messages?.length ? (
                          <div className="space-y-4">
                            {detail.messages.map((message, index) => (
                              <MessageBubble key={message.messageId || `${message.createdAt}-${index}`} message={message} />
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-lg border bg-muted/20 p-8 text-center">
                            <MessageSquare className="mx-auto h-7 w-7 text-muted-foreground" />
                            <p className="mt-2 text-sm font-medium">No conversation messages yet.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Ticket details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <MetadataItem label="Category" value={formatCategory(detail.category)} />
                        <MetadataItem label="Visibility" value={detail.visibility || "N/A"} />
                        <MetadataItem label="Related resource" value={relatedResourceLabel(detail.relatedResource)} />
                        <MetadataItem label="Assigned admin" value={detail.assignedAdminUserId || "Unassigned"} />
                        <MetadataItem label="Created" value={formatDateTime(detail.createdAt)} />
                        <MetadataItem label="Updated" value={formatDateTime(detail.updatedAt)} />
                        <MetadataItem label="Resolved" value={formatDateTime(detail.resolvedAt)} />
                        {detail.resolutionSummary ? <MetadataItem label="Resolution summary" value={detail.resolutionSummary} /> : null}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Assignment and metadata</CardTitle>
                        <CardDescription>Use dropdowns and inputs, not raw API payloads.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Assigned admin user ID</Label>
                          <Input value={metadataAssignedAdmin} onChange={(event) => setMetadataAssignedAdmin(event.target.value)} placeholder="admin-user-sub-123" disabled={!canMutate(detail)} />
                          <Button type="button" size="sm" variant="outline" onClick={assignTicket} disabled={!canMutate(detail) || assignSubmitting}>
                            {assignSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}
                            Assign
                          </Button>
                        </div>
                        <Separator />
                        <div className="grid gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Status</Label>
                            <Select value={metadataStatus} onValueChange={(value) => setMetadataStatus(value as SupportTicketStatus)} disabled={!canMutate(detail)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{SUPPORT_TICKET_STATUSES.map((item) => <SelectItem key={item} value={item}>{formatStatus(item)}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Priority</Label>
                            <Select value={metadataPriority} onValueChange={(value) => setMetadataPriority(value as SupportTicketPriority)} disabled={!canMutate(detail)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{SUPPORT_TICKET_PRIORITIES.map((item) => <SelectItem key={item} value={item}>{formatPriority(item)}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Category</Label>
                            <Select value={metadataCategory} onValueChange={(value) => setMetadataCategory(value as SupportTicketCategory)} disabled={!canMutate(detail)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{SUPPORT_TICKET_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{formatCategory(item)}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button type="button" className="w-full" onClick={saveMetadata} disabled={!canMutate(detail) || metadataSubmitting}>
                          {metadataSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                          Save metadata
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-2">
                        <Button type="button" onClick={() => setActionDialog("resolve")} disabled={!canResolve(detail)}>
                          <CheckCircle2 className="h-4 w-4" />
                          Resolve
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setActionDialog("close")} disabled={!canClose(detail)}>
                          <XCircle className="h-4 w-4" />
                          Close
                        </Button>
                        <Button type="button" variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-50" onClick={() => setActionDialog("archive")} disabled={!detail || Boolean(detail.archived)}>
                          <Archive className="h-4 w-4" />
                          Archive
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reply to customer</CardTitle>
                      <CardDescription>Customer-visible response. Do not include internal notes here.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea value={replyMessage} onChange={(event) => { setReplyMessage(event.target.value); setReplyError("") }} placeholder="Write a customer-visible reply..." className="min-h-[140px]" disabled={!canReplyToCustomer(detail)} />
                      <p className="text-xs text-muted-foreground">Attachments are not configured here; support APIs accept S3 metadata only.</p>
                      {replyError ? <p className="text-sm text-destructive">{replyError}</p> : null}
                      <Button type="button" onClick={sendReply} disabled={!canReplyToCustomer(detail) || replySubmitting}>
                        {replySubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Send reply
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-amber-200 bg-amber-50/40">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <NotebookPen className="h-5 w-5" />
                        Internal note
                      </CardTitle>
                      <CardDescription>Only visible to admins. This is never sent as a customer reply.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea value={internalNote} onChange={(event) => { setInternalNote(event.target.value); setNoteError("") }} placeholder="Add internal context for the support team..." className="min-h-[140px]" disabled={Boolean(detail.archived)} />
                      {noteError ? <p className="text-sm text-destructive">{noteError}</p> : null}
                      <Button type="button" variant="outline" onClick={addInternalNote} disabled={Boolean(detail.archived) || noteSubmitting}>
                        {noteSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <NotebookPen className="h-4 w-4" />}
                        Add internal note
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : null}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(actionDialog)} onOpenChange={(open) => !open && setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialogTitle}</DialogTitle>
            <DialogDescription>
              {actionDialog === "resolve"
                ? "Add a resolution summary and optionally send a final message to the customer."
                : actionDialog === "close"
                  ? "Close this support ticket. Add an optional reason for the audit trail."
                  : "Archive this ticket. Archived tickets are hidden from the default list."}
            </DialogDescription>
          </DialogHeader>

          {actionDialog === "resolve" ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Resolution summary</Label>
                <Textarea value={resolutionSummary} onChange={(event) => setResolutionSummary(event.target.value)} placeholder="Reviewed fulfilment timeline and responded to customer." />
              </div>
              <div className="space-y-1">
                <Label>Message to customer optional</Label>
                <Textarea value={messageToCustomer} onChange={(event) => setMessageToCustomer(event.target.value)} placeholder="We reviewed this issue and shared feedback with the delivery team." />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Label>Reason optional</Label>
              <Textarea value={actionReason} onChange={(event) => setActionReason(event.target.value)} placeholder={actionDialog === "archive" ? "Old resolved ticket archived." : "Ticket resolved and no further customer response received."} />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={actionSubmitting} onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={actionSubmitting} onClick={submitAction}>
              {actionSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
