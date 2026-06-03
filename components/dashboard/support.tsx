"use client"

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  FilterX,
  Inbox,
  LifeBuoy,
  Loader2,
  MessageCircle,
  MessageSquare,
  PackageSearch,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  XCircle,
} from "lucide-react"

import {
  RELATED_RESOURCE_TYPES,
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_PRIORITIES,
  SUPPORT_TICKET_STATUSES,
  addSupportTicketMessage,
  cancelSupportTicket,
  canCustomerCancel,
  canCustomerReply,
  createSupportTicket,
  formatRelatedResourceType,
  formatTicketCategory,
  formatTicketPriority,
  formatTicketStatus,
  getSupportTicketDetail,
  getSupportTickets,
  markSupportTicketRead,
  type CreateSupportTicketRequest,
  type RelatedResourceRef,
  type RelatedResourceType,
  type SupportMessageSenderType,
  type SupportTicketCategory,
  type SupportTicketDetail,
  type SupportTicketMessage,
  type SupportTicketPagination,
  type SupportTicketPriority,
  type SupportTicketStatus,
  type SupportTicketSummary,
} from "@/lib/support-ticket-service"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { Textarea } from "@/components/ui/textarea"

const PAGE_SIZE = 20
const ALL_FILTER = "ALL"

type StatusFilter = SupportTicketStatus | typeof ALL_FILTER
type CategoryFilter = SupportTicketCategory | typeof ALL_FILTER
type RelatedFilter = RelatedResourceType | typeof ALL_FILTER
type FieldErrors = Partial<Record<"category" | "subject" | "message", string>>

const statusStyles: Record<SupportTicketStatus | "UNKNOWN", string> = {
  OPEN: "border-slate-200 bg-slate-50 text-slate-700",
  WAITING_FOR_ADMIN: "border-brand-maple/30 bg-brand-maple-soft text-brand-rust",
  WAITING_FOR_CUSTOMER: "border-amber-200 bg-amber-50 text-amber-900",
  IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-800",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CLOSED: "border-slate-200 bg-slate-100 text-slate-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-800",
  UNKNOWN: "border-slate-200 bg-slate-50 text-slate-700",
}

const priorityStyles: Record<SupportTicketPriority | "UNKNOWN", string> = {
  LOW: "border-slate-200 bg-slate-50 text-slate-700",
  NORMAL: "border-emerald-200 bg-emerald-50 text-emerald-800",
  HIGH: "border-amber-200 bg-amber-50 text-amber-900",
  URGENT: "border-red-200 bg-red-50 text-red-800",
  UNKNOWN: "border-slate-200 bg-slate-50 text-slate-700",
}

const relatedFieldConfig: Partial<Record<RelatedResourceType, { field: keyof RelatedResourceRef; label: string }>> = {
  FULFILMENT: { field: "fulfilmentId", label: "Fulfilment ID" },
  DRIVER: { field: "driverUserId", label: "Driver user ID" },
  BILLING_ACCOUNT: { field: "billingAccountId", label: "Billing account ID" },
  INVOICE: { field: "invoiceId", label: "Invoice ID" },
  PAYMENT: { field: "paymentId", label: "Payment ID" },
}

const emptyRelatedResource: RelatedResourceRef = {
  type: "NONE",
  shippingOrderId: "",
  orderItemId: "",
  fulfilmentId: "",
  driverUserId: "",
  billingAccountId: "",
  invoiceId: "",
  paymentId: "",
  displayLabel: "",
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

function cleanString(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed || null
}

function cleanRelatedResource(resource: RelatedResourceRef): RelatedResourceRef | null {
  const type = resource.type || "NONE"
  if (type === "NONE") return null

  return {
    type,
    shippingOrderId: cleanString(resource.shippingOrderId),
    orderItemId: cleanString(resource.orderItemId),
    fulfilmentId: cleanString(resource.fulfilmentId),
    driverUserId: cleanString(resource.driverUserId),
    billingAccountId: cleanString(resource.billingAccountId),
    invoiceId: cleanString(resource.invoiceId),
    paymentId: cleanString(resource.paymentId),
    displayLabel: cleanString(resource.displayLabel),
  }
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
    formatRelatedResourceType(resource.type)
  )
}

