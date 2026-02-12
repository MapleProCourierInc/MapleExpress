"use client"

import { useMemo, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Building2, UserRound, ArrowLeft, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import type { OnboardingPayload } from "@/lib/onboarding-service"

type Mode = "selection" | "personal" | "business"

export function OnboardingFlow() {
  const router = useRouter()
  const { completeOnboarding } = useAuth()
  const [mode, setMode] = useState<Mode>("selection")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [phone, setPhone] = useState("")

  const [name, setName] = useState("")
  const [businessPhone, setBusinessPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [taxID, setTaxID] = useState("")
  const [industry, setIndustry] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactPosition, setContactPosition] = useState("")

  const heading = useMemo(() => {
    if (mode === "personal") return "Personal onboarding"
    if (mode === "business") return "Business onboarding"
    return "What will you use MapleXpress for?"
  }, [mode])

  const handlePersonalSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    const payload: OnboardingPayload = {
      userType: "INDIVIDUAL",
      details: {
        firstName,
        lastName,
        dateOfBirth: new Date(`${dateOfBirth}T00:00:00Z`).toISOString(),
        phone: phone || undefined,
        extensions: {},
      },
    }

    const result = await completeOnboarding(payload)
    setIsSubmitting(false)

    if (!result.success) {
      if (result.statusCode === 400) {
        setFormError("Please fill all required fields and try again.")
      } else if (result.statusCode === 403) {
        setFormError("Verify your email first before completing onboarding.")
      } else {
        setFormError(result.message)
      }
      return
    }

    router.push("/dashboard")
  }

  const handleBusinessSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    const payload: OnboardingPayload = {
      userType: "ORGANIZATION",
      details: {
        name,
        phone: businessPhone,
        website: website || undefined,
        registrationNumber: registrationNumber || undefined,
        taxID: taxID || undefined,
        industry: industry || undefined,
        pointOfContact: {
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          position: contactPosition || undefined,
        },
        extensions: {},
      },
    }

    const result = await completeOnboarding(payload)
    setIsSubmitting(false)

    if (!result.success) {
      if (result.statusCode === 400) {
        setFormError("Please complete all required fields and try again.")
      } else if (result.statusCode === 403) {
        setFormError("Verify your email first before completing onboarding.")
      } else {
        setFormError(result.message)
      }
      return
    }

    router.push("/dashboard")
  }

  return (
    <div className="container py-12">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          {mode !== "selection" && (
            <Button variant="ghost" size="sm" className="w-fit px-2" onClick={() => setMode("selection")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <CardTitle className="text-2xl">{heading}</CardTitle>
          <CardDescription>
            {mode === "selection"
              ? "Choose the experience that best fits your shipping needs."
              : "Tell us a bit more so we can activate your account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {mode === "selection" && (
            <div className="grid md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode("personal")}
                className="text-left rounded-lg border p-5 hover:border-primary hover:bg-primary/5 transition"
              >
                <UserRound className="h-8 w-8 text-primary mb-3" />
                <p className="font-semibold">Personal shipments</p>
                <p className="text-sm text-muted-foreground mt-1">For your own parcels and occasional deliveries.</p>
              </button>
              <button
                type="button"
                onClick={() => setMode("business")}
                className="text-left rounded-lg border p-5 hover:border-primary hover:bg-primary/5 transition"
              >
                <Building2 className="h-8 w-8 text-primary mb-3" />
                <p className="font-semibold">Business / Company shipments</p>
                <p className="text-sm text-muted-foreground mt-1">For teams with regular shipping and operations needs.</p>
              </button>
            </div>
          )}

          {mode === "personal" && (
            <form onSubmit={handlePersonalSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input id="dateOfBirth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete onboarding"}
              </Button>
            </form>
          )}

          {mode === "business" && (
            <form onSubmit={handleBusinessSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Business Phone</Label>
                  <Input id="businessPhone" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} required />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration # (optional)</Label>
                  <Input id="registrationNumber" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxID">Tax ID (optional)</Label>
                  <Input id="taxID" value={taxID} onChange={(e) => setTaxID(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry (optional)</Label>
                <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
              </div>

              <div className="rounded-lg border p-4 space-y-4">
                <p className="font-medium">Point of contact</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Name</Label>
                    <Input id="contactName" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input id="contactPhone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPosition">Position (optional)</Label>
                    <Input id="contactPosition" value={contactPosition} onChange={(e) => setContactPosition(e.target.value)} />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete onboarding"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
