"use client"

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type {
  CreatePricingV2Request,
  PricingV2DistanceSlab,
  PricingV2PackageSlab,
  PricingV2SignatureRequiredFee,
  PricingV2Surcharge,
  PricingV2Tax,
} from "@/types/pricing"

const blankNumber = null as unknown as number
const blankPricingType = null as unknown as CreatePricingV2Request["pricingType"]
const blankDistanceCalculation = "" as PricingV2DistanceSlab["calculationType"]
const blankSurchargeTrigger = "" as PricingV2Surcharge["triggerType"]
const blankSurchargeCalculation = "" as PricingV2Surcharge["calculationType"]
const RUSH_PRIORITY_SURCHARGE_CODE = "RUSH_PRIORITY"

const emptySignatureRequiredFee = (): PricingV2SignatureRequiredFee => ({
  enabled: false,
  displayName: "Signature Required Fee",
  amount: null,
})

const emptyRushPrioritySurcharge = (): PricingV2Surcharge => ({
  surchargeCode: RUSH_PRIORITY_SURCHARGE_CODE,
  displayName: "Priority Service Fee",
  description: null,
  enabled: false,
  triggerType: "ALWAYS",
  triggerValue: null,
  startTime: null,
  endTime: null,
  timezone: null,
  calculationType: "FLAT",
  amount: null,
  percentage: null,
  percentageBase: null,
})

const emptyCommonSurcharge = (): PricingV2Surcharge => ({
  surchargeCode: "",
  displayName: "",
  description: null,
  enabled: true,
  triggerType: blankSurchargeTrigger,
  triggerValue: null,
  startTime: null,
  endTime: null,
  timezone: null,
  calculationType: blankSurchargeCalculation,
  amount: null,
  percentage: null,
  percentageBase: null,
})

export const emptyPricingTemplate: CreatePricingV2Request = {
  name: "",
  description: null,
  status: "DRAFT",
  pricingType: blankPricingType,
  ownerId: null,
  zoneCode: "GLOBAL",
  zoneDisplayName: "Global",
  currency: "CAD",
  effectiveFrom: null,
  effectiveTo: null,
  dimensionalWeight: {
    enabled: false,
    displayName: "Dimensional Weight",
    unit: "CM",
    divisor: 5000,
    roundingScale: 2,
    roundingMode: "CEILING",
  },
  chargeableWeight: {
    enabled: false,
    displayName: "Chargeable Weight",
    calculationType: "MAX_OF_ACTUAL_AND_DIMENSIONAL",
  },
  packageSlabs: [],
  distancePricing: {
    enabled: false,
    displayName: null,
    includedDistanceKm: blankNumber,
    distanceSlabs: [],
  },
  surcharges: [],
  signatureRequiredFee: emptySignatureRequiredFee(),
  taxes: [],
  customQuoteRules: {
    enabled: false,
    maxStandardDistanceKm: null,
    distanceExceededMessage: null,
  },
  rounding: {
    moneyScale: 2,
    moneyRoundingMode: "HALF_UP",
    measurementScale: 2,
    measurementRoundingMode: "CEILING",
  },
}

export const freshPricingTemplate = () => structuredClone(emptyPricingTemplate)

const nullableNumber = (value: string) => value === "" ? null : Number(value)
const textOrNull = (value: string) => value.trim() ? value : null
const isRushPriority = (code: string) => code.trim().toUpperCase() === RUSH_PRIORITY_SURCHARGE_CODE

function normalizeRushPriority(rule?: PricingV2Surcharge | null): PricingV2Surcharge {
  return {
    ...emptyRushPrioritySurcharge(),
    ...(rule || {}),
    surchargeCode: RUSH_PRIORITY_SURCHARGE_CODE,
    displayName: "Priority Service Fee",
    triggerType: "ALWAYS",
    triggerValue: null,
    startTime: null,
    endTime: null,
    timezone: null,
  }
}

function syncPackageSlabs(slabs: PricingV2PackageSlab[]) {
  slabs.forEach((slab, index) => {
    slab.tierOrder = index + 1
    if (index > 0) {
      slab.minChargeableWeightKgExclusive = slabs[index - 1].maxChargeableWeightKg
      slab.minDimensionSumCmExclusive = slabs[index - 1].maxDimensionSumCm
    }
  })
}