function isKnownStatus(status?: string | null): status is SupportTicketStatus {
  return SUPPORT_TICKET_STATUSES.includes(status as SupportTicketStatus)
}

function isKnownPriority(priority?: string | null): priority is SupportTicketPriority {
  return SUPPORT_TICKET_PRIORITIES.includes(priority as SupportTicketPriority)
}

function StatusBadge({ status }: { status?: string | null }) {
  const key = isKnownStatus(status) ? status : "UNKNOWN"

  return (
    <Badge
      variant="outline"
      className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-normal ${statusStyles[key]}`}
    >
      {formatTicketStatus(status)}
    </Badge>
  )
}

function PriorityBadge({ priority }: { priority?: string | null }) {
  const key = isKnownPriority(priority) ? priority : "UNKNOWN"

  return (
    <Badge
      variant="outline"
      className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-normal ${priorityStyles[key]}`}
    >
      {formatTicketPriority(priority)}
    </Badge>
  )
}

function SummaryCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string
  value: number
  helper: string
  icon: ReactNode
}) {
  return (
    <Card className="dashboard-card-surface border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-2 font-mono text-3xl font-bold text-slate-950">{value}</p>
          </div>
          <div className="rounded-full bg-primary/10 p-3 text-primary">{icon}</div>
        </div>
        <p className="mt-4 text-xs text-slate-500">{helper}</p>
      </CardContent>
    </Card>
  )
}

function AttachmentUploadNotice() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm text-slate-600">
      <div className="flex items-start gap-3">
        <Paperclip className="mt-0.5 h-4 w-4 text-slate-500" />
        <div>
          <p className="font-medium text-slate-700">Attachments are not configured for this form yet.</p>
          <p className="mt-1 text-xs leading-5">
            Support-ticket APIs accept S3 metadata only. Once the existing S3 upload flow is exposed here, selected
            files can be uploaded through aws-integration and attached as metadata.
          </p>
        </div>
      </div>
    </div>
  )
}

