"use client"

import { useState } from "react"
import type { Address } from "@/types/address"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Edit, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AddressCardProps {
  address: Address
  onEdit: (address: Address) => void
  onDelete: (addressId: string) => void
}

export function AddressCard({ address, onEdit, onDelete }: AddressCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDelete = () => {
    onDelete(address.addressId)
    setIsDeleteDialogOpen(false)
  }

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">
              {address.addressType
                ? address.addressType.charAt(0).toUpperCase() + address.addressType.slice(1)
                : "Default"}{" "}
              Address
            </h3>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <p className="font-medium">{address.fullName}</p>
          {address.company && <p>{address.company}</p>}
          <p>{address.streetAddress}</p>
          {address.addressLine2 && <p>{address.addressLine2}</p>}
          <p>
            {address.city}, {address.province} {address.postalCode}
          </p>
          <p>{address.country}</p>
          <p className="pt-2">{address.phoneNumber}</p>
          {address.deliveryInstructions && (
            <div className="pt-2">
              <p className="font-medium">Delivery Instructions:</p>
              <p className="text-muted-foreground">{address.deliveryInstructions}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(address)}>
          <Edit className="h-4 w-4 mr-2" /> Edit
        </Button>
        <Button variant="outline" size="sm" className="text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </Button>
      </CardFooter>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this address. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

