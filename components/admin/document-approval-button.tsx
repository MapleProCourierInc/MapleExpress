"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type ApprovalEndpoint = "/api/driver/license/approve" | "/api/driver/pow/approve"
type DocumentReviewAction = "APPROVED" | "REJECTED"

type DocumentApprovalButtonProps = {
  endpoint: ApprovalEndpoint
  payload: Record<string, string>
  label: string
}

type DocumentDecisionButtonsProps = {
  endpoint: ApprovalEndpoint
  payload: Record<string, string>
  approveLabel: string
  rejectLabel: string
  subjectLabel: string
}

async function parseResponseMessage(response: Response, fallback: string) {
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => ({}))
    return data?.message || data?.errors?.[0]?.message || fallback
  }

  const text = await response.text().catch(() => "")
  return text || fallback
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
        body: JSON.stringify({ ...payload, action: "APPROVED" satisfies DocumentReviewAction }),
      })

      if (!response.ok) {
        toast({
          title: "Approval failed",
          description: await parseResponseMessage(response, "Unable to approve document."),
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Approved",
        description: await parseResponseMessage(response, "Document approved successfully."),
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

export function DocumentDecisionButtons({
  endpoint,
  payload,
  approveLabel,
  rejectLabel,
  subjectLabel,
}: DocumentDecisionButtonsProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")
  const [reasonError, setReasonError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const submit = async ({
    action,
    payload,
    title,
    failureTitle,
    setLoading,
  }: {
    action: DocumentReviewAction
    payload: Record<string, string>
    title: string
    failureTitle: string
    setLoading: (loading: boolean) => void
  }) => {
    try {
      setLoading(true)
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, action }),
      })

      if (!response.ok) {
        toast({
          title: failureTitle,
          description: await parseResponseMessage(response, "The document decision could not be saved."),
          variant: "destructive",
        })
        return false
      }

      toast({
        title,
        description: await parseResponseMessage(response, "Document decision saved."),
      })
      router.refresh()
      return true
    } catch {
      toast({
        title: failureTitle,
        description: "Unable to call document decision endpoint.",
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const approve = () => {
    void submit({
      action: "APPROVED",
      payload: {
        ...payload,
        reason: payload.reason || "Approved by admin",
      },
      title: "Document approved",
      failureTitle: "Approval failed",
      setLoading: setIsApproving,
    })
  }

  const reject = async () => {
    const trimmedReason = reason.trim()
    if (!trimmedReason) {
      setReasonError("Reason is required")
      return
    }

    setReasonError(null)
    const saved = await submit({
      action: "REJECTED",
      payload: {
        ...payload,
        reason: trimmedReason,
        notes: notes.trim(),
      },
      title: "Document rejected",
      failureTitle: "Rejection failed",
      setLoading: setIsRejecting,
    })

    if (saved) {
      setRejectOpen(false)
      setReason("")
      setNotes("")
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={approve} disabled={isApproving || isRejecting}>
          <CheckCircle2 className="h-4 w-4" />
          {isApproving ? "Submitting..." : approveLabel}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => setRejectOpen(true)}
          disabled={isApproving || isRejecting}
        >
          <XCircle className="h-4 w-4" />
          {rejectLabel}
        </Button>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {subjectLabel}</DialogTitle>
            <DialogDescription>
              Add the reason the admin rejected this document so the decision is auditable.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="document-reject-reason">Reason</Label>
              <Input
                id="document-reject-reason"
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value)
                  if (reasonError) setReasonError(null)
                }}
                placeholder="Required"
              />
              {reasonError ? <p className="text-xs text-destructive">{reasonError}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="document-reject-notes">Notes (optional)</Label>
              <Textarea
                id="document-reject-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Additional context for the driver or audit trail"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={isRejecting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void reject()} disabled={isRejecting}>
              {isRejecting ? "Submitting..." : "Reject document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
