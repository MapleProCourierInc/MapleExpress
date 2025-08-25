"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Loader2, Lock, ShieldCheck, MapPin, Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getAddresses, createAddress } from "@/lib/address-service"
import { convertToBillingAddress } from "@/lib/payment-service" 
import type { OrderResponse } from "@/lib/order-service"
import type { Address } from "@/components/ship-now/ship-now-form"
import { AddressForm } from "@/components/ship-now/address-form"
import {
    loadMonerisScript,
    initiateMonerisPayment,
    finalizeMonerisPayment,
} from "../../lib/moneris/moneris-service"

// Declare monerisCheckout on the window object for TypeScript
declare global {
    interface Window {
        monerisCheckout: any; 
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
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true)
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
    const [useSameAsPickup, setUseSameAsPickup] = useState(false)
    const [showNewAddressForm, setShowNewAddressForm] = useState(false)
    const [billingAddress, setBillingAddress] = useState<Address | null>(null)
    const [showAddressList, setShowAddressList] = useState(true)

    const [isMonerisScriptLoaded, setIsMonerisScriptLoaded] = useState(false)
    const monerisCheckoutRef = useRef<any>(null) 
    const [isInitiatingMoneris, setIsInitiatingMoneris] = useState(false)
    const [isFinalizingMoneris, setIsFinalizingMoneris] = useState(false)
    const [monerisError, setMonerisError] = useState<string | null>(null)
    const [isMonerisCheckoutActive, setIsMonerisCheckoutActive] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-CA", {
            style: "currency",
            currency: "CAD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount)
    }

    useEffect(() => {
        loadMonerisScript()
            .then(() => setIsMonerisScriptLoaded(true))
            .catch((error) => {
                console.error("Failed to load Moneris script:", error)
                setMonerisError("Failed to load payment gateway. Please try again later.")
            })
    }, [])

    useEffect(() => {
        if (isMonerisScriptLoaded && window.monerisCheckout && user) {
            try {
                const mc = new window.monerisCheckout();
                mc.setMode("prod"); // Or "prod" based on environment
                mc.setCheckoutDiv("monerisCheckoutDivId");

                mc.setCallback("page_loaded", (data: any) => {
                    console.log("Moneris page_loaded:", data); 
                    setIsMonerisCheckoutActive(true);

                    // Attempt to dynamically set height
                    try {
                        const iframeElement = document.getElementById('monerisCheckoutDivId-Frame') as HTMLIFrameElement | null;
                        if (iframeElement) {
                            iframeElement.onload = () => {
                                try {
                                    const monerisDiv = document.getElementById('monerisCheckoutDivId');
                                    if (monerisDiv && iframeElement.contentWindow) {
                                        // Due to cross-origin policy, accessing scrollHeight directly might be blocked.
                                        // This is an attempt; actual height might need to be communicated by Moneris via postMessage or a callback.
                                        const scrollHeight = iframeElement.contentWindow.document.body.scrollHeight;
                                        if (scrollHeight > 0) {
                                            // Set a minimum based on content, but ensure it's not too small either
                                            const newMinHeight = Math.max(scrollHeight, 400); // Example: min of 400px
                                            monerisDiv.style.minHeight = newMinHeight + 'px';
                                            console.log(`Attempted to set Moneris div minHeight to: ${newMinHeight}px`);
                                        }
                                    }
                                } catch (e) {
                                    console.warn("Could not dynamically adjust Moneris iframe height due to cross-origin restrictions or other error:", e);
                                }
                            };
                        } else {
                            console.warn("Moneris iframe element 'monerisCheckoutDivId-Frame' not found for dynamic height adjustment.");
                        }
                    } catch (e) {
                        console.error("Error setting up dynamic height adjustment for Moneris:", e);
                    }
                });
                mc.setCallback("cancel_transaction", (data: any) => {
                    console.log("Moneris cancel_transaction:", data);
                    setMonerisError("Payment was cancelled.");
                    setIsMonerisCheckoutActive(false);
                    if (monerisCheckoutRef.current && data && data.ticket) monerisCheckoutRef.current.closeCheckout(data.ticket);
                });
                mc.setCallback("error_event", (data: any) => {
                    console.error("Moneris error_event:", data);
                    setMonerisError(`Payment error (code: ${data.response_code}). Please try again.`);
                    setIsMonerisCheckoutActive(false);
                    if (monerisCheckoutRef.current && data && data.ticket) monerisCheckoutRef.current.closeCheckout(data.ticket);
                });
                mc.setCallback("payment_complete", (raw: any) => {
                    // 1. Always log the raw payload first (handy for support)
                    console.log("Moneris payment_complete (raw):", raw);

                    // 2. Convert to object only if it’s a string
                    let data: { ticket?: string; response_code?: string };
                    try {
                        data = typeof raw === "string" ? JSON.parse(raw) : raw;
                    } catch (e) {
                        console.error("Moneris payment_complete – invalid JSON", e, raw);
                        setMonerisError(
                            "We could not read the payment response. Please try again or contact support."
                        );
                        return;
                    }

                    // 3. Happy-path: success code 001
                    if (data?.ticket && data.response_code === "001") {
                        handleMonerisPaymentComplete(data.ticket);
                    } else {
                        console.error(
                            "Moneris payment_complete – error or unexpected response:",
                            data
                        );
                        setMonerisError(
                            "Payment failed or returned an unexpected status. Please contact support."
                        );
                        setIsMonerisCheckoutActive(false);
                        if (monerisCheckoutRef.current && data?.ticket) {
                            monerisCheckoutRef.current.closeCheckout(data.ticket);
                        }
                    }
                });
                
                monerisCheckoutRef.current = mc;
            } catch (e) {
                console.error("Error during Moneris initialization:", e);
                setMonerisError("Failed to initialize payment module.");
            }
        }
    }, [isMonerisScriptLoaded, user]);

    const handleMonerisPaymentComplete = async (ticketId: string) => {
        if (!user) {
            setMonerisError("User session expired. Please login again.");
            return;
        }
        setIsFinalizingMoneris(true);
        setMonerisError(null);
        const accessToken = localStorage.getItem("maplexpress_access_token"); 
        if (!accessToken) {
            setMonerisError("Authentication token not found. Please log in again.");
            setIsFinalizingMoneris(false);
            return;
        }

        try {
            await finalizeMonerisPayment({ ticketId }, accessToken);
            onPaymentComplete(orderData.shippingOrderId);
            if (monerisCheckoutRef.current) monerisCheckoutRef.current.closeCheckout(ticketId);
            setIsMonerisCheckoutActive(false);
        } catch (error: any) {
            console.error("Finalize Moneris Payment error:", error);
            setMonerisError(error.message || "Failed to finalize payment. Please contact support.");
            if (monerisCheckoutRef.current) monerisCheckoutRef.current.closeCheckout(ticketId);
            setIsMonerisCheckoutActive(false);
        } finally {
            setIsFinalizingMoneris(false);
        }
    };

    useEffect(() => {
        const fetchAddresses = async () => {
            if (!user) return;
            try {
                setIsLoadingAddresses(true);
                const addresses = await getAddresses(user.userId, user.userType);
                setSavedAddresses(addresses);
            } catch (err) {
                console.error("Error fetching addresses:", err);
            } finally {
                setIsLoadingAddresses(false);
            }
        };
        fetchAddresses();
    }, [user]);

    useEffect(() => {
        if (useSameAsPickup && orderData.orderItems.length > 0) {
            const pickupAddressData = orderData.orderItems[0].pickup.address;
            const pickupAddressObj: Address = { 
                id: "pickup-address-synced", 
                fullName: pickupAddressData.fullName,
                company: pickupAddressData.company || "",
                streetAddress: pickupAddressData.streetAddress,
                addressLine2: pickupAddressData.addressLine2 || "",
                city: pickupAddressData.city,
                province: pickupAddressData.province,
                postalCode: pickupAddressData.postalCode,
                country: pickupAddressData.country,
                phoneNumber: pickupAddressData.phoneNumber,
                deliveryInstructions: pickupAddressData.deliveryInstructions || "",
                addressType: "billing",
                isPrimary: false, 
            };
            setBillingAddress(pickupAddressObj);
            setSelectedAddressId(null);
            setShowNewAddressForm(false);
            setShowAddressList(false);
        } else if (!useSameAsPickup && selectedAddressId) {
            const selected = savedAddresses.find(addr => addr.id === selectedAddressId || addr.addressId === selectedAddressId);
            if (selected) {
                const formatted: Address = { 
                    id: selected.id || selected.addressId!,
                    fullName: selected.fullName,
                    company: selected.company || "",
                    streetAddress: selected.streetAddress,
                    addressLine2: selected.addressLine2 || "",
                    city: selected.city,
                    province: selected.province,
                    postalCode: selected.postalCode,
                    country: selected.country,
                    phoneNumber: selected.phoneNumber,
                    deliveryInstructions: selected.deliveryInstructions || "",
                    addressType: "billing",
                    isPrimary: selected.isPrimary || false,
                    coordinates: selected.coordinates,
                };
                setBillingAddress(formatted); 
            }
            setShowAddressList(false); 
        } else if (!useSameAsPickup && !selectedAddressId && !showNewAddressForm) {
            if (billingAddress === null) {
                 setShowAddressList(true);
            }
        }
    }, [useSameAsPickup, selectedAddressId, savedAddresses, orderData.orderItems, showNewAddressForm]);

    const handleAddressSelect = (addressId: string) => {
        setSelectedAddressId(addressId);
        setUseSameAsPickup(false);
        setShowNewAddressForm(false);
        const selected = savedAddresses.find(addr => addr.id === addressId || addr.addressId === addressId);
         if (selected) {
            const formatted: Address = {
                id: selected.id || selected.addressId,
                fullName: selected.fullName,
                company: selected.company || "",
                streetAddress: selected.streetAddress,
                addressLine2: selected.addressLine2 || "",
                city: selected.city,
                province: selected.province,
                postalCode: selected.postalCode,
                country: selected.country,
                phoneNumber: selected.phoneNumber,
                deliveryInstructions: selected.deliveryInstructions || "",
                addressType: "billing",
                isPrimary: selected.isPrimary || false,
                coordinates: selected.coordinates,
            };
            setBillingAddress(formatted);
            setShowAddressList(false); 
        }
    };

    const handleNewAddressClick = () => {
        setSelectedAddressId(null);
        setUseSameAsPickup(false);
        setShowNewAddressForm(true);
        setShowAddressList(false);
    };

    const handleAddressSubmit = async (newAddress: Address, saveForFuture: boolean) => {
        const addressWithId = { ...newAddress, id: `new-${Date.now()}`, addressType: "billing" as "billing" };
        setBillingAddress(addressWithId);
        setUseSameAsPickup(false); 
        setShowNewAddressForm(false);
        setShowAddressList(false);

        if (saveForFuture && user) {
            try {
                const { id, ...addressDataToSave } = addressWithId; 
                await createAddress(user.userId, {
                    ...addressDataToSave,
                     addressType: "billing",
                }, user.userType);
                const addresses = await getAddresses(user.userId, user.userType);
                setSavedAddresses(addresses);
            } catch (err) {
                console.error("Error saving billing address:", err);
            }
        }
    };
    
    const handleChangeAddress = () => {
        setBillingAddress(null);
        setSelectedAddressId(null);
        setUseSameAsPickup(false); 
        setShowAddressList(true);
        setShowNewAddressForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !billingAddress || !monerisCheckoutRef.current || !isMonerisScriptLoaded) {
            let errorMsg = "Payment system is not ready.";
            if (!user) errorMsg = "User not authenticated.";
            else if (!billingAddress) errorMsg = "Billing address is required.";
            else if (!isMonerisScriptLoaded) errorMsg = "Payment script not loaded.";
            else if (!monerisCheckoutRef.current) errorMsg = "Payment module not initialized.";
            setMonerisError(errorMsg);
            console.error("Pre-payment check failed:", errorMsg);
            return;
        }

        setIsInitiatingMoneris(true);
        setMonerisError(null);
        const accessToken = localStorage.getItem("maplexpress_access_token"); 
        if (!accessToken) {
            setMonerisError("Authentication token not found. Please log in again.");
            setIsInitiatingMoneris(false);
            return;
        }

        try {
            const paymentData = {
                userId: user.userId,
                shippingOrderId: orderData.shippingOrderId,
                amount: orderData.aggregatedPricing.totalAmount,
                billingAddress: convertToBillingAddress(billingAddress), 
            };
            const { ticketId } = await initiateMonerisPayment(paymentData, accessToken);
            monerisCheckoutRef.current.startCheckout(ticketId);
            setTimeout(() => {
                const frame = document.querySelector(
                    "#monerisCheckoutDivId iframe"
                ) as HTMLIFrameElement | null;
                if (frame) frame.style.height = "760px";   // 700–800px is safe
            }, 100);
        } catch (error: any) {
            console.error("Initiate Moneris Payment error:", error);
            setMonerisError(error.message || "Failed to initiate payment. Please try again.");
        } finally {
            setIsInitiatingMoneris(false);
        }
    };
    
    const subtotal = orderData.aggregatedPricing.basePrice +
        orderData.aggregatedPricing.distanceCharge +
        orderData.aggregatedPricing.weightCharge +
        orderData.aggregatedPricing.prioritySurcharge;
    const totalTaxes = orderData.aggregatedPricing.taxes?.reduce((sum, tax) => sum + tax.amount, 0) || 0;

    const isLoading = isInitiatingMoneris || isFinalizingMoneris || isProcessing || isLoadingAddresses;

    return (
        <div className="space-y-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold">Payment Details</h1>
                <p className="text-muted-foreground mt-2">Complete your payment to finalize your order</p>
            </div>

            {monerisError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-center">
                    {monerisError}
                </div>
            )}
            
            <div className="moneris-checkout-container-wrapper">
              <div 
                id="monerisCheckoutDivId" 
                className={!isMonerisCheckoutActive ? "hidden" : ""} 
                style={{ 
                  minHeight: '650px',
                  width: '100%'
                }}
              ></div>
            </div>

            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${isMonerisCheckoutActive ? "hidden" : ""}`}>
                <div className="lg:col-span-2">
                    <Card className="border-0 shadow-md">
                        <CardHeader className="bg-muted/30 pb-3">
                            <CardTitle className="text-lg flex items-center">
                                <MapPin className="mr-2 h-5 w-5 text-primary" />
                                Billing Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="space-y-6">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="same-as-pickup"
                                        checked={useSameAsPickup}
                                        onCheckedChange={(newCheckedState) => {
                                            setUseSameAsPickup(newCheckedState);
                                            if (!newCheckedState) {
                                                if (billingAddress && billingAddress.id === "pickup-address-synced") {
                                                    setBillingAddress(null);
                                                }
                                            }
                                        }}
                                        disabled={isLoading}
                                    />
                                    <Label htmlFor="same-as-pickup">Same as pickup address</Label>
                                </div>

                                {!useSameAsPickup && showAddressList && !showNewAddressForm && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={handleNewAddressClick}
                                            className="w-full flex items-center justify-center gap-2 py-6 mb-6"
                                            disabled={isLoading}
                                        >
                                            <Plus className="h-5 w-5 text-primary" />
                                            <span>Add a new address</span>
                                        </Button>
                                        {savedAddresses.length > 0 && (
                                            <>
                                              <div className="relative my-6">
                                                  <div className="absolute inset-0 flex items-center">
                                                      <div className="w-full border-t border-gray-300"></div>
                                                  </div>
                                                  <div className="relative flex justify-center">
                                                      <span className="bg-background px-4 text-sm text-muted-foreground">or select a saved address</span>
                                                  </div>
                                              </div>
                                                {isLoadingAddresses ? (
                                                    <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                                                ) : (
                                                    <RadioGroup value={selectedAddressId || ""} onValueChange={handleAddressSelect} className="space-y-3">
                                                        {savedAddresses.map((address) => {
                                                            const addressIdVal = address.id || address.addressId;
                                                            return (
                                                                <div key={addressIdVal} className="flex items-start space-x-3">
                                                                    <RadioGroupItem value={addressIdVal!} id={`address-${addressIdVal}`} className="mt-1" />
                                                                    <div className="flex-1">
                                                                        <Label htmlFor={`address-${addressIdVal}`} className="flex items-start cursor-pointer">
                                                                            <Card className="w-full">
                                                                                <CardContent className="p-4">
                                                                                    <p className="font-medium">{address.fullName}</p>
                                                                                    {address.company && <p className="text-muted-foreground text-sm">{address.company}</p>}
                                                                                    <p className="mt-1">{address.streetAddress}{address.addressLine2 && `, ${address.addressLine2}`}</p>
                                                                                    <p>{address.city}, {address.province} {address.postalCode}</p>
                                                                                    <p>{address.country}</p>
                                                                                    <p className="mt-1">{address.phoneNumber}</p>
                                                                                </CardContent>
                                                                            </Card>
                                                                        </Label>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </RadioGroup>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}

                                {!useSameAsPickup && showNewAddressForm && (
                                    <div className="mt-6">
                                        <AddressForm onSubmit={handleAddressSubmit} addressType="billing" initialAddress={null} />
                                        <div className="mt-4">
                                            <Button variant="outline" onClick={() => { setShowNewAddressForm(false); setShowAddressList(true); }} disabled={isLoading}>Cancel</Button>
                                        </div>
                                    </div>
                                )}

                                {billingAddress && !showAddressList && !showNewAddressForm && ( 
                                    <Card className="mt-4">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{billingAddress.fullName}</p>
                                                    {billingAddress.company && <p className="text-muted-foreground text-sm">{billingAddress.company}</p>}
                                                    <p className="mt-1">{billingAddress.streetAddress}{billingAddress.addressLine2 && `, ${billingAddress.addressLine2}`}</p>
                                                    <p>{billingAddress.city}, {billingAddress.province} {billingAddress.postalCode}</p>
                                                    <p>{billingAddress.country}</p>
                                                    <p className="mt-1">{billingAddress.phoneNumber}</p>
                                                </div>
                                                {!useSameAsPickup && <Button variant="ghost" size="sm" onClick={handleChangeAddress} disabled={isLoading}>Change</Button>}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="pt-6 flex flex-col space-y-3">
                        <Button
                            type="submit"
                            onClick={handleSubmit}
                            className="w-full bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 py-6"
                            disabled={isLoading || !billingAddress || !isMonerisScriptLoaded || !monerisCheckoutRef.current}
                        >
                            {isInitiatingMoneris ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Initiating Secure Payment...</>
                            ) : isFinalizingMoneris ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Finalizing Payment...</>
                            ) : (
                                <>Proceed to Secure Payment {formatCurrency(orderData.aggregatedPricing.totalAmount)}</>
                            )}
                        </Button>
                        <Button type="button" variant="outline" onClick={onBack} className="w-full flex items-center justify-center gap-2" disabled={isLoading}>
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
                                <div className="flex justify-between items-center"><span className="text-sm">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
                                <div className="flex justify-between items-center"><span className="text-sm">Taxes</span><span className="font-medium">{formatCurrency(totalTaxes)}</span></div>
                                <Separator className="my-2" />
                                <div className="flex justify-between items-center font-bold text-lg"><span>Total</span><span className="text-primary">{formatCurrency(orderData.aggregatedPricing.totalAmount)}</span></div>
                                <div className="pt-4 text-sm text-muted-foreground flex items-center bg-muted/10 p-3 rounded-md mt-6">
                                    <ShieldCheck className="h-4 w-4 mr-2 text-primary" /><span>Your payment information is secure.</span>
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
    );
}
