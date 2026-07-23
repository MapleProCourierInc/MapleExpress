"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Archive,
  Calendar as CalendarIcon,
  CheckCircle2,
  ExternalLink,
  FilePlus2,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from "lucide-react"
import { apiFetch } from "@/lib/client-api"
import { uploadFileWithPresignedPut } from "@/lib/s3-upload-client"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import type { S3UploadType } from "@/types/aws-s3"
import type {
  ActivateLegalDocumentRequest,
  AdminLegalDocumentResponse,
  AdminPlatformConfigurationResponse,
  ContactEmailType,
  ContactPhoneType,
  CreateLegalDocumentVersionRequest,
  LegalDocumentStatus,
  LegalDocumentType,
  PlatformConfigurationApiError,
  SocialMediaPlatform,
  UpdateContactConfigurationRequest,
  UpdateLegalDocumentDraftRequest,
  UpdateSocialMediaConfigurationRequest,
} from "@/types/admin-platform-configuration"
import {
  CONTACT_EMAIL_TYPE_OPTIONS,
  CONTACT_PHONE_TYPE_OPTIONS,
  LEGAL_DOCUMENT_TYPE_OPTIONS,
  SOCIAL_MEDIA_PLATFORM_OPTIONS,
} from "@/types/admin-platform-configuration"

type Props = {
  initialData: AdminPlatformConfigurationResponse | null
  initialError: PlatformConfigurationApiError | null
}

type AddressForm = {
  locationName: string
  addressLine1: string
  addressLine2: string
  city: string
  provinceOrState: string
  postalCode: string
  countryCode: string
  mapUrl: string
  latitude: string
  longitude: string
}

type ContactForm = {
  emails: Record<ContactEmailType, string>
  phones: Record<ContactPhoneType, string>
  location: AddressForm
}

type SocialProfileForm = {
  profileUrl: string
  handle: string
  enabled: boolean
  displayOrder: string
}

type SocialForm = Record<SocialMediaPlatform, SocialProfileForm>

type LegalDraftForm = {
  title: string
  documentUrl: string
  changeSummary: string
}

type LegalActivationForm = {
  activeFrom: string
  activeUntil: string
}

type LegalUploadState = {
  fileName: string
  fileSize: number
  progress: number
  status: "idle" | "uploading" | "uploaded" | "error"
  error: string | null
}

const emptyLegalUploadState = (): LegalUploadState => ({
  fileName: "",
  fileSize: 0,
  progress: 0,
  status: "idle",
  error: null,
})

const LEGAL_DOCUMENT_S3_PUBLIC_BASE_URL = "https://maple-express.s3.ca-central-1.amazonaws.com/"
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const emptyEmails = () =>
  Object.fromEntries(CONTACT_EMAIL_TYPE_OPTIONS.map((option) => [option.value, ""])) as Record<ContactEmailType, string>

const emptyPhones = () =>
  Object.fromEntries(CONTACT_PHONE_TYPE_OPTIONS.map((option) => [option.value, ""])) as Record<ContactPhoneType, string>

const emptyLocation = (): AddressForm => ({
  locationName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  provinceOrState: "",
  postalCode: "",
  countryCode: "CA",
  mapUrl: "",
  latitude: "",
  longitude: "",
})

const emptyContactForm = (): ContactForm => ({
  emails: emptyEmails(),
  phones: emptyPhones(),
  location: emptyLocation(),
})

const emptySocialForm = () =>
  Object.fromEntries(
    SOCIAL_MEDIA_PLATFORM_OPTIONS.map((option, index) => [
      option.value,
      { profileUrl: "", handle: "", enabled: false, displayOrder: String(index + 1) },
    ]),
  ) as SocialForm

const freshLegalForm = (): CreateLegalDocumentVersionRequest => ({
  documentType: "PRIVACY_POLICY",
  title: "",
  documentUrl: "",
  changeSummary: "",
})

function formatDate(value?: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString()
}

function numberOrNull(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const numeric = Number(trimmed)
  return Number.isFinite(numeric) ? numeric : null
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0")
}