function TicketAttachments({ attachments }: { attachments?: SupportTicketMessage["attachments"] }) {
  const files = attachments || []
  if (!files.length) return null

  return (
    <div className="mt-3 grid gap-2">
      {files.map((attachment, index) => {
        const key = attachment.attachmentId || attachment.storageKey || `${attachment.fileName}-${index}`
        const content = (
          <>
            <FileText className="h-4 w-4 text-slate-500" />
            <span className="min-w-0 flex-1 truncate">{attachment.fileName || "Attachment"}</span>
            <span className="shrink-0 text-xs text-slate-500">{formatBytes(attachment.sizeBytes)}</span>
          </>
        )

        if (attachment.downloadUrl) {
          return (
            <a
              key={key}
              href={attachment.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50"
            >
              {content}
            </a>
          )
        }

        return (
          <div
            key={key}
            className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs"
            title={attachment.storageKey || undefined}
          >
            {content}
          </div>
        )
      })}
    </div>
  )
}

function CreateTicketDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (ticket: SupportTicketDetail) => void
}) {
  const { toast } = useToast()
  const [category, setCategory] = useState<SupportTicketCategory>("GENERAL_QUERY")
  const [priority, setPriority] = useState<SupportTicketPriority>("NORMAL")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [relatedResource, setRelatedResource] = useState<RelatedResourceRef>(emptyRelatedResource)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setCategory("GENERAL_QUERY")
    setPriority("NORMAL")
    setSubject("")
    setMessage("")
    setRelatedResource(emptyRelatedResource)
    setErrors({})
  }

  const updateRelatedResource = (field: keyof RelatedResourceRef, value: string) => {
    setRelatedResource((current) => ({ ...current, [field]: value }))
  }

  const validate = () => {
    const nextErrors: FieldErrors = {}
    if (!category) nextErrors.category = "Select a category."
    if (!subject.trim()) nextErrors.subject = "Subject is required."
    if (!message.trim()) nextErrors.message = "Message is required."
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return

    const payload: CreateSupportTicketRequest = {
      category,
      priority,
      subject: subject.trim(),
      message: message.trim(),
      relatedResource: cleanRelatedResource(relatedResource),
      attachments: [],
    }

    setIsSubmitting(true)
    try {
      const ticket = await createSupportTicket(payload)
      toast({
        title: "Support ticket created",
        description: ticket.ticketNumber || "Your request has been sent to support.",
      })
      onCreated(ticket)
      resetForm()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Unable to create ticket",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const relatedType = relatedResource.type || "NONE"
  const customRelatedField = relatedType === "NONE" ? null : relatedFieldConfig[relatedType]

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSubmitting) resetForm()
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create support ticket</DialogTitle>
          <DialogDescription>
            Tell us what happened. Your account identity is taken from your active session.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="support-category">Category</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as SupportTicketCategory)}>
                <SelectTrigger id="support-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORT_TICKET_CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {formatTicketCategory(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category ? <p className="text-xs text-destructive">{errors.category}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="support-priority">Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as SupportTicketPriority)}>
                <SelectTrigger id="support-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORT_TICKET_PRIORITIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {formatTicketPriority(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-subject">Subject</Label>
            <Input
              id="support-subject"
              value={subject}
              maxLength={200}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Briefly describe your issue"
            />
            <div className="flex items-center justify-between gap-3">
              {errors.subject ? <p className="text-xs text-destructive">{errors.subject}</p> : <span />}
              <p className="text-xs text-muted-foreground">{subject.length}/200</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-message">Message</Label>
            <Textarea
              id="support-message"
              value={message}
              maxLength={5000}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Share the details our support team needs to help."
              className="min-h-[150px]"
            />
            <div className="flex items-center justify-between gap-3">
              {errors.message ? <p className="text-xs text-destructive">{errors.message}</p> : <span />}
              <p className="text-xs text-muted-foreground">{message.length}/5000</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold">Related resource</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Optional. Link this ticket to an order, payment, invoice, or another MapleXpress record.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="related-type">Type</Label>
                <Select
                  value={relatedType}
                  onValueChange={(value) => {
                    setRelatedResource({ ...emptyRelatedResource, type: value as RelatedResourceType })
                  }}
                >
                  <SelectTrigger id="related-type">
                    <SelectValue placeholder="Select related resource" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATED_RESOURCE_TYPES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {formatRelatedResourceType(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="related-display-label">Display label</Label>
                <Input
                  id="related-display-label"
                  value={relatedResource.displayLabel || ""}
                  onChange={(event) => updateRelatedResource("displayLabel", event.target.value)}
                  placeholder="Example: Order #ORD_123"
                  disabled={relatedType === "NONE"}
                />
              </div>

              {(relatedType === "SHIPPING_ORDER" || relatedType === "ORDER_ITEM") && (
                <div className="space-y-2">
                  <Label htmlFor="shipping-order-id">Shipping order ID</Label>
                  <Input
                    id="shipping-order-id"
                    value={relatedResource.shippingOrderId || ""}
                    onChange={(event) => updateRelatedResource("shippingOrderId", event.target.value)}
                    placeholder="ORD_123"
                  />
                </div>
              )}

              {relatedType === "ORDER_ITEM" && (
                <div className="space-y-2">
                  <Label htmlFor="order-item-id">Order item ID</Label>
                  <Input
                    id="order-item-id"
                    value={relatedResource.orderItemId || ""}
                    onChange={(event) => updateRelatedResource("orderItemId", event.target.value)}
                    placeholder="ITEM_123"
                  />
                </div>
              )}

              {customRelatedField ? (
                <div className="space-y-2">
                  <Label htmlFor={`related-${customRelatedField.field}`}>{customRelatedField.label}</Label>
                  <Input
                    id={`related-${customRelatedField.field}`}
                    value={(relatedResource[customRelatedField.field] as string) || ""}
                    onChange={(event) => updateRelatedResource(customRelatedField.field, event.target.value)}
                    placeholder={customRelatedField.label}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <AttachmentUploadNotice />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TicketListItem({
  ticket,
  onView,
}: {
  ticket: SupportTicketSummary
  onView: (ticket: SupportTicketSummary) => void
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {ticket.customerUnread ? <span className="h-2.5 w-2.5 rounded-full bg-primary" title="Unread" /> : null}
            <span className="font-mono text-xs font-semibold text-slate-500">
              {ticket.ticketNumber || ticket.ticketId}
            </span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <Badge variant="outline" className="rounded-md border-slate-200 bg-slate-50 text-[11px]">
              {formatTicketCategory(ticket.category)}
            </Badge>
          </div>

          <div>
            <h3 className="truncate text-base font-semibold text-slate-950">{ticket.subject || "Support ticket"}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">
              {ticket.latestMessagePreview || "No messages yet."}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <PackageSearch className="h-3.5 w-3.5" />
              {relatedResourceLabel(ticket.relatedResource)}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              Updated {formatDateTime(ticket.updatedAt)}
            </span>
          </div>
        </div>

        <Button type="button" variant="outline" onClick={() => onView(ticket)} className="shrink-0">
          View
        </Button>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: SupportTicketMessage }) {
  if (message.internalNote) return null

  const senderType = message.senderType || "SYSTEM"
  const isCustomer = senderType === "CUSTOMER"
  const isSystem = senderType === "SYSTEM"

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[92%] rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-center text-xs text-slate-600">
          <span>{message.message || "System update"}</span>
          <span className="ml-2 text-slate-400">{formatDateTime(message.createdAt)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-2xl px-4 py-3 shadow-sm md:max-w-[78%] ${
          isCustomer
            ? "bg-primary text-primary-foreground"
            : "border border-slate-200 bg-white text-slate-800"
        }`}
      >
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className={isCustomer ? "font-semibold text-white" : "font-semibold text-slate-900"}>
            {message.senderDisplayName || (isCustomer ? "You" : "Support")}
          </span>
          <span className={isCustomer ? "text-white/75" : "text-slate-500"}>{formatDateTime(message.createdAt)}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6">{message.message || ""}</p>
        <div className={isCustomer ? "[&_div]:text-slate-700" : ""}>
          <TicketAttachments attachments={message.attachments} />
        </div>
      </div>
    </div>
  )
}

function DetailMetaItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  )
}

function TicketDetailSheet({
  open,
  onOpenChange,
  ticket,
  isLoading,
  error,
  replyMessage,
  replyError,
  isSendingReply,
  onReplyMessageChange,
  onSendReply,
  onOpenCancel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: SupportTicketDetail | null
  isLoading: boolean
  error: string | null
  replyMessage: string
  replyError: string | null
  isSendingReply: boolean
  onReplyMessageChange: (value: string) => void
  onSendReply: () => void
  onOpenCancel: () => void
}) {
  const messages = (ticket?.messages || []).filter((message) => !message.internalNote)
  const canReply = canCustomerReply(ticket)
  const canCancel = canCustomerCancel(ticket)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col overflow-hidden p-0 sm:max-w-2xl lg:max-w-3xl">
        <SheetHeader className="border-b border-slate-200 p-6 pr-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <SheetTitle className="truncate text-2xl">{ticket?.subject || "Support ticket"}</SheetTitle>
              <SheetDescription className="mt-2">
                {ticket?.ticketNumber || ticket?.ticketId || "Loading ticket details"}
              </SheetDescription>
            </div>
            {ticket ? (
              <div className="flex shrink-0 flex-wrap gap-2">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                {canCancel ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onOpenCancel}
                    className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                  >
                    Cancel ticket
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6 p-6">
            {isLoading && !ticket ? (
              <div className="space-y-4">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
              </div>
            ) : null}

            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Unable to load ticket</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {ticket ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <DetailMetaItem label="Category" value={formatTicketCategory(ticket.category)} />
                  <DetailMetaItem label="Related resource" value={relatedResourceLabel(ticket.relatedResource)} />
                  <DetailMetaItem label="Created" value={formatDateTime(ticket.createdAt)} />
                  <DetailMetaItem label="Updated" value={formatDateTime(ticket.updatedAt)} />
                </div>

                {ticket.resolutionSummary ? (
                  <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Resolution summary</AlertTitle>
                    <AlertDescription>{ticket.resolutionSummary}</AlertDescription>
                  </Alert>
                ) : null}

                <Separator />

                <div>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">Conversation</h3>
                      <p className="text-sm text-muted-foreground">Messages visible to you and MapleXpress support.</p>
                    </div>
                    {ticket.customerUnread ? (
                      <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                        Unread
                      </Badge>
                    ) : null}
                  </div>

                  {messages.length ? (
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <MessageBubble key={message.messageId || `${message.createdAt}-${index}`} message={message} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                      <MessageCircle className="mx-auto h-8 w-8 text-slate-400" />
                      <p className="mt-3 text-sm font-medium">No messages yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">The conversation will appear here.</p>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </ScrollArea>

        {ticket ? (
          <div className="border-t border-slate-200 bg-white/95 p-4">
            {canReply ? (
              <div className="space-y-3">
                <Label htmlFor="support-reply">Reply</Label>
                <Textarea
                  id="support-reply"
                  value={replyMessage}
                  maxLength={5000}
                  onChange={(event) => onReplyMessageChange(event.target.value)}
                  placeholder="Write your reply to support..."
                  className="min-h-[110px]"
                />
                <AttachmentUploadNotice />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    {replyError ? <p className="text-sm text-destructive">{replyError}</p> : null}
                    <p className="text-xs text-muted-foreground">{replyMessage.length}/5000</p>
                  </div>
                  <Button type="button" onClick={onSendReply} disabled={isSendingReply}>
                    {isSendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send reply
                  </Button>
                </div>
              </div>
            ) : (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertTitle>Replies are disabled</AlertTitle>
                <AlertDescription>
                  This ticket is {formatTicketStatus(ticket.status).toLowerCase()} and cannot receive new replies.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function ListLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-36 rounded-xl" />
      ))}
    </div>
  )
}

export function Support() {
  const { toast } = useToast()
  const [tickets, setTickets] = useState<SupportTicketSummary[]>([])
  const [pagination, setPagination] = useState<SupportTicketPagination | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL_FILTER)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(ALL_FILTER)
  const [relatedFilter, setRelatedFilter] = useState<RelatedFilter>(ALL_FILTER)
  const [shippingOrderId, setShippingOrderId] = useState("")
  const [orderItemId, setOrderItemId] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketDetail | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState("")
  const [replyError, setReplyError] = useState<string | null>(null)
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [isCancelling, setIsCancelling] = useState(false)

  const loadTickets = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const data = await getSupportTickets({
        status: statusFilter === ALL_FILTER ? undefined : statusFilter,
        category: categoryFilter === ALL_FILTER ? undefined : categoryFilter,
        relatedResourceType: relatedFilter === ALL_FILTER ? undefined : relatedFilter,
        shippingOrderId: shippingOrderId.trim() || undefined,
        orderItemId: orderItemId.trim() || undefined,
        page,
        size: PAGE_SIZE,
        sort: "updatedAt,desc",
      })
      setTickets(data.tickets)
      setPagination(data.pagination)
    } catch (error) {
      setTickets([])
      setPagination(null)
      setLoadError(error instanceof Error ? error.message : "We could not load your support tickets. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [categoryFilter, orderItemId, page, relatedFilter, shippingOrderId, statusFilter])

  const loadTicketDetail = useCallback(async (ticketId: string, markRead: boolean) => {
    setIsDetailLoading(true)
    setDetailError(null)
    try {
      const detail = await getSupportTicketDetail(ticketId)
      setSelectedTicket(detail)

      if (markRead && detail.customerUnread) {
        markSupportTicketRead(ticketId)
          .then(() => {
            setSelectedTicket((current) => (current?.ticketId === ticketId ? { ...current, customerUnread: false } : current))
            setTickets((current) =>
              current.map((ticket) => (ticket.ticketId === ticketId ? { ...ticket, customerUnread: false } : ticket)),
            )
          })
          .catch(() => {
            // Non-blocking. The ticket detail is still usable if read-state update fails.
          })
      }
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "We could not load this support ticket. Please try again.")
    } finally {
      setIsDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  useEffect(() => {
    if (!detailOpen || !selectedTicketId) return
    loadTicketDetail(selectedTicketId, true)
  }, [detailOpen, loadTicketDetail, selectedTicketId])

  const filteredTickets = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return tickets

    return tickets.filter((ticket) => {
      const haystack = [
        ticket.ticketNumber,
        ticket.ticketId,
        ticket.subject,
        ticket.latestMessagePreview,
        ticket.relatedResource?.displayLabel,
        ticket.relatedResource?.shippingOrderId,
        ticket.relatedResource?.orderItemId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [searchTerm, tickets])

  const summary = useMemo(() => {
    return tickets.reduce(
      (acc, ticket) => {
        if (ticket.status === "WAITING_FOR_ADMIN") acc.waitingForSupport += 1
        if (ticket.status === "WAITING_FOR_CUSTOMER") acc.waitingForCustomer += 1
        if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") acc.closed += 1
        if (ticket.status && !["RESOLVED", "CLOSED", "CANCELLED"].includes(ticket.status)) acc.open += 1
        return acc
      },
      { open: 0, waitingForSupport: 0, waitingForCustomer: 0, closed: 0 },
    )
  }, [tickets])

  const hasActiveFilters =
    statusFilter !== ALL_FILTER ||
    categoryFilter !== ALL_FILTER ||
    relatedFilter !== ALL_FILTER ||
    Boolean(shippingOrderId.trim()) ||
    Boolean(orderItemId.trim()) ||
    Boolean(searchTerm.trim())

  const resetPageAndSet = <T,>(setter: (value: T) => void, value: T) => {
    setter(value)
    setPage(0)
  }

  const clearFilters = () => {
    setStatusFilter(ALL_FILTER)
    setCategoryFilter(ALL_FILTER)
    setRelatedFilter(ALL_FILTER)
    setShippingOrderId("")
    setOrderItemId("")
    setSearchTerm("")
    setPage(0)
  }

  const openTicket = (ticket: SupportTicketSummary) => {
    setSelectedTicket(ticket as SupportTicketDetail)
    setSelectedTicketId(ticket.ticketId)
    setReplyMessage("")
    setReplyError(null)
    setDetailError(null)
    setDetailOpen(true)
  }

  const handleTicketCreated = (ticket: SupportTicketDetail) => {
    setSelectedTicket(ticket)
    setSelectedTicketId(ticket.ticketId)
    setDetailOpen(true)
    setPage(0)
    loadTickets()
  }

  const updateSelectedTicketInList = (ticket: SupportTicketDetail) => {
    setTickets((current) => current.map((item) => (item.ticketId === ticket.ticketId ? { ...item, ...ticket } : item)))
  }

  const handleSendReply = async () => {
    if (!selectedTicket?.ticketId) return
    const trimmedMessage = replyMessage.trim()
    if (!trimmedMessage) {
      setReplyError("Reply message is required.")
      return
    }

    setIsSendingReply(true)
    setReplyError(null)
    try {
      const updatedTicket = await addSupportTicketMessage(selectedTicket.ticketId, {
        message: trimmedMessage,
        attachments: [],
      })
      setSelectedTicket(updatedTicket)
      updateSelectedTicketInList(updatedTicket)
      setReplyMessage("")
      toast({ title: "Reply sent", description: "Your message has been added to the ticket." })
      loadTickets()
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : "Failed to send your reply.")
    } finally {
      setIsSendingReply(false)
    }
  }

  const handleCancelTicket = async () => {
    if (!selectedTicket?.ticketId) return

    setIsCancelling(true)
    try {
      const action = await cancelSupportTicket(selectedTicket.ticketId, cancelReason)
      const fallbackStatus = action.status || "CANCELLED"
      setSelectedTicket((current) => (current ? { ...current, status: fallbackStatus } : current))
      setTickets((current) =>
        current.map((ticket) =>
          ticket.ticketId === selectedTicket.ticketId ? { ...ticket, status: fallbackStatus } : ticket,
        ),
      )
      setCancelOpen(false)
      setCancelReason("")
      toast({ title: "Ticket cancelled", description: action.message || "Your support ticket has been cancelled." })
      await loadTicketDetail(selectedTicket.ticketId, false)
      loadTickets()
    } catch (error) {
      toast({
        title: "Unable to cancel ticket",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const totalPages = pagination?.totalPages ?? 0
  const totalElements = pagination?.totalElements ?? tickets.length

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage your support requests.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={loadTickets} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Ticket
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Open tickets"
          value={summary.open}
          helper="Active tickets in the current result set"
          icon={<LifeBuoy className="h-5 w-5" />}
        />
        <SummaryCard
          label="Waiting for support"
          value={summary.waitingForSupport}
          helper="Our team needs to respond"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <SummaryCard
          label="Waiting for my response"
          value={summary.waitingForCustomer}
          helper="Tickets waiting on you"
          icon={<MessageSquare className="h-5 w-5" />}
        />
        <SummaryCard
          label="Resolved/closed"
          value={summary.closed}
          helper="Completed support requests"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </div>

      <Card className="dashboard-card-surface border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Filter by status, category, related records, or search within the current page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => resetPageAndSet(setStatusFilter, value as StatusFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
                  {SUPPORT_TICKET_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatTicketStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={categoryFilter}
                onValueChange={(value) => resetPageAndSet(setCategoryFilter, value as CategoryFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>All categories</SelectItem>
                  {SUPPORT_TICKET_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {formatTicketCategory(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Related type</Label>
              <Select
                value={relatedFilter}
                onValueChange={(value) => resetPageAndSet(setRelatedFilter, value as RelatedFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All related records" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>All related records</SelectItem>
                  {RELATED_RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatRelatedResourceType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="support-search">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="support-search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Ticket number or subject"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr,1fr,auto]">
            <div className="space-y-2">
              <Label htmlFor="filter-shipping-order">Shipping order ID</Label>
              <Input
                id="filter-shipping-order"
                value={shippingOrderId}
                onChange={(event) => resetPageAndSet(setShippingOrderId, event.target.value)}
                placeholder="Optional order filter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-order-item">Order item ID</Label>
              <Input
                id="filter-order-item"
                value={orderItemId}
                onChange={(event) => resetPageAndSet(setOrderItemId, event.target.value)}
                placeholder="Optional item filter"
              />
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={clearFilters} disabled={!hasActiveFilters} className="w-full">
                <FilterX className="h-4 w-4" />
                Clear filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loadError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load support tickets</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="dashboard-card-surface border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg">My tickets</CardTitle>
            <CardDescription>
              {totalElements ? `${totalElements} ticket${totalElements === 1 ? "" : "s"} found` : "No tickets found"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ListLoading />
          ) : filteredTickets.length ? (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <TicketListItem key={ticket.ticketId} ticket={ticket} onView={openTicket} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Inbox className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-semibold">
                {tickets.length ? "No tickets match your search" : "You do not have any support tickets yet."}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {tickets.length
                  ? "Try clearing filters or searching for another ticket number or subject."
                  : "Create your first ticket and our support team will follow up from here."}
              </p>
              <div className="mt-5 flex justify-center gap-2">
                {tickets.length ? (
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : null}
                <Button type="button" onClick={() => setCreateOpen(true)}>
                  Create your first ticket
                </Button>
              </div>
            </div>
          )}

          {pagination && totalPages > 1 ? (
            <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page <= 0 || isLoading}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={page >= totalPages - 1 || isLoading}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={handleTicketCreated} />

      <TicketDetailSheet
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) {
            setSelectedTicketId(null)
            setSelectedTicket(null)
            setReplyMessage("")
            setReplyError(null)
          }
        }}
        ticket={selectedTicket}
        isLoading={isDetailLoading}
        error={detailError}
        replyMessage={replyMessage}
        replyError={replyError}
        isSendingReply={isSendingReply}
        onReplyMessageChange={(value) => {
          setReplyMessage(value)
          if (replyError) setReplyError(null)
        }}
        onSendReply={handleSendReply}
        onOpenCancel={() => setCancelOpen(true)}
      />

      <AlertDialog open={cancelOpen} onOpenChange={(open) => !isCancelling && setCancelOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel your support request. You can create a new ticket later if you still need help.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason optional</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              maxLength={1000}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Example: Issue resolved from my side."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep ticket</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                handleCancelTicket()
              }}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Cancel ticket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
