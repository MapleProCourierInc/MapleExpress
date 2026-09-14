export const PHONE_NUMBER_LENGTH = 10
export const PHONE_NUMBER_VALIDATION_MESSAGE = "Phone number must be exactly 10 digits."

export function getPhoneDigits(value: unknown): string {
  return typeof value === "string" ? value.replace(/\D/g, "") : ""
}

export function normalizePhoneInput(value: string): string {
  return getPhoneDigits(value).slice(0, PHONE_NUMBER_LENGTH)
}

export function isValidPhoneNumber(value: unknown): boolean {
  return typeof value === "string" && /^\d{10}$/.test(value.trim())
}

export function isValidOptionalPhoneNumber(value: unknown): boolean {
  return value == null || (typeof value === "string" && (value.trim() === "" || isValidPhoneNumber(value)))
}
