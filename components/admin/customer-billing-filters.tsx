"use client"

import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Props = {
  ownerType: "individual" | "organization"
  initialFilters: {
    email: string
    userId: string
    type: string
    name: string
    industry: string
    size: number
  }
}

export function CustomerBillingFilters({ ownerType, initialFilters }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState(initialFilters.email)
  const [userId, setUserId] = useState(initialFilters.userId)
  const [type, setType] = useState(initialFilters.type)
  const [name, setName] = useState(initialFilters.name)
  const [industry, setIndustry] = useState(initialFilters.industry)

  const apply = () => {
    const next = new URLSearchParams(searchParams.toString())
    next.set("ownerType", ownerType)
    next.set("page", "0")
    next.set("size", String(initialFilters.size || 20))

    const pairs: Record<string, string> = {
      email: email.trim(),
      userId: userId.trim(),
      type: type.trim(),
      name: name.trim(),
      industry: industry.trim(),
    }

    Object.entries(pairs).forEach(([key, value]) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })

    router.push(`${pathname}?${next.toString()}`)
  }

  const clear = () => {
    setEmail("")
    setUserId("")
    setType("")
    setName("")
    setIndustry("")
    router.push(`${pathname}?ownerType=${ownerType}&page=0&size=${initialFilters.size || 20}`)
  }

  const onTypeChange = (value: string) => {
    router.push(`${pathname}?ownerType=${value}&page=0&size=${initialFilters.size || 20}`)
  }

  return (
    <div className="space-y-3 rounded-lg border bg-background p-3">
      <Tabs value={ownerType} onValueChange={onTypeChange}>
        <TabsList>
          <TabsTrigger value="individual">Individuals</TabsTrigger>
          <TabsTrigger value="organization">Organizations</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">User ID</Label>
          <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user id" className="h-9" />
        </div>

        {ownerType === "individual" ? (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="client type" className="h-9" />
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Organization Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="organization" className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Industry</Label>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="industry" className="h-9" />
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={apply}>Apply</Button>
        <Button size="sm" variant="outline" onClick={clear}>Clear</Button>
      </div>
    </div>
  )
}
