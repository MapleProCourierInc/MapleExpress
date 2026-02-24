"use client"

import { useState } from "react"
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

type DriverActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  actionLabel: string
  destructive?: boolean
  loading?: boolean
  onConfirm: (reason: string, notes: string) => Promise<void>
}

export function DriverActionDialog({
  open,
  onOpenChange,
  actionLabel,
  destructive,
  loading,
  onConfirm,
}: DriverActionDialogProps) {
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")
  const [reasonError, setReasonError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setReasonError("Reason is required")
      return
    }

    setReasonError(null)
    await onConfirm(reason.trim(), notes.trim())
    setReason("")
    setNotes("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionLabel} driver</DialogTitle>
          <DialogDescription>
            {destructive
              ? "This is a sensitive action. Please provide an audit reason before continuing."
              : "Provide a reason to keep action history clear and auditable."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="action-reason">Reason</Label>
            <Input
              id="action-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Required"
            />
            {reasonError ? <p className="text-xs text-destructive">{reasonError}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="action-notes">Notes (optional)</Label>
            <Textarea
              id="action-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional context"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={handleConfirm} disabled={loading}>
            {loading ? "Submitting..." : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
