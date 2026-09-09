import type { WorkingHoursDayOfWeek } from "@/types/working-hours"

export const ATLANTIC_TIME_ZONE = "America/Halifax"

function partsFor(date: Date, includeOffset = false) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: ATLANTIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    ...(includeOffset ? { timeZoneName: "longOffset" as const } : {}),
  })

  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]))
}

function offsetForInstant(date: Date) {
  const value = partsFor(date, true).timeZoneName
  const match = value ? /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(value) : null
  if (!match) throw new Error("Unable to determine the Atlantic UTC offset")
  const minutes = Number(match[2]) * 60 + Number(match[3] || 0)
  return (match[1] === "-" ? -1 : 1) * minutes
}

function offsetText(minutes: number) {
  const sign = minutes < 0 ? "-" : "+"
  const absolute = Math.abs(minutes)
  return `${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`
}

export function formatAtlanticRfc3339(date: Date) {
  const parts = partsFor(date, true)
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${offsetText(offsetForInstant(date))}`
}

export function atlanticLocalDateTime(date: string, time: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time)
  if (!match || !timeMatch) throw new Error("A valid date and time are required")

  const localAsUtc = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
    Number(timeMatch[3] || 0),
  )
  let offset = offsetForInstant(new Date(localAsUtc))
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const candidate = new Date(localAsUtc - offset * 60_000)
    const candidateOffset = offsetForInstant(candidate)
    if (candidateOffset === offset) break
    offset = candidateOffset
  }

  const second = timeMatch[3] || "00"
  const timestamp = `${date}T${timeMatch[1]}:${timeMatch[2]}:${second}${offsetText(offset)}`
  const roundTrip = partsFor(new Date(timestamp))
  if (
    roundTrip.year !== match[1] ||
    roundTrip.month !== match[2] ||
    roundTrip.day !== match[3] ||
    roundTrip.hour !== timeMatch[1] ||
    roundTrip.minute !== timeMatch[2] ||
    roundTrip.second !== second
  ) {
    throw new Error("The selected local time is not valid in America/Halifax for this date")
  }

  return timestamp
}

export function atlanticDate(date = new Date()) {
  const parts = partsFor(date)
  return `${parts.year}-${parts.month}-${parts.day}`
}

function formatUtcDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`
}

export function addDaysToDate(date: string, days: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) throw new Error("A valid calendar date is required")
  const result = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days, 12))
  return formatUtcDate(result)
}

export function nextAtlanticDateForDay(day: WorkingHoursDayOfWeek) {
  const names: WorkingHoursDayOfWeek[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]
  const today = atlanticDate()
  const anchor = new Date(`${today}T12:00:00Z`)
  const target = names.indexOf(day)
  const daysUntilNextMonday = ((1 - anchor.getUTCDay() + 7) % 7) || 7
  const dayOffsetFromMonday = (target - 1 + 7) % 7
  return addDaysToDate(today, daysUntilNextMonday + dayOffsetFromMonday)
}

export function formatAtlanticTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ATLANTIC_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}
