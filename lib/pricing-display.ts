export type PricingCharges = Record<string, number> | null | undefined

export type PricingTotalSource = {
  totalAmount?: number | null
  charges?: PricingCharges
} | null | undefined

const FINAL_TOTAL_NAMES = new Set(["total", "grandtotal", "ordertotal", "amountdue"])
const SUBTOTAL_NAMES = new Set(["subtotal", "ordersubtotal"])

function normalizedChargeName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "")
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function isTaxCharge(name: string) {
  return /(tax|hst|gst|pst|qst)$/.test(normalizedChargeName(name))
}

export function isFinalTotalCharge(name: string) {
  return FINAL_TOTAL_NAMES.has(normalizedChargeName(name))
}

export function isSubtotalCharge(name: string) {
  return SUBTOTAL_NAMES.has(normalizedChargeName(name))
}

export function finiteChargeEntries(charges?: PricingCharges) {
  return Object.entries(charges ?? {}).filter(
    (entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]),
  )
}

/**
 * Charge maps returned by pricing V2 already contain a final `Total` row.
 * Use that row as the package total instead of adding every map value, because
 * the map also contains derived `Subtotal` and tax rows.
 */
export function resolvePricingTotal(pricing?: PricingTotalSource): number | null {
  const explicitTotal = pricing?.totalAmount
  if (typeof explicitTotal === "number" && Number.isFinite(explicitTotal)) {
    return explicitTotal
  }

  const entries = finiteChargeEntries(pricing?.charges)
  const finalTotal = entries.find(([name]) => isFinalTotalCharge(name))?.[1]
  if (finalTotal !== undefined) return finalTotal

  const subtotal = entries.find(([name]) => isSubtotalCharge(name))?.[1]
  if (subtotal !== undefined) {
    const taxes = entries
      .filter(([name]) => isTaxCharge(name))
      .reduce((sum, [, amount]) => sum + amount, 0)
    return roundMoney(subtotal + taxes)
  }

  return entries.length
    ? roundMoney(entries.reduce((sum, [, amount]) => sum + amount, 0))
    : null
}

/** Removes a charge-map total when the UI renders its own authoritative total row. */
export function pricingBreakdownEntries(charges?: PricingCharges) {
  return finiteChargeEntries(charges).filter(([name]) => !isFinalTotalCharge(name))
}
