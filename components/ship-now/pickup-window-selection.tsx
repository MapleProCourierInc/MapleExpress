"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, Loader2, RefreshCw, Zap } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { atlanticDate, formatAtlanticRfc3339, formatAtlanticTime } from "@/lib/halifax-datetime"
import { cn } from "@/lib/utils"
import type {
  NextSevenDaysWorkingHoursResponse,
  PickupWindowSelection,
  WorkingHoursDayResponse,
} from "@/types/working-hours"

type PickupSlot = {
  startDateTime: string
  endDateTime: string
  label: string
}

type Props = {
  selection: PickupWindowSelection
  onChange: (selection: PickupWindowSelection) => void
  onNext: () => void
  onBack: () => void
}

const HOUR_MS = 60 * 60 * 1000

function slotsForDay(day: WorkingHoursDayResponse, schedule: NextSevenDaysWorkingHoursResponse): PickupSlot[] {
  if (day.closed || !day.opensAt || !day.closesAt) return []

  const opensAt = new Date(day.opensAt)
  const closesAt = new Date(day.closesAt)
  if (Number.isNaN(opensAt.getTime()) || Number.isNaN(closesAt.getTime())) return []

  let cursor = opensAt.getTime()
  const latestPickupEnd = closesAt.getTime() - HOUR_MS
  const referenceTime = Math.max(new Date(schedule.generatedAt).getTime(), Date.now())
  const scheduleToday = atlanticDate(new Date(referenceTime))

  if (day.date === scheduleToday) {
    const earliestStart = Math.ceil((referenceTime + HOUR_MS) / HOUR_MS) * HOUR_MS
    while (cursor < earliestStart) cursor += HOUR_MS
  }

  const slots: PickupSlot[] = []
  while (cursor + HOUR_MS <= latestPickupEnd) {
    const start = new Date(cursor)
    const end = new Date(cursor + HOUR_MS)
    slots.push({
      startDateTime: formatAtlanticRfc3339(start),
      endDateTime: formatAtlanticRfc3339(end),
      label: `${formatAtlanticTime(start)} – ${formatAtlanticTime(end)}`,
    })
    cursor += HOUR_MS
  }
  return slots
}

function formatDateLabel(date: string, part: "weekday" | "monthDay") {
  const value = new Date(`${date}T12:00:00Z`)
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Halifax",
    ...(part === "weekday" ? { weekday: "short" } : { month: "short", day: "numeric" }),
  }).format(value)
}