function dateToUtcMidnightIso(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}T00:00:00Z`
}

function parseCalendarDate(value?: string | null) {
  const trimmed = value?.trim()
  if (!trimmed) return undefined

  const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed)
  if (isoDateMatch) {
    const year = Number(isoDateMatch[1])
    const month = Number(isoDateMatch[2])
    const day = Number(isoDateMatch[3])
    const date = new Date(year, month - 1, day)

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date
    }
  }

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function formatCalendarDate(value?: string | null) {
  const date = parseCalendarDate(value)
  if (!date) return ""
  return `${MONTH_LABELS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

function contactFormFromConfig(config: AdminPlatformConfigurationResponse | null): ContactForm {
  const form = emptyContactForm()
  ;(config?.contact?.emails || []).forEach((email) => {
    if (email.type) form.emails[email.type] = email.value || ""
  })
  ;(config?.contact?.phones || []).forEach((phone) => {
    if (phone.type) form.phones[phone.type] = phone.value || ""
  })

  const location = config?.contact?.location
  if (location) {
    form.location = {
      locationName: location.locationName || "",
      addressLine1: location.addressLine1 || "",
      addressLine2: location.addressLine2 || "",
      city: location.city || "",
      provinceOrState: location.provinceOrState || "",
      postalCode: location.postalCode || "",
      countryCode: location.countryCode || "CA",
      mapUrl: location.mapUrl || "",
      latitude: location.latitude == null ? "" : String(location.latitude),
      longitude: location.longitude == null ? "" : String(location.longitude),
    }
  }

  return form
}

function socialFormFromConfig(config: AdminPlatformConfigurationResponse | null): SocialForm {
  const form = emptySocialForm()
  ;(config?.socialMediaProfiles || []).forEach((profile) => {
    if (!profile.platform) return
    const profileUrl = profile.profileUrl || ""
    form[profile.platform] = {
      profileUrl,
      handle: profile.handle || "",
      enabled: Boolean(profileUrl.trim()) && (profile.enabled ?? true),
      displayOrder: profile.displayOrder == null ? "" : String(profile.displayOrder),
    }
  })
  return form
}

function draftFormsFromConfig(config: AdminPlatformConfigurationResponse | null) {
  return Object.fromEntries(
    (config?.legalDocuments || []).map((document) => [
      document.legalDocumentId,
      {
        title: document.title || "",
        documentUrl: document.documentUrl || "",
        changeSummary: document.changeSummary || "",
      },
    ]),
  ) as Record<string, LegalDraftForm>
}

function activationFormsFromConfig(config: AdminPlatformConfigurationResponse | null) {
  return Object.fromEntries(
    (config?.legalDocuments || []).map((document) => [
      document.legalDocumentId,
      {
        activeFrom: document.activeFrom || "",
        activeUntil: document.activeUntil || "",
      },
    ]),
  ) as Record<string, LegalActivationForm>
}

function statusBadgeVariant(status?: LegalDocumentStatus | null) {
  if (status === "ACTIVE") return "default"
  if (status === "DRAFT") return "secondary"
  if (status === "ARCHIVED") return "outline"
  return "outline"
}

function legalDocumentSortPriority(document: AdminLegalDocumentResponse) {
  if (document.current) return 0
  if (document.status === "ACTIVE") return 1
  if (document.status === "SCHEDULED") return 2
  if (document.status === "DRAFT") return 3
  if (document.status === "EXPIRED") return 4
  if (document.status === "ARCHIVED") return 5
  return 6
}

function readSummary(response: Response, fallback: string) {
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    return response.json().then((payload: PlatformConfigurationApiError | null) => {
      const details = payload?.errors
        ?.map((error) => `${error.field || "Field"}: ${error.message || "Invalid value"}`)
        .join(" ")
      return [payload?.message || fallback, details].filter(Boolean).join(" ")
    }).catch(() => fallback)
  }
  return response.text().then((text) => text || fallback).catch(() => fallback)
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

function legalDocumentUrlFromUploadedKey(key: string) {
  if (isHttpUrl(key)) return key
  return `${LEGAL_DOCUMENT_S3_PUBLIC_BASE_URL}${key.replace(/^\/+/, "")}`
}

function formatFileSize(bytes: number) {
  if (!bytes) return ""
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function LegalPdfUploadControl({
  id,
  documentKey,
  uploadState,
  disabled,
  onFileSelected,
}: {
  id: string
  documentKey?: string
  uploadState: LegalUploadState
  disabled?: boolean
  onFileSelected: (file: File) => void
}) {
  const uploading = uploadState.status === "uploading"

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Label htmlFor={id}>PDF Document</Label>
          <p className="text-xs text-muted-foreground">Upload a PDF. The public S3 URL is saved to platform configuration.</p>
        </div>
        <label
          htmlFor={id}
          aria-disabled={disabled || uploading}
          className={cn(
            "inline-flex h-10 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground",
            (disabled || uploading) && "pointer-events-none opacity-50",
          )}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading..." : "Choose PDF"}
        </label>
      </div>
      <input
        id={id}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.currentTarget.value = ""
          if (file) onFileSelected(file)
        }}
      />
      {uploading || uploadState.status === "uploaded" ? (
        <div className="space-y-1">
          <Progress value={uploadState.progress} />
          <p className="text-xs text-muted-foreground">
            {uploadState.fileName} {formatFileSize(uploadState.fileSize) ? `(${formatFileSize(uploadState.fileSize)})` : ""} - {uploadState.progress}%
          </p>
        </div>
      ) : null}
      {uploadState.status === "error" && uploadState.error ? (
        <p className="text-xs text-destructive">{uploadState.error}</p>
      ) : null}
      {documentKey ? (
        <p className="break-all rounded bg-muted/50 px-2 py-1 text-xs text-muted-foreground">Document URL: {documentKey}</p>
      ) : (
        <p className="text-xs text-muted-foreground">No PDF uploaded yet.</p>
      )}
    </div>
  )
}

