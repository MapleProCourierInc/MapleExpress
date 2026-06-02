"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Loader2, Lock, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import type { OrderResponse } from "@/lib/order-service"
import { buildCheckoutBillingAddress, checkoutPayment } from "@/lib/payment-service"
import { finalizeMonerisPaymentViaApi, loadMonerisScript, type FinalizePaymentResponse } from "@/lib/moneris/moneris-service"
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
  const router = useRouter()

  const [isMonerisScriptLoaded, setIsMonerisScriptLoaded] = useState(false)
  const monerisCheckoutRef = useRef<any>(null)
  const [isInitiatingCheckout, setIsInitiatingCheckout] = useState(false)
  const [isFinalizingMoneris, setIsFinalizingMoneris] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isMonerisCheckoutActive, setIsMonerisCheckoutActive] = useState(false)
  const [pendingTicketId, setPendingTicketId] = useState<string | null>(null)

  const currency = orderData.aggregatedPricing.currency || "CAD"

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }


  const getRetryRoute = (result?: FinalizePaymentResponse, fallbackOrderId?: string) => {
    const shippingOrderId = result?.shippingOrderId || fallbackOrderId || orderData.shippingOrderId
    return shippingOrderId ? `/ship-now?shippingOrderId=${encodeURIComponent(shippingOrderId)}` : "/ship-now"
  }

  const resolveFinalizeFailureMessage = (result: FinalizePaymentResponse) => {
    return (
      result.message ||
      result.failureReason ||
      result.monerisResponseMessage ||
      "Payment could not be completed. Please try your payment again."
    )
  }

  const isFinalizeSuccess = (result: FinalizePaymentResponse) => {
    return result.success === true && result.status === "SUCCESSFUL"
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

      mc.setCallback("cancel_transaction", (raw: any) => {
        const data = parseMonerisCallback(raw)
        if (data?.ticket) {
          void handleMonerisPaymentFinalize(data.ticket)
          return
        }

        setPaymentError("Payment was cancelled before we could confirm a payment ticket. Please try again.")
        setIsMonerisCheckoutActive(false)
      })

      mc.setCallback("error_event", (raw: any) => {
        const data = parseMonerisCallback(raw)
        if (data?.ticket) {
          void handleMonerisPaymentFinalize(data.ticket)
          return
        }

        setPaymentError(
          `Payment could not be completed${data?.response_code ? ` (code: ${data.response_code})` : ""}. Please try again.`,
        )
        setIsMonerisCheckoutActive(false)
      })

      mc.setCallback("payment_complete", (raw: any) => {
        const data = parseMonerisCallback(raw)
        if (data?.ticket) {
          void handleMonerisPaymentFinalize(data.ticket)
          return
        }

        setPaymentError("We could not confirm your payment result. Please try your payment again.")
        setIsMonerisCheckoutActive(false)
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

  const parseMonerisCallback = (raw: any): { ticket?: string; response_code?: string } | null => {
    try {
      return typeof raw === "string" ? JSON.parse(raw) : raw
    } catch {
      return null
    }
  }

  const handleMonerisPaymentFinalize = async (ticketId: string) => {
    if (!user) {
      setPaymentError("User session expired. Please login again.")
      return
    }

    setIsFinalizingMoneris(true)
    setPaymentError(null)

    try {
      const finalizeResponse = await finalizeMonerisPaymentViaApi({ ticketId })

      if (isFinalizeSuccess(finalizeResponse)) {
        onPaymentComplete(finalizeResponse.shippingOrderId || orderData.shippingOrderId)
      } else {
        const failureMessage = resolveFinalizeFailureMessage(finalizeResponse)
        setPaymentError(failureMessage)
        router.push(getRetryRoute(finalizeResponse, orderData.shippingOrderId))
      }

      if (monerisCheckoutRef.current) monerisCheckoutRef.current.closeCheckout(ticketId)
      setIsMonerisCheckoutActive(false)
    } catch (error: any) {
      console.error("Finalize Moneris Payment error:", error)
      setPaymentError(
        error.message ||
          "We could not confirm your payment result. Please try your payment again. If money was deducted, contact support.",
      )
      router.push(getRetryRoute(undefined, orderData.shippingOrderId))
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
        currency,
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

  const charges = Object.entries(orderData.aggregatedPricing.charges ?? {}).filter(([, amount]) =>
    Number.isFinite(amount),
  )

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

      <div className={`moneris-checkout-container-wrapper ${!isMonerisCheckoutActive ? "hidden" : ""}`}>
        <div
          id="monerisCheckoutDivId"
          className={!isMonerisCheckoutActive ? "hidden" : ""}
          style={{ minHeight: "650px", width: "100%" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="ship-now-summary-card">
            <CardHeader className="ship-now-summary-card-header pb-3">
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
          <Card className="ship-now-summary-card">
            <CardHeader className="ship-now-summary-card-header pb-3">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-4">
                {charges.map(([name, amount]) => (
                  <div key={name} className="flex justify-between items-center gap-3">
                    <span className="text-sm">
                      {name
                        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
                        .replace(/[_-]+/g, " ")
                        .replace(/\b\w/g, (character) => character.toUpperCase())}
                    </span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(orderData.aggregatedPricing.totalAmount)}</span>
                </div>
                <div className="ship-now-summary-detail-cell pt-4 text-sm text-muted-foreground flex items-center p-3 rounded-md mt-6">
                  <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                  <span>Your payment information is secure.</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="ship-now-flow-note p-4 rounded-md space-y-3">
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
