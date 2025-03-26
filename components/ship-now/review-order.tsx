"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { ShippingOrder } from "@/components/ship-now/ship-now-form"
import { Package, MapPin, Truck, Loader2, Edit, Trash2 } from "lucide-react"

interface ReviewOrderProps {
    order: ShippingOrder
    onSubmit: () => void
    onBack: () => void
    onEditPackage: (packageIndex: number) => void
    onDeletePackage: (packageIndex: number) => void
    onEditPickupAddress: () => void
    isSubmitting: boolean
}

export function ReviewOrder({
                                order,
                                onSubmit,
                                onBack,
                                onEditPackage,
                                onDeletePackage,
                                onEditPickupAddress,
                                isSubmitting,
                            }: ReviewOrderProps) {
    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">Review Your Order</h1>
                <p className="text-muted-foreground mt-2">Please review your shipping details before submitting</p>
            </div>

            <div className="space-y-6">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Pickup Address
                        </h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-primary hover:text-primary/80"
                            onClick={onEditPickupAddress}
                        >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                        </Button>
                    </div>
                    {order.pickupAddress && (
                        <Card>
                            <CardContent className="p-4">
                                <p className="font-medium">{order.pickupAddress.fullName}</p>
                                {order.pickupAddress.company && (
                                    <p className="text-muted-foreground text-sm">{order.pickupAddress.company}</p>
                                )}
                                <p className="mt-1">
                                    {order.pickupAddress.streetAddress}
                                    {order.pickupAddress.addressLine2 && `, ${order.pickupAddress.addressLine2}`}
                                </p>
                                <p>
                                    {order.pickupAddress.city}, {order.pickupAddress.province} {order.pickupAddress.postalCode}
                                </p>
                                <p>{order.pickupAddress.country}</p>
                                <p className="mt-1">{order.pickupAddress.phoneNumber}</p>
                                {order.pickupAddress.deliveryInstructions && (
                                    <p className="mt-1 text-sm italic">{order.pickupAddress.deliveryInstructions}</p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
                        <Package className="h-5 w-5 text-primary" />
                        Packages ({order.packages.length})
                    </h2>
                    <div className="space-y-6">
                        {order.packages.map((pkg, index) => (
                            <Card key={pkg.id} className="overflow-hidden">
                                <div className="bg-muted p-3 border-b flex justify-between items-center">
                                    <h3 className="font-medium">Package {index + 1}</h3>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex items-center gap-1 text-primary hover:text-primary/80"
                                            onClick={() => onEditPackage(index)}
                                        >
                                            <Edit className="h-4 w-4" />
                                            <span>Edit</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex items-center gap-1 text-destructive hover:text-destructive/80"
                                            onClick={() => onDeletePackage(index)}
                                            disabled={order.packages.length <= 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span>Delete</span>
                                        </Button>
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-medium text-sm mb-2">Package Details</h4>
                                            <div className="space-y-2">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Contents</p>
                                                    <p>{pkg.contents}</p>
                                                    {pkg.fragile && <p className="text-amber-600 text-sm mt-1">Fragile</p>}
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Dimensions</p>
                                                    <p>
                                                        {pkg.length} × {pkg.width} × {pkg.height} cm
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Weight</p>
                                                    <p>{pkg.weight} kg</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                                                <Truck className="h-4 w-4" />
                                                Delivery Address
                                            </h4>
                                            {pkg.dropoffAddress && (
                                                <div className="space-y-1">
                                                    <p className="font-medium">{pkg.dropoffAddress.fullName}</p>
                                                    {pkg.dropoffAddress.company && (
                                                        <p className="text-muted-foreground text-sm">{pkg.dropoffAddress.company}</p>
                                                    )}
                                                    <p>
                                                        {pkg.dropoffAddress.streetAddress}
                                                        {pkg.dropoffAddress.addressLine2 && `, ${pkg.dropoffAddress.addressLine2}`}
                                                    </p>
                                                    <p>
                                                        {pkg.dropoffAddress.city}, {pkg.dropoffAddress.province} {pkg.dropoffAddress.postalCode}
                                                    </p>
                                                    <p>{pkg.dropoffAddress.country}</p>
                                                    <p>{pkg.dropoffAddress.phoneNumber}</p>
                                                    {pkg.dropoffAddress.deliveryInstructions && (
                                                        <p className="text-sm italic">{pkg.dropoffAddress.deliveryInstructions}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
                    Back
                </Button>
                <Button onClick={onSubmit} className="bg-primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting Order...
                        </>
                    ) : (
                        "Submit Order"
                    )}
                </Button>
            </div>
        </div>
    )
}

