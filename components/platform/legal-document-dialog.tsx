"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import type { PublicLegalDocument } from "@/types/platform-configuration"

type Props = {
  document: PublicLegalDocument | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

function pdfPreviewUrl(value: string) {
  const [urlWithoutHash] = value.split("#")
  return `${urlWithoutHash}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`
}

export function LegalDocumentDialog({ document, open, onOpenChange }: Props) {
  const storedDocumentUrl = document?.documentUrl || ""
  const [resolvedDocumentUrl, setResolvedDocumentUrl] = useState("")
  const [isResolving, setIsResolving] = useState(false)
  const title = document?.title || document?.displayName || "Legal Document"
  const previewDocumentUrl = resolvedDocumentUrl ? pdfPreviewUrl(resolvedDocumentUrl) : ""

  useEffect(() => {
    if (!open || !storedDocumentUrl) {
      setResolvedDocumentUrl("")
      setIsResolving(false)
      return
    }

    if (isHttpUrl(storedDocumentUrl)) {
      setResolvedDocumentUrl(storedDocumentUrl)
      setIsResolving(false)
      return
    }

    let cancelled = false
    setIsResolving(true)
    fetch(`/api/platform-configuration/legal-documents/view?key=${encodeURIComponent(storedDocumentUrl)}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { presignedGetUrl?: string } | null) => {
        if (!cancelled) setResolvedDocumentUrl(payload?.presignedGetUrl || "")
      })
      .catch(() => {
        if (!cancelled) setResolvedDocumentUrl("")
      })
      .finally(() => {
        if (!cancelled) setIsResolving(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, storedDocumentUrl])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="min-h-0 flex-1 bg-background">
          {isResolving ? (
            <div className="flex h-[72vh] items-center justify-center px-6 text-center text-sm text-muted-foreground">
              Preparing document preview...
            </div>
          ) : previewDocumentUrl ? (
            <iframe
              title={title}
              src={previewDocumentUrl}
              className="h-[78vh] w-full border-0 bg-background"
            />
          ) : (
            <div className="flex h-[72vh] items-center justify-center px-6 text-center text-sm text-muted-foreground">
              This document is not currently available.
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 border-t px-6 py-4 sm:space-x-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {resolvedDocumentUrl ? (
            <Button asChild>
              <a href={resolvedDocumentUrl} target="_blank" rel="noreferrer" download>
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
