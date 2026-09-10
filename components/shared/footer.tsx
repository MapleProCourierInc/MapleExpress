"use client"

import Link from "next/link"
import {
  BriefcaseBusiness,
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
  const monthAndDay = new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`))

  if (index === 0) {
    return `Today · ${monthAndDay}`
  }

  const weekday = new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`))

  return `${weekday} · ${monthAndDay}`
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
    <footer className="relative overflow-hidden border-t border-primary/10 bg-gradient-to-br from-brand-maple-soft/45 via-background to-brand-wine-soft/55">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-maple/10 blur-3xl" aria-hidden="true" />
      <div className="container relative py-10 sm:py-12 lg:py-14">
        <div className="flex flex-col gap-7 border-b border-border/70 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <Link href="/" className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4">
              <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-primary/10 bg-background shadow-sm">
                <img src="/leaf.svg" alt="" className="h-11 w-11 object-contain" />
              </span>
              <span className="text-2xl font-bold tracking-tight text-foreground">MapleXpress</span>
            </Link>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
              Dependable same-day courier service for businesses and individuals across Greater Moncton.
            </p>
          </div>

          {socialProfiles.length ? (
            <div className="sm:text-right">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Connect with us</p>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                {socialProfiles.map((profile) => {
                  const Icon = SOCIAL_ICONS[profile.platform] || MessageCircle
                  return (
                    <a
                      key={profile.platform}
                      href={profile.profileUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background/80 text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:text-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="sr-only">{profile.displayName || profile.platform}</span>
                    </a>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-9 pt-9 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)] xl:gap-14">
          <div className="grid gap-9 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] sm:gap-12">
            <nav aria-label="Footer navigation">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.17em] text-foreground">Quick Links</h3>
              <ul className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
                <li><Link href="/" className="text-muted-foreground transition-colors hover:text-primary">Home</Link></li>
                <li><Link href="/#services" className="text-muted-foreground transition-colors hover:text-primary">Services</Link></li>
                <li><Link href="/rates" className="text-muted-foreground transition-colors hover:text-primary">Rates</Link></li>
                <li><Link href="/business-solutions" className="text-muted-foreground transition-colors hover:text-primary">Business Solutions</Link></li>
                <li><Link href="/faq" className="text-muted-foreground transition-colors hover:text-primary">FAQs</Link></li>
                <li><Link href="/#about" className="text-muted-foreground transition-colors hover:text-primary">About Us</Link></li>
                {indeedProfile?.profileUrl ? (
                  <li><a href={indeedProfile.profileUrl} target="_blank" rel="noreferrer" className="text-muted-foreground transition-colors hover:text-primary">Careers</a></li>
                ) : null}
                <li><Link href="/track" className="text-muted-foreground transition-colors hover:text-primary">Track Package</Link></li>
                <li><Link href="/#contact" className="text-muted-foreground transition-colors hover:text-primary">Contact Us</Link></li>
              </ul>
            </nav>

            <nav aria-label="Courier services">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.17em] text-foreground">Services</h3>
              <ul className="space-y-3 text-sm leading-5">
                <li><Link href="/#services" className="text-muted-foreground transition-colors hover:text-primary">Same-Day Delivery</Link></li>
                <li><Link href="/#services" className="text-muted-foreground transition-colors hover:text-primary">Scheduled Business Delivery</Link></li>
                <li><Link href="/#services" className="text-muted-foreground transition-colors hover:text-primary">On-Demand Courier</Link></li>
                <li><Link href="/#services" className="text-muted-foreground transition-colors hover:text-primary">Last-Mile Delivery</Link></li>
                <li><Link href="/#services" className="text-muted-foreground transition-colors hover:text-primary">Local Pickup</Link></li>
              </ul>
            </nav>
          </div>

          <section
            className="max-w-md border-t border-border/70 pt-8 xl:max-w-none xl:border-l xl:border-t-0 xl:pl-10 xl:pt-0"
            aria-labelledby="footer-working-hours"
          >
            <div className="mb-3">
              <h3 id="footer-working-hours" className="text-xs font-bold uppercase tracking-[0.17em] text-foreground">
                Working Hours
              </h3>
              <p className="mt-1 text-[11px] text-muted-foreground">Next seven days · Atlantic time</p>
            </div>

            {workingHours?.days?.length ? (
              <ul className="divide-y divide-border/55">
                {workingHours.days.map((day, index) => (
                  <li key={day.date} className="py-2 first:pt-1 last:pb-0">
                    <div className="flex items-baseline justify-between gap-3 text-xs">
                      <span className="font-medium text-foreground/75">{formatWorkingHoursDate(day.date, index)}</span>
                      <span className="whitespace-nowrap text-muted-foreground">
                        {formatWorkingHoursTime(day, workingHoursTimeZone)}
                      </span>
                    </div>
                    {day.specialHours && day.description ? (
                      <p className="mt-0.5 truncate text-[10px] leading-4 text-muted-foreground/80" title={day.description}>{day.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-3 text-xs text-muted-foreground">
                {isLoading ? "Loading current hours…" : "Working hours are currently unavailable."}
              </p>
            )}
          </section>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} MapleXpress Courier Services. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <LegalDocumentLink documentType="PRIVACY_POLICY" className="font-normal text-muted-foreground transition-colors hover:text-primary hover:underline">
              Privacy Policy
            </LegalDocumentLink>
            <LegalDocumentLink documentType="TERMS_AND_CONDITIONS" className="font-normal text-muted-foreground transition-colors hover:text-primary hover:underline">
              Terms of Service
            </LegalDocumentLink>
            <LegalDocumentLink documentType="COOKIE_POLICY" className="font-normal text-muted-foreground transition-colors hover:text-primary hover:underline">
              Cookie Policy
            </LegalDocumentLink>
          </div>
        </div>
      </div>
    </footer>
  )
}

