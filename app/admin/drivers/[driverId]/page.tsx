import Link from "next/link"
import type { ComponentType, ReactNode } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  FileCheck2,
  Gauge,
  IdCard,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { DriverDetailActions } from "@/components/admin/driver-detail-actions"
import { DocumentDecisionButtons } from "@/components/admin/document-approval-button"
import { DriverImageGallery } from "@/components/admin/driver-image-gallery"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getAdminDriverDetails } from "@/lib/admin-drivers-service"
import type { DocumentVerification, DriverDetailsDto, DriverImageEntity, DriverLicense, WorkEligibilityDocument } from "@/types/admin-drivers"

type GalleryImage = {
  key: string
  url?: string | null
  title?: string
  subtitle?: string
}

function formatDateTime(value?: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString()
}

function formatLocalDate(value?: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function humanize(value?: string | null) {
  if (!value) return "-"
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function renderEmpty(message = "No data available") {
  return <p className="text-sm text-muted-foreground">{message}</p>
}

function field(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-"
  return String(value)
}

function statusTone(status?: string | null): "green" | "yellow" | "red" | "neutral" {
  const normalized = String(status || "").toUpperCase()

  if (["ACTIVE", "APPROVED", "PROFILE_COMPLETE"].includes(normalized)) return "green"
  if (normalized.includes("PENDING") || normalized.includes("MISSING") || normalized.includes("IN_REVIEW")) return "yellow"
  if (["SUSPENDED", "TERMINATED", "REJECTED", "LICENSE_EXPIRED", "EXPIRED"].includes(normalized)) return "red"
  return "neutral"
}

function statusBadgeClass(status?: string | null) {
  const tone = statusTone(status)

  if (tone === "green") {
    return "border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
  }
  if (tone === "yellow") {
    return "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
  }
  if (tone === "red") {
    return "border-rose-200 bg-rose-100 text-rose-900 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200"
  }

  return "border-muted bg-muted text-foreground"
}

function isPending(status?: string | null) {
  return String(status || "").toUpperCase().includes("PENDING")
}

function isActiveOrPending(status?: string | null) {
  const normalized = String(status || "").toUpperCase()
  return normalized.includes("ACTIVE") || normalized.includes("APPROVED") || normalized.includes("PENDING")
}

function splitByPriority<T extends { status?: string | null }>(items: T[] | null | undefined) {
  const all = items || []
  return {
    visible: all.filter((item) => isActiveOrPending(item.status)),
    hidden: all.filter((item) => !isActiveOrPending(item.status)),
  }
}

function driverImagePriority(type?: string | null) {
  const normalized = String(type || "").toUpperCase()
  if (normalized.includes("SELFIE") || normalized.includes("FACE")) return 0
  if (normalized.includes("PROFILE") || normalized.includes("AVATAR")) return 1
  if (normalized.includes("PORTRAIT") || normalized.includes("DRIVER")) return 2
  return 3
}

function toDriverImageItems(images?: DriverImageEntity[] | null): GalleryImage[] {
  return (images || [])
    .filter((item) => Boolean(item.imageUrl))
    .sort((a, b) => driverImagePriority(a.imageType) - driverImagePriority(b.imageType))
    .map((item, idx) => ({
      key: item.imageUrl as string,
      url: item.imageUrl,
      title: `${humanize(item.imageType)}${item.imageType ? "" : ` #${idx + 1}`}`,
      subtitle: `Captured: ${formatDateTime(item.timestamp)}`,
    }))
}

function licenseImages(license: DriverLicense): GalleryImage[] {
  return [
    {
      key: license.licenseImageFront || "",
      url: license.licenseImageFront,
      title: "License front",
    },
    {
      key: license.licenseImageBack || "",
      url: license.licenseImageBack,
      title: "License back",
    },
  ].filter((item) => Boolean(item.key))
}

function workDocumentImages(doc: WorkEligibilityDocument): GalleryImage[] {
  return (doc.images || [])
    .map((image, imageIdx) => {
      const key = image.imageUrl
      if (!key) return null
      return {
        key,
        url: key,
        title: image.imageType ? humanize(image.imageType) : `Document image ${imageIdx + 1}`,
        subtitle: image.timestamp ? `Captured: ${formatDateTime(image.timestamp)}` : undefined,
      }
    })
    .filter(Boolean) as GalleryImage[]
}

function StatusPill({ status }: { status?: string | null }) {
  return (
    <Badge variant="outline" className={statusBadgeClass(status)}>
      {humanize(status)}
    </Badge>
  )
}

function Fact({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number | null | undefined
  icon?: ComponentType<{ className?: string }>
}) {
  return (
    <div className="min-w-0 rounded-md border bg-background p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-medium">{field(value)}</div>
    </div>
  )
}

function ReviewStage({
  title,
  status,
  count,
  icon: Icon,
}: {
  title: string
  status?: string | null
  count: number
  icon: ComponentType<{ className?: string }>
}) {
  const tone = statusTone(status)
  const iconClass =
    tone === "green"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "red"
        ? "bg-rose-100 text-rose-700"
        : tone === "yellow"
          ? "bg-amber-100 text-amber-700"
          : "bg-muted text-muted-foreground"

  return (
    <div className="flex min-w-0 items-start gap-3 rounded-md border bg-background p-4">
      <div className={`rounded-md p-2 ${iconClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusPill status={status} />
          <span className="text-xs text-muted-foreground">{count} record{count === 1 ? "" : "s"}</span>
        </div>
      </div>
    </div>
  )
}

function VerificationBlock({ verification }: { verification?: DocumentVerification | null }) {
  return (
    <div className="rounded-md border p-3">
      <p className="mb-2 text-sm font-semibold">Verification</p>
      {verification ? (
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p><span className="text-muted-foreground">Status:</span> {humanize(verification.status)}</p>
          <p><span className="text-muted-foreground">Method:</span> {field(verification.method)}</p>
          <p><span className="text-muted-foreground">Verified By:</span> {field(verification.verifiedBy)}</p>
          <p><span className="text-muted-foreground">Verified At:</span> {formatDateTime(verification.verifiedAt)}</p>
          <p className="sm:col-span-2"><span className="text-muted-foreground">Notes:</span> {field(verification.notes)}</p>
        </div>
      ) : (
        renderEmpty()
      )}
    </div>
  )
}

function IdentitySummary({
  data,
  fullName,
  driverId,
}: {
  data: DriverDetailsDto
  fullName: string
  driverId: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity & Contact</CardTitle>
        <CardDescription>Reference details used while reviewing driver documents.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Fact label="Name" value={fullName} icon={UserRound} />
          <Fact label="Email" value={data.email} icon={Mail} />
          <Fact label="Phone" value={data.phone} icon={Phone} />
          <Fact label="Station" value={data.station} icon={MapPin} />
          <Fact label="Company" value={humanize(data.companyName)} icon={BriefcaseBusiness} />
          <Fact label="Date of Birth" value={formatLocalDate(data.dob)} icon={CalendarClock} />
          <Fact label="Driver ID" value={data.driverId || driverId} icon={IdCard} />
          <Fact label="User ID" value={data.userId} icon={ShieldCheck} />
          <Fact label="Last Login" value={formatDateTime(data.lastLoginAt)} icon={Gauge} />
        </div>
      </CardContent>
    </Card>
  )
}

function IdentityReferencePanel({
  data,
  fullName,
  driverImages,
}: {
  data: DriverDetailsDto
  fullName: string
  driverImages: GalleryImage[]
}) {
  const primaryImage = driverImages[0]

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-3">
        <div>
          <CardTitle>Always-Visible Identity</CardTitle>
          <CardDescription>Keep this photo in view while comparing DL and POW images.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={data.profileStatus} />
          <Badge variant={data.isVerified ? "default" : "secondary"}>{data.isVerified ? "Verified" : "Not verified"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-md border bg-muted">
          {primaryImage?.url ? (
            <img src={primaryImage.url} alt={`${fullName} reference`} className="h-72 w-full object-cover" />
          ) : (
            <div className="flex h-72 items-center justify-center px-4 text-center text-sm text-muted-foreground">
              No driver reference image available.
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">{fullName}</p>
          <dl className="grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">DOB</dt>
              <dd className="font-medium">{formatLocalDate(data.dob)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{field(data.phone)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Station</dt>
              <dd className="font-medium">{field(data.station)}</dd>
            </div>
          </dl>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-semibold">All driver images</p>
          <DriverImageGallery
            images={driverImages}
            gridClassName="grid grid-cols-2 gap-2"
            imageClassName="h-28 w-full object-cover"
            itemClassName="rounded-md"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function LicenseReviewCard({
  license,
  index,
  driverId,
}: {
  license: DriverLicense
  index: number
  driverId: string
}) {
  const images = licenseImages(license)

  return (
    <section className="rounded-md border bg-background p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">Driving license {index + 1}</h3>
            <StatusPill status={license.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Check the license photos against the identity reference, then record the decision here.
          </p>
        </div>
        {isPending(license.status) ? (
          <DocumentDecisionButtons
            endpoint="/api/driver/license/approve"
            payload={{
              driverId,
              licenseNumber: license.licenseNumber || "",
              reason: "Approved by admin",
              notes: `Approved from Admin portal for ${license.licenseNumber || "license"}`,
            }}
            approveLabel="Approve DL"
            rejectLabel="Reject DL"
            subjectLabel="driving license"
          />
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div>
          <DriverImageGallery
            images={images}
            gridClassName="grid gap-3 md:grid-cols-2"
            imageClassName="h-64 w-full object-contain bg-muted"
            itemClassName="rounded-md"
          />
        </div>

        <div className="space-y-4">
          <div className="grid content-start gap-3 text-sm sm:grid-cols-2">
            <Fact label="License Number" value={license.licenseNumber} />
            <Fact label="Province" value={license.issuingProvince} />
            <Fact label="Class" value={license.licenseClass} />
            <Fact label="Restrictions" value={license.restrictions} />
            <Fact label="Issue Date" value={formatLocalDate(license.issueDate)} />
            <Fact label="Expiry Date" value={formatLocalDate(license.expiryDate)} />
            <Fact label="Created" value={formatLocalDate(license.createdAt)} />
          </div>
          <VerificationBlock verification={license.verification} />
        </div>
      </div>
    </section>
  )
}

function WorkDocumentReviewCard({
  doc,
  index,
  driverId,
}: {
  doc: WorkEligibilityDocument
  index: number
  driverId: string
}) {
  const attributes = Object.entries(doc.attributes || {})
  const images = workDocumentImages(doc)

  return (
    <section className="rounded-md border bg-background p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">Proof of work {index + 1}</h3>
            <StatusPill status={doc.status} />
            {doc.isPrimary ? <Badge variant="secondary">Primary</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Compare the work eligibility document photos with the driver reference before approving.
          </p>
        </div>
        {isPending(doc.status) ? (
          <DocumentDecisionButtons
            endpoint="/api/driver/pow/approve"
            payload={{
              driverId,
              documentId: doc.documentId || "",
              documentNumber: doc.documentNumber || "",
              reason: "Approved by admin",
              notes: `Approved from Admin portal for ${doc.documentId || doc.documentNumber || "document"}`,
            }}
            approveLabel="Approve POW"
            rejectLabel="Reject POW"
            subjectLabel="proof of work document"
          />
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div>
          <DriverImageGallery
            images={images}
            gridClassName="grid gap-3 md:grid-cols-2"
            imageClassName="h-64 w-full object-contain bg-muted"
            itemClassName="rounded-md"
          />
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Fact label="Document Type" value={humanize(doc.documentType)} />
            <Fact label="Holder Name" value={doc.holderFullName} />
            <Fact label="Document Number" value={doc.documentNumber} />
            <Fact label="Issuing Country" value={doc.issuingCountry} />
            <Fact label="Issuing Authority" value={doc.issuingAuthority} />
            <Fact label="Issue Date" value={formatLocalDate(doc.issueDate)} />
            <Fact label="Expiry Date" value={formatLocalDate(doc.expiryDate)} />
            <Fact label="Created" value={formatLocalDate(doc.createdAt)} />
          </div>

          <VerificationBlock verification={doc.verification} />

          <Collapsible>
            <CollapsibleTrigger className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              <ChevronDown className="h-4 w-4" />
              Attributes ({attributes.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              {attributes.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attributes.map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell>{key}</TableCell>
                        <TableCell>{value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                renderEmpty()
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </section>
  )
}

function ReviewSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

function SecondarySections({ data }: { data: DriverDetailsDto }) {
  return (
    <div className="space-y-3">
      <Collapsible>
        <Card>
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left">
            <span className="grid gap-1.5">
              <span className="text-base font-semibold leading-none tracking-tight">Weekly Availability</span>
              <span className="text-sm text-muted-foreground">{data.weeklyAvailability?.length || 0} availability week{data.weeklyAvailability?.length === 1 ? "" : "s"}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3 text-sm">
              {data.weeklyAvailability?.length ? (
                data.weeklyAvailability.map((week, weekIdx) => (
                  <div key={`${week.isoYear}-${week.isoWeek}-${weekIdx}`} className="space-y-2 rounded-md border p-3">
                    <div className="grid gap-2 md:grid-cols-2">
                      <p><span className="text-muted-foreground">ISO Year/Week:</span> {field(week.isoYear)}/{field(week.isoWeek)}</p>
                      <p><span className="text-muted-foreground">Week Range:</span> {formatLocalDate(week.weekStartDate)} - {formatLocalDate(week.weekEndDate)}</p>
                      <p><span className="text-muted-foreground">Source:</span> {field(week.source)}</p>
                      <p><span className="text-muted-foreground">Updated:</span> {formatDateTime(week.updatedAt)}</p>
                    </div>

                    {week.slots?.length ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Day</TableHead>
                            <TableHead>Start</TableHead>
                            <TableHead>End</TableHead>
                            <TableHead>Note</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {week.slots.map((slot, slotIdx) => (
                            <TableRow key={`${slot.dayOfWeek}-${slot.startTime}-${slotIdx}`}>
                              <TableCell>{field(slot.dayOfWeek)}</TableCell>
                              <TableCell>{field(slot.startTime)}</TableCell>
                              <TableCell>{field(slot.endTime)}</TableCell>
                              <TableCell>{field(slot.note)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      renderEmpty()
                    )}
                  </div>
                ))
              ) : (
                renderEmpty()
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible>
        <Card>
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left">
            <span className="grid gap-1.5">
              <span className="text-base font-semibold leading-none tracking-tight">Performance</span>
              <span className="text-sm text-muted-foreground">Ratings, reviews, and delivery analytics.</span>
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-5 text-sm">
              {data.ratingSummary ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Fact label="Average Rating" value={data.ratingSummary.averageRating} />
                    <Fact label="Total Ratings" value={data.ratingSummary.totalRatings} />
                  </div>

                  <div>
                    <p className="mb-2 font-medium">Reviews</p>
                    {data.ratingSummary.reviews?.length ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Reviewer</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Review</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.ratingSummary.reviews.map((review, idx) => (
                            <TableRow key={`${review.reviewerName || "reviewer"}-${idx}`}>
                              <TableCell>{field(review.reviewerName)}</TableCell>
                              <TableCell>{field(review.rating)}</TableCell>
                              <TableCell>{formatDateTime(review.timestamp)}</TableCell>
                              <TableCell>{field(review.reviewText)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      renderEmpty()
                    )}
                  </div>
                </div>
              ) : (
                renderEmpty()
              )}

              <Separator />

              <div className="grid gap-3 sm:grid-cols-2">
                {data.analytics ? (
                  <>
                    <Fact label="Total Deliveries" value={data.analytics.totalDeliveries} />
                    <Fact label="Distance Travelled (km)" value={data.analytics.totalDistanceTravelledKm} />
                    <Fact label="First Order Completed" value={formatDateTime(data.analytics.firstOrderCompletedAt)} />
                    <Fact label="Last Order Completed" value={formatDateTime(data.analytics.lastOrderCompletedAt)} />
                  </>
                ) : (
                  <div className="sm:col-span-2">{renderEmpty()}</div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admin Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{data.adminNotes || "No data available"}</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function DriverDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ driverId: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { driverId } = await params
  const resolvedSearch = (await searchParams) ?? {}
  const rawReturnTo = resolvedSearch.returnTo
  const returnTo = Array.isArray(rawReturnTo) ? rawReturnTo[0] : rawReturnTo

  const { data, error, textError } = await getAdminDriverDetails(driverId)

  if (!data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{error?.message || "Unable to load driver profile"}</AlertTitle>
        <AlertDescription>{textError || "Please go back and try again."}</AlertDescription>
      </Alert>
    )
  }

  const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Unknown Driver"
  const groupedLicenses = splitByPriority(data.driverLicenses)
  const groupedWorkDocs = splitByPriority(data.workEligibilityDocuments)
  const driverImages = toDriverImageItems(data.driverImages)
  const primaryLicenseStatus = groupedLicenses.visible[0]?.status || data.driverLicenses?.[0]?.status
  const primaryWorkStatus = groupedWorkDocs.visible[0]?.status || data.workEligibilityDocuments?.[0]?.status

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="space-y-4">
          <Link href={returnTo || "/admin/drivers"} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Drivers
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div>
                <h1 className="text-2xl font-bold">{fullName}</h1>
                <p className="text-sm text-muted-foreground">{field(data.email)}</p>
                <p className="text-xs text-muted-foreground">
                  Driver ID: <span className="font-mono">{field(data.driverId || driverId)}</span>
                  {data.userId ? <> | User ID: <span className="font-mono">{data.userId}</span></> : null}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className={statusBadgeClass(data.profileStatus)}>
                      {humanize(data.profileStatus)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>{field(data.profileStatus)}</TooltipContent>
                </Tooltip>
                <Badge variant={data.isVerified ? "default" : "secondary"}>{data.isVerified ? "Verified" : "Not verified"}</Badge>
                {data.backgroundCheckStatus ? (
                  <Badge variant="outline" title={data.backgroundCheckStatus}>
                    BG: {humanize(data.backgroundCheckStatus)}
                  </Badge>
                ) : null}
              </div>
            </div>

            {String(data.profileStatus || "").toUpperCase().includes("PENDING") ? (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Review identity, DL, and POW before approving the driver profile.</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <ReviewStage title="Driver profile" status={data.profileStatus} count={1} icon={UserRound} />
          <ReviewStage title="Driving license" status={primaryLicenseStatus} count={data.driverLicenses?.length || 0} icon={IdCard} />
          <ReviewStage title="Proof of work" status={primaryWorkStatus} count={data.workEligibilityDocuments?.length || 0} icon={FileCheck2} />
        </div>

        <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <main className="space-y-6">
            <IdentitySummary data={data} fullName={fullName} driverId={driverId} />

            <ReviewSection
              title="Driving License Check"
              description="License photos are large by default so admins can compare them with the persistent driver photo."
            >
              {data.driverLicenses?.length ? (
                <>
                  {groupedLicenses.visible.length ? groupedLicenses.visible.map((license, idx) => (
                    <LicenseReviewCard key={`license-visible-${idx}`} license={license} index={idx} driverId={driverId} />
                  )) : renderEmpty("No active or pending licenses available")}

                  {groupedLicenses.hidden.length ? (
                    <Collapsible>
                      <CollapsibleTrigger className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                        <ChevronDown className="h-4 w-4" />
                        Show other licenses ({groupedLicenses.hidden.length})
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-4 space-y-4">
                        {groupedLicenses.hidden.map((license, idx) => (
                          <LicenseReviewCard key={`license-hidden-${idx}`} license={license} index={idx} driverId={driverId} />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ) : null}
                </>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>No license submitted</AlertTitle>
                  <AlertDescription>The driver has not uploaded a driving license yet.</AlertDescription>
                </Alert>
              )}
            </ReviewSection>

            <ReviewSection
              title="Proof of Work Eligibility"
              description="POW document photos stay next to their details and decision controls."
            >
              {data.workEligibilityDocuments?.length ? (
                <>
                  {groupedWorkDocs.visible.length ? groupedWorkDocs.visible.map((doc, idx) => (
                    <WorkDocumentReviewCard key={`doc-visible-${idx}`} doc={doc} index={idx} driverId={driverId} />
                  )) : renderEmpty("No active or pending work eligibility documents available")}

                  {groupedWorkDocs.hidden.length ? (
                    <Collapsible>
                      <CollapsibleTrigger className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                        <ChevronDown className="h-4 w-4" />
                        Show other documents ({groupedWorkDocs.hidden.length})
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-4 space-y-4">
                        {groupedWorkDocs.hidden.map((doc, idx) => (
                          <WorkDocumentReviewCard key={`doc-hidden-${idx}`} doc={doc} index={idx} driverId={driverId} />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ) : null}
                </>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>No POW document submitted</AlertTitle>
                  <AlertDescription>The driver has not uploaded proof of work eligibility yet.</AlertDescription>
                </Alert>
              )}
            </ReviewSection>

            <SecondarySections data={data} />
          </main>

          <aside className="space-y-4 2xl:sticky 2xl:top-6">
            <IdentityReferencePanel data={data} fullName={fullName} driverImages={driverImages} />

            <Card>
              <CardHeader>
                <CardTitle>Profile Decision</CardTitle>
                <CardDescription>Use after DL, POW, and background review are complete.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border bg-muted/40 p-3 text-sm">
                  <div className="mb-2 flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Admin actions
                  </div>
                  <p className="text-muted-foreground">
                    Decisions are captured with a required reason for audit history.
                  </p>
                </div>
                <DriverDetailActions driverId={driverId} profileStatus={data.profileStatus} mode="panel" />
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </TooltipProvider>
  )
}
