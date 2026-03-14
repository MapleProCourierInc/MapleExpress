"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Loader2, Lock, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import type { OrderResponse } from "@/lib/order-service"
import { buildCheckoutBillingAddress, checkoutPayment } from "@/lib/payment-service"
import { finalizeMonerisPaymentViaApi, loadMonerisScript } from "@/lib/moneris/moneris-service"
import { MONERIS_CHECKOUT_MODE } from "@/lib/config"

// Declare monerisCheckout on the window object for TypeScript
declare global {
  interface Window {
    monerisCheckout?: any
  }
}


interface PaymentFormProps {
  orderData: OrderResponse
  onBack: () => void
  onPaymentComplete: (orderId: string) => void
  isProcessing: boolean
}

export function PaymentForm({ orderData, onBack, onPaymentComplete, isProcessing }: PaymentFormProps) {
  const { user } = useAuth()

  const [isMonerisScriptLoaded, setIsMonerisScriptLoaded] = useState(false)
  const monerisCheckoutRef = useRef<any>(null)
  const [isInitiatingCheckout, setIsInitiatingCheckout] = useState(false)
  const [isFinalizingMoneris, setIsFinalizingMoneris] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isMonerisCheckoutActive, setIsMonerisCheckoutActive] = useState(false)
  const [pendingTicketId, setPendingTicketId] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const startMonerisCheckout = (ticketId: string) => {
    if (!isMonerisScriptLoaded || !monerisCheckoutRef.current) {
      setPendingTicketId(ticketId)
      return
    }

    monerisCheckoutRef.current.startCheckout(ticketId)
    setPendingTicketId(null)
    setTimeout(() => {
      const frame = document.querySelector("#monerisCheckoutDivId iframe") as HTMLIFrameElement | null
      if (frame) frame.style.height = "760px"
    }, 100)
  }


  useEffect(() => {
    loadMonerisScript()
      .then(() => setIsMonerisScriptLoaded(true))
      .catch((error) => {
        console.error("Failed to load Moneris script:", error)
        setPaymentError("Failed to load payment gateway. Please try again later.")
      })
  }, [])

  useEffect(() => {
    if (!isMonerisScriptLoaded || !window.monerisCheckout || !user) return

    try {
      const mc = new window.monerisCheckout()
      mc.setMode(MONERIS_CHECKOUT_MODE)
      mc.setCheckoutDiv("monerisCheckoutDivId")

      mc.setCallback("page_loaded", () => {
        setIsMonerisCheckoutActive(true)
      })

      mc.setCallback("cancel_transaction", () => {
        setPaymentError("Payment was cancelled.")
        setIsMonerisCheckoutActive(false)
      })

      mc.setCallback("error_event", (data: any) => {
        setPaymentError(`Payment error (code: ${data.response_code}). Please try again.`)
        setIsMonerisCheckoutActive(false)
        if (monerisCheckoutRef.current && data?.ticket) {
          monerisCheckoutRef.current.closeCheckout(data.ticket)
        }
      })

      mc.setCallback("payment_complete", (raw: any) => {
        let data: { ticket?: string; response_code?: string }
        try {
          data = typeof raw === "string" ? JSON.parse(raw) : raw
        } catch {
          setPaymentError("We could not read the payment response. Please try again or contact support.")
          return
        }

        if (data?.ticket && data.response_code === "001") {
          void handleMonerisPaymentComplete(data.ticket)
          return
        }

        setPaymentError("Payment failed or returned an unexpected status. Please contact support.")
        setIsMonerisCheckoutActive(false)
        if (monerisCheckoutRef.current && data?.ticket) {
          monerisCheckoutRef.current.closeCheckout(data.ticket)
        }
      })

      monerisCheckoutRef.current = mc
    } catch (e) {
      console.error("Error during Moneris initialization:", e)
      setPaymentError("Failed to initialize payment module.")
    }
  }, [isMonerisScriptLoaded, user])

  useEffect(() => {
    if (!pendingTicketId || !isMonerisScriptLoaded || !monerisCheckoutRef.current) {
      return
    }

    startMonerisCheckout(pendingTicketId)
  }, [pendingTicketId, isMonerisScriptLoaded])

  const handleMonerisPaymentComplete = async (ticketId: string) => {
    if (!user) {
      setPaymentError("User session expired. Please login again.")
      return
    }

    setIsFinalizingMoneris(true)
    setPaymentError(null)

    try {
      await finalizeMonerisPaymentViaApi({ ticketId })
      onPaymentComplete(orderData.shippingOrderId)
      if (monerisCheckoutRef.current) monerisCheckoutRef.current.closeCheckout(ticketId)
      setIsMonerisCheckoutActive(false)
    } catch (error: any) {
      console.error("Finalize Moneris Payment error:", error)
      setPaymentError(error.message || "Failed to finalize payment. Please contact support.")
      if (monerisCheckoutRef.current) monerisCheckoutRef.current.closeCheckout(ticketId)
      setIsMonerisCheckoutActive(false)
    } finally {
      setIsFinalizingMoneris(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setPaymentError("User not authenticated.")
      return
    }

    setIsInitiatingCheckout(true)
    setPaymentError(null)

    try {
      const checkoutResponse = await checkoutPayment({
        shippingOrderId: orderData.shippingOrderId,
        amount: orderData.aggregatedPricing.totalAmount,
        currency: "CAD",
        billingAddress: buildCheckoutBillingAddress(orderData),
        description: `Shipping order checkout for ${orderData.shippingOrderId}`,
      })

      if (checkoutResponse.checkoutFlow === "MONERIS") {
        if (!checkoutResponse.ticketId) {
          throw new Error("Checkout did not return a Moneris ticket.")
        }

        startMonerisCheckout(checkoutResponse.ticketId)
        return
      }

      if (checkoutResponse.checkoutFlow === "POSTPAY_BILLING_ACCOUNT") {
        onPaymentComplete(orderData.shippingOrderId)
        return
      }

      throw new Error("Unsupported checkout flow returned by server.")
    } catch (error: any) {
      console.error("Checkout error:", error)
      setPaymentError(error.message || "Failed to initiate payment. Please try again.")
    } finally {
      setIsInitiatingCheckout(false)
    }
  }

  const subtotal =
    orderData.aggregatedPricing.basePrice +
    orderData.aggregatedPricing.distanceCharge +
    orderData.aggregatedPricing.weightCharge +
    orderData.aggregatedPricing.prioritySurcharge
  const totalTaxes = orderData.aggregatedPricing.taxes?.reduce((sum, tax) => sum + tax.amount, 0) || 0

  const isLoading = isInitiatingCheckout || isFinalizingMoneris || isProcessing

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Payment Details</h1>
        <p className="text-muted-foreground mt-2">Complete your payment to finalize your order</p>
      </div>

      {paymentError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-center">{paymentError}</div>
      )}

      <div className="moneris-checkout-container-wrapper">
        <div
          id="monerisCheckoutDivId"
          className={!isMonerisCheckoutActive ? "hidden" : ""}
          style={{ minHeight: "650px", width: "100%" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-muted/30 pb-3">
              <CardTitle className="text-lg">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Clicking Pay will start secure payment. Accounts with monthly billing will have this order added to their
                invoice.
              </p>
            </CardContent>
          </Card>

          <div className="pt-6 flex flex-col space-y-3">
            <Button
              type="submit"
              onClick={handleSubmit}
              className="w-full bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 py-6"
              disabled={isLoading}
            >
              {isInitiatingCheckout ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Starting Checkout...
                </>
              ) : isFinalizingMoneris ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Finalizing Payment...
                </>
              ) : (
                <>Proceed to Secure Payment {formatCurrency(orderData.aggregatedPricing.totalAmount)}</>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Order Summary
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-muted/30 pb-3">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Taxes</span>
                  <span className="font-medium">{formatCurrency(totalTaxes)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(orderData.aggregatedPricing.totalAmount)}</span>
                </div>
                <div className="pt-4 text-sm text-muted-foreground flex items-center bg-muted/10 p-3 rounded-md mt-6">
                  <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                  <span>Your payment information is secure.</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="bg-muted/10 p-4 rounded-md space-y-3">
            <div className="flex items-center text-sm">
              <Lock className="h-4 w-4 mr-2 text-primary" />
              <span className="font-medium">Secure Payment Processing by Moneris</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
