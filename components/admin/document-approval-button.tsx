"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  const router = useRouter()

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
          title: "Approval failed",
          description: data?.message || "Unable to approve document.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Approved",
        description: data?.message || "Document approved successfully.",
      })
      router.refresh()
    } catch {
      toast({
        title: "Request failed",
        description: "Unable to call approval endpoint.",
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
