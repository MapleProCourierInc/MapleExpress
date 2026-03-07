"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CalendarClock, CircleDollarSign, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PricingApiError, PricingModel } from "@/types/pricing"

type Props = {
  initialData: PricingModel[] | null
  initialError: PricingApiError | null
}

type CreateFormState = {
  pricingId: string
  basePrice: string
  distanceRatePerKm: string
  weightRatePerKg: string
  dimensionalRatePerKg: string
  dimensionalConversionFactor: string
  dimensionalUnit: string
  priorityCalculationMethod: "percentage" | "flat"
  prioritySurcharge: string
  taxes: Array<{ taxType: string; taxRate: string }>
  isLatest: boolean
  createdOn: string
  expiredOn: string
}

const initialForm = (): CreateFormState => ({
  pricingId: "",
  basePrice: "",
  distanceRatePerKm: "",
  weightRatePerKg: "",
  dimensionalRatePerKg: "",
  dimensionalConversionFactor: "5000",
  dimensionalUnit: "cm3/kg",
  priorityCalculationMethod: "percentage",
  prioritySurcharge: "",
  taxes: [{ taxType: "GST", taxRate: "" }],
  isLatest: true,
  createdOn: new Date().toISOString().slice(0, 16),
  expiredOn: "",
})

function formatDateTime(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

function formatCalculationMethod(method?: string | null) {
  const normalized = String(method || "").toLowerCase()
  if (normalized === "percentage") return "Percentage"
  if (normalized === "flat") return "Flat"
  return method || "Unknown"
}

function normalizePricing(items: PricingModel[]) {
  return [...items].sort((a, b) => {
    if (a.isLatest && !b.isLatest) return -1
    if (!a.isLatest && b.isLatest) return 1

    const aTime = new Date(a.createdOn || 0).getTime()
    const bTime = new Date(b.createdOn || 0).getTime()
    return bTime - aTime
  })
}

function formatMoney(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—"
  return `$${value.toFixed(2)}`
}

function PricingCard({ item }: { item: PricingModel }) {
  return (
    <Card className={item.isLatest ? "border-primary/50" : ""}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{item.pricingId || "Unnamed pricing"}</CardTitle>
            <CardDescription>{item.isLatest ? "Currently active pricing" : "Historical pricing record"}</CardDescription>
          </div>
          <Badge variant={item.isLatest ? "default" : "secondary"}>{item.isLatest ? "Active / Latest" : "Historical / Inactive"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-2 md:grid-cols-2">
          <p><span className="text-muted-foreground">Base price:</span> {formatMoney(item.basePrice)}</p>
          <p><span className="text-muted-foreground">Distance charge:</span> {formatMoney(item.distanceCharge?.ratePerKm)}/km</p>
          <p><span className="text-muted-foreground">Weight charge:</span> {formatMoney(item.weightCharge?.ratePerKg)}/kg</p>
          <p><span className="text-muted-foreground">Dimensional rate:</span> {formatMoney(item.dimensionalWeightCharge?.ratePerKg)}/kg</p>
          <p>
            <span className="text-muted-foreground">Dimensional factor:</span> {item.dimensionalWeightCharge?.conversionFactor ?? "—"} {item.dimensionalWeightCharge?.unit || ""}
          </p>
          <p>
            <span className="text-muted-foreground">Priority surcharge:</span> {formatCalculationMethod(item.prioritySurcharge?.calculationMethod)} ({item.prioritySurcharge?.surcharge ?? "—"})
          </p>
        </div>

        <div>
          <p className="font-medium">Taxes</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {(item.taxes || []).length ? (
              item.taxes.map((tax, index) => (
                <Badge key={`${tax.taxType}-${index}`} variant="outline">
                  {tax.taxType || "Tax"}: {tax.taxRate ?? "—"}%
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">No taxes configured</span>
            )}
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <p className="text-muted-foreground">Created: {formatDateTime(item.createdOn)}</p>
          <p className="text-muted-foreground">Expired: {formatDateTime(item.expiredOn)}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminPricingManager({ initialData, initialError }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<CreateFormState>(initialForm)

  const sorted = useMemo(() => normalizePricing(initialData || []), [initialData])
  const activePricing = sorted.find((item) => item.isLatest)
  const historyPricing = sorted.filter((item) => !item.isLatest)

  const updateTax = (index: number, key: "taxType" | "taxRate", value: string) => {
    setForm((prev) => ({
      ...prev,
      taxes: prev.taxes.map((tax, i) => (i === index ? { ...tax, [key]: value } : tax)),
    }))
  }

  const setField = (key: keyof CreateFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const validate = () => {
    const errors: Record<string, string> = {}

    if (!form.pricingId.trim()) errors.pricingId = "Required"

    const numericFields: Array<[keyof CreateFormState, string]> = [
      ["basePrice", "Required"],
      ["distanceRatePerKm", "Required"],
      ["weightRatePerKg", "Required"],
      ["dimensionalRatePerKg", "Required"],
      ["dimensionalConversionFactor", "Required"],
      ["prioritySurcharge", "Required"],
    ]

    numericFields.forEach(([key, message]) => {
      const value = form[key]
      if (typeof value !== "string" || value.trim() === "") {
        errors[String(key)] = message
      } else if (!Number.isFinite(Number(value))) {
        errors[String(key)] = "Enter a valid number"
      }
    })

    form.taxes.forEach((tax, index) => {
      if (!tax.taxType.trim()) errors[`taxes.${index}.taxType`] = "Required"
      if (!tax.taxRate.trim()) {
        errors[`taxes.${index}.taxRate`] = "Required"
      } else if (!Number.isFinite(Number(tax.taxRate))) {
        errors[`taxes.${index}.taxRate`] = "Enter a valid number"
      }
    })

    if (!form.createdOn.trim()) errors.createdOn = "Required"
    if (!form.dimensionalUnit.trim()) errors.dimensionalUnit = "Required"

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const retry = async () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 300)
  }

  const submit = async () => {
    if (!validate()) return

    const payload: PricingModel = {
      pricingId: form.pricingId.trim(),
      basePrice: Number(form.basePrice),
      distanceCharge: { ratePerKm: Number(form.distanceRatePerKm) },
      weightCharge: { ratePerKg: Number(form.weightRatePerKg) },
      dimensionalWeightCharge: {
        ratePerKg: Number(form.dimensionalRatePerKg),
        conversionFactor: Number(form.dimensionalConversionFactor),
        unit: form.dimensionalUnit.trim(),
      },
      prioritySurcharge: {
        calculationMethod: form.priorityCalculationMethod,
        surcharge: Number(form.prioritySurcharge),
      },
      taxes: form.taxes.map((tax) => ({ taxType: tax.taxType.trim(), taxRate: Number(tax.taxRate) })),
      isLatest: true,
      createdOn: new Date(form.createdOn).toISOString(),
      expiredOn: form.expiredOn ? new Date(form.expiredOn).toISOString() : null,
    }

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as PricingApiError | null
        if (error?.errors?.length) {
          const incoming: Record<string, string> = {}
          error.errors.forEach((item) => {
            if (item.field && item.message) incoming[item.field] = item.message
          })
          if (Object.keys(incoming).length) setFieldErrors((prev) => ({ ...prev, ...incoming }))
        }

        toast({
          title: error?.message || "Unable to create pricing model",
          description: error?.errors?.[0]?.message || "Please review and try again.",
          variant: "destructive",
        })
        return
      }

      toast({ title: "Pricing model created", description: "The latest pricing list has been refreshed." })
      setForm(initialForm())
      setFieldErrors({})
      setOpen(false)
      router.refresh()
    } catch {
      toast({ title: "Unable to create pricing model", description: "Unexpected error occurred.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pricing</h1>
          <p className="text-muted-foreground">Review active pricing and historical pricing models used for audit purposes.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Pricing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create Pricing Model</DialogTitle>
              <DialogDescription>Provide pricing details for the new active pricing configuration.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="pricingId">Pricing ID</Label>
                  <Input id="pricingId" value={form.pricingId} onChange={(e) => setField("pricingId", e.target.value)} />
                  {fieldErrors.pricingId ? <p className="text-xs text-destructive">{fieldErrors.pricingId}</p> : null}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="basePrice">Base Price</Label>
                  <Input id="basePrice" type="number" step="0.01" value={form.basePrice} onChange={(e) => setField("basePrice", e.target.value)} />
                  {fieldErrors.basePrice ? <p className="text-xs text-destructive">{fieldErrors.basePrice}</p> : null}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="distanceRate">Distance Rate / Km</Label>
                  <Input id="distanceRate" type="number" step="0.01" value={form.distanceRatePerKm} onChange={(e) => setField("distanceRatePerKm", e.target.value)} />
                  {fieldErrors.distanceRatePerKm ? <p className="text-xs text-destructive">{fieldErrors.distanceRatePerKm}</p> : null}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="weightRate">Weight Rate / Kg</Label>
                  <Input id="weightRate" type="number" step="0.01" value={form.weightRatePerKg} onChange={(e) => setField("weightRatePerKg", e.target.value)} />
                  {fieldErrors.weightRatePerKg ? <p className="text-xs text-destructive">{fieldErrors.weightRatePerKg}</p> : null}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dimensionalRate">Dimensional Rate / Kg</Label>
                  <Input id="dimensionalRate" type="number" step="0.01" value={form.dimensionalRatePerKg} onChange={(e) => setField("dimensionalRatePerKg", e.target.value)} />
                  {fieldErrors.dimensionalRatePerKg ? <p className="text-xs text-destructive">{fieldErrors.dimensionalRatePerKg}</p> : null}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="dimensionalFactor">Dimensional Conversion Factor</Label>
                  <Input id="dimensionalFactor" type="number" value={form.dimensionalConversionFactor} onChange={(e) => setField("dimensionalConversionFactor", e.target.value)} />
                  {fieldErrors.dimensionalConversionFactor ? <p className="text-xs text-destructive">{fieldErrors.dimensionalConversionFactor}</p> : null}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dimensionalUnit">Dimensional Unit</Label>
                  <Input id="dimensionalUnit" value={form.dimensionalUnit} onChange={(e) => setField("dimensionalUnit", e.target.value)} />
                  {fieldErrors.dimensionalUnit ? <p className="text-xs text-destructive">{fieldErrors.dimensionalUnit}</p> : null}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Priority Calculation Method</Label>
                  <Select value={form.priorityCalculationMethod} onValueChange={(value: "percentage" | "flat") => setField("priorityCalculationMethod", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="prioritySurcharge">Priority Surcharge</Label>
                  <Input id="prioritySurcharge" type="number" step="0.01" value={form.prioritySurcharge} onChange={(e) => setField("prioritySurcharge", e.target.value)} />
                  {fieldErrors.prioritySurcharge ? <p className="text-xs text-destructive">{fieldErrors.prioritySurcharge}</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Taxes</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm((prev) => ({ ...prev, taxes: [...prev.taxes, { taxType: "", taxRate: "" }] }))}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Tax
                  </Button>
                </div>
                {form.taxes.map((tax, index) => (
                  <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                    <div>
                      <Input placeholder="Tax Type (GST)" value={tax.taxType} onChange={(e) => updateTax(index, "taxType", e.target.value)} />
                      {fieldErrors[`taxes.${index}.taxType`] ? <p className="text-xs text-destructive">{fieldErrors[`taxes.${index}.taxType`]}</p> : null}
                    </div>
                    <div>
                      <Input placeholder="Tax Rate" type="number" step="0.01" value={tax.taxRate} onChange={(e) => updateTax(index, "taxRate", e.target.value)} />
                      {fieldErrors[`taxes.${index}.taxRate`] ? <p className="text-xs text-destructive">{fieldErrors[`taxes.${index}.taxRate`]}</p> : null}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          taxes: prev.taxes.length > 1 ? prev.taxes.filter((_, i) => i !== index) : prev.taxes,
                        }))
                      }
                      disabled={form.taxes.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="createdOn">Created On</Label>
                  <Input id="createdOn" type="datetime-local" value={form.createdOn} onChange={(e) => setField("createdOn", e.target.value)} />
                  {fieldErrors.createdOn ? <p className="text-xs text-destructive">{fieldErrors.createdOn}</p> : null}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="expiredOn">Expired On (optional)</Label>
                  <Input id="expiredOn" type="datetime-local" value={form.expiredOn} onChange={(e) => setField("expiredOn", e.target.value)} />
                </div>
              </div>

              <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                New pricing models are submitted as latest by default. Historical records remain visible automatically.
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={submit} disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Pricing Model"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {initialError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{initialError.message || "Failed to load pricing"}</AlertTitle>
          <AlertDescription>
            <Button variant="outline" size="sm" onClick={retry} disabled={isRefreshing} className="mt-2">
              {isRefreshing ? "Retrying..." : "Retry"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!initialError && !sorted.length && (
        <Card>
          <CardHeader>
            <CardTitle>No pricing models found</CardTitle>
            <CardDescription>Create your first pricing model to start managing rates.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!initialError && sorted.length > 0 && (
        <div className="space-y-4">
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CircleDollarSign className="h-5 w-5" /> Active Pricing
              </CardTitle>
              <CardDescription>The latest pricing model currently used by the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              {activePricing ? <PricingCard item={activePricing} /> : <p className="text-sm text-muted-foreground">No active pricing found.</p>}
            </CardContent>
          </Card>

          <section className="space-y-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CalendarClock className="h-5 w-5" /> Pricing History
            </h2>
            <p className="text-sm text-muted-foreground">Historical pricing records are retained for audit and review.</p>
            {historyPricing.length ? (
              <div className="space-y-3">
                {historyPricing.map((item) => (
                  <PricingCard key={`${item.pricingId}-${item.createdOn}`} item={item} />
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No historical pricing yet</CardTitle>
                  <CardDescription>Once a new model is created, previous pricing appears here.</CardDescription>
                </CardHeader>
              </Card>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
