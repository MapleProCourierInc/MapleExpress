"use client"

import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

  const [email, setEmail] = useState(initialFilters.email)
  const [name, setName] = useState(initialFilters.name)
  const [station, setStation] = useState(initialFilters.station)
  const [companyName, setCompanyName] = useState(initialFilters.companyName)
  const [profileStatus, setProfileStatus] = useState(initialFilters.profileStatus || "ALL")

  const apply = () => {
    const next = new URLSearchParams(searchParams.toString())
    next.set("page", "0")
    next.set("size", String(initialFilters.size || 20))

    const pairs: Record<string, string> = {
      email: email.trim(),
      name: name.trim(),
      station: station.trim(),
      companyName: companyName.trim(),
      profileStatus: profileStatus === "ALL" ? "" : profileStatus,
    }

    for (const [key, value] of Object.entries(pairs)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }

    router.push(`${pathname}?${next.toString()}`)
  }

  const clear = () => {
    setEmail("")
    setName("")
    setStation("")
    setCompanyName("")
    setProfileStatus("ALL")
    router.push(`${pathname}?page=0&size=${initialFilters.size || 20}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="filter-email">Email</Label>
            <Input id="filter-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-name">Name</Label>
            <Input id="filter-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="First or last name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-station">Station</Label>
            <Input id="filter-station" value={station} onChange={(e) => setStation(e.target.value)} placeholder="Station" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-company">Company Name</Label>
            <Input id="filter-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company" />
          </div>

          <div className="space-y-2">
            <Label>Profile Status</Label>
            <Select value={profileStatus} onValueChange={setProfileStatus}>
              <SelectTrigger>
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
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" onClick={apply}>Apply</Button>
          <Button type="button" variant="outline" onClick={clear}>Clear</Button>
        </div>
      </CardContent>
    </Card>
  )
}
