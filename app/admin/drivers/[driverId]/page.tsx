import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DriverDetailActions } from "@/components/admin/driver-detail-actions"
import { DriverImageGallery } from "@/components/admin/driver-image-gallery"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getAdminDriverDetails } from "@/lib/admin-drivers-service"

function formatDate(value?: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

function statusLabel(status?: string) {
  switch (status) {
    case "PENDING_ADMIN_VERIFICATION":
      return "Pending Verification"
    case "DRIVER_LICENSE_MISSING":
      return "License Missing"
    case "PROOF_OF_WORK_ELIGIBILITY_MISSING":
      return "Work Docs Missing"
    case "BACKGROUND_CHECK_MISSING":
      return "BG Check Missing"
    case "PENDING_PROFILE_COMPLETION":
      return "Profile Pending"
    default:
      return status || "Unknown"
  }
}

export default async function DriverDetailPage({ params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = await params
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

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Link href="/admin/drivers" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Drivers
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{fullName}</h1>
              <p className="text-sm text-muted-foreground">{data.email || "—"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge>{statusLabel(data.profileStatus)}</Badge>
                </TooltipTrigger>
                <TooltipContent>{data.profileStatus}</TooltipContent>
              </Tooltip>
              <Badge variant={data.isVerified ? "default" : "secondary"}>{data.isVerified ? "Verified" : "Not Verified"}</Badge>
              {data.backgroundCheckStatus ? <Badge variant="outline">BG: {data.backgroundCheckStatus}</Badge> : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Updated: {formatDate(data.updatedAt)} • Last login: {formatDate(data.lastLoginAt)}
            </p>
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
              </CardHeader>
              <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                <p><span className="text-muted-foreground">Phone:</span> {data.phone || "—"}</p>
                <p><span className="text-muted-foreground">Gender:</span> {data.gender || "—"}</p>
                <p><span className="text-muted-foreground">Date of Birth:</span> {data.dob || "—"}</p>
                <p><span className="text-muted-foreground">Station:</span> {data.station || "—"}</p>
                <p><span className="text-muted-foreground">Company:</span> {data.companyName || "—"}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle>Driver Licenses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.licenses?.length ? data.licenses.map((license, idx) => (
                  <div key={idx} className="rounded-md border p-3 text-sm">
                    <p><span className="text-muted-foreground">Number:</span> {license.licenseNumber || "—"}</p>
                    <p><span className="text-muted-foreground">Class:</span> {license.licenseClass || "—"}</p>
                    <p><span className="text-muted-foreground">Expires:</span> {license.expiresAt || "—"}</p>
                    <p><span className="text-muted-foreground">Status:</span> {license.verificationStatus || "—"}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {license.frontImageUrl ? <a className="text-xs underline" href={license.frontImageUrl} target="_blank">Front image</a> : null}
                      {license.backImageUrl ? <a className="text-xs underline" href={license.backImageUrl} target="_blank">Back image</a> : null}
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No licenses available.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Work Eligibility Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.workEligibilityDocuments?.length ? data.workEligibilityDocuments.map((doc, idx) => (
                  <div key={idx} className="rounded-md border p-3 text-sm">
                    <p><span className="text-muted-foreground">Type:</span> {doc.documentType || "—"}</p>
                    <p><span className="text-muted-foreground">Number:</span> {doc.documentNumber || "—"}</p>
                    <p><span className="text-muted-foreground">Status:</span> {doc.verificationStatus || "—"}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {doc.imageUrls?.map((url, imageIdx) => (
                        <a key={`${url}-${imageIdx}`} className="text-xs underline" href={url} target="_blank">Document image {imageIdx + 1}</a>
                      ))}
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No work eligibility documents available.</p>}
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
                <DriverImageGallery images={data.driverImages || []} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Availability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {data.weeklyAvailability ? Object.entries(data.weeklyAvailability).map(([day, slots]) => (
                  <div key={day} className="rounded-md border p-2">
                    <p className="font-medium capitalize">{day}</p>
                    <p className="text-muted-foreground">
                      {slots?.length ? slots.map((slot) => `${slot.start || "--"} - ${slot.end || "--"}`).join(", ") : "Not available"}
                    </p>
                  </div>
                )) : <p className="text-muted-foreground">No availability data.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle>Rating Summary</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                <p><span className="text-muted-foreground">Average Rating:</span> {data.ratingSummary?.averageRating ?? "—"}</p>
                <p><span className="text-muted-foreground">Total Ratings:</span> {data.ratingSummary?.totalRatings ?? "—"}</p>
                <p><span className="text-muted-foreground">On Time Score:</span> {data.ratingSummary?.onTimeScore ?? "—"}</p>
                <p><span className="text-muted-foreground">Safety Score:</span> {data.ratingSummary?.safetyScore ?? "—"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {data.analytics ? Object.entries(data.analytics).map(([k, v]) => (
                  <p key={k}><span className="text-muted-foreground">{k}:</span> {String(v ?? "—")}</p>
                )) : <p className="text-muted-foreground">No analytics data.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Admin Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{data.adminNotes || "No admin notes available."}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}