function LegalDatePicker({
  id,
  label,
  value,
  placeholder,
  disabled,
  onChange,
}: {
  id: string
  label: string
  value: string
  placeholder: string
  disabled?: boolean
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selectedDate = parseCalendarDate(value)
  const displayValue = formatCalendarDate(value)

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn("w-full justify-start text-left font-normal", !displayValue && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {displayValue || placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (!date) return
                onChange(dateToUtcMidnightIso(date))
                setOpen(false)
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {value ? (
          <Button type="button" variant="outline" disabled={disabled} onClick={() => onChange("")}>
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function AdminPlatformConfigurationManager({ initialData, initialError }: Props) {
  const { toast } = useToast()
  const [config, setConfig] = useState(initialData)
  const [loadError, setLoadError] = useState(initialError?.message || "")
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [contactForm, setContactForm] = useState(() => contactFormFromConfig(initialData))
  const [newEmailType, setNewEmailType] = useState<ContactEmailType | "">("")
  const [newEmailValue, setNewEmailValue] = useState("")
  const [newPhoneType, setNewPhoneType] = useState<ContactPhoneType | "">("")
  const [newPhoneValue, setNewPhoneValue] = useState("")
  const [socialForm, setSocialForm] = useState(() => socialFormFromConfig(initialData))
  const [legalForm, setLegalForm] = useState(() => freshLegalForm())
  const [legalCreateUpload, setLegalCreateUpload] = useState<LegalUploadState>(() => emptyLegalUploadState())
  const [draftUploadStates, setDraftUploadStates] = useState<Record<string, LegalUploadState>>({})
  const [draftForms, setDraftForms] = useState(() => draftFormsFromConfig(initialData))
  const [activationForms, setActivationForms] = useState(() => activationFormsFromConfig(initialData))

  useEffect(() => {
    setContactForm(contactFormFromConfig(config))
    setNewEmailType("")
    setNewEmailValue("")
    setNewPhoneType("")
    setNewPhoneValue("")
    setSocialForm(socialFormFromConfig(config))
    setLegalCreateUpload(emptyLegalUploadState())
    setDraftUploadStates({})
    setDraftForms(draftFormsFromConfig(config))
    setActivationForms(activationFormsFromConfig(config))
  }, [config])

  const legalDocuments = useMemo(
    () =>
      [...(config?.legalDocuments || [])].sort((left, right) => {
        const priorityCompare = legalDocumentSortPriority(left) - legalDocumentSortPriority(right)
        if (priorityCompare !== 0) return priorityCompare
        const typeCompare = String(left.documentType || "").localeCompare(String(right.documentType || ""))
        if (typeCompare !== 0) return typeCompare
        return Number(right.policyVersion || 0) - Number(left.policyVersion || 0)
      }),
    [config],
  )
  const configuredEmailOptions = CONTACT_EMAIL_TYPE_OPTIONS.filter((option) => contactForm.emails[option.value].trim())
  const availableEmailOptions = CONTACT_EMAIL_TYPE_OPTIONS.filter((option) => !contactForm.emails[option.value].trim())
  const configuredPhoneOptions = CONTACT_PHONE_TYPE_OPTIONS.filter((option) => contactForm.phones[option.value].trim())
  const availablePhoneOptions = CONTACT_PHONE_TYPE_OPTIONS.filter((option) => !contactForm.phones[option.value].trim())

  const addEmail = () => {
    if (!newEmailType || !newEmailValue.trim()) return
    setContactForm((prev) => ({
      ...prev,
      emails: { ...prev.emails, [newEmailType]: newEmailValue.trim() },
    }))
    setNewEmailType("")
    setNewEmailValue("")
  }

  const addPhone = () => {
    if (!newPhoneType || !newPhoneValue.trim()) return
    setContactForm((prev) => ({
      ...prev,
      phones: { ...prev.phones, [newPhoneType]: newPhoneValue.trim() },
    }))
    setNewPhoneType("")
    setNewPhoneValue("")
  }

  const uploadLegalPdf = async ({
    file,
    documentType,
    onState,
    onUploaded,
  }: {
    file: File
    documentType: LegalDocumentType
    onState: (state: LegalUploadState) => void
    onUploaded: (key: string) => void
  }) => {
    if (!isPdfFile(file)) {
      onState({
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        status: "error",
        error: "Only PDF documents can be uploaded.",
      })
      return
    }

    if (file.size > 1024 * 1024) {
      toast({
        title: "Large PDF selected",
        description: "The browser will upload this PDF as-is. Compression needs a PDF-specific server or worker pipeline.",
      })
    }

    onState({ fileName: file.name, fileSize: file.size, progress: 0, status: "uploading", error: null })

    try {
      const key = await uploadFileWithPresignedPut({
        uploadType: documentType as S3UploadType,
        file,
        contentType: "application/pdf",
        onProgress: (progress) =>
          onState({ fileName: file.name, fileSize: file.size, progress, status: "uploading", error: null }),
      })

      onUploaded(key)
      onState({ fileName: file.name, fileSize: file.size, progress: 100, status: "uploaded", error: null })
    } catch (error) {
      onState({
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        status: "error",
        error: error instanceof Error ? error.message : "Upload failed",
      })
    }
  }

  const uploadCreateLegalPdf = (file: File) => {
    void uploadLegalPdf({
      file,
      documentType: legalForm.documentType,
      onState: setLegalCreateUpload,
      onUploaded: (key) => setLegalForm((prev) => ({ ...prev, documentUrl: legalDocumentUrlFromUploadedKey(key) })),
    })
  }

  const uploadDraftLegalPdf = (document: AdminLegalDocumentResponse, file: File, draft: LegalDraftForm) => {
    void uploadLegalPdf({
      file,
      documentType: document.documentType,
      onState: (state) =>
        setDraftUploadStates((prev) => ({
          ...prev,
          [document.legalDocumentId]: state,
        })),
      onUploaded: (key) =>
        setDraftForms((prev) => ({
          ...prev,
          [document.legalDocumentId]: { ...draft, documentUrl: legalDocumentUrlFromUploadedKey(key) },
        })),
    })
  }

  const refreshConfig = async (silent = false) => {
    setBusyAction("refresh")
    const response = await apiFetch("/api/admin/platform-configuration")
    setBusyAction(null)

    if (!response.ok) {
      const message = await readSummary(response, "Failed to fetch platform configuration")
      setLoadError(message)
      if (!silent) toast({ title: "Unable to refresh configuration", description: message, variant: "destructive" })
      return false
    }

    const payload = (await response.json()) as AdminPlatformConfigurationResponse
    setConfig(payload)
    setLoadError("")
    if (!silent) toast({ title: "Configuration refreshed" })
    return true
  }

  const saveContact = async () => {
    const payload: UpdateContactConfigurationRequest = {
      emails: Object.fromEntries(
        CONTACT_EMAIL_TYPE_OPTIONS
          .map((option) => [option.value, contactForm.emails[option.value].trim()])
          .filter(([, value]) => Boolean(value)),
      ) as Partial<Record<ContactEmailType, string>>,
      phones: Object.fromEntries(
        CONTACT_PHONE_TYPE_OPTIONS
          .map((option) => [option.value, contactForm.phones[option.value].trim()])
          .filter(([, value]) => Boolean(value)),
      ) as Partial<Record<ContactPhoneType, string>>,
      location: {
        locationName: contactForm.location.locationName.trim() || null,
        addressLine1: contactForm.location.addressLine1.trim(),
        addressLine2: contactForm.location.addressLine2.trim() || null,
        city: contactForm.location.city.trim(),
        provinceOrState: contactForm.location.provinceOrState.trim(),
        postalCode: contactForm.location.postalCode.trim(),
        countryCode: contactForm.location.countryCode.trim() || "CA",
        mapUrl: contactForm.location.mapUrl.trim() || null,
        latitude: numberOrNull(contactForm.location.latitude),
        longitude: numberOrNull(contactForm.location.longitude),
      },
    }

    setBusyAction("contact")
    const response = await apiFetch("/api/admin/platform-configuration/contact", {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setBusyAction(null)

    if (!response.ok) {
      toast({
        title: "Unable to save contact configuration",
        description: await readSummary(response, "Contact configuration update failed"),
        variant: "destructive",
      })
      return
    }

    setConfig((await response.json()) as AdminPlatformConfigurationResponse)
    toast({ title: "Contact configuration saved" })
  }

  const saveSocial = async () => {
    const payload: UpdateSocialMediaConfigurationRequest = {
      profiles: Object.fromEntries(
        SOCIAL_MEDIA_PLATFORM_OPTIONS
          .map((option) => {
            const profile = socialForm[option.value]
            const profileUrl = profile.profileUrl.trim()
            if (!profileUrl) return null
            return [
              option.value,
              {
                profileUrl,
                handle: profile.handle.trim() || null,
                enabled: profile.enabled,
                displayOrder: numberOrNull(profile.displayOrder),
              },
            ]
          })
          .filter(Boolean) as Array<[SocialMediaPlatform, NonNullable<UpdateSocialMediaConfigurationRequest["profiles"]>[SocialMediaPlatform]]>,
      ),
    }

    setBusyAction("social")
    const response = await apiFetch("/api/admin/platform-configuration/social-media", {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setBusyAction(null)

    if (!response.ok) {
      toast({
        title: "Unable to save social-media configuration",
        description: await readSummary(response, "Social-media configuration update failed"),
        variant: "destructive",
      })
      return
    }

    setConfig((await response.json()) as AdminPlatformConfigurationResponse)
    toast({ title: "Social-media configuration saved" })
  }

  const createLegalDocument = async () => {
    if (!legalForm.documentUrl.trim()) {
      toast({
        title: "Upload a PDF first",
        description: "Legal-document drafts store the public S3 URL generated from the AWS upload key.",
        variant: "destructive",
      })
      return
    }

    setBusyAction("legal-create")
    const response = await apiFetch("/api/admin/platform-configuration/legal-documents", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        documentType: legalForm.documentType,
        title: legalForm.title.trim(),
        documentUrl: legalForm.documentUrl.trim(),
        changeSummary: legalForm.changeSummary?.trim() || null,
      }),
    })
    setBusyAction(null)

    if (!response.ok) {
      toast({
        title: "Unable to create legal-document draft",
        description: await readSummary(response, "Legal-document draft creation failed"),
        variant: "destructive",
      })
      return
    }

    setLegalForm(freshLegalForm())
    await refreshConfig(true)
    toast({ title: "Legal-document draft created" })
  }

  const updateLegalDraft = async (document: AdminLegalDocumentResponse) => {
    const form = draftForms[document.legalDocumentId]
    if (!form) return

    const payload: UpdateLegalDocumentDraftRequest = {
      title: form.title.trim(),
      documentUrl: form.documentUrl.trim(),
      changeSummary: form.changeSummary.trim() || null,
    }

    setBusyAction(`legal-update-${document.legalDocumentId}`)
    const response = await apiFetch(`/api/admin/platform-configuration/legal-documents/${encodeURIComponent(document.legalDocumentId)}`, {
      method: "PATCH",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setBusyAction(null)

    if (!response.ok) {
      toast({
        title: "Unable to update draft",
        description: await readSummary(response, "Legal-document draft update failed"),
        variant: "destructive",
      })
      return
    }

    await refreshConfig(true)
    toast({ title: "Legal-document draft updated" })
  }

  const deleteLegalDraft = async (document: AdminLegalDocumentResponse) => {
    if (!window.confirm(`Delete draft ${document.title || document.displayName || document.legalDocumentId}?`)) return

    setBusyAction(`legal-delete-${document.legalDocumentId}`)
    const response = await apiFetch(`/api/admin/platform-configuration/legal-documents/${encodeURIComponent(document.legalDocumentId)}`, {
      method: "DELETE",
    })
    setBusyAction(null)

    if (!response.ok) {
      toast({
        title: "Unable to delete draft",
        description: await readSummary(response, "Legal-document draft delete failed"),
        variant: "destructive",
      })
      return
    }

    await refreshConfig(true)
    toast({ title: "Legal-document draft deleted" })
  }

  const activateLegalDocument = async (document: AdminLegalDocumentResponse) => {
    const form = activationForms[document.legalDocumentId] || { activeFrom: "", activeUntil: "" }
    const payload: ActivateLegalDocumentRequest = {
      activeFrom: form.activeFrom.trim() || null,
      activeUntil: form.activeUntil.trim() || null,
    }

    setBusyAction(`legal-activate-${document.legalDocumentId}`)
    const response = await apiFetch(`/api/admin/platform-configuration/legal-documents/${encodeURIComponent(document.legalDocumentId)}/activate`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setBusyAction(null)

    if (!response.ok) {
      toast({
        title: "Unable to activate legal document",
        description: await readSummary(response, "Legal-document activation failed"),
        variant: "destructive",
      })
      return
    }

    await refreshConfig(true)
    toast({ title: form.activeFrom.trim() ? "Legal document scheduled" : "Legal document activated" })
  }

  const archiveLegalDocument = async (document: AdminLegalDocumentResponse) => {
    if (!window.confirm(`Archive ${document.title || document.displayName || document.legalDocumentId}?`)) return

    setBusyAction(`legal-archive-${document.legalDocumentId}`)
    const response = await apiFetch(`/api/admin/platform-configuration/legal-documents/${encodeURIComponent(document.legalDocumentId)}/archive`, {
      method: "POST",
    })
    setBusyAction(null)

    if (!response.ok) {
      toast({
        title: "Unable to archive legal document",
        description: await readSummary(response, "Legal-document archive failed"),
        variant: "destructive",
      })
      return
    }

    await refreshConfig(true)
    toast({ title: "Legal document archived" })
  }

  const openLegalDocument = async (document: AdminLegalDocumentResponse) => {
    const storedDocumentUrl = document.documentUrl || ""
    if (!storedDocumentUrl) return

    if (isHttpUrl(storedDocumentUrl)) {
      window.open(storedDocumentUrl, "_blank", "noopener,noreferrer")
      return
    }

    const response = await fetch(`/api/platform-configuration/legal-documents/view?key=${encodeURIComponent(storedDocumentUrl)}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    })

    if (!response.ok) {
      toast({
        title: "Unable to open document",
        description: "Could not generate a temporary view URL for this S3 key.",
        variant: "destructive",
      })
      return
    }

    const payload = (await response.json().catch(() => null)) as { presignedGetUrl?: string } | null
    if (payload?.presignedGetUrl) {
      window.open(payload.presignedGetUrl, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Configuration</h1>
          <p className="text-muted-foreground">Manage public contact details, social profiles, and legal-document versions.</p>
        </div>
        <Button variant="outline" onClick={() => refreshConfig()} disabled={busyAction === "refresh"}>
          <RefreshCw className={`mr-2 h-4 w-4 ${busyAction === "refresh" ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load platform configuration</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="contact" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="legal">Legal Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Public Email Addresses</CardTitle>
                <CardDescription>Configured email categories from the platform document.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {configuredEmailOptions.length ? (
                  configuredEmailOptions.map((option) => (
                    <div key={option.value} className="grid gap-2 rounded-md border p-3 md:grid-cols-[180px,1fr,40px] md:items-end">
                      <div>
                        <Label htmlFor={`email-${option.value}`}>{option.label}</Label>
                        <p className="mt-1 text-xs text-muted-foreground">{option.value}</p>
                      </div>
                      <Input
                        id={`email-${option.value}`}
                        type="email"
                        value={contactForm.emails[option.value]}
                        onChange={(event) =>
                          setContactForm((prev) => ({
                            ...prev,
                            emails: { ...prev.emails, [option.value]: event.target.value },
                          }))
                        }
                        placeholder="name@maplexpress.ca"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Remove ${option.label}`}
                        onClick={() =>
                          setContactForm((prev) => ({
                            ...prev,
                            emails: { ...prev.emails, [option.value]: "" },
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    No public email addresses are configured.
                  </p>
                )}

                <div className="grid gap-2 rounded-md bg-muted/40 p-3 md:grid-cols-[220px,1fr,auto] md:items-end">
                  <div className="space-y-1.5">
                    <Label>Add Email Type</Label>
                    <Select
                      value={newEmailType}
                      onValueChange={(value) => setNewEmailType(value as ContactEmailType)}
                      disabled={!availableEmailOptions.length}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={availableEmailOptions.length ? "Select category" : "All email types added"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableEmailOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-email-value">Email Address</Label>
                    <Input
                      id="new-email-value"
                      type="email"
                      value={newEmailValue}
                      onChange={(event) => setNewEmailValue(event.target.value)}
                      placeholder="name@maplexpress.ca"
                      disabled={!availableEmailOptions.length}
                    />
                  </div>
                  <Button type="button" onClick={addEmail} disabled={!newEmailType || !newEmailValue.trim()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Public Phone Numbers</CardTitle>
                <CardDescription>Configured phone categories from the platform document.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {configuredPhoneOptions.length ? (
                  configuredPhoneOptions.map((option) => (
                    <div key={option.value} className="grid gap-2 rounded-md border p-3 md:grid-cols-[180px,1fr,40px] md:items-end">
                      <div>
                        <Label htmlFor={`phone-${option.value}`}>{option.label}</Label>
                        <p className="mt-1 text-xs text-muted-foreground">{option.value}</p>
                      </div>
                      <Input
                        id={`phone-${option.value}`}
                        value={contactForm.phones[option.value]}
                        onChange={(event) =>
                          setContactForm((prev) => ({
                            ...prev,
                            phones: { ...prev.phones, [option.value]: event.target.value },
                          }))
                        }
                        placeholder="+1 902 555 0101"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Remove ${option.label}`}
                        onClick={() =>
                          setContactForm((prev) => ({
                            ...prev,
                            phones: { ...prev.phones, [option.value]: "" },
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    No public phone numbers are configured.
                  </p>
                )}

                <div className="grid gap-2 rounded-md bg-muted/40 p-3 md:grid-cols-[220px,1fr,auto] md:items-end">
                  <div className="space-y-1.5">
                    <Label>Add Phone Type</Label>
                    <Select
                      value={newPhoneType}
                      onValueChange={(value) => setNewPhoneType(value as ContactPhoneType)}
                      disabled={!availablePhoneOptions.length}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={availablePhoneOptions.length ? "Select category" : "All phone types added"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePhoneOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-phone-value">Phone Number</Label>
                    <Input
                      id="new-phone-value"
                      value={newPhoneValue}
                      onChange={(event) => setNewPhoneValue(event.target.value)}
                      placeholder="+1 902 555 0101"
                      disabled={!availablePhoneOptions.length}
                    />
                  </div>
                  <Button type="button" onClick={addPhone} disabled={!newPhoneType || !newPhoneValue.trim()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Public Location</CardTitle>
              <CardDescription>Location is required by the billing-management API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="locationName">Location Name</Label>
                  <Input
                    id="locationName"
                    value={contactForm.location.locationName}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, location: { ...prev.location, locationName: event.target.value } }))
                    }
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="addressLine1">Address Line 1</Label>
                  <Input
                    id="addressLine1"
                    value={contactForm.location.addressLine1}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, location: { ...prev.location, addressLine1: event.target.value } }))
                    }
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    value={contactForm.location.addressLine2}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, location: { ...prev.location, addressLine2: event.target.value } }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={contactForm.location.city}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, location: { ...prev.location, city: event.target.value } }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="provinceOrState">Province or State</Label>
                  <Input
                    id="provinceOrState"
                    value={contactForm.location.provinceOrState}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, location: { ...prev.location, provinceOrState: event.target.value } }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={contactForm.location.postalCode}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, location: { ...prev.location, postalCode: event.target.value } }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="countryCode">Country Code</Label>
                  <Input
                    id="countryCode"
                    value={contactForm.location.countryCode}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, location: { ...prev.location, countryCode: event.target.value } }))
                    }
                  />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label htmlFor="mapUrl">Map URL</Label>
                  <Input
                    id="mapUrl"
                    value={contactForm.location.mapUrl}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, location: { ...prev.location, mapUrl: event.target.value } }))
                    }
                    placeholder="https://maps.google.com/..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    inputMode="decimal"
                    value={contactForm.location.latitude}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, location: { ...prev.location, latitude: event.target.value } }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    inputMode="decimal"
                    value={contactForm.location.longitude}
                    onChange={(event) =>
                      setContactForm((prev) => ({ ...prev, location: { ...prev.location, longitude: event.target.value } }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveContact} disabled={busyAction === "contact"}>
                  {busyAction === "contact" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Profiles</CardTitle>
              <CardDescription>Profiles with blank URLs are removed from the replacement payload.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {SOCIAL_MEDIA_PLATFORM_OPTIONS.map((option) => {
                const profile = socialForm[option.value]
                const hasProfileUrl = Boolean(profile.profileUrl.trim())
                const isProfileEnabled = hasProfileUrl && profile.enabled
                return (
                  <div key={option.value} className="grid gap-3 rounded-md border p-3 lg:grid-cols-[160px,1.5fr,1fr,120px,96px] lg:items-end">
                    <div className="flex items-center justify-between gap-3 lg:block">
                      <div>
                        <Label>{option.label}</Label>
                        <p className="text-xs text-muted-foreground">{option.value}</p>
                      </div>
                      <Switch
                        checked={isProfileEnabled}
                        onCheckedChange={(checked) =>
                          setSocialForm((prev) => ({ ...prev, [option.value]: { ...prev[option.value], enabled: checked } }))
                        }
                        disabled={!hasProfileUrl}
                        aria-label={`Enable ${option.label}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`social-url-${option.value}`}>Profile URL</Label>
                      <Input
                        id={`social-url-${option.value}`}
                        value={profile.profileUrl}
                        onChange={(event) => {
                          const profileUrl = event.target.value
                          setSocialForm((prev) => ({
                            ...prev,
                            [option.value]: {
                              ...prev[option.value],
                              profileUrl,
                              enabled: profileUrl.trim() ? prev[option.value].enabled : false,
                            },
                          }))
                        }}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`social-handle-${option.value}`}>Handle</Label>
                      <Input
                        id={`social-handle-${option.value}`}
                        value={profile.handle}
                        onChange={(event) =>
                          setSocialForm((prev) => ({ ...prev, [option.value]: { ...prev[option.value], handle: event.target.value } }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`social-order-${option.value}`}>Order</Label>
                      <Input
                        id={`social-order-${option.value}`}
                        inputMode="numeric"
                        value={profile.displayOrder}
                        onChange={(event) =>
                          setSocialForm((prev) => ({ ...prev, [option.value]: { ...prev[option.value], displayOrder: event.target.value } }))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2 pb-2 text-sm text-muted-foreground lg:justify-end">
                      {isProfileEnabled ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4" />}
                      {isProfileEnabled ? "Enabled" : hasProfileUrl ? "Disabled" : "No link"}
                    </div>
                  </div>
                )
              })}
              <div className="flex justify-end pt-2">
                <Button onClick={saveSocial} disabled={busyAction === "social"}>
                  {busyAction === "social" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Social Media
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Legal-Document Draft</CardTitle>
              <CardDescription>New versions start as drafts before activation or scheduling.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-[240px,1fr,1.2fr]">
                <div className="space-y-1.5">
                  <Label>Document Type</Label>
                  <Select
                    value={legalForm.documentType}
                    onValueChange={(value) => {
                      setLegalForm((prev) => ({ ...prev, documentType: value as LegalDocumentType, documentUrl: "" }))
                      setLegalCreateUpload(emptyLegalUploadState())
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEGAL_DOCUMENT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="legal-title">Title</Label>
                  <Input
                    id="legal-title"
                    value={legalForm.title}
                    onChange={(event) => setLegalForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </div>
                <div className="lg:col-span-1">
                  <LegalPdfUploadControl
                    id="legal-create-pdf"
                    documentKey={legalForm.documentUrl}
                    uploadState={legalCreateUpload}
                    disabled={busyAction === "legal-create"}
                    onFileSelected={uploadCreateLegalPdf}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="legal-summary">Change Summary</Label>
                <Textarea
                  id="legal-summary"
                  value={legalForm.changeSummary || ""}
                  onChange={(event) => setLegalForm((prev) => ({ ...prev, changeSummary: event.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={createLegalDocument}
                  disabled={busyAction === "legal-create" || legalCreateUpload.status === "uploading" || !legalForm.documentUrl.trim()}
                >
                  {busyAction === "legal-create" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus2 className="mr-2 h-4 w-4" />}
                  Create Draft
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {legalDocuments.length ? (
              legalDocuments.map((document) => {
                const draft = draftForms[document.legalDocumentId] || { title: "", documentUrl: "", changeSummary: "" }
                const draftUploadState = draftUploadStates[document.legalDocumentId] || emptyLegalUploadState()
                const activation = activationForms[document.legalDocumentId] || { activeFrom: "", activeUntil: "" }
                const canEditDraft = document.status === "DRAFT"
                const canActivate = document.status !== "ARCHIVED" && !document.current
                const canArchive = document.status !== "ARCHIVED" && !document.current

                return (
                  <Card key={document.legalDocumentId} className={document.current ? "border-primary/50" : ""}>
                    <CardHeader className="space-y-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="truncate text-lg">{document.title || document.displayName || document.documentType}</CardTitle>
                            <Badge variant={statusBadgeVariant(document.status)}>{document.status || "-"}</Badge>
                            {document.current ? <Badge variant="default">Current</Badge> : null}
                          </div>
                          <CardDescription className="mt-1">
                            {document.displayName || document.documentType} v{document.policyVersion ?? "-"} - {document.legalDocumentId}
                          </CardDescription>
                        </div>
                        {document.documentUrl ? (
                          <Button type="button" variant="outline" size="sm" onClick={() => openLegalDocument(document)}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open
                          </Button>
                        ) : null}
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-4">
                        <p><span className="text-foreground">Active From:</span> {formatDate(document.activeFrom)}</p>
                        <p><span className="text-foreground">Active Until:</span> {formatDate(document.activeUntil)}</p>
                        <p><span className="text-foreground">Updated:</span> {formatDate(document.updatedAt)}</p>
                        <p><span className="text-foreground">Updated By:</span> {document.updatedBy || "-"}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {canEditDraft ? (
                        <div className="space-y-3 rounded-md border p-3">
                          <div className="grid gap-3 lg:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label htmlFor={`draft-title-${document.legalDocumentId}`}>Draft Title</Label>
                              <Input
                                id={`draft-title-${document.legalDocumentId}`}
                                value={draft.title}
                                onChange={(event) =>
                                  setDraftForms((prev) => ({
                                    ...prev,
                                    [document.legalDocumentId]: { ...draft, title: event.target.value },
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <LegalPdfUploadControl
                                id={`draft-pdf-${document.legalDocumentId}`}
                                documentKey={draft.documentUrl}
                                uploadState={draftUploadState}
                                disabled={busyAction === `legal-update-${document.legalDocumentId}`}
                                onFileSelected={(file) => uploadDraftLegalPdf(document, file, draft)}
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`draft-summary-${document.legalDocumentId}`}>Change Summary</Label>
                            <Textarea
                              id={`draft-summary-${document.legalDocumentId}`}
                              value={draft.changeSummary}
                              onChange={(event) =>
                                setDraftForms((prev) => ({
                                  ...prev,
                                  [document.legalDocumentId]: { ...draft, changeSummary: event.target.value },
                                }))
                              }
                              rows={3}
                            />
                          </div>
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              variant="destructive"
                              onClick={() => deleteLegalDraft(document)}
                              disabled={busyAction === `legal-delete-${document.legalDocumentId}`}
                            >
                              {busyAction === `legal-delete-${document.legalDocumentId}` ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Delete Draft
                            </Button>
                            <Button
                              onClick={() => updateLegalDraft(document)}
                              disabled={
                                busyAction === `legal-update-${document.legalDocumentId}` ||
                                draftUploadState.status === "uploading" ||
                                !draft.documentUrl.trim()
                              }
                            >
                              {busyAction === `legal-update-${document.legalDocumentId}` ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="mr-2 h-4 w-4" />
                              )}
                              Save Draft
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      {canActivate ? (
                        <div className="grid gap-3 rounded-md border p-3 lg:grid-cols-[1fr,1fr,auto] lg:items-end">
                          <LegalDatePicker
                            id={`active-from-${document.legalDocumentId}`}
                            label="Active From"
                            value={activation.activeFrom}
                            placeholder="Select start date"
                            disabled={busyAction === `legal-activate-${document.legalDocumentId}`}
                            onChange={(value) =>
                              setActivationForms((prev) => ({
                                ...prev,
                                [document.legalDocumentId]: { ...activation, activeFrom: value },
                              }))
                            }
                          />
                          <LegalDatePicker
                            id={`active-until-${document.legalDocumentId}`}
                            label="Active Until"
                            value={activation.activeUntil}
                            placeholder="Select end date"
                            disabled={busyAction === `legal-activate-${document.legalDocumentId}`}
                            onChange={(value) =>
                              setActivationForms((prev) => ({
                                ...prev,
                                [document.legalDocumentId]: { ...activation, activeUntil: value },
                              }))
                            }
                          />
                          <Button
                            onClick={() => activateLegalDocument(document)}
                            disabled={busyAction === `legal-activate-${document.legalDocumentId}`}
                          >
                            {busyAction === `legal-activate-${document.legalDocumentId}` ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            {activation.activeFrom.trim() ? "Schedule" : "Activate"}
                          </Button>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="min-w-0 text-sm text-muted-foreground">{document.changeSummary || "No change summary."}</p>
                        {canArchive ? (
                          <Button
                            variant="outline"
                            onClick={() => archiveLegalDocument(document)}
                            disabled={busyAction === `legal-archive-${document.legalDocumentId}`}
                          >
                            {busyAction === `legal-archive-${document.legalDocumentId}` ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Archive className="mr-2 h-4 w-4" />
                            )}
                            Archive
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No legal documents found</CardTitle>
                  <CardDescription>Create the first draft for the public legal-document list.</CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        Last updated {formatDate(config?.updatedAt)} by {config?.updatedBy || "-"}.
      </p>
    </div>
  )
}
