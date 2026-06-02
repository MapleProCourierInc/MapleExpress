import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createAdminPricingModel, getAdminPricingModels } from "@/lib/admin-pricing-service"
import type { CreatePricingV2Request, PricingApiError } from "@/types/pricing"

function errorResponse(error: PricingApiError | null, fallback: string) {
  return NextResponse.json(error ?? { message: fallback }, { status: Number(error?.status) || 400 })
}

function validatePayload(raw: Record<string, unknown>) {
  const errors: Array<{ field: string; message: string }> = []
  const payload = raw as unknown as CreatePricingV2Request
  const add = (field: string, message: string) => errors.push({ field, message })
  const nonNegative = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0
  const duplicates = (values: unknown[]) => new Set(values).size !== values.length

  if (!String(payload.name || "").trim()) add("name", "Name is required")
  if (payload.status !== "DRAFT") add("status", "Create pricing models as DRAFT; use the activation action after quote testing")
  if (!["GLOBAL", "CUSTOMER_SPECIFIC"].includes(payload.pricingType)) add("pricingType", "Select a pricing type")
  if (payload.pricingType === "CUSTOMER_SPECIFIC" && !String(payload.ownerId || "").trim()) add("ownerId", "Owner ID is required for customer-specific pricing")
  if (!String(payload.zoneCode || "").trim()) add("zoneCode", "Zone code is required")
  if (!String(payload.currency || "").trim()) add("currency", "Currency is required")
  if (!payload.dimensionalWeight || (payload.dimensionalWeight.enabled && !(Number(payload.dimensionalWeight.divisor) > 0))) add("dimensionalWeight.divisor", "Enabled dimensional weight requires a divisor greater than zero")
  if (payload.dimensionalWeight && !nonNegative(payload.dimensionalWeight.roundingScale)) add("dimensionalWeight.roundingScale", "Dimensional rounding scale must be zero or greater")
  if (!payload.chargeableWeight) add("chargeableWeight", "Chargeable weight configuration is required")
  if (!payload.distancePricing) add("distancePricing", "Distance pricing configuration is required")

  const packageSlabs = Array.isArray(payload.packageSlabs) ? payload.packageSlabs : []
  if (!packageSlabs.some((slab) => slab.enabled)) add("packageSlabs", "Add at least one enabled package slab")
  if (duplicates(packageSlabs.map((slab) => slab.slabCode))) add("packageSlabs", "Package slab codes must be unique")
  if (duplicates(packageSlabs.map((slab) => slab.tierOrder))) add("packageSlabs", "Package tier orders must be unique")
  packageSlabs.forEach((slab, index) => {
    if (!String(slab.slabCode || "").trim() || !String(slab.displayName || "").trim()) add(`packageSlabs.${index}`, "Each package slab needs a code and display name")
    if (!Number.isInteger(slab.tierOrder)) add(`packageSlabs.${index}.tierOrder`, "Tier order must be an integer")
    if (!nonNegative(slab.basePrice)) add(`packageSlabs.${index}.basePrice`, "Base price must be zero or greater")
  })
  const enabledPackageSlabs = packageSlabs.filter((slab) => slab.enabled).sort((a, b) => a.tierOrder - b.tierOrder)
  enabledPackageSlabs.slice(1).forEach((slab, index) => {
    const previous = enabledPackageSlabs[index]
    if (slab.minChargeableWeightKgExclusive !== previous.maxChargeableWeightKg) add("packageSlabs", "Enabled package weight ranges must be sequential without gaps or overlaps")
    if (slab.minDimensionSumCmExclusive !== previous.maxDimensionSumCm) add("packageSlabs", "Enabled package dimension ranges must be sequential without gaps or overlaps")
  })

  if (payload.distancePricing && !nonNegative(payload.distancePricing.includedDistanceKm)) add("distancePricing.includedDistanceKm", "Included distance must be zero or greater")
  const distanceSlabs = Array.isArray(payload.distancePricing?.distanceSlabs) ? payload.distancePricing.distanceSlabs : []
  if (duplicates(distanceSlabs.map((slab) => slab.slabCode))) add("distancePricing.distanceSlabs", "Distance slab codes must be unique")
  distanceSlabs.forEach((slab, index) => {
    if (!String(slab.slabCode || "").trim() || !String(slab.displayName || "").trim()) add(`distancePricing.distanceSlabs.${index}`, "Each distance slab needs a code and display name")
    if (!["FLAT", "PER_KM"].includes(slab.calculationType)) add(`distancePricing.distanceSlabs.${index}.calculationType`, "Use FLAT or PER_KM for distance pricing")
    if (!nonNegative(slab.rate)) add(`distancePricing.distanceSlabs.${index}.rate`, "Rate must be zero or greater")
  })
  const enabledDistanceSlabs = distanceSlabs.filter((slab) => slab.enabled).sort((a, b) => Number(a.fromKmExclusive) - Number(b.fromKmExclusive))
  enabledDistanceSlabs.slice(1).forEach((slab, index) => {
    if (slab.fromKmExclusive !== enabledDistanceSlabs[index].toKmInclusive) add("distancePricing.distanceSlabs", "Enabled distance ranges must be sequential without gaps or overlaps")
  })

  if (duplicates((payload.surcharges || []).map((surcharge) => surcharge.surchargeCode))) add("surcharges", "Surcharge codes must be unique")
  ;(payload.surcharges || []).forEach((surcharge, index) => {
    if (!["FLAT", "PERCENTAGE"].includes(surcharge.calculationType)) add(`surcharges.${index}.calculationType`, "Use FLAT or PERCENTAGE for surcharges")
    if (!["ALWAYS", "SERVICE_TYPE", "TIME_WINDOW"].includes(surcharge.triggerType)) add(`surcharges.${index}.triggerType`, "Unsupported surcharge trigger")
    if (surcharge.triggerType === "SERVICE_TYPE" && !surcharge.triggerValue) add(`surcharges.${index}.triggerValue`, "Service type is required")
    if (surcharge.triggerType === "TIME_WINDOW" && (!surcharge.startTime || !surcharge.endTime)) add(`surcharges.${index}`, "Time-window surcharges require start and end times")
    if (surcharge.calculationType === "FLAT" && !nonNegative(surcharge.amount)) add(`surcharges.${index}.amount`, "Flat surcharges require an amount")
    if (surcharge.calculationType === "PERCENTAGE" && !nonNegative(surcharge.percentage)) add(`surcharges.${index}.percentage`, "Percentage surcharges require a percentage")
  })
  if (duplicates((payload.taxes || []).map((tax) => tax.taxCode))) add("taxes", "Tax codes must be unique")
  ;(payload.taxes || []).forEach((tax, index) => {
    if (tax.calculationType !== "PERCENTAGE") add(`taxes.${index}.calculationType`, "Taxes must use PERCENTAGE")
    if (tax.enabled && !nonNegative(tax.percentage)) add(`taxes.${index}.percentage`, "Enabled taxes require a percentage")
  })
  if (payload.customQuoteRules?.enabled && !nonNegative(payload.customQuoteRules.maxStandardDistanceKm)) add("customQuoteRules.maxStandardDistanceKm", "Enabled custom-quote distance limits must be zero or greater")
  if (payload.rounding && (![payload.rounding.moneyScale, payload.rounding.measurementScale].every(nonNegative))) add("rounding", "Rounding scales must be zero or greater")
  const modes = [payload.dimensionalWeight?.roundingMode, payload.rounding?.moneyRoundingMode, payload.rounding?.measurementRoundingMode]
  if (modes.some((mode) => mode && !["HALF_UP", "CEILING", "FLOOR"].includes(mode))) add("rounding", "Use HALF_UP, CEILING, or FLOOR rounding modes")
  return { payload, errors }
}

export async function GET(request: NextRequest) {
  const result = await getAdminPricingModels(request.nextUrl.searchParams.toString())
  return result.data ? NextResponse.json(result.data) : errorResponse(result.error, "Failed to fetch pricing")
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const { payload, errors } = validatePayload(body)
  if (errors.length) return NextResponse.json({ message: "Please review the highlighted pricing model values.", errors }, { status: 400 })
  const result = await createAdminPricingModel(payload)
  if (!result.data) return errorResponse(result.error, "Failed to create pricing model")
  revalidatePath("/admin/pricing")
  return NextResponse.json(result.data, { status: 201 })
}
