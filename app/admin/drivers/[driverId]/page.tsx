import Link from "next/link"
import { ArrowLeft, ChevronDown } from "lucide-react"
import { DriverDetailActions } from "@/components/admin/driver-detail-actions"
import { DocumentApprovalButton } from "@/components/admin/document-approval-button"
import { DriverImageGallery } from "@/components/admin/driver-image-gallery"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { presignView } from "@/lib/aws-integration-service"
import { getAdminDriverDetails } from "@/lib/admin-drivers-service"
import type { DriverLicense, WorkEligibilityDocument } from "@/types/admin-drivers"

function formatDateTime(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

function formatLocalDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function humanize(value?: string | null) {
  if (!value) return "—"
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
  if (value === null || value === undefined || value === "") return "—"
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

function LicenseCard({
  license,
  index,
  driverId,
  presignedMap,
}: {
  license: DriverLicense
  index: number
  driverId: string
  presignedMap: Record<string, { presignedGetUrl?: string }>
}) {
  const frontItem = license.licenseImageFront ? presignedMap[license.licenseImageFront] : undefined
  const backItem = license.licenseImageBack ? presignedMap[license.licenseImageBack] : undefined

  return (
    <div key={`${license.licenseNumber || "license"}-${index}`} className="space-y-3 rounded-md border p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <Badge variant="outline" className={statusBadgeClass(license.status)}>
          {humanize(license.status)}
        </Badge>
        {isPending(license.status) ? (
          <DocumentApprovalButton
            endpoint="/api/driver/license/approve"
            payload={{
              driverId,
              licenseNumber: license.licenseNumber || "",
              reason: "Approved by admin",
              notes: `Auto approval request from Admin portal for ${license.licenseNumber || "license"}`,
            }}
            label="Approve License"
          />
        ) : null}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <p><span className="text-muted-foreground">License Number:</span> {field(license.licenseNumber)}</p>
        <p><span className="text-muted-foreground">Province:</span> {field(license.issuingProvince)}</p>
        <p><span className="text-muted-foreground">Class:</span> {field(license.licenseClass)}</p>
        <p><span className="text-muted-foreground">Restrictions:</span> {field(license.restrictions)}</p>
        <p><span className="text-muted-foreground">Issue Date:</span> {formatDateTime(license.issueDate)}</p>
        <p><span className="text-muted-foreground">Expiry Date:</span> {formatDateTime(license.expiryDate)}</p>
        <p><span className="text-muted-foreground">Created:</span> {formatDateTime(license.createdAt)}</p>
        <p><span className="text-muted-foreground">Updated:</span> {formatDateTime(license.updatedAt)}</p>
      </div>
      <div className="space-y-2">
        <p className="font-medium">License Images</p>
        <DriverImageGallery
          images={[
            {
              key: license.licenseImageFront || "",
              url: license.licenseImageFront ? frontItem?.presignedGetUrl : undefined,
              title: "Front",
            },
            {
              key: license.licenseImageBack || "",
              url: license.licenseImageBack ? backItem?.presignedGetUrl : undefined,
              title: "Back",
            },
          ].filter((item) => Boolean(item.key))}
        />
      </div>
    </div>
  )
}

function WorkDocumentCard({
  doc,
  index,
  driverId,
  presignedMap,
}: {
  doc: WorkEligibilityDocument
  index: number
  driverId: string
  presignedMap: Record<string, { presignedGetUrl?: string }>
}) {
  const attributes = Object.entries(doc.attributes || {})
  const docImages = (doc.images || [])
    .map((image, imageIdx) => {
      const key = image.imageUrl
      if (!key) return null
      return {
        key,
        url: presignedMap[key]?.presignedGetUrl,
        title: `Document image ${imageIdx + 1}`,
      }
    })
    .filter(Boolean) as Array<{ key: string; url?: string; title: string }>

  return (
    <div key={`${doc.documentId || doc.documentNumber || "document"}-${index}`} className="space-y-3 rounded-md border p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <Badge variant="outline" className={statusBadgeClass(doc.status)}>
          {humanize(doc.status)}
        </Badge>
        {isPending(doc.status) ? (
          <DocumentApprovalButton
            endpoint="/api/driver/pow/approve"
            payload={{
              driverId,
              documentId: doc.documentId || "",
              documentNumber: doc.documentNumber || "",
              reason: "Approved by admin",
              notes: `Auto approval request from Admin portal for ${doc.documentId || doc.documentNumber || "document"}`,
            }}
            label="Approve Proof of Work"
          />
        ) : null}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <p><span className="text-muted-foreground">Document Type:</span> {humanize(doc.documentType)}</p>
        <p><span className="text-muted-foreground">Primary:</span> {doc.isPrimary === null || doc.isPrimary === undefined ? "—" : doc.isPrimary ? "Yes" : "No"}</p>
        <p><span className="text-muted-foreground">Document Number:</span> {field(doc.documentNumber)}</p>
        <p><span className="text-muted-foreground">Holder Name:</span> {field(doc.holderFullName)}</p>
        <p><span className="text-muted-foreground">Issuing Country:</span> {field(doc.issuingCountry)}</p>
        <p><span className="text-muted-foreground">Issuing Authority:</span> {field(doc.issuingAuthority)}</p>
        <p><span className="text-muted-foreground">Issue Date:</span> {formatDateTime(doc.issueDate)}</p>
        <p><span className="text-muted-foreground">Expiry Date:</span> {formatDateTime(doc.expiryDate)}</p>
        <p><span className="text-muted-foreground">Created:</span> {formatDateTime(doc.createdAt)}</p>
        <p><span className="text-muted-foreground">Updated:</span> {formatDateTime(doc.updatedAt)}</p>
      </div>

      <div>
        <p className="mb-2 font-medium">Verification</p>
        {doc.verification ? (
          <div className="grid gap-2 md:grid-cols-2">
            <p><span className="text-muted-foreground">Status:</span> {humanize(doc.verification.status)}</p>
            <p><span className="text-muted-foreground">Method:</span> {field(doc.verification.method)}</p>
            <p><span className="text-muted-foreground">Verified By:</span> {field(doc.verification.verifiedBy)}</p>
            <p><span className="text-muted-foreground">Verified At:</span> {formatDateTime(doc.verification.verifiedAt)}</p>
            <p className="md:col-span-2"><span className="text-muted-foreground">Notes:</span> {field(doc.verification.notes)}</p>
          </div>
        ) : (
          renderEmpty()
        )}
      </div>

      <div>
        <p className="mb-2 font-medium">Attributes</p>
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
      </div>

      <div>
        <p className="mb-2 font-medium">Document Images</p>
        <DriverImageGallery images={docImages} />
      </div>
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

  const licenseImageKeys = (data.driverLicenses || []).flatMap((license) => [license.licenseImageFront, license.licenseImageBack]).filter(Boolean) as string[]
  const workDocImageKeys = (data.workEligibilityDocuments || []).flatMap((doc) => (doc.images || []).map((image) => image.imageUrl).filter(Boolean)) as string[]
  const driverImageKeys = (data.driverImages || []).map((image) => image.imageUrl).filter(Boolean) as string[]
  const allImageKeys = Array.from(new Set([...licenseImageKeys, ...workDocImageKeys, ...driverImageKeys]))

  const presignedMap = await presignView(allImageKeys)
  const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Unknown Driver"

  const groupedLicenses = splitByPriority(data.driverLicenses)
  const groupedWorkDocs = splitByPriority(data.workEligibilityDocuments)

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Link href={returnTo || "/admin/drivers"} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Drivers
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{fullName}</h1>
              <p className="text-sm text-muted-foreground">{field(data.email)}</p>
              <p className="text-xs text-muted-foreground">
                Driver ID: <span className="font-mono">{field(data.driverId || driverId)}</span>
                {data.userId ? (
                  <>
                    {" "}• User ID: <span className="font-mono">{data.userId}</span>
                  </>
                ) : null}
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

          <DriverDetailActions driverId={driverId} profileStatus={data.profileStatus} />
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start overflow-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="notes">Admin Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Identity & Contact</CardTitle>
                <CardDescription>Core profile details and status summary.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                <p><span className="text-muted-foreground">Name:</span> {fullName}</p>
                <p><span className="text-muted-foreground">Email:</span> {field(data.email)}</p>
                <p><span className="text-muted-foreground">Phone:</span> {field(data.phone)}</p>
                <p><span className="text-muted-foreground">User ID:</span> {field(data.userId)}</p>
                <p><span className="text-muted-foreground">Driver ID:</span> {field(data.driverId)}</p>
                <p><span className="text-muted-foreground">Company:</span> {humanize(data.companyName)}</p>
                <p><span className="text-muted-foreground">Station:</span> {field(data.station)}</p>
                <p><span className="text-muted-foreground">Gender:</span> {field(data.gender)}</p>
                <p><span className="text-muted-foreground">Date of Birth:</span> {formatLocalDate(data.dob)}</p>
                <p><span className="text-muted-foreground">Verified:</span> {data.isVerified ? "Yes" : "No"}</p>
                <p><span className="text-muted-foreground">Background Check:</span> {humanize(data.backgroundCheckStatus)}</p>
                <p><span className="text-muted-foreground">Profile Status:</span> {humanize(data.profileStatus)}</p>
                <p><span className="text-muted-foreground">Created:</span> {formatDateTime(data.createdAt)}</p>
                <p><span className="text-muted-foreground">Updated:</span> {formatDateTime(data.updatedAt)}</p>
                <p><span className="text-muted-foreground">Last Login:</span> {formatDateTime(data.lastLoginAt)}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle>Driver Licenses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.driverLicenses?.length ? (
                  <>
                    {groupedLicenses.visible.length ? groupedLicenses.visible.map((license, idx) => (
                      <LicenseCard key={`license-visible-${idx}`} license={license} index={idx} driverId={driverId} presignedMap={presignedMap} />
                    )) : renderEmpty("No active or pending licenses available")}

                    {groupedLicenses.hidden.length ? (
                      <Collapsible>
                        <CollapsibleTrigger className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                          <ChevronDown className="h-4 w-4" />
                          Show other licenses ({groupedLicenses.hidden.length})
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 space-y-3">
                          {groupedLicenses.hidden.map((license, idx) => (
                            <LicenseCard key={`license-hidden-${idx}`} license={license} index={idx} driverId={driverId} presignedMap={presignedMap} />
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ) : null}
                  </>
                ) : (
                  renderEmpty()
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Work Eligibility Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.workEligibilityDocuments?.length ? (
                  <>
                    {groupedWorkDocs.visible.length ? groupedWorkDocs.visible.map((doc, idx) => (
                      <WorkDocumentCard key={`doc-visible-${idx}`} doc={doc} index={idx} driverId={driverId} presignedMap={presignedMap} />
                    )) : renderEmpty("No active or pending work eligibility documents available")}

                    {groupedWorkDocs.hidden.length ? (
                      <Collapsible>
                        <CollapsibleTrigger className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                          <ChevronDown className="h-4 w-4" />
                          Show other documents ({groupedWorkDocs.hidden.length})
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 space-y-3">
                          {groupedWorkDocs.hidden.map((doc, idx) => (
                            <WorkDocumentCard key={`doc-hidden-${idx}`} doc={doc} index={idx} driverId={driverId} presignedMap={presignedMap} />
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ) : null}
                  </>
                ) : (
                  renderEmpty()
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle>Driver Images</CardTitle>
                <CardDescription>Click any image to preview.</CardDescription>
              </CardHeader>
              <CardContent>
                <DriverImageGallery
                  images={(data.driverImages || [])
                    .filter((item) => Boolean(item.imageUrl))
                    .map((item, idx) => ({
                      key: item.imageUrl as string,
                      url: presignedMap[item.imageUrl as string]?.presignedGetUrl,
                      title: `${humanize(item.imageType)}${item.imageType ? "" : ` #${idx + 1}`}`,
                      subtitle: `Captured: ${formatDateTime(item.timestamp)}`,
                    }))}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Availability</CardTitle>
              </CardHeader>
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
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle>Rating Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {data.ratingSummary ? (
                  <>
                    <div className="grid gap-2 md:grid-cols-2">
                      <p><span className="text-muted-foreground">Average Rating:</span> {field(data.ratingSummary.averageRating)}</p>
                      <p><span className="text-muted-foreground">Total Ratings:</span> {field(data.ratingSummary.totalRatings)}</p>
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
                  </>
                ) : (
                  renderEmpty()
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                {data.analytics ? (
                  <>
                    <p><span className="text-muted-foreground">Total Deliveries:</span> {field(data.analytics.totalDeliveries)}</p>
                    <p><span className="text-muted-foreground">Distance Travelled (km):</span> {field(data.analytics.totalDistanceTravelledKm)}</p>
                    <p><span className="text-muted-foreground">First Order Completed:</span> {formatDateTime(data.analytics.firstOrderCompletedAt)}</p>
                    <p><span className="text-muted-foreground">Last Order Completed:</span> {formatDateTime(data.analytics.lastOrderCompletedAt)}</p>
                  </>
                ) : (
                  <div className="md:col-span-2">{renderEmpty()}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Admin Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{data.adminNotes || "No data available"}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}
