"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type {
  PublicContactEmail,
  PublicContactEmailType,
  PublicContactPhone,
  PublicContactPhoneType,
  PublicLegalDocument,
  PublicLegalDocumentType,
  PublicPlatformConfiguration,
} from "@/types/platform-configuration"

type PlatformConfigurationContextValue = {
  config: PublicPlatformConfiguration | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  getContactEmail: (type: PublicContactEmailType) => PublicContactEmail | null
  getContactPhone: (type: PublicContactPhoneType) => PublicContactPhone | null
  getLegalDocument: (type: PublicLegalDocumentType) => PublicLegalDocument | null
}

const PlatformConfigurationContext = createContext<PlatformConfigurationContextValue | null>(null)

async function readError(response: Response) {
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null
    return payload?.message || `Request failed with ${response.status}`
  }

  return response.text().then((text) => text || `Request failed with ${response.status}`).catch(() => `Request failed with ${response.status}`)
}

export function PlatformConfigurationProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PublicPlatformConfiguration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfiguration = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/platform-configuration", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      })

      if (!response.ok) {
        setError(await readError(response))
        setConfig(null)
        return
      }

      setConfig((await response.json()) as PublicPlatformConfiguration)
      setError(null)
    } catch {
      setError("Unable to load platform configuration")
      setConfig(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchConfiguration()
  }, [])

  const value = useMemo<PlatformConfigurationContextValue>(() => {
    const emails = new Map((config?.contact?.emails || []).map((email) => [email.type, email]))
    const phones = new Map((config?.contact?.phones || []).map((phone) => [phone.type, phone]))
    const legalDocuments = new Map((config?.legalDocuments || []).map((document) => [document.documentType, document]))

    return {
      config,
      isLoading,
      error,
      refresh: fetchConfiguration,
      getContactEmail: (type) => emails.get(type) || null,
      getContactPhone: (type) => phones.get(type) || null,
      getLegalDocument: (type) => legalDocuments.get(type) || null,
    }
  }, [config, error, isLoading])

  return (
    <PlatformConfigurationContext.Provider value={value}>
      {children}
    </PlatformConfigurationContext.Provider>
  )
}

export function usePlatformConfiguration() {
  const context = useContext(PlatformConfigurationContext)
  if (!context) {
    throw new Error("usePlatformConfiguration must be used inside PlatformConfigurationProvider")
  }
  return context
}
