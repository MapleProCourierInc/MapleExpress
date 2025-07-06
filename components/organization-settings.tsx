"use client"

import type React from "react"
import { useEffect, useState } from "react"
import type { OrganizationProfile } from "@/types/profile"
import { updateOrganizationInformation } from "@/lib/profile-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Check } from "lucide-react"

interface OrganizationSettingsProps {
  profile: OrganizationProfile | OrganizationProfile[]
  onProfileUpdate: () => void
}

/* Simple “good enough” URL pattern:
 * - optional scheme (http / https)
 * - optional www.
 * - domain with TLD
 * - optional path/query
 */
const urlPattern = /^(https?:\/\/)?(www\.)?([\w-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i

export function OrganizationSettings({
                                       profile,
                                       onProfileUpdate,
                                     }: OrganizationSettingsProps) {
  const normalized: OrganizationProfile | null = Array.isArray(profile)
      ? profile[0] ?? null
      : profile ?? null

  const [formData, setFormData] = useState({
    registrationNumber: "",
    taxID: "",
    industry: "",
    phone: "",
    website: "",
    pointOfContact: { name: "", position: "", email: "", phone: "" },
  })

  const [websiteError, setWebsiteError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  /* Initialise form when profile arrives */
  useEffect(() => {
    if (normalized) {
      setFormData({
        registrationNumber: normalized.registrationNumber || "",
        taxID: normalized.taxID || "",
        industry: normalized.industry || "",
        phone: normalized.phone || "",
        website: normalized.website || "",
        pointOfContact: {
          name: normalized.pointOfContact?.name || "",
          position: normalized.pointOfContact?.position || "",
          email: normalized.pointOfContact?.email || "",
          phone: normalized.pointOfContact?.phone || "",
        },
      })
    }
  }, [normalized])

  /* Helpers */
  const validateWebsite = (raw: string) => {
    if (!raw) return true // empty is allowed
    return urlPattern.test(raw.trim())
  }

  /* Handlers */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === "website") {
      setWebsiteError(validateWebsite(value) ? null : "Please enter a valid URL")
    }
  }

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      pointOfContact: { ...prev.pointOfContact, [name]: value },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!normalized) return

    /* Final validation guard */
    if (!validateWebsite(formData.website)) {
      setWebsiteError("Please enter a valid URL")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      await updateOrganizationInformation(normalized.userId, formData)
      setSuccess(true)
      onProfileUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!normalized) {
    return (
        <div className="p-6 text-center text-muted-foreground">
          Loading organization profile…
        </div>
    )
  }

  /* ----- JSX ----- */
  return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
            <CardDescription>Update your organization details</CardDescription>
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
                      Your organization profile has been updated successfully!
                    </AlertDescription>
                  </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input id="name" value={normalized.name} disabled className="bg-muted" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                      id="registrationNumber"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxID">Tax&nbsp;ID</Label>
                  <Input
                      id="taxID"
                      name="taxID"
                      value={formData.taxID}
                      onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={normalized.email} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone&nbsp;Number</Label>
                  <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                  />
                </div>
              </div>

              {/* Website with custom validation */}
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                    id="website"
                    name="website"
                    type="text"
                    inputMode="url"
                    value={formData.website}
                    onChange={handleChange}

                />
                {websiteError && (
                    <p className="text-xs text-destructive">{websiteError}</p>
                )}
              </div>

              {/* Point-of-contact */}
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium mb-4">Point of Contact</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Name</Label>
                    <Input
                        id="contactName"
                        name="name"
                        value={formData.pointOfContact.name}
                        onChange={handleContactChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPosition">Position</Label>
                    <Input
                        id="contactPosition"
                        name="position"
                        value={formData.pointOfContact.position}
                        onChange={handleContactChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                        id="contactEmail"
                        name="email"
                        type="email"
                        value={formData.pointOfContact.email}
                        onChange={handleContactChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input
                        id="contactPhone"
                        name="phone"
                        value={formData.pointOfContact.phone}
                        onChange={handleContactChange}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || !!websiteError}>
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
