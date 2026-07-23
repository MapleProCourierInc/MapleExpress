"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  ExternalLink,
  FilePlus2,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react"
import { apiFetch } from "@/lib/client-api"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
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
      { profileUrl: "", handle: "", enabled: true, displayOrder: String(index + 1) },
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
    form[profile.platform] = {
      profileUrl: profile.profileUrl || "",
      handle: profile.handle || "",
      enabled: profile.enabled ?? true,
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

export function AdminPlatformConfigurationManager({ initialData, initialError }: Props) {
  const { toast } = useToast()
  const [config, setConfig] = useState(initialData)
  const [loadError, setLoadError] = useState(initialError?.message || "")
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [contactForm, setContactForm] = useState(() => contactFormFromConfig(initialData))
  const [socialForm, setSocialForm] = useState(() => socialFormFromConfig(initialData))
  const [legalForm, setLegalForm] = useState(() => freshLegalForm())
  const [draftForms, setDraftForms] = useState(() => draftFormsFromConfig(initialData))
  const [activationForms, setActivationForms] = useState(() => activationFormsFromConfig(initialData))

  useEffect(() => {
    setContactForm(contactFormFromConfig(config))
    setSocialForm(socialFormFromConfig(config))
    setDraftForms(draftFormsFromConfig(config))
    setActivationForms(activationFormsFromConfig(config))
  }, [config])

  const legalDocuments = useMemo(
    () =>
      [...(config?.legalDocuments || [])].sort((left, right) => {
        const typeCompare = String(left.documentType || "").localeCompare(String(right.documentType || ""))
        if (typeCompare !== 0) return typeCompare
        return Number(right.policyVersion || 0) - Number(left.policyVersion || 0)
      }),
    [config],
  )

  const currentLegalCount = legalDocuments.filter((document) => document.current).length
  const enabledSocialCount = (config?.socialMediaProfiles || []).filter((profile) => profile.enabled).length

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

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Configuration ID</CardDescription>
            <CardTitle className="truncate text-base">{config?.id || "-"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mongo Version</CardDescription>
            <CardTitle className="text-base">{config?.mongoVersion ?? "-"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Enabled Social Profiles</CardDescription>
            <CardTitle className="text-base">{enabledSocialCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Legal Documents</CardDescription>
            <CardTitle className="text-base">{currentLegalCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

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
                <CardDescription>Blank fields are omitted from the replacement payload.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {CONTACT_EMAIL_TYPE_OPTIONS.map((option) => (
                  <div key={option.value} className="space-y-1.5">
                    <Label htmlFor={`email-${option.value}`}>{option.label}</Label>
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
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Public Phone Numbers</CardTitle>
                <CardDescription>Use display-ready phone strings, including extensions when needed.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {CONTACT_PHONE_TYPE_OPTIONS.map((option) => (
                  <div key={option.value} className="space-y-1.5">
                    <Label htmlFor={`phone-${option.value}`}>{option.label}</Label>
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
                  </div>
                ))}
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
                return (
                  <div key={option.value} className="grid gap-3 rounded-md border p-3 lg:grid-cols-[160px,1.5fr,1fr,120px,96px] lg:items-end">
                    <div className="flex items-center justify-between gap-3 lg:block">
                      <div>
                        <Label>{option.label}</Label>
                        <p className="text-xs text-muted-foreground">{option.value}</p>
                      </div>
                      <Switch
                        checked={profile.enabled}
                        onCheckedChange={(checked) =>
                          setSocialForm((prev) => ({ ...prev, [option.value]: { ...prev[option.value], enabled: checked } }))
                        }
                        aria-label={`Enable ${option.label}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`social-url-${option.value}`}>Profile URL</Label>
                      <Input
                        id={`social-url-${option.value}`}
                        value={profile.profileUrl}
                        onChange={(event) =>
                          setSocialForm((prev) => ({ ...prev, [option.value]: { ...prev[option.value], profileUrl: event.target.value } }))
                        }
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
                      {profile.enabled ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4" />}
                      {profile.enabled ? "Enabled" : "Disabled"}
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
                    onValueChange={(value) => setLegalForm((prev) => ({ ...prev, documentType: value as LegalDocumentType }))}
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
                <div className="space-y-1.5">
                  <Label htmlFor="legal-url">Document URL</Label>
                  <Input
                    id="legal-url"
                    value={legalForm.documentUrl}
                    onChange={(event) => setLegalForm((prev) => ({ ...prev, documentUrl: event.target.value }))}
                    placeholder="https://cdn.maplexpress.ca/legal/..."
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
                <Button onClick={createLegalDocument} disabled={busyAction === "legal-create"}>
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
                          <Button asChild variant="outline" size="sm">
                            <a href={document.documentUrl} target="_blank" rel="noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Open
                            </a>
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
                            <div className="space-y-1.5">
                              <Label htmlFor={`draft-url-${document.legalDocumentId}`}>Draft URL</Label>
                              <Input
                                id={`draft-url-${document.legalDocumentId}`}
                                value={draft.documentUrl}
                                onChange={(event) =>
                                  setDraftForms((prev) => ({
                                    ...prev,
                                    [document.legalDocumentId]: { ...draft, documentUrl: event.target.value },
                                  }))
                                }
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
                              disabled={busyAction === `legal-update-${document.legalDocumentId}`}
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
                          <div className="space-y-1.5">
                            <Label htmlFor={`active-from-${document.legalDocumentId}`}>Active From</Label>
                            <Input
                              id={`active-from-${document.legalDocumentId}`}
                              value={activation.activeFrom}
                              onChange={(event) =>
                                setActivationForms((prev) => ({
                                  ...prev,
                                  [document.legalDocumentId]: { ...activation, activeFrom: event.target.value },
                                }))
                              }
                              placeholder="2026-08-01T00:00:00Z"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`active-until-${document.legalDocumentId}`}>Active Until</Label>
                            <Input
                              id={`active-until-${document.legalDocumentId}`}
                              value={activation.activeUntil}
                              onChange={(event) =>
                                setActivationForms((prev) => ({
                                  ...prev,
                                  [document.legalDocumentId]: { ...activation, activeUntil: event.target.value },
                                }))
                              }
                              placeholder="2027-08-01T00:00:00Z"
                            />
                          </div>
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