function syncDistanceSlabs(slabs: PricingV2DistanceSlab[], includedDistanceKm: number | null) {
  slabs.forEach((slab, index) => {
    slab.fromKmExclusive = index === 0 ? includedDistanceKm : slabs[index - 1].toKmInclusive
  })
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function Toggle({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
      <Label>{label}</Label>
    </div>
  )
}

function NumberInput({
  value,
  onChange,
  disabled = false,
}: {
  value: number | null
  onChange: (value: number | null) => void
  disabled?: boolean
}) {
  return <Input type="number" step="any" value={value ?? ""} disabled={disabled} onChange={(event) => onChange(nullableNumber(event.target.value))} />
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-md border p-4">
      <h4 className="font-medium">{title}</h4>
      {children}
    </div>
  )
}

export function PricingModelForm({ value, onChange }: { value: CreatePricingV2Request; onChange: (value: CreatePricingV2Request) => void }) {
  const update = (mutate: (draft: CreatePricingV2Request) => void) => {
    const draft = structuredClone(value)
    mutate(draft)
    onChange(draft)
  }
  const setPackage = (index: number, mutate: (slab: PricingV2PackageSlab) => void) =>
    update((draft) => {
      mutate(draft.packageSlabs[index])
      syncPackageSlabs(draft.packageSlabs)
    })
  const setDistance = (index: number, mutate: (slab: PricingV2DistanceSlab) => void) =>
    update((draft) => {
      mutate(draft.distancePricing.distanceSlabs[index])
      syncDistanceSlabs(draft.distancePricing.distanceSlabs, draft.distancePricing.includedDistanceKm)
    })
  const setSurcharge = (index: number, mutate: (rule: PricingV2Surcharge) => void) => update((draft) => mutate(draft.surcharges[index]))
  const setTax = (index: number, mutate: (tax: PricingV2Tax) => void) => update((draft) => mutate(draft.taxes[index]))
  const setSignatureRequiredFee = (mutate: (fee: PricingV2SignatureRequiredFee) => void) =>
    update((draft) => {
      const fee = draft.signatureRequiredFee || emptySignatureRequiredFee()
      mutate(fee)
      draft.signatureRequiredFee = fee
    })
  const setRushPriority = (mutate: (rule: PricingV2Surcharge) => void) =>
    update((draft) => {
      const index = draft.surcharges.findIndex((rule) => isRushPriority(rule.surchargeCode))
      const rule = normalizeRushPriority(index >= 0 ? draft.surcharges[index] : null)
      mutate(rule)
      if (index >= 0) {
        draft.surcharges[index] = rule
      } else {
        draft.surcharges.unshift(rule)
      }
    })
  const moveCommonSurcharge = (index: number, direction: "up" | "down") =>
    update((draft) => {
      const commonIndexes = draft.surcharges
        .map((rule, surchargeIndex) => isRushPriority(rule.surchargeCode) ? null : surchargeIndex)
        .filter((surchargeIndex): surchargeIndex is number => surchargeIndex !== null)
      const position = commonIndexes.indexOf(index)
      const targetPosition = direction === "up" ? position - 1 : position + 1
      const targetIndex = commonIndexes[targetPosition]
      if (position < 0 || targetIndex == null) return
      const current = draft.surcharges[index]
      draft.surcharges[index] = draft.surcharges[targetIndex]
      draft.surcharges[targetIndex] = current
    })

  const signatureRequiredFee = value.signatureRequiredFee || emptySignatureRequiredFee()
  const rushPriority = normalizeRushPriority(value.surcharges.find((rule) => isRushPriority(rule.surchargeCode)))
  const commonSurcharges = value.surcharges
    .map((rule, index) => ({ rule, index }))
    .filter(({ rule }) => !isRushPriority(rule.surchargeCode))

  return (
    <Accordion type="multiple" defaultValue={["basics"]} className="space-y-2">
      <AccordionItem value="basics">
        <AccordionTrigger>1. Model details and scope</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Model name">
              <Input value={value.name} onChange={(event) => update((draft) => { draft.name = event.target.value })} />
            </Field>
            <Field label="Currency">
              <Input value={value.currency} onChange={(event) => update((draft) => { draft.currency = event.target.value.toUpperCase() })} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea value={value.description || ""} onChange={(event) => update((draft) => { draft.description = textOrNull(event.target.value) })} />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Pricing scope">
              <Select
                value={value.pricingType || undefined}
                onValueChange={(scope: "GLOBAL" | "CUSTOMER_SPECIFIC") =>
                  update((draft) => {
                    draft.pricingType = scope
                    draft.zoneCode = "GLOBAL"
                    draft.zoneDisplayName = "Global"
                    if (scope === "GLOBAL") draft.ownerId = null
                  })
                }
              >
                <SelectTrigger><SelectValue placeholder="Select scope" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOBAL">Global</SelectItem>
                  <SelectItem value="CUSTOMER_SPECIFIC">Customer-specific</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {value.pricingType !== "CUSTOMER_SPECIFIC" ? (
              <>
                <Field label="Zone code">
                  <Select value={value.zoneCode} onValueChange={() => update((draft) => { draft.zoneCode = "GLOBAL"; draft.zoneDisplayName = "Global" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="GLOBAL">Global</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="Zone display name"><Input value={value.zoneDisplayName || ""} disabled /></Field>
              </>
            ) : null}
          </div>
          {value.pricingType === "CUSTOMER_SPECIFIC" ? (
            <Field label="Customer owner ID" hint="Use the customer's JWT subject ID.">
              <Input value={value.ownerId || ""} onChange={(event) => update((draft) => { draft.ownerId = textOrNull(event.target.value) })} />
            </Field>
          ) : null}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="weight">
        <AccordionTrigger>2. Dimensional and chargeable weight</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <Toggle
            label="Calculate dimensional weight"
            checked={value.dimensionalWeight.enabled}
            onCheckedChange={(enabled) => update((draft) => { draft.dimensionalWeight.enabled = enabled; draft.chargeableWeight.enabled = enabled })}
          />
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Display name">
              <Input value={value.dimensionalWeight.displayName || ""} onChange={(event) => update((draft) => { draft.dimensionalWeight.displayName = textOrNull(event.target.value) })} />
            </Field>
            <Field label="Dimension unit">
              <Select value={value.dimensionalWeight.unit} onValueChange={(unit: "CM" | "INCH") => update((draft) => { draft.dimensionalWeight.unit = unit })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="CM">Centimeters</SelectItem><SelectItem value="INCH">Inches</SelectItem></SelectContent>
              </Select>
            </Field>
            <Field label="Divisor"><NumberInput value={value.dimensionalWeight.divisor} onChange={(next) => update((draft) => { draft.dimensionalWeight.divisor = next as number })} /></Field>
            <Field label="Rounding scale"><NumberInput value={value.dimensionalWeight.roundingScale} onChange={(next) => update((draft) => { draft.dimensionalWeight.roundingScale = next as number })} /></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Dimensional rounding">
              <RoundingSelect value={value.dimensionalWeight.roundingMode} onChange={(mode) => update((draft) => { draft.dimensionalWeight.roundingMode = mode })} />
            </Field>
            <Field label="Chargeable weight">
              <Toggle
                label="Use the greater of actual and dimensional weight"
                checked={value.chargeableWeight.enabled}
                onCheckedChange={(enabled) => update((draft) => { draft.chargeableWeight.enabled = enabled })}
              />
            </Field>
            <Field label="Chargeable weight display name">
              <Input value={value.chargeableWeight.displayName || ""} onChange={(event) => update((draft) => { draft.chargeableWeight.displayName = textOrNull(event.target.value) })} />
            </Field>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="packages">
        <AccordionTrigger>3. Package pricing slabs ({value.packageSlabs.length})</AccordionTrigger>
        <AccordionContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Tier order and the next slab's lower bounds are maintained automatically to prevent missing intervals.</p>
          {value.packageSlabs.map((slab, index) => (
            <Panel key={index} title={`Tier ${index + 1}: ${slab.displayName || "New package slab"}`}>
              <div className="flex justify-between">
                <Toggle label="Enabled" checked={slab.enabled} onCheckedChange={(enabled) => setPackage(index, (item) => { item.enabled = enabled })} />
                <Button variant="ghost" size="sm" onClick={() => update((draft) => { draft.packageSlabs.splice(index, 1); syncPackageSlabs(draft.packageSlabs) })}>
                  <Trash2 className="mr-1 h-4 w-4" />Remove
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Slab code"><Input value={slab.slabCode} onChange={(event) => setPackage(index, (item) => { item.slabCode = event.target.value })} /></Field>
                <Field label="Display name"><Input value={slab.displayName} onChange={(event) => setPackage(index, (item) => { item.displayName = event.target.value })} /></Field>
                <Field label="Tier order"><NumberInput value={slab.tierOrder} disabled onChange={() => undefined} /></Field>
                <Field label="Min weight kg (exclusive)"><NumberInput value={slab.minChargeableWeightKgExclusive} disabled={index > 0} onChange={(next) => setPackage(index, (item) => { item.minChargeableWeightKgExclusive = next })} /></Field>
                <Field label="Max weight kg"><NumberInput value={slab.maxChargeableWeightKg} onChange={(next) => setPackage(index, (item) => { item.maxChargeableWeightKg = next })} /></Field>
                <Field label="Base price"><NumberInput value={slab.basePrice} onChange={(next) => setPackage(index, (item) => { item.basePrice = next as number })} /></Field>
                <Field label="Min dimension sum cm (exclusive)"><NumberInput value={slab.minDimensionSumCmExclusive} disabled={index > 0} onChange={(next) => setPackage(index, (item) => { item.minDimensionSumCmExclusive = next })} /></Field>
                <Field label="Max dimension sum cm"><NumberInput value={slab.maxDimensionSumCm} onChange={(next) => setPackage(index, (item) => { item.maxDimensionSumCm = next })} /></Field>
              </div>
            </Panel>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              update((draft) => {
                draft.packageSlabs.push({
                  slabCode: "",
                  displayName: "",
                  enabled: true,
                  tierOrder: draft.packageSlabs.length + 1,
                  minChargeableWeightKgExclusive: draft.packageSlabs.at(-1)?.maxChargeableWeightKg ?? null,
                  maxChargeableWeightKg: null,
                  minDimensionSumCmExclusive: draft.packageSlabs.at(-1)?.maxDimensionSumCm ?? null,
                  maxDimensionSumCm: null,
                  basePrice: blankNumber,
                })
                syncPackageSlabs(draft.packageSlabs)
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />Add package slab
          </Button>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="distance">
        <AccordionTrigger>4. Distance pricing ({value.distancePricing.distanceSlabs.length} slabs)</AccordionTrigger>
        <AccordionContent className="space-y-3">
          <Toggle label="Enable distance pricing" checked={value.distancePricing.enabled} onCheckedChange={(enabled) => update((draft) => { draft.distancePricing.enabled = enabled })} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Display name"><Input value={value.distancePricing.displayName || ""} onChange={(event) => update((draft) => { draft.distancePricing.displayName = textOrNull(event.target.value) })} /></Field>
            <Field label="Included distance km"><NumberInput value={value.distancePricing.includedDistanceKm} onChange={(next) => update((draft) => { draft.distancePricing.includedDistanceKm = next as number; syncDistanceSlabs(draft.distancePricing.distanceSlabs, next) })} /></Field>
          </div>
          {value.distancePricing.distanceSlabs.map((slab, index) => (
            <Panel key={index} title={`Distance slab ${index + 1}: ${slab.displayName || "New distance slab"}`}>
              <div className="flex justify-between">
                <Toggle label="Enabled" checked={slab.enabled} onCheckedChange={(enabled) => setDistance(index, (item) => { item.enabled = enabled })} />
                <Button variant="ghost" size="sm" onClick={() => update((draft) => { draft.distancePricing.distanceSlabs.splice(index, 1); syncDistanceSlabs(draft.distancePricing.distanceSlabs, draft.distancePricing.includedDistanceKm) })}>
                  <Trash2 className="mr-1 h-4 w-4" />Remove
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Slab code"><Input value={slab.slabCode} onChange={(event) => setDistance(index, (item) => { item.slabCode = event.target.value })} /></Field>
                <Field label="Display name"><Input value={slab.displayName} onChange={(event) => setDistance(index, (item) => { item.displayName = event.target.value })} /></Field>
                <Field label="Calculation">
                  <Select value={slab.calculationType || undefined} onValueChange={(calculation: "FLAT" | "PER_KM") => setDistance(index, (item) => { item.calculationType = calculation })}>
                    <SelectTrigger><SelectValue placeholder="Select calculation" /></SelectTrigger>
                    <SelectContent><SelectItem value="PER_KM">Per kilometer</SelectItem><SelectItem value="FLAT">Flat</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="From km (exclusive)"><NumberInput value={slab.fromKmExclusive} disabled onChange={() => undefined} /></Field>
                <Field label="To km (inclusive)"><NumberInput value={slab.toKmInclusive} onChange={(next) => setDistance(index, (item) => { item.toKmInclusive = next })} /></Field>
                <Field label="Rate"><NumberInput value={slab.rate} onChange={(next) => setDistance(index, (item) => { item.rate = next as number })} /></Field>
              </div>
            </Panel>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              update((draft) => {
                draft.distancePricing.distanceSlabs.push({
                  slabCode: "",
                  displayName: "",
                  enabled: true,
                  fromKmExclusive: draft.distancePricing.distanceSlabs.at(-1)?.toKmInclusive ?? draft.distancePricing.includedDistanceKm,
                  toKmInclusive: null,
                  calculationType: blankDistanceCalculation,
                  rate: blankNumber,
                })
                syncDistanceSlabs(draft.distancePricing.distanceSlabs, draft.distancePricing.includedDistanceKm)
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />Add distance slab
          </Button>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="signature-required-fee">
        <AccordionTrigger>5. Signature-required fee</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <Panel title={signatureRequiredFee.displayName || "Signature Required Fee"}>
            <Toggle
              label="Enable signature-required fee"
              checked={signatureRequiredFee.enabled}
              onCheckedChange={(enabled) => setSignatureRequiredFee((fee) => { fee.enabled = enabled })}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Display name">
                <Input value={signatureRequiredFee.displayName || ""} onChange={(event) => setSignatureRequiredFee((fee) => { fee.displayName = textOrNull(event.target.value) })} />
              </Field>
              <Field label="Amount">
                <NumberInput value={signatureRequiredFee.amount} onChange={(next) => setSignatureRequiredFee((fee) => { fee.amount = next })} />
              </Field>
            </div>
          </Panel>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="rush-priority">
        <AccordionTrigger>6. Rush priority surcharge</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <Panel title="Priority Service Fee">
            <Toggle
              label="Enable rush priority surcharge"
              checked={rushPriority.enabled}
              onCheckedChange={(enabled) => setRushPriority((rule) => { rule.enabled = enabled })}
            />
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Display name">
                <Input value="Priority Service Fee" disabled />
              </Field>
              <Field label="Calculation">
                <Select
                  value={rushPriority.calculationType || undefined}
                  onValueChange={(calculation: PricingV2Surcharge["calculationType"]) =>
                    setRushPriority((rule) => {
                      rule.calculationType = calculation
                      if (calculation === "PERCENTAGE" && !rule.percentageBase) rule.percentageBase = "SUBTOTAL"
                    })
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Select calculation" /></SelectTrigger>
                  <SelectContent><SelectItem value="FLAT">Flat</SelectItem><SelectItem value="PERCENTAGE">Percentage</SelectItem></SelectContent>
                </Select>
              </Field>
              {rushPriority.calculationType === "PERCENTAGE" ? (
                <>
                  <Field label="Percentage"><NumberInput value={rushPriority.percentage} onChange={(next) => setRushPriority((rule) => { rule.percentage = next })} /></Field>
                  <Field label="Percentage base"><PercentageBaseSelect value={rushPriority.percentageBase || "SUBTOTAL"} onChange={(base) => setRushPriority((rule) => { rule.percentageBase = base })} /></Field>
                </>
              ) : (
                <Field label="Amount"><NumberInput value={rushPriority.amount} onChange={(next) => setRushPriority((rule) => { rule.amount = next })} /></Field>
              )}
            </div>
            <Field label="Description">
              <Input value={rushPriority.description || ""} onChange={(event) => setRushPriority((rule) => { rule.description = textOrNull(event.target.value) })} />
            </Field>
          </Panel>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="surcharges">
        <AccordionTrigger>7. Other surcharges ({commonSurcharges.length})</AccordionTrigger>
        <AccordionContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Use this section for non-rush surcharge rules. Time windows are evaluated in America/Halifax.</p>
          {commonSurcharges.map(({ rule, index }, displayIndex) => (
            <Panel key={index} title={`Surcharge ${displayIndex + 1}: ${rule.displayName || "New surcharge"}`}>
              <div className="flex justify-between">
                <Toggle label="Enabled" checked={rule.enabled} onCheckedChange={(enabled) => setSurcharge(index, (item) => { item.enabled = enabled })} />
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" disabled={displayIndex === 0} aria-label="Move surcharge up" onClick={() => moveCommonSurcharge(index, "up")}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled={displayIndex === commonSurcharges.length - 1} aria-label="Move surcharge down" onClick={() => moveCommonSurcharge(index, "down")}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => update((draft) => { draft.surcharges.splice(index, 1) })}>
                    <Trash2 className="mr-1 h-4 w-4" />Remove
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Code">
                  <Input value={rule.surchargeCode} onChange={(event) => setSurcharge(index, (item) => { item.surchargeCode = event.target.value })} />
                </Field>
                <Field label="Display name"><Input value={rule.displayName} onChange={(event) => setSurcharge(index, (item) => { item.displayName = event.target.value })} /></Field>
                <Field label="Trigger">
                  <Select
                    value={rule.triggerType || undefined}
                    onValueChange={(trigger: PricingV2Surcharge["triggerType"]) =>
                      setSurcharge(index, (item) => {
                        item.triggerType = trigger
                        item.timezone = trigger === "TIME_WINDOW" ? "America/Halifax" : null
                      })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALWAYS">Always</SelectItem>
                      <SelectItem value="SERVICE_TYPE">Service type</SelectItem>
                      <SelectItem value="CUSTOMER_TYPE">Customer type</SelectItem>
                      <SelectItem value="TIME_WINDOW">Time window</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Calculation">
                  <Select
                    value={rule.calculationType || undefined}
                    onValueChange={(calculation: PricingV2Surcharge["calculationType"]) =>
                      setSurcharge(index, (item) => {
                        item.calculationType = calculation
                        if (calculation === "PERCENTAGE" && !item.percentageBase) item.percentageBase = "SUBTOTAL"
                      })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="Select calculation" /></SelectTrigger>
                    <SelectContent><SelectItem value="FLAT">Flat</SelectItem><SelectItem value="PERCENTAGE">Percentage</SelectItem></SelectContent>
                  </Select>
                </Field>
                {rule.calculationType === "FLAT" ? (
                  <Field label="Amount"><NumberInput value={rule.amount} onChange={(next) => setSurcharge(index, (item) => { item.amount = next })} /></Field>
                ) : (
                  <>
                    <Field label="Percentage"><NumberInput value={rule.percentage} onChange={(next) => setSurcharge(index, (item) => { item.percentage = next })} /></Field>
                    <Field label="Percentage base"><PercentageBaseSelect value={rule.percentageBase || "SUBTOTAL"} onChange={(base) => setSurcharge(index, (item) => { item.percentageBase = base })} /></Field>
                  </>
                )}
                {rule.triggerType === "SERVICE_TYPE" || rule.triggerType === "CUSTOMER_TYPE" ? (
                  <Field label={rule.triggerType === "CUSTOMER_TYPE" ? "Customer type value" : "Service type value"}>
                    <Input value={rule.triggerValue || ""} onChange={(event) => setSurcharge(index, (item) => { item.triggerValue = textOrNull(event.target.value) })} />
                  </Field>
                ) : null}
                {rule.triggerType === "TIME_WINDOW" ? (
                  <>
                    <Field label="Start time"><Input type="time" step="1" value={rule.startTime || ""} onChange={(event) => setSurcharge(index, (item) => { item.startTime = textOrNull(event.target.value) })} /></Field>
                    <Field label="End time"><Input type="time" step="1" value={rule.endTime || ""} onChange={(event) => setSurcharge(index, (item) => { item.endTime = textOrNull(event.target.value) })} /></Field>
                    <Field label="Timezone" hint="The quote service currently evaluates time windows in Halifax time."><Input value="America/Halifax" disabled /></Field>
                  </>
                ) : null}
              </div>
              <Field label="Description"><Input value={rule.description || ""} onChange={(event) => setSurcharge(index, (item) => { item.description = textOrNull(event.target.value) })} /></Field>
            </Panel>
          ))}
          <Button variant="outline" onClick={() => update((draft) => { draft.surcharges.push(emptyCommonSurcharge()) })}>
            <Plus className="mr-2 h-4 w-4" />Add surcharge
          </Button>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="taxes">
        <AccordionTrigger>8. Taxes ({value.taxes.length})</AccordionTrigger>
        <AccordionContent className="space-y-3">
          {value.taxes.map((tax, index) => (
            <Panel key={index} title={`Tax ${index + 1}: ${tax.displayName || "New tax"}`}>
              <div className="flex justify-between">
                <Toggle label="Enabled" checked={tax.enabled} onCheckedChange={(enabled) => setTax(index, (item) => { item.enabled = enabled })} />
                <Button variant="ghost" size="sm" onClick={() => update((draft) => { draft.taxes.splice(index, 1) })}>
                  <Trash2 className="mr-1 h-4 w-4" />Remove
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Tax code"><Input value={tax.taxCode} onChange={(event) => setTax(index, (item) => { item.taxCode = event.target.value })} /></Field>
                <Field label="Display name"><Input value={tax.displayName} onChange={(event) => setTax(index, (item) => { item.displayName = event.target.value })} /></Field>
                <Field label="Percentage"><NumberInput value={tax.percentage} onChange={(next) => setTax(index, (item) => { item.percentage = next as number })} /></Field>
                <Field label="Percentage base"><PercentageBaseSelect value={tax.percentageBase} onChange={(base) => setTax(index, (item) => { item.percentageBase = base })} /></Field>
              </div>
            </Panel>
          ))}
          <Button variant="outline" onClick={() => update((draft) => { draft.taxes.push({ taxCode: "", displayName: "", enabled: true, calculationType: "PERCENTAGE", percentage: blankNumber, percentageBase: "SUBTOTAL" }) })}>
            <Plus className="mr-2 h-4 w-4" />Add tax
          </Button>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="advanced">
        <AccordionTrigger>9. Custom quotes and rounding</AccordionTrigger>
        <AccordionContent className="space-y-4">
          {value.customQuoteRules ? (
            <>
              <Toggle label="Require custom quotes beyond a maximum distance" checked={value.customQuoteRules.enabled} onCheckedChange={(enabled) => update((draft) => { if (draft.customQuoteRules) draft.customQuoteRules.enabled = enabled })} />
              <Field label="Maximum standard distance km"><NumberInput value={value.customQuoteRules.maxStandardDistanceKm} onChange={(next) => update((draft) => { if (draft.customQuoteRules) draft.customQuoteRules.maxStandardDistanceKm = next })} /></Field>
              <Field label="Distance exceeded message"><Textarea value={value.customQuoteRules.distanceExceededMessage || ""} onChange={(event) => update((draft) => { if (draft.customQuoteRules) draft.customQuoteRules.distanceExceededMessage = textOrNull(event.target.value) })} /></Field>
            </>
          ) : null}
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="Money decimals"><NumberInput value={value.rounding.moneyScale} onChange={(next) => update((draft) => { draft.rounding.moneyScale = next as number })} /></Field>
            <Field label="Money rounding"><RoundingSelect value={value.rounding.moneyRoundingMode} onChange={(mode) => update((draft) => { draft.rounding.moneyRoundingMode = mode })} /></Field>
            <Field label="Measurement decimals"><NumberInput value={value.rounding.measurementScale} onChange={(next) => update((draft) => { draft.rounding.measurementScale = next as number })} /></Field>
            <Field label="Measurement rounding"><RoundingSelect value={value.rounding.measurementRoundingMode} onChange={(mode) => update((draft) => { draft.rounding.measurementRoundingMode = mode })} /></Field>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function RoundingSelect({
  value,
  onChange,
}: {
  value: CreatePricingV2Request["rounding"]["moneyRoundingMode"]
  onChange: (value: "HALF_UP" | "CEILING" | "FLOOR") => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="HALF_UP">Half up</SelectItem>
        <SelectItem value="CEILING">Ceiling</SelectItem>
        <SelectItem value="FLOOR">Floor</SelectItem>
      </SelectContent>
    </Select>
  )
}

function PercentageBaseSelect({
  value,
  onChange,
}: {
  value: "SUBTOTAL" | "BASE_PACKAGE_PRICE" | "DISTANCE_CHARGE" | "PRE_TAX_TOTAL"
  onChange: (value: "SUBTOTAL" | "BASE_PACKAGE_PRICE" | "DISTANCE_CHARGE" | "PRE_TAX_TOTAL") => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="SUBTOTAL">Subtotal</SelectItem>
        <SelectItem value="BASE_PACKAGE_PRICE">Base package price</SelectItem>
        <SelectItem value="DISTANCE_CHARGE">Distance charge</SelectItem>
        <SelectItem value="PRE_TAX_TOTAL">Pre-tax total</SelectItem>
      </SelectContent>
    </Select>
  )
}
