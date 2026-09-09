"use client"

import { useMemo, useState } from "react"
import { CalendarClock, CalendarPlus, CheckCircle2, Clock3, Loader2, LockKeyhole, Pencil, RefreshCw, Save, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { addDaysToDate, atlanticDate, atlanticLocalDateTime, nextAtlanticDateForDay } from "@/lib/halifax-datetime"
import type { PlatformConfigurationApiError } from "@/types/admin-platform-configuration"
import {
  WORKING_HOURS_DAYS,
  type AdminWorkingHoursResponse,
  type CreateSpecialWorkingHoursRequest,
  type UpdateRegularWorkingHoursRequest,
  type SpecialWorkingHoursResponse,
  type WorkingHoursDayOfWeek,
} from "@/types/working-hours"

type DayForm = { closed: boolean; opensAt: string; closesAt: string }
type RegularForm = Record<WorkingHoursDayOfWeek, DayForm>
type SpecialForm = { date: string; description: string; closed: boolean; opensAt: string; closesAt: string }

type Props = {
  initialData: AdminWorkingHoursResponse | null
  initialError?: PlatformConfigurationApiError | null
}

const DAY_LABELS: Record<WorkingHoursDayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
}

function timeInputValue(value?: string | null) {
  const match = /^(\d{2}):(\d{2})/.exec(value || "")
  return match ? `${match[1]}:${match[2]}` : ""
}

function defaultRegularForm(): RegularForm {
  return Object.fromEntries(
    WORKING_HOURS_DAYS.map((day) => [
      day,
      day === "SATURDAY" || day === "SUNDAY"
        ? { closed: true, opensAt: "", closesAt: "" }
        : { closed: false, opensAt: "09:00", closesAt: "17:00" },
    ]),
  ) as RegularForm
}

function regularFormFromData(data: AdminWorkingHoursResponse | null): RegularForm {
  const form = defaultRegularForm()
  WORKING_HOURS_DAYS.forEach((day) => {
    const hours = data?.regularHours?.[day]
    if (!hours) return
    form[day] = {
      closed: hours.closed,
      opensAt: timeInputValue(hours.opensAt),
      closesAt: timeInputValue(hours.closesAt),
    }
  })
  return form
}

function emptySpecialForm(): SpecialForm {
  return { date: "", description: "", closed: true, opensAt: "", closesAt: "" }
}

function specialFormFromData(value: SpecialWorkingHoursResponse): SpecialForm {
  return {
    date: value.date,
    description: value.description || "",
    closed: value.closed,
    opensAt: timeInputValue(value.opensAt),
    closesAt: timeInputValue(value.closesAt),
  }
}

async function responseMessage(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null) as PlatformConfigurationApiError | null
  const details = payload?.errors?.map((error) => error.message).filter(Boolean).join(" ")
  return [payload?.message || fallback, details].filter(Boolean).join(" ")
}

function validateHours(form: { closed: boolean; opensAt: string; closesAt: string }) {
  if (form.closed) return ""
  if (!form.opensAt || !form.closesAt) return "Opening and closing times are required for open days."
  if (form.opensAt >= form.closesAt) return "Closing time must be later than opening time."
  return ""
}

function specialPayload(form: SpecialForm): CreateSpecialWorkingHoursRequest {
  return {
    date: form.date,
    description: form.description.trim() || null,
    closed: form.closed,
    ...(form.closed
      ? {}
      : {
          opensAt: atlanticLocalDateTime(form.date, form.opensAt),
          closesAt: atlanticLocalDateTime(form.date, form.closesAt),
        }),
  }
}

