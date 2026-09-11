"use client"

import type { FormEvent } from "react"
import { useState } from "react"
import { CheckCircle2, Loader2, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type RequestProblem = {
  detail?: string
  message?: string
  errors?: Record<string, string> | null
}

const FIELD_LABELS: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  phoneNumber: "Phone number",
  serviceType: "Service type",
  additionalInformation: "Business details",
}

function requestErrorDescription(problem: RequestProblem | null) {
  const fieldErrors = Object.entries(problem?.errors || {}).map(
    ([field, message]) => `${FIELD_LABELS[field] || field}: ${message}`,
  )

  return [problem?.detail || problem?.message, ...fieldErrors].filter(Boolean).join(" ") || "Please try again later."
}

export function BusinessLeadForm() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    const form = event.currentTarget
    const formData = new FormData(form)
    const additionalInformation = [
      `Company: ${String(formData.get("company") || "").trim()}`,
      `Average deliveries per week: ${String(formData.get("averageDeliveriesPerWeek") || "").trim()}`,
      `Typical pickup postal code: ${String(formData.get("pickupPostalCode") || "").trim()}`,
      `Delivery region: ${String(formData.get("deliveryRegion") || "").trim()}`,
      `Package type: ${String(formData.get("packageType") || "").trim()}`,
      `Additional notes: ${String(formData.get("additionalNotes") || "").trim() || "None provided"}`,
    ].join("\n")

    const requestBody = {
      firstName: String(formData.get("firstName") || "").trim(),
      lastName: String(formData.get("lastName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phoneNumber: String(formData.get("phoneNumber") || "").trim(),
      serviceType: "Business delivery solutions",
      additionalInformation,
    }

    setIsSubmitting(true)
    setSubmitted(false)

    try {
      const response = await fetch("/api/public/quote-requests", {
        method: "POST",
        headers: {
          Accept: "application/json, application/problem+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
      const payload = (await response.json().catch(() => null)) as RequestProblem | null

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Unable to send your business enquiry",
          description: requestErrorDescription(payload),
        })
        return
      }

      form.reset()
      setSubmitted(true)
      toast({
        title: "Business enquiry sent",
        description: "Thanks for reaching out. The MapleXpress team will review your delivery needs and follow up.",
      })
    } catch {
      toast({
        variant: "destructive",
        title: "Unable to send your business enquiry",
        description: "Your message could not be sent. Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="business-company">Company</Label>
        <Input
          id="business-company"
          name="company"
          autoComplete="organization"
          placeholder="Your company name"
          maxLength={150}
          required
        />
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Contact person</legend>
        <div className="space-y-2">
          <Label htmlFor="business-first-name">Contact First Name</Label>
          <Input
            id="business-first-name"
            name="firstName"
            autoComplete="given-name"
            placeholder="First name"
            maxLength={100}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business-last-name">Contact Last Name</Label>
          <Input
            id="business-last-name"
            name="lastName"
            autoComplete="family-name"
            placeholder="Last name"
            maxLength={100}
            required
          />
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="business-email">Email</Label>
          <Input
            id="business-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.ca"
            maxLength={254}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business-phone">Phone</Label>
          <Input
            id="business-phone"
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            placeholder="+1 902 555 0142"
            minLength={7}
            maxLength={30}
            pattern="[0-9+() .\-]{7,30}"
            title="Enter a valid phone number using numbers, spaces, or + ( ) . -"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="business-volume">Average Deliveries per Week</Label>
          <select
            id="business-volume"
            name="averageDeliveriesPerWeek"
            defaultValue=""
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
          >
            <option value="" disabled>Select weekly volume</option>
            <option value="1-5">1–5</option>
            <option value="6-15">6–15</option>
            <option value="16-30">16–30</option>
            <option value="31-50">31–50</option>
            <option value="51+">51+</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="business-postal-code">Typical Pickup Postal Code</Label>
          <Input
            id="business-postal-code"
            name="pickupPostalCode"
            autoComplete="postal-code"
            placeholder="E1C 1A1"
            maxLength={20}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="business-region">Delivery Region</Label>
          <Input
            id="business-region"
            name="deliveryRegion"
            placeholder="Moncton, Dieppe, Riverview..."
            maxLength={150}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business-package-type">Package Type</Label>
          <Input
            id="business-package-type"
            name="packageType"
            placeholder="Documents, parts, parcels..."
            maxLength={200}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="business-notes">Anything Else We Should Know? <span className="font-normal text-muted-foreground">(Optional)</span></Label>
        <Textarea
          id="business-notes"
          name="additionalNotes"
          placeholder="Tell us about delivery timing, recurring routes, multiple stops, or other requirements."
          maxLength={2000}
          rows={5}
        />
      </div>

      {submitted ? (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" aria-live="polite">
          <CheckCircle2 className="h-4 w-4" />
          Your enquiry has been sent. We’ll be in touch.
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
        {isSubmitting ? "Sending Enquiry..." : "Talk to Us About Business Delivery"}
      </Button>
      <p className="text-center text-xs leading-5 text-muted-foreground">
        Tell us what your delivery week looks like. We’ll review the details and discuss practical options with you.
      </p>
    </form>
  )
}
