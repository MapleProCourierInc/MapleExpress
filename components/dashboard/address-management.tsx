"use client"

import { useState, useEffect } from "react"
import type { Address } from "@/types/address"
import { getAddresses, createAddress, updateAddress, deleteAddress } from "@/lib/address-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AddressCard } from "@/components/address-card"
import { AddressForm } from "@/components/address-form"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface AddressManagementProps {
  userId: string
}

export function AddressManagement({ userId }: AddressManagementProps) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  // Fetch addresses when component mounts
  useEffect(() => {
    fetchAddresses()
  }, [userId])

  const fetchAddresses = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const fetchedAddresses = await getAddresses(userId)
      setAddresses(fetchedAddresses)
    } catch (err) {
      console.error("Error fetching addresses:", err)
      setError("Failed to load addresses. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAddress = () => {
    setEditingAddress(null)
    setIsAddingAddress(true)
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setIsAddingAddress(true)
  }

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await deleteAddress(userId, addressId)
      // Refresh the address list after deletion
      fetchAddresses()
    } catch (err) {
      console.error("Error deleting address:", err)
      setError("Failed to delete address. Please try again.")
    }
  }

  const handleSubmitAddress = async (addressData: Omit<Address, "addressId">) => {
    setIsSubmitting(true)
    setError(null)

    try {
      if (editingAddress) {
        // Update existing address
        await updateAddress(userId, {
          ...addressData,
          addressId: editingAddress.addressId,
        })
      } else {
        // Create new address
        await createAddress(userId, addressData)
      }

      // Refresh the address list after adding/updating
      await fetchAddresses()

      setIsAddingAddress(false)
      setEditingAddress(null)
    } catch (err) {
      console.error("Error saving address:", err)
      setError("Failed to save address. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelAddEdit = () => {
    setIsAddingAddress(false)
    setEditingAddress(null)
  }

  const filteredAddresses = activeTab === "all" ? addresses : addresses.filter((addr) => addr.addressType === activeTab)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Addresses</h1>
        <Button onClick={handleAddAddress}>
          <Plus className="h-4 w-4 mr-2" /> Add New Address
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading addresses...</span>
        </div>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">You don't have any saved addresses yet.</p>
            <Button onClick={handleAddAddress}>
              <Plus className="h-4 w-4 mr-2" /> Add Your First Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Addresses</TabsTrigger>
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="work">Work</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAddresses.map((address) => (
              <AddressCard
                key={address.addressId}
                address={address}
                onEdit={handleEditAddress}
                onDelete={handleDeleteAddress}
              />
            ))}
          </div>
        </>
      )}

      <Dialog open={isAddingAddress} onOpenChange={(open) => !open && handleCancelAddEdit()}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
            <DialogDescription>
              {editingAddress
                ? "Update your address information below."
                : "Fill in the details to add a new address to your account."}
            </DialogDescription>
          </DialogHeader>
          <AddressForm
            address={editingAddress || undefined}
            onSubmit={handleSubmitAddress}
            onCancel={handleCancelAddEdit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