export function AdminWorkingHoursManager({ initialData, initialError }: Props) {
  const { toast } = useToast()
  const [workingHours, setWorkingHours] = useState(initialData)
  const [regularForm, setRegularForm] = useState(() => regularFormFromData(initialData))
  const [specialForm, setSpecialForm] = useState<SpecialForm>(() => emptySpecialForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingForm, setEditingForm] = useState<SpecialForm>(() => emptySpecialForm())
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(initialError?.message || "")

  const regularIsConfigured = WORKING_HOURS_DAYS.every((day) => Boolean(workingHours?.regularHours?.[day]))
  const specialHours = useMemo(
    () => [...(workingHours?.specialHours || [])].sort((left, right) => left.date.localeCompare(right.date)),
    [workingHours],
  )
  const tomorrow = addDaysToDate(atlanticDate(), 1)

  const refresh = async (silent = false) => {
    if (!silent) setBusyAction("refresh")
    try {
      const response = await fetch("/api/admin/platform-configuration/working-hours", { cache: "no-store" })
      if (!response.ok) throw new Error(await responseMessage(response, "Working hours could not be loaded."))
      const data = await response.json() as AdminWorkingHoursResponse
      setWorkingHours(data)
      setRegularForm(regularFormFromData(data))
      setLoadError("")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Working hours could not be loaded."
      setLoadError(message)
      if (!silent) toast({ title: "Unable to refresh working hours", description: message, variant: "destructive" })
    } finally {
      if (!silent) setBusyAction(null)
    }
  }

  const saveRegularHours = async () => {
    for (const day of WORKING_HOURS_DAYS) {
      const error = validateHours(regularForm[day])
      if (error) {
        toast({ title: `${DAY_LABELS[day]} needs attention`, description: error, variant: "destructive" })
        return
      }
    }

    let regularHours: UpdateRegularWorkingHoursRequest["regularHours"]
    try {
      regularHours = Object.fromEntries(
        WORKING_HOURS_DAYS.map((day) => {
          const value = regularForm[day]
          const representativeDate = nextAtlanticDateForDay(day)
          return [
            day,
            value.closed
              ? { closed: true, opensAt: null, closesAt: null }
              : {
                  closed: false,
                  opensAt: atlanticLocalDateTime(representativeDate, value.opensAt),
                  closesAt: atlanticLocalDateTime(representativeDate, value.closesAt),
                },
          ]
        }),
      ) as UpdateRegularWorkingHoursRequest["regularHours"]
    } catch (error) {
      toast({
        title: "Unable to format working hours",
        description: error instanceof Error ? error.message : "Please review the selected times.",
        variant: "destructive",
      })
      return
    }

    setBusyAction("regular")
    try {
      const response = await fetch("/api/admin/platform-configuration/working-hours/regular", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regularHours }),
      })
      if (!response.ok) throw new Error(await responseMessage(response, "Regular working hours could not be saved."))
      const data = await response.json() as AdminWorkingHoursResponse
      setWorkingHours(data)
      setRegularForm(regularFormFromData(data))
      setLoadError("")
      toast({ title: "Regular working hours saved" })
    } catch (error) {
      toast({ title: "Unable to save regular hours", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" })
    } finally {
      setBusyAction(null)
    }
  }

  const createSpecialHours = async () => {
    if (!specialForm.date || specialForm.date < tomorrow) {
      toast({ title: "Choose a future date", description: "Special working hours can be created from tomorrow onward.", variant: "destructive" })
      return
    }
    const hoursError = validateHours(specialForm)
    if (hoursError) {
      toast({ title: "Special hours need attention", description: hoursError, variant: "destructive" })
      return
    }

    setBusyAction("special-create")
    try {
      const response = await fetch("/api/admin/platform-configuration/working-hours/special", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(specialPayload(specialForm)),
      })
      if (!response.ok) throw new Error(await responseMessage(response, "Special working hours could not be created."))
      setSpecialForm(emptySpecialForm())
      await refresh(true)
      toast({ title: "Special working hours added" })
    } catch (error) {
      toast({ title: "Unable to add special hours", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" })
    } finally {
      setBusyAction(null)
    }
  }

  const updateSpecialHours = async () => {
    if (!editingId || !editingForm.date) return
    const hoursError = validateHours(editingForm)
    if (hoursError) {
      toast({ title: "Special hours need attention", description: hoursError, variant: "destructive" })
      return
    }

    setBusyAction(`special-update-${editingId}`)
    try {
      const response = await fetch(`/api/admin/platform-configuration/working-hours/special/${encodeURIComponent(editingId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(specialPayload(editingForm)),
      })
      if (!response.ok) throw new Error(await responseMessage(response, "Special working hours could not be updated."))
      setEditingId(null)
      await refresh(true)
      toast({ title: "Special working hours updated" })
    } catch (error) {
      toast({ title: "Unable to update special hours", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" })
    } finally {
      setBusyAction(null)
    }
  }

  const deleteSpecialHours = async (entry: SpecialWorkingHoursResponse) => {
    if (!window.confirm(`Remove the special working hours for ${entry.date}?`)) return
    setBusyAction(`special-delete-${entry.specialWorkingHoursId}`)
    try {
      const response = await fetch(`/api/admin/platform-configuration/working-hours/special/${encodeURIComponent(entry.specialWorkingHoursId)}`, { method: "DELETE" })
      if (!response.ok) throw new Error(await responseMessage(response, "Special working hours could not be removed."))
      await refresh(true)
      toast({ title: "Special working hours removed" })
    } catch (error) {
      toast({ title: "Unable to remove special hours", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" })
    } finally {
      setBusyAction(null)
    }
  }

  const specialFields = (form: SpecialForm, setForm: (value: SpecialForm) => void, prefix: string) => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-date`}>Date</Label>
        <Input id={`${prefix}-date`} type="date" min={tomorrow} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
      </div>
      <div className="space-y-2 md:col-span-1 xl:col-span-2">
        <Label htmlFor={`${prefix}-description`}>Description</Label>
        <Input id={`${prefix}-description`} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Holiday, event, or schedule note" />
      </div>
      <div className="flex items-center gap-3 rounded-md border px-4 py-3">
        <Switch id={`${prefix}-open`} checked={!form.closed} onCheckedChange={(open) => setForm({ ...form, closed: !open })} />
        <Label htmlFor={`${prefix}-open`}>{form.closed ? "Closed all day" : "Open with adjusted hours"}</Label>
      </div>
      {!form.closed && (
        <>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-opens`}>Opens</Label>
            <Input id={`${prefix}-opens`} type="time" value={form.opensAt} onChange={(event) => setForm({ ...form, opensAt: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-closes`}>Closes</Label>
            <Input id={`${prefix}-closes`} type="time" value={form.closesAt} onChange={(event) => setForm({ ...form, closesAt: event.target.value })} />
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="space-y-5">
      {loadError && (
        <Alert variant="destructive">
          <AlertTitle>Working hours could not be loaded</AlertTitle>
          <AlertDescription className="mt-2 flex items-center justify-between gap-3">
            <span>{loadError}</span>
            <Button size="sm" variant="outline" onClick={() => void refresh()}><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" /> Regular Working Hours</CardTitle>
            <CardDescription className="mt-2">Set the normal Monday-to-Sunday schedule in Atlantic time. All seven days are saved together; the customer scheduler reserves the final business hour for delivery.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {regularIsConfigured && <Badge className="bg-brand-forest"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Configured</Badge>}
            <Button type="button" size="sm" variant="outline" onClick={() => void refresh()} disabled={Boolean(busyAction)}>
              <RefreshCw className={`mr-2 h-4 w-4 ${busyAction === "refresh" ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {WORKING_HOURS_DAYS.map((day) => {
            const value = regularForm[day]
            return (
              <div key={day} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[130px_150px_1fr] sm:items-center">
                <div className="font-semibold">{DAY_LABELS[day]}</div>
                <div className="flex items-center gap-2">
                  <Switch
                    id={`regular-${day}`}
                    checked={!value.closed}
                    onCheckedChange={(open) => setRegularForm((current) => ({ ...current, [day]: { ...current[day], closed: !open } }))}
                  />
                  <Label htmlFor={`regular-${day}`} className={value.closed ? "text-muted-foreground" : "text-brand-forest"}>{value.closed ? "Closed" : "Open"}</Label>
                </div>
                {!value.closed ? (
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <Input aria-label={`${DAY_LABELS[day]} opening time`} type="time" value={value.opensAt} onChange={(event) => setRegularForm((current) => ({ ...current, [day]: { ...current[day], opensAt: event.target.value } }))} />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input aria-label={`${DAY_LABELS[day]} closing time`} type="time" value={value.closesAt} onChange={(event) => setRegularForm((current) => ({ ...current, [day]: { ...current[day], closesAt: event.target.value } }))} />
                  </div>
                ) : <p className="text-sm text-muted-foreground">No pickups are offered.</p>}
              </div>
            )
          })}
          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">Offsets are calculated for America/Halifax when the schedule is saved.</p>
            <Button onClick={() => void saveRegularHours()} disabled={busyAction === "regular"}>
              {busyAction === "regular" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Regular Hours
            </Button>
          </div>
        </CardContent>
      </Card>

      {!regularIsConfigured ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><LockKeyhole className="h-5 w-5" /></span>
            <h3 className="mt-4 text-lg font-bold">Set regular hours first</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Save the complete Monday-to-Sunday schedule before adding holidays, events, or other date-specific changes.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarPlus className="h-5 w-5 text-primary" /> Add Special Working Hours</CardTitle>
              <CardDescription>Create a future one-day closure or override the regular opening and closing times.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {specialFields(specialForm, setSpecialForm, "special-new")}
              <div className="flex justify-end border-t pt-4">
                <Button onClick={() => void createSpecialHours()} disabled={busyAction === "special-create"}>
                  {busyAction === "special-create" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
                  Add Special Date
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Special Dates</CardTitle>
              <CardDescription>Future exceptions override the regular schedule for their date.</CardDescription>
            </CardHeader>
            <CardContent>
              {specialHours.length ? (
                <div className="space-y-3">
                  {specialHours.map((entry) => {
                    const editing = editingId === entry.specialWorkingHoursId
                    const busy = busyAction?.endsWith(entry.specialWorkingHoursId)
                    return (
                      <div key={entry.specialWorkingHoursId} className="rounded-xl border p-4">
                        {editing ? (
                          <div className="space-y-5">
                            {specialFields(editingForm, setEditingForm, `special-${entry.specialWorkingHoursId}`)}
                            <div className="flex justify-end gap-2 border-t pt-4">
                              <Button variant="outline" onClick={() => setEditingId(null)} disabled={busy}>Cancel</Button>
                              <Button onClick={() => void updateSpecialHours()} disabled={busy}>
                                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Changes
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-maple-soft text-brand-rust"><Clock3 className="h-5 w-5" /></span>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-bold">{new Intl.DateTimeFormat("en-CA", { timeZone: "America/Halifax", weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(`${entry.date}T12:00:00Z`))}</p>
                                  <Badge variant={entry.closed ? "secondary" : "outline"}>{entry.closed ? "Closed" : `${timeInputValue(entry.opensAt)} – ${timeInputValue(entry.closesAt)}`}</Badge>
                                </div>
                                {entry.description && <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => { setEditingId(entry.specialWorkingHoursId); setEditingForm(specialFormFromData(entry)) }} disabled={busy}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
                              <Button variant="outline" size="sm" className="text-destructive" onClick={() => void deleteSpecialHours(entry)} disabled={busy}>{busyAction === `special-delete-${entry.specialWorkingHoursId}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Remove</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed py-10 text-center">
                  <CalendarClock className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-semibold">No special dates configured</p>
                  <p className="mt-1 text-sm text-muted-foreground">The regular weekly schedule currently applies to every future date.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
