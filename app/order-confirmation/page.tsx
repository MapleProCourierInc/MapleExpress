"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/shared/header"
import { Footer } from "@/components/shared/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle2, Clock3, Home, Mail, PackageCheck, Send } from "lucide-react"

function formatPickupWindow(startDateTime: string, endDateTime: string) {
  const pickupStart = new Date(startDateTime)
  const pickupEnd = new Date(endDateTime)
  if (Number.isNaN(pickupStart.getTime()) || Number.isNaN(pickupEnd.getTime())) return null

  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Halifax",
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  const timeFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Halifax",
    hour: "numeric",
    minute: "2-digit",
  })

  if (dateFormatter.format(pickupStart) === dateFormatter.format(pickupEnd)) {
    return `${dateFormatter.format(pickupStart)}, ${timeFormatter.format(pickupStart)} – ${timeFormatter.format(pickupEnd)}`
  }

  return `${dateFormatter.format(pickupStart)} at ${timeFormatter.format(pickupStart)} – ${dateFormatter.format(
    pickupEnd,
  )} at ${timeFormatter.format(pickupEnd)}`
}

function formatEstimatedPickupWindow(createdAt: string) {
  const createdDate = new Date(createdAt)
  if (Number.isNaN(createdDate.getTime())) return null

  return formatPickupWindow(
    new Date(createdDate.getTime() + 30 * 60 * 1000).toISOString(),
    new Date(createdDate.getTime() + 90 * 60 * 1000).toISOString(),
  )
}

function OrderConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const orderId = searchParams.get("orderId")
  const totalAmount = searchParams.get("total")
  const itemCount = searchParams.get("items")
  const createdAt = searchParams.get("createdAt")
  const pickupWindowStartDateTime = searchParams.get("pickupWindowStartDateTime")
  const pickupWindowEndDateTime = searchParams.get("pickupWindowEndDateTime")
  const selectedPickupWindow =
    pickupWindowStartDateTime && pickupWindowEndDateTime
      ? formatPickupWindow(pickupWindowStartDateTime, pickupWindowEndDateTime)
      : null
  const estimatedPickupWindow = !selectedPickupWindow && createdAt ? formatEstimatedPickupWindow(createdAt) : null

  const parsedTotal = totalAmount ? Number.parseFloat(totalAmount) : Number.NaN
  const formattedTotal = Number.isFinite(parsedTotal)
    ? parsedTotal.toLocaleString("en-CA", { style: "currency", currency: "CAD" })
    : ""

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-12 sm:py-16 md:py-24 bg-muted/20">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-xl">
              <CardHeader className="bg-background p-6 sm:p-8 text-center">
                <div className="mx-auto bg-green-100 rounded-full p-3 w-fit mb-4">
                  <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-800">Order Confirmed!</CardTitle>
                <CardDescription className="text-md sm:text-lg text-muted-foreground mt-2">
                  Your shipment is booked and our dispatch team is preparing the pickup.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="space-y-3 text-sm sm:text-base">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-3">Order Summary</h2>
                  {orderId && (
                    <div className="flex min-w-0 items-start justify-between gap-4">
                      <span className="shrink-0 text-muted-foreground">Order ID:</span>
                      <span className="min-w-0 break-all text-right font-medium text-gray-800">{orderId}</span>
                    </div>
                  )}
                  {itemCount && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Number of Packages:</span>
                      <span className="font-medium text-gray-800">{itemCount}</span>
                    </div>
                  )}
                  {formattedTotal && (
                    <div className="flex justify-between items-center pt-2 border-t mt-3">
                      <span className="text-lg font-semibold text-gray-700">Order Total:</span>
                      <span className="text-lg font-bold text-primary">{formattedTotal}</span>
                    </div>
                  )}
                </div>

                <div className="border-y bg-muted/30 py-5">
                  <div className="flex items-start gap-3">
                    <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <h2 className="font-semibold text-gray-800">
                        {selectedPickupWindow ? "Your selected pickup window" : "Estimated pickup window"}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {selectedPickupWindow
                          ? `We’ll pick up your shipment during your selected window: ${selectedPickupWindow} Atlantic time.`
                          : estimatedPickupWindow
                            ? `Your driver may arrive between ${estimatedPickupWindow}.`
                            : "We are scheduling your pickup and will confirm the timing by email."}{" "}
                        Please have every package securely packed and labelled before the pickup window begins.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h2 className="font-semibold text-gray-800">Shipping labels are on the way</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      We will email your shipping labels and packing instructions shortly. Print and attach the correct
                      label to each package before pickup.
                    </p>
                  </div>
                </div>

                <div className="pt-6 space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:justify-between sm:gap-4">
                  <Button
                    onClick={() => router.push("/ship-now")}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Ship Another Package
                  </Button>
                  <Button
                    onClick={() => router.push("/dashboard?section=shipments")}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Go to Shipments
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center pt-4">
                  <PackageCheck className="mr-1 inline h-3.5 w-3.5" />
                  You can monitor every package from Shipments in your dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading confirmation...</div>}>
      <OrderConfirmationContent />
    </Suspense>
  )
}
