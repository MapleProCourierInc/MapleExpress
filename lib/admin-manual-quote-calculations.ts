import type { ManualQuoteChargeRow, ManualQuoteTaxRow } from "@/types/admin-manual-quotes"

function numberFromInput(value: string | number | null | undefined) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(/,/g, ""))
  return Number.isFinite(parsed) ? parsed : 0
}

function toCents(value: string | number | null | undefined) {
  return Math.round(numberFromInput(value) * 100)
}

export function roundMoney(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100
}

export function calculateChargeSubtotal(chargeRows: ManualQuoteChargeRow[]) {
  const cents = chargeRows.reduce((sum, row) => {
    const hasName = row.name.trim().length > 0
    return hasName ? sum + toCents(row.amount) : sum
  }, 0)

  return roundMoney(cents / 100)
}

export function calculateItemSubtotal(itemLine: { charges: ManualQuoteChargeRow[] }) {
  return calculateChargeSubtotal(itemLine.charges)
}

export function calculateSubtotal(
  itemLines: Array<{ charges: ManualQuoteChargeRow[] }>,
  orderLevelChargeRows: ManualQuoteChargeRow[],
) {
  const itemCents = itemLines.reduce((sum, line) => sum + toCents(calculateItemSubtotal(line)), 0)
  const orderCents = toCents(calculateChargeSubtotal(orderLevelChargeRows))

  return roundMoney((itemCents + orderCents) / 100)
}

export function calculateTaxAmount(subtotal: number, rate: string | number) {
  const taxCents = Math.round((toCents(subtotal) * numberFromInput(rate)) / 100)
  return roundMoney(taxCents / 100)
}

export function calculateTotalTax(taxRows: ManualQuoteTaxRow[]) {
  const cents = taxRows.reduce((sum, row) => sum + toCents(row.amount), 0)
  return roundMoney(cents / 100)
}

export function calculateGrandTotal(subtotal: number, taxRows: ManualQuoteTaxRow[]) {
  return roundMoney(subtotal + calculateTotalTax(taxRows))
}

export function toChargesMap(chargeRows: ManualQuoteChargeRow[]) {
  return chargeRows.reduce<Record<string, number>>((charges, row) => {
    const name = row.name.trim()
    if (!name) return charges

    const amount = roundMoney(numberFromInput(row.amount))
    charges[name] = roundMoney((charges[name] ?? 0) + amount)
    return charges
  }, {})
}

export function calculateTaxRows(subtotal: number, taxRows: ManualQuoteTaxRow[]) {
  return taxRows.map((row) => ({
    ...row,
    amount: calculateTaxAmount(subtotal, row.rate),
  }))
}
