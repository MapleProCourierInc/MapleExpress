"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { LegalDocumentDialog } from "@/components/platform/legal-document-dialog"
import { usePlatformConfiguration } from "@/components/platform/platform-configuration-provider"
import type { PublicLegalDocument, PublicLegalDocumentType } from "@/types/platform-configuration"

type Props = {
  documentType: PublicLegalDocumentType
  children?: ReactNode
  className?: string
}

const DEFAULT_LABELS: Record<PublicLegalDocumentType, string> = {
  TERMS_AND_CONDITIONS: "Terms of Service",
  PRIVACY_POLICY: "Privacy Policy",
  COOKIE_POLICY: "Cookie Policy",
  REFUND_POLICY: "Refund Policy",
}

async function fetchLegalDocument(documentType: PublicLegalDocumentType) {
  const response = await fetch(`/api/platform-configuration/legal-documents/${encodeURIComponent(documentType)}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  })

  if (!response.ok) return null
  return (await response.json()) as PublicLegalDocument
}

export function LegalDocumentLink({ documentType, children, className }: Props) {
  const { getLegalDocument } = usePlatformConfiguration()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [document, setDocument] = useState<PublicLegalDocument | null>(() => getLegalDocument(documentType))
  const configuredDocument = getLegalDocument(documentType)

  useEffect(() => {
    if (configuredDocument) setDocument(configuredDocument)
  }, [configuredDocument])

  const openDocument = async () => {
    const localDocument = getLegalDocument(documentType)
    if (localDocument?.documentUrl) {
      setDocument(localDocument)
      setOpen(true)
      return
    }

    const fetchedDocument = await fetchLegalDocument(documentType)
    if (fetchedDocument?.documentUrl) {
      setDocument(fetchedDocument)
      setOpen(true)
      return
    }

    toast({
      title: "Document unavailable",
      description: `${DEFAULT_LABELS[documentType]} is not configured yet.`,
      variant: "destructive",
    })
  }

  return (
    <>
      <button
        type="button"
        className={cn("inline font-medium text-primary underline-offset-2 hover:underline", className)}
        onClick={openDocument}
      >
        {children || DEFAULT_LABELS[documentType]}
      </button>
      <LegalDocumentDialog document={document} open={open} onOpenChange={setOpen} />
    </>
  )
}
