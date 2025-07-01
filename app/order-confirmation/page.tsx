"use client"

import { Suspense } from 'react';
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/shared/header"
import { Footer } from "@/components/shared/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle2, Package, Home, Send } from "lucide-react"
import Link from "next/link"

function OrderConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const orderId = searchParams.get("orderId")
  const totalAmount = searchParams.get("total")
  const pickupName = searchParams.get("pickup")
  const dropoffName = searchParams.get("dropoff")
  const itemCount = searchParams.get("items")

  const formattedTotal = totalAmount ? parseFloat(totalAmount).toLocaleString("en-CA", { style: "currency", currency: "CAD" }) : ""

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
                  Thank you for your order. Your shipment has been successfully processed.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="space-y-3 text-sm sm:text-base">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-3">Order Summary</h2>
                  {orderId && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Order ID:</span>
                      <span className="font-medium text-gray-800">{orderId}</span>
                    </div>
                  )}
                  {itemCount && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Number of Items:</span>
                      <span className="font-medium text-gray-800">{itemCount}</span>
                    </div>
                  )}
                  {pickupName && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Pickup From:</span>
                      <span className="font-medium text-gray-800 truncate max-w-[60%]">{pickupName}</span>
                    </div>
                  )}
                  {dropoffName && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Deliver To:</span>
                      <span className="font-medium text-gray-800 truncate max-w-[60%]">{dropoffName}</span>
                    </div>
                  )}
                  {formattedTotal && (
                    <div className="flex justify-between items-center pt-2 border-t mt-3">
                      <span className="text-lg font-semibold text-gray-700">Total Paid:</span>
                      <span className="text-lg font-bold text-primary">{formattedTotal}</span>
                    </div>
                  )}
                </div>

                <div className="pt-6 space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:justify-between sm:gap-4">
                  <Button
                    onClick={() => router.push(orderId ? `/dashboard/shipments?trackingId=${orderId}` : "/dashboard")}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Track Order
                  </Button>
                  <Button
                    onClick={() => router.push("/ship-now")}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Ship Another Package
                  </Button>
                  <Button
                    onClick={() => router.push("/dashboard")}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center pt-4">
                  You will receive an email confirmation shortly with your order details. If you have any questions, please contact our support team.
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

// It's good practice to wrap the component that uses useSearchParams
// in a Suspense boundary at the page level if not done by Next.js automatically.
export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading confirmation...</div>}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
