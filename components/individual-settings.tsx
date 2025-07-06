"use client"

import type React from "react"
import { useEffect, useState } from "react"
import type { IndividualProfile } from "@/types/profile"
import { updateIndividualInformation } from "@/lib/profile-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Check } from "lucide-react"
import { format, parseISO } from "date-fns"

interface IndividualSettingsProps {
  /* Parent might pass a single object or an array with one element */
  profile: IndividualProfile | IndividualProfile[]
  onProfileUpdate: () => void
}

export function IndividualSettings({
                                     profile,
                                     onProfileUpdate,
                                   }: IndividualSettingsProps) {
  /* 🔀 Always work with exactly one profile object */
  const normalized: IndividualProfile | null = Array.isArray(profile)
      ? profile[0] ?? null
      : profile ?? null

  const [formData, setFormData] = useState({ phone: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  /* Populate form once the profile arrives */
  useEffect(() => {
    if (normalized) {

      setFormData({ phone: normalized.phone || "" })
    }
  }, [normalized])

  /* ---------- Handlers ---------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormData({ phone: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!normalized) return
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      await updateIndividualInformation(normalized.userId, formData.phone)
      setSuccess(true)
      onProfileUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }
  /* -------------------------------- */

  if (!normalized) {
    return (
        <div className="p-6 text-center text-muted-foreground">
          Loading profile…
        </div>
    )
  }

  return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
              )}

              {success && (
                  <Alert className="bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-600">
                      Your profile has been updated successfully!
                    </AlertDescription>
                  </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={normalized.firstName} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={normalized.lastName} disabled className="bg-muted" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={normalized.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Please contact support if you need to update your email.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                    id="dateOfBirth"
                    value={
                      normalized.dateOfBirth
                          ? format(parseISO(normalized.dateOfBirth), "MMMM d, yyyy")
                          : "Not provided"
                    }
                    disabled
                    className="bg-muted"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                  ) : (
                      "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
  )
}