export function PickupWindowSelection({ selection, onChange, onNext, onBack }: Props) {
  const [schedule, setSchedule] = useState<NextSevenDaysWorkingHoursResponse | null>(null)
  const [activeDate, setActiveDate] = useState(selection.type === "SCHEDULED" ? selection.date : "")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const loadSchedule = async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch("/api/platform-configuration/working-hours", { cache: "no-store" })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.message || "Pickup times could not be loaded.")
      }
      const nextSchedule = data as NextSevenDaysWorkingHoursResponse
      setSchedule(nextSchedule)
      setActiveDate((current) => {
        if (current && nextSchedule.days.some((day) => day.date === current)) return current
        return nextSchedule.days.find((day) => slotsForDay(day, nextSchedule).length > 0)?.date || nextSchedule.days[0]?.date || ""
      })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Pickup times could not be loaded.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSchedule()
  }, [])

  const daysWithSlots = useMemo(() => {
    if (!schedule) return new Map<string, PickupSlot[]>()
    return new Map(schedule.days.map((day) => [day.date, slotsForDay(day, schedule)]))
  }, [schedule])
  const activeDay = schedule?.days.find((day) => day.date === activeDate)
  const activeSlots = activeDate ? daysWithSlots.get(activeDate) || [] : []

  return (
    <div className="space-y-7">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-wine-soft text-primary">
          <CalendarDays className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-bold">Choose a Pickup Time</h1>
        <p className="mt-2 text-muted-foreground">Send it as soon as possible or reserve a one-hour pickup window.</p>
      </div>

      <button
        type="button"
        onClick={() => onChange({ type: "ASAP" })}
        className={cn(
          "flex w-full items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all",
          selection.type === "ASAP" ? "border-primary bg-brand-wine-soft/60 shadow-sm" : "border-border bg-white hover:border-primary/35",
        )}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white"><Zap className="h-5 w-5" /></span>
        <span className="flex-1">
          <span className="block font-bold">Earliest Available Pickup</span>
          <span className="mt-1 block text-sm text-muted-foreground">Dispatch as soon as your order is confirmed.</span>
        </span>
        <span className={cn("flex h-6 w-6 items-center justify-center rounded-full border", selection.type === "ASAP" ? "border-primary bg-primary text-white" : "border-muted-foreground/30")}>
          {selection.type === "ASAP" && <Check className="h-4 w-4" />}
        </span>
      </button>

      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">or schedule ahead</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border bg-muted/20 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading pickup availability…
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error} You can still choose the earliest available pickup.</span>
            <Button type="button" size="sm" variant="outline" onClick={() => void loadSchedule()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : schedule ? (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {schedule.days.map((day) => {
              const slots = daysWithSlots.get(day.date) || []
              const unavailable = day.closed || slots.length === 0
              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={unavailable}
                  onClick={() => {
                    setActiveDate(day.date)
                    if (selection.type === "SCHEDULED" && selection.date !== day.date) onChange({ type: "ASAP" })
                  }}
                  className={cn(
                    "relative rounded-xl border px-2 py-3 text-center transition-colors",
                    activeDate === day.date && !unavailable ? "border-primary bg-primary text-white" : "bg-white hover:border-primary/40",
                    unavailable && "cursor-not-allowed bg-muted/40 text-muted-foreground opacity-70",
                  )}
                >
                  <span className="block text-xs font-semibold uppercase">{formatDateLabel(day.date, "weekday")}</span>
                  <span className="mt-1 block text-sm font-bold">{formatDateLabel(day.date, "monthDay")}</span>
                  <span className="mt-1 block text-[10px]">{day.closed ? "Closed" : slots.length ? `${slots.length} times` : "Full"}</span>
                  {day.specialHours && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-brand-maple ring-2 ring-white" title="Special hours" />}
                </button>
              )
            })}
          </div>

          {activeDay && (
            <Card className="overflow-hidden border-primary/10 shadow-none">
              <div className="flex items-center justify-between gap-3 border-b bg-brand-maple-soft/55 px-5 py-4">
                <div>
                  <p className="font-bold">{new Intl.DateTimeFormat("en-CA", { timeZone: "America/Halifax", weekday: "long", month: "long", day: "numeric" }).format(new Date(`${activeDay.date}T12:00:00Z`))}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Atlantic time</p>
                </div>
                {activeDay.specialHours && <Badge variant="outline" className="border-brand-maple/50 bg-white text-brand-rust">Special hours</Badge>}
              </div>
              <CardContent className="p-5">
                {activeSlots.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {activeSlots.map((slot) => {
                      const selected = selection.type === "SCHEDULED" && selection.startDateTime === slot.startDateTime
                      return (
                        <button
                          key={slot.startDateTime}
                          type="button"
                          onClick={() => onChange({ type: "SCHEDULED", date: activeDay.date, startDateTime: slot.startDateTime, endDateTime: slot.endDateTime })}
                          className={cn(
                            "flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all",
                            selected ? "border-primary bg-brand-wine-soft text-primary" : "border-border bg-white hover:border-primary/35",
                          )}
                        >
                          <Clock3 className="h-4 w-4" /> {slot.label}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="py-5 text-center text-sm text-muted-foreground">No pickup windows remain for this date.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

      <div className="flex justify-between border-t pt-5">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        <Button onClick={onNext} disabled={!selection}><span>Continue</span><ArrowRight className="ml-2 h-4 w-4" /></Button>
      </div>
    </div>
  )
}
