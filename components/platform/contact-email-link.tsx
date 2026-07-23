"use client"

import type { ReactNode } from "react"
import { usePlatformConfiguration } from "@/components/platform/platform-configuration-provider"
import type { PublicContactEmailType } from "@/types/platform-configuration"

type Props = {
  type: PublicContactEmailType
  fallbackEmail?: string
  className?: string
  children?: ReactNode
}

export function ContactEmailLink({ type, fallbackEmail, className, children }: Props) {
  const { getContactEmail } = usePlatformConfiguration()
  const email = getContactEmail(type)?.value || fallbackEmail || ""

  if (!email) {
    return <span className={className}>{children || "contact support"}</span>
  }

  return (
    <a className={className} href={`mailto:${email}`}>
      {children || email}
    </a>
  )
}
