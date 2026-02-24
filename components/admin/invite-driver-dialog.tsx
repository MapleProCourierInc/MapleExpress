"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ApiErrorResponse } from "@/types/admin-drivers"

type FormState = {
  email: string
  firstName: string
  lastName: string
  phone: string
  companyName: string
  station: string
}

const initialForm: FormState = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  companyName: "",
  station: "",
}

export function InviteDriverDialog() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>(initialForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const { toast } = useToast()

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const validate = () => {
    const errors: Record<string, string> = {}

    const email = form.email.trim().toLowerCase()
    if (!email) {
      errors.email = "Email is required"
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = "Enter a valid email"
    }

    ;(["firstName", "lastName", "phone", "companyName", "station"] as const).forEach((field) => {
      if (!form[field].trim()) {
        errors[field] = "Required"
      }
    })

    setFieldErrors(errors)
    return { valid: Object.keys(errors).length === 0, normalizedEmail: email }
  }

  const submit = async () => {
    const { valid, normalizedEmail } = validate()
    if (!valid) return

    try {
      setIsSubmitting(true)

      const response = await fetch("/api/admin/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, email: normalizedEmail }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null
        const status = response.status

        if (payload?.errors?.length) {
          const nextErrors: Record<string, string> = {}
          payload.errors.forEach((entry) => {
            if (entry.field && entry.message) nextErrors[entry.field] = entry.message
          })
          if (Object.keys(nextErrors).length) {
            setFieldErrors((prev) => ({ ...prev, ...nextErrors }))
          }
        }

        toast({
          title:
            status === 409
              ? "Driver with this email already exists"
              : payload?.message || "Unable to send invite",
          description: payload?.errors?.[0]?.message || "Please review and try again.",
          variant: "destructive",
        })
        return
      }

      const data = await response.json().catch(() => ({}))
      toast({ title: "Invite sent", description: data?.message || "Driver invitation was sent successfully." })
      setOpen(false)
      setForm(initialForm)
      setFieldErrors({})
      router.refresh()
    } catch {
      toast({ title: "Unable to send invite", description: "Unexpected error occurred.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Invite Driver</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Driver</DialogTitle>
          <DialogDescription>Send an onboarding invite to a new driver.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="space-y-1">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
            {fieldErrors.email ? <p className="text-xs text-destructive">{fieldErrors.email}</p> : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="invite-firstName">First Name</Label>
              <Input id="invite-firstName" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} />
              {fieldErrors.firstName ? <p className="text-xs text-destructive">{fieldErrors.firstName}</p> : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="invite-lastName">Last Name</Label>
              <Input id="invite-lastName" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} />
              {fieldErrors.lastName ? <p className="text-xs text-destructive">{fieldErrors.lastName}</p> : null}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="invite-phone">Phone</Label>
            <Input id="invite-phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
            {fieldErrors.phone ? <p className="text-xs text-destructive">{fieldErrors.phone}</p> : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="invite-company">Company Name</Label>
            <Input id="invite-company" value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} />
            {fieldErrors.companyName ? <p className="text-xs text-destructive">{fieldErrors.companyName}</p> : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="invite-station">Station</Label>
            <Input id="invite-station" value={form.station} onChange={(e) => updateField("station", e.target.value)} />
            {fieldErrors.station ? <p className="text-xs text-destructive">{fieldErrors.station}</p> : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={submit} disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send Invite"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
