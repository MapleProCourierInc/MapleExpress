"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { AlertCircle, ArrowLeft, Loader2, Lock, MapPin, Pencil, Plus, ShieldCheck } from "lucide-react"

import { BillingAddressDialog, BillingAddressSummary } from "@/components/profile/billing-address"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import type { OrderResponse } from "@/lib/order-service"
import { checkoutPayment, toCheckoutBillingAddress } from "@/lib/payment-service"
import { finalizeMonerisPaymentViaApi, loadMonerisScript, type FinalizePaymentResponse } from "@/lib/moneris/moneris-service"
import { MONERIS_CHECKOUT_MODE } from "@/lib/config"
import { getProfileBillingAddress } from "@/lib/profile-service"
import type { ProfileBillingAddress } from "@/types/profile-billing-address"

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
  onCheckoutActiveChange: (active: boolean) => void
  isProcessing: boolean
}

export function PaymentForm({
  orderData,
  onBack,
  onPaymentComplete,
  onCheckoutActiveChange,
  isProcessing,
}: PaymentFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [isMonerisScriptLoaded, setIsMonerisScriptLoaded] = useState(false)
  const monerisCheckoutRef = useRef<any>(null)
  const [isInitiatingCheckout, setIsInitiatingCheckout] = useState(false)
  const [isFinalizingMoneris, setIsFinalizingMoneris] = useState(false)
  const [isMonerisCheckoutActive, setIsMonerisCheckoutActive] = useState(false)
  const [pendingTicketId, setPendingTicketId] = useState<string | null>(null)
  const [billingAddress, setBillingAddress] = useState<ProfileBillingAddress | null>(null)
  const [isLoadingBillingAddress, setIsLoadingBillingAddress] = useState(true)
  const [billingAddressError, setBillingAddressError] = useState<string | null>(null)
  const [isBillingAddressDialogOpen, setIsBillingAddressDialogOpen] = useState(false)
  const activeTicketIdRef = useRef<string | null>(null)
  const finalizedTicketsRef = useRef<Set<string>>(new Set())

  const currency = orderData.aggregatedPricing.currency || "CAD"

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }


  const resolveFinalizeFailureMessage = (result: FinalizePaymentResponse) => {
    return (
      result.failureReason ||
      result.monerisResponseMessage ||
      result.message ||
      "Payment could not be completed. Please try your payment again."
    )
  }

  const isFinalizeSuccess = (result: FinalizePaymentResponse) => {
    return result.success === true && result.status === "SUCCESSFUL"
  }

  const setCheckoutActive = (active: boolean) => {
    setIsMonerisCheckoutActive(active)
    onCheckoutActiveChange(active)
  }

  const closeMonerisCheckout = (ticketId?: string | null) => {
    const checkoutTicket = ticketId || activeTicketIdRef.current
    activeTicketIdRef.current = null
    if (checkoutTicket && monerisCheckoutRef.current) {
      try {
        monerisCheckoutRef.current.closeCheckout(checkoutTicket)
      } catch (error) {
        console.warn("Moneris checkout was already closed or unavailable.", error)
      }
    }
  }

  const showPaymentError = (title: string, description: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    })
  }

  const loadBillingAddress = useCallback(async () => {
    if (!user?.userId) {
      setIsLoadingBillingAddress(false)
      return
    }

    setIsLoadingBillingAddress(true)
    setBillingAddressError(null)

    try {
      setBillingAddress(await getProfileBillingAddress())
    } catch (error) {
      console.error("Failed to load billing address for checkout:", error)
      setBillingAddressError(error instanceof Error ? error.message : "Failed to load billing address")
    } finally {
      setIsLoadingBillingAddress(false)
    }
  }, [user?.userId])

  const startMonerisCheckout = (ticketId: string) => {
    if (!isMonerisScriptLoaded || !monerisCheckoutRef.current) {
      setPendingTicketId(ticketId)
      return
    }

    activeTicketIdRef.current = ticketId
    setCheckoutActive(true)

    try {
      monerisCheckoutRef.current.startCheckout(ticketId)
      setPendingTicketId(null)
      setTimeout(() => {
        const frame = document.querySelector("#monerisCheckoutDivId iframe") as HTMLIFrameElement | null
        if (frame) frame.style.height = "760px"
      }, 100)
    } catch (error) {
      activeTicketIdRef.current = null
      setCheckoutActive(false)
      throw error
    }
  }


  useEffect(() => {
    loadMonerisScript()
      .then(() => setIsMonerisScriptLoaded(true))
      .catch((error) => {
        console.error("Failed to load Moneris script:", error)
        showPaymentError("Payment gateway unavailable", "The secure payment window could not be loaded. Please try again later.")
      })
  }, [])

  useEffect(() => {
    void loadBillingAddress()
  }, [loadBillingAddress])

  useEffect(() => {
    return () => {
      closeMonerisCheckout()
    }
  }, [])

  useEffect(() => {
    if (!isMonerisScriptLoaded || !window.monerisCheckout || !user) return

    try {
      const mc = new window.monerisCheckout()
      mc.setMode(MONERIS_CHECKOUT_MODE)
      mc.setCheckoutDiv("monerisCheckoutDivId")

      mc.setCallback("page_loaded", () => {
        if (activeTicketIdRef.current) setCheckoutActive(true)
      })

      mc.setCallback("cancel_transaction", (raw: any) => {
        const data = parseMonerisCallback(raw)
        if (data?.ticket) {
          void handleMonerisPaymentFinalize(data.ticket)
          return
        }

        setCheckoutActive(false)
        closeMonerisCheckout()
        toast({
          title: "Payment cancelled",
          description: "No charge was confirmed. You can start the secure checkout again when ready.",
        })
      })

      mc.setCallback("error_event", (raw: any) => {
        const data = parseMonerisCallback(raw)
        if (data?.ticket) {
          void handleMonerisPaymentFinalize(data.ticket)
          return
        }

        setCheckoutActive(false)
        closeMonerisCheckout()
        showPaymentError(
          "Payment could not be completed",
          data?.message ||
            `The payment window returned an error${data?.response_code ? ` (code: ${data.response_code})` : ""}. Please try again.`,
        )
      })

      mc.setCallback("payment_complete", (raw: any) => {
        const data = parseMonerisCallback(raw)
        if (data?.ticket) {
          void handleMonerisPaymentFinalize(data.ticket)
          return
        }

        setCheckoutActive(false)
        closeMonerisCheckout()
        showPaymentError(
          "Payment result unavailable",
          "We could not confirm the result from Moneris. Check your payment status before trying again.",
        )
      })

      monerisCheckoutRef.current = mc
    } catch (e) {
      console.error("Error during Moneris initialization:", e)
      showPaymentError("Payment checkout unavailable", "The secure payment module could not be initialized.")
    }
  }, [isMonerisScriptLoaded, user])

  useEffect(() => {
    if (!pendingTicketId || !isMonerisScriptLoaded || !monerisCheckoutRef.current) {
      return
    }

    try {
      startMonerisCheckout(pendingTicketId)
    } catch (error) {
      console.error("Failed to open Moneris checkout:", error)
      showPaymentError("Unable to open payment", "The secure payment window could not be opened. Please try again.")
    }
  }, [pendingTicketId, isMonerisScriptLoaded])

  const parseMonerisCallback = (raw: any): { ticket?: string; response_code?: string; message?: string } | null => {
    try {
      return typeof raw === "string" ? JSON.parse(raw) : raw
    } catch {
      return null
    }
  }

  const handleMonerisPaymentFinalize = async (ticketId: string) => {
    if (finalizedTicketsRef.current.has(ticketId)) return
    finalizedTicketsRef.current.add(ticketId)
    activeTicketIdRef.current = null
    setCheckoutActive(false)

    if (!user) {
      closeMonerisCheckout(ticketId)
      showPaymentError("Session expired", "Please sign in again before retrying your payment.")
      return
    }

    setIsFinalizingMoneris(true)

    try {
      const finalizeResponse = await finalizeMonerisPaymentViaApi({ ticketId })

      if (isFinalizeSuccess(finalizeResponse)) {
        onPaymentComplete(finalizeResponse.shippingOrderId || orderData.shippingOrderId)
      } else {
        const failureMessage = resolveFinalizeFailureMessage(finalizeResponse)
        if (finalizeResponse.status === "CANCELLED") {
          toast({
            title: "Payment cancelled",
            description: failureMessage,
          })
        } else {
          showPaymentError("Payment unsuccessful", failureMessage)
        }
      }

    } catch (error: any) {
      console.error("Finalize Moneris Payment error:", error)
      showPaymentError(
        "Payment result could not be confirmed",
        `${
          error?.message || "Moneris did not return a final payment result."
        } Check your payment status before trying again. If your card was charged, please contact support.`,
      )
    } finally {
      closeMonerisCheckout(ticketId)
      setIsFinalizingMoneris(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      showPaymentError("Sign-in required", "Please sign in before starting payment.")
      return
    }

    if (!billingAddress) {
      setIsBillingAddressDialogOpen(true)
      toast({
        title: "Billing address required",
        description: "Add a billing address before starting secure payment.",
      })
      return
    }

    setIsInitiatingCheckout(true)

    try {
      const checkoutResponse = await checkoutPayment({
        shippingOrderId: orderData.shippingOrderId,
        amount: orderData.aggregatedPricing.totalAmount,
        currency,
        billingAddress: toCheckoutBillingAddress(billingAddress),
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
      showPaymentError(
        "Unable to start payment",
        error?.message || "The secure checkout could not be started. Please try again.",
      )
    } finally {
      setIsInitiatingCheckout(false)
    }
  }

  const charges = Object.entries(orderData.aggregatedPricing.charges ?? {}).filter(([, amount]) =>
    Number.isFinite(amount),
  )

  const isLoading = isInitiatingCheckout || isFinalizingMoneris || isProcessing

  return (
    <>
      <div className={isMonerisCheckoutActive ? "w-full" : "hidden"} aria-hidden={!isMonerisCheckoutActive}>
        <div
          id="monerisCheckoutDivId"
          className={isMonerisCheckoutActive ? "w-full" : "hidden"}
          style={{ minHeight: "650px", width: "100%" }}
        />
      </div>

      {!isMonerisCheckoutActive ? (
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Payment Details</h1>
            <p className="text-muted-foreground mt-2">Complete your payment to finalize your order</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="ship-now-summary-card">
                <CardHeader className="ship-now-summary-card-header flex flex-col items-start gap-3 space-y-0 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                    Billing Address
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsBillingAddressDialogOpen(true)}
                    disabled={isLoadingBillingAddress}
                  >
                    {billingAddress ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {billingAddress ? "Update" : "Add"}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  {isLoadingBillingAddress ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : billingAddressError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <p>{billingAddressError}</p>
                        <Button className="mt-3" type="button" variant="outline" size="sm" onClick={() => void loadBillingAddress()}>
                          Retry
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : billingAddress ? (
                    <BillingAddressSummary address={billingAddress} />
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm leading-6 text-muted-foreground">
                        Add the billing address associated with your payment method before continuing.
                      </p>
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsBillingAddressDialogOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Add Billing Address
                      </Button>
                    </div>
                  )}
                  <p className="border-t pt-4 text-sm text-muted-foreground">
                    This address is sent securely with checkout and is also used on invoices.
                  </p>
                </CardContent>
              </Card>

              <div className="pt-6 flex flex-col space-y-3">
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  className="w-full bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 py-6"
                  disabled={isLoading || isLoadingBillingAddress}
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
                    <>
                      {billingAddress ? "Proceed to Secure Payment" : "Add Billing Address to Continue"}{" "}
                      {billingAddress ? formatCurrency(orderData.aggregatedPricing.totalAmount) : ""}
                    </>
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
      ) : null}

      <BillingAddressDialog
        open={isBillingAddressDialogOpen}
        onOpenChange={setIsBillingAddressDialogOpen}
        address={billingAddress}
        defaultFullName={orderData.customerContact.name}
        defaultPhoneNumber={orderData.customerContact.phone}
        onSaved={(updatedAddress) => {
          setBillingAddress(updatedAddress)
          setBillingAddressError(null)
        }}
      />
    </>
  )
}
