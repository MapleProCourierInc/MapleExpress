"use client"

import Link from "next/link"
import {
  BriefcaseBusiness,
  CalendarClock,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Music2,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react"
import { LegalDocumentLink } from "@/components/platform/legal-document-link"
import { usePlatformConfiguration } from "@/components/platform/platform-configuration-provider"
import type { PublicSocialMediaPlatform } from "@/types/platform-configuration"
import type { WorkingHoursDayResponse } from "@/types/working-hours"

const SOCIAL_ICONS: Record<PublicSocialMediaPlatform, LucideIcon> = {
  FACEBOOK: Facebook,
  INSTAGRAM: Instagram,
  LINKEDIN: Linkedin,
  X: Twitter,
  YOUTUBE: Youtube,
  TIKTOK: Music2,
  WHATSAPP: MessageCircle,
  INDEED: BriefcaseBusiness,
}

function formatWorkingHoursDate(date: string, index: number) {
  if (index === 0) {
    return `Today, ${new Intl.DateTimeFormat("en-CA", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${date}T12:00:00Z`))}`
  }

  return new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`))
}

function formatWorkingHoursTime(day: WorkingHoursDayResponse, timeZone: string) {
  if (day.closed) return "Closed"
  if (!day.opensAt || !day.closesAt) return "Hours unavailable"

  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    })
    return `${formatter.format(new Date(day.opensAt))} – ${formatter.format(new Date(day.closesAt))}`
  } catch {
    return "Hours unavailable"
  }
}

export function Footer() {
  const { config, isLoading } = usePlatformConfiguration()
  const socialProfiles = [...(config?.socialMediaProfiles || [])]
    .filter((profile) => profile.profileUrl)
    .sort((left, right) => Number(left.displayOrder || 0) - Number(right.displayOrder || 0))
  const indeedProfile = socialProfiles.find((profile) => profile.platform === "INDEED")
  const workingHours = config?.nextSevenDaysWorkingHours
  const workingHoursTimeZone = workingHours?.timeZone || "America/Halifax"

  return (
    <footer className="bg-gradient-to-r from-primary/5 to-secondary/5 py-12">
      <div className="container">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="md:col-span-2 lg:col-span-3">
            <div className="flex items-center gap-2 mb-4">
              <img src="/leaf.svg" alt="MapleXpress leaf" className="h-9 w-9" />
              <span className="text-xl font-bold">MapleXpress</span>
            </div>
            <p className="text-muted-foreground mb-4">
              Same-day courier service for businesses and individuals across Greater Moncton.
            </p>
            {socialProfiles.length ? (
              <div className="flex flex-wrap gap-4">
                {socialProfiles.map((profile) => {
                  const Icon = SOCIAL_ICONS[profile.platform] || MessageCircle
                  return (
                    <a
                      key={profile.platform}
                      href={profile.profileUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="sr-only">{profile.displayName || profile.platform}</span>
                    </a>
                  )
                })}
              </div>
            ) : null}
          </div>
          <div className="lg:col-span-3">
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#services" className="text-muted-foreground hover:text-primary">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/rates" className="text-muted-foreground hover:text-primary">
                  Rates
                </Link>
              </li>
              <li>
                <Link href="/business-solutions" className="text-muted-foreground hover:text-primary">
                  Business Solutions
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-primary">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/#about" className="text-muted-foreground hover:text-primary">
                  About Us
                </Link>
              </li>
              {indeedProfile?.profileUrl ? (
                <li>
                  <a href={indeedProfile.profileUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                    Careers
                  </a>
                </li>
              ) : null}
              <li>
                <Link href="/track" className="text-muted-foreground hover:text-primary">
                  Track Package
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="text-muted-foreground hover:text-primary">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-2">
            <h3 className="font-bold text-lg mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#services" className="text-muted-foreground hover:text-primary">
                  Same-Day Delivery
                </Link>
              </li>
              <li>
                <Link href="/#services" className="text-muted-foreground hover:text-primary">
                  Scheduled Business Delivery
                </Link>
              </li>
              <li>
                <Link href="/#services" className="text-muted-foreground hover:text-primary">
                  On-Demand Courier
                </Link>
              </li>
              <li>
                <Link href="/#services" className="text-muted-foreground hover:text-primary">
                  Last-Mile Delivery
                </Link>
              </li>
              <li>
                <Link href="/#services" className="text-muted-foreground hover:text-primary">
                  Local Pickup
                </Link>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-4">
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="text-lg font-bold">Working Hours</h3>
            </div>
            {workingHours?.days?.length ? (
              <ul className="space-y-2 text-sm">
                {workingHours.days.map((day, index) => (
                  <li key={day.date} className="border-b border-border/60 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium text-foreground">{formatWorkingHoursDate(day.date, index)}</span>
                      <span className={day.closed ? "font-medium text-primary" : "text-muted-foreground"}>
                        {formatWorkingHoursTime(day, workingHoursTimeZone)}
                      </span>
                    </div>
                    {day.specialHours && day.description ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{day.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading current hours…" : "Working hours are currently unavailable."}
              </p>
            )}
          </div>
        </div>
        <div className="border-t border-border mt-12 pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MapleXpress Courier Services. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <LegalDocumentLink documentType="PRIVACY_POLICY" className="font-normal text-muted-foreground hover:underline">
              Privacy Policy
            </LegalDocumentLink>
            <LegalDocumentLink documentType="TERMS_AND_CONDITIONS" className="font-normal text-muted-foreground hover:underline">
              Terms of Service
            </LegalDocumentLink>
            <LegalDocumentLink documentType="COOKIE_POLICY" className="font-normal text-muted-foreground hover:underline">
              Cookie Policy
            </LegalDocumentLink>
          </div>
        </div>
      </div>
    </footer>
  )
}

