"use client"

import { useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type DriversFiltersProps = {
  initialFilters: {
    email: string
    name: string
    station: string
    companyName: string
    profileStatus: string
    size: number
  }
}

const PROFILE_STATUS_OPTIONS = [
  "DRIVER_LICENSE_MISSING",
  "PENDING",
  "IN_REVIEW",
  "APPROVED",
  "REJECTED",
]

export function DriversFilters({ initialFilters }: DriversFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [name, setName] = useState(initialFilters.name)
  const [profileStatus, setProfileStatus] = useState(initialFilters.profileStatus || "ALL")
  const [email, setEmail] = useState(initialFilters.email)
  const [station, setStation] = useState(initialFilters.station)
  const [companyName, setCompanyName] = useState(initialFilters.companyName)

  const apply = () => {
    const next = new URLSearchParams(searchParams.toString())
    next.set("page", "0")
    next.set("size", String(initialFilters.size || 20))

    const pairs: Record<string, string> = {
      name: name.trim(),
      profileStatus: profileStatus === "ALL" ? "" : profileStatus,
      email: email.trim(),
      station: station.trim(),
      companyName: companyName.trim(),
    }

    for (const [key, value] of Object.entries(pairs)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }

    router.push(`${pathname}?${next.toString()}`)
  }

  const clear = () => {
    setName("")
    setProfileStatus("ALL")
    setEmail("")
    setStation("")
    setCompanyName("")
    router.push(`${pathname}?page=0&size=${initialFilters.size || 20}`)
  }

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[220px] flex-1 space-y-1">
          <Label htmlFor="filter-name" className="text-xs text-muted-foreground">
            Search name
          </Label>
          <Input
            id="filter-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="First or last name"
            className="h-9"
          />
        </div>

        <div className="w-[190px] space-y-1">
          <Label className="text-xs text-muted-foreground">Profile status</Label>
          <Select value={profileStatus} onValueChange={setProfileStatus}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {PROFILE_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="button" size="sm" onClick={apply}>
          Apply
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={clear}>
          Clear
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" size="sm" variant="outline">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              More filters
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[320px] space-y-3">
            <div className="space-y-1">
              <Label htmlFor="filter-email" className="text-xs text-muted-foreground">
                Email
              </Label>
              <Input
                id="filter-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="filter-station" className="text-xs text-muted-foreground">
                Station
              </Label>
              <Input
                id="filter-station"
                value={station}
                onChange={(e) => setStation(e.target.value)}
                placeholder="Station"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="filter-company" className="text-xs text-muted-foreground">
                Company name
              </Label>
              <Input
                id="filter-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company"
                className="h-9"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button type="button" size="sm" variant="outline" onClick={clear}>
                Clear
              </Button>
              <Button type="button" size="sm" onClick={apply}>
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
