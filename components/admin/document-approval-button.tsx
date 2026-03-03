"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

type DocumentApprovalButtonProps = {
  endpoint: "/api/driver/license/approve" | "/api/driver/pow/approve"
  payload: Record<string, string>
  label: string
}

export function DocumentApprovalButton({ endpoint, payload, label }: DocumentApprovalButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const onClick = async () => {
    try {
      setLoading(true)
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        toast({
          title: "Not implemented yet",
          description: data?.message || "Approval API is a placeholder for now.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Approval requested",
        description: data?.message || "Placeholder endpoint called successfully.",
      })
    } catch {
      toast({
        title: "Request failed",
        description: "Unable to call placeholder approval endpoint.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="sm" onClick={onClick} disabled={loading}>
      {loading ? "Submitting..." : label}
    </Button>
  )
}
