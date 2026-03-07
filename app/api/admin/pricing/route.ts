import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createAdminPricingModel, getAdminPricingModels } from "@/lib/admin-pricing-service"
import type { CreatePricingModelRequest, PricingModel } from "@/types/pricing"

const DEFAULT_DIMENSIONAL_WEIGHT_UNIT = "cm3/kg"

function normalizeNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function normalizeTax(tax: unknown) {
  const row = (tax || {}) as Record<string, unknown>
  return {
    taxType: String(row.taxType || "").trim(),
    taxRate: normalizeNumber(row.taxRate),
  }
}

function validatePayload(raw: Record<string, unknown>) {
  const payload: CreatePricingModelRequest = {
    basePrice: normalizeNumber(raw.basePrice),
    distanceCharge: {
      ratePerKm: normalizeNumber((raw.distanceCharge as Record<string, unknown> | undefined)?.ratePerKm),
    },
    weightCharge: {
      ratePerKg: normalizeNumber((raw.weightCharge as Record<string, unknown> | undefined)?.ratePerKg),
    },
    dimensionalWeightCharge: {
      ratePerKg: normalizeNumber((raw.dimensionalWeightCharge as Record<string, unknown> | undefined)?.ratePerKg),
      conversionFactor: normalizeNumber((raw.dimensionalWeightCharge as Record<string, unknown> | undefined)?.conversionFactor),
      unit: DEFAULT_DIMENSIONAL_WEIGHT_UNIT,
    },
    prioritySurcharge: {
      calculationMethod: String((raw.prioritySurcharge as Record<string, unknown> | undefined)?.calculationMethod || "").trim() as PricingModel["prioritySurcharge"]["calculationMethod"],
      surcharge: normalizeNumber((raw.prioritySurcharge as Record<string, unknown> | undefined)?.surcharge),
    },
    taxes: Array.isArray(raw.taxes) ? raw.taxes.map(normalizeTax) : [],
    isLatest: Boolean(raw.isLatest),
  }

  const errors: Array<{ field: string; message: string }> = []
  if (!Number.isFinite(payload.basePrice)) errors.push({ field: "basePrice", message: "Enter a valid number" })
  if (!Number.isFinite(payload.distanceCharge.ratePerKm)) errors.push({ field: "distanceCharge.ratePerKm", message: "Enter a valid number" })
  if (!Number.isFinite(payload.weightCharge.ratePerKg)) errors.push({ field: "weightCharge.ratePerKg", message: "Enter a valid number" })
  if (!Number.isFinite(payload.dimensionalWeightCharge.ratePerKg)) errors.push({ field: "dimensionalWeightCharge.ratePerKg", message: "Enter a valid number" })
  if (!Number.isFinite(payload.dimensionalWeightCharge.conversionFactor)) errors.push({ field: "dimensionalWeightCharge.conversionFactor", message: "Enter a valid number" })
  if (!["percentage", "flat", "Percentage", "Flat"].includes(payload.prioritySurcharge.calculationMethod)) {
    errors.push({ field: "prioritySurcharge.calculationMethod", message: "Invalid calculation method" })
  }
  if (!Number.isFinite(payload.prioritySurcharge.surcharge)) errors.push({ field: "prioritySurcharge.surcharge", message: "Enter a valid number" })

  if (!payload.taxes.length) {
    errors.push({ field: "taxes", message: "At least one tax row is required" })
  }

  payload.taxes.forEach((tax, index) => {
    if (!tax.taxType) errors.push({ field: `taxes.${index}.taxType`, message: "Required" })
    if (!Number.isFinite(tax.taxRate)) errors.push({ field: `taxes.${index}.taxRate`, message: "Enter a valid number" })
  })

  return { payload, errors }
}

export async function GET() {
  const result = await getAdminPricingModels()

  if (!result.data) {
    const status = Number(result.error?.status) || 400
    return NextResponse.json(result.error ?? { message: "Failed to fetch pricing" }, { status })
  }

  return NextResponse.json(result.data)
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const { payload, errors } = validatePayload(body)

  if (errors.length) {
    return NextResponse.json(
      {
        message: "Please review the pricing form values.",
        errors,
      },
      { status: 400 },
    )
  }

  const result = await createAdminPricingModel(payload)

  if (!result.data) {
    const status = Number(result.error?.status) || 400
    return NextResponse.json(result.error ?? { message: "Failed to create pricing model" }, { status })
  }

  revalidatePath("/admin/pricing")
  return NextResponse.json(result.data)
}
