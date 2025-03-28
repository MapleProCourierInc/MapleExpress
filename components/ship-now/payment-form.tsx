"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Loader2, Lock, ShieldCheck, MapPin, Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getAddresses, createAddress } from "@/lib/address-service"
import { initiatePayment, convertToBillingAddress } from "@/lib/payment-service"
import type { OrderResponse } from "@/lib/order-service"
import type { Address } from "@/components/ship-now/ship-now-form"
import { AddressForm } from "@/components/ship-now/address-form"

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
    const [processingPayment, setProcessingPayment] = useState(false)
    const [showAddressList, setShowAddressList] = useState(true)

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-CA", {
            style: "currency",
            currency: "CAD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount)
    }

    // Fetch saved addresses when component mounts
    useEffect(() => {
        const fetchAddresses = async () => {
            if (!user) return

            try {
                setIsLoadingAddresses(true)
                const addresses = await getAddresses(user.userId)
                setSavedAddresses(addresses)
            } catch (err) {
                console.error("Error fetching addresses:", err)
            } finally {
                setIsLoadingAddresses(false)
            }
        }

        fetchAddresses()
    }, [user])

    // Handle using pickup address as billing address
    useEffect(() => {
        if (useSameAsPickup && orderData.orderItems.length > 0) {
            // Convert the pickup address from the order to our Address format
            const pickupAddressData = orderData.orderItems[0].pickup.address

            const pickupAddress: Address = {
                id: "pickup-address",
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
            }

            setBillingAddress(pickupAddress)
            setSelectedAddressId(null)
            setShowAddressList(false)
        } else if (!useSameAsPickup && selectedAddressId) {
            // If not using pickup address but have a selected address, use that
            const selectedAddress = savedAddresses.find(
                (addr) => addr.id === selectedAddressId || addr.addressId === selectedAddressId,
            )
            if (selectedAddress) {
                const formattedAddress: Address = {
                    id: selectedAddress.id || selectedAddress.addressId,
                    fullName: selectedAddress.fullName,
                    company: selectedAddress.company || "",
                    streetAddress: selectedAddress.streetAddress,
                    addressLine2: selectedAddress.addressLine2 || "",
                    city: selectedAddress.city,
                    province: selectedAddress.province,
                    postalCode: selectedAddress.postalCode,
                    country: selectedAddress.country,
                    phoneNumber: selectedAddress.phoneNumber,
                    deliveryInstructions: selectedAddress.deliveryInstructions || "",
                    addressType: "billing",
                    isPrimary: selectedAddress.isPrimary || false,
                    coordinates: selectedAddress.coordinates,
                }
                setBillingAddress(formattedAddress)
                setShowAddressList(false)
            }
        } else if (!useSameAsPickup && !selectedAddressId && !showNewAddressForm && !billingAddress) {
            // If not using pickup address and no address is selected, show address list
            setShowAddressList(true)
        }
    }, [useSameAsPickup, selectedAddressId, savedAddresses, orderData.orderItems])

    const handleAddressSelect = (addressId: string) => {
        setSelectedAddressId(addressId)
        setUseSameAsPickup(false)
        setShowNewAddressForm(false)

        // Find the selected address and set it as billing address
        const selectedAddress = savedAddresses.find((addr) => addr.id === addressId || addr.addressId === addressId)

        if (selectedAddress) {
            const formattedAddress: Address = {
                id: selectedAddress.id || selectedAddress.addressId,
                fullName: selectedAddress.fullName,
                company: selectedAddress.company || "",
                streetAddress: selectedAddress.streetAddress,
                addressLine2: selectedAddress.addressLine2 || "",
                city: selectedAddress.city,
                province: selectedAddress.province,
                postalCode: selectedAddress.postalCode,
                country: selectedAddress.country,
                phoneNumber: selectedAddress.phoneNumber,
                deliveryInstructions: selectedAddress.deliveryInstructions || "",
                addressType: "billing",
                isPrimary: selectedAddress.isPrimary || false,
                coordinates: selectedAddress.coordinates,
            }
            setBillingAddress(formattedAddress)
            setShowAddressList(false)
        }
    }

    const handleNewAddressClick = () => {
        setSelectedAddressId(null)
        setUseSameAsPickup(false)
        setShowNewAddressForm(true)
        setShowAddressList(false)
    }

    const handleAddressSubmit = async (address: Address, saveForFuture: boolean) => {
        // Ensure the address type is set to "billing"
        const billingAddress: Address = {
            ...address,
            addressType: "billing",
            id: `new-${Date.now()}`, // Ensure it has an ID
        }

        // Set the billing address in state
        setBillingAddress(billingAddress)

        // Close the form and hide address list
        setShowNewAddressForm(false)
        setShowAddressList(false)

        // If saveForFuture is true, save this address to the user's account
        if (saveForFuture && user) {
            try {
                // Convert to the format expected by the API
                const addressData = {
                    fullName: billingAddress.fullName,
                    company: billingAddress.company,
                    streetAddress: billingAddress.streetAddress,
                    addressLine2: billingAddress.addressLine2,
                    city: billingAddress.city,
                    province: billingAddress.province,
                    postalCode: billingAddress.postalCode,
                    country: billingAddress.country,
                    phoneNumber: billingAddress.phoneNumber,
                    deliveryInstructions: billingAddress.deliveryInstructions,
                    addressType: "billing", // Explicitly set as billing
                    isPrimary: billingAddress.isPrimary || false,
                    coordinates: billingAddress.coordinates,
                }

                // Save the address
                await createAddress(user.userId, addressData)

                // Refresh the saved addresses list
                const addresses = await getAddresses(user.userId)
                setSavedAddresses(addresses)
            } catch (err) {
                console.error("Error saving billing address:", err)
            }
        }
    }

    const handleChangeAddress = () => {
        setBillingAddress(null)
        setSelectedAddressId(null)
        setShowAddressList(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user || !billingAddress) {
            console.error("Missing user or billing address")
            return
        }

        setProcessingPayment(true)

        try {
            // Convert the billing address to the format expected by the API
            const formattedBillingAddress = convertToBillingAddress(billingAddress)

            // Call the payment initiation API
            await initiatePayment(orderData.shippingOrderId, user.userId, formattedBillingAddress)

            // On success, call the completion handler
            onPaymentComplete(orderData.shippingOrderId)
        } catch (error) {
            console.error("Payment processing error:", error)
            // Handle payment error (would typically show an error message)
        } finally {
            setProcessingPayment(false)
        }
    }

    // Calculate subtotal
    const subtotal =
        orderData.aggregatedPricing.basePrice +
        orderData.aggregatedPricing.distanceCharge +
        orderData.aggregatedPricing.weightCharge +
        orderData.aggregatedPricing.prioritySurcharge

    // Calculate total taxes
    const totalTaxes = orderData.aggregatedPricing.taxes
        ? orderData.aggregatedPricing.taxes.reduce((sum, tax) => sum + tax.amount, 0)
        : 0

    return (
        <div className="space-y-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold">Payment Details</h1>
                <p className="text-muted-foreground mt-2">Complete your payment to finalize your order</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                                        onCheckedChange={(checked) => {
                                            setUseSameAsPickup(checked)
                                            if (!checked && !billingAddress) {
                                                setShowAddressList(true)
                                            }
                                        }}
                                    />
                                    <Label htmlFor="same-as-pickup">Same as pickup address</Label>
                                </div>

                                {/* Show address selection options */}
                                {!useSameAsPickup && showAddressList && !showNewAddressForm && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={handleNewAddressClick}
                                            className="w-full flex items-center justify-center gap-2 py-6 mb-6"
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
                                                        <span className="bg-white px-4 text-sm text-gray-500">or select a saved address</span>
                                                    </div>
                                                </div>

                                                {isLoadingAddresses ? (
                                                    <div className="flex justify-center py-4">
                                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                    </div>
                                                ) : (
                                                    <RadioGroup
                                                        value={selectedAddressId || ""}
                                                        onValueChange={handleAddressSelect}
                                                        className="space-y-3"
                                                    >
                                                        {savedAddresses.map((address) => {
                                                            const addressId = address.id || address.addressId
                                                            return (
                                                                <div key={addressId} className="flex items-start space-x-3">
                                                                    <RadioGroupItem
                                                                        value={addressId || ""}
                                                                        id={`address-${addressId}`}
                                                                        className="mt-1"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <Label htmlFor={`address-${addressId}`} className="flex items-start cursor-pointer">
                                                                            <Card className="w-full">
                                                                                <CardContent className="p-4">
                                                                                    <div className="flex justify-between">
                                                                                        <div>
                                                                                            <p className="font-medium">{address.fullName}</p>
                                                                                            {address.company && (
                                                                                                <p className="text-muted-foreground text-sm">{address.company}</p>
                                                                                            )}
                                                                                            <p className="mt-1">
                                                                                                {address.streetAddress}
                                                                                                {address.addressLine2 && `, ${address.addressLine2}`}
                                                                                            </p>
                                                                                            <p>
                                                                                                {address.city}, {address.province} {address.postalCode}
                                                                                            </p>
                                                                                            <p>{address.country}</p>
                                                                                            <p className="mt-1">{address.phoneNumber}</p>
                                                                                        </div>
                                                                                        {address.isPrimary && (
                                                                                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                                Primary
                                              </span>
                                                                                        )}
                                                                                    </div>
                                                                                </CardContent>
                                                                            </Card>
                                                                        </Label>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </RadioGroup>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}

                                {/* Show new address form */}
                                {!useSameAsPickup && showNewAddressForm && (
                                    <div className="mt-6">
                                        <AddressForm onSubmit={handleAddressSubmit} addressType="billing" initialAddress={null} />
                                        <div className="mt-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setShowNewAddressForm(false)
                                                    setShowAddressList(true)
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Display the selected billing address when using pickup address */}
                                {useSameAsPickup && billingAddress && (
                                    <Card className="mt-4">
                                        <CardContent className="p-4">
                                            <p className="font-medium">{billingAddress.fullName}</p>
                                            {billingAddress.company && (
                                                <p className="text-muted-foreground text-sm">{billingAddress.company}</p>
                                            )}
                                            <p className="mt-1">
                                                {billingAddress.streetAddress}
                                                {billingAddress.addressLine2 && `, ${billingAddress.addressLine2}`}
                                            </p>
                                            <p>
                                                {billingAddress.city}, {billingAddress.province} {billingAddress.postalCode}
                                            </p>
                                            <p>{billingAddress.country}</p>
                                            <p className="mt-1">{billingAddress.phoneNumber}</p>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Display the selected billing address when not using pickup */}
                                {!useSameAsPickup && !showNewAddressForm && billingAddress && !showAddressList && (
                                    <Card className="mt-4">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{billingAddress.fullName}</p>
                                                    {billingAddress.company && (
                                                        <p className="text-muted-foreground text-sm">{billingAddress.company}</p>
                                                    )}
                                                    <p className="mt-1">
                                                        {billingAddress.streetAddress}
                                                        {billingAddress.addressLine2 && `, ${billingAddress.addressLine2}`}
                                                    </p>
                                                    <p>
                                                        {billingAddress.city}, {billingAddress.province} {billingAddress.postalCode}
                                                    </p>
                                                    <p>{billingAddress.country}</p>
                                                    <p className="mt-1">{billingAddress.phoneNumber}</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleChangeAddress}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    Change
                                                </Button>
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
                            disabled={isProcessing || processingPayment || !billingAddress}
                        >
                            {isProcessing || processingPayment ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing Payment...
                                </>
                            ) : (
                                <>Pay {formatCurrency(orderData.aggregatedPricing.totalAmount)}</>
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={onBack}
                            className="w-full flex items-center justify-center gap-2"
                            disabled={isProcessing || processingPayment}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Order Summary
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
                                    <span>Your payment information is secure and encrypted</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-muted/10 p-4 rounded-md space-y-3">
                        <div className="flex items-center text-sm">
                            <Lock className="h-4 w-4 mr-2 text-primary" />
                            <span className="font-medium">Secure Payment Processing</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            All transactions are secure and encrypted. Your personal information is never shared with third parties.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

