export const WORKING_HOURS_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const

export type WorkingHoursDayOfWeek = (typeof WORKING_HOURS_DAYS)[number]

export type RegularWorkingHoursResponse = {
  closed: boolean
  opensAt?: string | null
  closesAt?: string | null
}

export type SpecialWorkingHoursResponse = {
  specialWorkingHoursId: string
  date: string
  description?: string | null
  closed: boolean
  opensAt?: string | null
  closesAt?: string | null
  createdAt?: string | null
  createdBy?: string | null
  updatedAt?: string | null
  updatedBy?: string | null
}

export type AdminWorkingHoursResponse = {
  timeZone?: string | null
  regularHours?: Partial<Record<WorkingHoursDayOfWeek, RegularWorkingHoursResponse>> | null
  specialHours?: SpecialWorkingHoursResponse[] | null
}

export type WorkingHoursDayResponse = {
  date: string
  dayOfWeek: WorkingHoursDayOfWeek
  closed: boolean
  opensAt?: string | null
  closesAt?: string | null
  specialHours?: boolean
  description?: string | null
}

export type NextSevenDaysWorkingHoursResponse = {
  timeZone?: string | null
  generatedAt: string
  days: WorkingHoursDayResponse[]
}

export type DayWorkingHoursRequest = {
  closed: boolean
  opensAt?: string | null
  closesAt?: string | null
}

export type UpdateRegularWorkingHoursRequest = {
  regularHours: Record<WorkingHoursDayOfWeek, DayWorkingHoursRequest>
}

export type CreateSpecialWorkingHoursRequest = {
  date: string
  description?: string | null
  closed: boolean
  opensAt?: string | null
  closesAt?: string | null
}

export type UpdateSpecialWorkingHoursRequest = Partial<CreateSpecialWorkingHoursRequest>

export type PickupWindowSelection =
  | { type: "ASAP" }
  | {
      type: "SCHEDULED"
      date: string
      startDateTime: string
      endDateTime: string
    }
